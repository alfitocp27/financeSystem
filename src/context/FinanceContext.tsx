import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Wallet, Category, Transaction, Budget, SavingsGoal, TransactionType, WalletType, CategoryType, RecurringCommitment } from '../types/database.types';
import { getCycleInfo, calculateSafeToSpend, type SafeToSpendCalculation, type CycleInfo } from '../lib/budget-cycle';

interface FinanceContextType {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  commitments: RecurringCommitment[];
  isLoading: boolean;
  cycleInfo: CycleInfo;
  safeToSpend: SafeToSpendCalculation;
  totalBalance: number;
  totalIncomeInCycle: number;
  totalExpenseInCycle: number;
  totalUnpaidCommitments: number;
  // Actions
  addTransaction: (params: {
    type: TransactionType;
    amount: number;
    walletId: string;
    categoryId?: string;
    destinationWalletId?: string;
    goalId?: string;
    note?: string;
    transactionDate?: string;
  }) => Promise<{ error: Error | null }>;
  deleteTransaction: (id: string) => Promise<{ error: Error | null }>;
  addWallet: (params: { name: string; wallet_type: WalletType; balance: number; color?: string; icon?: string }) => Promise<{ error: Error | null }>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<{ error: Error | null }>;
  deleteWallet: (id: string) => Promise<{ error: Error | null }>;
  addCategory: (params: { name: string; type: CategoryType; color?: string; icon?: string }) => Promise<{ error: Error | null }>;
  deleteCategory: (id: string) => Promise<{ error: Error | null }>;
  setCategoryBudget: (categoryId: string, amount: number) => Promise<{ error: Error | null }>;
  addSavingsGoal: (params: { name: string; target_amount: number; target_date?: string; color?: string }) => Promise<{ error: Error | null }>;
  allocateToGoal: (goalId: string, walletId: string, amount: number) => Promise<{ error: Error | null }>;
  withdrawFromGoal: (goalId: string, walletId: string, amount: number) => Promise<{ error: Error | null }>;
  addCommitment: (params: { name: string; amount: number; due_day: number; category_id?: string }) => Promise<{ error: Error | null }>;
  deleteCommitment: (id: string) => Promise<{ error: Error | null }>;
  payCommitment: (commitmentId: string, walletId: string) => Promise<{ error: Error | null }>;
  applyPresetTemplate: (preset: 'kost' | 'home') => Promise<void>;
  refreshData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Initial Mock/Starter Data for Instant Play and Demo Mode
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', user_id: 'demo', name: 'Makanan & Minuman', type: 'expense', icon: 'utensils', color: '#f59e0b', created_at: '' },
  { id: 'cat-2', user_id: 'demo', name: 'Kost & Utilitas', type: 'expense', icon: 'home', color: '#ef4444', created_at: '' },
  { id: 'cat-3', user_id: 'demo', name: 'Transportasi', type: 'expense', icon: 'bus', color: '#3b82f6', created_at: '' },
  { id: 'cat-4', user_id: 'demo', name: 'Kuliah & Tugas', type: 'expense', icon: 'book-open', color: '#8b5cf6', created_at: '' },
  { id: 'cat-5', user_id: 'demo', name: 'Hiburan & Nongkrong', type: 'expense', icon: 'coffee', color: '#ec4899', created_at: '' },
  { id: 'cat-6', user_id: 'demo', name: 'Belanja Harian', type: 'expense', icon: 'shopping-bag', color: '#14b8a6', created_at: '' },
  { id: 'cat-7', user_id: 'demo', name: 'Uang Bulanan Ortu', type: 'income', icon: 'wallet', color: '#10b981', created_at: '' },
  { id: 'cat-8', user_id: 'demo', name: 'Gaji / Freelance', type: 'income', icon: 'briefcase', color: '#3b82f6', created_at: '' },
  { id: 'cat-9', user_id: 'demo', name: 'Beasiswa & Lomba', type: 'income', icon: 'award', color: '#f59e0b', created_at: '' },
];

const DEFAULT_WALLETS: Wallet[] = [
  { id: 'w-1', user_id: 'demo', name: 'Uang Tunai (Cash)', wallet_type: 'cash', balance: 250000, icon: 'banknote', color: '#10b981', is_active: true, created_at: '', updated_at: '' },
  { id: 'w-2', user_id: 'demo', name: 'BCA / Bank Utama', wallet_type: 'bank', balance: 1850000, icon: 'landmark', color: '#3b82f6', is_active: true, created_at: '', updated_at: '' },
  { id: 'w-3', user_id: 'demo', name: 'GoPay / E-Wallet', wallet_type: 'ewallet', balance: 120000, icon: 'smartphone', color: '#8b5cf6', is_active: true, created_at: '', updated_at: '' },
];

const DEFAULT_GOALS: SavingsGoal[] = [
  { id: 'goal-1', user_id: 'demo', name: 'Dana Darurat Kost', target_amount: 1500000, current_amount: 600000, target_date: '2026-12-31', icon: 'shield-alert', color: '#10b981', created_at: '', updated_at: '' },
  { id: 'goal-2', user_id: 'demo', name: 'Upgrade Laptop / Gadget', target_amount: 5000000, current_amount: 1200000, target_date: '2027-02-01', icon: 'laptop', color: '#6366f1', created_at: '', updated_at: '' },
];

const DEFAULT_BUDGETS: Budget[] = [
  { id: 'b-1', user_id: 'demo', category_id: 'cat-1', amount: 900000, period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), created_at: '' },
  { id: 'b-2', user_id: 'demo', category_id: 'cat-2', amount: 600000, period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), created_at: '' },
  { id: 'b-3', user_id: 'demo', category_id: 'cat-3', amount: 200000, period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), created_at: '' },
  { id: 'b-4', user_id: 'demo', category_id: 'cat-5', amount: 250000, period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), created_at: '' },
];

const DEFAULT_COMMITMENTS: RecurringCommitment[] = [
  { id: 'rec-1', user_id: 'demo', category_id: 'cat-2', name: 'Sewa Kost Bulanan', amount: 650000, due_day: 1, is_paid: false, created_at: '' },
  { id: 'rec-2', user_id: 'demo', category_id: 'cat-2', name: 'Wifi & Kuota Kampus', amount: 75000, due_day: 10, is_paid: false, created_at: '' },
  { id: 'rec-3', user_id: 'demo', category_id: 'cat-5', name: 'Spotify / YouTube Music', amount: 25000, due_day: 15, is_paid: true, created_at: '' },
];

function generateStarterTransactions(cycleStartDate: Date, userId: string = 'demo'): Transaction[] {
  const start = new Date(cycleStartDate);
  const formatDate = (dayOffset: number) => {
    const d = new Date(start);
    d.setDate(d.getDate() + dayOffset);
    return d.toISOString().split('T')[0];
  };

  return [
    {
      id: 'tx-1',
      user_id: userId,
      wallet_id: 'w-2',
      category_id: 'cat-7',
      goal_id: null,
      type: 'income',
      amount: 3500000,
      transaction_date: formatDate(0),
      destination_wallet_id: null,
      note: 'Uang Saku Bulanan dari Ortu',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-2',
      user_id: userId,
      wallet_id: 'w-2',
      category_id: 'cat-2',
      goal_id: null,
      type: 'expense',
      amount: 450000,
      transaction_date: formatDate(1),
      destination_wallet_id: null,
      note: 'Sewa Kos & Iuran Kebersihan',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-3',
      user_id: userId,
      wallet_id: 'w-3',
      category_id: 'cat-1',
      goal_id: null,
      type: 'expense',
      amount: 45000,
      transaction_date: formatDate(3),
      destination_wallet_id: null,
      note: 'Makan Siang & Es Teh Kantin',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-4',
      user_id: userId,
      wallet_id: 'w-1',
      category_id: 'cat-3',
      goal_id: null,
      type: 'expense',
      amount: 30000,
      transaction_date: formatDate(5),
      destination_wallet_id: null,
      note: 'Bensin Motor Pertalite',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-5',
      user_id: userId,
      wallet_id: 'w-3',
      category_id: 'cat-1',
      goal_id: null,
      type: 'expense',
      amount: 55000,
      transaction_date: formatDate(7),
      destination_wallet_id: null,
      note: 'Makan Malam Bersama Teman Kost',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-6',
      user_id: userId,
      wallet_id: 'w-2',
      category_id: 'cat-4',
      goal_id: null,
      type: 'expense',
      amount: 85000,
      transaction_date: formatDate(9),
      destination_wallet_id: null,
      note: 'Buku & Modul Kuliah Semester',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-7',
      user_id: userId,
      wallet_id: 'w-1',
      category_id: 'cat-1',
      goal_id: null,
      type: 'expense',
      amount: 22000,
      transaction_date: formatDate(11),
      destination_wallet_id: null,
      note: 'Makan Siang Warteg',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-8',
      user_id: userId,
      wallet_id: 'w-3',
      category_id: 'cat-5',
      goal_id: null,
      type: 'expense',
      amount: 35000,
      transaction_date: formatDate(13),
      destination_wallet_id: null,
      note: 'Kopi & Nugas di Cafe Kampus',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-9',
      user_id: userId,
      wallet_id: 'w-2',
      category_id: 'cat-6',
      goal_id: null,
      type: 'expense',
      amount: 65000,
      transaction_date: formatDate(15),
      destination_wallet_id: null,
      note: 'Belanja Harian & Sabun Cuci',
      created_at: new Date().toISOString(),
    },
    {
      id: 'tx-10',
      user_id: userId,
      wallet_id: 'w-2',
      category_id: null,
      goal_id: 'goal-2',
      type: 'transfer',
      amount: 200000,
      transaction_date: formatDate(17),
      destination_wallet_id: 'w-3',
      note: 'Transfer ke Tabungan Laptop',
      created_at: new Date().toISOString(),
    },
  ];
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isDemoUser, isConfigured } = useAuth();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [commitments, setCommitments] = useState<RecurringCommitment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cycleStartDay = profile?.cycle_start_day ?? 25;
  const cycleInfo = useMemo(() => getCycleInfo(cycleStartDay), [cycleStartDay]);

  // Load / Seed Data from Supabase or Local Storage
  const refreshData = useCallback(async () => {
    setIsLoading(true);

    if (isDemoUser || !isConfigured || !user) {
      // LocalStorage Demo Storage
      const storedWallets = localStorage.getItem('demo_wallets');
      const storedCategories = localStorage.getItem('demo_categories');
      const storedTransactions = localStorage.getItem('demo_transactions');
      const storedBudgets = localStorage.getItem('demo_budgets');
      const storedGoals = localStorage.getItem('demo_goals');
      const storedCommitments = localStorage.getItem('demo_commitments');

      setWallets(storedWallets ? JSON.parse(storedWallets) : DEFAULT_WALLETS);
      setCategories(storedCategories ? JSON.parse(storedCategories) : DEFAULT_CATEGORIES);
      setBudgets(storedBudgets ? JSON.parse(storedBudgets) : DEFAULT_BUDGETS);
      setSavingsGoals(storedGoals ? JSON.parse(storedGoals) : DEFAULT_GOALS);
      setCommitments(storedCommitments ? JSON.parse(storedCommitments) : DEFAULT_COMMITMENTS);

      if (storedTransactions) {
        setTransactions(JSON.parse(storedTransactions));
      } else {
        const initialTx = generateStarterTransactions(cycleInfo.startDate, 'demo');
        setTransactions(initialTx);
        localStorage.setItem('demo_transactions', JSON.stringify(initialTx));
      }
      setIsLoading(false);
      return;
    }

    try {
      // Fetch from Supabase
      const [
        { data: wData, error: wErr },
        { data: cData, error: cErr },
        { data: tData },
        { data: bData },
        { data: gData },
        { data: rData },
      ] = await Promise.all([
        supabase.from('wallets').select('*').order('created_at', { ascending: true }),
        supabase.from('categories').select('*').order('name', { ascending: true }),
        supabase.from('transactions').select('*, wallet:wallets(*), category:categories(*), destination_wallet:wallets!destination_wallet_id(*)').order('transaction_date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('budgets').select('*'),
        supabase.from('savings_goals').select('*').order('created_at', { ascending: true }),
        supabase.from('recurring_commitments').select('*').order('due_day', { ascending: true }),
      ]);

      if (wErr || cErr) {
        console.warn('Supabase query error (tables may need migration):', wErr || cErr);
      }

      // Auto-seed for authenticated users if wallets are empty
      if (user && (!wData || wData.length === 0)) {
        try {
          const seedWallets = [
            { user_id: user.id, name: 'Uang Tunai (Cash)', wallet_type: 'cash', balance: 250000, icon: 'banknote', color: '#10b981' },
            { user_id: user.id, name: 'Rekening Bank', wallet_type: 'bank', balance: 1500000, icon: 'landmark', color: '#3b82f6' },
            { user_id: user.id, name: 'E-Wallet (GoPay/ShopeePay)', wallet_type: 'ewallet', balance: 100000, icon: 'smartphone', color: '#8b5cf6' },
          ];
          await supabase.from('wallets').insert(seedWallets as any);

          if (!cData || cData.length === 0) {
            const seedCats = [
              { user_id: user.id, name: 'Makanan & Minuman', type: 'expense', icon: 'utensils', color: '#f59e0b' },
              { user_id: user.id, name: 'Kost & Utilitas', type: 'expense', icon: 'home', color: '#ef4444' },
              { user_id: user.id, name: 'Transportasi', type: 'expense', icon: 'bus', color: '#3b82f6' },
              { user_id: user.id, name: 'Kuliah & Tugas', type: 'expense', icon: 'book-open', color: '#8b5cf6' },
              { user_id: user.id, name: 'Hiburan & Nongkrong', type: 'expense', icon: 'coffee', color: '#ec4899' },
              { user_id: user.id, name: 'Belanja Harian', type: 'expense', icon: 'shopping-bag', color: '#14b8a6' },
              { user_id: user.id, name: 'Uang Bulanan Ortu', type: 'income', icon: 'wallet', color: '#10b981' },
              { user_id: user.id, name: 'Gaji / Freelance', type: 'income', icon: 'briefcase', color: '#3b82f6' },
            ];
            await supabase.from('categories').insert(seedCats as any);
          }

          const [{ data: newW }, { data: newC }] = await Promise.all([
            supabase.from('wallets').select('*').order('created_at', { ascending: true }),
            supabase.from('categories').select('*').order('name', { ascending: true }),
          ]);
          setWallets((newW as Wallet[]) || DEFAULT_WALLETS);
          setCategories((newC as Category[]) || DEFAULT_CATEGORIES);
        } catch {
          setWallets(DEFAULT_WALLETS);
          setCategories(DEFAULT_CATEGORIES);
        }
      } else {
        setWallets((wData as Wallet[]) || []);
        setCategories((cData as Category[]) || []);
      }

      setTransactions((tData as Transaction[]) || []);
      setBudgets((bData as Budget[]) || []);
      setSavingsGoals((gData as SavingsGoal[]) || []);
      setCommitments((rData as RecurringCommitment[]) || []);
    } catch (err) {
      console.error('Failed to load finance data from Supabase, falling back to defaults:', err);
      setWallets(DEFAULT_WALLETS);
      setCategories(DEFAULT_CATEGORIES);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, isDemoUser, isConfigured, cycleInfo.startDate]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Calculations within current active cycle
  const { todayExpenses, totalIncomeInCycle, totalExpenseInCycle } = useMemo(() => {
    const startStr = cycleInfo.startDate.toISOString().split('T')[0];
    const endStr = cycleInfo.endDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    let income = 0;
    let expense = 0;
    let todayExp = 0;

    transactions.forEach((tx) => {
      const isDateInCycle = tx.transaction_date >= startStr && tx.transaction_date <= endStr;
      if (isDateInCycle) {
        if (tx.type === 'income') income += Number(tx.amount);
        if (tx.type === 'expense') {
          expense += Number(tx.amount);
          if (tx.transaction_date === todayStr) {
            todayExp += Number(tx.amount);
          }
        }
      }
    });

    return {
      todayExpenses: todayExp,
      totalIncomeInCycle: income,
      totalExpenseInCycle: expense,
    };
  }, [transactions, cycleInfo]);

  // Total allocated budget in current period
  const totalBudget = useMemo(() => {
    return budgets.reduce((acc, b) => acc + Number(b.amount), 0);
  }, [budgets]);

  // Total current balance across all active wallets
  const totalBalance = useMemo(() => {
    return wallets.filter((w) => w.is_active).reduce((acc, w) => acc + Number(w.balance), 0);
  }, [wallets]);

  // Total unpaid recurring commitments (bills like Kost, Wifi)
  const totalUnpaidCommitments = useMemo(() => {
    return commitments.filter((c) => !c.is_paid).reduce((acc, c) => acc + Number(c.amount), 0);
  }, [commitments]);

  // Safe to Spend calculation
  const safeToSpend = useMemo(() => {
    // If user has not set any budget categories, fall back to current balance as reference budget
    const effectiveBudget = totalBudget > 0 ? totalBudget : totalBalance + totalExpenseInCycle;

    return calculateSafeToSpend({
      totalBudget: effectiveBudget,
      totalExpenses: totalExpenseInCycle,
      totalSavingsAllocated: 0,
      totalUnpaidCommitments,
      todayExpenses,
      cycleStartDay,
    });
  }, [totalBudget, totalBalance, totalExpenseInCycle, totalUnpaidCommitments, todayExpenses, cycleStartDay]);

  // Actions
  const addTransaction = async (params: {
    type: TransactionType;
    amount: number;
    walletId: string;
    categoryId?: string;
    destinationWalletId?: string;
    goalId?: string;
    note?: string;
    transactionDate?: string;
  }) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const txDate = params.transactionDate || todayStr;

    if (isDemoUser || !isConfigured || !user) {
      const newTx: Transaction = {
        id: 'tx-' + Date.now(),
        user_id: 'demo',
        wallet_id: params.walletId,
        category_id: params.categoryId || null,
        goal_id: params.goalId || null,
        type: params.type,
        amount: params.amount,
        transaction_date: txDate,
        destination_wallet_id: params.destinationWalletId || null,
        note: params.note || null,
        created_at: new Date().toISOString(),
      };

      // update wallets in demo state
      setWallets((prev) =>
        prev.map((w) => {
          if (w.id === params.walletId) {
            if (params.type === 'income') return { ...w, balance: w.balance + params.amount };
            if (params.type === 'expense' || params.type === 'transfer') return { ...w, balance: w.balance - params.amount };
          }
          if (params.type === 'transfer' && w.id === params.destinationWalletId) {
            return { ...w, balance: w.balance + params.amount };
          }
          return w;
        })
      );

      // update goal if applicable
      if (params.goalId) {
        if (params.type === 'expense') {
          setSavingsGoals((prev) =>
            prev.map((g) => (g.id === params.goalId ? { ...g, current_amount: g.current_amount + params.amount } : g))
          );
        } else if (params.type === 'income') {
          setSavingsGoals((prev) =>
            prev.map((g) => (g.id === params.goalId ? { ...g, current_amount: Math.max(0, g.current_amount - params.amount) } : g))
          );
        }
      }

      const updatedTx = [newTx, ...transactions];
      setTransactions(updatedTx);
      localStorage.setItem('demo_transactions', JSON.stringify(updatedTx));
      return { error: null };
    }

    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        wallet_id: params.walletId,
        category_id: params.categoryId || null,
        goal_id: params.goalId || null,
        type: params.type,
        amount: params.amount,
        transaction_date: txDate,
        destination_wallet_id: params.destinationWalletId || null,
        note: params.note || null,
      });

      if (error) throw error;

      await refreshData();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const deleteTransaction = async (id: string) => {
    if (isDemoUser || !isConfigured || !user) {
      const tx = transactions.find((t) => t.id === id);
      if (tx) {
        setWallets((prev) =>
          prev.map((w) => {
            if (w.id === tx.wallet_id) {
              if (tx.type === 'income') return { ...w, balance: w.balance - tx.amount };
              if (tx.type === 'expense' || tx.type === 'transfer') return { ...w, balance: w.balance + tx.amount };
            }
            if (tx.type === 'transfer' && w.id === tx.destination_wallet_id) {
              return { ...w, balance: w.balance - tx.amount };
            }
            return w;
          })
        );
      }
      const updated = transactions.filter((t) => t.id !== id);
      setTransactions(updated);
      localStorage.setItem('demo_transactions', JSON.stringify(updated));
      return { error: null };
    }

    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const addWallet = async (params: { name: string; wallet_type: WalletType; balance: number; color?: string; icon?: string }) => {
    if (isDemoUser || !isConfigured || !user) {
      const newWallet: Wallet = {
        id: 'w-' + Date.now(),
        user_id: 'demo',
        name: params.name,
        wallet_type: params.wallet_type,
        balance: params.balance,
        color: params.color || '#3b82f6',
        icon: params.icon || 'wallet',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updated = [...wallets, newWallet];
      setWallets(updated);
      localStorage.setItem('demo_wallets', JSON.stringify(updated));
      return { error: null };
    }

    try {
      const { error } = await supabase.from('wallets').insert({
        user_id: user.id,
        name: params.name,
        wallet_type: params.wallet_type,
        balance: params.balance,
        color: params.color || '#3b82f6',
        icon: params.icon || 'wallet',
      });
      if (error) throw error;
      await refreshData();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const updateWallet = async (id: string, updates: Partial<Wallet>) => {
    if (isDemoUser || !isConfigured || !user) {
      const updated = wallets.map((w) => (w.id === id ? { ...w, ...updates } : w));
      setWallets(updated);
      localStorage.setItem('demo_wallets', JSON.stringify(updated));
      return { error: null };
    }

    try {
      const { error } = await supabase.from('wallets').update(updates).eq('id', id);
      if (error) throw error;
      await refreshData();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const deleteWallet = async (id: string) => {
    if (isDemoUser || !isConfigured || !user) {
      const updated = wallets.filter((w) => w.id !== id);
      setWallets(updated);
      localStorage.setItem('demo_wallets', JSON.stringify(updated));
      return { error: null };
    }

    try {
      const { error } = await supabase.from('wallets').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const addCategory = async (params: { name: string; type: CategoryType; color?: string; icon?: string }) => {
    if (isDemoUser || !isConfigured || !user) {
      const newCat: Category = {
        id: 'cat-' + Date.now(),
        user_id: 'demo',
        name: params.name,
        type: params.type,
        color: params.color || '#6366f1',
        icon: params.icon || 'tag',
        created_at: new Date().toISOString(),
      };
      const updated = [...categories, newCat];
      setCategories(updated);
      localStorage.setItem('demo_categories', JSON.stringify(updated));
      return { error: null };
    }

    try {
      const { error } = await supabase.from('categories').insert({
        user_id: user.id,
        name: params.name,
        type: params.type,
        color: params.color || '#6366f1',
        icon: params.icon || 'tag',
      });
      if (error) throw error;
      await refreshData();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const deleteCategory = async (id: string) => {
    if (isDemoUser || !isConfigured || !user) {
      const updated = categories.filter((c) => c.id !== id);
      setCategories(updated);
      localStorage.setItem('demo_categories', JSON.stringify(updated));
      return { error: null };
    }

    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const setCategoryBudget = async (categoryId: string, amount: number) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    if (isDemoUser || !isConfigured || !user) {
      const existing = budgets.findIndex((b) => b.category_id === categoryId);
      let updated: Budget[];
      if (existing >= 0) {
        updated = budgets.map((b, idx) => (idx === existing ? { ...b, amount } : b));
      } else {
        const newBudget: Budget = {
          id: 'b-' + Date.now(),
          user_id: 'demo',
          category_id: categoryId,
          amount,
          period_month: currentMonth,
          period_year: currentYear,
          created_at: new Date().toISOString(),
        };
        updated = [...budgets, newBudget];
      }
      setBudgets(updated);
      localStorage.setItem('demo_budgets', JSON.stringify(updated));
      return { error: null };
    }

    try {
      const { error } = await supabase.from('budgets').upsert(
        {
          user_id: user.id,
          category_id: categoryId,
          amount,
          period_month: currentMonth,
          period_year: currentYear,
        },
        { onConflict: 'user_id, category_id, period_month, period_year' }
      );
      if (error) throw error;
      await refreshData();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const addSavingsGoal = async (params: { name: string; target_amount: number; target_date?: string; color?: string }) => {
    if (isDemoUser || !isConfigured || !user) {
      const newGoal: SavingsGoal = {
        id: 'goal-' + Date.now(),
        user_id: 'demo',
        name: params.name,
        target_amount: params.target_amount,
        current_amount: 0,
        target_date: params.target_date || null,
        icon: 'target',
        color: params.color || '#10b981',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updated = [...savingsGoals, newGoal];
      setSavingsGoals(updated);
      localStorage.setItem('demo_goals', JSON.stringify(updated));
      return { error: null };
    }

    try {
      const { error } = await supabase.from('savings_goals').insert({
        user_id: user.id,
        name: params.name,
        target_amount: params.target_amount,
        target_date: params.target_date || null,
        color: params.color || '#10b981',
      });
      if (error) throw error;
      await refreshData();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const allocateToGoal = async (goalId: string, walletId: string, amount: number) => {
    return addTransaction({
      type: 'expense',
      amount,
      walletId,
      goalId,
      note: 'Alokasi Tabungan',
    });
  };

  const withdrawFromGoal = async (goalId: string, walletId: string, amount: number) => {
    return addTransaction({
      type: 'income',
      amount,
      walletId,
      goalId,
      note: 'Tarik Dana Tabungan',
    });
  };

  const addCommitment = async (params: { name: string; amount: number; due_day: number; category_id?: string }) => {
    if (isDemoUser || !isConfigured || !user) {
      const newRec: RecurringCommitment = {
        id: 'rec-' + Date.now(),
        user_id: 'demo',
        name: params.name,
        amount: params.amount,
        due_day: params.due_day,
        category_id: params.category_id || null,
        is_paid: false,
        created_at: new Date().toISOString(),
      };
      const updated = [...commitments, newRec];
      setCommitments(updated);
      localStorage.setItem('demo_commitments', JSON.stringify(updated));
      return { error: null };
    }

    try {
      const { error } = await supabase.from('recurring_commitments').insert({
        user_id: user.id,
        name: params.name,
        amount: params.amount,
        due_day: params.due_day,
        category_id: params.category_id || null,
        is_paid: false,
      });
      if (error) throw error;
      await refreshData();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const deleteCommitment = async (id: string) => {
    if (isDemoUser || !isConfigured || !user) {
      const updated = commitments.filter((c) => c.id !== id);
      setCommitments(updated);
      localStorage.setItem('demo_commitments', JSON.stringify(updated));
      return { error: null };
    }

    try {
      const { error } = await supabase.from('recurring_commitments').delete().eq('id', id);
      if (error) throw error;
      await refreshData();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const payCommitment = async (commitmentId: string, walletId: string) => {
    const commitment = commitments.find((c) => c.id === commitmentId);
    if (!commitment) return { error: new Error('Tagihan tidak ditemukan') };

    const { error: txError } = await addTransaction({
      type: 'expense',
      amount: commitment.amount,
      walletId,
      categoryId: commitment.category_id || undefined,
      note: `Bayar ${commitment.name}`,
    });

    if (txError) return { error: txError };

    if (isDemoUser || !isConfigured || !user) {
      const updated = commitments.map((c) => (c.id === commitmentId ? { ...c, is_paid: true } : c));
      setCommitments(updated);
      localStorage.setItem('demo_commitments', JSON.stringify(updated));
      return { error: null };
    }

    try {
      const { error } = await supabase.from('recurring_commitments').update({ is_paid: true }).eq('id', commitmentId);
      if (error) throw error;
      await refreshData();
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const applyPresetTemplate = async (preset: 'kost' | 'home') => {
    let presetCategories: Category[];
    let presetCommitments: RecurringCommitment[];
    let presetGoals: SavingsGoal[];

    if (preset === 'kost') {
      presetCategories = [
        { id: 'cat-1', user_id: 'demo', name: 'Makanan Warteg & Kost', type: 'expense', icon: 'utensils', color: '#f59e0b', created_at: '' },
        { id: 'cat-2', user_id: 'demo', name: 'Sewa Kost & Listrik', type: 'expense', icon: 'home', color: '#ef4444', created_at: '' },
        { id: 'cat-3', user_id: 'demo', name: 'Laundry & Kebutuhan Kamar', type: 'expense', icon: 'shopping-bag', color: '#14b8a6', created_at: '' },
        { id: 'cat-4', user_id: 'demo', name: 'Transportasi Kampus', type: 'expense', icon: 'bus', color: '#3b82f6', created_at: '' },
        { id: 'cat-5', user_id: 'demo', name: 'Kuliah & Tugas', type: 'expense', icon: 'book-open', color: '#8b5cf6', created_at: '' },
        { id: 'cat-6', user_id: 'demo', name: 'Hiburan & Nongkrong', type: 'expense', icon: 'coffee', color: '#ec4899', created_at: '' },
        { id: 'cat-7', user_id: 'demo', name: 'Kiriman Uang Ortu', type: 'income', icon: 'wallet', color: '#10b981', created_at: '' },
        { id: 'cat-8', user_id: 'demo', name: 'Freelance / Sampingan', type: 'income', icon: 'briefcase', color: '#3b82f6', created_at: '' },
      ];
      presetCommitments = [
        { id: 'rec-1', user_id: 'demo', category_id: 'cat-2', name: 'Sewa Kost Bulanan', amount: 650000, due_day: 1, is_paid: false, created_at: '' },
        { id: 'rec-2', user_id: 'demo', category_id: 'cat-2', name: 'Wifi Kost & Kuota', amount: 75000, due_day: 10, is_paid: false, created_at: '' },
        { id: 'rec-3', user_id: 'demo', category_id: 'cat-3', name: 'Paket Laundry Bulanan', amount: 60000, due_day: 15, is_paid: false, created_at: '' },
      ];
      presetGoals = [
        { id: 'goal-1', user_id: 'demo', name: 'Dana Darurat Kost', target_amount: 1500000, current_amount: 500000, target_date: '2026-12-31', icon: 'shield-alert', color: '#10b981', created_at: '', updated_at: '' },
        { id: 'goal-2', user_id: 'demo', name: 'Tabungan Mudik Semester', target_amount: 1000000, current_amount: 300000, target_date: '2027-01-15', icon: 'bus', color: '#6366f1', created_at: '', updated_at: '' },
      ];
    } else {
      presetCategories = [
        { id: 'cat-1', user_id: 'demo', name: 'Makanan & Jajan Kampus', type: 'expense', icon: 'utensils', color: '#f59e0b', created_at: '' },
        { id: 'cat-2', user_id: 'demo', name: 'Bensin & Transportasi', type: 'expense', icon: 'bus', color: '#3b82f6', created_at: '' },
        { id: 'cat-3', user_id: 'demo', name: 'Kuliah & Fotokopi Buku', type: 'expense', icon: 'book-open', color: '#8b5cf6', created_at: '' },
        { id: 'cat-4', user_id: 'demo', name: 'Nongkrong & Ngopi', type: 'expense', icon: 'coffee', color: '#ec4899', created_at: '' },
        { id: 'cat-5', user_id: 'demo', name: 'Belanja Pribadi & Hobi', type: 'expense', icon: 'shopping-bag', color: '#14b8a6', created_at: '' },
        { id: 'cat-6', user_id: 'demo', name: 'Uang Saku Ortu', type: 'income', icon: 'wallet', color: '#10b981', created_at: '' },
        { id: 'cat-7', user_id: 'demo', name: 'Part-time / Gaji', type: 'income', icon: 'briefcase', color: '#3b82f6', created_at: '' },
      ];
      presetCommitments = [
        { id: 'rec-1', user_id: 'demo', category_id: 'cat-2', name: 'Paket Internet / Kuota', amount: 75000, due_day: 5, is_paid: false, created_at: '' },
        { id: 'rec-2', user_id: 'demo', category_id: 'cat-4', name: 'Spotify / Streaming', amount: 25000, due_day: 15, is_paid: true, created_at: '' },
      ];
      presetGoals = [
        { id: 'goal-1', user_id: 'demo', name: 'Beli Laptop / Gadget', target_amount: 5000000, current_amount: 800000, target_date: '2027-02-01', icon: 'laptop', color: '#6366f1', created_at: '', updated_at: '' },
        { id: 'goal-2', user_id: 'demo', name: 'Dana Kursus / Sertifikasi', target_amount: 1000000, current_amount: 200000, target_date: '2026-12-01', icon: 'award', color: '#10b981', created_at: '', updated_at: '' },
      ];
    }

    setCategories(presetCategories);
    setCommitments(presetCommitments);
    setSavingsGoals(presetGoals);

    localStorage.setItem('demo_categories', JSON.stringify(presetCategories));
    localStorage.setItem('demo_commitments', JSON.stringify(presetCommitments));
    localStorage.setItem('demo_goals', JSON.stringify(presetGoals));
  };

  const contextValue = useMemo(
    () => ({
      wallets,
      categories,
      transactions,
      budgets,
      savingsGoals,
      commitments,
      isLoading,
      cycleInfo,
      safeToSpend,
      totalBalance,
      totalIncomeInCycle,
      totalExpenseInCycle,
      totalUnpaidCommitments,
      addTransaction,
      deleteTransaction,
      addWallet,
      updateWallet,
      deleteWallet,
      addCategory,
      deleteCategory,
      setCategoryBudget,
      addSavingsGoal,
      allocateToGoal,
      withdrawFromGoal,
      addCommitment,
      deleteCommitment,
      payCommitment,
      applyPresetTemplate,
      refreshData,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      wallets,
      categories,
      transactions,
      budgets,
      savingsGoals,
      commitments,
      isLoading,
      cycleInfo,
      safeToSpend,
      totalBalance,
      totalIncomeInCycle,
      totalExpenseInCycle,
      totalUnpaidCommitments,
    ]
  );

  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
