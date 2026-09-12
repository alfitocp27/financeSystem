import React from 'react';
import { LayoutDashboard, Wallet, Plus, PiggyBank, PieChart, Sliders } from 'lucide-react';

export type TabType = 'dashboard' | 'wallets' | 'budget' | 'savings' | 'analytics';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab, onOpenQuickAdd }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 sm:hidden">
      <div className="flex items-center justify-between h-16 px-3 max-w-md mx-auto relative">
        {/* Dashboard */}
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'dashboard' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px] mt-1">Beranda</span>
        </button>

        {/* Wallets */}
        <button
          onClick={() => onSelectTab('wallets')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'wallets' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[9px] mt-1">Dompet</span>
        </button>

        {/* Center Quick Add FAB */}
        <div className="relative -top-5 shrink-0 px-1">
          <button
            onClick={onOpenQuickAdd}
            className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-300 hover:bg-indigo-700 transition-transform active:scale-95"
            title="Catat Cepat"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Budget */}
        <button
          onClick={() => onSelectTab('budget')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'budget' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <Sliders className="w-5 h-5" />
          <span className="text-[9px] mt-1">Anggaran</span>
        </button>

        {/* Savings */}
        <button
          onClick={() => onSelectTab('savings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'savings' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <PiggyBank className="w-5 h-5" />
          <span className="text-[9px] mt-1">Tabungan</span>
        </button>

        {/* Analytics */}
        <button
          onClick={() => onSelectTab('analytics')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            activeTab === 'analytics' ? 'text-indigo-600 font-bold' : 'text-slate-400 font-medium'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[9px] mt-1">Analisis</span>
        </button>
      </div>
    </div>
  );
};
