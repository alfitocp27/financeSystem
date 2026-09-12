import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as ChartIcon, Sparkles } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/formatters';

export const AnalyticsSection: React.FC = () => {
  const { transactions, categories, totalExpenseInCycle, totalIncomeInCycle } = useFinance();

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

  const netSavings = totalIncomeInCycle - totalExpenseInCycle;

  return (
    <section>
      <div className="flex items-center gap-1.5 mb-3">
        <ChartIcon className="w-4 h-4 text-indigo-600" />
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Analisis Pengeluaran
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Breakdown Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
            Porsi Pengeluaran Siklus Ini
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
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
              Ringkasan Arus Kas
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
              <strong>Tips Finansial:</strong> Sisihkan minimal 10% di awal begitu uang bulanan tiba, jangan menunggu sisa di akhir bulan.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
