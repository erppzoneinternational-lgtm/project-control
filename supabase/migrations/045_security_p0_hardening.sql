-- ============================================================
-- 045_security_p0_hardening.sql
-- P0 Security Hardening: V1, V2, V3, V4, V9 fixes
-- Idempotent: all statements use IF EXISTS / CREATE OR REPLACE
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- V1: Block privilege escalation via profiles.roles
-- Non-admin users cannot elevate their own role column.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_guard_profile_roles_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.roles IS DISTINCT FROM OLD.roles THEN
    IF auth.uid() IS NOT NULL AND NOT public.fn_user_has_role(auth.uid(), ARRAY['admin']::public.user_role[]) THEN
      RAISE EXCEPTION 'SECURITY_VIOLATION: Only administrators can modify user roles.';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_guard_profile_roles ON public.profiles;
CREATE TRIGGER trg_guard_profile_roles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_guard_profile_roles_update();

-- ────────────────────────────────────────────────────────────
-- V2: Revoke anon access on core ERP tables and tighten RLS
-- ────────────────────────────────────────────────────────────
REVOKE ALL ON public.clients FROM anon;
REVOKE ALL ON public.stakeholders FROM anon;
REVOKE ALL ON public.project_stakeholders FROM anon;
REVOKE ALL ON public.projects FROM anon;
REVOKE ALL ON public.pm_boq_revisions FROM anon;

DROP POLICY IF EXISTS "clients_modify" ON public.clients;
DROP POLICY IF EXISTS "clients_select" ON public.clients;

CREATE POLICY "clients_select" ON public.clients
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "clients_modify" ON public.clients
  FOR ALL TO authenticated
  USING (public.fn_user_has_role(auth.uid(), ARRAY['admin', 'commercial_manager', 'project_manager']::public.user_role[]))
  WITH CHECK (public.fn_user_has_role(auth.uid(), ARRAY['admin', 'commercial_manager', 'project_manager']::public.user_role[]));

-- ────────────────────────────────────────────────────────────
-- V3: Drop blanket open RLS policies that bypass row filtering
-- ────────────────────────────────────────────────────────────
DO $$ DECLARE t TEXT; BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'auth_select_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'auth_insert_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'auth_update_' || t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'auth_access_' || t, t);
  END LOOP;
END; $$;

-- ────────────────────────────────────────────────────────────
-- V9: Harden remaining SECURITY DEFINER functions against
--     search_path injection.
-- ────────────────────────────────────────────────────────────
ALTER FUNCTION public.fn_check_task_project_integrity() SET search_path = '';
ALTER FUNCTION public.fn_validate_task_assignment_team() SET search_path = '';
