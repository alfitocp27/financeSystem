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
  const [payWalletId, setPayWalletId] = useState(wallets[0]?.id || '');

  // Add Bill Form State
  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDayStr, setDueDayStr] = useState('1');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
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
      category_id: categoryId || undefined,
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
    <section>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Pengeluaran Tetap Bulanan ({commitments.length})
            </h2>
          </div>
          {totalUnpaidCommitments > 0 && (
            <p className="text-[11px] text-amber-700 mt-0.5 font-medium">
              Sisa kewajiban belum dibayar: <strong>{formatCurrency(totalUnpaidCommitments)}</strong> (telah diamankan dari Safe to Spend)
            </p>
          )}
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Tagihan Baru
        </button>
      </div>

      {commitments.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center">
          <CalendarClock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Belum ada pengeluaran rutin bulanan.</p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
          >
            Tambah tagihan tetap (misal: Uang Kost, Wifi, SPP)
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
          {commitments.map((bill) => {
            const cat = categories.find((c) => c.id === bill.category_id);

            return (
              <div
                key={bill.id}
                className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      bill.is_paid
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}
                  >
                    {bill.is_paid ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800">{bill.name}</span>
                      {cat && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                          title={cat.name}
                        />
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          bill.is_paid
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {bill.is_paid ? 'Lunas' : 'Belum Bayar'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Jatuh tempo tiap tanggal <strong>{bill.due_day}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      {formatCurrency(bill.amount)}
                    </div>
                  </div>

                  {!bill.is_paid ? (
                    <button
                      onClick={() => setPayingBill(bill)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Bayar
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 hidden sm:inline">
                      Terbayar
                    </span>
                  )}

                  <button
                    onClick={() => handleDelete(bill.id, bill.name)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-all"
                    title="Hapus Tagihan"
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
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-800">Tambah Tagihan Rutin</h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddBill} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Nama Tagihan</label>
                <input
                  type="text"
                  placeholder="Misal: Sewa Kost, Wifi, SPP"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="650000"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Jatuh Tempo (Tgl)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={dueDayStr}
                    onChange={(e) => setDueDayStr(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Kategori</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
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
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Bayar: {payingBill.name}</h2>
                <span className="text-xs text-slate-500">Nominal: {formatCurrency(payingBill.amount)}</span>
              </div>
              <button
                onClick={() => setPayingBill(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Bayar Menggunakan Dompet</label>
                <select
                  value={payWalletId}
                  onChange={(e) => setPayWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                Setelah konfirmasi, saldo dompet akan otomatis terpotong Rp {payingBill.amount.toLocaleString('id-ID')} dan transaksi tercatat di riwayat.
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all"
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
