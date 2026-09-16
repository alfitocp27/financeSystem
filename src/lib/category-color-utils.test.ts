import { describe, it, expect } from 'vitest';
import { getMutedCategoryStyle } from './category-color-utils';

describe('category-color-utils: getMutedCategoryStyle', () => {
  it('returns champagne gold fallback when no color is provided', () => {
    const style = getMutedCategoryStyle(null);
    expect(style.color).toBe('#D6B875');
    expect(style.backgroundColor).toContain('0.10');
    expect(style.borderColor).toContain('0.16');
  });

  it('correctly derives muted teal from #14b8a6 (Belanja Harian)', () => {
    const style = getMutedCategoryStyle('#14b8a6');
    // Hue for #14b8a6 is 173 (teal)
    expect(style.color).toContain('hsl(173');
    expect(style.backgroundColor).toContain('hsla(173');
    expect(style.backgroundColor).toContain('0.10');
    expect(style.borderColor).toContain('0.16');
  });

  it('correctly derives muted orange from #f59e0b (Transportasi)', () => {
    const style = getMutedCategoryStyle('#f59e0b');
    // Hue for orange is ~38
    expect(style.color).toContain('hsl(38');
    expect(style.backgroundColor).toContain('hsla(38');
  });

  it('correctly derives muted blue from #2563eb (Makanan)', () => {
    const style = getMutedCategoryStyle('#2563eb');
    // Hue for blue is ~221
    expect(style.color).toContain('hsl(221');
    expect(style.backgroundColor).toContain('hsla(221');
  });

  it('correctly derives muted pink from #ec4899 (Hiburan)', () => {
    const style = getMutedCategoryStyle('#ec4899');
    // Hue for pink is ~330
    expect(style.color).toContain('hsl(330');
    expect(style.backgroundColor).toContain('hsla(330');
  });

  it('handles 3-digit hex (#f00)', () => {
    const style = getMutedCategoryStyle('#f00');
    expect(style.color).toContain('hsl(0');
  });

  it('handles invalid hex gracefully with fallback', () => {
    const style = getMutedCategoryStyle('invalid-color');
    expect(style.color).toBe('#D6B875');
  });
});
