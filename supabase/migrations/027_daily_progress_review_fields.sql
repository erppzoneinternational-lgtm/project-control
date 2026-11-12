-- ============================================================
-- 027_daily_progress_review_fields.sql
-- Adds missing review and rejection tracking columns to pm_daily_progress
-- to support PM soft review and rejection tracking.
-- ============================================================

BEGIN;

ALTER TABLE public.pm_daily_progress
  ADD COLUMN IF NOT EXISTS pm_reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pm_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pm_skipped BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Indexes for review queries
CREATE INDEX IF NOT EXISTS idx_pm_daily_progress_pm_reviewed 
  ON public.pm_daily_progress(pm_reviewed_by) 
  WHERE pm_reviewed_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pm_daily_progress_rejected 
  ON public.pm_daily_progress(rejected_by) 
  WHERE rejected_by IS NOT NULL;

COMMIT;
