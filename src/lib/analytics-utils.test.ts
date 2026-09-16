import { describe, it, expect } from 'vitest';
import {
  calculateDailyBurnRate,
  calculateSavingRate,
  filterCycleExpenses,
  calculateTopCategory,
  calculatePeakSpendingDay,
  aggregateCategoryDonutData,
  generateDynamicInsights,
  ANALYTICS_CATEGORY_COLORS,
  OTHER_CATEGORY_COLOR,
} from './analytics-utils';
import type { Transaction, Category } from '../types/database.types';

describe('Analytics Utilities', () => {
  const mockCategories: Category[] = [
    { id: 'cat-1', user_id: 'u1', name: 'Makanan & Minuman', type: 'expense', icon: 'utensils', color: '#B9924F', created_at: '' },
    { id: 'cat-2', user_id: 'u1', name: 'Kost & Tempat Tinggal', type: 'expense', icon: 'home', color: '#6683A3', created_at: '' },
    { id: 'cat-3', user_id: 'u1', name: 'Transportasi', type: 'expense', icon: 'bus', color: '#5F8A70', created_at: '' },
    { id: 'cat-4', user_id: 'u1', name: 'Kuliah & Buku', type: 'expense', icon: 'book', color: '#A85F68', created_at: '' },
    { id: 'cat-5', user_id: 'u1', name: 'Hobi & Hiburan', type: 'expense', icon: 'coffee', color: '#D6B875', created_at: '' },
    { id: 'cat-6', user_id: 'u1', name: 'Lain-lain', type: 'expense', icon: 'tag', color: '#7C8491', created_at: '' },
  ];

  describe('calculateDailyBurnRate', () => {
    it('calculates average expense per day correctly', () => {
      expect(calculateDailyBurnRate(600000, 10)).toBe(60000);
      expect(calculateDailyBurnRate(1050000, 14)).toBe(75000);
    });

    it('handles 0 expense gracefully', () => {
      expect(calculateDailyBurnRate(0, 10)).toBe(0);
    });

    it('guards against division by 0 when daysPassed is 0', () => {
      expect(calculateDailyBurnRate(50000, 0)).toBe(50000);
    });
  });

  describe('calculateSavingRate', () => {
    it('calculates positive saving rate when surplus exists', () => {
      // Income 2.000.000, Expense 1.500.000 -> Surplus 500.000 (25%)
      expect(calculateSavingRate(2000000, 1500000)).toBe(25);
    });

    it('calculates negative saving rate when in deficit', () => {
      // Income 1.000.000, Expense 1.200.000 -> Deficit -200.000 (-20%)
      expect(calculateSavingRate(1000000, 1200000)).toBe(-20);
    });

    it('returns 0 if income is 0 or negative', () => {
      expect(calculateSavingRate(0, 500000)).toBe(0);
    });
  });

  describe('filterCycleExpenses', () => {
    const startDate = new Date(2026, 7, 25); // 25 Aug 2026
    const endDate = new Date(2026, 8, 24);   // 24 Sep 2026

    const mockTransactions: Transaction[] = [
      { id: 't1', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-1', goal_id: null, type: 'expense', amount: 50000, transaction_date: '2026-08-25', destination_wallet_id: null, note: null, created_at: '' },
      { id: 't2', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-2', goal_id: null, type: 'expense', amount: 300000, transaction_date: '2026-09-01', destination_wallet_id: null, note: null, created_at: '' },
      { id: 't3', user_id: 'u1', wallet_id: 'w1', category_id: null, goal_id: null, type: 'income', amount: 2000000, transaction_date: '2026-08-25', destination_wallet_id: null, note: null, created_at: '' },
      { id: 't4', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-1', goal_id: null, type: 'expense', amount: 40000, transaction_date: '2026-08-20', destination_wallet_id: null, note: null, created_at: '' }, // before cycle
      { id: 't5', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-1', goal_id: null, type: 'expense', amount: 40000, transaction_date: '2026-09-25', destination_wallet_id: null, note: null, created_at: '' }, // after cycle
    ];

    it('filters only expenses strictly within the cycle date bounds', () => {
      const filtered = filterCycleExpenses(mockTransactions, startDate, endDate);
      expect(filtered).toHaveLength(2);
      expect(filtered.map((t) => t.id)).toEqual(['t1', 't2']);
    });
  });

  describe('calculateTopCategory', () => {
    it('returns the category with highest accumulated expense', () => {
      const cycleExpenses: Transaction[] = [
        { id: 't1', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-1', goal_id: null, type: 'expense', amount: 150000, transaction_date: '2026-08-26', destination_wallet_id: null, note: null, created_at: '' },
        { id: 't2', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-1', goal_id: null, type: 'expense', amount: 100000, transaction_date: '2026-08-27', destination_wallet_id: null, note: null, created_at: '' },
        { id: 't3', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-2', goal_id: null, type: 'expense', amount: 100000, transaction_date: '2026-08-28', destination_wallet_id: null, note: null, created_at: '' },
      ];
      const totalExpense = 350000;

      const top = calculateTopCategory(cycleExpenses, mockCategories, totalExpense);
      expect(top).not.toBeNull();
      expect(top?.id).toBe('cat-1');
      expect(top?.name).toBe('Makanan & Minuman');
      expect(top?.total).toBe(250000);
      expect(top?.percentage).toBe(71); // 250000 / 350000 = ~71%
    });

    it('returns null if there are no cycle expenses', () => {
      expect(calculateTopCategory([], mockCategories, 0)).toBeNull();
    });
  });

  describe('calculatePeakSpendingDay', () => {
    it('finds the date with the highest total expense', () => {
      const cycleExpenses: Transaction[] = [
        { id: 't1', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-1', goal_id: null, type: 'expense', amount: 50000, transaction_date: '2026-08-26', destination_wallet_id: null, note: null, created_at: '' },
        { id: 't2', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-2', goal_id: null, type: 'expense', amount: 150000, transaction_date: '2026-08-27', destination_wallet_id: null, note: null, created_at: '' },
        { id: 't3', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-1', goal_id: null, type: 'expense', amount: 50000, transaction_date: '2026-08-27', destination_wallet_id: null, note: null, created_at: '' },
      ];

      const peak = calculatePeakSpendingDay(cycleExpenses);
      expect(peak).not.toBeNull();
      expect(peak?.dateStr).toBe('2026-08-27');
      expect(peak?.total).toBe(200000); // 150k + 50k
    });

    it('returns null if no expenses exist', () => {
      expect(calculatePeakSpendingDay([])).toBeNull();
    });
  });

  describe('aggregateCategoryDonutData', () => {
    it('aggregates top 5 categories and merges the rest into Lainnya', () => {
      const expenses: Transaction[] = [
        { id: 't1', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-1', goal_id: null, type: 'expense', amount: 500000, transaction_date: '2026-08-26', destination_wallet_id: null, note: null, created_at: '' },
        { id: 't2', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-2', goal_id: null, type: 'expense', amount: 400000, transaction_date: '2026-08-26', destination_wallet_id: null, note: null, created_at: '' },
        { id: 't3', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-3', goal_id: null, type: 'expense', amount: 300000, transaction_date: '2026-08-26', destination_wallet_id: null, note: null, created_at: '' },
        { id: 't4', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-4', goal_id: null, type: 'expense', amount: 200000, transaction_date: '2026-08-26', destination_wallet_id: null, note: null, created_at: '' },
        { id: 't5', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-5', goal_id: null, type: 'expense', amount: 100000, transaction_date: '2026-08-26', destination_wallet_id: null, note: null, created_at: '' },
        { id: 't6', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-6', goal_id: null, type: 'expense', amount: 50000, transaction_date: '2026-08-26', destination_wallet_id: null, note: null, created_at: '' },
      ];
      const totalExpense = 1550000;

      const items = aggregateCategoryDonutData(expenses, mockCategories, totalExpense);

      // Top 5 + 1 "Lainnya" = 6 items
      expect(items).toHaveLength(6);
      expect(items[0].id).toBe('cat-1');
      expect(items[0].color).toBe(ANALYTICS_CATEGORY_COLORS[0]);
      expect(items[5].id).toBe('category-others');
      expect(items[5].name).toBe('Lainnya');
      expect(items[5].value).toBe(50000);
      expect(items[5].color).toBe(OTHER_CATEGORY_COLOR);
    });

    it('does not create a Lainnya slice when there are exactly 5 or fewer categories', () => {
      const expenses: Transaction[] = [
        { id: 't1', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-1', goal_id: null, type: 'expense', amount: 300000, transaction_date: '2026-08-26', destination_wallet_id: null, note: null, created_at: '' },
        { id: 't2', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-2', goal_id: null, type: 'expense', amount: 200000, transaction_date: '2026-08-26', destination_wallet_id: null, note: null, created_at: '' },
        { id: 't3', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-3', goal_id: null, type: 'expense', amount: 100000, transaction_date: '2026-08-26', destination_wallet_id: null, note: null, created_at: '' },
      ];
      const items = aggregateCategoryDonutData(expenses, mockCategories, 600000);
      expect(items).toHaveLength(3);
      expect(items.some((i) => i.name === 'Lainnya')).toBe(false);
    });

    it('does not create slices with 0 value or 0 amount', () => {
      const expenses: Transaction[] = [
        { id: 't1', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-1', goal_id: null, type: 'expense', amount: 300000, transaction_date: '2026-08-26', destination_wallet_id: null, note: null, created_at: '' },
        { id: 't2', user_id: 'u1', wallet_id: 'w1', category_id: 'cat-2', goal_id: null, type: 'expense', amount: 0, transaction_date: '2026-08-26', destination_wallet_id: null, note: null, created_at: '' },
      ];
      const items = aggregateCategoryDonutData(expenses, mockCategories, 300000);
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('cat-1');
      expect(items[0].value).toBe(300000);
    });

    it('returns empty array when totalExpense is 0', () => {
      expect(aggregateCategoryDonutData([], mockCategories, 0)).toEqual([]);
    });
  });

  describe('generateDynamicInsights', () => {
    const baseParams = {
      dailyBurnRate: 50000,
      dailySafeToSpend: 60000,
      daysPassed: 10,
      daysRemaining: 15,
      totalExpense: 500000,
      topCategory: { id: 'c1', name: 'Makanan', total: 150000, percentage: 30 },
      peakSpendingDay: { dateStr: '2026-09-05', dayLabel: '5 Sep', total: 60000 },
    };

    it('handles empty state (no expenses) with exactly 1 factual note', () => {
      const insights = generateDynamicInsights({
        ...baseParams,
        totalExpense: 0,
        dailyBurnRate: 0,
        topCategory: null,
        peakSpendingDay: null,
      });
      expect(insights).toHaveLength(1);
      expect(insights[0].id).toBe('insight-empty');
      expect(insights[0].message).toContain('Belum ada pengeluaran');
      expect(insights[0].message).toContain('60.000');
    });

    it('detects zero Safe to Spend runway condition with high priority', () => {
      const insights = generateDynamicInsights({
        ...baseParams,
        dailySafeToSpend: 0,
        daysRemaining: 6,
      });
      const runwayInsight = insights.find((i) => i.id === 'insight-zero-runway');
      expect(runwayInsight).toBeDefined();
      expect(runwayInsight?.tone).toBe('danger');
      expect(runwayInsight?.message).toContain('Kuota aman harian telah mencapai Rp0 dengan 6 hari tersisa');
    });

    it('respects cooling window on days 1 and 2', () => {
      const insights = generateDynamicInsights({
        ...baseParams,
        daysPassed: 2,
        dailyBurnRate: 150000, // even if high burn rate on day 2
        dailySafeToSpend: 50000,
      });
      const pacing = insights.find((i) => i.type === 'pacing');
      expect(pacing?.id).toBe('insight-pacing-cooling');
      expect(pacing?.title).toBe('Kalibrasi Awal Siklus');
      expect(pacing?.message).toContain('Siklus baru berjalan 2 hari');
    });

    it('detects significant overburn (> 1.2x safe to spend)', () => {
      const insights = generateDynamicInsights({
        ...baseParams,
        daysPassed: 10,
        dailyBurnRate: 68000,
        dailySafeToSpend: 50000, // 68k > 50k * 1.2 (60k)
      });
      const pacing = insights.find((i) => i.id === 'insight-pacing-overburn');
      expect(pacing).toBeDefined();
      expect(pacing?.tone).toBe('danger');
      expect(pacing?.title).toBe('Laju Belanja di Atas Batas Aman');
      expect(pacing?.message).toContain('18.000 di atas batas aman');
    });

    it('detects mild overburn (<= 1.2x safe to spend)', () => {
      const insights = generateDynamicInsights({
        ...baseParams,
        daysPassed: 10,
        dailyBurnRate: 55000,
        dailySafeToSpend: 50000, // 55k <= 60k
      });
      const pacing = insights.find((i) => i.id === 'insight-pacing-overburn');
      expect(pacing).toBeDefined();
      expect(pacing?.tone).toBe('warning');
      expect(pacing?.title).toBe('Laju Belanja Sedikit di Atas Batas Aman');
      expect(pacing?.message).toContain('5.000 di atas batas aman');
    });

    it('evaluates healthy pacing calmly with difference against daily safe to spend', () => {
      const insights = generateDynamicInsights({
        ...baseParams,
        daysPassed: 10,
        dailyBurnRate: 35000,
        dailySafeToSpend: 50000,
      });
      const pacing = insights.find((i) => i.id === 'insight-pacing-healthy');
      expect(pacing).toBeDefined();
      expect(pacing?.tone).toBe('success');
      expect(pacing?.message).toContain('Rata-rata belanjamu');
      expect(pacing?.message).toContain('35.000/hari');
      expect(pacing?.message).toContain('15.000 di bawah batas aman');
    });

    it('computes peak day ratio against daily burn rate correctly', () => {
      const insights = generateDynamicInsights({
        ...baseParams,
        dailyBurnRate: 50000,
        peakSpendingDay: { dateStr: '2026-09-12', dayLabel: '12 Sep', total: 185000 }, // 185k / 50k = 3.7x
      });
      const peak = insights.find((i) => i.id === 'insight-peak-day');
      expect(peak).toBeDefined();
      expect(peak?.message).toContain('12 Sep');
      expect(peak?.message).toContain('185.000');
      expect(peak?.message).toContain('3,7× rata-rata belanja harian');
    });

    it('guards against division by 0 when daily burn rate is 0', () => {
      const insights = generateDynamicInsights({
        ...baseParams,
        dailyBurnRate: 0,
        peakSpendingDay: { dateStr: '2026-09-12', dayLabel: '12 Sep', total: 185000 },
      });
      const peak = insights.find((i) => i.id === 'insight-peak-day');
      expect(peak).toBeUndefined(); // Should not produce NaN ratio
    });

    it('describes top category with >= 50% concentration without judgmental wording', () => {
      const insights = generateDynamicInsights({
        ...baseParams,
        topCategory: { id: 'c-kos', name: 'Kos & Sewa', total: 540000, percentage: 54 },
      });
      const conc = insights.find((i) => i.id === 'insight-category-dominant');
      expect(conc).toBeDefined();
      expect(conc?.message).toContain('Pos Kos & Sewa menyerap 54% total pengeluaran siklus ini dan menjadi komponen biaya terbesar.');
    });

    it('strictly caps results at a maximum of 3 insights', () => {
      const insights = generateDynamicInsights({
        ...baseParams,
        dailySafeToSpend: 0, // Runway alert
        dailyBurnRate: 80000, // Significant overburn
        peakSpendingDay: { dateStr: '2026-09-12', dayLabel: '12 Sep', total: 300000 }, // Peak alert
        topCategory: { id: 'c-kos', name: 'Kos & Sewa', total: 540000, percentage: 54 }, // Category dominance
      });
      expect(insights.length).toBeLessThanOrEqual(3);
    });
  });
});
