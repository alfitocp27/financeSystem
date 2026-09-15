import React, { useState, useRef, useEffect, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../lib/formatters';

export interface CategoryDonutItem {
  id: string;
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface CategoryDonutChartProps {
  data: CategoryDonutItem[];
  totalValue: number;
  cycleLabel?: string;
  className?: string;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  data,
  totalValue,
  cycleLabel = 'Siklus Aktif',
  className = '',
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  // Active index prioritized by hover, then by persistent click/keyboard selection
  const activeIndex = hoveredIndex !== null ? hoveredIndex : selectedIndex;
  const activeItem = activeIndex !== null && data[activeIndex] ? data[activeIndex] : null;

  // Geometry configuration
  const size = 230;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Gap between segments in SVG stroke units (only if multiple segments exist)
  const gapSize = data.length > 1 ? 4 : 0;

  // Reset selection on outside click for comfortable mobile usage
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedIndex(null);
        setHoveredIndex(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Keyboard navigation handler for chart segments
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (data.length === 0) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev === null || prev >= data.length - 1 ? 0 : prev + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev === null || prev <= 0 ? data.length - 1 : prev - 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSelectedIndex(null);
      setHoveredIndex(null);
    }
  };

  // If no expense data in cycle
  if (data.length === 0 || totalValue === 0) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center text-text-muted text-xs ${className}`}>
        <p className="font-medium text-text-secondary mb-1">Belum Ada Pengeluaran di Siklus Ini</p>
        <p className="text-text-muted">Grafik komposisi kategori akan muncul setelah Anda mencatat transaksi pengeluaran.</p>
      </div>
    );
  }

  // Precompute segment offsets
  let cumulativePercentage = 0;
  const segments = data.map((item, index) => {
    const itemPercentage = item.percentage;
    const rawLength = (itemPercentage / 100) * circumference;
    const segmentLength = Math.max(0, rawLength - gapSize);
    const strokeDasharray = `${segmentLength} ${circumference - segmentLength}`;
    const strokeDashoffset = -((cumulativePercentage / 100) * circumference);

    cumulativePercentage += itemPercentage;

    return {
      ...item,
      index,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div
      ref={containerRef}
      className={`w-full ${className}`}
      tabIndex={0}
      role="region"
      aria-label={`Grafik donat komposisi pengeluaran kategori. Total pengeluaran: ${formatCurrency(totalValue)}. Gunakan tombol panah kiri dan kanan untuk memilih kategori.`}
      onKeyDown={handleKeyDown}
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-8">
        {/* Donut Graphic Container */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="overflow-visible -rotate-90 origin-center"
            role="graphics-document"
            aria-labelledby={labelId}
          >
            <title id={labelId}>Komposisi Pengeluaran per Kategori</title>

            {/* Subtle background track ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--color-border-subtle, #f1f5f9)"
              strokeWidth={strokeWidth}
            />

            {/* Interactive Data Segments */}
            {segments.map((segment) => {
              const isItemActive = activeIndex === segment.index;
              const hasActiveFocus = activeIndex !== null;

              return (
                <motion.circle
                  key={segment.id || segment.name}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={isItemActive ? strokeWidth + 3 : strokeWidth}
                  strokeDasharray={segment.strokeDasharray}
                  strokeDashoffset={segment.strokeDashoffset}
                  strokeLinecap="butt"
                  role="button"
                  tabIndex={-1}
                  aria-label={`${segment.name}: ${formatCurrency(segment.value)} (${segment.percentage}%)`}
                  initial={{ opacity: 0, strokeDashoffset: circumference }}
                  animate={{
                    opacity: hasActiveFocus && !isItemActive ? 0.35 : 1,
                    strokeDashoffset: segment.strokeDashoffset,
                  }}
                  transition={{
                    opacity: { duration: 0.2 },
                    strokeDashoffset: { duration: 0.7, ease: 'easeOut', delay: segment.index * 0.04 },
                  }}
                  className="cursor-pointer transition-all duration-200 origin-center"
                  style={{
                    filter: isItemActive ? `drop-shadow(0 2px 6px ${segment.color}55)` : 'none',
                  }}
                  onMouseEnter={() => setHoveredIndex(segment.index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setSelectedIndex(selectedIndex === segment.index ? null : segment.index)}
                />
              );
            })}
          </svg>

          {/* Dynamic Center Content with AnimatePresence */}
          <div
            className="absolute flex flex-col items-center justify-center text-center pointer-events-none p-3 select-none"
            style={{
              width: size - strokeWidth * 2 - 12,
              height: size - strokeWidth * 2 - 12,
            }}
            aria-live="polite"
          >
            <AnimatePresence mode="wait">
              {activeItem ? (
                <motion.div
                  key={`segment-${activeItem.name}`}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="flex flex-col items-center justify-center w-full px-1"
                >
                  <p className="text-xs font-semibold text-text-secondary truncate max-w-[130px] sm:max-w-[140px] mb-0.5">
                    {activeItem.name}
                  </p>
                  <p className="text-base sm:text-lg font-extrabold text-text-primary tabular-nums tracking-tight leading-tight">
                    {formatCurrency(activeItem.value)}
                  </p>
                  <span
                    className="inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-bold tabular-nums"
                    style={{
                      backgroundColor: `${activeItem.color}18`,
                      color: activeItem.color,
                    }}
                  >
                    {activeItem.percentage}%
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="default-total"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.94 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="flex flex-col items-center justify-center w-full px-1"
                >
                  <p className="text-xs font-medium text-text-muted mb-0.5">
                    Total Pengeluaran
                  </p>
                  <p className="text-base sm:text-lg font-extrabold text-text-primary tabular-nums tracking-tight leading-tight">
                    {formatCurrency(totalValue)}
                  </p>
                  <span className="text-xs text-text-muted mt-1">
                    {cycleLabel}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Clean Interactive Legend List (Two-way linked with Donut) */}
        <div className="flex-1 w-full space-y-1 divide-y divide-border-subtle">
          {data.map((item, index) => {
            const isItemActive = activeIndex === index;
            const hasActiveFocus = activeIndex !== null;

            return (
              <button
                key={item.id || item.name}
                type="button"
                onClick={() => setSelectedIndex(selectedIndex === index ? null : index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`w-full flex items-center justify-between gap-3 py-2 px-2.5 rounded-lg text-left transition-all duration-150 min-h-[44px] ${
                  isItemActive
                    ? 'bg-surface-container-low font-semibold shadow-xs'
                    : hasActiveFocus
                    ? 'opacity-45 hover:opacity-100 hover:bg-surface-container-lowest'
                    : 'hover:bg-surface-container-lowest'
                }`}
                aria-pressed={isItemActive}
                aria-label={`Pilih kategori ${item.name}`}
              >
                {/* Left: Color Pip + Category Name */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-xs shrink-0 transition-transform duration-150"
                    style={{
                      backgroundColor: item.color,
                      transform: isItemActive ? 'scale(1.2)' : 'scale(1)',
                    }}
                    aria-hidden="true"
                  />
                  <span className="text-xs text-text-primary truncate font-medium">
                    {item.name}
                  </span>
                </div>

                {/* Right: Nominal + Percentage */}
                <div className="flex items-center gap-3 shrink-0 tabular-nums text-xs">
                  <span className="font-semibold text-text-primary">
                    {formatCurrency(item.value)}
                  </span>
                  <span
                    className="font-medium text-text-muted w-9 text-right"
                    style={isItemActive ? { color: item.color, fontWeight: 700 } : undefined}
                  >
                    {item.percentage}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
