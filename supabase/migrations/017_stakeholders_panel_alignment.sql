-- ============================================================
-- Migration 017: Stakeholders panel backend alignment
-- Date: 2026-08-24
--
-- Purpose: make the Stakeholders directory + assign flow fully
-- functional for the COO Assistant by aligning schema with the
-- service-layer payloads (project.service.ts).
--
-- 1. stakeholders: add legacy-compatible columns the app writes
-- 2. project_stakeholders: add party_kind used by assign flow
-- 3. Backfill name/name_en from existing columns
-- 4. Relax stakeholders.id to allow app-generated TEXT ids
--    (existing FKs reference TEXT already per migration history)
-- ============================================================

-- 1. stakeholders extra columns ---------------------------------------------
ALTER TABLE public.stakeholders
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS employee_code TEXT,
  ADD COLUMN IF NOT EXISTS organization_name TEXT;

-- backfill name columns for existing rows (name_en preferred, else name_ar)
UPDATE public.stakeholders
SET name = COALESCE(name_en, name_ar)
WHERE name IS NULL;

UPDATE public.stakeholders
SET name_en = COALESCE(name_en, name_ar)
WHERE name_en IS NULL;

UPDATE public.stakeholders
SET job_title = COALESCE(job_title, role)
WHERE job_title IS NULL;

-- 2. project_stakeholders.party_kind ----------------------------------------
ALTER TABLE public.project_stakeholders
  ADD COLUMN IF NOT EXISTS party_kind TEXT DEFAULT 'employee';

UPDATE public.project_stakeholders
SET party_kind = s.stakeholder_kind
FROM public.stakeholders s
WHERE public.project_stakeholders.stakeholder_id = s.id
  AND public.project_stakeholders.party_kind IS NULL;

-- 3. id type check -----------------------------------------------------------
-- Live stakeholders.id is TEXT (per migration 56a86c1 note: "stakeholders.id
-- is TEXT in this database"). Verify and only act if UUID.
DO $$
DECLARE col_type TEXT;
BEGIN
  SELECT data_type INTO col_type
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='stakeholders' AND column_name='id';

  IF col_type = 'uuid' THEN
    -- app generates 'stk_...' ids; convert column to TEXT to accept them
    ALTER TABLE public.stakeholders ALTER COLUMN id DROP DEFAULT;
    -- drop FKs pointing at stakeholders.id, convert, recreate
    EXECUTE (
      SELECT string_agg(
        format('ALTER TABLE %s DROP CONSTRAINT %I',
               tc.table_schema || '.' || tc.table_name, tc.constraint_name), '; ')
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type='FOREIGN KEY'
        AND kcu.table_schema='public' AND kcu.table_name='stakeholders'
    );
    ALTER TABLE public.stakeholders ALTER COLUMN id TYPE TEXT USING id::text;
    ALTER TABLE public.stakeholders ALTER COLUMN id SET DEFAULT
      ('stk_' || floor(extract(epoch from now()))::text || '_' || substr(md5(random()::text), 1, 4));
  END IF;
END $$;
