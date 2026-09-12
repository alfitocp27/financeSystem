import React, { useState } from 'react';
import { X, Calendar, Database, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { profile, updateCycleStartDay, isConfigured, isDemoUser, setDemoMode } = useAuth();
  const { refreshData } = useFinance();

  const [cycleDay, setCycleDay] = useState<number>(profile?.cycle_start_day || 25);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaved(false);

    const { error } = await updateCycleStartDay(cycleDay);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 1000);
    }
  };

  const handleResetDemo = () => {
    localStorage.removeItem('demo_wallets');
    localStorage.removeItem('demo_categories');
    localStorage.removeItem('demo_transactions');
    localStorage.removeItem('demo_budgets');
    localStorage.removeItem('demo_goals');
    localStorage.removeItem('demo_cycle_start_day');
    setDemoMode();
    refreshData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <h2 className="text-base font-bold text-slate-800">Pengaturan Aplikasi</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cycle Date Settings */}
        <form onSubmit={handleSaveCycle} className="space-y-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <label className="text-xs font-bold text-slate-700">
                Tanggal Mulai Siklus Bulanan
              </label>
            </div>
            <p className="text-[11px] text-slate-500 mb-2.5">
              Biasanya disesuaikan dengan tanggal penerimaan uang saku/bulanan dari orang tua.
            </p>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="31"
                value={cycleDay}
                onChange={(e) => setCycleDay(parseInt(e.target.value, 10) || 1)}
                className="w-24 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-500">tiap bulan (1 - 31)</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" /> Tersimpan!
              </>
            ) : (
              'Simpan Tanggal Siklus'
            )}
          </button>
        </form>

        {/* Database & Supabase Info */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              Status Supabase
            </span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                isConfigured
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isConfigured ? 'Terkoneksi' : 'Demo Mode (Lokal)'}
            </span>
          </div>

          {isDemoUser && (
            <button
              onClick={handleResetDemo}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              Reset Data Contoh (Demo)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
