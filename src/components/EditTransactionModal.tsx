import React, { useState, useEffect, useMemo } from 'react';
import {
  Edit2,
  X,
  Check,
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  AlertCircle,
  Info,
} from 'lucide-react';
import type { Transaction, Wallet, Category, TransactionType } from '../types/database.types';
import { formatCurrency, getLocalDateString } from '../lib/formatters';

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  wallets: Wallet[];
  categories: Category[];
  onClose: () => void;
  onSave: (id: string, updates: { note?: string; categoryId?: string }) => Promise<{ error: Error | null }>;
  onCorrectFinancial?: (params: {
    oldTransactionId: string;
    type: TransactionType;
    amount: number;
    walletId: string;
    transactionDate: string;
    destinationWalletId?: string;
    categoryId?: string;
    note?: string;
  }) => Promise<{ error: Error | null }>;
  onShowToast?: (msg: string) => void;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transaction,
  wallets,
  categories,
  onClose,
  onSave,
  onCorrectFinancial,
  onShowToast,
}) => {
  // Form state
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [walletId, setWalletId] = useState('');
  const [destWalletId, setDestWalletId] = useState('');
  const [transactionDate, setTransactionDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [note, setNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const activeWallets = useMemo(
    () => wallets.filter((w) => w.is_active !== false),
    [wallets]
  );

  const isGoalTx = Boolean(transaction?.goal_id);
  const availableCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  // Initialize form state when modal opens
  useEffect(() => {
    if (isOpen && transaction) {
      setType(transaction.type);
      setAmountStr(transaction.amount.toString());
      setWalletId(transaction.wallet_id);
      setDestWalletId(transaction.destination_wallet_id || '');
      setTransactionDate(transaction.transaction_date);
      setCategoryId(transaction.category_id || '');
      setNote(transaction.note || '');
      setIsSubmitting(false);
      setErrorMsg(null);
    }
  }, [isOpen, transaction]);

  // Handle ESC key to close
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

  // Handle type change and adjust category if needed
  const handleTypeChange = (newType: TransactionType) => {
    if (isGoalTx || isSubmitting) return;
    setType(newType);
    // Reset category if switching to transfer or if current category does not match new type
    if (newType === 'transfer') {
      setCategoryId('');
    } else {
      const match = categories.find((c) => c.id === categoryId && c.type === newType);
      if (!match) setCategoryId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numericAmount = parseInt(amountStr, 10);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Masukkan nominal transaksi yang valid (lebih dari 0).');
      return;
    }

    if (!walletId) {
      setErrorMsg('Pilih dompet transaksi.');
      return;
    }

    if (type === 'transfer') {
      if (!destWalletId || destWalletId === walletId) {
        setErrorMsg('Pilih dompet tujuan yang berbeda dari dompet sumber.');
        return;
      }
    }

    if (!transactionDate) {
      setErrorMsg('Pilih tanggal transaksi.');
      return;
    }

    if (transactionDate > todayStr) {
      setErrorMsg('Tanggal transaksi tidak boleh melebihi hari ini.');
      return;
    }

    // Smart diffing
    const isFinancialChanged =
      !isGoalTx &&
      (numericAmount !== Number(transaction.amount) ||
        type !== transaction.type ||
        walletId !== transaction.wallet_id ||
        (type === 'transfer'
          ? destWalletId !== (transaction.destination_wallet_id || '')
          : Boolean(transaction.destination_wallet_id)) ||
        transactionDate !== transaction.transaction_date);

    const isMetadataChanged =
      note.trim() !== (transaction.note || '').trim() ||
      (type !== 'transfer' && (categoryId || '') !== (transaction.category_id || ''));

    // Case C: No change
    if (!isFinancialChanged && !isMetadataChanged) {
      onClose();
      return;
    }

    // Case B: Financial fields changed -> RPC atomic reverse + replace
    if (isFinancialChanged) {
      if (!onCorrectFinancial) {
        setErrorMsg('Fungsi koreksi finansial belum tersedia.');
        return;
      }

      setIsSubmitting(true);
      const { error } = await onCorrectFinancial({
        oldTransactionId: transaction.id,
        type,
        amount: numericAmount,
        walletId,
        transactionDate,
        destinationWalletId: type === 'transfer' ? destWalletId : undefined,
        categoryId: type !== 'transfer' ? (categoryId || undefined) : undefined,
        note: note.trim() || undefined,
      });
      setIsSubmitting(false);

      if (error) {
        setErrorMsg(error.message || 'Gagal melakukan koreksi transaksi.');
      } else {
        if (onShowToast) onShowToast('Transaksi berhasil diperbarui.');
        onClose();
      }
      return;
    }

    // Case A: Only metadata (note or category) changed -> Standard PATCH
    setIsSubmitting(true);
    const { error } = await onSave(transaction.id, {
      note: note.trim(),
      categoryId: type !== 'transfer' ? (categoryId || undefined) : undefined,
    });
    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || 'Gagal memperbarui catatan transaksi.');
    } else {
      if (onShowToast) onShowToast('Transaksi berhasil diperbarui.');
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
      <div className="bg-surface-modal border border-border-default w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border bg-primary-soft border-border-gold text-text-gold">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="edit-tx-title" className="text-base font-bold text-text-primary">
                Koreksi Transaksi
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Perubahan transaksi akan menyesuaikan saldo dompet secara otomatis.
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

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-semantic-rose-soft border border-semantic-rose/30 text-semantic-rose-text text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Goal Transaction Policy Notice */}
        {isGoalTx && (
          <div className="p-3 rounded-xl bg-primary-soft border border-border-gold/30 text-text-gold text-xs flex items-center gap-2">
            <Info className="w-4 h-4 shrink-0" />
            <span>Transaksi tabungan dikelola melalui Target Tabungan.</span>
          </div>
        )}

        {/* Unified Direct Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Jenis Transaksi */}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1.5">
              Jenis Transaksi
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-elevated border border-border-subtle rounded-xl">
              <button
                type="button"
                disabled={isGoalTx || isSubmitting}
                onClick={() => handleTypeChange('expense')}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
                  type === 'expense'
                    ? 'bg-semantic-rose text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                } ${isGoalTx ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ArrowDownRight className="w-4 h-4" /> Pengeluaran
              </button>
              <button
                type="button"
                disabled={isGoalTx || isSubmitting}
                onClick={() => handleTypeChange('income')}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
                  type === 'income'
                    ? 'bg-semantic-green text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                } ${isGoalTx ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ArrowUpRight className="w-4 h-4" /> Pemasukan
              </button>
              <button
                type="button"
                disabled={isGoalTx || isSubmitting}
                onClick={() => handleTypeChange('transfer')}
                className={`py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all min-h-[44px] ${
                  type === 'transfer'
                    ? 'bg-semantic-blue text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                } ${isGoalTx ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <ArrowRightLeft className="w-4 h-4" /> Transfer
              </button>
            </div>
          </div>

          {/* Nominal */}
          <div>
            <label htmlFor="corr-amount-input" className="text-xs font-semibold text-text-secondary block mb-1">
              Nominal Transaksi (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">
                Rp
              </span>
              <input
                id="corr-amount-input"
                type="number"
                inputMode="numeric"
                disabled={isGoalTx || isSubmitting}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-base font-bold text-text-gold placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Tanggal Transaksi */}
          <div>
            <label htmlFor="corr-date-input" className="text-xs font-semibold text-text-secondary block mb-1">
              Tanggal Transaksi
            </label>
            <input
              id="corr-date-input"
              type="date"
              disabled={isGoalTx || isSubmitting}
              value={transactionDate}
              max={todayStr}
              onChange={(e) => setTransactionDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Dompet Sumber & Tujuan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="corr-wallet-select" className="text-xs font-semibold text-text-secondary block mb-1">
                {type === 'transfer' ? 'Dari Dompet' : 'Dompet / Rekening'}
              </label>
              <select
                id="corr-wallet-select"
                disabled={isGoalTx || isSubmitting}
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {activeWallets.map((w) => (
                  <option key={w.id} value={w.id} className="bg-surface-modal">
                    {w.name} ({formatCurrency(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' && (
              <div>
                <label htmlFor="corr-dest-wallet-select" className="text-xs font-semibold text-text-secondary block mb-1">
                  Ke Dompet Tujuan
                </label>
                <select
                  id="corr-dest-wallet-select"
                  disabled={isGoalTx || isSubmitting}
                  value={destWalletId}
                  onChange={(e) => setDestWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Pilih Dompet Tujuan...</option>
                  {activeWallets
                    .filter((w) => w.id !== walletId)
                    .map((w) => (
                      <option key={w.id} value={w.id} className="bg-surface-modal">
                        {w.name} ({formatCurrency(w.balance)})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Kategori (jika bukan transfer dan bukan goal) */}
          {type !== 'transfer' && !isGoalTx && (
            <div>
              <label htmlFor="corr-category-select" className="text-xs font-semibold text-text-secondary block mb-1">
                Kategori
              </label>
              <select
                id="corr-category-select"
                disabled={isSubmitting}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
              >
                <option value="">Tanpa Kategori / Umum</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-surface-modal">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Catatan Transaksi */}
          <div>
            <label htmlFor="corr-note-input" className="text-xs font-semibold text-text-secondary block mb-1">
              Catatan Transaksi
            </label>
            <input
              id="corr-note-input"
              type="text"
              disabled={isSubmitting}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Catatan transaksi..."
              className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
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
