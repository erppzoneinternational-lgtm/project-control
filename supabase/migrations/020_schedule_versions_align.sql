-- ============================================================
-- Migration 020: align pm_schedule_versions (012 schema) with workflow
-- Date: 2026-08-25
--
-- 012 created pm_schedule_versions (label/source_type/is_current...).
-- 019 (mine) assumed different columns — CREATE IF NOT EXISTS was a no-op and
-- its ALTERs targeted a non-existent shape. This migration adds the workflow
-- columns to the REAL table without touching existing structure.
-- ============================================================

ALTER TABLE public.pm_schedule_versions
  ADD COLUMN IF NOT EXISTS version_type text NOT NULL DEFAULT 'update',
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS source_file_name text,
  ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approval_note text;

-- constrain values going forward (existing rows default to update/draft)
ALTER TABLE public.pm_schedule_versions DROP CONSTRAINT IF EXISTS sched_versions_type_chk;
ALTER TABLE public.pm_schedule_versions ADD CONSTRAINT sched_versions_type_chk
  CHECK (version_type IN ('baseline', 'update', 'weekly_report', 'daily_report'));
ALTER TABLE public.pm_schedule_versions DROP CONSTRAINT IF EXISTS sched_versions_status_chk;
ALTER TABLE public.pm_schedule_versions ADD CONSTRAINT sched_versions_status_chk
  CHECK (status IN ('draft', 'submitted', 'approved', 'rejected'));

CREATE INDEX IF NOT EXISTS idx_sched_versions_type
  ON public.pm_schedule_versions (project_id, version_type, version_no DESC);
