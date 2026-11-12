BEGIN;

DO $$
DECLARE
  v_proj_id uuid;
  v_stk_id text;
BEGIN
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('أحمد حمام كامل الأمير') OR lower(name_ar) = lower('أحمد حمام كامل الأمير') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'أحمد حمام كامل الأمير', 
        'أحمد حمام كامل الأمير', 
        NULLIF('', ''), 
        NULLIF('Hotel Store Keeper', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Hotel Store Keeper', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '346' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '346' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed Mamdouh Hassan Ali') OR lower(name_ar) = lower('Mohammed Mamdouh Hassan Ali') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohammed Mamdouh Hassan Ali', 
        'Mohammed Mamdouh Hassan Ali', 
        NULLIF('346', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '287' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '287' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed Abd El Razek Fahmy الشباسي') OR lower(name_ar) = lower('Mohammed Abd El Razek Fahmy الشباسي') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohammed Abd El Razek Fahmy الشباسي', 
        'Mohammed Abd El Razek Fahmy الشباسي', 
        NULLIF('287', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01067080305', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '324' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '324' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Galal Abd El Aty Sadek') OR lower(name_ar) = lower('Galal Abd El Aty Sadek') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Galal Abd El Aty Sadek', 
        'Galal Abd El Aty Sadek', 
        NULLIF('324', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Omar Magdi') OR lower(name_ar) = lower('Omar Magdi') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Omar Magdi', 
        'Omar Magdi', 
        NULLIF('', ''), 
        NULLIF('Construction Manager', ''), 
        NULLIF('01002911856', ''), 
        NULLIF('Marakez', ''), 
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
        COALESCE(NULLIF('Construction Manager', ''), 'عضو فريق'),
        'accountable',
        'client',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '91' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '91' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Mohammed Shehata abd alglil') OR lower(name_ar) = lower('Ahmed Mohammed Shehata abd alglil') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ahmed Mohammed Shehata abd alglil', 
        'Ahmed Mohammed Shehata abd alglil', 
        NULLIF('91', ''), 
        NULLIF('Site Engeneer', ''), 
        NULLIF('01022855665', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '151' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '151' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mostafa Amir Ahmed') OR lower(name_ar) = lower('Mostafa Amir Ahmed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mostafa Amir Ahmed', 
        'Mostafa Amir Ahmed', 
        NULLIF('151', ''), 
        NULLIF('Site Engeneer', ''), 
        NULLIF('01050390804', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '331' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '331' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mahmoud Khaled Ahmed') OR lower(name_ar) = lower('Mahmoud Khaled Ahmed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mahmoud Khaled Ahmed', 
        'Mahmoud Khaled Ahmed', 
        NULLIF('331', ''), 
        NULLIF('Civil Site Eng.', ''), 
        NULLIF('01117027500', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '373' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '373' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Mohsn Barkat Moamed') OR lower(name_ar) = lower('Mohamed Mohsn Barkat Moamed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohamed Mohsn Barkat Moamed', 
        'Mohamed Mohsn Barkat Moamed', 
        NULLIF('373', ''), 
        NULLIF('Electrical Site Eng.', ''), 
        NULLIF('01144775783 -  01032985553', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '212' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '212' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed ali hasan Ibrahim El lbani') OR lower(name_ar) = lower('Mohammed ali hasan Ibrahim El lbani') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohammed ali hasan Ibrahim El lbani', 
        'Mohammed ali hasan Ibrahim El lbani', 
        NULLIF('212', ''), 
        NULLIF('Safety', ''), 
        NULLIF('01022354004', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '210' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '210' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Ayman Ali') OR lower(name_ar) = lower('Ali Ayman Ali') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ali Ayman Ali', 
        'Ali Ayman Ali', 
        NULLIF('210', ''), 
        NULLIF('Surveyors', ''), 
        NULLIF('01003447406', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '294' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '294' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Nasser Mahmoud') OR lower(name_ar) = lower('Mohamed Nasser Mahmoud') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohamed Nasser Mahmoud', 
        'Mohamed Nasser Mahmoud', 
        NULLIF('294', ''), 
        NULLIF('DC', ''), 
        NULLIF('01208523873', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('DC', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('حامد السيد إبراهيم الخواجة') OR lower(name_ar) = lower('حامد السيد إبراهيم الخواجة') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'حامد السيد إبراهيم الخواجة', 
        'حامد السيد إبراهيم الخواجة', 
        NULLIF('', ''), 
        NULLIF('Store Keeper', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('رجب عبد البديع') OR lower(name_ar) = lower('رجب عبد البديع') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'رجب عبد البديع', 
        'رجب عبد البديع', 
        NULLIF('', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('0128296', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '284' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '284' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Rateb Mahmoud') OR lower(name_ar) = lower('Ahmed Rateb Mahmoud') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ahmed Rateb Mahmoud', 
        'Ahmed Rateb Mahmoud', 
        NULLIF('284', ''), 
        NULLIF('Accountant', ''), 
        NULLIF('01149242525', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Accountant', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '91' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '91' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Mohammed Shehata abd alglil') OR lower(name_ar) = lower('Ahmed Mohammed Shehata abd alglil') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ahmed Mohammed Shehata abd alglil', 
        'Ahmed Mohammed Shehata abd alglil', 
        NULLIF('91', ''), 
        NULLIF('Site Engeneer', ''), 
        NULLIF('01022855665', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '151' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '151' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mostafa Amir Ahmed') OR lower(name_ar) = lower('Mostafa Amir Ahmed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mostafa Amir Ahmed', 
        'Mostafa Amir Ahmed', 
        NULLIF('151', ''), 
        NULLIF('Site Engeneer', ''), 
        NULLIF('01050390804', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '331' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '331' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mahmoud Khaled Ahmed') OR lower(name_ar) = lower('Mahmoud Khaled Ahmed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mahmoud Khaled Ahmed', 
        'Mahmoud Khaled Ahmed', 
        NULLIF('331', ''), 
        NULLIF('Civil Site Eng.', ''), 
        NULLIF('01117027500', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '373' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '373' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Mohsn Barkat Moamed') OR lower(name_ar) = lower('Mohamed Mohsn Barkat Moamed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohamed Mohsn Barkat Moamed', 
        'Mohamed Mohsn Barkat Moamed', 
        NULLIF('373', ''), 
        NULLIF('Electrical Site Eng.', ''), 
        NULLIF('01144775783 -  01032985553', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '212' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '212' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed ali hasan Ibrahim El lbani') OR lower(name_ar) = lower('Mohammed ali hasan Ibrahim El lbani') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohammed ali hasan Ibrahim El lbani', 
        'Mohammed ali hasan Ibrahim El lbani', 
        NULLIF('212', ''), 
        NULLIF('Safety', ''), 
        NULLIF('01022354004', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '210' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '210' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Ayman Ali') OR lower(name_ar) = lower('Ali Ayman Ali') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ali Ayman Ali', 
        'Ali Ayman Ali', 
        NULLIF('210', ''), 
        NULLIF('Surveyors', ''), 
        NULLIF('01003447406', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '294' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '294' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Nasser Mahmoud') OR lower(name_ar) = lower('Mohamed Nasser Mahmoud') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohamed Nasser Mahmoud', 
        'Mohamed Nasser Mahmoud', 
        NULLIF('294', ''), 
        NULLIF('DC', ''), 
        NULLIF('01208523873', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('DC', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('حامد السيد إبراهيم الخواجة') OR lower(name_ar) = lower('حامد السيد إبراهيم الخواجة') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'حامد السيد إبراهيم الخواجة', 
        'حامد السيد إبراهيم الخواجة', 
        NULLIF('', ''), 
        NULLIF('Store Keeper', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('رجب عبد البديع') OR lower(name_ar) = lower('رجب عبد البديع') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'رجب عبد البديع', 
        'رجب عبد البديع', 
        NULLIF('', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01282963221', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '284' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '284' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Rateb Mahmoud') OR lower(name_ar) = lower('Ahmed Rateb Mahmoud') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ahmed Rateb Mahmoud', 
        'Ahmed Rateb Mahmoud', 
        NULLIF('284', ''), 
        NULLIF('Accountant', ''), 
        NULLIF('01149242525', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Accountant', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Tarek Shawkat') OR lower(name_ar) = lower('Tarek Shawkat') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Tarek Shawkat', 
        'Tarek Shawkat', 
        NULLIF('', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('01005759415', ''), 
        NULLIF('HAP', ''), 
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
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'accountable',
        'contractor',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '41' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '41' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Osama ShahIn') OR lower(name_ar) = lower('Osama ShahIn') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Osama ShahIn', 
        'Osama ShahIn', 
        NULLIF('41', ''), 
        NULLIF('Civil Site Eng.', ''), 
        NULLIF('01201605952', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '398' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '398' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mhmwd Mohamed Abd Altif Mohamed') OR lower(name_ar) = lower('Mhmwd Mohamed Abd Altif Mohamed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mhmwd Mohamed Abd Altif Mohamed', 
        'Mhmwd Mohamed Abd Altif Mohamed', 
        NULLIF('398', ''), 
        NULLIF('Civil Site Eng.', ''), 
        NULLIF('01110562135- 01034349407', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '384' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '384' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Akram Mohammed Abd Al-Alim') OR lower(name_ar) = lower('Akram Mohammed Abd Al-Alim') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Akram Mohammed Abd Al-Alim', 
        'Akram Mohammed Abd Al-Alim', 
        NULLIF('384', ''), 
        NULLIF('civil site Eng', ''), 
        NULLIF('01110771473', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('civil site Eng', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '383' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '383' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mahmoud Mostafa Abd al kader') OR lower(name_ar) = lower('Mahmoud Mostafa Abd al kader') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mahmoud Mostafa Abd al kader', 
        'Mahmoud Mostafa Abd al kader', 
        NULLIF('383', ''), 
        NULLIF('Planning Eng ( civil )', ''), 
        NULLIF('01022013110', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Planning Eng ( civil )', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '341' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '341' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Kamel Abd El Razek') OR lower(name_ar) = lower('Ahmed Kamel Abd El Razek') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ahmed Kamel Abd El Razek', 
        'Ahmed Kamel Abd El Razek', 
        NULLIF('341', ''), 
        NULLIF('Safety', ''), 
        NULLIF('01025604031', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '315' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '315' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mostafa Ali Ahmed Rabee''') OR lower(name_ar) = lower('Mostafa Ali Ahmed Rabee''') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mostafa Ali Ahmed Rabee''', 
        'Mostafa Ali Ahmed Rabee''', 
        NULLIF('315', ''), 
        NULLIF('Accountant', ''), 
        NULLIF('01064935493', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Accountant', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '267' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '267' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Amr Ahmed gouda Mhmwd Aldwi') OR lower(name_ar) = lower('Amr Ahmed gouda Mhmwd Aldwi') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Amr Ahmed gouda Mhmwd Aldwi', 
        'Amr Ahmed gouda Mhmwd Aldwi', 
        NULLIF('267', ''), 
        NULLIF('Surveyors', ''), 
        NULLIF('01206172633-01070274713', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Basem Abd Al Daim Mohamed') OR lower(name_ar) = lower('Basem Abd Al Daim Mohamed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Basem Abd Al Daim Mohamed', 
        'Basem Abd Al Daim Mohamed', 
        NULLIF('', ''), 
        NULLIF('Surveyors', ''), 
        NULLIF('01026053559', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Eslam Said Abd Alrazek Mostfa') OR lower(name_ar) = lower('Eslam Said Abd Alrazek Mostfa') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Eslam Said Abd Alrazek Mostfa', 
        'Eslam Said Abd Alrazek Mostfa', 
        NULLIF('', ''), 
        NULLIF('Surveyors', ''), 
        NULLIF('01276397335', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Al Sid Ahmed Al Sid') OR lower(name_ar) = lower('Mohamed Al Sid Ahmed Al Sid') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohamed Al Sid Ahmed Al Sid', 
        'Mohamed Al Sid Ahmed Al Sid', 
        NULLIF('', ''), 
        NULLIF('DC', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('DC', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '333' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '333' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abdulkhaliq Gharib Abdulkhaliq Muhammad') OR lower(name_ar) = lower('Abdulkhaliq Gharib Abdulkhaliq Muhammad') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Abdulkhaliq Gharib Abdulkhaliq Muhammad', 
        'Abdulkhaliq Gharib Abdulkhaliq Muhammad', 
        NULLIF('333', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01208422133', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '230' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '230' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Shaaban Ahmed Morsy') OR lower(name_ar) = lower('Ahmed Shaaban Ahmed Morsy') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ahmed Shaaban Ahmed Morsy', 
        'Ahmed Shaaban Ahmed Morsy', 
        NULLIF('230', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01032977761', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('أحمد أشرف محمد فرج جاد') OR lower(name_ar) = lower('أحمد أشرف محمد فرج جاد') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'أحمد أشرف محمد فرج جاد', 
        'أحمد أشرف محمد فرج جاد', 
        NULLIF('', ''), 
        NULLIF('Store Keeper', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('محمود عادل') OR lower(name_ar) = lower('محمود عادل') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'محمود عادل', 
        'محمود عادل', 
        NULLIF('', ''), 
        NULLIF('Store Keeper', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2421' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Youssef') OR lower(name_ar) = lower('Ahmed Youssef') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ahmed Youssef', 
        'Ahmed Youssef', 
        NULLIF('', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('01033047468', ''), 
        NULLIF('HAC', ''), 
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
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'accountable',
        'contractor',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2421' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '41' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '41' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Osama ShahIn') OR lower(name_ar) = lower('Osama ShahIn') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Osama ShahIn', 
        'Osama ShahIn', 
        NULLIF('41', ''), 
        NULLIF('Civil Site Eng.', ''), 
        NULLIF('01201605952', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2421' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '241' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '241' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Sherif Sayed') OR lower(name_ar) = lower('Sherif Sayed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Sherif Sayed', 
        'Sherif Sayed', 
        NULLIF('241', ''), 
        NULLIF('Architecture Site Eng.', ''), 
        NULLIF('01111207674/ 01020033837', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Architecture Site Eng.', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2421' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Nabil Abd El Aal') OR lower(name_ar) = lower('Nabil Abd El Aal') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Nabil Abd El Aal', 
        'Nabil Abd El Aal', 
        NULLIF('', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01061982559', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2421' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '231' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '231' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('EL Sayed Amer') OR lower(name_ar) = lower('EL Sayed Amer') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'EL Sayed Amer', 
        'EL Sayed Amer', 
        NULLIF('231', ''), 
        NULLIF('Store Keeper', ''), 
        NULLIF('01005869696', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2404' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Tamer Safwat') OR lower(name_ar) = lower('Tamer Safwat') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Tamer Safwat', 
        'Tamer Safwat', 
        NULLIF('', ''), 
        NULLIF('Projects Director', ''), 
        NULLIF('01067790915', ''), 
        NULLIF('LMD', ''), 
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
        COALESCE(NULLIF('Projects Director', ''), 'عضو فريق'),
        'accountable',
        'client',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2404' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '41' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '41' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Osama ShahIn') OR lower(name_ar) = lower('Osama ShahIn') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Osama ShahIn', 
        'Osama ShahIn', 
        NULLIF('41', ''), 
        NULLIF('Civil Site Eng.', ''), 
        NULLIF('01201605952', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2404' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '122' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '122' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Wael said mahmoud Daha') OR lower(name_ar) = lower('Wael said mahmoud Daha') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Wael said mahmoud Daha', 
        'Wael said mahmoud Daha', 
        NULLIF('122', ''), 
        NULLIF('Site Engeneer', ''), 
        NULLIF('01099500362', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2404' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '213' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '213' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abd El Rahman Saad') OR lower(name_ar) = lower('Abd El Rahman Saad') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Abd El Rahman Saad', 
        'Abd El Rahman Saad', 
        NULLIF('213', ''), 
        NULLIF('Mech Eng', ''), 
        NULLIF('01032977701', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Mech Eng', ''), 'عضو فريق'),
        'responsible',
        'employee',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2404' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '335' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '335' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Omar Nabil Abd El Aal') OR lower(name_ar) = lower('Omar Nabil Abd El Aal') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Omar Nabil Abd El Aal', 
        'Omar Nabil Abd El Aal', 
        NULLIF('335', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01080746466', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
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
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'responsible',
        'employee',
        NOW()
      );
    END IF;
  END IF;
END $$;

COMMIT;