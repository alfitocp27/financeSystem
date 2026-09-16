import React, { useState, useEffect } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import type { Transaction, Wallet, Category } from '../types/database.types';
import { formatCurrency } from '../lib/formatters';

interface DeleteTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  wallets: Wallet[];
  categories: Category[];
  onClose: () => void;
  onConfirm: (id: string) => Promise<void>;
}

export const DeleteTransactionModal: React.FC<DeleteTransactionModalProps> = ({
  isOpen,
  transaction,
  wallets,
  categories,
  onClose,
  onConfirm,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !transaction) return null;

  const sourceWallet = wallets.find((w) => w.id === transaction.wallet_id);
  const destWallet = transaction.destination_wallet_id
    ? wallets.find((w) => w.id === transaction.destination_wallet_id)
    : null;
  const category = categories.find((c) => c.id === transaction.category_id);

  const getReconciliationExplanation = () => {
    const amountStr = formatCurrency(transaction.amount);
    const sourceName = sourceWallet?.name || 'Dompet Terkait';
    const destName = destWallet?.name || 'Dompet Tujuan';

    if (transaction.type === 'expense') {
      return `Saldo ${sourceName} akan dikembalikan sebesar ${amountStr}.`;
    }
    if (transaction.type === 'income') {
      return `Saldo ${sourceName} akan dikurangi sebesar ${amountStr}.`;
    }
    if (transaction.type === 'transfer') {
      return `Mutasi transfer dibatalkan: ${amountStr} dikembalikan ke ${sourceName} dan ditarik dari ${destName}.`;
    }
    return `Saldo dompet terkait akan disesuaikan sebesar ${amountStr}.`;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMsg(null);
    try {
      await onConfirm(transaction.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menghapus transaksi. Silakan coba lagi.');
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-tx-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
    >
      <div className="bg-surface-modal border border-border-default w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-semantic-rose-soft border border-semantic-rose/20 flex items-center justify-center text-semantic-rose-text shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 id="delete-tx-title" className="text-base font-bold text-text-primary">
                Hapus Transaksi?
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Aksi ini akan menghapus catatan dan merekonsiliasi saldo dompet.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-elevated transition-colors min-h-[44px] min-w-[44px]"
            title="Tutup"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Summary Card */}
        <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Deskripsi:</span>
            <span className="font-semibold text-text-primary truncate max-w-[200px]">
              {transaction.note || category?.name || (transaction.type === 'transfer' ? 'Transfer Saldo' : 'Transaksi')}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted">Nominal:</span>
            <span className="font-bold text-text-primary tabular-nums text-sm">
              {formatCurrency(transaction.amount)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-text-muted">Akun / Dompet:</span>
            <span className="text-text-secondary truncate max-w-[200px]">
              {transaction.type === 'transfer'
                ? `${sourceWallet?.name || 'Dompet'} ➔ ${destWallet?.name || 'Tujuan'}`
                : sourceWallet?.name || 'Dompet'}
            </span>
          </div>
        </div>

        {/* Reconciliation Explanation Banner */}
        <div className="p-3 rounded-xl bg-primary-soft border border-border-gold text-xs text-text-gold flex items-start gap-2">
          <div className="leading-relaxed">
            <span className="font-semibold">Rekonsiliasi Saldo Otomatis: </span>
            <span>{getReconciliationExplanation()}</span>
          </div>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-semantic-rose-soft border border-semantic-rose/30 text-semantic-rose-text text-xs">
            {errorMsg}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary text-xs font-semibold transition-colors min-h-[44px]"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-semantic-rose hover:bg-semantic-rose/90 text-white text-xs font-bold transition-colors min-h-[44px] shadow-sm disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Menghapus...' : 'Hapus Transaksi'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
