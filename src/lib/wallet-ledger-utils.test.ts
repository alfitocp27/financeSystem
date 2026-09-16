import { describe, it, expect } from 'vitest';
import {
  calculateLiquidityShare,
  calculateTotalPositiveBalance,
  getWalletDeletionPolicy,
  determineActivityDirection,
  filterAccountActivity,
} from './wallet-ledger-utils';
import type { Transaction, Wallet } from '../types/database.types';

describe('calculateTotalPositiveBalance & calculateLiquidityShare', () => {
  it('calculates 100% when there is only 1 active wallet', () => {
    const wallets = [{ balance: 1500000, is_active: true }];
    const totalPos = calculateTotalPositiveBalance(wallets);
    expect(totalPos).toBe(1500000);
    expect(calculateLiquidityShare(1500000, totalPos)).toBe(100);
  });

  it('calculates proportional share for 2 active wallets', () => {
    const wallets = [
      { balance: 750000, is_active: true },
      { balance: 250000, is_active: true },
    ];
    const totalPos = calculateTotalPositiveBalance(wallets);
    expect(totalPos).toBe(1000000);
    expect(calculateLiquidityShare(750000, totalPos)).toBe(75);
    expect(calculateLiquidityShare(250000, totalPos)).toBe(25);
  });

  it('calculates correct liquidity percentage for 3 active wallets', () => {
    const wallets = [
      { balance: 1850000, is_active: true },
      { balance: 620000, is_active: true },
      { balance: 380000, is_active: true },
    ];
    const totalPos = calculateTotalPositiveBalance(wallets);
    expect(totalPos).toBe(2850000);
    expect(calculateLiquidityShare(1850000, totalPos)).toBe(65);
    expect(calculateLiquidityShare(620000, totalPos)).toBe(22);
    expect(calculateLiquidityShare(380000, totalPos)).toBe(13);
  });

  it('returns 0 when totalBalance or totalPositiveBalance is 0 or negative', () => {
    expect(calculateLiquidityShare(50000, 0)).toBe(0);
    expect(calculateLiquidityShare(50000, -10000)).toBe(0);
  });

  it('returns 0 when walletBalance is 0 or negative', () => {
    expect(calculateLiquidityShare(0, 1000000)).toBe(0);
    expect(calculateLiquidityShare(-5000, 1000000)).toBe(0);
  });

  it('does not include archived wallets in active liquidity calculation', () => {
    const wallets = [
      { balance: 1000000, is_active: true },
      { balance: 2000000, is_active: false }, // Archived
    ];
    const totalPos = calculateTotalPositiveBalance(wallets);
    // Only active wallet (1.000.000) should be in denominator
    expect(totalPos).toBe(1000000);
    expect(calculateLiquidityShare(1000000, totalPos)).toBe(100);
  });

  it('prevents >100% anomaly (e.g. 137%) when one active wallet is negative', () => {
    // Scenario causing the 137% bug:
    // BCA: Rp 1.850.000
    // GoPay: -Rp 500.000 (overdrawn/deficit)
    // Net total balance was 1.350.000, causing 1.850.000 / 1.350.000 = 137%!
    const wallets = [
      { balance: 1850000, is_active: true },
      { balance: -500000, is_active: true },
    ];
    const totalPos = calculateTotalPositiveBalance(wallets);
    expect(totalPos).toBe(1850000); // Only positive funds are counted for liquidity distribution

    const bcaShare = calculateLiquidityShare(1850000, totalPos);
    const gopayShare = calculateLiquidityShare(-500000, totalPos);

    expect(bcaShare).toBe(100); // Clean 100%, NOT 137%!
    expect(gopayShare).toBe(0);
    expect(bcaShare).toBeLessThanOrEqual(100);
  });
});

describe('getWalletDeletionPolicy', () => {
  it('prevents deleting the last remaining wallet', () => {
    const policy = getWalletDeletionPolicy({ balance: 0 }, false, 1);
    expect(policy).toBe('cannot_delete_last');
  });

  it('prevents deleting a wallet with positive balance', () => {
    const policy = getWalletDeletionPolicy({ balance: 250000 }, false, 3);
    expect(policy).toBe('cannot_delete_has_balance');
  });

  it('recommends archive if wallet has zero balance but has transaction history', () => {
    const policy = getWalletDeletionPolicy({ balance: 0 }, true, 3);
    expect(policy).toBe('archive_recommended');
  });

  it('allows hard delete if wallet has zero balance and zero transactions', () => {
    const policy = getWalletDeletionPolicy({ balance: 0 }, false, 3);
    expect(policy).toBe('hard_delete_allowed');
  });
});

describe('filterAccountActivity & determineActivityDirection', () => {
  const dummyWallets: Wallet[] = [
    {
      id: 'w-bca',
      user_id: 'demo',
      name: 'BCA Utama',
      wallet_type: 'bank',
      balance: 1000000,
      icon: 'landmark',
      color: '#B9924F',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
    {
      id: 'w-gopay',
      user_id: 'demo',
      name: 'GoPay',
      wallet_type: 'ewallet',
      balance: 500000,
      icon: 'smartphone',
      color: '#6683A3',
      is_active: true,
      created_at: '',
      updated_at: '',
    },
  ];

  const dummyTxs: Transaction[] = [
    {
      id: 'tx-1',
      user_id: 'demo',
      wallet_id: 'w-bca',
      category_id: 'cat-food',
      goal_id: null,
      type: 'expense',
      amount: 50000,
      transaction_date: '2026-09-15',
      note: 'Makan Malam',
      destination_wallet_id: null,
      created_at: '',
    },
    {
      id: 'tx-2',
      user_id: 'demo',
      wallet_id: 'w-bca',
      category_id: null,
      goal_id: null,
      type: 'transfer',
      amount: 100000,
      transaction_date: '2026-09-14',
      note: 'Top Up GoPay',
      destination_wallet_id: 'w-gopay',
      created_at: '',
    },
    {
      id: 'tx-3',
      user_id: 'demo',
      wallet_id: 'w-gopay',
      category_id: 'cat-transport',
      goal_id: null,
      type: 'expense',
      amount: 25000,
      transaction_date: '2026-09-14',
      note: 'Gojek Kampus',
      destination_wallet_id: null,
      created_at: '',
    },
    {
      id: 'tx-4',
      user_id: 'demo',
      wallet_id: 'w-bca',
      category_id: 'cat-salary',
      goal_id: null,
      type: 'income',
      amount: 500000,
      transaction_date: '2026-09-10',
      note: 'Gaji Part Time',
      destination_wallet_id: null,
      created_at: '',
    },
  ];

  it('filters all transactions when selectedWalletId is "all"', () => {
    const result = filterAccountActivity(dummyTxs, 'all');
    expect(result).toHaveLength(4);
  });

  it('captures both outgoing expense and outgoing transfer for source wallet', () => {
    const result = filterAccountActivity(dummyTxs, 'w-bca');
    // w-bca has tx-1 (expense), tx-2 (transfer out), tx-4 (income)
    expect(result).toHaveLength(3);
    expect(result.map((t) => t.id)).toEqual(['tx-1', 'tx-2', 'tx-4']);

    // Direction check for transfer out on w-bca:
    const transferOutDir = determineActivityDirection(dummyTxs[1], 'w-bca', dummyWallets);
    expect(transferOutDir.direction).toBe('outflow');
    expect(transferOutDir.sign).toBe('-');
    expect(transferOutDir.label).toBe('Transfer ke GoPay');
  });

  it('captures incoming transfer when filtered by destination wallet', () => {
    const result = filterAccountActivity(dummyTxs, 'w-gopay');
    // w-gopay has tx-2 (transfer in from bca), tx-3 (expense)
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(['tx-2', 'tx-3']);

    // Direction check for transfer in on w-gopay:
    const transferInDir = determineActivityDirection(dummyTxs[1], 'w-gopay', dummyWallets);
    expect(transferInDir.direction).toBe('inflow');
    expect(transferInDir.sign).toBe('+');
    expect(transferInDir.label).toBe('Transfer dari BCA Utama');
  });

  it('formats transfer label neutrally when view is "all"', () => {
    const transferAllDir = determineActivityDirection(dummyTxs[1], 'all', dummyWallets);
    expect(transferAllDir.direction).toBe('transfer_neutral');
    expect(transferAllDir.sign).toBe('');
    expect(transferAllDir.label).toBe('BCA Utama → GoPay');
  });
});
