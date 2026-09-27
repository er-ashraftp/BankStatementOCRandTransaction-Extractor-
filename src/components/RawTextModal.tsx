import React, { useState } from 'react';
import { X, Copy, Check, FileText } from 'lucide-react';
import { Transaction } from '../types';

interface RawTextModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RawTextModal: React.FC<RawTextModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !transaction) return null;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(transaction.raw_transaction_text || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Raw OCR Traceability
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Source Statement Page: {transaction.page_number}
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-600 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Raw Text'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs leading-relaxed break-all border border-slate-800">
            {transaction.raw_transaction_text || 'No raw OCR text available.'}
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Parsed Date:</span>
              <span className="font-mono">{transaction.transaction_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Parsed Amount:</span>
              <span className="font-mono font-bold">{transaction.amount} {transaction.currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Transaction Type:</span>
              <span>{transaction.transaction_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Cleaned Description:</span>
              <span className="text-right max-w-xs truncate">{transaction.transaction_description}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
