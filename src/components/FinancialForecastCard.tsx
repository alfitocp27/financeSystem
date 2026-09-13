import React from 'react';
import { Compass, AlertCircle, CheckCircle2, Flame } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/formatters';

export const FinancialForecastCard: React.FC = () => {
  const { safeToSpend, cycleInfo, totalExpenseInCycle } = useFinance();

  // Average daily burn rate so far in this cycle
  const dailyBurnRate = cycleInfo.daysPassed > 0
    ? Math.round(totalExpenseInCycle / cycleInfo.daysPassed)
    : 0;

  // Projected spending for the remaining days if current pace continues
  const projectedFutureExpense = dailyBurnRate * cycleInfo.daysRemaining;
  const projectedBalanceAtEnd = safeToSpend.remainingBudget - projectedFutureExpense;

  // Estimated days of runway if current spending rate continues
  const estimatedDaysRunway = dailyBurnRate > 0
    ? Math.max(0, Math.floor(safeToSpend.remainingBudget / dailyBurnRate))
    : cycleInfo.daysRemaining;

  const isDeficitExpected = projectedBalanceAtEnd < 0;
  const runsOutEarly = estimatedDaysRunway < cycleInfo.daysRemaining;

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Proyeksi Akhir Bulan & Laju Pengeluaran
          </h2>
        </div>

        {isDeficitExpected ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" /> Risiko Defisit
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Proyeksi Aman
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
        {/* Burn Rate */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 mb-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Laju Belanja Rata-rata
          </div>
          <div className="text-base font-bold text-slate-800">
            {formatCurrency(dailyBurnRate)}
            <span className="text-xs font-normal text-slate-500"> / hari</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Batas Safe to Spend: {formatCurrency(safeToSpend.dailySafeToSpend)}
          </div>
        </div>

        {/* Projected End Balance */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="text-[11px] font-medium text-slate-500 mb-1">
            Proyeksi Sisa di Akhir Siklus
          </div>
          <div
            className={`text-base font-bold ${
              projectedBalanceAtEnd < 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {formatCurrency(projectedBalanceAtEnd)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {projectedBalanceAtEnd >= 0 ? 'Dapat ditabung ke wishlist' : 'Perlu kompensasi hemat'}
          </div>
        </div>

        {/* Ketahanan Uang (Runway) */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="text-[11px] font-medium text-slate-500 mb-1">
            Ketahanan Sisa Anggaran
          </div>
          <div
            className={`text-base font-bold ${
              runsOutEarly ? 'text-rose-600' : 'text-slate-800'
            }`}
          >
            {estimatedDaysRunway} Hari
            <span className="text-xs font-normal text-slate-500">
              {' '}(Sisa siklus: {cycleInfo.daysRemaining} hari)
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {runsOutEarly
              ? `Uang habis ${cycleInfo.daysRemaining - estimatedDaysRunway} hari lebih awal!`
              : 'Cukup sampai kiriman berikutnya'}
          </div>
        </div>
      </div>

      {/* Smart Advice Banner */}
      <div
        className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
          isDeficitExpected
            ? 'bg-rose-50/70 border border-rose-100 text-rose-800'
            : 'bg-indigo-50/70 border border-indigo-100 text-indigo-900'
        }`}
      >
        <div className="shrink-0 mt-0.5 font-bold">💡 Saran:</div>
        <div className="leading-relaxed">
          {isDeficitExpected ? (
            <span>
              Laju pengeluaran harianmu ({formatCurrency(dailyBurnRate)}) melebihi jatah aman ({formatCurrency(safeToSpend.dailySafeToSpend)}). Turunkan belanja harian sebesar setidaknya{' '}
              <strong>{formatCurrency(Math.max(0, dailyBurnRate - safeToSpend.dailySafeToSpend))}</strong> agar terhindar dari krisis akhir bulan.
            </span>
          ) : (
            <span>
              Manajemen keuanganmu sangat baik! Dengan laju saat ini, kamu diproyeksikan memiliki sisa{' '}
              <strong>{formatCurrency(projectedBalanceAtEnd)}</strong> saat siklus berakhir. Alokasikan ke target tabunganmu!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
