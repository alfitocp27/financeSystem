import { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { Navbar } from './components/Navbar';
import { SafeToSpendCard } from './components/SafeToSpendCard';
import { WalletCarousel } from './components/WalletCarousel';
import { QuickAddModal } from './components/QuickAddModal';
import { TransferModal } from './components/TransferModal';
import { AddWalletModal } from './components/AddWalletModal';
import { SavingsGoalSection } from './components/SavingsGoalSection';
import { TransactionList } from './components/TransactionList';
import { AnalyticsSection } from './components/AnalyticsSection';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { BottomNav } from './components/BottomNav';
import { Plus } from 'lucide-react';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'wallets' | 'savings' | 'analytics'>('dashboard');

  // Modal States
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-24 sm:pb-12">
      {/* Top Navbar */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* Desktop Quick Add Bar */}
        <div className="hidden sm:flex items-center justify-between pb-1">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Ringkasan Keuangan
            </h1>
            <p className="text-xs text-slate-500">
              Pantau jatah harian dan laju belanja agar uang cukup sampai akhir bulan.
            </p>
          </div>
          <button
            onClick={() => setIsQuickAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Catat Transaksi Cepat
          </button>
        </div>

        {/* View switching for mobile or complete unified dashboard for desktop */}
        {activeTab === 'dashboard' && (
          <>
            {/* Safe to Spend Hero */}
            <SafeToSpendCard />

            {/* Dompet & Rekening */}
            <WalletCarousel
              onOpenTransfer={() => setIsTransferOpen(true)}
              onOpenAddWallet={() => setIsAddWalletOpen(true)}
            />

            {/* Target Tabungan */}
            <SavingsGoalSection />

            {/* Analisis Pengeluaran */}
            <AnalyticsSection />

            {/* Riwayat Transaksi */}
            <TransactionList />
          </>
        )}

        {activeTab === 'wallets' && (
          <div className="space-y-6">
            <WalletCarousel
              onOpenTransfer={() => setIsTransferOpen(true)}
              onOpenAddWallet={() => setIsAddWalletOpen(true)}
            />
            <TransactionList />
          </div>
        )}

        {activeTab === 'savings' && (
          <div className="space-y-6">
            <SavingsGoalSection />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <SafeToSpendCard />
            <AnalyticsSection />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
      />

      {/* Modals */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
      />

      <AddWalletModal
        isOpen={isAddWalletOpen}
        onClose={() => setIsAddWalletOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <DashboardContent />
      </FinanceProvider>
    </AuthProvider>
  );
}
