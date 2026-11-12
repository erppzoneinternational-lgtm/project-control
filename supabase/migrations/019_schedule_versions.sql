-- ============================================================
-- Migration 019: Schedule versions (baseline/update workflow)
-- Date: 2026-08-25
--
-- Purpose:
--   1. Version the imported schedules (baseline, update1, update2...)
--   2. Each version = snapshot of activities at import time
--   3. Daily/weekly reports reference the version they were cut from
--   4. Fix: pm_boq_items.cost_code_id holds TEXT tags from multi-sheet
--      importer ("Civil/Lagoon 01") but column is UUID — move tags to a
--      dedicated text column so joins stop breaking.
-- ============================================================

-- 1. group_tag text column on BOQ items (importer writes here, never UUID casts)
ALTER TABLE public.pm_boq_items ADD COLUMN IF NOT EXISTS group_tag text;
COMMENT ON COLUMN public.pm_boq_items.group_tag IS 'Discipline/Building tag from multi-sheet import, e.g. "Civil/Lagoon 01"';

-- backfill from any legacy string tags stuck in cost_code_id (non-uuid values)
UPDATE public.pm_boq_items
SET group_tag = cost_code_id::text
WHERE cost_code_id IS NOT NULL
  AND cost_code_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- null out those broken FK values (they reference nothing)
UPDATE public.pm_boq_items
SET cost_code_id = NULL
WHERE cost_code_id IS NOT NULL
  AND cost_code_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- 2. schedule versions table
CREATE TABLE IF NOT EXISTS public.pm_schedule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_no int NOT NULL DEFAULT 1,
  version_type text NOT NULL DEFAULT 'baseline'
    CHECK (version_type IN ('baseline', 'update', 'recovery')),
  label text,
  source text NOT NULL DEFAULT 'xer_import'
    CHECK (source IN ('xer_import', 'manual_edit', 'api')),
  file_name text,
  data_date date,
  activity_count int NOT NULL DEFAULT 0,
  is_current boolean NOT NULL DEFAULT false,
  parent_version_id uuid REFERENCES public.pm_schedule_versions(id),
  imported_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, version_no)
);
CREATE INDEX IF NOT EXISTS idx_sched_ver_project ON public.pm_schedule_versions(project_id);

-- 3. activities get a version reference
ALTER TABLE public.pm_project_activities
  ADD COLUMN IF NOT EXISTS schedule_version_id uuid REFERENCES public.pm_schedule_versions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_acts_version ON public.pm_project_activities(schedule_version_id);

-- 4. reports reference the version they were cut from
CREATE TABLE IF NOT EXISTS public.pm_schedule_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  schedule_version_id uuid REFERENCES public.pm_schedule_versions(id) ON DELETE SET NULL,
  report_type text NOT NULL DEFAULT 'daily' CHECK (report_type IN ('daily', 'weekly', 'monthly', 'update')),
  period_start date NOT NULL,
  period_end date NOT NULL,
  data_date date,
  title text,
  summary jsonb,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sched_rep_project ON public.pm_schedule_reports(project_id);

-- 5. RLS: same open policy family as sibling pm_* tables (service-role writes)
ALTER TABLE public.pm_schedule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_schedule_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sched_ver_anon_all" ON public.pm_schedule_versions;
CREATE POLICY "sched_ver_anon_all" ON public.pm_schedule_versions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "sched_rep_anon_all" ON public.pm_schedule_reports;
CREATE POLICY "sched_rep_anon_all" ON public.pm_schedule_reports FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
