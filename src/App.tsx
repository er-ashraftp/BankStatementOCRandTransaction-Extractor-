import React, { useState } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { ProcessingStepper } from './components/ProcessingStepper';
import { StatementSummaryCards } from './components/StatementSummaryCards';
import { TransactionTable } from './components/TransactionTable';
import { DocumentViewerModal } from './components/DocumentViewerModal';
import {
  Transaction,
  StatementInformation,
  ExtractionSummary,
  ExtractionResult,
  ProcessingStep,
} from './types';
import { validateTransactions } from './utils/validation';
import { SamplePreset } from './utils/sampleStatements';
import { downloadCsv, downloadJson } from './utils/csv';
import {
  FileText,
  Download,
  FileCode,
  Eye,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  // Selected Document file state
  const [selectedFile, setSelectedFile] = useState<{
    base64: string;
    fileName: string;
    mimeType: string;
    size: number;
    pageCount?: number;
  } | null>(null);

  // Extraction State
  const [processingStep, setProcessingStep] = useState<ProcessingStep>('idle');
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>('Gemini 3.8 Flash');

  // Extracted Data State
  const [statementInfo, setStatementInfo] = useState<StatementInformation | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<ExtractionSummary | null>(null);

  // Filter shortcuts
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Document Viewer Modal State
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerTargetPage, setViewerTargetPage] = useState<number | undefined>(undefined);

  // Reset all state for new upload
  const handleReset = () => {
    setSelectedFile(null);
    setProcessingStep('idle');
    setProcessingError(null);
    setStatementInfo(null);
    setTransactions([]);
    setSummary(null);
    setActiveFilter('all');
  };

  // Perform Gemini OCR Extraction via Backend API
  const handleExtract = async () => {
    if (!selectedFile) return;

    setProcessingError(null);
    setProcessingStep('uploading');

    try {
      // Step 1: Uploading & Reading
      await new Promise((res) => setTimeout(res, 500));
      setProcessingStep('reading');

      // Step 2: Processing pages
      await new Promise((res) => setTimeout(res, 600));
      setProcessingStep('processing_pages');

      // Step 3: Extracting transactions via Gemini
      setProcessingStep('extracting');

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: selectedFile.base64,
          mimeType: selectedFile.mimeType,
          fileName: selectedFile.fileName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ||
            'The document could not be processed. Please verify that the PDF is not password protected and contains a readable bank statement.'
        );
      }

      const data: ExtractionResult = await response.json();

      // Step 4: Validating results
      setProcessingStep('validating');
      await new Promise((res) => setTimeout(res, 500));

      const { validatedTransactions, summary: calculatedSummary } = validateTransactions(
        data.transactions || []
      );

      // Merge backend summary warnings if any
      if (data.extraction_summary?.completeness_warning) {
        calculatedSummary.completeness_warning = data.extraction_summary.completeness_warning;
      }

      setStatementInfo(data.statement_information);
      setTransactions(validatedTransactions);
      setSummary(calculatedSummary);
      if (data.model_used) {
        setModelUsed(data.model_used);
      }

      setProcessingStep('completed');
    } catch (err: any) {
      console.error('Extraction error:', err);
      let userMsg = err?.message || 'The document could not be processed. Please verify that the PDF is not password protected and contains a readable bank statement.';
      try {
        const jsonMatch = userMsg.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed?.error?.message) {
            userMsg = parsed.error.message;
          } else if (parsed?.error) {
            userMsg = parsed.error;
          }
        }
      } catch {
        // keep raw message
      }
      setProcessingError(userMsg);
      setProcessingStep('error');
    }
  };

  // Instant explore sample preset without server call
  const handleLoadPreset = (preset: SamplePreset) => {
    setProcessingError(null);
    setProcessingStep('completed');
    setStatementInfo(preset.presetResult.statement_information);
    const { validatedTransactions, summary: calculatedSummary } = validateTransactions(
      preset.presetResult.transactions
    );
    setTransactions(validatedTransactions);
    setSummary(calculatedSummary);
    setSelectedFile({
      base64: '',
      fileName: `${preset.bank.replace(/\s+/g, '_')}_Statement.pdf`,
      mimeType: 'application/pdf',
      size: 142000,
      pageCount: preset.pages,
    });
  };

  // Transaction row mutations
  const handleUpdateTransaction = (updated: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t))
    );
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleToggleFlag = (id: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_flagged: !t.is_flagged } : t))
    );
  };

  const handleDownloadCsv = () => {
    const bank = statementInfo?.bank_name || 'bank_statement';
    downloadCsv(transactions, `${bank.replace(/\s+/g, '_')}_transactions.csv`);
  };

  const handleDownloadJson = () => {
    const bank = statementInfo?.bank_name || 'bank_statement';
    downloadJson(
      {
        statement_information: statementInfo,
        extraction_summary: summary,
        transactions,
      },
      `${bank.replace(/\s+/g, '_')}_transactions.json`
    );
  };

  const hasExtractedData = transactions.length > 0 && statementInfo !== null;

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <Header
        onReset={handleReset}
        hasData={hasExtractedData || !!selectedFile}
        modelUsed={modelUsed}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Upload Zone (Visible when no data or when idle/uploading) */}
        {!hasExtractedData && (
          <div className="space-y-6">
            <UploadZone
              onFileSelected={(file) => {
                setSelectedFile(file);
                setProcessingError(null);
                setProcessingStep('idle');
              }}
              onExtract={handleExtract}
              onLoadPreset={handleLoadPreset}
              selectedFile={selectedFile}
              onClearFile={() => setSelectedFile(null)}
              isProcessing={
                processingStep !== 'idle' &&
                processingStep !== 'completed' &&
                processingStep !== 'error'
              }
            />
          </div>
        )}

        {/* Progress Stepper */}
        {processingStep !== 'idle' && (
          <ProcessingStepper
            currentStep={processingStep}
            error={processingError}
            totalPages={selectedFile?.pageCount}
            onRetry={handleExtract}
            onCancel={handleReset}
          />
        )}

        {/* Extracted Data View */}
        {hasExtractedData && summary && statementInfo && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Action Bar Above Results */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Extracted Statement Transactions
                  </h2>
                  <p className="text-xs text-slate-500">
                    {transactions.length} total line items verified &bull; Ready for review and CSV export
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
                {selectedFile?.base64 && (
                  <button
                    onClick={() => {
                      setViewerTargetPage(1);
                      setIsViewerOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:scale-95 transition"
                  >
                    <Eye className="h-4 w-4 text-blue-600" />
                    <span>View Statement</span>
                  </button>
                )}

                <button
                  onClick={handleDownloadJson}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:scale-95 transition"
                >
                  <FileCode className="h-4 w-4 text-slate-500" />
                  <span>Export JSON</span>
                </button>

                <button
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition"
                >
                  <Download className="h-4 w-4" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* Statement Summary Cards */}
            <StatementSummaryCards
              info={statementInfo}
              summary={summary}
              modelUsed={modelUsed}
              onFilterWarnings={() => setActiveFilter('warnings')}
              onFilterDuplicates={() => setActiveFilter('duplicates')}
            />

            {/* Structured Transaction Table */}
            <TransactionTable
              transactions={transactions}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onAddTransaction={handleAddTransaction}
              onToggleFlag={handleToggleFlag}
              bankName={statementInfo.bank_name}
              currency={statementInfo.currency}
              totalPages={summary.total_pages_processed}
              initialFilter={activeFilter}
            />
          </div>
        )}
      </main>

      {/* Document Viewer Modal for Page-Level Traceability */}
      <DocumentViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        fileData={selectedFile}
        targetPage={viewerTargetPage}
      />

      {/* Footer & Privacy Compliance */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Sensitive Financial Data Privacy: Documents are processed ephemerally and never logged or stored.</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Powered by Google AI Studio &bull; Gemini 3.8 Flash Multimodal OCR
          </div>
        </div>
      </footer>
    </div>
  );
}
