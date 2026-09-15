import React from 'react';
import { CreditCard, Calendar, Settings, LogIn, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { formatDateIndo } from '../lib/formatters';
import type { ActiveTab } from './Sidebar';

interface NavbarProps {
  activeTab: ActiveTab;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenQuickAdd: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onOpenSettings,
  onOpenAuth,
  onOpenQuickAdd,
}) => {
  const { user, signOut } = useAuth();
  const { cycleInfo } = useFinance();

  const getPageTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard';
      case 'transactions':
        return 'Riwayat Transaksi';
      case 'wallets':
        return 'Dompet & Rekening';
      case 'budget':
        return 'Anggaran & Pos';
      case 'savings':
        return 'Target Tabungan';
      case 'analytics':
        return 'Laporan & Analitik';
      case 'settings':
        return 'Pengaturan Sistem';
      default:
        return 'SakuMhs';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border-default">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Section: Mobile logo / Desktop view title */}
        <div className="flex items-center gap-3">
          {/* Mobile Logo Brand */}
          <div className="flex lg:hidden items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-text-primary tracking-tight">SakuMhs</span>
              <span className="text-[10px] text-text-muted">{getPageTitle(activeTab)}</span>
            </div>
          </div>

          {/* Desktop Page Title */}
          <div className="hidden lg:flex items-center gap-3">
            <h1 className="text-lg font-bold text-text-primary tracking-tight">
              {getPageTitle(activeTab)}
            </h1>
            <span className="text-border-default">•</span>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium bg-bg-secondary px-2.5 py-1 rounded-lg">
              <Calendar className="w-3.5 h-3.5 text-text-muted" />
              <span>
                Siklus: {formatDateIndo(cycleInfo.startDate)} – {formatDateIndo(cycleInfo.endDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2.5">
          {/* Sisa Hari Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-50 rounded-full text-xs font-semibold text-primary-700">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
            <span>Sisa {cycleInfo.daysRemaining} hari</span>
          </div>

          {/* Desktop Quick Add Action Button */}
          <button
            onClick={onOpenQuickAdd}
            className="hidden sm:inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs"
            title="Tekan 'N' atau '+' di keyboard"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Transaksi</span>
            <span className="hidden md:inline-block ml-1 px-1.5 py-0.5 bg-primary-700/50 rounded text-[9px] font-mono">
              N
            </span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-xl transition-colors"
            title="Pengaturan"
            aria-label="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Mobile Auth Button */}
          <div className="flex lg:hidden">
            {user ? (
              <button
                onClick={signOut}
                className="p-2 text-semantic-rose hover:bg-semantic-rose-soft rounded-xl transition-colors"
                title="Keluar"
                aria-label="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                title="Masuk"
                aria-label="Masuk"
              >
                <LogIn className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
