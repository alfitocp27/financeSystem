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
import { BudgetManager } from './components/BudgetManager';
import { TransactionList } from './components/TransactionList';
import { AnalyticsSection } from './components/AnalyticsSection';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { BottomNav, type TabType } from './components/BottomNav';
import { Toast } from './components/Toast';
import { Plus } from 'lucide-react';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Modal States
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => setToastMessage(msg);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 pb-24 sm:pb-12">
      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Top Navbar */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* Desktop Header & Quick Add Bar */}
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

        {/* Desktop Tab Selector */}
        <div className="hidden sm:flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl w-fit">
          {[
            { id: 'dashboard', label: 'Ringkasan Utama' },
            { id: 'wallets', label: 'Dompet & Transfer' },
            { id: 'budget', label: 'Anggaran Kategori' },
            { id: 'savings', label: 'Target Tabungan' },
            { id: 'analytics', label: 'Analisis & Grafik' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View switching */}
        {activeTab === 'dashboard' && (
          <>
            {/* Safe to Spend Hero Card */}
            <SafeToSpendCard />

            {/* Dompet & Rekening Carousel */}
            <WalletCarousel
              onOpenTransfer={() => setIsTransferOpen(true)}
              onOpenAddWallet={() => setIsAddWalletOpen(true)}
            />

            {/* Anggaran per Kategori */}
            <BudgetManager onShowToast={showToast} />

            {/* Target Tabungan Section */}
            <SavingsGoalSection />

            {/* Analisis Pengeluaran */}
            <AnalyticsSection />

            {/* Riwayat Transaksi with Search & Filters */}
            <TransactionList onShowToast={showToast} />
          </>
        )}

        {activeTab === 'wallets' && (
          <div className="space-y-6">
            <WalletCarousel
              onOpenTransfer={() => setIsTransferOpen(true)}
              onOpenAddWallet={() => setIsAddWalletOpen(true)}
            />
            <TransactionList onShowToast={showToast} />
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-6">
            <SafeToSpendCard />
            <BudgetManager onShowToast={showToast} />
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
        onShowToast={showToast}
      />

      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        onShowToast={showToast}
      />

      <AddWalletModal
        isOpen={isAddWalletOpen}
        onClose={() => setIsAddWalletOpen(false)}
        onShowToast={showToast}
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
