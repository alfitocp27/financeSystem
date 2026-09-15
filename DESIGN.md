---
name: SakuMahasiswa
description: Mobile-first personal finance web app with dynamic Safe to Spend engine for Indonesian college students
colors:
  primary: "#4648d4"
  primary-container: "#6063ee"
  primary-focus: "#6366f1"
  neutral-bg: "#f8fafc"
  neutral-surface: "#ffffff"
  neutral-text: "#0f172a"
  neutral-secondary: "#475569"
  neutral-muted: "#94a3b8"
  border-default: "#e2e8f0"
  safe-green: "#10b981"
  safe-green-soft: "#ecfdf5"
  alert-rose: "#f43f5e"
  alert-rose-soft: "#fff1f2"
  warning-amber: "#f59e0b"
  warning-amber-soft: "#fffbeb"
  info-blue: "#3b82f6"
  info-blue-soft: "#eff6ff"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.875rem, 4vw, 2.25rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary-focus}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary}"
  card-base:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: SakuMahasiswa

## Overview

**Creative North Star: "The Daylight Ledger"**

SakuMahasiswa is built around the feeling of opening a crisp, well-organized physical notebook on a clear morning. Instead of confronting students with spreadsheet clutter or dread-inducing debt trackers, it delivers instant financial calmness: an airy slate-and-indigo canvas that immediately answers the one question an Indonesian college student or perantau asks every day: *"Berapa yang aman saya belanjakan hari ini?"*

The system rejects dark, overbearing fintech austerity and noisy gamification gimmicks. Instead, it pairs generous breathing room (`#f8fafc` background with `#ffffff` container cards) with decisive Ultramarine & Electric Indigo accents. Statuses do not shout in harsh solid reds or greens; they comfort and inform through soft pastel shield backgrounds with high-contrast text and crisp status pips.

**Key Characteristics:**
- Crisp, airy daylight atmosphere with high glanceability on outdoor mobile screens.
- Dominant hero card hierarchy centered on tabular daily figures.
- Gentle, anxiety-free semantic signaling through soft-tinted surfaces.
- Mobile-first ergonomic touch zones (minimum 44px) built for rapid, one-handed inputs.

## Colors

The palette balances cool, calming daylight neutrals with an electric indigo anchor and reassuring, non-punitive semantic status tones.

### Primary
- **Ultramarine Ink** (`#4648d4`): Brand foundation and deep interactive focal points.
- **Electric Indigo** (`#6366f1`): Active highlights, primary CTA buttons, and interactive focus states.
- **Indigo Lavender Tint** (`#eef2ff`): Subtle background highlights and active navigation pill fills.

### Neutral
- **Crisp Slate Canvas** (`#f8fafc`): Global viewport background providing clean separation from white cards.
- **Pure Surface White** (`#ffffff`): Card containers, modal sheets, and floating elements.
- **Midnight Slate** (`#0f172a`): High-contrast primary headings and financial numerical values.
- **Muted Steel** (`#475569`): Descriptive text, secondary labels, and supportive captions.
- **Subtle Outline Gray** (`#e2e8f0`): Structural 1px card boundaries and table dividers.

### Status (Semantic)
- **Botanical Safe** (`#10b981`, soft `#ecfdf5`): Spending is safely under the daily pace limit.
- **Sunlit Amber** (`#f59e0b`, soft `#fffbeb`): Warning pace; daily allowance has reached ~80%.
- **Signal Coral** (`#f43f5e`, soft `#fff1f2`): Overpace alert; compassionate advisory to compensate tomorrow.
- **Atmospheric Blue** (`#3b82f6`, soft `#eff6ff`): Informational balances and non-budget estimates.

### Named Rules
**The Soft-Shield Rule.** Semantic status alerts never use screaming saturated full-flood backgrounds. They must always use 10% soft-tint backgrounds (`bg-semantic-*-soft`) paired with crisp border accents and a saturated dot indicator, eliminating financial panic while maintaining clear hierarchy.

**The One Voice Rule.** The primary electric indigo accent is reserved for actionable triggers (CTAs, FAB, active navigation). It occupies ≤10% of any given viewport surface to prevent visual fatigue.

## Typography

**Display Font:** Inter (with system-ui, -apple-system, sans-serif fallbacks)  
**Body Font:** Inter (with system-ui, -apple-system, sans-serif fallbacks)  
**Numerical Type:** Inter with `tabular-nums` and `font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11'`

**Character:** Modern, clean neo-grotesque type engineered for razor-sharp numerical readability and high legibility at glance across varying Indonesian mobile displays.

### Hierarchy
- **Display** (800 / Extrabold, `clamp(1.875rem, 4vw, 2.25rem)`, line-height 1.1): The hero daily Safe to Spend figure.
- **Headline** (700 / Bold, `1.5rem`, line-height 1.25): Modal titles and primary dashboard section headers.
- **Title** (600 / Semibold, `1.125rem`, line-height 1.35): Card header titles, wallet names, and dialog headings.
- **Body** (400 / Regular & 500 / Medium, `0.875rem`, line-height 1.5): Standard descriptive copy, transaction notes, and breakdown lines.
- **Label** (600 / Semibold, `0.75rem`, line-height 1.2, uppercase tracking `0.05em`): Field labels, category chips, and pace status badges.

### Named Rules
**The Tabular Precision Rule.** Every currency figure and numerical balance must use `.tabular-nums` so columns and cards align with mathematical stability without horizontal jitter during live updates.

## Layout

The spatial model is mobile-first single-column transitioning to a balanced 2-column or 3-column desktop container:
- **Mobile Container:** Full-width viewport with `16px` (`p-4`) side padding and safe-area insets (`pb-24` to clear the fixed bottom navigation bar).
- **Desktop Container:** Centered layout maxing out at `max-w-6xl` or `max-w-7xl` with `24px` to `32px` gutter spacing.
- **Spacing Rhythm:** Built on an 8px modular scale (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`).
- **Density:** Compact yet breathable; card padding is standard `20px` to `24px` on desktop and `16px` to `20px` on mobile.

## Elevation & Depth

SakuMahasiswa is flat-by-default with tonal layering. Depth is primarily conveyed through 1px border contrast (`#e2e8f0`) against the `#f8fafc` canvas, supplemented by soft, ambient micro-shadows on cards and elevated sheets.

### Shadow Vocabulary
- **Resting Card Shadow** (`box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05)`): Standard elevation for white surface cards over `#f8fafc`.
- **Interactive Lift** (`box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)`): Applied on card hover and active interactive widgets.
- **Sheet & Floating Modal** (`box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)`): Used for the quick-add sheet, bottom drawer, and backdrop-dimmed modals.

### Named Rules
**The Flat-By-Default Rule.** Surfaces rest flush against the tonal background bordered by subtle 1px outlines. Heavy drop shadows are banned; elevation increases only when an element hovers, expands, or hovers over a modal scrim.

## Shapes

- **Card Containers:** Friendly, modern rounded corners at `16px` (`rounded-2xl` / `rounded-[16px]`).
- **Input Fields & Buttons:** Ergonomic `8px` (`rounded-lg`) to `12px` (`rounded-xl`) radius.
- **Badges & Preset Chips:** Full pill radius `9999px` (`rounded-full`) for tap clarity and tactile feel.
- **Outlines:** Consistent `1px solid #e2e8f0` structural borders across all un-elevated surfaces.

## Components

### Buttons
- **Shape:** `8px` rounded corners (`rounded-lg`), height `36px` (`h-9`) default, `44px` (`h-11`) on primary mobile actions.
- **Primary:** Background `var(--colors-primary-focus)` (`#6366f1`) with pure white text, font-weight 500, padding `8px 16px`. Hover transitions to `#4f46e5` / `#4648d4`.
- **Secondary / Ghost:** Soft slate background (`#f1f5f9`) or transparent with slate text hover.

### Hero Safe to Spend Card (Signature Component)
- **Shape:** `16px` rounded container with `1px solid #e2e8f0` border and pure white surface.
- **Content:** Top metadata row with "SAFE TO SPEND" uppercase tracking label, adjacent pace status pill, and simulation launcher; dominant centered daily tabular amount (`36px` to `40px`); bottom contextual cycle progression bar and cycle-end date reminder.

### Chips & Badges
- **Style:** Pill shape (`rounded-full`), `px-2.5 py-0.5`, text `11px` or `12px` font-semibold.
- **Status Pills:** Include an inline `6px` colored dot indicator alongside the status label text.

### Quick-Add Preset Buttons
- **Style:** Pill or `10px` rounded chips labeled `+10k`, `+20k`, `+50k`, `+100k` for rapid one-tap amount building.
- **State:** Tonal background `#f1f5f9` with instant active spring feedback (`active:scale-95`).

### Mobile Bottom Navigation Bar
- **Style:** Fixed bottom bar, backdrop-blur with semi-transparent white background (`bg-surface/90 backdrop-blur-md`), 1px top border (`border-t border-border-default`), ergonomic thumb reachable items with centered floating action button (FAB).

## Do's and Don'ts

### Do:
- **Do** anchor the Safe to Spend hero figure as the visual focal point of the dashboard.
- **Do** wrap every monetary value in `.tabular-nums` with explicit Indonesian Rupiah formatting (`Rp`).
- **Do** maintain a minimum 44px touch target on all clickable mobile elements and bottom navigation links.
- **Do** use soft tinted pill backgrounds (`bg-semantic-*-soft`) for pace status rather than heavy solid warnings.
- **Do** keep quick-add input flows achievable within 2 taps.

### Don't:
- **Don't** use alarmist, high-saturation pure red full-bleed card backgrounds that induce budgeting panic.
- **Don't** hide remaining cycle days or allowance start dates behind nested submenus.
- **Don't** use non-standard decorative fonts; preserve crisp legibility via Inter with proper tabular numerics.
- **Don't** introduce heavy, dark drop shadows that break the clean daylight ledger aesthetic.
