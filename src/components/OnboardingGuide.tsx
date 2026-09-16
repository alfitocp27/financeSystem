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
    <div className="bg-surface text-text-primary p-5 rounded-2xl shadow-sm border border-border-gold relative overflow-hidden">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary-soft rounded-xl text-text-gold">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary tracking-tight">Selamat Datang di SakuMahasiswa!</h2>
            <p className="text-xs text-text-secondary">
              Mulai atur keuanganmu dalam 3 langkah mudah:
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 text-text-muted hover:text-text-primary rounded-lg transition-colors"
          title="Tutup panduan"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
        {/* Step 1 */}
        <button
          onClick={onOpenSettings}
          className="p-3 bg-surface-elevated hover:bg-surface-elevated/80 rounded-xl text-left border border-border-default hover:border-border-gold transition-colors flex items-center gap-2.5 min-h-[44px]"
        >
          <div className="w-8 h-8 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4 text-text-gold" />
          </div>
          <div>
            <div className="text-xs font-bold text-text-gold uppercase tracking-wider">Langkah 1</div>
            <div className="text-xs font-semibold text-text-primary">Atur Tanggal Kiriman</div>
          </div>
        </button>

        {/* Step 2 */}
        <button
          onClick={onOpenAddWallet}
          className="p-3 bg-surface-elevated hover:bg-surface-elevated/80 rounded-xl text-left border border-border-default hover:border-border-gold transition-colors flex items-center gap-2.5 min-h-[44px]"
        >
          <div className="w-8 h-8 rounded-xl bg-semantic-green-soft flex items-center justify-center shrink-0">
            <Wallet className="w-4 h-4 text-semantic-green-text" />
          </div>
          <div>
            <div className="text-xs font-bold text-semantic-green-text uppercase tracking-wider">Langkah 2</div>
            <div className="text-xs font-semibold text-text-primary">Sesuaikan Saldo Dompet</div>
          </div>
        </button>

        {/* Step 3 */}
        <button
          onClick={onOpenQuickAdd}
          className="p-3 bg-surface-elevated hover:bg-surface-elevated/80 rounded-xl text-left border border-border-default hover:border-border-gold transition-colors flex items-center gap-2.5 min-h-[44px]"
        >
          <div className="w-8 h-8 rounded-xl bg-primary-soft flex items-center justify-center shrink-0">
            <Plus className="w-4 h-4 text-text-gold" />
          </div>
          <div>
            <div className="text-xs font-bold text-text-gold uppercase tracking-wider">Langkah 3</div>
            <div className="text-xs font-semibold text-text-primary">Catat Pengeluaran Cepat</div>
          </div>
        </button>
      </div>
    </div>
  );
};
