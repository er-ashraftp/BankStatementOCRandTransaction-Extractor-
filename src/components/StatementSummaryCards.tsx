import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  CreditCard,
  Coins,
  FileCheck,
  AlertTriangle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
} from 'lucide-react';
import { StatementInformation, ExtractionSummary } from '../types';
import { maskAccountNumber } from '../utils/validation';

interface StatementSummaryCardsProps {
  info: StatementInformation;
  summary: ExtractionSummary;
  modelUsed?: string;
  onFilterWarnings?: () => void;
  onFilterDuplicates?: () => void;
}

export const StatementSummaryCards: React.FC<StatementSummaryCardsProps> = ({
  info,
  summary,
  modelUsed,
  onFilterWarnings,
  onFilterDuplicates,
}) => {
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const masked = maskAccountNumber(info.account_number);
  const displayAccount = showFullAccount ? info.account_number || 'Unknown' : masked;

  return (
    <div className="w-full space-y-4">
      {/* Warning Banners if any issues detected */}
      {summary.completeness_warning && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold">Warning: </span>
            {summary.completeness_warning}
          </div>
        </div>
      )}

      {/* Grid of Key Metadata Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Bank Name */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Bank
            </span>
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="font-bold text-slate-900 text-sm truncate" title={info.bank_name || 'Unknown Bank'}>
            {info.bank_name || 'Unknown Bank'}
          </div>
          <div className="text-[10px] text-slate-400 truncate mt-0.5">
            {info.account_holder || 'Account Statement'}
          </div>
        </div>

        {/* Statement Period */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Period
            </span>
            <Calendar className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
            {info.statement_period_start || info.statement_period_end
              ? `${info.statement_period_start || 'Start'} to ${info.statement_period_end || 'End'}`
              : 'Unspecified Period'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Monthly Cycle</div>
        </div>

        {/* Account Number (Masked) */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Account
            </span>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-900 text-xs sm:text-sm">
            <span className="truncate">{displayAccount}</span>
            {info.account_number && (
              <button
                type="button"
                onClick={() => setShowFullAccount(!showFullAccount)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition"
                title={showFullAccount ? 'Mask account number' : 'Reveal account number'}
              >
                {showFullAccount ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Masked by default</div>
        </div>

        {/* Currency & Pages */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Currency
            </span>
            <Coins className="h-4 w-4 text-amber-600" />
          </div>
          <div className="font-bold text-slate-900 text-sm">
            {info.currency || 'USD'}
          </div>
          <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
            <Layers className="h-3 w-3" />
            {summary.total_pages_processed} {summary.total_pages_processed === 1 ? 'Page' : 'Pages'}
          </div>
        </div>

        {/* Total Transactions Extracted */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Extracted
            </span>
            <FileCheck className="h-4 w-4 text-blue-600" />
          </div>
          <div className="font-extrabold text-blue-950 text-xl font-mono">
            {summary.total_transactions}
          </div>
          <div className="text-[10px] text-blue-700 font-medium mt-0.5">100% individual items</div>
        </div>

        {/* Warnings / Duplicates Alert */}
        <div
          className={`p-3.5 rounded-xl border shadow-xs flex flex-col justify-between ${
            summary.transactions_with_missing_data > 0 || summary.possible_duplicates > 0
              ? 'bg-amber-50/80 border-amber-200/80'
              : 'bg-emerald-50/60 border-emerald-200/80'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-[11px] font-bold uppercase tracking-wider ${
                summary.transactions_with_missing_data > 0 || summary.possible_duplicates > 0
                  ? 'text-amber-800'
                  : 'text-emerald-800'
              }`}
            >
              Integrity
            </span>
            {summary.transactions_with_missing_data > 0 || summary.possible_duplicates > 0 ? (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            ) : (
              <Sparkles className="h-4 w-4 text-emerald-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {summary.transactions_with_missing_data > 0 ? (
              <button
                type="button"
                onClick={onFilterWarnings}
                className="text-xs font-bold text-amber-900 underline hover:text-amber-700 text-left"
                title="Filter rows with warnings"
              >
                {summary.transactions_with_missing_data} Warnings
              </button>
            ) : summary.possible_duplicates > 0 ? (
              <button
                type="button"
                onClick={onFilterDuplicates}
                className="text-xs font-bold text-amber-900 underline hover:text-amber-700 text-left"
                title="Filter possible duplicates"
              >
                {summary.possible_duplicates} Duplicates
              </button>
            ) : (
              <div className="font-bold text-emerald-900 text-xs">All Validated</div>
            )}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {summary.possible_duplicates > 0
              ? `${summary.possible_duplicates} flagged duplicates`
              : 'Zero missing fields'}
          </div>
        </div>
      </div>
    </div>
  );
};
