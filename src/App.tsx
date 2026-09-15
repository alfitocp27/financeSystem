import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { Sidebar, type ActiveTab } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { SafeToSpendCard } from './components/SafeToSpendCard';
import { FinancialForecastCard } from './components/FinancialForecastCard';
import { WalletCarousel } from './components/WalletCarousel';
import { QuickAddModal } from './components/QuickAddModal';
import { TransferModal } from './components/TransferModal';
import { AddWalletModal } from './components/AddWalletModal';
import { EditWalletModal } from './components/EditWalletModal';
import { AddCategoryModal } from './components/AddCategoryModal';
import { SpendingSimulatorModal } from './components/SpendingSimulatorModal';
import { SavingsGoalSection } from './components/SavingsGoalSection';
import { RecurringBillsSection } from './components/RecurringBillsSection';
import { BudgetManager } from './components/BudgetManager';
import { TransactionList } from './components/TransactionList';
import { AnalyticsSection } from './components/AnalyticsSection';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { BottomNav } from './components/BottomNav';
import { Toast } from './components/Toast';
import type { Wallet } from './types/database.types';

function DashboardContent() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Modal States
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddInitialAmount, setQuickAddInitialAmount] = useState<number | undefined>(undefined);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isAddWalletOpen, setIsAddWalletOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => setToastMessage(msg);

  // Student greeting name
  const studentName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Mahasiswa';

  // Global Keyboard Shortcuts (N / + for quick add, Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        if (e.key === 'Escape') {
          setIsQuickAddOpen(false);
          setIsTransferOpen(false);
          setIsAddWalletOpen(false);
          setEditingWallet(null);
          setIsAddCategoryOpen(false);
          setIsSimulatorOpen(false);
          setIsSettingsOpen(false);
          setIsAuthOpen(false);
        }
        return;
      }

      if (e.key === 'n' || e.key === 'N' || e.key === '+') {
        e.preventDefault();
        setQuickAddInitialAmount(undefined);
        setIsQuickAddOpen(true);
      } else if (e.key === 'Escape') {
        setIsQuickAddOpen(false);
        setIsTransferOpen(false);
        setIsAddWalletOpen(false);
        setEditingWallet(null);
        setIsAddCategoryOpen(false);
        setIsSimulatorOpen(false);
        setIsSettingsOpen(false);
        setIsAuthOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col antialiased">
      {/* Toast Notification */}
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />

      {/* Desktop Persistent Left Sidebar (Stitch Design) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Area (offset by 240px on desktop) */}
      <div className="lg:pl-[240px] flex flex-col flex-1 min-w-0 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:pb-12">
        {/* Top Navbar */}
        <Navbar
          activeTab={activeTab}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenQuickAdd={() => {
            setQuickAddInitialAmount(undefined);
            setIsQuickAddOpen(true);
          }}
        />

        {/* Main Content View Container */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-6 flex-1">
          {/* Dashboard Tab (Stitch Exact Layout) */}
          {activeTab === 'dashboard' && (
            <DashboardView
              studentName={studentName}
              onOpenQuickAdd={() => {
                setQuickAddInitialAmount(undefined);
                setIsQuickAddOpen(true);
              }}
              onOpenSimulator={() => setIsSimulatorOpen(true)}
              onOpenTransfer={() => setIsTransferOpen(true)}
              onOpenAddWallet={() => setIsAddWalletOpen(true)}
              onSelectTab={setActiveTab}
              onShowToast={showToast}
            />
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <TransactionList
                onShowToast={showToast}
                onOpenQuickAdd={() => {
                  setQuickAddInitialAmount(undefined);
                  setIsQuickAddOpen(true);
                }}
              />
            </div>
          )}

          {/* Wallets Tab */}
          {activeTab === 'wallets' && (
            <div className="space-y-6">
              <WalletCarousel
                onOpenTransfer={() => setIsTransferOpen(true)}
                onOpenAddWallet={() => setIsAddWalletOpen(true)}
                onEditWallet={(w) => setEditingWallet(w)}
              />
              <TransactionList
                onShowToast={showToast}
                onOpenQuickAdd={() => {
                  setQuickAddInitialAmount(undefined);
                  setIsQuickAddOpen(true);
                }}
              />
            </div>
          )}

          {/* Budget Tab */}
          {activeTab === 'budget' && (
            <div className="space-y-6">
              <SafeToSpendCard onOpenSimulator={() => setIsSimulatorOpen(true)} />
              <BudgetManager
                onShowToast={showToast}
                onOpenAddCategory={() => setIsAddCategoryOpen(true)}
              />
              <RecurringBillsSection onShowToast={showToast} />
              <FinancialForecastCard />
            </div>
          )}

          {/* Savings Tab */}
          {activeTab === 'savings' && (
            <div className="space-y-6">
              <SavingsGoalSection onShowToast={showToast} />
              <FinancialForecastCard />
            </div>
          )}

          {/* Reports & Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <AnalyticsSection />
              <SafeToSpendCard onOpenSimulator={() => setIsSimulatorOpen(true)} />
              <FinancialForecastCard />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <SettingsModal
                isOpen={true}
                onClose={() => setActiveTab('dashboard')}
                onShowToast={showToast}
              />
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Stitch Mobile Footer) */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenQuickAdd={() => {
          setQuickAddInitialAmount(undefined);
          setIsQuickAddOpen(true);
        }}
      />

      {/* Modals & Bottom Sheets */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onShowToast={showToast}
        initialAmount={quickAddInitialAmount}
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

      <EditWalletModal
        wallet={editingWallet}
        isOpen={Boolean(editingWallet)}
        onClose={() => setEditingWallet(null)}
        onShowToast={showToast}
      />

      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onShowToast={showToast}
      />

      <SpendingSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onProceedToRecord={(amt) => {
          setQuickAddInitialAmount(amt);
          setIsQuickAddOpen(true);
        }}
      />

      {activeTab !== 'settings' && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onShowToast={showToast}
        />
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

function MainApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Wajib Login: langsung ke halaman LoginPage jika belum login
  if (!user) {
    return <LoginPage />;
  }

  return <DashboardContent />;
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <MainApp />
      </FinanceProvider>
    </AuthProvider>
  );
}
