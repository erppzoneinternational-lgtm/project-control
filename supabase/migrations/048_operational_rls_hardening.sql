-- ============================================================
-- 048_operational_rls_hardening.sql
-- Phase P2-M1: Operational RLS Hardening for Daily Progress Tables
-- Drops blanket open policies and enforces strict project-membership access.
-- Tables:
--   - public.pm_daily_progress
--   - public.pm_daily_progress_lines
--   - public.pm_daily_obstructions
--   - public.pm_daily_progress_photos
-- ============================================================

BEGIN;

-- ── 1. pm_daily_progress ──
ALTER TABLE public.pm_daily_progress ENABLE ROW LEVEL SECURITY;

-- Drop legacy/blanket policies
DROP POLICY IF EXISTS "daily_progress_authenticated_all" ON public.pm_daily_progress;
DROP POLICY IF EXISTS "auth_delete_pm_daily_progress" ON public.pm_daily_progress;
DROP POLICY IF EXISTS "daily_progress_select" ON public.pm_daily_progress;
DROP POLICY IF EXISTS "daily_progress_insert" ON public.pm_daily_progress;
DROP POLICY IF EXISTS "daily_progress_update" ON public.pm_daily_progress;
DROP POLICY IF EXISTS "daily_progress_delete" ON public.pm_daily_progress;
DROP POLICY IF EXISTS "service_role_pm_daily_progress" ON public.pm_daily_progress;

-- Service role full access
CREATE POLICY "service_role_pm_daily_progress" ON public.pm_daily_progress
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated SELECT: project members or management roles
CREATE POLICY "daily_progress_select_scoped" ON public.pm_daily_progress
  FOR SELECT TO authenticated
  USING (
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'ceo', 'coo', 'chairman', 'commercial_manager',
      'planning_manager', 'planning_engineer', 'project_manager'
    ]::public.user_role[])
    OR public.fn_user_can_access_project(project_id)
  );

-- Authenticated INSERT: project members or engineers
CREATE POLICY "daily_progress_insert_scoped" ON public.pm_daily_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'project_manager', 'planning_engineer', 'site_engineer'
    ]::public.user_role[])
    OR public.fn_user_can_access_project(project_id)
  );

-- Authenticated UPDATE:
-- Planners & PMs can update any report (e.g. approve/reject/review).
-- Site Engineers can only update reports in 'draft', 'rejected', or 'resubmitted' states.
CREATE POLICY "daily_progress_update_workflow" ON public.pm_daily_progress
  FOR UPDATE TO authenticated
  USING (
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'project_manager', 'planning_manager', 'planning_engineer'
    ]::public.user_role[])
    OR (
      public.fn_user_can_access_project(project_id)
      AND status IN ('draft', 'rejected', 'resubmitted')
    )
  )
  WITH CHECK (
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'project_manager', 'planning_manager', 'planning_engineer'
    ]::public.user_role[])
    OR (
      public.fn_user_can_access_project(project_id)
      AND status IN ('draft', 'submitted', 'resubmitted')
    )
  );

-- Authenticated DELETE: only drafts can be deleted by admin or submitter
CREATE POLICY "daily_progress_delete_scoped" ON public.pm_daily_progress
  FOR DELETE TO authenticated
  USING (
    (
      public.fn_user_has_role(auth.uid(), ARRAY['admin', 'project_manager']::public.user_role[])
      OR auth.uid() = entered_by
    )
    AND status = 'draft'
  );


-- ── 2. pm_daily_progress_lines ──
ALTER TABLE public.pm_daily_progress_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_progress_lines_authenticated_all" ON public.pm_daily_progress_lines;
DROP POLICY IF EXISTS "auth_delete_pm_daily_progress_lines" ON public.pm_daily_progress_lines;
DROP POLICY IF EXISTS "service_role_pm_daily_progress_lines" ON public.pm_daily_progress_lines;
DROP POLICY IF EXISTS "daily_lines_select_scoped" ON public.pm_daily_progress_lines;
DROP POLICY IF EXISTS "daily_lines_insert_scoped" ON public.pm_daily_progress_lines;
DROP POLICY IF EXISTS "daily_lines_update_scoped" ON public.pm_daily_progress_lines;
DROP POLICY IF EXISTS "daily_lines_delete_scoped" ON public.pm_daily_progress_lines;

-- Service role
CREATE POLICY "service_role_pm_daily_progress_lines" ON public.pm_daily_progress_lines
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Scoped SELECT
CREATE POLICY "daily_lines_select_scoped" ON public.pm_daily_progress_lines
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pm_daily_progress dp
      WHERE dp.id = pm_daily_progress_lines.daily_progress_id
        AND (
          public.fn_user_has_role(auth.uid(), ARRAY[
            'admin', 'ceo', 'coo', 'chairman', 'commercial_manager',
            'planning_manager', 'planning_engineer', 'project_manager'
          ]::public.user_role[])
          OR public.fn_user_can_access_project(dp.project_id)
        )
    )
  );

-- Scoped INSERT
CREATE POLICY "daily_lines_insert_scoped" ON public.pm_daily_progress_lines
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pm_daily_progress dp
      WHERE dp.id = pm_daily_progress_lines.daily_progress_id
        AND (
          public.fn_user_has_role(auth.uid(), ARRAY[
            'admin', 'project_manager', 'planning_engineer', 'site_engineer'
          ]::public.user_role[])
          OR public.fn_user_can_access_project(dp.project_id)
        )
    )
  );

-- Scoped UPDATE: line edits permitted if report is not locked/approved
CREATE POLICY "daily_lines_update_scoped" ON public.pm_daily_progress_lines
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pm_daily_progress dp
      WHERE dp.id = pm_daily_progress_lines.daily_progress_id
        AND (
          public.fn_user_has_role(auth.uid(), ARRAY[
            'admin', 'project_manager', 'planning_manager', 'planning_engineer'
          ]::public.user_role[])
          OR (
            public.fn_user_can_access_project(dp.project_id)
            AND dp.status IN ('draft', 'rejected', 'resubmitted')
          )
        )
    )
  );

-- Scoped DELETE: only while report is in draft/rejected
CREATE POLICY "daily_lines_delete_scoped" ON public.pm_daily_progress_lines
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pm_daily_progress dp
      WHERE dp.id = pm_daily_progress_lines.daily_progress_id
        AND (
          public.fn_user_has_role(auth.uid(), ARRAY['admin', 'project_manager']::public.user_role[])
          OR (
            public.fn_user_can_access_project(dp.project_id)
            AND dp.status IN ('draft', 'rejected')
          )
        )
    )
  );


-- ── 3. pm_daily_obstructions ──
ALTER TABLE public.pm_daily_obstructions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_obstructions_authenticated_all" ON public.pm_daily_obstructions;
DROP POLICY IF EXISTS "service_role_pm_daily_obstructions" ON public.pm_daily_obstructions;
DROP POLICY IF EXISTS "daily_obstructions_select_scoped" ON public.pm_daily_obstructions;
DROP POLICY IF EXISTS "daily_obstructions_insert_scoped" ON public.pm_daily_obstructions;
DROP POLICY IF EXISTS "daily_obstructions_update_scoped" ON public.pm_daily_obstructions;

CREATE POLICY "service_role_pm_daily_obstructions" ON public.pm_daily_obstructions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "daily_obstructions_select_scoped" ON public.pm_daily_obstructions
  FOR SELECT TO authenticated
  USING (
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'ceo', 'coo', 'chairman', 'commercial_manager',
      'planning_manager', 'planning_engineer', 'project_manager'
    ]::public.user_role[])
    OR public.fn_user_can_access_project(project_id)
  );

CREATE POLICY "daily_obstructions_insert_scoped" ON public.pm_daily_obstructions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'project_manager', 'planning_engineer', 'site_engineer', 'qc_inspector'
    ]::public.user_role[])
    OR public.fn_user_can_access_project(project_id)
  );

CREATE POLICY "daily_obstructions_update_scoped" ON public.pm_daily_obstructions
  FOR UPDATE TO authenticated
  USING (
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'project_manager', 'planning_engineer', 'site_engineer'
    ]::public.user_role[])
    OR public.fn_user_can_access_project(project_id)
  );


-- ── 4. pm_daily_progress_photos ──
ALTER TABLE public.pm_daily_progress_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_progress_photos_authenticated_all" ON public.pm_daily_progress_photos;
DROP POLICY IF EXISTS "service_role_pm_daily_progress_photos" ON public.pm_daily_progress_photos;
DROP POLICY IF EXISTS "daily_photos_select_scoped" ON public.pm_daily_progress_photos;
DROP POLICY IF EXISTS "daily_photos_insert_scoped" ON public.pm_daily_progress_photos;

CREATE POLICY "service_role_pm_daily_progress_photos" ON public.pm_daily_progress_photos
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "daily_photos_select_scoped" ON public.pm_daily_progress_photos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pm_daily_progress dp
      WHERE dp.id = pm_daily_progress_photos.daily_progress_id
        AND (
          public.fn_user_has_role(auth.uid(), ARRAY[
            'admin', 'ceo', 'coo', 'chairman', 'commercial_manager',
            'planning_manager', 'planning_engineer', 'project_manager'
          ]::public.user_role[])
          OR public.fn_user_can_access_project(dp.project_id)
        )
    )
  );

CREATE POLICY "daily_photos_insert_scoped" ON public.pm_daily_progress_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.pm_daily_progress dp
      WHERE dp.id = pm_daily_progress_photos.daily_progress_id
        AND (
          public.fn_user_has_role(auth.uid(), ARRAY[
            'admin', 'project_manager', 'planning_engineer', 'site_engineer'
          ]::public.user_role[])
          OR public.fn_user_can_access_project(dp.project_id)
        )
    )
  );

COMMIT;
