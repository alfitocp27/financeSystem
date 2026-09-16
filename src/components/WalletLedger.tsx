import React, { useState, useMemo } from 'react';
import {
  Landmark,
  Smartphone,
  Banknote,
  ArrowRightLeft,
  Plus,
  Wallet as WalletIcon,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  Archive,
  RotateCcw,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatRelativeDate } from '../lib/formatters';
import {
  calculateLiquidityShare,
  calculateTotalPositiveBalance,
  filterAccountActivity,
  determineActivityDirection,
} from '../lib/wallet-ledger-utils';
import type { Wallet, WalletType } from '../types/database.types';

interface WalletLedgerProps {
  onOpenTransfer: () => void;
  onOpenAddWallet: () => void;
  onEditWallet: (wallet: Wallet) => void;
  onSelectTab?: (tab: any) => void;
}

export const WalletLedger: React.FC<WalletLedgerProps> = ({
  onOpenTransfer,
  onOpenAddWallet,
  onEditWallet,
  onSelectTab,
}) => {
  const { wallets, totalBalance, transactions, updateWallet } = useFinance();
  const [selectedWalletId, setSelectedWalletId] = useState<string | 'all'>('all');
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const activeWallets = useMemo(() => wallets.filter((w) => w.is_active), [wallets]);
  const archivedWallets = useMemo(() => wallets.filter((w) => !w.is_active), [wallets]);
  const totalPositiveBalance = useMemo(
    () => calculateTotalPositiveBalance(activeWallets),
    [activeWallets]
  );

  const getWalletIcon = (type: WalletType) => {
    switch (type) {
      case 'bank':
        return <Landmark className="w-4 h-4 text-text-gold" />;
      case 'ewallet':
        return <Smartphone className="w-4 h-4 text-text-gold" />;
      case 'cash':
        return <Banknote className="w-4 h-4 text-text-gold" />;
      default:
        return <WalletIcon className="w-4 h-4 text-text-secondary" />;
    }
  };

  const getWalletTypeLabel = (type: WalletType) => {
    switch (type) {
      case 'bank':
        return 'Rekening Bank';
      case 'ewallet':
        return 'E-Wallet';
      case 'cash':
        return 'Uang Tunai';
      default:
        return type;
    }
  };

  const accountActivities = useMemo(() => {
    return filterAccountActivity(transactions, selectedWalletId, 15);
  }, [transactions, selectedWalletId]);

  return (
    <div className="space-y-6">
      {/* 1. MASTER LIQUIDITY STRIP */}
      <section
        aria-label="Ringkasan Likuiditas Kas"
        className="bg-surface border border-border-default rounded-xl sm:rounded-2xl p-6 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Headline & Net Liquidity Anchor */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Dompet & Rekening
              </span>
              <span className="text-xs text-text-muted">·</span>
              <span className="text-xs text-text-muted font-normal">
                {activeWallets.length} Akun Aktif
              </span>
            </div>
            <div className="text-xs text-text-muted font-medium">Total Kas Tersedia</div>
            <div className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight tabular-nums mt-0.5">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-text-muted mt-1.5 font-normal">
              Saldo riil yang dapat dialokasikan untuk kebutuhan harian dan tagihan berjalan.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2.5 sm:self-end lg:self-center shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={onOpenTransfer}
              disabled={activeWallets.length < 2}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-text-gold bg-primary-soft hover:bg-primary-soft/80 border border-border-gold transition-colors active:scale-95 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
              title={
                activeWallets.length < 2
                  ? 'Butuh minimal 2 dompet untuk transfer'
                  : 'Transfer Antar Dompet'
              }
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transfer</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddWallet}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary hover:text-text-primary bg-surface-elevated hover:bg-surface-elevated/80 border border-border-default transition-colors active:scale-95 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Akun</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. FLAT ACCOUNT LEDGER */}
      <section
        aria-label="Daftar Akun dan Rekening"
        className="bg-surface border border-border-default rounded-xl sm:rounded-2xl overflow-hidden"
      >
        <div className="px-6 sm:px-8 py-3.5 border-b border-border-subtle bg-surface-elevated/30 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Daftar Akun & Saldo
          </h3>
          <span className="text-xs text-text-muted">
            {activeWallets.length} Akun Terdaftar
          </span>
        </div>

        {activeWallets.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border-subtle text-text-muted flex items-center justify-center mx-auto mb-3">
              <WalletIcon className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-text-primary">Belum ada akun aktif</h4>
            <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
              Tambahkan akun pertamamu (misal: Rekening Bank atau Dompet Tunai) untuk mulai mencatat saldo.
            </p>
            <button
              type="button"
              onClick={onOpenAddWallet}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-slate-950 font-bold text-xs rounded-xl transition-colors min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Akun Pertama</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {activeWallets.map((wallet) => {
              const isNegative = wallet.balance < 0;
              const share = isNegative
                ? 0
                : calculateLiquidityShare(wallet.balance, totalPositiveBalance);
              const visualProgressWidth = Math.min(100, Math.max(0, share));

              return (
                <div
                  key={wallet.id}
                  className="px-6 sm:px-8 py-4 space-y-3 hover:bg-surface-elevated/20 transition-colors"
                >
                  {/* Top: Account Identification & Balance/Actions */}
                  <div className="flex items-center justify-between gap-4">
                    {/* Account Identification */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-center shrink-0">
                        {getWalletIcon(wallet.wallet_type)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-text-primary truncate" title={wallet.name}>
                          {wallet.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-text-muted font-medium">
                            {getWalletTypeLabel(wallet.wallet_type)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Balance & Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div
                          className={`text-base sm:text-lg font-bold tabular-nums tracking-tight ${
                            isNegative ? 'text-semantic-rose-text' : 'text-text-primary'
                          }`}
                        >
                          {formatCurrency(wallet.balance)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onEditWallet(wallet)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-semibold transition-colors min-h-[44px] min-w-[44px]"
                        title={`Ubah dompet ${wallet.name}`}
                        aria-label={`Ubah ${wallet.name}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Ubah</span>
                      </button>
                    </div>
                  </div>

                  {/* Shared Full-Width Liquidity / Status Section */}
                  <div className="w-full">
                    {isNegative ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-text-muted">Status</span>
                        <span className="font-medium text-semantic-rose-text">
                          Saldo Defisit
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between text-xs text-text-muted">
                          <span>Porsi Dana Tersedia</span>
                          <span className="font-semibold text-text-secondary tabular-nums">
                            {share}%
                          </span>
                        </div>

                        <div className="mt-2 h-2 w-full bg-[#1C2029] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${visualProgressWidth}%` }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Archived Wallets Accordion */}
        {archivedWallets.length > 0 && (
          <div className="border-t border-border-subtle bg-surface-elevated/10">
            <button
              type="button"
              onClick={() => setShowArchived(!showArchived)}
              className="w-full px-6 sm:px-8 py-3.5 flex items-center justify-between text-xs font-medium text-text-muted hover:text-text-secondary transition-colors min-h-[44px]"
            >
              <div className="flex items-center gap-2">
                <Archive className="w-3.5 h-3.5 text-text-muted" />
                <span>Akun Terarsip ({archivedWallets.length})</span>
              </div>
              <span>{showArchived ? 'Sembunyikan' : 'Tampilkan'}</span>
            </button>

            {showArchived && (
              <div className="divide-y divide-border-subtle">
                {archivedWallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className="px-6 sm:px-8 py-4 flex items-center justify-between gap-4 text-xs text-text-muted hover:bg-surface-elevated/20 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-center shrink-0 opacity-60">
                        {getWalletIcon(wallet.wallet_type)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-text-muted truncate">
                          {wallet.name}
                        </div>
                        <div className="text-xs text-text-muted">
                          {getWalletTypeLabel(wallet.wallet_type)} · Diarsipkan
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-base font-bold text-text-muted tabular-nums">
                        {formatCurrency(wallet.balance)}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateWallet(wallet.id, { is_active: true })}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-semibold transition-colors min-h-[44px]"
                        title="Pulihkan Akun"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Pulihkan</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* 3. MUTASI REKENING (ACCOUNT-SCOPED ACTIVITY) */}
      <section
        aria-label="Mutasi Rekening"
        className="bg-surface border border-border-default rounded-xl sm:rounded-2xl p-6 sm:p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
              Mutasi Rekening Terkini
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Riwayat aliran dana dan mutasi transfer untuk akun yang dipilih.
            </p>
          </div>

          {onSelectTab && (
            <button
              type="button"
              onClick={() => onSelectTab('transactions')}
              className="text-xs font-medium text-text-gold hover:underline self-start sm:self-auto py-1 min-h-[44px] flex items-center"
            >
              Buka Semua Transaksi →
            </button>
          )}
        </div>

        {/* Account Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
          <button
            type="button"
            onClick={() => setSelectedWalletId('all')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[44px] ${
              selectedWalletId === 'all'
                ? 'bg-primary-soft text-text-gold border border-border-gold'
                : 'bg-surface-elevated text-text-muted hover:text-text-primary border border-border-subtle'
            }`}
          >
            Semua Akun
          </button>

          {activeWallets.map((wallet) => (
            <button
              key={wallet.id}
              type="button"
              onClick={() => setSelectedWalletId(wallet.id)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[44px] ${
                selectedWalletId === wallet.id
                  ? 'bg-primary-soft text-text-gold border border-border-gold'
                  : 'bg-surface-elevated text-text-muted hover:text-text-primary border border-border-subtle'
              }`}
            >
              {wallet.name}
            </button>
          ))}
        </div>

        {/* Activity Feed */}
        {accountActivities.length === 0 ? (
          <div className="py-8 text-center text-xs text-text-muted border border-dashed border-border-subtle rounded-xl">
            Belum ada mutasi transaksi pada akun ini.
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {accountActivities.map((tx) => {
              const dirInfo = determineActivityDirection(tx, selectedWalletId, wallets);

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        dirInfo.direction === 'inflow'
                          ? 'bg-semantic-green-soft text-semantic-green border-semantic-green/20'
                          : dirInfo.direction === 'transfer_neutral'
                          ? 'bg-surface-elevated text-text-gold border-border-subtle'
                          : 'bg-surface-elevated text-text-muted border-border-subtle'
                      }`}
                    >
                      {dirInfo.direction === 'inflow' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : dirInfo.direction === 'transfer_neutral' ? (
                        <ArrowRightLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-text-primary truncate">
                        {dirInfo.label}
                      </div>
                      <div className="text-xs text-text-muted">
                        {formatRelativeDate(tx.transaction_date)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-xs sm:text-sm font-bold tabular-nums ${
                        dirInfo.direction === 'inflow'
                          ? 'text-semantic-green'
                          : dirInfo.direction === 'transfer_neutral'
                          ? 'text-text-gold'
                          : 'text-text-primary'
                      }`}
                    >
                      {dirInfo.sign} {formatCurrency(tx.amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
