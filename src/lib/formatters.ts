/**
 * Format angka ke mata uang Rupiah (IDR)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format ringkas untuk dashboard mobile (e.g., 50.000 -> 50 rb, 1.500.000 -> 1,5 jt)
 */
export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1).replace('.0', '')} M`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1).replace('.0', '')} jt`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `Rp ${(amount / 1_000).toFixed(0)} rb`;
  }
  return formatCurrency(amount);
}

/**
 * Format tanggal dalam format Indonesia
 */
export function formatDateIndo(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format tanggal relatif (Hari Ini, Kemarin, dsb)
 */
export function formatRelativeDate(dateStr: string): string {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (dateStr === today) return 'Hari ini';
  if (dateStr === yesterday) return 'Kemarin';
  return formatDateIndo(dateStr);
}
