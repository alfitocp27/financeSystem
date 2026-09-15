import React, { useMemo } from 'react';
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, ReferenceLine } from 'recharts';
import { Sparkles, TrendingUp, PieChart as ChartIcon, Wallet } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatCompactCurrency, getLocalDateString } from '../lib/formatters';
import { CategoryDonutChart, type CategoryDonutItem } from './CategoryDonutChart';

// Disciplined palette for "The Daylight Ledger" (Max 5 categories + 1 neutral for "Lainnya")
const DISCIPLINED_CATEGORY_COLORS = [
  '#4648d4', // Ultramarine Ink
  '#3b82f6', // Ocean Blue
  '#10b981', // Safe Emerald
  '#f59e0b', // Warm Amber
  '#8b5cf6', // Soft Violet
];
const OTHER_CATEGORY_COLOR = '#94a3b8'; // Slate Neutral

export const AnalyticsSection: React.FC = () => {
  const { transactions, categories, totalExpenseInCycle, totalIncomeInCycle, safeToSpend, cycleInfo } = useFinance();

  // Filter expenses strictly within the active budget cycle
  const cycleExpenses = useMemo(() => {
    const startStr = getLocalDateString(cycleInfo.startDate);
    const endStr = getLocalDateString(cycleInfo.endDate);
    return transactions.filter(
      (t) => t.type === 'expense' && t.transaction_date >= startStr && t.transaction_date <= endStr
    );
  }, [transactions, cycleInfo]);

  // Aggregate expenses per category: Top 5 + "Lainnya"
  const donutCategoryData: CategoryDonutItem[] = useMemo(() => {
    if (totalExpenseInCycle === 0 || cycleExpenses.length === 0) return [];

    // Group sums by category_id
    const categoryTotals: Record<string, { id: string; name: string; total: number }> = {};

    cycleExpenses.forEach((t) => {
      const catId = t.category_id || 'uncategorized';
      if (!categoryTotals[catId]) {
        const cat = categories.find((c) => c.id === catId);
        categoryTotals[catId] = {
          id: catId,
          name: cat ? cat.name : 'Tanpa Kategori',
          total: 0,
        };
      }
      categoryTotals[catId].total += Number(t.amount);
    });

    // Sort descending by total amount
    const sorted = Object.values(categoryTotals)
      .filter((item) => item.total > 0)
      .sort((a, b) => b.total - a.total);

    // Take top 5
    const top5 = sorted.slice(0, 5);
    const remaining = sorted.slice(5);

    const items: CategoryDonutItem[] = top5.map((cat, idx) => ({
      id: cat.id,
      name: cat.name,
      value: cat.total,
      percentage: Math.round((cat.total / totalExpenseInCycle) * 100),
      color: DISCIPLINED_CATEGORY_COLORS[idx % DISCIPLINED_CATEGORY_COLORS.length],
    }));

    // Merge remaining into "Lainnya" if any
    if (remaining.length > 0) {
      const otherTotal = remaining.reduce((sum, item) => sum + item.total, 0);
      if (otherTotal > 0) {
        items.push({
          id: 'category-others',
          name: 'Lainnya',
          value: otherTotal,
          percentage: Math.round((otherTotal / totalExpenseInCycle) * 100),
          color: OTHER_CATEGORY_COLOR,
        });
      }
    }

    return items;
  }, [cycleExpenses, categories, totalExpenseInCycle]);

  // Active cycle formatted label
  const cycleLabel = useMemo(() => {
    const startFormatted = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(cycleInfo.startDate);
    const endFormatted = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(cycleInfo.endDate);
    return `Siklus ${startFormatted} - ${endFormatted}`;
  }, [cycleInfo]);

  // Daily Spending Trend over the last 7 days
  const last7DaysData = useMemo(() => {
    const days: { dateStr: string; label: string; expense: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short', day: 'numeric' }).format(d);

      const dayExpense = transactions
        .filter((t) => t.type === 'expense' && t.transaction_date === dateStr)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      days.push({
        dateStr,
        label: dayName,
        expense: dayExpense,
      });
    }
    return days;
  }, [transactions]);

  const netSavings = totalIncomeInCycle - totalExpenseInCycle;

  return (
    <div className="space-y-6">
      {/* Category Breakdown Donut Chart (Main Feature) */}
      <div className="bg-surface p-5 sm:p-6 rounded-xl border border-border-default shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-border-subtle mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
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
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-surface-container-low text-text-secondary border border-border-subtle">
            {donutCategoryData.length} Pos Pengeluaran
          </span>
        </div>

        {/* Interactive Donut Component */}
        <CategoryDonutChart
          data={donutCategoryData}
          totalValue={totalExpenseInCycle}
          cycleLabel={cycleLabel}
        />
      </div>

      {/* 2-Column Section: 7-Day Trend & Cash Flow Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Spending vs Safe to Spend Benchmark */}
        <div className="bg-surface p-5 sm:p-6 rounded-xl border border-border-default shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-border-subtle">
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-600" />
                  <span>Tren Belanja 7 Hari Terakhir</span>
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Batas Safe to Spend: {formatCurrency(safeToSpend.dailySafeToSpend)}/hari
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <span className="w-2.5 h-2.5 rounded-xs bg-primary-500" />
                  <span>Harian</span>
                </span>
                <span className="flex items-center gap-1.5 text-semantic-rose">
                  <span className="w-3.5 h-0.5 border-t-2 border-dashed border-semantic-rose" />
                  <span>Batas Aman</span>
                </span>
              </div>
            </div>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => formatCompactCurrency(val)}
                  />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Pengeluaran']}
                    labelStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', fontSize: '12px' }}
                  />
                  {safeToSpend.dailySafeToSpend > 0 && (
                    <ReferenceLine
                      y={safeToSpend.dailySafeToSpend}
                      stroke="#f43f5e"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                    />
                  )}
                  <Bar
                    dataKey="expense"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Cash Flow Summary & Student Advice */}
        <div className="bg-surface p-5 sm:p-6 rounded-xl border border-border-default shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
              <h3 className="text-sm font-bold text-text-primary tracking-tight flex items-center gap-2">
                <Wallet className="w-4 h-4 text-primary-600" />
                <span>Arus Kas Siklus Berjalan</span>
              </h3>
              <span className="text-xs text-text-muted font-normal">
                Hari {cycleInfo.daysPassed} / {cycleInfo.totalDays}
              </span>
            </div>

            <div className="space-y-2 mb-5">
              <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-surface-container-low border border-border-subtle">
                <span className="text-text-secondary font-medium">Total Pemasukan</span>
                <span className="font-bold text-semantic-green tabular-nums">
                  +{formatCurrency(totalIncomeInCycle)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-surface-container-low border border-border-subtle">
                <span className="text-text-secondary font-medium">Total Pengeluaran</span>
                <span className="font-bold text-semantic-rose tabular-nums">
                  -{formatCurrency(totalExpenseInCycle)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs p-3 rounded-lg bg-primary-50 border border-primary-100">
                <span className="text-primary-900 font-bold">Surplus Bersih Siklus</span>
                <span
                  className={`font-extrabold tabular-nums ${
                    netSavings >= 0 ? 'text-primary-700' : 'text-semantic-rose'
                  }`}
                >
                  {formatCurrency(netSavings)}
                </span>
              </div>
            </div>
          </div>

          {/* Smart Tip for Students */}
          <div className="p-3.5 bg-primary-50/70 rounded-lg border border-primary-100 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
            <div className="text-xs text-primary-950 leading-relaxed">
              <strong>Tips Finansial Mahasiswa:</strong> Komposisi pengeluaran terbesar idealnya tidak melebihi 50% dari total uang saku bulanan. Evaluasi pos non-esensial jika surplus menipis.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
