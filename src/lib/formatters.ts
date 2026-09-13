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
    return `Rp ${(amount / 1_000_000_000).toFixed(1).replace('.0', '').replace('.', ',')} M`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',')} jt`;
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
 * Mengambil string tanggal lokal YYYY-MM-DD tanpa pergeseran timezone UTC
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format tanggal relatif (Hari Ini, Kemarin, dsb)
 */
export function formatRelativeDate(dateStr: string): string {
  const today = getLocalDateString(new Date());
  const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

  if (dateStr === today) return 'Hari ini';
  if (dateStr === yesterday) return 'Kemarin';
  return formatDateIndo(dateStr);
}
