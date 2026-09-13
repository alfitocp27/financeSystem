import React, { useState } from 'react';
import { Target, Plus, PiggyBank, X, CheckCircle2, ArrowDownLeft, ShieldAlert, Laptop, Award } from 'lucide-react';
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
  const [allocateWalletId, setAllocateWalletId] = useState('');
  const [allocateAmountStr, setAllocateAmountStr] = useState('');
  const [allocateError, setAllocateError] = useState<string | null>(null);

  // Withdraw Form state
  const [withdrawWalletId, setWithdrawWalletId] = useState('');
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

  const getGoalIcon = (iconName?: string) => {
    switch (iconName) {
      case 'shield-alert':
        return <ShieldAlert className="w-4 h-4" />;
      case 'laptop':
        return <Laptop className="w-4 h-4" />;
      case 'award':
        return <Award className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  return (
    <section className="bg-surface rounded-2xl sm:rounded-[14px] p-5 sm:p-6 border border-border-default shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-default">
        <div className="flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-primary-600" />
          <h2 className="text-base font-bold text-text-primary tracking-tight">
            Target Tabungan
          </h2>
          <span className="text-xs text-text-muted font-normal">
            ({savingsGoals.length})
          </span>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Target Baru</span>
        </button>
      </div>

      {savingsGoals.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-border-default rounded-xl">
          <Target className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-xs text-text-secondary font-medium">Belum ada target tabungan.</p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="mt-2 text-xs font-semibold text-primary-600 hover:underline"
          >
            Buat target pertamamu (misal: Dana Darurat Kost)
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
                className="bg-surface-container-low p-4 rounded-xl border border-border-default hover:border-primary-500 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${goal.color}20`, color: goal.color }}
                      >
                        {getGoalIcon(goal.icon)}
                      </div>
                      <h3 className="text-xs font-bold text-text-primary truncate">{goal.name}</h3>
                    </div>

                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-semantic-green bg-semantic-green-soft px-2 py-0.5 rounded-full border border-semantic-green/20">
                        <CheckCircle2 className="w-3 h-3" /> Tercapai
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-text-primary tabular-nums">
                        {progress}%
                      </span>
                    )}
                  </div>

                  {/* Amounts */}
                  <div className="flex items-baseline justify-between text-xs text-text-muted mb-2">
                    <span>
                      Terkumpul: <strong className="text-text-primary tabular-nums">{formatCurrency(goal.current_amount)}</strong>
                    </span>
                    <span>Target: {formatCurrency(goal.target_amount)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-border-default h-1.5 rounded-full overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: goal.color || '#10b981',
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSelectedGoal(goal);
                      setAllocateAmountStr('');
                      setAllocateError(null);
                    }}
                    className="flex-1 py-1.5 bg-surface hover:bg-bg-secondary text-text-primary text-xs font-semibold rounded-lg border border-border-default transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5 text-semantic-green" />
                    <span>Nabung</span>
                  </button>

                  {goal.current_amount > 0 && (
                    <button
                      onClick={() => {
                        setWithdrawGoal(goal);
                        setWithdrawAmountStr('');
                        setWithdrawError(null);
                      }}
                      className="py-1.5 px-3 bg-surface hover:bg-bg-secondary text-text-secondary text-xs font-semibold rounded-lg border border-border-default transition-colors flex items-center justify-center gap-1 active:scale-95"
                      title="Cairkan dana ke dompet"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5 text-primary-600" />
                      <span>Tarik</span>
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
          <div className="bg-surface w-full max-w-md rounded-2xl p-6 shadow-2xl border border-border-default">
            <div className="flex items-center justify-between pb-3 border-b border-border-default mb-4">
              <h2 className="text-base font-bold text-text-primary">Target Tabungan Baru</h2>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddGoal} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Nama Target</label>
                <input
                  type="text"
                  placeholder="Misal: Beli Laptop, Liburan Semester"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-surface border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Target Nominal (Rp)</label>
                <input
                  type="number"
                  placeholder="1000000"
                  value={targetAmountStr}
                  onChange={(e) => setTargetAmountStr(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-surface border border-border-default rounded-xl text-base font-bold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500 tabular-nums"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Target Tanggal (Opsional)</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface border border-border-default rounded-xl text-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1.5">Warna Aksen</label>
                <div className="flex gap-2">
                  {['#10b981', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setGoalColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        goalColor === c ? 'scale-110 ring-2 ring-offset-2 ring-primary-500' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
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
          <div className="bg-surface w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-border-default">
            <div className="flex items-center justify-between pb-3 border-b border-border-default mb-4">
              <h2 className="text-base font-bold text-text-primary">Nabung ke: {selectedGoal.name}</h2>
              <button
                onClick={() => setSelectedGoal(null)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Ambil dari Dompet</label>
                <select
                  value={allocateWalletId || wallets[0]?.id || ''}
                  onChange={(e) => setAllocateWalletId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Nominal yang Disisihkan (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={allocateAmountStr}
                  onChange={(e) => setAllocateAmountStr(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-surface border border-border-default rounded-xl text-lg font-bold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500 tabular-nums"
                />
              </div>

              {allocateError && (
                <div className="p-2.5 bg-semantic-rose-soft border border-semantic-rose/20 rounded-xl text-xs text-semantic-rose font-medium">
                  {allocateError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
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
          <div className="bg-surface w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-border-default">
            <div className="flex items-center justify-between pb-3 border-b border-border-default mb-4">
              <div>
                <h2 className="text-base font-bold text-text-primary">Cairkan: {withdrawGoal.name}</h2>
                <span className="text-xs text-text-muted">Tersedia: {formatCurrency(withdrawGoal.current_amount)}</span>
              </div>
              <button
                onClick={() => setWithdrawGoal(null)}
                className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-bg-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Transfer ke Dompet</label>
                <select
                  value={withdrawWalletId || wallets[0]?.id || ''}
                  onChange={(e) => setWithdrawWalletId(e.target.value)}
                  className="w-full px-3.5 py-2 bg-surface border border-border-default rounded-xl text-sm font-semibold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatCurrency(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">Nominal yang Ditarik (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={withdrawAmountStr}
                  onChange={(e) => setWithdrawAmountStr(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-surface border border-border-default rounded-xl text-lg font-bold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500 tabular-nums"
                />
              </div>

              {withdrawError && (
                <div className="p-2.5 bg-semantic-rose-soft border border-semantic-rose/20 rounded-xl text-xs text-semantic-rose font-medium">
                  {withdrawError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
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
