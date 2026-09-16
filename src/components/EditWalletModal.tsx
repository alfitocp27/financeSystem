import React, { useState, useEffect } from 'react';
import { X, Trash2, Edit, AlertCircle, Archive } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/formatters';
import { getWalletDeletionPolicy } from '../lib/wallet-ledger-utils';
import type { Wallet, WalletType } from '../types/database.types';

interface EditWalletModalProps {
  wallet: Wallet | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const EditWalletModal: React.FC<EditWalletModalProps> = ({ wallet, isOpen, onClose, onShowToast }) => {
  const { updateWallet, deleteWallet, wallets, transactions } = useFinance();

  const [name, setName] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('bank');
  const [color, setColor] = useState('#B9924F');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null);

  useEffect(() => {
    if (wallet) {
      setName(wallet.name);
      setWalletType(wallet.wallet_type || 'bank');
      setColor(wallet.color || '#B9924F');
      setInlineError(null);
      setConfirmAction(null);
    }
  }, [wallet]);

  if (!isOpen || !wallet) return null;

  const activeWallets = wallets.filter((w) => w.is_active);
  const hasTransactions = transactions.some(
    (t) => t.wallet_id === wallet.id || (t.type === 'transfer' && t.destination_wallet_id === wallet.id)
  );
  const deletionPolicy = getWalletDeletionPolicy(wallet, hasTransactions, activeWallets.length);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setInlineError(null);

    const { error } = await updateWallet(wallet.id, {
      name: name.trim(),
      wallet_type: walletType,
      color,
    });

    setIsSubmitting(false);

    if (error) {
      setInlineError(error.message || 'Gagal memperbarui dompet.');
    } else {
      onClose();
      if (onShowToast) onShowToast('Dompet berhasil diperbarui');
    }
  };

  const handleTriggerAction = () => {
    setInlineError(null);

    if (deletionPolicy === 'cannot_delete_last') {
      setInlineError('Anda harus memiliki minimal satu akun aktif.');
      return;
    }

    if (deletionPolicy === 'cannot_delete_has_balance') {
      setInlineError(
        `Akun ini masih memiliki saldo ${formatCurrency(wallet.balance)}. Pindahkan saldo ke akun lain atau koreksi saldo ke 0 terlebih dahulu.`
      );
      return;
    }

    if (deletionPolicy === 'archive_recommended') {
      setConfirmAction('archive');
      return;
    }

    if (deletionPolicy === 'hard_delete_allowed') {
      setConfirmAction('delete');
      return;
    }
  };

  const handleConfirmExecute = async () => {
    setIsSubmitting(true);
    setInlineError(null);

    if (confirmAction === 'archive') {
      const { error } = await updateWallet(wallet.id, { is_active: false });
      setIsSubmitting(false);

      if (error) {
        setInlineError(error.message || 'Gagal mengarsipkan dompet.');
      } else {
        onClose();
        if (onShowToast) onShowToast('Dompet berhasil diarsipkan.');
      }
    } else if (confirmAction === 'delete') {
      const { error } = await deleteWallet(wallet.id);
      setIsSubmitting(false);

      if (error) {
        setInlineError(error.message || 'Gagal menghapus dompet.');
      } else {
        onClose();
        if (onShowToast) onShowToast('Dompet berhasil dihapus permanen.');
      }
    }
  };

  const colors = ['#B9924F', '#D6B875', '#6683A3', '#5F8A70', '#A85F68', '#7C8491'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-surface-modal border border-border-default w-full max-w-sm rounded-2xl sm:rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-soft text-text-gold rounded-xl">
              <Edit className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-text-primary">Edit Dompet</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-text-primary rounded-full hover:bg-surface-elevated transition-colors min-h-[44px] min-w-[44px]"
            title="Tutup"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inline Feedback / Warning */}
        {inlineError && (
          <div className="p-3 mb-4 rounded-xl bg-semantic-rose-soft border border-semantic-rose/30 text-semantic-rose-text text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{inlineError}</span>
          </div>
        )}

        {/* Inline Non-Blocking Confirmation Box */}
        {confirmAction ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-surface-elevated border border-border-subtle">
              <div className="flex items-center gap-2 text-text-gold text-xs font-bold uppercase tracking-wider mb-2">
                {confirmAction === 'archive' ? (
                  <>
                    <Archive className="w-4 h-4" />
                    <span>Arsipkan Akun</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-semantic-rose-text" />
                    <span className="text-semantic-rose-text">Hapus Akun Permanen</span>
                  </>
                )}
              </div>

              <p className="text-xs text-text-secondary leading-relaxed">
                {confirmAction === 'archive'
                  ? `Akun "${wallet.name}" memiliki riwayat transaksi. Akun akan disembunyikan dari daftar aktif tanpa menghapus riwayat buku kas masa lalu.`
                  : `Yakin ingin menghapus akun "${wallet.name}" secara permanen? Akun ini belum memiliki riwayat transaksi.`}
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 bg-surface-elevated hover:bg-surface-elevated/80 text-text-secondary border border-border-subtle rounded-xl text-xs font-semibold transition-colors min-h-[44px]"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmExecute}
                disabled={isSubmitting}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors min-h-[44px] ${
                  confirmAction === 'archive'
                    ? 'bg-primary-soft hover:bg-primary-soft/80 text-text-gold border border-border-gold'
                    : 'bg-semantic-rose-soft hover:bg-semantic-rose-soft/80 text-semantic-rose-text border border-semantic-rose/30'
                }`}
              >
                {isSubmitting
                  ? 'Memproses...'
                  : confirmAction === 'archive'
                  ? 'Ya, Arsipkan'
                  : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">
                Nama Dompet / Rekening
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:border-border-gold-focus placeholder:text-text-muted"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Tipe</label>
              <select
                value={walletType}
                onChange={(e) => setWalletType(e.target.value as WalletType)}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:border-border-gold-focus"
              >
                <option value="bank" className="bg-surface-elevated text-text-primary">
                  Rekening Bank
                </option>
                <option value="ewallet" className="bg-surface-elevated text-text-primary">
                  E-Wallet
                </option>
                <option value="cash" className="bg-surface-elevated text-text-primary">
                  Uang Tunai
                </option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">
                Saldo Saat Ini
              </label>
              <div className="w-full px-3.5 py-2.5 bg-surface-container-low border border-border-default rounded-xl text-sm font-bold flex items-center justify-between">
                <span className="text-text-primary tabular-nums">{formatCurrency(wallet.balance)}</span>
                <span className="text-xs font-normal text-text-muted">Dimutasi via transaksi</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                Warna Aksen
              </label>
              <div className="flex gap-1.5 items-center">
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-10 h-10 flex items-center justify-center rounded-full transition-transform min-h-[44px] min-w-[44px]"
                    title={`Pilih warna ${c}`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'scale-110 ring-2 ring-offset-2 ring-primary ring-offset-surface-modal' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTriggerAction}
                disabled={isSubmitting}
                className="p-3 bg-semantic-rose-soft hover:bg-semantic-rose-soft/80 text-semantic-rose-text border border-semantic-rose/20 rounded-xl transition-colors disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                title={
                  deletionPolicy === 'archive_recommended'
                    ? 'Arsipkan Dompet'
                    : 'Hapus Dompet'
                }
                aria-label="Hapus atau Arsipkan Dompet"
              >
                {deletionPolicy === 'archive_recommended' ? (
                  <Archive className="w-4 h-4" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 bg-primary hover:bg-primary-hover text-slate-950 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 min-h-[44px]"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
