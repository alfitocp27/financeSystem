---
name: SakuMahasiswa
description: Mobile-first personal finance web app with dynamic Safe to Spend engine for Indonesian college students
colors:
  primary: "#b9924f"
  primary-hover: "#c7a35f"
  primary-focus: "#d6b875"
  primary-soft: "rgba(185, 146, 79, 0.12)"
  neutral-bg: "#0b0d11"
  neutral-surface: "#14171f"
  neutral-elevated: "#1c2029"
  neutral-modal: "#222734"
  neutral-text: "#f3f4f6"
  neutral-secondary: "#9ca3af"
  neutral-muted: "#8a93a0"
  border-default: "rgba(255, 255, 255, 0.08)"
  border-subtle: "rgba(255, 255, 255, 0.04)"
  border-gold: "rgba(185, 146, 79, 0.18)"
  safe-green: "#5f8a70"
  safe-green-text: "#6f9e82"
  safe-green-soft: "rgba(95, 138, 112, 0.14)"
  alert-rose: "#a85f68"
  alert-rose-text: "#b96e78"
  alert-rose-soft: "rgba(168, 95, 104, 0.14)"
  warning-amber: "#a98245"
  warning-amber-text: "#be9553"
  warning-amber-soft: "rgba(169, 130, 69, 0.14)"
  info-blue: "#6683a3"
  info-blue-text: "#7796b8"
  info-blue-soft: "rgba(102, 131, 163, 0.14)"
  neutral-charcoal: "#4f5765"
typography:
  hero-display:
    fontFamily: "Inter, system-ui, -apple-system, sans-serif"
    fontSize: "52px"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "-0.03em"
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
    backgroundColor: "{colors.primary}"
    textColor: "#0b0d11"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  card-base:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    rounded: "{rounded.lg}"
    padding: "20px"
---

# Design System: SakuMahasiswa

## Overview

**Creative North Star: "Obsidian & Muted Gold" (Luxury Dark Executive)**

SakuMahasiswa is built around the feeling of stepping into a calm, private study—an understated, obsidian-toned ledger with refined satin gold accents. Instead of confronting students with high-glare white spreadsheets, flashing neon crypto graphics, or anxiety-inducing debt alarms, it delivers quiet dignity and serene mastery: an acoustic baffle against financial noise that answers the daily question: *"Berapa yang aman saya belanjakan hari ini?"*

The system rejects pure pitch-black `#000000` (which causes OLED smearing and harsh contrast) in favor of deep, warm charcoal obsidian (`#0b0d11` root canvas, `#14171f` card surfaces, and `#1c2029` elevated rows). Muted champagne and satin gold (`#c5a059` / `#dfc184`) are used with surgical restraint—on <5% of total screen pixels—serving as hairline anchors for key interactive states and the hero Safe to Spend metric. Semantic alerts use desaturated, elegant sage, ochre, and coral tones with 12% translucent backdrops.

**Key Characteristics:**
- Deep obsidian and warm charcoal surfaces that absorb cognitive glare.
- Dominant Safe to Spend hero figure gleaming in Champagne Gold (`#dfc184`).
- Monastic color discipline: no rainbow confetti or saturated neon clutter.
- Mobile-first ergonomic touch zones (minimum 44px) built for rapid, discrete one-handed inputs.

## Colors

The palette balances warm obsidian darks with brushed satin gold accents and calm, desaturated semantic signals.

### Primary & Accent
- **Satin Gold** (`#c5a059`): Primary brand anchor, active tab icons, and primary action buttons.
- **Champagne Gold** (`#dfc184`): Display numbers and high-contrast monetary highlights.
- **Classic Gold Hover** (`#d4af37`): Interactive hover feedback for primary triggers.
- **Gold Mist Tint** (`rgba(197, 160, 89, 0.12)`): Translucent badge fills and active container glows.

### Neutral Surfaces
- **Obsidian Canvas** (`#0b0d11`): Global viewport base background.
- **Charcoal Card Surface** (`#14171f`): Standard cards, sidebar, and navbar containers.
- **Elevated Surface** (`#1c2029`): Table rows, progress bar tracks, inputs, and hover states.
- **Modal Surface** (`#222734`): Floating dialogs and bottom sheets.
- **Off-White Text** (`#f3f4f6`): Crisp, glare-free primary text and tabular numerals.
- **Muted Slate Gray** (`#9ca3af`): Supporting labels, cycle subtext, and metadata.
- **Deep Steel Muted** (`#656e7b`): Hairline dividers, inactive icons, and timestamps.
- **Hairline Border** (`rgba(255, 255, 255, 0.08)`): Subtle card edges and section lines.

### Status (Semantic)
- **Sage Emerald** (`#34d399`, soft `rgba(52, 211, 153, 0.12)`): Safe spending within pace.
- **Muted Ochre** (`#fbbf24`, soft `rgba(245, 158, 11, 0.12)`): Warning pace; daily quota near limit.
- **Terracotta Coral** (`#fb7185`, soft `rgba(251, 113, 133, 0.12)`): Overpace alert; compassionate advisory.
- **Soft Sky** (`#60a5fa`, soft `rgba(96, 165, 250, 0.12)`): Informational items and transfers.

### Named Rules
**The Restrained Gold Rule.** Gold is a privilege, not wallpaper. It must never exceed 5% of viewport pixels. Gold belongs exclusively to the Safe to Spend hero number, active navigation triggers, and focused interactive states.

**The Soft-Shield Rule.** Semantic status alerts never use screaming saturated full-flood backgrounds. They must always use 12% translucent backgrounds paired with crisp text and subtle status pips, eliminating panic while preserving clarity.

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
