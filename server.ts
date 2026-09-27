import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { PDFDocument } from 'pdf-lib';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const app = express();

// Increase JSON and URL-encoded payload limit for multi-page documents & high-res images
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Initialize GoogleGenAI client with required telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Priority list of Gemini Flash models for document understanding & OCR
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isTransientError(err: any): boolean {
  const str = String(err?.message || err || '');
  return (
    str.includes('503') ||
    str.includes('UNAVAILABLE') ||
    str.includes('high demand') ||
    str.includes('429') ||
    str.includes('RESOURCE_EXHAUSTED') ||
    str.includes('quota') ||
    str.includes('temporarily')
  );
}

function cleanErrorMessage(rawError: any): string {
  if (!rawError) {
    return 'The document could not be processed. Please verify that the file contains a readable bank statement.';
  }

  const rawStr = typeof rawError === 'string' ? rawError : rawError.message || String(rawError);

  try {
    const jsonMatch = rawStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.error && parsed.error.message) {
        if (
          parsed.error.code === 503 ||
          parsed.error.status === 'UNAVAILABLE' ||
          parsed.error.message.includes('high demand')
        ) {
          return 'Gemini is currently experiencing high demand. Spikes in demand are usually temporary. Please click "Retry Extraction" to try again.';
        }
        if (parsed.error.code === 429 || parsed.error.status === 'RESOURCE_EXHAUSTED') {
          return 'Rate limit reached temporarily. Please wait a few seconds and click "Retry Extraction".';
        }
        return parsed.error.message;
      }
    }
  } catch {
    // not JSON
  }

  if (rawStr.includes('503') || rawStr.includes('UNAVAILABLE') || rawStr.includes('high demand')) {
    return 'Gemini is currently experiencing high demand. Spikes in demand are usually temporary. Please click "Retry Extraction" to try again.';
  }

  if (rawStr.includes('429') || rawStr.includes('RESOURCE_EXHAUSTED')) {
    return 'Rate limit reached temporarily. Please wait a few seconds and click "Retry Extraction".';
  }

  return rawStr;
}

const EXTRACTION_SYSTEM_PROMPT = `You are a financial document extraction engine.

Analyze the entire uploaded bank statement, including every page.

Your primary objective is to identify and extract EVERY individual transaction from the document.

Do not summarize the statement.

Do not return only examples.

Do not stop after the first page.

Process every page and every transaction table.

For each transaction, extract:
1. Transaction date: Date shown for the transaction (normalize to YYYY-MM-DD if reliable, or "Unknown").
2. Transaction title: Short transaction title only if identifiable (e.g., ATM Withdrawal, Salary Credit, POS Purchase, Bank Transfer, Utility Payment, Card Payment, Bank Fee, Interest, Refund). Otherwise empty string.
3. Complete transaction description: Combine multi-line descriptions into a single clean line. Preserve Arabic and English text.
4. Amount: Exact transaction amount string. Maintain negative for Debits/Withdrawals/Fees/Payments, and positive for Credits/Deposits/Salary/Refunds. (e.g. "-124.50" or "3850.00").
5. Currency: Currency symbol or code (USD, EUR, QAR, GBP, etc.).
6. Transaction type: Credit, Debit, Transfer, Withdrawal, Deposit, Payment, Fee, Refund, Salary, Interest, Card Transaction, or Other.
7. Notes: Reference number, cheque number, merchant info, or extra remarks.
8. Page number: Source page number where transaction was found (e.g. "1", "2").
9. Raw transaction text: Original exact text of the transaction row.

Preserve the transaction order shown in the statement.

If a transaction description spans multiple lines, combine all lines belonging to that transaction.

Do not treat opening balance, closing balance, totals, subtotals, statement fees shown separately, headers, footers, or page numbers as transactions unless they are explicitly presented as individual transactions.

Do not invent missing information. If a value cannot be reliably determined, return an empty string.

For debit and credit columns, determine the transaction direction from the statement structure. Do not assume that every amount is positive.

Check the entire document for missed transactions before producing the final response.

Return ONLY valid JSON matching the required schema.

After extraction, perform a completeness review and report the total number of extracted transactions and any possible duplicates or uncertain records.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    statement_information: {
      type: Type.OBJECT,
      properties: {
        bank_name: { type: Type.STRING },
        account_holder: { type: Type.STRING },
        account_number: { type: Type.STRING },
        statement_period_start: { type: Type.STRING },
        statement_period_end: { type: Type.STRING },
        currency: { type: Type.STRING },
      },
      required: ['bank_name', 'currency'],
    },
    transactions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          transaction_date: { type: Type.STRING, description: 'Date in YYYY-MM-DD or Unknown' },
          transaction_title: { type: Type.STRING },
          transaction_description: { type: Type.STRING },
          amount: { type: Type.STRING, description: 'Signed numeric amount string' },
          currency: { type: Type.STRING },
          transaction_type: { type: Type.STRING },
          notes: { type: Type.STRING },
          page_number: { type: Type.STRING },
          raw_transaction_text: { type: Type.STRING },
        },
        required: ['transaction_date', 'transaction_description', 'amount'],
      },
    },
    extraction_summary: {
      type: Type.OBJECT,
      properties: {
        total_transactions: { type: Type.INTEGER },
        total_pages_processed: { type: Type.INTEGER },
        transactions_with_missing_data: { type: Type.INTEGER },
        possible_duplicates: { type: Type.INTEGER },
        completeness_warning: { type: Type.STRING },
      },
      required: ['total_transactions', 'total_pages_processed'],
    },
  },
  required: ['statement_information', 'transactions', 'extraction_summary'],
};

/**
 * Executes a Gemini extraction call with fallback across compatible Flash models
 */
async function callGeminiExtraction(
  base64Data: string,
  mimeType: string,
  pageContextHint = ''
): Promise<{ parsed: any; modelUsed: string }> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    // Retry up to 2 attempts per model for transient errors (e.g., 503 high demand or 429)
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const promptText = pageContextHint
          ? `${EXTRACTION_SYSTEM_PROMPT}\n\nNote: ${pageContextHint}`
          : EXTRACTION_SYSTEM_PROMPT;

        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: mimeType,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0.1, // Low temperature for maximum extraction accuracy
          },
        });

        const text = response.text;
        if (!text) {
          throw new Error('Gemini returned an empty response.');
        }

        const parsed = JSON.parse(text);
        return { parsed, modelUsed: model };
      } catch (err: any) {
        console.warn(`Extraction attempt with model ${model} (attempt ${attempt + 1}) failed:`, err?.message || err);
        lastError = err;

        if (isTransientError(err) && attempt === 0) {
          // Wait 1.5s before retrying this model
          await delay(1500);
          continue;
        }
        // Move to next candidate model in the chain
        break;
      }
    }
  }

  throw lastError || new Error('All model extraction attempts failed.');
}

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    availableModels: CANDIDATE_MODELS,
  });
});

// PDF Page count inspection endpoint
app.post('/api/inspect-pdf', async (req: Request, res: Response) => {
  try {
    const { fileData } = req.body;
    if (!fileData) {
      res.status(400).json({ error: 'fileData is required' });
      return;
    }
    const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pageCount = pdfDoc.getPageCount();
    res.json({ pageCount, isEncrypted: pdfDoc.isEncrypted });
  } catch (err: any) {
    res.status(400).json({ error: 'Unable to parse PDF: ' + (err.message || String(err)) });
  }
});

// Main Document Extraction Endpoint
app.post('/api/extract', async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const { fileData, mimeType, fileName } = req.body;

    if (!fileData || !mimeType) {
      res.status(400).json({
        error: 'Missing fileData or mimeType in request payload.',
      });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(500).json({
        error: 'GEMINI_API_KEY is not configured in the server environment. Please configure it in Settings > Secrets.',
      });
      return;
    }

    const cleanBase64 = fileData.replace(/^data:[^;]+;base64,/, '');

    // Check if PDF and whether it is multi-page
    if (mimeType === 'application/pdf') {
      let pageCount = 1;
      let pdfDoc: PDFDocument | null = null;

      try {
        const buffer = Buffer.from(cleanBase64, 'base64');
        pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        pageCount = pdfDoc.getPageCount();
      } catch (pdfErr: any) {
        console.warn('PDF parsing inspection warning:', pdfErr.message);
        // Continue and attempt standard extraction
      }

      // If PDF has more than 6 pages, process in batches to prevent context token overflow and ensure 100% extraction
      if (pdfDoc && pageCount > 6) {
        console.log(`Large PDF detected (${pageCount} pages). Splitting into batches...`);
        const BATCH_SIZE = 4;
        const allTransactions: any[] = [];
        let combinedInfo: any = null;
        let lastModel = CANDIDATE_MODELS[0];
        let totalMissing = 0;
        let totalDuplicates = 0;

        for (let startPage = 0; startPage < pageCount; startPage += BATCH_SIZE) {
          const endPage = Math.min(startPage + BATCH_SIZE, pageCount);
          const subDoc = await PDFDocument.create();
          const pageIndices = Array.from({ length: endPage - startPage }, (_, i) => startPage + i);
          const copiedPages = await subDoc.copyPages(pdfDoc, pageIndices);
          for (const p of copiedPages) {
            subDoc.addPage(p);
          }
          const subPdfBytes = await subDoc.save();
          let binary = '';
          const len = subPdfBytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(subPdfBytes[i]);
          }
          const subBase64 = Buffer.from(subPdfBytes).toString('base64');

          const hint = `Processing pages ${startPage + 1} to ${endPage} of ${pageCount}. For any extracted transactions, record the exact document page number (e.g. ${startPage + 1} to ${endPage}).`;
          const { parsed, modelUsed } = await callGeminiExtraction(subBase64, 'application/pdf', hint);
          lastModel = modelUsed;

          if (!combinedInfo && parsed.statement_information) {
            combinedInfo = parsed.statement_information;
          }

          if (Array.isArray(parsed.transactions)) {
            // Adjust page number if model returned relative page number (1, 2)
            parsed.transactions.forEach((tx: any) => {
              const relPage = parseInt(String(tx.page_number || '1'), 10);
              if (!isNaN(relPage) && relPage <= BATCH_SIZE) {
                tx.page_number = startPage + relPage;
              } else if (!tx.page_number) {
                tx.page_number = startPage + 1;
              }
              allTransactions.push(tx);
            });
          }

          if (parsed.extraction_summary) {
            totalMissing += parsed.extraction_summary.transactions_with_missing_data || 0;
            totalDuplicates += parsed.extraction_summary.possible_duplicates || 0;
          }
        }

        const result = {
          statement_information: combinedInfo || {
            bank_name: 'Identified Bank',
            account_holder: '',
            account_number: '',
            statement_period_start: '',
            statement_period_end: '',
            currency: '',
          },
          transactions: allTransactions,
          extraction_summary: {
            total_transactions: allTransactions.length,
            total_pages_processed: pageCount,
            transactions_with_missing_data: totalMissing,
            possible_duplicates: totalDuplicates,
            completeness_warning: allTransactions.length === 0 ? 'Warning: Some transactions may not have been extracted. Please review the document.' : undefined,
          },
          model_used: lastModel,
          processing_time_ms: Date.now() - startTime,
        };

        res.json(result);
        return;
      }
    }

    // Standard single-pass extraction (for images and PDFs <= 6 pages)
    const { parsed, modelUsed } = await callGeminiExtraction(cleanBase64, mimeType);

    const result = {
      statement_information: parsed.statement_information || {
        bank_name: '',
        account_holder: '',
        account_number: '',
        statement_period_start: '',
        statement_period_end: '',
        currency: '',
      },
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      extraction_summary: parsed.extraction_summary || {
        total_transactions: Array.isArray(parsed.transactions) ? parsed.transactions.length : 0,
        total_pages_processed: 1,
        transactions_with_missing_data: 0,
        possible_duplicates: 0,
      },
      model_used: modelUsed,
      processing_time_ms: Date.now() - startTime,
    };

    res.json(result);
  } catch (error: any) {
    console.error('Server extraction error:', error);
    const errorMessage = cleanErrorMessage(error);
    const isTransient = isTransientError(error);
    res.status(isTransient ? 503 : 500).json({
      error: errorMessage,
      isTransient,
    });
  }
});

// Vite middleware or static serving
if (!isProd) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
