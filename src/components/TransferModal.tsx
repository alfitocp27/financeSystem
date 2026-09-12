import React, { useState } from 'react';
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

  const [fromWalletId, setFromWalletId] = useState<string>(wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState<string>(wallets[1]?.id || '');
  const [amountStr, setAmountStr] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const sourceWallet = wallets.find((w) => w.id === fromWalletId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const amount = parseInt(amountStr, 10);
    if (!amount || amount <= 0) {
      setErrorMsg('Masukkan nominal transfer yang valid');
      return;
    }

    if (!fromWalletId || !toWalletId || fromWalletId === toWalletId) {
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
      walletId: fromWalletId,
      destinationWalletId: toWalletId,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Transfer Antar Dompet</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Dari Dompet</label>
            <select
              value={fromWalletId}
              onChange={(e) => setFromWalletId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatCurrency(w.balance)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Ke Dompet Tujuan</label>
            <select
              value={toWalletId}
              onChange={(e) => setToWalletId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {wallets
                .filter((w) => w.id !== fromWalletId)
                .map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatCurrency(w.balance)})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Nominal Transfer (Rp)</label>
            <input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Catatan (Opsional)</label>
            <input
              type="text"
              placeholder="Misal: Tarik tunai dari ATM, Top up e-wallet"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Memproses...' : 'Kirim Saldo'}
          </button>
        </form>
      </div>
    </div>
  );
};
