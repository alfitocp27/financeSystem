import React from 'react';
import { LayoutDashboard, ReceiptText, Sliders, PiggyBank, Plus } from 'lucide-react';
import type { ActiveTab } from './Sidebar';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, onOpenQuickAdd }) => {
  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border-default pb-[env(safe-area-inset-bottom)] lg:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.03)]"
    >
      <div className="flex items-center justify-between h-16 px-2 max-w-md mx-auto relative">
        {/* Beranda (Dashboard) */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 ${
            activeTab === 'dashboard' ? 'text-primary-600 font-bold' : 'text-text-muted hover:text-text-secondary font-medium'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Beranda</span>
        </button>

        {/* Transaksi */}
        <button
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 ${
            activeTab === 'transactions' ? 'text-primary-600 font-bold' : 'text-text-muted hover:text-text-secondary font-medium'
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Transaksi</span>
        </button>

        {/* Center Quick Add FAB */}
        <div className="relative -top-5 shrink-0 px-1">
          <button
            onClick={onOpenQuickAdd}
            className="w-13 h-13 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center shadow-lg shadow-indigo-300 transition-transform active:scale-90"
            title="Catat Cepat"
            aria-label="Catat Transaksi Cepat"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Anggaran */}
        <button
          onClick={() => onSelectTab('budget')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 ${
            activeTab === 'budget' ? 'text-primary-600 font-bold' : 'text-text-muted hover:text-text-secondary font-medium'
          }`}
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Anggaran</span>
        </button>

        {/* Tabungan */}
        <button
          onClick={() => onSelectTab('savings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all active:scale-95 ${
            activeTab === 'savings' ? 'text-primary-600 font-bold' : 'text-text-muted hover:text-text-secondary font-medium'
          }`}
        >
          <PiggyBank className="w-5 h-5" />
          <span className="text-[10px] mt-1 font-medium">Tabungan</span>
        </button>
      </div>
    </nav>
  );
};
