import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X, ExternalLink } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  link?: {
    url: string;
    text: string;
  };
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      dir="rtl"
      className={`pointer-events-auto p-4 rounded-xl shadow-lg border flex items-start gap-3 transition-all animate-in slide-in-from-bottom-2 ${
        isSuccess
          ? 'bg-white border-emerald-200 text-slate-800'
          : isError
          ? 'bg-white border-rose-200 text-slate-800'
          : 'bg-white border-blue-200 text-slate-800'
      }`}
    >
      <div className="shrink-0 mt-0.5">
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        ) : isError ? (
          <AlertTriangle className="w-5 h-5 text-rose-600" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-blue-600" />
        )}
      </div>

      <div className="flex-1 space-y-1">
        <div className="text-sm font-bold leading-tight">{toast.title}</div>
        {toast.message && <p className="text-xs text-slate-600">{toast.message}</p>}
        {toast.link && (
          <a
            href={toast.link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline mt-1"
          >
            <span>{toast.link.text}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
