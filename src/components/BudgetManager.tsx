import React, { useState } from 'react';
import { Sliders, Edit3, Check, AlertCircle, Plus, Calendar, Utensils, Home, Bus, BookOpen, Coffee, ShoppingBag, Tag } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateIndo } from '../lib/formatters';

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

  const totalAllocatedBudget = budgets.reduce((acc, b) => acc + Number(b.amount), 0);
  const totalCycleExpense = transactions
    .filter((t) => t.type === 'expense' && t.transaction_date >= startStr && t.transaction_date <= endStr)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalRemainingQuota = Math.max(0, totalAllocatedBudget - totalCycleExpense);
  const overallPercentage = totalAllocatedBudget > 0
    ? Math.min(100, Math.round((totalCycleExpense / totalAllocatedBudget) * 100))
    : 0;

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
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  return (
    <section className="bg-surface rounded-2xl sm:rounded-[14px] p-5 sm:p-6 border border-border-default shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-primary-600" />
              <h2 className="text-base font-bold text-text-primary tracking-tight">
                Ringkasan Penggunaan Budget
              </h2>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                overallPercentage >= 100
                  ? 'bg-semantic-rose-soft text-semantic-rose border-semantic-rose/20'
                  : overallPercentage >= 80
                  ? 'bg-semantic-amber-soft text-semantic-amber border-semantic-amber/20'
                  : 'bg-semantic-green-soft text-semantic-green border-semantic-green/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  overallPercentage >= 100
                    ? 'bg-semantic-rose'
                    : overallPercentage >= 80
                    ? 'bg-semantic-amber'
                    : 'bg-semantic-green'
                }`}
              />
              {overallPercentage >= 100
                ? `Overbudget (${overallPercentage}%)`
                : `Aman (${overallPercentage}%)`}
            </span>
          </div>

          <p className="text-xs text-text-muted flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-text-muted" />
            <span>Siklus: {formatDateIndo(cycleInfo.startDate)} – {formatDateIndo(cycleInfo.endDate)} • </span>
            <span className="text-text-secondary font-medium">Sisa {cycleInfo.daysRemaining} hari</span>
          </p>
        </div>

        {/* Realisasi vs Plafon */}
        <div className="flex flex-col sm:items-end justify-center">
          <span className="text-[11px] text-text-muted font-medium">Realisasi Terpakai</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base sm:text-lg font-bold text-text-primary tabular-nums tracking-tight">
              {formatCurrency(totalCycleExpense)}
            </span>
            <span className="text-xs text-text-secondary font-medium tabular-nums">
              / {formatCurrency(totalAllocatedBudget)} plafon
            </span>
          </div>
          {onOpenAddCategory && (
            <button
              onClick={onOpenAddCategory}
              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary-600 hover:text-primary-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kategori Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Visual Bar Meter: Segmented Category Breakdown Strip */}
      <div className="pt-4 pb-2">
        <div className="flex items-center justify-between text-xs text-text-muted mb-2">
          <span>Distribusi Realisasi Budget</span>
          <span className="font-medium text-text-secondary">
            Sisa Kuota: <strong className="text-text-primary tabular-nums font-semibold">{formatCurrency(totalRemainingQuota)}</strong>
          </span>
        </div>
        <div className="h-3 w-full bg-bg-secondary rounded-full flex overflow-hidden p-0.5 gap-0.5">
          {expenseCategories.map((cat) => {
            const spent = transactions
              .filter((t) => t.type === 'expense' && t.category_id === cat.id && t.transaction_date >= startStr && t.transaction_date <= endStr)
              .reduce((sum, t) => sum + Number(t.amount), 0);
            const ratio = totalAllocatedBudget > 0 ? (spent / totalAllocatedBudget) * 100 : 0;
            if (ratio <= 0) return null;

            return (
              <div
                key={cat.id}
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(ratio, 100)}%`,
                  backgroundColor: cat.color || '#6366f1',
                }}
                title={`${cat.name} (${ratio.toFixed(1)}%)`}
              />
            );
          })}
          <div className="bg-surface-container flex-1 h-full rounded-full" title="Sisa Kuota" />
        </div>
      </div>

      {/* Comparative Category Cards (Gauge List) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
        {expenseCategories.map((cat) => {
          const budget = budgets.find((b) => b.category_id === cat.id);
          const budgetAmount = budget ? Number(budget.amount) : 0;

          const spent = transactions
            .filter((t) => t.type === 'expense' && t.category_id === cat.id && t.transaction_date >= startStr && t.transaction_date <= endStr)
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const isEditing = editingCategoryId === cat.id;
          const percentage = budgetAmount > 0 ? Math.min(100, Math.round((spent / budgetAmount) * 100)) : 0;
          const isOverbudget = budgetAmount > 0 && spent > budgetAmount;

          return (
            <div
              key={cat.id}
              className="bg-surface-container-low p-4 rounded-xl border border-border-default hover:border-primary-500 transition-colors flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    {getCategoryIcon(cat.icon)}
                  </div>
                  <span className="text-xs font-semibold text-text-primary truncate">
                    {cat.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {isOverbudget ? (
                    <span className="text-[10px] font-bold text-semantic-rose bg-semantic-rose-soft px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Lewat
                    </span>
                  ) : budgetAmount > 0 ? (
                    <span className="text-[11px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full tabular-nums">
                      {percentage}%
                    </span>
                  ) : null}

                  {!isEditing && (
                    <button
                      onClick={() => handleStartEdit(cat.id, budgetAmount)}
                      className="p-1 text-text-muted hover:text-text-primary rounded-md transition-colors"
                      title="Atur Budget"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Edit Amount Mode */}
              {isEditing ? (
                <div className="flex items-center gap-1.5 my-1">
                  <span className="text-xs text-text-muted font-bold">Rp</span>
                  <input
                    type="number"
                    placeholder="Nominal"
                    value={editAmountStr}
                    onChange={(e) => setEditAmountStr(e.target.value)}
                    autoFocus
                    className="flex-1 px-2.5 py-1 text-xs font-bold bg-surface-elevated text-text-primary border border-border-default rounded-lg focus:outline-none focus:border-border-gold-focus"
                  />
                  <button
                    onClick={() => handleSaveBudget(cat.id)}
                    disabled={isSaving}
                    className="p-1.5 bg-primary text-slate-950 rounded-lg hover:bg-primary-hover transition-colors font-bold"
                    title="Simpan"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* Normal Meter */
                <div>
                  <div className="w-full bg-border-default h-1.5 rounded-full overflow-hidden mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverbudget
                          ? 'bg-semantic-rose'
                          : percentage >= 80
                          ? 'bg-semantic-amber'
                          : 'bg-primary-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-text-muted font-medium">
                    <span>Terpakai: <strong className="text-text-secondary tabular-nums">{formatCurrency(spent)}</strong></span>
                    <span>
                      {budgetAmount > 0
                        ? `Plafon: ${formatCurrency(budgetAmount)}`
                        : 'Belum ada plafon'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
