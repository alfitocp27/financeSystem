import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ArrowDownRight, Wallet as WalletIcon } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { SavingsGoal } from '../types/database.types';
import { formatCurrency } from '../lib/formatters';

interface AllocateGoalModalProps {
  isOpen: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const AllocateGoalModal: React.FC<AllocateGoalModalProps> = ({
  isOpen,
  goal,
  onClose,
  onShowToast,
}) => {
  const { wallets, allocateToGoal } = useFinance();
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
        // Pilih dompet dengan saldo terbesar secara default
        const sorted = [...activeWallets].sort((a, b) => b.balance - a.balance);
        setSelectedWalletId(sorted[0].id);
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

  const remainingToTarget = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));

  const handlePreset = (val: number) => {
    setAmountStr(val.toString());
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (goal.is_active === false) {
      setErrorMsg('Target telah diarsipkan dan tidak dapat menerima alokasi baru.');
      return;
    }

    if (!selectedWallet) {
      setErrorMsg('Pilih dompet sumber dana.');
      return;
    }

    const amount = parseInt(amountStr, 10);
    if (!amount || amount <= 0) {
      setErrorMsg('Nominal alokasi harus lebih besar dari Rp 0.');
      return;
    }

    if (amount > selectedWallet.balance) {
      setErrorMsg(
        `Saldo ${selectedWallet.name} tidak mencukupi (${formatCurrency(selectedWallet.balance)}).`
      );
      return;
    }

    setIsSubmitting(true);
    const { error } = await allocateToGoal(goal.id, selectedWallet.id, amount);
    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      if (onShowToast) {
        onShowToast(
          `Berhasil menabung ${formatCurrency(amount)} ke "${goal.name}" dari ${selectedWallet.name}`
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
      aria-labelledby="allocate-goal-title"
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
            <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border-gold/30 flex items-center justify-center text-text-gold">
              <ArrowDownRight className="w-5 h-5" />
            </div>
            <div>
              <h2 id="allocate-goal-title" className="text-base font-bold text-text-primary">
                Nabung ke Target
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Alokasikan dana dari dompet ke target &ldquo;{goal.name}&rdquo;
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Tutup modal nabung"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div className="p-3 mb-4 bg-semantic-rose-soft border border-semantic-rose/30 rounded-xl text-xs text-semantic-rose-text font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dompet Sumber */}
          <div>
            <label htmlFor="allocate-wallet-select" className="text-xs font-semibold text-text-secondary block mb-1.5">
              Sumber Dompet
            </label>
            {activeWallets.length === 0 ? (
              <p className="text-xs text-semantic-rose-text p-2 bg-semantic-rose-soft rounded-lg">
                Tidak ada dompet aktif yang tersedia. Aktifkan dompet terlebih dahulu.
              </p>
            ) : (
              <select
                id="allocate-wallet-select"
                value={selectedWallet?.id || ''}
                onChange={(e) => setSelectedWalletId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-border-gold-focus min-h-[44px]"
              >
                {activeWallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} — Saldo: {formatCurrency(w.balance)}
                  </option>
                ))}
              </select>
            )}
            {selectedWallet && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-text-muted">
                <WalletIcon className="w-3.5 h-3.5 text-text-gold" />
                <span>
                  Saldo tersedia:{' '}
                  <strong className="text-text-primary font-bold tabular-nums">
                    {formatCurrency(selectedWallet.balance)}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Nominal */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="allocate-amount-input" className="text-xs font-semibold text-text-secondary">
                Nominal Alokasi (Rp)
              </label>
              {remainingToTarget > 0 && (
                <span className="text-xs text-text-muted">
                  Kurang: <strong className="text-text-gold font-bold">{formatCurrency(remainingToTarget)}</strong>
                </span>
              )}
            </div>
            <input
              ref={amountInputRef}
              id="allocate-amount-input"
              type="number"
              min="1000"
              step="1000"
              placeholder="100000"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-base font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-border-gold-focus tabular-nums placeholder:text-text-muted min-h-[44px]"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 mt-2">
              {[50000, 100000, 250000, 500000].map((presetVal) => (
                <button
                  key={presetVal}
                  type="button"
                  onClick={() => handlePreset(presetVal)}
                  className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-border-subtle hover:border-border-gold/50 text-xs font-medium text-text-secondary hover:text-text-gold transition-colors min-h-[36px]"
                >
                  +{presetVal >= 1000000 ? `${presetVal / 1000000}jt` : `${presetVal / 1000}rb`}
                </button>
              ))}
              {remainingToTarget > 0 && (
                <button
                  type="button"
                  onClick={() => handlePreset(remainingToTarget)}
                  className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-border-gold/40 hover:border-border-gold text-xs font-semibold text-text-gold transition-colors min-h-[36px]"
                >
                  Penuhi Target
                </button>
              )}
            </div>
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
              disabled={isSubmitting || activeWallets.length === 0}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-slate-950 text-xs font-bold transition-all shadow-sm min-h-[44px] disabled:opacity-50"
            >
              {isSubmitting ? 'Memproses...' : 'Simpan Tabungan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
