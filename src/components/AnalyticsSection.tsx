import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, ReferenceLine } from 'recharts';
import { Sparkles, TrendingUp, PieChart as ChartIcon, Wallet } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatCompactCurrency } from '../lib/formatters';

export const AnalyticsSection: React.FC = () => {
  const { transactions, categories, totalExpenseInCycle, totalIncomeInCycle, safeToSpend, cycleInfo } = useFinance();

  // Aggregate expenses per category
  const categorySpending = categories
    .filter((c) => c.type === 'expense')
    .map((cat) => {
      const total = transactions
        .filter((t) => t.type === 'expense' && t.category_id === cat.id)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        name: cat.name,
        value: total,
        color: cat.color || '#6366f1',
      };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // Daily Spending Trend over the last 7 days
  const last7DaysData = React.useMemo(() => {
    const days: { dateStr: string; label: string; expense: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
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
    <div className="space-y-4">
      {/* Daily Spending vs Safe to Spend Benchmark */}
      <div className="bg-surface p-5 rounded-2xl sm:rounded-[14px] border border-border-default shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-border-default">
          <div>
            <h3 className="text-sm font-bold text-text-primary tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-600" />
              <span>Tren Belanja 7 Hari Terakhir vs Batas Aman</span>
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">
              Garis putus-putus merah merupakan batas Safe to Spend ({formatCurrency(safeToSpend.dailySafeToSpend)}/hari).
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary-500" />
              <span>Pengeluaran Harian</span>
            </span>
            <span className="flex items-center gap-1.5 text-semantic-rose">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-semantic-rose" />
              <span>Safe Limit</span>
            </span>
          </div>
        </div>

        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => formatCompactCurrency(val)}
              />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val)), 'Pengeluaran']}
                labelStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Breakdown Chart */}
        <div className="bg-surface p-5 rounded-2xl sm:rounded-[14px] border border-border-default shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-border-default mb-3">
            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
              <ChartIcon className="w-3.5 h-3.5 text-primary-600" />
              <span>Porsi Pengeluaran Kategori</span>
            </h3>
            <span className="text-[11px] text-text-muted font-normal">Siklus ini</span>
          </div>

          {categorySpending.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-text-muted">
              Belum ada data pengeluaran di siklus ini.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="w-40 h-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySpending}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categorySpending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Total']}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Top Categories List */}
              <div className="flex-1 w-full space-y-2.5">
                {categorySpending.slice(0, 4).map((item) => {
                  const percent = totalExpenseInCycle > 0 ? Math.round((item.value / totalExpenseInCycle) * 100) : 0;
                  return (
                    <div key={item.name} className="text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="flex items-center gap-1.5 font-medium text-text-secondary truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="truncate">{item.name}</span>
                        </span>
                        <span className="font-bold text-text-primary tabular-nums shrink-0 ml-2">
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full bg-border-default h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Cash Flow Summary & Student Advice */}
        <div className="bg-surface p-5 rounded-2xl sm:rounded-[14px] border border-border-default shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border-default mb-3">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-primary-600" />
                <span>Arus Kas Siklus</span>
              </h3>
              <span className="text-[11px] text-text-muted font-normal">
                Hari {cycleInfo.daysPassed} / {cycleInfo.totalDays}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-surface-container-low border border-border-subtle">
                <span className="text-text-secondary font-medium">Total Pemasukan</span>
                <span className="font-bold text-semantic-green tabular-nums">
                  +{formatCurrency(totalIncomeInCycle)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-surface-container-low border border-border-subtle">
                <span className="text-text-secondary font-medium">Total Pengeluaran</span>
                <span className="font-bold text-semantic-rose tabular-nums">
                  -{formatCurrency(totalExpenseInCycle)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-primary-50 border border-primary-100">
                <span className="text-primary-900 font-bold">Surplus Bersih</span>
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
          <div className="p-3 bg-primary-50 rounded-xl border border-primary-100 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-primary-900 leading-relaxed">
              <strong>Tips Finansial Mahasiswa:</strong> Pantau grafik Safe to Spend setiap malam. Jika pengeluaran hari ini melebihi garis batas, kurangi jajan non-esensial di esok hari.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
