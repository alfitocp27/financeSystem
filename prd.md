# Product Requirements Document (PRD)
## Aplikasi Personal Finance Mahasiswa

**Platform:** Web Application (Mobile-First Responsive / PWA Ready)  
**Tech Stack:** React 18+ (TypeScript), Vite, Tailwind CSS, Supabase (PostgreSQL, Auth, RLS)  
**Status:** Approved for Implementation

---

## 1. Executive Summary & Problem Statement

### 1.1 Masalah Utama
Mahasiswa sering mengalami "krisis finansial akhir bulan" karena:
1. **Siklus kiriman uang yang unik:** Uang saku/bulanan sering diterima bukan pada tanggal 1, melainkan tanggal kustom (misal tgl 25).
2. **Ketiadaan visibilitas batas belanja harian:** Sulit memperkirakan berapa rupiah yang aman dibelanjakan hari ini tanpa mengorbankan kebutuhan hingga akhir bulan.
3. **Pencatatan yang merepotkan:** Kebanyakan aplikasi personal finance terlalu kompleks, lambat untuk input cepat saat jajan/nongkrong di kampus, dan tidak memisahkan rekening bank dengan e-wallet (GoPay/OVO/ShopeePay) serta tunai.

### 1.2 Solusi & Tujuan Produk
Membangun web app personal finance yang minimal, modern, cepat, dan spesifik untuk kebutuhan mahasiswa dengan fokus pada:
- Input transaksi super cepat (<5 detik) ramah smartphone.
- Perhitungan dinamis **Safe to Spend** per hari berdasarkan sisa budget dan sisa hari siklus.
- Multi-dompet dan transfer mutasi antar-dompet (Bank, E-Wallet, Tunai).
- Target tabungan terpisah (Savings Goals) agar uang tidak terpakai untuk konsumsi.

---

## 2. Target Persona & User Story

### 2.1 Persona: Mahasiswa Kost / Perantau
- **Pemasukan:** Uang bulanan orang tua (terjadwal) + penghasilan tambahan (freelance / part-time).
- **Pengeluaran Pokok:** Makanan, sewa kost/listrik, transportasi (bensin/ojol), kebutuhan kuliah & buku.
- **Pengeluaran Fleksibel:** Nongkrong, kopi, hiburan, belanja impulsif.

### 2.2 Core User Stories
- *Sebagai mahasiswa*, saya ingin menetapkan tanggal kiriman uang bulanan saya sebagai awal siklus anggaran agar perhitungan keuangan saya akurat.
- *Sebagai mahasiswa*, saya ingin melihat nominal aman belanja hari ini di halaman depan (*Safe to Spend*) agar saya tahu apakah saya boleh jajan lebih atau harus berhemat.
- *Sebagai mahasiswa*, saya ingin mencatat pengeluaran harian dalam hitungan detik lewat ponsel saya agar saya tidak lupa mencatatnya.
- *Sebagai mahasiswa*, saya ingin memindahkan uang dari rekening bank ke e-wallet tanpa mengubah status pengeluaran.
- *Sebagai mahasiswa*, saya ingin menyisihkan uang ke target tabungan (misal: Beli Laptop atau Dana Darurat) dan melihat progresnya.

---

## 3. Scope & Spesifikasi Fitur MVP (Versi 1)

### 3.1 Autentikasi & Akun
- **Metode Auth:** Email & Password menggunakan Supabase Auth.
- **Onboarding Otomatis (Seed Template Mahasiswa):**
  Saat user baru mendaftar, sistem otomatis membuatkan:
  - **Dompet Default:**
    - Tunai (Cash)
    - Rekening Utama (Bank)
    - E-Wallet (GoPay / ShopeePay)
  - **Kategori Pengeluaran Default:**
    - Makanan & Minuman
    - Kost & Utilitas
    - Transportasi
    - Kuliah & Tugas
    - Hiburan & Nongkrong
    - Belanja Harian
  - **Kategori Pemasukan Default:**
    - Uang Bulanan Ortu
    - Gaji / Freelance
    - Beasiswa
    - Lainnya

### 3.2 Siklus Anggaran Fleksibel (Custom Budget Cycle)
- Pengguna dapat mengatur `cycle_start_day` (tanggal 1 s.d. 31).
- Siklus aktif berjalan dari tanggal `cycle_start_day` bulan berjalan hingga `(cycle_start_day - 1)` bulan berikutnya.
- Indikator sisa hari dalam siklus aktif ditampilkan pada dashboard.

### 3.3 Safe to Spend Engine (Batas Belanja Harian)
- **Kalkulasi:**
  $$\text{Safe to Spend} = \frac{\text{Budget Bebas Tersisa}}{\text{Sisa Hari dalam Siklus}}$$
  $$\text{Budget Bebas Tersisa} = \text{Total Budget Periode} - \text{Pengeluaran Berjalan} - \text{Alokasi Tabungan}$$
- **Pace Alert Status:**
  - 🟢 **Safe:** Pengeluaran hari ini $\le$ batas Safe to Spend.
  - 🟡 **Warning:** Pengeluaran hari ini mendekati 100% batas harian.
  - 🔴 **Overpace:** Pengeluaran hari ini melebihi batas harian (rekomendasi kompensasi untuk hari berikutnya).

### 3.4 Multi-Dompet (Wallets) & Mutasi Antar-Dompet
- Tipe Dompet: Bank, E-Wallet, Cash.
- Mendukung penyesuaian saldo awal.
- **Fitur Transfer:** Memindahkan dana dari Dompet Asal ke Dompet Tujuan. Saldo terpotong di asal dan bertambah di tujuan tanpa dicatat sebagai pengeluaran/pemasukan.

### 3.5 Quick-Add Transaction Engine (Mobile-First)
- Tombol aksi mengambang (Floating Action Button / FAB) yang mudah dijangkau satu tangan.
- Input nominal cepat dengan tombol pintas: `+10k`, `+20k`, `+50k`, `+100k`.
- Pemilihan kategori & dompet instan dengan 1 tap.
- Default otomatis: Tanggal hari ini dan dompet terakhir yang digunakan.

### 3.6 Target Tabungan (Savings Goals)
- CRUD target tabungan (Nama, Target Nominal, Tanggal Target, Warna/Ikon).
- Aksi "Simpan Dana": Memotong saldo dari dompet tertentu dan menambahkan ke `current_amount` tabungan.
- Bar visualisasi progres persentase pencapaian.

### 3.7 Visualisasi & Analisis Sederhana
- Donut chart breakdown pengeluaran per kategori (didukung Recharts).
- Kartu ringkasan Arus Kas (Total Pemasukan, Total Pengeluaran, Net Balance).
- Riwayat transaksi dengan filter (per dompet, per kategori, atau rentang tanggal).

---

## 4. Skema Database Supabase PostgreSQL

```sql
-- Profiles: Informasi preferensi pengguna & tanggal siklus
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  currency text default 'IDR',
  cycle_start_day int default 1 check (cycle_start_day between 1 and 31),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Wallets: Rekening bank, e-wallet, uang tunai
create table wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  wallet_type text not null check (wallet_type in ('bank', 'ewallet', 'cash')),
  balance numeric(15,2) default 0 not null,
  icon text default 'wallet',
  color text default '#3b82f6',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Categories: Pos pengeluaran & pemasukan
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  icon text default 'tag',
  color text default '#6b7280',
  created_at timestamptz default now()
);

-- Budgets: Rencana anggaran per kategori dalam siklus bulanan
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  category_id uuid references categories(id) on delete cascade not null,
  amount numeric(15,2) not null check (amount >= 0),
  period_month int not null,
  period_year int not null,
  created_at timestamptz default now(),
  unique (user_id, category_id, period_month, period_year)
);

-- Savings Goals: Target menabung
create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  target_amount numeric(15,2) not null check (target_amount > 0),
  current_amount numeric(15,2) default 0 not null check (current_amount >= 0),
  target_date date,
  color text default '#10b981',
  created_at timestamptz default now()
);

-- Transactions: Catatan pemasukan, pengeluaran, transfer, dan alokasi tabungan
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  wallet_id uuid references wallets(id) on delete restrict not null,
  category_id uuid references categories(id) on delete set null,
  goal_id uuid references savings_goals(id) on delete set null,
  type text not null check (type in ('income', 'expense', 'transfer')),
  amount numeric(15,2) not null check (amount > 0),
  transaction_date date default current_date not null,
  destination_wallet_id uuid references wallets(id) on delete restrict,
  note text,
  created_at timestamptz default now()
);

-- Row Level Security (RLS) Diaktifkan di Seluruh Tabel
alter table profiles enable row level security;
alter table wallets enable row level security;
alter table categories enable row level security;
alter table budgets enable row level security;
alter table savings_goals enable row level security;
alter table transactions enable row level security;

create policy "Users own profiles" on profiles for all using (auth.uid() = id);
create policy "Users own wallets" on wallets for all using (auth.uid() = user_id);
create policy "Users own categories" on categories for all using (auth.uid() = user_id);
create policy "Users own budgets" on budgets for all using (auth.uid() = user_id);
create policy "Users own savings_goals" on savings_goals for all using (auth.uid() = user_id);
create policy "Users own transactions" on transactions for all using (auth.uid() = user_id);
```

---

## 5. UI/UX & Design Guidelines
- **Tema Desain:** Clean, minimalis, modern, whitespace luas, tipografi rapi (`Inter` font).
- **Warna Aksen Finansial:**
  - Netral: Slate / Zinc (`#0f172a`, `#f8fafc`).
  - Income / Positif: Emerald Green (`#10b981`).
  - Expense / Warning: Rose / Amber (`#f43f5e`, `#f59e0b`).
  - Brand Accent: Indigo / Violet (`#6366f1`).
- **Komponen Utama:**
  - *Hero Card Safe to Spend:* Menampilkan nominal besar dengan status warna kecepatan belanja.
  - *Wallet Carousel:* Geser horizontal untuk melihat saldo masing-masing rekening & e-wallet.
  - *Bottom Navigation:* Bar navigasi tetap di bawah untuk smartphone.

---

## 6. Taskmaster Roadmap (Implementasi Bertahap)

### Phase 1: Environment & Project Setup
- [x] Dokumen PRD (`prd.md`) disahkan.
- [ ] Inisialisasi Vite + React (TypeScript) + Tailwind CSS + Lucide Icons.
- [ ] Setup script SQL Supabase (Skema, RLS, Triggers, Starter Seeds).
- [ ] Setup `.env.example` dan Supabase client client wrapper.

### Phase 2: Autentikasi & Profile Setup
- [ ] Context provider untuk auth state (login, register, logout, session persistence).
- [ ] Form Login & Register minimalis dengan feedback error.
- [ ] Pengaturan siklus tanggal anggaran (`cycle_start_day`).

### Phase 3: Arsitektur Dompet & Transfer Saldo
- [ ] Tampilan kartu dompet & ringkasan total saldo.
- [ ] Modal tambah / edit dompet.
- [ ] Modal transfer dana antar dompet (mutasi saldo otomatis).

### Phase 4: Quick-Add Transaction Engine
- [ ] Floating action button (FAB) + Modal Quick Add.
- [ ] Preset tombol nominal (`+10k`, `+20k`, `+50k`, `+100k`).
- [ ] Filter dan daftar riwayat transaksi dengan badge kategori & dompet.

### Phase 5: Safe to Spend Engine & Budgeting
- [ ] Modul utilitas tanggal untuk menghitung sisa hari dalam siklus anggaran.
- [ ] Widget Safe to Spend harian dengan alert status (Safe, Warning, Overpace).
- [ ] Pengaturan budget per kategori & bar visualisasi pemakaian budget.

### Phase 6: Savings Goals & Analitik Finansial
- [ ] CRUD Target Tabungan + aksi "Alokasikan Dana dari Dompet".
- [ ] Grafik Donut pengeluaran per kategori (Recharts).
- [ ] Grafik Tren Arus Kas Bulanan.

### Phase 7: Polish & Validasi
- [ ] Pengujian responsive pada resolusi smartphone (360px - 430px) dan desktop.
- [ ] Toast notification & form feedback.
- [ ] Optimasi performa dan verifikasi build production.
