import React from 'react';
import {
  Landmark,
  Smartphone,
  Banknote,
  ArrowRightLeft,
  Plus,
  Wallet as WalletIcon,
  MoreVertical,
} from 'lucide-react';
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
  const { wallets, totalBalance } = useFinance();

  const getWalletIcon = (type: WalletType) => {
    switch (type) {
      case 'bank':
        return <Landmark className="w-4 h-4 text-primary-600" />;
      case 'ewallet':
        return <Smartphone className="w-4 h-4 text-purple-600" />;
      case 'cash':
        return <Banknote className="w-4 h-4 text-semantic-green" />;
      default:
        return <WalletIcon className="w-4 h-4 text-text-secondary" />;
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Dompet & Rekening
          </h2>
          <span className="text-[11px] text-text-muted font-normal">
            ({wallets.length} Akun Aktif)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenTransfer}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </button>
          <button
            onClick={onOpenAddWallet}
            className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
            title="Tambah Dompet"
            aria-label="Tambah Dompet"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal scroll container with snap */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
        {wallets.map((wallet) => {
          const share = totalBalance > 0 ? Math.round((wallet.balance / totalBalance) * 100) : 0;

          return (
            <div
              key={wallet.id}
              className="snap-start flex-shrink-0 w-48 sm:w-56 bg-surface p-4 rounded-xl sm:rounded-[14px] border border-border-default shadow-sm hover:border-primary-500 transition-all relative overflow-hidden group flex flex-col justify-between"
            >
              {/* Top row: Icon, Type Tag & Edit Action */}
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                  {getWalletIcon(wallet.wallet_type)}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-bg-secondary text-text-secondary">
                    {wallet.wallet_type === 'cash' ? 'Tunai' : wallet.wallet_type}
                  </span>
                  <button
                    onClick={() => onEditWallet(wallet)}
                    className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-text-muted hover:text-text-primary rounded-md transition-all active:scale-95"
                    title="Edit Dompet"
                    aria-label="Edit Dompet"
                  >
                    <MoreVertical className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Wallet Info */}
              <div>
                <div className="text-xs font-medium text-text-secondary truncate" title={wallet.name}>
                  {wallet.name}
                </div>
                <div className="text-base sm:text-lg font-bold text-text-primary mt-0.5 tabular-nums tracking-tight">
                  {formatCurrency(wallet.balance)}
                </div>
                <div className="flex items-center justify-between text-[10px] text-text-muted mt-2 pt-2 border-t border-border-subtle">
                  <span>Porsi Saldo</span>
                  <span className="font-semibold text-text-secondary tabular-nums">{share}%</span>
                </div>
              </div>

              {/* Bottom accent stripe */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1"
                style={{ backgroundColor: wallet.color || '#3b82f6' }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};
