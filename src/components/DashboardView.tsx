import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  Utensils,
  Home,
  Bus,
  BookOpen,
  Coffee,
  ShoppingBag,
  ArrowRightLeft,
  Trash2,
  Tag,
  Briefcase,
  Award,
  Wallet as WalletIcon,
  PiggyBank,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  ComposedChart,
  Area,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatCompactCurrency, formatDateIndo, formatRelativeDate, getLocalDateString } from '../lib/formatters';
import { getMutedCategoryStyle } from '../lib/category-color-utils';
import { SafeToSpendCard } from './SafeToSpendCard';
import type { ToastData } from './Toast';

// --- Dashboard Props ---
interface DashboardViewProps {
  studentName: string;
  onOpenQuickAdd?: () => void;
  onOpenSimulator: () => void;
  onOpenTransfer: () => void;
  onOpenAddWallet: () => void;
  onSelectTab: (tab: any) => void;
  onShowToast?: (msg: string | ToastData) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  studentName,
  onOpenSimulator,
  onOpenTransfer,
  onOpenAddWallet,
  onSelectTab,
  onShowToast,
}) => {
  const {
    safeToSpend,
    cycleInfo,
    totalBalance,
    wallets,
    categories,
    budgets,
    transactions,
    savingsGoals,
    deleteTransaction,
    addTransaction,
  } = useFinance();

  // Chart Interactive Hover States
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const startStr = getLocalDateString(cycleInfo.startDate);
  const endStr = getLocalDateString(cycleInfo.endDate);

  // Real Budget & Expense calculations from Database
  const totalAllocatedBudget = budgets.reduce((acc, b) => acc + Number(b.amount), 0);
  const totalCycleExpense = transactions
    .filter((t) => {
      const d = t.transaction_date ? t.transaction_date.slice(0, 10) : '';
      return t.type === 'expense' && d >= startStr && d <= endStr;
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const effectiveBudgetCeiling = totalAllocatedBudget > 0 ? totalAllocatedBudget : 2500000;
  const totalRemainingQuota = Math.max(0, effectiveBudgetCeiling - totalCycleExpense);
  const overallBudgetPercentage = effectiveBudgetCeiling > 0
    ? Math.min(100, Math.round((totalCycleExpense / effectiveBudgetCeiling) * 100))
    : 0;

  // Real Category Spending from Database
  const categorySpending = useMemo(() => {
    const expenseCats = categories.filter((c) => c.type === 'expense');
    const inCycleExpenses = transactions.filter((t) => {
      const d = t.transaction_date ? t.transaction_date.slice(0, 10) : '';
      return t.type === 'expense' && d >= startStr && d <= endStr;
    });

    const mapped = expenseCats.map((cat) => {
      const total = inCycleExpenses
        .filter((t) => t.category_id === cat.id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color || '#B9924F',
        icon: cat.icon,
        value: total,
      };
    });

    // Handle any expenses with null or unmatched category_id
    const uncategorizedTotal = inCycleExpenses
      .filter((t) => !t.category_id || !expenseCats.some((c) => c.id === t.category_id))
      .reduce((sum, t) => sum + Number(t.amount), 0);

    if (uncategorizedTotal > 0) {
      mapped.push({
        id: 'cat-uncategorized',
        name: 'Lainnya / Umum',
        color: '#4F5765',
        icon: 'tag',
        value: uncategorizedTotal,
      });
    }

    mapped.sort((a, b) => b.value - a.value);
    const totalSpent = mapped.reduce((acc, c) => acc + c.value, 0);

    return mapped.map((c) => ({
      ...c,
      ratio: totalSpent > 0 ? c.value / totalSpent : 0,
    }));
  }, [categories, transactions, startStr, endStr]);

  // Active category slices for proportional breakdown bar
  const activeSlices = useMemo(() => {
    return categorySpending.filter((c) => c.value > 0);
  }, [categorySpending]);

  // Real Daily Cash Flow Line Chart Data (Recharts ComposedChart - adapted from 21st.dev line-charts-9)
  const cashFlowChartData = useMemo(() => {
    const start = new Date(cycleInfo.startDate);
    const end = new Date(cycleInfo.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay));

    const seriesData: {
      date: Date;
      dateStr: string;
      dayLabel: string;
      dayNum: number;
      expense: number | null;
      isToday: boolean;
      isFuture: boolean;
      benchmark: number;
    }[] = [];

    let maxDailyExp = 0;

    for (let i = 0; i <= daysCount; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      const dateStr = getLocalDateString(d);
      const isFuture = d.getTime() > today.getTime();

      const dayExpense = transactions
        .filter((t) => t.type === 'expense' && t.transaction_date === dateStr)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      if (!isFuture && dayExpense > maxDailyExp) {
        maxDailyExp = dayExpense;
      }

      const dayLabel = `${d.getDate()} ${new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(d)}`;

      seriesData.push({
        date: d,
        dateStr,
        dayLabel,
        dayNum: d.getDate(),
        expense: isFuture ? null : dayExpense,
        isToday: d.getTime() === today.getTime(),
        isFuture,
        benchmark: safeToSpend.dailySafeToSpend > 0 ? safeToSpend.dailySafeToSpend : 0,
      });
    }

    const benchmarkSafe = safeToSpend.dailySafeToSpend > 0 ? safeToSpend.dailySafeToSpend : 50000;
    const ceilingVal = Math.max(maxDailyExp, benchmarkSafe * 1.3, 50000);
    const yDomainMax = Math.ceil(ceilingVal / 20000) * 20000;

    return {
      seriesData,
      maxDailyExp,
      yDomainMax,
      benchmarkSafe: safeToSpend.dailySafeToSpend,
    };
  }, [cycleInfo, transactions, safeToSpend.dailySafeToSpend]);

  const handleChartKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (cashFlowChartData.seriesData.length === 0) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setHoveredPointIndex((prev) => (prev === null ? 0 : Math.min(cashFlowChartData.seriesData.length - 1, prev + 1)));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setHoveredPointIndex((prev) => (prev === null ? 0 : Math.max(0, prev - 1)));
    } else if (e.key === 'Escape') {
      setHoveredPointIndex(null);
    }
  };

  // Helper icons
  const getCategoryIcon = (iconName?: string) => {
    switch (iconName) {
      case 'utensils':
        return <Utensils className="w-4 h-4" />;
      case 'home':
        return <Home className="w-4 h-4" />;
      case 'bus':
        return <Bus className="w-4 h-4" />;
      case 'book-open':
        return <BookOpen className="w-4 h-4" />;
      case 'coffee':
        return <Coffee className="w-4 h-4" />;
      case 'shopping-bag':
        return <ShoppingBag className="w-4 h-4" />;
      case 'briefcase':
        return <Briefcase className="w-4 h-4" />;
      case 'award':
        return <Award className="w-4 h-4" />;
      case 'wallet':
        return <WalletIcon className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const recentTransactions = transactions.slice(0, 5);
  const activeHoveredPoint = hoveredPointIndex !== null ? cashFlowChartData.seriesData[hoveredPointIndex] : null;

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Top Greeting Header */}
      <div className="flex flex-col gap-1 pt-1 mb-6">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Selamat datang kembali, {studentName}
        </h1>
        <p className="text-sm text-text-muted mt-0.5">
          Berikut ringkasan kondisi keuanganmu untuk siklus bulan {new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(cycleInfo.startDate)}.
        </p>
      </div>

      {/* 2. Primary Focal Point: Safe to Spend & Financial Summary Ribbon */}
      <section className="mb-6">
        <SafeToSpendCard onOpenSimulator={onOpenSimulator} />
      </section>

      {/* Arus Kas Harian SVG Wave Chart */}
      <section className="bg-surface rounded-xl border border-border-default shadow-xs mb-6 overflow-hidden">
        <div className="p-6 relative select-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-text-primary tracking-tight">Arus Kas Harian</span>
              <span className="text-xs text-text-muted">
                {new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(cycleInfo.startDate)}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs flex-wrap">
              {activeHoveredPoint && activeHoveredPoint.expense !== null ? (
                <span className="font-semibold text-text-gold bg-primary-soft px-2.5 py-1 rounded-lg border border-border-gold animate-in fade-in duration-100">
                  {activeHoveredPoint.dayLabel}: {formatCurrency(activeHoveredPoint.expense)}
                </span>
              ) : (
                <>
                  <span className="flex items-center gap-1.5 text-text-muted">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span>Tren Pengeluaran</span>
                  </span>
                  {safeToSpend.dailySafeToSpend > 0 && (
                    <span className="flex items-center gap-1.5 text-text-muted">
                      <span className="w-3.5 h-0.5 border-t-2 border-dashed border-semantic-amber" />
                      <span>Batas Harian ({formatCompactCurrency(safeToSpend.dailySafeToSpend)})</span>
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Interactive Line Chart (Adapted from 21st.dev sean0205/line-charts-9) */}
          <div
            className="w-full focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg"
            tabIndex={0}
            role="region"
            aria-label={`Grafik tren pengeluaran harian siklus ${new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(cycleInfo.startDate)}. Batas harian aman: ${formatCurrency(safeToSpend.dailySafeToSpend)} per hari. Gunakan tombol panah kiri dan kanan untuk menjelajah tanggal.`}
            onKeyDown={handleChartKeyDown}
          >
            <div className="h-64 sm:h-72 w-full select-none">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={cashFlowChartData.seriesData}
                  margin={{ top: 20, right: 16, left: -10, bottom: 5 }}
                  onMouseMove={(state) => {
                    if (state && state.activeTooltipIndex !== undefined) {
                      setHoveredPointIndex(state.activeTooltipIndex);
                    }
                  }}
                  onMouseLeave={() => setHoveredPointIndex(null)}
                >
                  {/* Subtle Area Gradient definition - Muted Gold depth cue (12-14% near line, fading to 0) */}
                  <defs>
                    <linearGradient id="expenseTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary, #B9924F)" stopOpacity={0.14} />
                      <stop offset="95%" stopColor="var(--primary, #B9924F)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>

                  {/* Subtle horizontal CartesianGrid lines matching active theme */}
                  <CartesianGrid
                    strokeDasharray="4 8"
                    stroke="var(--chart-grid, rgba(255,255,255,0.04))"
                    horizontal={true}
                    vertical={false}
                  />

                  {/* Clean X-Axis */}
                  <XAxis
                    dataKey="dayLabel"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--chart-tick, #8A93A0)' }}
                    tickMargin={12}
                    interval="preserveStartEnd"
                    minTickGap={24}
                  />

                  {/* Clean Y-Axis */}
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: 'var(--chart-tick, #8A93A0)' }}
                    tickFormatter={(val) => (val > 0 ? formatCompactCurrency(val).replace('Rp ', '') : '0')}
                    tickMargin={8}
                    domain={[0, cashFlowChartData.yDomainMax]}
                  />

                  {/* Horizontal Benchmark Line: Daily Safe to Spend in Muted Bronze Ochre */}
                  {safeToSpend.dailySafeToSpend > 0 && (
                    <ReferenceLine
                      y={safeToSpend.dailySafeToSpend}
                      stroke="var(--chart-benchmark, #A98245)"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      strokeOpacity={0.8}
                      label={{
                        value: `Batas ${formatCompactCurrency(safeToSpend.dailySafeToSpend).replace('Rp ', '')}`,
                        position: 'insideTopRight',
                        fill: 'var(--chart-benchmark-text, #BE9553)',
                        fontSize: 12,
                        fontWeight: 500,
                        offset: 6,
                      }}
                    />
                  )}

                  {/* Custom Tooltip adapted for active theme */}
                  <RechartsTooltip
                    isAnimationActive={false}
                    cursor={{
                      stroke: 'var(--primary, #B9924F)',
                      strokeWidth: 1.5,
                      strokeDasharray: '4 4',
                      strokeOpacity: 0.6,
                    }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const data = payload[0]?.payload;
                      if (!data) return null;

                      const expense = data.expense ?? 0;
                      const benchmark = safeToSpend.dailySafeToSpend;
                      const diff = expense - benchmark;
                      const isOver = benchmark > 0 && expense > benchmark;

                      return (
                        <div className="bg-surface-modal border border-border-default rounded-xl p-3 shadow-xl text-text-primary text-xs max-w-xs animate-in fade-in zoom-in-95 duration-100 z-30">
                          <div className="flex items-center justify-between gap-3 text-text-muted pb-1.5 mb-1.5 border-b border-border-default">
                            <span className="font-semibold text-text-primary">{data.dayLabel}</span>
                            <span
                              className={`px-1.5 py-0.5 rounded-sm font-semibold text-xs ${
                                data.isFuture
                                  ? 'bg-surface-elevated text-text-muted'
                                  : isOver
                                  ? 'bg-semantic-rose-soft text-semantic-rose-text border border-semantic-rose/30'
                                  : 'bg-semantic-green-soft text-semantic-green-text border border-semantic-green/30'
                              }`}
                            >
                              {data.isFuture ? 'Belum terjadi' : isOver ? 'Melebihi batas' : 'Aman'}
                            </span>
                          </div>

                          <div className="space-y-1.5 tabular-nums">
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-text-muted">Total Pengeluaran:</span>
                              <span className="font-bold text-text-primary">
                                {data.isFuture ? 'Rp 0' : formatCurrency(expense)}
                              </span>
                            </div>

                            {benchmark > 0 && (
                              <>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-text-muted">Batas Aman:</span>
                                  <span className="text-text-secondary">{formatCurrency(benchmark)}</span>
                                </div>

                                {!data.isFuture && (
                                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-border-default">
                                    <span className="text-text-muted">Selisih:</span>
                                    <span className={`font-semibold ${isOver ? 'text-semantic-rose-text' : 'text-semantic-green-text'}`}>
                                      {diff > 0 ? `+ ${formatCurrency(diff)}` : `- ${formatCurrency(Math.abs(diff))}`}
                                    </span>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    }}
                  />

                  {/* Subtle Area Gradient under Line for soft depth cues */}
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="none"
                    fill="url(#expenseTrendGradient)"
                    connectNulls={false}
                    isAnimationActive={true}
                    animationDuration={600}
                    tooltipType="none"
                  />

                  {/* Clean Smooth Line in Muted Gold */}
                  <Line
                    type="monotone"
                    dataKey="expense"
                    stroke="var(--primary, #B9924F)"
                    strokeWidth={2.5}
                    connectNulls={false}
                    isAnimationActive={true}
                    animationDuration={600}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      if (!payload || payload.expense === null || payload.isFuture) return <g key={`dot-empty-${cx}-${cy}`} />;
                      const isOver = safeToSpend.dailySafeToSpend > 0 && payload.expense > safeToSpend.dailySafeToSpend;

                      // Rose dot only for points strictly exceeding the safe limit
                      if (isOver) {
                        return (
                          <circle
                            key={`dot-${payload.dateStr}`}
                            cx={cx}
                            cy={cy}
                            r={3.5}
                            fill="var(--semantic-rose, #A85F68)"
                            stroke="var(--surface, #14171F)"
                            strokeWidth={1.5}
                          />
                        );
                      }

                      // Normal point: subtle muted gold dot
                      return (
                        <circle
                          key={`dot-${payload.dateStr}`}
                          cx={cx}
                          cy={cy}
                          r={2}
                          fill="var(--primary, #B9924F)"
                          stroke="var(--surface, #14171F)"
                          strokeWidth={1}
                          opacity={0.8}
                        />
                      );
                    }}
                    activeDot={(props: any) => {
                      const { cx, cy, payload } = props;
                      const isOver = safeToSpend.dailySafeToSpend > 0 && payload && payload.expense > safeToSpend.dailySafeToSpend;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={5}
                          fill={isOver ? 'var(--semantic-rose, #A85F68)' : 'var(--primary, #B9924F)'}
                          stroke="var(--primary-focus, #D6B875)"
                          strokeWidth={2}
                        />
                      );
                    }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 2-Column Content Grid: Left (Span 8) vs Right (Span 4) (Stitch Exact) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Ringkasan Penggunaan Budget (Modern Minimalist Diagram & Breakdown) */}
          <div className="bg-surface rounded-xl p-6 border border-border-default shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-lg font-semibold text-text-primary tracking-tight">
                    Ringkasan Penggunaan Budget
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      overallBudgetPercentage >= 100
                        ? 'bg-semantic-rose-soft text-semantic-rose-text border-semantic-rose/20'
                        : 'bg-semantic-green-soft text-semantic-green-text border-semantic-green/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        overallBudgetPercentage >= 100 ? 'bg-semantic-rose' : 'bg-semantic-green'
                      }`}
                    />
                    {overallBudgetPercentage >= 100
                      ? `Overbudget (${overallBudgetPercentage}%)`
                      : `Aman (${overallBudgetPercentage}%)`}
                  </span>
                </div>
                <p className="text-xs text-text-muted flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  <span>Siklus: {formatDateIndo(cycleInfo.startDate)} – {formatDateIndo(cycleInfo.endDate)} • </span>
                  <span className="text-text-secondary font-medium">Sisa {cycleInfo.daysRemaining} hari</span>
                </p>
              </div>

              <div className="flex flex-col sm:items-end justify-center">
                <span className="text-xs text-text-muted font-medium mb-0.5">Realisasi Terpakai</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-semibold text-text-primary tabular-nums tracking-tight">
                    {formatCurrency(totalCycleExpense)}
                  </span>
                  <span className="text-xs text-text-secondary font-medium tabular-nums">
                    / {formatCurrency(effectiveBudgetCeiling)} plafon
                  </span>
                </div>
                <span className="text-xs text-text-muted mt-0.5">dari total plafon alokasi</span>
              </div>
            </div>

            {/* Visual Bar Meter: Proportional Category Breakdown Strip */}
            <div className="pt-4 pb-2">
              <div className="flex items-center justify-between text-xs text-text-muted mb-2">
                <span>Distribusi Realisasi Budget</span>
                <span className="font-medium text-text-secondary">
                  Sisa Kuota: <strong className="text-text-primary tabular-nums font-semibold">{formatCurrency(totalRemainingQuota)}</strong>
                </span>
              </div>
              <div className="h-3 w-full bg-bg-secondary rounded-full flex overflow-hidden p-0.5 gap-0.5 border border-border-subtle">
                {activeSlices.map((slice) => {
                  const sliceStyle = getMutedCategoryStyle(slice.color);

                  return (
                    <div
                      key={slice.id}
                      className="h-full transition-all duration-500 rounded-full"
                      style={{
                        width: `${(slice.ratio * 100).toFixed(1)}%`,
                        backgroundColor: sliceStyle.color,
                      }}
                      title={`${slice.name} (${(slice.ratio * 100).toFixed(1)}%)`}
                    />
                  );
                })}
                <div
                  className="bg-surface-elevated/70 border border-border-subtle flex-1 h-full rounded-full"
                  title="Sisa Budget"
                />
              </div>
            </div>

            {/* Comparative Category Diagrams: Clean Borderless Progress List */}
            <div className="divide-y divide-border-subtle pt-3">
              {categorySpending.slice(0, 4).map((cat) => {
                const budget = budgets.find((b) => b.category_id === cat.id);
                const budgetAmount = budget ? Number(budget.amount) : 0;
                const spent = cat.value;
                const percentage = budgetAmount > 0 ? Math.min(100, Math.round((spent / budgetAmount) * 100)) : 0;
                const isOver = budgetAmount > 0 && spent > budgetAmount;
                const iconStyle = getMutedCategoryStyle(cat.color);

                return (
                  <div key={cat.id} className="py-3.5 first:pt-1 last:pb-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                          style={{
                            backgroundColor: iconStyle.backgroundColor,
                            color: iconStyle.color,
                            borderColor: iconStyle.borderColor,
                          }}
                        >
                          {getCategoryIcon(cat.icon)}
                        </div>
                        <span className="text-xs font-semibold text-text-primary truncate">
                          {cat.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="tabular-nums text-text-secondary font-medium">
                          {formatCompactCurrency(spent)}{' '}
                          <span className="text-text-muted font-normal">
                            / {budgetAmount > 0 ? formatCompactCurrency(budgetAmount) : '0k'}
                          </span>
                        </span>
                        <span
                          className={`tabular-nums font-semibold ${
                            isOver
                              ? 'text-semantic-rose-text'
                              : 'text-text-muted'
                          }`}
                        >
                          ({budgetAmount > 0 ? `${percentage}%` : 'Belum diset'})
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-surface-elevated h-1.5 rounded-full overflow-hidden mb-1.5 border border-border-subtle">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-semantic-rose' : ''
                        }`}
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: isOver ? undefined : iconStyle.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span>{percentage}% terpakai</span>
                      <span className={`tabular-nums font-medium ${isOver ? 'text-semantic-rose-text' : 'text-text-secondary'}`}>
                        {isOver
                          ? `Lewat ${formatCompactCurrency(spent - budgetAmount)}`
                          : budgetAmount > 0
                          ? `Sisa ${formatCompactCurrency(budgetAmount - spent)}`
                          : 'Plafon belum diset'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-border-default flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {categorySpending.length} pos budget di database
              </span>
              <button
                onClick={() => onSelectTab('budget')}
                className="text-xs text-primary hover:text-primary-hover inline-flex items-center gap-1.5 font-medium transition-colors py-2 px-2 min-h-[44px] sm:min-h-0 sm:p-0"
              >
                <span>Lihat Analisis Detail</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Dompet Saya (Real Wallets from Database: BCA, GoPay, Tunai) */}
          <div className="bg-surface rounded-xl p-6 border border-border-default shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-text-primary tracking-tight">
                  Dompet &amp; Rekening
                </h2>
                <span className="text-xs text-text-muted">
                  Alokasi saldo aktif per rekening mahasiswa
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenTransfer}
                  className="text-xs text-primary hover:bg-primary-soft px-3.5 py-2 min-h-[44px] sm:min-h-0 sm:py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-border-gold font-medium"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transfer</span>
                </button>
                <button
                  onClick={onOpenAddWallet}
                  className="text-xs text-text-secondary hover:bg-surface-elevated px-3.5 py-2 min-h-[44px] sm:min-h-0 sm:py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-border-default font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>

            {/* Flat Account Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle bg-surface-elevated rounded-xl border border-border-default">
              {wallets.map((wallet) => {
                const share = totalBalance > 0 ? ((wallet.balance / totalBalance) * 100).toFixed(1) : '0';

                return (
                  <div
                    key={wallet.id}
                    className="p-4 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                          style={{ backgroundColor: `${wallet.color}20`, color: wallet.color }}
                        >
                          {wallet.name.slice(0, 3).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-text-primary truncate leading-tight">
                            {wallet.name}
                          </span>
                          <span className="text-xs text-text-muted mt-0.5">
                            {wallet.wallet_type === 'cash'
                              ? 'Fisik di Dompet'
                              : wallet.wallet_type === 'bank'
                              ? 'Utama • Simpanan'
                              : 'E-Wallet Harian'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-text-muted font-medium tabular-nums shrink-0">
                        {share}%
                      </span>
                    </div>

                    <div>
                      <span className="text-lg font-bold text-text-primary tabular-nums tracking-tight">
                        {formatCurrency(wallet.balance)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Transaksi Terbaru */}
          <div className="bg-surface rounded-xl p-5 sm:p-6 shadow-xs border border-border-default">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text-primary tracking-tight">
                Transaksi Terbaru
              </h2>
              <span className="text-xs text-text-muted">Aktivitas terakhir</span>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                Belum ada transaksi di database.
              </div>
            ) : (
              <div className="flex flex-col">
                {recentTransactions.map((tx, idx) => {
                  const cat = categories.find((c) => c.id === tx.category_id);
                  const walletObj = wallets.find((w) => w.id === tx.wallet_id);

                  return (
                    <React.Fragment key={tx.id}>
                      <div className="py-2.5 flex items-center justify-between hover:bg-surface-container-low px-1.5 rounded-lg transition-colors group">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              tx.type === 'income'
                                ? 'bg-semantic-green-soft text-semantic-green-text'
                                : 'bg-surface-elevated text-text-secondary'
                            }`}
                          >
                            {tx.type === 'transfer' ? (
                              <ArrowRightLeft className="w-4 h-4 text-primary" />
                            ) : (
                              getCategoryIcon(cat?.icon)
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-text-primary truncate">
                              {tx.note || cat?.name || (tx.type === 'transfer' ? 'Transfer Saldo' : 'Transaksi')}
                            </span>
                            <span className="text-xs text-text-muted truncate mt-0.5">
                              {walletObj?.name || 'Dompet'} • {formatRelativeDate(tx.transaction_date)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span
                            className={`text-xs font-bold tabular-nums ${
                              tx.type === 'income'
                                ? 'text-semantic-green-text'
                                : tx.type === 'expense'
                                ? 'text-semantic-rose-text'
                                : 'text-text-primary'
                            }`}
                          >
                            {tx.type === 'income' ? '+ ' : tx.type === 'expense' ? '- ' : ''}
                            {formatCurrency(tx.amount)}
                          </span>

                          <button
                            onClick={async () => {
                              const deletedTx = tx;
                              await deleteTransaction(tx.id);
                              if (onShowToast) {
                                onShowToast({
                                  message: 'Transaksi dihapus',
                                  action: {
                                    label: 'Urungkan',
                                    onClick: async () => {
                                      await addTransaction({
                                        type: deletedTx.type,
                                        amount: Number(deletedTx.amount),
                                        walletId: deletedTx.wallet_id,
                                        categoryId: deletedTx.category_id || undefined,
                                        destinationWalletId: deletedTx.destination_wallet_id || undefined,
                                        goalId: deletedTx.goal_id || undefined,
                                        note: deletedTx.note || undefined,
                                        transactionDate: deletedTx.transaction_date,
                                      });
                                    },
                                  },
                                });
                              }
                            }}
                            className="opacity-90 sm:opacity-0 sm:group-hover:opacity-100 p-2.5 sm:p-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center text-text-muted hover:text-semantic-rose-text rounded-lg transition-all"
                            title="Hapus transaksi"
                            aria-label="Hapus transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {idx < recentTransactions.length - 1 && (
                        <div className="h-[1px] bg-border-subtle my-0.5" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-2 flex justify-center">
              <button
                onClick={() => onSelectTab('transactions')}
                className="text-xs text-primary hover:text-primary-hover inline-flex items-center gap-1.5 font-medium transition-colors py-2 px-3 min-h-[44px] sm:min-h-0 sm:p-0"
              >
                <span>Lihat Semua Transaksi</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Target Tabungan (Active Goals Preview) */}
          <div className="bg-surface rounded-xl p-5 sm:p-6 shadow-xs border border-border-default">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-primary" />
                <h3 className="text-base font-bold text-text-primary">Target Tabungan</h3>
              </div>
              <button
                onClick={() => onSelectTab('savings')}
                className="text-xs text-primary hover:text-primary-hover inline-flex items-center gap-1.5 font-medium transition-colors py-2 px-2 min-h-[44px] sm:min-h-0 sm:p-0"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {savingsGoals.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-xs text-text-muted mb-3">
                  Belum ada target tabungan aktif.
                </p>
                <button
                  onClick={() => onSelectTab('savings')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-950 bg-primary hover:bg-primary-hover px-3.5 py-2 min-h-[44px] rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Buat Target</span>
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {savingsGoals.slice(0, 3).map((goal) => {
                  const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
                  const isCompleted = goal.current_amount >= goal.target_amount;

                  return (
                    <div
                      key={goal.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-text-primary truncate">
                          {goal.name}
                        </span>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-semantic-green-text">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Tercapai
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-text-secondary tabular-nums">
                            {progress}%
                          </span>
                        )}
                      </div>

                      <div className="w-full bg-border-subtle h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: goal.color || '#5F8A70',
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <span className="tabular-nums font-medium text-text-secondary">
                          {formatCurrency(goal.current_amount)}
                        </span>
                        <span className="tabular-nums">
                          Target {formatCompactCurrency(goal.target_amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
