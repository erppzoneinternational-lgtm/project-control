-- ============================================================
-- 017_site_tasks.sql — Phase 1: Site Tasks Core
-- Site execution & QC inspection task system.
-- Decisions (owner-approved):
--   * Start with Phase 1 (site tasks)
--   * Daily progress reports MUST reference a task (enforced in RPC)
-- ============================================================

BEGIN;

-- ── 1. Core table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pm_site_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL DEFAULT 'execution' CHECK (task_type IN
    ('execution','inspection','material_delivery','handover','general')),
  title_ar TEXT NOT NULL,
  description TEXT,
  boq_item_id UUID REFERENCES public.pm_boq_items(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.pm_project_activities(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.pm_zones(id) ON DELETE SET NULL,
  assignee_stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  qc_stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  planned_date DATE NOT NULL,
  due_date DATE,
  inspection_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN
    ('pending','in_progress','pm_review','qc_pending','approved','rejected','done','cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  rejection_reason TEXT,
  progress_pct NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (due_date IS NULL OR due_date >= planned_date)
);

CREATE INDEX IF NOT EXISTS idx_site_tasks_project ON public.pm_site_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_site_tasks_assignee ON public.pm_site_tasks(assignee_stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_site_tasks_qc ON public.pm_site_tasks(qc_stakeholder_id);
CREATE INDEX IF NOT EXISTS idx_site_tasks_planned ON public.pm_site_tasks(project_id, planned_date);
CREATE INDEX IF NOT EXISTS idx_site_tasks_status ON public.pm_site_tasks(project_id, status);

-- ── 2. Daily-progress linkage (report MUST reference a task) ──
ALTER TABLE public.pm_daily_progress
  ADD COLUMN IF NOT EXISTS site_task_id UUID REFERENCES public.pm_site_tasks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_dp_site_task ON public.pm_daily_progress(site_task_id);

-- ── 3. updated_at trigger ────────────────────────────────────
DROP TRIGGER IF EXISTS trg_site_tasks_updated ON public.pm_site_tasks;
CREATE TRIGGER trg_site_tasks_updated
  BEFORE UPDATE ON public.pm_site_tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ── 4. RLS ───────────────────────────────────────────────────
ALTER TABLE public.pm_site_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS site_tasks_select ON public.pm_site_tasks;
CREATE POLICY site_tasks_select ON public.pm_site_tasks
  FOR SELECT TO authenticated
  USING (fn_user_can_access_project(auth.uid(), project_id));

DROP POLICY IF EXISTS site_tasks_write ON public.pm_site_tasks;
CREATE POLICY site_tasks_write ON public.pm_site_tasks
  FOR ALL TO authenticated
  USING (fn_user_can_access_project(auth.uid(), project_id))
  WITH CHECK (
    fn_user_can_access_project(auth.uid(), project_id)
    AND fn_user_has_role(auth.uid(), ARRAY[
      'admin','planning_manager','planning_engineer','project_manager'
    ]::public.user_role[])
  );

DROP POLICY IF EXISTS site_tasks_service ON public.pm_site_tasks;
CREATE POLICY site_tasks_service ON public.pm_site_tasks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Assignees can update THEIR OWN task status (progress, submit for inspection)
-- even though they cannot create tasks. (stakeholders has no auth-user link yet,
-- so any project member may update — creation stays role-restricted above.)
DROP POLICY IF EXISTS site_tasks_assignee_update ON public.pm_site_tasks;
CREATE POLICY site_tasks_assignee_update ON public.pm_site_tasks
  FOR UPDATE TO authenticated
  USING (fn_user_can_access_project(auth.uid(), project_id))
  WITH CHECK (fn_user_can_access_project(auth.uid(), project_id));

GRANT SELECT, INSERT, UPDATE ON public.pm_site_tasks TO authenticated;
GRANT ALL ON public.pm_site_tasks TO service_role;

-- ── 5. RPC: create daily report REQUIRING a site task ───────
-- Owner decision (ب): a daily report MUST reference an open site task.
-- NOTE: the legacy 9-arg overload was dropped (2025-08-25) — keeping both
-- made Postgres unable to resolve the call (42725 ambiguous function).
DROP FUNCTION IF EXISTS public.rpc_create_report(UUID, DATE, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.rpc_create_report(
  p_project_id UUID,
  p_progress_date DATE,
  p_discipline TEXT DEFAULT 'civil',
  p_weather TEXT DEFAULT NULL,
  p_manpower_count INT DEFAULT 0,
  p_equipment_summary TEXT DEFAULT NULL,
  p_entered_by_name TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_site_task_id UUID DEFAULT NULL
) RETURNS public.pm_daily_progress
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pm AS $$
DECLARE
  v_report_no INT;
  v_report public.pm_daily_progress;
  v_existing public.pm_daily_progress;
  v_task public.pm_site_tasks;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM public.pm_daily_progress
    WHERE idempotency_key = p_idempotency_key;

    IF FOUND THEN
      RETURN v_existing;
    END IF;
  END IF;

  -- Owner rule (ب): a daily report MUST reference an open site task
  IF p_site_task_id IS NULL THEN
    RAISE EXCEPTION 'SITE_TASK_REQUIRED: لا يمكن حفظ التقرير اليومي بدون ربطه بمهمة موقع مفتوحة';
  END IF;

  SELECT * INTO v_task FROM public.pm_site_tasks WHERE id = p_site_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'SITE_TASK_NOT_FOUND: المهمة غير موجودة';
  END IF;
  IF v_task.project_id <> p_project_id THEN
    RAISE EXCEPTION 'SITE_TASK_PROJECT_MISMATCH: المهمة لا تنتمي لنفس المشروع';
  END IF;
  IF v_task.status IN ('done','cancelled') THEN
    RAISE EXCEPTION 'SITE_TASK_CLOSED: المهمة مغلقة — افتح مهمة جديدة أو أعد فتحها';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('pm_daily_progress_' || p_project_id::text));

  SELECT COALESCE(MAX(report_no), 0) + 1 INTO v_report_no
  FROM public.pm_daily_progress
  WHERE project_id = p_project_id;

  INSERT INTO public.pm_daily_progress (
    project_id, progress_date, discipline, report_no, weather,
    manpower_count, equipment_summary, entered_by, entered_by_name,
    status, idempotency_key, notes, site_task_id
  ) VALUES (
    p_project_id, p_progress_date, COALESCE(p_discipline, 'civil'), v_report_no, p_weather,
    COALESCE(p_manpower_count, 0), p_equipment_summary, auth.uid(), p_entered_by_name,
    'draft', p_idempotency_key, p_notes, p_site_task_id
  ) RETURNING * INTO v_report;

  -- Keep the linked task moving
  UPDATE public.pm_site_tasks
  SET status = CASE WHEN status = 'pending' THEN 'in_progress' ELSE status END,
      updated_at = now()
  WHERE id = p_site_task_id;

  RETURN v_report;
END;
$$;

-- ── 6. RPC: task lifecycle transitions ──
-- Owner-approved workflow (2025-08-25):
--   pending → in_progress → pm_review (بانتظار اعتماد مدير المشروع)
--   → qc_pending (بانتظار استلام QC + إشعار لـ planning engineer)
--   → approved → done
--   الرفض في أي مرحلة يرجع التاسك in_progress بسبب مكتوب.
CREATE OR REPLACE FUNCTION public.rpc_site_task_transition(
  p_task_id UUID,
  p_target_status TEXT,
  p_note TEXT DEFAULT NULL
) RETURNS public.pm_site_tasks
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_task public.pm_site_tasks;
  v_allowed TEXT[];
BEGIN
  SELECT * INTO v_task FROM public.pm_site_tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND';
  END IF;

  v_allowed := CASE v_task.status
    WHEN 'pending'  THEN ARRAY['in_progress','cancelled']
    WHEN 'in_progress' THEN ARRAY['pm_review','cancelled']
    WHEN 'pm_review' THEN ARRAY['qc_pending','rejected']          -- مدير المشروع يعتمد أو يرفض
    WHEN 'qc_pending' THEN ARRAY['approved','rejected']           -- QC يستلم أو يرفض
    WHEN 'rejected' THEN ARRAY['in_progress','cancelled']
    WHEN 'approved' THEN ARRAY['done']
    ELSE ARRAY[]::TEXT[]
  END;

  IF NOT (p_target_status = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن الانتقال من % إلى %', v_task.status, p_target_status;
  END IF;

  -- Role gates per owner decision:
  --  * pm_review → qc_pending : مدير المشروع فقط (أو أدوار إدارية)
  --  * qc_pending → approved  : QC/الاستلام (نفس الأدوار الإدارية حالياً)
  IF p_target_status IN ('qc_pending','approved','rejected') THEN
    IF NOT fn_user_has_role(auth.uid(), ARRAY[
      'admin','project_manager','planning_manager','planning_engineer','technical_office'
    ]::public.user_role[]) THEN
      RAISE EXCEPTION 'FORBIDDEN: الاعتماد لمدير المشروع/مسؤول الاستلام أو الأدوار الإدارية فقط';
    END IF;
  END IF;

  UPDATE public.pm_site_tasks
  SET status = p_target_status,
      rejection_reason = CASE WHEN p_target_status = 'rejected' THEN p_note ELSE rejection_reason END,
      progress_pct = CASE WHEN p_target_status = 'done' THEN 100 ELSE progress_pct END,
      updated_at = now()
  WHERE id = p_task_id
  RETURNING * INTO v_task;

  RETURN v_task;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_create_report(UUID, DATE, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, UUID)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_site_task_transition(UUID, TEXT, TEXT)
  TO authenticated, service_role;

COMMIT;

-- Rollback:
-- DROP FUNCTION IF EXISTS public.rpc_site_task_transition(UUID, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.rpc_create_report(UUID, DATE, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT, UUID);
-- ALTER TABLE public.pm_daily_progress DROP COLUMN IF EXISTS site_task_id;
-- DROP TABLE IF EXISTS public.pm_site_tasks;
