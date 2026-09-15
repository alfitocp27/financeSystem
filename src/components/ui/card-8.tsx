import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export interface SpendingLimitCardProps {
  /** The main title of the card */
  title: string;
  /** A subtitle or date range shown below the title */
  dateRange: string;
  /** The text displayed on the button (e.g. percentage +8.4%) */
  buttonText?: string;
  /** Whether the trend is increasing or decreasing */
  isIncrease?: boolean;
  /** The current amount spent or value */
  currentSpending: number;
  /** The total spending limit */
  limit: number;
  /** Custom preformatted current amount (optional) */
  currentFormatted?: string;
  /** Custom preformatted limit (optional) */
  limitFormatted?: string;
  /** Prefix for limit (default 'of') */
  limitPrefix?: string;
  /** The currency symbol to display */
  currency?: string;
  /** The number of segments in the progress bar (default 5) */
  segments?: number;
  /** CSS class for the filled part of the progress bar */
  filledColorClass?: string;
  /** CSS class for the unfilled part of the progress bar */
  unfilledColorClass?: string;
  /** Callback function when the button is clicked */
  onButtonClick?: () => void;
  /** Optional additional class names for the card container */
  className?: string;
}

/**
 * A color-agnostic card to display spending limits and metrics with an animated segmented progress bar.
 */
export const SpendingLimitCard = ({
  title,
  dateRange,
  buttonText,
  isIncrease = true,
  currentSpending,
  limit,
  currentFormatted,
  limitFormatted,
  limitPrefix = "of",
  currency = "Rp ",
  segments = 5,
  filledColorClass = "bg-primary-500",
  unfilledColorClass = "bg-border-default",
  onButtonClick,
  className,
}: SpendingLimitCardProps) => {
  const percentage = limit > 0 ? (currentSpending / limit) * 100 : 0;

  const formatAmount = (amount: number) => {
    return `${currency}${amount.toLocaleString("id-ID")}`;
  };

  const displayCurrent = currentFormatted || formatAmount(currentSpending);
  const displayLimit = limitFormatted || formatAmount(limit);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-border-default bg-surface p-5 sm:p-6 text-text-primary shadow-xs hover:shadow-sm transition-all flex flex-col justify-between",
        className
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-text-primary tracking-tight truncate">
            {title}
          </h2>
          <p className="text-xs text-text-muted mt-0.5 truncate">{dateRange}</p>
        </div>

        {/* Button with percentage & up/down indicator - compact & clean */}
        {buttonText && (
          <Button
            variant="outline"
            size="sm"
            onClick={onButtonClick}
            className={cn(
              "shrink-0 font-semibold text-[11px] gap-1 px-2 py-0.5 h-6 rounded-full border transition-transform active:scale-95 shadow-2xs",
              isIncrease
                ? "bg-semantic-green-soft text-semantic-green border-semantic-green/20 hover:bg-emerald-100"
                : "bg-semantic-rose-soft text-semantic-rose border-semantic-rose/20 hover:bg-rose-100"
            )}
          >
            {isIncrease ? (
              <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
            ) : (
              <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
            )}
            <span>{buttonText}</span>
          </Button>
        )}
      </header>

      <div className="mt-4 sm:mt-5">
        <p className="text-2xl sm:text-[28px] font-extrabold tracking-tight tabular-nums flex items-baseline flex-wrap gap-1.5">
          <span>{displayCurrent}</span>
          <span className="text-xs sm:text-sm font-medium text-text-muted">
            {limitPrefix} {displayLimit}
          </span>
        </p>
      </div>

      <div
        className="mt-4"
        role="progressbar"
        aria-valuenow={Math.min(100, Math.round(percentage))}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${title} progress`}
      >
        <motion.div
          className="flex w-full items-center gap-1.5"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {Array.from({ length: segments }).map((_, index) => {
            const segmentFilled = percentage > (index / segments) * 100;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className={cn(
                  "h-2 flex-1 rounded-full transition-colors",
                  segmentFilled ? filledColorClass : unfilledColorClass
                )}
              />
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

export default SpendingLimitCard;
