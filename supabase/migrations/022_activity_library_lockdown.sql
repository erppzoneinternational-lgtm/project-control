-- 022_activity_library_lockdown.sql
-- The standard execution-steps library is a company-wide REFERENCE — not user content.
-- Owner decision (2026-08-25): write access restricted to
--   admin · commercial_manager · planning_manager
-- Everyone authenticated keeps READ access. Service role unaffected.

BEGIN;

-- Remove the older, wider write policies (applied live 2026-08-25)
DROP POLICY IF EXISTS activity_lib_write ON public.pm_activity_library;
DROP POLICY IF EXISTS activity_library_modify ON public.pm_activity_library;

-- Drop duplicate legacy select policy; keep the canonical one
DROP POLICY IF EXISTS activity_library_select ON public.pm_activity_library;

-- Single guarded write path
CREATE POLICY activity_lib_administer ON public.pm_activity_library
  FOR ALL TO authenticated
  USING (
    fn_user_has_role(auth.uid(), ARRAY['admin','commercial_manager','planning_manager']::user_role[])
  )
  WITH CHECK (
    fn_user_has_role(auth.uid(), ARRAY['admin','commercial_manager','planning_manager']::user_role[])
  );

COMMIT;
