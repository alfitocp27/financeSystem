import React, { useState, useMemo, useRef } from 'react';
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

  // Chart Interactive Hover States
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [hoveredCategoryIndex, setHoveredCategoryIndex] = useState<number | null>(null);
  const svgWaveRef = useRef<SVGSVGElement | null>(null);

  const startStr = cycleInfo.startDate.toISOString().split('T')[0];
  const endStr = cycleInfo.endDate.toISOString().split('T')[0];

  // Real Budget & Expense calculations from Database
  const totalAllocatedBudget = budgets.reduce((acc, b) => acc + Number(b.amount), 0);
  const totalCycleExpense = transactions
    .filter((t) => t.type === 'expense' && t.transaction_date >= startStr && t.transaction_date <= endStr)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const effectiveBudgetCeiling = totalAllocatedBudget > 0 ? totalAllocatedBudget : (totalBalance + totalCycleExpense || 2500000);
  const totalRemainingQuota = Math.max(0, effectiveBudgetCeiling - totalCycleExpense);
  const overallBudgetPercentage = effectiveBudgetCeiling > 0
    ? Math.min(100, Math.round((totalCycleExpense / effectiveBudgetCeiling) * 100))
    : 0;

  // Real savings gathered from Database
  const totalSavingsGathered = savingsGoals.reduce((acc, g) => acc + Number(g.current_amount), 0);

  // Real Category Spending from Database
  const categorySpending = useMemo(() => {
    const expenseCats = categories.filter((c) => c.type === 'expense');

    const mapped = expenseCats.map((cat, idx) => {
      const total = transactions
        .filter((t) => t.type === 'expense' && t.category_id === cat.id && t.transaction_date >= startStr && t.transaction_date <= endStr)
        .reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color || STITCH_COLORS[idx % STITCH_COLORS.length],
        icon: cat.icon,
        value: total,
      };
    }).sort((a, b) => b.value - a.value);

    const totalSpent = mapped.reduce((acc, c) => acc + c.value, 0);

    return mapped.map((c) => ({
      ...c,
      ratio: totalSpent > 0 ? c.value / totalSpent : 0,
    }));
  }, [categories, transactions, startStr, endStr]);

  // SVG Donut Calculations using 100% Real Data
  const donutSlices = useMemo(() => {
    const CIRCUMFERENCE = 390; // 2 * PI * 62 ~ 389.56
    const activeCats = categorySpending.filter((c) => c.value > 0);

    let cumulativeOffset = 0;
    const slices = [];

    for (const cat of activeCats) {
      const sliceLength = Math.max(6, Math.round(cat.ratio * CIRCUMFERENCE));
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

  // Real Daily Cash Flow Wave Chart (Plotted directly from transactions in Database)
  const cashFlowChartData = useMemo(() => {
    const start = new Date(cycleInfo.startDate);
    const end = new Date(cycleInfo.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay));

    const dailyRecords: {
      date: Date;
      dateStr: string;
      dayLabel: string;
      dayNum: number;
      expense: number;
      isToday: boolean;
      isFuture: boolean;
    }[] = [];

    let maxDailyExp = 0;

    for (let i = 0; i <= daysCount; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().split('T')[0];
      const isFuture = d.getTime() > today.getTime();

      // Real daily expense from Database transactions
      const dayExpense = transactions
        .filter((t) => t.type === 'expense' && t.transaction_date === dateStr)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      if (!isFuture && dayExpense > maxDailyExp) {
        maxDailyExp = dayExpense;
      }

      const dayLabel = `${d.getDate()} ${new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(d)}`;

      dailyRecords.push({
        date: d,
        dateStr,
        dayLabel,
        dayNum: d.getDate(),
        expense: isFuture ? 0 : dayExpense,
        isToday: d.getTime() === today.getTime(),
        isFuture,
      });
    }

    // Dynamic clean Y-Axis Scale
    const benchmarkSafe = safeToSpend.dailySafeToSpend > 0 ? safeToSpend.dailySafeToSpend : 50000;
    const ceilingVal = Math.max(maxDailyExp, benchmarkSafe * 1.5, 80000);
    const tierStep = Math.ceil(ceilingVal / 40000) * 10000;
    const yTiers = [tierStep * 4, tierStep * 3, tierStep * 2, tierStep, 0];
    const maxY = Math.max(yTiers[0], 1);

    // SVG coordinates: viewBox 0 0 900 180
    const startX = 60;
    const endX = 840;
    const topY = 20;
    const bottomY = 155;
    const usableHeight = bottomY - topY;
    const stepX = (endX - startX) / Math.max(1, dailyRecords.length - 1);

    const points = dailyRecords.map((rec, idx) => {
      const x = Math.round(startX + idx * stepX);
      const ratio = Math.min(1, rec.expense / maxY);
      const y = Math.round(bottomY - ratio * usableHeight);
      const isSpike = !rec.isFuture && safeToSpend.dailySafeToSpend > 0 && rec.expense > safeToSpend.dailySafeToSpend;
      return {
        ...rec,
        x,
        y,
        isSpike,
      };
    });

    // Smooth cubic bezier curve
    let pathD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cp1x = Math.round(prev.x + (curr.x - prev.x) * 0.45);
        const cp1y = prev.y;
        const cp2x = Math.round(prev.x + (curr.x - prev.x) * 0.55);
        const cp2y = curr.y;
        pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      }
    }

    const areaD = points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`
      : '';

    // Sample 7 date labels for bottom axis
    const labelIndices = [
      0,
      Math.floor(points.length * 0.16),
      Math.floor(points.length * 0.33),
      Math.floor(points.length * 0.5),
      Math.floor(points.length * 0.66),
      Math.floor(points.length * 0.83),
      points.length - 1,
    ];
    const xLabels = Array.from(new Set(labelIndices)).map(idx => points[idx]).filter(Boolean);

    return {
      points,
      pathD,
      areaD,
      yTiers,
      xLabels,
      maxDailyExp,
      hasExpenses: maxDailyExp > 0,
    };
  }, [cycleInfo, transactions, safeToSpend.dailySafeToSpend]);

  // Handle hover along SVG wave chart
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgWaveRef.current || cashFlowChartData.points.length === 0) return;
    const rect = svgWaveRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const svgX = (clientX / rect.width) * 900;

    // Find nearest point
    let nearestIdx = 0;
    let minDiff = Infinity;
    cashFlowChartData.points.forEach((p, idx) => {
      const diff = Math.abs(p.x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        nearestIdx = idx;
      }
    });
    setHoveredPointIndex(nearestIdx);
  };

  // Status badge logic
  const getPaceBadge = () => {
    switch (safeToSpend.paceStatus) {
      case 'safe':
        return {
          bg: 'bg-semantic-green-soft text-semantic-green border-semantic-green/20',
          dot: 'bg-semantic-green',
          text: 'Status: Safe',
        };
      case 'warning':
        return {
          bg: 'bg-semantic-amber-soft text-semantic-amber border-semantic-amber/20',
          dot: 'bg-semantic-amber',
          text: 'Status: Warning',
        };
      case 'overpace':
        return {
          bg: 'bg-semantic-rose-soft text-semantic-rose border-semantic-rose/20',
          dot: 'bg-semantic-rose',
          text: 'Status: Overpace',
        };
      case 'no-budget':
      default:
        return {
          bg: 'bg-semantic-blue-soft text-semantic-blue border-semantic-blue/20',
          dot: 'bg-semantic-blue',
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
  const activeHoveredPoint = hoveredPointIndex !== null ? cashFlowChartData.points[hoveredPointIndex] : null;
  const activeHoveredCategory = hoveredCategoryIndex !== null ? categorySpending[hoveredCategoryIndex] : null;

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
                  className={`ml-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}
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

      {/* 3. Financial Summary Cards (Grid of 4) WITH Arus Kas Harian SVG Wave Chart INSIDE (Stitch Exact: lines 64-65) */}
      <section className="bg-surface rounded-[14px] border border-border-default shadow-sm mb-6 overflow-hidden">
        {/* Top 4 KPI Metric Blocks (Colored Numbers & Badges exactly as Stitch) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-b border-border-default">
          {/* Total Saldo */}
          <div className="p-5 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-border-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Total Saldo</span>
              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-semantic-green-soft text-semantic-green border border-semantic-green/20">
                <ArrowUpRight className="w-3.5 h-3.5" /> 8.4%
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-text-primary tracking-tight tabular-nums">
                {formatCompactCurrency(totalBalance)}
              </div>
              <div className="text-xs text-text-muted mt-1 truncate">
                {formatCurrency(totalBalance)} kas riil
              </div>
            </div>
          </div>

          {/* Total Pemasukan */}
          <div className="p-5 flex flex-col justify-between border-b sm:border-b-0 lg:border-r border-border-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Total Pemasukan</span>
              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-semantic-green-soft text-semantic-green border border-semantic-green/20">
                <ArrowUpRight className="w-3.5 h-3.5" /> 18.4%
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-semantic-green tracking-tight tabular-nums">
                {formatCompactCurrency(totalIncomeInCycle)}
              </div>
              <div className="text-xs text-text-muted mt-1 truncate">
                {formatCurrency(totalIncomeInCycle)} masuk siklus
              </div>
            </div>
          </div>

          {/* Total Pengeluaran */}
          <div className="p-5 flex flex-col justify-between border-b sm:border-b-0 sm:border-r border-border-default">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Total Pengeluaran</span>
              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-semantic-rose-soft text-semantic-rose border border-semantic-rose/20">
                <ArrowDownRight className="w-3.5 h-3.5" /> {overallBudgetPercentage}%
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-semantic-rose tracking-tight tabular-nums">
                {formatCompactCurrency(totalCycleExpense)}
              </div>
              <div className="text-xs text-text-muted mt-1 truncate">
                dari plafon {formatCompactCurrency(effectiveBudgetCeiling)}
              </div>
            </div>
          </div>

          {/* Tabungan Siklus Ini */}
          <div className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-text-muted">Tabungan Siklus Ini</span>
              <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-semantic-green-soft text-semantic-green border border-semantic-green/20">
                <ArrowUpRight className="w-3.5 h-3.5" /> 15.0%
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-primary-600 tracking-tight tabular-nums">
                {formatCompactCurrency(totalSavingsGathered)}
              </div>
              <div className="text-xs text-text-muted mt-1 truncate">
                {savingsGoals.length} target tabungan aktif
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Part: Arus Kas Harian Interactive Wave Chart with Live Hover Tooltip */}
        <div className="p-6 relative select-none">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-text-primary tracking-tight">Arus Kas Harian</span>
              <span className="text-xs text-text-muted">
                {new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(cycleInfo.startDate)}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {activeHoveredPoint ? (
                <span className="font-semibold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-200 animate-in fade-in duration-100">
                  {activeHoveredPoint.dayLabel}: {formatCurrency(activeHoveredPoint.expense)}
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-text-secondary font-medium">
                  <span className="w-2.5 h-0.5 bg-primary-600 rounded-full" />
                  Pengeluaran Harian (Hover untuk detail)
                </span>
              )}
            </div>
          </div>

          {/* Dotted Grid & Glowing Wave Curve */}
          <div className="w-full overflow-x-auto">
            <svg
              ref={svgWaveRef}
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={() => setHoveredPointIndex(null)}
              className="w-full h-48 overflow-visible min-w-[650px] cursor-crosshair"
              preserveAspectRatio="none"
              viewBox="0 0 900 180"
            >
              <defs>
                <pattern id="chartDots" width="50" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="25" cy="15" r="1" fill="#cbd5e1" opacity="0.5" />
                </pattern>
                <linearGradient id="lineGlow" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Dotted background rect */}
              <rect x="0" y="10" width="900" height="140" fill="url(#chartDots)" />

              {/* Dynamic Y-Axis Value Labels matching real database values */}
              <text fill="#94a3b8" fontSize="11" x="10" y="20" fontFamily="Inter, sans-serif">
                {formatCompactCurrency(cashFlowChartData.yTiers[0]).replace('Rp ', '')}
              </text>
              <text fill="#94a3b8" fontSize="11" x="10" y="55" fontFamily="Inter, sans-serif">
                {formatCompactCurrency(cashFlowChartData.yTiers[1]).replace('Rp ', '')}
              </text>
              <text fill="#94a3b8" fontSize="11" x="10" y="90" fontFamily="Inter, sans-serif">
                {formatCompactCurrency(cashFlowChartData.yTiers[2]).replace('Rp ', '')}
              </text>
              <text fill="#94a3b8" fontSize="11" x="10" y="125" fontFamily="Inter, sans-serif">
                {formatCompactCurrency(cashFlowChartData.yTiers[3]).replace('Rp ', '')}
              </text>
              <text fill="#94a3b8" fontSize="11" x="10" y="155" fontFamily="Inter, sans-serif">
                0k
              </text>

              {/* Smooth Wave Area Glow Fill */}
              {cashFlowChartData.areaD && (
                <path d={cashFlowChartData.areaD} fill="url(#lineGlow)" />
              )}

              {/* Primary Curve Line (#6366f1, 2.5 stroke-width) */}
              {cashFlowChartData.pathD && (
                <path
                  d={cashFlowChartData.pathD}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Spike Markers (Circles on days with spikes exceeding safe limit) */}
              {cashFlowChartData.points.filter(p => p.isSpike).map((p, idx) => (
                <circle
                  key={idx}
                  cx={p.x}
                  cy={p.y}
                  r="4.5"
                  fill="#F43F5E"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
              ))}

              {/* Interactive Hover Point & Floating Tooltip */}
              {activeHoveredPoint && (
                <g>
                  {/* Vertical Guideline */}
                  <line
                    x1={activeHoveredPoint.x}
                    x2={activeHoveredPoint.x}
                    y1={15}
                    y2={155}
                    stroke="#6366f1"
                    strokeDasharray="3,3"
                    strokeWidth="1.5"
                  />
                  {/* Active Point Circle */}
                  <circle
                    cx={activeHoveredPoint.x}
                    cy={activeHoveredPoint.y}
                    r="6.5"
                    fill="#6366f1"
                    stroke="#ffffff"
                    strokeWidth="2.5"
                  />
                  {/* Tooltip Card */}
                  <g transform={`translate(${Math.max(75, Math.min(825, activeHoveredPoint.x))}, ${Math.max(40, activeHoveredPoint.y - 18)})`}>
                    <rect
                      x="-70"
                      y="-36"
                      width="140"
                      height="34"
                      rx="8"
                      fill="#0f172a"
                      opacity="0.95"
                    />
                    <text
                      x="0"
                      y="-21"
                      fill="#ffffff"
                      fontSize="10.5"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="Inter, sans-serif"
                    >
                      {formatCurrency(activeHoveredPoint.expense)}
                    </text>
                    <text
                      x="0"
                      y="-9"
                      fill="#94a3b8"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="Inter, sans-serif"
                    >
                      {activeHoveredPoint.dayLabel} • {activeHoveredPoint.isSpike ? 'Overpace' : 'Aman'}
                    </text>
                  </g>
                </g>
              )}

              {/* X-Axis Dates Along the Bottom */}
              <g fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="Inter, sans-serif">
                {cashFlowChartData.xLabels.map((p, idx) => (
                  <text key={idx} x={p.x} y="175">
                    {p.dayLabel}
                  </text>
                ))}
              </g>
            </svg>
          </div>
        </div>
      </section>

      {/* 4. 2-Column Content Grid: Left (Span 8) vs Right (Span 4) (Stitch Exact) */}
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

            {/* Comparative Category Diagrams (Horizontal Progress Gauge Cards from DB) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
              {categorySpending.slice(0, 4).map((cat) => {
                const budget = budgets.find((b) => b.category_id === cat.id);
                const budgetAmount = budget ? Number(budget.amount) : 0;
                const spent = cat.value;
                const percentage = budgetAmount > 0 ? Math.min(100, Math.round((spent / budgetAmount) * 100)) : 0;
                const isOver = budgetAmount > 0 && spent > budgetAmount;

                return (
                  <div
                    key={cat.id}
                    className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between border border-border-default hover:border-primary-500 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                        >
                          {getCategoryIcon(cat.icon)}
                        </div>
                        <span className="text-sm font-medium text-text-primary truncate">
                          {cat.name}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full tabular-nums ${
                          isOver ? 'bg-semantic-rose-soft text-semantic-rose' : ''
                        }`}
                        style={!isOver ? { backgroundColor: `${cat.color}15`, color: cat.color } : {}}
                      >
                        {budgetAmount > 0 ? `${percentage}%` : 'Belum diset'}
                      </span>
                    </div>

                    <div className="w-full bg-border-default h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOver ? 'bg-semantic-rose' : ''
                        }`}
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: isOver ? undefined : cat.color,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-muted">
                      <span className="tabular-nums">
                        {formatCompactCurrency(spent)} / {budgetAmount > 0 ? formatCompactCurrency(budgetAmount) : '0k'}
                      </span>
                      <span className={`font-medium tabular-nums ${isOver ? 'text-semantic-rose' : 'text-semantic-green'}`}>
                        {isOver
                          ? `Lewat ${formatCompactCurrency(spent - budgetAmount)}`
                          : budgetAmount > 0
                          ? `Sisa ${formatCompactCurrency(budgetAmount - spent)}`
                          : 'Plafon belum diset'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-border-default flex items-center justify-between">
              <span className="text-xs text-text-muted">
                {categorySpending.length} pos budget di database
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

          {/* Dompet Saya (Real Wallets from Database: BCA, GoPay, Tunai) */}
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
          {/* Transaksi Terbaru (Real Transactions from Database) */}
          <div className="bg-surface rounded-[14px] p-6 shadow-sm border border-border-default">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-text-primary tracking-tight">
                Transaksi Terbaru
              </h2>
              <span className="text-xs text-text-muted">Aktivitas terakhir</span>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-muted">
                Belum ada transaksi di database.
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

          {/* Kategori Pengeluaran Donut Chart (Interactive SVG Donut with Live Hover Effect) */}
          <div className="bg-surface rounded-[14px] p-6 shadow-sm border border-border-default select-none">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-text-primary">Kategori Pengeluaran</h3>
              <span className="text-xs text-text-muted font-medium bg-bg-secondary px-2.5 py-1 rounded-full">
                Siklus Aktif
              </span>
            </div>

            {/* Circular SVG Donut Chart with Hover Interaction */}
            <div className="flex flex-col items-center my-4">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 overflow-visible" viewBox="0 0 160 160">
                  {/* Background neutral ring */}
                  <circle
                    cx="80"
                    cy="80"
                    r="62"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="16"
                  />
                  {/* Real Database Category Slices */}
                  {donutSlices.map((slice, idx) => {
                    const isHovered = hoveredCategoryIndex === idx;
                    return (
                      <circle
                        key={slice.id}
                        cx="80"
                        cy="80"
                        r="62"
                        fill="none"
                        stroke={slice.color}
                        strokeWidth={isHovered ? 22 : 16}
                        strokeDasharray={slice.strokeDasharray}
                        strokeDashoffset={slice.strokeDashoffset}
                        strokeLinecap="round"
                        onMouseEnter={() => setHoveredCategoryIndex(idx)}
                        onMouseLeave={() => setHoveredCategoryIndex(null)}
                        className="transition-all duration-200 cursor-pointer"
                        style={{
                          filter: isHovered ? 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))' : undefined,
                        }}
                      />
                    );
                  })}
                </svg>

                {/* Donut Center Label (Dynamically updates on Hover) */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
                  <span className="text-[11px] text-text-muted leading-tight truncate max-w-[110px]">
                    {activeHoveredCategory ? activeHoveredCategory.name : 'Total Terpakai'}
                  </span>
                  <span className="text-[18px] sm:text-[20px] font-bold text-text-primary tracking-tight tabular-nums mt-0.5 truncate max-w-[130px]">
                    {activeHoveredCategory
                      ? formatCompactCurrency(activeHoveredCategory.value).replace('Rp ', '')
                      : totalCycleExpense > 0
                      ? formatCompactCurrency(totalCycleExpense).replace('Rp ', '')
                      : '0'}
                  </span>
                  <span className="text-[11px] text-semantic-green font-medium">
                    {activeHoveredCategory
                      ? `${(activeHoveredCategory.ratio * 100).toFixed(1)}%`
                      : `${overallBudgetPercentage}%`}
                  </span>
                </div>
              </div>
            </div>

            {/* Categories Legend List (Interactive on Hover) */}
            <div className="flex flex-col gap-1.5 pt-1">
              {categorySpending.slice(0, 5).map((item, idx) => {
                const isHovered = hoveredCategoryIndex === idx;
                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHoveredCategoryIndex(idx)}
                    onMouseLeave={() => setHoveredCategoryIndex(null)}
                    className={`flex items-center justify-between text-sm py-1.5 px-2 rounded-lg transition-colors cursor-pointer ${
                      isHovered ? 'bg-surface-container-low font-semibold' : 'hover:bg-surface-container-low/60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs sm:text-sm text-text-primary truncate">{item.name}</span>
                    </div>
                    <span className="text-xs text-text-secondary tabular-nums shrink-0 ml-2">
                      {formatCurrency(item.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
