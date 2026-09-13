import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  HelpCircle,
  PiggyBank,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatCompactCurrency, formatDateIndo } from '../lib/formatters';

interface SafeToSpendCardProps {
  onOpenSimulator?: () => void;
}

export const SafeToSpendCard: React.FC<SafeToSpendCardProps> = ({ onOpenSimulator }) => {
  const { safeToSpend, cycleInfo, totalBalance, totalIncomeInCycle, totalExpenseInCycle } = useFinance();

  const getPaceBadge = () => {
    switch (safeToSpend.paceStatus) {
      case 'safe':
        return {
          bg: 'bg-semantic-green-soft text-semantic-green border-semantic-green/20',
          dot: 'bg-semantic-green',
          icon: ShieldCheck,
          text: 'Status: Safe',
          desc: 'Pengeluaran harianmu masih di bawah batas aman.',
        };
      case 'warning':
        return {
          bg: 'bg-semantic-amber-soft text-semantic-amber border-semantic-amber/20',
          dot: 'bg-semantic-amber',
          icon: AlertTriangle,
          text: 'Status: Warning',
          desc: 'Jatah belanja hari ini hampir habis (mencapai 80%).',
        };
      case 'overpace':
        return {
          bg: 'bg-semantic-rose-soft text-semantic-rose border-semantic-rose/20',
          dot: 'bg-semantic-rose',
          icon: AlertCircle,
          text: 'Status: Overpace',
          desc: 'Pengeluaran hari ini melebihi jatah harian. Disarankan berhemat esok hari.',
        };
      case 'no-budget':
      default:
        return {
          bg: 'bg-semantic-blue-soft text-semantic-blue border-semantic-blue/20',
          dot: 'bg-semantic-blue',
          icon: HelpCircle,
          text: 'Estimasi Saldo',
          desc: 'Berdasarkan sisa saldo riil di seluruh rekening dompetmu.',
        };
    }
  };

  const badge = getPaceBadge();
  const netSavings = totalIncomeInCycle - totalExpenseInCycle;

  return (
    <div className="space-y-4">
      {/* Primary Highlight: Safe to Spend Card */}
      <div className="bg-surface rounded-2xl sm:rounded-[14px] p-5 sm:p-6 border border-border-default shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left Column: Number & Indicators */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] uppercase tracking-wider font-semibold text-text-secondary">
                Safe to Spend
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.text}
              </span>

              {onOpenSimulator && (
                <button
                  onClick={onOpenSimulator}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-50 hover:bg-primary-100 text-primary-600 transition-colors ml-auto md:ml-2"
                  title="Simulasi belanja ekstra"
                >
                  <Calculator className="w-3 h-3" />
                  <span>Simulasi Jajan</span>
                </button>
              )}
            </div>

            {/* Daily Amount */}
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-text-primary tabular-nums tracking-tight">
                {formatCurrency(safeToSpend.dailySafeToSpend)}
              </span>
              <span className="text-sm text-text-muted font-normal">/ hari</span>
            </div>

            <p className="text-xs text-text-secondary mt-1.5">
              <strong className="text-text-primary font-semibold">
                {cycleInfo.daysRemaining} hari tersisa
              </strong>{' '}
              dalam siklus ini • Sisa pagu aktif{' '}
              <span className="font-semibold text-text-primary tabular-nums">
                {formatCurrency(safeToSpend.remainingBudget)}
              </span>
            </p>
          </div>

          {/* Right Column: Safe-to-Spend Pacing Visualizer */}
          <div className="w-full md:w-80 bg-surface-container-low p-4 rounded-xl border border-border-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
              <span className="font-medium">Pacing Pengeluaran</span>
              <span
                className={`font-semibold tabular-nums ${
                  safeToSpend.paceStatus === 'overpace'
                    ? 'text-semantic-rose'
                    : safeToSpend.paceStatus === 'warning'
                    ? 'text-semantic-amber'
                    : 'text-semantic-green'
                }`}
              >
                {cycleInfo.progressPercentage}% Periode Berlalu
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-border-default h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  safeToSpend.paceStatus === 'overpace'
                    ? 'bg-semantic-rose'
                    : safeToSpend.paceStatus === 'warning'
                    ? 'bg-semantic-amber'
                    : 'bg-primary-500'
                }`}
                style={{ width: `${cycleInfo.progressPercentage}%` }}
              />
            </div>

            {/* Sub-label dates */}
            <div className="flex justify-between items-center mt-2 text-[11px] text-text-muted">
              <span>{formatDateIndo(cycleInfo.startDate)}</span>
              <span className="text-text-secondary font-medium">
                Hari ke-{cycleInfo.daysPassed} dari {cycleInfo.totalDays}
              </span>
              <span>{formatDateIndo(cycleInfo.endDate)}</span>
            </div>
          </div>
        </div>

        {/* Today's Usage Breakdown Banner */}
        <div className="mt-5 pt-4 border-t border-border-default grid grid-cols-2 gap-3">
          <div className="p-3 bg-bg-secondary rounded-xl">
            <div className="text-[11px] font-medium text-text-muted">Terpakai Hari Ini</div>
            <div className="text-sm sm:text-base font-bold text-text-primary mt-0.5 tabular-nums">
              {formatCurrency(safeToSpend.todayExpenses)}
            </div>
          </div>
          <div className="p-3 bg-bg-secondary rounded-xl">
            <div className="text-[11px] font-medium text-text-muted">Sisa Jatah Hari Ini</div>
            <div
              className={`text-sm sm:text-base font-bold mt-0.5 tabular-nums ${
                safeToSpend.remainingToday < 0 ? 'text-semantic-rose' : 'text-semantic-green'
              }`}
            >
              {formatCurrency(safeToSpend.remainingToday)}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Financial Summary Cards Grid (Total Saldo, Pemasukan, Pengeluaran, Net Tabungan) */}
      <div className="bg-surface rounded-2xl sm:rounded-[14px] border border-border-default shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border-default">
          {/* Card 1: Total Saldo */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium">Total Saldo</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-50 text-primary-600">
                Kas Riil
              </span>
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-text-primary tracking-tight tabular-nums">
                {formatCompactCurrency(totalBalance)}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5 truncate">
                {formatCurrency(totalBalance)}
              </div>
            </div>
          </div>

          {/* Card 2: Total Pemasukan */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium">Pemasukan Siklus</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-semantic-green-soft text-semantic-green">
                <ArrowUpRight className="w-3 h-3" /> Masuk
              </span>
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-semantic-green tracking-tight tabular-nums">
                {formatCompactCurrency(totalIncomeInCycle)}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5 truncate">
                {formatCurrency(totalIncomeInCycle)}
              </div>
            </div>
          </div>

          {/* Card 3: Total Pengeluaran */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium">Pengeluaran Siklus</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-semantic-rose-soft text-semantic-rose">
                <ArrowDownRight className="w-3 h-3" /> Keluar
              </span>
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-lg font-bold text-semantic-rose tracking-tight tabular-nums">
                {formatCompactCurrency(totalExpenseInCycle)}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5 truncate">
                {formatCurrency(totalExpenseInCycle)}
              </div>
            </div>
          </div>

          {/* Card 4: Net Surplus / Defisit */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium">Surplus / Tabungan</span>
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  netSavings >= 0
                    ? 'bg-semantic-green-soft text-semantic-green'
                    : 'bg-semantic-rose-soft text-semantic-rose'
                }`}
              >
                <PiggyBank className="w-3 h-3" /> Net
              </span>
            </div>
            <div className="mt-2">
              <div
                className={`text-base sm:text-lg font-bold tracking-tight tabular-nums ${
                  netSavings >= 0 ? 'text-text-primary' : 'text-semantic-rose'
                }`}
              >
                {formatCompactCurrency(netSavings)}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5 truncate">
                {formatCurrency(netSavings)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
