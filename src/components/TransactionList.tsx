import React, { useState, useMemo, useCallback } from 'react';
import {
  ArrowRightLeft,
  Trash2,
  ReceiptText,
  Search,
  Download,
  Filter,
  X,
  Plus,
  Utensils,
  Home,
  Bus,
  BookOpen,
  Coffee,
  ShoppingBag,
  Tag,
  Wallet,
  Briefcase,
  Award,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatRelativeDate, formatDateIndo } from '../lib/formatters';

interface TransactionListProps {
  onShowToast?: (msg: string) => void;
  onOpenQuickAdd?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  onShowToast,
  onOpenQuickAdd,
}) => {
  const { transactions, wallets, categories, cycleInfo, deleteTransaction } = useFinance();

  const [filterType, setFilterType] = useState<string>('all');
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [dateScope, setDateScope] = useState<'cycle' | 'month' | 'all'>('cycle');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const getWalletName = useCallback((walletId: string) => {
    return wallets.find((w) => w.id === walletId)?.name || 'Dompet';
  }, [wallets]);

  const getCategory = useCallback((catId?: string | null) => {
    return categories.find((c) => c.id === catId);
  }, [categories]);

  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'utensils':
        return <Utensils className="w-4 h-4" />;
      case 'home':
        return <Home className="w-4 h-4" />;
      case 'bus':
        return <Bus className="w-4 h-4" />;
      case 'book-open':
        return <BookOpen className="w-4 h-4" />;
      case 'coffee':
        return <Coffee className="w-4 h-4" />;
      case 'shopping-bag':
        return <ShoppingBag className="w-4 h-4" />;
      case 'briefcase':
        return <Briefcase className="w-4 h-4" />;
      case 'award':
        return <Award className="w-4 h-4" />;
      case 'wallet':
        return <Wallet className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
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

      // Wallet filter
      if (filterWallet !== 'all' && tx.wallet_id !== filterWallet && tx.destination_wallet_id !== filterWallet) {
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
  }, [transactions, filterType, filterWallet, dateScope, searchQuery, cycleInfo, getCategory, getWalletName]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      if (onShowToast) onShowToast('Tidak ada transaksi untuk diekspor');
      return;
    }

    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Dompet Asal', 'Dompet Tujuan', 'Nominal (IDR)', 'Catatan'];
    const rows = filteredTransactions.map((tx) => {
      const cat = getCategory(tx.category_id)?.name || (tx.type === 'transfer' ? 'Transfer' : '-');
      const wOrigin = getWalletName(tx.wallet_id);
      const wDest = tx.destination_wallet_id ? getWalletName(tx.destination_wallet_id) : '-';
      const cleanNote = (tx.note || '').replace(/"/g, '""');

      return [
        tx.transaction_date,
        tx.type,
        `"${cat}"`,
        `"${wOrigin}"`,
        `"${wDest}"`,
        tx.amount,
        `"${cleanNote}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transaksi_sakumhs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) onShowToast('Laporan transaksi berhasil diunduh (CSV)');
  };

  const handleDelete = async (id: string) => {
    await deleteTransaction(id);
    if (onShowToast) onShowToast('Transaksi berhasil dihapus');
  };

  return (
    <section className="bg-surface rounded-2xl sm:rounded-[14px] p-5 sm:p-6 border border-border-default shadow-sm">
      {/* Header & Main Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-border-default">
        <div className="flex items-center gap-2">
          <ReceiptText className="w-4 h-4 text-primary-600" />
          <h2 className="text-base font-bold text-text-primary tracking-tight">
            Riwayat Transaksi
          </h2>
          <span className="text-xs text-text-muted font-normal">
            ({filteredTransactions.length})
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenQuickAdd && (
            <button
              onClick={onOpenQuickAdd}
              className="inline-flex sm:hidden items-center gap-1 text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-1.5 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Catat</span>
            </button>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              showFilters || filterWallet !== 'all' || dateScope !== 'cycle'
                ? 'bg-primary-50 border-primary-200 text-primary-700'
                : 'bg-surface border-border-default text-text-secondary hover:bg-bg-secondary'
            }`}
            title="Filter Lanjutan"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="p-1.5 bg-surface border border-border-default hover:bg-bg-secondary text-text-secondary rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-primary-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search Input & Quick Type Tabs */}
      <div className="space-y-3 mb-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Cari transaksi, makanan, rekening..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-surface border border-border-default rounded-xl text-xs text-text-primary placeholder-text-muted focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter Tabs */}
          <div className="flex gap-1 bg-bg-secondary p-1 rounded-xl text-xs shrink-0 self-start sm:self-auto">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'expense', label: 'Keluar' },
              { id: 'income', label: 'Masuk' },
              { id: 'transfer', label: 'Transfer' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  filterType === tab.id
                    ? 'bg-surface text-text-primary shadow-2xs'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters Drawer */}
        {showFilters && (
          <div className="p-3 bg-bg-secondary rounded-xl flex flex-wrap items-center gap-3 text-xs border border-border-subtle animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5">
              <span className="text-text-muted font-medium">Periode:</span>
              <select
                value={dateScope}
                onChange={(e) => setDateScope(e.target.value as any)}
                className="px-2.5 py-1 bg-surface border border-border-default rounded-lg text-text-primary font-semibold focus:outline-none"
              >
                <option value="cycle">
                  Siklus Aktif ({formatDateIndo(cycleInfo.startDate)} – {formatDateIndo(cycleInfo.endDate)})
                </option>
                <option value="month">Bulan Kalender Ini</option>
                <option value="all">Semua Riwayat</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-text-muted font-medium">Dompet:</span>
              <select
                value={filterWallet}
                onChange={(e) => setFilterWallet(e.target.value)}
                className="px-2.5 py-1 bg-surface border border-border-default rounded-lg text-text-primary font-semibold focus:outline-none"
              >
                <option value="all">Semua Dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Rows List */}
      {filteredTransactions.length === 0 ? (
        <div className="p-8 text-center text-xs text-text-muted">
          Tidak ada transaksi yang cocok dengan filter.
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {filteredTransactions.map((tx) => {
            const category = getCategory(tx.category_id);
            const sourceWalletName = getWalletName(tx.wallet_id);
            const destWalletName = tx.destination_wallet_id ? getWalletName(tx.destination_wallet_id) : null;

            return (
              <div
                key={tx.id}
                className="py-3 sm:py-3.5 flex items-center justify-between hover:bg-surface-container-low px-2 rounded-xl transition-colors group"
              >
                {/* Left: Category Icon & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-semantic-green-soft text-semantic-green'
                        : tx.type === 'expense'
                        ? 'bg-semantic-rose-soft text-semantic-rose'
                        : 'bg-primary-50 text-primary-600'
                    }`}
                  >
                    {tx.type === 'transfer' ? (
                      <ArrowRightLeft className="w-4 h-4" />
                    ) : (
                      getCategoryIcon(category?.icon)
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-semibold text-text-primary truncate">
                      {tx.note || category?.name || (tx.type === 'transfer' ? 'Transfer Saldo' : 'Lainnya')}
                    </div>
                    <div className="text-[11px] text-text-muted mt-0.5 flex items-center gap-1.5 flex-wrap truncate">
                      <span>
                        {tx.type === 'transfer'
                          ? `${sourceWalletName} ➔ ${destWalletName}`
                          : sourceWalletName}
                      </span>
                      <span>•</span>
                      <span>{formatRelativeDate(tx.transaction_date)}</span>
                      {category && tx.note && (
                        <>
                          <span>•</span>
                          <span className="text-text-secondary">{category.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Delete Button */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-3">
                  <div
                    className={`text-xs sm:text-sm font-bold text-right tabular-nums ${
                      tx.type === 'income'
                        ? 'text-semantic-green'
                        : tx.type === 'expense'
                        ? 'text-semantic-rose'
                        : 'text-text-primary'
                    }`}
                  >
                    {tx.type === 'income' ? '+ ' : tx.type === 'expense' ? '- ' : ''}
                    {formatCurrency(tx.amount)}
                  </div>

                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-text-muted hover:text-semantic-rose rounded-lg transition-all active:scale-95"
                    title="Hapus transaksi"
                    aria-label="Hapus transaksi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
