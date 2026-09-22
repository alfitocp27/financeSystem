import React from 'react';
import { CreditCard, Calendar, Settings, LogOut, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { formatDateIndo } from '../lib/formatters';
import type { ActiveTab } from './Sidebar';

interface NavbarProps {
  activeTab: ActiveTab;
  onOpenSettings: () => void;
  onOpenQuickAdd: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onOpenSettings,
  onOpenQuickAdd,
}) => {
  const { user, signOut } = useAuth();
  const { cycleInfo } = useFinance();

  const getPageTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Beranda';
      case 'transactions':
        return 'Riwayat Transaksi';
      case 'wallets':
        return 'Dompet & Rekening';
      case 'budget':
        return 'Anggaran & Pos';
      case 'savings':
        return 'Target Tabungan';
      case 'analytics':
        return 'Laporan & Analisis';
      case 'settings':
        return 'Pengaturan';
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
            <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0 border border-border-gold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-text-primary tracking-tight">SakuMhs</span>
              <span className="text-xs text-text-muted">{getPageTitle(activeTab)}</span>
            </div>
          </div>

          {/* Desktop Page Title */}
          <div className="hidden lg:flex items-center gap-3">
            <h1 className="text-lg font-bold text-text-primary tracking-tight">
              {getPageTitle(activeTab)}
            </h1>
            <span className="text-border-default">•</span>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium bg-surface-elevated px-2.5 py-1 rounded-lg border border-border-subtle">
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary-soft rounded-full text-xs font-semibold text-text-gold border border-border-gold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>Sisa {cycleInfo.daysRemaining} hari</span>
          </div>

          {/* Desktop Quick Add Action Button */}
          <button
            onClick={onOpenQuickAdd}
            className="hidden sm:inline-flex items-center gap-1.5 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-xs"
            title="Tekan 'N' atau '+' di keyboard"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Tambah Transaksi</span>
            <span className="hidden md:inline-block ml-1 px-1.5 py-0.5 bg-white/20 text-white rounded text-xs font-mono">
              N
            </span>
          </button>

          {/* Settings Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
            title="Pengaturan"
            aria-label="Pengaturan"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Mobile Logout Button */}
          {user && (
            <div className="flex lg:hidden">
              <button
                onClick={signOut}
                className="p-2 text-semantic-rose-text hover:bg-semantic-rose-soft rounded-lg transition-colors"
                title="Keluar"
                aria-label="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
