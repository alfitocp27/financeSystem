import React, { useState } from 'react';
import { CalendarClock, Plus, CheckCircle2, AlertCircle, X, Trash2, CreditCard } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/formatters';
import type { RecurringCommitment } from '../types/database.types';

interface RecurringBillsSectionProps {
  onShowToast?: (msg: string) => void;
}

export const RecurringBillsSection: React.FC<RecurringBillsSectionProps> = ({ onShowToast }) => {
  const { commitments, wallets, categories, addCommitment, deleteCommitment, payCommitment, totalUnpaidCommitments } = useFinance();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [payingBill, setPayingBill] = useState<RecurringCommitment | null>(null);
  const [payWalletId, setPayWalletId] = useState('');

  // Add Bill Form State
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDayStr, setDueDayStr] = useState('1');
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(amountStr, 10);
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
      alert('Saldo dompet tidak mencukupi untuk membayar tagihan ini.');
      return;
    }

    const { error } = await payCommitment(payingBill.id, effectiveWalletId);
    if (error) {
      alert(error.message);
    } else {
      const billName = payingBill.name;
      setPayingBill(null);
      if (onShowToast) onShowToast(`Tagihan "${billName}" berhasil dibayar & dicatat`);
    }
  };

  const handleDelete = async (id: string, billName: string) => {
    if (confirm(`Hapus tagihan rutin "${billName}"?`)) {
      await deleteCommitment(id);
      if (onShowToast) onShowToast('Tagihan rutin berhasil dihapus');
    }
  };

  return (
    <section className="bg-surface rounded-2xl sm:rounded-[14px] p-5 sm:p-6 border border-border-default shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-primary-600" />
            <h2 className="text-base font-bold text-text-primary tracking-tight">
              Pengeluaran Tetap Bulanan
            </h2>
            <span className="text-xs text-text-muted font-normal">
              ({commitments.length})
            </span>
          </div>
          {totalUnpaidCommitments > 0 && (
            <p className="text-[11px] text-semantic-amber mt-0.5 font-medium">
              Sisa kewajiban aktif: <strong>{formatCurrency(totalUnpaidCommitments)}</strong> (diamankan dari Safe to Spend)
            </p>
          )}
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tagihan Baru</span>
        </button>
      </div>

      {commitments.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border-default rounded-xl">
          <CalendarClock className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-xs text-text-secondary font-medium">Belum ada komitmen tagihan rutin.</p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="mt-2 text-xs font-semibold text-primary-600 hover:underline"
          >
            Tambah tagihan tetap (misal: Sewa Kost, Wifi, SPP)
          </button>
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {commitments.map((bill) => {
            const cat = categories.find((c) => c.id === bill.category_id);

            return (
              <div
                key={bill.id}
                className="py-3 sm:py-3.5 flex items-center justify-between hover:bg-surface-container-low px-2 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      bill.is_paid
                        ? 'bg-semantic-green-soft text-semantic-green'
                        : 'bg-semantic-amber-soft text-semantic-amber'
                    }`}
                  >
                    {bill.is_paid ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-semibold text-text-primary truncate">{bill.name}</span>
                      {cat && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                          title={cat.name}
                        />
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          bill.is_paid
                            ? 'bg-semantic-green-soft text-semantic-green'
                            : 'bg-semantic-amber-soft text-semantic-amber'
                        }`}
                      >
                        {bill.is_paid ? 'Lunas' : 'Belum Bayar'}
                      </span>
                    </div>

                    <div className="text-[11px] text-text-muted mt-0.5">
                      Jatuh tempo tiap tanggal <strong>{bill.due_day}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 ml-3">
                  <div className="text-xs sm:text-sm font-bold text-text-primary tabular-nums">
                    {formatCurrency(bill.amount)}
                  </div>

                  {!bill.is_paid ? (
                    <button
                      onClick={() => setPayingBill(bill)}
                      className="px-2.5 sm:px-3 py-1 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <CreditCard className="w-3 h-3" />
                      <span>Bayar</span>
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-semantic-green hidden sm:inline">
                      Terbayar
                    </span>
                  )}

                  <button
                    onClick={() => handleDelete(bill.id, bill.name)}
                    className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-text-muted hover:text-semantic-rose rounded-lg transition-all active:scale-95"
                    title="Hapus Tagihan"
                    aria-label="Hapus Tagihan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add Bill */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-border-default">
            <div className="flex items-center justify-between pb-3 border-b border-border-default mb-4">
              <h2 className="text-base font-bold text-text-primary">Tambah Tagihan Rutin</h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-bg-secondary"
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
                  className="w-full px-3.5 py-2 bg-surface border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="650000"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-surface border border-border-default rounded-xl text-base font-bold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500 tabular-nums"
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
                    className="w-full px-3.5 py-2 bg-surface border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-secondary block mb-1">Kategori</label>
                  <select
                    value={categoryId || categories[0]?.id || ''}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-surface border border-border-default rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
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
                className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-xs shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Tagihan Rutin'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pay Bill */}
      {payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-surface w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-border-default">
            <div className="flex items-center justify-between pb-3 border-b border-border-default mb-4">
              <div>
                <h2 className="text-base font-bold text-text-primary">Bayar: {payingBill.name}</h2>
                <span className="text-xs text-text-muted">Nominal: {formatCurrency(payingBill.amount)}</span>
              </div>
              <button
                onClick={() => setPayingBill(null)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Bayar Menggunakan Dompet</label>
                <select
                  value={payWalletId || wallets[0]?.id || ''}
                  onChange={(e) => setPayWalletId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-bg-secondary border border-border-subtle rounded-xl text-xs text-text-secondary">
                Saldo dompet akan dipotong {formatCurrency(payingBill.amount)} dan mutasi langsung tercatat di transaksi.
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
              >
                Konfirmasi Pembayaran
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
