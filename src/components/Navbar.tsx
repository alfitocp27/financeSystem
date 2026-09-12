import React from 'react';
import { Wallet, Settings, LogIn, LogOut, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinance } from '../context/FinanceContext';
import { formatDateIndo } from '../lib/formatters';

interface NavbarProps {
  onOpenSettings: () => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings, onOpenAuth }) => {
  const { user, isDemoUser, signOut } = useAuth();
  const { cycleInfo } = useFinance();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg">
                SakuMahasiswa
              </span>
              {isDemoUser && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                  <Sparkles className="w-2.5 h-2.5" /> Demo
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>
                Siklus: {formatDateIndo(cycleInfo.startDate)} - {formatDateIndo(cycleInfo.endDate)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Cycle Day Indicator Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full text-xs font-semibold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Sisa {cycleInfo.daysRemaining} Hari
          </div>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            title="Pengaturan Siklus & Akun"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* Auth Button */}
          {user ? (
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-xl transition-colors"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl transition-colors"
              title="Masuk / Daftar"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Masuk</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
