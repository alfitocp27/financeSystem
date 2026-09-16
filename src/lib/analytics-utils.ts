import type { Transaction, Category } from '../types/database.types';
import { getLocalDateString, formatDateIndo, formatCurrency } from './formatters';
import { getMutedCategoryStyle } from './category-color-utils';

export const ANALYTICS_CATEGORY_COLORS = [
  '#D6B875', // Champagne Gold Highlight
  '#B9924F', // Primary Satin Gold
  '#6683A3', // Muted Denim Blue
  '#5F8A70', // Sage Green
  '#A85F68', // Dusty Rose
] as const;

export const OTHER_CATEGORY_COLOR = '#4F5765'; // Charcoal Slate

export interface CategoryDonutItem {
  id: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
  icon?: string;
  rawColor?: string;
}

export interface CycleAnalyticsSummary {
  dailyBurnRate: number;
  savingRate: number;
  topCategory: {
    id: string;
    name: string;
    total: number;
    percentage: number;
    color: string;
  } | null;
  peakSpendingDay: {
    dateStr: string;
    dayLabel: string;
    total: number;
  } | null;
}

/**
 * Filter transactions that are expenses within the active cycle dates.
 */
export function filterCycleExpenses(
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Transaction[] {
  const startStr = getLocalDateString(startDate);
  const endStr = getLocalDateString(endDate);

  return transactions.filter((t) => {
    // Pengeluaran belanja konsumtif murni (tabungan / goal_id dikecualikan)
    if (t.type !== 'expense' || t.goal_id) return false;
    const dateStr = t.transaction_date ? t.transaction_date.slice(0, 10) : '';
    return dateStr >= startStr && dateStr <= endStr;
  });
}

/**
 * Calculate the average daily spending rate (Daily Burn Rate).
 */
export function calculateDailyBurnRate(
  totalExpense: number,
  daysPassed: number
): number {
  if (totalExpense <= 0) return 0;
  const divisor = Math.max(1, daysPassed);
  return Math.round(totalExpense / divisor);
}

/**
 * Calculate the saving rate as a percentage of income saved in the cycle.
 * Returns negative value if expenses exceed income (deficit).
 */
export function calculateSavingRate(
  totalIncome: number,
  totalExpense: number
): number {
  if (totalIncome <= 0) return 0;
  const netSavings = totalIncome - totalExpense;
  return Math.round((netSavings / totalIncome) * 100);
}

/**
 * Identify the category with the highest spending in the active cycle.
 */
export function calculateTopCategory(
  cycleExpenses: Transaction[],
  categories: Category[],
  totalExpense: number
): CycleAnalyticsSummary['topCategory'] {
  if (cycleExpenses.length === 0 || totalExpense <= 0) return null;

  const categoryTotals: Record<string, { id: string; name: string; total: number }> = {};

  cycleExpenses.forEach((t) => {
    const catId = t.category_id || 'uncategorized';
    if (!categoryTotals[catId]) {
      const cat = categories.find((c) => c.id === catId);
      categoryTotals[catId] = {
        id: catId,
        name: cat ? cat.name : 'Tanpa Kategori',
        total: 0,
      };
    }
    categoryTotals[catId].total += Number(t.amount);
  });

  const sorted = Object.values(categoryTotals)
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  if (sorted.length === 0) return null;

  const top = sorted[0];
  const percentage = Math.round((top.total / totalExpense) * 100);
  const catObj = categories.find((c) => c.id === top.id);
  const topColor = catObj?.color ? getMutedCategoryStyle(catObj.color).color : ANALYTICS_CATEGORY_COLORS[0];

  return {
    id: top.id,
    name: top.name,
    total: top.total,
    percentage,
    color: topColor,
  };
}

/**
 * Identify the date with the highest total expense within the active cycle.
 */
export function calculatePeakSpendingDay(
  cycleExpenses: Transaction[]
): CycleAnalyticsSummary['peakSpendingDay'] {
  if (cycleExpenses.length === 0) return null;

  const dailyTotals: Record<string, number> = {};

  cycleExpenses.forEach((t) => {
    const dateStr = t.transaction_date ? t.transaction_date.slice(0, 10) : '';
    if (dateStr) {
      dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + Number(t.amount);
    }
  });

  const sortedDays = Object.entries(dailyTotals)
    .filter(([_, total]) => total > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sortedDays.length === 0) return null;

  const [peakDateStr, peakTotal] = sortedDays[0];

  return {
    dateStr: peakDateStr,
    dayLabel: formatDateIndo(peakDateStr),
    total: peakTotal,
  };
}

/**
 * Aggregate cycle expenses into Top 5 categories + "Lainnya" for the Donut Chart.
 */
export function aggregateCategoryDonutData(
  cycleExpenses: Transaction[],
  categories: Category[],
  totalExpense: number
): CategoryDonutItem[] {
  if (cycleExpenses.length === 0 || totalExpense <= 0) return [];

  const categoryTotals: Record<
    string,
    { id: string; name: string; icon?: string; rawColor?: string; total: number }
  > = {};

  cycleExpenses.forEach((t) => {
    const catId = t.category_id || 'uncategorized';
    if (!categoryTotals[catId]) {
      const cat = categories.find((c) => c.id === catId);
      categoryTotals[catId] = {
        id: catId,
        name: cat ? cat.name : 'Tanpa Kategori',
        icon: cat?.icon,
        rawColor: cat?.color,
        total: 0,
      };
    }
    categoryTotals[catId].total += Number(t.amount);
  });

  const sorted = Object.values(categoryTotals)
    .filter((item) => item.total > 0)
    .sort((a, b) => b.total - a.total);

  const top5 = sorted.slice(0, 5);
  const remaining = sorted.slice(5);

  const items: CategoryDonutItem[] = top5.map((cat, idx) => {
    const mutedStyle = cat.rawColor ? getMutedCategoryStyle(cat.rawColor) : null;
    return {
      id: cat.id,
      name: cat.name,
      value: cat.total,
      percentage: Math.round((cat.total / totalExpense) * 100),
      color: mutedStyle ? mutedStyle.color : ANALYTICS_CATEGORY_COLORS[idx % ANALYTICS_CATEGORY_COLORS.length],
      icon: cat.icon,
      rawColor: cat.rawColor,
    };
  });

  if (remaining.length > 0) {
    const otherTotal = remaining.reduce((sum, item) => sum + item.total, 0);
    if (otherTotal > 0) {
      items.push({
        id: 'category-others',
        name: 'Lainnya',
        value: otherTotal,
        percentage: Math.round((otherTotal / totalExpense) * 100),
        color: OTHER_CATEGORY_COLOR,
        icon: 'tag',
        rawColor: OTHER_CATEGORY_COLOR,
      });
    }
  }

  return items;
}

export interface DynamicInsightItem {
  id: string;
  type: 'runway' | 'pacing' | 'peak' | 'concentration';
  tone: 'neutral' | 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  iconName: 'ShieldAlert' | 'Activity' | 'TrendingUp' | 'PieChart' | 'CheckCircle2' | 'Clock';
}

export interface DynamicInsightParams {
  dailyBurnRate: number;
  dailySafeToSpend: number;
  daysPassed: number;
  daysRemaining: number;
  totalExpense: number;
  topCategory: { id: string; name: string; total: number; percentage: number } | null;
  peakSpendingDay: { dateStr: string; dayLabel: string; total: number } | null;
}

/**
 * Generate 1 to 3 dynamic analytical insights based on cycle financial data.
 */
export function generateDynamicInsights(params: DynamicInsightParams): DynamicInsightItem[] {
  const {
    dailyBurnRate,
    dailySafeToSpend,
    daysPassed,
    daysRemaining,
    totalExpense,
    topCategory,
    peakSpendingDay,
  } = params;

  // Empty state: exactly 1 factual note
  if (totalExpense <= 0) {
    return [
      {
        id: 'insight-empty',
        type: 'runway',
        tone: 'neutral',
        title: 'Siklus Pengeluaran',
        message:
          dailySafeToSpend > 0
            ? `Belum ada pengeluaran tercatat di siklus ini. Kuota aman belanjamu saat ini adalah ${formatCurrency(dailySafeToSpend)}/hari.`
            : 'Belum ada pengeluaran tercatat di siklus ini.',
        iconName: 'Clock',
      },
    ];
  }

  interface CandidateInsight {
    item: DynamicInsightItem;
    priority: number;
  }

  const candidates: CandidateInsight[] = [];

  // 1. Zero Safe to Spend Runway
  if (dailySafeToSpend === 0 && daysRemaining > 0) {
    candidates.push({
      item: {
        id: 'insight-zero-runway',
        type: 'runway',
        tone: 'danger',
        title: 'Batas Belanja Harian',
        message: `Kuota aman harian telah mencapai Rp0 dengan ${daysRemaining} hari tersisa dalam siklus. Prioritaskan pengeluaran yang sudah direncanakan hingga siklus berikutnya.`,
        iconName: 'ShieldAlert',
      },
      priority: 100,
    });
  }

  // 2. Pacing Laju Belanja (Burn Rate vs Safe to Spend)
  if (daysPassed < 3) {
    // Cooling window
    candidates.push({
      item: {
        id: 'insight-pacing-cooling',
        type: 'pacing',
        tone: 'info',
        title: 'Kalibrasi Awal Siklus',
        message: `Siklus baru berjalan ${daysPassed} hari. Rata-rata belanja (${formatCurrency(dailyBurnRate)}/hari) masih dalam fase penyesuaian terhadap batas aman (${formatCurrency(dailySafeToSpend)}/hari).`,
        iconName: 'Activity',
      },
      priority: 70,
    });
  } else if (dailyBurnRate > dailySafeToSpend) {
    const diff = dailyBurnRate - dailySafeToSpend;
    const isSignificant = dailyBurnRate > dailySafeToSpend * 1.2;
    candidates.push({
      item: {
        id: 'insight-pacing-overburn',
        type: 'pacing',
        tone: isSignificant ? 'danger' : 'warning',
        title: isSignificant ? 'Laju Belanja di Atas Batas Aman' : 'Laju Belanja Sedikit di Atas Batas Aman',
        message: `Rata-rata belanjamu ${formatCurrency(dailyBurnRate)}/hari, ${formatCurrency(diff)} di atas batas aman harian saat ini.`,
        iconName: 'Activity',
      },
      priority: isSignificant ? 90 : 65,
    });
  } else {
    // Healthy pacing
    const diff = dailySafeToSpend - dailyBurnRate;
    candidates.push({
      item: {
        id: 'insight-pacing-healthy',
        type: 'pacing',
        tone: 'success',
        title: 'Pacing Belanja Terjaga',
        message:
          diff > 0
            ? `Rata-rata belanjamu ${formatCurrency(dailyBurnRate)}/hari, ${formatCurrency(diff)} di bawah batas aman harian saat ini.`
            : `Rata-rata belanjamu ${formatCurrency(dailyBurnRate)}/hari, tepat sesuai dengan batas aman harian saat ini.`,
        iconName: 'CheckCircle2',
      },
      priority: 45,
    });
  }

  // 3. Peak Spending Day (Compared against dailyBurnRate)
  if (peakSpendingDay && dailyBurnRate > 0) {
    const peakRatio = peakSpendingDay.total / dailyBurnRate;
    if (peakRatio >= 1.5) {
      const ratioFormatted = peakRatio.toFixed(1).replace('.', ',');
      const isExtremePeak = peakRatio >= 2.5;
      candidates.push({
        item: {
          id: 'insight-peak-day',
          type: 'peak',
          tone: 'info',
          title: 'Puncak Pengeluaran',
          message: `Pengeluaran tertinggi terjadi pada ${peakSpendingDay.dayLabel} sebesar ${formatCurrency(peakSpendingDay.total)}, sekitar ${ratioFormatted}× rata-rata belanja harian siklus ini.`,
          iconName: 'TrendingUp',
        },
        priority: isExtremePeak ? 75 : 50,
      });
    }
  }

  // 4. Konsentrasi Kategori (Top Category Dominance)
  if (topCategory && topCategory.percentage > 0) {
    if (topCategory.percentage >= 50) {
      candidates.push({
        item: {
          id: 'insight-category-dominant',
          type: 'concentration',
          tone: 'info',
          title: 'Konsentrasi Pengeluaran',
          message: `Pos ${topCategory.name} menyerap ${topCategory.percentage}% total pengeluaran siklus ini dan menjadi komponen biaya terbesar.`,
          iconName: 'PieChart',
        },
        priority: 60,
      });
    } else if (topCategory.percentage >= 30) {
      candidates.push({
        item: {
          id: 'insight-category-notable',
          type: 'concentration',
          tone: 'neutral',
          title: 'Komponen Biaya Terbesar',
          message: `Pos ${topCategory.name} menyerap ${topCategory.percentage}% pengeluaran siklus ini sebagai alokasi terbesar.`,
          iconName: 'PieChart',
        },
        priority: 40,
      });
    }
  }

  // Sort by priority descending and take top 3
  return candidates
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3)
    .map((c) => c.item);
}
