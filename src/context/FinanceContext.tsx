import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Wallet, Category, Transaction, Budget, SavingsGoal, TransactionType, WalletType, CategoryType, RecurringCommitment } from '../types/database.types';
import { getCycleInfo, calculateSafeToSpend, type SafeToSpendCalculation, type CycleInfo } from '../lib/budget-cycle';
import { getLocalDateString } from '../lib/formatters';

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

// Valid UUIDs for seamless compatibility with PostgreSQL schema & LocalStorage
const DEFAULT_WALLETS: Wallet[] = [
  { id: '11111111-1111-4111-8111-111111111111', user_id: 'demo', name: 'Uang Tunai (Cash)', wallet_type: 'cash', balance: 380000, icon: 'banknote', color: '#10b981', is_active: true, created_at: '', updated_at: '' },
  { id: '22222222-2222-4222-8222-222222222222', user_id: 'demo', name: 'BCA / Bank Utama', wallet_type: 'bank', balance: 1850000, icon: 'landmark', color: '#3b82f6', is_active: true, created_at: '', updated_at: '' },
  { id: '33333333-3333-4333-8333-333333333333', user_id: 'demo', name: 'GoPay / E-Wallet', wallet_type: 'ewallet', balance: 620000, icon: 'smartphone', color: '#8b5cf6', is_active: true, created_at: '', updated_at: '' },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c1111111-1111-4111-8111-111111111111', user_id: 'demo', name: 'Makanan & Minuman', type: 'expense', icon: 'utensils', color: '#2563eb', created_at: '' },
  { id: 'c2222222-2222-4222-8222-222222222222', user_id: 'demo', name: 'Kos & Kebutuhan', type: 'expense', icon: 'home', color: '#10b981', created_at: '' },
  { id: 'c3333333-3333-4333-8333-333333333333', user_id: 'demo', name: 'Transportasi & Bensin', type: 'expense', icon: 'bus', color: '#f59e0b', created_at: '' },
  { id: 'c4444444-4444-4444-8444-444444444444', user_id: 'demo', name: 'Kuliah & Tugas', type: 'expense', icon: 'book-open', color: '#8b5cf6', created_at: '' },
  { id: 'c5555555-5555-4555-8555-555555555555', user_id: 'demo', name: 'Hiburan & Kuliah', type: 'expense', icon: 'coffee', color: '#94a3b8', created_at: '' },
  { id: 'c6666666-6666-4666-8666-666666666666', user_id: 'demo', name: 'Belanja Harian', type: 'expense', icon: 'shopping-bag', color: '#14b8a6', created_at: '' },
  { id: 'c7777777-7777-4777-8777-777777777777', user_id: 'demo', name: 'Uang Bulanan Ortu', type: 'income', icon: 'wallet', color: '#10b981', created_at: '' },
  { id: 'c8888888-8888-4888-8888-888888888888', user_id: 'demo', name: 'Gaji / Freelance', type: 'income', icon: 'briefcase', color: '#3b82f6', created_at: '' },
  { id: 'c9999999-9999-4999-8999-999999999999', user_id: 'demo', name: 'Beasiswa & Lomba', type: 'income', icon: 'award', color: '#f59e0b', created_at: '' },
];

const DEFAULT_GOALS: SavingsGoal[] = [
  { id: 'g1111111-1111-4111-8111-111111111111', user_id: 'demo', name: 'Dana Darurat Kost', target_amount: 1500000, current_amount: 600000, target_date: '2026-12-31', icon: 'shield-alert', color: '#10b981', created_at: '', updated_at: '' },
  { id: 'g2222222-2222-4222-8222-222222222222', user_id: 'demo', name: 'Upgrade Laptop / Gadget', target_amount: 5000000, current_amount: 1200000, target_date: '2027-02-01', icon: 'laptop', color: '#6366f1', created_at: '', updated_at: '' },
];

const DEFAULT_BUDGETS: Budget[] = [
  { id: 'b1111111-1111-4111-8111-111111111111', user_id: 'demo', category_id: 'c1111111-1111-4111-8111-111111111111', amount: 1000000, period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), created_at: '' },
  { id: 'b2222222-2222-4222-8222-222222222222', user_id: 'demo', category_id: 'c2222222-2222-4222-8222-222222222222', amount: 500000, period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), created_at: '' },
  { id: 'b3333333-3333-4333-8333-333333333333', user_id: 'demo', category_id: 'c3333333-3333-4333-8333-333333333333', amount: 400000, period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), created_at: '' },
  { id: 'b4444444-4444-4444-8444-444444444444', user_id: 'demo', category_id: 'c5555555-5555-4555-8555-555555555555', amount: 600000, period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), created_at: '' },
];

const DEFAULT_COMMITMENTS: RecurringCommitment[] = [
  { id: 'rec-1', user_id: 'demo', category_id: 'c2222222-2222-4222-8222-222222222222', name: 'Sewa Kost Bulanan', amount: 650000, due_day: 1, is_paid: false, created_at: '' },
  { id: 'rec-2', user_id: 'demo', category_id: 'c2222222-2222-4222-8222-222222222222', name: 'Wifi & Kuota Kampus', amount: 75000, due_day: 10, is_paid: false, created_at: '' },
  { id: 'rec-3', user_id: 'demo', category_id: 'c5555555-5555-4555-8555-555555555555', name: 'Spotify / YouTube Music', amount: 25000, due_day: 15, is_paid: true, created_at: '' },
];

function generateStarterTransactions(cycleStartDate: Date, userId: string = 'demo'): Transaction[] {
  const start = new Date(cycleStartDate);
  const formatDate = (dayOffset: number) => {
    const d = new Date(start);
    d.setDate(d.getDate() + dayOffset);
    return getLocalDateString(d);
  };

  return [
    {
      id: 'tx-1',
      user_id: userId,
      wallet_id: '22222222-2222-4222-8222-222222222222',
      category_id: 'c7777777-7777-4777-8777-777777777777',
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
      wallet_id: '22222222-2222-4222-8222-222222222222',
      category_id: 'c2222222-2222-4222-8222-222222222222',
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
      wallet_id: '33333333-3333-4333-8333-333333333333',
      category_id: 'c1111111-1111-4111-8111-111111111111',
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
      wallet_id: '11111111-1111-4111-8111-111111111111',
      category_id: 'c3333333-3333-4333-8333-333333333333',
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
      wallet_id: '33333333-3333-4333-8333-333333333333',
      category_id: 'c1111111-1111-4111-8111-111111111111',
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
      wallet_id: '22222222-2222-4222-8222-222222222222',
      category_id: 'c4444444-4444-4444-8444-444444444444',
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
      wallet_id: '11111111-1111-4111-8111-111111111111',
      category_id: 'c1111111-1111-4111-8111-111111111111',
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
      wallet_id: '33333333-3333-4333-8333-333333333333',
      category_id: 'c5555555-5555-4555-8555-555555555555',
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
      wallet_id: '22222222-2222-4222-8222-222222222222',
      category_id: 'c6666666-6666-4666-8666-666666666666',
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
      wallet_id: '22222222-2222-4222-8222-222222222222',
      category_id: null,
      goal_id: 'g2222222-2222-4222-8222-222222222222',
      type: 'transfer',
      amount: 200000,
      transaction_date: formatDate(17),
      destination_wallet_id: '33333333-3333-4333-8333-333333333333',
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
        console.warn('Supabase query note:', wErr || cErr);
      }

      // If user has Supabase data, load it; if tables are empty/new, initialize them gracefully
      if (wData && wData.length > 0) {
        setWallets(wData as Wallet[]);
      } else {
        setWallets(DEFAULT_WALLETS);
      }

      if (cData && cData.length > 0) {
        setCategories(cData as Category[]);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }

      if (tData && tData.length > 0) {
        setTransactions(tData as Transaction[]);
      } else {
        setTransactions(generateStarterTransactions(cycleInfo.startDate, user.id));
      }

      setBudgets((bData as Budget[]) || DEFAULT_BUDGETS);
      setSavingsGoals((gData as SavingsGoal[]) || DEFAULT_GOALS);
      setCommitments((rData as RecurringCommitment[]) || DEFAULT_COMMITMENTS);
    } catch (err) {
      console.error('Failed to load finance data from Supabase, falling back to starter data:', err);
      setWallets(DEFAULT_WALLETS);
      setCategories(DEFAULT_CATEGORIES);
      setTransactions(generateStarterTransactions(cycleInfo.startDate));
      setBudgets(DEFAULT_BUDGETS);
      setSavingsGoals(DEFAULT_GOALS);
      setCommitments(DEFAULT_COMMITMENTS);
    } finally {
      setIsLoading(false);
    }
  }, [user, isDemoUser, isConfigured, cycleInfo.startDate]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Calculations within current active cycle using Local Date String to avoid UTC shifts
  const { todayExpenses, totalIncomeInCycle, totalExpenseInCycle } = useMemo(() => {
    const startStr = getLocalDateString(cycleInfo.startDate);
    const endStr = getLocalDateString(cycleInfo.endDate);
    const todayStr = getLocalDateString(new Date());

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

  // Actions - Enhanced with 100% Guaranteed Instant Optimistic Updates
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
    const txDate = params.transactionDate || getLocalDateString(new Date());
    const newTxId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'tx-' + Date.now();

    const newTx: Transaction = {
      id: newTxId,
      user_id: user?.id || 'demo',
      wallet_id: params.walletId,
      category_id: params.categoryId || null,
      goal_id: params.goalId || null,
      type: params.type,
      amount: Number(params.amount),
      transaction_date: txDate,
      destination_wallet_id: params.destinationWalletId || null,
      note: params.note || null,
      created_at: new Date().toISOString(),
    };

    // 1. Instant Optimistic State Update
    setTransactions((prev) => [newTx, ...prev]);

    setWallets((prev) =>
      prev.map((w) => {
        if (w.id === params.walletId) {
          if (params.type === 'income') return { ...w, balance: Number(w.balance) + Number(params.amount) };
          if (params.type === 'expense' || params.type === 'transfer') return { ...w, balance: Math.max(0, Number(w.balance) - Number(params.amount)) };
        }
        if (params.type === 'transfer' && w.id === params.destinationWalletId) {
          return { ...w, balance: Number(w.balance) + Number(params.amount) };
        }
        return w;
      })
    );

    if (params.goalId) {
      if (params.type === 'expense') {
        setSavingsGoals((prev) =>
          prev.map((g) => (g.id === params.goalId ? { ...g, current_amount: Number(g.current_amount) + Number(params.amount) } : g))
        );
      } else if (params.type === 'income') {
        setSavingsGoals((prev) =>
          prev.map((g) => (g.id === params.goalId ? { ...g, current_amount: Math.max(0, Number(g.current_amount) - Number(params.amount)) } : g))
        );
      }
    }

    // Always mirror to localStorage
    try {
      const stored = localStorage.getItem('demo_transactions');
      const prevList = stored ? JSON.parse(stored) : transactions;
      localStorage.setItem('demo_transactions', JSON.stringify([newTx, ...prevList]));
    } catch {
      // ignore
    }

    // 2. Background Sync to Supabase if authenticated with valid UUID
    if (user && isConfigured) {
      const isValidUuid = (str?: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

      if (isValidUuid(params.walletId)) {
        try {
          const payload: any = {
            user_id: user.id,
            wallet_id: params.walletId,
            type: params.type,
            amount: Number(params.amount),
            transaction_date: txDate,
            note: params.note || null,
          };
          if (isValidUuid(params.categoryId)) payload.category_id = params.categoryId;
          if (isValidUuid(params.destinationWalletId)) payload.destination_wallet_id = params.destinationWalletId;
          if (isValidUuid(params.goalId)) payload.goal_id = params.goalId;

          const { error } = await supabase.from('transactions').insert(payload);
          if (error) {
            console.warn('Supabase background insert note:', error.message);
          }
        } catch (err) {
          console.warn('Supabase background sync note:', err);
        }
      }
    }

    return { error: null };
  };

  const deleteTransaction = async (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (tx) {
      setWallets((prev) =>
        prev.map((w) => {
          if (w.id === tx.wallet_id) {
            if (tx.type === 'income') return { ...w, balance: Number(w.balance) - Number(tx.amount) };
            if (tx.type === 'expense' || tx.type === 'transfer') return { ...w, balance: Number(w.balance) + Number(tx.amount) };
          }
          if (tx.type === 'transfer' && w.id === tx.destination_wallet_id) {
            return { ...w, balance: Number(w.balance) - Number(tx.amount) };
          }
          return w;
        })
      );
    }
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    try {
      localStorage.setItem('demo_transactions', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (user && isConfigured) {
      const isValidUuid = (str?: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      if (isValidUuid(id)) {
        try {
          await supabase.from('transactions').delete().eq('id', id);
        } catch {
          // ignore
        }
      }
    }

    return { error: null };
  };

  const addWallet = async (params: { name: string; wallet_type: WalletType; balance: number; color?: string; icon?: string }) => {
    const newWalletId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'w-' + Date.now();
    const newWallet: Wallet = {
      id: newWalletId,
      user_id: user?.id || 'demo',
      name: params.name,
      wallet_type: params.wallet_type,
      balance: Number(params.balance),
      color: params.color || '#3b82f6',
      icon: params.icon || 'wallet',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const updated = [...wallets, newWallet];
    setWallets(updated);
    try {
      localStorage.setItem('demo_wallets', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (user && isConfigured) {
      try {
        await supabase.from('wallets').insert({
          user_id: user.id,
          name: params.name,
          wallet_type: params.wallet_type,
          balance: Number(params.balance),
          color: params.color || '#3b82f6',
          icon: params.icon || 'wallet',
        });
      } catch {
        // ignore
      }
    }

    return { error: null };
  };

  const updateWallet = async (id: string, updates: Partial<Wallet>) => {
    const updated = wallets.map((w) => (w.id === id ? { ...w, ...updates } : w));
    setWallets(updated);
    try {
      localStorage.setItem('demo_wallets', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (user && isConfigured) {
      const isValidUuid = (str?: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      if (isValidUuid(id)) {
        try {
          await supabase.from('wallets').update(updates).eq('id', id);
        } catch {
          // ignore
        }
      }
    }

    return { error: null };
  };

  const deleteWallet = async (id: string) => {
    const updated = wallets.filter((w) => w.id !== id);
    setWallets(updated);
    try {
      localStorage.setItem('demo_wallets', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (user && isConfigured) {
      const isValidUuid = (str?: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      if (isValidUuid(id)) {
        try {
          await supabase.from('wallets').delete().eq('id', id);
        } catch {
          // ignore
        }
      }
    }

    return { error: null };
  };

  const addCategory = async (params: { name: string; type: CategoryType; color?: string; icon?: string }) => {
    const newCatId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'cat-' + Date.now();
    const newCat: Category = {
      id: newCatId,
      user_id: user?.id || 'demo',
      name: params.name,
      type: params.type,
      color: params.color || '#6366f1',
      icon: params.icon || 'tag',
      created_at: new Date().toISOString(),
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    try {
      localStorage.setItem('demo_categories', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (user && isConfigured) {
      try {
        await supabase.from('categories').insert({
          user_id: user.id,
          name: params.name,
          type: params.type,
          color: params.color || '#6366f1',
          icon: params.icon || 'tag',
        });
      } catch {
        // ignore
      }
    }

    return { error: null };
  };

  const deleteCategory = async (id: string) => {
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    try {
      localStorage.setItem('demo_categories', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (user && isConfigured) {
      const isValidUuid = (str?: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      if (isValidUuid(id)) {
        try {
          await supabase.from('categories').delete().eq('id', id);
        } catch {
          // ignore
        }
      }
    }

    return { error: null };
  };

  const setCategoryBudget = async (categoryId: string, amount: number) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const existing = budgets.findIndex((b) => b.category_id === categoryId);
    let updated: Budget[];
    if (existing >= 0) {
      updated = budgets.map((b, idx) => (idx === existing ? { ...b, amount } : b));
    } else {
      const newBudgetId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'b-' + Date.now();
      const newBudget: Budget = {
        id: newBudgetId,
        user_id: user?.id || 'demo',
        category_id: categoryId,
        amount,
        period_month: currentMonth,
        period_year: currentYear,
        created_at: new Date().toISOString(),
      };
      updated = [...budgets, newBudget];
    }
    setBudgets(updated);
    try {
      localStorage.setItem('demo_budgets', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (user && isConfigured) {
      const isValidUuid = (str?: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      if (isValidUuid(categoryId)) {
        try {
          await supabase.from('budgets').upsert(
            {
              user_id: user.id,
              category_id: categoryId,
              amount,
              period_month: currentMonth,
              period_year: currentYear,
            },
            { onConflict: 'user_id, category_id, period_month, period_year' }
          );
        } catch {
          // ignore
        }
      }
    }

    return { error: null };
  };

  const addSavingsGoal = async (params: { name: string; target_amount: number; target_date?: string; color?: string }) => {
    const newGoalId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'goal-' + Date.now();
    const newGoal: SavingsGoal = {
      id: newGoalId,
      user_id: user?.id || 'demo',
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
    try {
      localStorage.setItem('demo_goals', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (user && isConfigured) {
      try {
        await supabase.from('savings_goals').insert({
          user_id: user.id,
          name: params.name,
          target_amount: params.target_amount,
          target_date: params.target_date || null,
          color: params.color || '#10b981',
        });
      } catch {
        // ignore
      }
    }

    return { error: null };
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
    const newRecId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'rec-' + Date.now();
    const newRec: RecurringCommitment = {
      id: newRecId,
      user_id: user?.id || 'demo',
      name: params.name,
      amount: params.amount,
      due_day: params.due_day,
      category_id: params.category_id || null,
      is_paid: false,
      created_at: new Date().toISOString(),
    };
    const updated = [...commitments, newRec];
    setCommitments(updated);
    try {
      localStorage.setItem('demo_commitments', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (user && isConfigured) {
      try {
        await supabase.from('recurring_commitments').insert({
          user_id: user.id,
          name: params.name,
          amount: params.amount,
          due_day: params.due_day,
          category_id: params.category_id || null,
          is_paid: false,
        });
      } catch {
        // ignore
      }
    }

    return { error: null };
  };

  const deleteCommitment = async (id: string) => {
    const updated = commitments.filter((c) => c.id !== id);
    setCommitments(updated);
    try {
      localStorage.setItem('demo_commitments', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (user && isConfigured) {
      const isValidUuid = (str?: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      if (isValidUuid(id)) {
        try {
          await supabase.from('recurring_commitments').delete().eq('id', id);
        } catch {
          // ignore
        }
      }
    }

    return { error: null };
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

    const updated = commitments.map((c) => (c.id === commitmentId ? { ...c, is_paid: true } : c));
    setCommitments(updated);
    try {
      localStorage.setItem('demo_commitments', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (user && isConfigured) {
      const isValidUuid = (str?: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      if (isValidUuid(commitmentId)) {
        try {
          await supabase.from('recurring_commitments').update({ is_paid: true }).eq('id', commitmentId);
        } catch {
          // ignore
        }
      }
    }

    return { error: null };
  };

  const applyPresetTemplate = async (preset: 'kost' | 'home') => {
    let presetCategories: Category[];
    let presetCommitments: RecurringCommitment[];
    let presetGoals: SavingsGoal[];

    if (preset === 'kost') {
      presetCategories = [
        { id: 'c1111111-1111-4111-8111-111111111111', user_id: 'demo', name: 'Makanan Warteg & Kost', type: 'expense', icon: 'utensils', color: '#2563eb', created_at: '' },
        { id: 'c2222222-2222-4222-8222-222222222222', user_id: 'demo', name: 'Sewa Kost & Listrik', type: 'expense', icon: 'home', color: '#10b981', created_at: '' },
        { id: 'c3333333-3333-4333-8333-333333333333', user_id: 'demo', name: 'Laundry & Kebutuhan Kamar', type: 'expense', icon: 'shopping-bag', color: '#14b8a6', created_at: '' },
        { id: 'c4444444-4444-4444-8444-444444444444', user_id: 'demo', name: 'Transportasi Kampus', type: 'expense', icon: 'bus', color: '#f59e0b', created_at: '' },
        { id: 'c5555555-5555-4555-8555-555555555555', user_id: 'demo', name: 'Kuliah & Tugas', type: 'expense', icon: 'book-open', color: '#8b5cf6', created_at: '' },
        { id: 'c6666666-6666-4666-8666-666666666666', user_id: 'demo', name: 'Hiburan & Nongkrong', type: 'expense', icon: 'coffee', color: '#ec4899', created_at: '' },
        { id: 'c7777777-7777-4777-8777-777777777777', user_id: 'demo', name: 'Kiriman Uang Ortu', type: 'income', icon: 'wallet', color: '#10b981', created_at: '' },
        { id: 'c8888888-8888-4888-8888-888888888888', user_id: 'demo', name: 'Freelance / Sampingan', type: 'income', icon: 'briefcase', color: '#3b82f6', created_at: '' },
      ];
      presetCommitments = [
        { id: 'rec-1', user_id: 'demo', category_id: 'c2222222-2222-4222-8222-222222222222', name: 'Sewa Kost Bulanan', amount: 650000, due_day: 1, is_paid: false, created_at: '' },
        { id: 'rec-2', user_id: 'demo', category_id: 'c2222222-2222-4222-8222-222222222222', name: 'Wifi Kost & Kuota', amount: 75000, due_day: 10, is_paid: false, created_at: '' },
        { id: 'rec-3', user_id: 'demo', category_id: 'c3333333-3333-4333-8333-333333333333', name: 'Paket Laundry Bulanan', amount: 60000, due_day: 15, is_paid: false, created_at: '' },
      ];
      presetGoals = [
        { id: 'g1111111-1111-4111-8111-111111111111', user_id: 'demo', name: 'Dana Darurat Kost', target_amount: 1500000, current_amount: 500000, target_date: '2026-12-31', icon: 'shield-alert', color: '#10b981', created_at: '', updated_at: '' },
        { id: 'g2222222-2222-4222-8222-222222222222', user_id: 'demo', name: 'Tabungan Mudik Semester', target_amount: 1000000, current_amount: 300000, target_date: '2027-01-15', icon: 'bus', color: '#6366f1', created_at: '', updated_at: '' },
      ];
    } else {
      presetCategories = [
        { id: 'c1111111-1111-4111-8111-111111111111', user_id: 'demo', name: 'Makanan & Jajan Kampus', type: 'expense', icon: 'utensils', color: '#2563eb', created_at: '' },
        { id: 'c2222222-2222-4222-8222-222222222222', user_id: 'demo', name: 'Bensin & Transportasi', type: 'expense', icon: 'bus', color: '#f59e0b', created_at: '' },
        { id: 'c3333333-3333-4333-8333-333333333333', user_id: 'demo', name: 'Kuliah & Fotokopi Buku', type: 'expense', icon: 'book-open', color: '#8b5cf6', created_at: '' },
        { id: 'c4444444-4444-4444-8444-444444444444', user_id: 'demo', name: 'Nongkrong & Ngopi', type: 'expense', icon: 'coffee', color: '#94a3b8', created_at: '' },
        { id: 'c5555555-5555-4555-8555-555555555555', user_id: 'demo', name: 'Belanja Pribadi & Hobi', type: 'expense', icon: 'shopping-bag', color: '#14b8a6', created_at: '' },
        { id: 'c6666666-6666-4666-8666-666666666666', user_id: 'demo', name: 'Uang Saku Ortu', type: 'income', icon: 'wallet', color: '#10b981', created_at: '' },
        { id: 'c7777777-7777-4777-8777-777777777777', user_id: 'demo', name: 'Part-time / Gaji', type: 'income', icon: 'briefcase', color: '#3b82f6', created_at: '' },
      ];
      presetCommitments = [
        { id: 'rec-1', user_id: 'demo', category_id: 'c2222222-2222-4222-8222-222222222222', name: 'Paket Internet / Kuota', amount: 75000, due_day: 5, is_paid: false, created_at: '' },
        { id: 'rec-2', user_id: 'demo', category_id: 'c4444444-4444-4444-8444-444444444444', name: 'Spotify / Streaming', amount: 25000, due_day: 15, is_paid: true, created_at: '' },
      ];
      presetGoals = [
        { id: 'g1111111-1111-4111-8111-111111111111', user_id: 'demo', name: 'Beli Laptop / Gadget', target_amount: 5000000, current_amount: 800000, target_date: '2027-02-01', icon: 'laptop', color: '#6366f1', created_at: '', updated_at: '' },
        { id: 'g2222222-2222-4222-8222-222222222222', user_id: 'demo', name: 'Dana Kursus / Sertifikasi', target_amount: 1000000, current_amount: 200000, target_date: '2026-12-01', icon: 'award', color: '#10b981', created_at: '', updated_at: '' },
      ];
    }

    setCategories(presetCategories);
    setCommitments(presetCommitments);
    setSavingsGoals(presetGoals);

    try {
      localStorage.setItem('demo_categories', JSON.stringify(presetCategories));
      localStorage.setItem('demo_commitments', JSON.stringify(presetCommitments));
      localStorage.setItem('demo_goals', JSON.stringify(presetGoals));
    } catch {
      // ignore
    }
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
