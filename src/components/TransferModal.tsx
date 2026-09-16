import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/formatters';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const { wallets, addTransaction } = useFinance();

  const activeWallets = wallets.filter((w) => w.is_active);

  const [fromWalletId, setFromWalletId] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeWallets.length > 0) {
      setFromWalletId(activeWallets[0].id);
      if (activeWallets.length > 1) {
        setToWalletId(activeWallets[1].id);
      } else {
        setToWalletId('');
      }
      setAmountStr('');
      setNote('');
      setErrorMsg(null);
    }
  }, [isOpen, activeWallets]);

  if (!isOpen) return null;

  const effectiveFromId = fromWalletId || activeWallets[0]?.id || '';
  const effectiveToId = toWalletId || activeWallets.find((w) => w.id !== effectiveFromId)?.id || '';
  const sourceWallet = activeWallets.find((w) => w.id === effectiveFromId);

  const rawAmount = parseInt(amountStr.replace(/\D/g, ''), 10) || 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setAmountStr(val ? new Intl.NumberFormat('id-ID').format(parseInt(val, 10)) : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!rawAmount || rawAmount <= 0) {
      setErrorMsg('Masukkan nominal transfer yang valid.');
      return;
    }

    if (!effectiveFromId || !effectiveToId || effectiveFromId === effectiveToId) {
      setErrorMsg('Pilih dompet asal dan dompet tujuan yang berbeda.');
      return;
    }

    if (sourceWallet && sourceWallet.balance < rawAmount) {
      setErrorMsg(`Saldo dompet asal tidak mencukupi (${formatCurrency(sourceWallet.balance)}).`);
      return;
    }

    setIsSubmitting(true);
    const { error } = await addTransaction({
      type: 'transfer',
      amount: rawAmount,
      walletId: effectiveFromId,
      destinationWalletId: effectiveToId,
      note: note.trim() || 'Transfer Antar Dompet',
    });
    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || 'Gagal melakukan transfer.');
    } else {
      setAmountStr('');
      setNote('');
      onClose();
      if (onShowToast) onShowToast('Transfer antar dompet berhasil diproses');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-surface-modal border border-border-default w-full max-w-md rounded-2xl sm:rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-soft text-text-gold rounded-xl">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-text-primary">Transfer Antar Dompet</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-text-primary rounded-full hover:bg-surface-elevated transition-colors min-h-[44px] min-w-[44px]"
            title="Tutup"
            aria-label="Tutup modal transfer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeWallets.length < 2 ? (
          <div className="py-6 text-center text-xs text-text-muted space-y-3">
            <p>Anda membutuhkan minimal 2 akun aktif untuk melakukan transfer antar-dompet.</p>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-elevated text-text-primary rounded-xl text-xs font-semibold min-h-[44px]"
            >
              Kembali
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Dari Dompet</label>
              <select
                value={effectiveFromId}
                onChange={(e) => setFromWalletId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:border-border-gold-focus"
              >
                {activeWallets.map((w) => (
                  <option key={w.id} value={w.id} className="bg-surface-elevated text-text-primary">
                    {w.name} ({formatCurrency(w.balance)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Ke Dompet Tujuan</label>
              <select
                value={effectiveToId}
                onChange={(e) => setToWalletId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:border-border-gold-focus"
              >
                {activeWallets
                  .filter((w) => w.id !== effectiveFromId)
                  .map((w) => (
                    <option key={w.id} value={w.id} className="bg-surface-elevated text-text-primary">
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-text-secondary">Nominal Transfer</label>
                {rawAmount > 0 && (
                  <span className="text-xs text-text-gold font-medium tabular-nums">
                    {formatCurrency(rawAmount)}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-text-muted">
                  Rp
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={amountStr}
                  onChange={handleAmountChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-lg font-bold text-text-primary focus:outline-none focus:border-border-gold-focus"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">Catatan (Opsional)</label>
              <input
                type="text"
                placeholder="Misal: Tarik tunai dari ATM, Top up e-wallet"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-sm text-text-primary focus:outline-none focus:border-border-gold-focus placeholder:text-text-muted"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-semantic-rose-soft border border-semantic-rose/20 rounded-xl text-xs text-semantic-rose-text font-medium">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-slate-950 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 min-h-[44px]"
            >
              {isSubmitting ? 'Memproses...' : 'Kirim Saldo'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
