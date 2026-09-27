import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
  Plus,
  Trash2,
  Edit3,
  Flag,
  AlertTriangle,
  Copy,
  FileSpreadsheet,
  FileCode,
  Layers,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';
import { Transaction } from '../types';
import { downloadCsv, downloadJson } from '../utils/csv';
import { EditTransactionModal } from './EditTransactionModal';
import { AddTransactionModal } from './AddTransactionModal';
import { RawTextModal } from './RawTextModal';
import { parseNumericAmount } from '../utils/validation';

interface TransactionTableProps {
  transactions: Transaction[];
  onUpdateTransaction: (updated: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddTransaction: (newTx: Transaction) => void;
  onToggleFlag: (id: string) => void;
  bankName?: string;
  currency?: string;
  totalPages?: number;
  initialFilter?: string;
}

type SortField = 'date' | 'amount' | 'page' | 'default';
type SortOrder = 'asc' | 'desc';

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onAddTransaction,
  onToggleFlag,
  bankName,
  currency = 'USD',
  totalPages = 1,
  initialFilter = 'all',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [pageFilter, setPageFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [sortField, setSortField] = useState<SortField>('default');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // Modals state
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [inspectingRawTx, setInspectingRawTx] = useState<Transaction | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Derived filter options
  const uniqueTypes = useMemo(() => {
    const types = new Set(transactions.map((t) => t.transaction_type || 'Other').filter(Boolean));
    return Array.from(types).sort();
  }, [transactions]);

  const uniquePages = useMemo(() => {
    const pages = new Set(transactions.map((t) => String(t.page_number || '1')));
    return Array.from(pages).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [transactions]);

  // Filtering and Sorting
  const filteredAndSorted = useMemo(() => {
    let list = [...transactions];

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (t) =>
          t.transaction_description.toLowerCase().includes(q) ||
          t.transaction_title.toLowerCase().includes(q) ||
          t.transaction_date.toLowerCase().includes(q) ||
          t.amount.toLowerCase().includes(q) ||
          t.notes.toLowerCase().includes(q) ||
          t.raw_transaction_text.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== 'ALL') {
      list = list.filter((t) => (t.transaction_type || 'Other') === typeFilter);
    }

    // Page filter
    if (pageFilter !== 'ALL') {
      list = list.filter((t) => String(t.page_number) === pageFilter);
    }

    // Status filter
    if (statusFilter === 'warnings') {
      list = list.filter((t) => t.has_warning);
    } else if (statusFilter === 'duplicates') {
      list = list.filter((t) => t.is_duplicate);
    } else if (statusFilter === 'flagged') {
      list = list.filter((t) => t.is_flagged);
    } else if (statusFilter === 'edited') {
      list = list.filter((t) => t.is_edited);
    }

    // Sorting
    if (sortField === 'date') {
      list.sort((a, b) => {
        const cmp = (a.transaction_date || '').localeCompare(b.transaction_date || '');
        return sortOrder === 'asc' ? cmp : -cmp;
      });
    } else if (sortField === 'amount') {
      list.sort((a, b) => {
        const valA = parseNumericAmount(a.amount);
        const valB = parseNumericAmount(b.amount);
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
    } else if (sortField === 'page') {
      list.sort((a, b) => {
        const pageA = parseInt(String(a.page_number || '1'), 10);
        const pageB = parseInt(String(b.page_number || '1'), 10);
        return sortOrder === 'asc' ? pageA - pageB : pageB - pageA;
      });
    }

    return list;
  }, [transactions, searchTerm, typeFilter, pageFilter, statusFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortField('default');
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getTypeBadgeColor = (typeStr: string) => {
    const t = (typeStr || '').toLowerCase();
    if (t.includes('credit') || t.includes('deposit') || t.includes('salary') || t.includes('refund')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (t.includes('debit') || t.includes('withdrawal') || t.includes('pos')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (t.includes('fee')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (t.includes('transfer')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (t.includes('payment') || t.includes('card')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (t.includes('interest')) {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const handleDownloadCsv = () => {
    const safeName = (bankName || 'bank_statement')
      .replace(/[^a-z0-9_-]/gi, '_')
      .toLowerCase();
    downloadCsv(transactions, `${safeName}_extracted_transactions.csv`);
  };

  const handleDownloadJson = () => {
    const safeName = (bankName || 'bank_statement')
      .replace(/[^a-z0-9_-]/gi, '_')
      .toLowerCase();
    downloadJson(
      {
        extracted_at: new Date().toISOString(),
        bank_name: bankName,
        total_transactions: transactions.length,
        transactions,
      },
      `${safeName}_extracted_transactions.json`
    );
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Controls & Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search descriptions, amounts, dates, notes..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 hover:bg-white focus:bg-white transition"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:scale-95 transition"
            >
              <Plus className="h-4 w-4 text-blue-600" />
              <span>Add Missing Row</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:scale-95 transition"
              title="Download structured JSON"
            >
              <FileCode className="h-4 w-4 text-slate-500" />
              <span>JSON</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition"
              title="Download RFC 4180 CSV matching exact required schema"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-500 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Filter:
            </span>

            {/* Type selector */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">All Types ({transactions.length})</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>

            {/* Page selector */}
            {uniquePages.length > 1 && (
              <select
                value={pageFilter}
                onChange={(e) => setPageFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Pages</option>
                {uniquePages.map((pg) => (
                  <option key={pg} value={pg}>
                    Page {pg}
                  </option>
                ))}
              </select>
            )}

            {/* Review status buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('warnings')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                  statusFilter === 'warnings'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Warnings
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('duplicates')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                  statusFilter === 'duplicates'
                    ? 'bg-white text-rose-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Duplicates
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter('flagged')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                  statusFilter === 'flagged'
                    ? 'bg-white text-indigo-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Flagged
              </button>
            </div>
          </div>

          <div className="text-slate-500 font-medium text-[11px]">
            Showing <strong className="text-slate-900">{filteredAndSorted.length}</strong> of{' '}
            <strong className="text-slate-900">{transactions.length}</strong> transactions
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto min-h-[380px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-3 w-10 text-center">#</th>
              <th className="py-3 px-3 w-16 text-center">
                <button
                  onClick={() => handleSort('page')}
                  className="inline-flex items-center gap-1 hover:text-blue-600 font-bold"
                >
                  Page
                  {sortField === 'page' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3 w-28">
                <button
                  onClick={() => handleSort('date')}
                  className="inline-flex items-center gap-1 hover:text-blue-600 font-bold"
                >
                  Date
                  {sortField === 'date' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3 min-w-[260px]">Transaction Title &amp; Description</th>
              <th className="py-3 px-3 w-32 text-right">
                <button
                  onClick={() => handleSort('amount')}
                  className="inline-flex items-center gap-1 hover:text-blue-600 font-bold ml-auto"
                >
                  Amount
                  {sortField === 'amount' ? (
                    sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                  ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                  )}
                </button>
              </th>
              <th className="py-3 px-3 w-28">Type</th>
              <th className="py-3 px-3 min-w-[140px]">Notes / Ref</th>
              <th className="py-3 px-3 w-28 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Info className="h-6 w-6 text-slate-300" />
                    <p className="text-xs font-semibold text-slate-600">No transactions match your current search or filter</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setTypeFilter('ALL');
                        setPageFilter('ALL');
                        setStatusFilter('all');
                      }}
                      className="text-xs text-blue-600 underline font-medium"
                    >
                      Clear all filters
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((t, index) => {
                const numeric = parseNumericAmount(t.amount);
                const isNegative = numeric < 0 || t.amount.startsWith('-');

                return (
                  <tr
                    key={t.id || index}
                    className={`group hover:bg-blue-50/40 transition-colors ${
                      t.is_flagged
                        ? 'bg-amber-50/30'
                        : t.is_duplicate
                        ? 'bg-rose-50/20'
                        : t.has_warning
                        ? 'bg-amber-50/20'
                        : ''
                    }`}
                  >
                    {/* Index & Flag status */}
                    <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onToggleFlag(t.id)}
                          className={`p-0.5 rounded transition ${
                            t.is_flagged ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
                          }`}
                          title={t.is_flagged ? 'Unflag transaction' : 'Flag transaction for review'}
                        >
                          <Flag className={`h-3.5 w-3.5 ${t.is_flagged ? 'fill-amber-500' : ''}`} />
                        </button>
                        <span>{index + 1}</span>
                      </div>
                    </td>

                    {/* Page Number with Traceability tooltip */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className="inline-flex items-center justify-center h-5 w-7 rounded bg-slate-100 text-slate-700 font-mono font-semibold text-[10px]"
                        title={`Extracted from Page ${t.page_number} of the document`}
                      >
                        P{t.page_number || '1'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-3 font-mono font-medium text-slate-800 whitespace-nowrap">
                      {t.transaction_date || 'Unknown'}
                    </td>

                    {/* Description & Title */}
                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        {t.transaction_title && (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 text-xs">
                              {t.transaction_title}
                            </span>
                            {t.is_edited && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                                Edited
                              </span>
                            )}
                          </div>
                        )}
                        <div
                          className="text-slate-700 text-xs leading-relaxed font-sans"
                          dir="auto"
                          title={t.transaction_description}
                        >
                          {t.transaction_description}
                        </div>

                        {/* Duplicates or Warnings Badges */}
                        {(t.is_duplicate || t.has_warning) && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            {t.is_duplicate && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200"
                                title={t.duplicate_reason || 'Possible duplicate transaction'}
                              >
                                <AlertTriangle className="h-3 w-3 text-rose-500" />
                                Possible Duplicate
                              </span>
                            )}
                            {t.has_warning && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
                                title={t.warning_message}
                              >
                                <AlertTriangle className="h-3 w-3 text-amber-500" />
                                {t.warning_message || 'Missing details'}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 text-right font-mono font-bold whitespace-nowrap">
                      <span
                        className={`text-xs ${
                          isNegative ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {isNegative ? t.amount : `+${t.amount}`} {t.currency || currency}
                      </span>
                    </td>

                    {/* Transaction Type */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getTypeBadgeColor(
                          t.transaction_type
                        )}`}
                      >
                        {t.transaction_type || 'Other'}
                      </span>
                    </td>

                    {/* Notes & Ref */}
                    <td className="py-3 px-3 text-slate-500 text-[11px] max-w-[200px] truncate" title={t.notes}>
                      {t.notes || <span className="text-slate-300">-</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setInspectingRawTx(t)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="View Raw OCR Text for this row"
                        >
                          <FileSpreadsheet className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingTx(t)}
                          className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Edit transaction row"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => onDeleteTransaction(t.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete transaction"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <EditTransactionModal
        transaction={editingTx}
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
        onSave={onUpdateTransaction}
      />

      {/* Add Missing Row Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={onAddTransaction}
        defaultCurrency={currency}
        totalPages={totalPages}
      />

      {/* Raw OCR Text Modal */}
      <RawTextModal
        transaction={inspectingRawTx}
        isOpen={!!inspectingRawTx}
        onClose={() => setInspectingRawTx(null)}
      />
    </div>
  );
};
