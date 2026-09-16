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

  const [fromWalletId, setFromWalletId] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && wallets.length > 0) {
      setFromWalletId(wallets[0].id);
      if (wallets.length > 1) {
        setToWalletId(wallets[1].id);
      } else {
        setToWalletId('');
      }
      setAmountStr('');
      setNote('');
      setErrorMsg(null);
    }
  }, [isOpen, wallets]);

  if (!isOpen) return null;

  const effectiveFromId = fromWalletId || wallets[0]?.id || '';
  const effectiveToId = toWalletId || wallets.find(w => w.id !== effectiveFromId)?.id || '';
  const sourceWallet = wallets.find((w) => w.id === effectiveFromId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const amount = parseInt(amountStr, 10);
    if (!amount || amount <= 0) {
      setErrorMsg('Masukkan nominal transfer yang valid');
      return;
    }

    if (!effectiveFromId || !effectiveToId || effectiveFromId === effectiveToId) {
      setErrorMsg('Pilih dompet asal dan dompet tujuan yang berbeda');
      return;
    }

    if (sourceWallet && sourceWallet.balance < amount) {
      setErrorMsg(`Saldo dompet asal tidak mencukupi (${formatCurrency(sourceWallet.balance)})`);
      return;
    }

    setIsSubmitting(true);
    const { error } = await addTransaction({
      type: 'transfer',
      amount,
      walletId: effectiveFromId,
      destinationWalletId: effectiveToId,
      note: note.trim() || 'Transfer Antar Dompet',
    });
    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || 'Gagal melakukan transfer');
    } else {
      setAmountStr('');
      setNote('');
      onClose();
      if (onShowToast) onShowToast('Transfer antar dompet berhasil diproses');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-surface-modal border border-border-default w-full max-w-md rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-soft text-text-gold rounded-xl">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-text-primary">Transfer Antar Dompet</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Dari Dompet</label>
            <select
              value={effectiveFromId}
              onChange={(e) => setFromWalletId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:border-border-gold-focus"
            >
              {wallets.map((w) => (
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
              {wallets
                .filter((w) => w.id !== effectiveFromId)
                .map((w) => (
                  <option key={w.id} value={w.id} className="bg-surface-elevated text-text-primary">
                    {w.name} ({formatCurrency(w.balance)})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Nominal Transfer (Rp)</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full px-4 py-3 bg-surface-elevated border border-border-default rounded-xl text-xl font-bold text-text-primary focus:outline-none focus:border-border-gold-focus"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Catatan (Opsional)</label>
            <input
              type="text"
              placeholder="Misal: Tarik tunai dari ATM, Top up e-wallet"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 bg-surface-elevated border border-border-default rounded-xl text-sm text-text-primary focus:outline-none focus:border-border-gold-focus placeholder:text-text-muted"
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
      </div>
    </div>
  );
};
