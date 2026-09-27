import { Transaction, ExtractionSummary } from '../types';

/**
 * Validates a date string: checks if it matches YYYY-MM-DD and is a real calendar date
 */
export function isValidDate(dateStr: string): boolean {
  if (!dateStr || dateStr.toLowerCase() === 'unknown') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  if (month < 0 || month > 11) return false;
  const date = new Date(year, month, day);
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day;
}

/**
 * Validates whether an amount string is a parseable signed or unsigned number
 */
export function isValidAmount(amountStr: string): boolean {
  if (!amountStr || amountStr.trim() === '') return false;
  // Clean optional commas or currency symbols
  const cleaned = amountStr.replace(/[^0-9.-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return false;
  return !isNaN(parseFloat(cleaned));
}

/**
 * Parses numeric amount to float
 */
export function parseNumericAmount(amountStr: string): number {
  if (!amountStr) return 0;
  const cleaned = amountStr.replace(/[^0-9.-]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

/**
 * Runs comprehensive client-side validation and duplicate detection
 */
export function validateTransactions(
  transactions: Transaction[]
): {
  validatedTransactions: Transaction[];
  summary: ExtractionSummary;
} {
  let missingDataCount = 0;
  let possibleDuplicatesCount = 0;

  // Track occurrences for duplicate detection: key based on Date + Amount + normalized Description
  const seenKeys = new Map<string, number[]>();

  const validatedTransactions: Transaction[] = transactions.map((t, index) => {
    let hasWarning = false;
    const warnings: string[] = [];

    // Date check
    if (!t.transaction_date || t.transaction_date.toLowerCase() === 'unknown') {
      hasWarning = true;
      warnings.push('Unspecified/Unknown transaction date');
    } else if (!isValidDate(t.transaction_date)) {
      hasWarning = true;
      warnings.push(`Non-standard or invalid calendar date (${t.transaction_date})`);
    }

    // Amount check
    if (!t.amount || !isValidAmount(t.amount)) {
      hasWarning = true;
      warnings.push('Invalid or missing numeric amount');
    }

    // Description check
    if (!t.transaction_description || t.transaction_description.trim().length === 0) {
      hasWarning = true;
      warnings.push('Missing transaction description');
    }

    if (hasWarning) {
      missingDataCount++;
    }

    // Duplicate detection key: Date + parsed numeric amount + first 25 normalized chars of description
    const normDesc = (t.transaction_description || '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 25);
    const amountVal = parseNumericAmount(t.amount).toFixed(2);
    const dupKey = `${t.transaction_date}|${amountVal}|${normDesc}`;

    if (!seenKeys.has(dupKey)) {
      seenKeys.set(dupKey, [index]);
    } else {
      seenKeys.get(dupKey)!.push(index);
    }

    return {
      ...t,
      id: t.id || `tx-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
      has_warning: hasWarning,
      warning_message: warnings.join(', '),
    };
  });

  // Second pass: mark duplicate occurrences
  for (const [key, indices] of seenKeys.entries()) {
    if (indices.length > 1) {
      possibleDuplicatesCount += indices.length;
      for (const idx of indices) {
        validatedTransactions[idx].is_duplicate = true;
        validatedTransactions[idx].duplicate_reason = `Matches ${indices.length - 1} other transaction(s) with identical date (${validatedTransactions[idx].transaction_date}) and amount (${validatedTransactions[idx].amount})`;
      }
    }
  }

  // Derive pages processed
  const pageNumbers = new Set(
    validatedTransactions
      .map((t) => parseInt(String(t.page_number), 10))
      .filter((p) => !isNaN(p) && p > 0)
  );

  const summary: ExtractionSummary = {
    total_transactions: validatedTransactions.length,
    total_pages_processed: pageNumbers.size || 1,
    transactions_with_missing_data: missingDataCount,
    possible_duplicates: possibleDuplicatesCount,
    completeness_warning:
      validatedTransactions.length === 0
        ? 'Warning: No transaction rows were identified. Please review the document quality and page contents.'
        : undefined,
  };

  return {
    validatedTransactions,
    summary,
  };
}

/**
 * Masks an account number (e.g. "123456789012" -> "XXXXXX9012")
 */
export function maskAccountNumber(acc: string): string {
  if (!acc || acc.trim() === '') return 'Unknown';
  const clean = acc.trim();
  if (clean.length <= 4) return clean;
  const visible = clean.slice(-4);
  const maskedLength = Math.min(clean.length - 4, 8);
  return 'X'.repeat(maskedLength) + visible;
}
