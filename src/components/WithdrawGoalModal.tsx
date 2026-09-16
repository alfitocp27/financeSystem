import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ArrowUpRight, ShieldAlert } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { SavingsGoal } from '../types/database.types';
import { formatCurrency } from '../lib/formatters';

interface WithdrawGoalModalProps {
  isOpen: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const WithdrawGoalModal: React.FC<WithdrawGoalModalProps> = ({
  isOpen,
  goal,
  onClose,
  onShowToast,
}) => {
  const { wallets, withdrawFromGoal } = useFinance();
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const amountInputRef = useRef<HTMLInputElement | null>(null);

  // Filter only active wallets
  const activeWallets = useMemo(() => {
    return wallets.filter((w) => w.is_active !== false);
  }, [wallets]);

  const selectedWallet = useMemo(() => {
    return activeWallets.find((w) => w.id === selectedWalletId) || activeWallets[0] || null;
  }, [activeWallets, selectedWalletId]);

  useEffect(() => {
    if (isOpen && goal) {
      setAmountStr('');
      setErrorMsg(null);
      setIsSubmitting(false);
      if (activeWallets.length > 0) {
        setSelectedWalletId(activeWallets[0].id);
      }
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, goal, activeWallets]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !goal) return null;

  const currentSavings = Number(goal.current_amount) || 0;

  const handlePercentagePreset = (pct: number) => {
    const val = Math.floor((currentSavings * pct) / 100);
    setAmountStr(val.toString());
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (currentSavings <= 0) {
      setErrorMsg('Target tabungan tidak memiliki saldo untuk dicairkan.');
      return;
    }

    if (!selectedWallet) {
      setErrorMsg('Pilih dompet tujuan pencairan dana.');
      return;
    }

    const amount = parseInt(amountStr, 10);
    if (!amount || amount <= 0) {
      setErrorMsg('Nominal pencairan harus lebih besar dari Rp 0.');
      return;
    }

    if (amount > currentSavings) {
      setErrorMsg(
        `Nominal melebihi saldo tabungan saat ini (${formatCurrency(currentSavings)}).`
      );
      return;
    }

    setIsSubmitting(true);
    const { error } = await withdrawFromGoal(goal.id, selectedWallet.id, amount);
    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      if (onShowToast) {
        onShowToast(
          `Berhasil mencairkan ${formatCurrency(amount)} dari "${goal.name}" ke ${selectedWallet.name}`
        );
      }
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-goal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md bg-surface-modal border border-border-default rounded-2xl shadow-2xl p-6 text-text-primary animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border-default flex items-center justify-center text-text-secondary">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h2 id="withdraw-goal-title" className="text-base font-bold text-text-primary">
                Tarik Dana Tabungan
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Cairkan dana dari target &ldquo;{goal.name}&rdquo; ke dompet aktif
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Tutup modal tarik dana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Semantics info notice */}
        <div className="p-3 mb-4 bg-surface-elevated border border-border-subtle rounded-xl flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-text-gold shrink-0 mt-0.5" />
          <p className="text-xs text-text-secondary leading-relaxed">
            Pencairan tabungan mengembalikan saldo ke dompet aktif. Transaksi ini tercatat sebagai{' '}
            <strong className="text-text-primary">Pencairan Tabungan</strong> dan tidak dihitung sebagai uang pemasukan baru dalam anggaran siklus.
          </p>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="p-3 mb-4 bg-semantic-rose-soft border border-semantic-rose/30 rounded-xl text-xs text-semantic-rose-text font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dompet Tujuan */}
          <div>
            <label htmlFor="withdraw-wallet-select" className="text-xs font-semibold text-text-secondary block mb-1.5">
              Tujuan Dompet
            </label>
            {activeWallets.length === 0 ? (
              <p className="text-xs text-semantic-rose-text p-2 bg-semantic-rose-soft rounded-lg">
                Tidak ada dompet aktif yang tersedia. Aktifkan dompet terlebih dahulu.
              </p>
            ) : (
              <select
                id="withdraw-wallet-select"
                value={selectedWallet?.id || ''}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-border-gold-focus min-h-[44px]"
              >
                {activeWallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} — Saldo saat ini: {formatCurrency(w.balance)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Nominal */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="withdraw-amount-input" className="text-xs font-semibold text-text-secondary">
                Nominal Pencairan (Rp)
              </label>
              <span className="text-xs text-text-muted">
                Saldo tabungan: <strong className="text-text-primary font-bold">{formatCurrency(currentSavings)}</strong>
              </span>
            </div>
            <input
              ref={amountInputRef}
              id="withdraw-amount-input"
              type="number"
              min="1000"
              max={currentSavings}
              step="1000"
              placeholder="50000"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-base font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-border-gold-focus tabular-nums placeholder:text-text-muted min-h-[44px]"
            />

            {/* Quick Percentage Presets */}
            {currentSavings > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => handlePercentagePreset(25)}
                  className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-border-subtle hover:border-border-default text-xs font-medium text-text-secondary hover:text-text-primary transition-colors min-h-[36px]"
                >
                  25% ({formatCurrency(Math.floor(currentSavings * 0.25))})
                </button>
                <button
                  type="button"
                  onClick={() => handlePercentagePreset(50)}
                  className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-border-subtle hover:border-border-default text-xs font-medium text-text-secondary hover:text-text-primary transition-colors min-h-[36px]"
                >
                  50% ({formatCurrency(Math.floor(currentSavings * 0.5))})
                </button>
                <button
                  type="button"
                  onClick={() => handlePercentagePreset(100)}
                  className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-border-gold/40 hover:border-border-gold text-xs font-semibold text-text-gold transition-colors min-h-[36px]"
                >
                  100% (Semua: {formatCurrency(currentSavings)})
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border-default hover:bg-surface-elevated text-xs font-semibold text-text-secondary transition-colors min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || currentSavings <= 0 || activeWallets.length === 0}
              className="px-5 py-2.5 rounded-xl bg-surface-elevated border border-border-default hover:bg-surface-modal text-xs font-bold text-text-primary transition-all shadow-sm min-h-[44px] disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses...' : 'Cairkan ke Dompet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
