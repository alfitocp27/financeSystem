import React, { useState } from 'react';
import { X, Wallet as WalletIcon } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { WalletType } from '../types/database.types';

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const AddWalletModal: React.FC<AddWalletModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const { addWallet } = useFinance();

  const [name, setName] = useState('');
  const [walletType, setWalletType] = useState<WalletType>('bank');
  const [balanceStr, setBalanceStr] = useState('0');
  const [color, setColor] = useState('#3b82f6');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    await addWallet({
      name: name.trim(),
      wallet_type: walletType,
      balance: parseInt(balanceStr, 10) || 0,
      color,
    });
    setIsSubmitting(false);
    setName('');
    setBalanceStr('0');
    onClose();
    if (onShowToast) onShowToast('Dompet baru berhasil ditambahkan');
  };

  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <WalletIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-800">Tambah Dompet Baru</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Nama Dompet / Rekening</label>
            <input
              type="text"
              placeholder="Misal: Mandiri, OVO, Dompet Saku"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Tipe</label>
            <select
              value={walletType}
              onChange={(e) => setWalletType(e.target.value as WalletType)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="bank">Rekening Bank</option>
              <option value="ewallet">E-Wallet</option>
              <option value="cash">Uang Tunai</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Saldo Awal (Rp)</label>
            <input
              type="number"
              placeholder="0"
              value={balanceStr}
              onChange={(e) => setBalanceStr(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Warna Aksen</label>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Menyimpan...' : 'Tambah Dompet'}
          </button>
        </form>
      </div>
    </div>
  );
};
