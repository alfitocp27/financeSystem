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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Simulator Dampak Belanja</h2>
              <p className="text-[11px] text-slate-500">Ketahui pengaruh rencana belanja terhadap jatah hari esok</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input planned amount */}
        <div className="space-y-3 mb-5">
          <label className="text-xs font-semibold text-slate-600 block">
            Berapa rencana belanja ekstra kamu?
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
              Rp
            </span>
            <input
              type="number"
              value={plannedAmountStr}
              onChange={(e) => setPlannedAmountStr(e.target.value)}
              placeholder="50000"
              autoFocus
              className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[25000, 50000, 100000, 200000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickChip(val)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  plannedAmount === val
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Rp {val >= 1000 ? `${val / 1000}rb` : val}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Result Cards */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 mb-5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Perbandingan Safe to Spend Harian Mulai Besok:
          </div>

          <div className="flex items-center justify-between gap-3">
            {/* Current Safe */}
            <div className="flex-1 p-3 bg-white rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-500 font-medium">Sebelum Belanja</div>
              <div className="text-base font-extrabold text-slate-800 mt-0.5">
                {formatCurrency(currentSafe)}
              </div>
              <div className="text-[10px] text-slate-400">/ hari</div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />

            {/* New Safe */}
            <div className="flex-1 p-3 bg-white rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-500 font-medium">Sesudah Belanja</div>
              <div
                className={`text-base font-extrabold mt-0.5 ${
                  newDailySafe < currentSafe * 0.7 ? 'text-rose-600' : 'text-indigo-600'
                }`}
              >
                {formatCurrency(newDailySafe)}
              </div>
              <div className="text-[10px] text-slate-400">/ hari</div>
            </div>
          </div>

          {/* Daily difference impact */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
            <span className="text-slate-600 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
              Penurunan Jatah Harian:
            </span>
            <span className="font-bold text-rose-600">
              -{formatCurrency(Math.max(0, differencePerDay))} / hari
            </span>
          </div>
        </div>

        {/* Insight & Recommendation */}
        <div className="text-xs text-slate-600 mb-5 p-3 rounded-xl bg-indigo-50/70 border border-indigo-100/60 leading-relaxed">
          {newDailySafe >= currentSafe * 0.8 ? (
            <span className="flex items-start gap-1.5 text-indigo-900">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Belanja ini aman dan tidak mengganggu kebutuhan harianmu hingga akhir siklus.</span>
            </span>
          ) : (
            <span className="flex items-start gap-1.5 text-amber-900">
              <span>⚠️ Belanja ini akan memotong jatah harianmu cukup signifikan. Pastikan pengeluaran ini penting!</span>
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
          >
            Tutup
          </button>
          {onProceedToRecord && (
            <button
              type="button"
              onClick={handleRecord}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-200 transition-colors flex items-center justify-center gap-1.5"
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
