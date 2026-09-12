import React, { useState, useMemo } from 'react';
import { ArrowDownRight, ArrowUpRight, ArrowRightLeft, Trash2, History, Search, Download, Filter, X } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatRelativeDate, formatDateIndo } from '../lib/formatters';

interface TransactionListProps {
  onShowToast?: (msg: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ onShowToast }) => {
  const { transactions, wallets, categories, cycleInfo, deleteTransaction } = useFinance();

  const [filterType, setFilterType] = useState<string>('all');
  const [filterWallet, setFilterWallet] = useState<string>('all');
  const [dateScope, setDateScope] = useState<'cycle' | 'month' | 'all'>('cycle');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const getWalletName = (walletId: string) => {
    return wallets.find((w) => w.id === walletId)?.name || 'Dompet';
  };

  const getCategory = (catId?: string | null) => {
    return categories.find((c) => c.id === catId);
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
  }, [transactions, filterType, filterWallet, dateScope, searchQuery, cycleInfo, categories, wallets]);

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
    link.setAttribute('download', `transaksi_keuangan_${new Date().toISOString().split('T')[0]}.csv`);
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
    <section>
      {/* Header & Main Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <History className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Riwayat Transaksi ({filteredTransactions.length})
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Filter Bar Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-colors ${
              showFilters || filterWallet !== 'all' || dateScope !== 'cycle'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Filter Lanjutan"
          >
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filter</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search and Quick Type Tabs */}
      <div className="space-y-2 mb-3">
        <div className="flex gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi, makanan, dompet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter Chips */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs shrink-0">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'expense', label: 'Keluar' },
              { id: 'income', label: 'Masuk' },
              { id: 'transfer', label: 'Transfer' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  filterType === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible Advanced Filters (Wallet & Date Scope) */}
        {showFilters && (
          <div className="p-3 bg-slate-50/90 border border-slate-200 rounded-2xl flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-200">
            {/* Date Scope */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Periode:</span>
              <select
                value={dateScope}
                onChange={(e) => setDateScope(e.target.value as any)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none"
              >
                <option value="cycle">Siklus Aktif ({formatDateIndo(cycleInfo.startDate)} - {formatDateIndo(cycleInfo.endDate)})</option>
                <option value="month">Bulan Kalender Ini</option>
                <option value="all">Semua Riwayat</option>
              </select>
            </div>

            {/* Wallet Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Dompet:</span>
              <select
                value={filterWallet}
                onChange={(e) => setFilterWallet(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none"
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

      {/* Transaction Records List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">
            Tidak ada transaksi yang cocok dengan filter.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {filteredTransactions.map((tx) => {
            const category = getCategory(tx.category_id);
            const sourceWalletName = getWalletName(tx.wallet_id);
            const destWalletName = tx.destination_wallet_id ? getWalletName(tx.destination_wallet_id) : null;

            return (
              <div
                key={tx.id}
                className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors group"
              >
                {/* Left: Type Icon & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'income'
                        ? 'bg-emerald-50 text-emerald-600'
                        : tx.type === 'expense'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-indigo-50 text-indigo-600'
                    }`}
                  >
                    {tx.type === 'income' && <ArrowUpRight className="w-5 h-5" />}
                    {tx.type === 'expense' && <ArrowDownRight className="w-5 h-5" />}
                    {tx.type === 'transfer' && <ArrowRightLeft className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                      <span>{category?.name || (tx.type === 'transfer' ? 'Transfer Saldo' : 'Lainnya')}</span>
                      {tx.note && (
                        <span className="text-slate-400 font-normal text-[11px] truncate max-w-[140px] sm:max-w-[240px]">
                          • {tx.note}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>{formatRelativeDate(tx.transaction_date)}</span>
                      <span>•</span>
                      <span className="truncate">
                        {tx.type === 'transfer'
                          ? `${sourceWalletName} ➔ ${destWalletName}`
                          : sourceWalletName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Delete Button */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2">
                  <div
                    className={`text-xs sm:text-sm font-bold text-right ${
                      tx.type === 'income'
                        ? 'text-emerald-600'
                        : tx.type === 'expense'
                        ? 'text-rose-600'
                        : 'text-indigo-600'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                    {formatCurrency(tx.amount)}
                  </div>

                  <button
                    onClick={() => handleDelete(tx.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-all"
                    title="Hapus transaksi"
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
