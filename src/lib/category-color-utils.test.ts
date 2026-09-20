import { describe, it, expect } from 'vitest';
import { getMutedCategoryStyle } from './category-color-utils';

describe('category-color-utils: getMutedCategoryStyle', () => {
  describe('Dark Mode (default)', () => {
    it('returns champagne gold fallback when no color is provided', () => {
      const style = getMutedCategoryStyle(null, true);
      expect(style.color).toBe('#D6B875');
      expect(style.backgroundColor).toContain('0.10');
      expect(style.borderColor).toContain('0.16');
    });

    it('correctly derives muted teal from #14b8a6 (Belanja Harian)', () => {
      const style = getMutedCategoryStyle('#14b8a6', true);
      // Hue for #14b8a6 is 173 (teal)
      expect(style.color).toContain('hsl(173');
      expect(style.backgroundColor).toContain('hsla(173');
      expect(style.backgroundColor).toContain('0.10');
      expect(style.borderColor).toContain('0.16');
    });

    it('correctly derives muted orange from #f59e0b (Transportasi)', () => {
      const style = getMutedCategoryStyle('#f59e0b', true);
      // Hue for orange is ~38
      expect(style.color).toContain('hsl(38');
      expect(style.backgroundColor).toContain('hsla(38');
    });

    it('correctly derives muted blue from #2563eb (Makanan)', () => {
      const style = getMutedCategoryStyle('#2563eb', true);
      // Hue for blue is ~221
      expect(style.color).toContain('hsl(221');
      expect(style.backgroundColor).toContain('hsla(221');
    });

    it('correctly derives muted pink from #ec4899 (Hiburan)', () => {
      const style = getMutedCategoryStyle('#ec4899', true);
      // Hue for pink is ~330
      expect(style.color).toContain('hsl(330');
      expect(style.backgroundColor).toContain('hsla(330');
    });

    it('handles 3-digit hex (#f00)', () => {
      const style = getMutedCategoryStyle('#f00', true);
      expect(style.color).toContain('hsl(0');
    });

    it('handles invalid hex gracefully with fallback', () => {
      const style = getMutedCategoryStyle('invalid-color', true);
      expect(style.color).toBe('#D6B875');
    });
  });

  describe('Light Mode', () => {
    it('returns rich antique gold fallback when no color is provided', () => {
      const style = getMutedCategoryStyle(null, false);
      expect(style.color).toBe('#936B1E');
      expect(style.chartColor).toBe('#B0893E');
      expect(style.backgroundColor).toContain('0.10');
      expect(style.borderColor).toContain('0.20');
    });

    it('preserves authentic hue while providing dark, readable contrast in light mode', () => {
      const tealStyle = getMutedCategoryStyle('#14b8a6', false);
      // Hue 173 preserved
      expect(tealStyle.color).toContain('hsl(173');
      expect(tealStyle.chartColor).toContain('hsl(173');
      expect(tealStyle.backgroundColor).toContain('hsla(173');

      const blueStyle = getMutedCategoryStyle('#2563eb', false);
      // Hue 221 preserved
      expect(blueStyle.color).toContain('hsl(221');

      const orangeStyle = getMutedCategoryStyle('#f59e0b', false);
      // Hue 38 preserved
      expect(orangeStyle.color).toContain('hsl(38');
    });
  });
});
