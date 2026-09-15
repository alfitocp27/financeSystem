export interface CycleInfo {
  startDate: Date;
  endDate: Date;
  totalDays: number;
  daysPassed: number;
  daysRemaining: number;
  progressPercentage: number;
}

/**
 * Menghitung periode siklus bulanan berdasarkan tanggal mulai (cycle_start_day).
 * Contoh: cycle_start_day = 25
 * Jika hari ini 12 Sep, siklus aktif: 25 Aug - 24 Sep.
 * Jika hari ini 26 Sep, siklus aktif: 25 Sep - 24 Oct.
 */
export function getCycleInfo(cycleStartDay: number = 25, referenceDate: Date = new Date()): CycleInfo {
  const currentYear = referenceDate.getFullYear();
  const currentMonth = referenceDate.getMonth();
  const currentDay = referenceDate.getDate();

  let startDate: Date;
  let endDate: Date;

  if (cycleStartDay === 1) {
    // Kalender standar 1 s.d akhir bulan
    startDate = new Date(currentYear, currentMonth, 1);
    endDate = new Date(currentYear, currentMonth + 1, 0); // hari terakhir bulan ini
  } else {
    if (currentDay >= cycleStartDay) {
      // Periode mulai dari tanggal cycleStartDay bulan ini sampai (cycleStartDay - 1) bulan depan
      startDate = new Date(currentYear, currentMonth, cycleStartDay);
      endDate = new Date(currentYear, currentMonth + 1, cycleStartDay - 1);
    } else {
      // Periode mulai dari tanggal cycleStartDay bulan lalu sampai (cycleStartDay - 1) bulan ini
      startDate = new Date(currentYear, currentMonth - 1, cycleStartDay);
      endDate = new Date(currentYear, currentMonth, cycleStartDay - 1);
    }
  }

  // Normalisasi waktu ke awal hari (00:00:00)
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;
  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / msPerDay);
  const daysPassed = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / msPerDay) + 1);
  const daysRemaining = Math.max(1, totalDays - daysPassed + 1);
  const progressPercentage = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));

  return {
    startDate,
    endDate,
    totalDays,
    daysPassed,
    daysRemaining,
    progressPercentage,
  };
}

export type PaceStatus = 'safe' | 'warning' | 'overpace' | 'no-budget';

export interface SafeToSpendCalculation {
  totalBudget: number;
  totalExpenses: number;
  totalSavingsAllocated: number;
  totalUnpaidCommitments: number;
  remainingBudget: number;
  daysRemaining: number;
  dailySafeToSpend: number;
  todayExpenses: number;
  remainingToday: number;
  paceStatus: PaceStatus;
}

/**
 * Menghitung batas belanja harian aman (Safe to Spend)
 */
export function calculateSafeToSpend(params: {
  totalBudget: number;
  totalExpenses: number;
  totalSavingsAllocated?: number;
  totalUnpaidCommitments?: number;
  todayExpenses: number;
  cycleStartDay?: number;
  referenceDate?: Date;
}): SafeToSpendCalculation {
  const {
    totalBudget,
    totalExpenses,
    totalSavingsAllocated = 0,
    totalUnpaidCommitments = 0,
    todayExpenses,
    cycleStartDay = 25,
    referenceDate = new Date(),
  } = params;

  const cycle = getCycleInfo(cycleStartDay, referenceDate);

  // Pengeluaran sebelum hari ini (hari-hari sebelumnya di siklus aktif)
  const pastExpenses = Math.max(0, totalExpenses - todayExpenses);

  // Anggaran yang tersedia di awal hari ini (sebelum belanja hari ini)
  const budgetAtStartOfDay = Math.max(
    0,
    totalBudget - pastExpenses - totalSavingsAllocated - totalUnpaidCommitments
  );

  // Jatah belanja aman hari ini = sisa anggaran di awal hari / sisa hari siklus
  const dailySafeToSpend = cycle.daysRemaining > 0 ? Math.floor(budgetAtStartOfDay / cycle.daysRemaining) : 0;

  // Sisa jatah yang boleh dibelanjakan hari ini
  const remainingToday = dailySafeToSpend - todayExpenses;

  // Sisa anggaran total saat ini (setelah pengeluaran hari ini dan komitmen)
  const remainingBudget = Math.max(0, totalBudget - totalExpenses - totalSavingsAllocated - totalUnpaidCommitments);

  let paceStatus: PaceStatus;
  if (totalBudget <= 0) {
    paceStatus = 'no-budget';
  } else if (remainingToday < 0) {
    paceStatus = 'overpace';
  } else if (todayExpenses >= dailySafeToSpend * 0.8 && dailySafeToSpend > 0) {
    paceStatus = 'warning';
  } else {
    paceStatus = 'safe';
  }

  return {
    totalBudget,
    totalExpenses,
    totalSavingsAllocated,
    totalUnpaidCommitments,
    remainingBudget,
    daysRemaining: cycle.daysRemaining,
    dailySafeToSpend,
    todayExpenses,
    remainingToday,
    paceStatus,
  };
}
