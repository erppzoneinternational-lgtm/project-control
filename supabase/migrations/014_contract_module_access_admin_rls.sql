-- 014_contract_module_access_admin_rls.sql
-- QA finding C2 (Critical): ANY authenticated user could modify the module
-- permission matrix (contract_module_access). Proven in QA: a
-- commercial_manager account PATCHed allowed_roles successfully.
-- Fix: enable RLS on the table and allow writes only to principals whose
-- user_id has role='admin' in public.user_roles. Reads remain open to all
-- authenticated users (the app loads the matrix client-side for menu gating).
--
-- Safety notes:
-- * The is_current_user_admin() helper is SECURITY DEFINER so the admin check
--   bypasses user_roles' own self-scoping RLS (proven behavior: non-admins see
--   only their own row, admins see all — QA probes U3/U5).
-- * All pre-existing policies on this table are dropped by name-agnostic loop
--   because their names are not tracked in any applied-migration record.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_current_user_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

ALTER TABLE public.contract_module_access ENABLE ROW LEVEL SECURITY;

-- Drop whatever policies exist (names untracked)
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policy_name FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'contract_module_access'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.contract_module_access;', pol.policy_name);
  END LOOP;
END $$;

CREATE POLICY cma_select_authenticated
  ON public.contract_module_access FOR SELECT
  TO authenticated USING (true);

CREATE POLICY cma_insert_admin
  ON public.contract_module_access FOR INSERT
  TO authenticated WITH CHECK (public.is_current_user_admin());

CREATE POLICY cma_update_admin
  ON public.contract_module_access FOR UPDATE
  TO authenticated USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY cma_delete_admin
  ON public.contract_module_access FOR DELETE
  TO authenticated USING (public.is_current_user_admin());

COMMIT;

-- ROLLBACK: (restores prior blanket-authenticated write access)
-- BEGIN;
-- DROP POLICY IF EXISTS cma_select_authenticated ON public.contract_module_access;
-- DROP POLICY IF EXISTS cma_insert_admin ON public.contract_module_access;
-- DROP POLICY IF EXISTS cma_update_admin ON public.contract_module_access;
-- DROP POLICY IF EXISTS cma_delete_admin ON public.contract_module_access;
-- DROP FUNCTION IF EXISTS public.is_current_user_admin();
-- COMMIT;
