BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '231' <> '' AND code = '231')
       OR lower(name) = lower('EL Sayed Amer') 
       OR lower(name_ar) = lower('EL Sayed Amer')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Ahmed Ashraf Al-Tigani') 
       OR lower(name_ar) = lower('Ahmed Ashraf Al-Tigani')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '41' <> '' AND code = '41')
       OR lower(name) = lower('Osama ShahIn') 
       OR lower(name_ar) = lower('Osama ShahIn')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Abdel Menem Yassine') 
       OR lower(name_ar) = lower('Abdel Menem Yassine')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '247' <> '' AND code = '247')
       OR lower(name) = lower('Mina Nabil') 
       OR lower(name_ar) = lower('Mina Nabil')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '293' <> '' AND code = '293')
       OR lower(name) = lower('Mohammed Gamal Zaki') 
       OR lower(name_ar) = lower('Mohammed Gamal Zaki')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Mohamed Nasef Roshdy') 
       OR lower(name_ar) = lower('Mohamed Nasef Roshdy')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Zaho') 
       OR lower(name_ar) = lower('Zaho')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
      'Zaho',
      'Zaho',
      NULLIF('', ''),
      NULLIF('MEP Manager', ''),
      NULLIF('01101596102', ''),
      NULLIF('CSCEC', ''),
      'client_rep',
      'client_rep'
    );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '152' <> '' AND code = '152')
       OR lower(name) = lower('Ibrahim Gomaa Ibrahim Abd Alrhman') 
       OR lower(name_ar) = lower('Ibrahim Gomaa Ibrahim Abd Alrhman')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '217' <> '' AND code = '217')
       OR lower(name) = lower('Mokhtar Qodb Krim Gmaa') 
       OR lower(name_ar) = lower('Mokhtar Qodb Krim Gmaa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '249' <> '' AND code = '249')
       OR lower(name) = lower('Ali Khalifa Nazeef') 
       OR lower(name_ar) = lower('Ali Khalifa Nazeef')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Zaho') 
       OR lower(name_ar) = lower('Zaho')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
      'Zaho',
      'Zaho',
      NULLIF('', ''),
      NULLIF('MEP Manager', ''),
      NULLIF('01101596102', ''),
      NULLIF('CSCEC', ''),
      'client_rep',
      'client_rep'
    );
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '152' <> '' AND code = '152')
       OR lower(name) = lower('Ibrahim Gomaa Ibrahim Abd Alrhman') 
       OR lower(name_ar) = lower('Ibrahim Gomaa Ibrahim Abd Alrhman')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '217' <> '' AND code = '217')
       OR lower(name) = lower('Mokhtar Qodb Krim Gmaa') 
       OR lower(name_ar) = lower('Mokhtar Qodb Krim Gmaa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '249' <> '' AND code = '249')
       OR lower(name) = lower('Ali Khalifa Nazeef') 
       OR lower(name_ar) = lower('Ali Khalifa Nazeef')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '224' <> '' AND code = '224')
       OR lower(name) = lower('Nagy Neseim') 
       OR lower(name_ar) = lower('Nagy Neseim')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Ahmed Emad') 
       OR lower(name_ar) = lower('Ahmed Emad')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
       OR lower(name) = lower('Pola Morris') 
       OR lower(name_ar) = lower('Pola Morris')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '55' <> '' AND code = '55')
       OR lower(name) = lower('Mostafa Adel') 
       OR lower(name_ar) = lower('Mostafa Adel')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Shady El-Kordy') 
       OR lower(name_ar) = lower('Shady El-Kordy')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '109' <> '' AND code = '109')
       OR lower(name) = lower('El-Sayed Mohamed Ali') 
       OR lower(name_ar) = lower('El-Sayed Mohamed Ali')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Mohamed Alaa') 
       OR lower(name_ar) = lower('Mohamed Alaa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
       OR lower(name) = lower('Pola Morris') 
       OR lower(name_ar) = lower('Pola Morris')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '55' <> '' AND code = '55')
       OR lower(name) = lower('Mostafa Adel') 
       OR lower(name_ar) = lower('Mostafa Adel')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Shady El-Kordy') 
       OR lower(name_ar) = lower('Shady El-Kordy')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '109' <> '' AND code = '109')
       OR lower(name) = lower('El-Sayed Mohamed Ali') 
       OR lower(name_ar) = lower('El-Sayed Mohamed Ali')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '135' <> '' AND code = '135')
       OR lower(name) = lower('Mohamed Alaa') 
       OR lower(name_ar) = lower('Mohamed Alaa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
       OR lower(name) = lower('Pola Morris') 
       OR lower(name_ar) = lower('Pola Morris')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '90' <> '' AND code = '90')
       OR lower(name) = lower('Mohamed Shaaban') 
       OR lower(name_ar) = lower('Mohamed Shaaban')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '25' <> '' AND code = '25')
       OR lower(name) = lower('Abdel Rahman Azab') 
       OR lower(name_ar) = lower('Abdel Rahman Azab')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '108' <> '' AND code = '108')
       OR lower(name) = lower('Abdel Razek Mohamed') 
       OR lower(name_ar) = lower('Abdel Razek Mohamed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '249' <> '' AND code = '249')
       OR lower(name) = lower('Ali Khalifa Nazeef') 
       OR lower(name_ar) = lower('Ali Khalifa Nazeef')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Naser Gomaa') 
       OR lower(name_ar) = lower('Naser Gomaa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Kamal Abdel Hameed') 
       OR lower(name_ar) = lower('Kamal Abdel Hameed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
       OR lower(name) = lower('Pola Morris') 
       OR lower(name_ar) = lower('Pola Morris')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '90' <> '' AND code = '90')
       OR lower(name) = lower('Mohamed Shaaban') 
       OR lower(name_ar) = lower('Mohamed Shaaban')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '25' <> '' AND code = '25')
       OR lower(name) = lower('Abdel Rahman Azab') 
       OR lower(name_ar) = lower('Abdel Rahman Azab')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '108' <> '' AND code = '108')
       OR lower(name) = lower('Abdel Razek Mohamed') 
       OR lower(name_ar) = lower('Abdel Razek Mohamed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '249' <> '' AND code = '249')
       OR lower(name) = lower('Ali Khalifa Nazeef') 
       OR lower(name_ar) = lower('Ali Khalifa Nazeef')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Naser Gomaa') 
       OR lower(name_ar) = lower('Naser Gomaa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Kamal Abdel Hameed') 
       OR lower(name_ar) = lower('Kamal Abdel Hameed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
       OR lower(name) = lower('Pola Morris') 
       OR lower(name_ar) = lower('Pola Morris')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '90' <> '' AND code = '90')
       OR lower(name) = lower('Mohamed Shaaban') 
       OR lower(name_ar) = lower('Mohamed Shaaban')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '25' <> '' AND code = '25')
       OR lower(name) = lower('Abdel Rahman Azab') 
       OR lower(name_ar) = lower('Abdel Rahman Azab')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '108' <> '' AND code = '108')
       OR lower(name) = lower('Abdel Razek Mohamed') 
       OR lower(name_ar) = lower('Abdel Razek Mohamed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '249' <> '' AND code = '249')
       OR lower(name) = lower('Ali Khalifa Nazeef') 
       OR lower(name_ar) = lower('Ali Khalifa Nazeef')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Naser Gomaa') 
       OR lower(name_ar) = lower('Naser Gomaa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Kamal Abdel Hameed') 
       OR lower(name_ar) = lower('Kamal Abdel Hameed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
       OR lower(name) = lower('Pola Morris') 
       OR lower(name_ar) = lower('Pola Morris')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Zaho') 
       OR lower(name_ar) = lower('Zaho')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
      'Zaho',
      'Zaho',
      NULLIF('', ''),
      NULLIF('MEP Manager', ''),
      NULLIF('01101596102', ''),
      NULLIF('CSCEC', ''),
      'client_rep',
      'client_rep'
    );
  END IF;
END $$;
COMMIT;