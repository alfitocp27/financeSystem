import React, { useState } from 'react';
import { Sliders, Edit3, Check, AlertCircle, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/formatters';

interface BudgetManagerProps {
  onShowToast?: (msg: string) => void;
  onOpenAddCategory?: () => void;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({ onShowToast, onOpenAddCategory }) => {
  const { categories, budgets, transactions, cycleInfo, setCategoryBudget } = useFinance();
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editAmountStr, setEditAmountStr] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // Filter transactions within current cycle
  const startStr = cycleInfo.startDate.toISOString().split('T')[0];
  const endStr = cycleInfo.endDate.toISOString().split('T')[0];

  const handleStartEdit = (catId: string, currentBudget: number) => {
    setEditingCategoryId(catId);
    setEditAmountStr(currentBudget > 0 ? currentBudget.toString() : '');
  };

  const handleSaveBudget = async (catId: string) => {
    setIsSaving(true);
    const amount = parseInt(editAmountStr, 10) || 0;
    await setCategoryBudget(catId, amount);
    setIsSaving(false);
    setEditingCategoryId(null);
    if (onShowToast) onShowToast('Anggaran kategori berhasil diperbarui');
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Anggaran per Kategori
          </h2>
        </div>
        {onOpenAddCategory && (
          <button
            onClick={onOpenAddCategory}
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Kategori Baru
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {expenseCategories.map((cat) => {
          const budget = budgets.find((b) => b.category_id === cat.id);
          const budgetAmount = budget ? Number(budget.amount) : 0;

          // Spending in cycle
          const spent = transactions
            .filter((t) => t.type === 'expense' && t.category_id === cat.id && t.transaction_date >= startStr && t.transaction_date <= endStr)
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const isEditing = editingCategoryId === cat.id;
          const percentage = budgetAmount > 0 ? Math.min(100, Math.round((spent / budgetAmount) * 100)) : 0;
          const isOverbudget = budgetAmount > 0 && spent > budgetAmount;

          return (
            <div key={cat.id} className="p-4 hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs font-bold text-slate-800">{cat.name}</span>
                  {isOverbudget && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                      <AlertCircle className="w-3 h-3" /> Lewat Budget
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="Nominal"
                      value={editAmountStr}
                      onChange={(e) => setEditAmountStr(e.target.value)}
                      autoFocus
                      className="w-28 px-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => handleSaveBudget(cat.id)}
                      disabled={isSaving}
                      className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                      title="Simpan"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      {budgetAmount > 0 ? formatCurrency(budgetAmount) : 'Belum diset'}
                    </span>
                    <button
                      onClick={() => handleStartEdit(cat.id, budgetAmount)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
                      title="Atur Budget"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Progress Bar & Subtext */}
              {budgetAmount > 0 ? (
                <div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverbudget
                          ? 'bg-rose-500'
                          : percentage >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Terpakai: {formatCurrency(spent)} ({percentage}%)</span>
                    <span>
                      {isOverbudget
                        ? `Melebihi ${formatCurrency(spent - budgetAmount)}`
                        : `Sisa ${formatCurrency(budgetAmount - spent)}`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400">
                  Terpakai siklus ini: {formatCurrency(spent)} • Klik tombol pensil untuk pasang batas.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
