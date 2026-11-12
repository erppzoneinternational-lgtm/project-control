-- Migration 043: Temporal Assignment Tracking
-- Adds start/end dates, active flag, succession chain, and org-chart hierarchy
-- to project_stakeholders and pm_project_team tables.

-- ============================================================
-- 1. project_stakeholders — temporal + hierarchy columns
-- ============================================================
ALTER TABLE public.project_stakeholders
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS predecessor_id UUID
    REFERENCES public.project_stakeholders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS termination_reason TEXT,
  ADD COLUMN IF NOT EXISTS reports_to UUID
    REFERENCES public.project_stakeholders(id) ON DELETE SET NULL;

-- Backfill: set existing rows as active with assigned_at as start_date
UPDATE public.project_stakeholders
SET start_date = (assigned_at AT TIME ZONE 'UTC')::DATE,
    is_active = true
WHERE start_date IS NULL AND assigned_at IS NOT NULL;

-- Index: fast lookup "who is currently active on project X?"
CREATE INDEX IF NOT EXISTS idx_ps_active_project
  ON public.project_stakeholders(project_id, is_active)
  WHERE is_active = true;

-- Index: org-chart parent lookup
CREATE INDEX IF NOT EXISTS idx_ps_reports_to
  ON public.project_stakeholders(reports_to)
  WHERE reports_to IS NOT NULL;

-- ============================================================
-- 2. pm_project_team — temporal columns
-- ============================================================
ALTER TABLE public.pm_project_team
  ADD COLUMN IF NOT EXISTS user_id UUID
    REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS predecessor_id UUID
    REFERENCES public.pm_project_team(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS termination_reason TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Index: fast lookup "who is currently active on project X?"
CREATE INDEX IF NOT EXISTS idx_team_active_project
  ON public.pm_project_team(project_id, is_active)
  WHERE is_active = true;

-- ============================================================
-- 3. Auto-deactivate trigger for project_stakeholders
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_stakeholder_deactivate_on_end_date()
RETURNS TRIGGER AS $$
BEGIN
  -- When end_date is set (and was previously NULL), auto-set is_active = false
  IF NEW.end_date IS NOT NULL AND (OLD.end_date IS NULL OR TG_OP = 'INSERT') THEN
    NEW.is_active := false;
  END IF;
  -- When end_date is cleared, re-activate
  IF NEW.end_date IS NULL AND OLD.end_date IS NOT NULL THEN
    NEW.is_active := true;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

DROP TRIGGER IF EXISTS trg_stakeholder_deactivate ON public.project_stakeholders;
CREATE TRIGGER trg_stakeholder_deactivate
  BEFORE INSERT OR UPDATE OF end_date ON public.project_stakeholders
  FOR EACH ROW EXECUTE FUNCTION public.fn_stakeholder_deactivate_on_end_date();

-- ============================================================
-- 4. Auto-deactivate trigger for pm_project_team
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_team_deactivate_on_end_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date IS NOT NULL AND (OLD.end_date IS NULL OR TG_OP = 'INSERT') THEN
    NEW.is_active := false;
  END IF;
  IF NEW.end_date IS NULL AND OLD.end_date IS NOT NULL THEN
    NEW.is_active := true;
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

DROP TRIGGER IF EXISTS trg_team_deactivate ON public.pm_project_team;
CREATE TRIGGER trg_team_deactivate
  BEFORE INSERT OR UPDATE OF end_date ON public.pm_project_team
  FOR EACH ROW EXECUTE FUNCTION public.fn_team_deactivate_on_end_date();
