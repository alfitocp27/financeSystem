import React, { useMemo } from 'react';
import { TrendingUp, CheckCircle, BadgeCheck, PiggyBank } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatCompactCurrency } from '../lib/formatters';

export const DailyCashFlowChart: React.FC = () => {
  const { transactions, safeToSpend, cycleInfo } = useFinance();

  const chartData = useMemo(() => {
    const start = new Date(cycleInfo.startDate);
    const end = new Date(cycleInfo.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay));

    const days: {
      date: Date;
      dateStr: string;
      label: string;
      dayNum: number;
      expense: number;
      isToday: boolean;
      isFuture: boolean;
      isSpike: boolean;
    }[] = [];

    let totalExpense = 0;
    let daysWithRecords = 0;
    let maxExpense = 0;
    let maxExpenseDay = '';
    let minExpense = Infinity;
    let minExpenseDay = '';
    let daysUnderLimit = 0;

    for (let i = 0; i <= totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      const dateStr = d.toISOString().split('T')[0];

      const isFuture = d.getTime() > today.getTime();
      const isToday = d.getTime() === today.getTime();

      const dayExpense = transactions
        .filter((t) => t.type === 'expense' && t.transaction_date === dateStr)
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const isSpike = !isFuture && safeToSpend.dailySafeToSpend > 0 && dayExpense > safeToSpend.dailySafeToSpend;

      if (!isFuture) {
        totalExpense += dayExpense;
        daysWithRecords++;
        if (dayExpense > maxExpense) {
          maxExpense = dayExpense;
          maxExpenseDay = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d);
        }
        if (dayExpense > 0 && dayExpense < minExpense) {
          minExpense = dayExpense;
          minExpenseDay = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', weekday: 'short' }).format(d);
        }
        if (dayExpense <= safeToSpend.dailySafeToSpend) {
          daysUnderLimit++;
        }
      }

      const dayLabel = `${d.getDate()} ${new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(d)}`;

      days.push({
        date: d,
        dateStr,
        label: dayLabel,
        dayNum: d.getDate(),
        expense: dayExpense,
        isToday,
        isFuture,
        isSpike,
      });
    }

    const avgDailyExpense = daysWithRecords > 0 ? Math.round(totalExpense / daysWithRecords) : 0;
    const safeLimit = safeToSpend.dailySafeToSpend;

    // SVG coordinates computation for 700x160 viewBox
    const width = 700;
    const height = 160;
    const paddingBottom = 20;
    const paddingTop = 25;
    const usableHeight = height - paddingTop - paddingBottom;

    const highestVal = Math.max(maxExpense, safeLimit * 1.5, 100000);

    // Y position for safe limit line
    const safeY = height - paddingBottom - (safeLimit / highestVal) * usableHeight;

    // Build path points
    const points: { x: number; y: number; isSpike: boolean; label: string; expense: number }[] = [];
    const stepX = width / Math.max(1, days.length - 1);

    days.forEach((day, index) => {
      const x = Math.round(index * stepX);
      const val = day.isFuture ? 0 : day.expense;
      const y = Math.round(height - paddingBottom - (val / highestVal) * usableHeight);
      points.push({
        x,
        y,
        isSpike: day.isSpike,
        label: day.label,
        expense: day.expense,
      });
    });

    const pathD = points.length > 0
      ? `M ${points[0].x},${points[0].y} ` + points.slice(1).map(p => `L ${p.x},${p.y}`).join(' ')
      : `M 0,${height - paddingBottom} L ${width},${height - paddingBottom}`;

    const polygonPoints = points.length > 0
      ? `${points[0].x},${height - paddingBottom} ` +
        points.map(p => `${p.x},${p.y}`).join(' ') +
        ` ${points[points.length - 1].x},${height - paddingBottom}`
      : `0,${height} ${width},${height}`;

    const spikePoints = points.filter(p => p.isSpike);

    return {
      days,
      avgDailyExpense,
      maxExpense,
      maxExpenseDay: maxExpenseDay || 'Hari ini',
      minExpense: minExpense === Infinity ? 0 : minExpense,
      minExpenseDay: minExpenseDay || 'Belum ada',
      daysUnderLimit,
      daysWithRecords,
      safeLimit,
      safeY: Math.max(20, Math.min(140, safeY)),
      pathD,
      polygonPoints,
      spikePoints,
    };
  }, [transactions, safeToSpend, cycleInfo]);

  return (
    <section className="bg-surface p-5 sm:p-6 rounded-[14px] border border-border-default shadow-sm flex flex-col gap-5">
      {/* Header & Legends (Stitch Exact) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border-default">
        <div className="flex flex-col">
          <h2 className="text-base font-bold text-text-primary tracking-tight flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-600" />
            <span>Tren Pengeluaran Harian &amp; Safe to Spend</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Fluktuasi konsumsi harian vs batas pacing aman {formatCurrency(chartData.safeLimit)} / hari
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-text-secondary self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-semantic-rose rounded-full" />
            <span>Pengeluaran Harian</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 border-t border-dashed border-semantic-green" />
            <span>Safe to Spend ({formatCompactCurrency(chartData.safeLimit)})</span>
          </div>
        </div>
      </div>

      {/* SVG Interactive Trendline Area Chart (Stitch Exact) */}
      <div className="relative w-full flex flex-col justify-end pt-2">
        <svg
          className="w-full h-40 sm:h-44 overflow-visible"
          preserveAspectRatio="none"
          viewBox="0 0 700 160"
        >
          <defs>
            <linearGradient id="roseGradientStitch" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Safe to Spend Benchmark Dashed Line */}
          <line
            x1="0"
            x2="700"
            y1={chartData.safeY}
            y2={chartData.safeY}
            stroke="#10B981"
            strokeDasharray="4,4"
            strokeWidth="1.5"
          />

          <text
            x="690"
            y={Math.max(16, chartData.safeY - 6)}
            fill="#10B981"
            fontFamily="Inter, sans-serif"
            fontSize="10"
            fontWeight="600"
            textAnchor="end"
          >
            Batas Aman {formatCompactCurrency(chartData.safeLimit)}/hari
          </text>

          {/* Filled Area Gradient */}
          <polygon
            fill="url(#roseGradientStitch)"
            points={chartData.polygonPoints}
          />

          {/* Trendline Path */}
          <path
            d={chartData.pathD}
            fill="none"
            stroke="#F43F5E"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2.2"
          />

          {/* Spike Markers */}
          {chartData.spikePoints.map((sp, idx) => (
            <g key={idx}>
              <circle
                cx={sp.x}
                cy={sp.y}
                r="4"
                fill="#F43F5E"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          ))}
        </svg>

        {/* X-Axis Date Intervals (Stitch Exact) */}
        <div className="flex justify-between text-xs text-text-muted pt-2.5 border-t border-border-default">
          <span>{chartData.days[0]?.label || 'Mulai'}</span>
          <span className="hidden sm:inline">
            {chartData.days[Math.floor(chartData.days.length * 0.25)]?.label}
          </span>
          <span>
            {chartData.days[Math.floor(chartData.days.length * 0.5)]?.label}
          </span>
          <span className="hidden sm:inline">
            {chartData.days[Math.floor(chartData.days.length * 0.75)]?.label}
          </span>
          <span>{chartData.days[chartData.days.length - 1]?.label || 'Akhir'}</span>
        </div>
      </div>

      {/* 3 Mini Stats Cards (Stitch Exact) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Rata-rata Harian */}
        <div className="bg-bg-primary border border-border-subtle rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Rata-rata Harian</span>
            <BadgeCheck className="w-4 h-4 text-semantic-green" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-base font-bold text-text-primary tabular-nums">
              {formatCurrency(chartData.avgDailyExpense)}
            </span>
            <span className="text-xs text-semantic-green font-medium">/ hari</span>
          </div>
          <span className="text-[11px] text-semantic-green mt-0.5">
            {chartData.avgDailyExpense <= chartData.safeLimit
              ? `Terkendali (< limit ${formatCompactCurrency(chartData.safeLimit)})`
              : `Overpace (> limit ${formatCompactCurrency(chartData.safeLimit)})`}
          </span>
        </div>

        {/* Pengeluaran Tertinggi (Spike) */}
        <div className="bg-bg-primary border border-border-subtle rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Pengeluaran Tertinggi</span>
            <TrendingUp className="w-4 h-4 text-semantic-rose" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-base font-bold text-semantic-rose tabular-nums">
              {formatCurrency(chartData.maxExpense)}
            </span>
            <span className="text-xs text-text-muted font-medium">({chartData.maxExpenseDay})</span>
          </div>
          <span className="text-[11px] text-text-secondary truncate mt-0.5">
            Puncak belanja tertinggi dalam siklus
          </span>
        </div>

        {/* Hari Paling Hemat */}
        <div className="bg-bg-primary border border-border-subtle rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Hari Paling Hemat</span>
            <PiggyBank className="w-4 h-4 text-semantic-green" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-base font-bold text-semantic-green tabular-nums">
              {formatCurrency(chartData.minExpense)}
            </span>
            <span className="text-xs text-text-muted font-medium">({chartData.minExpenseDay})</span>
          </div>
          <span className="text-[11px] text-text-secondary mt-0.5">
            Pengeluaran terendah saat berhemat
          </span>
        </div>
      </div>

      {/* Smart Analysis Banner (Stitch Exact) */}
      <div className="flex items-center gap-2.5 bg-semantic-green-soft text-semantic-green p-3 rounded-xl text-xs border border-semantic-green/20">
        <CheckCircle className="w-4 h-4 shrink-0 text-semantic-green" />
        <span className="text-text-primary leading-relaxed">
          Secara keseluruhan,{' '}
          <strong>
            {chartData.daysUnderLimit} dari {Math.max(1, chartData.daysWithRecords)} hari (
            {Math.round((chartData.daysUnderLimit / Math.max(1, chartData.daysWithRecords)) * 100)}%)
          </strong>{' '}
          belanja Anda konsisten di bawah batas aman harian. Pertahankan disiplin anggarannya!
        </span>
      </div>
    </section>
  );
};
