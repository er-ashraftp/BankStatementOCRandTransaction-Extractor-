import React, { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import { Transaction } from '../types';
import { isValidDate, isValidAmount } from '../utils/validation';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Transaction) => void;
}

const TRANSACTION_TYPES = [
  'Credit',
  'Debit',
  'Transfer',
  'Withdrawal',
  'Deposit',
  'Payment',
  'Fee',
  'Refund',
  'Salary',
  'Interest',
  'Card Transaction',
  'Other',
];

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen || !transaction) return null;

  const [date, setDate] = useState(transaction.transaction_date || '');
  const [title, setTitle] = useState(transaction.transaction_title || '');
  const [description, setDescription] = useState(transaction.transaction_description || '');
  const [amount, setAmount] = useState(transaction.amount || '');
  const [currency, setCurrency] = useState(transaction.currency || 'USD');
  const [type, setType] = useState(transaction.transaction_type || 'Debit');
  const [notes, setNotes] = useState(transaction.notes || '');
  const [pageNumber, setPageNumber] = useState(String(transaction.page_number || '1'));
  const [rawText, setRawText] = useState(transaction.raw_transaction_text || '');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Transaction description cannot be empty.');
      return;
    }

    if (!isValidAmount(amount)) {
      setError('Please enter a valid numeric amount (e.g. -45.50 or 1200.00).');
      return;
    }

    onSave({
      ...transaction,
      transaction_date: date.trim() || 'Unknown',
      transaction_title: title.trim(),
      transaction_description: description.trim(),
      amount: amount.trim(),
      currency: currency.trim() || 'USD',
      transaction_type: type,
      notes: notes.trim(),
      page_number: pageNumber.trim() || '1',
      raw_transaction_text: rawText.trim(),
      is_edited: true,
      has_warning: false,
      warning_message: undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Edit Transaction Row
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Date (YYYY-MM-DD)
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="2026-01-15"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (Signed Number)
              </label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="-124.50 or 3850.00"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Currency
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="USD"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Transaction Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {TRANSACTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Page Number
              </label>
              <input
                type="text"
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
                placeholder="1"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. POS Purchase, Salary Credit, Utility Payment"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Complete Transaction Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Full description as shown in bank statement"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes &amp; Reference (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Cheque #, reference code, terminal ID..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Raw Transaction Text (Traceability)
            </label>
            <input
              type="text"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Original line text from statement"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px] bg-slate-50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95"
            >
              <Check className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
