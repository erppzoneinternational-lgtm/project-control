-- ============================================================
-- Migration 019: BOQ revisions table + cost-code tags for imports
-- Date: 2026-08-25
--
-- Fixes:
--   1. pm_boq_revisions missing on live DB -> audit trail & version badge broken
--   2. Multi-sheet importer writes building tag as text into cost_code_id
--      (uuid col) -> silently dropped; link page shows 0 BOQ items.
--      Fix: create real pm_cost_codes rows per tag and backfill cost_code_id.
--   3. Schedule versions: ensure pm_schedule_versions exists for baseline/update
--      tracking (used by XER import versioning).
-- ============================================================

-- 1. BOQ revisions (audit trail) --------------------------------------------
CREATE TABLE IF NOT EXISTS public.pm_boq_revisions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_item_id   uuid NOT NULL REFERENCES public.pm_boq_items(id) ON DELETE CASCADE,
  revision      integer NOT NULL,
  contract_qty  numeric,
  rate_egp      numeric,
  amount_egp    numeric,
  description_ar text,
  changed_by    text,
  change_reason text,
  snapshot_data jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (boq_item_id, revision)
);
CREATE INDEX IF NOT EXISTS idx_boq_revisions_item
  ON public.pm_boq_revisions(boq_item_id, revision DESC);

ALTER TABLE public.pm_boq_revisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "boq_revisions_read" ON public.pm_boq_revisions;
CREATE POLICY "boq_revisions_read" ON public.pm_boq_revisions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "boq_revisions_write" ON public.pm_boq_revisions;
CREATE POLICY "boq_revisions_write" ON public.pm_boq_revisions
  FOR INSERT TO authenticated WITH CHECK (true);

-- 2. Cost codes directory + backfill from imported tags ----------------------
CREATE TABLE IF NOT EXISTS public.pm_cost_codes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code       text NOT NULL UNIQUE,
  name_ar    text,
  name_en    text,
  category   text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pm_cost_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cost_codes_all" ON public.pm_cost_codes;
CREATE POLICY "cost_codes_all" ON public.pm_cost_codes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create a cost code for every distinct tag currently sitting in item_code
-- prefix or notes of imported rows (tag format "Discipline/Building" stored in
-- item_code like "BUILDING-SN" is NOT used; the importer now passes tag via
-- notes "Imported from file → sheet"). We derive from item_code prefix groups.
INSERT INTO public.pm_cost_codes (code, name_ar, category)
SELECT DISTINCT split_part(item_code, '-', 1), split_part(item_code, '-', 1), 'boq_group'
FROM public.pm_boq_items
WHERE cost_code_id IS NULL
ON CONFLICT (code) DO NOTHING;

-- Backfill cost_code_id by matching the item_code prefix
UPDATE public.pm_boq_items b
SET cost_code_id = c.id
FROM public.pm_cost_codes c
WHERE b.cost_code_id IS NULL
  AND c.code = split_part(b.item_code, '-', 1);

-- 3. Schedule versions table (baseline/update tracking) ----------------------
CREATE TABLE IF NOT EXISTS public.pm_schedule_versions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_no    integer NOT NULL,
  version_type  text NOT NULL DEFAULT 'update',      -- baseline | update
  source_file   text,
  data_date     date,
  activity_count integer DEFAULT 0,
  is_current    boolean NOT NULL DEFAULT false,
  imported_by   text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, version_no)
);
CREATE INDEX IF NOT EXISTS idx_schedule_versions_project
  ON public.pm_schedule_versions(project_id, version_no DESC);
ALTER TABLE public.pm_schedule_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schedule_versions_all" ON public.pm_schedule_versions;
CREATE POLICY "schedule_versions_all" ON public.pm_schedule_versions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
