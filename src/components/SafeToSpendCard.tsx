import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, ArrowUpRight, ArrowDownRight, CalendarClock, Info, Calculator } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatCompactCurrency } from '../lib/formatters';

interface SafeToSpendCardProps {
  onOpenSimulator?: () => void;
}

export const SafeToSpendCard: React.FC<SafeToSpendCardProps> = ({ onOpenSimulator }) => {
  const { safeToSpend, cycleInfo, totalBalance, totalIncomeInCycle, totalExpenseInCycle } = useFinance();

  const getPaceBadge = () => {
    switch (safeToSpend.paceStatus) {
      case 'safe':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          icon: ShieldCheck,
          text: 'Belanja Aman Hari Ini',
          desc: 'Pengeluaran hari ini masih di bawah batas harian.',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          icon: AlertTriangle,
          text: 'Mendekati Batas Harian',
          desc: 'Jatah belanja hari ini hampir habis. Jaga pengeluaran.',
        };
      case 'overpace':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          icon: AlertCircle,
          text: 'Overpace (Melebihi Jatah)',
          desc: 'Disarankan berhemat besok agar uang cukup sampai akhir siklus.',
        };
      case 'no-budget':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-700',
          icon: Info,
          text: 'Estimasi Berdasarkan Saldo',
          desc: 'Budget per kategori belum diset, menggunakan sisa saldo kas.',
        };
    }
  };

  const badge = getPaceBadge();
  const IconComponent = badge.icon;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-indigo-50/80 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header: Pace Badge & Cycle Remaining */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badge.bg}`}>
          <IconComponent className="w-3.5 h-3.5" />
          <span>{badge.text}</span>
        </div>

        <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
          <CalendarClock className="w-3.5 h-3.5 text-slate-400" />
          <span>Sisa <strong>{cycleInfo.daysRemaining} hari</strong> dalam siklus</span>
        </div>
      </div>

      {/* Main Safe to Spend Figure */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
            Safe to Spend Hari Ini
          </span>
          {onOpenSimulator && (
            <button
              onClick={onOpenSimulator}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-xl transition-colors"
              title="Hitung dampak rencana belanja terhadap jatah hari esok"
            >
              <Calculator className="w-3.5 h-3.5" />
              Simulasi Jajan
            </button>
          )}
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {formatCurrency(safeToSpend.dailySafeToSpend)}
          </div>
          <span className="text-xs text-slate-500 font-medium">/ hari</span>
        </div>
        <p className="text-xs text-slate-500 mt-1.5">{badge.desc}</p>
      </div>

      {/* Today's Usage Breakdown */}
      <div className="grid grid-cols-2 gap-3 mb-5 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100">
        <div>
          <div className="text-[11px] font-medium text-slate-500">Terpakai Hari Ini</div>
          <div className="text-sm sm:text-base font-bold text-slate-800 mt-0.5">
            {formatCurrency(safeToSpend.todayExpenses)}
          </div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-slate-500">Sisa Jatah Hari Ini</div>
          <div
            className={`text-sm sm:text-base font-bold mt-0.5 ${
              safeToSpend.remainingToday < 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {formatCurrency(safeToSpend.remainingToday)}
          </div>
        </div>
      </div>

      {/* Cycle Progress Bar */}
      <div>
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-1.5">
          <span>Perjalanan Siklus Kiriman</span>
          <span>{cycleInfo.daysPassed} / {cycleInfo.totalDays} hari ({cycleInfo.progressPercentage}%)</span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${cycleInfo.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Footer Mini Stats */}
      <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
        <div>
          <span className="text-[11px] text-slate-400 block">Total Saldo Kas</span>
          <span className="font-semibold text-slate-800">{formatCompactCurrency(totalBalance)}</span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block">Pemasukan Siklus</span>
          <span className="font-semibold text-emerald-600 flex items-center justify-center gap-0.5">
            <ArrowUpRight className="w-3 h-3" />
            {formatCompactCurrency(totalIncomeInCycle)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-slate-400 block">Pengeluaran Siklus</span>
          <span className="font-semibold text-rose-600 flex items-center justify-center gap-0.5">
            <ArrowDownRight className="w-3 h-3" />
            {formatCompactCurrency(totalExpenseInCycle)}
          </span>
        </div>
      </div>
    </div>
  );
};
