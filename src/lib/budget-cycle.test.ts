import { describe, it, expect } from 'vitest';
import { getCycleInfo, calculateSafeToSpend } from './budget-cycle';

describe('Budget Cycle Calculator', () => {
  it('calculates cycle correctly when reference date is before cycleStartDay (e.g. 12 Sep with start day 25)', () => {
    const refDate = new Date(2026, 8, 12); // Sep 12, 2026
    const cycle = getCycleInfo(25, refDate);

    // Should start on Aug 25, 2026 and end on Sep 24, 2026
    expect(cycle.startDate.getMonth()).toBe(7); // August (0-indexed)
    expect(cycle.startDate.getDate()).toBe(25);
    expect(cycle.endDate.getMonth()).toBe(8); // September
    expect(cycle.endDate.getDate()).toBe(24);

    expect(cycle.totalDays).toBe(31);
    expect(cycle.daysRemaining).toBeGreaterThan(0);
    expect(cycle.progressPercentage).toBeGreaterThanOrEqual(0);
    expect(cycle.progressPercentage).toBeLessThanOrEqual(100);
  });

  it('calculates cycle correctly when reference date is after cycleStartDay (e.g. 28 Sep with start day 25)', () => {
    const refDate = new Date(2026, 8, 28); // Sep 28, 2026
    const cycle = getCycleInfo(25, refDate);

    // Should start on Sep 25, 2026 and end on Oct 24, 2026
    expect(cycle.startDate.getMonth()).toBe(8); // September
    expect(cycle.startDate.getDate()).toBe(25);
    expect(cycle.endDate.getMonth()).toBe(9); // October
    expect(cycle.endDate.getDate()).toBe(24);
  });

  it('calculates standard calendar month correctly when cycleStartDay is 1', () => {
    const refDate = new Date(2026, 8, 15); // Sep 15, 2026
    const cycle = getCycleInfo(1, refDate);

    expect(cycle.startDate.getDate()).toBe(1);
    expect(cycle.startDate.getMonth()).toBe(8);
    expect(cycle.endDate.getDate()).toBe(30); // Sep has 30 days
    expect(cycle.totalDays).toBe(30);
  });
});

describe('Safe to Spend Calculation', () => {
  it('calculates daily safe allowance correctly with remaining days', () => {
    const refDate = new Date(2026, 8, 15); // Sep 15, 2026
    const result = calculateSafeToSpend({
      totalBudget: 1500000,
      totalExpenses: 500000,
      todayExpenses: 20000,
      cycleStartDay: 1,
      referenceDate: refDate,
    });

    // 15 days remaining (from Sep 15 to Sep 30) -> remaining budget = 1.000.000
    // daily safe allowance = floor(1.000.000 / 16) ~ 62.500
    expect(result.remainingBudget).toBe(1000000);
    expect(result.dailySafeToSpend).toBeGreaterThan(0);
    expect(result.remainingToday).toBe(result.dailySafeToSpend - 20000);
    expect(result.paceStatus).toBe('safe');
  });

  it('correctly protects unpaid commitments from daily safe allowance', () => {
    const refDate = new Date(2026, 8, 15);
    const result = calculateSafeToSpend({
      totalBudget: 1500000,
      totalExpenses: 500000,
      totalUnpaidCommitments: 400000, // Kost / Wifi bill unpaid
      todayExpenses: 10000,
      cycleStartDay: 1,
      referenceDate: refDate,
    });

    // Remaining budget should be 1.500.000 - 500.000 - 400.000 = 600.000
    expect(result.remainingBudget).toBe(600000);
    expect(result.totalUnpaidCommitments).toBe(400000);
  });

  it('flags overpace status when today expense exceeds daily safe to spend', () => {
    const refDate = new Date(2026, 8, 15);
    const result = calculateSafeToSpend({
      totalBudget: 300000,
      totalExpenses: 0,
      todayExpenses: 100000, // Spent 100k today while daily allowance is ~18k
      cycleStartDay: 1,
      referenceDate: refDate,
    });

    expect(result.paceStatus).toBe('overpace');
    expect(result.remainingToday).toBeLessThan(0);
  });

  it('flags warning status when today expense approaches 80% of daily allowance', () => {
    const refDate = new Date(2026, 8, 15);
    const result = calculateSafeToSpend({
      totalBudget: 160000,
      totalExpenses: 0,
      todayExpenses: 9000, // Daily allowance is 10k (160k / 16 days), 9k is 90%
      cycleStartDay: 1,
      referenceDate: refDate,
    });

    expect(result.dailySafeToSpend).toBe(10000);
    expect(result.paceStatus).toBe('warning');
  });

  it('calculates simulated impact of planned expense on future days correctly', () => {
    const refDate = new Date(2026, 8, 15);
    const initial = calculateSafeToSpend({
      totalBudget: 320000,
      totalExpenses: 0,
      todayExpenses: 0,
      cycleStartDay: 1,
      referenceDate: refDate,
    });

    // 16 days total remaining (Sep 15 to Sep 30)
    expect(initial.dailySafeToSpend).toBe(20000); // 320k / 16 = 20k/day

    // If spending 50k today, 15 days remain from tomorrow:
    // New remaining = 320k - 50k = 270k
    // Future daily allowance = 270k / 15 = 18k/day
    const plannedExtra = 50000;
    const futureDays = 15;
    const futureAllowance = Math.floor((initial.remainingBudget - plannedExtra) / futureDays);
    expect(futureAllowance).toBe(18000);
    expect(initial.dailySafeToSpend - futureAllowance).toBe(2000);
  });

  it('accurately maintains daily allowance and subtracts today expenses without double deduction', () => {
    const refDate = new Date(2026, 8, 15);
    // Sisa hari: 16 days. Budget: 1.600.000.
    // Jatah hari ini harus 1.600.000 / 16 = 100.000
    // Pengeluaran hari ini = 30.000.
    // Sisa jatah hari ini harus 100.000 - 30.000 = 70.000!
    const result = calculateSafeToSpend({
      totalBudget: 1600000,
      totalExpenses: 30000, // Termasuk pengeluaran hari ini
      todayExpenses: 30000,
      cycleStartDay: 1,
      referenceDate: refDate,
    });

    expect(result.dailySafeToSpend).toBe(100000);
    expect(result.remainingToday).toBe(70000);
    expect(result.remainingBudget).toBe(1570000);
    expect(result.paceStatus).toBe('safe');
  });
});
