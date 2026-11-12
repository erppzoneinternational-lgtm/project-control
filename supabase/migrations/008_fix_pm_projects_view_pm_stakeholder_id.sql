-- Migration: 008_fix_pm_projects_view_pm_stakeholder_id.sql
-- Description: Add project_manager_stakeholder_id and pm_name_normalized to public.pm_projects view and INSTEAD OF triggers

BEGIN;

DROP VIEW IF EXISTS public.pm_projects CASCADE;

CREATE VIEW public.pm_projects AS
SELECT 
    p.id,
    p.organization_id,
    p.project_code,
    p.project_name,
    p.project_name_en,
    p.client_id,
    p.client_name_raw,
    p.pzone_role,
    p.governorate_id,
    p.city_id,
    p.site_location_address,
    p.gps_lat,
    p.gps_lng,
    p.status,
    p.planned_start_date,
    p.planned_finish_date,
    p.actual_start_date,
    p.actual_finish_date,
    p.contract_date,
    p.contract_duration_months,
    p.contract_status,
    p.contract_value,
    p.vos_value,
    p.estimated_budget,
    p.estimated_cost,
    p.water_area_m2,
    p.water_vol_m3,
    p.site_possession_letter,
    p.toc_letter,
    p.hardcopy_status,
    p.project_manager_id,
    p.project_manager_name_raw,
    p.completion_pct,
    p.cover_image_url,
    p.hold_reason,
    p.cancel_reason,
    p.metadata,
    p.created_by,
    p.updated_by,
    p.created_at,
    p.updated_at,
    p.deleted_at,
    p.pm_name_normalized,
    p.project_manager_stakeholder_id,
    c.name_ar AS client_name_ar,
    c.name_en AS client_name_en,
    c.code AS client_code,
    g.name_ar AS governorate_name_ar,
    g.name_en AS governorate_name_en,
    g.code AS governorate_code
FROM pm.projects p
LEFT JOIN pm.clients c ON c.id = p.client_id
LEFT JOIN pm.governorates g ON g.id = p.governorate_id;

CREATE OR REPLACE FUNCTION public.pm_projects_insert_fn()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO pm.projects (
    organization_id, project_code, project_name, project_name_en,
    client_id, client_name_raw, pzone_role, governorate_id, city_id,
    site_location_address, gps_lat, gps_lng,
    status, contract_status, hardcopy_status,
    planned_start_date, planned_finish_date, actual_start_date, actual_finish_date,
    contract_date, contract_duration_months,
    contract_value, vos_value, estimated_budget, estimated_cost,
    water_area_m2, water_vol_m3, site_possession_letter, toc_letter,
    project_manager_id, project_manager_name_raw, project_manager_stakeholder_id,
    completion_pct, cover_image_url, hold_reason, cancel_reason, created_by
  ) VALUES (
    NEW.organization_id, NEW.project_code, NEW.project_name, NEW.project_name_en,
    NEW.client_id, NEW.client_name_raw, NEW.pzone_role, NEW.governorate_id, NEW.city_id,
    NEW.site_location_address, NEW.gps_lat, NEW.gps_lng,
    NEW.status, NEW.contract_status, NEW.hardcopy_status,
    NEW.planned_start_date, NEW.planned_finish_date, NEW.actual_start_date, NEW.actual_finish_date,
    NEW.contract_date, NEW.contract_duration_months,
    NEW.contract_value, NEW.vos_value, NEW.estimated_budget, NEW.estimated_cost,
    NEW.water_area_m2, NEW.water_vol_m3, NEW.site_possession_letter, NEW.toc_letter,
    NEW.project_manager_id, NEW.project_manager_name_raw, NEW.project_manager_stakeholder_id,
    NEW.completion_pct, NEW.cover_image_url, NEW.hold_reason, NEW.cancel_reason, NEW.created_by
  );
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_pm_projects_instead_of()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  IF (TG_OP = 'UPDATE') THEN
    UPDATE pm.projects SET
      project_code = COALESCE(NEW.project_code, project_code),
      project_name = COALESCE(NEW.project_name, project_name),
      project_name_en = NEW.project_name_en,
      pzone_role = COALESCE(NEW.pzone_role, pzone_role),
      client_id = NEW.client_id,
      client_name_raw = NEW.client_name_raw,
      governorate_id = NEW.governorate_id,
      city_id = NEW.city_id,
      site_location_address = NEW.site_location_address,
      contract_value = COALESCE(NEW.contract_value, contract_value),
      vos_value = COALESCE(NEW.vos_value, vos_value),
      water_area_m2 = COALESCE(NEW.water_area_m2, water_area_m2),
      water_vol_m3 = COALESCE(NEW.water_vol_m3, water_vol_m3),
      completion_pct = COALESCE(NEW.completion_pct, completion_pct),
      status = CASE WHEN NEW.status IS NOT NULL THEN NEW.status::pm.project_status ELSE status END,
      contract_status = COALESCE(NEW.contract_status, contract_status),
      hardcopy_status = COALESCE(NEW.hardcopy_status, hardcopy_status),
      project_manager_name_raw = NEW.project_manager_name_raw,
      project_manager_stakeholder_id = NEW.project_manager_stakeholder_id,
      hold_reason = NEW.hold_reason,
      cancel_reason = NEW.cancel_reason,
      updated_at = NOW()
    WHERE id = OLD.id;
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO pm.projects (
      id, project_code, project_name, project_name_en,
      client_id, client_name_raw, pzone_role,
      governorate_id, city_id, site_location_address,
      gps_lat, gps_lng,
      status, contract_status, hardcopy_status,
      planned_start_date, planned_finish_date, actual_start_date, actual_finish_date,
      contract_date, contract_duration_months,
      contract_value, vos_value, estimated_budget, estimated_cost,
      water_area_m2, water_vol_m3,
      site_possession_letter, toc_letter,
      project_manager_name_raw, project_manager_stakeholder_id, completion_pct,
      hold_reason, cancel_reason,
      created_at, updated_at
    ) VALUES (
      COALESCE(NEW.id, gen_random_uuid()),
      NEW.project_code, NEW.project_name, NEW.project_name_en,
      NEW.client_id, NEW.client_name_raw, COALESCE(NEW.pzone_role, 'Main Contractor'),
      NEW.governorate_id, NEW.city_id, NEW.site_location_address,
      NEW.gps_lat, NEW.gps_lng,
      COALESCE(NEW.status::pm.project_status, 'working'::pm.project_status),
      NEW.contract_status, NEW.hardcopy_status,
      NEW.planned_start_date, NEW.planned_finish_date, NEW.actual_start_date, NEW.actual_finish_date,
      NEW.contract_date, NEW.contract_duration_months,
      COALESCE(NEW.contract_value, 0), COALESCE(NEW.vos_value, 0),
      COALESCE(NEW.estimated_budget, 0), COALESCE(NEW.estimated_cost, 0),
      COALESCE(NEW.water_area_m2, 0), COALESCE(NEW.water_vol_m3, 0),
      NEW.site_possession_letter, NEW.toc_letter,
      NEW.project_manager_name_raw, NEW.project_manager_stakeholder_id, COALESCE(NEW.completion_pct, 0),
      NEW.hold_reason, NEW.cancel_reason,
      NOW(), NOW()
    ) ON CONFLICT (project_code) DO UPDATE SET
      project_name = EXCLUDED.project_name,
      client_name_raw = EXCLUDED.client_name_raw,
      pzone_role = EXCLUDED.pzone_role,
      contract_value = EXCLUDED.contract_value,
      vos_value = EXCLUDED.vos_value,
      water_area_m2 = EXCLUDED.water_area_m2,
      water_vol_m3 = EXCLUDED.water_vol_m3,
      project_manager_name_raw = EXCLUDED.project_manager_name_raw,
      project_manager_stakeholder_id = EXCLUDED.project_manager_stakeholder_id,
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING * INTO NEW;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE pm.projects SET deleted_at = NOW() WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

CREATE TRIGGER trg_pm_projects_instead_of
INSTEAD OF INSERT OR UPDATE OR DELETE ON public.pm_projects
FOR EACH ROW EXECUTE FUNCTION public.trg_pm_projects_instead_of();

NOTIFY pgrst, 'reload schema';

COMMIT;
