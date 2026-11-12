BEGIN;

DO $$
DECLARE
  v_proj_id uuid;
  v_stk_id text;
BEGIN
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Hesham El Seifi') OR lower(name_ar) = lower('Hesham El Seifi') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Hesham El Seifi', 
        'Hesham El Seifi', 
        NULLIF('', ''), 
        NULLIF('Senior Project Manager', ''), 
        NULLIF('01202624321', ''), 
        NULLIF('Emaar', ''), 
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
        COALESCE(NULLIF('Senior Project Manager', ''), 'عضو فريق'),
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Evram Rafat') OR lower(name_ar) = lower('Evram Rafat') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Evram Rafat', 
        'Evram Rafat', 
        NULLIF('', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('01143353755', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '283' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '283' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Wageh Abd El Alim') OR lower(name_ar) = lower('Ahmed Wageh Abd El Alim') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ahmed Wageh Abd El Alim', 
        'Ahmed Wageh Abd El Alim', 
        NULLIF('283', ''), 
        NULLIF('Civil project manger', ''), 
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
        COALESCE(NULLIF('Civil project manger', ''), 'عضو فريق'),
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '79' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '79' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Bssam el bdry') OR lower(name_ar) = lower('Bssam el bdry') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Bssam el bdry', 
        'Bssam el bdry', 
        NULLIF('79', ''), 
        NULLIF('Civil site eng.', ''), 
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
        COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '96' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '96' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Khaled Ashraf Aly Khaled') OR lower(name_ar) = lower('Khaled Ashraf Aly Khaled') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Khaled Ashraf Aly Khaled', 
        'Khaled Ashraf Aly Khaled', 
        NULLIF('96', ''), 
        NULLIF('Site Engeneer', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '195' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '195' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim hasan abd El Alim sid') OR lower(name_ar) = lower('Ibrahim hasan abd El Alim sid') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ibrahim hasan abd El Alim sid', 
        'Ibrahim hasan abd El Alim sid', 
        NULLIF('195', ''), 
        NULLIF('Civil site eng.', ''), 
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
        COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '245' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '245' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mustafa mohammed saad abo gali') OR lower(name_ar) = lower('Mustafa mohammed saad abo gali') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mustafa mohammed saad abo gali', 
        'Mustafa mohammed saad abo gali', 
        NULLIF('245', ''), 
        NULLIF('Mechanical Eng.', ''), 
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
        COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '300' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '300' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Omar Samy Abd El Hady Hlal') OR lower(name_ar) = lower('Omar Samy Abd El Hady Hlal') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Omar Samy Abd El Hady Hlal', 
        'Omar Samy Abd El Hady Hlal', 
        NULLIF('300', ''), 
        NULLIF('Civil Site Eng.', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '340' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '340' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Yhia Ismail Abd Alhmid') OR lower(name_ar) = lower('Ahmed Yhia Ismail Abd Alhmid') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ahmed Yhia Ismail Abd Alhmid', 
        'Ahmed Yhia Ismail Abd Alhmid', 
        NULLIF('340', ''), 
        NULLIF('Mechanical Eng.', ''), 
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
        COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '348' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '348' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Mohammed Mostafa Slim') OR lower(name_ar) = lower('Ahmed Mohammed Mostafa Slim') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ahmed Mohammed Mostafa Slim', 
        'Ahmed Mohammed Mostafa Slim', 
        NULLIF('348', ''), 
        NULLIF('Civil Site Eng.', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '385' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '385' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Karim mohamed Ali Mahmoud Mohamed') OR lower(name_ar) = lower('Karim mohamed Ali Mahmoud Mohamed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Karim mohamed Ali Mahmoud Mohamed', 
        'Karim mohamed Ali Mahmoud Mohamed', 
        NULLIF('385', ''), 
        NULLIF('Mechanical Eng.', ''), 
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
        COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '387' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '387' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Osama Mohammady Mohammed ELE.') OR lower(name_ar) = lower('Osama Mohammady Mohammed ELE.') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Osama Mohammady Mohammed ELE.', 
        'Osama Mohammady Mohammed ELE.', 
        NULLIF('387', ''), 
        NULLIF('Electrical Site Eng.', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '391' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '391' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Saoudi Mohamed Issa') OR lower(name_ar) = lower('Saoudi Mohamed Issa') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Saoudi Mohamed Issa', 
        'Saoudi Mohamed Issa', 
        NULLIF('391', ''), 
        NULLIF('Electrical Site Eng.', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '178' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '178' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed hassan abo al liel') OR lower(name_ar) = lower('Mohammed hassan abo al liel') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohammed hassan abo al liel', 
        'Mohammed hassan abo al liel', 
        NULLIF('178', ''), 
        NULLIF('Safety', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '286' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '286' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Adel Mohammed Sawy') OR lower(name_ar) = lower('Adel Mohammed Sawy') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Adel Mohammed Sawy', 
        'Adel Mohammed Sawy', 
        NULLIF('286', ''), 
        NULLIF('Safety', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '339' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '339' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Karim Adel Adly') OR lower(name_ar) = lower('Karim Adel Adly') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Karim Adel Adly', 
        'Karim Adel Adly', 
        NULLIF('339', ''), 
        NULLIF('Safety', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '89' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '89' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Mohammed El Sahaty') OR lower(name_ar) = lower('Ahmed Mohammed El Sahaty') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ahmed Mohammed El Sahaty', 
        'Ahmed Mohammed El Sahaty', 
        NULLIF('89', ''), 
        NULLIF('Surveyors', ''), 
        NULLIF('0109745550 P.zone 01120429166', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '181' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '181' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim khaled abd el aty') OR lower(name_ar) = lower('Ibrahim khaled abd el aty') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ibrahim khaled abd el aty', 
        'Ibrahim khaled abd el aty', 
        NULLIF('181', ''), 
        NULLIF('Surveyors', ''), 
        NULLIF('01099697535 Per.', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mina George') OR lower(name_ar) = lower('Mina George') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mina George', 
        'Mina George', 
        NULLIF('', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('01212111457', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '283' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '283' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Wageh Abd El Alim') OR lower(name_ar) = lower('Ahmed Wageh Abd El Alim') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ahmed Wageh Abd El Alim', 
        'Ahmed Wageh Abd El Alim', 
        NULLIF('283', ''), 
        NULLIF('Civil project manger', ''), 
        NULLIF('29810011700316', ''), 
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
        COALESCE(NULLIF('Civil project manger', ''), 'عضو فريق'),
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '79' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '79' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Bssam el bdry') OR lower(name_ar) = lower('Bssam el bdry') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Bssam el bdry', 
        'Bssam el bdry', 
        NULLIF('79', ''), 
        NULLIF('Civil site eng.', ''), 
        NULLIF('29302140104774', ''), 
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
        COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '96' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '96' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Khaled Ashraf Aly Khaled') OR lower(name_ar) = lower('Khaled Ashraf Aly Khaled') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Khaled Ashraf Aly Khaled', 
        'Khaled Ashraf Aly Khaled', 
        NULLIF('96', ''), 
        NULLIF('Site Engeneer', ''), 
        NULLIF('29704161600276', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '195' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '195' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim hasan abd El Alim sid') OR lower(name_ar) = lower('Ibrahim hasan abd El Alim sid') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ibrahim hasan abd El Alim sid', 
        'Ibrahim hasan abd El Alim sid', 
        NULLIF('195', ''), 
        NULLIF('Civil site eng.', ''), 
        NULLIF('29811061402052', ''), 
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
        COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '245' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '245' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mustafa mohammed saad abo gali') OR lower(name_ar) = lower('Mustafa mohammed saad abo gali') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mustafa mohammed saad abo gali', 
        'Mustafa mohammed saad abo gali', 
        NULLIF('245', ''), 
        NULLIF('Mechanical Eng.', ''), 
        NULLIF('29809091500097', ''), 
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
        COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '300' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '300' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Omar Samy Abd El Hady Hlal') OR lower(name_ar) = lower('Omar Samy Abd El Hady Hlal') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Omar Samy Abd El Hady Hlal', 
        'Omar Samy Abd El Hady Hlal', 
        NULLIF('300', ''), 
        NULLIF('Civil Site Eng.', ''), 
        NULLIF('30212021700179', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '340' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '340' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Yhia Ismail Abd Alhmid') OR lower(name_ar) = lower('Ahmed Yhia Ismail Abd Alhmid') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ahmed Yhia Ismail Abd Alhmid', 
        'Ahmed Yhia Ismail Abd Alhmid', 
        NULLIF('340', ''), 
        NULLIF('Mechanical Eng.', ''), 
        NULLIF('29105312100156', ''), 
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
        COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
        'responsible',
        'employee',
        NOW()
      );
    END IF;
  END IF;
END $$;

COMMIT;