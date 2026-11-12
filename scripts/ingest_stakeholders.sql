-- Stakeholders & Project Stakeholders Ingestion Script
BEGIN;

DO $$
DECLARE
  v_proj_id uuid;
  v_stk_id text;
BEGIN
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Hesham El Seifi') OR lower(name_ar) = lower('Hesham El Seifi') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Hesham El Seifi', 
        'Hesham El Seifi', 
        NULLIF('', ''), 
        NULLIF('Senior Project Manager', ''), 
        NULLIF('01202624321', ''), 
        NULLIF('Emaar', ''), 
        'client', 
        'client'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Senior Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Evram Rafat') OR lower(name_ar) = lower('Evram Rafat') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Evram Rafat', 
        'Evram Rafat', 
        NULLIF('', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('01143353755', ''), 
        NULLIF('HAC', ''), 
        'contractor', 
        'contractor'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '283' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '283' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Wageh Abd El Alim') OR lower(name_ar) = lower('Ahmed Wageh Abd El Alim') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil project manger', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '79' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '79' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Bssam el bdry') OR lower(name_ar) = lower('Bssam el bdry') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '96' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '96' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Khaled Ashraf Aly Khaled') OR lower(name_ar) = lower('Khaled Ashraf Aly Khaled') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '195' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '195' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim hasan abd El Alim sid') OR lower(name_ar) = lower('Ibrahim hasan abd El Alim sid') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '245' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '245' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mustafa mohammed saad abo gali') OR lower(name_ar) = lower('Mustafa mohammed saad abo gali') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '300' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '300' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Omar Samy Abd El Hady Hlal') OR lower(name_ar) = lower('Omar Samy Abd El Hady Hlal') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '340' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '340' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Yhia Ismail Abd Alhmid') OR lower(name_ar) = lower('Ahmed Yhia Ismail Abd Alhmid') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '348' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '348' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Mohammed Mostafa Slim') OR lower(name_ar) = lower('Ahmed Mohammed Mostafa Slim') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '385' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '385' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Karim mohamed Ali Mahmoud Mohamed') OR lower(name_ar) = lower('Karim mohamed Ali Mahmoud Mohamed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '387' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '387' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Osama Mohammady Mohammed ELE.') OR lower(name_ar) = lower('Osama Mohammady Mohammed ELE.') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '391' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '391' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Saoudi Mohamed Issa') OR lower(name_ar) = lower('Saoudi Mohamed Issa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '178' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '178' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed hassan abo al liel') OR lower(name_ar) = lower('Mohammed hassan abo al liel') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '286' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '286' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Adel Mohammed Sawy') OR lower(name_ar) = lower('Adel Mohammed Sawy') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '339' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '339' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Karim Adel Adly') OR lower(name_ar) = lower('Karim Adel Adly') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '89' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '89' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Mohammed El Sahaty') OR lower(name_ar) = lower('Ahmed Mohammed El Sahaty') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '181' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '181' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim khaled abd el aty') OR lower(name_ar) = lower('Ibrahim khaled abd el aty') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '145' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '145' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Fares Amer Ismael') OR lower(name_ar) = lower('Fares Amer Ismael') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '174' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '174' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Badr ayman mohammed al sid') OR lower(name_ar) = lower('Badr ayman mohammed al sid') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '266' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '266' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Abd El Rahim') OR lower(name_ar) = lower('Ahmed Abd El Rahim') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '361' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '361' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abd el Rahman mostafa mohammed') OR lower(name_ar) = lower('Abd el Rahman mostafa mohammed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '388' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '388' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Hassan Atef Ahmd ali') OR lower(name_ar) = lower('Hassan Atef Ahmd ali') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Zaki Gamal Zaki') OR lower(name_ar) = lower('Zaki Gamal Zaki') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '59' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '59' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abd el nabi Mehanni') OR lower(name_ar) = lower('Abd el nabi Mehanni') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '325' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '325' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Anwar Magdy Mahmoud Mohamed') OR lower(name_ar) = lower('Anwar Magdy Mahmoud Mohamed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '146' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '146' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed Frg Abdelalim') OR lower(name_ar) = lower('Mohammed Frg Abdelalim') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '375' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '375' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Gmal Abd Alaziz Gafr') OR lower(name_ar) = lower('Mohamed Gmal Abd Alaziz Gafr') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '363' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '363' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Amer hany Amer') OR lower(name_ar) = lower('Amer hany Amer') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '251' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '251' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Radwan Mohamed') OR lower(name_ar) = lower('Radwan Mohamed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('DC', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '295' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '295' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Alaa Ali Mohamed Ali Almsry') OR lower(name_ar) = lower('Alaa Ali Mohamed Ali Almsry') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('أمين مخزن', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2401' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '347' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '347' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Omar Sabry Mostafa') OR lower(name_ar) = lower('Omar Sabry Mostafa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('محاسب', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mina George') OR lower(name_ar) = lower('Mina George') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mina George', 
        'Mina George', 
        NULLIF('', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('01212111457', ''), 
        NULLIF('Orascom', ''), 
        'contractor', 
        'contractor'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '283' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '283' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Wageh Abd El Alim') OR lower(name_ar) = lower('Ahmed Wageh Abd El Alim') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil project manger', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '79' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '79' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Bssam el bdry') OR lower(name_ar) = lower('Bssam el bdry') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '96' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '96' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Khaled Ashraf Aly Khaled') OR lower(name_ar) = lower('Khaled Ashraf Aly Khaled') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '195' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '195' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim hasan abd El Alim sid') OR lower(name_ar) = lower('Ibrahim hasan abd El Alim sid') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '245' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '245' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mustafa mohammed saad abo gali') OR lower(name_ar) = lower('Mustafa mohammed saad abo gali') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '300' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '300' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Omar Samy Abd El Hady Hlal') OR lower(name_ar) = lower('Omar Samy Abd El Hady Hlal') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '340' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '340' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Yhia Ismail Abd Alhmid') OR lower(name_ar) = lower('Ahmed Yhia Ismail Abd Alhmid') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '348' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '348' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Mohammed Mostafa Slim') OR lower(name_ar) = lower('Ahmed Mohammed Mostafa Slim') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Ahmed Mohammed Mostafa Slim', 
        'Ahmed Mohammed Mostafa Slim', 
        NULLIF('348', ''), 
        NULLIF('Civil Site Eng.', ''), 
        NULLIF('29810280200914', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '385' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '385' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Krim Mohamed Ali Mahmwd') OR lower(name_ar) = lower('Krim Mohamed Ali Mahmwd') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Krim Mohamed Ali Mahmwd', 
        'Krim Mohamed Ali Mahmwd', 
        NULLIF('385', ''), 
        NULLIF('Mechanical Eng.', ''), 
        NULLIF('30010068800412', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '387' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '387' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Osama Mohammady Mohammed ELE.') OR lower(name_ar) = lower('Osama Mohammady Mohammed ELE.') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Osama Mohammady Mohammed ELE.', 
        'Osama Mohammady Mohammed ELE.', 
        NULLIF('387', ''), 
        NULLIF('Electrical Site Eng.', ''), 
        NULLIF('30112010106874', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '391' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '391' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Saoudi Mohamed Issa') OR lower(name_ar) = lower('Saoudi Mohamed Issa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Saoudi Mohamed Issa', 
        'Saoudi Mohamed Issa', 
        NULLIF('391', ''), 
        NULLIF('Electrical Site Eng.', ''), 
        NULLIF('29905112201337', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '178' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '178' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed hassan abo al liel') OR lower(name_ar) = lower('Mohammed hassan abo al liel') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mohammed hassan abo al liel', 
        'Mohammed hassan abo al liel', 
        NULLIF('178', ''), 
        NULLIF('Safety', ''), 
        NULLIF('29405201200911', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '286' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '286' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Adel Mohammed Sawy') OR lower(name_ar) = lower('Adel Mohammed Sawy') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Adel Mohammed Sawy', 
        'Adel Mohammed Sawy', 
        NULLIF('286', ''), 
        NULLIF('Safety', ''), 
        NULLIF('279010224033396', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '339' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '339' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Karim Adel Adly') OR lower(name_ar) = lower('Karim Adel Adly') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Karim Adel Adly', 
        'Karim Adel Adly', 
        NULLIF('339', ''), 
        NULLIF('Safety', ''), 
        NULLIF('30011202404673', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '89' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '89' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Mohammed El Sahaty') OR lower(name_ar) = lower('Ahmed Mohammed El Sahaty') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '181' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '181' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim khaled abd el aty') OR lower(name_ar) = lower('Ibrahim khaled abd el aty') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '145' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '145' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Fares Amer Ismael') OR lower(name_ar) = lower('Fares Amer Ismael') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '174' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '174' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Badr ayman mohammed al sid') OR lower(name_ar) = lower('Badr ayman mohammed al sid') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '266' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '266' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Abd El Rahim') OR lower(name_ar) = lower('Ahmed Abd El Rahim') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '361' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '361' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abd el Rahman mostafa mohammed') OR lower(name_ar) = lower('Abd el Rahman mostafa mohammed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '388' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '388' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Hassan Atef Ahmd ali') OR lower(name_ar) = lower('Hassan Atef Ahmd ali') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Zaki Gamal Zaki') OR lower(name_ar) = lower('Zaki Gamal Zaki') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '59' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '59' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abd el nabi Mehanni') OR lower(name_ar) = lower('Abd el nabi Mehanni') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '325' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '325' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Anwar Magdy Mahmoud Mohamed') OR lower(name_ar) = lower('Anwar Magdy Mahmoud Mohamed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '146' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '146' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed Frg Abdelalim') OR lower(name_ar) = lower('Mohammed Frg Abdelalim') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '375' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '375' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Gmal Abd Alaziz Gafr') OR lower(name_ar) = lower('Mohamed Gmal Abd Alaziz Gafr') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '363' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '363' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Amer hany Amer') OR lower(name_ar) = lower('Amer hany Amer') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '251' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '251' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Radwan Mohamed') OR lower(name_ar) = lower('Radwan Mohamed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('DC', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '295' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '295' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Alaa Ali Mohamed Ali Almsry') OR lower(name_ar) = lower('Alaa Ali Mohamed Ali Almsry') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('أمين مخزن', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2402' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '347' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '347' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Omar Sabry Mostafa') OR lower(name_ar) = lower('Omar Sabry Mostafa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('محاسب', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '283' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '283' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Wageh Abd El Alim') OR lower(name_ar) = lower('Ahmed Wageh Abd El Alim') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil project manger', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '174' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '174' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Bssam El Bdry') OR lower(name_ar) = lower('Bssam El Bdry') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Bssam El Bdry', 
        'Bssam El Bdry', 
        NULLIF('174', ''), 
        NULLIF('Civil site eng.', ''), 
        NULLIF('29302140104774', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '96' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '96' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Khaled Ashraf Aly Khaled') OR lower(name_ar) = lower('Khaled Ashraf Aly Khaled') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '195' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '195' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim hasan abd El Alim sid') OR lower(name_ar) = lower('Ibrahim hasan abd El Alim sid') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Karim Said') OR lower(name_ar) = lower('Karim Said') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Karim Said', 
        'Karim Said', 
        NULLIF('', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('01010012963', ''), 
        NULLIF('Redcon', ''), 
        'contractor', 
        'contractor'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '245' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '245' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mustafa mohammed saad abo gali') OR lower(name_ar) = lower('Mustafa mohammed saad abo gali') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '300' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '300' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Omar Samy Abd El Hady Hlal') OR lower(name_ar) = lower('Omar Samy Abd El Hady Hlal') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '340' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '340' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Yhia Ismail Abd Alhmid') OR lower(name_ar) = lower('Ahmed Yhia Ismail Abd Alhmid') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '348' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '348' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Mohammed Mostafa Slim') OR lower(name_ar) = lower('Ahmed Mohammed Mostafa Slim') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Ahmed Mohammed Mostafa Slim', 
        'Ahmed Mohammed Mostafa Slim', 
        NULLIF('348', ''), 
        NULLIF('Civil Site Eng.', ''), 
        NULLIF('29810280200914', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '385' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '385' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Krim Mohamed Ali Mahmwd') OR lower(name_ar) = lower('Krim Mohamed Ali Mahmwd') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Krim Mohamed Ali Mahmwd', 
        'Krim Mohamed Ali Mahmwd', 
        NULLIF('385', ''), 
        NULLIF('Mechanical Eng.', ''), 
        NULLIF('30010068800412', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '387' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '387' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Osama Mohammady Mohammed') OR lower(name_ar) = lower('Osama Mohammady Mohammed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Osama Mohammady Mohammed', 
        'Osama Mohammady Mohammed', 
        NULLIF('387', ''), 
        NULLIF('Electrical Site Eng.', ''), 
        NULLIF('30112010106874', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '391' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '391' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Saoudi Mohamed Issa') OR lower(name_ar) = lower('Saoudi Mohamed Issa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Saoudi Mohamed Issa', 
        'Saoudi Mohamed Issa', 
        NULLIF('391', ''), 
        NULLIF('Electrical Site Eng.', ''), 
        NULLIF('29905112201337', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '178' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '178' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed hassan abo al liel') OR lower(name_ar) = lower('Mohammed hassan abo al liel') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mohammed hassan abo al liel', 
        'Mohammed hassan abo al liel', 
        NULLIF('178', ''), 
        NULLIF('Safety', ''), 
        NULLIF('29405201200911', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '286' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '286' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Adel Mohammed Sawy') OR lower(name_ar) = lower('Adel Mohammed Sawy') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Adel Mohammed Sawy', 
        'Adel Mohammed Sawy', 
        NULLIF('286', ''), 
        NULLIF('Safety', ''), 
        NULLIF('279010224033396', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '339' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '339' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Karim Adel Adly') OR lower(name_ar) = lower('Karim Adel Adly') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Karim Adel Adly', 
        'Karim Adel Adly', 
        NULLIF('339', ''), 
        NULLIF('Safety', ''), 
        NULLIF('30011202404673', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '89' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '89' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Mohammed El Sahaty') OR lower(name_ar) = lower('Ahmed Mohammed El Sahaty') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '181' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '181' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim khaled abd el aty') OR lower(name_ar) = lower('Ibrahim khaled abd el aty') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '145' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '145' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Fares Amer Ismael') OR lower(name_ar) = lower('Fares Amer Ismael') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '174' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '174' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Badr ayman mohammed al sid') OR lower(name_ar) = lower('Badr ayman mohammed al sid') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '266' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '266' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Abd El Rahim') OR lower(name_ar) = lower('Ahmed Abd El Rahim') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '361' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '361' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abd el Rahman mostafa mohammed') OR lower(name_ar) = lower('Abd el Rahman mostafa mohammed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '388' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '388' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Hassan Atef Ahmd ali') OR lower(name_ar) = lower('Hassan Atef Ahmd ali') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Zaki Gamal Zaki') OR lower(name_ar) = lower('Zaki Gamal Zaki') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '59' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '59' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abd el nabi Mehanni') OR lower(name_ar) = lower('Abd el nabi Mehanni') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '325' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '325' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Anwar Magdy Mahmoud Mohamed') OR lower(name_ar) = lower('Anwar Magdy Mahmoud Mohamed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '146' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '146' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed Frg Abdelalim') OR lower(name_ar) = lower('Mohammed Frg Abdelalim') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '375' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '375' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Gmal Abd Alaziz Gafr') OR lower(name_ar) = lower('Mohamed Gmal Abd Alaziz Gafr') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '363' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '363' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Amer hany Amer') OR lower(name_ar) = lower('Amer hany Amer') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '251' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '251' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Radwan Mohamed') OR lower(name_ar) = lower('Radwan Mohamed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('DC', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '295' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '295' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Alaa Ali Mohamed Ali Almsry') OR lower(name_ar) = lower('Alaa Ali Mohamed Ali Almsry') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('أمين مخزن', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2403' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '347' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '347' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Omar Sabry Mostafa') OR lower(name_ar) = lower('Omar Sabry Mostafa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('محاسب', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abdel Menem Yassine') OR lower(name_ar) = lower('Abdel Menem Yassine') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Abdel Menem Yassine', 
        'Abdel Menem Yassine', 
        NULLIF('', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('01270350961', ''), 
        NULLIF('Orascom', ''), 
        'contractor', 
        'contractor'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '288' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '288' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Maher Fahmy') OR lower(name_ar) = lower('Ahmed Maher Fahmy') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '248' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '248' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Alaa el Hennawy') OR lower(name_ar) = lower('Alaa el Hennawy') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Atef Mohamed Zidan') OR lower(name_ar) = lower('Mohamed Atef Mohamed Zidan') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('إبراهيم عطا إبراهيم خليل') OR lower(name_ar) = lower('إبراهيم عطا إبراهيم خليل') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Hotel Security', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('أحمد حمام كامل الأمير') OR lower(name_ar) = lower('أحمد حمام كامل الأمير') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Hotel Store Keeper', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '346' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '346' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed Mamdouh Hassan Ali') OR lower(name_ar) = lower('Mohammed Mamdouh Hassan Ali') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '287' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '287' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed Abd El Razek Fahmy الشباسي') OR lower(name_ar) = lower('Mohammed Abd El Razek Fahmy الشباسي') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2511' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '324' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '324' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Galal Abd El Aty Sadek') OR lower(name_ar) = lower('Galal Abd El Aty Sadek') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Omar Magdi') OR lower(name_ar) = lower('Omar Magdi') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Omar Magdi', 
        'Omar Magdi', 
        NULLIF('', ''), 
        NULLIF('Construction Manager', ''), 
        NULLIF('01002911856', ''), 
        NULLIF('Marakez', ''), 
        'client', 
        'client'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Construction Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '91' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '91' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Mohammed Shehata abd alglil') OR lower(name_ar) = lower('Ahmed Mohammed Shehata abd alglil') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '151' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '151' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mostafa Amir Ahmed') OR lower(name_ar) = lower('Mostafa Amir Ahmed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '331' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '331' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mahmoud Khaled Ahmed') OR lower(name_ar) = lower('Mahmoud Khaled Ahmed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '373' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '373' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Mohsn Barkat Moamed') OR lower(name_ar) = lower('Mohamed Mohsn Barkat Moamed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '212' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '212' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed ali hasan Ibrahim El lbani') OR lower(name_ar) = lower('Mohammed ali hasan Ibrahim El lbani') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '210' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '210' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Ayman Ali') OR lower(name_ar) = lower('Ali Ayman Ali') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '294' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '294' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Nasser Mahmoud') OR lower(name_ar) = lower('Mohamed Nasser Mahmoud') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('DC', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('حامد السيد إبراهيم الخواجة') OR lower(name_ar) = lower('حامد السيد إبراهيم الخواجة') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('رجب عبد البديع') OR lower(name_ar) = lower('رجب عبد البديع') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2405' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '284' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '284' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Rateb Mahmoud') OR lower(name_ar) = lower('Ahmed Rateb Mahmoud') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Accountant', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '91' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '91' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Mohammed Shehata abd alglil') OR lower(name_ar) = lower('Ahmed Mohammed Shehata abd alglil') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '151' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '151' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mostafa Amir Ahmed') OR lower(name_ar) = lower('Mostafa Amir Ahmed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '331' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '331' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mahmoud Khaled Ahmed') OR lower(name_ar) = lower('Mahmoud Khaled Ahmed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '373' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '373' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Mohsn Barkat Moamed') OR lower(name_ar) = lower('Mohamed Mohsn Barkat Moamed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '212' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '212' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed ali hasan Ibrahim El lbani') OR lower(name_ar) = lower('Mohammed ali hasan Ibrahim El lbani') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '210' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '210' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Ayman Ali') OR lower(name_ar) = lower('Ali Ayman Ali') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '294' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '294' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Nasser Mahmoud') OR lower(name_ar) = lower('Mohamed Nasser Mahmoud') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('DC', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('حامد السيد إبراهيم الخواجة') OR lower(name_ar) = lower('حامد السيد إبراهيم الخواجة') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('رجب عبد البديع') OR lower(name_ar) = lower('رجب عبد البديع') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2419' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '284' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '284' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Rateb Mahmoud') OR lower(name_ar) = lower('Ahmed Rateb Mahmoud') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Accountant', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Tarek Shawkat') OR lower(name_ar) = lower('Tarek Shawkat') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Tarek Shawkat', 
        'Tarek Shawkat', 
        NULLIF('', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('01005759415', ''), 
        NULLIF('HAP', ''), 
        'contractor', 
        'contractor'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '41' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '41' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Osama ShahIn') OR lower(name_ar) = lower('Osama ShahIn') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '398' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '398' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mhmwd Mohamed Abd Altif Mohamed') OR lower(name_ar) = lower('Mhmwd Mohamed Abd Altif Mohamed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '384' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '384' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Akram Mohammed Abd Al-Alim') OR lower(name_ar) = lower('Akram Mohammed Abd Al-Alim') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('civil site Eng', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '383' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '383' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mahmoud Mostafa Abd al kader') OR lower(name_ar) = lower('Mahmoud Mostafa Abd al kader') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Planning Eng ( civil )', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '341' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '341' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Kamel Abd El Razek') OR lower(name_ar) = lower('Ahmed Kamel Abd El Razek') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '315' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '315' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mostafa Ali Ahmed Rabee''') OR lower(name_ar) = lower('Mostafa Ali Ahmed Rabee''') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Accountant', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '267' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '267' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Amr Ahmed gouda Mhmwd Aldwi') OR lower(name_ar) = lower('Amr Ahmed gouda Mhmwd Aldwi') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Basem Abd Al Daim Mohamed') OR lower(name_ar) = lower('Basem Abd Al Daim Mohamed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Eslam Said Abd Alrazek Mostfa') OR lower(name_ar) = lower('Eslam Said Abd Alrazek Mostfa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Al Sid Ahmed Al Sid') OR lower(name_ar) = lower('Mohamed Al Sid Ahmed Al Sid') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('DC', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '333' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '333' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abdulkhaliq Gharib Abdulkhaliq Muhammad') OR lower(name_ar) = lower('Abdulkhaliq Gharib Abdulkhaliq Muhammad') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '230' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '230' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Shaaban Ahmed Morsy') OR lower(name_ar) = lower('Ahmed Shaaban Ahmed Morsy') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('أحمد أشرف محمد فرج جاد') OR lower(name_ar) = lower('أحمد أشرف محمد فرج جاد') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2604' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('محمود عادل') OR lower(name_ar) = lower('محمود عادل') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2421' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Youssef') OR lower(name_ar) = lower('Ahmed Youssef') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Ahmed Youssef', 
        'Ahmed Youssef', 
        NULLIF('', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('01033047468', ''), 
        NULLIF('HAC', ''), 
        'contractor', 
        'contractor'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2421' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '41' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '41' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Osama ShahIn') OR lower(name_ar) = lower('Osama ShahIn') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2421' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '241' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '241' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Sherif Sayed') OR lower(name_ar) = lower('Sherif Sayed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Architecture Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2421' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Nabil Abd El Aal') OR lower(name_ar) = lower('Nabil Abd El Aal') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2421' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '231' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '231' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('EL Sayed Amer') OR lower(name_ar) = lower('EL Sayed Amer') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2404' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Tamer Safwat') OR lower(name_ar) = lower('Tamer Safwat') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Tamer Safwat', 
        'Tamer Safwat', 
        NULLIF('', ''), 
        NULLIF('Projects Director', ''), 
        NULLIF('01067790915', ''), 
        NULLIF('LMD', ''), 
        'client', 
        'client'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Projects Director', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2404' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '41' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '41' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Osama ShahIn') OR lower(name_ar) = lower('Osama ShahIn') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2404' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '122' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '122' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Wael said mahmoud Daha') OR lower(name_ar) = lower('Wael said mahmoud Daha') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2404' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '213' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '213' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abd El Rahman Saad') OR lower(name_ar) = lower('Abd El Rahman Saad') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mech Eng', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2404' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '335' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '335' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Omar Nabil Abd El Aal') OR lower(name_ar) = lower('Omar Nabil Abd El Aal') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2404' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '231' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '231' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('EL Sayed Amer') OR lower(name_ar) = lower('EL Sayed Amer') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2404' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Ashraf Al-Tigani') OR lower(name_ar) = lower('Ahmed Ashraf Al-Tigani') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Ahmed Ashraf Al-Tigani', 
        'Ahmed Ashraf Al-Tigani', 
        NULLIF('', ''), 
        NULLIF('Store Keeper', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2512' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '41' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '41' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Osama ShahIn') OR lower(name_ar) = lower('Osama ShahIn') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2412' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abdel Menem Yassine') OR lower(name_ar) = lower('Abdel Menem Yassine') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Abdel Menem Yassine', 
        'Abdel Menem Yassine', 
        NULLIF('', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('01270350961', ''), 
        NULLIF('Orascom', ''), 
        'contractor', 
        'contractor'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2412' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '247' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '247' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mina Nabil') OR lower(name_ar) = lower('Mina Nabil') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mina Nabil', 
        'Mina Nabil', 
        NULLIF('247', ''), 
        NULLIF('Civil Site Eng.', ''), 
        NULLIF('01066031006', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2412' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '293' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '293' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohammed Gamal Zaki') OR lower(name_ar) = lower('Mohammed Gamal Zaki') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mohammed Gamal Zaki', 
        'Mohammed Gamal Zaki', 
        NULLIF('293', ''), 
        NULLIF('Surveyor', ''), 
        NULLIF('01099144418', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Surveyor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2412' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Nasef Roshdy') OR lower(name_ar) = lower('Mohamed Nasef Roshdy') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mohamed Nasef Roshdy', 
        'Mohamed Nasef Roshdy', 
        NULLIF('', ''), 
        NULLIF('Store Keeper', ''), 
        NULLIF('01034349329', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Zaho') OR lower(name_ar) = lower('Zaho') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Zaho', 
        'Zaho', 
        NULLIF('', ''), 
        NULLIF('MEP Manager', ''), 
        NULLIF('01101596102', ''), 
        NULLIF('CSCEC', ''), 
        'contractor', 
        'contractor'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('MEP Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '152' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '152' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim Gomaa Ibrahim Abd Alrhman') OR lower(name_ar) = lower('Ibrahim Gomaa Ibrahim Abd Alrhman') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Ibrahim Gomaa Ibrahim Abd Alrhman', 
        'Ibrahim Gomaa Ibrahim Abd Alrhman', 
        NULLIF('152', ''), 
        NULLIF('Site Engeneer', ''), 
        NULLIF('01027366286', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '217' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '217' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mokhtar Qodb Krim Gmaa') OR lower(name_ar) = lower('Mokhtar Qodb Krim Gmaa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mokhtar Qodb Krim Gmaa', 
        'Mokhtar Qodb Krim Gmaa', 
        NULLIF('217', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01069839653', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '249' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '249' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Khalifa Nazeef') OR lower(name_ar) = lower('Ali Khalifa Nazeef') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Ali Khalifa Nazeef', 
        'Ali Khalifa Nazeef', 
        NULLIF('249', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01060289473', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Zaho') OR lower(name_ar) = lower('Zaho') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Zaho', 
        'Zaho', 
        NULLIF('', ''), 
        NULLIF('MEP Manager', ''), 
        NULLIF('01101596102', ''), 
        NULLIF('CSCEC', ''), 
        'contractor', 
        'contractor'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('MEP Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '152' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '152' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim Gomaa Ibrahim Abd Alrhman') OR lower(name_ar) = lower('Ibrahim Gomaa Ibrahim Abd Alrhman') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Ibrahim Gomaa Ibrahim Abd Alrhman', 
        'Ibrahim Gomaa Ibrahim Abd Alrhman', 
        NULLIF('152', ''), 
        NULLIF('Site Engeneer', ''), 
        NULLIF('01027366286', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '217' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '217' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mokhtar Qodb Krim Gmaa') OR lower(name_ar) = lower('Mokhtar Qodb Krim Gmaa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mokhtar Qodb Krim Gmaa', 
        'Mokhtar Qodb Krim Gmaa', 
        NULLIF('217', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01069839653', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '249' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '249' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Khalifa Nazeef') OR lower(name_ar) = lower('Ali Khalifa Nazeef') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Ali Khalifa Nazeef', 
        'Ali Khalifa Nazeef', 
        NULLIF('249', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('01060289473', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2606' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '224' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '224' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Nagy Neseim') OR lower(name_ar) = lower('Nagy Neseim') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Nagy Neseim', 
        'Nagy Neseim', 
        NULLIF('224', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2606' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ahmed Emad') OR lower(name_ar) = lower('Ahmed Emad') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Ahmed Emad', 
        'Ahmed Emad', 
        NULLIF('', ''), 
        NULLIF('Senior Surveyor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Senior Surveyor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2606' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '226' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '226' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Pola Morris') OR lower(name_ar) = lower('Pola Morris') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2602' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '55' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '55' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mostafa Adel') OR lower(name_ar) = lower('Mostafa Adel') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mostafa Adel', 
        'Mostafa Adel', 
        NULLIF('55', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2602' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Shady El-Kordy') OR lower(name_ar) = lower('Shady El-Kordy') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Shady El-Kordy', 
        'Shady El-Kordy', 
        NULLIF('', ''), 
        NULLIF('Construction Manager', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Construction Manager', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2602' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '109' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '109' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('El-Sayed Mohamed Ali') OR lower(name_ar) = lower('El-Sayed Mohamed Ali') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'El-Sayed Mohamed Ali', 
        'El-Sayed Mohamed Ali', 
        NULLIF('109', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2602' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Alaa') OR lower(name_ar) = lower('Mohamed Alaa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mohamed Alaa', 
        'Mohamed Alaa', 
        NULLIF('', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2602' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '226' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '226' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Pola Morris') OR lower(name_ar) = lower('Pola Morris') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2603' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '55' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '55' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mostafa Adel') OR lower(name_ar) = lower('Mostafa Adel') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mostafa Adel', 
        'Mostafa Adel', 
        NULLIF('55', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2603' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Shady El-Kordy') OR lower(name_ar) = lower('Shady El-Kordy') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Shady El-Kordy', 
        'Shady El-Kordy', 
        NULLIF('', ''), 
        NULLIF('Construction Manager', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Construction Manager', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2603' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '109' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '109' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('El-Sayed Mohamed Ali') OR lower(name_ar) = lower('El-Sayed Mohamed Ali') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'El-Sayed Mohamed Ali', 
        'El-Sayed Mohamed Ali', 
        NULLIF('109', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2603' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '135' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '135' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Alaa') OR lower(name_ar) = lower('Mohamed Alaa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mohamed Alaa', 
        'Mohamed Alaa', 
        NULLIF('135', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2603' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '226' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '226' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Pola Morris') OR lower(name_ar) = lower('Pola Morris') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2272' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '90' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '90' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Shaaban') OR lower(name_ar) = lower('Mohamed Shaaban') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mohamed Shaaban', 
        'Mohamed Shaaban', 
        NULLIF('90', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2272' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '25' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '25' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abdel Rahman Azab') OR lower(name_ar) = lower('Abdel Rahman Azab') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Abdel Rahman Azab', 
        'Abdel Rahman Azab', 
        NULLIF('25', ''), 
        NULLIF('Construction Manager', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Construction Manager', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2272' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '108' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '108' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abdel Razek Mohamed') OR lower(name_ar) = lower('Abdel Razek Mohamed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Abdel Razek Mohamed', 
        'Abdel Razek Mohamed', 
        NULLIF('108', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2272' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '249' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '249' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Khalifa Nazeef') OR lower(name_ar) = lower('Ali Khalifa Nazeef') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2272' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Naser Gomaa') OR lower(name_ar) = lower('Naser Gomaa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Naser Gomaa', 
        'Naser Gomaa', 
        NULLIF('', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2272' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Kamal Abdel Hameed') OR lower(name_ar) = lower('Kamal Abdel Hameed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Kamal Abdel Hameed', 
        'Kamal Abdel Hameed', 
        NULLIF('', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2272' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '226' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '226' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Pola Morris') OR lower(name_ar) = lower('Pola Morris') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2406' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '90' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '90' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Shaaban') OR lower(name_ar) = lower('Mohamed Shaaban') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mohamed Shaaban', 
        'Mohamed Shaaban', 
        NULLIF('90', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2406' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '25' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '25' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abdel Rahman Azab') OR lower(name_ar) = lower('Abdel Rahman Azab') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Abdel Rahman Azab', 
        'Abdel Rahman Azab', 
        NULLIF('25', ''), 
        NULLIF('Construction Manager', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Construction Manager', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2406' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '108' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '108' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abdel Razek Mohamed') OR lower(name_ar) = lower('Abdel Razek Mohamed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Abdel Razek Mohamed', 
        'Abdel Razek Mohamed', 
        NULLIF('108', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2406' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '249' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '249' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Khalifa Nazeef') OR lower(name_ar) = lower('Ali Khalifa Nazeef') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2406' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Naser Gomaa') OR lower(name_ar) = lower('Naser Gomaa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Naser Gomaa', 
        'Naser Gomaa', 
        NULLIF('', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2406' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Kamal Abdel Hameed') OR lower(name_ar) = lower('Kamal Abdel Hameed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Kamal Abdel Hameed', 
        'Kamal Abdel Hameed', 
        NULLIF('', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2406' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '226' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '226' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Pola Morris') OR lower(name_ar) = lower('Pola Morris') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2601' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '90' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '90' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Shaaban') OR lower(name_ar) = lower('Mohamed Shaaban') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mohamed Shaaban', 
        'Mohamed Shaaban', 
        NULLIF('90', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2601' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '25' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '25' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abdel Rahman Azab') OR lower(name_ar) = lower('Abdel Rahman Azab') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Abdel Rahman Azab', 
        'Abdel Rahman Azab', 
        NULLIF('25', ''), 
        NULLIF('Construction Manager', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Construction Manager', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2601' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '108' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '108' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Abdel Razek Mohamed') OR lower(name_ar) = lower('Abdel Razek Mohamed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Abdel Razek Mohamed', 
        'Abdel Razek Mohamed', 
        NULLIF('108', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2601' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '249' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '249' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Khalifa Nazeef') OR lower(name_ar) = lower('Ali Khalifa Nazeef') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2601' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Naser Gomaa') OR lower(name_ar) = lower('Naser Gomaa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Naser Gomaa', 
        'Naser Gomaa', 
        NULLIF('', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2601' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Kamal Abdel Hameed') OR lower(name_ar) = lower('Kamal Abdel Hameed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Kamal Abdel Hameed', 
        'Kamal Abdel Hameed', 
        NULLIF('', ''), 
        NULLIF('Supervisor', ''), 
        NULLIF('', ''), 
        NULLIF('P.Zone', ''), 
        'employee', 
        'employee'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2601' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '226' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '226' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Pola Morris') OR lower(name_ar) = lower('Pola Morris') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Zaho') OR lower(name_ar) = lower('Zaho') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Zaho', 
        'Zaho', 
        NULLIF('', ''), 
        NULLIF('MEP Manager', ''), 
        NULLIF('01101596102', ''), 
        NULLIF('CSCEC', ''), 
        'contractor', 
        'contractor'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('MEP Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '152' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '152' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim Gomaa') OR lower(name_ar) = lower('Ibrahim Gomaa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '249' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '249' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Khalifa Nazeef') OR lower(name_ar) = lower('Ali Khalifa Nazeef') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '217' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '217' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mokhtar Kotb') OR lower(name_ar) = lower('Mokhtar Kotb') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '344' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '344' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed El-Bakry') OR lower(name_ar) = lower('Mohamed El-Bakry') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2308' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '226' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '226' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Pola Morris') OR lower(name_ar) = lower('Pola Morris') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2414' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Eng. Tamer') OR lower(name_ar) = lower('Eng. Tamer') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Eng. Tamer', 
        'Eng. Tamer', 
        NULLIF('', ''), 
        NULLIF('Project Manager', ''), 
        NULLIF('01018222731', ''), 
        NULLIF('Curve - DMC', ''), 
        'contractor', 
        'contractor'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2414' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '152' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '152' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim Gomaa') OR lower(name_ar) = lower('Ibrahim Gomaa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2414' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '249' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '249' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Khalifa Nazeef') OR lower(name_ar) = lower('Ali Khalifa Nazeef') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2414' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '217' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '217' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mokhtar Kotb') OR lower(name_ar) = lower('Mokhtar Kotb') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2414' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '344' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '344' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed El-Bakry') OR lower(name_ar) = lower('Mohamed El-Bakry') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2414' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '226' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '226' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Pola Morris') OR lower(name_ar) = lower('Pola Morris') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2333' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '152' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '152' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim Gomaa') OR lower(name_ar) = lower('Ibrahim Gomaa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2333' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '249' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '249' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Khalifa Nazeef') OR lower(name_ar) = lower('Ali Khalifa Nazeef') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2333' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '217' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '217' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mokhtar Kotb') OR lower(name_ar) = lower('Mokhtar Kotb') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2333' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '344' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '344' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed El-Bakry') OR lower(name_ar) = lower('Mohamed El-Bakry') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2333' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '226' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '226' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Pola Morris') OR lower(name_ar) = lower('Pola Morris') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2269' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed Hosny') OR lower(name_ar) = lower('Mohamed Hosny') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'Mohamed Hosny', 
        'Mohamed Hosny', 
        NULLIF('', ''), 
        NULLIF('Technical Office Manager', ''), 
        NULLIF('01111971665', ''), 
        NULLIF('Time Mix-Water Way', ''), 
        'contractor', 
        'contractor'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Technical Office Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2269' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '152' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '152' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ibrahim Gomaa') OR lower(name_ar) = lower('Ibrahim Gomaa') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2269' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '249' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '249' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Ali Khalifa Nazeef') OR lower(name_ar) = lower('Ali Khalifa Nazeef') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2269' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '217' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '217' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mokhtar Kotb') OR lower(name_ar) = lower('Mokhtar Kotb') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2269' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '344' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '344' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mohamed El-Bakry') OR lower(name_ar) = lower('Mohamed El-Bakry') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2269' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '226' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '226' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Pola Morris') OR lower(name_ar) = lower('Pola Morris') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '1044' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('العميد جمال سالم') OR lower(name_ar) = lower('العميد جمال سالم') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        'العميد جمال سالم', 
        'العميد جمال سالم', 
        NULLIF('', ''), 
        NULLIF('', ''), 
        NULLIF('', ''), 
        NULLIF('الهيئة الهندسية للقوات المسلحة', ''), 
        'client', 
        'client'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '1044' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '19' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '19' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mostafa Omar') OR lower(name_ar) = lower('Mostafa Omar') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '1044' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '67' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '67' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mawhoub Mahmoud Ahmed') OR lower(name_ar) = lower('Mawhoub Mahmoud Ahmed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '1044' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '13' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '13' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Salah Azzazi Abd el fattah') OR lower(name_ar) = lower('Salah Azzazi Abd el fattah') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2105' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '67' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '67' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mawhoub Mahmoud Ahmed') OR lower(name_ar) = lower('Mawhoub Mahmoud Ahmed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2105' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '13' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '13' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Salah Azzazi Abd el fattah') OR lower(name_ar) = lower('Salah Azzazi Abd el fattah') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2106' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '67' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '67' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Mawhoub Mahmoud Ahmed') OR lower(name_ar) = lower('Mawhoub Mahmoud Ahmed') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '2106' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '13' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '13' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('Salah Azzazi Abd el fattah') OR lower(name_ar) = lower('Salah Azzazi Abd el fattah') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
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
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
        'R',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Project Manager' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Project Manager' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('184') OR lower(name_ar) = lower('184') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '184', 
        '184', 
        NULLIF('Project Manager', ''), 
        NULLIF('0 1099858552', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 1099858552', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Site Engeneer' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Site Engeneer' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('138') OR lower(name_ar) = lower('138') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '138', 
        '138', 
        NULLIF('Site Engeneer', ''), 
        NULLIF('01070474455', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('01070474455', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Site Engeneer' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Site Engeneer' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('400/1000') OR lower(name_ar) = lower('400/1000') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '400/1000', 
        '400/1000', 
        NULLIF('Site Engeneer', ''), 
        NULLIF('01090177295-01044992840', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('01090177295-01044992840', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Technical Office Manager' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Technical Office Manager' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('57') OR lower(name_ar) = lower('57') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '57', 
        '57', 
        NULLIF('Technical Office Manager', ''), 
        NULLIF('1066220357', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('1066220357', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Planning Section Head' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Planning Section Head' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('329') OR lower(name_ar) = lower('329') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '329', 
        '329', 
        NULLIF('Planning Section Head', ''), 
        NULLIF('1021111762', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('1021111762', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Mechanical Section Head' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Mechanical Section Head' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('226') OR lower(name_ar) = lower('226') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '226', 
        '226', 
        NULLIF('Mechanical Section Head', ''), 
        NULLIF('0 10 69826535', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 10 69826535', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Electrical Section Head' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Electrical Section Head' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('25') OR lower(name_ar) = lower('25') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '25', 
        '25', 
        NULLIF('Electrical Section Head', ''), 
        NULLIF('0 1050222189', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 1050222189', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Team Leader DC' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Team Leader DC' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('56') OR lower(name_ar) = lower('56') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '56', 
        '56', 
        NULLIF('Team Leader DC', ''), 
        NULLIF('1066220351', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('1066220351', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Senior Document Control' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Senior Document Control' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('205') OR lower(name_ar) = lower('205') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '205', 
        '205', 
        NULLIF('Senior Document Control', ''), 
        NULLIF('0 1025485140', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 1025485140', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Senior Civil Technical Office' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Senior Civil Technical Office' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('179') OR lower(name_ar) = lower('179') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '179', 
        '179', 
        NULLIF('Senior Civil Technical Office', ''), 
        NULLIF('0 1020100511', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 1020100511', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Civil Technical Office' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Civil Technical Office' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('229') OR lower(name_ar) = lower('229') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '229', 
        '229', 
        NULLIF('Civil Technical Office', ''), 
        NULLIF('0 1012342472', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 1012342472', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Senior Technical Office' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Senior Technical Office' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('93') OR lower(name_ar) = lower('93') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '93', 
        '93', 
        NULLIF('Senior Technical Office', ''), 
        NULLIF('0 1080015702', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 1080015702', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Electrical Technical Office' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Electrical Technical Office' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('94') OR lower(name_ar) = lower('94') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '94', 
        '94', 
        NULLIF('Electrical Technical Office', ''), 
        NULLIF('0 10 64666801', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 10 64666801', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Electrical Technical Office' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Electrical Technical Office' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('358') OR lower(name_ar) = lower('358') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '358', 
        '358', 
        NULLIF('Electrical Technical Office', ''), 
        NULLIF('0 10 80015694', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 10 80015694', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Mechanical Technical Office' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Mechanical Technical Office' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('302') OR lower(name_ar) = lower('302') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '302', 
        '302', 
        NULLIF('Mechanical Technical Office', ''), 
        NULLIF('0 10 50434497', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 10 50434497', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Mechanical Technical Office' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Mechanical Technical Office' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('299') OR lower(name_ar) = lower('299') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '299', 
        '299', 
        NULLIF('Mechanical Technical Office', ''), 
        NULLIF('0 10 32980999', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 10 32980999', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Civil Supervisor' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Civil Supervisor' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('403/1003') OR lower(name_ar) = lower('403/1003') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '403/1003', 
        '403/1003', 
        NULLIF('Civil Supervisor', ''), 
        NULLIF('0 10 60289473', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 10 60289473', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Civil Supervisor' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Civil Supervisor' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('249') OR lower(name_ar) = lower('249') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '249', 
        '249', 
        NULLIF('Civil Supervisor', ''), 
        NULLIF('0 10 92565747', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 10 92565747', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Technical Supervisor' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Technical Supervisor' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('1') OR lower(name_ar) = lower('1') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '1', 
        '1', 
        NULLIF('Technical Supervisor', ''), 
        NULLIF('0 1090043116', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 1090043116', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Surveyor' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Surveyor' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('210') OR lower(name_ar) = lower('210') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '210', 
        '210', 
        NULLIF('Surveyor', ''), 
        NULLIF('', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('', ''), 'عضو فريق'),
        'A',
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
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '12 منشأ مائي + خرسانة وميكانيكا"' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF 'Technical Supervisor' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = 'Technical Supervisor' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('123') OR lower(name_ar) = lower('123') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '123', 
        '123', 
        NULLIF('Technical Supervisor', ''), 
        NULLIF('0 1065736661', ''), 
        NULLIF('', ''), 
        NULLIF('Sub- Contractor', ''), 
        'consultant', 
        'consultant'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('0 1065736661', ''), 'عضو فريق'),
        'A',
        'consultant',
        NOW()
      );
    END IF;
  END IF;
END $$;

COMMIT;