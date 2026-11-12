-- =============================================================================
-- Migration: 20261111110000_carbon_rls_rpc_storage_hardening.sql
-- Project:   P.Zone ERP Portal (tgqpcviqmgtdddiqvqdw, eu-west-3)
-- Scope:     Carbon Security Remediation DB-01 through DB-11
-- Safety:    100% DDL / RLS / Trigger / RPC / Privilege hardening ONLY.
--            ZERO business data mutations (no INSERT/UPDATE/DELETE on data rows).
-- =============================================================================

BEGIN;

-- =============================================================================
-- SECTION 0: FOUNDATIONAL SECURITY HELPER FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_is_system_or_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(auth.role(), '') = 'service_role'
    OR COALESCE(current_setting('role', true), '') = 'service_role'
    OR (
      auth.uid() IS NULL
      AND COALESCE(auth.role(), '') NOT IN ('anon', 'authenticated')
      AND COALESCE(current_setting('role', true), '') NOT IN ('anon', 'authenticated')
      AND session_user IN ('postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role')
    );
$$;

CREATE OR REPLACE FUNCTION public.fn_user_is_viewer_only(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_roles text[];
  v_is_active boolean := false;
  v_status text := 'pending_activation';
BEGIN
  IF p_user_id IS NULL THEN
    RETURN NOT public.fn_is_system_or_service_role();
  END IF;

  SELECT
    COALESCE(p.roles::text[], ARRAY[]::text[]),
    COALESCE(p.is_active, false),
    COALESCE(p.status, 'active')
  INTO v_roles, v_is_active, v_status
  FROM public.profiles p
  WHERE p.id = p_user_id;

  IF NOT FOUND OR NOT v_is_active OR v_status <> 'active' THEN
    RETURN TRUE;
  END IF;

  IF COALESCE(array_length(v_roles, 1), 0) = 0 THEN
    RETURN TRUE;
  END IF;

  RETURN ('viewer' = ANY(v_roles))
     AND NOT (
       v_roles && ARRAY[
         'admin', 'ceo', 'coo', 'coo_assistant', 'chairman', 'board_member',
         'commercial_manager', 'project_manager', 'planning_manager', 'planning_engineer',
         'site_engineer', 'cost_control', 'estimator', 'contract_admin',
         'technical_office', 'finance', 'ipc_clerk', 'procurement',
         'inventory', 'to_manager', 'qc_inspector', 'to_engineer'
       ]::text[]
     );
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_user_has_any_role_text(p_user_id uuid, p_required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN public.fn_is_system_or_service_role();
  END IF;

  IF public.fn_user_is_viewer_only(p_user_id) THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_user_id
      AND COALESCE(p.is_active, false) = true
      AND COALESCE(p.status, 'active') = 'active'
      AND COALESCE(p.roles::text[], ARRAY[]::text[]) && p_required_roles
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_user_can_see_prices(p_user_id uuid, p_project_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_roles text[];
  v_price_flag boolean := false;
  v_portal_scope text := 'internal';
  v_is_active boolean := false;
  v_status text := 'pending_activation';
BEGIN
  IF p_user_id IS NULL THEN
    RETURN public.fn_is_system_or_service_role();
  END IF;

  SELECT
    COALESCE(p.roles::text[], ARRAY[]::text[]),
    COALESCE(p.price_access_granted, false),
    COALESCE(p.portal_scope, 'internal'),
    COALESCE(p.is_active, false),
    COALESCE(p.status, 'active')
  INTO v_roles, v_price_flag, v_portal_scope, v_is_active, v_status
  FROM public.profiles p
  WHERE p.id = p_user_id;

  IF NOT FOUND OR NOT v_is_active OR v_status <> 'active' OR v_portal_scope <> 'internal' THEN
    RETURN FALSE;
  END IF;

  IF v_roles && ARRAY['site_engineer','qc_inspector','inventory']::text[]
     AND NOT (v_roles && ARRAY[
       'admin','commercial_manager','cost_control','estimator',
       'project_manager','ceo','coo','chairman','planning_manager',
       'finance','contract_admin'
     ]::text[])
  THEN
    RETURN FALSE;
  END IF;

  IF v_roles && ARRAY[
    'admin','commercial_manager','cost_control','estimator',
    'project_manager','ceo','coo','chairman','planning_manager',
    'finance','contract_admin','ipc_clerk'
  ]::text[] THEN
    RETURN TRUE;
  END IF;

  IF v_price_flag THEN
    RETURN TRUE;
  END IF;

  IF v_roles && ARRAY['planning_engineer']::text[] THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.pm_price_view_grants
      WHERE granted_to = p_user_id
        AND (p_project_id IS NULL OR project_id = p_project_id)
        AND revoked_at IS NULL
    );
  END IF;

  RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_enforce_viewer_read_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.fn_is_system_or_service_role()
     AND public.fn_user_is_viewer_only((SELECT auth.uid()))
  THEN
    RAISE EXCEPTION 'READ_ONLY_VIEWER: حساب العرض فقط (Viewer) غير مصرح له بالإضافة أو التعديل أو الحذف';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================================================
-- SECTION 1 (DB-01): DEFENSE-IN-DEPTH VIEWER READ-ONLY TRIGGER ON ALL BASE TABLES
-- =============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT table_schema, table_name
    FROM information_schema.tables
    WHERE table_schema IN ('public', 'pm')
      AND table_type = 'BASE TABLE'
    ORDER BY table_schema, table_name
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS zzz_trg_viewer_readonly ON %I.%I;', r.table_schema, r.table_name);
    EXECUTE format(
      'CREATE TRIGGER zzz_trg_viewer_readonly BEFORE INSERT OR UPDATE OR DELETE ON %I.%I FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_viewer_read_only();',
      r.table_schema, r.table_name
    );
  END LOOP;
END;
$$;

DROP POLICY IF EXISTS service_role_pm_user_ai_keys ON public.pm_user_ai_keys;
CREATE POLICY service_role_pm_user_ai_keys ON public.pm_user_ai_keys FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_user_api_keys ON public.user_api_keys;
CREATE POLICY service_role_user_api_keys ON public.user_api_keys FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS service_role_legacy_users ON public.users;
CREATE POLICY service_role_legacy_users ON public.users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- SECTION 2 (DB-01 & DB-02): REPLACE PERMISSIVE USING(true)/CHECK(true) POLICIES
-- AND DROP LEGACY OVERRIDE POLICIES
-- =============================================================================

-- pm.project_client_contacts
DROP POLICY IF EXISTS "Allow authenticated access to project_client_contacts" ON pm.project_client_contacts;
DROP POLICY IF EXISTS "pcc_select" ON pm.project_client_contacts;
DROP POLICY IF EXISTS "pcc_insert" ON pm.project_client_contacts;
DROP POLICY IF EXISTS "pcc_update" ON pm.project_client_contacts;
DROP POLICY IF EXISTS "pcc_delete" ON pm.project_client_contacts;
CREATE POLICY "pcc_select" ON pm.project_client_contacts FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "pcc_insert" ON pm.project_client_contacts FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'project_manager', 'planning_manager', 'contract_admin']::text[]));
CREATE POLICY "pcc_update" ON pm.project_client_contacts FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'project_manager', 'planning_manager', 'contract_admin']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'project_manager', 'planning_manager', 'contract_admin']::text[]));
CREATE POLICY "pcc_delete" ON pm.project_client_contacts FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'project_manager']::text[]));

-- pm.project_site_resources
DROP POLICY IF EXISTS "Allow authenticated access to project_site_resources" ON pm.project_site_resources;
DROP POLICY IF EXISTS "psr_select" ON pm.project_site_resources;
DROP POLICY IF EXISTS "psr_insert" ON pm.project_site_resources;
DROP POLICY IF EXISTS "psr_update" ON pm.project_site_resources;
DROP POLICY IF EXISTS "psr_delete" ON pm.project_site_resources;
CREATE POLICY "psr_select" ON pm.project_site_resources FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "psr_insert" ON pm.project_site_resources FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[]));
CREATE POLICY "psr_update" ON pm.project_site_resources FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[]));
CREATE POLICY "psr_delete" ON pm.project_site_resources FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager']::text[]));

-- pm.project_subcontractors
DROP POLICY IF EXISTS "Allow authenticated access to project_subcontractors" ON pm.project_subcontractors;
DROP POLICY IF EXISTS "psub_select" ON pm.project_subcontractors;
DROP POLICY IF EXISTS "psub_insert" ON pm.project_subcontractors;
DROP POLICY IF EXISTS "psub_update" ON pm.project_subcontractors;
DROP POLICY IF EXISTS "psub_delete" ON pm.project_subcontractors;
CREATE POLICY "psub_select" ON pm.project_subcontractors FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "psub_insert" ON pm.project_subcontractors FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'contract_admin', 'cost_control', 'project_manager', 'planning_manager', 'procurement']::text[]));
CREATE POLICY "psub_update" ON pm.project_subcontractors FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'contract_admin', 'cost_control', 'project_manager', 'planning_manager', 'procurement']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'contract_admin', 'cost_control', 'project_manager', 'planning_manager', 'procurement']::text[]));
CREATE POLICY "psub_delete" ON pm.project_subcontractors FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'project_manager']::text[]));

-- public.cities (reference/global)
DROP POLICY IF EXISTS "cities_all" ON public.cities;
DROP POLICY IF EXISTS "cities_select" ON public.cities;
DROP POLICY IF EXISTS "cities_insert" ON public.cities;
DROP POLICY IF EXISTS "cities_update" ON public.cities;
DROP POLICY IF EXISTS "cities_delete" ON public.cities;
DROP POLICY IF EXISTS "service_role_cities" ON public.cities;
CREATE POLICY "service_role_cities" ON public.cities FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "cities_select" ON public.cities FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY "cities_insert" ON public.cities FOR INSERT TO authenticated WITH CHECK (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager']::text[]));
CREATE POLICY "cities_update" ON public.cities FOR UPDATE TO authenticated USING (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager']::text[])) WITH CHECK (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager']::text[]));
CREATE POLICY "cities_delete" ON public.cities FOR DELETE TO authenticated USING (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo']::text[]));

-- public.governorates (reference/global)
DROP POLICY IF EXISTS "gov_all" ON public.governorates;
DROP POLICY IF EXISTS "gov_select" ON public.governorates;
DROP POLICY IF EXISTS "gov_insert" ON public.governorates;
DROP POLICY IF EXISTS "gov_update" ON public.governorates;
DROP POLICY IF EXISTS "gov_delete" ON public.governorates;
DROP POLICY IF EXISTS "service_role_governorates" ON public.governorates;
CREATE POLICY "service_role_governorates" ON public.governorates FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "gov_select" ON public.governorates FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY "gov_insert" ON public.governorates FOR INSERT TO authenticated WITH CHECK (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager']::text[]));
CREATE POLICY "gov_update" ON public.governorates FOR UPDATE TO authenticated USING (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager']::text[])) WITH CHECK (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager']::text[]));
CREATE POLICY "gov_delete" ON public.governorates FOR DELETE TO authenticated USING (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo']::text[]));

-- public.organizations (reference/global)
DROP POLICY IF EXISTS "Allow authenticated access to organizations" ON public.organizations;
DROP POLICY IF EXISTS "organizations_select" ON public.organizations;
DROP POLICY IF EXISTS "organizations_insert" ON public.organizations;
DROP POLICY IF EXISTS "organizations_update" ON public.organizations;
DROP POLICY IF EXISTS "organizations_delete" ON public.organizations;
CREATE POLICY "organizations_select" ON public.organizations FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY "organizations_insert" ON public.organizations FOR INSERT TO authenticated WITH CHECK (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager']::text[]));
CREATE POLICY "organizations_update" ON public.organizations FOR UPDATE TO authenticated USING (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager']::text[])) WITH CHECK (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager']::text[]));
CREATE POLICY "organizations_delete" ON public.organizations FOR DELETE TO authenticated USING (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo']::text[]));

-- public.vendors (reference/global)
DROP POLICY IF EXISTS "Allow authenticated access to vendors" ON public.vendors;
DROP POLICY IF EXISTS "vendors_select" ON public.vendors;
DROP POLICY IF EXISTS "vendors_insert" ON public.vendors;
DROP POLICY IF EXISTS "vendors_update" ON public.vendors;
DROP POLICY IF EXISTS "vendors_delete" ON public.vendors;
CREATE POLICY "vendors_select" ON public.vendors FOR SELECT TO authenticated USING (public.fn_is_active_verified_user((SELECT auth.uid())));
CREATE POLICY "vendors_insert" ON public.vendors FOR INSERT TO authenticated WITH CHECK (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'procurement', 'cost_control', 'contract_admin', 'project_manager']::text[]));
CREATE POLICY "vendors_update" ON public.vendors FOR UPDATE TO authenticated USING (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'procurement', 'cost_control', 'contract_admin', 'project_manager']::text[])) WITH CHECK (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'procurement', 'cost_control', 'contract_admin', 'project_manager']::text[]));
CREATE POLICY "vendors_delete" ON public.vendors FOR DELETE TO authenticated USING (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'procurement']::text[]));

-- public.pm_cost_codes (reference/global)
DROP POLICY IF EXISTS "cost_codes_all" ON public.pm_cost_codes;
DROP POLICY IF EXISTS "cost_codes_insert" ON public.pm_cost_codes;
DROP POLICY IF EXISTS "cost_codes_update" ON public.pm_cost_codes;
DROP POLICY IF EXISTS "cost_codes_delete" ON public.pm_cost_codes;
DROP POLICY IF EXISTS "cost_codes_read" ON public.pm_cost_codes;
DROP POLICY IF EXISTS "cost_codes_write" ON public.pm_cost_codes;
DROP POLICY IF EXISTS "cost_codes_select" ON public.pm_cost_codes;
CREATE POLICY "cost_codes_select" ON public.pm_cost_codes FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY "cost_codes_insert" ON public.pm_cost_codes FOR INSERT TO authenticated WITH CHECK (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'estimator', 'cost_control']::text[]));
CREATE POLICY "cost_codes_update" ON public.pm_cost_codes FOR UPDATE TO authenticated USING (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'estimator', 'cost_control']::text[])) WITH CHECK (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'estimator', 'cost_control']::text[]));
CREATE POLICY "cost_codes_delete" ON public.pm_cost_codes FOR DELETE TO authenticated USING (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'cost_control']::text[]) AND (is_system = false));

-- public.pm_activity_calendar_exceptions
DROP POLICY IF EXISTS "auth_all_pm_activity_calendar_exceptions" ON public.pm_activity_calendar_exceptions;
DROP POLICY IF EXISTS "ace_select" ON public.pm_activity_calendar_exceptions;
DROP POLICY IF EXISTS "ace_insert" ON public.pm_activity_calendar_exceptions;
DROP POLICY IF EXISTS "ace_update" ON public.pm_activity_calendar_exceptions;
DROP POLICY IF EXISTS "ace_delete" ON public.pm_activity_calendar_exceptions;
CREATE POLICY "ace_select" ON public.pm_activity_calendar_exceptions FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "ace_insert" ON public.pm_activity_calendar_exceptions FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager']::text[]));
CREATE POLICY "ace_update" ON public.pm_activity_calendar_exceptions FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager']::text[]));
CREATE POLICY "ace_delete" ON public.pm_activity_calendar_exceptions FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager']::text[]));

-- public.pm_activity_dependencies (via public.pm_project_activities)
DROP POLICY IF EXISTS "auth_all_pm_activity_dependencies" ON public.pm_activity_dependencies;
DROP POLICY IF EXISTS "adep_select" ON public.pm_activity_dependencies;
DROP POLICY IF EXISTS "adep_insert" ON public.pm_activity_dependencies;
DROP POLICY IF EXISTS "adep_update" ON public.pm_activity_dependencies;
DROP POLICY IF EXISTS "adep_delete" ON public.pm_activity_dependencies;
CREATE POLICY "adep_select" ON public.pm_activity_dependencies FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_project_activities p WHERE p.id = pm_activity_dependencies.predecessor_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)));
CREATE POLICY "adep_insert" ON public.pm_activity_dependencies FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.pm_project_activities p WHERE p.id = pm_activity_dependencies.predecessor_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager']::text[]));
CREATE POLICY "adep_update" ON public.pm_activity_dependencies FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_project_activities p WHERE p.id = pm_activity_dependencies.predecessor_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager']::text[])) WITH CHECK (EXISTS (SELECT 1 FROM public.pm_project_activities p WHERE p.id = pm_activity_dependencies.predecessor_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager']::text[]));
CREATE POLICY "adep_delete" ON public.pm_activity_dependencies FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_project_activities p WHERE p.id = pm_activity_dependencies.predecessor_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager']::text[]));

-- public.pm_approval_delegations
DROP POLICY IF EXISTS "auth_all_pm_approval_delegations" ON public.pm_approval_delegations;
DROP POLICY IF EXISTS "adel_select" ON public.pm_approval_delegations;
DROP POLICY IF EXISTS "adel_insert" ON public.pm_approval_delegations;
DROP POLICY IF EXISTS "adel_update" ON public.pm_approval_delegations;
DROP POLICY IF EXISTS "adel_delete" ON public.pm_approval_delegations;
CREATE POLICY "adel_select" ON public.pm_approval_delegations FOR SELECT TO authenticated
  USING (
    delegator_id = (SELECT auth.uid())
    OR delegate_user_id = (SELECT auth.uid())
    OR (project_id IS NOT NULL AND public.fn_user_can_access_project((SELECT auth.uid()), project_id))
    OR (project_id IS NULL AND public.fn_is_active_verified_user((SELECT auth.uid())))
  );
CREATE POLICY "adel_insert" ON public.pm_approval_delegations FOR INSERT TO authenticated
  WITH CHECK (
    (project_id IS NULL OR public.fn_user_can_access_project((SELECT auth.uid()), project_id))
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','commercial_manager','planning_manager','project_manager']::text[])
  );
CREATE POLICY "adel_update" ON public.pm_approval_delegations FOR UPDATE TO authenticated
  USING (
    (project_id IS NULL OR public.fn_user_can_access_project((SELECT auth.uid()), project_id))
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','commercial_manager','planning_manager','project_manager']::text[])
  )
  WITH CHECK (
    (project_id IS NULL OR public.fn_user_can_access_project((SELECT auth.uid()), project_id))
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','commercial_manager','planning_manager','project_manager']::text[])
  );
CREATE POLICY "adel_delete" ON public.pm_approval_delegations FOR DELETE TO authenticated
  USING (
    (project_id IS NULL OR public.fn_user_can_access_project((SELECT auth.uid()), project_id))
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','commercial_manager','planning_manager','project_manager']::text[])
  );

-- public.pm_archive_logs
DROP POLICY IF EXISTS "auth_all_pm_archive_logs" ON public.pm_archive_logs;
DROP POLICY IF EXISTS "arch_select" ON public.pm_archive_logs;
DROP POLICY IF EXISTS "arch_insert" ON public.pm_archive_logs;
DROP POLICY IF EXISTS "arch_delete" ON public.pm_archive_logs;
CREATE POLICY "arch_select" ON public.pm_archive_logs FOR SELECT TO authenticated
  USING (
    (project_id IS NULL OR public.fn_user_can_access_project((SELECT auth.uid()), project_id))
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
        AND COALESCE(p.is_active, false) = true
        AND COALESCE(p.status, 'active') = 'active'
        AND p.roles::text[] && ARRAY['admin','ceo','coo','chairman','commercial_manager','planning_manager','project_manager']::text[]
    )
  );
CREATE POLICY "arch_insert" ON public.pm_archive_logs FOR INSERT TO authenticated
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','commercial_manager','planning_manager','project_manager']::text[])
  );
CREATE POLICY "arch_delete" ON public.pm_archive_logs FOR DELETE TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin']::text[])
  );

-- public.pm_boq_milestone_steps (via public.pm_boq_items)
DROP POLICY IF EXISTS "auth_all_pm_boq_milestone_steps" ON public.pm_boq_milestone_steps;
DROP POLICY IF EXISTS "bms_select" ON public.pm_boq_milestone_steps;
DROP POLICY IF EXISTS "bms_insert" ON public.pm_boq_milestone_steps;
DROP POLICY IF EXISTS "bms_update" ON public.pm_boq_milestone_steps;
DROP POLICY IF EXISTS "bms_delete" ON public.pm_boq_milestone_steps;
CREATE POLICY "bms_select" ON public.pm_boq_milestone_steps FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_boq_items p WHERE p.id = pm_boq_milestone_steps.boq_item_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)));
CREATE POLICY "bms_insert" ON public.pm_boq_milestone_steps FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.pm_boq_items p WHERE p.id = pm_boq_milestone_steps.boq_item_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'cost_control', 'estimator', 'planning_manager', 'planning_engineer', 'project_manager', 'site_engineer', 'qc_inspector']::text[]));
CREATE POLICY "bms_update" ON public.pm_boq_milestone_steps FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_boq_items p WHERE p.id = pm_boq_milestone_steps.boq_item_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'cost_control', 'estimator', 'planning_manager', 'planning_engineer', 'project_manager', 'site_engineer', 'qc_inspector']::text[])) WITH CHECK (EXISTS (SELECT 1 FROM public.pm_boq_items p WHERE p.id = pm_boq_milestone_steps.boq_item_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'cost_control', 'estimator', 'planning_manager', 'planning_engineer', 'project_manager', 'site_engineer', 'qc_inspector']::text[]));
CREATE POLICY "bms_delete" ON public.pm_boq_milestone_steps FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_boq_items p WHERE p.id = pm_boq_milestone_steps.boq_item_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'cost_control', 'estimator', 'planning_manager']::text[]));

-- public.pm_boq_revisions
DROP POLICY IF EXISTS "boq_revisions_insert" ON public.pm_boq_revisions;
DROP POLICY IF EXISTS "boq_revisions_write" ON public.pm_boq_revisions;
DROP POLICY IF EXISTS "boq_revisions_read" ON public.pm_boq_revisions;
DROP POLICY IF EXISTS "boq_revisions_select" ON public.pm_boq_revisions;
CREATE POLICY "boq_revisions_select" ON public.pm_boq_revisions FOR SELECT TO authenticated
  USING (
    (project_id IS NOT NULL AND public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND public.fn_user_can_see_prices((SELECT auth.uid()), project_id))
    OR (project_id IS NULL AND EXISTS (
      SELECT 1 FROM public.pm_boq_items b
      WHERE b.id = pm_boq_revisions.boq_item_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), b.project_id)
        AND public.fn_user_can_see_prices((SELECT auth.uid()), b.project_id)
    ))
  );
CREATE POLICY "boq_revisions_insert" ON public.pm_boq_revisions FOR INSERT TO authenticated
  WITH CHECK (
    (project_id IS NULL OR public.fn_user_can_access_project((SELECT auth.uid()), project_id))
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','commercial_manager','cost_control','estimator','contract_admin']::text[])
  );

-- public.pm_boq_sub_materials (via public.pm_boq_items)
DROP POLICY IF EXISTS "auth_all_pm_boq_sub_materials" ON public.pm_boq_sub_materials;
DROP POLICY IF EXISTS "bsm_select" ON public.pm_boq_sub_materials;
DROP POLICY IF EXISTS "bsm_insert" ON public.pm_boq_sub_materials;
DROP POLICY IF EXISTS "bsm_update" ON public.pm_boq_sub_materials;
DROP POLICY IF EXISTS "bsm_delete" ON public.pm_boq_sub_materials;
CREATE POLICY "bsm_select" ON public.pm_boq_sub_materials FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_boq_items p WHERE p.id = pm_boq_sub_materials.boq_item_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)));
CREATE POLICY "bsm_insert" ON public.pm_boq_sub_materials FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.pm_boq_items p WHERE p.id = pm_boq_sub_materials.boq_item_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'cost_control', 'estimator', 'procurement', 'inventory', 'project_manager', 'technical_office', 'to_manager', 'to_engineer']::text[]));
CREATE POLICY "bsm_update" ON public.pm_boq_sub_materials FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_boq_items p WHERE p.id = pm_boq_sub_materials.boq_item_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'cost_control', 'estimator', 'procurement', 'inventory', 'project_manager', 'technical_office', 'to_manager', 'to_engineer']::text[])) WITH CHECK (EXISTS (SELECT 1 FROM public.pm_boq_items p WHERE p.id = pm_boq_sub_materials.boq_item_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'cost_control', 'estimator', 'procurement', 'inventory', 'project_manager', 'technical_office', 'to_manager', 'to_engineer']::text[]));
CREATE POLICY "bsm_delete" ON public.pm_boq_sub_materials FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_boq_items p WHERE p.id = pm_boq_sub_materials.boq_item_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'cost_control', 'estimator', 'procurement']::text[]));

-- public.pm_change_orders
DROP POLICY IF EXISTS "auth_all_pm_change_orders" ON public.pm_change_orders;
DROP POLICY IF EXISTS "pco_select" ON public.pm_change_orders;
DROP POLICY IF EXISTS "pco_insert" ON public.pm_change_orders;
DROP POLICY IF EXISTS "pco_update" ON public.pm_change_orders;
DROP POLICY IF EXISTS "pco_delete" ON public.pm_change_orders;
CREATE POLICY "pco_select" ON public.pm_change_orders FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND public.fn_user_can_see_prices((SELECT auth.uid()), project_id));
CREATE POLICY "pco_insert" ON public.pm_change_orders FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'cost_control', 'project_manager']::text[]));
CREATE POLICY "pco_update" ON public.pm_change_orders FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'cost_control', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'cost_control', 'project_manager']::text[]));
CREATE POLICY "pco_delete" ON public.pm_change_orders FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager']::text[]));

-- public.pm_invoices
DROP POLICY IF EXISTS "auth_all_pm_invoices" ON public.pm_invoices;
DROP POLICY IF EXISTS "invoices_select" ON public.pm_invoices;
DROP POLICY IF EXISTS "invoices_insert" ON public.pm_invoices;
DROP POLICY IF EXISTS "invoices_update" ON public.pm_invoices;
DROP POLICY IF EXISTS "invoices_delete" ON public.pm_invoices;
CREATE POLICY "invoices_select" ON public.pm_invoices FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND public.fn_user_can_see_prices((SELECT auth.uid()), project_id));
CREATE POLICY "invoices_insert" ON public.pm_invoices FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'ipc_clerk', 'cost_control', 'finance', 'project_manager']::text[]));
CREATE POLICY "invoices_update" ON public.pm_invoices FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'ipc_clerk', 'cost_control', 'finance', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'ipc_clerk', 'cost_control', 'finance', 'project_manager']::text[]));
CREATE POLICY "invoices_delete" ON public.pm_invoices FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'finance']::text[]));

-- public.pm_payment_milestones
DROP POLICY IF EXISTS "auth_all_pm_payment_milestones" ON public.pm_payment_milestones;
DROP POLICY IF EXISTS "pay_milestones_select" ON public.pm_payment_milestones;
DROP POLICY IF EXISTS "pay_milestones_insert" ON public.pm_payment_milestones;
DROP POLICY IF EXISTS "pay_milestones_update" ON public.pm_payment_milestones;
DROP POLICY IF EXISTS "pay_milestones_delete" ON public.pm_payment_milestones;
CREATE POLICY "pay_milestones_select" ON public.pm_payment_milestones FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND public.fn_user_can_see_prices((SELECT auth.uid()), project_id));
CREATE POLICY "pay_milestones_insert" ON public.pm_payment_milestones FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'ipc_clerk', 'cost_control', 'finance', 'project_manager']::text[]));
CREATE POLICY "pay_milestones_update" ON public.pm_payment_milestones FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'ipc_clerk', 'cost_control', 'finance', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'ipc_clerk', 'cost_control', 'finance', 'project_manager']::text[]));
CREATE POLICY "pay_milestones_delete" ON public.pm_payment_milestones FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager']::text[]));

-- public.pm_daily_equipment_logs (via public.pm_daily_progress)
DROP POLICY IF EXISTS "daily_equipment_authenticated_all" ON public.pm_daily_equipment_logs;
DROP POLICY IF EXISTS "del_select" ON public.pm_daily_equipment_logs;
DROP POLICY IF EXISTS "del_insert" ON public.pm_daily_equipment_logs;
DROP POLICY IF EXISTS "del_update" ON public.pm_daily_equipment_logs;
DROP POLICY IF EXISTS "del_delete" ON public.pm_daily_equipment_logs;
CREATE POLICY "del_select" ON public.pm_daily_equipment_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_daily_progress p WHERE p.id = pm_daily_equipment_logs.daily_progress_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)));
CREATE POLICY "del_insert" ON public.pm_daily_equipment_logs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.pm_daily_progress p WHERE p.id = pm_daily_equipment_logs.daily_progress_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[]));
CREATE POLICY "del_update" ON public.pm_daily_equipment_logs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_daily_progress p WHERE p.id = pm_daily_equipment_logs.daily_progress_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[])) WITH CHECK (EXISTS (SELECT 1 FROM public.pm_daily_progress p WHERE p.id = pm_daily_equipment_logs.daily_progress_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[]));
CREATE POLICY "del_delete" ON public.pm_daily_equipment_logs FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_daily_progress p WHERE p.id = pm_daily_equipment_logs.daily_progress_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'site_engineer']::text[]));

-- public.pm_daily_manpower_logs (via public.pm_daily_progress)
DROP POLICY IF EXISTS "daily_manpower_authenticated_all" ON public.pm_daily_manpower_logs;
DROP POLICY IF EXISTS "dml_select" ON public.pm_daily_manpower_logs;
DROP POLICY IF EXISTS "dml_insert" ON public.pm_daily_manpower_logs;
DROP POLICY IF EXISTS "dml_update" ON public.pm_daily_manpower_logs;
DROP POLICY IF EXISTS "dml_delete" ON public.pm_daily_manpower_logs;
CREATE POLICY "dml_select" ON public.pm_daily_manpower_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_daily_progress p WHERE p.id = pm_daily_manpower_logs.daily_progress_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)));
CREATE POLICY "dml_insert" ON public.pm_daily_manpower_logs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.pm_daily_progress p WHERE p.id = pm_daily_manpower_logs.daily_progress_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[]));
CREATE POLICY "dml_update" ON public.pm_daily_manpower_logs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_daily_progress p WHERE p.id = pm_daily_manpower_logs.daily_progress_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[])) WITH CHECK (EXISTS (SELECT 1 FROM public.pm_daily_progress p WHERE p.id = pm_daily_manpower_logs.daily_progress_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[]));
CREATE POLICY "dml_delete" ON public.pm_daily_manpower_logs FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_daily_progress p WHERE p.id = pm_daily_manpower_logs.daily_progress_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'site_engineer']::text[]));

-- public.pm_daily_reports
DROP POLICY IF EXISTS "daily_reports_authenticated_all" ON public.pm_daily_reports;
DROP POLICY IF EXISTS "daily_reports_insert" ON public.pm_daily_reports;
DROP POLICY IF EXISTS "daily_reports_update" ON public.pm_daily_reports;
DROP POLICY IF EXISTS "daily_reports_select" ON public.pm_daily_reports;
DROP POLICY IF EXISTS "daily_reports_delete" ON public.pm_daily_reports;
CREATE POLICY "daily_reports_select" ON public.pm_daily_reports FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "daily_reports_insert" ON public.pm_daily_reports FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'site_engineer', 'planning_engineer', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "daily_reports_update" ON public.pm_daily_reports FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'site_engineer', 'planning_engineer', 'planning_manager', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'site_engineer', 'planning_engineer', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "daily_reports_delete" ON public.pm_daily_reports FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'project_manager']::text[]));

-- public.pm_daily_report_lines (via public.pm_daily_reports)
DROP POLICY IF EXISTS "daily_report_lines_authenticated_all" ON public.pm_daily_report_lines;
DROP POLICY IF EXISTS "daily_report_lines_modify" ON public.pm_daily_report_lines;
DROP POLICY IF EXISTS "daily_report_lines_select" ON public.pm_daily_report_lines;
DROP POLICY IF EXISTS "daily_report_lines_insert" ON public.pm_daily_report_lines;
DROP POLICY IF EXISTS "daily_report_lines_update" ON public.pm_daily_report_lines;
DROP POLICY IF EXISTS "daily_report_lines_delete" ON public.pm_daily_report_lines;
CREATE POLICY "daily_report_lines_select" ON public.pm_daily_report_lines FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_daily_reports p WHERE p.id = pm_daily_report_lines.report_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)));
CREATE POLICY "daily_report_lines_insert" ON public.pm_daily_report_lines FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.pm_daily_reports p WHERE p.id = pm_daily_report_lines.report_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'site_engineer', 'planning_engineer', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "daily_report_lines_update" ON public.pm_daily_report_lines FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_daily_reports p WHERE p.id = pm_daily_report_lines.report_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'site_engineer', 'planning_engineer', 'planning_manager', 'project_manager']::text[])) WITH CHECK (EXISTS (SELECT 1 FROM public.pm_daily_reports p WHERE p.id = pm_daily_report_lines.report_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'site_engineer', 'planning_engineer', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "daily_report_lines_delete" ON public.pm_daily_report_lines FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_daily_reports p WHERE p.id = pm_daily_report_lines.report_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'site_engineer', 'planning_manager', 'project_manager']::text[]));

-- public.pm_daily_report_documents (via public.pm_daily_reports)
DROP POLICY IF EXISTS "daily_report_docs_authenticated_all" ON public.pm_daily_report_documents;
DROP POLICY IF EXISTS "daily_docs_modify" ON public.pm_daily_report_documents;
DROP POLICY IF EXISTS "daily_docs_select" ON public.pm_daily_report_documents;
DROP POLICY IF EXISTS "daily_docs_insert" ON public.pm_daily_report_documents;
DROP POLICY IF EXISTS "daily_docs_update" ON public.pm_daily_report_documents;
DROP POLICY IF EXISTS "daily_docs_delete" ON public.pm_daily_report_documents;
CREATE POLICY "daily_docs_select" ON public.pm_daily_report_documents FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_daily_reports p WHERE p.id = pm_daily_report_documents.report_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)));
CREATE POLICY "daily_docs_insert" ON public.pm_daily_report_documents FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.pm_daily_reports p WHERE p.id = pm_daily_report_documents.report_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'site_engineer', 'planning_engineer', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "daily_docs_update" ON public.pm_daily_report_documents FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_daily_reports p WHERE p.id = pm_daily_report_documents.report_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'site_engineer', 'planning_engineer', 'planning_manager', 'project_manager']::text[])) WITH CHECK (EXISTS (SELECT 1 FROM public.pm_daily_reports p WHERE p.id = pm_daily_report_documents.report_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'site_engineer', 'planning_engineer', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "daily_docs_delete" ON public.pm_daily_report_documents FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_daily_reports p WHERE p.id = pm_daily_report_documents.report_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'project_manager']::text[]));

-- public.pm_deliverables
DROP POLICY IF EXISTS "deliverables_authenticated_all" ON public.pm_deliverables;
DROP POLICY IF EXISTS "deliverables_select" ON public.pm_deliverables;
DROP POLICY IF EXISTS "deliverables_insert" ON public.pm_deliverables;
DROP POLICY IF EXISTS "deliverables_update" ON public.pm_deliverables;
DROP POLICY IF EXISTS "deliverables_delete" ON public.pm_deliverables;
CREATE POLICY "deliverables_select" ON public.pm_deliverables FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "deliverables_insert" ON public.pm_deliverables FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'planning_manager', 'planning_engineer', 'project_manager', 'contract_admin']::text[]));
CREATE POLICY "deliverables_update" ON public.pm_deliverables FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'planning_manager', 'planning_engineer', 'project_manager', 'contract_admin']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'planning_manager', 'planning_engineer', 'project_manager', 'contract_admin']::text[]));
CREATE POLICY "deliverables_delete" ON public.pm_deliverables FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'to_manager', 'planning_manager', 'project_manager']::text[]));

-- public.pm_deliverable_items (via public.pm_deliverables)
DROP POLICY IF EXISTS "deliverable_items_authenticated_all" ON public.pm_deliverable_items;
DROP POLICY IF EXISTS "deliv_items_select" ON public.pm_deliverable_items;
DROP POLICY IF EXISTS "deliv_items_insert" ON public.pm_deliverable_items;
DROP POLICY IF EXISTS "deliv_items_update" ON public.pm_deliverable_items;
DROP POLICY IF EXISTS "deliv_items_delete" ON public.pm_deliverable_items;
CREATE POLICY "deliv_items_select" ON public.pm_deliverable_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_items.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)));
CREATE POLICY "deliv_items_insert" ON public.pm_deliverable_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_items.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'planning_manager', 'planning_engineer', 'project_manager', 'contract_admin']::text[]));
CREATE POLICY "deliv_items_update" ON public.pm_deliverable_items FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_items.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'planning_manager', 'planning_engineer', 'project_manager', 'contract_admin']::text[])) WITH CHECK (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_items.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'planning_manager', 'planning_engineer', 'project_manager', 'contract_admin']::text[]));
CREATE POLICY "deliv_items_delete" ON public.pm_deliverable_items FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_items.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'to_manager', 'planning_manager', 'project_manager']::text[]));

-- public.pm_deliverable_attachments (via public.pm_deliverables)
DROP POLICY IF EXISTS "auth_all_pm_deliverable_attachments" ON public.pm_deliverable_attachments;
DROP POLICY IF EXISTS "deliv_att_select" ON public.pm_deliverable_attachments;
DROP POLICY IF EXISTS "deliv_att_insert" ON public.pm_deliverable_attachments;
DROP POLICY IF EXISTS "deliv_att_update" ON public.pm_deliverable_attachments;
DROP POLICY IF EXISTS "deliv_att_delete" ON public.pm_deliverable_attachments;
CREATE POLICY "deliv_att_select" ON public.pm_deliverable_attachments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_attachments.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)));
CREATE POLICY "deliv_att_insert" ON public.pm_deliverable_attachments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_attachments.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'planning_manager', 'planning_engineer', 'project_manager', 'contract_admin']::text[]));
CREATE POLICY "deliv_att_update" ON public.pm_deliverable_attachments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_attachments.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'planning_manager', 'planning_engineer', 'project_manager', 'contract_admin']::text[])) WITH CHECK (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_attachments.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'planning_manager', 'planning_engineer', 'project_manager', 'contract_admin']::text[]));
CREATE POLICY "deliv_att_delete" ON public.pm_deliverable_attachments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_attachments.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'to_manager', 'planning_manager', 'project_manager']::text[]));

-- public.pm_deliverable_dependencies (via public.pm_deliverables)
DROP POLICY IF EXISTS "auth_all_pm_deliverable_dependencies" ON public.pm_deliverable_dependencies;
DROP POLICY IF EXISTS "deliv_dep_select" ON public.pm_deliverable_dependencies;
DROP POLICY IF EXISTS "deliv_dep_insert" ON public.pm_deliverable_dependencies;
DROP POLICY IF EXISTS "deliv_dep_update" ON public.pm_deliverable_dependencies;
DROP POLICY IF EXISTS "deliv_dep_delete" ON public.pm_deliverable_dependencies;
CREATE POLICY "deliv_dep_select" ON public.pm_deliverable_dependencies FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_dependencies.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)));
CREATE POLICY "deliv_dep_insert" ON public.pm_deliverable_dependencies FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_dependencies.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'planning_manager', 'planning_engineer', 'project_manager', 'contract_admin']::text[]));
CREATE POLICY "deliv_dep_update" ON public.pm_deliverable_dependencies FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_dependencies.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'planning_manager', 'planning_engineer', 'project_manager', 'contract_admin']::text[])) WITH CHECK (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_dependencies.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'planning_manager', 'planning_engineer', 'project_manager', 'contract_admin']::text[]));
CREATE POLICY "deliv_dep_delete" ON public.pm_deliverable_dependencies FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_dependencies.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'to_manager', 'planning_manager', 'project_manager']::text[]));

-- public.pm_deliverable_events (via public.pm_deliverables)
DROP POLICY IF EXISTS "auth_all_pm_deliverable_events" ON public.pm_deliverable_events;
DROP POLICY IF EXISTS "deliv_evt_select" ON public.pm_deliverable_events;
DROP POLICY IF EXISTS "deliv_evt_insert" ON public.pm_deliverable_events;
DROP POLICY IF EXISTS "deliv_evt_update" ON public.pm_deliverable_events;
DROP POLICY IF EXISTS "deliv_evt_delete" ON public.pm_deliverable_events;
CREATE POLICY "deliv_evt_select" ON public.pm_deliverable_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_events.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)));
CREATE POLICY "deliv_evt_insert" ON public.pm_deliverable_events FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_events.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'planning_manager', 'planning_engineer', 'project_manager', 'contract_admin']::text[]));
CREATE POLICY "deliv_evt_delete" ON public.pm_deliverable_events FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.pm_deliverables p WHERE p.id = pm_deliverable_events.deliverable_id AND public.fn_user_can_access_project((SELECT auth.uid()), p.project_id)) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin']::text[]));

-- public.pm_holds
DROP POLICY IF EXISTS "auth_all_pm_holds" ON public.pm_holds;
DROP POLICY IF EXISTS "holds_select" ON public.pm_holds;
DROP POLICY IF EXISTS "holds_insert" ON public.pm_holds;
DROP POLICY IF EXISTS "holds_update" ON public.pm_holds;
DROP POLICY IF EXISTS "holds_delete" ON public.pm_holds;
CREATE POLICY "holds_select" ON public.pm_holds FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "holds_insert" ON public.pm_holds FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'qc_inspector', 'site_engineer', 'commercial_manager']::text[]));
CREATE POLICY "holds_update" ON public.pm_holds FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'qc_inspector', 'site_engineer', 'commercial_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'qc_inspector', 'site_engineer', 'commercial_manager']::text[]));
CREATE POLICY "holds_delete" ON public.pm_holds FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager']::text[]));

-- public.pm_material_allocations
DROP POLICY IF EXISTS "auth_all_pm_material_allocations" ON public.pm_material_allocations;
DROP POLICY IF EXISTS "mat_alloc_select" ON public.pm_material_allocations;
DROP POLICY IF EXISTS "mat_alloc_insert" ON public.pm_material_allocations;
DROP POLICY IF EXISTS "mat_alloc_update" ON public.pm_material_allocations;
DROP POLICY IF EXISTS "mat_alloc_delete" ON public.pm_material_allocations;
CREATE POLICY "mat_alloc_select" ON public.pm_material_allocations FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "mat_alloc_insert" ON public.pm_material_allocations FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'procurement', 'inventory', 'cost_control', 'commercial_manager', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[]));
CREATE POLICY "mat_alloc_update" ON public.pm_material_allocations FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'procurement', 'inventory', 'cost_control', 'commercial_manager', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'procurement', 'inventory', 'cost_control', 'commercial_manager', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[]));
CREATE POLICY "mat_alloc_delete" ON public.pm_material_allocations FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'procurement', 'cost_control', 'commercial_manager', 'project_manager']::text[]));

-- public.pm_material_transactions
DROP POLICY IF EXISTS "auth_all_pm_material_transactions" ON public.pm_material_transactions;
DROP POLICY IF EXISTS "mat_tx_select" ON public.pm_material_transactions;
DROP POLICY IF EXISTS "mat_tx_insert" ON public.pm_material_transactions;
DROP POLICY IF EXISTS "mat_tx_update" ON public.pm_material_transactions;
DROP POLICY IF EXISTS "mat_tx_delete" ON public.pm_material_transactions;
CREATE POLICY "mat_tx_select" ON public.pm_material_transactions FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "mat_tx_insert" ON public.pm_material_transactions FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'procurement', 'inventory', 'cost_control', 'commercial_manager', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[]));
CREATE POLICY "mat_tx_update" ON public.pm_material_transactions FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'procurement', 'inventory', 'cost_control', 'commercial_manager', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'procurement', 'inventory', 'cost_control', 'commercial_manager', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[]));
CREATE POLICY "mat_tx_delete" ON public.pm_material_transactions FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'procurement', 'cost_control', 'commercial_manager', 'project_manager']::text[]));

-- public.pm_mos_entries
DROP POLICY IF EXISTS "auth_all_pm_mos_entries" ON public.pm_mos_entries;
DROP POLICY IF EXISTS "mos_entries_select" ON public.pm_mos_entries;
DROP POLICY IF EXISTS "mos_entries_insert" ON public.pm_mos_entries;
DROP POLICY IF EXISTS "mos_entries_update" ON public.pm_mos_entries;
DROP POLICY IF EXISTS "mos_entries_delete" ON public.pm_mos_entries;
CREATE POLICY "mos_entries_select" ON public.pm_mos_entries FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "mos_entries_insert" ON public.pm_mos_entries FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'procurement', 'inventory', 'cost_control', 'commercial_manager', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[]));
CREATE POLICY "mos_entries_update" ON public.pm_mos_entries FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'procurement', 'inventory', 'cost_control', 'commercial_manager', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'procurement', 'inventory', 'cost_control', 'commercial_manager', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer']::text[]));
CREATE POLICY "mos_entries_delete" ON public.pm_mos_entries FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'procurement', 'cost_control', 'commercial_manager', 'project_manager']::text[]));

-- public.pm_notifications
DROP POLICY IF EXISTS "notif_insert" ON public.pm_notifications;
DROP POLICY IF EXISTS "notif_mark_read" ON public.pm_notifications;
DROP POLICY IF EXISTS "notif_select" ON public.pm_notifications;
DROP POLICY IF EXISTS "service_role_pm_notifications" ON public.pm_notifications;
CREATE POLICY "service_role_pm_notifications" ON public.pm_notifications FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "notif_select" ON public.pm_notifications FOR SELECT TO authenticated
  USING (recipient_user_id = (SELECT auth.uid()));
CREATE POLICY "notif_insert" ON public.pm_notifications FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_is_active_verified_user((SELECT auth.uid()))
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
  );
CREATE POLICY "notif_mark_read" ON public.pm_notifications FOR UPDATE TO authenticated
  USING (
    recipient_user_id = (SELECT auth.uid())
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
  )
  WITH CHECK (
    recipient_user_id = (SELECT auth.uid())
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
  );

-- public.pm_progress_allocations (DB-02)
DROP POLICY IF EXISTS "progress_allocations_authenticated_all" ON public.pm_progress_allocations;
DROP POLICY IF EXISTS "allocations_modify" ON public.pm_progress_allocations;
DROP POLICY IF EXISTS "allocations_select" ON public.pm_progress_allocations;
DROP POLICY IF EXISTS "allocations_insert" ON public.pm_progress_allocations;
DROP POLICY IF EXISTS "allocations_update" ON public.pm_progress_allocations;
DROP POLICY IF EXISTS "allocations_delete" ON public.pm_progress_allocations;
CREATE POLICY "allocations_select" ON public.pm_progress_allocations FOR SELECT TO authenticated
  USING (
    (project_id IS NOT NULL AND public.fn_user_can_access_project((SELECT auth.uid()), project_id))
    OR EXISTS (
      SELECT 1 FROM public.pm_project_activities pa
      WHERE pa.id = pm_progress_allocations.activity_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), pa.project_id)
    )
  );
CREATE POLICY "allocations_insert" ON public.pm_progress_allocations FOR INSERT TO authenticated
  WITH CHECK (
    (project_id IS NULL OR public.fn_user_can_access_project((SELECT auth.uid()), project_id))
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','planning_manager','planning_engineer','project_manager']::text[])
  );
CREATE POLICY "allocations_update" ON public.pm_progress_allocations FOR UPDATE TO authenticated
  USING (
    (project_id IS NULL OR public.fn_user_can_access_project((SELECT auth.uid()), project_id))
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','planning_manager','planning_engineer','project_manager']::text[])
  )
  WITH CHECK (
    (project_id IS NULL OR public.fn_user_can_access_project((SELECT auth.uid()), project_id))
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','planning_manager','planning_engineer','project_manager']::text[])
  );
CREATE POLICY "allocations_delete" ON public.pm_progress_allocations FOR DELETE TO authenticated
  USING (
    (project_id IS NULL OR public.fn_user_can_access_project((SELECT auth.uid()), project_id))
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','planning_manager','planning_engineer','project_manager']::text[])
  );

-- public.pm_project_documents
DROP POLICY IF EXISTS "auth_all_pm_project_documents" ON public.pm_project_documents;
DROP POLICY IF EXISTS "pdoc_select" ON public.pm_project_documents;
DROP POLICY IF EXISTS "pdoc_insert" ON public.pm_project_documents;
DROP POLICY IF EXISTS "pdoc_update" ON public.pm_project_documents;
DROP POLICY IF EXISTS "pdoc_delete" ON public.pm_project_documents;
CREATE POLICY "pdoc_select" ON public.pm_project_documents FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "pdoc_insert" ON public.pm_project_documents FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'contract_admin', 'project_manager', 'planning_manager', 'planning_engineer', 'technical_office', 'to_manager', 'to_engineer', 'site_engineer']::text[]));
CREATE POLICY "pdoc_update" ON public.pm_project_documents FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'contract_admin', 'project_manager', 'planning_manager', 'planning_engineer', 'technical_office', 'to_manager', 'to_engineer', 'site_engineer']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'contract_admin', 'project_manager', 'planning_manager', 'planning_engineer', 'technical_office', 'to_manager', 'to_engineer', 'site_engineer']::text[]));
CREATE POLICY "pdoc_delete" ON public.pm_project_documents FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'project_manager', 'planning_manager', 'to_manager']::text[]));

-- public.pm_project_team
DROP POLICY IF EXISTS "auth_all_pm_project_team" ON public.pm_project_team;
DROP POLICY IF EXISTS "pteam_select" ON public.pm_project_team;
DROP POLICY IF EXISTS "pteam_insert" ON public.pm_project_team;
DROP POLICY IF EXISTS "pteam_update" ON public.pm_project_team;
DROP POLICY IF EXISTS "pteam_delete" ON public.pm_project_team;
CREATE POLICY "pteam_select" ON public.pm_project_team FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "pteam_insert" ON public.pm_project_team FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "pteam_update" ON public.pm_project_team FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'planning_manager', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "pteam_delete" ON public.pm_project_team FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'planning_manager', 'project_manager']::text[]));

-- public.pm_rfi_register
DROP POLICY IF EXISTS "auth_all_pm_rfi_register" ON public.pm_rfi_register;
DROP POLICY IF EXISTS "rfi_select" ON public.pm_rfi_register;
DROP POLICY IF EXISTS "rfi_insert" ON public.pm_rfi_register;
DROP POLICY IF EXISTS "rfi_update" ON public.pm_rfi_register;
DROP POLICY IF EXISTS "rfi_delete" ON public.pm_rfi_register;
CREATE POLICY "rfi_select" ON public.pm_rfi_register FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "rfi_insert" ON public.pm_rfi_register FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'qc_inspector', 'contract_admin']::text[]));
CREATE POLICY "rfi_update" ON public.pm_rfi_register FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'qc_inspector', 'contract_admin']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'technical_office', 'to_manager', 'to_engineer', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'qc_inspector', 'contract_admin']::text[]));
CREATE POLICY "rfi_delete" ON public.pm_rfi_register FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'to_manager', 'planning_manager']::text[]));

-- public.pm_schedule_reports
DROP POLICY IF EXISTS "sched_rep_anon_all" ON public.pm_schedule_reports;
DROP POLICY IF EXISTS "sched_rep_select" ON public.pm_schedule_reports;
DROP POLICY IF EXISTS "sched_rep_insert" ON public.pm_schedule_reports;
DROP POLICY IF EXISTS "sched_rep_update" ON public.pm_schedule_reports;
DROP POLICY IF EXISTS "sched_rep_delete" ON public.pm_schedule_reports;
DROP POLICY IF EXISTS "service_role_pm_schedule_reports" ON public.pm_schedule_reports;
CREATE POLICY "service_role_pm_schedule_reports" ON public.pm_schedule_reports FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "sched_rep_select" ON public.pm_schedule_reports FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "sched_rep_insert" ON public.pm_schedule_reports FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager']::text[]));
CREATE POLICY "sched_rep_update" ON public.pm_schedule_reports FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager']::text[]));
CREATE POLICY "sched_rep_delete" ON public.pm_schedule_reports FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'project_manager']::text[]));

-- public.pm_schedule_versions
DROP POLICY IF EXISTS "schedule_versions_all" ON public.pm_schedule_versions;
DROP POLICY IF EXISTS "schedule_versions_insert" ON public.pm_schedule_versions;
DROP POLICY IF EXISTS "schedule_versions_update" ON public.pm_schedule_versions;
DROP POLICY IF EXISTS "schedule_versions_select" ON public.pm_schedule_versions;
DROP POLICY IF EXISTS "schedule_versions_delete" ON public.pm_schedule_versions;
CREATE POLICY "schedule_versions_select" ON public.pm_schedule_versions FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "schedule_versions_insert" ON public.pm_schedule_versions FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager']::text[]));
CREATE POLICY "schedule_versions_update" ON public.pm_schedule_versions FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager']::text[]));
CREATE POLICY "schedule_versions_delete" ON public.pm_schedule_versions FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'project_manager']::text[]));

-- public.pm_scurve_cache
DROP POLICY IF EXISTS "auth_all_pm_scurve_cache" ON public.pm_scurve_cache;
DROP POLICY IF EXISTS "scurve_select" ON public.pm_scurve_cache;
DROP POLICY IF EXISTS "scurve_insert" ON public.pm_scurve_cache;
DROP POLICY IF EXISTS "scurve_update" ON public.pm_scurve_cache;
DROP POLICY IF EXISTS "scurve_delete" ON public.pm_scurve_cache;
CREATE POLICY "scurve_select" ON public.pm_scurve_cache FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "scurve_insert" ON public.pm_scurve_cache FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager', 'cost_control', 'commercial_manager']::text[]));
CREATE POLICY "scurve_update" ON public.pm_scurve_cache FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager', 'cost_control', 'commercial_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager', 'cost_control', 'commercial_manager']::text[]));
CREATE POLICY "scurve_delete" ON public.pm_scurve_cache FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'project_manager']::text[]));

-- public.pm_subcontractor_targets
DROP POLICY IF EXISTS "auth_all_pm_subcontractor_targets" ON public.pm_subcontractor_targets;
DROP POLICY IF EXISTS "sub_targets_select" ON public.pm_subcontractor_targets;
DROP POLICY IF EXISTS "sub_targets_insert" ON public.pm_subcontractor_targets;
DROP POLICY IF EXISTS "sub_targets_update" ON public.pm_subcontractor_targets;
DROP POLICY IF EXISTS "sub_targets_delete" ON public.pm_subcontractor_targets;
CREATE POLICY "sub_targets_select" ON public.pm_subcontractor_targets FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "sub_targets_insert" ON public.pm_subcontractor_targets FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'commercial_manager', 'cost_control']::text[]));
CREATE POLICY "sub_targets_update" ON public.pm_subcontractor_targets FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'commercial_manager', 'cost_control']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'commercial_manager', 'cost_control']::text[]));
CREATE POLICY "sub_targets_delete" ON public.pm_subcontractor_targets FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'commercial_manager']::text[]));

-- public.pm_wbs_items
DROP POLICY IF EXISTS "auth_all_pm_wbs_items" ON public.pm_wbs_items;
DROP POLICY IF EXISTS "wbs_select" ON public.pm_wbs_items;
DROP POLICY IF EXISTS "wbs_insert" ON public.pm_wbs_items;
DROP POLICY IF EXISTS "wbs_update" ON public.pm_wbs_items;
DROP POLICY IF EXISTS "wbs_delete" ON public.pm_wbs_items;
CREATE POLICY "wbs_select" ON public.pm_wbs_items FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "wbs_insert" ON public.pm_wbs_items FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager', 'commercial_manager', 'cost_control', 'estimator']::text[]));
CREATE POLICY "wbs_update" ON public.pm_wbs_items FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager', 'commercial_manager', 'cost_control', 'estimator']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager', 'commercial_manager', 'cost_control', 'estimator']::text[]));
CREATE POLICY "wbs_delete" ON public.pm_wbs_items FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'project_manager', 'commercial_manager']::text[]));


-- =============================================================================
-- SECTION 3 (DB-03): HARDEN OPERATIONAL & COMMERCIAL WRITE POLICIES + WITH CHECK PARITY
-- =============================================================================

-- public.pm_variation_orders
DROP POLICY IF EXISTS "vo_draft_insert" ON public.pm_variation_orders;
DROP POLICY IF EXISTS "vo_commercial_update_delete" ON public.pm_variation_orders;
DROP POLICY IF EXISTS "vo_commercial_update" ON public.pm_variation_orders;
DROP POLICY IF EXISTS "vo_commercial_delete" ON public.pm_variation_orders;
CREATE POLICY "vo_draft_insert" ON public.pm_variation_orders FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND public.fn_is_active_verified_user((SELECT auth.uid()))
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY[
      'admin','ceo','coo','commercial_manager','contract_admin','cost_control','estimator','project_manager','planning_manager','site_engineer','technical_office','to_manager'
    ]::text[])
  );
CREATE POLICY "vo_commercial_update" ON public.pm_variation_orders FOR UPDATE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','commercial_manager','contract_admin','cost_control']::text[])
  )
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','commercial_manager','contract_admin','cost_control']::text[])
  );
CREATE POLICY "vo_commercial_delete" ON public.pm_variation_orders FOR DELETE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','commercial_manager']::text[])
  );

-- public.pm_variation_order_lines
DROP POLICY IF EXISTS "vo_lines_commercial_write" ON public.pm_variation_order_lines;
DROP POLICY IF EXISTS "vo_lines_price_select" ON public.pm_variation_order_lines;
DROP POLICY IF EXISTS "vo_lines_select" ON public.pm_variation_order_lines;
DROP POLICY IF EXISTS "vo_lines_insert" ON public.pm_variation_order_lines;
DROP POLICY IF EXISTS "vo_lines_update" ON public.pm_variation_order_lines;
DROP POLICY IF EXISTS "vo_lines_delete" ON public.pm_variation_order_lines;
CREATE POLICY "vo_lines_select" ON public.pm_variation_order_lines FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND public.fn_user_can_see_prices((SELECT auth.uid()), project_id));
CREATE POLICY "vo_lines_insert" ON public.pm_variation_order_lines FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'cost_control', 'estimator', 'project_manager']::text[]));
CREATE POLICY "vo_lines_update" ON public.pm_variation_order_lines FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'cost_control', 'estimator', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'cost_control', 'estimator', 'project_manager']::text[]));
CREATE POLICY "vo_lines_delete" ON public.pm_variation_order_lines FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'cost_control']::text[]));

-- public.pm_ipc_certificate_lines
DROP POLICY IF EXISTS "ipc_lines_commercial_write" ON public.pm_ipc_certificate_lines;
DROP POLICY IF EXISTS "ipc_lines_price_select" ON public.pm_ipc_certificate_lines;
DROP POLICY IF EXISTS "ipc_lines_select" ON public.pm_ipc_certificate_lines;
DROP POLICY IF EXISTS "ipc_lines_insert" ON public.pm_ipc_certificate_lines;
DROP POLICY IF EXISTS "ipc_lines_update" ON public.pm_ipc_certificate_lines;
DROP POLICY IF EXISTS "ipc_lines_delete" ON public.pm_ipc_certificate_lines;
CREATE POLICY "ipc_lines_select" ON public.pm_ipc_certificate_lines FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND public.fn_user_can_see_prices((SELECT auth.uid()), project_id));
CREATE POLICY "ipc_lines_insert" ON public.pm_ipc_certificate_lines FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'ipc_clerk', 'cost_control', 'finance', 'project_manager']::text[]));
CREATE POLICY "ipc_lines_update" ON public.pm_ipc_certificate_lines FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'ipc_clerk', 'cost_control', 'finance', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'ipc_clerk', 'cost_control', 'finance', 'project_manager']::text[]));
CREATE POLICY "ipc_lines_delete" ON public.pm_ipc_certificate_lines FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager', 'contract_admin', 'ipc_clerk', 'cost_control']::text[]));

-- public.pm_project_activities
DROP POLICY IF EXISTS "activities_select_authenticated" ON public.pm_project_activities;
DROP POLICY IF EXISTS "project_activities_select" ON public.pm_project_activities;
DROP POLICY IF EXISTS "project_activities_insert" ON public.pm_project_activities;
DROP POLICY IF EXISTS "project_activities_update" ON public.pm_project_activities;
DROP POLICY IF EXISTS "project_activities_delete" ON public.pm_project_activities;
CREATE POLICY "project_activities_select" ON public.pm_project_activities FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "project_activities_insert" ON public.pm_project_activities FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager', 'site_engineer']::text[]));
CREATE POLICY "project_activities_update" ON public.pm_project_activities FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager', 'site_engineer']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager', 'site_engineer']::text[]));
CREATE POLICY "project_activities_delete" ON public.pm_project_activities FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'planning_manager', 'planning_engineer', 'project_manager']::text[]));

-- public.pm_site_tasks
DROP POLICY IF EXISTS "site_tasks_assignee_update" ON public.pm_site_tasks;
DROP POLICY IF EXISTS "site_tasks_write" ON public.pm_site_tasks;
DROP POLICY IF EXISTS "site_tasks_select" ON public.pm_site_tasks;
DROP POLICY IF EXISTS "site_tasks_insert" ON public.pm_site_tasks;
DROP POLICY IF EXISTS "site_tasks_update" ON public.pm_site_tasks;
DROP POLICY IF EXISTS "site_tasks_delete" ON public.pm_site_tasks;
CREATE POLICY "site_tasks_select" ON public.pm_site_tasks FOR SELECT TO authenticated
  USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "site_tasks_insert" ON public.pm_site_tasks FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','planning_manager','planning_engineer','project_manager','site_engineer']::text[])
  );
CREATE POLICY "site_tasks_update" ON public.pm_site_tasks FOR UPDATE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','planning_manager','planning_engineer','project_manager','site_engineer','qc_inspector']::text[])
  )
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','planning_manager','planning_engineer','project_manager','site_engineer','qc_inspector']::text[])
  );
CREATE POLICY "site_tasks_delete" ON public.pm_site_tasks FOR DELETE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','planning_manager','planning_engineer','project_manager']::text[])
  );

-- public.pm_daily_progress
DROP POLICY IF EXISTS "daily_progress_select_scoped" ON public.pm_daily_progress;
DROP POLICY IF EXISTS "daily_progress_insert_scoped" ON public.pm_daily_progress;
DROP POLICY IF EXISTS "daily_progress_update_workflow" ON public.pm_daily_progress;
DROP POLICY IF EXISTS "daily_progress_delete_scoped" ON public.pm_daily_progress;
CREATE POLICY "daily_progress_select_scoped" ON public.pm_daily_progress FOR SELECT TO authenticated
  USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "daily_progress_insert_scoped" ON public.pm_daily_progress FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager','planning_manager','planning_engineer','site_engineer']::text[])
  );
CREATE POLICY "daily_progress_update_workflow" ON public.pm_daily_progress FOR UPDATE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND (
      public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager','planning_manager','planning_engineer']::text[])
      OR (
        public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['site_engineer']::text[])
        AND status = ANY(ARRAY['draft','rejected','resubmitted']::text[])
      )
    )
  )
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND (
      public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager','planning_manager','planning_engineer']::text[])
      OR (
        public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['site_engineer']::text[])
        AND status = ANY(ARRAY['draft','submitted','resubmitted']::text[])
      )
    )
  );
CREATE POLICY "daily_progress_delete_scoped" ON public.pm_daily_progress FOR DELETE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND status = 'draft'
    AND (
      public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager','planning_manager']::text[])
      OR (entered_by = (SELECT auth.uid()) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['site_engineer','planning_engineer']::text[]))
    )
  );

-- public.pm_daily_progress_lines
DROP POLICY IF EXISTS "daily_lines_select_scoped" ON public.pm_daily_progress_lines;
DROP POLICY IF EXISTS "daily_lines_insert_scoped" ON public.pm_daily_progress_lines;
DROP POLICY IF EXISTS "daily_lines_update_scoped" ON public.pm_daily_progress_lines;
DROP POLICY IF EXISTS "daily_lines_delete_scoped" ON public.pm_daily_progress_lines;
CREATE POLICY "daily_lines_select_scoped" ON public.pm_daily_progress_lines FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pm_daily_progress dp
      WHERE dp.id = pm_daily_progress_lines.daily_progress_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), dp.project_id)
    )
  );
CREATE POLICY "daily_lines_insert_scoped" ON public.pm_daily_progress_lines FOR INSERT TO authenticated
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager','planning_manager','planning_engineer','site_engineer']::text[])
    AND EXISTS (
      SELECT 1 FROM public.pm_daily_progress dp
      WHERE dp.id = pm_daily_progress_lines.daily_progress_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), dp.project_id)
    )
  );
CREATE POLICY "daily_lines_update_scoped" ON public.pm_daily_progress_lines FOR UPDATE TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.pm_daily_progress dp
      WHERE dp.id = pm_daily_progress_lines.daily_progress_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), dp.project_id)
        AND (
          public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager','planning_manager','planning_engineer','qc_inspector']::text[])
          OR (
            public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['site_engineer']::text[])
            AND dp.status = ANY(ARRAY['draft','rejected','resubmitted']::text[])
          )
        )
    )
  )
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.pm_daily_progress dp
      WHERE dp.id = pm_daily_progress_lines.daily_progress_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), dp.project_id)
    )
  );
CREATE POLICY "daily_lines_delete_scoped" ON public.pm_daily_progress_lines FOR DELETE TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM public.pm_daily_progress dp
      WHERE dp.id = pm_daily_progress_lines.daily_progress_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), dp.project_id)
        AND (
          public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager','planning_manager']::text[])
          OR (
            public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['site_engineer','planning_engineer']::text[])
            AND dp.status = ANY(ARRAY['draft','rejected']::text[])
          )
        )
    )
  );

-- public.pm_daily_progress_photos
DROP POLICY IF EXISTS "daily_photos_select_scoped" ON public.pm_daily_progress_photos;
DROP POLICY IF EXISTS "daily_photos_insert_scoped" ON public.pm_daily_progress_photos;
DROP POLICY IF EXISTS "daily_photos_delete_scoped" ON public.pm_daily_progress_photos;
CREATE POLICY "daily_photos_select_scoped" ON public.pm_daily_progress_photos FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pm_daily_progress dp
      WHERE dp.id = pm_daily_progress_photos.daily_progress_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), dp.project_id)
    )
  );
CREATE POLICY "daily_photos_insert_scoped" ON public.pm_daily_progress_photos FOR INSERT TO authenticated
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager','planning_manager','planning_engineer','site_engineer','qc_inspector']::text[])
    AND EXISTS (
      SELECT 1 FROM public.pm_daily_progress dp
      WHERE dp.id = pm_daily_progress_photos.daily_progress_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), dp.project_id)
    )
  );
CREATE POLICY "daily_photos_delete_scoped" ON public.pm_daily_progress_photos FOR DELETE TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager','planning_manager','site_engineer']::text[])
    AND EXISTS (
      SELECT 1 FROM public.pm_daily_progress dp
      WHERE dp.id = pm_daily_progress_photos.daily_progress_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), dp.project_id)
    )
  );

-- public.pm_daily_obstructions
DROP POLICY IF EXISTS "daily_obstructions_select_scoped" ON public.pm_daily_obstructions;
DROP POLICY IF EXISTS "daily_obstructions_insert_scoped" ON public.pm_daily_obstructions;
DROP POLICY IF EXISTS "daily_obstructions_update_scoped" ON public.pm_daily_obstructions;
DROP POLICY IF EXISTS "daily_obstructions_delete_scoped" ON public.pm_daily_obstructions;
CREATE POLICY "daily_obstructions_select_scoped" ON public.pm_daily_obstructions FOR SELECT TO authenticated
  USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "daily_obstructions_insert_scoped" ON public.pm_daily_obstructions FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager','planning_manager','planning_engineer','site_engineer','qc_inspector']::text[])
  );
CREATE POLICY "daily_obstructions_update_scoped" ON public.pm_daily_obstructions FOR UPDATE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager','planning_manager','planning_engineer','site_engineer','qc_inspector']::text[])
  )
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager','planning_manager','planning_engineer','site_engineer','qc_inspector']::text[])
  );
CREATE POLICY "daily_obstructions_delete_scoped" ON public.pm_daily_obstructions FOR DELETE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager','planning_manager']::text[])
  );

-- public.pm_daily_progress_comments
DROP POLICY IF EXISTS "dp_comments_insert" ON public.pm_daily_progress_comments;
DROP POLICY IF EXISTS "dp_comments_update" ON public.pm_daily_progress_comments;
DROP POLICY IF EXISTS "dp_comments_delete" ON public.pm_daily_progress_comments;
CREATE POLICY "dp_comments_insert" ON public.pm_daily_progress_comments FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND user_id = (SELECT auth.uid())
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager','planning_manager','planning_engineer','site_engineer','qc_inspector']::text[])
  );
CREATE POLICY "dp_comments_update" ON public.pm_daily_progress_comments FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager','planning_manager','planning_engineer','site_engineer']::text[])
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
  );
CREATE POLICY "dp_comments_delete" ON public.pm_daily_progress_comments FOR DELETE TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND (
      user_id = (SELECT auth.uid())
      OR public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','project_manager']::text[])
    )
  );

-- public.pm_hse_incidents
DROP POLICY IF EXISTS "hse_incidents_project_select" ON public.pm_hse_incidents;
DROP POLICY IF EXISTS "hse_incidents_site_write" ON public.pm_hse_incidents;
DROP POLICY IF EXISTS "hse_incidents_select" ON public.pm_hse_incidents;
DROP POLICY IF EXISTS "hse_incidents_insert" ON public.pm_hse_incidents;
DROP POLICY IF EXISTS "hse_incidents_update" ON public.pm_hse_incidents;
DROP POLICY IF EXISTS "hse_incidents_delete" ON public.pm_hse_incidents;
CREATE POLICY "hse_incidents_select" ON public.pm_hse_incidents FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "hse_incidents_insert" ON public.pm_hse_incidents FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'qc_inspector']::text[]));
CREATE POLICY "hse_incidents_update" ON public.pm_hse_incidents FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'qc_inspector']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'qc_inspector']::text[]));
CREATE POLICY "hse_incidents_delete" ON public.pm_hse_incidents FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager']::text[]));

-- public.pm_hse_inspections
DROP POLICY IF EXISTS "hse_inspections_project_select" ON public.pm_hse_inspections;
DROP POLICY IF EXISTS "hse_inspections_site_write" ON public.pm_hse_inspections;
DROP POLICY IF EXISTS "hse_inspections_select" ON public.pm_hse_inspections;
DROP POLICY IF EXISTS "hse_inspections_insert" ON public.pm_hse_inspections;
DROP POLICY IF EXISTS "hse_inspections_update" ON public.pm_hse_inspections;
DROP POLICY IF EXISTS "hse_inspections_delete" ON public.pm_hse_inspections;
CREATE POLICY "hse_inspections_select" ON public.pm_hse_inspections FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "hse_inspections_insert" ON public.pm_hse_inspections FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'qc_inspector']::text[]));
CREATE POLICY "hse_inspections_update" ON public.pm_hse_inspections FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'qc_inspector']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'qc_inspector']::text[]));
CREATE POLICY "hse_inspections_delete" ON public.pm_hse_inspections FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager']::text[]));

-- public.pm_inspection_requests
DROP POLICY IF EXISTS "insp_req_select" ON public.pm_inspection_requests;
DROP POLICY IF EXISTS "insp_req_write" ON public.pm_inspection_requests;
DROP POLICY IF EXISTS "insp_req_insert" ON public.pm_inspection_requests;
DROP POLICY IF EXISTS "insp_req_update" ON public.pm_inspection_requests;
DROP POLICY IF EXISTS "insp_req_delete" ON public.pm_inspection_requests;
CREATE POLICY "insp_req_select" ON public.pm_inspection_requests FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "insp_req_insert" ON public.pm_inspection_requests FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'qc_inspector']::text[]));
CREATE POLICY "insp_req_update" ON public.pm_inspection_requests FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'qc_inspector']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'qc_inspector']::text[]));
CREATE POLICY "insp_req_delete" ON public.pm_inspection_requests FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager']::text[]));

-- public.pm_task_constraints
DROP POLICY IF EXISTS "task_constraint_select" ON public.pm_task_constraints;
DROP POLICY IF EXISTS "task_constraint_write" ON public.pm_task_constraints;
DROP POLICY IF EXISTS "task_constraint_insert" ON public.pm_task_constraints;
DROP POLICY IF EXISTS "task_constraint_update" ON public.pm_task_constraints;
DROP POLICY IF EXISTS "task_constraint_delete" ON public.pm_task_constraints;
CREATE POLICY "task_constraint_select" ON public.pm_task_constraints FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "task_constraint_insert" ON public.pm_task_constraints FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'technical_office', 'to_manager', 'procurement']::text[]));
CREATE POLICY "task_constraint_update" ON public.pm_task_constraints FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'technical_office', 'to_manager', 'procurement']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer', 'site_engineer', 'technical_office', 'to_manager', 'procurement']::text[]));
CREATE POLICY "task_constraint_delete" ON public.pm_task_constraints FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'project_manager', 'planning_manager']::text[]));

-- public.pm_task_events
DROP POLICY IF EXISTS "task_events_insert" ON public.pm_task_events;
DROP POLICY IF EXISTS "task_events_select" ON public.pm_task_events;
CREATE POLICY "task_events_select" ON public.pm_task_events FOR SELECT TO authenticated
  USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "task_events_insert" ON public.pm_task_events FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND public.fn_is_active_verified_user((SELECT auth.uid()))
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
  );

-- public.pm_to_progress_logs
DROP POLICY IF EXISTS "to_logs_insert" ON public.pm_to_progress_logs;
DROP POLICY IF EXISTS "to_logs_update" ON public.pm_to_progress_logs;
DROP POLICY IF EXISTS "to_logs_select" ON public.pm_to_progress_logs;
DROP POLICY IF EXISTS "to_logs_delete" ON public.pm_to_progress_logs;
CREATE POLICY "to_logs_select" ON public.pm_to_progress_logs FOR SELECT TO authenticated
  USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "to_logs_insert" ON public.pm_to_progress_logs FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','technical_office','to_manager','to_engineer','project_manager','planning_manager','planning_engineer']::text[])
  );
CREATE POLICY "to_logs_update" ON public.pm_to_progress_logs FOR UPDATE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','technical_office','to_manager','to_engineer','project_manager','planning_manager']::text[])
  )
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','technical_office','to_manager','to_engineer','project_manager','planning_manager']::text[])
  );
CREATE POLICY "to_logs_delete" ON public.pm_to_progress_logs FOR DELETE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','to_manager','project_manager']::text[])
  );

-- public.pm_audit_logs & public.pm_push_subscriptions
DROP POLICY IF EXISTS "audit_insert" ON public.pm_audit_logs;
CREATE POLICY "audit_insert" ON public.pm_audit_logs FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_is_active_verified_user((SELECT auth.uid()))
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "push_sub_insert" ON public.pm_push_subscriptions;
DROP POLICY IF EXISTS "push_sub_update" ON public.pm_push_subscriptions;
DROP POLICY IF EXISTS "push_sub_delete" ON public.pm_push_subscriptions;
CREATE POLICY "push_sub_insert" ON public.pm_push_subscriptions FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())));
CREATE POLICY "push_sub_update" ON public.pm_push_subscriptions FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())))
  WITH CHECK (user_id = (SELECT auth.uid()) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())));
CREATE POLICY "push_sub_delete" ON public.pm_push_subscriptions FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())));

-- WITH CHECK parity on public.pm_budget_lines
DROP POLICY IF EXISTS "budget_lines_cost_write" ON public.pm_budget_lines;
DROP POLICY IF EXISTS "budget_lines_cost_write_insert" ON public.pm_budget_lines;
DROP POLICY IF EXISTS "budget_lines_cost_write_update" ON public.pm_budget_lines;
DROP POLICY IF EXISTS "budget_lines_cost_write_delete" ON public.pm_budget_lines;
CREATE POLICY "budget_lines_cost_write_insert" ON public.pm_budget_lines FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'cost_control', 'commercial_manager', 'finance', 'estimator', 'ceo', 'coo']::text[]));
CREATE POLICY "budget_lines_cost_write_update" ON public.pm_budget_lines FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'cost_control', 'commercial_manager', 'finance', 'estimator', 'ceo', 'coo']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'cost_control', 'commercial_manager', 'finance', 'estimator', 'ceo', 'coo']::text[]));
CREATE POLICY "budget_lines_cost_write_delete" ON public.pm_budget_lines FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'cost_control', 'commercial_manager', 'finance', 'estimator', 'ceo', 'coo']::text[]));

-- WITH CHECK parity on public.pm_commercial_settings
DROP POLICY IF EXISTS "commercial_settings_manage" ON public.pm_commercial_settings;
DROP POLICY IF EXISTS "commercial_settings_manage_insert" ON public.pm_commercial_settings;
DROP POLICY IF EXISTS "commercial_settings_manage_update" ON public.pm_commercial_settings;
DROP POLICY IF EXISTS "commercial_settings_manage_delete" ON public.pm_commercial_settings;
CREATE POLICY "commercial_settings_manage_insert" ON public.pm_commercial_settings FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'cost_control', 'finance', 'estimator', 'ceo', 'coo']::text[]));
CREATE POLICY "commercial_settings_manage_update" ON public.pm_commercial_settings FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'cost_control', 'finance', 'estimator', 'ceo', 'coo']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'cost_control', 'finance', 'estimator', 'ceo', 'coo']::text[]));
CREATE POLICY "commercial_settings_manage_delete" ON public.pm_commercial_settings FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'cost_control', 'finance', 'estimator', 'ceo', 'coo']::text[]));

-- WITH CHECK parity on public.pm_controlled_documents
DROP POLICY IF EXISTS "controlled_docs_to_write" ON public.pm_controlled_documents;
DROP POLICY IF EXISTS "controlled_docs_to_write_insert" ON public.pm_controlled_documents;
DROP POLICY IF EXISTS "controlled_docs_to_write_update" ON public.pm_controlled_documents;
DROP POLICY IF EXISTS "controlled_docs_to_write_delete" ON public.pm_controlled_documents;
CREATE POLICY "controlled_docs_to_write_insert" ON public.pm_controlled_documents FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'technical_office', 'to_manager', 'to_engineer', 'project_manager', 'planning_manager']::text[]));
CREATE POLICY "controlled_docs_to_write_update" ON public.pm_controlled_documents FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'technical_office', 'to_manager', 'to_engineer', 'project_manager', 'planning_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'technical_office', 'to_manager', 'to_engineer', 'project_manager', 'planning_manager']::text[]));
CREATE POLICY "controlled_docs_to_write_delete" ON public.pm_controlled_documents FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'technical_office', 'to_manager', 'to_engineer', 'project_manager', 'planning_manager']::text[]));

-- WITH CHECK parity on public.pm_cost_snapshots
DROP POLICY IF EXISTS "cost_snapshots_cost_write" ON public.pm_cost_snapshots;
DROP POLICY IF EXISTS "cost_snapshots_cost_write_insert" ON public.pm_cost_snapshots;
DROP POLICY IF EXISTS "cost_snapshots_cost_write_update" ON public.pm_cost_snapshots;
DROP POLICY IF EXISTS "cost_snapshots_cost_write_delete" ON public.pm_cost_snapshots;
CREATE POLICY "cost_snapshots_cost_write_insert" ON public.pm_cost_snapshots FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'cost_control', 'commercial_manager', 'finance', 'project_manager', 'planning_manager', 'ceo', 'coo']::text[]));
CREATE POLICY "cost_snapshots_cost_write_update" ON public.pm_cost_snapshots FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'cost_control', 'commercial_manager', 'finance', 'project_manager', 'planning_manager', 'ceo', 'coo']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'cost_control', 'commercial_manager', 'finance', 'project_manager', 'planning_manager', 'ceo', 'coo']::text[]));
CREATE POLICY "cost_snapshots_cost_write_delete" ON public.pm_cost_snapshots FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'cost_control', 'commercial_manager', 'finance', 'project_manager', 'planning_manager', 'ceo', 'coo']::text[]));

-- WITH CHECK parity on public.pm_document_transmittals
DROP POLICY IF EXISTS "doc_transmittals_to_write" ON public.pm_document_transmittals;
DROP POLICY IF EXISTS "doc_transmittals_to_write_insert" ON public.pm_document_transmittals;
DROP POLICY IF EXISTS "doc_transmittals_to_write_update" ON public.pm_document_transmittals;
DROP POLICY IF EXISTS "doc_transmittals_to_write_delete" ON public.pm_document_transmittals;
CREATE POLICY "doc_transmittals_to_write_insert" ON public.pm_document_transmittals FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'technical_office', 'to_manager', 'to_engineer', 'project_manager']::text[]));
CREATE POLICY "doc_transmittals_to_write_update" ON public.pm_document_transmittals FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'technical_office', 'to_manager', 'to_engineer', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'technical_office', 'to_manager', 'to_engineer', 'project_manager']::text[]));
CREATE POLICY "doc_transmittals_to_write_delete" ON public.pm_document_transmittals FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'technical_office', 'to_manager', 'to_engineer', 'project_manager']::text[]));

-- WITH CHECK parity on public.pm_eot_requests
DROP POLICY IF EXISTS "eot_project_write" ON public.pm_eot_requests;
DROP POLICY IF EXISTS "eot_project_write_insert" ON public.pm_eot_requests;
DROP POLICY IF EXISTS "eot_project_write_update" ON public.pm_eot_requests;
DROP POLICY IF EXISTS "eot_project_write_delete" ON public.pm_eot_requests;
CREATE POLICY "eot_project_write_insert" ON public.pm_eot_requests FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'planning_manager', 'planning_engineer', 'project_manager', 'site_engineer']::text[]));
CREATE POLICY "eot_project_write_update" ON public.pm_eot_requests FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'planning_manager', 'planning_engineer', 'project_manager', 'site_engineer']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'planning_manager', 'planning_engineer', 'project_manager', 'site_engineer']::text[]));
CREATE POLICY "eot_project_write_delete" ON public.pm_eot_requests FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'planning_manager', 'planning_engineer', 'project_manager', 'site_engineer']::text[]));

-- WITH CHECK parity on public.pm_ipc_certificates
DROP POLICY IF EXISTS "ipc_commercial_write" ON public.pm_ipc_certificates;
DROP POLICY IF EXISTS "ipc_commercial_write_insert" ON public.pm_ipc_certificates;
DROP POLICY IF EXISTS "ipc_commercial_write_update" ON public.pm_ipc_certificates;
DROP POLICY IF EXISTS "ipc_commercial_write_delete" ON public.pm_ipc_certificates;
CREATE POLICY "ipc_commercial_write_insert" ON public.pm_ipc_certificates FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'ipc_clerk', 'cost_control', 'finance', 'project_manager']::text[]));
CREATE POLICY "ipc_commercial_write_update" ON public.pm_ipc_certificates FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'ipc_clerk', 'cost_control', 'finance', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'ipc_clerk', 'cost_control', 'finance', 'project_manager']::text[]));
CREATE POLICY "ipc_commercial_write_delete" ON public.pm_ipc_certificates FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'ipc_clerk', 'cost_control', 'finance', 'project_manager']::text[]));

-- WITH CHECK parity on public.pm_purchase_order_lines
DROP POLICY IF EXISTS "po_lines_write_scoped" ON public.pm_purchase_order_lines;
DROP POLICY IF EXISTS "po_lines_write_scoped_insert" ON public.pm_purchase_order_lines;
DROP POLICY IF EXISTS "po_lines_write_scoped_update" ON public.pm_purchase_order_lines;
DROP POLICY IF EXISTS "po_lines_write_scoped_delete" ON public.pm_purchase_order_lines;
CREATE POLICY "po_lines_write_scoped_insert" ON public.pm_purchase_order_lines FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'procurement', 'cost_control', 'commercial_manager', 'project_manager']::text[]));
CREATE POLICY "po_lines_write_scoped_update" ON public.pm_purchase_order_lines FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'procurement', 'cost_control', 'commercial_manager', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'procurement', 'cost_control', 'commercial_manager', 'project_manager']::text[]));
CREATE POLICY "po_lines_write_scoped_delete" ON public.pm_purchase_order_lines FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'procurement', 'cost_control', 'commercial_manager', 'project_manager']::text[]));

-- WITH CHECK parity on public.pm_purchase_orders
DROP POLICY IF EXISTS "po_write_procurement_commercial" ON public.pm_purchase_orders;
DROP POLICY IF EXISTS "po_write_procurement_commercial_insert" ON public.pm_purchase_orders;
DROP POLICY IF EXISTS "po_write_procurement_commercial_update" ON public.pm_purchase_orders;
DROP POLICY IF EXISTS "po_write_procurement_commercial_delete" ON public.pm_purchase_orders;
CREATE POLICY "po_write_procurement_commercial_insert" ON public.pm_purchase_orders FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'procurement', 'cost_control', 'commercial_manager', 'project_manager', 'ceo', 'coo']::text[]));
CREATE POLICY "po_write_procurement_commercial_update" ON public.pm_purchase_orders FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'procurement', 'cost_control', 'commercial_manager', 'project_manager', 'ceo', 'coo']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'procurement', 'cost_control', 'commercial_manager', 'project_manager', 'ceo', 'coo']::text[]));
CREATE POLICY "po_write_procurement_commercial_delete" ON public.pm_purchase_orders FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'procurement', 'cost_control', 'commercial_manager', 'project_manager', 'ceo', 'coo']::text[]));

-- WITH CHECK parity on public.pm_site_indirect_expenses
DROP POLICY IF EXISTS "indirect_expenses_cost_write" ON public.pm_site_indirect_expenses;
DROP POLICY IF EXISTS "indirect_expenses_cost_write_insert" ON public.pm_site_indirect_expenses;
DROP POLICY IF EXISTS "indirect_expenses_cost_write_update" ON public.pm_site_indirect_expenses;
DROP POLICY IF EXISTS "indirect_expenses_cost_write_delete" ON public.pm_site_indirect_expenses;
CREATE POLICY "indirect_expenses_cost_write_insert" ON public.pm_site_indirect_expenses FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'finance', 'cost_control', 'commercial_manager', 'project_manager']::text[]));
CREATE POLICY "indirect_expenses_cost_write_update" ON public.pm_site_indirect_expenses FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'finance', 'cost_control', 'commercial_manager', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'finance', 'cost_control', 'commercial_manager', 'project_manager']::text[]));
CREATE POLICY "indirect_expenses_cost_write_delete" ON public.pm_site_indirect_expenses FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'finance', 'cost_control', 'commercial_manager', 'project_manager']::text[]));

-- WITH CHECK parity on public.pm_subcontract_packages
DROP POLICY IF EXISTS "sub_pkg_write_commercial" ON public.pm_subcontract_packages;
DROP POLICY IF EXISTS "sub_pkg_write_commercial_insert" ON public.pm_subcontract_packages;
DROP POLICY IF EXISTS "sub_pkg_write_commercial_update" ON public.pm_subcontract_packages;
DROP POLICY IF EXISTS "sub_pkg_write_commercial_delete" ON public.pm_subcontract_packages;
CREATE POLICY "sub_pkg_write_commercial_insert" ON public.pm_subcontract_packages FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'cost_control', 'project_manager', 'ceo', 'coo']::text[]));
CREATE POLICY "sub_pkg_write_commercial_update" ON public.pm_subcontract_packages FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'cost_control', 'project_manager', 'ceo', 'coo']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'cost_control', 'project_manager', 'ceo', 'coo']::text[]));
CREATE POLICY "sub_pkg_write_commercial_delete" ON public.pm_subcontract_packages FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'cost_control', 'project_manager', 'ceo', 'coo']::text[]));

-- WITH CHECK parity on public.pm_boq_cost_elements
DROP POLICY IF EXISTS "boq_cost_elements_commercial_write" ON public.pm_boq_cost_elements;
DROP POLICY IF EXISTS "boq_cost_elements_commercial_write_insert" ON public.pm_boq_cost_elements;
DROP POLICY IF EXISTS "boq_cost_elements_commercial_write_update" ON public.pm_boq_cost_elements;
DROP POLICY IF EXISTS "boq_cost_elements_commercial_write_delete" ON public.pm_boq_cost_elements;
CREATE POLICY "boq_cost_elements_commercial_write_insert" ON public.pm_boq_cost_elements FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'cost_control', 'estimator', 'project_manager']::text[]));
CREATE POLICY "boq_cost_elements_commercial_write_update" ON public.pm_boq_cost_elements FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'cost_control', 'estimator', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'cost_control', 'estimator', 'project_manager']::text[]));
CREATE POLICY "boq_cost_elements_commercial_write_delete" ON public.pm_boq_cost_elements FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'cost_control', 'estimator', 'project_manager']::text[]));

-- WITH CHECK parity on public.pm_boq_sections
DROP POLICY IF EXISTS "boq_sections_modify" ON public.pm_boq_sections;
DROP POLICY IF EXISTS "boq_sections_modify_insert" ON public.pm_boq_sections;
DROP POLICY IF EXISTS "boq_sections_modify_update" ON public.pm_boq_sections;
DROP POLICY IF EXISTS "boq_sections_modify_delete" ON public.pm_boq_sections;
CREATE POLICY "boq_sections_modify_insert" ON public.pm_boq_sections FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'cost_control', 'estimator']::text[]));
CREATE POLICY "boq_sections_modify_update" ON public.pm_boq_sections FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'cost_control', 'estimator']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'cost_control', 'estimator']::text[]));
CREATE POLICY "boq_sections_modify_delete" ON public.pm_boq_sections FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'cost_control', 'estimator']::text[]));

-- WITH CHECK parity on public.pm_claims
DROP POLICY IF EXISTS "claims_commercial_write" ON public.pm_claims;
DROP POLICY IF EXISTS "claims_commercial_write_insert" ON public.pm_claims;
DROP POLICY IF EXISTS "claims_commercial_write_update" ON public.pm_claims;
DROP POLICY IF EXISTS "claims_commercial_write_delete" ON public.pm_claims;
CREATE POLICY "claims_commercial_write_insert" ON public.pm_claims FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'project_manager', 'cost_control']::text[]));
CREATE POLICY "claims_commercial_write_update" ON public.pm_claims FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'project_manager', 'cost_control']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'project_manager', 'cost_control']::text[]));
CREATE POLICY "claims_commercial_write_delete" ON public.pm_claims FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'project_manager', 'cost_control']::text[]));

-- WITH CHECK parity on public.pm_component_instances
DROP POLICY IF EXISTS "comp_inst_write" ON public.pm_component_instances;
DROP POLICY IF EXISTS "comp_inst_write_insert" ON public.pm_component_instances;
DROP POLICY IF EXISTS "comp_inst_write_update" ON public.pm_component_instances;
DROP POLICY IF EXISTS "comp_inst_write_delete" ON public.pm_component_instances;
CREATE POLICY "comp_inst_write_insert" ON public.pm_component_instances FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "comp_inst_write_update" ON public.pm_component_instances FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "comp_inst_write_delete" ON public.pm_component_instances FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager', 'project_manager']::text[]));

-- WITH CHECK parity on public.pm_contracts
DROP POLICY IF EXISTS "contracts_commercial_write" ON public.pm_contracts;
DROP POLICY IF EXISTS "contracts_commercial_write_insert" ON public.pm_contracts;
DROP POLICY IF EXISTS "contracts_commercial_write_update" ON public.pm_contracts;
DROP POLICY IF EXISTS "contracts_commercial_write_delete" ON public.pm_contracts;
CREATE POLICY "contracts_commercial_write_insert" ON public.pm_contracts FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'ceo', 'coo']::text[]));
CREATE POLICY "contracts_commercial_write_update" ON public.pm_contracts FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'ceo', 'coo']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'ceo', 'coo']::text[]));
CREATE POLICY "contracts_commercial_write_delete" ON public.pm_contracts FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'commercial_manager', 'contract_admin', 'ceo', 'coo']::text[]));

-- WITH CHECK parity on public.pm_monthly_reports
DROP POLICY IF EXISTS "monthly_modify" ON public.pm_monthly_reports;
DROP POLICY IF EXISTS "monthly_modify_insert" ON public.pm_monthly_reports;
DROP POLICY IF EXISTS "monthly_modify_update" ON public.pm_monthly_reports;
DROP POLICY IF EXISTS "monthly_modify_delete" ON public.pm_monthly_reports;
CREATE POLICY "monthly_modify_insert" ON public.pm_monthly_reports FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager']::text[]));
CREATE POLICY "monthly_modify_update" ON public.pm_monthly_reports FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager']::text[]));
CREATE POLICY "monthly_modify_delete" ON public.pm_monthly_reports FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager']::text[]));

-- WITH CHECK parity on public.pm_weekly_reports
DROP POLICY IF EXISTS "weekly_modify" ON public.pm_weekly_reports;
DROP POLICY IF EXISTS "weekly_modify_insert" ON public.pm_weekly_reports;
DROP POLICY IF EXISTS "weekly_modify_update" ON public.pm_weekly_reports;
DROP POLICY IF EXISTS "weekly_modify_delete" ON public.pm_weekly_reports;
CREATE POLICY "weekly_modify_insert" ON public.pm_weekly_reports FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager']::text[]));
CREATE POLICY "weekly_modify_update" ON public.pm_weekly_reports FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager']::text[]));
CREATE POLICY "weekly_modify_delete" ON public.pm_weekly_reports FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager']::text[]));

-- WITH CHECK parity on public.pm_work_packages
DROP POLICY IF EXISTS "work_pkg_write" ON public.pm_work_packages;
DROP POLICY IF EXISTS "work_pkg_write_insert" ON public.pm_work_packages;
DROP POLICY IF EXISTS "work_pkg_write_update" ON public.pm_work_packages;
DROP POLICY IF EXISTS "work_pkg_write_delete" ON public.pm_work_packages;
CREATE POLICY "work_pkg_write_insert" ON public.pm_work_packages FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "work_pkg_write_update" ON public.pm_work_packages FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "work_pkg_write_delete" ON public.pm_work_packages FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager', 'project_manager']::text[]));

-- WITH CHECK parity on public.pm_zones
DROP POLICY IF EXISTS "zones_modify" ON public.pm_zones;
DROP POLICY IF EXISTS "zones_modify_insert" ON public.pm_zones;
DROP POLICY IF EXISTS "zones_modify_update" ON public.pm_zones;
DROP POLICY IF EXISTS "zones_modify_delete" ON public.pm_zones;
CREATE POLICY "zones_modify_insert" ON public.pm_zones FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager', 'planning_engineer', 'project_manager']::text[]));
CREATE POLICY "zones_modify_update" ON public.pm_zones FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager', 'planning_engineer', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager', 'planning_engineer', 'project_manager']::text[]));
CREATE POLICY "zones_modify_delete" ON public.pm_zones FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'planning_manager', 'planning_engineer', 'project_manager']::text[]));

-- public.pm_subcontract_ipc_lines WITH CHECK + non-viewer
DROP POLICY IF EXISTS "sub_ipc_write_scoped" ON public.pm_subcontract_ipc_lines;
DROP POLICY IF EXISTS "sub_ipc_write_insert" ON public.pm_subcontract_ipc_lines;
DROP POLICY IF EXISTS "sub_ipc_write_update" ON public.pm_subcontract_ipc_lines;
DROP POLICY IF EXISTS "sub_ipc_write_delete" ON public.pm_subcontract_ipc_lines;
CREATE POLICY "sub_ipc_write_insert" ON public.pm_subcontract_ipc_lines FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND (
      public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','commercial_manager','contract_admin','ipc_clerk','cost_control','finance','project_manager']::text[])
      OR EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.pm_subcontract_packages sp ON sp.id = pm_subcontract_ipc_lines.package_id
        WHERE p.id = (SELECT auth.uid())
          AND p.portal_scope = 'external_subcontractor'
          AND p.stakeholder_id = sp.subcontractor_stakeholder_id
      )
    )
  );
CREATE POLICY "sub_ipc_write_update" ON public.pm_subcontract_ipc_lines FOR UPDATE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','commercial_manager','contract_admin','ipc_clerk','cost_control','finance','project_manager']::text[])
  )
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','commercial_manager','contract_admin','ipc_clerk','cost_control','finance','project_manager']::text[])
  );
CREATE POLICY "sub_ipc_write_delete" ON public.pm_subcontract_ipc_lines FOR DELETE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','commercial_manager','cost_control']::text[])
  );

-- =============================================================================
-- SECTION 4 (DB-04): HARDEN public.profiles SELF-PRIVILEGE-ESCALATION GUARD
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_guard_profile_roles_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_is_privileged boolean := false;
BEGIN
  v_is_privileged := public.fn_is_system_or_service_role()
    OR (v_uid IS NOT NULL AND public.fn_user_has_role(v_uid, ARRAY['admin']::public.user_role[]));

  IF TG_OP = 'INSERT' THEN
    IF NOT v_is_privileged THEN
      IF COALESCE(cardinality(NEW.roles), 0) > 0
         OR COALESCE(NEW.price_access_granted, false) = true
         OR COALESCE(NEW.is_active, false) = true
         OR COALESCE(NEW.status, 'pending_activation') <> 'pending_activation'
         OR COALESCE(NEW.portal_scope, 'internal') <> 'internal'
         OR NEW.stakeholder_id IS NOT NULL
         OR NEW.project_scope_mode IS NOT NULL
      THEN
        RAISE EXCEPTION 'SECURITY_VIOLATION: Only administrators or service_role can set privileged profile fields on creation.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF NOT v_is_privileged THEN
    IF NEW.roles IS DISTINCT FROM OLD.roles
       OR NEW.price_access_granted IS DISTINCT FROM OLD.price_access_granted
       OR NEW.is_active IS DISTINCT FROM OLD.is_active
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.portal_scope IS DISTINCT FROM OLD.portal_scope
       OR NEW.stakeholder_id IS DISTINCT FROM OLD.stakeholder_id
       OR NEW.project_scope_mode IS DISTINCT FROM OLD.project_scope_mode
       OR NEW.activated_at IS DISTINCT FROM OLD.activated_at
       OR NEW.activated_by IS DISTINCT FROM OLD.activated_by
       OR NEW.email IS DISTINCT FROM OLD.email
    THEN
      RAISE EXCEPTION 'SECURITY_VIOLATION: Only administrators or service_role can modify privileged profile fields (roles, price_access_granted, is_active, status, portal_scope, stakeholder_id, project_scope_mode).';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_profile_roles ON public.profiles;
CREATE TRIGGER trg_guard_profile_roles
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_guard_profile_roles_update();

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "service_role_profiles" ON public.profiles;

CREATE POLICY "service_role_profiles" ON public.profiles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR public.fn_is_active_verified_user((SELECT auth.uid()))
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid())
    AND public.fn_is_active_verified_user((SELECT auth.uid()))
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    AND public.fn_is_active_verified_user((SELECT auth.uid()))
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
  );

CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_role((SELECT auth.uid()), ARRAY['admin']::public.user_role[])
  )
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_role((SELECT auth.uid()), ARRAY['admin']::public.user_role[])
  );

-- =============================================================================
-- SECTION 6 (DB-07): RESTRICT projects, project_stakeholders, stakeholders
-- =============================================================================

-- public.project_stakeholders
DROP POLICY IF EXISTS "Allow anon access to project_stakeholders" ON public.project_stakeholders;
DROP POLICY IF EXISTS "project_stakeholders_select" ON public.project_stakeholders;
DROP POLICY IF EXISTS "project_stakeholders_insert" ON public.project_stakeholders;
DROP POLICY IF EXISTS "project_stakeholders_update" ON public.project_stakeholders;
DROP POLICY IF EXISTS "project_stakeholders_delete" ON public.project_stakeholders;
DROP POLICY IF EXISTS "service_role_project_stakeholders" ON public.project_stakeholders;
CREATE POLICY "service_role_project_stakeholders" ON public.project_stakeholders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "project_stakeholders_select" ON public.project_stakeholders FOR SELECT TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id));
CREATE POLICY "project_stakeholders_insert" ON public.project_stakeholders FOR INSERT TO authenticated WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "project_stakeholders_update" ON public.project_stakeholders FOR UPDATE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'planning_manager', 'project_manager']::text[])) WITH CHECK (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "project_stakeholders_delete" ON public.project_stakeholders FOR DELETE TO authenticated USING (public.fn_user_can_access_project((SELECT auth.uid()), project_id) AND NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'planning_manager', 'project_manager']::text[]));

-- public.stakeholders (reference/global)
DROP POLICY IF EXISTS "stakeholders_modify" ON public.stakeholders;
DROP POLICY IF EXISTS "stakeholders_select" ON public.stakeholders;
DROP POLICY IF EXISTS "stakeholders_insert" ON public.stakeholders;
DROP POLICY IF EXISTS "stakeholders_update" ON public.stakeholders;
DROP POLICY IF EXISTS "stakeholders_delete" ON public.stakeholders;
DROP POLICY IF EXISTS "service_role_stakeholders" ON public.stakeholders;
CREATE POLICY "service_role_stakeholders" ON public.stakeholders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "stakeholders_select" ON public.stakeholders FOR SELECT TO authenticated USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY "stakeholders_insert" ON public.stakeholders FOR INSERT TO authenticated WITH CHECK (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "stakeholders_update" ON public.stakeholders FOR UPDATE TO authenticated USING (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'planning_manager', 'project_manager']::text[])) WITH CHECK (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'coo_assistant', 'commercial_manager', 'planning_manager', 'project_manager']::text[]));
CREATE POLICY "stakeholders_delete" ON public.stakeholders FOR DELETE TO authenticated USING (NOT public.fn_user_is_viewer_only((SELECT auth.uid())) AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin', 'ceo', 'coo', 'commercial_manager']::text[]));

-- public.projects
DROP POLICY IF EXISTS "projects_insert" ON public.projects;
DROP POLICY IF EXISTS "projects_update" ON public.projects;
DROP POLICY IF EXISTS "projects_delete" ON public.projects;
DROP POLICY IF EXISTS "projects_select" ON public.projects;
DROP POLICY IF EXISTS "service_role_projects" ON public.projects;

CREATE POLICY "service_role_projects" ON public.projects
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "projects_select" ON public.projects
  FOR SELECT TO authenticated
  USING (public.fn_user_can_access_project((SELECT auth.uid()), id));

CREATE POLICY "projects_insert" ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY[
      'admin','ceo','coo','coo_assistant','commercial_manager','planning_manager','project_manager'
    ]::text[])
  );

CREATE POLICY "projects_update" ON public.projects
  FOR UPDATE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY[
      'admin','ceo','coo','coo_assistant','commercial_manager','planning_manager','project_manager'
    ]::text[])
  )
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY[
      'admin','ceo','coo','coo_assistant','commercial_manager','planning_manager','project_manager'
    ]::text[])
  );

CREATE POLICY "projects_delete" ON public.projects
  FOR DELETE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY[
      'admin','ceo','coo','commercial_manager'
    ]::text[])
  );

-- =============================================================================
-- SECTION 7 (DB-08): SECURE pm_boq_items UNMASKED PRICE EXPOSURE
-- =============================================================================

DROP POLICY IF EXISTS "boq_select_members" ON public.pm_boq_items;
DROP POLICY IF EXISTS "boq_items_modify" ON public.pm_boq_items;
DROP POLICY IF EXISTS "boq_items_insert" ON public.pm_boq_items;
DROP POLICY IF EXISTS "boq_items_update" ON public.pm_boq_items;
DROP POLICY IF EXISTS "boq_items_delete" ON public.pm_boq_items;

CREATE POLICY "boq_select_members" ON public.pm_boq_items
  FOR SELECT TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND public.fn_user_can_see_prices((SELECT auth.uid()), project_id)
  );

CREATE POLICY "boq_items_insert" ON public.pm_boq_items
  FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY[
      'admin','ceo','coo','commercial_manager','cost_control','estimator'
    ]::text[])
  );

CREATE POLICY "boq_items_update" ON public.pm_boq_items
  FOR UPDATE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY[
      'admin','ceo','coo','commercial_manager','cost_control','estimator'
    ]::text[])
  )
  WITH CHECK (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY[
      'admin','ceo','coo','commercial_manager','cost_control','estimator'
    ]::text[])
  );

CREATE POLICY "boq_items_delete" ON public.pm_boq_items
  FOR DELETE TO authenticated
  USING (
    public.fn_user_can_access_project((SELECT auth.uid()), project_id)
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY[
      'admin','ceo','coo','commercial_manager','cost_control','estimator'
    ]::text[])
  );

-- =============================================================================
-- SECTION 8 (DB-09): HARDEN storage.objects POLICIES ON ALL 4 PROJECT BUCKETS
-- =============================================================================

DROP POLICY IF EXISTS "progress_photos_delete" ON storage.objects;
DROP POLICY IF EXISTS "progress_photos_insert" ON storage.objects;
DROP POLICY IF EXISTS "progress_photos_read" ON storage.objects;
DROP POLICY IF EXISTS "project_scoped_delete_progress_documents" ON storage.objects;
DROP POLICY IF EXISTS "project_scoped_delete_deliverables" ON storage.objects;
DROP POLICY IF EXISTS "project_scoped_delete_project_schedules" ON storage.objects;
DROP POLICY IF EXISTS "project_scoped_insert_deliverables" ON storage.objects;
DROP POLICY IF EXISTS "project_scoped_insert_progress_documents" ON storage.objects;
DROP POLICY IF EXISTS "project_scoped_insert_progress_photos" ON storage.objects;
DROP POLICY IF EXISTS "project_scoped_insert_project_schedules" ON storage.objects;
DROP POLICY IF EXISTS "project_scoped_read_deliverables" ON storage.objects;
DROP POLICY IF EXISTS "project_scoped_read_progress_documents" ON storage.objects;
DROP POLICY IF EXISTS "project_scoped_read_progress_photos" ON storage.objects;
DROP POLICY IF EXISTS "project_scoped_read_project_schedules" ON storage.objects;
DROP POLICY IF EXISTS "project_scoped_update_deliverables" ON storage.objects;
DROP POLICY IF EXISTS "project_scoped_update_progress_documents" ON storage.objects;
DROP POLICY IF EXISTS "project_scoped_update_progress_photos" ON storage.objects;
DROP POLICY IF EXISTS "project_scoped_update_project_schedules" ON storage.objects;

-- Helper expression inline for storage folder[1] -> project access (safe against non-UUID folder names)
CREATE OR REPLACE FUNCTION public.fn_storage_can_read_project_folder(p_object_name text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_folder text;
  v_proj_id uuid;
BEGIN
  v_folder := (storage.foldername(p_object_name))[1];
  IF v_folder IS NULL OR v_folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN FALSE;
  END IF;
  v_proj_id := v_folder::uuid;
  RETURN public.fn_user_can_access_project((SELECT auth.uid()), v_proj_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_storage_can_write_project_folder(p_object_name text, p_allowed_roles text[])
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_folder text;
  v_proj_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN public.fn_is_system_or_service_role();
  END IF;

  IF public.fn_user_is_viewer_only(v_uid) THEN
    RETURN FALSE;
  END IF;

  IF NOT public.fn_user_has_any_role_text(v_uid, p_allowed_roles) THEN
    RETURN FALSE;
  END IF;

  v_folder := (storage.foldername(p_object_name))[1];
  IF v_folder IS NULL OR v_folder !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RETURN FALSE;
  END IF;
  v_proj_id := v_folder::uuid;

  IF NOT public.fn_user_can_access_project(v_uid, v_proj_id) THEN
    RETURN FALSE;
  END IF;

  -- Explicitly block read-only project grant rows (access_level = 'view') unless executive/admin
  IF EXISTS (
    SELECT 1 FROM public.pm_user_project_access upa
    WHERE upa.user_id = v_uid
      AND upa.project_id = v_proj_id
      AND COALESCE(upa.access_level, 'edit') = 'view'
  ) AND NOT public.fn_user_has_any_role_text(v_uid, ARRAY['admin','ceo','coo','commercial_manager','planning_manager','project_manager']::text[])
  THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- READ policies on the 4 project buckets (allows active project members + viewer)
CREATE POLICY "project_scoped_read_deliverables" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'deliverables' AND public.fn_storage_can_read_project_folder(name));

CREATE POLICY "project_scoped_read_progress_documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'progress-documents' AND public.fn_storage_can_read_project_folder(name));

CREATE POLICY "project_scoped_read_progress_photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'progress-photos' AND public.fn_storage_can_read_project_folder(name));

CREATE POLICY "project_scoped_read_project_schedules" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'project-schedules' AND public.fn_storage_can_read_project_folder(name));

-- INSERT policies (explicit NOT fn_user_is_viewer_only + access_level <> 'view' + role check)
CREATE POLICY "project_scoped_insert_deliverables" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'deliverables'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY[
      'admin','ceo','coo','commercial_manager','project_manager','technical_office','to_manager','to_engineer','planning_engineer','planning_manager'
    ]::text[])
  );

CREATE POLICY "project_scoped_insert_progress_documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'progress-documents'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY[
      'admin','ceo','coo','commercial_manager','project_manager','site_engineer','planning_engineer','planning_manager','technical_office','to_manager','contract_admin','qc_inspector'
    ]::text[])
  );

CREATE POLICY "project_scoped_insert_progress_photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY[
      'admin','ceo','coo','commercial_manager','project_manager','site_engineer','planning_engineer','planning_manager','qc_inspector'
    ]::text[])
  );

CREATE POLICY "project_scoped_insert_project_schedules" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-schedules'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY[
      'admin','ceo','coo','commercial_manager','project_manager','planning_engineer','planning_manager'
    ]::text[])
  );

-- UPDATE policies
CREATE POLICY "project_scoped_update_deliverables" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'deliverables'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY['admin','ceo','coo','commercial_manager','project_manager','to_manager','planning_manager']::text[])
  )
  WITH CHECK (
    bucket_id = 'deliverables'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY['admin','ceo','coo','commercial_manager','project_manager','to_manager','planning_manager']::text[])
  );

CREATE POLICY "project_scoped_update_progress_documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'progress-documents'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY['admin','ceo','coo','commercial_manager','project_manager','contract_admin','planning_manager']::text[])
  )
  WITH CHECK (
    bucket_id = 'progress-documents'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY['admin','ceo','coo','commercial_manager','project_manager','contract_admin','planning_manager']::text[])
  );

CREATE POLICY "project_scoped_update_progress_photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY['admin','ceo','coo','commercial_manager','project_manager','planning_manager']::text[])
  )
  WITH CHECK (
    bucket_id = 'progress-photos'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY['admin','ceo','coo','commercial_manager','project_manager','planning_manager']::text[])
  );

CREATE POLICY "project_scoped_update_project_schedules" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'project-schedules'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY['admin','ceo','coo','commercial_manager','project_manager','planning_manager']::text[])
  )
  WITH CHECK (
    bucket_id = 'project-schedules'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY['admin','ceo','coo','commercial_manager','project_manager','planning_manager']::text[])
  );

-- DELETE policies
CREATE POLICY "progress_photos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'progress-photos'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY['admin','ceo','coo','planning_manager','project_manager']::text[])
  );

CREATE POLICY "project_scoped_delete_progress_documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'progress-documents'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY['admin','ceo','coo','commercial_manager','project_manager','planning_manager']::text[])
  );

CREATE POLICY "project_scoped_delete_deliverables" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'deliverables'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY['admin','ceo','coo','commercial_manager','project_manager','to_manager','planning_manager']::text[])
  );

CREATE POLICY "project_scoped_delete_project_schedules" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'project-schedules'
    AND NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_storage_can_write_project_folder(name, ARRAY['admin','ceo','coo','commercial_manager','project_manager','planning_manager']::text[])
  );


-- Remaining non-project_id FOR ALL policies: enforce explicit WITH CHECK + NOT fn_user_is_viewer_only
DROP POLICY IF EXISTS "clients_modify" ON public.clients;
CREATE POLICY "clients_modify" ON public.clients FOR ALL TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','commercial_manager','project_manager']::text[])
  )
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','commercial_manager','project_manager']::text[])
  );

DROP POLICY IF EXISTS "Admins can update module access matrix" ON public.contract_module_access;
CREATE POLICY "Admins can update module access matrix" ON public.contract_module_access FOR ALL TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin']::text[])
  )
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin']::text[])
  );

DROP POLICY IF EXISTS "activity_boq_links_modify" ON public.pm_activity_boq_links;
CREATE POLICY "activity_boq_links_modify" ON public.pm_activity_boq_links FOR ALL TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','planning_manager','planning_engineer','project_manager']::text[])
    AND EXISTS (
      SELECT 1 FROM public.pm_project_activities pa
      WHERE pa.id = pm_activity_boq_links.activity_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), pa.project_id)
    )
  )
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','planning_manager','planning_engineer','project_manager']::text[])
    AND EXISTS (
      SELECT 1 FROM public.pm_project_activities pa
      WHERE pa.id = pm_activity_boq_links.activity_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), pa.project_id)
    )
  );

DROP POLICY IF EXISTS "activity_lib_administer" ON public.pm_activity_library;
CREATE POLICY "activity_lib_administer" ON public.pm_activity_library FOR ALL TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','commercial_manager','planning_manager']::text[])
  )
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','commercial_manager','planning_manager']::text[])
  );

DROP POLICY IF EXISTS "price_grants_modify" ON public.pm_price_view_grants;
CREATE POLICY "price_grants_modify" ON public.pm_price_view_grants FOR ALL TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','planning_manager']::text[])
  )
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','planning_manager']::text[])
  );

DROP POLICY IF EXISTS "resource_lib_commercial_manage" ON public.pm_resource_rate_library;
CREATE POLICY "resource_lib_commercial_manage" ON public.pm_resource_rate_library FOR ALL TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','commercial_manager','cost_control','estimator','ceo','coo']::text[])
  )
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','commercial_manager','cost_control','estimator','ceo','coo']::text[])
  );

DROP POLICY IF EXISTS "task_assign_write" ON public.pm_task_assignments;
CREATE POLICY "task_assign_write" ON public.pm_task_assignments FOR ALL TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','planning_manager','planning_engineer','project_manager']::text[])
    AND EXISTS (
      SELECT 1 FROM public.pm_site_tasks st
      WHERE st.id = pm_task_assignments.task_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), st.project_id)
    )
  )
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','planning_manager','planning_engineer','project_manager']::text[])
    AND EXISTS (
      SELECT 1 FROM public.pm_site_tasks st
      WHERE st.id = pm_task_assignments.task_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), st.project_id)
    )
  );

DROP POLICY IF EXISTS "tender_bidders_commercial_write" ON public.pm_tender_bidders;
CREATE POLICY "tender_bidders_commercial_write" ON public.pm_tender_bidders FOR ALL TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','commercial_manager','estimator','ceo','coo']::text[])
  )
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','commercial_manager','estimator','ceo','coo']::text[])
  );

DROP POLICY IF EXISTS "tenders_commercial_write" ON public.pm_tenders;
CREATE POLICY "tenders_commercial_write" ON public.pm_tenders FOR ALL TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','commercial_manager','estimator','ceo','coo']::text[])
  )
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','commercial_manager','estimator','ceo','coo']::text[])
  );

DROP POLICY IF EXISTS "access_modify" ON public.pm_user_project_access;
DROP POLICY IF EXISTS "upa_all_admin" ON public.pm_user_project_access;
CREATE POLICY "upa_all_admin" ON public.pm_user_project_access FOR ALL TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','chairman','commercial_manager']::text[])
  )
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','ceo','coo','chairman','commercial_manager']::text[])
  );

DROP POLICY IF EXISTS "wp_boq_write" ON public.pm_work_package_boq_scope;
CREATE POLICY "wp_boq_write" ON public.pm_work_package_boq_scope FOR ALL TO authenticated
  USING (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','planning_manager','project_manager']::text[])
    AND EXISTS (
      SELECT 1 FROM public.pm_work_packages wp
      WHERE wp.id = pm_work_package_boq_scope.work_package_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), wp.project_id)
    )
  )
  WITH CHECK (
    NOT public.fn_user_is_viewer_only((SELECT auth.uid()))
    AND public.fn_user_has_any_role_text((SELECT auth.uid()), ARRAY['admin','planning_manager','project_manager']::text[])
    AND EXISTS (
      SELECT 1 FROM public.pm_work_packages wp
      WHERE wp.id = pm_work_package_boq_scope.work_package_id
        AND public.fn_user_can_access_project((SELECT auth.uid()), wp.project_id)
    )
  );

-- Harden rpc_daily_report_transition & rpc_site_task_transition against viewer / forged null-uid
CREATE OR REPLACE FUNCTION public.rpc_daily_report_transition(
  p_report_id uuid,
  p_action text,
  p_reason text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report RECORD;
  v_actor_user_id UUID := (SELECT auth.uid());
  v_from_state TEXT;
  v_to_state TEXT;
  v_is_pm_or_admin BOOLEAN := false;
  v_is_planner BOOLEAN := false;
  v_is_site_eng BOOLEAN := false;
  v_is_submitter BOOLEAN := false;
BEGIN
  IF NOT public.fn_is_system_or_service_role() THEN
    IF v_actor_user_id IS NULL OR public.fn_user_is_viewer_only(v_actor_user_id) THEN
      RAISE EXCEPTION 'FORBIDDEN: Read-only viewer or unauthenticated user cannot transition daily reports';
    END IF;
  END IF;

  SELECT * INTO v_report FROM public.pm_daily_progress WHERE id = p_report_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'REPORT_NOT_FOUND: التقرير % غير موجود', p_report_id;
  END IF;

  IF NOT public.fn_is_system_or_service_role()
     AND NOT public.fn_user_can_access_project(v_actor_user_id, v_report.project_id)
  THEN
    RAISE EXCEPTION 'FORBIDDEN: Access denied to project %', v_report.project_id;
  END IF;

  v_from_state := v_report.status;

  IF NOT public.fn_is_system_or_service_role() THEN
    v_is_pm_or_admin := public.fn_user_has_any_role_text(v_actor_user_id, ARRAY[
      'admin', 'project_manager', 'planning_manager', 'ceo', 'coo', 'chairman'
    ]::text[]);
    v_is_planner := public.fn_user_has_any_role_text(v_actor_user_id, ARRAY[
      'admin', 'planning_engineer', 'planning_manager'
    ]::text[]);
    v_is_site_eng := public.fn_user_has_any_role_text(v_actor_user_id, ARRAY[
      'site_engineer', 'admin', 'project_manager', 'planning_manager'
    ]::text[]);
    v_is_submitter := (v_report.entered_by IS NOT NULL AND v_actor_user_id = v_report.entered_by);
  ELSE
    v_is_pm_or_admin := true;
    v_is_planner := true;
    v_is_site_eng := true;
    v_is_submitter := true;
  END IF;

  CASE p_action
    WHEN 'submit' THEN
      IF v_from_state NOT IN ('draft', 'rejected') THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن تقديم تقرير بحالة "%"', v_from_state;
      END IF;
      IF NOT (v_is_submitter OR v_is_pm_or_admin OR v_is_site_eng) THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مهندس الموقع أو مقدم التقرير أو مدير المشروع يمكنه تقديم التقرير';
      END IF;
      v_to_state := 'submitted';

    WHEN 'approve' THEN
      IF v_from_state <> 'submitted' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن اعتماد تقرير بحالة "%"', v_from_state;
      END IF;
      IF NOT (v_is_planner OR v_is_pm_or_admin) THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مهندس التخطيط أو مدير المشروع يمكنه اعتماد التقرير';
      END IF;
      v_to_state := 'approved';

    WHEN 'reject' THEN
      IF v_from_state <> 'submitted' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن رفض تقرير بحالة "%"', v_from_state;
      END IF;
      IF NOT (v_is_planner OR v_is_pm_or_admin) THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مهندس التخطيط أو مدير المشروع يمكنه رفض التقرير';
      END IF;
      IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'REASON_REQUIRED: سبب الرفض مطلوب';
      END IF;
      v_to_state := 'rejected';

    WHEN 'reopen' THEN
      IF v_from_state <> 'approved' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن إعادة فتح تقرير بحالة "%"', v_from_state;
      END IF;
      IF NOT (v_is_planner OR v_is_pm_or_admin) THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مهندس التخطيط أو الأدمن يمكنه إعادة فتح تقرير معتمد';
      END IF;
      IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'REASON_REQUIRED: سبب إعادة الفتح مطلوب';
      END IF;
      v_to_state := 'reopened';

    ELSE
      RAISE EXCEPTION 'UNKNOWN_ACTION: الإجراء "%" غير معروف — الإجراءات المتاحة: submit, approve, reject, reopen', p_action;
  END CASE;

  UPDATE public.pm_daily_progress
  SET
    status = v_to_state,
    submitted_at = CASE WHEN v_to_state = 'submitted' THEN now() ELSE submitted_at END,
    entered_by = COALESCE(entered_by, v_actor_user_id),
    approved_by = CASE WHEN v_to_state = 'approved' THEN v_actor_user_id ELSE approved_by END,
    approved_at = CASE WHEN v_to_state = 'approved' THEN now() ELSE approved_at END,
    rejection_reason = CASE WHEN v_to_state = 'rejected' THEN p_reason ELSE rejection_reason END,
    reopened_reason = CASE WHEN v_to_state = 'reopened' THEN p_reason ELSE reopened_reason END,
    updated_at = now()
  WHERE id = p_report_id;

  IF v_to_state = 'approved' THEN
    UPDATE public.pm_daily_progress_lines l
    SET
      line_status = 'approved',
      line_reviewed_by = v_actor_user_id,
      line_reviewed_at = now(),
      snapshot_rate_egp = COALESCE(l.snapshot_rate_egp, (SELECT b.rate_egp FROM public.pm_boq_items b WHERE b.id = l.boq_item_id)),
      source_boq_revision = COALESCE(l.source_boq_revision, (SELECT b.revision FROM public.pm_boq_items b WHERE b.id = l.boq_item_id)),
      updated_at = now()
    WHERE l.daily_progress_id = p_report_id AND l.line_status = 'pending';
  END IF;

  IF v_to_state = 'reopened' THEN
    UPDATE public.pm_progress_allocations a
    SET is_suspended = true, updated_at = now()
    FROM public.pm_daily_progress_lines l
    WHERE l.daily_progress_id = p_report_id
      AND a.line_id = l.id
      AND (a.is_suspended IS NULL OR a.is_suspended = false);

    UPDATE public.pm_daily_progress_lines
    SET line_status = 'pending', updated_at = now()
    WHERE daily_progress_id = p_report_id;
  END IF;

  IF v_to_state = 'rejected' THEN
    UPDATE public.pm_daily_progress_lines
    SET line_status = 'pending', updated_at = now()
    WHERE daily_progress_id = p_report_id AND line_status = 'approved';
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'report_id', p_report_id,
    'previous_status', v_from_state,
    'new_status', v_to_state,
    'actor_user_id', v_actor_user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_site_task_transition(
  p_task_id uuid,
  p_to_state text,
  p_reason text DEFAULT NULL::text,
  p_evidence_payload jsonb DEFAULT '{}'::jsonb,
  p_verified_qty numeric DEFAULT NULL::numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task RECORD;
  v_actor_user_id UUID := (SELECT auth.uid());
  v_actor_stakeholder_id UUID;
  v_from_state TEXT;
  v_allowed TEXT[];
  v_new_progress NUMERIC;
  v_event_type TEXT;
  v_is_assignee BOOLEAN := false;
  v_is_pm_or_admin BOOLEAN := false;
  v_is_qc_assigned BOOLEAN := false;
BEGIN
  IF NOT public.fn_is_system_or_service_role() THEN
    IF v_actor_user_id IS NULL OR public.fn_user_is_viewer_only(v_actor_user_id) THEN
      RAISE EXCEPTION 'FORBIDDEN: Read-only viewer or unauthenticated user cannot transition site tasks';
    END IF;
  END IF;

  SELECT * INTO v_task FROM public.pm_site_tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND: Task % does not exist', p_task_id;
  END IF;

  IF NOT public.fn_is_system_or_service_role()
     AND NOT public.fn_user_can_access_project(v_actor_user_id, v_task.project_id)
  THEN
    RAISE EXCEPTION 'FORBIDDEN: Access denied to project %', v_task.project_id;
  END IF;

  v_from_state := v_task.status;

  IF NOT public.fn_is_system_or_service_role() THEN
    SELECT id INTO v_actor_stakeholder_id
    FROM public.stakeholders
    WHERE auth_user_id = v_actor_user_id
    LIMIT 1;

    v_is_assignee := (v_actor_stakeholder_id IS NOT NULL AND v_actor_stakeholder_id = v_task.assignee_stakeholder_id);
    v_is_pm_or_admin := public.fn_user_has_any_role_text(v_actor_user_id, ARRAY[
      'admin', 'ceo', 'coo', 'project_manager', 'planning_manager', 'planning_engineer'
    ]::text[]);
    v_is_qc_assigned := (v_actor_stakeholder_id IS NOT NULL AND v_actor_stakeholder_id = v_task.qc_stakeholder_id);
  ELSE
    v_is_pm_or_admin := true;
    v_is_assignee := true;
    v_is_qc_assigned := true;
  END IF;

  v_allowed := CASE v_from_state
    WHEN 'pending'     THEN ARRAY['in_progress', 'cancelled']
    WHEN 'in_progress' THEN ARRAY['pm_review', 'cancelled']
    WHEN 'pm_review'   THEN ARRAY['qc_pending', 'approved', 'rejected']
    WHEN 'qc_pending'  THEN ARRAY['approved', 'rejected']
    WHEN 'rejected'    THEN ARRAY['in_progress', 'cancelled']
    WHEN 'approved'    THEN ARRAY['done']
    ELSE ARRAY[]::TEXT[]
  END;

  IF NOT (p_to_state = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Cannot transition from "%" to "%"', v_from_state, p_to_state;
  END IF;

  IF v_from_state = 'pending' AND p_to_state = 'in_progress' AND NOT (v_is_assignee OR v_is_pm_or_admin) THEN
    RAISE EXCEPTION 'FORBIDDEN: Only the assigned engineer or PM/admin can start this task';
  END IF;
  IF v_from_state = 'in_progress' AND p_to_state = 'pm_review' AND NOT (v_is_assignee OR v_is_pm_or_admin) THEN
    RAISE EXCEPTION 'FORBIDDEN: Only the assigned engineer can submit for PM review';
  END IF;
  IF v_from_state = 'pm_review' AND p_to_state IN ('approved', 'qc_pending', 'rejected') AND NOT v_is_pm_or_admin THEN
    RAISE EXCEPTION 'FORBIDDEN: Only PM/planning_manager/admin can approve, route to QC, or reject';
  END IF;
  IF v_from_state = 'qc_pending' AND p_to_state IN ('approved', 'rejected') AND NOT (v_is_qc_assigned OR v_is_pm_or_admin) THEN
    RAISE EXCEPTION 'FORBIDDEN: Only the assigned QC inspector or PM/admin can decide QC outcome';
  END IF;
  IF v_from_state = 'rejected' AND p_to_state = 'in_progress' AND NOT (v_is_assignee OR v_is_pm_or_admin) THEN
    RAISE EXCEPTION 'FORBIDDEN: Only the assigned engineer or PM/admin can restart after rejection';
  END IF;
  IF v_from_state = 'approved' AND p_to_state = 'done' AND NOT v_is_pm_or_admin THEN
    RAISE EXCEPTION 'FORBIDDEN: Only PM/admin can close a task';
  END IF;
  IF p_to_state = 'cancelled' AND NOT v_is_pm_or_admin THEN
    RAISE EXCEPTION 'FORBIDDEN: Only PM/planning_manager/admin can cancel a task';
  END IF;

  IF p_to_state IN ('rejected', 'cancelled') AND (p_reason IS NULL OR trim(p_reason) = '') THEN
    RAISE EXCEPTION 'REASON_REQUIRED: A non-empty reason is mandatory for rejection or cancellation';
  END IF;

  IF p_verified_qty IS NOT NULL THEN
    IF v_task.planned_qty > 0 THEN
      v_new_progress := LEAST(100, ROUND((p_verified_qty / v_task.planned_qty) * 100, 2));
    ELSE
      v_new_progress := v_task.progress_pct;
    END IF;
  ELSIF p_to_state = 'approved' THEN
    v_new_progress := 100;
  ELSIF p_to_state = 'in_progress' AND v_task.progress_pct = 0 THEN
    v_new_progress := 10;
  ELSE
    v_new_progress := v_task.progress_pct;
  END IF;

  v_event_type := CASE
    WHEN v_from_state = 'pending'     AND p_to_state = 'in_progress' THEN 'started'
    WHEN v_from_state = 'in_progress' AND p_to_state = 'pm_review'   THEN 'submitted_for_pm'
    WHEN v_from_state = 'pm_review'   AND p_to_state = 'approved'    THEN 'pm_accepted'
    WHEN v_from_state = 'pm_review'   AND p_to_state = 'qc_pending'  THEN 'inspection_created'
    WHEN v_from_state = 'pm_review'   AND p_to_state = 'rejected'    THEN 'pm_rejected'
    WHEN v_from_state = 'qc_pending'  AND p_to_state = 'approved'    THEN 'inspection_passed'
    WHEN v_from_state = 'qc_pending'  AND p_to_state = 'rejected'    THEN 'inspection_rejected'
    WHEN v_from_state = 'rejected'    AND p_to_state = 'in_progress' THEN 'reopened_rework'
    WHEN v_from_state = 'approved'    AND p_to_state = 'done'        THEN 'closed'
    WHEN p_to_state = 'cancelled'                                    THEN 'cancelled'
    ELSE 'replanned'
  END;

  UPDATE public.pm_site_tasks
  SET
    status           = p_to_state,
    rejection_reason = CASE WHEN p_to_state = 'rejected' THEN p_reason ELSE rejection_reason END,
    progress_pct     = v_new_progress,
    actual_start_at  = CASE WHEN p_to_state = 'in_progress' AND actual_start_at IS NULL THEN now() ELSE actual_start_at END,
    actual_finish_at = CASE WHEN p_to_state IN ('approved', 'done') AND actual_finish_at IS NULL THEN now() ELSE actual_finish_at END,
    updated_at       = now()
  WHERE id = p_task_id;

  INSERT INTO public.pm_task_events (
    task_id, project_id, event_type, actor_user_id, actor_stakeholder_id,
    from_state, to_state, reason, payload
  ) VALUES (
    p_task_id, v_task.project_id, v_event_type, v_actor_user_id, v_actor_stakeholder_id,
    v_from_state, p_to_state, p_reason, COALESCE(p_evidence_payload, '{}'::jsonb)
  );

  RETURN jsonb_build_object(
    'success',      true,
    'task_id',      p_task_id,
    'from_state',   v_from_state,
    'to_state',     p_to_state,
    'event_type',   v_event_type,
    'progress_pct', v_new_progress
  );
END;
$$;


-- =============================================================================
-- SECTION 5 (DB-05 & DB-06): HARDEN fn_promote_schedule_version & ALL SECURITY DEFINER RPCs
-- =============================================================================

-- 5.1 DB-05: public.fn_promote_schedule_version(p_version_id uuid)
CREATE OR REPLACE FUNCTION public.fn_promote_schedule_version(p_version_id uuid)
RETURNS pm_schedule_versions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pm
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_ver public.pm_schedule_versions;
BEGIN
  IF NOT public.fn_is_system_or_service_role() THEN
    IF v_uid IS NULL OR public.fn_user_is_viewer_only(v_uid) THEN
      RAISE EXCEPTION 'FORBIDDEN: Read-only viewer or unauthenticated user cannot promote schedule versions';
    END IF;
    IF NOT public.fn_user_has_any_role_text(v_uid, ARRAY[
      'admin','ceo','coo','planning_manager','planning_engineer','project_manager'
    ]::text[]) THEN
      RAISE EXCEPTION 'FORBIDDEN: Insufficient role to promote schedule versions';
    END IF;
  END IF;

  SELECT * INTO v_ver
  FROM public.pm_schedule_versions
  WHERE id = p_version_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule version % not found', p_version_id;
  END IF;

  IF NOT public.fn_is_system_or_service_role()
     AND NOT public.fn_user_can_access_project(v_uid, v_ver.project_id)
  THEN
    RAISE EXCEPTION 'FORBIDDEN: Project access denied for schedule version %', p_version_id;
  END IF;

  UPDATE public.pm_schedule_versions
  SET is_current = false
  WHERE project_id = v_ver.project_id AND id != p_version_id;

  UPDATE public.pm_schedule_versions
  SET is_current = true
  WHERE id = p_version_id
  RETURNING * INTO v_ver;

  RETURN v_ver;
END;
$$;

-- 5.2 DB-06a: public.rpc_create_report(...)
CREATE OR REPLACE FUNCTION public.rpc_create_report(
  p_project_id uuid,
  p_progress_date date,
  p_discipline text DEFAULT 'civil'::text,
  p_weather text DEFAULT NULL::text,
  p_manpower_count integer DEFAULT 0,
  p_equipment_summary text DEFAULT NULL::text,
  p_entered_by_name text DEFAULT NULL::text,
  p_idempotency_key text DEFAULT NULL::text,
  p_notes text DEFAULT NULL::text,
  p_site_task_id uuid DEFAULT NULL::uuid
)
RETURNS pm_daily_progress
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pm
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_report_no INT;
  v_report public.pm_daily_progress;
  v_existing public.pm_daily_progress;
  v_task public.pm_site_tasks;
BEGIN
  IF NOT public.fn_is_system_or_service_role() THEN
    IF v_uid IS NULL OR public.fn_user_is_viewer_only(v_uid) THEN
      RAISE EXCEPTION 'FORBIDDEN: Read-only viewer or unauthenticated user cannot create daily reports';
    END IF;
    IF NOT public.fn_user_can_access_project(v_uid, p_project_id)
       OR NOT public.fn_user_has_any_role_text(v_uid, ARRAY[
         'admin','ceo','coo','project_manager','planning_manager','planning_engineer','site_engineer'
       ]::text[])
    THEN
      RAISE EXCEPTION 'FORBIDDEN: Insufficient role or project access to create daily report';
    END IF;
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM public.pm_daily_progress
    WHERE idempotency_key = p_idempotency_key
      AND project_id = p_project_id;

    IF FOUND THEN
      RETURN v_existing;
    END IF;
  END IF;

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
    COALESCE(p_manpower_count, 0), p_equipment_summary, v_uid, p_entered_by_name,
    'draft', p_idempotency_key, p_notes, p_site_task_id
  ) RETURNING * INTO v_report;

  UPDATE public.pm_site_tasks
  SET status = CASE WHEN status = 'pending' THEN 'in_progress' ELSE status END,
      updated_at = now()
  WHERE id = p_site_task_id;

  RETURN v_report;
END;
$$;

-- 5.3 DB-06b: public.rpc_reassign_task(...)
CREATE OR REPLACE FUNCTION public.rpc_reassign_task(
  p_task_id uuid,
  p_new_stakeholder_id uuid,
  p_role text DEFAULT 'primary_assignee'::text,
  p_reason text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task RECORD;
  v_actor_user_id UUID := (SELECT auth.uid());
  v_actor_stakeholder_id UUID;
BEGIN
  IF NOT public.fn_is_system_or_service_role() THEN
    IF v_actor_user_id IS NULL OR public.fn_user_is_viewer_only(v_actor_user_id) THEN
      RAISE EXCEPTION 'FORBIDDEN: Read-only viewer or unauthenticated user cannot reassign tasks';
    END IF;
    IF NOT public.fn_user_has_any_role_text(v_actor_user_id, ARRAY[
      'admin','ceo','coo','project_manager','planning_manager','planning_engineer'
    ]::text[]) THEN
      RAISE EXCEPTION 'FORBIDDEN: Only PM/planning/admin roles can reassign tasks';
    END IF;
  END IF;

  SELECT * INTO v_task FROM public.pm_site_tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND: Task % does not exist', p_task_id;
  END IF;

  IF NOT public.fn_is_system_or_service_role()
     AND NOT public.fn_user_can_access_project(v_actor_user_id, v_task.project_id)
  THEN
    RAISE EXCEPTION 'FORBIDDEN: Access denied to project %', v_task.project_id;
  END IF;

  IF v_actor_user_id IS NOT NULL THEN
    SELECT id INTO v_actor_stakeholder_id FROM public.stakeholders WHERE auth_user_id = v_actor_user_id LIMIT 1;
  END IF;

  IF public.fn_project_has_team(v_task.project_id)
     AND NOT public.fn_is_on_project_team(p_new_stakeholder_id, v_task.project_id) THEN
    RAISE EXCEPTION 'ASSIGNEE_NOT_ON_PROJECT_TEAM: Stakeholder % is not on the project team — add them via Project Setup (Stakeholders) first. / المعيّن ليس ضمن فريق المشروع — أضفه من موديول إدارة أصحاب المصلحة أولًا',
      p_new_stakeholder_id;
  END IF;

  IF p_role = 'primary_assignee' THEN
    UPDATE public.pm_task_assignments
    SET is_active = false, released_at = now()
    WHERE task_id = p_task_id AND role = 'primary_assignee' AND is_active = true;

    UPDATE public.pm_site_tasks
    SET assignee_stakeholder_id = p_new_stakeholder_id, updated_at = now()
    WHERE id = p_task_id;
  ELSIF p_role = 'qc_inspector' THEN
    UPDATE public.pm_site_tasks
    SET qc_stakeholder_id = p_new_stakeholder_id, updated_at = now()
    WHERE id = p_task_id;
  END IF;

  INSERT INTO public.pm_task_assignments (
    task_id, stakeholder_id, role, assigned_by, assigned_at, is_active
  ) VALUES (
    p_task_id, p_new_stakeholder_id, p_role, v_actor_user_id, now(), true
  )
  ON CONFLICT (task_id, stakeholder_id, role)
  DO UPDATE SET is_active = true, released_at = NULL, assigned_at = now();

  INSERT INTO public.pm_task_events (
    task_id, project_id, event_type, actor_user_id, actor_stakeholder_id,
    from_state, to_state, reason, payload
  ) VALUES (
    p_task_id, v_task.project_id, 'reassigned',
    v_actor_user_id, v_actor_stakeholder_id,
    v_task.status, v_task.status, p_reason,
    jsonb_build_object('role', p_role, 'new_stakeholder_id', p_new_stakeholder_id)
  );

  RETURN jsonb_build_object('success', true, 'task_id', p_task_id, 'new_stakeholder_id', p_new_stakeholder_id);
END;
$$;

-- 5.4 DB-06c: public.rpc_replan_task(...)
CREATE OR REPLACE FUNCTION public.rpc_replan_task(
  p_task_id uuid,
  p_new_planned_start date,
  p_new_planned_finish date,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task RECORD;
  v_actor_user_id UUID := (SELECT auth.uid());
  v_actor_stakeholder_id UUID;
BEGIN
  IF NOT public.fn_is_system_or_service_role() THEN
    IF v_actor_user_id IS NULL OR public.fn_user_is_viewer_only(v_actor_user_id) THEN
      RAISE EXCEPTION 'FORBIDDEN: Read-only viewer or unauthenticated user cannot replan tasks';
    END IF;
    IF NOT public.fn_user_has_any_role_text(v_actor_user_id, ARRAY[
      'admin','ceo','coo','project_manager','planning_manager','planning_engineer'
    ]::text[]) THEN
      RAISE EXCEPTION 'FORBIDDEN: Only PM/planning/admin roles can replan tasks';
    END IF;
  END IF;

  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'REASON_REQUIRED: A valid reason is mandatory for replanning a task';
  END IF;

  SELECT * INTO v_task FROM public.pm_site_tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND: Task % does not exist', p_task_id;
  END IF;

  IF NOT public.fn_is_system_or_service_role()
     AND NOT public.fn_user_can_access_project(v_actor_user_id, v_task.project_id)
  THEN
    RAISE EXCEPTION 'FORBIDDEN: Access denied to project %', v_task.project_id;
  END IF;

  IF v_actor_user_id IS NOT NULL THEN
    SELECT id INTO v_actor_stakeholder_id FROM public.stakeholders WHERE auth_user_id = v_actor_user_id LIMIT 1;
  END IF;

  UPDATE public.pm_site_tasks
  SET
    planned_start_at = p_new_planned_start,
    planned_finish_at = p_new_planned_finish,
    due_date = p_new_planned_finish,
    revision = revision + 1,
    updated_at = now()
  WHERE id = p_task_id;

  INSERT INTO public.pm_task_events (
    task_id, project_id, event_type, actor_user_id, actor_stakeholder_id,
    from_state, to_state, reason, payload
  ) VALUES (
    p_task_id, v_task.project_id, 'replanned',
    v_actor_user_id, v_actor_stakeholder_id,
    v_task.status, v_task.status, p_reason,
    jsonb_build_object(
      'old_start', v_task.planned_start_at,
      'old_finish', v_task.planned_finish_at,
      'new_start', p_new_planned_start,
      'new_finish', p_new_planned_finish
    )
  );

  RETURN jsonb_build_object('success', true, 'task_id', p_task_id, 'revision', v_task.revision + 1);
END;
$$;

-- 5.5 DB-06d: public.rpc_create_inspection(...)
CREATE OR REPLACE FUNCTION public.rpc_create_inspection(
  p_task_id uuid,
  p_inspection_type text DEFAULT 'wir'::text,
  p_required_at timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task RECORD;
  v_actor_user_id UUID := (SELECT auth.uid());
  v_qc_stakeholder_id UUID;
  v_project_id UUID;
  v_count INT;
  v_new_request_no TEXT;
  v_inspection_id UUID;
  v_type_norm TEXT;
  v_prefix TEXT;
BEGIN
  IF NOT public.fn_is_system_or_service_role() THEN
    IF v_actor_user_id IS NULL OR public.fn_user_is_viewer_only(v_actor_user_id) THEN
      RAISE EXCEPTION 'FORBIDDEN: Read-only viewer or unauthenticated user cannot create inspection requests';
    END IF;
    IF NOT public.fn_user_has_any_role_text(v_actor_user_id, ARRAY[
      'admin','ceo','coo','project_manager','planning_manager','planning_engineer','site_engineer','qc_inspector'
    ]::text[]) THEN
      RAISE EXCEPTION 'FORBIDDEN: Insufficient role to create inspection request';
    END IF;
  END IF;

  SELECT * INTO v_task FROM public.pm_site_tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND: المهمة % غير موجودة', p_task_id;
  END IF;

  v_project_id := v_task.project_id;

  IF NOT public.fn_is_system_or_service_role()
     AND NOT public.fn_user_can_access_project(v_actor_user_id, v_project_id)
  THEN
    RAISE EXCEPTION 'FORBIDDEN: Access denied to project %', v_project_id;
  END IF;

  v_type_norm := CASE
    WHEN lower(p_inspection_type) = 'wir' THEN 'WIR'
    WHEN lower(p_inspection_type) = 'mir' THEN 'MIR'
    WHEN lower(p_inspection_type) = 'ncr' THEN 'NCR'
    ELSE lower(p_inspection_type)
  END;

  IF v_task.qc_stakeholder_id IS NOT NULL THEN
    v_qc_stakeholder_id := v_task.qc_stakeholder_id;
  ELSE
    SELECT ps.stakeholder_id INTO v_qc_stakeholder_id
    FROM public.project_stakeholders ps
    JOIN public.stakeholders s ON s.id = ps.stakeholder_id
    WHERE ps.project_id = v_project_id
      AND (ps.project_role = 'qc_inspector' OR s.role::text = 'qc_inspector')
    LIMIT 1;
  END IF;

  v_prefix := upper(v_type_norm);
  SELECT count(*) + 1 INTO v_count
  FROM public.pm_inspection_requests
  WHERE project_id = v_project_id;

  v_new_request_no := v_prefix || '-' || lpad(v_count::text, 4, '0');

  WHILE EXISTS (SELECT 1 FROM public.pm_inspection_requests WHERE project_id = v_project_id AND request_no = v_new_request_no) LOOP
    v_count := v_count + 1;
    v_new_request_no := v_prefix || '-' || lpad(v_count::text, 4, '0');
  END LOOP;

  INSERT INTO public.pm_inspection_requests (
    task_id, project_id, request_no, inspection_type,
    required_at, assigned_qc_id, status, created_by
  ) VALUES (
    p_task_id, v_project_id, v_new_request_no, v_type_norm,
    COALESCE(p_required_at::date, (now() + INTERVAL '1 day')::date),
    v_qc_stakeholder_id, 'pending', v_actor_user_id
  )
  RETURNING id INTO v_inspection_id;

  RETURN jsonb_build_object(
    'success', true,
    'inspection_id', v_inspection_id,
    'task_id', p_task_id,
    'request_no', v_new_request_no,
    'assigned_qc_id', v_qc_stakeholder_id,
    'inspection_type', v_type_norm
  );
END;
$$;

-- 5.6 DB-06e: public.rpc_deliverable_item_transition(...)
CREATE OR REPLACE FUNCTION public.rpc_deliverable_item_transition(
  p_item_id uuid,
  p_action text,
  p_reason text DEFAULT NULL::text,
  p_consultant_code text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item RECORD;
  v_project_id UUID;
  v_actor_user_id UUID := (SELECT auth.uid());
  v_actor_stakeholder_id UUID;
  v_from_state TEXT;
  v_to_state TEXT;
  v_is_to_manager BOOLEAN := false;
  v_is_to_engineer BOOLEAN := false;
  v_is_admin BOOLEAN := false;
BEGIN
  IF NOT public.fn_is_system_or_service_role() THEN
    IF v_actor_user_id IS NULL OR public.fn_user_is_viewer_only(v_actor_user_id) THEN
      RAISE EXCEPTION 'FORBIDDEN: Read-only viewer or unauthenticated user cannot transition deliverable items';
    END IF;
    IF NOT public.fn_user_has_any_role_text(v_actor_user_id, ARRAY[
      'admin','ceo','coo','to_manager','to_engineer','technical_office','planning_manager','project_manager'
    ]::text[]) THEN
      RAISE EXCEPTION 'FORBIDDEN: Insufficient role to transition deliverable items';
    END IF;
  END IF;

  SELECT * INTO v_item FROM public.pm_deliverable_items WHERE id = p_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ITEM_NOT_FOUND: التسليمة % غير موجودة', p_item_id;
  END IF;

  SELECT d.project_id INTO v_project_id
  FROM public.pm_deliverables d
  WHERE d.id = v_item.deliverable_id;

  IF NOT public.fn_is_system_or_service_role()
     AND NOT public.fn_user_can_access_project(v_actor_user_id, v_project_id)
  THEN
    RAISE EXCEPTION 'FORBIDDEN: Access denied to project %', v_project_id;
  END IF;

  v_from_state := v_item.status;

  IF NOT public.fn_is_system_or_service_role() THEN
    SELECT id INTO v_actor_stakeholder_id
    FROM public.stakeholders
    WHERE auth_user_id = v_actor_user_id
    LIMIT 1;

    v_is_admin := public.fn_user_has_any_role_text(v_actor_user_id, ARRAY['admin','ceo','coo']::text[]);
    v_is_to_manager := v_is_admin OR public.fn_user_has_any_role_text(v_actor_user_id, ARRAY[
      'to_manager', 'planning_manager', 'project_manager'
    ]::text[]);
    v_is_to_engineer := v_is_admin
      OR (v_actor_stakeholder_id IS NOT NULL AND v_actor_stakeholder_id = v_item.assigned_stakeholder_id)
      OR public.fn_user_has_any_role_text(v_actor_user_id, ARRAY['to_engineer','technical_office']::text[]);
  ELSE
    v_is_admin := true;
    v_is_to_manager := true;
    v_is_to_engineer := true;
  END IF;

  CASE p_action
    WHEN 'start_work' THEN
      IF v_from_state <> 'pending' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن بدء العمل من حالة "%"', v_from_state;
      END IF;
      IF NOT (v_is_to_engineer OR v_is_to_manager) THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط المهندس المعين أو مدير المكتب الفني';
      END IF;
      v_to_state := 'in_progress';

    WHEN 'submit_to_manager' THEN
      IF v_from_state <> 'in_progress' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن التقديم من حالة "%"', v_from_state;
      END IF;
      IF NOT (v_is_to_engineer OR v_is_to_manager) THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط المهندس المعين';
      END IF;
      v_to_state := 'ready_to_return';

    WHEN 'manager_approve' THEN
      IF v_from_state <> 'ready_to_return' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن الاعتماد من حالة "%"', v_from_state;
      END IF;
      IF NOT v_is_to_manager THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مدير المكتب الفني';
      END IF;
      v_to_state := 'returned';

    WHEN 'manager_reject' THEN
      IF v_from_state <> 'ready_to_return' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن الرفض من حالة "%"', v_from_state;
      END IF;
      IF NOT v_is_to_manager THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مدير المكتب الفني';
      END IF;
      IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'REASON_REQUIRED: سبب الرفض مطلوب';
      END IF;
      v_to_state := 'in_progress';

    WHEN 'record_consultant_code' THEN
      IF v_from_state <> 'returned' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن تسجيل رد الاستشاري من حالة "%"', v_from_state;
      END IF;
      IF NOT v_is_to_manager THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مدير المكتب الفني يسجل رد الاستشاري';
      END IF;
      IF p_consultant_code IS NULL OR p_consultant_code NOT IN ('A', 'B', 'C', 'D') THEN
        RAISE EXCEPTION 'INVALID_CODE: رمز الاستشاري يجب أن يكون A أو B أو C أو D';
      END IF;
      UPDATE public.pm_deliverable_items
      SET consultant_status = p_consultant_code, updated_at = now()
      WHERE id = p_item_id;

      INSERT INTO public.pm_deliverable_events (
        deliverable_id, deliverable_item_id, event_type,
        from_value, to_value, by_stakeholder_id, reason
      ) VALUES (
        v_item.deliverable_id, p_item_id, 'consultant_review',
        v_from_state, 'Code ' || p_consultant_code, v_actor_stakeholder_id,
        COALESCE(p_reason, 'Consultant Code ' || p_consultant_code)
      );

      RETURN jsonb_build_object(
        'success', true,
        'item_id', p_item_id,
        'action', p_action,
        'consultant_code', p_consultant_code
      );

    WHEN 'block' THEN
      IF v_from_state <> 'in_progress' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن حجب إلا من حالة "in_progress"';
      END IF;
      IF NOT (v_is_to_engineer OR v_is_to_manager) THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط المهندس المعين أو مدير المكتب الفني يمكنه الحجب';
      END IF;
      IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'REASON_REQUIRED: سبب الحجب مطلوب';
      END IF;
      v_to_state := 'blocked';

    WHEN 'unblock' THEN
      IF v_from_state <> 'blocked' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن فك الحجب إلا من حالة "blocked"';
      END IF;
      IF NOT v_is_to_manager THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مدير المكتب الفني يمكنه فك الحجب';
      END IF;
      v_to_state := 'in_progress';

    ELSE
      RAISE EXCEPTION 'UNKNOWN_ACTION: الإجراء "%" غير معروف', p_action;
  END CASE;

  UPDATE public.pm_deliverable_items
  SET
    status = v_to_state,
    to_manager_approved = CASE
      WHEN p_action = 'manager_approve' THEN true
      WHEN p_action = 'manager_reject' THEN false
      ELSE to_manager_approved
    END,
    to_manager_approved_at = CASE
      WHEN p_action = 'manager_approve' THEN now()
      ELSE to_manager_approved_at
    END,
    to_manager_approved_by = CASE
      WHEN p_action = 'manager_approve' THEN v_actor_stakeholder_id
      ELSE to_manager_approved_by
    END,
    completed_at = CASE
      WHEN p_action = 'submit_to_manager' THEN now()
      WHEN p_action = 'manager_reject' THEN NULL
      ELSE completed_at
    END,
    blocked_reason = CASE
      WHEN p_action = 'block' THEN p_reason
      WHEN p_action = 'unblock' THEN NULL
      ELSE blocked_reason
    END,
    blocked_since = CASE
      WHEN p_action = 'block' THEN now()
      WHEN p_action = 'unblock' THEN NULL
      ELSE blocked_since
    END,
    updated_at = now()
  WHERE id = p_item_id;

  INSERT INTO public.pm_deliverable_events (
    deliverable_id, deliverable_item_id, event_type,
    from_value, to_value, by_stakeholder_id, reason
  ) VALUES (
    v_item.deliverable_id, p_item_id,
    CASE p_action
      WHEN 'start_work' THEN 'status_change'
      WHEN 'submit_to_manager' THEN 'submitted_for_review'
      WHEN 'manager_approve' THEN 'manager_approved'
      WHEN 'manager_reject' THEN 'manager_rejected'
      WHEN 'block' THEN 'blocked'
      WHEN 'unblock' THEN 'unblock'
      ELSE p_action
    END,
    v_from_state, v_to_state, v_actor_stakeholder_id, p_reason
  );

  IF p_action = 'manager_reject' AND v_item.assigned_stakeholder_id IS NOT NULL THEN
    DECLARE v_eng_user UUID;
    BEGIN
      SELECT auth_user_id INTO v_eng_user FROM public.stakeholders WHERE id = v_item.assigned_stakeholder_id;
      IF v_eng_user IS NOT NULL THEN
        INSERT INTO public.pm_notifications (
          recipient_user_id, project_id, event_type, entity_type, entity_id,
          title_ar, body_ar, link_url, metadata
        ) VALUES (
          v_eng_user, v_project_id, 'deliverable_rejected', 'deliverable_item', p_item_id,
          'لوحتك مرفوضة — عدّلها',
          'تم رفض اللوحة: ' || COALESCE(v_item.description, v_item.sheet_number, 'غير محدد') || ' — السبب: ' || p_reason,
          '/to-progress',
          jsonb_build_object('item_id', p_item_id, 'action', p_action)
        );
      END IF;
    END;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'item_id', p_item_id,
    'from_state', v_from_state,
    'to_state', v_to_state,
    'action', p_action
  );
END;
$$;


-- 5.7 DB-06f: public.rpc_calculate_dual_evm(p_project_id uuid, p_persist boolean DEFAULT false)
CREATE OR REPLACE FUNCTION public.rpc_calculate_dual_evm(p_project_id uuid, p_persist boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_contract_bac numeric(18,2) := 0;
  v_dry_bac numeric(18,2) := 0;
  v_client_ev numeric(18,2) := 0;
  v_client_pv numeric(18,2) := 0;
  v_dry_ev numeric(18,2) := 0;
  v_committed numeric(18,2) := 0;
  v_mat_ac numeric(18,2) := 0;
  v_sub_ac numeric(18,2) := 0;
  v_ind_ac numeric(18,2) := 0;
  v_sunk_cost numeric(18,2) := 0;
  v_cutoff_date date := NULL;
  v_certified_ipc numeric(18,2) := 0;
  v_total_ac numeric(18,2) := 0;
  v_spi numeric(10,4) := 1.0;
  v_cpi numeric(10,4) := 1.0;
  v_sv numeric(18,2) := 0;
  v_cv numeric(18,2) := 0;
  v_eac numeric(18,2) := 0;
  v_etc numeric(18,2) := 0;
  v_vac numeric(18,2) := 0;
  v_tcpi numeric(10,4) := 1.0;
  v_unbilled_wip numeric(18,2) := 0;
BEGIN
  IF NOT public.fn_is_system_or_service_role() THEN
    IF v_uid IS NULL OR public.fn_user_is_viewer_only(v_uid) THEN
      RAISE EXCEPTION 'FORBIDDEN: Read-only viewer or unauthenticated user cannot execute EVM cache/snapshot write RPC';
    END IF;
    IF NOT (
      public.fn_user_can_access_project(v_uid, p_project_id)
      AND public.fn_user_can_see_prices(v_uid, p_project_id)
      AND public.fn_user_has_any_role_text(v_uid, ARRAY[
        'admin','ceo','coo','chairman','commercial_manager','cost_control','finance','estimator','project_manager','planning_manager'
      ]::text[])
    ) THEN
      RAISE EXCEPTION 'FORBIDDEN: price access and commercial/management role required for EVM calculation';
    END IF;
  END IF;

  SELECT cutoff_date, COALESCE(historical_sunk_cost_egp, 0)
    INTO v_cutoff_date, v_sunk_cost
  FROM public.pm_commercial_settings
  WHERE project_id = p_project_id;

  SELECT
    COALESCE(SUM(COALESCE(b.amount_egp, COALESCE(b.contract_qty, 0) * COALESCE(b.rate_egp, 0))), 0),
    COALESCE(SUM(
      CASE
        WHEN COALESCE(b.total_dry_cost_egp, 0) > 0 THEN b.total_dry_cost_egp
        ELSE COALESCE(b.amount_egp, COALESCE(b.contract_qty, 0) * COALESCE(b.rate_egp, 0)) * 0.82
      END
    ), 0)
  INTO v_contract_bac, v_dry_bac
  FROM public.pm_boq_items b
  WHERE b.project_id = p_project_id
    AND b.is_current = true
    AND b.is_active = true
    AND COALESCE(b.inclusion_status, 'base') IN ('base', 'optional_added');

  IF v_contract_bac = 0 THEN
    SELECT COALESCE(contract_value, 0) + COALESCE(vos_value, 0),
           COALESCE(NULLIF(estimated_cost, 0), NULLIF(estimated_budget, 0), (COALESCE(contract_value, 0) + COALESCE(vos_value, 0)) * 0.82)
      INTO v_contract_bac, v_dry_bac
    FROM public.projects
    WHERE id = p_project_id;
  END IF;

  SELECT
    COALESCE(SUM(l.qty_today * COALESCE(NULLIF(l.snapshot_rate_egp, 0), b.rate_egp, 0)), 0),
    COALESCE(SUM(
      l.qty_today * CASE
        WHEN COALESCE(b.dry_unit_cost_egp, 0) > 0 THEN b.dry_unit_cost_egp
        ELSE COALESCE(NULLIF(l.snapshot_rate_egp, 0), b.rate_egp, 0) * 0.82
      END
    ), 0)
  INTO v_client_ev, v_dry_ev
  FROM public.pm_daily_progress_lines l
  JOIN public.pm_daily_progress dp ON dp.id = l.daily_progress_id
  LEFT JOIN public.pm_boq_items b ON b.id = l.boq_item_id
  WHERE dp.project_id = p_project_id
    AND l.line_status = 'approved'
    AND COALESCE(l.is_material_on_site, false) = false;

  IF v_client_ev = 0 THEN
    SELECT COALESCE(SUM(COALESCE(a.budgeted_cost_egp, 0) * (COALESCE(a.percent_complete, 0) / 100.0)), 0)
      INTO v_client_ev
    FROM public.pm_project_activities a
    WHERE a.project_id = p_project_id AND a.is_active = true;

    IF v_contract_bac > 0 AND v_client_ev > 0 THEN
      v_dry_ev := ROUND(v_client_ev * (v_dry_bac / v_contract_bac), 2);
    END IF;
  END IF;

  SELECT COALESCE(SUM(
    CASE
      WHEN a.planned_finish IS NOT NULL AND CURRENT_DATE >= a.planned_finish THEN COALESCE(a.budgeted_cost_egp, 0)
      WHEN a.planned_start IS NOT NULL AND a.planned_finish IS NOT NULL AND CURRENT_DATE > a.planned_start THEN
        COALESCE(a.budgeted_cost_egp, 0) * LEAST(1.0,
          GREATEST(0.0, (CURRENT_DATE - a.planned_start)::numeric / GREATEST(1, (a.planned_finish - a.planned_start))::numeric)
        )
      ELSE 0
    END
  ), 0)
  INTO v_client_pv
  FROM public.pm_project_activities a
  WHERE a.project_id = p_project_id AND a.is_active = true;

  SELECT COALESCE(SUM(po.total_gross_egp), 0)
    INTO v_committed
  FROM public.pm_purchase_orders po
  WHERE po.project_id = p_project_id
    AND po.status IN ('approved', 'partially_received', 'closed');

  SELECT v_committed + COALESCE(SUM(sp.contract_value_egp), 0)
    INTO v_committed
  FROM public.pm_subcontract_packages sp
  WHERE sp.project_id = p_project_id
    AND sp.status IN ('active', 'completed');

  SELECT COALESCE(SUM(
    CASE
      WHEN mt.tx_type IN ('issue_to_site', 'waste_writeoff') THEN
        mt.qty * COALESCE(mt.unit_cost_egp, sm.last_purchase_price, 0)
      WHEN mt.tx_type = 'return_to_store' THEN
        -1 * mt.qty * COALESCE(mt.unit_cost_egp, sm.last_purchase_price, 0)
      ELSE 0
    END
  ), 0)
  INTO v_mat_ac
  FROM public.pm_material_transactions mt
  LEFT JOIN public.pm_boq_sub_materials sm ON sm.id = mt.sub_material_id
  WHERE mt.project_id = p_project_id
    AND (v_cutoff_date IS NULL OR mt.tx_date > v_cutoff_date);

  SELECT COALESCE(SUM(sil.gross_amount_egp - COALESCE(sil.material_deduction_egp, 0)), 0)
    INTO v_sub_ac
  FROM public.pm_subcontract_ipc_lines sil
  WHERE sil.project_id = p_project_id
    AND sil.status IN ('certified', 'approved', 'paid')
    AND (v_cutoff_date IS NULL OR sil.period_date > v_cutoff_date);

  SELECT COALESCE(SUM(sie.amount_egp), 0)
    INTO v_ind_ac
  FROM public.pm_site_indirect_expenses sie
  WHERE sie.project_id = p_project_id
    AND sie.status = 'approved'
    AND (v_cutoff_date IS NULL OR sie.expense_date > v_cutoff_date);

  v_total_ac := GREATEST(0, ROUND(COALESCE(v_sunk_cost, 0) + v_mat_ac + v_sub_ac + v_ind_ac, 2));

  IF v_total_ac = 0 THEN
    SELECT COALESCE(SUM(actual_cost), 0)
      INTO v_total_ac
    FROM public.pm_budget_lines
    WHERE project_id = p_project_id;
  END IF;

  SELECT COALESCE(SUM(current_certified), 0)
    INTO v_certified_ipc
  FROM public.pm_ipc_certificates
  WHERE project_id = p_project_id
    AND status IN ('certified', 'paid');

  v_unbilled_wip := ROUND(GREATEST(0, v_client_ev - v_certified_ipc), 2);

  IF v_client_pv > 0 THEN
    v_spi := ROUND(v_client_ev / v_client_pv, 4);
  END IF;
  v_sv := ROUND(v_client_ev - v_client_pv, 2);

  IF v_total_ac > 0 THEN
    v_cpi := ROUND(v_dry_ev / v_total_ac, 4);
  END IF;
  v_cv := ROUND(v_dry_ev - v_total_ac, 2);

  IF v_cpi > 0 THEN
    v_eac := ROUND(v_dry_bac / v_cpi, 2);
  ELSIF v_total_ac > 0 THEN
    v_eac := ROUND(v_total_ac + GREATEST(0, v_dry_bac - v_dry_ev), 2);
  ELSE
    v_eac := v_dry_bac;
  END IF;

  v_etc := ROUND(GREATEST(0, v_eac - v_total_ac), 2);
  v_vac := ROUND(v_dry_bac - v_eac, 2);

  IF (v_dry_bac - v_total_ac) > 0 THEN
    v_tcpi := ROUND((v_dry_bac - v_dry_ev) / (v_dry_bac - v_total_ac), 4);
  END IF;

  INSERT INTO public.pm_project_cost_summary_cache (
    project_id, contract_bac_egp, internal_dry_bac_egp,
    committed_po_egp, committed_subcontract_egp,
    actual_material_egp, actual_subcontract_egp, actual_indirect_egp,
    historical_sunk_egp, earned_client_egp, earned_dry_egp, certified_ipc_egp, updated_at
  ) VALUES (
    p_project_id, v_contract_bac, v_dry_bac,
    v_committed, 0,
    v_mat_ac, v_sub_ac, v_ind_ac,
    COALESCE(v_sunk_cost, 0), v_client_ev, v_dry_ev, v_certified_ipc, now()
  )
  ON CONFLICT (project_id) DO UPDATE SET
    contract_bac_egp = EXCLUDED.contract_bac_egp,
    internal_dry_bac_egp = EXCLUDED.internal_dry_bac_egp,
    committed_po_egp = EXCLUDED.committed_po_egp,
    actual_material_egp = EXCLUDED.actual_material_egp,
    actual_subcontract_egp = EXCLUDED.actual_subcontract_egp,
    actual_indirect_egp = EXCLUDED.actual_indirect_egp,
    historical_sunk_egp = EXCLUDED.historical_sunk_egp,
    earned_client_egp = EXCLUDED.earned_client_egp,
    earned_dry_egp = EXCLUDED.earned_dry_egp,
    certified_ipc_egp = EXCLUDED.certified_ipc_egp,
    updated_at = now();

  IF p_persist THEN
    INSERT INTO public.pm_cost_snapshots (
      project_id, snapshot_date,
      budget_at_completion, actual_cost, earned_value, planned_value,
      spi, cpi, sv, cv, eac, etc, vac, tcpi,
      committed_cost, client_bac_egp, client_ev_egp, client_pv_egp,
      internal_bac_dry_egp, internal_ev_dry_egp, internal_ac_egp,
      historical_sunk_cost_egp, unbilled_wip_egp
    ) VALUES (
      p_project_id, CURRENT_DATE,
      v_contract_bac, v_total_ac, v_client_ev, v_client_pv,
      v_spi, v_cpi, v_sv, v_cv, v_eac, v_etc, v_vac, v_tcpi,
      v_committed, v_contract_bac, v_client_ev, v_client_pv,
      v_dry_bac, v_dry_ev, v_total_ac,
      COALESCE(v_sunk_cost, 0), v_unbilled_wip
    )
    ON CONFLICT (project_id, snapshot_date) DO UPDATE SET
      budget_at_completion = EXCLUDED.budget_at_completion,
      actual_cost = EXCLUDED.actual_cost,
      earned_value = EXCLUDED.earned_value,
      planned_value = EXCLUDED.planned_value,
      spi = EXCLUDED.spi,
      cpi = EXCLUDED.cpi,
      sv = EXCLUDED.sv,
      cv = EXCLUDED.cv,
      eac = EXCLUDED.eac,
      etc = EXCLUDED.etc,
      vac = EXCLUDED.vac,
      tcpi = EXCLUDED.tcpi,
      committed_cost = EXCLUDED.committed_cost,
      client_bac_egp = EXCLUDED.client_bac_egp,
      client_ev_egp = EXCLUDED.client_ev_egp,
      client_pv_egp = EXCLUDED.client_pv_egp,
      internal_bac_dry_egp = EXCLUDED.internal_bac_dry_egp,
      internal_ev_dry_egp = EXCLUDED.internal_ev_dry_egp,
      internal_ac_egp = EXCLUDED.internal_ac_egp,
      historical_sunk_cost_egp = EXCLUDED.historical_sunk_cost_egp,
      unbilled_wip_egp = EXCLUDED.unbilled_wip_egp;
  END IF;

  RETURN jsonb_build_object(
    'project_id', p_project_id,
    'snapshot_date', CURRENT_DATE,
    'client_billing', jsonb_build_object(
      'bac_egp', v_contract_bac,
      'pv_egp', v_client_pv,
      'ev_egp', v_client_ev,
      'certified_ipc_egp', v_certified_ipc,
      'unbilled_wip_egp', v_unbilled_wip,
      'spi', v_spi,
      'sv_egp', v_sv
    ),
    'internal_cost', jsonb_build_object(
      'bac_dry_egp', v_dry_bac,
      'ev_dry_egp', v_dry_ev,
      'committed_egp', v_committed,
      'actual_cost_egp', v_total_ac,
      'historical_sunk_egp', COALESCE(v_sunk_cost, 0),
      'cpi', v_cpi,
      'cv_egp', v_cv,
      'eac_egp', v_eac,
      'etc_egp', v_etc,
      'vac_egp', v_vac,
      'tcpi', v_tcpi
    ),
    'cutoff', jsonb_build_object(
      'is_active', (v_cutoff_date IS NOT NULL),
      'cutoff_date', v_cutoff_date,
      'historical_sunk_cost_egp', COALESCE(v_sunk_cost, 0)
    )
  );
END;
$$;

-- 5.8 DB-06g: public.rpc_sync_project_budget_from_boq(p_project_id uuid)
CREATE OR REPLACE FUNCTION public.rpc_sync_project_budget_from_boq(p_project_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_upserted integer := 0;
BEGIN
  IF NOT public.fn_is_system_or_service_role() THEN
    IF v_uid IS NULL OR public.fn_user_is_viewer_only(v_uid) THEN
      RAISE EXCEPTION 'FORBIDDEN: Read-only viewer or unauthenticated user cannot sync project budgets';
    END IF;
    IF NOT (
      public.fn_user_can_access_project(v_uid, p_project_id)
      AND public.fn_user_can_see_prices(v_uid, p_project_id)
      AND public.fn_user_has_any_role_text(v_uid, ARRAY[
        'admin','ceo','coo','commercial_manager','cost_control','finance','estimator','project_manager','planning_manager'
      ]::text[])
    ) THEN
      RAISE EXCEPTION 'FORBIDDEN: insufficient permissions to sync project budget';
    END IF;
  END IF;

  WITH boq_by_cc AS (
    SELECT
      b.cost_code_id,
      COALESCE(MAX(cc.name_ar), 'بند تكلفة') AS desc_ar,
      MAX(cc.name_en) AS desc_en,
      SUM(
        CASE
          WHEN COALESCE(b.total_dry_cost_egp, 0) > 0 THEN b.total_dry_cost_egp
          ELSE COALESCE(b.amount_egp, COALESCE(b.contract_qty, 0) * COALESCE(b.rate_egp, 0))
        END
      ) AS orig_budget
    FROM public.pm_boq_items b
    JOIN public.pm_cost_codes cc ON cc.id = b.cost_code_id
    WHERE b.project_id = p_project_id
      AND b.is_current = true
      AND b.is_active = true
      AND COALESCE(b.inclusion_status, 'base') IN ('base', 'optional_added')
      AND b.cost_code_id IS NOT NULL
    GROUP BY b.cost_code_id
  ),
  vo_by_cc AS (
    SELECT vl.cost_code_id, SUM(COALESCE(vl.amount_delta_egp, 0)) AS vo_delta
    FROM public.pm_variation_order_lines vl
    JOIN public.pm_variation_orders vo ON vo.id = vl.vo_id
    WHERE vl.project_id = p_project_id AND vo.status = 'approved' AND vl.cost_code_id IS NOT NULL
    GROUP BY vl.cost_code_id
  ),
  comm_po AS (
    SELECT pol.cost_code_id, SUM(COALESCE(pol.line_total_egp, 0)) AS po_committed
    FROM public.pm_purchase_order_lines pol
    JOIN public.pm_purchase_orders po ON po.id = pol.po_id
    WHERE pol.project_id = p_project_id AND po.status IN ('approved', 'partially_received', 'closed') AND pol.cost_code_id IS NOT NULL
    GROUP BY pol.cost_code_id
  ),
  comm_sub AS (
    SELECT sp.cost_code_id, SUM(COALESCE(sp.contract_value_egp, 0)) AS sub_committed
    FROM public.pm_subcontract_packages sp
    WHERE sp.project_id = p_project_id AND sp.status IN ('active', 'completed') AND sp.cost_code_id IS NOT NULL
    GROUP BY sp.cost_code_id
  ),
  act_sub AS (
    SELECT sil.cost_code_id, SUM(COALESCE(sil.gross_amount_egp, 0) - COALESCE(sil.material_deduction_egp, 0)) AS sub_actual
    FROM public.pm_subcontract_ipc_lines sil
    WHERE sil.project_id = p_project_id AND sil.status IN ('certified', 'approved', 'paid') AND sil.cost_code_id IS NOT NULL
    GROUP BY sil.cost_code_id
  ),
  act_ind AS (
    SELECT sie.cost_code_id, SUM(COALESCE(sie.amount_egp, 0)) AS ind_actual
    FROM public.pm_site_indirect_expenses sie
    WHERE sie.project_id = p_project_id AND sie.status = 'approved' AND sie.cost_code_id IS NOT NULL
    GROUP BY sie.cost_code_id
  ),
  merged AS (
    SELECT
      bc.cost_code_id,
      bc.desc_ar,
      bc.desc_en,
      ROUND(COALESCE(bc.orig_budget, 0), 2) AS orig_budget,
      ROUND(COALESCE(vc.vo_delta, 0), 2) AS app_changes,
      ROUND(COALESCE(cp.po_committed, 0) + COALESCE(cs.sub_committed, 0), 2) AS committed_total,
      ROUND(COALESCE(asu.sub_actual, 0) + COALESCE(ai.ind_actual, 0), 2) AS actual_total
    FROM boq_by_cc bc
    LEFT JOIN vo_by_cc vc ON vc.cost_code_id = bc.cost_code_id
    LEFT JOIN comm_po cp ON cp.cost_code_id = bc.cost_code_id
    LEFT JOIN comm_sub cs ON cs.cost_code_id = bc.cost_code_id
    LEFT JOIN act_sub asu ON asu.cost_code_id = bc.cost_code_id
    LEFT JOIN act_ind ai ON ai.cost_code_id = bc.cost_code_id
  ),
  upserted_rows AS (
    INSERT INTO public.pm_budget_lines (
      project_id, cost_code_id, description_ar, description_en,
      original_budget, approved_changes, committed_cost, actual_cost, forecast_cost
    )
    SELECT
      p_project_id, m.cost_code_id, m.desc_ar, m.desc_en,
      m.orig_budget, m.app_changes, m.committed_total, m.actual_total,
      GREATEST(m.orig_budget + m.app_changes, m.committed_total, m.actual_total)
    FROM merged m
    ON CONFLICT (project_id, cost_code_id) DO UPDATE
    SET
      description_ar = EXCLUDED.description_ar,
      description_en = EXCLUDED.description_en,
      original_budget = EXCLUDED.original_budget,
      approved_changes = EXCLUDED.approved_changes,
      committed_cost = EXCLUDED.committed_cost,
      actual_cost = EXCLUDED.actual_cost,
      forecast_cost = EXCLUDED.forecast_cost,
      updated_at = now()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_upserted FROM upserted_rows;

  RETURN jsonb_build_object(
    'project_id', p_project_id,
    'synced_lines', v_upserted
  );
END;
$$;

-- 5.9 Harden additional SECURITY DEFINER helpers (fn_get_project_role_users, rpc_get_boq_items_secure, rpc_mark_notifications_read)
CREATE OR REPLACE FUNCTION public.fn_get_project_role_users(p_project_id uuid, p_roles text[])
RETURNS TABLE(auth_user_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.fn_is_system_or_service_role()
     AND NOT public.fn_user_can_access_project((SELECT auth.uid()), p_project_id)
  THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT s.auth_user_id
  FROM public.project_stakeholders ps
  JOIN public.stakeholders s ON s.id = ps.stakeholder_id
  WHERE ps.project_id = p_project_id
    AND s.auth_user_id IS NOT NULL
    AND (
      ('project_manager' = ANY(p_roles) AND ps.raci_role = 'accountable')
      OR ps.project_role = ANY(p_roles)
      OR s.role::text = ANY(p_roles)
    )
  UNION
  SELECT DISTINCT upa.user_id AS auth_user_id
  FROM public.pm_user_project_access upa
  JOIN public.user_roles ur ON ur.user_id = upa.user_id
  WHERE upa.project_id = p_project_id
    AND ur.role::text = ANY(p_roles);
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_mark_notifications_read(p_notification_ids uuid[] DEFAULT NULL::uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_updated_count INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User must be authenticated';
  END IF;

  IF public.fn_user_is_viewer_only(v_user_id) THEN
    RAISE EXCEPTION 'READ_ONLY_VIEWER: Read-only viewer cannot mutate notifications';
  END IF;

  IF p_notification_ids IS NOT NULL AND array_length(p_notification_ids, 1) > 0 THEN
    UPDATE public.pm_notifications
    SET read_at = now()
    WHERE recipient_user_id = v_user_id
      AND id = ANY(p_notification_ids)
      AND read_at IS NULL;
  ELSE
    UPDATE public.pm_notifications
    SET read_at = now()
    WHERE recipient_user_id = v_user_id
      AND read_at IS NULL;
  END IF;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_get_boq_items_secure(p_project_id uuid, p_only_current boolean DEFAULT true)
RETURNS SETOF v_boq_items_secure
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_can_price boolean;
BEGIN
  IF NOT public.fn_is_system_or_service_role()
     AND NOT public.fn_user_can_access_project(v_uid, p_project_id)
  THEN
    RETURN;
  END IF;

  v_can_price := public.fn_is_system_or_service_role()
                 OR public.fn_user_can_see_prices(v_uid, p_project_id);

  RETURN QUERY
  SELECT
    b.id, b.project_id, b.section_id, b.zone_id, b.item_code, b.cost_code_id, b.wbs_item_id,
    b.description_ar, b.description_en, b.unit, b.item_type, b.contract_qty, b.shop_drawing_qty,
    b.takeoff_qty, b.takeoff_unit, b.geometry_overlap_factor, b.discipline_tag, b.pricing_status,
    b.foreign_currency,
    CASE WHEN v_can_price THEN b.base_foreign_amount ELSE NULL END,
    CASE WHEN v_can_price THEN b.rate_egp ELSE NULL END,
    CASE WHEN v_can_price THEN b.amount_egp ELSE NULL END,
    CASE WHEN v_can_price THEN b.dry_unit_cost_egp ELSE NULL END,
    CASE WHEN v_can_price THEN b.total_dry_cost_egp ELSE NULL END,
    CASE WHEN v_can_price THEN b.loaded_cost_egp ELSE NULL END,
    CASE WHEN v_can_price THEN b.target_margin_pct ELSE NULL END,
    b.sort_order, b.notes, b.is_active, b.revision, b.is_current, b.vo_ref, b.building_tag,
    b.group_tag, b.inclusion_status, b.inclusion_reason, b.inclusion_changed_at, b.inclusion_changed_by,
    b.row_version, b.created_at, b.updated_at
  FROM public.pm_boq_items b
  WHERE b.project_id = p_project_id
    AND (NOT p_only_current OR b.is_current = true)
  ORDER BY b.sort_order ASC, b.item_code ASC;
END;
$$;

-- 5.10 DB-07: Harden INSTEAD OF triggers on public.pm_projects (trg_pm_projects_insert / update / delete)
CREATE OR REPLACE FUNCTION public.trg_pm_projects_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF NOT public.fn_is_system_or_service_role() THEN
    IF v_uid IS NULL OR public.fn_user_is_viewer_only(v_uid) THEN
      RAISE EXCEPTION 'FORBIDDEN: Read-only viewer or unauthenticated user cannot delete projects';
    END IF;
    IF NOT public.fn_user_can_access_project(v_uid, OLD.id)
       OR NOT public.fn_user_has_any_role_text(v_uid, ARRAY['admin','ceo','coo','commercial_manager']::text[])
    THEN
      RAISE EXCEPTION 'FORBIDDEN: Only executive/commercial management can archive or delete projects';
    END IF;
  END IF;

  UPDATE public.projects
  SET deleted_at = NOW()
  WHERE id = OLD.id;

  RETURN OLD;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_pm_projects_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  new_proj_id UUID;
  res public.pm_projects%ROWTYPE;
BEGIN
  IF NOT public.fn_is_system_or_service_role() THEN
    IF v_uid IS NULL OR public.fn_user_is_viewer_only(v_uid) THEN
      RAISE EXCEPTION 'FORBIDDEN: Read-only viewer or unauthenticated user cannot create projects';
    END IF;
    IF NOT public.fn_user_has_any_role_text(v_uid, ARRAY[
      'admin','ceo','coo','coo_assistant','commercial_manager','planning_manager','project_manager'
    ]::text[]) THEN
      RAISE EXCEPTION 'FORBIDDEN: Insufficient role to create projects';
    END IF;
  END IF;

  INSERT INTO public.projects (
    id, name_ar, name_en, public_name, code, client_id, status,
    planned_start, planned_finish, actual_start, actual_finish,
    location, description, contract_type, contract_value, vos_value, completion_pct,
    project_manager_stakeholder_id, gps_lat, gps_lng, water_area_m2, water_vol_m3,
    site_location_address, pzone_role, client_name_raw, project_manager_name_raw,
    governorate_id, city_id, contract_status, hardcopy_status, contract_date,
    contract_duration_months, estimated_budget, estimated_cost,
    site_possession_letter, toc_letter, cover_image_url, metadata, deleted_at,
    created_at, updated_at
  ) VALUES (
    COALESCE(NEW.id, gen_random_uuid()),
    COALESCE(NEW.name_ar, NEW.project_name, NEW.project_name_ar, NEW.name, 'مشروع جديد'),
    COALESCE(NEW.name_en, NEW.project_name_en),
    NEW.public_name,
    COALESCE(NEW.code, NEW.project_code),
    NEW.client_id,
    COALESCE(NEW.status, 'working'),
    COALESCE(NEW.planned_start, NEW.planned_start_date, NEW.start_date),
    COALESCE(NEW.planned_finish, NEW.planned_finish_date, NEW.end_date),
    COALESCE(NEW.actual_start, NEW.actual_start_date),
    COALESCE(NEW.actual_finish, NEW.actual_finish_date),
    NEW.location,
    NEW.description,
    NEW.contract_type,
    COALESCE(NEW.contract_value, NEW.contract_value_egp, 0),
    COALESCE(NEW.vos_value, 0),
    COALESCE(NEW.completion_pct, 0),
    COALESCE(NEW.project_manager_stakeholder_id, NEW.project_manager_id, NEW.pm_stakeholder_id),
    COALESCE(NEW.gps_lat, NEW.latitude),
    COALESCE(NEW.gps_lng, NEW.longitude),
    COALESCE(NEW.water_area_m2, 0),
    COALESCE(NEW.water_vol_m3, 0),
    NEW.site_location_address,
    COALESCE(NEW.pzone_role, 'Sub Contractor'),
    NEW.client_name_raw,
    NEW.project_manager_name_raw,
    NEW.governorate_id,
    NEW.city_id,
    NEW.contract_status,
    NEW.hardcopy_status,
    NEW.contract_date,
    NEW.contract_duration_months,
    NEW.estimated_budget,
    NEW.estimated_cost,
    NEW.site_possession_letter,
    NEW.toc_letter,
    NEW.cover_image_url,
    COALESCE(NEW.metadata, '{}'::jsonb),
    NEW.deleted_at,
    NOW(),
    NOW()
  ) RETURNING id INTO new_proj_id;

  SELECT * INTO res FROM public.pm_projects WHERE id = new_proj_id;
  RETURN res;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_pm_projects_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  res public.pm_projects%ROWTYPE;
BEGIN
  IF NOT public.fn_is_system_or_service_role() THEN
    IF v_uid IS NULL OR public.fn_user_is_viewer_only(v_uid) THEN
      RAISE EXCEPTION 'FORBIDDEN: Read-only viewer or unauthenticated user cannot modify projects';
    END IF;
    IF NOT public.fn_user_can_access_project(v_uid, OLD.id)
       OR NOT public.fn_user_has_any_role_text(v_uid, ARRAY[
         'admin','ceo','coo','coo_assistant','commercial_manager','planning_manager','project_manager'
       ]::text[])
    THEN
      RAISE EXCEPTION 'FORBIDDEN: Insufficient role or project access to modify project %', OLD.id;
    END IF;
  END IF;

  UPDATE public.projects
  SET
    name_ar = CASE
      WHEN NEW.name_ar IS DISTINCT FROM OLD.name_ar THEN NEW.name_ar
      WHEN NEW.project_name IS DISTINCT FROM OLD.project_name THEN NEW.project_name
      WHEN NEW.project_name_ar IS DISTINCT FROM OLD.project_name_ar THEN NEW.project_name_ar
      WHEN NEW.name IS DISTINCT FROM OLD.name THEN NEW.name
      ELSE projects.name_ar
    END,
    name_en = CASE
      WHEN NEW.name_en IS DISTINCT FROM OLD.name_en THEN NEW.name_en
      WHEN NEW.project_name_en IS DISTINCT FROM OLD.project_name_en THEN NEW.project_name_en
      ELSE projects.name_en
    END,
    public_name = CASE
      WHEN NEW.public_name IS DISTINCT FROM OLD.public_name THEN NEW.public_name
      ELSE projects.public_name
    END,
    code = CASE
      WHEN NEW.code IS DISTINCT FROM OLD.code THEN NEW.code
      WHEN NEW.project_code IS DISTINCT FROM OLD.project_code THEN NEW.project_code
      ELSE projects.code
    END,
    client_id = NEW.client_id,
    status = NEW.status,
    planned_start = COALESCE(
      CASE WHEN NEW.planned_start IS DISTINCT FROM OLD.planned_start THEN NEW.planned_start ELSE NULL END,
      CASE WHEN NEW.planned_start_date IS DISTINCT FROM OLD.planned_start_date THEN NEW.planned_start_date ELSE NULL END,
      CASE WHEN NEW.start_date IS DISTINCT FROM OLD.start_date THEN NEW.start_date ELSE NULL END,
      NEW.planned_start, NEW.planned_start_date, NEW.start_date
    ),
    planned_finish = COALESCE(
      CASE WHEN NEW.planned_finish IS DISTINCT FROM OLD.planned_finish THEN NEW.planned_finish ELSE NULL END,
      CASE WHEN NEW.planned_finish_date IS DISTINCT FROM OLD.planned_finish_date THEN NEW.planned_finish_date ELSE NULL END,
      CASE WHEN NEW.end_date IS DISTINCT FROM OLD.end_date THEN NEW.end_date ELSE NULL END,
      NEW.planned_finish, NEW.planned_finish_date, NEW.end_date
    ),
    actual_start = COALESCE(
      CASE WHEN NEW.actual_start IS DISTINCT FROM OLD.actual_start THEN NEW.actual_start ELSE NULL END,
      CASE WHEN NEW.actual_start_date IS DISTINCT FROM OLD.actual_start_date THEN NEW.actual_start_date ELSE NULL END,
      NEW.actual_start, NEW.actual_start_date
    ),
    actual_finish = COALESCE(
      CASE WHEN NEW.actual_finish IS DISTINCT FROM OLD.actual_finish THEN NEW.actual_finish ELSE NULL END,
      CASE WHEN NEW.actual_finish_date IS DISTINCT FROM OLD.actual_finish_date THEN NEW.actual_finish_date ELSE NULL END,
      NEW.actual_finish, NEW.actual_finish_date
    ),
    location = NEW.location,
    description = NEW.description,
    contract_type = NEW.contract_type,
    contract_value = COALESCE(NEW.contract_value, NEW.contract_value_egp, projects.contract_value),
    vos_value = COALESCE(NEW.vos_value, projects.vos_value),
    suspension_reason = COALESCE(
      CASE WHEN NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason THEN NEW.suspension_reason ELSE NULL END,
      CASE WHEN NEW.hold_reason IS DISTINCT FROM OLD.hold_reason THEN NEW.hold_reason ELSE NULL END,
      NEW.suspension_reason, NEW.hold_reason
    ),
    suspended_at = NEW.suspended_at,
    suspended_by = NEW.suspended_by,
    resumed_at = NEW.resumed_at,
    resumed_by = NEW.resumed_by,
    cancellation_reason = COALESCE(
      CASE WHEN NEW.cancellation_reason IS DISTINCT FROM OLD.cancellation_reason THEN NEW.cancellation_reason ELSE NULL END,
      CASE WHEN NEW.cancel_reason IS DISTINCT FROM OLD.cancel_reason THEN NEW.cancel_reason ELSE NULL END,
      NEW.cancellation_reason, NEW.cancel_reason
    ),
    cancelled_at = NEW.cancelled_at,
    cancelled_by = NEW.cancelled_by,
    completion_pct = COALESCE(NEW.completion_pct, projects.completion_pct),
    project_manager_stakeholder_id = COALESCE(
      CASE WHEN NEW.project_manager_stakeholder_id IS DISTINCT FROM OLD.project_manager_stakeholder_id THEN NEW.project_manager_stakeholder_id ELSE NULL END,
      CASE WHEN NEW.project_manager_id IS DISTINCT FROM OLD.project_manager_id THEN NEW.project_manager_id ELSE NULL END,
      CASE WHEN NEW.pm_stakeholder_id IS DISTINCT FROM OLD.pm_stakeholder_id THEN NEW.pm_stakeholder_id ELSE NULL END,
      NEW.project_manager_stakeholder_id, NEW.project_manager_id, NEW.pm_stakeholder_id
    ),
    gps_lat = COALESCE(
      CASE WHEN NEW.gps_lat IS DISTINCT FROM OLD.gps_lat THEN NEW.gps_lat ELSE NULL END,
      CASE WHEN NEW.latitude IS DISTINCT FROM OLD.latitude THEN NEW.latitude ELSE NULL END,
      NEW.gps_lat, NEW.latitude
    ),
    gps_lng = COALESCE(
      CASE WHEN NEW.gps_lng IS DISTINCT FROM OLD.gps_lng THEN NEW.gps_lng ELSE NULL END,
      CASE WHEN NEW.longitude IS DISTINCT FROM OLD.longitude THEN NEW.longitude ELSE NULL END,
      NEW.gps_lng, NEW.longitude
    ),
    water_area_m2 = COALESCE(NEW.water_area_m2, projects.water_area_m2),
    water_vol_m3 = COALESCE(NEW.water_vol_m3, projects.water_vol_m3),
    site_location_address = NEW.site_location_address,
    pzone_role = COALESCE(NEW.pzone_role, projects.pzone_role),
    client_name_raw = NEW.client_name_raw,
    project_manager_name_raw = NEW.project_manager_name_raw,
    governorate_id = NEW.governorate_id,
    city_id = NEW.city_id,
    contract_status = NEW.contract_status,
    hardcopy_status = NEW.hardcopy_status,
    contract_date = NEW.contract_date,
    contract_duration_months = NEW.contract_duration_months,
    estimated_budget = NEW.estimated_budget,
    estimated_cost = NEW.estimated_cost,
    site_possession_letter = NEW.site_possession_letter,
    toc_letter = NEW.toc_letter,
    cover_image_url = NEW.cover_image_url,
    metadata = COALESCE(NEW.metadata, projects.metadata),
    deleted_at = NEW.deleted_at,
    updated_at = NOW()
  WHERE id = OLD.id;

  SELECT * INTO res FROM public.pm_projects WHERE id = OLD.id;
  RETURN res;
END;
$$;

-- =============================================================================
-- SECTION 9 (DB-10 & DB-11): MUTABLE search_path FIXES, REVOKE PUBLIC/anon EXECUTE,
-- AND REVOKE TRUNCATE / ANON TABLE PRIVILEGES
-- =============================================================================

-- 9.1 DB-11: Fix all 9 functions with mutable search_path
ALTER FUNCTION public.update_updated_at() SET search_path = public;
ALTER FUNCTION public.enforce_project_status_rules() SET search_path = public;
ALTER FUNCTION public.enforce_daily_report_workflow() SET search_path = public;
ALTER FUNCTION public.enforce_lumpsum_monotonic() SET search_path = public;
ALTER FUNCTION public.update_activity_progress() SET search_path = public;
ALTER FUNCTION public.fn_milestone_sum_guard() SET search_path = public;
ALTER FUNCTION public.get_next_project_code() SET search_path = public;
ALTER FUNCTION public.pm_schedule_versions_touch() SET search_path = public;
ALTER FUNCTION public.fn_guard_system_cost_codes() SET search_path = public;

-- 9.1b DB-08b: Masked View Backing Functions for v_boq_current & v_boq_items_secure
-- Keeps security_invoker = true on both views (0 security_definer_view lints) while ensuring
-- active non-price project members (e.g. site_engineer / technical_office / ungranted viewer)
-- receive masked BOQ rows via v_boq_current / v_boq_items_secure and 0 unmasked rows on pm_boq_items.
CREATE OR REPLACE FUNCTION public.fn_boq_current_rows()
RETURNS TABLE (
  id uuid,
  project_id uuid,
  item_code text,
  cost_code_id uuid,
  cost_code text,
  cost_code_name_ar text,
  description_ar text,
  description_en text,
  unit text,
  contract_qty numeric,
  shop_drawing_qty numeric,
  pricing_status text,
  foreign_currency text,
  base_foreign_amount numeric,
  rate_egp numeric,
  amount_egp numeric,
  wbs_item_id uuid,
  wbs_title_ar text,
  revision integer,
  is_current boolean,
  vo_ref text,
  total_installed_qty numeric,
  total_earned_egp numeric,
  qty_completion_pct numeric,
  notes text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_is_sys boolean := public.fn_is_system_or_service_role();
BEGIN
  IF v_uid IS NULL AND NOT v_is_sys THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.project_id,
    b.item_code,
    b.cost_code_id,
    c.code AS cost_code,
    c.name_ar AS cost_code_name_ar,
    b.description_ar,
    b.description_en,
    b.unit,
    b.contract_qty,
    b.shop_drawing_qty,
    b.pricing_status,
    b.foreign_currency,
    CASE
      WHEN v_is_sys OR public.fn_user_can_see_prices(v_uid, b.project_id) THEN b.base_foreign_amount
      ELSE NULL::numeric
    END AS base_foreign_amount,
    CASE
      WHEN v_is_sys OR public.fn_user_can_see_prices(v_uid, b.project_id) THEN b.rate_egp
      ELSE NULL::numeric
    END AS rate_egp,
    CASE
      WHEN v_is_sys OR public.fn_user_can_see_prices(v_uid, b.project_id) THEN b.amount_egp
      ELSE NULL::numeric
    END AS amount_egp,
    b.wbs_item_id,
    w.title_ar AS wbs_title_ar,
    b.revision,
    b.is_current,
    b.vo_ref,
    COALESCE(act.total_allocated_qty, 0::numeric) AS total_installed_qty,
    CASE
      WHEN v_is_sys OR public.fn_user_can_see_prices(v_uid, b.project_id) THEN COALESCE(act.total_earned_egp, 0::numeric)
      ELSE NULL::numeric
    END AS total_earned_egp,
    CASE
      WHEN b.contract_qty > 0::numeric THEN round(COALESCE(act.total_allocated_qty, 0::numeric) / b.contract_qty * 100.0, 2)
      ELSE 0.00
    END AS qty_completion_pct,
    b.notes,
    b.created_at,
    b.updated_at
  FROM public.pm_boq_items b
  LEFT JOIN public.pm_cost_codes c ON c.id = b.cost_code_id
  LEFT JOIN public.pm_wbs_items w ON w.id = b.wbs_item_id
  LEFT JOIN (
    SELECT
      l.boq_item_id,
      sum(a.allocated_qty) AS total_allocated_qty,
      sum(a.allocated_qty * a.snapshot_rate_egp) AS total_earned_egp
    FROM public.pm_progress_allocations a
    JOIN public.pm_daily_progress_lines l ON l.id = a.line_id
    WHERE a.is_suspended = false AND l.line_status = 'approved'::text
    GROUP BY l.boq_item_id
  ) act ON act.boq_item_id = b.id
  WHERE b.is_current = true
    AND (v_is_sys OR public.fn_user_can_access_project(v_uid, b.project_id));
END;
$$;

CREATE OR REPLACE VIEW public.v_boq_current
WITH (security_invoker = true)
AS
SELECT
  id,
  project_id,
  item_code,
  cost_code_id,
  cost_code,
  cost_code_name_ar,
  description_ar,
  description_en,
  unit,
  contract_qty::numeric(15,3) AS contract_qty,
  shop_drawing_qty::numeric(15,3) AS shop_drawing_qty,
  pricing_status,
  foreign_currency,
  base_foreign_amount::numeric(15,2) AS base_foreign_amount,
  rate_egp::numeric(15,2) AS rate_egp,
  amount_egp::numeric(15,2) AS amount_egp,
  wbs_item_id,
  wbs_title_ar,
  revision,
  is_current,
  vo_ref,
  total_installed_qty,
  total_earned_egp,
  qty_completion_pct,
  notes,
  created_at,
  updated_at
FROM public.fn_boq_current_rows();

CREATE OR REPLACE FUNCTION public.fn_boq_items_secure_rows()
RETURNS TABLE (
  id uuid,
  project_id uuid,
  section_id uuid,
  zone_id uuid,
  item_code text,
  cost_code_id uuid,
  wbs_item_id uuid,
  description_ar text,
  description_en text,
  unit text,
  item_type public.boq_item_type,
  contract_qty numeric,
  shop_drawing_qty numeric,
  takeoff_qty numeric,
  takeoff_unit text,
  geometry_overlap_factor numeric,
  discipline_tag text,
  pricing_status text,
  foreign_currency text,
  base_foreign_amount numeric,
  rate_egp numeric,
  amount_egp numeric,
  dry_unit_cost_egp numeric,
  total_dry_cost_egp numeric,
  loaded_cost_egp numeric,
  target_margin_pct numeric,
  sort_order integer,
  notes text,
  is_active boolean,
  revision integer,
  is_current boolean,
  vo_ref text,
  building_tag text,
  group_tag text,
  inclusion_status text,
  inclusion_reason text,
  inclusion_changed_at timestamptz,
  inclusion_changed_by text,
  row_version integer,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_is_sys boolean := public.fn_is_system_or_service_role();
BEGIN
  IF v_uid IS NULL AND NOT v_is_sys THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    b.id,
    b.project_id,
    b.section_id,
    b.zone_id,
    b.item_code,
    b.cost_code_id,
    b.wbs_item_id,
    b.description_ar,
    b.description_en,
    b.unit,
    b.item_type,
    b.contract_qty,
    b.shop_drawing_qty,
    b.takeoff_qty,
    b.takeoff_unit,
    b.geometry_overlap_factor,
    b.discipline_tag,
    b.pricing_status,
    b.foreign_currency,
    CASE WHEN v_is_sys OR public.fn_user_can_see_prices(v_uid, b.project_id) THEN b.base_foreign_amount ELSE NULL::numeric END,
    CASE WHEN v_is_sys OR public.fn_user_can_see_prices(v_uid, b.project_id) THEN b.rate_egp ELSE NULL::numeric END,
    CASE WHEN v_is_sys OR public.fn_user_can_see_prices(v_uid, b.project_id) THEN b.amount_egp ELSE NULL::numeric END,
    CASE WHEN v_is_sys OR public.fn_user_can_see_prices(v_uid, b.project_id) THEN b.dry_unit_cost_egp ELSE NULL::numeric END,
    CASE WHEN v_is_sys OR public.fn_user_can_see_prices(v_uid, b.project_id) THEN b.total_dry_cost_egp ELSE NULL::numeric END,
    CASE WHEN v_is_sys OR public.fn_user_can_see_prices(v_uid, b.project_id) THEN b.loaded_cost_egp ELSE NULL::numeric END,
    CASE WHEN v_is_sys OR public.fn_user_can_see_prices(v_uid, b.project_id) THEN b.target_margin_pct ELSE NULL::numeric END,
    b.sort_order,
    b.notes,
    b.is_active,
    b.revision,
    b.is_current,
    b.vo_ref,
    b.building_tag,
    b.group_tag,
    b.inclusion_status,
    b.inclusion_reason,
    b.inclusion_changed_at,
    b.inclusion_changed_by,
    b.row_version,
    b.created_at,
    b.updated_at
  FROM public.pm_boq_items b
  WHERE v_is_sys OR public.fn_user_can_access_project(v_uid, b.project_id);
END;
$$;

CREATE OR REPLACE VIEW public.v_boq_items_secure
WITH (security_invoker = true)
AS
SELECT
  id,
  project_id,
  section_id,
  zone_id,
  item_code,
  cost_code_id,
  wbs_item_id,
  description_ar,
  description_en,
  unit,
  item_type,
  contract_qty::numeric(15,3) AS contract_qty,
  shop_drawing_qty::numeric(15,3) AS shop_drawing_qty,
  takeoff_qty::numeric(18,4) AS takeoff_qty,
  takeoff_unit,
  geometry_overlap_factor::numeric(8,4) AS geometry_overlap_factor,
  discipline_tag,
  pricing_status,
  foreign_currency,
  base_foreign_amount,
  rate_egp,
  amount_egp,
  dry_unit_cost_egp,
  total_dry_cost_egp,
  loaded_cost_egp,
  target_margin_pct,
  sort_order,
  notes,
  is_active,
  revision,
  is_current,
  vo_ref,
  building_tag,
  group_tag,
  inclusion_status,
  inclusion_reason,
  inclusion_changed_at,
  inclusion_changed_by,
  row_version,
  created_at,
  updated_at
FROM public.fn_boq_items_secure_rows();

-- 9.2 DB-10: Revoke EXECUTE from PUBLIC and anon across public & pm (except rpc_health_ping)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      p.proname AS func_name,
      pg_get_function_identity_arguments(p.oid) AS ident_args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname IN ('public', 'pm')
      AND p.prokind = 'f'
      AND (p.proname LIKE 'rpc\_%' ESCAPE '\' OR p.proname NOT LIKE 'rpc\_%' ESCAPE '\')
      AND p.proname <> 'rpc_health_ping'
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %I.%I(%s) FROM PUBLIC, anon;',
      r.schema_name, r.func_name, r.ident_args
    );
  END LOOP;
END;
$$;

-- Preserve / ensure required grants for authenticated, service_role, postgres, and GoTrue (supabase_auth_admin)
GRANT EXECUTE ON FUNCTION public.rpc_health_ping() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role, supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.fn_is_system_or_service_role() TO authenticated, service_role, postgres, supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.fn_user_is_viewer_only(uuid) TO authenticated, service_role, postgres, supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.fn_user_has_any_role_text(uuid, text[]) TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.fn_user_can_see_prices(uuid, uuid) TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.fn_storage_can_read_project_folder(text) TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.fn_storage_can_write_project_folder(text, text[]) TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.fn_boq_current_rows() TO authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.fn_boq_items_secure_rows() TO authenticated, service_role, postgres;
GRANT SELECT ON public.v_boq_current, public.v_boq_items_secure TO authenticated, service_role;

-- Default privileges so newly created functions do not grant EXECUTE to PUBLIC/anon
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA pm REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon;

-- 9.3 DB-11: Revoke TRUNCATE from anon & authenticated; revoke anon DML on public, pm, user_roles, storage
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA pm FROM anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA pm FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA pm FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.user_roles FROM anon, authenticated;

DO $$
BEGIN
  REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON storage.buckets, storage.objects FROM anon;
EXCEPTION
  WHEN insufficient_privilege THEN
    NULL;
END;
$$;

NOTIFY pgrst, 'reload schema';

COMMIT;
