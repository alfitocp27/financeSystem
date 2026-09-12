import React, { useState } from 'react';
import { X, ArrowDownRight, ArrowUpRight, ArrowRightLeft, Check, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { TransactionType } from '../types/database.types';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const { wallets, categories, addTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [walletId, setWalletId] = useState<string>(wallets[0]?.id || '');
  const [destinationWalletId, setDestinationWalletId] = useState<string>(wallets[1]?.id || '');
  const [categoryId, setCategoryId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter categories by type
  const filteredCategories = categories.filter((c) => c.type === type);

  // Set default category if not set
  if (!categoryId && filteredCategories.length > 0 && type !== 'transfer') {
    setCategoryId(filteredCategories[0].id);
  }

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseInt(amountStr || '0', 10) || 0;
    setAmountStr((current + addValue).toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numericAmount = parseInt(amountStr, 10);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Masukkan nominal yang valid');
      return;
    }

    if (!walletId) {
      setErrorMsg('Pilih dompet sumber');
      return;
    }

    if (type === 'transfer') {
      if (!destinationWalletId || destinationWalletId === walletId) {
        setErrorMsg('Pilih dompet tujuan yang berbeda dari dompet sumber');
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await addTransaction({
      type,
      amount: numericAmount,
      walletId,
      categoryId: type !== 'transfer' ? categoryId : undefined,
      destinationWalletId: type === 'transfer' ? destinationWalletId : undefined,
      note: note.trim() || undefined,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || 'Gagal mencatat transaksi');
    } else {
      // Reset form & close
      setAmountStr('');
      setNote('');
      onClose();
      if (onShowToast) {
        onShowToast(
          type === 'expense'
            ? 'Pengeluaran berhasil dicatat'
            : type === 'income'
            ? 'Pemasukan berhasil ditambahkan'
            : 'Transfer saldo berhasil'
        );
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <h2 className="text-lg font-bold text-slate-800">Catat Transaksi</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => {
              setType('expense');
              setCategoryId('');
            }}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" /> Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => {
              setType('income');
              setCategoryId('');
            }}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> Pemasukan
          </button>
          <button
            type="button"
            onClick={() => setType('transfer')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              type === 'transfer'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" /> Transfer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Nominal (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                Rp
              </span>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="0"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                autoFocus
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            {/* Quick Increment Chips */}
            <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
              {[10000, 20000, 50000, 100000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap"
                >
                  <Plus className="w-3 h-3" />
                  {val >= 1000 ? `${val / 1000}rb` : val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmountStr('')}
                className="px-2.5 py-1 text-slate-400 hover:text-slate-600 text-xs font-medium rounded-lg"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Wallets selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                {type === 'transfer' ? 'Dari Dompet' : 'Dompet / Akun'}
              </label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Rp {w.balance.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' && (
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">
                  Ke Dompet Tujuan
                </label>
                <select
                  value={destinationWalletId}
                  onChange={(e) => setDestinationWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {wallets
                    .filter((w) => w.id !== walletId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} (Rp {w.balance.toLocaleString('id-ID')})
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          {/* Categories selection (if not transfer) */}
          {type !== 'transfer' && (
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">
                Kategori
              </label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                {filteredCategories.map((cat) => {
                  const isSelected = categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-900'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                      {isSelected && <Check className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note Input */}
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">
              Catatan Singkat (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Makan siang warteg, beli kuota, dll."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
        </form>
      </div>
    </div>
  );
};
