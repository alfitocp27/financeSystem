import React, { useState, useMemo, useCallback } from 'react';
import {
  ArrowRightLeft,
  Trash2,
  ReceiptText,
  Search,
  Download,
  X,
  Utensils,
  Home,
  Bus,
  BookOpen,
  Coffee,
  ShoppingBag,
  Tag,
  Wallet as WalletIcon,
  Briefcase,
  Award,
  Edit2,
  RotateCcw,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { Transaction } from '../types/database.types';
import { formatCurrency, formatDateIndo } from '../lib/formatters';
import {
  groupTransactionsByDate,
  formatTransactionTime,
  determineTransferDisplay,
  generateTransactionCsvRows,
} from '../lib/transaction-ledger-utils';
import { DeleteTransactionModal } from './DeleteTransactionModal';
import { EditTransactionModal } from './EditTransactionModal';

interface TransactionListProps {
  onShowToast?: (msg: string) => void;
  onOpenQuickAdd?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  onShowToast,
}) => {
  const {
    transactions,
    wallets,
    categories,
    cycleInfo,
    deleteTransaction,
    updateTransaction,
  } = useFinance();

  // Filters state
  const [filterType, setFilterType] = useState<string>('all');
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateScope, setDateScope] = useState<'cycle' | 'month' | 'all'>('cycle');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const getWalletName = useCallback(
    (walletId: string) => {
      return wallets.find((w) => w.id === walletId)?.name || 'Dompet';
    },
    [wallets]
  );

  const getCategory = useCallback(
    (catId?: string | null) => {
      return categories.find((c) => c.id === catId);
    },
    [categories]
  );

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'utensils':
        return <Utensils className="w-3.5 h-3.5" />;
      case 'home':
        return <Home className="w-3.5 h-3.5" />;
      case 'bus':
        return <Bus className="w-3.5 h-3.5" />;
      case 'book-open':
        return <BookOpen className="w-3.5 h-3.5" />;
      case 'coffee':
        return <Coffee className="w-3.5 h-3.5" />;
      case 'shopping-bag':
        return <ShoppingBag className="w-3.5 h-3.5" />;
      case 'briefcase':
        return <Briefcase className="w-3.5 h-3.5" />;
      case 'award':
        return <Award className="w-3.5 h-3.5" />;
      case 'wallet':
        return <WalletIcon className="w-3.5 h-3.5" />;
      default:
        return <Tag className="w-3.5 h-3.5" />;
    }
  };

  // Check if any filter is active
  const isFilterActive =
    filterType !== 'all' ||
    filterWallet !== 'all' ||
    filterCategory !== 'all' ||
    dateScope !== 'cycle' ||
    Boolean(searchQuery.trim());

  const handleResetFilters = () => {
    setFilterType('all');
    setFilterWallet('all');
    setFilterCategory('all');
    setDateScope('cycle');
    setSearchQuery('');
  };

  // Filtered transactions calculation
  const filteredTransactions = useMemo(() => {
    const startCycleStr = cycleInfo.startDate.toISOString().split('T')[0];
    const endCycleStr = cycleInfo.endDate.toISOString().split('T')[0];

    const now = new Date();
    const startMonthStr = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endMonthStr = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    return transactions.filter((tx) => {
      // Type filter
      if (filterType !== 'all' && tx.type !== filterType) return false;

      // Wallet filter (matches either source or destination wallet for transfers)
      if (
        filterWallet !== 'all' &&
        tx.wallet_id !== filterWallet &&
        tx.destination_wallet_id !== filterWallet
      ) {
        return false;
      }

      // Category filter
      if (filterCategory !== 'all' && tx.category_id !== filterCategory) {
        return false;
      }

      // Date scope filter
      if (dateScope === 'cycle') {
        if (tx.transaction_date < startCycleStr || tx.transaction_date > endCycleStr) return false;
      } else if (dateScope === 'month') {
        if (tx.transaction_date < startMonthStr || tx.transaction_date > endMonthStr) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const noteMatch = tx.note?.toLowerCase().includes(q);
        const catMatch = getCategory(tx.category_id)?.name.toLowerCase().includes(q);
        const walletMatch = getWalletName(tx.wallet_id).toLowerCase().includes(q);
        if (!noteMatch && !catMatch && !walletMatch) return false;
      }

      return true;
    });
  }, [
    transactions,
    filterType,
    filterWallet,
    filterCategory,
    dateScope,
    searchQuery,
    cycleInfo,
    getCategory,
    getWalletName,
  ]);

  // Date grouping calculation
  const dateGroups = useMemo(() => {
    return groupTransactionsByDate(filteredTransactions);
  }, [filteredTransactions]);

  // Export CSV strictly follows active filters with UTF-8 BOM (\uFEFF)
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      if (onShowToast) onShowToast('Tidak ada transaksi untuk diekspor.');
      return;
    }

    const { csvContent } = generateTransactionCsvRows(
      filteredTransactions,
      (catId) => getCategory(catId)?.name || '',
      getWalletName
    );

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `transaksi_sakumhs_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) onShowToast('Laporan transaksi terfilter berhasil diunduh (CSV).');
  };

  // Safe delete handler via modal
  const handleConfirmDelete = async (id: string) => {
    const { error } = await deleteTransaction(id);
    if (error) {
      throw error;
    }
    if (onShowToast) onShowToast('Transaksi berhasil dihapus.');
  };

  return (
    <div className="space-y-4">
      {/* 1. MASTER LEDGER CONTAINER */}
      <section
        aria-label="Buku Kas Riwayat Transaksi"
        className="bg-surface border border-border-default rounded-xl sm:rounded-2xl overflow-hidden"
      >
        {/* Header & Utility Actions */}
        <div className="px-5 sm:px-6 py-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border-subtle flex items-center justify-center text-text-gold">
                <ReceiptText className="w-4 h-4" />
              </div>
              <h2 className="text-sm sm:text-base font-bold text-text-primary tracking-tight">
                Riwayat Transaksi
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-elevated text-text-muted border border-border-subtle tabular-nums">
                {filteredTransactions.length}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Catatan mutasi pemasukan, pengeluaran, dan transfer saldo antar-rekening.
            </p>
          </div>

          {/* Secondary Utility: Export CSV (Filtered dataset) */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-semibold transition-colors min-h-[44px]"
              title="Unduh laporan transaksi terfilter dalam format CSV untuk Excel"
              aria-label="Unduh laporan transaksi CSV"
            >
              <Download className="w-3.5 h-3.5 text-text-gold" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Integrated Filter Toolbar (Flat, No Popup Box) */}
        <div className="p-4 sm:p-5 border-b border-border-subtle space-y-3 bg-surface">
          {/* Row 1: Search & Type Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Cari catatan, makanan, toko, rekening..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary rounded-lg transition-colors"
                  title="Hapus pencarian"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type Segmented Tabs */}
            <div className="flex items-center gap-1 p-1 bg-surface-elevated border border-border-subtle rounded-xl text-xs shrink-0">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'expense', label: 'Keluar' },
                { id: 'income', label: 'Masuk' },
                { id: 'transfer', label: 'Transfer' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={`px-3 py-2 rounded-lg font-semibold transition-colors min-h-[36px] ${
                    filterType === tab.id
                      ? 'bg-primary-soft text-text-gold border border-border-gold shadow-xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Scope Selectors (Periode, Dompet, Kategori, Reset) */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Periode */}
            <select
              value={dateScope}
              onChange={(e) => setDateScope(e.target.value as any)}
              aria-label="Filter Periode"
              className="px-3 py-2 bg-surface-elevated border border-border-default rounded-xl text-xs text-text-secondary font-medium focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
            >
              <option value="cycle">
                Siklus Aktif ({formatDateIndo(cycleInfo.startDate)} – {formatDateIndo(cycleInfo.endDate)})
              </option>
              <option value="month">Bulan Kalender Ini</option>
              <option value="all">Semua Riwayat</option>
            </select>

            {/* Dompet (Includes archived wallets with label) */}
            <select
              value={filterWallet}
              onChange={(e) => setFilterWallet(e.target.value)}
              aria-label="Filter Dompet"
              className="px-3 py-2 bg-surface-elevated border border-border-default rounded-xl text-xs text-text-secondary font-medium focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
            >
              <option value="all">Semua Dompet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                  {w.is_active === false ? ' (Diarsipkan)' : ''}
                </option>
              ))}
            </select>

            {/* Kategori */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              aria-label="Filter Kategori"
              className="px-3 py-2 bg-surface-elevated border border-border-default rounded-xl text-xs text-text-secondary font-medium focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type === 'income' ? 'Masuk' : 'Keluar'})
                </option>
              ))}
            </select>

            {/* Reset Button */}
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-gold hover:underline transition-colors min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. TRANSACTION ROWS / EMPTY STATES */}
        {filteredTransactions.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border-subtle flex items-center justify-center mx-auto text-text-muted">
              <ReceiptText className="w-6 h-6" />
            </div>

            {transactions.length === 0 ? (
              <>
                <h3 className="text-sm font-semibold text-text-primary">
                  Belum Ada Transaksi
                </h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  Mulai catat pengeluaran atau pemasukan pertamamu melalui tombol Catat Transaksi.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-sm font-semibold text-text-primary">
                  Tidak ada transaksi yang cocok dengan filter ini.
                </h3>
                <p className="text-xs text-text-muted max-w-sm mx-auto">
                  Coba ubah kata kunci pencarian atau sesuaikan opsi filter di atas.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-xs font-semibold text-text-primary min-h-[44px]"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-text-gold" />
                  <span>Reset Filter</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {dateGroups.map((group) => (
              <div key={group.date} className="bg-surface">
                {/* Date Group Header */}
                <div className="px-5 sm:px-6 py-2.5 bg-surface-elevated/50 border-y border-border-subtle flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary">{group.label}</span>
                    <span className="text-text-muted hidden sm:inline">
                      · {formatDateIndo(group.date)}
                    </span>
                  </div>

                  {/* Daily Subtotal (Excludes transfers) */}
                  <div className="flex items-center gap-3 font-semibold tabular-nums">
                    {group.dailyExpenseTotal > 0 && (
                      <span className="text-semantic-rose-text">
                        Belanja: -{formatCurrency(group.dailyExpenseTotal)}
                      </span>
                    )}
                    {group.dailyIncomeTotal > 0 && (
                      <span className="text-semantic-green-text">
                        Masuk: +{formatCurrency(group.dailyIncomeTotal)}
                      </span>
                    )}
                    {group.dailyExpenseTotal === 0 && group.dailyIncomeTotal === 0 && group.hasTransfers && (
                      <span className="text-text-muted">Mutasi Antar-Dompet</span>
                    )}
                  </div>
                </div>

                {/* Group Items */}
                <div className="divide-y divide-border-subtle">
                  {group.transactions.map((tx) => {
                    const category = getCategory(tx.category_id);
                    const sourceWalletName = getWalletName(tx.wallet_id);
                    const destWalletName = tx.destination_wallet_id
                      ? getWalletName(tx.destination_wallet_id)
                      : null;
                    const timeFormatted = formatTransactionTime(tx.created_at);
                    const formattedAmount = formatCurrency(tx.amount);

                    // Directional transfer calculations
                    const transferInfo =
                      tx.type === 'transfer'
                        ? determineTransferDisplay(
                            tx,
                            filterWallet,
                            sourceWalletName,
                            destWalletName || 'Tujuan',
                            formattedAmount
                          )
                        : null;

                    // Display description
                    const displayDescription =
                      tx.note ||
                      (tx.type === 'transfer'
                        ? transferInfo?.description || 'Transfer Saldo'
                        : category?.name || 'Transaksi');

                    // Display wallet channel
                    let displayWalletChannel = sourceWalletName;
                    if (tx.type === 'transfer') {
                      if (filterWallet === 'all') {
                        displayWalletChannel = `${sourceWalletName} ➔ ${destWalletName || 'Tujuan'}`;
                      } else if (filterWallet === tx.wallet_id) {
                        displayWalletChannel = `Ke ${destWalletName || 'Tujuan'}`;
                      } else if (filterWallet === tx.destination_wallet_id) {
                        displayWalletChannel = `Dari ${sourceWalletName}`;
                      }
                    }

                    // Display amount sign and color
                    let amountSign = '';
                    let amountColorClass = 'text-text-primary';
                    if (tx.type === 'income') {
                      amountSign = '+ ';
                      amountColorClass = 'text-semantic-green-text';
                    } else if (tx.type === 'expense') {
                      amountSign = '- ';
                      amountColorClass = 'text-semantic-rose-text';
                    } else if (transferInfo) {
                      amountSign = transferInfo.sign;
                      amountColorClass = transferInfo.colorClass;
                    }

                    // Screen reader accessible announcement
                    const accessibleAnnouncement =
                      tx.type === 'transfer'
                        ? `${transferInfo?.accessibleText || 'Transfer'}, tanggal ${formatDateIndo(tx.transaction_date)}${timeFormatted ? ` jam ${timeFormatted}` : ''}`
                        : `${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} ${displayDescription}, ${tx.type === 'income' ? 'bertambah' : 'berkurang'} ${formattedAmount}, dompet ${sourceWalletName}, tanggal ${formatDateIndo(tx.transaction_date)}${timeFormatted ? ` jam ${timeFormatted}` : ''}`;

                    return (
                      <div
                        key={tx.id}
                        aria-label={accessibleAnnouncement}
                        className="px-5 sm:px-6 py-3.5 hover:bg-surface-elevated/30 transition-colors"
                      >
                        {/* Accessible screen reader summary */}
                        <span className="sr-only">{accessibleAnnouncement}</span>

                        {/* A. DESKTOP VIEW (Tabular Aligned Columns) */}
                        <div className="hidden sm:grid grid-cols-[70px_1fr_170px_170px_150px_90px] items-center gap-4 text-xs">
                          {/* Col 1: Time */}
                          <div className="text-text-muted tabular-nums">
                            {timeFormatted || '—'}
                          </div>

                          {/* Col 2: Description & Note */}
                          <div className="min-w-0 pr-2">
                            <div className="font-semibold text-text-primary truncate" title={displayDescription}>
                              {displayDescription}
                            </div>
                          </div>

                          {/* Col 3: Category */}
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                tx.type === 'income'
                                  ? 'bg-semantic-green-soft text-semantic-green'
                                  : tx.type === 'expense'
                                  ? 'bg-semantic-rose-soft text-semantic-rose'
                                  : 'bg-primary-soft text-text-gold'
                              }`}
                            >
                              {tx.type === 'transfer' ? (
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              ) : (
                                getCategoryIcon(category?.icon)
                              )}
                            </div>
                            <span className="text-text-secondary truncate">
                              {category?.name || (tx.type === 'transfer' ? 'Transfer' : 'Umum')}
                            </span>
                          </div>

                          {/* Col 4: Wallet Channel */}
                          <div className="text-text-muted truncate" title={displayWalletChannel}>
                            {displayWalletChannel}
                          </div>

                          {/* Col 5: Amount */}
                          <div
                            className={`font-bold text-right tabular-nums ${amountColorClass}`}
                            aria-label={`${amountSign ? (amountSign.trim() === '+' ? 'plus' : 'minus') : 'nominal'} ${formattedAmount}`}
                          >
                            {amountSign}
                            {formattedAmount}
                          </div>

                          {/* Col 6: Actions (Always discoverable) */}
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingTx(tx)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors min-h-[44px] min-w-[44px]"
                              title="Edit catatan atau kategori"
                              aria-label={`Edit transaksi ${displayDescription}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingTx(tx)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:text-semantic-rose-text hover:bg-semantic-rose-soft transition-colors min-h-[44px] min-w-[44px]"
                              title="Hapus transaksi"
                              aria-label={`Hapus transaksi ${displayDescription}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* B. MOBILE VIEW (2-Tier Compact Ledger Row) */}
                        <div className="sm:hidden space-y-1.5">
                          {/* Row 1: Description & Amount */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="font-semibold text-xs text-text-primary truncate">
                              {displayDescription}
                            </div>
                            <div
                              className={`font-bold text-xs tabular-nums shrink-0 ${amountColorClass}`}
                            >
                              {amountSign}
                              {formattedAmount}
                            </div>
                          </div>

                          {/* Row 2: Category · Wallet & Actions */}
                          <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
                            <div className="truncate flex items-center gap-1.5 min-w-0">
                              <span>
                                {category?.name || (tx.type === 'transfer' ? 'Transfer' : 'Umum')}
                              </span>
                              <span>·</span>
                              <span className="truncate">{displayWalletChannel}</span>
                              {timeFormatted && (
                                <>
                                  <span>·</span>
                                  <span className="tabular-nums">{timeFormatted}</span>
                                </>
                              )}
                            </div>

                            {/* Mobile Actions */}
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setEditingTx(tx)}
                                className="p-2 text-text-muted hover:text-text-primary rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="Edit"
                                aria-label={`Edit transaksi ${displayDescription}`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeletingTx(tx)}
                                className="p-2 text-text-muted hover:text-semantic-rose-text rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                                title="Hapus"
                                aria-label={`Hapus transaksi ${displayDescription}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. CONFIRMATION & EDIT MODALS */}
      <DeleteTransactionModal
        isOpen={Boolean(deletingTx)}
        transaction={deletingTx}
        wallets={wallets}
        categories={categories}
        onClose={() => setDeletingTx(null)}
        onConfirm={handleConfirmDelete}
      />

      <EditTransactionModal
        isOpen={Boolean(editingTx)}
        transaction={editingTx}
        wallets={wallets}
        categories={categories}
        onClose={() => setEditingTx(null)}
        onSave={updateTransaction}
        onShowToast={onShowToast}
      />
    </div>
  );
};
