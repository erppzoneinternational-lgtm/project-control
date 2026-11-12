BEGIN;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('أحمد حمام كامل الأمير') 
       OR lower(name_ar) = lower('أحمد حمام كامل الأمير')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '346' <> '' AND code = '346')
       OR lower(name) = lower('Mohammed Mamdouh Hassan Ali') 
       OR lower(name_ar) = lower('Mohammed Mamdouh Hassan Ali')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '287' <> '' AND code = '287')
       OR lower(name) = lower('Mohammed Abd El Razek Fahmy الشباسي') 
       OR lower(name_ar) = lower('Mohammed Abd El Razek Fahmy الشباسي')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '324' <> '' AND code = '324')
       OR lower(name) = lower('Galal Abd El Aty Sadek') 
       OR lower(name_ar) = lower('Galal Abd El Aty Sadek')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Omar Magdi') 
       OR lower(name_ar) = lower('Omar Magdi')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '91' <> '' AND code = '91')
       OR lower(name) = lower('Ahmed Mohammed Shehata abd alglil') 
       OR lower(name_ar) = lower('Ahmed Mohammed Shehata abd alglil')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '151' <> '' AND code = '151')
       OR lower(name) = lower('Mostafa Amir Ahmed') 
       OR lower(name_ar) = lower('Mostafa Amir Ahmed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '331' <> '' AND code = '331')
       OR lower(name) = lower('Mahmoud Khaled Ahmed') 
       OR lower(name_ar) = lower('Mahmoud Khaled Ahmed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '373' <> '' AND code = '373')
       OR lower(name) = lower('Mohamed Mohsn Barkat Moamed') 
       OR lower(name_ar) = lower('Mohamed Mohsn Barkat Moamed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '212' <> '' AND code = '212')
       OR lower(name) = lower('Mohammed ali hasan Ibrahim El lbani') 
       OR lower(name_ar) = lower('Mohammed ali hasan Ibrahim El lbani')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '210' <> '' AND code = '210')
       OR lower(name) = lower('Ali Ayman Ali') 
       OR lower(name_ar) = lower('Ali Ayman Ali')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '294' <> '' AND code = '294')
       OR lower(name) = lower('Mohamed Nasser Mahmoud') 
       OR lower(name_ar) = lower('Mohamed Nasser Mahmoud')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('حامد السيد إبراهيم الخواجة') 
       OR lower(name_ar) = lower('حامد السيد إبراهيم الخواجة')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('رجب عبد البديع') 
       OR lower(name_ar) = lower('رجب عبد البديع')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '284' <> '' AND code = '284')
       OR lower(name) = lower('Ahmed Rateb Mahmoud') 
       OR lower(name_ar) = lower('Ahmed Rateb Mahmoud')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '91' <> '' AND code = '91')
       OR lower(name) = lower('Ahmed Mohammed Shehata abd alglil') 
       OR lower(name_ar) = lower('Ahmed Mohammed Shehata abd alglil')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '151' <> '' AND code = '151')
       OR lower(name) = lower('Mostafa Amir Ahmed') 
       OR lower(name_ar) = lower('Mostafa Amir Ahmed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '331' <> '' AND code = '331')
       OR lower(name) = lower('Mahmoud Khaled Ahmed') 
       OR lower(name_ar) = lower('Mahmoud Khaled Ahmed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '373' <> '' AND code = '373')
       OR lower(name) = lower('Mohamed Mohsn Barkat Moamed') 
       OR lower(name_ar) = lower('Mohamed Mohsn Barkat Moamed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '212' <> '' AND code = '212')
       OR lower(name) = lower('Mohammed ali hasan Ibrahim El lbani') 
       OR lower(name_ar) = lower('Mohammed ali hasan Ibrahim El lbani')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '210' <> '' AND code = '210')
       OR lower(name) = lower('Ali Ayman Ali') 
       OR lower(name_ar) = lower('Ali Ayman Ali')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '294' <> '' AND code = '294')
       OR lower(name) = lower('Mohamed Nasser Mahmoud') 
       OR lower(name_ar) = lower('Mohamed Nasser Mahmoud')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('حامد السيد إبراهيم الخواجة') 
       OR lower(name_ar) = lower('حامد السيد إبراهيم الخواجة')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('رجب عبد البديع') 
       OR lower(name_ar) = lower('رجب عبد البديع')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '284' <> '' AND code = '284')
       OR lower(name) = lower('Ahmed Rateb Mahmoud') 
       OR lower(name_ar) = lower('Ahmed Rateb Mahmoud')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Tarek Shawkat') 
       OR lower(name_ar) = lower('Tarek Shawkat')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
    WHERE (code IS NOT NULL AND '398' <> '' AND code = '398')
       OR lower(name) = lower('Mhmwd Mohamed Abd Altif Mohamed') 
       OR lower(name_ar) = lower('Mhmwd Mohamed Abd Altif Mohamed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '384' <> '' AND code = '384')
       OR lower(name) = lower('Akram Mohammed Abd Al-Alim') 
       OR lower(name_ar) = lower('Akram Mohammed Abd Al-Alim')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '383' <> '' AND code = '383')
       OR lower(name) = lower('Mahmoud Mostafa Abd al kader') 
       OR lower(name_ar) = lower('Mahmoud Mostafa Abd al kader')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '341' <> '' AND code = '341')
       OR lower(name) = lower('Ahmed Kamel Abd El Razek') 
       OR lower(name_ar) = lower('Ahmed Kamel Abd El Razek')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '315' <> '' AND code = '315')
       OR lower(name) = lower('Mostafa Ali Ahmed Rabee''') 
       OR lower(name_ar) = lower('Mostafa Ali Ahmed Rabee''')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '267' <> '' AND code = '267')
       OR lower(name) = lower('Amr Ahmed gouda Mhmwd Aldwi') 
       OR lower(name_ar) = lower('Amr Ahmed gouda Mhmwd Aldwi')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Basem Abd Al Daim Mohamed') 
       OR lower(name_ar) = lower('Basem Abd Al Daim Mohamed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Eslam Said Abd Alrazek Mostfa') 
       OR lower(name_ar) = lower('Eslam Said Abd Alrazek Mostfa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Mohamed Al Sid Ahmed Al Sid') 
       OR lower(name_ar) = lower('Mohamed Al Sid Ahmed Al Sid')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '333' <> '' AND code = '333')
       OR lower(name) = lower('Abdulkhaliq Gharib Abdulkhaliq Muhammad') 
       OR lower(name_ar) = lower('Abdulkhaliq Gharib Abdulkhaliq Muhammad')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '230' <> '' AND code = '230')
       OR lower(name) = lower('Ahmed Shaaban Ahmed Morsy') 
       OR lower(name_ar) = lower('Ahmed Shaaban Ahmed Morsy')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('أحمد أشرف محمد فرج جاد') 
       OR lower(name_ar) = lower('أحمد أشرف محمد فرج جاد')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('محمود عادل') 
       OR lower(name_ar) = lower('محمود عادل')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Ahmed Youssef') 
       OR lower(name_ar) = lower('Ahmed Youssef')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
    WHERE (code IS NOT NULL AND '241' <> '' AND code = '241')
       OR lower(name) = lower('Sherif Sayed') 
       OR lower(name_ar) = lower('Sherif Sayed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Nabil Abd El Aal') 
       OR lower(name_ar) = lower('Nabil Abd El Aal')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
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
       OR lower(name) = lower('Tamer Safwat') 
       OR lower(name_ar) = lower('Tamer Safwat')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
    WHERE (code IS NOT NULL AND '122' <> '' AND code = '122')
       OR lower(name) = lower('Wael said mahmoud Daha') 
       OR lower(name_ar) = lower('Wael said mahmoud Daha')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '213' <> '' AND code = '213')
       OR lower(name) = lower('Abd El Rahman Saad') 
       OR lower(name_ar) = lower('Abd El Rahman Saad')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '335' <> '' AND code = '335')
       OR lower(name) = lower('Omar Nabil Abd El Aal') 
       OR lower(name_ar) = lower('Omar Nabil Abd El Aal')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
COMMIT;