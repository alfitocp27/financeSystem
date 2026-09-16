import React, { useState } from 'react';
import { X, Calculator, ArrowRight, TrendingDown, Check, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/formatters';

interface SpendingSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToRecord?: (amount: number) => void;
}

export const SpendingSimulatorModal: React.FC<SpendingSimulatorModalProps> = ({
  isOpen,
  onClose,
  onProceedToRecord,
}) => {
  const { safeToSpend, cycleInfo } = useFinance();
  const [plannedAmountStr, setPlannedAmountStr] = useState<string>('50000');

  if (!isOpen) return null;

  const plannedAmount = parseInt(plannedAmountStr, 10) || 0;

  // Calculation:
  // If we spend plannedAmount today, our remaining budget for the future days reduces by plannedAmount
  const futureDays = Math.max(1, cycleInfo.daysRemaining - 1);
  const currentSafe = safeToSpend.dailySafeToSpend;

  // New daily safe to spend starting tomorrow
  const remainingBudgetAfter = Math.max(0, safeToSpend.remainingBudget - safeToSpend.todayExpenses - plannedAmount);
  const newDailySafe = futureDays > 0 ? Math.floor(remainingBudgetAfter / futureDays) : 0;
  const differencePerDay = currentSafe - newDailySafe;

  const handleQuickChip = (val: number) => {
    setPlannedAmountStr(val.toString());
  };

  const handleRecord = () => {
    if (onProceedToRecord && plannedAmount > 0) {
      onProceedToRecord(plannedAmount);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-surface-modal border border-border-default w-full max-w-md rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary-soft text-text-gold rounded-xl">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary">Simulator Dampak Belanja</h2>
              <p className="text-xs text-text-secondary">Ketahui pengaruh rencana belanja terhadap jatah hari esok</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-surface-elevated transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input planned amount */}
        <div className="space-y-3 mb-5">
          <label className="text-xs font-semibold text-text-secondary block">
            Berapa rencana belanja ekstra kamu?
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-text-muted">
              Rp
            </span>
            <input
              type="number"
              value={plannedAmountStr}
              onChange={(e) => setPlannedAmountStr(e.target.value)}
              placeholder="50000"
              autoFocus
              className="w-full pl-12 pr-4 py-2.5 bg-surface-elevated border border-border-default rounded-2xl text-xl font-bold text-text-primary focus:outline-none focus:border-border-gold-focus"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[25000, 50000, 100000, 200000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickChip(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 min-h-[36px] ${
                  plannedAmount === val
                    ? 'bg-primary text-slate-950 font-bold shadow-xs'
                    : 'bg-surface-elevated text-text-secondary hover:text-text-primary border border-border-subtle'
                }`}
              >
                Rp {val >= 1000 ? `${val / 1000}rb` : val}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Result Cards */}
        <div className="p-4 bg-surface-elevated rounded-2xl border border-border-default space-y-3 mb-5">
          <div className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Perbandingan Safe to Spend Harian Mulai Besok:
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Current Safe */}
            <div className="flex-1 p-3 bg-surface rounded-xl border border-border-subtle">
              <div className="text-xs text-text-muted font-medium">Sebelum Belanja</div>
              <div className="text-base font-extrabold text-text-primary mt-0.5">
                {formatCurrency(currentSafe)}
              </div>
              <div className="text-xs text-text-muted">/ hari</div>
            </div>

            <ArrowRight className="w-4 h-4 text-text-muted shrink-0" />

            {/* New Safe */}
            <div className="flex-1 p-3 bg-surface rounded-xl border border-border-subtle">
              <div className="text-xs text-text-muted font-medium">Sesudah Belanja</div>
              <div
                className={`text-base font-extrabold mt-0.5 ${
                  newDailySafe < currentSafe * 0.7 ? 'text-semantic-rose-text' : 'text-text-gold'
                }`}
              >
                {formatCurrency(newDailySafe)}
              </div>
              <div className="text-xs text-text-muted">/ hari</div>
            </div>
          </div>

          {/* Daily difference impact */}
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-xs">
            <span className="text-text-secondary flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-semantic-amber" />
              Penurunan Jatah Harian:
            </span>
            <span className="font-bold text-semantic-rose-text">
              -{formatCurrency(Math.max(0, differencePerDay))} / hari
            </span>
          </div>
        </div>

        {/* Insight & Recommendation */}
        <div className="text-xs text-text-primary mb-5 p-3 rounded-xl bg-surface border border-border-default leading-relaxed">
          {newDailySafe >= currentSafe * 0.8 ? (
            <span className="flex items-start gap-1.5 text-text-primary">
              <Check className="w-4 h-4 text-semantic-green-text shrink-0 mt-0.5" />
              <span>Belanja ini aman dan tidak mengganggu kebutuhan harianmu hingga akhir siklus.</span>
            </span>
          ) : (
            <span className="flex items-start gap-1.5 text-semantic-amber-text">
              <span>⚠️ Belanja ini akan memotong jatah harianmu cukup signifikan. Pastikan pengeluaran ini penting!</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-surface-elevated hover:bg-surface-elevated/80 text-text-primary border border-border-default font-bold rounded-xl text-xs transition-colors min-h-[44px]"
          >
            Tutup
          </button>
          {onProceedToRecord && (
            <button
              type="button"
              onClick={handleRecord}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-slate-950 font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              Lanjut Catat Transaksi
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
