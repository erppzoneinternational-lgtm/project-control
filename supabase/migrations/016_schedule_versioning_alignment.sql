-- ============================================================
-- 016_schedule_versioning_alignment.sql
-- Aligns pm_schedule_versions with ScheduleVersionService contract
-- (src/lib/services/schedule-version.service.ts) which expects:
--   version_type, title, source_file_name, status, submitted_by,
--   submitted_at, approved_by, approved_at, approval_note, created_by
-- The XER import flow (baseline page) calls createVersionForImport which
-- currently ALWAYS fails silently because these columns don't exist —
-- so imported schedules were never registered as versions and never
-- linked to daily/weekly reports.
-- Idempotent: safe to re-run. Additive only.
-- ============================================================

ALTER TABLE public.pm_schedule_versions
  ADD COLUMN IF NOT EXISTS version_type TEXT NOT NULL DEFAULT 'baseline'
    CHECK (version_type IN ('baseline','update','weekly_report','daily_report')),
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS source_file_name TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','submitted','approved','rejected')),
  ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approval_note TEXT,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Map legacy columns where useful: keep source_type in sync with version_type
-- (source_type already exists with CHECK ('xer','xml','manual')).

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_sched_ver_project_type
  ON public.pm_schedule_versions(project_id, version_type);
CREATE INDEX IF NOT EXISTS idx_sched_ver_project_status
  ON public.pm_schedule_versions(project_id, status);

-- Activities: fast lookup by version (FK already exists)
CREATE INDEX IF NOT EXISTS idx_activities_sched_version
  ON public.pm_project_activities(schedule_version_id);

-- Backfill: existing rows are baselines
UPDATE public.pm_schedule_versions SET version_type = 'baseline', status = 'approved'
WHERE version_type IS NULL OR version_type = 'baseline';

-- Rollback:
-- ALTER TABLE public.pm_schedule_versions
--   DROP COLUMN IF EXISTS version_type, DROP COLUMN IF EXISTS title,
--   DROP COLUMN IF EXISTS source_file_name, DROP COLUMN IF EXISTS status,
--   DROP COLUMN IF EXISTS submitted_by, DROP COLUMN IF EXISTS submitted_at,
--   DROP COLUMN IF EXISTS approved_by, DROP COLUMN IF EXISTS approved_at,
--   DROP COLUMN IF EXISTS approval_note, DROP COLUMN IF EXISTS created_by;
