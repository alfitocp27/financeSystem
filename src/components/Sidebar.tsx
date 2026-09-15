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
  LogIn,
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
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, onOpenAuth }) => {
  const { user, profile, isConfigured, signOut } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ReceiptText },
    { id: 'wallets', label: 'Wallets', icon: Wallet },
    { id: 'budget', label: 'Budget', icon: PieChart },
    { id: 'savings', label: 'Savings', icon: PiggyBank },
    { id: 'analytics', label: 'Reports & Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Mahasiswa';
  const displayEmail = user?.email || '';

  return (
    <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-[240px] bg-surface border-r border-border-default z-40 flex-col justify-between py-6 px-4 select-none">
      <div className="flex flex-col gap-6">
        {/* Logo Branding */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 shrink-0 shadow-xs">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[16px] font-bold text-text-primary tracking-tight leading-snug">
              SakuMhs
            </span>
            <span className="text-[11px] text-text-muted font-normal">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-all text-left ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-semibold'
                    : 'text-text-secondary hover:bg-bg-secondary hover:text-text-primary'
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-primary-600' : 'text-text-muted'
                  }`}
                />
                <span>{item.label}</span>
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
            <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0">
              {displayName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-semibold text-text-primary truncate">
                {displayName}
              </span>
              <span className="text-[11px] text-text-muted truncate">
                {displayEmail}
              </span>
            </div>
          </div>
        </div>

        {/* Auth Action */}
        {user ? (
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-semantic-rose hover:bg-semantic-rose-soft transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk / Daftar</span>
          </button>
        )}

        {/* Supabase Status indicator */}
        <div className="flex items-center justify-between text-[10px] text-text-muted px-1">
          <span className="flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConfigured ? 'bg-semantic-green' : 'bg-amber-400'
              }`}
            />
            {isConfigured ? 'Supabase Connected' : 'Local Storage Mode'}
          </span>
          <span className="text-[10px] text-text-muted">v0.1</span>
        </div>
      </div>
    </aside>
  );
};
