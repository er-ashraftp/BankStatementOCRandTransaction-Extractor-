import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  FileCheck,
  Sparkles,
  ArrowRight,
  Layers,
  X,
  AlertCircle
} from 'lucide-react';
import { SAMPLE_PRESETS, SamplePreset } from '../utils/sampleStatements';

interface UploadZoneProps {
  onFileSelected: (file: {
    base64: string;
    fileName: string;
    mimeType: string;
    size: number;
    pageCount?: number;
  }) => void;
  onExtract: () => void;
  onLoadPreset: (preset: SamplePreset) => void;
  selectedFile: {
    base64: string;
    fileName: string;
    mimeType: string;
    size: number;
    pageCount?: number;
  } | null;
  onClearFile: () => void;
  isProcessing: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFileSelected,
  onExtract,
  onLoadPreset,
  selectedFile,
  onClearFile,
  isProcessing,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [loadingPresetId, setLoadingPresetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const processFile = async (file: File) => {
    setUploadError(null);
    const validMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
    ];

    if (!validMimes.includes(file.type) && !file.name.match(/\.(pdf|png|jpe?g)$/i)) {
      setUploadError('Unsupported file type. Please upload a PDF, PNG, JPG, or JPEG bank statement.');
      return;
    }

    if (file.size > 40 * 1024 * 1024) {
      setUploadError('File size exceeds 40MB limit.');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        let pageCount = 1;

        if (file.type === 'application/pdf') {
          try {
            // Quick inspect via server or client
            const res = await fetch('/api/inspect-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ fileData: base64Data }),
            });
            if (res.ok) {
              const info = await res.json();
              pageCount = info.pageCount || 1;
            }
          } catch {
            // fallback
          }
        }

        onFileSelected({
          base64: base64Data,
          fileName: file.name,
          mimeType: file.type || 'application/pdf',
          size: file.size,
          pageCount,
        });
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError('Failed to read file: ' + err.message);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handlePresetClick = async (preset: SamplePreset) => {
    setLoadingPresetId(preset.id);
    setUploadError(null);
    try {
      const generated = await preset.generatePdf();
      onFileSelected({
        base64: `data:${generated.mimeType};base64,${generated.base64}`,
        fileName: generated.fileName,
        mimeType: generated.mimeType,
        size: Math.round(generated.base64.length * 0.75),
        pageCount: preset.pages,
      });
    } catch (err: any) {
      setUploadError('Failed to load sample: ' + err.message);
    } finally {
      setLoadingPresetId(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${
          selectedFile
            ? 'bg-blue-50/40 border-blue-300'
            : isDragging
            ? 'bg-blue-50/80 border-blue-500 scale-[1.01]'
            : 'bg-white border-slate-300 hover:border-blue-400 hover:bg-slate-50/60 cursor-pointer shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              processFile(e.target.files[0]);
            }
          }}
        />

        {selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
              <FileCheck className="h-8 w-8" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 max-w-lg truncate">
              {selectedFile.fileName}
            </h3>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-600 mb-6">
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-mono font-medium">
                {formatFileSize(selectedFile.size)}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white border border-slate-200 font-medium uppercase">
                {selectedFile.mimeType.split('/')[1] || 'Document'}
              </span>
              {selectedFile.pageCount && (
                <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium flex items-center gap-1">
                  <Layers className="h-3 w-3" />
                  {selectedFile.pageCount} {selectedFile.pageCount === 1 ? 'Page' : 'Pages'}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClearFile();
                }}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition active:scale-95 disabled:opacity-50"
              >
                <X className="h-4 w-4 text-slate-500" />
                Change File
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExtract();
                }}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-4 w-4" />
                <span>Extract Transactions</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 ring-8 ring-blue-50/50">
              <UploadCloud className="h-8 w-8" />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              Drop your bank statement here, or{' '}
              <span className="text-blue-600 hover:underline">browse files</span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-4">
              Upload multi-page statements, scans, or exported PDFs. Gemini 3.8 Flash reads multi-line descriptions, tables, and debit/credit columns accurately.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-medium text-slate-400">
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">PDF (Multi-page)</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">PNG</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600">JPG / JPEG</span>
              <span>&bull; Up to 40MB</span>
            </div>
          </div>
        )}

        {uploadError && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Preset Bank Statement Cards for Instant Testing */}
      <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Quick Test Sample Statements
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">Click to load realistic statement</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SAMPLE_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition flex flex-col justify-between gap-3 text-left group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition">
                    {preset.bank}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                    {preset.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {preset.description}
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  disabled={isProcessing || loadingPresetId === preset.id}
                  className="flex-1 text-center py-1.5 px-2.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-[11px] font-semibold transition active:scale-95 disabled:opacity-50"
                >
                  {loadingPresetId === preset.id ? 'Generating PDF...' : 'Load & Extract PDF'}
                </button>
                <button
                  type="button"
                  onClick={() => onLoadPreset(preset)}
                  disabled={isProcessing}
                  className="py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-[11px] font-medium transition active:scale-95"
                  title="Explore pre-extracted table immediately"
                >
                  Instant Table View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
