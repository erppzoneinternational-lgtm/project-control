-- ============================================================================
-- Migration 056: Fix RLS Policies on pm_project_activities & pm_schedule_versions
-- Pzone International Project Control
-- Purpose:
--   Allow all authorized authenticated roles (commercial_manager, project_manager,
--   planning_manager, planning_engineer, admin, ceo, coo) to insert, update,
--   and read project activities and schedule versions without RLS rejection.
-- ============================================================================

-- 1. Enable RLS
ALTER TABLE public.pm_project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_schedule_versions ENABLE ROW LEVEL SECURITY;

-- 2. Drop restrictive / outdated policies on pm_project_activities
DROP POLICY IF EXISTS "project_activities_select" ON public.pm_project_activities;
DROP POLICY IF EXISTS "project_activities_modify" ON public.pm_project_activities;
DROP POLICY IF EXISTS "auth_select_pm_project_activities" ON public.pm_project_activities;
DROP POLICY IF EXISTS "auth_insert_pm_project_activities" ON public.pm_project_activities;
DROP POLICY IF EXISTS "auth_update_pm_project_activities" ON public.pm_project_activities;
DROP POLICY IF EXISTS "service_role_pm_project_activities" ON public.pm_project_activities;

-- 3. Create permissive, comprehensive policies for authenticated users
-- Select policy: any authenticated user with project access can view activities
CREATE POLICY "project_activities_select" ON public.pm_project_activities
  FOR SELECT TO authenticated
  USING (public.fn_user_can_access_project(auth.uid(), project_id));

-- Insert policy: any authenticated user with project access can insert activities
CREATE POLICY "project_activities_insert" ON public.pm_project_activities
  FOR INSERT TO authenticated
  WITH CHECK (public.fn_user_can_access_project(auth.uid(), project_id));

-- Update policy: any authenticated user with project access can update activities
CREATE POLICY "project_activities_update" ON public.pm_project_activities
  FOR UPDATE TO authenticated
  USING (public.fn_user_can_access_project(auth.uid(), project_id))
  WITH CHECK (public.fn_user_can_access_project(auth.uid(), project_id));

-- Delete policy: users with project access can delete activities
CREATE POLICY "project_activities_delete" ON public.pm_project_activities
  FOR DELETE TO authenticated
  USING (public.fn_user_can_access_project(auth.uid(), project_id));

-- Service role bypass: full access
CREATE POLICY "service_role_pm_project_activities" ON public.pm_project_activities
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Schedule Versions policies
DROP POLICY IF EXISTS "schedule_versions_select" ON public.pm_schedule_versions;
DROP POLICY IF EXISTS "schedule_versions_modify" ON public.pm_schedule_versions;
DROP POLICY IF EXISTS "auth_select_pm_schedule_versions" ON public.pm_schedule_versions;
DROP POLICY IF EXISTS "auth_insert_pm_schedule_versions" ON public.pm_schedule_versions;
DROP POLICY IF EXISTS "auth_update_pm_schedule_versions" ON public.pm_schedule_versions;
DROP POLICY IF EXISTS "service_role_pm_schedule_versions" ON public.pm_schedule_versions;

CREATE POLICY "schedule_versions_select" ON public.pm_schedule_versions
  FOR SELECT TO authenticated
  USING (public.fn_user_can_access_project(auth.uid(), project_id));

CREATE POLICY "schedule_versions_insert" ON public.pm_schedule_versions
  FOR INSERT TO authenticated
  WITH CHECK (public.fn_user_can_access_project(auth.uid(), project_id));

CREATE POLICY "schedule_versions_update" ON public.pm_schedule_versions
  FOR UPDATE TO authenticated
  USING (public.fn_user_can_access_project(auth.uid(), project_id))
  WITH CHECK (public.fn_user_can_access_project(auth.uid(), project_id));

CREATE POLICY "service_role_pm_schedule_versions" ON public.pm_schedule_versions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
