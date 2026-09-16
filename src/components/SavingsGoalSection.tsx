import React, { useState, useMemo } from 'react';
import {
  PiggyBank,
  Plus,
  Target,
  CheckCircle2,
  ArrowDownRight,
  ArrowUpRight,
  Settings2,
  Archive,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { SavingsGoal } from '../types/database.types';
import { formatCurrency } from '../lib/formatters';
import {
  calculateGoalProgress,
  getGoalTemporalStatus,
  calculatePortfolioSummary,
} from '../lib/savings-goal-utils';
import { AddSavingsGoalModal } from './AddSavingsGoalModal';
import { EditSavingsGoalModal } from './EditSavingsGoalModal';
import { AllocateGoalModal } from './AllocateGoalModal';
import { WithdrawGoalModal } from './WithdrawGoalModal';

interface SavingsGoalSectionProps {
  onShowToast?: (msg: string) => void;
}

export const SavingsGoalSection: React.FC<SavingsGoalSectionProps> = ({ onShowToast }) => {
  const { savingsGoals } = useFinance();

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [allocatingGoal, setAllocatingGoal] = useState<SavingsGoal | null>(null);
  const [withdrawingGoal, setWithdrawingGoal] = useState<SavingsGoal | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Active vs Archived goals
  const activeGoals = useMemo(() => {
    return savingsGoals.filter((g) => g.is_active !== false);
  }, [savingsGoals]);

  const archivedGoals = useMemo(() => {
    return savingsGoals.filter((g) => g.is_active === false);
  }, [savingsGoals]);

  // Portfolio summary calculation
  const portfolio = useMemo(() => {
    return calculatePortfolioSummary(activeGoals);
  }, [activeGoals]);

  const remainingTargetAmount = Math.max(
    0,
    portfolio.totalTargetAmount - portfolio.totalSavingsReserve
  );

  return (
    <section className="space-y-6">
      {/* 1. MASTER SAVINGS PORTFOLIO STRIP */}
      <div className="bg-surface-elevated border border-border-default rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-modal border border-border-gold/30 flex items-center justify-center text-text-gold">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-text-primary tracking-tight">
                  Portofolio Tabungan
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-surface-modal text-text-muted border border-border-subtle font-medium">
                  {portfolio.activeGoalsCount} Target Aktif
                </span>
              </div>
              <p className="text-xs text-text-muted mt-0.5">
                Dana simpanan terproteksi di luar anggaran belanja konsumtif
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-slate-950 text-xs font-bold transition-all shadow-sm min-h-[44px] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Target Baru</span>
          </button>
        </div>

        {/* Portfolio Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
          {/* Total Terkumpul */}
          <div className="p-4 rounded-xl bg-surface-modal border border-border-subtle">
            <span className="text-xs font-medium text-text-muted block mb-1">
              Total Dana Terkumpul
            </span>
            <div className="text-xl font-bold text-text-gold tabular-nums tracking-tight">
              {formatCurrency(portfolio.totalSavingsReserve)}
            </div>
            <p className="text-xs text-text-secondary mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-text-gold" />
              <span>Cadangan likuid aman</span>
            </p>
          </div>

          {/* Total Target Plafon */}
          <div className="p-4 rounded-xl bg-surface-modal border border-border-subtle">
            <span className="text-xs font-medium text-text-muted block mb-1">
              Total Plafon Target
            </span>
            <div className="text-xl font-bold text-text-primary tabular-nums tracking-tight">
              {formatCurrency(portfolio.totalTargetAmount)}
            </div>
            <p className="text-xs text-text-muted mt-1">
              Kurang {formatCurrency(remainingTargetAmount)} lagi
            </p>
          </div>

          {/* Progres Portofolio */}
          <div className="p-4 rounded-xl bg-surface-modal border border-border-subtle">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-text-muted">Progres Portofolio</span>
              <span className="text-xs font-bold text-text-primary tabular-nums">
                {portfolio.portfolioProgress}%
              </span>
            </div>
            <div
              className="w-full bg-surface-elevated h-2.5 rounded-full overflow-hidden my-2 border border-border-subtle"
              role="progressbar"
              aria-valuenow={portfolio.portfolioProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progres portofolio tabungan"
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(100, portfolio.portfolioProgress)}%` }}
              />
            </div>
            <p className="text-xs text-text-secondary">
              {portfolio.completedGoalsCount} dari {portfolio.activeGoalsCount} target tercapai
            </p>
          </div>
        </div>
      </div>

      {/* 2. FLAT GOAL LEDGER */}
      <div className="bg-surface-elevated border border-border-default rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-text-gold" />
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Daftar Target Tabungan
            </h3>
          </div>
          <span className="text-xs text-text-muted">
            {activeGoals.length} akun aktif
          </span>
        </div>

        {activeGoals.length === 0 ? (
          /* Empty State */
          <div className="p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-surface-modal border border-border-default flex items-center justify-center text-text-muted mx-auto mb-3">
              <Target className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-text-primary">Belum Ada Target Tabungan Aktif</p>
            <p className="text-xs text-text-muted max-w-sm mx-auto mt-1 mb-4">
              Mulai buat target tabungan untuk mengamankan dana darurat, bayar kos semester depan, atau impian pribadimu.
            </p>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-slate-950 text-xs font-bold transition-all min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Target Pertama</span>
            </button>
          </div>
        ) : (
          /* Flat Ledger Rows */
          <div className="divide-y divide-border-subtle">
            {activeGoals.map((goal) => {
              const { percentage, visualPercentage, isCompleted, remainingAmount, surplusAmount } =
                calculateGoalProgress(goal.current_amount, goal.target_amount);
              const temporal = getGoalTemporalStatus(goal.target_date);

              return (
                <div
                  key={goal.id}
                  className="p-5 hover:bg-surface-modal/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Column: Icon + Name + Badges */}
                  <div className="flex items-start gap-3.5 min-w-[240px] max-w-md">
                    <div className="w-10 h-10 rounded-xl bg-surface-modal border border-border-gold/30 flex items-center justify-center text-text-gold shrink-0 mt-0.5">
                      <Target className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-text-primary truncate">
                          {goal.name}
                        </h4>
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-semantic-green-soft text-semantic-green-text font-bold border border-semantic-green/30">
                            <CheckCircle2 className="w-3 h-3" />
                            Tercapai
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-modal text-text-muted font-medium border border-border-subtle">
                            Aktif
                          </span>
                        )}
                      </div>

                      {/* Temporal Status */}
                      <div className="flex items-center gap-1.5 mt-1 text-xs text-text-muted">
                        <Clock className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        <span>{temporal ? temporal.relativeText : 'Tanpa tenggat target'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center Column: Progress Visualizer & Financial Numbers */}
                  <div className="flex-1 max-w-lg">
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <div className="text-xs text-text-muted">
                        Terkumpul:{' '}
                        <strong className="text-sm font-bold text-text-gold tabular-nums">
                          {formatCurrency(goal.current_amount)}
                        </strong>
                      </div>
                      <div className="text-xs text-text-muted tabular-nums">
                        Target: <strong className="text-text-primary">{formatCurrency(goal.target_amount)}</strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div
                      className="w-full bg-surface-modal h-2 rounded-full overflow-hidden border border-border-subtle"
                      role="progressbar"
                      aria-valuenow={percentage}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Progres target ${goal.name}`}
                    >
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-semantic-green' : 'bg-primary'
                        }`}
                        style={{ width: `${visualPercentage}%` }}
                      />
                    </div>

                    {/* Bottom Status & Percentage */}
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="text-text-secondary">
                        {isCompleted
                          ? surplusAmount > 0
                            ? `Surplus ${formatCurrency(surplusAmount)}`
                            : 'Target telah terpenuhi 100%'
                          : `Kurang ${formatCurrency(remainingAmount)}`}
                      </span>
                      <span className="font-bold tabular-nums text-text-primary">
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end lg:self-center pt-2 lg:pt-0">
                    <button
                      type="button"
                      onClick={() => setAllocatingGoal(goal)}
                      className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover active:scale-[0.98] text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs min-h-[44px]"
                      aria-label={`Nabung ke target ${goal.name}`}
                    >
                      <ArrowDownRight className="w-4 h-4" />
                      <span>Nabung</span>
                    </button>

                    {Number(goal.current_amount) > 0 && (
                      <button
                        type="button"
                        onClick={() => setWithdrawingGoal(goal)}
                        className="px-3.5 py-2 rounded-xl bg-surface-modal hover:bg-surface-elevated text-text-primary border border-border-default hover:border-border-gold/40 text-xs font-semibold flex items-center gap-1.5 transition-colors min-h-[44px]"
                        aria-label={`Tarik dana dari target ${goal.name}`}
                      >
                        <ArrowUpRight className="w-4 h-4 text-text-muted" />
                        <span>Tarik</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingGoal(goal)}
                      className="w-10 h-10 rounded-xl bg-surface-modal hover:bg-surface-elevated text-text-muted hover:text-text-primary border border-border-default flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                      aria-label={`Kelola target ${goal.name}`}
                      title="Kelola target"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. ARCHIVED GOALS SECTION */}
      {archivedGoals.length > 0 && (
        <div className="bg-surface-elevated/60 border border-border-subtle rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-modal/40 transition-colors min-h-[44px]"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
              <Archive className="w-4 h-4" />
              <span>Target Tabungan Diarsipkan ({archivedGoals.length})</span>
            </div>
            {showArchived ? (
              <ChevronUp className="w-4 h-4 text-text-muted" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-muted" />
            )}
          </button>

          {showArchived && (
            <div className="divide-y divide-border-subtle border-t border-border-subtle">
              {archivedGoals.map((goal) => {
                return (
                  <div
                    key={goal.id}
                    className="p-4 bg-surface-modal/30 flex items-center justify-between gap-4 opacity-75"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center text-text-muted">
                        <Archive className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-secondary">{goal.name}</p>
                        <p className="text-xs text-text-muted">
                          Target: {formatCurrency(goal.target_amount)} • Saldo:{' '}
                          {formatCurrency(goal.current_amount)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEditingGoal(goal)}
                      className="px-3 py-1.5 rounded-lg border border-border-default hover:bg-surface-elevated text-xs font-semibold text-text-muted hover:text-text-primary transition-colors min-h-[44px]"
                    >
                      Kelola
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODALS */}
      <AddSavingsGoalModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onShowToast={onShowToast}
      />

      <EditSavingsGoalModal
        isOpen={!!editingGoal}
        goal={editingGoal}
        onClose={() => setEditingGoal(null)}
        onShowToast={onShowToast}
      />

      <AllocateGoalModal
        isOpen={!!allocatingGoal}
        goal={allocatingGoal}
        onClose={() => setAllocatingGoal(null)}
        onShowToast={onShowToast}
      />

      <WithdrawGoalModal
        isOpen={!!withdrawingGoal}
        goal={withdrawingGoal}
        onClose={() => setWithdrawingGoal(null)}
        onShowToast={onShowToast}
      />
    </section>
  );
};

