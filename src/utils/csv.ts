import { Transaction } from '../types';

/**
 * Escapes a single CSV cell value according to RFC 4180
 */
export function escapeCsvCell(value: string | number | undefined | null): string {
  if (value === undefined || value === null) {
    return '';
  }
  const str = String(value);
  // If string contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates the CSV string with exact columns requested:
 * Transaction Date,Transaction Title,Transaction Description,Amount,Currency,Transaction Type,Notes,Page Number,Raw Transaction Text
 */
export function generateCsv(transactions: Transaction[]): string {
  const headers = [
    'Transaction Date',
    'Transaction Title',
    'Transaction Description',
    'Amount',
    'Currency',
    'Transaction Type',
    'Notes',
    'Page Number',
    'Raw Transaction Text'
  ];

  const rows = transactions.map((t) => [
    escapeCsvCell(t.transaction_date),
    escapeCsvCell(t.transaction_title),
    escapeCsvCell(t.transaction_description),
    escapeCsvCell(t.amount),
    escapeCsvCell(t.currency),
    escapeCsvCell(t.transaction_type),
    escapeCsvCell(t.notes),
    escapeCsvCell(t.page_number),
    escapeCsvCell(t.raw_transaction_text),
  ].join(','));

  // Prepend UTF-8 BOM (\uFEFF) so Excel on Windows/Mac correctly opens non-ASCII and Arabic characters
  return '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
}

/**
 * Triggers a browser download of the CSV file
 */
export function downloadCsv(transactions: Transaction[], filename = 'extracted_transactions.csv'): void {
  const csvContent = generateCsv(transactions);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers a browser download of JSON data
 */
export function downloadJson(data: unknown, filename = 'statement_extraction.json'): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
