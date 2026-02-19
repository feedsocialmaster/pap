'use client';

import React from 'react';
import { X, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore, Toast as ToastType } from '@/store/toastStore';

const Toast: React.FC<{ toast: ToastType }> = ({ toast }) => {
  const { removeToast } = useToastStore();

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
  };

  const styles = {
    success: 'bg-success text-white',
    error: 'bg-error text-white',
    info: 'bg-info text-white',
    warning: 'bg-warning text-white',
  };

  return (
    <div
      className={`${styles[toast.type]} rounded-lg shadow-lg p-4 min-w-[300px] max-w-md flex items-start gap-3 animate-slideIn`}
      role="alert"
    >
      <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
      
      <div className="flex-1">
        <h4 className="font-semibold text-sm mb-1">{toast.title}</h4>
        {toast.message && (
          <p className="text-sm opacity-90">{toast.message}</p>
        )}
      </div>

      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Cerrar notificación"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const ToastContainer: React.FC = () => {
  const { toasts } = useToastStore();

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
