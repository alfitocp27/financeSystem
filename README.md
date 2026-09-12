# SakuMahasiswa - Aplikasi Personal Finance Mahasiswa

Web application personal finance minimalis & modern yang dirancang khusus untuk mahasiswa dan anak kost perantauan agar tidak cepat kehabisan uang saku sebelum akhir bulan.

---

## Fitur Utama

- **Safe to Spend Engine:** Kalkulasi dinamis batas belanja harian aman berdasarkan sisa budget dan sisa hari dalam siklus kiriman uang.
- **Pace Status Alert:** Indikator visual real-time status belanja (🟢 *Aman*, 🟡 *Waspada*, 🔴 *Overpace*).
- **Siklus Anggaran Fleksibel:** Tanggal mulai siklus bulanan dapat disesuaikan (misal tiap tanggal 25 saat kiriman orang tua tiba) alih-alih kaku pada tanggal 1.
- **Proyeksi Akhir Bulan (Financial Forecast):** Estimasi sisa uang dan ketahanan hari (runway) berdasarkan laju rata-rata belanja harian (*burn rate*).
- **Multi-Dompet & Transfer Antar-Dompet:** Kelola saldo terpisah untuk Bank (BCA, Mandiri, dll.), E-Wallet (GoPay, OVO, ShopeePay), dan Uang Tunai (Cash) dengan fitur mutasi transfer instan.
- **Pengeluaran Tetap Bulanan (Recurring Bills):** Pencatatan tagihan rutin wajib (Sewa Kost, Wifi, SPP, Langganan) yang otomatis diamankan dari jatah belanja harian agar tidak terpakai secara tidak sengaja.
- **Quick-Add Transaction Engine (<5 Detik):** Antarmuka input kilat ramah smartphone dengan tombol pintas nominal (+10rb, +20rb, +50rb, +100rb) dan shortcut keyboard (`N` atau `+` di laptop).
- **Target Tabungan (Savings Goals):** Bikin target wishlist (Dana Darurat, Laptop, Liburan) dengan aksi setor dan cairkan dana kembali ke dompet.
- **Anggaran per Kategori & Kategori Kustom:** Pantau alokasi budget bulanan per pos pengeluaran beserta notifikasi overbudget.
- **Analisis & Grafik Tren:** Visualisasi porsi pengeluaran kategori (Donut Chart) dan tren belanja 7 hari terakhir vs garis batas Safe to Spend (Bar Chart).
- **Ekspor Data CSV:** Unduh laporan pembukuan transaksi ke spreadsheet kapan saja.
- **PWA & Offline Ready:** Siap diinstall sebagai aplikasi di layar utama smartphone (Add to Home Screen) dengan dukungan service worker offline caching.

---

## Tech Stack

- **Frontend:** React 18 (TypeScript), Vite
- **Styling:** Tailwind CSS, Lucide React Icons
- **Visualisasi Data:** Recharts
- **Testing:** Vitest
- **Backend & Database:** Supabase (PostgreSQL 15+, Supabase Auth, Row Level Security, Triggers)

---

## Panduan Instalasi Lokal

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd finance
npm install
```

### 2. Setup Environment Variables
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi Supabase Anda:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
*(Catatan: Jika `.env` tidak diisi, aplikasi akan secara otomatis berjalan dalam mode **Demo Lokal** menggunakan LocalStorage tanpa error).*

### 3. Migrasi Database Supabase (Opsional jika menggunakan Supabase sendiri)
Buka menu **SQL Editor** pada dashboard Supabase proyek Anda, lalu jalankan seluruh skrip yang ada di file:
`supabase/schema.sql`

Skrip ini akan secara otomatis:
- Membuat seluruh tabel (`profiles`, `wallets`, `categories`, `budgets`, `savings_goals`, `transactions`, `recurring_commitments`).
- Mengaktifkan Row Level Security (RLS) di semua tabel.
- Mendaftarkan trigger Postgres untuk auto-sinkronisasi saldo dompet dan auto-seeding profil & kategori default mahasiswa saat user baru mendaftar.

### 4. Menjalankan Aplikasi
```bash
# Menjalankan development server
npm run dev

# Menjalankan unit tests
npm test

# Build production
npm run build
```

---

## Struktur Folder

```
finance/
├── public/                 # PWA Manifest, Service Worker, Favicon
├── src/
│   ├── components/         # Komponen UI (Navbar, Cards, Modals, Charts)
│   ├── context/            # AuthContext & FinanceContext (State Management)
│   ├── lib/                # Engine Safe to Spend, Cycle Calculators, Formatters
│   ├── types/              # TypeScript typings & Supabase Database types
│   ├── App.tsx             # Root component & Responsive Dashboard
│   └── main.tsx            # Entry point & PWA registration
├── supabase/
│   └── schema.sql          # Skema database Supabase lengkap & Triggers
├── prd.md                  # Product Requirements Document
└── vite.config.ts          # Konfigurasi bundler & chunk splitting
```
