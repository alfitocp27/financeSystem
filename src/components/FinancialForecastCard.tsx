import React from 'react';
import { Compass, AlertCircle, CheckCircle2, Flame, Lightbulb } from 'lucide-react';
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
    <div className="bg-surface p-5 rounded-2xl sm:rounded-[14px] border border-border-default shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-border-default">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
            Proyeksi Akhir Bulan & Laju Pengeluaran
          </h2>
        </div>

        {isDeficitExpected ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-semantic-rose bg-semantic-rose-soft px-2.5 py-0.5 rounded-full border border-semantic-rose/20">
            <AlertCircle className="w-3.5 h-3.5" /> Risiko Defisit
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-semantic-green bg-semantic-green-soft px-2.5 py-0.5 rounded-full border border-semantic-green/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Proyeksi Aman
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
        {/* Burn Rate */}
        <div className="p-3 bg-surface-container-low rounded-xl border border-border-default">
          <div className="flex items-center gap-1 text-[11px] font-medium text-text-muted mb-1">
            <Flame className="w-3.5 h-3.5 text-semantic-amber" />
            <span>Laju Belanja Rata-rata</span>
          </div>
          <div className="text-base font-bold text-text-primary tabular-nums">
            {formatCurrency(dailyBurnRate)}
            <span className="text-xs font-normal text-text-muted"> / hari</span>
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">
            Batas Aman: {formatCurrency(safeToSpend.dailySafeToSpend)}
          </div>
        </div>

        {/* Projected End Balance */}
        <div className="p-3 bg-surface-container-low rounded-xl border border-border-default">
          <div className="text-[11px] font-medium text-text-muted mb-1">
            Proyeksi Sisa di Akhir Siklus
          </div>
          <div
            className={`text-base font-bold tabular-nums ${
              projectedBalanceAtEnd < 0 ? 'text-semantic-rose' : 'text-semantic-green'
            }`}
          >
            {formatCurrency(projectedBalanceAtEnd)}
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">
            {projectedBalanceAtEnd >= 0 ? 'Dapat disisihkan ke tabungan' : 'Perlu hemat sebelum kiriman'}
          </div>
        </div>

        {/* Ketahanan Uang (Runway) */}
        <div className="p-3 bg-surface-container-low rounded-xl border border-border-default">
          <div className="text-[11px] font-medium text-text-muted mb-1">
            Ketahanan Sisa Anggaran
          </div>
          <div
            className={`text-base font-bold tabular-nums ${
              runsOutEarly ? 'text-semantic-rose' : 'text-text-primary'
            }`}
          >
            {estimatedDaysRunway} Hari
            <span className="text-xs font-normal text-text-muted">
              {' '}(Sisa: {cycleInfo.daysRemaining} hari)
            </span>
          </div>
          <div className="text-[10px] text-text-muted mt-0.5">
            {runsOutEarly
              ? `Uang habis ${cycleInfo.daysRemaining - estimatedDaysRunway} hari lebih awal!`
              : 'Cukup sampai uang kiriman tiba'}
          </div>
        </div>
      </div>

      {/* Smart Advice Banner */}
      <div
        className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
          isDeficitExpected
            ? 'bg-semantic-rose-soft border border-semantic-rose/20 text-semantic-rose'
            : 'bg-primary-50 border border-primary-100 text-primary-900'
        }`}
      >
        <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-primary-600" />
        <div className="leading-relaxed">
          {isDeficitExpected ? (
            <span>
              Laju belanja harianmu ({formatCurrency(dailyBurnRate)}) melebihi jatah aman ({formatCurrency(safeToSpend.dailySafeToSpend)}). Tekan pengeluaran harian sebesar setidaknya{' '}
              <strong>{formatCurrency(Math.max(0, dailyBurnRate - safeToSpend.dailySafeToSpend))}</strong> agar terhindar dari krisis akhir bulan.
            </span>
          ) : (
            <span>
              Kondisi finansialmu terkendali! Dengan laju pengeluaran saat ini, diproyeksikan tersisa{' '}
              <strong>{formatCurrency(projectedBalanceAtEnd)}</strong> saat siklus berakhir.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
