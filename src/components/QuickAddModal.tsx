import React, { useState, useEffect, useMemo } from 'react';
import { X, ArrowDownRight, ArrowUpRight, ArrowRightLeft, Check, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import type { TransactionType, Wallet } from '../types/database.types';
import { getLocalDateString } from '../lib/formatters';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
  initialAmount?: number;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  initialAmount,
}) => {
  const { wallets, categories, addTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [walletId, setWalletId] = useState<string>('');
  const [destinationWalletId, setDestinationWalletId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayStr = useMemo(() => getLocalDateString(new Date()), []);
  const [transactionDate, setTransactionDate] = useState<string>(todayStr);

  const activeWallets = useMemo(
    () => wallets.filter((w) => w.is_active !== false),
    [wallets]
  );

  // Sync state whenever modal opens or wallet/categories are loaded
  useEffect(() => {
    if (isOpen) {
      if (initialAmount) {
        setAmountStr(initialAmount.toString());
      } else {
        setAmountStr('');
      }
      if (activeWallets.length > 0) {
        setWalletId(activeWallets[0].id);
        if (activeWallets.length > 1) {
          setDestinationWalletId(activeWallets[1].id);
        }
      }
      const initialCats = categories.filter((c) => c.type === type);
      if (initialCats.length > 0) {
        setCategoryId(initialCats[0].id);
      }
      setTransactionDate(getLocalDateString(new Date()));
      setErrorMsg(null);
    }
  }, [isOpen, initialAmount, activeWallets, categories, type]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseInt(amountStr || '0', 10) || 0;
    setAmountStr((current + addValue).toString());
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const newCats = categories.filter((c) => c.type === newType);
    if (newCats.length > 0) {
      setCategoryId(newCats[0].id);
    } else {
      setCategoryId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numericAmount = parseInt(amountStr, 10);
    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg('Masukkan nominal yang valid');
      return;
    }

    const effectiveWalletId = walletId || wallets[0]?.id;
    if (!effectiveWalletId) {
      setErrorMsg('Pilih dompet sumber');
      return;
    }

    if (type === 'transfer') {
      const effectiveDestId = destinationWalletId || wallets.find(w => w.id !== effectiveWalletId)?.id;
      if (!effectiveDestId || effectiveDestId === effectiveWalletId) {
        setErrorMsg('Pilih dompet tujuan yang berbeda dari dompet sumber');
        return;
      }
    }

    setIsSubmitting(true);
    const { error } = await addTransaction({
      type,
      amount: numericAmount,
      walletId: effectiveWalletId,
      categoryId: type !== 'transfer' ? (categoryId || filteredCategories[0]?.id) : undefined,
      destinationWalletId: type === 'transfer' ? destinationWalletId : undefined,
      note: note.trim() || undefined,
      transactionDate,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error.message || 'Gagal mencatat transaksi');
    } else {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-surface-modal border border-border-default w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-default mb-4">
          <h2 className="text-lg font-bold text-text-primary">Catat Transaksi</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-surface-elevated transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface-elevated border border-border-subtle rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all min-h-[44px] sm:min-h-0 ${
              type === 'expense'
                ? 'bg-semantic-rose text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" /> Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all min-h-[44px] sm:min-h-0 ${
              type === 'income'
                ? 'bg-semantic-green text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" /> Pemasukan
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('transfer')}
            className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all min-h-[44px] sm:min-h-0 ${
              type === 'transfer'
                ? 'bg-semantic-blue text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" /> Transfer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">Nominal (Rp)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-text-muted">
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
                className="w-full pl-12 pr-4 py-3 bg-surface-elevated border border-border-default rounded-2xl text-2xl font-bold text-text-gold placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-gold-focus"
              />
            </div>

            {/* Quick Increment Chips */}
            <div className="flex gap-2 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
              {[10000, 20000, 50000, 100000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAddAmount(val)}
                  className="px-3 py-1.5 bg-surface-elevated hover:bg-surface-elevated/80 border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap min-h-[36px]"
                >
                  <Plus className="w-3 h-3 text-primary" />
                  {val >= 1000 ? `${val / 1000}rb` : val}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAmountStr('')}
                className="px-2.5 py-1 text-text-muted hover:text-text-primary text-xs font-medium rounded-lg"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Tanggal Transaksi */}
          <div>
            <label htmlFor="quick-add-date" className="text-xs font-semibold text-text-secondary block mb-1">
              Tanggal Transaksi
            </label>
            <div className="relative">
              <input
                id="quick-add-date"
                type="date"
                value={transactionDate}
                max={todayStr}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[44px]"
                aria-label="Tanggal Transaksi"
              />
            </div>
          </div>

          {/* Wallets selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-text-secondary block mb-1">
                {type === 'transfer' ? 'Dari Dompet' : 'Dompet / Akun'}
              </label>
              <select
                value={walletId || activeWallets[0]?.id || ''}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-border-gold-focus"
              >
                {activeWallets.map((w: Wallet) => (
                  <option key={w.id} value={w.id} className="bg-surface-modal text-text-primary">
                    {w.name} (Rp {w.balance.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>

            {type === 'transfer' && (
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Ke Dompet Tujuan
                </label>
                <select
                  value={destinationWalletId || activeWallets.find((w: Wallet) => w.id !== (walletId || activeWallets[0]?.id))?.id || ''}
                  onChange={(e) => setDestinationWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-border-gold-focus"
                >
                  {activeWallets
                    .filter((w: Wallet) => w.id !== (walletId || activeWallets[0]?.id))
                    .map((w: Wallet) => (
                      <option key={w.id} value={w.id} className="bg-surface-modal text-text-primary">
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
              <label className="text-xs font-semibold text-text-secondary block mb-1.5">
                Kategori
              </label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
                {filteredCategories.map((cat) => {
                  const isSelected = (categoryId || filteredCategories[0]?.id) === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryId(cat.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all min-h-[44px] sm:min-h-0 ${
                        isSelected
                          ? 'bg-primary-soft text-text-gold border border-border-gold shadow-xs'
                          : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-border-subtle'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                      {isSelected && <Check className="w-3.5 h-3.5 ml-0.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note Input */}
          <div>
            <label className="text-xs font-semibold text-text-secondary block mb-1">
              Catatan Singkat (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Makan siang warteg, beli kuota, dll."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border-default rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-border-gold-focus"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-semantic-rose-soft border border-semantic-rose/30 rounded-xl text-xs text-semantic-rose-text font-medium">
              {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-slate-950 rounded-2xl font-bold text-sm shadow-md shadow-black/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
        </form>
      </div>
    </div>
  );
};
