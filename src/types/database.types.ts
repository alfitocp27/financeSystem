export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type WalletType = 'bank' | 'ewallet' | 'cash';
export type CategoryType = 'income' | 'expense';
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Profile {
  id: string;
  full_name: string | null;
  currency: string;
  cycle_start_day: number;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  wallet_type: WalletType;
  balance: number;
  icon: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  created_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period_month: number;
  period_year: number;
  created_at: string;
  category?: Category;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  icon: string;
  color: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id: string | null;
  goal_id: string | null;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  destination_wallet_id: string | null;
  note: string | null;
  created_at: string;
  wallet?: Wallet;
  category?: Category;
  destination_wallet?: Wallet;
  goal?: SavingsGoal;
}

export interface RecurringCommitment {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  amount: number;
  due_day: number;
  is_paid: boolean;
  created_at: string;
  category?: Category;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      wallets: {
        Row: Wallet;
        Insert: Partial<Omit<Wallet, 'id' | 'created_at' | 'updated_at'>> & { user_id: string; name: string; wallet_type: WalletType };
        Update: Partial<Wallet>;
        Relationships: [];
      };
      categories: {
        Row: Category;
        Insert: Partial<Omit<Category, 'id' | 'created_at'>> & { user_id: string; name: string; type: CategoryType };
        Update: Partial<Category>;
        Relationships: [];
      };
      budgets: {
        Row: Budget;
        Insert: Partial<Omit<Budget, 'id' | 'created_at'>> & { user_id: string; category_id: string; amount: number; period_month: number; period_year: number };
        Update: Partial<Budget>;
        Relationships: [];
      };
      savings_goals: {
        Row: SavingsGoal;
        Insert: Partial<Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>> & { user_id: string; name: string; target_amount: number };
        Update: Partial<SavingsGoal>;
        Relationships: [];
      };
      transactions: {
        Row: Transaction;
        Insert: Partial<Omit<Transaction, 'id' | 'created_at'>> & { user_id: string; wallet_id: string; type: TransactionType; amount: number; transaction_date: string };
        Update: Partial<Transaction>;
        Relationships: [];
      };
      recurring_commitments: {
        Row: RecurringCommitment;
        Insert: Partial<Omit<RecurringCommitment, 'id' | 'created_at'>> & { user_id: string; name: string; amount: number; due_day: number };
        Update: Partial<RecurringCommitment>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
