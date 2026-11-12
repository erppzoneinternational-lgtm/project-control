-- ============================================================
-- Migration 044: Updatable views for pm_projects & pm_projects_with_manager
-- Date: 2026-09-13
--
-- Problem:
--   PostgREST UPDATE, INSERT, and DELETE on pm_projects or pm_projects_with_manager
--   fail with error 55000 (cannot update view) or PGRST204 (column actual_finish_date not in schema cache).
--
-- Solution:
--   1. Add missing optional project columns to public.projects:
--      deleted_at, contract_date, contract_duration_months, estimated_budget,
--      estimated_cost, site_possession_letter, toc_letter, cover_image_url, metadata.
--   2. Recreate pm_projects_with_manager and pm_projects exposing both base columns
--      and form aliases (e.g. actual_finish_date, planned_finish_date, project_name_en, etc.).
--   3. Attach INSTEAD OF UPDATE, INSERT, and DELETE triggers routing all operations
--      to public.projects and returning the updated row.
-- ============================================================

-- 1. Ensure columns exist on public.projects
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contract_date DATE,
  ADD COLUMN IF NOT EXISTS contract_duration_months NUMERIC,
  ADD COLUMN IF NOT EXISTS estimated_budget NUMERIC,
  ADD COLUMN IF NOT EXISTS estimated_cost NUMERIC,
  ADD COLUMN IF NOT EXISTS site_possession_letter TEXT,
  ADD COLUMN IF NOT EXISTS toc_letter TEXT,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Drop existing triggers
DROP TRIGGER IF EXISTS trg_pm_projects_update_trigger ON public.pm_projects;
DROP TRIGGER IF EXISTS trg_pm_projects_insert_trigger ON public.pm_projects;
DROP TRIGGER IF EXISTS trg_pm_projects_delete_trigger ON public.pm_projects;
DROP TRIGGER IF EXISTS trg_pm_projects_with_manager_update_trigger ON public.pm_projects_with_manager;
DROP TRIGGER IF EXISTS trg_pm_projects_with_manager_insert_trigger ON public.pm_projects_with_manager;
DROP TRIGGER IF EXISTS trg_pm_projects_with_manager_delete_trigger ON public.pm_projects_with_manager;

-- 3. Drop and recreate views with full column set and aliases
DROP VIEW IF EXISTS public.pm_projects CASCADE;
DROP VIEW IF EXISTS public.pm_projects_with_manager CASCADE;

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
    p.name_ar AS project_name_ar,
    p.name_en AS project_name_en,
    p.name_ar AS name,
    p.planned_start AS start_date,
    p.planned_finish AS end_date,
    p.planned_start AS planned_start_date,
    p.planned_finish AS planned_finish_date,
    p.actual_start AS actual_start_date,
    p.actual_finish AS actual_finish_date,
    COALESCE(p.contract_value, 0::numeric) + COALESCE(p.vos_value, 0::numeric) AS total_contract_value,
    p.contract_value AS contract_value_egp,
    COALESCE(p.contract_value, 0::numeric) + COALESCE(p.vos_value, 0::numeric) AS total_value_with_vat_egp,
    COALESCE(p.vos_value, 0::numeric) AS vos_value,
    p.completion_pct,
    p.gps_lat,
    p.gps_lng,
    p.gps_lat AS latitude,
    p.gps_lng AS longitude,
    p.water_area_m2,
    p.water_vol_m3,
    p.site_location_address,
    p.governorate_id,
    p.city_id,
    g.name_ar AS governorate_name_ar,
    g.name_en AS governorate_name_en,
    COALESCE(p.project_manager_name_raw, s.name_ar, s.name_en, 'بدون'::text) AS project_manager_name_raw,
    COALESCE(p.project_manager_name_raw, s.name_ar, s.name_en, 'بدون'::text) AS pm_full_name,
    p.deleted_at,
    COALESCE(p.pzone_role, 'Sub Contractor'::text) AS pzone_role,
    c.name_ar AS client_name_ar,
    c.name_en AS client_name_en,
    COALESCE(p.client_name_raw, c.name_ar) AS client_name_raw,
    c.code AS client_code,
    s.phone AS pm_phone,
    s.role AS pm_job_title,
    s.employee_code AS pm_code,
    p.project_manager_stakeholder_id AS pm_stakeholder_id,
    p.project_manager_stakeholder_id,
    p.project_manager_stakeholder_id AS project_manager_id,
    p.contract_status,
    p.hardcopy_status,
    p.contract_date,
    p.contract_duration_months,
    p.estimated_budget,
    p.estimated_cost,
    p.site_possession_letter,
    p.toc_letter,
    p.cover_image_url,
    p.metadata,
    p.suspension_reason AS hold_reason,
    p.cancellation_reason AS cancel_reason
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
LEFT JOIN stakeholders s ON p.project_manager_stakeholder_id = s.id
LEFT JOIN governorates g ON p.governorate_id = g.id;

CREATE VIEW public.pm_projects AS
SELECT * FROM public.pm_projects_with_manager;

-- 4. Trigger function for UPDATE
CREATE OR REPLACE FUNCTION public.trg_pm_projects_update()
RETURNS TRIGGER AS $$
DECLARE
    res public.pm_projects%ROWTYPE;
BEGIN
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
            NEW.planned_start,
            NEW.planned_start_date,
            NEW.start_date
        ),
        planned_finish = COALESCE(
            CASE WHEN NEW.planned_finish IS DISTINCT FROM OLD.planned_finish THEN NEW.planned_finish ELSE NULL END,
            CASE WHEN NEW.planned_finish_date IS DISTINCT FROM OLD.planned_finish_date THEN NEW.planned_finish_date ELSE NULL END,
            CASE WHEN NEW.end_date IS DISTINCT FROM OLD.end_date THEN NEW.end_date ELSE NULL END,
            NEW.planned_finish,
            NEW.planned_finish_date,
            NEW.end_date
        ),
        actual_start = COALESCE(
            CASE WHEN NEW.actual_start IS DISTINCT FROM OLD.actual_start THEN NEW.actual_start ELSE NULL END,
            CASE WHEN NEW.actual_start_date IS DISTINCT FROM OLD.actual_start_date THEN NEW.actual_start_date ELSE NULL END,
            NEW.actual_start,
            NEW.actual_start_date
        ),
        actual_finish = COALESCE(
            CASE WHEN NEW.actual_finish IS DISTINCT FROM OLD.actual_finish THEN NEW.actual_finish ELSE NULL END,
            CASE WHEN NEW.actual_finish_date IS DISTINCT FROM OLD.actual_finish_date THEN NEW.actual_finish_date ELSE NULL END,
            NEW.actual_finish,
            NEW.actual_finish_date
        ),
        location = NEW.location,
        description = NEW.description,
        contract_type = NEW.contract_type,
        contract_value = COALESCE(NEW.contract_value, NEW.contract_value_egp, projects.contract_value),
        vos_value = COALESCE(NEW.vos_value, projects.vos_value),
        suspension_reason = COALESCE(
            CASE WHEN NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason THEN NEW.suspension_reason ELSE NULL END,
            CASE WHEN NEW.hold_reason IS DISTINCT FROM OLD.hold_reason THEN NEW.hold_reason ELSE NULL END,
            NEW.suspension_reason,
            NEW.hold_reason
        ),
        suspended_at = NEW.suspended_at,
        suspended_by = NEW.suspended_by,
        resumed_at = NEW.resumed_at,
        resumed_by = NEW.resumed_by,
        cancellation_reason = COALESCE(
            CASE WHEN NEW.cancellation_reason IS DISTINCT FROM OLD.cancellation_reason THEN NEW.cancellation_reason ELSE NULL END,
            CASE WHEN NEW.cancel_reason IS DISTINCT FROM OLD.cancel_reason THEN NEW.cancel_reason ELSE NULL END,
            NEW.cancellation_reason,
            NEW.cancel_reason
        ),
        cancelled_at = NEW.cancelled_at,
        cancelled_by = NEW.cancelled_by,
        completion_pct = COALESCE(NEW.completion_pct, projects.completion_pct),
        project_manager_stakeholder_id = COALESCE(
            CASE WHEN NEW.project_manager_stakeholder_id IS DISTINCT FROM OLD.project_manager_stakeholder_id THEN NEW.project_manager_stakeholder_id ELSE NULL END,
            CASE WHEN NEW.project_manager_id IS DISTINCT FROM OLD.project_manager_id THEN NEW.project_manager_id ELSE NULL END,
            CASE WHEN NEW.pm_stakeholder_id IS DISTINCT FROM OLD.pm_stakeholder_id THEN NEW.pm_stakeholder_id ELSE NULL END,
            NEW.project_manager_stakeholder_id,
            NEW.project_manager_id,
            NEW.pm_stakeholder_id
        ),
        gps_lat = COALESCE(
            CASE WHEN NEW.gps_lat IS DISTINCT FROM OLD.gps_lat THEN NEW.gps_lat ELSE NULL END,
            CASE WHEN NEW.latitude IS DISTINCT FROM OLD.latitude THEN NEW.latitude ELSE NULL END,
            NEW.gps_lat,
            NEW.latitude
        ),
        gps_lng = COALESCE(
            CASE WHEN NEW.gps_lng IS DISTINCT FROM OLD.gps_lng THEN NEW.gps_lng ELSE NULL END,
            CASE WHEN NEW.longitude IS DISTINCT FROM OLD.longitude THEN NEW.longitude ELSE NULL END,
            NEW.gps_lng,
            NEW.longitude
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger function for INSERT
CREATE OR REPLACE FUNCTION public.trg_pm_projects_insert()
RETURNS TRIGGER AS $$
DECLARE
    new_proj_id UUID;
    res public.pm_projects%ROWTYPE;
BEGIN
    INSERT INTO public.projects (
        id,
        name_ar,
        name_en,
        code,
        client_id,
        status,
        planned_start,
        planned_finish,
        actual_start,
        actual_finish,
        location,
        description,
        contract_type,
        contract_value,
        vos_value,
        completion_pct,
        project_manager_stakeholder_id,
        gps_lat,
        gps_lng,
        water_area_m2,
        water_vol_m3,
        site_location_address,
        pzone_role,
        client_name_raw,
        project_manager_name_raw,
        governorate_id,
        city_id,
        contract_status,
        hardcopy_status,
        contract_date,
        contract_duration_months,
        estimated_budget,
        estimated_cost,
        site_possession_letter,
        toc_letter,
        cover_image_url,
        metadata,
        deleted_at,
        created_at,
        updated_at
    ) VALUES (
        COALESCE(NEW.id, gen_random_uuid()),
        COALESCE(NEW.name_ar, NEW.project_name, NEW.project_name_ar, NEW.name, 'مشروع جديد'),
        COALESCE(NEW.name_en, NEW.project_name_en),
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger function for DELETE
CREATE OR REPLACE FUNCTION public.trg_pm_projects_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.projects
    SET deleted_at = NOW()
    WHERE id = OLD.id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Attach Triggers to pm_projects
CREATE TRIGGER trg_pm_projects_update_trigger
INSTEAD OF UPDATE ON public.pm_projects
FOR EACH ROW EXECUTE FUNCTION public.trg_pm_projects_update();

CREATE TRIGGER trg_pm_projects_insert_trigger
INSTEAD OF INSERT ON public.pm_projects
FOR EACH ROW EXECUTE FUNCTION public.trg_pm_projects_insert();

CREATE TRIGGER trg_pm_projects_delete_trigger
INSTEAD OF DELETE ON public.pm_projects
FOR EACH ROW EXECUTE FUNCTION public.trg_pm_projects_delete();

-- 8. Attach Triggers to pm_projects_with_manager
CREATE TRIGGER trg_pm_projects_with_manager_update_trigger
INSTEAD OF UPDATE ON public.pm_projects_with_manager
FOR EACH ROW EXECUTE FUNCTION public.trg_pm_projects_update();

CREATE TRIGGER trg_pm_projects_with_manager_insert_trigger
INSTEAD OF INSERT ON public.pm_projects_with_manager
FOR EACH ROW EXECUTE FUNCTION public.trg_pm_projects_insert();

CREATE TRIGGER trg_pm_projects_with_manager_delete_trigger
INSTEAD OF DELETE ON public.pm_projects_with_manager
FOR EACH ROW EXECUTE FUNCTION public.trg_pm_projects_delete();
