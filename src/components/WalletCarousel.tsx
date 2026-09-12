import React from 'react';
import { Landmark, Smartphone, Banknote, ArrowRightLeft, Plus, Wallet as WalletIcon, MoreVertical } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/formatters';
import type { Wallet, WalletType } from '../types/database.types';

interface WalletCarouselProps {
  onOpenTransfer: () => void;
  onOpenAddWallet: () => void;
  onEditWallet: (wallet: Wallet) => void;
}

export const WalletCarousel: React.FC<WalletCarouselProps> = ({
  onOpenTransfer,
  onOpenAddWallet,
  onEditWallet,
}) => {
  const { wallets } = useFinance();

  const getWalletIcon = (type: WalletType) => {
    switch (type) {
      case 'bank':
        return <Landmark className="w-4 h-4 text-blue-600" />;
      case 'ewallet':
        return <Smartphone className="w-4 h-4 text-purple-600" />;
      case 'cash':
        return <Banknote className="w-4 h-4 text-emerald-600" />;
      default:
        return <WalletIcon className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Dompet & Rekening
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTransfer}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Transfer
          </button>
          <button
            onClick={onOpenAddWallet}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Tambah Dompet"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
        {wallets.map((wallet) => (
          <div
            key={wallet.id}
            className="snap-start flex-shrink-0 w-52 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            {/* Top row: Icon, Type & Edit Action */}
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100">
                {getWalletIcon(wallet.wallet_type)}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {wallet.wallet_type === 'cash' ? 'Tunai' : wallet.wallet_type}
                </span>
                <button
                  onClick={() => onEditWallet(wallet)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 rounded-md transition-opacity"
                  title="Edit Dompet"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Wallet Name */}
            <div className="text-xs font-medium text-slate-500 truncate" title={wallet.name}>
              {wallet.name}
            </div>

            {/* Balance */}
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {formatCurrency(wallet.balance)}
            </div>

            {/* Bottom accent stripe */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: wallet.color || '#3b82f6' }}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
