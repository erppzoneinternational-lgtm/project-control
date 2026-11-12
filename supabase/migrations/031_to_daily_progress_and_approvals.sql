-- ============================================================
-- 031_to_daily_progress_and_approvals.sql
-- Area: Technical Office Daily Progress & Approvals (WS-2 & WS-6)
-- Entities: pm_deliverable_items enhancements, pm_to_progress_logs,
--           fn_sync_to_progress_to_item, RLS policies
-- ============================================================

BEGIN;

-- 1. Enhance pm_deliverable_items with TO progress tracking and approval columns
ALTER TABLE public.pm_deliverable_items
  ADD COLUMN IF NOT EXISTS progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (progress_pct >= 0.00 AND progress_pct <= 100.00),
  ADD COLUMN IF NOT EXISTS to_manager_approved BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS to_manager_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS to_manager_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_deliv_items_to_approved ON public.pm_deliverable_items(to_manager_approved);
CREATE INDEX IF NOT EXISTS idx_deliv_items_progress ON public.pm_deliverable_items(progress_pct);

-- 2. Technical Office Progress Logs Table
CREATE TABLE IF NOT EXISTS public.pm_to_progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_item_id UUID NOT NULL REFERENCES public.pm_deliverable_items(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  progress_pct NUMERIC(5,2) NOT NULL CHECK (progress_pct >= 0.00 AND progress_pct <= 100.00),
  notes TEXT,
  obstruction_type TEXT,
  obstruction_notes TEXT,
  logged_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  logged_by_stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  to_manager_approved BOOLEAN NOT NULL DEFAULT false,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_to_log_item_date UNIQUE (deliverable_item_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_to_logs_item ON public.pm_to_progress_logs(deliverable_item_id);
CREATE INDEX IF NOT EXISTS idx_to_logs_proj ON public.pm_to_progress_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_to_logs_date ON public.pm_to_progress_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_to_logs_approved ON public.pm_to_progress_logs(to_manager_approved);

-- 3. Trigger: Synchronize TO Log Progress & Sign-off to Deliverable Item
CREATE OR REPLACE FUNCTION public.fn_sync_to_progress_to_item()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.pm_deliverable_items
  SET
    progress_pct = NEW.progress_pct,
    to_manager_approved = NEW.to_manager_approved,
    to_manager_approved_at = CASE WHEN NEW.to_manager_approved THEN COALESCE(NEW.approved_at, now()) ELSE NULL END,
    to_manager_approved_by = CASE WHEN NEW.to_manager_approved THEN NEW.approved_by ELSE NULL END,
    updated_at = now()
  WHERE id = NEW.deliverable_item_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

DROP TRIGGER IF EXISTS trg_sync_to_progress_to_item ON public.pm_to_progress_logs;
CREATE TRIGGER trg_sync_to_progress_to_item
  AFTER INSERT OR UPDATE ON public.pm_to_progress_logs
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_to_progress_to_item();

-- 4. RLS Policies
ALTER TABLE public.pm_to_progress_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pm_to_progress_logs FROM anon, PUBLIC;
GRANT ALL ON public.pm_to_progress_logs TO authenticated, service_role;

DROP POLICY IF EXISTS to_logs_select ON public.pm_to_progress_logs;
DROP POLICY IF EXISTS to_logs_insert ON public.pm_to_progress_logs;
DROP POLICY IF EXISTS to_logs_update ON public.pm_to_progress_logs;

CREATE POLICY to_logs_select ON public.pm_to_progress_logs
  FOR SELECT TO authenticated
  USING (public.fn_user_can_access_project(auth.uid(), project_id));

CREATE POLICY to_logs_insert ON public.pm_to_progress_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_user_can_access_project(auth.uid(), project_id)
    AND (logged_by = auth.uid() OR auth.uid() IS NULL)
  );

CREATE POLICY to_logs_update ON public.pm_to_progress_logs
  FOR UPDATE TO authenticated
  USING (public.fn_user_can_access_project(auth.uid(), project_id))
  WITH CHECK (public.fn_user_can_access_project(auth.uid(), project_id));

COMMIT;
