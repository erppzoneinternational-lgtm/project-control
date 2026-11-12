-- 060: BOQ sheet pages + optional/omit inclusion + per-user AI keys
-- Model: pm_boq_sections (parent_section_id NULL) = one imported sheet = one page/tab.

-- 1) Sheet metadata
ALTER TABLE public.pm_boq_sections
  ADD COLUMN IF NOT EXISTS source_sheet_name TEXT,
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS color TEXT;

CREATE INDEX IF NOT EXISTS idx_pm_boq_sections_project ON public.pm_boq_sections(project_id, sort_order);

-- 2) Item inclusion state (FIDIC 13.1 omissions + optional scope)
ALTER TABLE public.pm_boq_items
  ADD COLUMN IF NOT EXISTS inclusion_status TEXT NOT NULL DEFAULT 'base',
  ADD COLUMN IF NOT EXISTS inclusion_reason TEXT,
  ADD COLUMN IF NOT EXISTS inclusion_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS inclusion_changed_by TEXT;

DO $$ BEGIN
  ALTER TABLE public.pm_boq_items ADD CONSTRAINT pm_boq_items_inclusion_chk
    CHECK (inclusion_status IN ('base','optional_pending','optional_added','omitted'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_pm_boq_items_section ON public.pm_boq_items(project_id, section_id);

-- 3) Backfill: one section per (project, source sheet) from notes "… → <Sheet>" or building_tag
WITH src AS (
  SELECT i.id, i.project_id,
         NULLIF(TRIM(COALESCE(NULLIF(split_part(i.notes, '→', 2), ''), i.building_tag)), '') AS sheet
  FROM public.pm_boq_items i
  WHERE i.section_id IS NULL
),
sheets AS (
  SELECT project_id, sheet, ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY sheet) AS rn
  FROM (SELECT DISTINCT project_id, sheet FROM src WHERE sheet IS NOT NULL) d
),
ins AS (
  INSERT INTO public.pm_boq_sections (project_id, name_ar, name_en, source_sheet_name, sort_order, is_optional)
  SELECT s.project_id, s.sheet, s.sheet, s.sheet, s.rn * 10, (s.sheet ~* 'optional|provisional|اختيار')
  FROM sheets s
  WHERE NOT EXISTS (
    SELECT 1 FROM public.pm_boq_sections x
    WHERE x.project_id = s.project_id AND x.source_sheet_name = s.sheet
  )
  RETURNING id, project_id, source_sheet_name
)
SELECT count(*) FROM ins;

UPDATE public.pm_boq_items i
SET section_id = s.id
FROM public.pm_boq_sections s
WHERE i.section_id IS NULL
  AND s.project_id = i.project_id
  AND s.source_sheet_name = NULLIF(TRIM(COALESCE(NULLIF(split_part(i.notes, '→', 2), ''), i.building_tag)), '');

UPDATE public.pm_boq_items i
SET inclusion_status = 'optional_pending'
FROM public.pm_boq_sections s
WHERE i.section_id = s.id AND s.is_optional AND i.inclusion_status = 'base';

-- 4) Per-user AI keys (BYOK). Encrypted at app layer (AES-256-GCM); never selected by browser.
CREATE TABLE IF NOT EXISTS public.pm_user_ai_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('gemini','openai','anthropic','openrouter')),
  model TEXT,
  encrypted_key TEXT NOT NULL,
  key_last4 TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, provider)
);
ALTER TABLE public.pm_user_ai_keys ENABLE ROW LEVEL SECURITY;
-- No browser policies: all access via server routes using service role.
REVOKE ALL ON public.pm_user_ai_keys FROM anon, authenticated;
