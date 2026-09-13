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
  PiggyBank,
  CheckCircle2,
  Trash2,
  Tag,
  Briefcase,
  Award,
  Wallet as WalletIcon,
  Building2,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatCompactCurrency, formatDateIndo, formatRelativeDate } from '../lib/formatters';

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
    commitments,
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
  const totalRemainingQuota = Math.max(0, totalAllocatedBudget - totalCycleExpense);
  const overallBudgetPercentage = totalAllocatedBudget > 0
    ? Math.min(100, Math.round((totalCycleExpense / totalAllocatedBudget) * 100))
    : 0;

  // Category spending aggregation for donut chart & list
  const categorySpending = categories
    .filter((c) => c.type === 'expense')
    .map((cat) => {
      const total = transactions
        .filter((t) => t.type === 'expense' && t.category_id === cat.id && t.transaction_date >= startStr && t.transaction_date <= endStr)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color || '#6366f1',
        icon: cat.icon,
        value: total,
      };
    })
    .sort((a, b) => b.value - a.value);

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
          text: 'Estimasi Saldo',
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
    <div className="space-y-6">
      {/* 1. Top Greeting & Primary Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="flex flex-col">
          <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Selamat datang kembali, {studentName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Berikut ringkasan kondisi keuanganmu untuk siklus {formatDateIndo(cycleInfo.startDate)} – {formatDateIndo(cycleInfo.endDate)}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={onOpenQuickAdd}
            className="bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-semibold text-xs sm:text-sm px-4 py-2.5 rounded-[10px] flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Highlight: Safe to Spend Card */}
      <section className="bg-surface rounded-[14px] p-5 sm:p-6 border border-border-default shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Left: Metric info */}
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs uppercase tracking-wider font-semibold text-text-secondary">
                Safe to Spend
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.text}
              </span>

              <button
                onClick={onOpenSimulator}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-50 hover:bg-primary-100 text-primary-600 transition-colors ml-auto md:ml-2"
                title="Hitung dampak belanja terhadap jatah hari esok"
              >
                <Calculator className="w-3 h-3" />
                <span>Simulasi Jajan</span>
              </button>
            </div>

            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-text-primary tabular-nums tracking-tight">
                {formatCurrency(safeToSpend.dailySafeToSpend)}
              </span>
              <span className="text-sm text-text-muted font-normal">/ hari</span>
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              <CheckCircle2 className="w-4 h-4 text-semantic-green shrink-0" />
              <p className="text-xs text-text-secondary">
                <strong className="text-text-primary font-semibold">
                  {cycleInfo.daysRemaining} hari tersisa
                </strong>{' '}
                dalam siklus ini • Berdasarkan sisa budget aktif{' '}
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatCurrency(safeToSpend.remainingBudget)}
                </span>
              </p>
            </div>
          </div>

          {/* Right: Safe-to-Spend Pacing Micro Visualizer */}
          <div className="w-full md:w-80 bg-surface-container-low p-4 rounded-xl border border-border-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
              <span className="font-medium">Pacing Pengeluaran</span>
              <span
                className={`font-semibold tabular-nums ${
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

            <div className="flex justify-between items-center mt-2 text-[11px] text-text-muted">
              <span>Mulai ({cycleInfo.startDate.getDate()} {new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(cycleInfo.startDate)})</span>
              <span className="text-text-secondary font-medium">
                Hari ke-{cycleInfo.daysPassed} dari {cycleInfo.totalDays}
              </span>
              <span>Akhir ({cycleInfo.endDate.getDate()} {new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(cycleInfo.endDate)})</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Financial Summary Cards (Grid of 4) */}
      <section className="bg-surface rounded-[14px] border border-border-default shadow-sm overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border-default">
          {/* Card 1: Total Saldo */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium">Total Saldo</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-semantic-green-soft text-semantic-green">
                <ArrowUpRight className="w-3 h-3" /> Kas
              </span>
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-xl font-bold text-text-primary tracking-tight tabular-nums">
                {formatCompactCurrency(totalBalance)}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5 truncate">
                {formatCurrency(totalBalance)}
              </div>
            </div>
          </div>

          {/* Card 2: Total Pemasukan */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium">Total Pemasukan</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-semantic-green-soft text-semantic-green">
                <ArrowUpRight className="w-3 h-3" /> Masuk
              </span>
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-xl font-bold text-semantic-green tracking-tight tabular-nums">
                {formatCompactCurrency(totalIncomeInCycle)}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5 truncate">
                {formatCurrency(totalIncomeInCycle)}
              </div>
            </div>
          </div>

          {/* Card 3: Total Pengeluaran */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium">Total Pengeluaran</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-semantic-rose-soft text-semantic-rose">
                <ArrowDownRight className="w-3 h-3" /> Keluar
              </span>
            </div>
            <div className="mt-2">
              <div className="text-base sm:text-xl font-bold text-semantic-rose tracking-tight tabular-nums">
                {formatCompactCurrency(totalExpenseInCycle)}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5 truncate">
                {formatCurrency(totalExpenseInCycle)}
              </div>
            </div>
          </div>

          {/* Card 4: Net Surplus / Defisit */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted font-medium">Surplus Bersih</span>
              <span
                className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  netSavings >= 0
                    ? 'bg-semantic-green-soft text-semantic-green'
                    : 'bg-semantic-rose-soft text-semantic-rose'
                }`}
              >
                <PiggyBank className="w-3 h-3" /> Net
              </span>
            </div>
            <div className="mt-2">
              <div
                className={`text-base sm:text-xl font-bold tracking-tight tabular-nums ${
                  netSavings >= 0 ? 'text-text-primary' : 'text-semantic-rose'
                }`}
              >
                {formatCompactCurrency(netSavings)}
              </div>
              <div className="text-[11px] text-text-muted mt-0.5 truncate">
                {formatCurrency(netSavings)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 2-Column Content Grid: Left (Span 8) vs Right (Span 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (Span 8 on desktop) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Ringkasan Penggunaan Budget (Stitch Modern Gauge & Breakdown) */}
          <div className="bg-surface rounded-[14px] p-5 sm:p-6 border border-border-default shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="text-base font-bold text-text-primary tracking-tight">
                    Ringkasan Penggunaan Budget
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                      overallBudgetPercentage >= 100
                        ? 'bg-semantic-rose-soft text-semantic-rose border-semantic-rose/20'
                        : overallBudgetPercentage >= 80
                        ? 'bg-semantic-amber-soft text-semantic-amber border-semantic-amber/20'
                        : 'bg-semantic-green-soft text-semantic-green border-semantic-green/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        overallBudgetPercentage >= 100
                          ? 'bg-semantic-rose'
                          : overallBudgetPercentage >= 80
                          ? 'bg-semantic-amber'
                          : 'bg-semantic-green'
                      }`}
                    />
                    {overallBudgetPercentage >= 100
                      ? `Overbudget (${overallBudgetPercentage}%)`
                      : `Aman (${overallBudgetPercentage}%)`}
                  </span>
                </div>
                <p className="text-xs text-text-muted flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-text-muted" />
                  <span>
                    Siklus: {formatDateIndo(cycleInfo.startDate)} – {formatDateIndo(cycleInfo.endDate)} •{' '}
                    <span className="text-text-secondary font-medium">Sisa {cycleInfo.daysRemaining} hari</span>
                  </span>
                </p>
              </div>

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
                {categorySpending.map((cat) => {
                  const ratio = totalAllocatedBudget > 0 ? (cat.value / totalAllocatedBudget) * 100 : 0;
                  if (ratio <= 0) return null;
                  return (
                    <div
                      key={cat.id}
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(ratio, 100)}%`,
                        backgroundColor: cat.color,
                      }}
                      title={`${cat.name} (${ratio.toFixed(1)}%)`}
                    />
                  );
                })}
                <div className="bg-surface-container flex-1 h-full rounded-full" title="Sisa Kuota" />
              </div>
            </div>

            {/* Comparative Category Gauge Cards (Grid of 2 or 4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {categories.filter((c) => c.type === 'expense').slice(0, 4).map((cat) => {
                const budget = budgets.find((b) => b.category_id === cat.id);
                const budgetAmount = budget ? Number(budget.amount) : 0;
                const spent = transactions
                  .filter((t) => t.type === 'expense' && t.category_id === cat.id && t.transaction_date >= startStr && t.transaction_date <= endStr)
                  .reduce((sum, t) => sum + Number(t.amount), 0);

                const percentage = budgetAmount > 0 ? Math.min(100, Math.round((spent / budgetAmount) * 100)) : 0;
                const isOver = budgetAmount > 0 && spent > budgetAmount;

                return (
                  <div
                    key={cat.id}
                    className="bg-surface-container-low p-4 rounded-xl border border-border-default hover:border-primary-500 transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
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

                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums ${
                          isOver
                            ? 'bg-semantic-rose-soft text-semantic-rose'
                            : 'bg-primary-50 text-primary-600'
                        }`}
                      >
                        {percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-border-default h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-semantic-rose' : 'bg-primary-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span className="tabular-nums">
                        {formatCompactCurrency(spent)} / {formatCompactCurrency(budgetAmount)}
                      </span>
                      <span
                        className={`font-medium tabular-nums ${
                          isOver ? 'text-semantic-rose' : 'text-semantic-green'
                        }`}
                      >
                        {isOver
                          ? `Lewat ${formatCompactCurrency(spent - budgetAmount)}`
                          : `Sisa ${formatCompactCurrency(budgetAmount - spent)}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-border-default flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {categories.filter((c) => c.type === 'expense').length} pos anggaran aktif
              </span>
              <button
                onClick={() => onSelectTab('budget')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
              >
                <span>Kelola Semua Anggaran</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Dompet & Rekening Cards (Stitch Wallets Grid) */}
          <div className="bg-surface rounded-[14px] p-5 sm:p-6 border border-border-default shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <h2 className="text-base font-bold text-text-primary tracking-tight">
                  Dompet &amp; Rekening
                </h2>
                <span className="text-xs text-text-muted">
                  Alokasi saldo aktif per rekening mahasiswa
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenTransfer}
                  className="text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transfer</span>
                </button>
                <button
                  onClick={onOpenAddWallet}
                  className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-lg transition-colors"
                  title="Tambah Dompet"
                  aria-label="Tambah Dompet"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {wallets.map((wallet) => {
                const share = totalBalance > 0 ? ((wallet.balance / totalBalance) * 100).toFixed(1) : '0';

                return (
                  <div
                    key={wallet.id}
                    className="bg-surface-container-low p-4 rounded-xl flex flex-col justify-between border border-border-default hover:border-primary-500 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0"
                          style={{ backgroundColor: `${wallet.color}20`, color: wallet.color }}
                        >
                          {wallet.name.slice(0, 3).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-text-primary leading-tight truncate">
                            {wallet.name}
                          </span>
                          <span className="text-[10px] text-text-muted capitalize">
                            {wallet.wallet_type === 'cash' ? 'Tunai' : wallet.wallet_type}
                          </span>
                        </div>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-semantic-green shrink-0" title="Aktif" />
                    </div>

                    <div>
                      <span className="text-base font-bold text-text-primary tabular-nums tracking-tight">
                        {formatCurrency(wallet.balance)}
                      </span>
                      <p className="text-[11px] text-text-muted mt-1 flex items-center justify-between">
                        <span>Porsi Saldo</span>
                        <span className="font-semibold text-text-secondary tabular-nums">{share}%</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Span 4 on desktop) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Transaksi Terbaru */}
          <div className="bg-surface rounded-[14px] p-5 sm:p-6 border border-border-default shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-text-primary tracking-tight">
                Transaksi Terbaru
              </h2>
              <span className="text-xs text-text-muted">Aktivitas terakhir</span>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                Belum ada transaksi.
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {recentTransactions.map((tx) => {
                  const cat = categories.find((c) => c.id === tx.category_id);
                  const walletObj = wallets.find((w) => w.id === tx.wallet_id);

                  return (
                    <div
                      key={tx.id}
                      className="py-2.5 flex items-center justify-between hover:bg-surface-container-low px-1.5 rounded-lg transition-colors group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            tx.type === 'income'
                              ? 'bg-semantic-green-soft text-semantic-green'
                              : tx.type === 'expense'
                              ? 'bg-surface-container text-text-secondary'
                              : 'bg-primary-50 text-primary-600'
                          }`}
                        >
                          {tx.type === 'transfer' ? (
                            <ArrowRightLeft className="w-4 h-4" />
                          ) : (
                            getCategoryIcon(cat?.icon)
                          )}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-text-primary truncate">
                            {tx.note || cat?.name || (tx.type === 'transfer' ? 'Transfer Saldo' : 'Transaksi')}
                          </span>
                          <span className="text-[10px] text-text-muted truncate">
                            {walletObj?.name || 'Dompet'} • {formatRelativeDate(tx.transaction_date)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                          className={`text-xs font-semibold tabular-nums ${
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
                          title="Hapus"
                          aria-label="Hapus"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-4 pt-2 flex justify-center border-t border-border-default">
              <button
                onClick={() => onSelectTab('transactions')}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                Lihat Semua Transaksi →
              </button>
            </div>
          </div>

          {/* Kategori Pengeluaran Donut Breakdown (Stitch Donut Card) */}
          <div className="bg-surface rounded-[14px] p-5 sm:p-6 border border-border-default shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-text-primary">Kategori Pengeluaran</h3>
              <span className="text-[11px] text-text-muted font-medium bg-bg-secondary px-2.5 py-0.5 rounded-full">
                Siklus Aktif
              </span>
            </div>

            {/* Total Expense Strip */}
            <div className="p-3 bg-surface-container-low rounded-xl mb-3 flex items-center justify-between">
              <span className="text-xs text-text-muted">Total Pengeluaran</span>
              <span className="text-sm font-bold text-text-primary tabular-nums">
                {formatCurrency(totalCycleExpense)}
              </span>
            </div>

            {/* List of top categories with percentage bars */}
            <div className="space-y-2.5">
              {categorySpending.slice(0, 5).map((item) => {
                const percent = totalCycleExpense > 0 ? Math.round((item.value / totalCycleExpense) * 100) : 0;
                return (
                  <div key={item.id} className="text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="flex items-center gap-2 font-medium text-text-secondary truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="truncate">{item.name}</span>
                      </span>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-text-muted tabular-nums">{formatCompactCurrency(item.value)}</span>
                        <span className="font-bold text-text-primary tabular-nums w-8 text-right">{percent}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-border-default h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
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

          {/* Pengeluaran Tetap Bulanan Quick Preview */}
          <div className="bg-surface rounded-[14px] p-5 sm:p-6 border border-border-default shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary-600" />
                <span>Tagihan Rutin ({commitments.length})</span>
              </h3>
              <button
                onClick={() => onSelectTab('budget')}
                className="text-[11px] font-semibold text-primary-600 hover:underline"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-2">
              {commitments.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low text-xs"
                >
                  <div>
                    <div className="font-semibold text-text-primary">{c.name}</div>
                    <div className="text-[10px] text-text-muted">Tgl {c.due_day}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-text-primary tabular-nums">{formatCurrency(c.amount)}</div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        c.is_paid
                          ? 'bg-semantic-green-soft text-semantic-green'
                          : 'bg-semantic-amber-soft text-semantic-amber'
                      }`}
                    >
                      {c.is_paid ? 'Lunas' : 'Belum'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
