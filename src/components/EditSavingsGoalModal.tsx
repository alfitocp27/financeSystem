import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Archive, RotateCcw, AlertTriangle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { SavingsGoal } from '../types/database.types';
import { formatCurrency } from '../lib/formatters';

interface EditSavingsGoalModalProps {
  isOpen: boolean;
  goal: SavingsGoal | null;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const EditSavingsGoalModal: React.FC<EditSavingsGoalModalProps> = ({
  isOpen,
  goal,
  onClose,
  onShowToast,
}) => {
  const { updateSavingsGoal, deleteSavingsGoal, restoreSavingsGoal, transactions } = useFinance();
  const [goalName, setGoalName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const modalRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && goal) {
      setGoalName(goal.name);
      setTargetAmountStr(goal.target_amount ? goal.target_amount.toString() : '');
      setTargetDate(goal.target_date ? goal.target_date.substring(0, 10) : '');
      setErrorMsg(null);
      setIsSubmitting(false);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, goal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showDeleteConfirm]);

  if (!isOpen || !goal) return null;

  const hasBalance = Number(goal.current_amount) > 0;
  const hasHistory = transactions.some((t) => t.goal_id === goal.id);
  const isArchived = goal.is_active === false;

  const handleUpdate = async (e: React.FormEvent) => {
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
    const { error } = await updateSavingsGoal(goal.id, {
      name: trimmedName,
      target_amount: amount,
      target_date: targetDate || null,
    });

    setIsSubmitting(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      if (onShowToast) onShowToast(`Target "${trimmedName}" berhasil diperbarui`);
      onClose();
    }
  };

  const handleDeleteOrArchive = async () => {
    if (hasBalance) {
      setErrorMsg('Target masih memiliki saldo. Cairkan seluruh saldo ke dompet sebelum menghapus/mengarsipkan.');
      return;
    }

    setIsDeleting(true);
    const { error } = await deleteSavingsGoal(goal.id);
    setIsDeleting(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      const msg = hasHistory
        ? `Target "${goal.name}" diarsipkan karena memiliki riwayat transaksi`
        : `Target "${goal.name}" berhasil dihapus`;
      if (onShowToast) onShowToast(msg);
      onClose();
    }
  };

  const handleRestore = async () => {
    setIsSubmitting(true);
    const { error } = await restoreSavingsGoal(goal.id);
    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message);
    } else {
      if (onShowToast) onShowToast(`Target "${goal.name}" berhasil diaktifkan kembali`);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-goal-title"
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
          <div>
            <div className="flex items-center gap-2">
              <h2 id="edit-goal-title" className="text-base font-bold text-text-primary">
                Kelola Target Tabungan
              </h2>
              {isArchived && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-elevated text-text-muted border border-border-subtle font-medium">
                  Diarsipkan
                </span>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Perbarui target nominal, nama, atau status target
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors min-h-[44px] min-w-[44px]"
            aria-label="Tutup modal kelola target"
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

        {/* Form edit */}
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label htmlFor="edit-goal-name" className="text-xs font-semibold text-text-secondary block mb-1.5">
              Nama Target
            </label>
            <input
              ref={nameInputRef}
              id="edit-goal-name"
              type="text"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-border-gold-focus"
            />
          </div>

          <div>
            <label htmlFor="edit-goal-amount" className="text-xs font-semibold text-text-secondary block mb-1.5">
              Target Nominal (Rp)
            </label>
            <input
              id="edit-goal-amount"
              type="number"
              min="1000"
              step="1000"
              value={targetAmountStr}
              onChange={(e) => setTargetAmountStr(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-base font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-border-gold-focus tabular-nums"
            />
          </div>

          <div>
            <label htmlFor="edit-goal-date" className="text-xs font-semibold text-text-secondary block mb-1.5">
              Target Tanggal Tercapai (Opsional)
            </label>
            <input
              id="edit-goal-date"
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
              Tutup
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-slate-950 text-xs font-bold transition-all shadow-sm min-h-[44px] disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>

        {/* Danger zone / Archive / Restore action */}
        <div className="mt-6 pt-5 border-t border-border-subtle">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Manajemen Status
          </h3>

          {isArchived ? (
            <div className="flex items-center justify-between p-3.5 bg-surface-elevated border border-border-subtle rounded-xl">
              <div>
                <p className="text-xs font-semibold text-text-primary">Target Diarsipkan</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Aktifkan kembali target untuk melanjutkan alokasi dana tabungan.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRestore}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-lg bg-surface-elevated border border-border-gold text-text-gold hover:bg-surface-ground text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px] shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Aktifkan
              </button>
            </div>
          ) : hasBalance ? (
            <div className="p-3.5 bg-semantic-amber-soft border border-semantic-amber/20 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-semantic-amber-text shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-semantic-amber-text">
                  Tidak dapat dihapus atau diarsipkan
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Target masih menyimpan saldo sebesar{' '}
                  <span className="font-bold tabular-nums text-text-primary">
                    {formatCurrency(goal.current_amount)}
                  </span>
                  . Cairkan seluruh saldo ke dompet aktif terlebih dahulu sebelum menghapus target.
                </p>
              </div>
            </div>
          ) : showDeleteConfirm ? (
            <div className="p-4 bg-surface-elevated border border-border-default rounded-xl space-y-3 animate-in fade-in duration-150">
              <p className="text-xs font-semibold text-text-primary">
                {hasHistory
                  ? `Arsipkan target "${goal.name}"?`
                  : `Hapus permanen target "${goal.name}"?`}
              </p>
              <p className="text-xs text-text-muted">
                {hasHistory
                  ? 'Karena target ini memiliki histori pencatatan tabungan, target akan diarsipkan (is_active = false) agar riwayat transaksi dan audit trail tetap utuh.'
                  : 'Target ini belum memiliki riwayat transaksi dan akan dihapus secara permanen.'}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-2 rounded-lg border border-border-default text-xs font-semibold text-text-secondary hover:bg-surface-modal min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteOrArchive}
                  disabled={isDeleting}
                  className={`px-3 py-2 rounded-lg text-xs font-bold min-h-[44px] transition-colors ${
                    hasHistory
                      ? 'bg-surface-elevated border border-border-default text-text-secondary hover:text-text-primary'
                      : 'bg-semantic-rose text-white hover:bg-rose-700'
                  }`}
                >
                  {isDeleting
                    ? 'Memproses...'
                    : hasHistory
                    ? 'Konfirmasi Arsipkan'
                    : 'Konfirmasi Hapus'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-3.5 bg-surface-elevated border border-border-subtle rounded-xl">
              <div>
                <p className="text-xs font-semibold text-text-secondary">
                  {hasHistory ? 'Arsipkan Target' : 'Hapus Target'}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {hasHistory
                    ? 'Saldo Rp 0. Arsipkan untuk menyembunyikan dari portofolio aktif.'
                    : 'Saldo Rp 0 dan tanpa riwayat. Aman dihapus.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2 rounded-lg border border-border-default hover:border-semantic-rose/40 hover:text-semantic-rose-text text-text-muted text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px] shrink-0"
              >
                {hasHistory ? <Archive className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                {hasHistory ? 'Arsipkan' : 'Hapus'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
