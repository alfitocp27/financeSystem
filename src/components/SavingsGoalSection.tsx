import React, { useState } from 'react';
import { Target, Plus, PiggyBank, X, CheckCircle2, ArrowDownLeft } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/formatters';
import type { SavingsGoal } from '../types/database.types';

interface SavingsGoalSectionProps {
  onShowToast?: (msg: string) => void;
}

export const SavingsGoalSection: React.FC<SavingsGoalSectionProps> = ({ onShowToast }) => {
  const { savingsGoals, wallets, addSavingsGoal, allocateToGoal, withdrawFromGoal } = useFinance();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [withdrawGoal, setWithdrawGoal] = useState<SavingsGoal | null>(null);

  // Add Goal Form state
  const [goalName, setGoalName] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [goalColor, setGoalColor] = useState('#10b981');

  // Allocate Form state
  const [allocateWalletId, setAllocateWalletId] = useState(wallets[0]?.id || '');
  const [allocateAmountStr, setAllocateAmountStr] = useState('');
  const [allocateError, setAllocateError] = useState<string | null>(null);

  // Withdraw Form state
  const [withdrawWalletId, setWithdrawWalletId] = useState(wallets[0]?.id || '');
  const [withdrawAmountStr, setWithdrawAmountStr] = useState('');
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(targetAmountStr, 10);
    if (!goalName.trim() || !amount || amount <= 0) return;

    await addSavingsGoal({
      name: goalName.trim(),
      target_amount: amount,
      target_date: targetDate || undefined,
      color: goalColor,
    });

    setGoalName('');
    setTargetAmountStr('');
    setTargetDate('');
    setIsAddOpen(false);
    if (onShowToast) onShowToast('Target tabungan baru berhasil dibuat');
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setAllocateError(null);
    if (!selectedGoal) return;

    const amount = parseInt(allocateAmountStr, 10);
    if (!amount || amount <= 0) {
      setAllocateError('Masukkan nominal alokasi tabungan');
      return;
    }

    const effectiveWalletId = allocateWalletId || wallets[0]?.id || '';
    const sourceWallet = wallets.find((w) => w.id === effectiveWalletId);
    if (sourceWallet && sourceWallet.balance < amount) {
      setAllocateError('Saldo dompet tidak mencukupi');
      return;
    }

    const { error } = await allocateToGoal(selectedGoal.id, effectiveWalletId, amount);
    if (error) {
      setAllocateError(error.message);
    } else {
      setSelectedGoal(null);
      setAllocateAmountStr('');
      if (onShowToast) onShowToast(`Berhasil menabung Rp ${amount.toLocaleString('id-ID')}`);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError(null);
    if (!withdrawGoal) return;

    const amount = parseInt(withdrawAmountStr, 10);
    if (!amount || amount <= 0) {
      setWithdrawError('Masukkan nominal penarikan');
      return;
    }

    if (amount > withdrawGoal.current_amount) {
      setWithdrawError(`Maksimal penarikan: ${formatCurrency(withdrawGoal.current_amount)}`);
      return;
    }

    const effectiveWithdrawId = withdrawWalletId || wallets[0]?.id || '';
    const { error } = await withdrawFromGoal(withdrawGoal.id, effectiveWithdrawId, amount);
    if (error) {
      setWithdrawError(error.message);
    } else {
      setWithdrawGoal(null);
      setWithdrawAmountStr('');
      if (onShowToast) onShowToast(`Berhasil mencairkan Rp ${amount.toLocaleString('id-ID')} ke dompet`);
    }
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <PiggyBank className="w-4 h-4 text-emerald-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Target Tabungan
          </h2>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Target Baru
        </button>
      </div>

      {savingsGoals.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-dashed border-slate-200 text-center">
          <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Belum ada target tabungan.</p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
          >
            Buat target pertamamu (misal: Dana Darurat)
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {savingsGoals.map((goal) => {
            const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
            const isCompleted = goal.current_amount >= goal.target_amount;

            return (
              <div
                key={goal.id}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: goal.color }}
                      />
                      <h3 className="text-sm font-bold text-slate-800 truncate">{goal.name}</h3>
                    </div>
                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Tercapai
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-600">{progress}%</span>
                    )}
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between text-xs text-slate-500 mb-2">
                    <span>
                      Terkumpul: <strong className="text-slate-800">{formatCurrency(goal.current_amount)}</strong>
                    </span>
                    <span>Target: {formatCurrency(goal.target_amount)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: goal.color || '#10b981',
                      }}
                    />
                  </div>
                </div>

                {/* Actions: Tabung & Tarik */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setSelectedGoal(goal)}
                    className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-100 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    Nabung
                  </button>

                  {goal.current_amount > 0 && (
                    <button
                      onClick={() => setWithdrawGoal(goal)}
                      className="py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-100 transition-colors flex items-center justify-center gap-1"
                      title="Cairkan dana ke dompet"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 text-indigo-600" />
                      Tarik
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Add Goal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-800">Target Tabungan Baru</h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Nama Target</label>
                <input
                  type="text"
                  placeholder="Misal: Beli Laptop, Liburan Semester, KKN"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Target Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="1000000"
                  value={targetAmountStr}
                  onChange={(e) => setTargetAmountStr(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Target Tanggal (Opsional)</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1.5">Warna Target</label>
                <div className="flex gap-2">
                  {['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setGoalColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        goalColor === c ? 'scale-110 ring-2 ring-offset-2 ring-slate-400' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-200 transition-all"
              >
                Simpan Target
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Allocate to Goal */}
      {selectedGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-base font-bold text-slate-800">Nabung ke: {selectedGoal.name}</h2>
              <button
                onClick={() => setSelectedGoal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Ambil dari Dompet</label>
                <select
                  value={allocateWalletId}
                  onChange={(e) => setAllocateWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Nominal yang Disisihkan (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={allocateAmountStr}
                  onChange={(e) => setAllocateAmountStr(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {allocateError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {allocateError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-200 transition-all"
              >
                Konfirmasi Simpan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Withdraw from Goal */}
      {withdrawGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Cairkan: {withdrawGoal.name}</h2>
                <span className="text-xs text-slate-500">Tersedia: {formatCurrency(withdrawGoal.current_amount)}</span>
              </div>
              <button
                onClick={() => setWithdrawGoal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Transfer ke Dompet</label>
                <select
                  value={withdrawWalletId}
                  onChange={(e) => setWithdrawWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Nominal yang Ditarik (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={withdrawAmountStr}
                  onChange={(e) => setWithdrawAmountStr(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {withdrawError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {withdrawError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-200 transition-all"
              >
                Konfirmasi Tarik Dana
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
