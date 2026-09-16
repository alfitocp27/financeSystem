import React, { useState, useEffect } from 'react';
import { Edit2, X, Lock, Check } from 'lucide-react';
import type { Transaction, Wallet, Category } from '../types/database.types';
import { formatCurrency, formatDateIndo } from '../lib/formatters';

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  wallets: Wallet[];
  categories: Category[];
  onClose: () => void;
  onSave: (id: string, updates: { note?: string; categoryId?: string }) => Promise<{ error: Error | null }>;
  onShowToast?: (msg: string) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transaction,
  wallets,
  categories,
  onClose,
  onSave,
  onShowToast,
}) => {
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transaction) {
      setNote(transaction.note || '');
      setCategoryId(transaction.category_id || '');
      setIsSubmitting(false);
      setErrorMsg(null);
    }
  }, [isOpen, transaction]);

  // Handle ESC key to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !transaction) return null;

  const sourceWallet = wallets.find((w) => w.id === transaction.wallet_id);
  const destWallet = transaction.destination_wallet_id
    ? wallets.find((w) => w.id === transaction.destination_wallet_id)
    : null;

  // Filter categories matching transaction type (for transfers, category is not typically used)
  const availableCategories = categories.filter((c) => c.type === transaction.type);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    const { error } = await onSave(transaction.id, {
      note,
      categoryId: transaction.type !== 'transfer' ? categoryId : undefined,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || 'Gagal menyimpan perubahan transaksi.');
    } else {
      if (onShowToast) onShowToast('Catatan transaksi berhasil diperbarui.');
      onClose();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-tx-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
    >
      <div className="bg-surface-modal border border-border-default w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-soft border border-border-gold flex items-center justify-center text-text-gold shrink-0">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="edit-tx-title" className="text-base font-bold text-text-primary">
                Edit Detail Transaksi
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Perbarui catatan dan pos kategori pengeluaran/pemasukan.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-elevated transition-colors min-h-[44px] min-w-[44px]"
            title="Tutup"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-Only Locked Parameters Card */}
        <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-text-muted">
              <Lock className="w-3.5 h-3.5 text-text-muted" />
              <span>Parameter Terkunci:</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-soft text-text-gold border border-border-gold">
              Saldo Terproteksi
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-border-subtle">
            <div>
              <span className="text-text-muted block text-xs">Nominal</span>
              <span className="font-bold text-text-primary text-sm tabular-nums">
                {formatCurrency(transaction.amount)}
              </span>
            </div>

            <div>
              <span className="text-text-muted block text-xs">Tanggal</span>
              <span className="font-medium text-text-secondary text-xs">
                {formatDateIndo(transaction.transaction_date)}
              </span>
            </div>

            <div className="col-span-2">
              <span className="text-text-muted block text-xs">Akun Terkait</span>
              <span className="font-medium text-text-secondary text-xs truncate block">
                {transaction.type === 'transfer'
                  ? `${sourceWallet?.name || 'Dompet'} ➔ ${destWallet?.name || 'Tujuan'}`
                  : sourceWallet?.name || 'Dompet'}
              </span>
            </div>
          </div>
        </div>

        {/* Form Fields: Editable Note & Category */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {transaction.type !== 'transfer' && (
            <div>
              <label htmlFor="edit-category-select" className="text-xs font-semibold text-text-secondary block mb-1.5">
                Kategori Transaksi
              </label>
              <select
                id="edit-category-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
              >
                <option value="">Pilih Kategori...</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="edit-note-input" className="text-xs font-semibold text-text-secondary block mb-1.5">
              Catatan Transaksi
            </label>
            <input
              id="edit-note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Makan siang warteg, beli kuota..."
              className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
            />
          </div>

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
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-elevated text-text-secondary hover:text-text-primary text-xs font-semibold transition-colors min-h-[44px]"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-slate-950 text-xs font-bold transition-colors min-h-[44px] shadow-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
