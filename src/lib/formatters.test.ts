import { describe, it, expect } from 'vitest';
import { formatCurrency, formatCompactCurrency } from './formatters';

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
