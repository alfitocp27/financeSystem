import { describe, it, expect } from 'vitest';
import {
  getDateGroupLabel,
  groupTransactionsByDate,
  formatTransactionTime,
  determineTransferDisplay,
  generateTransactionCsvRows,
} from './transaction-ledger-utils';
import type { Transaction } from '../types/database.types';

describe('transaction-ledger-utils', () => {
  const refDate = new Date('2026-09-16T10:00:00Z');

  describe('getDateGroupLabel', () => {
    it('returns "Hari Ini" for current date', () => {
      const { label } = getDateGroupLabel('2026-09-16', refDate);
      expect(label).toBe('Hari Ini');
    });

    it('returns "Kemarin" for yesterday', () => {
      const { label } = getDateGroupLabel('2026-09-15', refDate);
      expect(label).toBe('Kemarin');
    });

    it('returns formal Indonesian date for earlier dates', () => {
      const { label } = getDateGroupLabel('2026-09-14', refDate);
      // 14 Sep 2026
      expect(label).toMatch(/14\s+Sep\s+2026/);
    });
  });

  describe('groupTransactionsByDate', () => {
    it('returns empty array when transactions is empty', () => {
      expect(groupTransactionsByDate([], refDate)).toEqual([]);
    });

    it('groups transactions by date in descending order', () => {
      const mockTxs: Transaction[] = [
        {
          id: 'tx-1',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: 'c-1',
          goal_id: null,
          type: 'expense',
          amount: 25000,
          transaction_date: '2026-09-15',
          destination_wallet_id: null,
          note: 'Makan Siang',
          created_at: '2026-09-15T12:00:00Z',
        },
        {
          id: 'tx-2',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: 'c-1',
          goal_id: null,
          type: 'expense',
          amount: 15000,
          transaction_date: '2026-09-16',
          destination_wallet_id: null,
          note: 'Kopi',
          created_at: '2026-09-16T09:00:00Z',
        },
        {
          id: 'tx-3',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: 'c-1',
          goal_id: null,
          type: 'expense',
          amount: 30000,
          transaction_date: '2026-09-16',
          destination_wallet_id: null,
          note: 'Makan Malam',
          created_at: '2026-09-16T19:00:00Z',
        },
      ];

      const groups = groupTransactionsByDate(mockTxs, refDate);
      expect(groups).toHaveLength(2);

      // First group: Hari Ini (2026-09-16)
      expect(groups[0].date).toBe('2026-09-16');
      expect(groups[0].label).toBe('Hari Ini');
      expect(groups[0].transactions).toHaveLength(2);
      expect(groups[0].dailyExpenseTotal).toBe(45000);

      // Second group: Kemarin (2026-09-15)
      expect(groups[1].date).toBe('2026-09-15');
      expect(groups[1].label).toBe('Kemarin');
      expect(groups[1].transactions).toHaveLength(1);
      expect(groups[1].dailyExpenseTotal).toBe(25000);
    });

    it('does NOT count transfer amounts in dailyExpenseTotal or dailyIncomeTotal', () => {
      const mockTxs: Transaction[] = [
        {
          id: 'tx-exp',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: 'c-1',
          goal_id: null,
          type: 'expense',
          amount: 50000,
          transaction_date: '2026-09-16',
          destination_wallet_id: null,
          note: 'Belanja Buku',
          created_at: '2026-09-16T10:00:00Z',
        },
        {
          id: 'tx-tf',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: null,
          goal_id: null,
          type: 'transfer',
          amount: 200000,
          transaction_date: '2026-09-16',
          destination_wallet_id: 'w-2',
          note: 'Topup e-wallet',
          created_at: '2026-09-16T11:00:00Z',
        },
        {
          id: 'tx-inc',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: 'c-salary',
          goal_id: null,
          type: 'income',
          amount: 150000,
          transaction_date: '2026-09-16',
          destination_wallet_id: null,
          note: 'Freelance',
          created_at: '2026-09-16T14:00:00Z',
        },
      ];

      const groups = groupTransactionsByDate(mockTxs, refDate);
      expect(groups).toHaveLength(1);

      const todayGroup = groups[0];
      // Expense total must strictly be 50.000 (NOT 250.000 from transfer)
      expect(todayGroup.dailyExpenseTotal).toBe(50000);
      // Income total must strictly be 150.000
      expect(todayGroup.dailyIncomeTotal).toBe(150000);
      // Flag hasTransfers must be true
      expect(todayGroup.hasTransfers).toBe(true);
      // All 3 transactions remain in the list
      expect(todayGroup.transactions).toHaveLength(3);
    });
  });

  describe('formatTransactionTime', () => {
    it('formats ISO time string to local HH:mm format', () => {
      const timeStr = formatTransactionTime('2026-09-16T14:35:00Z');
      expect(timeStr).toMatch(/\d{2}[.:]\d{2}/);
    });

    it('returns empty string if timestamp is invalid or missing', () => {
      expect(formatTransactionTime(undefined)).toBe('');
      expect(formatTransactionTime('invalid-date')).toBe('');
    });
  });

  describe('determineTransferDisplay', () => {
    const mockTransferTx: Transaction = {
      id: 'tx-tf-1',
      user_id: 'demo',
      wallet_id: 'w-bca',
      category_id: null,
      goal_id: null,
      type: 'transfer',
      amount: 100000,
      transaction_date: '2026-09-16',
      destination_wallet_id: 'w-gopay',
      note: 'Top Up GoPay',
      created_at: '2026-09-16T10:00:00Z',
    };

    it('returns neutral representation when filter is "all"', () => {
      const display = determineTransferDisplay(
        mockTransferTx,
        'all',
        'BCA Utama',
        'GoPay',
        'Rp 100.000'
      );

      expect(display.direction).toBe('neutral');
      expect(display.sign).toBe('');
      expect(display.description).toBe('BCA Utama ➔ GoPay');
      expect(display.colorClass).toBe('text-text-primary');
      expect(display.accessibleText).toContain('Transfer dari BCA Utama ke GoPay, Rp 100.000');
    });

    it('returns outgoing representation with - sign and semantic rose when source wallet is filtered', () => {
      const display = determineTransferDisplay(
        mockTransferTx,
        'w-bca', // Filtered by source
        'BCA Utama',
        'GoPay',
        'Rp 100.000'
      );

      expect(display.direction).toBe('outflow');
      expect(display.sign).toBe('- ');
      expect(display.description).toBe('Transfer ke GoPay');
      expect(display.colorClass).toBe('text-semantic-rose-text');
      expect(display.accessibleText).toContain('Transfer keluar ke GoPay, berkurang Rp 100.000');
    });

    it('returns incoming representation with + sign and semantic green when destination wallet is filtered', () => {
      const display = determineTransferDisplay(
        mockTransferTx,
        'w-gopay', // Filtered by destination
        'BCA Utama',
        'GoPay',
        'Rp 100.000'
      );

      expect(display.direction).toBe('inflow');
      expect(display.sign).toBe('+ ');
      expect(display.description).toBe('Transfer dari BCA Utama');
      expect(display.colorClass).toBe('text-semantic-green-text');
      expect(display.accessibleText).toContain('Transfer masuk dari BCA Utama, bertambah Rp 100.000');
    });
  });

  describe('generateTransactionCsvRows', () => {
    it('generates CSV with UTF-8 BOM and escaped fields', () => {
      const mockTxs: Transaction[] = [
        {
          id: 'tx-1',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: 'c-1',
          goal_id: null,
          type: 'expense',
          amount: 25000,
          transaction_date: '2026-09-16',
          destination_wallet_id: null,
          note: 'Makan "Spesial"',
          created_at: '2026-09-16T12:00:00Z',
        },
        {
          id: 'tx-2',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: null,
          goal_id: null,
          type: 'transfer',
          amount: 50000,
          transaction_date: '2026-09-16',
          destination_wallet_id: 'w-2',
          note: null,
          created_at: '2026-09-16T13:00:00Z',
        },
      ];

      const getCategoryName = (id?: string | null) => (id === 'c-1' ? 'Makanan' : '');
      const getWalletName = (id: string) => (id === 'w-1' ? 'BCA' : 'GoPay');

      const { headers, rows, csvContent } = generateTransactionCsvRows(
        mockTxs,
        getCategoryName,
        getWalletName
      );

      expect(headers).toHaveLength(7);
      expect(headers[0]).toBe('Tanggal');
      expect(rows).toHaveLength(2);

      // Verify row 1 (double quote escaping in note)
      expect(rows[0]).toContain('"Makan ""Spesial"""');
      expect(rows[0]).toContain('"Makanan"');
      expect(rows[0]).toContain('"BCA"');

      // Verify row 2 (transfer origin & destination)
      expect(rows[1]).toContain('"transfer"');
      expect(rows[1]).toContain('"BCA"');
      expect(rows[1]).toContain('"GoPay"');

      // Verify UTF-8 BOM
      expect(csvContent.startsWith('data:text/csv;charset=utf-8,\uFEFF')).toBe(true);
    });
  });

  describe('Backdated Transactions handling', () => {
    it('correctly places a backdated transaction created today into its past date group', () => {
      const mockTxs: Transaction[] = [
        {
          id: 'tx-today',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: 'c-1',
          goal_id: null,
          type: 'expense',
          amount: 20000,
          transaction_date: '2026-09-16', // Today
          destination_wallet_id: null,
          note: 'Kopi hari ini',
          created_at: '2026-09-16T10:00:00Z',
        },
        {
          id: 'tx-backdated',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: 'c-1',
          goal_id: null,
          type: 'expense',
          amount: 45000,
          transaction_date: '2026-09-13', // 3 days ago
          destination_wallet_id: null,
          note: 'Beli buku 3 hari lalu',
          created_at: '2026-09-16T10:05:00Z', // Recorded today!
        },
      ];

      const groups = groupTransactionsByDate(mockTxs, refDate);
      expect(groups).toHaveLength(2);

      // Group 0: Today (2026-09-16)
      expect(groups[0].date).toBe('2026-09-16');
      expect(groups[0].label).toBe('Hari Ini');
      expect(groups[0].dailyExpenseTotal).toBe(20000);
      expect(groups[0].transactions[0].id).toBe('tx-today');

      // Group 1: Past date (2026-09-13)
      expect(groups[1].date).toBe('2026-09-13');
      expect(groups[1].dailyExpenseTotal).toBe(45000);
      expect(groups[1].transactions[0].id).toBe('tx-backdated');
    });

    it('correctly calculates subtotal when multiple backdated transactions occur on the same historical date', () => {
      const mockTxs: Transaction[] = [
        {
          id: 'tx-1',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: 'c-1',
          goal_id: null,
          type: 'expense',
          amount: 30000,
          transaction_date: '2026-09-12',
          destination_wallet_id: null,
          note: null,
          created_at: '2026-09-16T08:00:00Z',
        },
        {
          id: 'tx-2',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: 'c-1',
          goal_id: null,
          type: 'expense',
          amount: 25000,
          transaction_date: '2026-09-12',
          destination_wallet_id: null,
          note: null,
          created_at: '2026-09-16T08:01:00Z',
        },
        {
          id: 'tx-3',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: null,
          goal_id: null,
          type: 'income',
          amount: 100000,
          transaction_date: '2026-09-12',
          destination_wallet_id: null,
          note: null,
          created_at: '2026-09-16T08:02:00Z',
        },
      ];

      const groups = groupTransactionsByDate(mockTxs, refDate);
      expect(groups).toHaveLength(1);
      expect(groups[0].date).toBe('2026-09-12');
      expect(groups[0].dailyExpenseTotal).toBe(55000); // 30k + 25k
      expect(groups[0].dailyIncomeTotal).toBe(100000);
      expect(groups[0].transactions).toHaveLength(3);
    });
  });
});

