BEGIN;

DO $$
DECLARE
  v_proj_id uuid;
  v_stk_id text;
BEGIN
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF 'Technical Supervisor' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Technical Supervisor' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('1') OR lower(name_ar) = lower('1') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '1', 
        '1', 
        NULLIF('Technical Supervisor', ''), 
        NULLIF('0 1090043116', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'client_rep', 
        'client_rep'
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000001',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 1090043116', ''), 'عضو فريق'),
        'accountable',
        'consultant',
        NOW()
      );
    END IF;
  END IF;
END $$;


DO $$
DECLARE
  v_proj_id uuid;
  v_stk_id text;
BEGIN
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF 'Surveyor' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Surveyor' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('210') OR lower(name_ar) = lower('210') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '210', 
        '210', 
        NULLIF('Surveyor', ''), 
        NULLIF('', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'client_rep', 
        'client_rep'
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000001',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('', ''), 'عضو فريق'),
        'accountable',
        'consultant',
        NOW()
      );
    END IF;
  END IF;
END $$;


DO $$
DECLARE
  v_proj_id uuid;
  v_stk_id text;
BEGIN
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF 'Technical Supervisor' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Technical Supervisor' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('123') OR lower(name_ar) = lower('123') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '123', 
        '123', 
        NULLIF('Technical Supervisor', ''), 
        NULLIF('0 1065736661', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'client_rep', 
        'client_rep'
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000001',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 1065736661', ''), 'عضو فريق'),
        'accountable',
        'consultant',
        NOW()
      );
    END IF;
  END IF;
END $$;

COMMIT;