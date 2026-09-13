import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, ReferenceLine } from 'recharts';
import { PieChart as ChartIcon, Sparkles, TrendingUp } from 'lucide-react';
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
    <section className="space-y-4">
      <div className="flex items-center gap-1.5 mb-1">
        <ChartIcon className="w-4 h-4 text-indigo-600" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Analisis Pengeluaran & Tren
        </h2>
      </div>

      {/* Daily Spending vs Safe to Spend Benchmark */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
              Tren Belanja 7 Hari Terakhir vs Batas Aman Harian
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Garis putus-putus menunjukkan benchmark Safe to Spend ({formatCurrency(safeToSpend.dailySafeToSpend)}/hari).
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium">
            <span className="flex items-center gap-1 text-slate-600">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /> Belanja Harian
            </span>
            <span className="flex items-center gap-1 text-rose-600">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-rose-500" /> Safe Limit
            </span>
          </div>
        </div>

        <div className="h-48 w-full">
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
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
              />
              {safeToSpend.dailySafeToSpend > 0 && (
                <ReferenceLine
                  y={safeToSpend.dailySafeToSpend}
                  stroke="#ef4444"
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
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
            Porsi Pengeluaran per Kategori
          </h3>

          {categorySpending.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">
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
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* List of top categories */}
              <div className="flex-1 w-full space-y-2">
                {categorySpending.slice(0, 4).map((item) => {
                  const percent = totalExpenseInCycle > 0 ? Math.round((item.value / totalExpenseInCycle) * 100) : 0;
                  return (
                    <div key={item.name} className="text-xs">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.name}
                        </span>
                        <span className="font-bold text-slate-900">{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
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

        {/* Cash Flow Summary & Student Tip */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
              Ringkasan Arus Kas Siklus ({cycleInfo.daysPassed}/{cycleInfo.totalDays} Hari)
            </h3>

            <div className="space-y-2.5 mb-4">
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-medium">Total Pemasukan</span>
                <span className="font-bold text-emerald-600">+{formatCurrency(totalIncomeInCycle)}</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-50">
                <span className="text-slate-500 font-medium">Total Pengeluaran</span>
                <span className="font-bold text-rose-600">-{formatCurrency(totalExpenseInCycle)}</span>
              </div>
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-indigo-50/70 border border-indigo-100">
                <span className="text-indigo-900 font-bold">Surplus / Defisit</span>
                <span
                  className={`font-extrabold ${
                    netSavings >= 0 ? 'text-indigo-700' : 'text-rose-700'
                  }`}
                >
                  {formatCurrency(netSavings)}
                </span>
              </div>
            </div>
          </div>

          {/* Smart Tip for Students */}
          <div className="p-3 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 rounded-xl border border-indigo-100/50 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-indigo-900 leading-relaxed">
              <strong>Tips Finansial Mahasiswa:</strong> Pantau grafik Safe to Spend setiap malam sebelum tidur. Jika hari ini overpace, kurangi pos jajan kopi/nongkrong di esok hari.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
