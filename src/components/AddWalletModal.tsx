import React, { useState } from 'react';
import { X, Wallet as WalletIcon } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/formatters';
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
  const [color, setColor] = useState('#B9924F');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const rawBalance = parseInt(balanceStr.replace(/\D/g, ''), 10) || 0;

  const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setBalanceStr(val ? new Intl.NumberFormat('id-ID').format(parseInt(val, 10)) : '0');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    await addWallet({
      name: name.trim(),
      wallet_type: walletType,
      balance: rawBalance,
      color,
    });
    setIsSubmitting(false);
    setName('');
    setBalanceStr('0');
    onClose();
    if (onShowToast) onShowToast('Dompet baru berhasil ditambahkan');
  };

  const colors = ['#B9924F', '#D6B875', '#6683A3', '#5F8A70', '#A85F68', '#7C8491'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-surface-modal border border-border-default w-full max-w-sm rounded-2xl sm:rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-soft text-text-gold rounded-xl">
              <WalletIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-text-primary">Tambah Dompet Baru</h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">
              Nama Dompet / Rekening
            </label>
            <input
              type="text"
              placeholder="Misal: Mandiri, OVO, Dompet Saku"
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-text-secondary">Saldo Awal</label>
              {rawBalance > 0 && (
                <span className="text-xs text-text-gold font-medium tabular-nums">
                  {formatCurrency(rawBalance)}
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
                value={balanceStr}
                onChange={handleBalanceChange}
                className="w-full pl-10 pr-4 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-base font-bold text-text-primary focus:outline-none focus:border-border-gold-focus"
              />
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-slate-950 rounded-xl font-bold text-sm shadow-sm transition-all disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Menyimpan...' : 'Tambah Dompet'}
          </button>
        </form>
      </div>
    </div>
  );
};
