import React, { useState } from 'react';
import { ArrowDownRight, ArrowUpRight, ArrowRightLeft, Trash2, History } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatRelativeDate } from '../lib/formatters';

export const TransactionList: React.FC = () => {
  const { transactions, wallets, categories, deleteTransaction } = useFinance();
  const [filterType, setFilterType] = useState<string>('all');

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'all') return true;
    return tx.type === filterType;
  });

  const getWalletName = (walletId: string) => {
    return wallets.find((w) => w.id === walletId)?.name || 'Dompet';
  };

  const getCategory = (catId?: string | null) => {
    return categories.find((c) => c.id === catId);
  };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <History className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Riwayat Transaksi
          </h2>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl text-xs">
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
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">Belum ada catatan transaksi.</p>
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
                {/* Left: Type Icon & Info */}
                <div className="flex items-center gap-3">
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

                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                      <span>{category?.name || (tx.type === 'transfer' ? 'Transfer Saldo' : 'Lainnya')}</span>
                      {tx.note && (
                        <span className="text-slate-400 font-normal text-[11px] truncate max-w-[150px] sm:max-w-[220px]">
                          • {tx.note}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>{formatRelativeDate(tx.transaction_date)}</span>
                      <span>•</span>
                      <span>
                        {tx.type === 'transfer'
                          ? `${sourceWalletName} ➔ ${destWalletName}`
                          : sourceWalletName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Delete Button */}
                <div className="flex items-center gap-2 sm:gap-3">
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
                    onClick={() => deleteTransaction(tx.id)}
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
