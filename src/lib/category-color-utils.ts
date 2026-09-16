/**
 * Category Color Utilities for SakuMahasiswa (Obsidian & Muted Gold Design System)
 *
 * Preserves authentic category identity from `category.color` while muting
 * saturation and calibrating contrast for executive dark surfaces:
 * - Foreground: Muted tone preserving original hue (saturation ~40-52%, lightness ~64-72%)
 * - Background: Subtle translucent wash (8-12% opacity)
 * - Border: Hairline boundary (12-18% opacity)
 *
 * Eliminates aggressive neon/clashing glare while keeping each category's distinct identity.
 */

export interface MutedCategoryStyle {
  color: string;
  chartColor: string;
  backgroundColor: string;
  borderColor: string;
}

export function getMutedCategoryStyle(rawColor?: string | null): MutedCategoryStyle {
  if (!rawColor || typeof rawColor !== 'string') {
    return {
      color: '#D6B875', // Fallback Champagne Gold
      chartColor: '#D6B875',
      backgroundColor: 'rgba(214, 184, 117, 0.10)',
      borderColor: 'rgba(214, 184, 117, 0.16)',
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
    return {
      color: '#D6B875',
      chartColor: '#D6B875',
      backgroundColor: 'rgba(214, 184, 117, 0.10)',
      borderColor: 'rgba(214, 184, 117, 0.16)',
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

  // Calibrate for Obsidian Dark Mode:
  // - Saturation: desaturated down to 42-52% to eliminate harsh glare while preserving clear hue
  // - Lightness: calibrated to 65-72% so icons are crisp and readable against dark obsidian backgrounds
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
}
