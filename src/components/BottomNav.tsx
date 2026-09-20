import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  Grid2X2,
  Plus,
  PieChart,
  PiggyBank,
  TrendingUp,
  Settings,
  X,
} from 'lucide-react';
import type { ActiveTab } from './Sidebar';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenQuickAdd: () => void;
}

// Tabs that live under the "Lainnya" sheet
const MORE_TABS: ActiveTab[] = ['budget', 'savings', 'analytics', 'settings'];

const moreMenuItems: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
  { id: 'budget', label: 'Anggaran', icon: PieChart },
  { id: 'savings', label: 'Target Tabungan', icon: PiggyBank },
  { id: 'analytics', label: 'Laporan & Analisis', icon: TrendingUp },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
];

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, onOpenQuickAdd }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isMoreActive = MORE_TABS.includes(activeTab);

  const handleMoreSelect = useCallback((tab: ActiveTab) => {
    onSelectTab(tab);
    setIsMoreOpen(false);
  }, [onSelectTab]);

  // Close on Escape
  useEffect(() => {
    if (!isMoreOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMoreOpen]);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isMoreOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMoreOpen]);

  return (
    <>
      {/* Lainnya Bottom Sheet */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu Lainnya">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setIsMoreOpen(false)}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-surface-modal border-t border-border-default rounded-t-2xl pb-[env(safe-area-inset-bottom)] animate-in slide-in-from-bottom duration-200">
            {/* Sheet Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border-subtle">
              <span className="text-sm font-bold text-text-primary">Lainnya</span>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                className="p-2 text-text-muted hover:text-text-primary rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Tutup menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="px-3 py-2" aria-label="Menu navigasi tambahan">
              {moreMenuItems.map((item) => {
                const Icon = item.icon;
                const isItemActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMoreSelect(item.id)}
                    className={`flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium transition-colors min-h-[48px] ${
                      isItemActive
                        ? 'bg-primary/[0.08] text-text-gold font-semibold'
                        : 'text-text-secondary hover:bg-surface-elevated/60 hover:text-text-primary'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isItemActive ? 'text-text-gold' : 'text-text-muted'
                      }`}
                    />
                    <span>{item.label}</span>
                    {isItemActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border-default pb-[env(safe-area-inset-bottom)] lg:hidden shadow-[var(--nav-shadow)]"
      >
        <div className="flex items-center justify-between h-16 px-2 max-w-md mx-auto relative">
          {/* Beranda (Dashboard) */}
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 min-h-[44px] ${
              activeTab === 'dashboard' ? 'text-primary font-bold' : 'text-text-muted hover:text-text-secondary font-medium'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Beranda</span>
          </button>

          {/* Transaksi */}
          <button
            onClick={() => onSelectTab('transactions')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 min-h-[44px] ${
              activeTab === 'transactions' ? 'text-primary font-bold' : 'text-text-muted hover:text-text-secondary font-medium'
            }`}
          >
            <ReceiptText className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Transaksi</span>
          </button>

          {/* Center Quick Add FAB */}
          <div className="relative -top-5 shrink-0 px-1">
            <button
              onClick={onOpenQuickAdd}
              className="w-13 h-13 rounded-full bg-primary hover:bg-primary-hover text-slate-950 flex items-center justify-center shadow-lg shadow-black/50 border border-border-gold transition-transform active:scale-90"
              title="Catat Cepat"
              aria-label="Catat Transaksi Cepat"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Dompet */}
          <button
            onClick={() => onSelectTab('wallets')}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 min-h-[44px] ${
              activeTab === 'wallets' ? 'text-primary font-bold' : 'text-text-muted hover:text-text-secondary font-medium'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Dompet</span>
          </button>

          {/* Lainnya */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 min-h-[44px] ${
              isMoreActive ? 'text-primary font-bold' : 'text-text-muted hover:text-text-secondary font-medium'
            }`}
          >
            <Grid2X2 className="w-5 h-5" />
            <span className="text-xs mt-1 font-medium">Lainnya</span>
          </button>
        </div>
      </nav>
    </>
  );
};
