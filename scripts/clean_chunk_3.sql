BEGIN;

DO $$
DECLARE
  v_proj_id uuid;
  v_stk_id text;
BEGIN
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '145' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '145' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Fares Amer Ismael') OR lower(name_ar) = lower('Fares Amer Ismael') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Fares Amer Ismael', 
        'Fares Amer Ismael', 
        NULLIF('145', ''), 
        NULLIF('Surveyors', ''), 
        NULLIF('1080474433', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '174' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '174' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Badr ayman mohammed al sid') OR lower(name_ar) = lower('Badr ayman mohammed al sid') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Badr ayman mohammed al sid', 
        'Badr ayman mohammed al sid', 
        NULLIF('174', ''), 
        NULLIF('Surveyors', ''), 
        NULLIF('01094053075 Per.', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '266' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '266' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Abd El Rahim') OR lower(name_ar) = lower('Ahmed Abd El Rahim') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ahmed Abd El Rahim', 
        'Ahmed Abd El Rahim', 
        NULLIF('266', ''), 
        NULLIF('Surveyors', ''), 
        NULLIF('01016444221 P,zone', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '361' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '361' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abd el Rahman mostafa mohammed') OR lower(name_ar) = lower('Abd el Rahman mostafa mohammed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Abd el Rahman mostafa mohammed', 
        'Abd el Rahman mostafa mohammed', 
        NULLIF('361', ''), 
        NULLIF('Surveyors', ''), 
        NULLIF('01278556020 Per.', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '388' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '388' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Hassan Atef Ahmd ali') OR lower(name_ar) = lower('Hassan Atef Ahmd ali') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Hassan Atef Ahmd ali', 
        'Hassan Atef Ahmd ali', 
        NULLIF('388', ''), 
        NULLIF('Surveyors', ''), 
        NULLIF('01126550880 Per. 01066913009', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Zaki Gamal Zaki') OR lower(name_ar) = lower('Zaki Gamal Zaki') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Zaki Gamal Zaki', 
        'Zaki Gamal Zaki', 
        NULLIF('', ''), 
        NULLIF('Surveyors', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '59' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '59' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abd el nabi Mehanni') OR lower(name_ar) = lower('Abd el nabi Mehanni') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Abd el nabi Mehanni', 
        'Abd el nabi Mehanni', 
        NULLIF('59', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01022180082 P.zone', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '325' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '325' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Anwar Magdy Mahmoud Mohamed') OR lower(name_ar) = lower('Anwar Magdy Mahmoud Mohamed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Anwar Magdy Mahmoud Mohamed', 
        'Anwar Magdy Mahmoud Mohamed', 
        NULLIF('325', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01125486320 Per.', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '146' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '146' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed Frg Abdelalim') OR lower(name_ar) = lower('Mohammed Frg Abdelalim') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohammed Frg Abdelalim', 
        'Mohammed Frg Abdelalim', 
        NULLIF('146', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01080474455P.zone / 01032775300', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '375' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '375' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Gmal Abd Alaziz Gafr') OR lower(name_ar) = lower('Mohamed Gmal Abd Alaziz Gafr') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohamed Gmal Abd Alaziz Gafr', 
        'Mohamed Gmal Abd Alaziz Gafr', 
        NULLIF('375', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01029225419 Per.', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '363' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '363' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Amer hany Amer') OR lower(name_ar) = lower('Amer hany Amer') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Amer hany Amer', 
        'Amer hany Amer', 
        NULLIF('363', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01205070268 Per.', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '251' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '251' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Radwan Mohamed') OR lower(name_ar) = lower('Radwan Mohamed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Radwan Mohamed', 
        'Radwan Mohamed', 
        NULLIF('251', ''), 
        NULLIF('DC', ''), 
        NULLIF('01158359385', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '295' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '295' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Alaa Ali Mohamed Ali Almsry') OR lower(name_ar) = lower('Alaa Ali Mohamed Ali Almsry') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Alaa Ali Mohamed Ali Almsry', 
        'Alaa Ali Mohamed Ali Almsry', 
        NULLIF('295', ''), 
        NULLIF('أمين مخزن', ''), 
        NULLIF('01201550167', ''), 
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
        COALESCE(NULLIF('أمين مخزن', ''), 'عضو فريق'),
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '347' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '347' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Omar Sabry Mostafa') OR lower(name_ar) = lower('Omar Sabry Mostafa') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Omar Sabry Mostafa', 
        'Omar Sabry Mostafa', 
        NULLIF('347', ''), 
        NULLIF('محاسب', ''), 
        NULLIF('01070774713', ''), 
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
        COALESCE(NULLIF('محاسب', ''), 'عضو فريق'),
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
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abdel Menem Yassine') OR lower(name_ar) = lower('Abdel Menem Yassine') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Abdel Menem Yassine', 
        'Abdel Menem Yassine', 
        NULLIF('', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('01270350961', ''), 
        NULLIF('Orascom', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '288' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '288' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Maher Fahmy') OR lower(name_ar) = lower('Ahmed Maher Fahmy') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ahmed Maher Fahmy', 
        'Ahmed Maher Fahmy', 
        NULLIF('288', ''), 
        NULLIF('Civil Site Eng.', ''), 
        NULLIF('01273890528', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '248' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '248' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Alaa el Hennawy') OR lower(name_ar) = lower('Alaa el Hennawy') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Alaa el Hennawy', 
        'Alaa el Hennawy', 
        NULLIF('248', ''), 
        NULLIF('Civil Site Eng.', ''), 
        NULLIF('01005277360', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Atef Mohamed Zidan') OR lower(name_ar) = lower('Mohamed Atef Mohamed Zidan') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohamed Atef Mohamed Zidan', 
        'Mohamed Atef Mohamed Zidan', 
        NULLIF('', ''), 
        NULLIF('Civil Site Eng.', ''), 
        NULLIF('01044992845', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('إبراهيم عطا إبراهيم خليل') OR lower(name_ar) = lower('إبراهيم عطا إبراهيم خليل') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'إبراهيم عطا إبراهيم خليل', 
        'إبراهيم عطا إبراهيم خليل', 
        NULLIF('', ''), 
        NULLIF('Hotel Security', ''), 
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
        COALESCE(NULLIF('Hotel Security', ''), 'عضو فريق'),
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

COMMIT;