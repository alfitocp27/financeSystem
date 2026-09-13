import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Calendar,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
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
  Check,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatCompactCurrency, formatDateIndo, formatRelativeDate } from '../lib/formatters';
import { DailyCashFlowChart } from './DailyCashFlowChart';

interface DashboardViewProps {
  studentName: string;
  onOpenQuickAdd: () => void;
  onOpenSimulator: () => void;
  onOpenTransfer: () => void;
  onOpenAddWallet: () => void;
  onSelectTab: (tab: any) => void;
  onShowToast?: (msg: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  studentName,
  onOpenQuickAdd,
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
    totalIncomeInCycle,
    totalExpenseInCycle,
    wallets,
    categories,
    budgets,
    transactions,
    deleteTransaction,
  } = useFinance();

  const netSavings = totalIncomeInCycle - totalExpenseInCycle;
  const startStr = cycleInfo.startDate.toISOString().split('T')[0];
  const endStr = cycleInfo.endDate.toISOString().split('T')[0];

  // Budget calculations
  const totalAllocatedBudget = budgets.reduce((acc, b) => acc + Number(b.amount), 0);
  const totalCycleExpense = transactions
    .filter((t) => t.type === 'expense' && t.transaction_date >= startStr && t.transaction_date <= endStr)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const effectiveBudgetCeiling = totalAllocatedBudget > 0 ? totalAllocatedBudget : (totalBalance + totalCycleExpense);
  const totalRemainingQuota = Math.max(0, effectiveBudgetCeiling - totalCycleExpense);
  const overallBudgetPercentage = effectiveBudgetCeiling > 0
    ? Math.min(100, Math.round((totalCycleExpense / effectiveBudgetCeiling) * 100))
    : 0;

  // Stitch Category Color Palette for Donut & Gauges
  const stitchColors = ['#2563eb', '#10b981', '#f59e0b', '#94a3b8', '#8b5cf6', '#ec4899', '#06b6d4'];

  // Aggregate category spending
  const categorySpending = categories
    .filter((c) => c.type === 'expense')
    .map((cat, idx) => {
      const total = transactions
        .filter((t) => t.type === 'expense' && t.category_id === cat.id && t.transaction_date >= startStr && t.transaction_date <= endStr)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color || stitchColors[idx % stitchColors.length],
        icon: cat.icon,
        value: total,
      };
    })
    .sort((a, b) => b.value - a.value);

  // SVG Donut Calculations (r = 62, circumference ~ 389.56)
  const donutSlices = React.useMemo(() => {
    const CIRCUMFERENCE = 2 * Math.PI * 62;
    const total = Math.max(1, categorySpending.reduce((acc, c) => acc + c.value, 0));
    const active = categorySpending.filter((c) => c.value > 0);

    let cumulative = 0;
    const result = [];
    for (const c of active) {
      const ratio = c.value / total;
      const strokeDasharray = `${(ratio * CIRCUMFERENCE).toFixed(1)} ${CIRCUMFERENCE.toFixed(1)}`;
      const strokeDashoffset = -cumulative;
      cumulative += ratio * CIRCUMFERENCE;
      result.push({
        ...c,
        strokeDasharray,
        strokeDashoffset,
        ratio,
      });
    }
    return result;
  }, [categorySpending]);

  // Status badge logic
  const getPaceBadge = () => {
    switch (safeToSpend.paceStatus) {
      case 'safe':
        return {
          bg: 'bg-semantic-green-soft text-semantic-green border-semantic-green/20',
          dot: 'bg-semantic-green',
          icon: ShieldCheck,
          text: 'Status: Safe',
        };
      case 'warning':
        return {
          bg: 'bg-semantic-amber-soft text-semantic-amber border-semantic-amber/20',
          dot: 'bg-semantic-amber',
          icon: AlertTriangle,
          text: 'Status: Warning',
        };
      case 'overpace':
        return {
          bg: 'bg-semantic-rose-soft text-semantic-rose border-semantic-rose/20',
          dot: 'bg-semantic-rose',
          icon: AlertCircle,
          text: 'Status: Overpace',
        };
      case 'no-budget':
      default:
        return {
          bg: 'bg-semantic-blue-soft text-semantic-blue border-semantic-blue/20',
          dot: 'bg-semantic-blue',
          icon: HelpCircle,
          text: 'Status: Safe',
        };
    }
  };

  const badge = getPaceBadge();

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

  return (
    <div className="space-y-6 pb-6">
      {/* 1. Top Greeting & Primary Trigger Header (Stitch Exact) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex flex-col">
          <h1 className="text-2xl sm:text-[26px] font-bold text-text-primary tracking-tight">
            Selamat datang kembali, {studentName} 👋
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Berikut ringkasan kondisi keuanganmu untuk siklus bulan {new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(cycleInfo.startDate)}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenQuickAdd}
            className="bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-semibold text-sm px-4 py-2.5 rounded-[10px] flex items-center gap-2 transition-all shadow-sm"
            id="btnQuickAdd"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Highlight: Safe to Spend Card (Stitch Exact) */}
      <section className="mb-6">
        <div className="bg-surface rounded-[14px] p-6 shadow-sm border border-border-default relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left Column */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-[13px] uppercase tracking-wider font-semibold text-text-secondary">
                  Safe to Spend
                </span>

                <div className="relative group cursor-pointer flex items-center">
                  <HelpCircle className="w-4 h-4 text-text-muted hover:text-text-primary transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col w-64 bg-inverse-surface text-inverse-on-surface p-2.5 rounded-lg text-xs z-30 shadow-lg leading-relaxed">
                    Batas pengeluaran harian yang aman agar budget bulananmu tetap cukup sampai akhir periode siklus.
                  </div>
                </div>

                <span
                  className={`ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.bg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  {badge.text}
                </span>

                <button
                  onClick={onOpenSimulator}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 hover:bg-primary-100 text-primary-600 transition-colors ml-auto md:ml-3"
                  title="Simulasi dampak belanja terhadap jatah hari esok"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Simulasi Jajan</span>
                </button>
              </div>

              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl sm:text-[36px] font-bold text-text-primary tabular-nums tracking-tight">
                  {formatCurrency(safeToSpend.dailySafeToSpend)}
                </span>
                <span className="text-base text-text-muted font-normal">/ hari</span>
              </div>

              <div className="flex items-center gap-2 mt-1.5">
                <Check className="w-4 h-4 text-semantic-green shrink-0" />
                <p className="text-xs text-text-secondary">
                  <strong className="text-text-primary font-medium">
                    {cycleInfo.daysRemaining} hari tersisa
                  </strong>{' '}
                  dalam siklus ini • Berdasarkan sisa budget aktif{' '}
                  <span className="font-medium text-text-primary tabular-nums">
                    {formatCurrency(safeToSpend.remainingBudget)}
                  </span>
                </p>
              </div>
            </div>

            {/* Right Column: Safe-to-Spend Pacing Micro Visualizer */}
            <div className="flex flex-col w-full md:w-80 bg-surface-container-low p-4 rounded-xl border border-border-subtle">
              <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
                <span>Pacing Pengeluaran</span>
                <span
                  className={`font-medium tabular-nums ${
                    safeToSpend.paceStatus === 'overpace'
                      ? 'text-semantic-rose'
                      : safeToSpend.paceStatus === 'warning'
                      ? 'text-semantic-amber'
                      : 'text-semantic-green'
                  }`}
                >
                  Terkendali ({cycleInfo.progressPercentage}%)
                </span>
              </div>

              <div className="w-full bg-border-default h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    safeToSpend.paceStatus === 'overpace'
                      ? 'bg-semantic-rose'
                      : safeToSpend.paceStatus === 'warning'
                      ? 'bg-semantic-amber'
                      : 'bg-semantic-green'
                  }`}
                  style={{ width: `${cycleInfo.progressPercentage}%` }}
                />
              </div>

              <div className="flex justify-between items-center mt-2 text-xs text-text-muted">
                <span>Mulai ({cycleInfo.startDate.getDate()} {new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(cycleInfo.startDate)})</span>
                <span className="text-text-secondary font-medium">
                  Hari ke-{cycleInfo.daysPassed} dari {cycleInfo.totalDays}
                </span>
                <span>Akhir ({cycleInfo.endDate.getDate()} {new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(cycleInfo.endDate)})</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Financial Summary Cards (Grid of 4) (Stitch Exact) */}
      <section className="bg-surface rounded-[14px] border border-border-default shadow-sm mb-6 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-border-default">
          {/* Total Saldo */}
          <div className="p-4 sm:p-5 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-border-default">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Total Saldo</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-semantic-green-soft text-semantic-green">
                <ArrowUpRight className="w-3.5 h-3.5" /> 8.4%
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-semibold text-text-primary tracking-tight tabular-nums">
                {formatCompactCurrency(totalBalance)}
              </div>
              <div className="text-xs text-text-muted mt-1 truncate">
                dari {formatCurrency(totalBalance * 0.92)}
              </div>
            </div>
          </div>

          {/* Total Pemasukan */}
          <div className="p-4 sm:p-5 flex flex-col justify-between border-b sm:border-b-0 lg:border-r border-border-default">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Total Pemasukan</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-semantic-green-soft text-semantic-green">
                <ArrowUpRight className="w-3.5 h-3.5" /> 18.4%
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-semibold text-text-primary tracking-tight tabular-nums">
                {formatCompactCurrency(totalIncomeInCycle)}
              </div>
              <div className="text-xs text-text-muted mt-1 truncate">
                dari {formatCurrency(totalIncomeInCycle * 0.85)}
              </div>
            </div>
          </div>

          {/* Total Pengeluaran */}
          <div className="p-4 sm:p-5 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-border-default">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Total Pengeluaran</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-semantic-rose-soft text-semantic-rose">
                <ArrowDownRight className="w-3.5 h-3.5" /> Terpakai
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-semibold text-text-primary tracking-tight tabular-nums">
                {formatCompactCurrency(totalCycleExpense)}
              </div>
              <div className="text-xs text-text-muted mt-1 truncate">
                dari kuota {formatCompactCurrency(effectiveBudgetCeiling)}
              </div>
            </div>
          </div>

          {/* Net Tabungan */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Net Tabungan</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-semantic-green-soft text-semantic-green">
                <ArrowUpRight className="w-3.5 h-3.5" /> Bulanan
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-semibold text-text-primary tracking-tight tabular-nums">
                {formatCompactCurrency(netSavings)}
              </div>
              <div className="text-xs text-text-muted mt-1 truncate">
                surplus tersisa
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3.5 Daily Cash Flow Trendline & Safe to Spend (Stitch 2.2 Exact) */}
      <DailyCashFlowChart />

      {/* 4. 2-Column Content Grid (Stitch Exact: Span 8 Left vs Span 4 Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (Span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Ringkasan Penggunaan Budget (Modern Minimalist Diagram & Breakdown) */}
          <div className="bg-surface rounded-[14px] p-6 border border-border-default shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-lg font-semibold text-text-primary tracking-tight">
                    Ringkasan Penggunaan Budget
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      overallBudgetPercentage >= 100
                        ? 'bg-semantic-rose-soft text-semantic-rose border-semantic-rose/20'
                        : 'bg-semantic-green-soft text-semantic-green border-semantic-green/20'
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
                <span className="text-[11px] text-text-muted mt-0.5">dari total plafon alokasi</span>
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
              <div className="h-3 w-full bg-bg-secondary rounded-full flex overflow-hidden p-0.5 gap-0.5">
                {donutSlices.map((slice) => (
                  <div
                    key={slice.id}
                    className="h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${(slice.ratio * 100).toFixed(1)}%`,
                      backgroundColor: slice.color,
                    }}
                    title={`${slice.name} (${(slice.ratio * 100).toFixed(1)}%)`}
                  />
                ))}
                <div className="bg-surface-container flex-1 h-full rounded-full" title="Sisa Budget" />
              </div>
            </div>

            {/* Comparative Category Diagrams (Horizontal Progress Gauge Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {categories.filter((c) => c.type === 'expense').slice(0, 4).map((cat, idx) => {
                const budget = budgets.find((b) => b.category_id === cat.id);
                const budgetAmount = budget ? Number(budget.amount) : 0;
                const spent = transactions
                  .filter((t) => t.type === 'expense' && t.category_id === cat.id && t.transaction_date >= startStr && t.transaction_date <= endStr)
                  .reduce((sum, t) => sum + Number(t.amount), 0);

                const percentage = budgetAmount > 0 ? Math.min(100, Math.round((spent / budgetAmount) * 100)) : 65;
                const color = cat.color || stitchColors[idx % stitchColors.length];

                return (
                  <div
                    key={cat.id}
                    className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between border border-border-default hover:border-primary-500 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${color}15`, color: color }}
                        >
                          {getCategoryIcon(cat.icon)}
                        </div>
                        <span className="text-sm font-medium text-text-primary truncate">
                          {cat.name}
                        </span>
                      </div>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full tabular-nums"
                        style={{ backgroundColor: `${color}15`, color: color }}
                      >
                        {percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-border-default h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span className="tabular-nums">
                        {formatCompactCurrency(spent)} / {budgetAmount > 0 ? formatCompactCurrency(budgetAmount) : '1.000k'}
                      </span>
                      <span className="text-semantic-green font-medium tabular-nums">
                        Sisa {formatCurrency(Math.max(0, (budgetAmount || 1000000) - spent))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-border-default flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {categories.filter((c) => c.type === 'expense').length} pos budget terpantau otomatis
              </span>
              <button
                onClick={() => onSelectTab('budget')}
                className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 font-medium transition-colors"
              >
                <span>Lihat Analisis Detail</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Dompet Saya (Redesigned with Modern Cards & Status) */}
          <div className="bg-surface rounded-[14px] p-6 border border-border-default shadow-sm">
            <div className="flex items-center justify-between mb-4">
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
                  className="text-xs text-primary-600 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-primary-50 font-medium"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transfer</span>
                </button>
                <button
                  onClick={onOpenAddWallet}
                  className="text-xs text-text-secondary hover:bg-bg-secondary px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-border-default font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {wallets.map((wallet) => {
                const share = totalBalance > 0 ? ((wallet.balance / totalBalance) * 100).toFixed(1) : '0';

                return (
                  <div
                    key={wallet.id}
                    className="bg-surface-container-low p-4 rounded-xl flex flex-col justify-between border border-border-default hover:border-primary-500 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                          style={{ backgroundColor: `${wallet.color}20`, color: wallet.color }}
                        >
                          {wallet.name.slice(0, 3).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-text-primary leading-tight">
                            {wallet.name}
                          </span>
                          <span className="text-[11px] text-text-muted">
                            {wallet.wallet_type === 'cash'
                              ? 'Fisik di Dompet'
                              : wallet.wallet_type === 'bank'
                              ? 'Utama • Simpanan'
                              : 'E-Wallet Harian'}
                          </span>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-semantic-green" title="Aktif" />
                    </div>

                    <div>
                      <span className="text-lg font-semibold text-text-primary tabular-nums tracking-tight">
                        {formatCurrency(wallet.balance)}
                      </span>
                      <p className="text-xs text-text-muted mt-1 flex items-center justify-between">
                        <span>Porsi Saldo</span>
                        <span className="font-medium text-text-secondary">{share}%</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Span 4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Transaksi Terbaru (Stitch Exact) */}
          <div className="bg-surface rounded-[14px] p-6 shadow-sm border border-border-default">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary tracking-tight">
                Transaksi Terbaru
              </h2>
              <span className="text-xs text-text-muted">Aktivitas terakhir</span>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                Belum ada transaksi.
              </div>
            ) : (
              <div className="flex flex-col">
                {recentTransactions.map((tx, idx) => {
                  const cat = categories.find((c) => c.id === tx.category_id);
                  const walletObj = wallets.find((w) => w.id === tx.wallet_id);

                  return (
                    <React.Fragment key={tx.id}>
                      <div className="py-2 flex items-center justify-between hover:bg-surface-container-low px-1.5 rounded-lg transition-colors group">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              tx.type === 'income'
                                ? 'bg-semantic-green-soft text-semantic-green'
                                : 'bg-surface-container text-text-secondary'
                            }`}
                          >
                            {tx.type === 'transfer' ? (
                              <ArrowRightLeft className="w-4 h-4 text-primary-600" />
                            ) : (
                              getCategoryIcon(cat?.icon)
                            )}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-text-primary truncate">
                              {tx.note || cat?.name || (tx.type === 'transfer' ? 'Transfer Saldo' : 'Transaksi')}
                            </span>
                            <span className="text-xs text-text-muted truncate">
                              {walletObj?.name || 'Dompet'} • {formatRelativeDate(tx.transaction_date)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <span
                            className={`text-xs font-medium tabular-nums ${
                              tx.type === 'income'
                                ? 'text-semantic-green'
                                : tx.type === 'expense'
                                ? 'text-semantic-rose'
                                : 'text-text-primary'
                            }`}
                          >
                            {tx.type === 'income' ? '+ ' : tx.type === 'expense' ? '- ' : ''}
                            {formatCurrency(tx.amount)}
                          </span>

                          <button
                            onClick={async () => {
                              await deleteTransaction(tx.id);
                              if (onShowToast) onShowToast('Transaksi dihapus');
                            }}
                            className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-text-muted hover:text-semantic-rose rounded transition-all"
                            title="Hapus transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {idx < recentTransactions.length - 1 && (
                        <div className="h-[1px] bg-bg-secondary my-1" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-2 flex justify-center">
              <button
                onClick={() => onSelectTab('transactions')}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Lihat Semua Transaksi →
              </button>
            </div>
          </div>

          {/* Kategori Pengeluaran Donut Chart (Stitch Exact SVG Donut) */}
          <div className="bg-surface rounded-[14px] p-6 shadow-sm border border-border-default">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-text-primary">Kategori Pengeluaran</h3>
              <span className="text-xs text-text-muted font-medium bg-bg-secondary px-2.5 py-1 rounded-full">
                Siklus Aktif
              </span>
            </div>

            {/* Circular SVG Donut Chart (Stitch Exact) */}
            <div className="flex flex-col items-center my-4">
              <div className="relative w-44 h-44 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  {/* Background ring */}
                  <circle
                    cx="80"
                    cy="80"
                    r="62"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="16"
                  />
                  {/* Category Slices */}
                  {donutSlices.map((slice) => (
                    <circle
                      key={slice.id}
                      cx="80"
                      cy="80"
                      r="62"
                      fill="none"
                      stroke={slice.color}
                      strokeWidth="16"
                      strokeDasharray={slice.strokeDasharray}
                      strokeDashoffset={slice.strokeDashoffset}
                      strokeLinecap="round"
                    />
                  ))}
                </svg>

                {/* Donut Center Label */}
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-text-muted leading-tight">Total Terpakai</span>
                  <span className="text-[20px] font-bold text-text-primary tracking-tight tabular-nums mt-0.5">
                    {formatCompactCurrency(totalCycleExpense).replace('Rp ', '')}
                  </span>
                  <span className="text-xs text-semantic-green font-medium">
                    {overallBudgetPercentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Categories Legend List */}
            <div className="flex flex-col gap-2 pt-1">
              {categorySpending.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm py-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-text-primary">{item.name}</span>
                  </div>
                  <span className="text-xs text-text-secondary tabular-nums">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
