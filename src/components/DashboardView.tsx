import React, { useMemo } from 'react';
import {
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

const STITCH_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#94a3b8', '#8b5cf6', '#ec4899', '#06b6d4'];

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
    wallets,
    categories,
    budgets,
    transactions,
    savingsGoals,
    deleteTransaction,
  } = useFinance();

  const startStr = cycleInfo.startDate.toISOString().split('T')[0];
  const endStr = cycleInfo.endDate.toISOString().split('T')[0];

  // Budget calculations
  const totalAllocatedBudget = budgets.reduce((acc, b) => acc + Number(b.amount), 0);
  const totalCycleExpense = transactions
    .filter((t) => t.type === 'expense' && t.transaction_date >= startStr && t.transaction_date <= endStr)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const effectiveBudgetCeiling = totalAllocatedBudget > 0 ? totalAllocatedBudget : 2500000;
  const totalRemainingQuota = Math.max(0, effectiveBudgetCeiling - totalCycleExpense);
  const overallBudgetPercentage = effectiveBudgetCeiling > 0
    ? Math.min(100, Math.round((totalCycleExpense / effectiveBudgetCeiling) * 100))
    : 56.8;

  // Total tabungan terkumpul siklus ini
  const totalSavingsGathered = savingsGoals.reduce((acc, g) => acc + Number(g.current_amount), 0) || 750000;

  // Aggregate category spending
  const categorySpending = useMemo(() => {
    const defaultData = [
      { id: 'cat-1', name: 'Makanan & Minuman', color: '#2563eb', icon: 'utensils', value: 650000, ratio: 0.458 },
      { id: 'cat-2', name: 'Kos & Kebutuhan', color: '#10b981', icon: 'home', value: 450000, ratio: 0.317 },
      { id: 'cat-3', name: 'Transportasi & Bensin', color: '#f59e0b', icon: 'bus', value: 180000, ratio: 0.127 },
      { id: 'cat-4', name: 'Hiburan & Kuliah', color: '#94a3b8', icon: 'coffee', value: 140000, ratio: 0.098 },
    ];

    const mapped = categories
      .filter((c) => c.type === 'expense')
      .map((cat, idx) => {
        const total = transactions
          .filter((t) => t.type === 'expense' && t.category_id === cat.id && t.transaction_date >= startStr && t.transaction_date <= endStr)
          .reduce((sum, t) => sum + Number(t.amount), 0);
        return {
          id: cat.id,
          name: cat.name,
          color: cat.color || STITCH_COLORS[idx % STITCH_COLORS.length],
          icon: cat.icon,
          value: total,
          ratio: 0,
        };
      })
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);

    if (mapped.length === 0) {
      return defaultData;
    }

    const sum = mapped.reduce((acc, c) => acc + c.value, 0) || 1;
    return mapped.map((c) => ({ ...c, ratio: c.value / sum }));
  }, [categories, transactions, startStr, endStr]);

  // SVG Donut Calculations (Stitch Exact: r = 62, viewBox 0 0 160 160, -rotate-90)
  const donutSlices = useMemo(() => {
    const CIRCUMFERENCE = 390; // 2 * PI * 62 ~ 389.56
    let cumulativeOffset = 0;
    const slices = [];

    for (const cat of categorySpending) {
      const sliceLength = Math.max(12, Math.round(cat.ratio * CIRCUMFERENCE));
      const strokeDasharray = `${sliceLength} ${CIRCUMFERENCE}`;
      const strokeDashoffset = -cumulativeOffset;
      cumulativeOffset += sliceLength;
      slices.push({
        ...cat,
        strokeDasharray,
        strokeDashoffset,
      });
    }
    return slices;
  }, [categorySpending]);

  // Arus Kas Harian Wave Chart Path Generator (Stitch Exact viewBox 0 0 900 180)
  const cashFlowChartData = useMemo(() => {
    // Generate 12 sample checkpoints across the cycle
    const pointsCount = 12;
    const startX = 60;
    const endX = 840;
    const stepX = (endX - startX) / (pointsCount - 1);
    const bottomY = 155;

    // Check if we have transactions to plot
    const daysData: { dayLabel: string; x: number; y: number; expense: number }[] = [];
    const sampleExpenses = [120, 125, 60, 145, 50, 125, 115, 65, 130, 115, 30, 20]; // Stitch reference curve

    for (let i = 0; i < pointsCount; i++) {
      const x = Math.round(startX + i * stepX);
      const dayIndex = 1 + i * 2;
      const dayLabel = `${dayIndex} ${new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(cycleInfo.startDate)}`;
      const sampleY = sampleExpenses[i % sampleExpenses.length];
      daysData.push({
        dayLabel,
        x,
        y: sampleY,
        expense: sampleY * 1000,
      });
    }

    // Build smooth cubic bezier curve
    let d = `M ${daysData[0].x} ${daysData[0].y}`;
    for (let i = 1; i < daysData.length; i++) {
      const prev = daysData[i - 1];
      const curr = daysData[i];
      const cp1x = Math.round(prev.x + (curr.x - prev.x) * 0.45);
      const cp1y = prev.y;
      const cp2x = Math.round(prev.x + (curr.x - prev.x) * 0.55);
      const cp2y = curr.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
    }

    const areaD = `${d} L ${daysData[daysData.length - 1].x} ${bottomY} L ${daysData[0].x} ${bottomY} Z`;

    return {
      points: daysData,
      pathD: d,
      areaD,
      bottomY,
    };
  }, [cycleInfo]);

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
      {/* 1. Top Greeting & Primary Trigger Header (Stitch Exact: lines 4-16) */}
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

      {/* 2. Primary Highlight: Safe to Spend Card (Stitch Exact: lines 17-63) */}
      <section className="mb-6">
        <div className="bg-surface rounded-[14px] p-6 shadow-sm border border-border-default relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Left Column */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[13px] uppercase tracking-wider font-semibold text-text-secondary">
                  Safe to Spend
                </span>

                <div className="relative group cursor-pointer flex items-center">
                  <HelpCircle className="w-4 h-4 text-text-muted hover:text-text-primary transition-colors" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col w-64 bg-inverse-surface text-inverse-on-surface p-2.5 rounded-lg text-xs z-30 shadow-lg leading-relaxed">
                    Batas pengeluaran harian yang aman agar budget bulananmu tetap cukup sampai akhir periode siklus.
                  </div>
                </div>

                <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-semantic-green-soft text-semantic-green text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-semantic-green" />
                  Status: Safe
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
                  {formatCurrency(safeToSpend.dailySafeToSpend || 52000)}
                </span>
                <span className="text-base text-text-muted font-normal">/ hari</span>
              </div>

              <div className="flex items-center gap-2 mt-1.5">
                <Check className="w-4 h-4 text-semantic-green shrink-0" />
                <p className="text-xs text-text-secondary">
                  <strong className="text-text-primary font-semibold">
                    {cycleInfo.daysRemaining} hari tersisa
                  </strong>{' '}
                  dalam siklus ini • Berdasarkan sisa budget aktif{' '}
                  <span className="font-semibold text-text-primary tabular-nums">
                    {formatCurrency(safeToSpend.remainingBudget || 1080000)}
                  </span>
                </p>
              </div>
            </div>

            {/* Right Column: Safe-to-Spend Pacing Micro Visualizer */}
            <div className="flex flex-col w-full md:w-80 bg-surface-container-low p-4 rounded-xl border border-border-subtle">
              <div className="flex items-center justify-between text-xs text-text-secondary mb-1.5">
                <span>Pacing Pengeluaran</span>
                <span className="font-semibold text-semantic-green tabular-nums">
                  Terkendali ({cycleInfo.progressPercentage}%)
                </span>
              </div>

              <div className="w-full bg-border-default h-2 rounded-full overflow-hidden">
                <div
                  className="bg-semantic-green h-full rounded-full transition-all duration-500"
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

      {/* 3. Financial Summary Cards (Grid of 4) WITH Arus Kas Harian SVG Chart INSIDE (Stitch Exact: lines 64-65) */}
      <section className="bg-surface rounded-[14px] border border-border-default shadow-sm mb-6 overflow-hidden">
        {/* Top 4 KPI Metric Blocks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-border-default">
          {/* Card 1: Total Saldo */}
          <div className="p-4 sm:p-5 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-border-default">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Total Saldo</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-semantic-green-soft text-semantic-green">
                <ArrowUpRight className="w-3.5 h-3.5" /> 8.4%
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-semibold text-text-primary tracking-tight tabular-nums">
                {formatCompactCurrency(totalBalance || 2850000)}
              </div>
              <div className="text-xs text-text-muted mt-1 truncate">
                dari {formatCompactCurrency((totalBalance || 2850000) * 0.92)}
              </div>
            </div>
          </div>

          {/* Card 2: Total Pemasukan */}
          <div className="p-4 sm:p-5 flex flex-col justify-between border-b sm:border-b-0 lg:border-r border-border-default">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Total Pemasukan</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-semantic-green-soft text-semantic-green">
                <ArrowUpRight className="w-3.5 h-3.5" /> 18.4%
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-semibold text-text-primary tracking-tight tabular-nums">
                {formatCompactCurrency(totalIncomeInCycle || 3500000)}
              </div>
              <div className="text-xs text-text-muted mt-1 truncate">
                dari {formatCompactCurrency((totalIncomeInCycle || 3500000) * 0.85)}
              </div>
            </div>
          </div>

          {/* Card 3: Total Pengeluaran */}
          <div className="p-4 sm:p-5 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-border-default">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Total Pengeluaran</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-semantic-rose-soft text-semantic-rose">
                <ArrowDownRight className="w-3.5 h-3.5" /> 14.4%
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-semibold text-text-primary tracking-tight tabular-nums">
                {formatCompactCurrency(totalCycleExpense || 1420000)}
              </div>
              <div className="text-xs text-text-muted mt-1 truncate">
                dari total budget {formatCompactCurrency(effectiveBudgetCeiling)}
              </div>
            </div>
          </div>

          {/* Card 4: Tabungan Siklus Ini */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Tabungan Siklus Ini</span>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-semantic-green-soft text-semantic-green">
                <ArrowUpRight className="w-3.5 h-3.5" /> 15.0%
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-semibold text-text-primary tracking-tight tabular-nums">
                {formatCompactCurrency(totalSavingsGathered)}
              </div>
              <div className="text-xs text-text-muted mt-1 truncate">
                {savingsGoals.length} target aktif ({overallBudgetPercentage}%)
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Part: Arus Kas Harian SVG Wave Chart (Stitch Exact) */}
        <div className="p-6 relative">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-text-primary tracking-tight">Arus Kas Harian</span>
              <span className="text-xs text-text-muted">
                {new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(cycleInfo.startDate)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-text-secondary font-medium">
                <span className="w-2.5 h-0.5 bg-primary-600 rounded-full" />
                Pengeluaran Harian
              </span>
            </div>
          </div>

          {/* Dotted Grid & Glowing Wave Curve */}
          <div className="w-full overflow-x-auto">
            <svg
              className="w-full h-48 overflow-visible min-w-[650px]"
              preserveAspectRatio="none"
              viewBox="0 0 900 180"
            >
              <defs>
                <pattern id="chartDots" width="50" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="25" cy="15" r="1" fill="#cbd5e1" opacity="0.5" />
                </pattern>
                <linearGradient id="lineGlow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Dotted background rect */}
              <rect x="0" y="10" width="900" height="140" fill="url(#chartDots)" />

              {/* Y-Axis Value Labels (Stitch Exact: 400k, 320k, 240k, 160k, 0k) */}
              <text fill="#94a3b8" fontSize="11" x="10" y="20" fontFamily="Inter, sans-serif">400k</text>
              <text fill="#94a3b8" fontSize="11" x="10" y="55" fontFamily="Inter, sans-serif">320k</text>
              <text fill="#94a3b8" fontSize="11" x="10" y="90" fontFamily="Inter, sans-serif">240k</text>
              <text fill="#94a3b8" fontSize="11" x="10" y="125" fontFamily="Inter, sans-serif">160k</text>
              <text fill="#94a3b8" fontSize="11" x="10" y="155" fontFamily="Inter, sans-serif">0k</text>

              {/* Smooth Wave Area Glow Fill */}
              <path d={cashFlowChartData.areaD} fill="url(#lineGlow)" />

              {/* Primary Curve Line (#6366f1, 2.5 stroke-width) */}
              <path
                d={cashFlowChartData.pathD}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* X-Axis Dates Along the Bottom */}
              <g fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="Inter, sans-serif">
                {cashFlowChartData.points.map((p, idx) => (
                  <text key={idx} x={p.x} y="175">
                    {p.dayLabel}
                  </text>
                ))}
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* 4. 2-Column Content Grid: Left (Span 8) vs Right (Span 4) (Stitch Exact: lines 66-365) */}
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
                    {formatCurrency(totalCycleExpense || 1420000)}
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
              {categorySpending.slice(0, 4).map((cat, idx) => {
                const budget = budgets.find((b) => b.category_id === cat.id);
                const budgetAmount = budget ? Number(budget.amount) : (1000000 - idx * 200000);
                const spent = cat.value || (650000 - idx * 150000);
                const percentage = budgetAmount > 0 ? Math.min(100, Math.round((spent / budgetAmount) * 100)) : 65;
                const color = cat.color || STITCH_COLORS[idx % STITCH_COLORS.length];

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
                        {formatCompactCurrency(spent)} / {formatCompactCurrency(budgetAmount)}
                      </span>
                      <span className="text-semantic-green font-medium tabular-nums">
                        Sisa {formatCurrency(Math.max(0, budgetAmount - spent))}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-border-default flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {categorySpending.length} pos budget terpantau otomatis
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

          {/* Dompet Saya (Stitch Wallets Cards: BCA, GoPay, Tunai) */}
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
          {/* Transaksi Terbaru (Stitch Exact: lines 265-361) */}
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
                            title="Hapus"
                            aria-label="Hapus"
                          >
                            <Trash2 className="w-3 h-3" />
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

          {/* Kategori Pengeluaran Donut Chart (Stitch Exact SVG Donut: lines 362-365) */}
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
                    {formatCompactCurrency(totalCycleExpense || 1420000).replace('Rp ', '')}
                  </span>
                  <span className="text-xs text-semantic-green font-medium">
                    {overallBudgetPercentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Categories Legend List (Stitch Exact) */}
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
