import type { SavingsGoal, Transaction } from '../types/database.types';
import type { CycleInfo } from './budget-cycle';
import { getLocalDateString } from './formatters';

export interface GoalProgressResult {
  percentage: number;
  visualPercentage: number;
  isCompleted: boolean;
  isOverfunded: boolean;
  remainingAmount: number;
  surplusAmount: number;
}

/**
 * Menghitung progres dan surplus target tabungan secara aman.
 * - Jika target_amount <= 0: return defensif 0%
 * - Jika current_amount >= target_amount: isCompleted = true
 * - Jika current_amount > target_amount: percentage mencerminkan surplus (>100%), visualPercentage di-clamp 100%
 */
export function calculateGoalProgress(
  currentAmount: number,
  targetAmount: number
): GoalProgressResult {
  const current = Math.max(0, Number(currentAmount) || 0);
  const target = Number(targetAmount) || 0;

  if (target <= 0) {
    return {
      percentage: 0,
      visualPercentage: 0,
      isCompleted: false,
      isOverfunded: false,
      remainingAmount: 0,
      surplusAmount: current,
    };
  }

  const rawPercent = Math.round((current / target) * 100);
  const visualPercentage = Math.min(100, Math.max(0, rawPercent));
  const isCompleted = current >= target;
  const isOverfunded = current > target;
  const remainingAmount = Math.max(0, target - current);
  const surplusAmount = Math.max(0, current - target);

  return {
    percentage: rawPercent,
    visualPercentage,
    isCompleted,
    isOverfunded,
    remainingAmount,
    surplusAmount,
  };
}

export interface GoalTemporalStatus {
  formattedDate: string;
  relativeText: string;
  isOverdue: boolean;
  isToday: boolean;
  daysDiff: number;
}

/**
 * Menghitung status temporal dari target tanggal jatuh tempo tabungan.
 */
export function getGoalTemporalStatus(
  targetDateStr?: string | null,
  referenceDate: Date = new Date()
): GoalTemporalStatus | null {
  if (!targetDateStr) return null;

  try {
    const targetDate = new Date(targetDateStr);
    if (isNaN(targetDate.getTime())) return null;

    const ref = new Date(referenceDate);
    ref.setHours(0, 0, 0, 0);

    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);

    const msPerDay = 1000 * 60 * 60 * 24;
    const daysDiff = Math.round((target.getTime() - ref.getTime()) / msPerDay);

    const formattedDate = target.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    let relativeText: string;
    let isToday = false;
    let isOverdue = false;

    if (daysDiff === 0) {
      relativeText = 'Hari ini';
      isToday = true;
    } else if (daysDiff > 0) {
      relativeText = `${daysDiff} hari lagi`;
    } else {
      relativeText = `Terlewat ${Math.abs(daysDiff)} hari`;
      isOverdue = true;
    }

    return {
      formattedDate,
      relativeText,
      isOverdue,
      isToday,
      daysDiff,
    };
  } catch {
    return null;
  }
}

export interface PortfolioSummaryResult {
  totalSavingsReserve: number;
  totalTargetAmount: number;
  portfolioProgress: number;
  activeGoalsCount: number;
  completedGoalsCount: number;
}

/**
 * Menghitung akumulasi portofolio tabungan (hanya goal aktif).
 */
export function calculatePortfolioSummary(
  goals: SavingsGoal[]
): PortfolioSummaryResult {
  const activeGoals = goals.filter((g) => g.is_active !== false);

  const totalSavingsReserve = activeGoals.reduce(
    (acc, g) => acc + (Number(g.current_amount) || 0),
    0
  );

  const totalTargetAmount = activeGoals.reduce(
    (acc, g) => acc + (Number(g.target_amount) || 0),
    0
  );

  let portfolioProgress = 0;
  if (totalTargetAmount > 0) {
    portfolioProgress = Math.round((totalSavingsReserve / totalTargetAmount) * 100);
  }

  const completedGoalsCount = activeGoals.filter(
    (g) => Number(g.current_amount) >= Number(g.target_amount) && Number(g.target_amount) > 0
  ).length;

  return {
    totalSavingsReserve,
    totalTargetAmount,
    portfolioProgress,
    activeGoalsCount: activeGoals.length,
    completedGoalsCount,
  };
}

/**
 * Menghitung alokasi tabungan bersih di dalam siklus aktif:
 * net = total alokasi (expense + goal_id) - total pencairan (income + goal_id)
 * Jika net < 0 (pencairan masa lalu lebih besar), di-clamp ke 0 agar tidak mendistorsi budget.
 */
export function calculateNetSavingsAllocationInCycle(
  transactions: Transaction[],
  cycleInfo: CycleInfo
): number {
  const startStr = getLocalDateString(cycleInfo.startDate);
  const endStr = getLocalDateString(cycleInfo.endDate);

  let allocated = 0;
  let withdrawn = 0;

  transactions.forEach((tx) => {
    if (!tx.goal_id) return;
    const dateStr = tx.transaction_date ? tx.transaction_date.slice(0, 10) : '';
    if (dateStr < startStr || dateStr > endStr) return;

    if (tx.type === 'expense') {
      allocated += Number(tx.amount) || 0;
    } else if (tx.type === 'income') {
      withdrawn += Number(tx.amount) || 0;
    }
  });

  return Math.max(0, allocated - withdrawn);
}
