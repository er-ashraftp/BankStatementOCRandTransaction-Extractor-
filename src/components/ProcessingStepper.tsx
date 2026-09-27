import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  FileText,
  Cpu,
  Database,
  CheckSquare,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  UploadCloud,
} from 'lucide-react';
import { ProcessingStep } from '../types';

interface ProcessingStepperProps {
  currentStep: ProcessingStep;
  error?: string | null;
  totalPages?: number;
  onRetry?: () => void;
  onCancel?: () => void;
}

const STEPS = [
  { id: 'uploading', label: 'Uploading document', desc: 'Securely transferring statement', icon: FileText },
  { id: 'reading', label: 'Reading document', desc: 'Analyzing layout, tables & pages', icon: Cpu },
  { id: 'processing_pages', label: 'Processing pages', desc: 'Scanning multi-page headers & rows', icon: Database },
  { id: 'extracting', label: 'Extracting transactions', desc: 'Gemini OCR identifying line items', icon: Sparkles },
  { id: 'validating', label: 'Validating results', desc: 'Checking dates, amounts & duplicates', icon: CheckSquare },
  { id: 'completed', label: 'Preparing CSV', desc: 'Ready for table review & export', icon: CheckCircle2 },
];

export const ProcessingStepper: React.FC<ProcessingStepperProps> = ({
  currentStep,
  error,
  totalPages,
  onRetry,
  onCancel,
}) => {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (currentStep === 'idle' || currentStep === 'completed' || currentStep === 'error') {
      return;
    }
    const timer = setInterval(() => {
      setElapsedSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [currentStep]);

  if (currentStep === 'idle') return null;

  const currentIdx = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className="w-full max-w-4xl mx-auto my-8 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-lg shadow-slate-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            {currentStep === 'completed' ? (
              <span className="text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-5 w-5" />
                Extraction Complete
              </span>
            ) : currentStep === 'error' ? (
              <span className="text-rose-600">Extraction Interrupted</span>
            ) : (
              <span className="text-blue-700 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                Processing Statement with Gemini 3.8 Flash...
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalPages ? `Processing ${totalPages} page(s) with full multi-line OCR` : 'Preserving exact amounts, dates, and line item details'}
          </p>
        </div>

        {currentStep !== 'completed' && currentStep !== 'error' && (
          <div className="text-xs font-mono font-medium text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 flex items-center gap-1.5 self-start sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Elapsed: {elapsedSec}s
          </div>
        )}
      </div>

      {error ? (
        <div className="mt-5 p-5 rounded-xl bg-amber-50/90 border border-amber-300/80 text-slate-800 text-xs sm:text-sm shadow-xs">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5 text-amber-700" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="font-bold text-amber-950 text-sm">Extraction Notice</p>
              <p className="text-amber-900 leading-relaxed">{error}</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-amber-200 flex flex-wrap items-center gap-3">
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Retry Extraction Now</span>
              </button>
            )}

            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:scale-95 transition"
              >
                <UploadCloud className="h-3.5 w-3.5 text-slate-500" />
                <span>Choose Another Document</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-6 gap-3">
          {STEPS.map((step, idx) => {
            const isDone = currentIdx > idx || currentStep === 'completed';
            const isCurrent = currentStep === step.id;
            const StepIcon = step.icon;

            return (
              <div
                key={step.id}
                className={`relative flex flex-col p-3 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                    : isCurrent
                    ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-sm'
                    : 'bg-slate-50/50 border-slate-100 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : isCurrent ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <StepIcon
                    className={`h-4 w-4 ${
                      isDone ? 'text-emerald-600' : isCurrent ? 'text-blue-600' : 'text-slate-300'
                    }`}
                  />
                </div>
                <div className="text-xs font-semibold leading-tight mb-1">
                  {step.label}
                </div>
                <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                  {step.desc}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
