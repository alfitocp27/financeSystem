import React, { useState } from 'react';
import {
  Sliders,
  Edit3,
  Check,
  X,
  Plus,
  Calendar,
  Utensils,
  Home,
  Bus,
  BookOpen,
  Coffee,
  ShoppingBag,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateIndo, getLocalDateString } from '../lib/formatters';
import { getMutedCategoryStyle } from '../lib/category-color-utils';

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

  // Filter transactions within current cycle safely using local date strings (timezone-safe)
  const startStr = getLocalDateString(cycleInfo.startDate);
  const endStr = getLocalDateString(cycleInfo.endDate);

  const totalAllocatedBudget = budgets.reduce((acc, b) => acc + Number(b.amount), 0);
  const totalCycleExpense = transactions
    .filter((t) => t.type === 'expense' && t.transaction_date >= startStr && t.transaction_date <= endStr)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalRemainingQuota = Math.max(0, totalAllocatedBudget - totalCycleExpense);
  const overallPercentage = totalAllocatedBudget > 0
    ? Math.round((totalCycleExpense / totalAllocatedBudget) * 100)
    : 0;

  const handleStartEdit = (catId: string, currentBudget: number) => {
    setEditingCategoryId(catId);
    setEditAmountStr(currentBudget > 0 ? new Intl.NumberFormat('id-ID').format(currentBudget) : '');
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditAmountStr('');
  };

  const handleAmountChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setEditAmountStr('');
      return;
    }
    const num = parseInt(digits, 10);
    setEditAmountStr(new Intl.NumberFormat('id-ID').format(num));
  };

  const handleSaveBudget = async (catId: string) => {
    setIsSaving(true);
    const cleanDigits = editAmountStr.replace(/\D/g, '');
    const amount = parseInt(cleanDigits, 10) || 0;
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
    <section className="bg-surface rounded-xl border border-border-default shadow-xs overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-soft text-text-gold flex items-center justify-center shrink-0 border border-border-gold">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-text-primary tracking-tight">
                Plafon & Realisasi Anggaran
              </h2>
              <p className="text-xs text-text-muted flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-text-muted" />
                <span>
                  Siklus: {formatDateIndo(cycleInfo.startDate)} – {formatDateIndo(cycleInfo.endDate)}
                </span>
                <span className="text-border-subtle">•</span>
                <span className="text-text-secondary font-medium">Sisa {cycleInfo.daysRemaining} hari</span>
              </p>
            </div>
          </div>
        </div>

        {onOpenAddCategory && (
          <button
            onClick={onOpenAddCategory}
            type="button"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-lg bg-primary-soft text-text-gold hover:bg-primary-soft/80 border border-border-gold transition-colors text-xs font-semibold shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pos Baru</span>
          </button>
        )}
      </div>

      {/* 3-Metric Flat Ledger Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle border-y border-border-subtle bg-surface-elevated/40">
        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-xs font-medium text-text-muted">Total Plafon</span>
          <span className="text-lg sm:text-xl font-extrabold text-text-primary tabular-nums tracking-tight mt-1">
            {formatCurrency(totalAllocatedBudget)}
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-xs font-medium text-text-muted">Total Terpakai</span>
          <span
            className={`text-lg sm:text-xl font-extrabold tabular-nums tracking-tight mt-1 ${
              overallPercentage >= 100 ? 'text-semantic-rose-text' : 'text-text-primary'
            }`}
          >
            {formatCurrency(totalCycleExpense)}
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between">
          <span className="text-xs font-medium text-text-muted">Sisa Plafon Alokasi</span>
          <span className="text-lg sm:text-xl font-extrabold text-text-gold tabular-nums tracking-tight mt-1">
            {formatCurrency(totalRemainingQuota)}
          </span>
        </div>
      </div>

      {/* Unified Progress Bar */}
      <div className="px-5 sm:px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-text-secondary font-medium">Realisasi Anggaran Siklus</span>
          <span
            className={`font-semibold tabular-nums ${
              overallPercentage >= 100
                ? 'text-semantic-rose-text'
                : overallPercentage >= 80
                ? 'text-semantic-amber-text'
                : 'text-text-gold'
            }`}
          >
            {overallPercentage}% {overallPercentage >= 100 ? '(Melampaui Plafon)' : 'teralokasi'}
          </span>
        </div>
        <div className="h-2 w-full bg-surface-elevated rounded-full overflow-hidden border border-border-subtle/50">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              overallPercentage >= 100
                ? 'bg-semantic-rose'
                : overallPercentage >= 80
                ? 'bg-semantic-amber'
                : 'bg-primary'
            }`}
            style={{ width: `${Math.min(overallPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Flat Ledger Category Rows */}
      {expenseCategories.length === 0 ? (
        <div className="p-8 text-center text-xs text-text-muted">
          Belum ada pos pengeluaran. Klik &quot;Tambah Pos Baru&quot; untuk membuat pos anggaran.
        </div>
      ) : (
        <div className="divide-y divide-border-subtle">
          {expenseCategories.map((cat) => {
            const budget = budgets.find((b) => b.category_id === cat.id);
            const budgetAmount = budget ? Number(budget.amount) : 0;

            const spent = transactions
              .filter(
                (t) =>
                  t.type === 'expense' &&
                  t.category_id === cat.id &&
                  t.transaction_date >= startStr &&
                  t.transaction_date <= endStr
              )
              .reduce((sum, t) => sum + Number(t.amount), 0);

            const isEditing = editingCategoryId === cat.id;
            const percentage = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
            const isOverbudget = budgetAmount > 0 && spent > budgetAmount;
            const isWarning = !isOverbudget && percentage >= 80;
            const iconStyle = getMutedCategoryStyle(cat.color);

            return (
              <div
                key={cat.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-colors hover:bg-surface-elevated/30"
              >
                {/* Left: Icon & Category Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: iconStyle.backgroundColor,
                      color: iconStyle.color,
                      borderColor: iconStyle.borderColor,
                    }}
                    aria-hidden="true"
                  >
                    {getCategoryIcon(cat.icon)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-semibold text-text-primary block truncate">
                      {cat.name}
                    </span>
                    <span className="text-xs text-text-muted block mt-0.5">
                      {isOverbudget ? (
                        <span className="text-semantic-rose-text font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Melampaui ({percentage}%)
                        </span>
                      ) : isWarning ? (
                        <span className="text-semantic-amber-text font-medium">
                          Mendekati limit ({percentage}%)
                        </span>
                      ) : budgetAmount > 0 ? (
                        <span className="tabular-nums">{percentage}% dari plafon</span>
                      ) : (
                        'Belum ada plafon'
                      )}
                    </span>
                  </div>
                </div>

                {/* Right: Numbers or Inline Edit Mode */}
                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveBudget(cat.id);
                    }}
                    className="flex items-center gap-2 w-full sm:max-w-md py-0.5"
                  >
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-text-muted">
                        Rp
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoFocus
                        value={editAmountStr}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            handleCancelEdit();
                          }
                        }}
                        className="w-full pl-9 pr-3 py-2 text-xs font-bold bg-surface-elevated text-text-primary border border-border-default rounded-lg focus:outline-hidden focus:border-border-gold-focus focus:ring-1 focus:ring-primary min-h-[44px]"
                        placeholder="0"
                        aria-label={`Nominal plafon anggaran ${cat.name}`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-primary text-slate-950 rounded-lg hover:bg-primary-hover transition-colors font-bold text-xs flex items-center justify-center shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                      title="Simpan"
                      aria-label="Simpan anggaran"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="min-h-[44px] min-w-[44px] px-3.5 py-2 bg-surface-elevated text-text-secondary hover:text-text-primary rounded-lg transition-colors font-medium text-xs flex items-center justify-center shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary border border-border-subtle"
                      title="Batal"
                      aria-label="Batal ubah anggaran"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                    {/* Progress Bar and Amounts */}
                    <div className="flex flex-col sm:items-end gap-1 min-w-[130px]">
                      <div className="flex items-baseline gap-1 text-xs tabular-nums">
                        <span className="font-bold text-text-primary">
                          {formatCurrency(spent)}
                        </span>
                        <span className="text-text-muted font-normal">
                          / {budgetAmount > 0 ? formatCurrency(budgetAmount) : '—'}
                        </span>
                      </div>
                      <div className="w-28 sm:w-36 h-1.5 bg-surface-elevated rounded-full overflow-hidden border border-border-subtle/40">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOverbudget ? 'bg-semantic-rose' : ''
                          }`}
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: isOverbudget ? undefined : iconStyle.color,
                          }}
                        />
                      </div>
                    </div>

                    {/* Edit Action Button */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat.id, budgetAmount)}
                      className="min-h-[44px] min-w-[44px] p-2.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated flex items-center justify-center transition-colors shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary"
                      title={`Ubah anggaran ${cat.name}`}
                      aria-label={`Ubah anggaran ${cat.name}`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
