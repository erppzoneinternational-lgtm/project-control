BEGIN;

DO $$
DECLARE
  v_proj_id uuid;
  v_stk_id text;
BEGIN
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '152' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '152' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim Gomaa') OR lower(name_ar) = lower('Ibrahim Gomaa') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ibrahim Gomaa', 
        'Ibrahim Gomaa', 
        NULLIF('152', ''), 
        NULLIF('Project Manager', ''), 
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
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'accountable',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '249' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '249' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Khalifa Nazeef') OR lower(name_ar) = lower('Ali Khalifa Nazeef') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ali Khalifa Nazeef', 
        'Ali Khalifa Nazeef', 
        NULLIF('249', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '217' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '217' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mokhtar Kotb') OR lower(name_ar) = lower('Mokhtar Kotb') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mokhtar Kotb', 
        'Mokhtar Kotb', 
        NULLIF('217', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '344' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '344' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed El-Bakry') OR lower(name_ar) = lower('Mohamed El-Bakry') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohamed El-Bakry', 
        'Mohamed El-Bakry', 
        NULLIF('344', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '226' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '226' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Pola Morris') OR lower(name_ar) = lower('Pola Morris') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Pola Morris', 
        'Pola Morris', 
        NULLIF('226', ''), 
        NULLIF('Mechanical Section Head', ''), 
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
        COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
        'accountable',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2414' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Eng. Tamer') OR lower(name_ar) = lower('Eng. Tamer') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Eng. Tamer', 
        'Eng. Tamer', 
        NULLIF('', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('01018222731', ''), 
        NULLIF('Curve - DMC', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2414' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '152' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '152' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim Gomaa') OR lower(name_ar) = lower('Ibrahim Gomaa') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ibrahim Gomaa', 
        'Ibrahim Gomaa', 
        NULLIF('152', ''), 
        NULLIF('Project Manager', ''), 
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
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'accountable',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2414' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '249' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '249' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Khalifa Nazeef') OR lower(name_ar) = lower('Ali Khalifa Nazeef') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ali Khalifa Nazeef', 
        'Ali Khalifa Nazeef', 
        NULLIF('249', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2414' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '217' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '217' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mokhtar Kotb') OR lower(name_ar) = lower('Mokhtar Kotb') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mokhtar Kotb', 
        'Mokhtar Kotb', 
        NULLIF('217', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2414' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '344' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '344' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed El-Bakry') OR lower(name_ar) = lower('Mohamed El-Bakry') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohamed El-Bakry', 
        'Mohamed El-Bakry', 
        NULLIF('344', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2414' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '226' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '226' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Pola Morris') OR lower(name_ar) = lower('Pola Morris') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Pola Morris', 
        'Pola Morris', 
        NULLIF('226', ''), 
        NULLIF('Mechanical Section Head', ''), 
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
        COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
        'accountable',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2333' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '152' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '152' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim Gomaa') OR lower(name_ar) = lower('Ibrahim Gomaa') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ibrahim Gomaa', 
        'Ibrahim Gomaa', 
        NULLIF('152', ''), 
        NULLIF('Project Manager', ''), 
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
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'accountable',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2333' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '249' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '249' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Khalifa Nazeef') OR lower(name_ar) = lower('Ali Khalifa Nazeef') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ali Khalifa Nazeef', 
        'Ali Khalifa Nazeef', 
        NULLIF('249', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2333' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '217' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '217' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mokhtar Kotb') OR lower(name_ar) = lower('Mokhtar Kotb') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mokhtar Kotb', 
        'Mokhtar Kotb', 
        NULLIF('217', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2333' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '344' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '344' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed El-Bakry') OR lower(name_ar) = lower('Mohamed El-Bakry') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohamed El-Bakry', 
        'Mohamed El-Bakry', 
        NULLIF('344', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2333' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '226' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '226' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Pola Morris') OR lower(name_ar) = lower('Pola Morris') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Pola Morris', 
        'Pola Morris', 
        NULLIF('226', ''), 
        NULLIF('Mechanical Section Head', ''), 
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
        COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
        'accountable',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2269' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Hosny') OR lower(name_ar) = lower('Mohamed Hosny') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohamed Hosny', 
        'Mohamed Hosny', 
        NULLIF('', ''), 
        NULLIF('Technical Office Manager', ''), 
        NULLIF('01111971665', ''), 
        NULLIF('Time Mix-Water Way', ''), 
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
        COALESCE(NULLIF('Technical Office Manager', ''), 'عضو فريق'),
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2269' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '152' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '152' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim Gomaa') OR lower(name_ar) = lower('Ibrahim Gomaa') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ibrahim Gomaa', 
        'Ibrahim Gomaa', 
        NULLIF('152', ''), 
        NULLIF('Project Manager', ''), 
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
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'accountable',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2269' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '249' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '249' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Khalifa Nazeef') OR lower(name_ar) = lower('Ali Khalifa Nazeef') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Ali Khalifa Nazeef', 
        'Ali Khalifa Nazeef', 
        NULLIF('249', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2269' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '217' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '217' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mokhtar Kotb') OR lower(name_ar) = lower('Mokhtar Kotb') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mokhtar Kotb', 
        'Mokhtar Kotb', 
        NULLIF('217', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2269' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '344' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '344' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed El-Bakry') OR lower(name_ar) = lower('Mohamed El-Bakry') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mohamed El-Bakry', 
        'Mohamed El-Bakry', 
        NULLIF('344', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2269' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '226' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '226' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Pola Morris') OR lower(name_ar) = lower('Pola Morris') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Pola Morris', 
        'Pola Morris', 
        NULLIF('226', ''), 
        NULLIF('Mechanical Section Head', ''), 
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
        COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
        'accountable',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '1044' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('العميد جمال سالم') OR lower(name_ar) = lower('العميد جمال سالم') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'العميد جمال سالم', 
        'العميد جمال سالم', 
        NULLIF('', ''), 
        NULLIF('', ''), 
        NULLIF('', ''), 
        NULLIF('الهيئة الهندسية للقوات المسلحة', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '1044' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '19' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '19' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mostafa Omar') OR lower(name_ar) = lower('Mostafa Omar') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mostafa Omar', 
        'Mostafa Omar', 
        NULLIF('19', ''), 
        NULLIF('Project Manager', ''), 
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
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'accountable',
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '1044' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '67' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '67' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mawhoub Mahmoud Ahmed') OR lower(name_ar) = lower('Mawhoub Mahmoud Ahmed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mawhoub Mahmoud Ahmed', 
        'Mawhoub Mahmoud Ahmed', 
        NULLIF('67', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01066220985', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '1044' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '13' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '13' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Salah Azzazi Abd el fattah') OR lower(name_ar) = lower('Salah Azzazi Abd el fattah') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Salah Azzazi Abd el fattah', 
        'Salah Azzazi Abd el fattah', 
        NULLIF('13', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01022842289', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2105' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '67' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '67' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mawhoub Mahmoud Ahmed') OR lower(name_ar) = lower('Mawhoub Mahmoud Ahmed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mawhoub Mahmoud Ahmed', 
        'Mawhoub Mahmoud Ahmed', 
        NULLIF('67', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01066220985', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2105' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '13' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '13' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Salah Azzazi Abd el fattah') OR lower(name_ar) = lower('Salah Azzazi Abd el fattah') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Salah Azzazi Abd el fattah', 
        'Salah Azzazi Abd el fattah', 
        NULLIF('13', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01022842289', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2106' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '67' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '67' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mawhoub Mahmoud Ahmed') OR lower(name_ar) = lower('Mawhoub Mahmoud Ahmed') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Mawhoub Mahmoud Ahmed', 
        'Mawhoub Mahmoud Ahmed', 
        NULLIF('67', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01066220985', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2106' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '13' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '13' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Salah Azzazi Abd el fattah') OR lower(name_ar) = lower('Salah Azzazi Abd el fattah') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        'Salah Azzazi Abd el fattah', 
        'Salah Azzazi Abd el fattah', 
        NULLIF('13', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01022842289', ''), 
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
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF 'Project Manager' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Project Manager' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('184') OR lower(name_ar) = lower('184') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '184', 
        '184', 
        NULLIF('Project Manager', ''), 
        NULLIF('0 1099858552', ''), 
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
        COALESCE(NULLIF('0 1099858552', ''), 'عضو فريق'),
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
    IF 'Site Engeneer' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Site Engeneer' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('138') OR lower(name_ar) = lower('138') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '138', 
        '138', 
        NULLIF('Site Engeneer', ''), 
        NULLIF('01070474455', ''), 
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
        COALESCE(NULLIF('01070474455', ''), 'عضو فريق'),
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
    IF 'Site Engeneer' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Site Engeneer' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('400/1000') OR lower(name_ar) = lower('400/1000') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '400/1000', 
        '400/1000', 
        NULLIF('Site Engeneer', ''), 
        NULLIF('01090177295-01044992840', ''), 
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
        COALESCE(NULLIF('01090177295-01044992840', ''), 'عضو فريق'),
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
    IF 'Technical Office Manager' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Technical Office Manager' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('57') OR lower(name_ar) = lower('57') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '57', 
        '57', 
        NULLIF('Technical Office Manager', ''), 
        NULLIF('1066220357', ''), 
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
        COALESCE(NULLIF('1066220357', ''), 'عضو فريق'),
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
    IF 'Planning Section Head' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Planning Section Head' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('329') OR lower(name_ar) = lower('329') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '329', 
        '329', 
        NULLIF('Planning Section Head', ''), 
        NULLIF('1021111762', ''), 
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
        COALESCE(NULLIF('1021111762', ''), 'عضو فريق'),
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
    IF 'Mechanical Section Head' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Mechanical Section Head' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('226') OR lower(name_ar) = lower('226') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '226', 
        '226', 
        NULLIF('Mechanical Section Head', ''), 
        NULLIF('0 10 69826535', ''), 
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
        COALESCE(NULLIF('0 10 69826535', ''), 'عضو فريق'),
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
    IF 'Electrical Section Head' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Electrical Section Head' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('25') OR lower(name_ar) = lower('25') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '25', 
        '25', 
        NULLIF('Electrical Section Head', ''), 
        NULLIF('0 1050222189', ''), 
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
        COALESCE(NULLIF('0 1050222189', ''), 'عضو فريق'),
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
    IF 'Team Leader DC' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Team Leader DC' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('56') OR lower(name_ar) = lower('56') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '56', 
        '56', 
        NULLIF('Team Leader DC', ''), 
        NULLIF('1066220351', ''), 
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
        COALESCE(NULLIF('1066220351', ''), 'عضو فريق'),
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
    IF 'Senior Document Control' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Senior Document Control' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('205') OR lower(name_ar) = lower('205') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '205', 
        '205', 
        NULLIF('Senior Document Control', ''), 
        NULLIF('0 1025485140', ''), 
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
        COALESCE(NULLIF('0 1025485140', ''), 'عضو فريق'),
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
    IF 'Senior Civil Technical Office' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Senior Civil Technical Office' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('179') OR lower(name_ar) = lower('179') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '179', 
        '179', 
        NULLIF('Senior Civil Technical Office', ''), 
        NULLIF('0 1020100511', ''), 
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
        COALESCE(NULLIF('0 1020100511', ''), 'عضو فريق'),
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
    IF 'Civil Technical Office' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Civil Technical Office' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('229') OR lower(name_ar) = lower('229') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '229', 
        '229', 
        NULLIF('Civil Technical Office', ''), 
        NULLIF('0 1012342472', ''), 
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
        COALESCE(NULLIF('0 1012342472', ''), 'عضو فريق'),
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
    IF 'Senior Technical Office' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Senior Technical Office' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('93') OR lower(name_ar) = lower('93') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '93', 
        '93', 
        NULLIF('Senior Technical Office', ''), 
        NULLIF('0 1080015702', ''), 
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
        COALESCE(NULLIF('0 1080015702', ''), 'عضو فريق'),
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
    IF 'Electrical Technical Office' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Electrical Technical Office' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('94') OR lower(name_ar) = lower('94') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '94', 
        '94', 
        NULLIF('Electrical Technical Office', ''), 
        NULLIF('0 10 64666801', ''), 
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
        COALESCE(NULLIF('0 10 64666801', ''), 'عضو فريق'),
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
    IF 'Electrical Technical Office' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Electrical Technical Office' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('358') OR lower(name_ar) = lower('358') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '358', 
        '358', 
        NULLIF('Electrical Technical Office', ''), 
        NULLIF('0 10 80015694', ''), 
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
        COALESCE(NULLIF('0 10 80015694', ''), 'عضو فريق'),
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
    IF 'Mechanical Technical Office' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Mechanical Technical Office' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('302') OR lower(name_ar) = lower('302') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '302', 
        '302', 
        NULLIF('Mechanical Technical Office', ''), 
        NULLIF('0 10 50434497', ''), 
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
        COALESCE(NULLIF('0 10 50434497', ''), 'عضو فريق'),
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
    IF 'Mechanical Technical Office' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Mechanical Technical Office' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('299') OR lower(name_ar) = lower('299') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '299', 
        '299', 
        NULLIF('Mechanical Technical Office', ''), 
        NULLIF('0 10 32980999', ''), 
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
        COALESCE(NULLIF('0 10 32980999', ''), 'عضو فريق'),
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
    IF 'Civil Supervisor' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Civil Supervisor' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('403/1003') OR lower(name_ar) = lower('403/1003') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '403/1003', 
        '403/1003', 
        NULLIF('Civil Supervisor', ''), 
        NULLIF('0 10 60289473', ''), 
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
        COALESCE(NULLIF('0 10 60289473', ''), 'عضو فريق'),
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
    IF 'Civil Supervisor' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Civil Supervisor' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('249') OR lower(name_ar) = lower('249') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '249', 
        '249', 
        NULLIF('Civil Supervisor', ''), 
        NULLIF('0 10 92565747', ''), 
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
        COALESCE(NULLIF('0 10 92565747', ''), 'عضو فريق'),
        'accountable',
        'consultant',
        NOW()
      );
    END IF;
  END IF;
END $$;

COMMIT;