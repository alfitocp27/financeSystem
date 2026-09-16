import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Wallet, Category, Transaction, Budget, SavingsGoal, TransactionType, WalletType, CategoryType, RecurringCommitment } from '../types/database.types';
import { getCycleInfo, calculateSafeToSpend, type SafeToSpendCalculation, type CycleInfo } from '../lib/budget-cycle';
import { getLocalDateString } from '../lib/formatters';
import { calculateNetSavingsAllocationInCycle } from '../lib/savings-goal-utils';

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
  updateTransaction: (id: string, updates: { note?: string; categoryId?: string }) => Promise<{ error: Error | null }>;
  correctFinancialTransaction: (params: {
    oldTransactionId: string;
    type: TransactionType;
    amount: number;
    walletId: string;
    transactionDate: string;
    destinationWalletId?: string;
    categoryId?: string;
    note?: string;
  }) => Promise<{ error: Error | null; transaction?: Transaction }>;
  addWallet: (params: { name: string; wallet_type: WalletType; balance: number; color?: string; icon?: string }) => Promise<{ error: Error | null }>;
  updateWallet: (id: string, updates: Partial<Wallet>) => Promise<{ error: Error | null }>;
  deleteWallet: (id: string) => Promise<{ error: Error | null }>;
  addCategory: (params: { name: string; type: CategoryType; color?: string; icon?: string }) => Promise<{ error: Error | null }>;
  deleteCategory: (id: string) => Promise<{ error: Error | null }>;
  setCategoryBudget: (categoryId: string, amount: number) => Promise<{ error: Error | null }>;
  addSavingsGoal: (params: { name: string; target_amount: number; target_date?: string; color?: string }) => Promise<{ error: Error | null }>;
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<{ error: Error | null }>;
  deleteSavingsGoal: (id: string) => Promise<{ error: Error | null }>;
  archiveSavingsGoal: (id: string) => Promise<{ error: Error | null }>;
  restoreSavingsGoal: (id: string) => Promise<{ error: Error | null }>;
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

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, isConfigured } = useAuth();

  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [commitments, setCommitments] = useState<RecurringCommitment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cycleStartDay = profile?.cycle_start_day ?? 25;
  const cycleInfo = useMemo(() => getCycleInfo(cycleStartDay), [cycleStartDay]);

  // Load Real Data from Supabase
  const refreshData = useCallback(async () => {
    setIsLoading(true);

    if (!user || !isConfigured) {
      setWallets([]);
      setCategories([]);
      setTransactions([]);
      setBudgets([]);
      setSavingsGoals([]);
      setCommitments([]);
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
        supabase.from('transactions').select('*').order('transaction_date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('budgets').select('*'),
        supabase.from('savings_goals').select('*').order('created_at', { ascending: true }),
        supabase.from('recurring_commitments').select('*').order('due_day', { ascending: true }),
      ]);

      if (wErr || cErr) {
        console.warn('Supabase query note:', wErr || cErr);
      }

      // Load user data strictly from database
      if (wData && wData.length > 0) {
        setWallets(wData as Wallet[]);
      } else if (user) {
        // Create initial wallets for user in Supabase with 0 balance
        const defaultStarter = [
          { user_id: user.id, name: 'Uang Tunai (Cash)', wallet_type: 'cash', balance: 0, icon: 'banknote', color: '#10b981' },
          { user_id: user.id, name: 'Rekening Bank', wallet_type: 'bank', balance: 0, icon: 'landmark', color: '#3b82f6' },
          { user_id: user.id, name: 'E-Wallet (GoPay/ShopeePay)', wallet_type: 'ewallet', balance: 0, icon: 'smartphone', color: '#8b5cf6' },
        ];
        await supabase.from('wallets').insert(defaultStarter as any);
        const { data: createdW } = await supabase.from('wallets').select('*').order('created_at', { ascending: true });
        setWallets((createdW as Wallet[]) || []);
      } else {
        setWallets(DEFAULT_WALLETS);
      }

      if (cData && cData.length > 0) {
        setCategories(cData as Category[]);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }

      setTransactions((tData as Transaction[]) || []);
      setBudgets((bData as Budget[]) || []);
      setSavingsGoals((gData as SavingsGoal[]) || []);
      setCommitments((rData as RecurringCommitment[]) || []);
    } catch (err) {
      console.error('Failed to load finance data from Supabase:', err);
      setWallets(DEFAULT_WALLETS);
      setCategories(DEFAULT_CATEGORIES);
      setTransactions([]);
      setBudgets([]);
      setSavingsGoals([]);
      setCommitments([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, isConfigured]);

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
        // Tabungan (tx.goal_id) bukan pengeluaran konsumtif dan bukan pemasukan baru!
        if (tx.type === 'income' && !tx.goal_id) income += Number(tx.amount);
        if (tx.type === 'expense' && !tx.goal_id) {
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

  // Net savings allocation in current active cycle
  const netSavingsAllocationInCycle = useMemo(() => {
    return calculateNetSavingsAllocationInCycle(transactions, cycleInfo);
  }, [transactions, cycleInfo]);

  // Safe to Spend calculation - Dual-Mode Semantics
  const safeToSpend = useMemo(() => {
    const effectiveBudget = totalBudget > 0 ? totalBudget : totalBalance + totalExpenseInCycle;
    // Jika totalBudget > 0: kurangi kapasitas belanja sesuai net alokasi tabungan siklus berjalan.
    // Jika totalBudget === 0: totalSavingsAllocated = 0 karena wallet.balance sudah berkurang (cegah double deduction).
    const effectiveSavingsAllocated = totalBudget > 0 ? netSavingsAllocationInCycle : 0;

    return calculateSafeToSpend({
      totalBudget: effectiveBudget,
      totalExpenses: totalExpenseInCycle,
      totalSavingsAllocated: effectiveSavingsAllocated,
      totalUnpaidCommitments,
      todayExpenses,
      cycleStartDay,
    });
  }, [totalBudget, totalBalance, totalExpenseInCycle, netSavingsAllocationInCycle, totalUnpaidCommitments, todayExpenses, cycleStartDay]);

  // Actions - Enhanced with Direct Supabase Persistence & State Sync
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

    // When User is authenticated, persist DIRECTLY to Supabase
    if (user && isConfigured) {
      try {
        const targetWallet = wallets.find((w) => w.id === params.walletId) || wallets[0];
        if (!targetWallet) {
          return { error: new Error('Dompet tidak ditemukan. Silakan tambahkan dompet terlebih dahulu.') };
        }

        const payload: any = {
          user_id: user.id,
          wallet_id: targetWallet.id,
          type: params.type,
          amount: Number(params.amount),
          transaction_date: txDate,
          note: params.note || null,
        };

        const targetCat = categories.find((c) => c.id === params.categoryId);
        if (targetCat) {
          payload.category_id = targetCat.id;
        }

        if (params.type === 'transfer' && params.destinationWalletId) {
          const destWallet = wallets.find((w) => w.id === params.destinationWalletId);
          if (destWallet) payload.destination_wallet_id = destWallet.id;
        }

        if (params.goalId) {
          const targetGoal = savingsGoals.find((g) => g.id === params.goalId);
          if (targetGoal) payload.goal_id = targetGoal.id;
        }

        const { data: insertedTx, error: insertError } = await supabase
          .from('transactions')
          .insert(payload)
          .select()
          .single();

        if (insertError) {
          console.error('Supabase transaction insert error:', insertError);
          return { error: insertError };
        }

        if (insertedTx) {
          setTransactions((prev) => [insertedTx as Transaction, ...prev]);

          // Sync updated wallet balances from PostgreSQL trigger
          const { data: updatedW } = await supabase.from('wallets').select('*').order('created_at', { ascending: true });
          if (updatedW && updatedW.length > 0) {
            setWallets(updatedW as Wallet[]);
          }

          // If goal affected, sync goals
          if (params.goalId) {
            const { data: updatedG } = await supabase.from('savings_goals').select('*').order('created_at', { ascending: true });
            if (updatedG) {
              setSavingsGoals(updatedG as SavingsGoal[]);
            }
          }
        }

        return { error: null };
      } catch (err: any) {
        console.error('Add transaction error:', err);
        return { error: err };
      }
    }

    // Demo / Offline Mode Fallback
    const newTxId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'tx-' + Date.now();
    const newTx: Transaction = {
      id: newTxId,
      user_id: 'demo',
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

    try {
      const stored = localStorage.getItem('demo_transactions');
      const prevList = stored ? JSON.parse(stored) : transactions;
      localStorage.setItem('demo_transactions', JSON.stringify([newTx, ...prevList]));
    } catch {
      // ignore
    }

    return { error: null };
  };

  const deleteTransaction = async (id: string) => {
    const previousTransactions = transactions;
    const previousWallets = wallets;
    const previousGoals = savingsGoals;

    const tx = transactions.find((t) => t.id === id);
    if (!tx) return { error: new Error('Transaksi tidak ditemukan.') };

    // 1. Optimistic rollback in local state immediately: saldo dikembalikan sesuai alur proses bisnis!
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    if (tx) {
      setWallets((prev) =>
        prev.map((w) => {
          if (w.id === tx.wallet_id) {
            if (tx.type === 'income') return { ...w, balance: Math.max(0, Number(w.balance) - Number(tx.amount)) };
            if (tx.type === 'expense' || tx.type === 'transfer') return { ...w, balance: Number(w.balance) + Number(tx.amount) }; // Saldo dikembalikan!
          }
          if (tx.type === 'transfer' && w.id === tx.destination_wallet_id) {
            return { ...w, balance: Math.max(0, Number(w.balance) - Number(tx.amount)) };
          }
          return w;
        })
      );

      if (tx.goal_id) {
        setSavingsGoals((prev) =>
          prev.map((g) => (g.id === tx.goal_id ? { ...g, current_amount: Math.max(0, Number(g.current_amount) - Number(tx.amount)) } : g))
        );
      }
    }

    // 2. Database Sync: Delete from Supabase & Re-fetch updated wallets
    if (user && isConfigured) {
      try {
        const { error: delError } = await supabase.from('transactions').delete().eq('id', id);
        if (delError) {
          console.error('Delete transaction error:', delError);
          // Rollback local state on database failure!
          setTransactions(previousTransactions);
          setWallets(previousWallets);
          setSavingsGoals(previousGoals);
          return { error: delError };
        }

        const [{ data: updatedW }, { data: updatedG }] = await Promise.all([
          supabase.from('wallets').select('*').order('created_at', { ascending: true }),
          supabase.from('savings_goals').select('*').order('created_at', { ascending: true }),
        ]);

        if (updatedW && updatedW.length > 0) {
          setWallets(updatedW as Wallet[]);
        }
        if (updatedG) {
          setSavingsGoals(updatedG as SavingsGoal[]);
        }
        return { error: null };
      } catch (err: any) {
        console.error('Delete transaction DB error:', err);
        setTransactions(previousTransactions);
        setWallets(previousWallets);
        setSavingsGoals(previousGoals);
        return { error: err };
      }
    }

    try {
      localStorage.setItem('demo_transactions', JSON.stringify(transactions.filter((t) => t.id !== id)));
    } catch {
      // ignore
    }

    return { error: null };
  };

  const updateTransaction = async (
    id: string,
    updates: { note?: string; categoryId?: string }
  ): Promise<{ error: Error | null }> => {
    const previousTransactions = transactions;
    const targetTx = transactions.find((t) => t.id === id);
    if (!targetTx) return { error: new Error('Transaksi tidak ditemukan.') };

    const payload: { note?: string | null; category_id?: string | null } = {};
    if (updates.note !== undefined) {
      payload.note = updates.note.trim() || null;
    }
    if (updates.categoryId !== undefined) {
      payload.category_id = updates.categoryId || null;
    }

    // 1. Optimistic update (strictly only note & category, balances never touched!)
    setTransactions((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            ...(payload.note !== undefined ? { note: payload.note } : {}),
            ...(payload.category_id !== undefined ? { category_id: payload.category_id } : {}),
          };
        }
        return t;
      })
    );

    // 2. Supabase Sync
    if (user && isConfigured) {
      try {
        const { error: updateError } = await supabase
          .from('transactions')
          .update(payload)
          .eq('id', id);

        if (updateError) {
          console.error('Update transaction Supabase error:', updateError);
          setTransactions(previousTransactions);
          return { error: updateError };
        }
        return { error: null };
      } catch (err: any) {
        console.error('Update transaction error:', err);
        setTransactions(previousTransactions);
        return { error: err };
      }
    }

    // Demo Mode Sync
    try {
      const updatedList = transactions.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            ...(payload.note !== undefined ? { note: payload.note } : {}),
            ...(payload.category_id !== undefined ? { category_id: payload.category_id } : {}),
          };
        }
        return t;
      });
      localStorage.setItem('demo_transactions', JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    return { error: null };
  };

  const correctFinancialTransaction = async (params: {
    oldTransactionId: string;
    type: TransactionType;
    amount: number;
    walletId: string;
    transactionDate: string;
    destinationWalletId?: string;
    categoryId?: string;
    note?: string;
  }): Promise<{ error: Error | null; transaction?: Transaction }> => {
    const oldTx = transactions.find((t) => t.id === params.oldTransactionId);
    if (!oldTx) {
      return { error: new Error('Transaksi lama tidak ditemukan.') };
    }

    if (oldTx.goal_id) {
      return {
        error: new Error(
          'Transaksi tabungan tidak dapat dikoreksi melalui menu ini. Silakan kelola langsung melalui Target Tabungan.'
        ),
      };
    }

    const previousTransactions = transactions;
    const previousWallets = wallets;

    if (user && isConfigured) {
      try {
        const { data: newTx, error: rpcError } = await supabase.rpc('replace_financial_transaction', {
          p_old_transaction_id: params.oldTransactionId,
          p_type: params.type,
          p_amount: Number(params.amount),
          p_wallet_id: params.walletId,
          p_transaction_date: params.transactionDate,
          p_destination_wallet_id: params.type === 'transfer' ? params.destinationWalletId || null : null,
          p_category_id: params.type !== 'transfer' ? params.categoryId || null : null,
          p_note: params.note?.trim() || null,
        });

        if (rpcError) {
          console.error('RPC replace_financial_transaction error:', rpcError);
          return { error: rpcError };
        }

        if (newTx) {
          // Refetch fresh transactions and wallets from Supabase to guarantee absolute ledger consistency
          const [{ data: updatedT }, { data: updatedW }] = await Promise.all([
            supabase
              .from('transactions')
              .select('*')
              .order('transaction_date', { ascending: false })
              .order('created_at', { ascending: false }),
            supabase
              .from('wallets')
              .select('*')
              .order('created_at', { ascending: true }),
          ]);

          if (updatedT) {
            setTransactions(updatedT as Transaction[]);
          }
          if (updatedW && updatedW.length > 0) {
            setWallets(updatedW as Wallet[]);
          }

          return { error: null, transaction: newTx as Transaction };
        }
      } catch (err: any) {
        console.error('Exception during correctFinancialTransaction:', err);
        setTransactions(previousTransactions);
        setWallets(previousWallets);
        return { error: err };
      }
    }

    // Demo Mode fallback (Reverse + Replace in local state)
    const newTxId = 'tx-' + Date.now();
    const newTx: Transaction = {
      id: newTxId,
      user_id: user?.id || 'demo',
      wallet_id: params.walletId,
      category_id: params.type !== 'transfer' ? params.categoryId || null : null,
      goal_id: null,
      type: params.type,
      amount: Number(params.amount),
      transaction_date: params.transactionDate,
      destination_wallet_id: params.type === 'transfer' ? params.destinationWalletId || null : null,
      note: params.note?.trim() || null,
      created_at: new Date().toISOString(),
    };

    // 1. Reverse old transaction from wallets
    let updatedWallets = wallets.map((w) => {
      let b = Number(w.balance);
      if (w.id === oldTx.wallet_id) {
        if (oldTx.type === 'income') b -= Number(oldTx.amount);
        if (oldTx.type === 'expense' || oldTx.type === 'transfer') b += Number(oldTx.amount);
      }
      if (oldTx.type === 'transfer' && w.id === oldTx.destination_wallet_id) {
        b -= Number(oldTx.amount);
      }
      return { ...w, balance: Math.max(0, b) };
    });

    // 2. Apply new transaction to wallets
    updatedWallets = updatedWallets.map((w) => {
      let b = Number(w.balance);
      if (w.id === newTx.wallet_id) {
        if (newTx.type === 'income') b += Number(newTx.amount);
        if (newTx.type === 'expense' || newTx.type === 'transfer') b -= Number(newTx.amount);
      }
      if (newTx.type === 'transfer' && w.id === newTx.destination_wallet_id) {
        b += Number(newTx.amount);
      }
      return { ...w, balance: Math.max(0, b) };
    });

    const updatedTxList = [
      newTx,
      ...transactions.filter((t) => t.id !== params.oldTransactionId),
    ].sort((a, b) => {
      const dateCmp = b.transaction_date.localeCompare(a.transaction_date);
      if (dateCmp !== 0) return dateCmp;
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
    setTransactions(updatedTxList);
    setWallets(updatedWallets);

    try {
      localStorage.setItem('demo_transactions', JSON.stringify(updatedTxList));
      localStorage.setItem('demo_wallets', JSON.stringify(updatedWallets));
    } catch {
      // ignore
    }

    return { error: null, transaction: newTx };
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
    if (user && isConfigured) {
      const isValidUuid = (str?: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      if (isValidUuid(id)) {
        try {
          const { error: delError } = await supabase.from('wallets').delete().eq('id', id);
          if (delError) {
            console.error('Delete wallet Supabase error:', delError);
            return { error: delError };
          }
        } catch (err: any) {
          console.error('Delete wallet exception:', err);
          return { error: err };
        }
      }
    }

    const updated = wallets.filter((w) => w.id !== id);
    setWallets(updated);
    try {
      localStorage.setItem('demo_wallets', JSON.stringify(updated));
    } catch {
      // ignore
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
    if (!params.name.trim()) {
      return { error: new Error('Nama target tabungan tidak boleh kosong.') };
    }
    const targetAmt = Number(params.target_amount);
    if (!targetAmt || targetAmt <= 0) {
      return { error: new Error('Target nominal harus lebih besar dari Rp 0.') };
    }

    const newGoalId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'goal-' + Date.now();
    const newGoal: SavingsGoal = {
      id: newGoalId,
      user_id: user?.id || 'demo',
      name: params.name.trim(),
      target_amount: targetAmt,
      current_amount: 0,
      target_date: params.target_date || null,
      icon: 'target',
      color: params.color || '#B9924F',
      is_active: true,
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
          name: params.name.trim(),
          target_amount: targetAmt,
          target_date: params.target_date || null,
          color: params.color || '#B9924F',
          is_active: true,
        });
      } catch {
        // ignore
      }
    }

    return { error: null };
  };

  const updateSavingsGoal = async (id: string, updates: Partial<SavingsGoal>) => {
    if (updates.name !== undefined && !updates.name.trim()) {
      return { error: new Error('Nama target tabungan tidak boleh kosong.') };
    }
    if (updates.target_amount !== undefined && Number(updates.target_amount) <= 0) {
      return { error: new Error('Target nominal harus lebih besar dari Rp 0.') };
    }

    const targetGoal = savingsGoals.find((g) => g.id === id);
    if (!targetGoal) {
      return { error: new Error('Target tabungan tidak ditemukan.') };
    }

    const sanitizedUpdates: Partial<SavingsGoal> = {
      ...updates,
      updated_at: new Date().toISOString(),
    };
    if (updates.name !== undefined) sanitizedUpdates.name = updates.name.trim();
    if (updates.target_amount !== undefined) sanitizedUpdates.target_amount = Number(updates.target_amount);

    const updated = savingsGoals.map((g) => (g.id === id ? { ...g, ...sanitizedUpdates } : g));
    setSavingsGoals(updated);
    try {
      localStorage.setItem('demo_goals', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (user && isConfigured) {
      const isValidUuid = (str?: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      if (isValidUuid(id)) {
        try {
          await supabase.from('savings_goals').update(sanitizedUpdates).eq('id', id);
        } catch (err: any) {
          console.error('Update savings goal error:', err);
          return { error: err };
        }
      }
    }

    return { error: null };
  };

  const archiveSavingsGoal = async (id: string) => {
    const targetGoal = savingsGoals.find((g) => g.id === id);
    if (!targetGoal) {
      return { error: new Error('Target tabungan tidak ditemukan.') };
    }
    if (targetGoal.current_amount > 0) {
      return { error: new Error('Target masih memiliki saldo. Cairkan seluruh saldo ke dompet sebelum mengarsipkan target.') };
    }

    return updateSavingsGoal(id, { is_active: false });
  };

  const restoreSavingsGoal = async (id: string) => {
    return updateSavingsGoal(id, { is_active: true });
  };

  const deleteSavingsGoal = async (id: string) => {
    const targetGoal = savingsGoals.find((g) => g.id === id);
    if (!targetGoal) {
      return { error: new Error('Target tabungan tidak ditemukan.') };
    }
    if (targetGoal.current_amount > 0) {
      return { error: new Error('Target masih memiliki saldo. Cairkan seluruh saldo ke dompet aktif terlebih dahulu sebelum menghapus target ini.') };
    }

    // Cek apakah ada riwayat transaksi yang terhubung dengan goal ini
    const hasTransactions = transactions.some((t) => t.goal_id === id);
    if (hasTransactions) {
      // Prioritaskan archive agar audit trail tidak putus
      return archiveSavingsGoal(id);
    }

    // Jika tanpa riwayat transaksi dan saldo 0: hard delete aman
    const previousGoals = savingsGoals;
    const updated = savingsGoals.filter((g) => g.id !== id);
    setSavingsGoals(updated);
    try {
      localStorage.setItem('demo_goals', JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (user && isConfigured) {
      const isValidUuid = (str?: string | null) => str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      if (isValidUuid(id)) {
        try {
          const { error: delError } = await supabase.from('savings_goals').delete().eq('id', id);
          if (delError) {
            console.error('Delete savings goal Supabase error:', delError);
            setSavingsGoals(previousGoals);
            return { error: delError };
          }
        } catch (err: any) {
          console.error('Delete savings goal exception:', err);
          setSavingsGoals(previousGoals);
          return { error: err };
        }
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
      updateTransaction,
      correctFinancialTransaction,
      addWallet,
      updateWallet,
      deleteWallet,
      addCategory,
      deleteCategory,
      setCategoryBudget,
      addSavingsGoal,
      updateSavingsGoal,
      deleteSavingsGoal,
      archiveSavingsGoal,
      restoreSavingsGoal,
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
