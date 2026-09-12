import React, { useState } from 'react';
import { Sparkles, Calendar, Wallet, Plus, X } from 'lucide-react';

interface OnboardingGuideProps {
  onOpenSettings: () => void;
  onOpenQuickAdd: () => void;
  onOpenAddWallet: () => void;
}

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  onOpenSettings,
  onOpenQuickAdd,
  onOpenAddWallet,
}) => {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('onboarding_guide_dismissed') === 'true';
  });

  if (isDismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem('onboarding_guide_dismissed', 'true');
    setIsDismissed(true);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-sm relative overflow-hidden">
      {/* Background flare */}
      <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/30 rounded-xl text-indigo-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Selamat Datang di SakuMahasiswa!</h2>
            <p className="text-[11px] text-slate-300">
              Mulai atur keuanganmu dalam 3 langkah mudah:
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          title="Tutup panduan"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
        {/* Step 1 */}
        <button
          onClick={onOpenSettings}
          className="p-3 bg-white/10 hover:bg-white/15 rounded-2xl text-left border border-white/10 transition-colors flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-500/40 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-indigo-200" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Langkah 1</div>
            <div className="text-xs font-semibold text-white">Atur Tanggal Kiriman</div>
          </div>
        </button>

        {/* Step 2 */}
        <button
          onClick={onOpenAddWallet}
          className="p-3 bg-white/10 hover:bg-white/15 rounded-2xl text-left border border-white/10 transition-colors flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/40 flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 text-emerald-200" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">Langkah 2</div>
            <div className="text-xs font-semibold text-white">Sesuaikan Saldo Dompet</div>
          </div>
        </button>

        {/* Step 3 */}
        <button
          onClick={onOpenQuickAdd}
          className="p-3 bg-white/10 hover:bg-white/15 rounded-2xl text-left border border-white/10 transition-colors flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500/40 flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4 text-purple-200" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Langkah 3</div>
            <div className="text-xs font-semibold text-white">Catat Pengeluaran Cepat</div>
          </div>
        </button>
      </div>
    </div>
  );
};
