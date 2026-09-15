# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Indonesian university students and young boarding house residents (anak kost / perantau) managing monthly living allowances (uang saku from parents, stipends, or part-time/freelance income) while juggling everyday expenses (meals, rent, transport, study supplies, social outings).

## Product Purpose
Prevent end-of-month financial crises ("krisis tanggal tua") by giving students immediate, stress-free daily clarity on how much money they can safely spend today without running out before their next allowance arrives.

## Positioning
Unlike traditional accounting apps that assume a rigid calendar-month salary (1st–30th) and demand complex manual bookkeeping, SakuMahasiswa anchors specifically to irregular allowance dates (custom monthly start cycle, e.g., the 25th) and translates complex balances into a single dynamic daily threshold: Safe to Spend.

## Operating Context
- Primarily accessed on mobile phones in high-speed, on-the-go moments (buying meals at warteg/kantin, hanging out at coffee shops, splitting bills, campus transport).
- Handles multi-channel money flows standard in Indonesia: Cash (dompet fisik), Bank accounts (BCA, Mandiri, BRI, etc.), and E-Wallets (GoPay, OVO, ShopeePay, DANA).
- Operates both online with Supabase cloud synchronization and offline/demo with LocalStorage persistence.

## Capabilities and Constraints
- **Custom Allowance Cycle:** Flexible budget start day (1 to 31) determining period length and remaining days.
- **Safe to Spend Engine:** Dynamic formula: (Remaining Free Budget) / (Remaining Days in Cycle), with pace alert badges (🟢 Safe, 🟡 Warning, 🔴 Overpace).
- **Multi-Wallet & Transfers:** Ability to move funds between Bank, E-Wallet, and Cash without mischaracterizing them as expenses or income.
- **Protected Recurring Commitments:** Essential obligations (kost rent, Wi-Fi, tuition) ring-fenced from daily discretionary spend.
- **Quick-Add Transaction Engine:** Mobile-optimized input with fast amount presets (+10k, +20k, +50k, +100k) and keyboard hotkeys (`N` / `+`).
- **Savings Goals:** Isolated target funds (emergency reserve, laptop, vacation) that separate savings from spendable balances.
- **Reporting & Export:** Categorized spending breakdown, cashflow trends, and CSV data export.
- **Platform Constraints:** Mobile-first responsive web app (PWA installable, offline-cached service worker).

## Brand Commitments
- **Name:** SakuMahasiswa
- **Tone & Voice:** Empathetic, supportive, clear, modern, and youth-friendly; non-judgmental about tight budgets, with pragmatic financial encouragement.
- **Terminology:** Uses natural Indonesian financial terminology familiar to students (Uang Saku, Safe to Spend, Dana Darurat, Anak Kost, Tanggal Gajian/Kiriman, Dompet).

## Evidence on Hand
- Detailed Product Requirements Document at `prd.md`.
- Complete functional schema, PostgreSQL RLS policies, and seed structures at `supabase/schema.sql`.
- Full project documentation and implementation guide at `README.md`.

## Product Principles
1. **Speed Over Rigor:** Logging an expense must take under 5 seconds so students actually keep doing it daily.
2. **Actionable Today, Not Just Historical:** Instead of just reporting where money went last week, give an immediate decision rule for today (Safe to Spend).
3. **Reality-Matched Money Flows:** Support transfers across e-wallets and cash without treating them as income/expense distortions.
4. **Ring-Fence Fixed Essentials:** Never let rent or utility money mingle with discretionary snack/coffee funds.

## Accessibility & Inclusion
- High visual contrast for quick glanceability under direct sunlight on mobile screens.
- Generous tap targets (minimum 44x44px) suited for single-handed smartphone use.
- Accessible color indicators paired with clear text labels (not color-alone) for status states.
