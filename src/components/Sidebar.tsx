import React from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  PieChart,
  PiggyBank,
  TrendingUp,
  Settings,
  LogOut,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActiveTab =
  | 'dashboard'
  | 'transactions'
  | 'wallets'
  | 'budget'
  | 'savings'
  | 'analytics'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const { user, profile, signOut } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Beranda', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: ReceiptText },
    { id: 'wallets', label: 'Dompet & Rekening', icon: Wallet },
    { id: 'budget', label: 'Anggaran', icon: PieChart },
    { id: 'savings', label: 'Tabungan', icon: PiggyBank },
    { id: 'analytics', label: 'Laporan & Analisis', icon: TrendingUp },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ] as const;

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Mahasiswa';
  const displayEmail = user?.email || '';

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[240px] bg-surface border-r border-border-default z-40 flex-col justify-between py-6 px-4 select-none">
      <div className="flex flex-col gap-6">
        {/* Logo Branding */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0 border border-border-gold">
            <CreditCard className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold text-text-primary tracking-tight leading-snug">
              SakuMhs
            </span>
            <span className="text-xs text-text-muted font-normal">
              Finansial Mahasiswa
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left min-h-[44px] ${
                  isActive
                    ? 'bg-primary/[0.08] text-text-gold font-semibold'
                    : 'text-text-secondary hover:bg-surface-elevated/60 hover:text-text-primary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? 'text-text-gold' : 'text-text-muted'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" aria-hidden="true" />}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer: User Card & Sign in / Sign out */}
      <div className="pt-4 border-t border-border-default flex flex-col gap-3">
        {/* User preview badge */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-primary-soft text-primary flex items-center justify-center text-xs font-bold shrink-0 border border-border-gold">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-text-primary truncate">
                {displayName}
              </span>
              <span className="text-xs text-text-muted truncate">
                {displayEmail}
              </span>
            </div>
          </div>
        </div>

        {/* Auth Action */}
        {user && (
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-semantic-rose-text hover:bg-semantic-rose-soft transition-colors min-h-[44px]"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        )}
      </div>
    </aside>
  );
};
