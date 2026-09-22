import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Calculator,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateIndo } from '../lib/formatters';

interface SafeToSpendCardProps {
  onOpenSimulator?: () => void;
}

export const SafeToSpendCard: React.FC<SafeToSpendCardProps> = ({ onOpenSimulator }) => {
  const { safeToSpend, cycleInfo, totalBalance, totalIncomeInCycle, totalExpenseInCycle } = useFinance();
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const mobileTooltipRef = useRef<HTMLDivElement | null>(null);
  const desktopTooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      const clickedMobile = mobileTooltipRef.current?.contains(target);
      const clickedDesktop = desktopTooltipRef.current?.contains(target);
      if (!clickedMobile && !clickedDesktop) {
        setIsTooltipOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTooltipOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const getPaceBadge = () => {
    switch (safeToSpend.paceStatus) {
      case 'safe':
        return {
          bg: 'bg-semantic-green-soft text-semantic-green-text border-semantic-green/20',
          dot: 'bg-semantic-green',
          icon: ShieldCheck,
          text: 'Status: Aman',
          shortText: 'Aman',
          desc: 'Pengeluaran harianmu masih di bawah batas aman.',
        };
      case 'warning':
        return {
          bg: 'bg-semantic-amber-soft text-semantic-amber-text border-semantic-amber/20',
          dot: 'bg-semantic-amber',
          icon: AlertTriangle,
          text: 'Status: Waspada',
          shortText: 'Waspada',
          desc: 'Jatah belanja hari ini hampir habis (mencapai 80%).',
        };
      case 'overpace':
        return {
          bg: 'bg-semantic-rose-soft text-semantic-rose-text border-semantic-rose/20',
          dot: 'bg-semantic-rose',
          icon: AlertCircle,
          text: 'Status: Overpace',
          shortText: 'Overpace',
          desc: 'Pengeluaran hari ini melebihi jatah harian. Disarankan berhemat esok hari.',
        };
      case 'no-budget':
      default:
        return {
          bg: 'bg-semantic-blue-soft text-semantic-blue-text border-semantic-blue/20',
          dot: 'bg-semantic-blue',
          icon: HelpCircle,
          text: 'Status: Estimasi',
          shortText: 'Estimasi',
          desc: 'Berdasarkan sisa saldo riil di seluruh rekening dompetmu.',
        };
    }
  };

  const badge = getPaceBadge();
  const netSavings = totalIncomeInCycle - totalExpenseInCycle;

  return (
    <div className="space-y-4">
      {/* 1. Hero Safe to Spend Anchor */}
      <div className="bg-surface rounded-2xl p-6 sm:p-7 border border-border-default shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Prominent Daily Figure */}
          <div className="flex flex-col flex-1">
            {/* Mobile Top Row (< md): perfectly centered single row [Title + ?] [Aman] [Calculator] */}
            <div className="flex md:hidden items-center justify-between gap-3">
              {/* Left: Title + Help icon */}
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="text-xs font-semibold text-text-secondary leading-normal">
                  Aman dibelanjakan hari ini
                </span>

                <div ref={mobileTooltipRef} className="relative flex items-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsTooltipOpen((prev) => !prev)}
                    onMouseEnter={() => setIsTooltipOpen(true)}
                    onMouseLeave={() => setIsTooltipOpen(false)}
                    onFocus={() => setIsTooltipOpen(true)}
                    onBlur={() => setIsTooltipOpen(false)}
                    className="p-1 text-text-muted hover:text-text-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-md transition-colors"
                    aria-label="Penjelasan batas pengeluaran harian"
                    aria-expanded={isTooltipOpen}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                  {isTooltipOpen && (
                    <div
                      role="tooltip"
                      className="absolute bottom-full left-0 mb-2 flex flex-col w-56 bg-surface-modal border border-border-default text-text-primary p-2.5 rounded-lg text-xs z-30 shadow-lg leading-relaxed animate-in fade-in zoom-in-95 duration-150"
                    >
                      Batas pengeluaran harian aman agar uang sakumu tetap bertahan hingga akhir siklus kiriman.
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Compact Status Badge + Icon-only Simulation Button */}
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap leading-none ${badge.bg}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dot}`} />
                  <span>{badge.shortText}</span>
                </span>

                {onOpenSimulator && (
                  <button
                    onClick={onOpenSimulator}
                    className="flex items-center justify-center w-11 h-11 min-w-[44px] min-h-[44px] rounded-lg bg-primary-soft hover:bg-primary-soft/80 text-text-gold border border-border-gold transition-colors shrink-0"
                    title="Simulasi Jajan"
                    aria-label="Simulasi Jajan"
                  >
                    <Calculator className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Header (>= md): restored exactly from original layout */}
            <div className="hidden md:flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-text-secondary">
                Aman dibelanjakan hari ini
              </span>

              <div ref={desktopTooltipRef} className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setIsTooltipOpen((prev) => !prev)}
                  onMouseEnter={() => setIsTooltipOpen(true)}
                  onMouseLeave={() => setIsTooltipOpen(false)}
                  onFocus={() => setIsTooltipOpen(true)}
                  onBlur={() => setIsTooltipOpen(false)}
                  className="p-1 text-text-muted hover:text-text-primary focus:outline-hidden focus-visible:ring-2 focus-visible:ring-primary rounded-md transition-colors"
                  aria-label="Penjelasan batas pengeluaran harian"
                  aria-expanded={isTooltipOpen}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
                {isTooltipOpen && (
                  <div
                    role="tooltip"
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex flex-col w-64 bg-surface-modal border border-border-default text-text-primary p-2.5 rounded-lg text-xs z-30 shadow-lg leading-relaxed animate-in fade-in zoom-in-95 duration-150"
                  >
                    Batas pengeluaran harian aman agar uang sakumu tetap bertahan hingga akhir siklus kiriman.
                  </div>
                )}
              </div>

              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                {badge.text}
              </span>

              {onOpenSimulator && (
                <button
                  onClick={onOpenSimulator}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] sm:min-h-0 sm:py-1 rounded-lg text-xs font-semibold bg-primary-soft hover:bg-primary-100 text-text-gold border border-border-gold transition-colors ml-auto md:ml-2"
                  title="Simulasi belanja ekstra"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Simulasi Jajan</span>
                </button>
              )}
            </div>

            {/* Dominant Figure in Champagne Gold */}
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-4xl sm:text-5xl lg:text-[52px] font-extrabold text-text-gold tabular-nums tracking-tight leading-none">
                {formatCurrency(safeToSpend.dailySafeToSpend)}
              </span>
              <span className="text-base sm:text-lg text-text-muted font-normal">/ hari</span>
            </div>

            {/* Context Subtext */}
            <div className="flex items-center gap-2 mt-3 text-xs text-text-secondary">
              <CheckCircle2 className="w-4 h-4 text-semantic-green shrink-0" />
              <p>
                <strong className="text-text-primary font-semibold">
                  {cycleInfo.daysRemaining} hari tersisa
                </strong>{' '}
                dalam siklus ini • Sisa anggaran bebas:{' '}
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatCurrency(safeToSpend.remainingBudget)}
                </span>
              </p>
            </div>
          </div>

          {/* Right: Integrated Pacing Indicator */}
          <div className="w-full md:w-72 flex flex-col justify-end gap-2">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="font-medium">Laju Pacing Periode</span>
              <span
                className={`font-semibold tabular-nums ${
                  safeToSpend.paceStatus === 'overpace'
                    ? 'text-semantic-rose-text'
                    : safeToSpend.paceStatus === 'warning'
                    ? 'text-semantic-amber-text'
                    : 'text-semantic-green-text'
                }`}
              >
                {cycleInfo.progressPercentage}% Berlalu
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-surface-elevated h-2 rounded-full overflow-hidden border border-border-subtle">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  safeToSpend.paceStatus === 'overpace'
                    ? 'bg-semantic-rose'
                    : safeToSpend.paceStatus === 'warning'
                    ? 'bg-semantic-amber'
                    : 'bg-primary'
                }`}
                style={{ width: `${Math.min(cycleInfo.progressPercentage, 100)}%` }}
              />
            </div>

            {/* Sub-label dates */}
            <div className="flex flex-wrap justify-between items-center gap-x-2 gap-y-1 text-xs text-text-muted">
              <span className="shrink-0">Mulai {formatDateIndo(cycleInfo.startDate)}</span>
              <span className="text-text-secondary font-medium shrink-0">
                Hari {cycleInfo.daysPassed}/{cycleInfo.totalDays}
              </span>
              <span className="shrink-0">Akhir {formatDateIndo(cycleInfo.endDate)}</span>
            </div>
          </div>
        </div>

        {/* Today's Usage Single Typographic Line */}
        <div className="mt-5 pt-4 border-t border-border-default flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-text-secondary">
            <span className="text-text-muted">Aktivitas Hari Ini:</span>
            <span>Terpakai <strong className="font-semibold text-text-primary tabular-nums">{formatCurrency(safeToSpend.todayExpenses)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-muted">Sisa Kuota Hari Ini:</span>
            <span
              className={`font-bold tabular-nums text-sm ${
                safeToSpend.remainingToday < 0 ? 'text-semantic-rose-text' : 'text-semantic-green-text'
              }`}
            >
              {formatCurrency(safeToSpend.remainingToday)}
            </span>
            <span className="text-text-muted">
              {safeToSpend.remainingToday < 0 ? '(Melebihi jatah)' : '(Tersedia)'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Financial Summary Ribbon */}
      <div className="bg-surface rounded-xl border border-border-default overflow-hidden">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border-default">
          {/* Metric 1: Total Saldo Kas */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-xs text-text-muted font-medium">Total Saldo Kas</span>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-bold text-text-primary tracking-tight tabular-nums">
                {formatCurrency(totalBalance)}
              </div>
              <p className="text-xs text-text-muted mt-0.5">Semua rekening aktif</p>
            </div>
          </div>

          {/* Metric 2: Pemasukan Siklus */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-xs text-text-muted font-medium">Pemasukan Siklus</span>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-bold text-text-primary tracking-tight tabular-nums">
                {formatCurrency(totalIncomeInCycle)}
              </div>
              <p className="text-xs text-text-muted mt-0.5">Uang saku & pendapatan</p>
            </div>
          </div>

          {/* Metric 3: Total Pengeluaran */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-xs text-text-muted font-medium">Total Pengeluaran</span>
            <div className="mt-2">
              <div className="text-lg sm:text-xl font-bold text-text-primary tracking-tight tabular-nums">
                {formatCurrency(totalExpenseInCycle)}
              </div>
              <p className="text-xs text-text-muted mt-0.5">Realisasi belanja</p>
            </div>
          </div>

          {/* Metric 4: Surplus / Sisa Anggaran */}
          <div className="p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-xs text-text-muted font-medium">Surplus / Tabungan</span>
            <div className="mt-2">
              <div
                className={`text-lg sm:text-xl font-bold tracking-tight tabular-nums ${
                  netSavings >= 0 ? 'text-text-gold' : 'text-semantic-rose-text'
                }`}
              >
                {formatCurrency(netSavings)}
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                {netSavings >= 0 ? 'Surplus belum terpakai' : 'Defisit pengeluaran'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafeToSpendCard;
