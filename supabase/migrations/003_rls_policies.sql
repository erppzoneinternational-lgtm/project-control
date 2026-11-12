-- ============================================================================
-- Migration 003: RLS Policies + Security RPCs
-- Pzone International ERP — New Supabase Account
-- Date: 2026-08-24
-- Depends on: 001_core_schema.sql, 002_planning_schema.sql
-- ROLLBACK: See bottom of file
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stakeholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_user_project_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_price_view_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_boq_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_boq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_activity_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_activity_boq_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_daily_report_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_daily_report_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_progress_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_monthly_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES: users can read all profiles, update only their own
-- ============================================================================

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admin can insert/update any profile
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL USING (
    public.fn_user_has_role(auth.uid(), ARRAY['admin']::public.user_role[])
  );

-- ============================================================================
-- CLIENTS: authenticated read, role-gated write
-- ============================================================================

CREATE POLICY "clients_select" ON public.clients
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "clients_modify" ON public.clients
  FOR ALL USING (
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'commercial_manager', 'ceo', 'coo'
    ]::public.user_role[])
  );

-- ============================================================================
-- STAKEHOLDERS: authenticated read, role-gated write
-- ============================================================================

CREATE POLICY "stakeholders_select" ON public.stakeholders
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "stakeholders_modify" ON public.stakeholders
  FOR ALL USING (
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'commercial_manager', 'project_manager', 'ceo', 'coo'
    ]::public.user_role[])
  );

-- ============================================================================
-- PROJECTS: project-scoped read, role-gated write
-- ============================================================================

CREATE POLICY "projects_select" ON public.projects
  FOR SELECT USING (
    public.fn_user_can_access_project(auth.uid(), id)
  );

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT WITH CHECK (
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'commercial_manager', 'ceo'
    ]::public.user_role[])
  );

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE USING (
    public.fn_user_can_access_project(auth.uid(), id) AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'commercial_manager', 'project_manager', 'ceo', 'coo'
    ]::public.user_role[])
  );

-- ============================================================================
-- PROJECT USER ACCESS: admin/PM/commercial_manager manage assignments
-- ============================================================================

CREATE POLICY "access_select" ON public.pm_user_project_access
  FOR SELECT USING (
    auth.uid() = user_id OR
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'commercial_manager', 'ceo', 'coo', 'project_manager'
    ]::public.user_role[])
  );

CREATE POLICY "access_modify" ON public.pm_user_project_access
  FOR ALL USING (
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'commercial_manager'
    ]::public.user_role[])
  );

-- ============================================================================
-- PRICE VIEW GRANTS: planning_manager manages
-- ============================================================================

CREATE POLICY "price_grants_select" ON public.pm_price_view_grants
  FOR SELECT USING (
    auth.uid() = granted_to OR
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'planning_manager'
    ]::public.user_role[])
  );

CREATE POLICY "price_grants_modify" ON public.pm_price_view_grants
  FOR ALL USING (
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'planning_manager'
    ]::public.user_role[])
  );

-- ============================================================================
-- AUDIT LOGS: INSERT only, no UPDATE/DELETE
-- ============================================================================

CREATE POLICY "audit_insert" ON public.pm_audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "audit_select" ON public.pm_audit_logs
  FOR SELECT USING (
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'ceo', 'coo', 'commercial_manager'
    ]::public.user_role[])
  );

-- NO UPDATE OR DELETE POLICIES — audit log is sacred

-- ============================================================================
-- ZONES: project-scoped
-- ============================================================================

CREATE POLICY "zones_select" ON public.pm_zones
  FOR SELECT USING (
    public.fn_user_can_access_project(auth.uid(), project_id)
  );

CREATE POLICY "zones_modify" ON public.pm_zones
  FOR ALL USING (
    public.fn_user_can_access_project(auth.uid(), project_id) AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'planning_manager', 'planning_engineer', 'project_manager'
    ]::public.user_role[])
  );

-- ============================================================================
-- BOQ SECTIONS: project-scoped
-- ============================================================================

CREATE POLICY "boq_sections_select" ON public.pm_boq_sections
  FOR SELECT USING (
    public.fn_user_can_access_project(auth.uid(), project_id)
  );

CREATE POLICY "boq_sections_modify" ON public.pm_boq_sections
  FOR ALL USING (
    public.fn_user_can_access_project(auth.uid(), project_id) AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'commercial_manager', 'cost_control', 'estimator'
    ]::public.user_role[])
  );

-- ============================================================================
-- BOQ ITEMS: project-scoped (price columns protected via RPCs)
-- ============================================================================

CREATE POLICY "boq_items_select" ON public.pm_boq_items
  FOR SELECT USING (
    public.fn_user_can_access_project(auth.uid(), project_id)
  );

CREATE POLICY "boq_items_modify" ON public.pm_boq_items
  FOR ALL USING (
    public.fn_user_can_access_project(auth.uid(), project_id) AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'commercial_manager', 'cost_control', 'estimator'
    ]::public.user_role[])
  );

-- ============================================================================
-- ACTIVITY LIBRARY: read by all authenticated, write by planning roles
-- ============================================================================

CREATE POLICY "activity_library_select" ON public.pm_activity_library
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "activity_library_modify" ON public.pm_activity_library
  FOR ALL USING (
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'planning_manager'
    ]::public.user_role[])
  );

-- ============================================================================
-- PROJECT ACTIVITIES: project-scoped
-- ============================================================================

CREATE POLICY "project_activities_select" ON public.pm_project_activities
  FOR SELECT USING (
    public.fn_user_can_access_project(auth.uid(), project_id)
  );

CREATE POLICY "project_activities_modify" ON public.pm_project_activities
  FOR ALL USING (
    public.fn_user_can_access_project(auth.uid(), project_id) AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'planning_manager', 'planning_engineer'
    ]::public.user_role[])
  );

-- ============================================================================
-- ACTIVITY-BOQ LINKS: inherit from activity's project
-- ============================================================================

CREATE POLICY "activity_boq_links_select" ON public.pm_activity_boq_links
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pm_project_activities pa
      WHERE pa.id = activity_id
      AND public.fn_user_can_access_project(auth.uid(), pa.project_id)
    )
  );

CREATE POLICY "activity_boq_links_modify" ON public.pm_activity_boq_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pm_project_activities pa
      WHERE pa.id = activity_id
      AND public.fn_user_can_access_project(auth.uid(), pa.project_id)
    ) AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'planning_manager', 'planning_engineer'
    ]::public.user_role[])
  );

-- ============================================================================
-- DAILY REPORTS: project-scoped
-- ============================================================================

CREATE POLICY "daily_reports_select" ON public.pm_daily_reports
  FOR SELECT USING (
    public.fn_user_can_access_project(auth.uid(), project_id)
  );

CREATE POLICY "daily_reports_insert" ON public.pm_daily_reports
  FOR INSERT WITH CHECK (
    public.fn_user_can_access_project(auth.uid(), project_id) AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'site_engineer', 'planning_engineer', 'planning_manager',
      'project_manager'
    ]::public.user_role[])
  );

CREATE POLICY "daily_reports_update" ON public.pm_daily_reports
  FOR UPDATE USING (
    public.fn_user_can_access_project(auth.uid(), project_id) AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'site_engineer', 'planning_engineer', 'planning_manager',
      'project_manager'
    ]::public.user_role[])
  );

-- ============================================================================
-- DAILY REPORT LINES: inherit from report's project
-- ============================================================================

CREATE POLICY "daily_report_lines_select" ON public.pm_daily_report_lines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pm_daily_reports dr
      WHERE dr.id = report_id
      AND public.fn_user_can_access_project(auth.uid(), dr.project_id)
    )
  );

CREATE POLICY "daily_report_lines_modify" ON public.pm_daily_report_lines
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pm_daily_reports dr
      WHERE dr.id = report_id
      AND public.fn_user_can_access_project(auth.uid(), dr.project_id)
    ) AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'site_engineer', 'planning_engineer', 'planning_manager',
      'project_manager'
    ]::public.user_role[])
  );

-- ============================================================================
-- DAILY REPORT DOCUMENTS: inherit from report's project
-- ============================================================================

CREATE POLICY "daily_docs_select" ON public.pm_daily_report_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pm_daily_reports dr
      WHERE dr.id = report_id
      AND public.fn_user_can_access_project(auth.uid(), dr.project_id)
    )
  );

CREATE POLICY "daily_docs_modify" ON public.pm_daily_report_documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.pm_daily_reports dr
      WHERE dr.id = report_id
      AND public.fn_user_can_access_project(auth.uid(), dr.project_id)
    ) AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'site_engineer', 'planning_engineer', 'planning_manager',
      'project_manager'
    ]::public.user_role[])
  );

-- ============================================================================
-- PROGRESS ALLOCATIONS: planner-only write
-- ============================================================================

CREATE POLICY "allocations_select" ON public.pm_progress_allocations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.pm_project_activities pa
      WHERE pa.id = activity_id
      AND public.fn_user_can_access_project(auth.uid(), pa.project_id)
    )
  );

CREATE POLICY "allocations_modify" ON public.pm_progress_allocations
  FOR ALL USING (
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'planning_manager', 'planning_engineer'
    ]::public.user_role[])
  );

-- ============================================================================
-- WEEKLY REPORTS: project-scoped read, planner write
-- ============================================================================

CREATE POLICY "weekly_select" ON public.pm_weekly_reports
  FOR SELECT USING (
    public.fn_user_can_access_project(auth.uid(), project_id)
  );

CREATE POLICY "weekly_modify" ON public.pm_weekly_reports
  FOR ALL USING (
    public.fn_user_can_access_project(auth.uid(), project_id) AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'planning_manager'
    ]::public.user_role[])
  );

-- ============================================================================
-- MONTHLY REPORTS: project-scoped read, planner write
-- ============================================================================

CREATE POLICY "monthly_select" ON public.pm_monthly_reports
  FOR SELECT USING (
    public.fn_user_can_access_project(auth.uid(), project_id)
  );

CREATE POLICY "monthly_modify" ON public.pm_monthly_reports
  FOR ALL USING (
    public.fn_user_can_access_project(auth.uid(), project_id) AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'planning_manager'
    ]::public.user_role[])
  );

-- ============================================================================
-- SECURITY RPC: Get BOQ items with price gate
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_get_boq_items_for_project(
  p_project_id UUID
)
RETURNS TABLE (
  id UUID,
  section_id UUID,
  zone_id UUID,
  item_code TEXT,
  description_ar TEXT,
  description_en TEXT,
  unit TEXT,
  item_type public.boq_item_type,
  contract_qty NUMERIC,
  rate_egp NUMERIC,
  amount_egp NUMERIC,
  sort_order INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_can_see_prices BOOLEAN;
BEGIN
  -- Access check
  IF NOT public.fn_user_can_access_project(auth.uid(), p_project_id) THEN
    RAISE EXCEPTION 'Access denied to project %', p_project_id;
  END IF;

  -- Price visibility check
  v_can_see_prices := public.fn_user_can_see_prices(auth.uid(), p_project_id);

  RETURN QUERY
  SELECT
    bi.id,
    bi.section_id,
    bi.zone_id,
    bi.item_code,
    bi.description_ar,
    bi.description_en,
    bi.unit,
    bi.item_type,
    bi.contract_qty,
    CASE WHEN v_can_see_prices THEN bi.rate_egp ELSE NULL END,
    CASE WHEN v_can_see_prices THEN bi.amount_egp ELSE NULL END,
    bi.sort_order
  FROM public.pm_boq_items bi
  WHERE bi.project_id = p_project_id
    AND bi.is_active = TRUE
  ORDER BY bi.sort_order;
END;
$$;

COMMENT ON FUNCTION public.rpc_get_boq_items_for_project IS 'Price-gated BOQ item retrieval. site_engineer/planning_engineer (without grant) see NULL for rate/amount.';

-- ============================================================================
-- SECURITY RPC: Submit daily report (workflow transition)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_submit_daily_report(
  p_report_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_project_id UUID;
  v_current_status public.daily_report_status;
BEGIN
  SELECT project_id, status
  INTO v_project_id, v_current_status
  FROM public.pm_daily_reports
  WHERE id = p_report_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Daily report % not found', p_report_id;
  END IF;

  -- Access + role check
  IF NOT public.fn_user_can_access_project(auth.uid(), v_project_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF NOT public.fn_user_has_role(auth.uid(), ARRAY[
    'admin', 'site_engineer', 'planning_engineer', 'planning_manager', 'project_manager'
  ]::public.user_role[]) THEN
    RAISE EXCEPTION 'Insufficient role for submission';
  END IF;

  IF v_current_status != 'draft' THEN
    RAISE EXCEPTION 'Can only submit draft reports (current: %)', v_current_status;
  END IF;

  UPDATE public.pm_daily_reports
  SET status = 'submitted',
      submitted_by = auth.uid(),
      submitted_at = NOW()
  WHERE id = p_report_id;

  -- Audit
  INSERT INTO public.pm_audit_logs (table_name, record_id, action, new_data, changed_by)
  VALUES ('pm_daily_reports', p_report_id, 'STATUS_CHANGE',
    jsonb_build_object('status', 'submitted'), auth.uid());
END;
$$;

-- ============================================================================
-- SECURITY RPC: Approve daily report
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_approve_daily_report(
  p_report_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_project_id UUID;
  v_current_status public.daily_report_status;
BEGIN
  SELECT project_id, status
  INTO v_project_id, v_current_status
  FROM public.pm_daily_reports
  WHERE id = p_report_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Daily report % not found', p_report_id;
  END IF;

  IF NOT public.fn_user_can_access_project(auth.uid(), v_project_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- Only planning_manager/admin can approve
  IF NOT public.fn_user_has_role(auth.uid(), ARRAY[
    'admin', 'planning_manager'
  ]::public.user_role[]) THEN
    RAISE EXCEPTION 'Only planning_manager or admin can approve reports';
  END IF;

  IF v_current_status NOT IN ('submitted', 'under_review') THEN
    RAISE EXCEPTION 'Can only approve submitted/under_review reports (current: %)', v_current_status;
  END IF;

  UPDATE public.pm_daily_reports
  SET status = 'approved',
      approved_by = auth.uid(),
      approved_at = NOW()
  WHERE id = p_report_id;

  INSERT INTO public.pm_audit_logs (table_name, record_id, action, new_data, changed_by)
  VALUES ('pm_daily_reports', p_report_id, 'STATUS_CHANGE',
    jsonb_build_object('status', 'approved'), auth.uid());
END;
$$;

-- ============================================================================
-- SECURITY RPC: Reject daily report
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_reject_daily_report(
  p_report_id UUID,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_project_id UUID;
  v_current_status public.daily_report_status;
BEGIN
  IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
    RAISE EXCEPTION 'Rejection reason is required';
  END IF;

  SELECT project_id, status
  INTO v_project_id, v_current_status
  FROM public.pm_daily_reports
  WHERE id = p_report_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Daily report % not found', p_report_id;
  END IF;

  IF NOT public.fn_user_can_access_project(auth.uid(), v_project_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF NOT public.fn_user_has_role(auth.uid(), ARRAY[
    'admin', 'planning_manager', 'project_manager'
  ]::public.user_role[]) THEN
    RAISE EXCEPTION 'Insufficient role for rejection';
  END IF;

  IF v_current_status NOT IN ('submitted', 'under_review') THEN
    RAISE EXCEPTION 'Can only reject submitted/under_review reports (current: %)', v_current_status;
  END IF;

  UPDATE public.pm_daily_reports
  SET status = 'rejected',
      rejected_by = auth.uid(),
      rejected_at = NOW(),
      rejection_reason = p_reason
  WHERE id = p_report_id;

  INSERT INTO public.pm_audit_logs (table_name, record_id, action, new_data, changed_by)
  VALUES ('pm_daily_reports', p_report_id, 'STATUS_CHANGE',
    jsonb_build_object('status', 'rejected', 'reason', p_reason), auth.uid());
END;
$$;

-- ============================================================================
-- SECURITY RPC: Cancel project (reversible by admin/commercial_manager)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_cancel_project(
  p_project_id UUID,
  p_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_reason IS NULL OR TRIM(p_reason) = '' THEN
    RAISE EXCEPTION 'Cancellation reason is required';
  END IF;

  IF NOT public.fn_user_has_role(auth.uid(), ARRAY[
    'admin', 'commercial_manager'
  ]::public.user_role[]) THEN
    RAISE EXCEPTION 'Only admin or commercial_manager can cancel projects';
  END IF;

  UPDATE public.projects
  SET status = 'cancelled',
      cancellation_reason = p_reason,
      cancelled_by = auth.uid()
  WHERE id = p_project_id;
END;
$$;

-- ============================================================================
-- SECURITY RPC: Reverse cancellation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.rpc_reverse_cancellation(
  p_project_id UUID,
  p_new_status public.project_status DEFAULT 'working'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_status public.project_status;
BEGIN
  IF NOT public.fn_user_has_role(auth.uid(), ARRAY[
    'admin', 'commercial_manager'
  ]::public.user_role[]) THEN
    RAISE EXCEPTION 'Only admin or commercial_manager can reverse cancellation';
  END IF;

  SELECT status INTO v_current_status
  FROM public.projects
  WHERE id = p_project_id;

  IF v_current_status != 'cancelled' THEN
    RAISE EXCEPTION 'Project is not cancelled (status: %)', v_current_status;
  END IF;

  UPDATE public.projects
  SET status = p_new_status,
      cancellation_reason = NULL,
      cancelled_at = NULL,
      cancelled_by = NULL
  WHERE id = p_project_id;

  -- Full audit
  INSERT INTO public.pm_audit_logs (table_name, record_id, action, old_data, new_data, changed_by, context)
  VALUES ('projects', p_project_id, 'STATUS_CHANGE',
    jsonb_build_object('status', 'cancelled'),
    jsonb_build_object('status', p_new_status),
    auth.uid(),
    'cancellation_reversal');
END;
$$;

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- DROP FUNCTION IF EXISTS public.rpc_reverse_cancellation;
-- DROP FUNCTION IF EXISTS public.rpc_cancel_project;
-- DROP FUNCTION IF EXISTS public.rpc_reject_daily_report;
-- DROP FUNCTION IF EXISTS public.rpc_approve_daily_report;
-- DROP FUNCTION IF EXISTS public.rpc_submit_daily_report;
-- DROP FUNCTION IF EXISTS public.rpc_get_boq_items_for_project;
-- (then drop all policies — see ALTER TABLE ... DISABLE ROW LEVEL SECURITY for each table)
