import React, { useState } from 'react';
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  Clock,
  X,
  Trash2,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/formatters';
import type { RecurringCommitment } from '../types/database.types';

interface RecurringBillsSectionProps {
  onShowToast?: (msg: string) => void;
}

export const RecurringBillsSection: React.FC<RecurringBillsSectionProps> = ({ onShowToast }) => {
  const {
    commitments,
    wallets,
    categories,
    addCommitment,
    deleteCommitment,
    payCommitment,
    totalUnpaidCommitments,
  } = useFinance();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payingBill, setPayingBill] = useState<RecurringCommitment | null>(null);
  const [deletingBill, setDeletingBill] = useState<{ id: string; name: string } | null>(null);
  const [payWalletId, setPayWalletId] = useState('');
  const [payError, setPayError] = useState<string | null>(null);

  // Add Bill Form State
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDayStr, setDueDayStr] = useState('1');
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unpaidBills = commitments.filter((c) => !c.is_paid);
  const paidBills = commitments.filter((c) => c.is_paid);

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = amountStr.replace(/\D/g, '');
    const amount = parseInt(cleanDigits, 10);
    const dueDay = parseInt(dueDayStr, 10);
    if (!name.trim() || !amount || amount <= 0 || !dueDay) return;

    setIsSubmitting(true);
    await addCommitment({
      name: name.trim(),
      amount,
      due_day: dueDay,
      category_id: categoryId || categories[0]?.id || undefined,
    });
    setIsSubmitting(false);

    setName('');
    setAmountStr('');
    setDueDayStr('1');
    setIsAddOpen(false);
    if (onShowToast) onShowToast('Tagihan rutin berhasil ditambahkan');
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBill) return;

    const effectiveWalletId = payWalletId || wallets[0]?.id || '';
    const sourceWallet = wallets.find((w) => w.id === effectiveWalletId);
    if (sourceWallet && sourceWallet.balance < payingBill.amount) {
      setPayError('Saldo dompet tidak mencukupi untuk membayar tagihan ini.');
      return;
    }

    setPayError(null);
    const { error } = await payCommitment(payingBill.id, effectiveWalletId);
    if (error) {
      setPayError(error.message);
    } else {
      const billName = payingBill.name;
      setPayingBill(null);
      if (onShowToast) onShowToast(`Tagihan "${billName}" berhasil dibayar & dicatat`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingBill) return;
    const billName = deletingBill.name;
    await deleteCommitment(deletingBill.id);
    setDeletingBill(null);
    if (onShowToast) onShowToast(`Tagihan "${billName}" berhasil dihapus`);
  };

  const handleAmountInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setAmountStr('');
      return;
    }
    const num = parseInt(digits, 10);
    setAmountStr(new Intl.NumberFormat('id-ID').format(num));
  };

  return (
    <section className="bg-surface rounded-xl border border-border-default shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-soft text-text-gold flex items-center justify-center shrink-0">
            <CalendarClock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-text-primary tracking-tight">
                Tagihan Rutin & Kewajiban
              </h2>
              <span className="text-xs text-text-muted font-normal">
                ({commitments.length} komitmen)
              </span>
            </div>
            {totalUnpaidCommitments > 0 ? (
              <p className="text-xs text-semantic-amber-text mt-0.5 font-medium">
                Sisa kewajiban aktif: {formatCurrency(totalUnpaidCommitments)} (diamankan dari belanja bebas)
              </p>
            ) : (
              <p className="text-xs text-semantic-green-text mt-0.5 font-medium">
                Semua tagihan rutin siklus ini telah terlunasi
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            setName('');
            setAmountStr('');
            setDueDayStr('1');
            setIsAddOpen(true);
          }}
          type="button"
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-lg bg-primary-soft text-text-gold hover:bg-primary/20 transition-colors text-xs font-semibold shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Tagihan Baru</span>
        </button>
      </div>

      {commitments.length === 0 ? (
        <div className="p-8 text-center text-xs text-text-muted">
          Belum ada tagihan rutin. Tambahkan pengeluaran tetap bulanan seperti Kos, Wi-Fi, atau SPP.
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {/* Sub-Section 1: Menunggu Pembayaran */}
          {unpaidBills.length > 0 && (
            <div>
              <div className="px-5 py-2.5 bg-surface-elevated/40 border-b border-border-subtle flex items-center justify-between text-xs">
                <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-semantic-amber-text" />
                  <span>Menunggu Pembayaran ({unpaidBills.length})</span>
                </span>
                <span className="text-text-muted">
                  Total: <strong className="text-text-primary tabular-nums font-semibold">{formatCurrency(totalUnpaidCommitments)}</strong>
                </span>
              </div>

              <div className="divide-y divide-border-subtle">
                {unpaidBills.map((bill) => {
                  const cat = categories.find((c) => c.id === bill.category_id);

                  return (
                    <div
                      key={bill.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-colors hover:bg-surface-elevated/30"
                    >
                      {/* Left info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-semantic-amber-soft text-semantic-amber-text flex items-center justify-center shrink-0">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-text-primary block truncate">
                            {bill.name}
                          </span>
                          <span className="text-xs text-text-muted block mt-0.5">
                            Jatuh tempo tgl {bill.due_day}
                            {cat ? ` • ${cat.name}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                        <span className="text-xs sm:text-sm font-bold text-text-primary tabular-nums">
                          {formatCurrency(bill.amount)}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPayError(null);
                              setPayWalletId(wallets[0]?.id || '');
                              setPayingBill(bill);
                            }}
                            className="min-h-[44px] px-3.5 py-2 bg-primary text-slate-950 rounded-lg hover:bg-primary-hover font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Bayar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingBill({ id: bill.id, name: bill.name })}
                            className="min-h-[44px] min-w-[44px] p-2.5 text-text-muted hover:text-semantic-rose-text rounded-lg hover:bg-surface-elevated transition-colors flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-semantic-rose"
                            title={`Hapus tagihan ${bill.name}`}
                            aria-label={`Hapus tagihan ${bill.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-Section 2: Sudah Lunas Siklus Ini */}
          {paidBills.length > 0 && (
            <div>
              <div className="px-5 py-2.5 bg-surface-elevated/40 border-b border-border-subtle flex items-center justify-between text-xs">
                <span className="font-semibold text-text-secondary flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-semantic-green-text" />
                  <span>Sudah Lunas Siklus Ini ({paidBills.length})</span>
                </span>
                <span className="text-text-muted">Tercatat di pengeluaran</span>
              </div>

              <div className="divide-y divide-border-subtle">
                {paidBills.map((bill) => {
                  const cat = categories.find((c) => c.id === bill.category_id);

                  return (
                    <div
                      key={bill.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 opacity-75 hover:opacity-100 transition-opacity"
                    >
                      {/* Left info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-semantic-green-soft text-semantic-green-text flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs sm:text-sm font-semibold text-text-primary block truncate">
                            {bill.name}
                          </span>
                          <span className="text-xs text-text-muted block mt-0.5">
                            Lunas • Jatuh tempo tgl {bill.due_day}
                            {cat ? ` • ${cat.name}` : ''}
                          </span>
                        </div>
                      </div>

                      {/* Right info & delete */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                        <span className="text-xs sm:text-sm font-semibold text-text-muted tabular-nums">
                          {formatCurrency(bill.amount)}
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-semantic-green-text px-2.5 py-1 rounded-md bg-semantic-green-soft">
                            Lunas
                          </span>

                          <button
                            type="button"
                            onClick={() => setDeletingBill({ id: bill.id, name: bill.name })}
                            className="min-h-[44px] min-w-[44px] p-2.5 text-text-muted hover:text-semantic-rose-text rounded-lg hover:bg-surface-elevated transition-colors flex items-center justify-center focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-semantic-rose"
                            title={`Hapus tagihan ${bill.name}`}
                            aria-label={`Hapus tagihan ${bill.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Add Bill */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/80 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-sm rounded-xl p-6 shadow-xl border border-border-default">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
              <h2 className="text-sm font-bold text-text-primary">Tambah Tagihan Rutin</h2>
              <button
                onClick={() => setIsAddOpen(false)}
                type="button"
                className="min-h-[44px] min-w-[44px] p-2.5 text-text-muted hover:text-text-primary rounded-lg flex items-center justify-center transition-colors"
                aria-label="Tutup form tagihan"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBill} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Nama Tagihan</label>
                <input
                  type="text"
                  placeholder="Misal: Sewa Kost, Wifi, SPP"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface-elevated border border-border-default rounded-lg text-xs font-semibold text-text-primary focus:outline-hidden focus:border-border-gold-focus focus:ring-1 focus:ring-primary min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Nominal (Rp)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={amountStr}
                  onChange={(e) => handleAmountInput(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface-elevated border border-border-default rounded-lg text-sm font-bold text-text-primary focus:outline-hidden focus:border-border-gold-focus focus:ring-1 focus:ring-primary tabular-nums min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">Jatuh Tempo (Tgl)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDayStr}
                    onChange={(e) => setDueDayStr(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-surface-elevated border border-border-default rounded-lg text-xs font-semibold text-text-primary focus:outline-hidden focus:border-border-gold-focus focus:ring-1 focus:ring-primary min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">Pos Kategori</label>
                  <select
                    value={categoryId || categories[0]?.id || ''}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-elevated border border-border-default rounded-lg text-xs font-semibold text-text-primary focus:outline-hidden focus:border-border-gold-focus focus:ring-1 focus:ring-primary min-h-[44px]"
                  >
                    {categories.filter((c) => c.type === 'expense').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] py-2.5 bg-primary text-slate-950 rounded-lg font-bold text-xs hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Tagihan Rutin'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pay Bill */}
      {payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/80 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-sm rounded-xl p-6 shadow-xl border border-border-default">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
              <div>
                <h2 className="text-sm font-bold text-text-primary">Bayar: {payingBill.name}</h2>
                <span className="text-xs text-text-muted">Nominal: {formatCurrency(payingBill.amount)}</span>
              </div>
              <button
                onClick={() => setPayingBill(null)}
                type="button"
                className="min-h-[44px] min-w-[44px] p-2.5 text-text-muted hover:text-text-primary rounded-lg flex items-center justify-center transition-colors"
                aria-label="Tutup form bayar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Sumber Dana Dompet
                </label>
                <select
                  value={payWalletId || wallets[0]?.id || ''}
                  onChange={(e) => {
                    setPayWalletId(e.target.value);
                    setPayError(null);
                  }}
                  className="w-full px-3 py-2 bg-surface-elevated border border-border-default rounded-lg text-xs font-semibold text-text-primary focus:outline-hidden focus:border-border-gold-focus focus:ring-1 focus:ring-primary min-h-[44px]"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {payError && (
                <div className="p-3 bg-semantic-rose-soft border border-semantic-rose/20 rounded-lg text-xs text-semantic-rose-text flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{payError}</span>
                </div>
              )}

              <div className="p-3 bg-surface-elevated border border-border-subtle rounded-lg text-xs text-text-secondary">
                Saldo dompet akan dipotong {formatCurrency(payingBill.amount)} dan otomatis tercatat sebagai transaksi pengeluaran pada pos terkait.
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] py-2.5 bg-primary text-slate-950 rounded-lg font-bold text-xs hover:bg-primary-hover transition-colors"
              >
                Konfirmasi Pembayaran
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Non-blocking Delete Confirmation Modal */}
      {deletingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg-primary/80 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-sm rounded-xl p-6 shadow-xl border border-border-default">
            <h2 className="text-sm font-bold text-text-primary mb-2">Hapus Tagihan Rutin?</h2>
            <p className="text-xs text-text-secondary mb-5 leading-relaxed">
              Tagihan &quot;<strong className="text-text-primary">{deletingBill.name}</strong>&quot; akan dihapus dari daftar komitmen bulanan. Riwayat transaksi pengeluaran lampau tetap aman.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingBill(null)}
                className="flex-1 min-h-[44px] px-4 py-2 bg-surface-elevated text-text-secondary hover:text-text-primary rounded-lg text-xs font-semibold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 min-h-[44px] px-4 py-2 bg-semantic-rose-soft text-semantic-rose-text hover:bg-semantic-rose/20 rounded-lg text-xs font-bold transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
