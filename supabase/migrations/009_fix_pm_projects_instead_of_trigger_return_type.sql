-- Migration: 009_fix_pm_projects_instead_of_trigger_return_type.sql
-- Description: Fix INSTEAD OF trigger to query public.pm_projects view for returned NEW row so structure matches triggering view.

BEGIN;

CREATE OR REPLACE FUNCTION public.trg_pm_projects_instead_of()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_id uuid;
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

    SELECT * INTO NEW FROM public.pm_projects WHERE id = OLD.id LIMIT 1;
    RETURN NEW;

  ELSIF (TG_OP = 'INSERT') THEN
    v_id := COALESCE(NEW.id, gen_random_uuid());

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
      v_id,
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
      updated_at = NOW();

    SELECT * INTO NEW FROM public.pm_projects WHERE id = v_id LIMIT 1;
    RETURN NEW;

  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE pm.projects SET deleted_at = NOW() WHERE id = OLD.id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

NOTIFY pgrst, 'reload schema';

COMMIT;
