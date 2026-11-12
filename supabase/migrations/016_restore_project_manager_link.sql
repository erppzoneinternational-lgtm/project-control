-- ============================================================
-- Migration 016: Restore Project Manager link + rebuild pm_projects_with_manager
-- Date: 2026-08-24
--
-- Problem:
--   The canonical-generation rebuild of public.projects dropped
--   project_manager_stakeholder_id, and the rebuilt view
--   pm_projects_with_manager hardcodes NULL::text AS pm_full_name.
--   Result: Projects Analytics Dashboard shows no PM workload and no values.
--
-- Fix:
--   1. Re-add project_manager_stakeholder_id (FK -> stakeholders, additive & safe;
--      the app payload/forms already send this field).
--   2. Rebuild pm_projects_with_manager preserving its exact current column
--      shape (consumers do select('*')), but sourcing pm_* fields from a real
--      join on stakeholders (live columns: name_ar/name_en/role/phone).
-- ============================================================

-- 1. Restore the link column -------------------------------------------------
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS project_manager_stakeholder_id UUID
  REFERENCES public.stakeholders(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_pm_stakeholder
  ON public.projects(project_manager_stakeholder_id)
  WHERE project_manager_stakeholder_id IS NOT NULL;

-- 2. Rebuild the dashboard view with the real join ---------------------------
-- NOTE: column set/order changed vs current live view -> must DROP + CREATE
-- (CREATE OR REPLACE cannot insert completion_pct mid-list).
DROP VIEW IF EXISTS public.pm_projects_with_manager;

CREATE VIEW public.pm_projects_with_manager AS
SELECT
    p.id,
    p.name_ar,
    p.name_en,
    p.code,
    p.client_id,
    p.status,
    p.planned_start,
    p.planned_finish,
    p.actual_start,
    p.actual_finish,
    p.location,
    p.description,
    p.contract_type,
    p.contract_value,
    p.suspension_reason,
    p.suspended_at,
    p.suspended_by,
    p.resumed_at,
    p.resumed_by,
    p.cancellation_reason,
    p.cancelled_at,
    p.cancelled_by,
    p.created_by,
    p.created_at,
    p.updated_at,
    p.code AS project_code,
    p.name_ar AS project_name,
    p.name_ar AS name,
    p.planned_start AS start_date,
    p.planned_finish AS end_date,
    p.contract_value AS total_contract_value,
    p.contract_value AS contract_value_egp,
    p.contract_value AS total_value_with_vat_egp,
    0::numeric AS vos_value,
    p.completion_pct,
    COALESCE(s.name_en, s.name_ar) AS project_manager_name_raw,
    COALESCE(s.name_en, s.name_ar) AS pm_full_name,
    NULL::timestamp with time zone AS deleted_at,
    NULL::text AS pzone_role,
    c.name_ar AS client_name_ar,
    c.name_en AS client_name_en,
    c.name_ar AS client_name_raw,
    NULL::text AS client_code,
    s.phone AS pm_phone,
    s.role AS pm_job_title,
    p.project_manager_stakeholder_id AS pm_stakeholder_id
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN stakeholders s ON p.project_manager_stakeholder_id = s.id;
