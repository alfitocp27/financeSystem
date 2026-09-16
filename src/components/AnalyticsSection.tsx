import React, { useMemo } from 'react';
import {
  PieChart as ChartIcon,
  Activity,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Clock,
  PieChart,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/formatters';
import {
  filterCycleExpenses,
  calculateDailyBurnRate,
  calculateSavingRate,
  calculateTopCategory,
  calculatePeakSpendingDay,
  aggregateCategoryDonutData,
  generateDynamicInsights,
  type DynamicInsightItem,
} from '../lib/analytics-utils';
import { CategoryDonutChart } from './CategoryDonutChart';

const getInsightIcon = (iconName: DynamicInsightItem['iconName']) => {
  switch (iconName) {
    case 'ShieldAlert':
      return ShieldAlert;
    case 'Activity':
      return Activity;
    case 'TrendingUp':
      return TrendingUp;
    case 'PieChart':
      return PieChart;
    case 'CheckCircle2':
      return CheckCircle2;
    case 'Clock':
    default:
      return Clock;
  }
};

const getInsightToneClass = (tone: DynamicInsightItem['tone']) => {
  switch (tone) {
    case 'danger':
      return 'text-semantic-rose-text';
    case 'warning':
      return 'text-semantic-amber-text';
    case 'success':
      return 'text-semantic-green-text';
    case 'info':
      return 'text-text-gold';
    case 'neutral':
    default:
      return 'text-text-muted';
  }
};

export const AnalyticsSection: React.FC = () => {
  const {
    transactions,
    categories,
    totalExpenseInCycle,
    totalIncomeInCycle,
    cycleInfo,
    safeToSpend,
  } = useFinance();

  // Filter expenses strictly within the active budget cycle
  const cycleExpenses = useMemo(() => {
    return filterCycleExpenses(transactions, cycleInfo.startDate, cycleInfo.endDate);
  }, [transactions, cycleInfo.startDate, cycleInfo.endDate]);

  // Aggregate expenses per category: Top 5 + "Lainnya"
  const donutCategoryData = useMemo(() => {
    return aggregateCategoryDonutData(cycleExpenses, categories, totalExpenseInCycle);
  }, [cycleExpenses, categories, totalExpenseInCycle]);

  // Active cycle formatted label
  const cycleLabel = useMemo(() => {
    const startFormatted = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(cycleInfo.startDate);
    const endFormatted = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(cycleInfo.endDate);
    return `Siklus ${startFormatted} - ${endFormatted}`;
  }, [cycleInfo.startDate, cycleInfo.endDate]);

  // 4 Cycle Performance Metrics
  const dailyBurnRate = useMemo(() => {
    return calculateDailyBurnRate(totalExpenseInCycle, cycleInfo.daysPassed);
  }, [totalExpenseInCycle, cycleInfo.daysPassed]);

  const savingRate = useMemo(() => {
    return calculateSavingRate(totalIncomeInCycle, totalExpenseInCycle);
  }, [totalIncomeInCycle, totalExpenseInCycle]);

  const topCategory = useMemo(() => {
    return calculateTopCategory(cycleExpenses, categories, totalExpenseInCycle);
  }, [cycleExpenses, categories, totalExpenseInCycle]);

  const peakSpendingDay = useMemo(() => {
    return calculatePeakSpendingDay(cycleExpenses);
  }, [cycleExpenses]);

  // Dynamic Financial Insights (Max 3 text-led analytical notes)
  const dynamicInsights = useMemo(() => {
    return generateDynamicInsights({
      dailyBurnRate,
      dailySafeToSpend: safeToSpend.dailySafeToSpend,
      daysPassed: cycleInfo.daysPassed,
      daysRemaining: cycleInfo.daysRemaining,
      totalExpense: totalExpenseInCycle,
      topCategory,
      peakSpendingDay,
    });
  }, [
    dailyBurnRate,
    safeToSpend.dailySafeToSpend,
    cycleInfo.daysPassed,
    cycleInfo.daysRemaining,
    totalExpenseInCycle,
    topCategory,
    peakSpendingDay,
  ]);

  return (
    <div className="space-y-6">
      {/* Layer 1: Cycle Performance Strip (Flat unbordered ledger) */}
      <div className="bg-surface rounded-xl border border-border-default shadow-xs overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4">
          {/* Metric 1: Daily Burn Rate */}
          <div className="p-4 sm:p-5 border-r border-b lg:border-b-0 border-border-subtle flex flex-col justify-between min-h-[92px]">
            <span className="text-xs font-medium text-text-muted">
              Rata-rata Harian
            </span>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-extrabold text-text-primary tabular-nums tracking-tight block">
                {formatCurrency(dailyBurnRate)}
              </span>
              <span className="text-xs text-text-muted mt-0.5 block truncate">
                Berdasarkan {Math.max(1, cycleInfo.daysPassed)} hari siklus
              </span>
            </div>
          </div>

          {/* Metric 2: Saving Rate */}
          <div className="p-4 sm:p-5 border-b lg:border-b-0 lg:border-r border-border-subtle flex flex-col justify-between min-h-[92px]">
            <span className="text-xs font-medium text-text-muted">
              Saving Rate
            </span>
            <div className="mt-2">
              <span
                className={`text-lg sm:text-xl font-extrabold tabular-nums tracking-tight block ${
                  savingRate >= 0 ? 'text-text-gold' : 'text-semantic-rose-text'
                }`}
              >
                {savingRate > 0 ? `+${savingRate}%` : `${savingRate}%`}
              </span>
              <span className="text-xs text-text-muted mt-0.5 block truncate">
                {totalIncomeInCycle > 0 ? 'Dari pemasukan siklus' : 'Belum ada pemasukan'}
              </span>
            </div>
          </div>

          {/* Metric 3: Top Spending Category */}
          <div className="p-4 sm:p-5 border-r lg:border-r border-border-subtle flex flex-col justify-between min-h-[92px]">
            <span className="text-xs font-medium text-text-muted">
              Pos Terbesar
            </span>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight block truncate">
                {topCategory ? topCategory.name : '—'}
              </span>
              <span className="text-xs text-text-muted mt-0.5 block truncate">
                {topCategory
                  ? `${topCategory.percentage}% (${formatCurrency(topCategory.total)})`
                  : 'Belum ada pengeluaran'}
              </span>
            </div>
          </div>

          {/* Metric 4: Peak Spending Day */}
          <div className="p-4 sm:p-5 flex flex-col justify-between min-h-[92px]">
            <span className="text-xs font-medium text-text-muted">
              Hari Terboros
            </span>
            <div className="mt-2">
              <span className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight block truncate">
                {peakSpendingDay ? peakSpendingDay.dayLabel : '—'}
              </span>
              <span className="text-xs text-text-muted mt-0.5 block truncate">
                {peakSpendingDay
                  ? `Puncak ${formatCurrency(peakSpendingDay.total)}`
                  : 'Belum ada transaksi'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Layer 2: Hero Donut Section (Focal Point) */}
      <div className="bg-surface p-5 sm:p-6 rounded-xl border border-border-default shadow-xs space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border-subtle">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-soft text-text-gold flex items-center justify-center shrink-0">
              <ChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary tracking-tight">
                Komposisi Pengeluaran per Kategori
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Distribusi pos belanja terbesar pada {cycleLabel}
              </p>
            </div>
          </div>
          {donutCategoryData.length > 0 && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-surface-elevated text-text-secondary border border-border-subtle">
              {donutCategoryData.length} Pos Pengeluaran
            </span>
          )}
        </div>

        {/* Interactive Donut Chart */}
        <CategoryDonutChart
          data={donutCategoryData}
          totalValue={totalExpenseInCycle}
          cycleLabel={cycleLabel}
        />

        {/* Dynamic Financial Insights (Flat Integrated Notes) */}
        {dynamicInsights.length > 0 && (
          <div className="pt-4 border-t border-border-subtle space-y-2.5">
            {dynamicInsights.map((insight) => {
              const Icon = getInsightIcon(insight.iconName);
              const toneClass = getInsightToneClass(insight.tone);

              return (
                <div key={insight.id} className="flex items-start gap-2.5 text-xs">
                  <div className={`shrink-0 mt-0.5 ${toneClass}`}>
                    <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                  </div>
                  <p className="text-text-secondary leading-relaxed">
                    <strong className="text-text-primary font-medium mr-1.5">
                      {insight.title}:
                    </strong>
                    {insight.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
