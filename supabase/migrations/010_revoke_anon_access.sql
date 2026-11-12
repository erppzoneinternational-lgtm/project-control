-- Migration 010: Revoke anon access from sensitive tables
-- SECURITY: anon role should not have unrestricted access to organizations or project_stakeholders

BEGIN;

-- 1. Drop permissive anon policies on organizations
DROP POLICY IF EXISTS "Allow anon access to organizations" ON public.organizations;

-- 2. Drop permissive anon policies on project_stakeholders
DROP POLICY IF EXISTS "Allow anon access to project_stakeholders" ON public.project_stakeholders;

-- 3. Revoke ALL privileges from anon on these tables
REVOKE ALL ON public.organizations FROM anon;
REVOKE ALL ON public.project_stakeholders FROM anon;
REVOKE ALL ON public.stakeholders_full FROM anon;
REVOKE ALL ON public.stakeholder_project_register FROM anon;

COMMIT;
