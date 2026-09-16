import React, { useState, useEffect, useRef } from 'react';
import { X, Target } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

interface AddSavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const AddSavingsGoalModal: React.FC<AddSavingsGoalModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const { addSavingsGoal } = useFinance();
  const [goalName, setGoalName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setGoalName('');
      setTargetAmountStr('');
      setTargetDate('');
      setErrorMsg(null);
      setIsSubmitting(false);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = goalName.trim();
    if (!trimmedName) {
      setErrorMsg('Nama target tabungan tidak boleh kosong.');
      return;
    }

    const amount = parseInt(targetAmountStr, 10);
    if (!amount || amount <= 0) {
      setErrorMsg('Target nominal harus lebih besar dari Rp 0.');
      return;
    }

    setIsSubmitting(true);
    const { error } = await addSavingsGoal({
      name: trimmedName,
      target_amount: amount,
      target_date: targetDate || undefined,
      color: '#B9924F', // Satin Gold (primary brand token)
    });

    setIsSubmitting(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      if (onShowToast) onShowToast(`Target "${trimmedName}" berhasil dibuat`);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-goal-title"
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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-text-gold border border-border-gold-soft">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 id="add-goal-title" className="text-sm font-bold text-text-primary tracking-tight">
                Target Tabungan Baru
              </h2>
              <p className="text-xs text-text-muted">
                Rencanakan tujuan finansial atau dana cadangan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Tutup modal target baru"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-semantic-rose-soft border border-semantic-rose/30 rounded-xl text-xs text-semantic-rose-text font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label htmlFor="goal-name-input" className="text-xs font-semibold text-text-secondary block mb-1.5">
              Nama Target
            </label>
            <input
              ref={nameInputRef}
              id="goal-name-input"
              type="text"
              placeholder="Misal: Beli Laptop Baru, Liburan Semester"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-border-gold-focus placeholder:text-text-muted"
            />
          </div>

          <div>
            <label htmlFor="goal-amount-input" className="text-xs font-semibold text-text-secondary block mb-1.5">
              Target Nominal (Rp)
            </label>
            <input
              id="goal-amount-input"
              type="number"
              min="1000"
              step="1000"
              placeholder="5000000"
              value={targetAmountStr}
              onChange={(e) => setTargetAmountStr(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-base font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-border-gold-focus tabular-nums placeholder:text-text-muted"
            />
            <p className="text-xs text-text-muted mt-1">
              Nominal minimal Rp 1.000 (harus lebih besar dari 0).
            </p>
          </div>

          <div>
            <label htmlFor="goal-date-input" className="text-xs font-semibold text-text-secondary block mb-1.5">
              Target Tanggal Tercapai (Opsional)
            </label>
            <input
              id="goal-date-input"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-sm font-medium text-text-primary focus:outline-none focus:ring-2 focus:ring-border-gold-focus"
            />
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
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-slate-950 text-xs font-bold transition-all shadow-sm min-h-[44px] disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Target'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
