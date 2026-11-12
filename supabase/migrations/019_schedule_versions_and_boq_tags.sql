-- ============================================================
-- Migration 019: Schedule versions + BOQ building tags
-- Date: 2026-08-25
--
-- 1. Schedule versioning: baseline vs update snapshots with approval workflow
-- 2. Fix: imported BOQ building tags were silently dropped (cost_code string
--    has no column) — add building_tag text column + backfill from notes.
-- ============================================================

-- 1. BOQ building tag (from multi-sheet importer) ----------------------------
ALTER TABLE public.pm_boq_items
  ADD COLUMN IF NOT EXISTS building_tag text;

-- Backfill from the importer's notes: "Imported from <file> → <Sheet Name>"
UPDATE public.pm_boq_items
SET building_tag = trim(split_part(split_part(notes, '→', 2), '(', 1))
WHERE building_tag IS NULL
  AND notes ILIKE '%→%';

CREATE INDEX IF NOT EXISTS idx_boq_items_building_tag
  ON public.pm_boq_items (project_id, building_tag);

-- 2. Schedule versions (baseline / update / approved reports) ----------------
CREATE TABLE IF NOT EXISTS public.pm_schedule_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_no int NOT NULL DEFAULT 1,
  version_type text NOT NULL DEFAULT 'baseline'
    CHECK (version_type IN ('baseline', 'update', 'weekly_report', 'daily_report')),
  title text,
  source_file_name text,
  data_date date,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  submitted_by uuid REFERENCES auth.users(id),
  submitted_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  approval_note text,
  activities_count int DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, version_no)
);

CREATE INDEX IF NOT EXISTS idx_sched_versions_project
  ON public.pm_schedule_versions (project_id, version_no DESC);

-- link activities to their version
ALTER TABLE public.pm_project_activities
  ADD COLUMN IF NOT EXISTS schedule_version_id uuid REFERENCES public.pm_schedule_versions(id) ON DELETE SET DEFAULT;

-- NOTE: no updated_at trigger here — the 012 table has no updated_at column.

-- 3. RLS: same open pattern as sibling pm_ tables (locked down later with the rest)
ALTER TABLE public.pm_schedule_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sched versions anon all" ON public.pm_schedule_versions;
CREATE POLICY "sched versions anon all" ON public.pm_schedule_versions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
