BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '152' <> '' AND code = '152')
       OR lower(name) = lower('Ibrahim Gomaa') 
       OR lower(name_ar) = lower('Ibrahim Gomaa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
    WHERE (code IS NOT NULL AND '217' <> '' AND code = '217')
       OR lower(name) = lower('Mokhtar Kotb') 
       OR lower(name_ar) = lower('Mokhtar Kotb')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '344' <> '' AND code = '344')
       OR lower(name) = lower('Mohamed El-Bakry') 
       OR lower(name_ar) = lower('Mohamed El-Bakry')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
       OR lower(name) = lower('Eng. Tamer') 
       OR lower(name_ar) = lower('Eng. Tamer')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '152' <> '' AND code = '152')
       OR lower(name) = lower('Ibrahim Gomaa') 
       OR lower(name_ar) = lower('Ibrahim Gomaa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
    WHERE (code IS NOT NULL AND '217' <> '' AND code = '217')
       OR lower(name) = lower('Mokhtar Kotb') 
       OR lower(name_ar) = lower('Mokhtar Kotb')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '344' <> '' AND code = '344')
       OR lower(name) = lower('Mohamed El-Bakry') 
       OR lower(name_ar) = lower('Mohamed El-Bakry')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
    WHERE (code IS NOT NULL AND '152' <> '' AND code = '152')
       OR lower(name) = lower('Ibrahim Gomaa') 
       OR lower(name_ar) = lower('Ibrahim Gomaa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
    WHERE (code IS NOT NULL AND '217' <> '' AND code = '217')
       OR lower(name) = lower('Mokhtar Kotb') 
       OR lower(name_ar) = lower('Mokhtar Kotb')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '344' <> '' AND code = '344')
       OR lower(name) = lower('Mohamed El-Bakry') 
       OR lower(name_ar) = lower('Mohamed El-Bakry')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
       OR lower(name) = lower('Mohamed Hosny') 
       OR lower(name_ar) = lower('Mohamed Hosny')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '152' <> '' AND code = '152')
       OR lower(name) = lower('Ibrahim Gomaa') 
       OR lower(name_ar) = lower('Ibrahim Gomaa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
    WHERE (code IS NOT NULL AND '217' <> '' AND code = '217')
       OR lower(name) = lower('Mokhtar Kotb') 
       OR lower(name_ar) = lower('Mokhtar Kotb')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '344' <> '' AND code = '344')
       OR lower(name) = lower('Mohamed El-Bakry') 
       OR lower(name_ar) = lower('Mohamed El-Bakry')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
       OR lower(name) = lower('العميد جمال سالم') 
       OR lower(name_ar) = lower('العميد جمال سالم')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '19' <> '' AND code = '19')
       OR lower(name) = lower('Mostafa Omar') 
       OR lower(name_ar) = lower('Mostafa Omar')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '67' <> '' AND code = '67')
       OR lower(name) = lower('Mawhoub Mahmoud Ahmed') 
       OR lower(name_ar) = lower('Mawhoub Mahmoud Ahmed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '13' <> '' AND code = '13')
       OR lower(name) = lower('Salah Azzazi Abd el fattah') 
       OR lower(name_ar) = lower('Salah Azzazi Abd el fattah')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '67' <> '' AND code = '67')
       OR lower(name) = lower('Mawhoub Mahmoud Ahmed') 
       OR lower(name_ar) = lower('Mawhoub Mahmoud Ahmed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '13' <> '' AND code = '13')
       OR lower(name) = lower('Salah Azzazi Abd el fattah') 
       OR lower(name_ar) = lower('Salah Azzazi Abd el fattah')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '67' <> '' AND code = '67')
       OR lower(name) = lower('Mawhoub Mahmoud Ahmed') 
       OR lower(name_ar) = lower('Mawhoub Mahmoud Ahmed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '13' <> '' AND code = '13')
       OR lower(name) = lower('Salah Azzazi Abd el fattah') 
       OR lower(name_ar) = lower('Salah Azzazi Abd el fattah')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Project Manager' <> '' AND code = 'Project Manager')
       OR lower(name) = lower('184') 
       OR lower(name_ar) = lower('184')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Site Engeneer' <> '' AND code = 'Site Engeneer')
       OR lower(name) = lower('138') 
       OR lower(name_ar) = lower('138')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Site Engeneer' <> '' AND code = 'Site Engeneer')
       OR lower(name) = lower('400/1000') 
       OR lower(name_ar) = lower('400/1000')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Technical Office Manager' <> '' AND code = 'Technical Office Manager')
       OR lower(name) = lower('57') 
       OR lower(name_ar) = lower('57')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Planning Section Head' <> '' AND code = 'Planning Section Head')
       OR lower(name) = lower('329') 
       OR lower(name_ar) = lower('329')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Mechanical Section Head' <> '' AND code = 'Mechanical Section Head')
       OR lower(name) = lower('226') 
       OR lower(name_ar) = lower('226')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Electrical Section Head' <> '' AND code = 'Electrical Section Head')
       OR lower(name) = lower('25') 
       OR lower(name_ar) = lower('25')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Team Leader DC' <> '' AND code = 'Team Leader DC')
       OR lower(name) = lower('56') 
       OR lower(name_ar) = lower('56')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Senior Document Control' <> '' AND code = 'Senior Document Control')
       OR lower(name) = lower('205') 
       OR lower(name_ar) = lower('205')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Senior Civil Technical Office' <> '' AND code = 'Senior Civil Technical Office')
       OR lower(name) = lower('179') 
       OR lower(name_ar) = lower('179')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Civil Technical Office' <> '' AND code = 'Civil Technical Office')
       OR lower(name) = lower('229') 
       OR lower(name_ar) = lower('229')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Senior Technical Office' <> '' AND code = 'Senior Technical Office')
       OR lower(name) = lower('93') 
       OR lower(name_ar) = lower('93')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Electrical Technical Office' <> '' AND code = 'Electrical Technical Office')
       OR lower(name) = lower('94') 
       OR lower(name_ar) = lower('94')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Electrical Technical Office' <> '' AND code = 'Electrical Technical Office')
       OR lower(name) = lower('358') 
       OR lower(name_ar) = lower('358')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Mechanical Technical Office' <> '' AND code = 'Mechanical Technical Office')
       OR lower(name) = lower('302') 
       OR lower(name_ar) = lower('302')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Mechanical Technical Office' <> '' AND code = 'Mechanical Technical Office')
       OR lower(name) = lower('299') 
       OR lower(name_ar) = lower('299')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Civil Supervisor' <> '' AND code = 'Civil Supervisor')
       OR lower(name) = lower('403/1003') 
       OR lower(name_ar) = lower('403/1003')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Civil Supervisor' <> '' AND code = 'Civil Supervisor')
       OR lower(name) = lower('249') 
       OR lower(name_ar) = lower('249')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Technical Supervisor' <> '' AND code = 'Technical Supervisor')
       OR lower(name) = lower('1') 
       OR lower(name_ar) = lower('1')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Surveyor' <> '' AND code = 'Surveyor')
       OR lower(name) = lower('210') 
       OR lower(name_ar) = lower('210')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
COMMIT;