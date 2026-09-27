import React from 'react';
import { ShieldCheck, RefreshCw, Sparkles, FileSpreadsheet } from 'lucide-react';

interface HeaderProps {
  onReset: () => void;
  hasData: boolean;
  modelUsed?: string;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasData, modelUsed }) => {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                Bank Statement OCR &amp; Transaction Extractor
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                <Sparkles className="h-3 w-3 text-blue-600" />
                {modelUsed || 'Gemini 3.8 Flash'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Upload a bank statement and extract all transactions into CSV
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Zero-Retention &bull; Privacy Protected</span>
          </div>

          {hasData && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition"
              title="Upload new document"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
              <span>New Document</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
