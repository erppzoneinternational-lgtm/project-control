-- ============================================================
-- Migration 018: stakeholders_full view + employee_code
-- Date: 2026-08-24
-- Appends employee_code to the directory view (CREATE OR REPLACE
-- allows appending columns at the end without drop).
-- ============================================================

CREATE OR REPLACE VIEW public.stakeholders_full WITH (security_invoker = true) AS
SELECT
    s.id,
    COALESCE(s.name_en, s.name_ar) AS name,
    s.role AS job_title,
    NULL::text AS code,
    s.phone,
    s.email,
    NULL::text AS department,
    NULL::text AS company,
    NULL::text AS type,
    s.organization_id,
    o.name AS organization_name,
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
    s.employee_code
FROM public.stakeholders s
LEFT JOIN public.organizations o ON s.organization_id = o.id
LEFT JOIN public.clients c ON s.client_id = c.id
LEFT JOIN public.vendors v ON s.vendor_id = v.id;
