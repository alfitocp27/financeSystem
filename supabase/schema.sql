-- =========================================================
-- DATABASE SCHEMA: APLIKASI PERSONAL FINANCE MAHASISWA
-- Platform: Supabase (PostgreSQL 15+)
-- =========================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS & DOMAINS (Alternative: CHECK constraints for simplicity)

-- 3. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  currency text default 'IDR' not null,
  cycle_start_day int default 25 check (cycle_start_day between 1 and 31) not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 4. WALLETS (Rekening Bank, E-Wallet, Dompet Tunai)
create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  wallet_type text not null check (wallet_type in ('bank', 'ewallet', 'cash')),
  balance numeric(15,2) default 0 not null,
  icon text default 'wallet' not null,
  color text default '#3b82f6' not null,
  is_active boolean default true not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 5. CATEGORIES (Kategori Pemasukan & Pengeluaran)
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text default 'tag' not null,
  color text default '#6b7280' not null,
  created_at timestamptz default now() not null
);

-- 6. BUDGETS (Alokasi Anggaran Bulanan per Kategori)
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete cascade not null,
  amount numeric(15,2) not null check (amount >= 0),
  period_month int not null check (period_month between 1 and 12),
  period_year int not null check (period_year >= 2020),
  created_at timestamptz default now() not null,
  unique (user_id, category_id, period_month, period_year)
);

-- 7. SAVINGS GOALS (Target Tabungan Mahasiswa)
create table if not exists public.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  target_amount numeric(15,2) not null check (target_amount > 0),
  current_amount numeric(15,2) default 0 not null check (current_amount >= 0),
  target_date date,
  icon text default 'target' not null,
  color text default '#10b981' not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- 8. TRANSACTIONS (Pemasukan, Pengeluaran, & Mutasi Transfer)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  wallet_id uuid references public.wallets(id) on delete restrict not null,
  category_id uuid references public.categories(id) on delete set null,
  goal_id uuid references public.savings_goals(id) on delete set null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric(15,2) not null check (amount > 0),
  transaction_date date default current_date not null,
  destination_wallet_id uuid references public.wallets(id) on delete restrict,
  note text,
  created_at timestamptz default now() not null
);

-- Check: transfer harus memiliki destination_wallet_id yang berbeda dengan wallet_id
alter table public.transactions drop constraint if exists check_valid_transfer;
alter table public.transactions add constraint check_valid_transfer check (
  (type = 'transfer' and destination_wallet_id is not null and destination_wallet_id <> wallet_id) or
  (type <> 'transfer')
);

-- 9. RECURRING COMMITMENTS (Tagihan Rutin Bulanan: Kost, Wifi, Langganan)
create table if not exists public.recurring_commitments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  amount numeric(15,2) not null check (amount > 0),
  due_day int not null check (due_day between 1 and 31),
  is_paid boolean default false not null,
  created_at timestamptz default now() not null
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================
alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.categories enable row level security;
alter table public.budgets enable row level security;
alter table public.savings_goals enable row level security;
alter table public.transactions enable row level security;
alter table public.recurring_commitments enable row level security;

create policy "Users manage own recurring commitments" on public.recurring_commitments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Profiles: pengguna hanya bisa CRUD datanya sendiri
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Wallets
create policy "Users manage own wallets" on public.wallets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Categories
create policy "Users manage own categories" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Budgets
create policy "Users manage own budgets" on public.budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Savings Goals
create policy "Users manage own savings goals" on public.savings_goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Transactions
create policy "Users manage own transactions" on public.transactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- TRIGGER: MUTASI OTOMATIS SALDO DOMPET SAAT TRANSAKSI
-- =========================================================
create or replace function public.handle_transaction_wallet_balance()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    if new.type = 'income' then
      update public.wallets set balance = balance + new.amount where id = new.wallet_id;
      if new.goal_id is not null then
        update public.savings_goals set current_amount = greatest(0, current_amount - new.amount) where id = new.goal_id;
      end if;
    elsif new.type = 'expense' then
      update public.wallets set balance = balance - new.amount where id = new.wallet_id;
      -- jika dialokasikan ke tabungan
      if new.goal_id is not null then
        update public.savings_goals set current_amount = current_amount + new.amount where id = new.goal_id;
      end if;
    elsif new.type = 'transfer' then
      update public.wallets set balance = balance - new.amount where id = new.wallet_id;
      update public.wallets set balance = balance + new.amount where id = new.destination_wallet_id;
    end if;

  elsif tg_op = 'DELETE' then
    if old.type = 'income' then
      update public.wallets set balance = balance - old.amount where id = old.wallet_id;
    elsif old.type = 'expense' then
      update public.wallets set balance = balance + old.amount where id = old.wallet_id;
      if old.goal_id is not null then
        update public.savings_goals set current_amount = greatest(0, current_amount - old.amount) where id = old.goal_id;
      end if;
    elsif old.type = 'transfer' then
      update public.wallets set balance = balance + old.amount where id = old.wallet_id;
      update public.wallets set balance = balance - old.amount where id = old.destination_wallet_id;
    end if;
  end if;

  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_transaction_wallet_balance on public.transactions;
create trigger tr_transaction_wallet_balance
after insert or delete on public.transactions
for each row execute function public.handle_transaction_wallet_balance();

-- =========================================================
-- TRIGGER: ONBOARDING USER BARU & SEED STARTER MAHASISWA
-- =========================================================
create or replace function public.handle_new_user_setup()
returns trigger as $$
declare
  v_cash_id uuid;
  v_bank_id uuid;
  v_ewallet_id uuid;
begin
  -- 1. Buat profil mahasiswa
  insert into public.profiles (id, full_name, currency, cycle_start_day)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'IDR',
    25 -- Default siklus mahasiswa tanggal 25 (kiriman orang tua)
  );

  -- 2. Seed Default Wallets
  insert into public.wallets (user_id, name, wallet_type, balance, icon, color)
  values
    (new.id, 'Uang Tunai (Cash)', 'cash', 0, 'banknote', '#10b981'),
    (new.id, 'Rekening Bank', 'bank', 0, 'landmark', '#3b82f6'),
    (new.id, 'E-Wallet (GoPay/ShopeePay)', 'ewallet', 0, 'smartphone', '#8b5cf6');

  -- 3. Seed Default Categories (Pengeluaran Mahasiswa)
  insert into public.categories (user_id, name, type, icon, color)
  values
    (new.id, 'Makanan & Minuman', 'expense', 'utensils', '#f59e0b'),
    (new.id, 'Kost & Utilitas', 'expense', 'home', '#ef4444'),
    (new.id, 'Transportasi', 'expense', 'bus', '#3b82f6'),
    (new.id, 'Kuliah & Tugas', 'expense', 'book-open', '#8b5cf6'),
    (new.id, 'Hiburan & Nongkrong', 'expense', 'coffee', '#ec4899'),
    (new.id, 'Belanja Harian', 'expense', 'shopping-bag', '#14b8a6'),
    (new.id, 'Kesehatan & Pribadi', 'expense', 'heart-pulse', '#06b6d4'),
    -- Kategori Pemasukan Mahasiswa
    (new.id, 'Uang Bulanan Ortu', 'income', 'wallet', '#10b981'),
    (new.id, 'Gaji / Freelance', 'income', 'briefcase', '#3b82f6'),
    (new.id, 'Beasiswa', 'income', 'award', '#f59e0b'),
    (new.id, 'Pemasukan Lainnya', 'income', 'coins', '#6b7280');

  return new;
end;
$$ language plpgsql security definer;

-- Daftarkan trigger ke auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user_setup();
