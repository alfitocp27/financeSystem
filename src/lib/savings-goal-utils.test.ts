import { describe, it, expect } from 'vitest';
import {
  calculateGoalProgress,
  getGoalTemporalStatus,
  calculatePortfolioSummary,
  calculateNetSavingsAllocationInCycle,
} from './savings-goal-utils';
import type { SavingsGoal, Transaction } from '../types/database.types';
import type { CycleInfo } from './budget-cycle';

describe('savings-goal-utils', () => {
  describe('calculateGoalProgress', () => {
    it('handles target_amount <= 0 safely without NaN', () => {
      const res1 = calculateGoalProgress(50000, 0);
      expect(res1.percentage).toBe(0);
      expect(res1.visualPercentage).toBe(0);
      expect(res1.isCompleted).toBe(false);
      expect(res1.surplusAmount).toBe(50000);

      const res2 = calculateGoalProgress(50000, -1000);
      expect(res2.percentage).toBe(0);
    });

    it('calculates normal progress accurately', () => {
      const res = calculateGoalProgress(2500000, 5000000);
      expect(res.percentage).toBe(50);
      expect(res.visualPercentage).toBe(50);
      expect(res.isCompleted).toBe(false);
      expect(res.isOverfunded).toBe(false);
      expect(res.remainingAmount).toBe(2500000);
      expect(res.surplusAmount).toBe(0);
    });

    it('identifies completed goal at exact 100%', () => {
      const res = calculateGoalProgress(5000000, 5000000);
      expect(res.percentage).toBe(100);
      expect(res.visualPercentage).toBe(100);
      expect(res.isCompleted).toBe(true);
      expect(res.isOverfunded).toBe(false);
      expect(res.remainingAmount).toBe(0);
      expect(res.surplusAmount).toBe(0);
    });

    it('calculates surplus when current_amount exceeds target_amount (>100%)', () => {
      const res = calculateGoalProgress(5500000, 5000000);
      expect(res.percentage).toBe(110);
      expect(res.visualPercentage).toBe(100); // Visual bar clamped at 100%
      expect(res.isCompleted).toBe(true);
      expect(res.isOverfunded).toBe(true);
      expect(res.remainingAmount).toBe(0);
      expect(res.surplusAmount).toBe(500000);
    });
  });

  describe('getGoalTemporalStatus', () => {
    const refDate = new Date('2026-09-16T10:00:00Z');

    it('returns null if targetDate is missing or invalid', () => {
      expect(getGoalTemporalStatus(null, refDate)).toBeNull();
      expect(getGoalTemporalStatus(undefined, refDate)).toBeNull();
      expect(getGoalTemporalStatus('invalid-date', refDate)).toBeNull();
    });

    it('returns "Hari ini" when target date is current day', () => {
      const res = getGoalTemporalStatus('2026-09-16', refDate);
      expect(res?.isToday).toBe(true);
      expect(res?.relativeText).toBe('Hari ini');
      expect(res?.isOverdue).toBe(false);
    });

    it('returns "X hari lagi" when target date is in the future', () => {
      const res = getGoalTemporalStatus('2026-09-26', refDate);
      expect(res?.isToday).toBe(false);
      expect(res?.relativeText).toBe('10 hari lagi');
      expect(res?.isOverdue).toBe(false);
      expect(res?.daysDiff).toBe(10);
    });

    it('returns "Terlewat X hari" when target date has passed', () => {
      const res = getGoalTemporalStatus('2026-09-10', refDate);
      expect(res?.isToday).toBe(false);
      expect(res?.relativeText).toBe('Terlewat 6 hari');
      expect(res?.isOverdue).toBe(true);
      expect(res?.daysDiff).toBe(-6);
    });
  });

  describe('calculatePortfolioSummary', () => {
    const mockGoals: SavingsGoal[] = [
      {
        id: 'g-1',
        user_id: 'u-1',
        name: 'Laptop',
        target_amount: 10000000,
        current_amount: 5000000,
        target_date: '2026-12-31',
        icon: 'laptop',
        color: '#B9924F',
        is_active: true,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: 'g-2',
        user_id: 'u-1',
        name: 'Dana Darurat',
        target_amount: 5000000,
        current_amount: 5000000,
        target_date: null,
        icon: 'shield',
        color: '#B9924F',
        is_active: true,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        id: 'g-3',
        user_id: 'u-1',
        name: 'Archived Goal',
        target_amount: 3000000,
        current_amount: 3000000,
        target_date: null,
        icon: 'archive',
        color: '#888',
        is_active: false, // Inactive / Archived
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ];

    it('calculates portfolio metrics strictly for active goals', () => {
      const summary = calculatePortfolioSummary(mockGoals);
      // Total savings reserve: 5.000.000 + 5.000.000 = 10.000.000 (g-3 excluded)
      expect(summary.totalSavingsReserve).toBe(10000000);
      // Total target amount: 10.000.000 + 5.000.000 = 15.000.000 (g-3 excluded)
      expect(summary.totalTargetAmount).toBe(15000000);
      // Progress: 10 / 15 = 67%
      expect(summary.portfolioProgress).toBe(67);
      expect(summary.activeGoalsCount).toBe(2);
      expect(summary.completedGoalsCount).toBe(1);
    });

    it('verifies archived goal does not affect totalTargetAmount, totalSavingsReserve, or portfolio progress', () => {
      const activeOnly = mockGoals.filter((g) => g.is_active !== false);
      const withArchived = mockGoals; // contains 2 active + 1 archived

      const summaryActiveOnly = calculatePortfolioSummary(activeOnly);
      const summaryWithArchived = calculatePortfolioSummary(withArchived);

      expect(summaryWithArchived.totalTargetAmount).toBe(summaryActiveOnly.totalTargetAmount);
      expect(summaryWithArchived.totalSavingsReserve).toBe(summaryActiveOnly.totalSavingsReserve);
      expect(summaryWithArchived.portfolioProgress).toBe(summaryActiveOnly.portfolioProgress);
      expect(summaryWithArchived.activeGoalsCount).toBe(2);
      expect(summaryWithArchived.totalTargetAmount).toBe(15000000);
    });

    it('handles empty goals list cleanly', () => {
      const summary = calculatePortfolioSummary([]);
      expect(summary.totalSavingsReserve).toBe(0);
      expect(summary.totalTargetAmount).toBe(0);
      expect(summary.portfolioProgress).toBe(0);
      expect(summary.activeGoalsCount).toBe(0);
    });
  });

  describe('calculateNetSavingsAllocationInCycle', () => {
    const mockCycle: CycleInfo = {
      startDate: new Date('2026-08-25T00:00:00Z'),
      endDate: new Date('2026-09-24T23:59:59Z'),
      totalDays: 31,
      daysPassed: 23,
      daysRemaining: 9,
      progressPercentage: 74,
    };

    it('calculates net allocation within active cycle dates', () => {
      const mockTxs: Transaction[] = [
        {
          id: 'tx-1',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: null,
          goal_id: 'g-1',
          type: 'expense',
          amount: 500000,
          transaction_date: '2026-09-01', // Inside cycle
          destination_wallet_id: null,
          note: 'Nabung laptop',
          created_at: '',
        },
        {
          id: 'tx-2',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: null,
          goal_id: 'g-1',
          type: 'income',
          amount: 150000,
          transaction_date: '2026-09-05', // Inside cycle
          destination_wallet_id: null,
          note: 'Tarik darurat',
          created_at: '',
        },
        {
          id: 'tx-3',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: null,
          goal_id: 'g-1',
          type: 'expense',
          amount: 1000000,
          transaction_date: '2026-08-10', // OUTSIDE cycle (previous month)
          destination_wallet_id: null,
          note: 'Nabung lama',
          created_at: '',
        },
        {
          id: 'tx-4',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: 'cat-food',
          goal_id: null, // Regular expense
          type: 'expense',
          amount: 50000,
          transaction_date: '2026-09-10',
          destination_wallet_id: null,
          note: 'Makan',
          created_at: '',
        },
      ];

      const net = calculateNetSavingsAllocationInCycle(mockTxs, mockCycle);
      // Allocated: 500.000, Withdrawn: 150.000 -> Net: 350.000 (tx-3 and tx-4 ignored)
      expect(net).toBe(350000);
    });

    it('clamps to 0 when withdrawals exceed allocations in the cycle', () => {
      const mockTxs: Transaction[] = [
        {
          id: 'tx-w1',
          user_id: 'demo',
          wallet_id: 'w-1',
          category_id: null,
          goal_id: 'g-1',
          type: 'income',
          amount: 600000,
          transaction_date: '2026-09-02',
          destination_wallet_id: null,
          note: 'Cairkan tabungan lama',
          created_at: '',
        },
      ];

      const net = calculateNetSavingsAllocationInCycle(mockTxs, mockCycle);
      expect(net).toBe(0);
    });
  });
});
