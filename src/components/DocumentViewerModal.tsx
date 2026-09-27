import React, { useState, useEffect } from 'react';
import { X, Layers, ExternalLink, Download, FileText } from 'lucide-react';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileData: {
    base64: string;
    fileName: string;
    mimeType: string;
  } | null;
  targetPage?: number | string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  fileData,
  targetPage,
}) => {
  if (!isOpen || !fileData) return null;

  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileData) return;
    try {
      const cleanBase64 = fileData.base64.replace(/^data:[^;]+;base64,/, '');
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: fileData.mimeType });
      const url = URL.createObjectURL(blob);
      setBlobUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error('Failed to create blob url:', err);
    }
  }, [fileData]);

  const isPdf = fileData.mimeType === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-5xl w-full h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                {fileData.fileName}
              </h3>
              <p className="text-[11px] text-slate-500">
                {targetPage ? `Inspecting Source Document (Page ${targetPage})` : 'Statement Visual Verification'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {blobUrl && (
              <a
                href={blobUrl}
                download={fileData.fileName}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 transition"
              >
                <Download className="h-3.5 w-3.5 text-slate-500" />
                <span>Save</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-100 overflow-hidden relative">
          {blobUrl ? (
            isPdf ? (
              <iframe
                src={`${blobUrl}#page=${targetPage || 1}&view=FitH`}
                title="Bank Statement Document Viewer"
                className="w-full h-full border-none"
              />
            ) : (
              <div className="w-full h-full overflow-auto flex items-center justify-center p-4">
                <img
                  src={blobUrl}
                  alt="Bank Statement Document"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                />
              </div>
            )
          ) : (
            <div className="flex items-center justify-center h-full text-xs text-slate-400">
              Loading document preview...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
