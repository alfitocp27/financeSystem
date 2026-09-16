-- Migration: Add is_active column to savings_goals
-- Ensures backward compatibility with existing databases and enables safe archiving.

ALTER TABLE public.savings_goals
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT NULL;
