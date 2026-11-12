-- Migration 004: Security Hardening
-- Fixes:
--   1. Remove anon RLS policies (public Supabase key can no longer alter records)
--   2. Remove anon GRANT permissions
--   3. Keep only authenticated + service_role access

-- ============================================================
-- A. Drop all anon policies on pm.project_client_contacts
-- ============================================================
DROP POLICY IF EXISTS "Allow anon access to project_client_contacts" ON pm.project_client_contacts;

-- ============================================================
-- B. Drop all anon policies on pm.project_site_resources
-- ============================================================
DROP POLICY IF EXISTS "Allow anon access to project_site_resources" ON pm.project_site_resources;

-- ============================================================
-- C. Drop all anon policies on pm.project_subcontractors
-- ============================================================
DROP POLICY IF EXISTS "Allow anon access to project_subcontractors" ON pm.project_subcontractors;

-- ============================================================
-- D. Revoke anon from schema tables
-- ============================================================
REVOKE ALL ON pm.project_client_contacts FROM anon;
REVOKE ALL ON pm.project_site_resources FROM anon;
REVOKE ALL ON pm.project_subcontractors FROM anon;

-- ============================================================
-- E. Revoke anon from public views
-- ============================================================
REVOKE ALL ON public.pm_project_client_contacts FROM anon;
REVOKE ALL ON public.pm_project_site_resources FROM anon;
REVOKE ALL ON public.pm_project_subcontractors FROM anon;

REVOKE ALL ON public.project_client_contacts FROM anon;
REVOKE ALL ON public.project_site_resources FROM anon;
REVOKE ALL ON public.project_subcontractors FROM anon;

-- ============================================================
-- F. Also revoke anon from core tab tables in public schema
--    (01_create_project_tabs_tables.sql did not restrict these)
-- ============================================================
DO $$ BEGIN
  -- Revoke anon from all pm_ tables that exist in public schema
  EXECUTE (
    SELECT string_agg('REVOKE ALL ON public.' || quote_ident(tablename) || ' FROM anon;', E'\n')
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename LIKE 'pm_%'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Some public pm_ tables may not exist yet: %', SQLERRM;
END $$;

-- ============================================================
-- G. Fix FK reference: 01_create_project_tabs_tables.sql references
--    public.pm_projects(id), but initial schema may use pm.projects.
--    Create public.pm_projects view if missing, pointing to pm.projects.
-- ============================================================
DO $$ BEGIN
  -- Only create the view if pm.projects exists but public.pm_projects doesn't
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'pm' AND table_name = 'projects')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pm_projects')
     AND NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'pm_projects')
  THEN
    EXECUTE 'CREATE OR REPLACE VIEW public.pm_projects AS SELECT * FROM pm.projects';
    EXECUTE 'GRANT ALL ON public.pm_projects TO authenticated, service_role';
    RAISE NOTICE 'Created public.pm_projects view pointing to pm.projects';
  END IF;
END $$;
