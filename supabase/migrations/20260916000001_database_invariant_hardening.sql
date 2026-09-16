-- Migration: Database Invariant Hardening
-- Enforces archive integrity on savings_goals and column-level update privileges
-- to prevent direct client manipulation of sensitive financial ledger columns.

-- 1. SAVINGS ARCHIVE INTEGRITY CONSTRAINT
-- Menjamin target tabungan bersaldo > 0 tidak dapat diarsipkan
ALTER TABLE public.savings_goals
ADD CONSTRAINT check_savings_goal_archive_integrity
CHECK (is_active = true OR current_amount = 0);

-- 2. TRANSACTIONS FINANCIAL IMMUTABILITY
-- Mencabut hak update seluruh kolom, lalu hanya mengizinkan note dan category_id
REVOKE UPDATE ON public.transactions FROM authenticated;
GRANT UPDATE (note, category_id) ON public.transactions TO authenticated;

-- 3. SAVINGS GOALS CURRENT_AMOUNT IMMUTABILITY
-- Mencabut hak update current_amount dari client (hanya termutasi via trigger transaksi)
REVOKE UPDATE ON public.savings_goals FROM authenticated;
GRANT UPDATE (name, target_amount, target_date, color, icon, is_active, updated_at) 
ON public.savings_goals TO authenticated;

-- 4. WALLETS BALANCE IMMUTABILITY
-- Mencabut hak update balance dari client (hanya termutasi via trigger transaksi)
REVOKE UPDATE ON public.wallets FROM authenticated;
GRANT UPDATE (name, wallet_type, color, icon, is_active, updated_at) 
ON public.wallets TO authenticated;

-- 5. RELOAD POSTGREST SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
