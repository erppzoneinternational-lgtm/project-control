-- Migration: Fix stakeholders_full view - security_invoker, anon grants, job_title backfill
-- Date: 2026-10-02
-- Fixes found via live DB audit:
-- 1. stakeholders_full view was missing security_invoker=true
-- 2. anon role had no SELECT grant on stakeholders_full (page showed empty for anon users)
-- 3. job_title column was NULL for all rows (not backfilled from role)

-- 1. Recreate stakeholders_full with security_invoker=true + name_ar/name_en columns exposed
CREATE OR REPLACE VIEW public.stakeholders_full WITH (security_invoker = true) AS
SELECT
    s.id,
    COALESCE(s.name_en, s.name_ar) AS name,
    COALESCE(s.job_title, s.role) AS job_title,
    COALESCE(s.employee_code, s.organization_name) AS code,
    s.phone,
    s.email,
    NULL::text AS department,
    NULL::text AS company,
    s.type,
    s.organization_id,
    COALESCE(s.organization_name, o.name) AS organization_name,
    o.code AS organization_code,
    s.stakeholder_kind,
    s.client_id,
    c.name_ar AS client_name,
    s.vendor_id,
    v.name_ar AS vendor_name,
    s.is_active,
    s.notes,
    s.created_at,
    s.updated_at,
    (
        SELECT COUNT(DISTINCT ps.project_id)::INTEGER
        FROM public.project_stakeholders ps
        WHERE ps.stakeholder_id = s.id
    ) AS assigned_projects_count,
    s.employee_code,
    s.name_ar,
    s.name_en
FROM public.stakeholders s
LEFT JOIN public.organizations o ON s.organization_id = o.id
LEFT JOIN public.clients c ON s.client_id = c.id
LEFT JOIN public.vendors v ON s.vendor_id = v.id;

-- 2. Grant SELECT to anon + authenticated + service_role on view and all underlying tables
GRANT SELECT ON public.stakeholders_full TO anon, authenticated, service_role;
GRANT SELECT ON public.stakeholder_project_register TO anon, authenticated, service_role;
GRANT SELECT ON public.organizations TO anon, authenticated;
GRANT SELECT ON public.stakeholders TO anon, authenticated;
GRANT SELECT ON public.project_stakeholders TO anon, authenticated;
GRANT SELECT ON public.clients TO anon, authenticated;
GRANT SELECT ON public.vendors TO anon, authenticated;

-- 3. Backfill job_title from role for rows where job_title is null
UPDATE public.stakeholders SET job_title = role WHERE job_title IS NULL AND role IS NOT NULL;
