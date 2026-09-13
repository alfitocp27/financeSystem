import React, { useState } from 'react';
import { X, Calendar, Database, Check, RefreshCw, Layers, Home, Building2, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const { user, profile, updateCycleStartDay, isConfigured, isDemoUser, setDemoMode } = useAuth();
  const { refreshData, applyPresetTemplate } = useFinance();

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
      if (onShowToast) onShowToast('Tanggal siklus berhasil diperbarui');
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 700);
    }
  };

  const handleApplyPreset = async (preset: 'kost' | 'home') => {
    await applyPresetTemplate(preset);
    if (onShowToast) {
      onShowToast(
        preset === 'kost'
          ? 'Template Anak Kost diterapkan!'
          : 'Template Tinggal di Rumah diterapkan!'
      );
    }
    onClose();
  };

  const handleResetDemo = () => {
    localStorage.removeItem('demo_wallets');
    localStorage.removeItem('demo_categories');
    localStorage.removeItem('demo_transactions');
    localStorage.removeItem('demo_budgets');
    localStorage.removeItem('demo_goals');
    localStorage.removeItem('demo_commitments');
    localStorage.removeItem('demo_cycle_start_day');
    setDemoMode();
    refreshData();
    if (onShowToast) onShowToast('Data demo berhasil direset');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-surface w-full max-w-md rounded-2xl sm:rounded-[16px] p-6 shadow-2xl border border-border-default max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-default mb-4">
          <div>
            <h2 className="text-base font-bold text-text-primary tracking-tight">Pengaturan Sistem</h2>
            <p className="text-[11px] text-text-muted">Konfigurasi siklus anggaran dan preferensi akun</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-primary rounded-full hover:bg-bg-secondary"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Template Switcher */}
        <div className="mb-5 pb-5 border-b border-border-default">
          <div className="flex items-center gap-1.5 mb-1">
            <Layers className="w-4 h-4 text-primary-600" />
            <label className="text-xs font-bold text-text-primary">
              Template Gaya Hidup Mahasiswa
            </label>
          </div>
          <p className="text-[11px] text-text-muted mb-3">
            Otomatis sesuaikan pos kategori & tagihan sesuai kondisi tempat tinggalmu:
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleApplyPreset('kost')}
              className="p-3 bg-surface-container-low hover:bg-primary-50 border border-border-default hover:border-primary-500 rounded-xl text-left transition-all active:scale-95 group"
            >
              <Building2 className="w-5 h-5 text-primary-600 mb-1.5" />
              <div className="text-xs font-bold text-text-primary group-hover:text-primary-600">Anak Kost</div>
              <div className="text-[10px] text-text-muted mt-0.5">Kost, Wifi, Laundry, Warteg</div>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('home')}
              className="p-3 bg-surface-container-low hover:bg-semantic-green-soft border border-border-default hover:border-semantic-green rounded-xl text-left transition-all active:scale-95 group"
            >
              <Home className="w-5 h-5 text-semantic-green mb-1.5" />
              <div className="text-xs font-bold text-text-primary group-hover:text-semantic-green">Tinggal di Rumah</div>
              <div className="text-[10px] text-text-muted mt-0.5">Bensin, Uang Saku, Hobi</div>
            </button>
          </div>
        </div>

        {/* Cycle Date Settings */}
        <form onSubmit={handleSaveCycle} className="space-y-4 mb-5 pb-5 border-b border-border-default">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-4 h-4 text-primary-600" />
              <label className="text-xs font-bold text-text-primary">
                Tanggal Mulai Siklus Bulanan
              </label>
            </div>
            <p className="text-[11px] text-text-muted mb-2.5">
              Dihitung dari tanggal ini hingga 1 hari sebelum tanggal ini bulan berikutnya (sesuai kiriman orang tua).
            </p>

            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                max="31"
                value={cycleDay}
                onChange={(e) => setCycleDay(parseInt(e.target.value, 10) || 1)}
                className="w-20 px-3 py-2 bg-surface border border-border-default rounded-xl text-center text-base font-bold text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500 tabular-nums"
              />
              <span className="text-xs text-text-secondary">tiap bulan (1 – 31)</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-semantic-rose-soft border border-semantic-rose/20 rounded-xl text-xs text-semantic-rose font-medium">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
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

        {/* Profile & Database Status */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs p-2.5 bg-surface-container-low rounded-xl border border-border-subtle">
            <span className="flex items-center gap-1.5 text-text-secondary font-medium">
              <User className="w-3.5 h-3.5 text-text-muted" />
              <span>Akun Pengguna</span>
            </span>
            <span className="font-semibold text-text-primary truncate max-w-[180px]">
              {user?.email || 'Mode Demo (Lokal)'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs p-2.5 bg-surface-container-low rounded-xl border border-border-subtle">
            <span className="flex items-center gap-1.5 text-text-secondary font-medium">
              <Database className="w-3.5 h-3.5 text-text-muted" />
              <span>Database Backend</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                isConfigured
                  ? 'bg-semantic-green-soft text-semantic-green'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {isConfigured ? 'Supabase Connected' : 'Local Storage Mode'}
            </span>
          </div>

          {isDemoUser && (
            <button
              onClick={handleResetDemo}
              className="w-full py-2 bg-surface hover:bg-bg-secondary text-text-secondary border border-border-default rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
              <span>Reset Data Demo ke Semula</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
