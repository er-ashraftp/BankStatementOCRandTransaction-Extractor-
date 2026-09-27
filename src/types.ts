export interface StatementInformation {
  bank_name: string;
  account_holder: string;
  account_number: string;
  statement_period_start: string;
  statement_period_end: string;
  currency: string;
}

export interface Transaction {
  id: string;
  transaction_date: string;
  transaction_title: string;
  transaction_description: string;
  amount: string;
  currency: string;
  transaction_type: string;
  notes: string;
  page_number: number | string;
  raw_transaction_text: string;
  
  // Validation & Review status
  is_flagged?: boolean;
  is_duplicate?: boolean;
  duplicate_reason?: string;
  has_warning?: boolean;
  warning_message?: string;
  is_edited?: boolean;
}

export interface ExtractionSummary {
  total_transactions: number;
  total_pages_processed: number;
  transactions_with_missing_data: number;
  possible_duplicates: number;
  completeness_warning?: string;
  notes?: string;
}

export interface ExtractionResult {
  statement_information: StatementInformation;
  transactions: Transaction[];
  extraction_summary: ExtractionSummary;
  model_used?: string;
  processing_time_ms?: number;
}

export type ProcessingStep = 
  | 'idle'
  | 'uploading'
  | 'reading'
  | 'processing_pages'
  | 'extracting'
  | 'validating'
  | 'completed'
  | 'error';
