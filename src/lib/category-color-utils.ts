/**
 * Category Color Utilities for SakuMahasiswa
 * Supports both:
 * - DARK:  Obsidian & Muted Gold (calibrated for deep obsidian surfaces)
 * - LIGHT: Warm Ivory & Muted Gold (calibrated for warm paper-like surfaces)
 *
 * Preserves authentic category identity from `category.color` while muting
 * saturation and calibrating contrast for high readability.
 */

export interface MutedCategoryStyle {
  color: string;
  chartColor: string;
  backgroundColor: string;
  borderColor: string;
}

export function getMutedCategoryStyle(
  rawColor?: string | null,
  isDark?: boolean
): MutedCategoryStyle {
  const activeDark =
    typeof isDark === 'boolean'
      ? isDark
      : typeof document !== 'undefined'
      ? document.documentElement.getAttribute('data-theme') !== 'light'
      : true;

  if (!rawColor || typeof rawColor !== 'string') {
    return activeDark
      ? {
          color: '#D6B875', // Champagne Gold
          chartColor: '#D6B875',
          backgroundColor: 'rgba(214, 184, 117, 0.10)',
          borderColor: 'rgba(214, 184, 117, 0.16)',
        }
      : {
          color: '#936B1E', // Antique Bronze-Gold
          chartColor: '#B0893E',
          backgroundColor: 'rgba(176, 137, 62, 0.10)',
          borderColor: 'rgba(176, 137, 62, 0.20)',
        };
  }

  // Parse Hex
  let hex = rawColor.replace('#', '').trim();
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return activeDark
      ? {
          color: '#D6B875',
          chartColor: '#D6B875',
          backgroundColor: 'rgba(214, 184, 117, 0.10)',
          borderColor: 'rgba(214, 184, 117, 0.16)',
        }
      : {
          color: '#936B1E',
          chartColor: '#B0893E',
          backgroundColor: 'rgba(176, 137, 62, 0.10)',
          borderColor: 'rgba(176, 137, 62, 0.20)',
        };
  }

  // Convert RGB to HSL
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }

  if (activeDark) {
    // Calibrate for Obsidian Dark Mode:
    // - Saturation: desaturated down to 36-52% to eliminate harsh glare while preserving clear hue
    // - Lightness: calibrated to 64-72% so icons are crisp and readable against dark obsidian backgrounds
    const targetS = Math.round(Math.min(Math.max(s * 100 * 0.7, 36), 52));
    const targetL = Math.round(Math.min(Math.max(l * 100, 64), 72));

    const mutedForeground = `hsl(${h}, ${targetS}%, ${targetL}%)`;
    const mutedBg = `hsla(${h}, ${targetS}%, ${targetL}%, 0.10)`;
    const mutedBorder = `hsla(${h}, ${targetS}%, ${targetL}%, 0.16)`;

    return {
      color: mutedForeground,
      chartColor: mutedForeground,
      backgroundColor: mutedBg,
      borderColor: mutedBorder,
    };
  } else {
    // Calibrate for Warm Ivory Light Mode:
    // - Preserves authentic category hue
    // - Foreground text/icon: deeper tone with enough contrast (lightness 34-40%) to pass WCAG AA/AAA on warm ivory
    // - Chart color: balanced lightness (44-50%) for crisp visibility on light charts
    // - Background: subtle 10% wash
    // - Border: 18% subtle boundary
    const targetS = Math.round(Math.min(Math.max(s * 100 * 0.7, 38), 55));
    const targetLText = Math.round(Math.min(Math.max(l * 100 * 0.6, 34), 40));
    const targetLChart = Math.round(Math.min(Math.max(l * 100 * 0.8, 44), 50));

    const mutedForeground = `hsl(${h}, ${targetS}%, ${targetLText}%)`;
    const chartColor = `hsl(${h}, ${targetS}%, ${targetLChart}%)`;
    const mutedBg = `hsla(${h}, ${targetS}%, ${targetLText}%, 0.10)`;
    const mutedBorder = `hsla(${h}, ${targetS}%, ${targetLText}%, 0.18)`;

    return {
      color: mutedForeground,
      chartColor: chartColor,
      backgroundColor: mutedBg,
      borderColor: mutedBorder,
    };
  }
}
