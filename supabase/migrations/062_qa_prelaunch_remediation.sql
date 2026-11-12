-- ============================================================================
-- Migration 056: Pre-Launch QA Security, Storage & RLS Remediation
-- Status: APPLIED TO LIVE SUPABASE (tgqpcviqmgtdddiqvqdw)
-- Remediates:
--   P1-01: progress-photos bucket public read for getPublicUrl() + progress-documents RLS
--   P1-02: security_invoker = true across all 12 unhardened public views (+ schema pm USAGE)
--   P1-03: Explicit SET search_path = public on all 6 remaining SECURITY DEFINER functions
--   P1-06: Server-side BOQ price masking in v_boq_current + fn_user_can_see_prices alignment
-- ============================================================================

-- 1. SCHEMA & BASE TABLE GRANTS REQUIRED BEFORE ENABLING security_invoker = true
GRANT USAGE ON SCHEMA pm TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pm TO authenticated, service_role;
GRANT SELECT ON public.projects TO authenticated, service_role;
GRANT SELECT ON public.clients TO authenticated, service_role;
GRANT SELECT ON public.stakeholders TO authenticated, service_role;
GRANT SELECT ON public.governorates TO authenticated, service_role;
GRANT SELECT ON public.cities TO authenticated, service_role;
GRANT SELECT ON public.vendors TO authenticated, service_role;
GRANT SELECT ON public.organizations TO authenticated, service_role;
GRANT SELECT ON public.project_stakeholders TO authenticated, service_role;

-- Ensure commercial/financial/procurement roles also pass fn_user_can_access_project
-- now that pm_projects enforces security_invoker = true.
CREATE OR REPLACE FUNCTION public.fn_user_can_access_project(p_user_id uuid, p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_roles text[];
BEGIN
  IF p_project_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Preserve service_role / server-side unauthenticated context bypass
  IF p_user_id IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check profiles.roles array
  SELECT roles::text[] INTO v_roles
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_roles && ARRAY[
    'admin', 'ceo', 'coo', 'coo_assistant', 'chairman',
    'board_member', 'commercial_manager', 'planning_manager',
    'planning_engineer', 'project_manager', 'to_manager',
    'technical_office', 'qc_inspector', 'site_engineer', 'to_engineer',
    'cost_control', 'estimator', 'contract_admin', 'finance',
    'ipc_clerk', 'procurement', 'inventory'
  ]::text[] THEN
    RETURN TRUE;
  END IF;

  -- Check public.user_roles table
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.role::text IN (
        'admin', 'ceo', 'coo', 'coo_assistant', 'chairman',
        'board_member', 'commercial_manager', 'planning_manager',
        'planning_engineer', 'project_manager', 'to_manager',
        'technical_office', 'qc_inspector', 'site_engineer', 'to_engineer',
        'cost_control', 'estimator', 'contract_admin', 'finance',
        'ipc_clerk', 'procurement', 'inventory'
      )
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check pm_user_project_access
  IF EXISTS (
    SELECT 1 FROM public.pm_user_project_access upa
    WHERE upa.user_id = p_user_id AND upa.project_id = p_project_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check project_stakeholders link
  IF EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    JOIN public.stakeholders s ON s.id = ps.stakeholder_id
    WHERE ps.project_id = p_project_id
      AND s.auth_user_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check direct PM assignment on project
  IF EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.stakeholders s ON s.id = p.project_manager_stakeholder_id
    WHERE p.id = p_project_id
      AND s.auth_user_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 2. ENABLE security_invoker = true ON ALL 12 UNHARDENED VIEWS (+ v_boq_with_actuals)
ALTER VIEW public.pm_cities SET (security_invoker = true);
ALTER VIEW public.pm_clients SET (security_invoker = true);
ALTER VIEW public.pm_governorates SET (security_invoker = true);
ALTER VIEW public.pm_project_client_contacts SET (security_invoker = true);
ALTER VIEW public.pm_project_site_resources SET (security_invoker = true);
ALTER VIEW public.pm_project_subcontractors SET (security_invoker = true);
ALTER VIEW public.pm_projects SET (security_invoker = true);
ALTER VIEW public.pm_projects_with_manager SET (security_invoker = true);
ALTER VIEW public.pm_stakeholders SET (security_invoker = true);
ALTER VIEW public.project_client_contacts SET (security_invoker = true);
ALTER VIEW public.project_site_resources SET (security_invoker = true);
ALTER VIEW public.project_subcontractors SET (security_invoker = true);
ALTER VIEW public.v_boq_with_actuals SET (security_invoker = true);

-- 3. LOCK search_path ON ALL 6 REMAINING SECURITY DEFINER FUNCTIONS (P1-03)
ALTER FUNCTION public.rpc_site_task_transition(uuid, text, text, jsonb, numeric) SET search_path = public;
ALTER FUNCTION public.rpc_reassign_task(uuid, uuid, text, text) SET search_path = public;
ALTER FUNCTION public.rpc_replan_task(uuid, date, date, text) SET search_path = public;
ALTER FUNCTION public.trg_pm_projects_delete() SET search_path = public;
ALTER FUNCTION public.trg_pm_projects_insert() SET search_path = public;
ALTER FUNCTION public.trg_pm_projects_update() SET search_path = public;

-- 4. SERVER-SIDE FINANCIAL PRICE MASKING IN fn_user_can_see_prices & v_boq_current (P1-06)
CREATE OR REPLACE FUNCTION public.fn_user_can_see_prices(p_user_id uuid, p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_roles text[];
  v_table_roles text[];
  v_all_roles text[];
  v_price_flag boolean := false;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT COALESCE(roles::text[], ARRAY[]::text[]), COALESCE(price_access_granted, false)
    INTO v_profile_roles, v_price_flag
  FROM public.profiles
  WHERE id = p_user_id;

  SELECT COALESCE(array_agg(ur.role::text), ARRAY[]::text[])
    INTO v_table_roles
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id;

  v_all_roles := COALESCE(v_profile_roles, ARRAY[]::text[]) || COALESCE(v_table_roles, ARRAY[]::text[]);

  -- site_engineer NEVER sees prices unless also holding an explicit financial/executive role
  IF v_all_roles && ARRAY['site_engineer']::text[]
     AND NOT (v_all_roles && ARRAY[
       'admin', 'commercial_manager', 'cost_control', 'estimator',
       'project_manager', 'ceo', 'coo', 'chairman', 'planning_manager',
       'finance', 'contract_admin'
     ]::text[])
  THEN
    RETURN FALSE;
  END IF;

  -- Financial & executive roles always see prices
  IF v_all_roles && ARRAY[
    'admin', 'commercial_manager', 'cost_control', 'estimator',
    'project_manager', 'ceo', 'coo', 'chairman', 'planning_manager',
    'finance', 'contract_admin'
  ]::text[] THEN
    RETURN TRUE;
  END IF;

  -- Profile-level explicit price delegation flag
  IF v_price_flag THEN
    RETURN TRUE;
  END IF;

  -- planning_engineer requires an active, unrevoked grant in pm_price_view_grants
  IF v_all_roles && ARRAY['planning_engineer']::text[] THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.pm_price_view_grants
      WHERE granted_to = p_user_id
        AND (p_project_id IS NULL OR project_id = p_project_id)
        AND revoked_at IS NULL
    );
  END IF;

  RETURN FALSE;
END;
$$;

CREATE OR REPLACE VIEW public.v_boq_current WITH (security_invoker = true) AS
SELECT
  id,
  project_id,
  item_code,
  cost_code_id,
  cost_code,
  cost_code_name_ar,
  description_ar,
  description_en,
  unit,
  contract_qty,
  shop_drawing_qty,
  pricing_status,
  foreign_currency,
  (CASE
    WHEN auth.uid() IS NULL OR public.fn_user_can_see_prices(auth.uid(), project_id) THEN base_foreign_amount
    ELSE NULL
  END)::numeric(15,2) AS base_foreign_amount,
  (CASE
    WHEN auth.uid() IS NULL OR public.fn_user_can_see_prices(auth.uid(), project_id) THEN rate_egp
    ELSE NULL
  END)::numeric(15,2) AS rate_egp,
  (CASE
    WHEN auth.uid() IS NULL OR public.fn_user_can_see_prices(auth.uid(), project_id) THEN amount_egp
    ELSE NULL
  END)::numeric(15,2) AS amount_egp,
  wbs_item_id,
  wbs_title_ar,
  revision,
  is_current,
  vo_ref,
  total_installed_qty,
  (CASE
    WHEN auth.uid() IS NULL OR public.fn_user_can_see_prices(auth.uid(), project_id) THEN total_earned_egp
    ELSE NULL
  END)::numeric AS total_earned_egp,
  qty_completion_pct,
  notes,
  created_at,
  updated_at
FROM public.v_boq_with_actuals
WHERE is_current = true;

GRANT SELECT ON public.v_boq_current TO authenticated, service_role;
GRANT SELECT ON public.v_boq_with_actuals TO authenticated, service_role;

-- 5. STORAGE BUCKET VISIBILITY & MISSING progress-documents POLICIES (P1-01)
UPDATE storage.buckets
SET public = true
WHERE id = 'progress-photos';

DROP POLICY IF EXISTS "project_scoped_read_progress_documents" ON storage.objects;
CREATE POLICY "project_scoped_read_progress_documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'progress-documents' AND (
      EXISTS (
        SELECT 1 FROM public.pm_user_project_access upa
        WHERE upa.project_id::text = (storage.foldername(name))[1]
          AND upa.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager','project_manager','contract_admin','technical_office','to_manager')
      )
    )
  );

DROP POLICY IF EXISTS "project_scoped_insert_progress_documents" ON storage.objects;
CREATE POLICY "project_scoped_insert_progress_documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'progress-documents' AND (
      EXISTS (
        SELECT 1 FROM public.pm_user_project_access upa
        WHERE upa.project_id::text = (storage.foldername(name))[1]
          AND upa.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager','project_manager','site_engineer','planning_engineer','planning_manager','technical_office','to_manager','contract_admin')
      )
    )
  );

DROP POLICY IF EXISTS "project_scoped_update_progress_documents" ON storage.objects;
CREATE POLICY "project_scoped_update_progress_documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'progress-documents' AND (
      EXISTS (
        SELECT 1 FROM public.pm_user_project_access upa
        WHERE upa.project_id::text = (storage.foldername(name))[1]
          AND upa.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager','project_manager','contract_admin')
      )
    )
  );

DROP POLICY IF EXISTS "project_scoped_delete_progress_documents" ON storage.objects;
CREATE POLICY "project_scoped_delete_progress_documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'progress-documents' AND (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager','project_manager')
      )
    )
  );


-- 6. POST-MERGE LIVE SCHEMA SYNC: employees security_invoker, profiles.job_title, projects.public_name & anon lockdown
ALTER VIEW IF EXISTS public.employees SET (security_invoker = true);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS public_name TEXT;

CREATE OR REPLACE VIEW public.pm_projects_with_manager
WITH (security_invoker = true)
AS
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
    p.cancellation_reason AS cancel_reason,
    p.public_name
FROM public.projects p
LEFT JOIN public.clients c ON p.client_id = c.id
LEFT JOIN public.stakeholders s ON p.project_manager_stakeholder_id = s.id
LEFT JOIN public.governorates g ON p.governorate_id = g.id;

CREATE OR REPLACE VIEW public.pm_projects
WITH (security_invoker = true)
AS
SELECT * FROM public.pm_projects_with_manager;

CREATE OR REPLACE FUNCTION public.trg_pm_projects_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.trg_pm_projects_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_proj_id UUID;
    res public.pm_projects%ROWTYPE;
BEGIN
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
        NEW.public_name,
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
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pm_projects_with_manager TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pm_projects TO authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname IN ('public', 'pm')
      AND roles::text[] @> ARRAY['public']
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I TO authenticated',
                   r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
