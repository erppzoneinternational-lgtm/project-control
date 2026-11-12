-- ============================================================================
-- Migration 059: Add public_name to projects table and updatable views
-- ============================================================================

-- 1. Add column to physical table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS public_name TEXT;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'pm' AND table_name = 'projects'
    ) THEN
        ALTER TABLE pm.projects ADD COLUMN IF NOT EXISTS public_name TEXT;
    END IF;
END $$;

-- 2. Re-create views with public_name exposed
DROP VIEW IF EXISTS public.pm_projects CASCADE;
DROP VIEW IF EXISTS public.pm_projects_with_manager CASCADE;

CREATE VIEW public.pm_projects_with_manager AS
SELECT
    p.id,
    p.name_ar,
    p.name_en,
    p.public_name,
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
    p.contract_value AS total_contract_value,
    p.governorate_id,
    p.city_id,
    p.site_location_address,
    p.gps_lat,
    p.gps_lng,
    p.pzone_role,
    p.water_area_m2,
    p.water_vol_m3,
    p.contract_date,
    p.contract_duration_months,
    p.vos_value,
    p.estimated_budget,
    p.estimated_cost,
    p.site_possession_letter,
    p.toc_letter,
    p.client_name_raw,
    p.project_manager_name_raw,
    p.completion_pct,
    p.contract_status,
    p.hardcopy_status,
    p.organization_id,
    p.metadata,
    p.project_manager_id,
    p.project_manager_stakeholder_id,
    p.hold_reason,
    p.cancel_reason,
    p.cover_image_url,
    p.deleted_at,
    p.deleted_by,
    -- Join Stakeholder PM
    stk.full_name AS pm_full_name,
    stk.employee_code AS pm_code,
    stk.phone AS pm_phone,
    stk.email AS pm_email,
    stk.job_title AS pm_job_title
FROM public.projects p
LEFT JOIN public.pm_stakeholders stk 
    ON stk.id = p.project_manager_stakeholder_id;

CREATE VIEW public.pm_projects AS
SELECT * FROM public.pm_projects_with_manager;

-- 3. Trigger function for UPDATE
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
        contract_value = COALESCE(
            CASE WHEN NEW.contract_value IS DISTINCT FROM OLD.contract_value THEN NEW.contract_value ELSE NULL END,
            CASE WHEN NEW.total_contract_value IS DISTINCT FROM OLD.total_contract_value THEN NEW.total_contract_value ELSE NULL END,
            NEW.contract_value,
            NEW.total_contract_value
        ),
        suspension_reason = NEW.suspension_reason,
        suspended_at = NEW.suspended_at,
        suspended_by = NEW.suspended_by,
        resumed_at = NEW.resumed_at,
        resumed_by = NEW.resumed_by,
        cancellation_reason = COALESCE(NEW.cancellation_reason, NEW.cancel_reason),
        cancelled_at = NEW.cancelled_at,
        cancelled_by = NEW.cancelled_by,
        governorate_id = NEW.governorate_id,
        city_id = NEW.city_id,
        site_location_address = NEW.site_location_address,
        gps_lat = NEW.gps_lat,
        gps_lng = NEW.gps_lng,
        pzone_role = NEW.pzone_role,
        water_area_m2 = NEW.water_area_m2,
        water_vol_m3 = NEW.water_vol_m3,
        contract_date = NEW.contract_date,
        contract_duration_months = NEW.contract_duration_months,
        vos_value = NEW.vos_value,
        estimated_budget = NEW.estimated_budget,
        estimated_cost = NEW.estimated_cost,
        site_possession_letter = NEW.site_possession_letter,
        toc_letter = NEW.toc_letter,
        client_name_raw = NEW.client_name_raw,
        project_manager_name_raw = NEW.project_manager_name_raw,
        completion_pct = NEW.completion_pct,
        contract_status = NEW.contract_status,
        hardcopy_status = NEW.hardcopy_status,
        metadata = NEW.metadata,
        project_manager_id = NEW.project_manager_id,
        project_manager_stakeholder_id = NEW.project_manager_stakeholder_id,
        hold_reason = NEW.hold_reason,
        cancel_reason = COALESCE(NEW.cancel_reason, NEW.cancellation_reason),
        cover_image_url = NEW.cover_image_url,
        deleted_at = NEW.deleted_at,
        deleted_by = NEW.deleted_by,
        updated_at = NOW()
    WHERE public.projects.id = OLD.id;

    SELECT * INTO res FROM public.pm_projects WHERE id = OLD.id;
    RETURN res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger function for INSERT
CREATE OR REPLACE FUNCTION public.trg_pm_projects_insert()
RETURNS TRIGGER AS $$
DECLARE
    new_id UUID;
    res public.pm_projects%ROWTYPE;
BEGIN
    new_id := COALESCE(NEW.id, gen_random_uuid());

    INSERT INTO public.projects (
        id,
        name_ar,
        name_en,
        public_name,
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
        suspension_reason,
        suspended_at,
        suspended_by,
        resumed_at,
        resumed_by,
        cancellation_reason,
        cancelled_at,
        cancelled_by,
        governorate_id,
        city_id,
        site_location_address,
        gps_lat,
        gps_lng,
        pzone_role,
        water_area_m2,
        water_vol_m3,
        contract_date,
        contract_duration_months,
        vos_value,
        estimated_budget,
        estimated_cost,
        site_possession_letter,
        toc_letter,
        client_name_raw,
        project_manager_name_raw,
        completion_pct,
        contract_status,
        hardcopy_status,
        organization_id,
        metadata,
        project_manager_id,
        project_manager_stakeholder_id,
        hold_reason,
        cancel_reason,
        cover_image_url,
        deleted_at,
        deleted_by,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        new_id,
        COALESCE(NEW.name_ar, NEW.project_name, NEW.project_name_ar, NEW.name, ''),
        COALESCE(NEW.name_en, NEW.project_name_en),
        NEW.public_name,
        COALESCE(NEW.code, NEW.project_code, ''),
        NEW.client_id,
        COALESCE(NEW.status, 'planning'),
        COALESCE(NEW.planned_start, NEW.planned_start_date, NEW.start_date),
        COALESCE(NEW.planned_finish, NEW.planned_finish_date, NEW.end_date),
        COALESCE(NEW.actual_start, NEW.actual_start_date),
        COALESCE(NEW.actual_finish, NEW.actual_finish_date),
        NEW.location,
        NEW.description,
        NEW.contract_type,
        COALESCE(NEW.contract_value, NEW.total_contract_value, 0),
        NEW.suspension_reason,
        NEW.suspended_at,
        NEW.suspended_by,
        NEW.resumed_at,
        NEW.resumed_by,
        COALESCE(NEW.cancellation_reason, NEW.cancel_reason),
        NEW.cancelled_at,
        NEW.cancelled_by,
        NEW.governorate_id,
        NEW.city_id,
        NEW.site_location_address,
        NEW.gps_lat,
        NEW.gps_lng,
        COALESCE(NEW.pzone_role, 'Main Contractor'),
        COALESCE(NEW.water_area_m2, 0),
        COALESCE(NEW.water_vol_m3, 0),
        NEW.contract_date,
        NEW.contract_duration_months,
        COALESCE(NEW.vos_value, 0),
        COALESCE(NEW.estimated_budget, 0),
        COALESCE(NEW.estimated_cost, 0),
        COALESCE(NEW.site_possession_letter, 'غير موجود'),
        COALESCE(NEW.toc_letter, 'غير موجود'),
        NEW.client_name_raw,
        NEW.project_manager_name_raw,
        COALESCE(NEW.completion_pct, 0),
        NEW.contract_status,
        COALESCE(NEW.hardcopy_status, 'غير مكتمل'),
        NEW.organization_id,
        NEW.metadata,
        NEW.project_manager_id,
        NEW.project_manager_stakeholder_id,
        NEW.hold_reason,
        COALESCE(NEW.cancel_reason, NEW.cancellation_reason),
        NEW.cover_image_url,
        NEW.deleted_at,
        NEW.deleted_by,
        NEW.created_by,
        COALESCE(NEW.created_at, NOW()),
        COALESCE(NEW.updated_at, NOW())
    );

    SELECT * INTO res FROM public.pm_projects WHERE id = new_id;
    RETURN res;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger function for DELETE
CREATE OR REPLACE FUNCTION public.trg_pm_projects_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.projects
    SET deleted_at = NOW()
    WHERE id = OLD.id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Bind INSTEAD OF triggers on pm_projects
CREATE TRIGGER trg_pm_projects_update_trigger
INSTEAD OF UPDATE ON public.pm_projects
FOR EACH ROW EXECUTE FUNCTION public.trg_pm_projects_update();

CREATE TRIGGER trg_pm_projects_insert_trigger
INSTEAD OF INSERT ON public.pm_projects
FOR EACH ROW EXECUTE FUNCTION public.trg_pm_projects_insert();

CREATE TRIGGER trg_pm_projects_delete_trigger
INSTEAD OF DELETE ON public.pm_projects
FOR EACH ROW EXECUTE FUNCTION public.trg_pm_projects_delete();

-- 7. Bind INSTEAD OF triggers on pm_projects_with_manager
CREATE TRIGGER trg_pm_projects_with_manager_update_trigger
INSTEAD OF UPDATE ON public.pm_projects_with_manager
FOR EACH ROW EXECUTE FUNCTION public.trg_pm_projects_update();

CREATE TRIGGER trg_pm_projects_with_manager_insert_trigger
INSTEAD OF INSERT ON public.pm_projects_with_manager
FOR EACH ROW EXECUTE FUNCTION public.trg_pm_projects_insert();

CREATE TRIGGER trg_pm_projects_with_manager_delete_trigger
INSTEAD OF DELETE ON public.pm_projects_with_manager
FOR EACH ROW EXECUTE FUNCTION public.trg_pm_projects_delete();
