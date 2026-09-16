import type { Transaction, Wallet } from '../types/database.types';

/**
 * Menghitung total saldo kas positif dari daftar akun aktif.
 * Mengabaikan akun bersaldo negatif (defisit/overdraft) dan akun terarsip (is_active === false).
 */
export function calculateTotalPositiveBalance(wallets: { balance: number; is_active: boolean }[]): number {
  return wallets
    .filter((w) => w.is_active && Number(w.balance) > 0)
    .reduce((acc, w) => acc + Number(w.balance), 0);
}

/**
 * Menghitung persentase pangsa likuiditas dompet terhadap total aset kas positif.
 * Menggunakan totalPositiveBalance (bukan total net balance) untuk mencegah anomali >100% (misal 137%)
 * jika terdapat akun aktif lain yang bersaldo negatif.
 */
export function calculateLiquidityShare(walletBalance: number, totalPositiveBalance: number): number {
  if (totalPositiveBalance <= 0 || walletBalance <= 0) return 0;
  return Math.round((walletBalance / totalPositiveBalance) * 100);
}

export type WalletDeletionPolicy =
  | 'cannot_delete_last'
  | 'cannot_delete_has_balance'
  | 'archive_recommended'
  | 'hard_delete_allowed';

/**
 * Menentukan kebijakan apakah dompet boleh dihapus, diarsip, atau ditolak
 */
export function getWalletDeletionPolicy(
  wallet: { balance: number },
  hasTransactions: boolean,
  totalActiveWalletsCount: number
): WalletDeletionPolicy {
  if (totalActiveWalletsCount <= 1) {
    return 'cannot_delete_last';
  }
  if (wallet.balance > 0) {
    return 'cannot_delete_has_balance';
  }
  if (hasTransactions) {
    return 'archive_recommended';
  }
  return 'hard_delete_allowed';
}

export interface ActivityDirectionInfo {
  direction: 'inflow' | 'outflow' | 'transfer_neutral';
  sign: '+' | '-' | '';
  label: string;
}

/**
 * Menentukan arah aliran dana (+ / -), jenis mutasi, dan label rekening terkait
 */
export function determineActivityDirection(
  tx: Transaction,
  selectedWalletId: string | 'all',
  wallets: Wallet[] = []
): ActivityDirectionInfo {
  const getWalletName = (id: string | null | undefined) => {
    if (!id) return 'Dompet';
    return wallets.find((w) => w.id === id)?.name || 'Dompet';
  };

  if (selectedWalletId === 'all') {
    if (tx.type === 'income') {
      return {
        direction: 'inflow',
        sign: '+',
        label: tx.note || 'Pemasukan',
      };
    }
    if (tx.type === 'expense') {
      return {
        direction: 'outflow',
        sign: '-',
        label: tx.note || 'Pengeluaran',
      };
    }
    // Transfer antar dompet dalam mode semua akun
    const fromName = getWalletName(tx.wallet_id);
    const toName = getWalletName(tx.destination_wallet_id);
    return {
      direction: 'transfer_neutral',
      sign: '',
      label: `${fromName} → ${toName}`,
    };
  }

  // Filter khusus dompet tertentu
  if (tx.type === 'transfer') {
    if (tx.wallet_id === selectedWalletId) {
      const toName = getWalletName(tx.destination_wallet_id);
      return {
        direction: 'outflow',
        sign: '-',
        label: `Transfer ke ${toName}`,
      };
    }
    if (tx.destination_wallet_id === selectedWalletId) {
      const fromName = getWalletName(tx.wallet_id);
      return {
        direction: 'inflow',
        sign: '+',
        label: `Transfer dari ${fromName}`,
      };
    }
  }

  if (tx.type === 'income') {
    return {
      direction: 'inflow',
      sign: '+',
      label: tx.note || 'Pemasukan',
    };
  }

  return {
    direction: 'outflow',
    sign: '-',
    label: tx.note || 'Pengeluaran',
  };
}

/**
 * Memfilter transaksi akun dengan menangkap aliran transfer dua arah
 */
export function filterAccountActivity(
  transactions: Transaction[],
  selectedWalletId: string | 'all',
  limit: number = 15
): Transaction[] {
  if (selectedWalletId === 'all') {
    return transactions.slice(0, limit);
  }

  return transactions
    .filter((t) => {
      if (t.wallet_id === selectedWalletId) return true;
      if (t.type === 'transfer' && t.destination_wallet_id === selectedWalletId) return true;
      return false;
    })
    .slice(0, limit);
}
