import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCompactCurrency, getLocalDateString, formatRelativeDate } from './formatters';

describe('Currency Formatters', () => {
  it('formats Indonesian Rupiah properly', () => {
    const formatted = formatCurrency(50000);
    expect(formatted).toContain('50.000');
    expect(formatted).toContain('Rp');
  });

  it('formats compact currencies correctly for mobile', () => {
    expect(formatCompactCurrency(50000)).toContain('50 rb');
    expect(formatCompactCurrency(1500000)).toContain('1,5 jt');
    expect(formatCompactCurrency(1000000000)).toContain('1 M');
  });
});

describe('Date Formatters', () => {
  it('formats local date without UTC shift', () => {
    const testDate = new Date(2026, 8, 25, 1, 30, 0); // Sep 25, 2026 01:30 AM local time
    expect(getLocalDateString(testDate)).toBe('2026-09-25');
  });

  it('formats relative date correctly for today', () => {
    const todayStr = getLocalDateString(new Date());
    expect(formatRelativeDate(todayStr)).toBe('Hari ini');
  });
});

