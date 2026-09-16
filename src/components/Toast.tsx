import React, { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastData {
  message: string;
  action?: ToastAction;
}

interface ToastProps {
  toast: string | ToastData | null;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose, duration = 4000 }) => {
  const message = typeof toast === 'string' ? toast : toast?.message || null;
  const action = typeof toast === 'object' && toast !== null ? toast.action : undefined;

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2.5 bg-surface-modal border border-border-default text-text-primary text-xs font-semibold rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-4 duration-300 max-w-md">
      <CheckCircle className="w-4 h-4 text-semantic-green shrink-0" />
      <span className="flex-1">{message}</span>
      {action && (
        <button
          onClick={() => {
            action.onClick();
            onClose();
          }}
          className="text-xs font-bold text-text-gold hover:text-primary-focus px-2.5 py-1 min-h-[36px] flex items-center rounded-md bg-surface-elevated hover:bg-surface-bright transition-colors uppercase tracking-wider"
        >
          {action.label}
        </button>
      )}
      <button
        onClick={onClose}
        className="p-1 text-text-muted hover:text-text-primary rounded-lg transition-colors"
        aria-label="Tutup notifikasi"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
