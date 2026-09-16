import type { Transaction } from '../types/database.types';
import { formatDateIndo, getLocalDateString } from './formatters';

export interface DateGroupedTransactions {
  date: string; // YYYY-MM-DD
  label: string; // 'Hari Ini' | 'Kemarin' | '14 Sep 2026'
  fullFormattedDate: string; // '14 Sep 2026'
  transactions: Transaction[];
  dailyExpenseTotal: number; // Pengeluaran riil harian (type === 'expense')
  dailyIncomeTotal: number; // Pemasukan riil harian (type === 'income')
  hasTransfers: boolean; // Menandakan ada mutasi transfer di hari ini
}

/**
 * Menghasilkan label pengelompokan tanggal:
 * - 'Hari Ini' untuk tanggal saat ini
 * - 'Kemarin' untuk H-1
 * - Tanggal formal Indonesia (misal '14 Sep 2026') untuk tanggal lainnya
 */
export function getDateGroupLabel(
  dateStr: string,
  referenceDate: Date = new Date()
): { label: string; fullFormattedDate: string } {
  const todayStr = getLocalDateString(referenceDate);
  const yesterdayStr = getLocalDateString(new Date(referenceDate.getTime() - 86400000));
  const fullFormattedDate = formatDateIndo(dateStr);

  if (dateStr === todayStr) {
    return { label: 'Hari Ini', fullFormattedDate };
  }
  if (dateStr === yesterdayStr) {
    return { label: 'Kemarin', fullFormattedDate };
  }
  return { label: fullFormattedDate, fullFormattedDate };
}

/**
 * Mengelompokkan transaksi per tanggal dan menghitung subtotal harian
 * tanpa double-counting mutasi transfer.
 */
export function groupTransactionsByDate(
  transactions: Transaction[],
  referenceDate: Date = new Date()
): DateGroupedTransactions[] {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  // 1. Urutkan transaksi dari tanggal terbaru ke terlama (descending)
  const sorted = [...transactions].sort((a, b) => {
    if (a.transaction_date !== b.transaction_date) {
      return b.transaction_date.localeCompare(a.transaction_date);
    }
    // Jika tanggal sama, urutkan berdasarkan created_at jika tersedia
    const aCreated = a.created_at || '';
    const bCreated = b.created_at || '';
    return bCreated.localeCompare(aCreated);
  });

  // 2. Kumpulkan ke dalam map berdasarkan transaction_date
  const groupsMap = new Map<string, Transaction[]>();
  sorted.forEach((tx) => {
    const key = tx.transaction_date;
    const existing = groupsMap.get(key);
    if (existing) {
      existing.push(tx);
    } else {
      groupsMap.set(key, [tx]);
    }
  });

  // 3. Bangun objek DateGroupedTransactions
  const result: DateGroupedTransactions[] = [];
  groupsMap.forEach((txs, dateKey) => {
    const { label, fullFormattedDate } = getDateGroupLabel(dateKey, referenceDate);

    let expenseTotal = 0;
    let incomeTotal = 0;
    let hasTransfers = false;

    txs.forEach((t) => {
      // Subtotal harian hanya menjumlahkan belanja konsumtif murni dan pemasukan riil (tabungan & transfer dikecualikan)
      if (t.type === 'expense' && !t.goal_id) {
        expenseTotal += Number(t.amount) || 0;
      } else if (t.type === 'income' && !t.goal_id) {
        incomeTotal += Number(t.amount) || 0;
      } else if (t.type === 'transfer') {
        hasTransfers = true;
      }
    });

    result.push({
      date: dateKey,
      label,
      fullFormattedDate,
      transactions: txs,
      dailyExpenseTotal: expenseTotal,
      dailyIncomeTotal: incomeTotal,
      hasTransfers,
    });
  });

  return result;
}

/**
 * Mengekstrak waktu (HH:mm) dari ISO timestamp jika valid
 */
export function formatTransactionTime(timestampStr?: string | null): string {
  if (!timestampStr) return '';
  try {
    const d = new Date(timestampStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

export interface TransferDisplayInfo {
  direction: 'inflow' | 'outflow' | 'neutral';
  sign: string;
  description: string;
  colorClass: string;
  accessibleText: string;
}

/**
 * Menentukan tampilan transfer berdasarkan filter dompet yang sedang aktif:
 * - Jika filter dompet tertentu: transfer keluar ditandai '-' rose ('Transfer ke [Dest]'),
 *   transfer masuk ditandai '+' green ('Transfer dari [Source]').
 * - Jika filter 'Semua Dompet': tampil netral '[Source] ➔ [Dest]' tanpa tanda +/-.
 */
export function determineTransferDisplay(
  tx: Transaction,
  selectedWalletId: string,
  sourceWalletName: string,
  destWalletName: string,
  formattedAmount: string
): TransferDisplayInfo {
  if (selectedWalletId !== 'all') {
    if (tx.destination_wallet_id === selectedWalletId) {
      return {
        direction: 'inflow',
        sign: '+ ',
        description: `Transfer dari ${sourceWalletName}`,
        colorClass: 'text-semantic-green-text',
        accessibleText: `Transfer masuk dari ${sourceWalletName}, bertambah ${formattedAmount}`,
      };
    }
    if (tx.wallet_id === selectedWalletId) {
      return {
        direction: 'outflow',
        sign: '- ',
        description: `Transfer ke ${destWalletName}`,
        colorClass: 'text-semantic-rose-text',
        accessibleText: `Transfer keluar ke ${destWalletName}, berkurang ${formattedAmount}`,
      };
    }
  }

  return {
    direction: 'neutral',
    sign: '',
    description: `${sourceWalletName} ➔ ${destWalletName}`,
    colorClass: 'text-text-primary',
    accessibleText: `Transfer dari ${sourceWalletName} ke ${destWalletName}, ${formattedAmount}`,
  };
}

/**
 * Menghasilkan baris CSV untuk dataset transaksi yang sudah terfilter dengan UTF-8 BOM
 */
export function generateTransactionCsvRows(
  transactions: Transaction[],
  getCategoryName: (id?: string | null) => string,
  getWalletName: (id: string) => string
): { headers: string[]; rows: string[]; csvContent: string } {
  const headers = [
    'Tanggal',
    'Tipe',
    'Kategori',
    'Dompet Asal',
    'Dompet Tujuan',
    'Nominal (IDR)',
    'Catatan',
  ];
  const rows = transactions.map((tx) => {
    let typeLabel = tx.type as string;
    if (tx.goal_id) {
      if (tx.type === 'expense') typeLabel = 'Alokasi Tabungan';
      else if (tx.type === 'income') typeLabel = 'Pencairan Tabungan';
    }

    const cat = getCategoryName(tx.category_id) || (tx.type === 'transfer' ? 'Transfer' : tx.goal_id ? 'Target Tabungan' : '-');
    const wOrigin = getWalletName(tx.wallet_id);
    const wDest = tx.destination_wallet_id ? getWalletName(tx.destination_wallet_id) : '-';
    const cleanNote = (tx.note || '').replace(/"/g, '""');

    return [
      tx.transaction_date,
      `"${typeLabel}"`,
      `"${cat}"`,
      `"${wOrigin}"`,
      `"${wDest}"`,
      tx.amount,
      `"${cleanNote}"`,
    ].join(',');
  });

  const csvContent =
    'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');

  return { headers, rows, csvContent };
}

