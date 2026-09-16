-- Migration: Replace Financial Transaction RPC
-- Allows atomic financial correction (reverse + replace) of transactions
-- without granting direct UPDATE privileges on financial ledger columns.

CREATE OR REPLACE FUNCTION public.replace_financial_transaction(
  p_old_transaction_id uuid,
  p_type text,
  p_amount numeric,
  p_wallet_id uuid,
  p_transaction_date date,
  p_destination_wallet_id uuid DEFAULT NULL,
  p_category_id uuid DEFAULT NULL,
  p_note text DEFAULT NULL
)
RETURNS public.transactions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid;
  v_old_tx public.transactions%ROWTYPE;
  v_new_tx public.transactions%ROWTYPE;
BEGIN
  -- 1. Validasi Autentikasi
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User authentication required.' USING ERRCODE = '42501';
  END IF;

  -- 2. Ambil & Kunci Transaksi Lama
  SELECT * INTO v_old_tx
  FROM public.transactions
  WHERE id = p_old_transaction_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaksi lama tidak ditemukan.' USING ERRCODE = 'P0002';
  END IF;

  -- 3. Verifikasi Kepemilikan Transaksi
  IF v_old_tx.user_id <> v_user_id THEN
    RAISE EXCEPTION 'Forbidden: Transaksi bukan milik pengguna aktif.' USING ERRCODE = '42501';
  END IF;

  -- 4. Invariant Tabungan: Transaksi Goal Dilarang Dikoreksi Secara Generik
  IF v_old_tx.goal_id IS NOT NULL THEN
    RAISE EXCEPTION 'Transaksi tabungan tidak dapat dikoreksi melalui menu ini. Kelola melalui modul Target Tabungan.' USING ERRCODE = '23514';
  END IF;

  -- 5. Validasi Atribut Transaksi Baru
  IF p_type NOT IN ('income', 'expense', 'transfer') THEN
    RAISE EXCEPTION 'Jenis transaksi tidak valid.' USING ERRCODE = '23514';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Nominal transaksi harus lebih besar dari 0.' USING ERRCODE = '23514';
  END IF;

  IF p_transaction_date IS NULL
    OR p_transaction_date > (now() AT TIME ZONE 'Asia/Jakarta')::date THEN
    RAISE EXCEPTION 'Tanggal transaksi tidak boleh melebihi hari ini.'
      USING ERRCODE = '23514';
  END IF;;

  -- 6. Validasi Dompet Sumber (Harus milik user aktif & aktif)
  IF NOT EXISTS (
    SELECT 1 FROM public.wallets 
    WHERE id = p_wallet_id AND user_id = v_user_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Dompet sumber tidak valid atau tidak aktif.' USING ERRCODE = '23503';
  END IF;

  -- 7. Validasi Transfer & Dompet Tujuan
  IF p_type = 'transfer' THEN
    IF p_destination_wallet_id IS NULL THEN
      RAISE EXCEPTION 'Dompet tujuan wajib diisi untuk transaksi transfer.' USING ERRCODE = '23514';
    END IF;
    IF p_destination_wallet_id = p_wallet_id THEN
      RAISE EXCEPTION 'Dompet tujuan harus berbeda dari dompet sumber.' USING ERRCODE = '23514';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.wallets 
      WHERE id = p_destination_wallet_id AND user_id = v_user_id AND is_active = true
    ) THEN
      RAISE EXCEPTION 'Dompet tujuan tidak valid atau tidak aktif.' USING ERRCODE = '23503';
    END IF;
    p_category_id := NULL; -- Transfer tidak memiliki kategori konsumtif
  ELSE
    p_destination_wallet_id := NULL;
    -- Validasi Kategori (jika diisi)
    IF p_category_id IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.categories 
        WHERE id = p_category_id AND user_id = v_user_id AND type = p_type
      ) THEN
        RAISE EXCEPTION 'Kategori tidak valid atau tidak sesuai dengan jenis transaksi.' USING ERRCODE = '23503';
      END IF;
    END IF;
  END IF;

  -- 8. Eksekusi ATOMIC: Hapus Transaksi Lama (Trigger Reverse Aktif)
  DELETE FROM public.transactions WHERE id = v_old_tx.id;

  -- 9. Eksekusi ATOMIC: Masukkan Transaksi Baru (Trigger Apply Aktif)
  INSERT INTO public.transactions (
    user_id,
    wallet_id,
    category_id,
    goal_id,
    type,
    amount,
    transaction_date,
    destination_wallet_id,
    note
  ) VALUES (
    v_user_id,
    p_wallet_id,
    p_category_id,
    NULL,
    p_type,
    p_amount,
    p_transaction_date,
    p_destination_wallet_id,
    TRIM(p_note)
  )
  RETURNING * INTO v_new_tx;

  RETURN v_new_tx;
END;
$$;

-- Least privilege permissions
REVOKE ALL ON FUNCTION public.replace_financial_transaction(
  uuid,
  text,
  numeric,
  uuid,
  date,
  uuid,
  uuid,
  text
) FROM PUBLIC;

REVOKE ALL ON FUNCTION public.replace_financial_transaction(
  uuid,
  text,
  numeric,
  uuid,
  date,
  uuid,
  uuid,
  text
) FROM anon;

GRANT EXECUTE ON FUNCTION public.replace_financial_transaction(
  uuid,
  text,
  numeric,
  uuid,
  date,
  uuid,
  uuid,
  text
) TO authenticated;

NOTIFY pgrst, 'reload schema';
