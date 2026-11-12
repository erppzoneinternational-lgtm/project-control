BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Hesham El Seifi') 
       OR lower(name_ar) = lower('Hesham El Seifi')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Evram Rafat') 
       OR lower(name_ar) = lower('Evram Rafat')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '283' <> '' AND code = '283')
       OR lower(name) = lower('Ahmed Wageh Abd El Alim') 
       OR lower(name_ar) = lower('Ahmed Wageh Abd El Alim')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '79' <> '' AND code = '79')
       OR lower(name) = lower('Bssam el bdry') 
       OR lower(name_ar) = lower('Bssam el bdry')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '96' <> '' AND code = '96')
       OR lower(name) = lower('Khaled Ashraf Aly Khaled') 
       OR lower(name_ar) = lower('Khaled Ashraf Aly Khaled')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '195' <> '' AND code = '195')
       OR lower(name) = lower('Ibrahim hasan abd El Alim sid') 
       OR lower(name_ar) = lower('Ibrahim hasan abd El Alim sid')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '245' <> '' AND code = '245')
       OR lower(name) = lower('Mustafa mohammed saad abo gali') 
       OR lower(name_ar) = lower('Mustafa mohammed saad abo gali')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '300' <> '' AND code = '300')
       OR lower(name) = lower('Omar Samy Abd El Hady Hlal') 
       OR lower(name_ar) = lower('Omar Samy Abd El Hady Hlal')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '340' <> '' AND code = '340')
       OR lower(name) = lower('Ahmed Yhia Ismail Abd Alhmid') 
       OR lower(name_ar) = lower('Ahmed Yhia Ismail Abd Alhmid')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '348' <> '' AND code = '348')
       OR lower(name) = lower('Ahmed Mohammed Mostafa Slim') 
       OR lower(name_ar) = lower('Ahmed Mohammed Mostafa Slim')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '385' <> '' AND code = '385')
       OR lower(name) = lower('Karim mohamed Ali Mahmoud Mohamed') 
       OR lower(name_ar) = lower('Karim mohamed Ali Mahmoud Mohamed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '387' <> '' AND code = '387')
       OR lower(name) = lower('Osama Mohammady Mohammed ELE.') 
       OR lower(name_ar) = lower('Osama Mohammady Mohammed ELE.')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '391' <> '' AND code = '391')
       OR lower(name) = lower('Saoudi Mohamed Issa') 
       OR lower(name_ar) = lower('Saoudi Mohamed Issa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '178' <> '' AND code = '178')
       OR lower(name) = lower('Mohammed hassan abo al liel') 
       OR lower(name_ar) = lower('Mohammed hassan abo al liel')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '286' <> '' AND code = '286')
       OR lower(name) = lower('Adel Mohammed Sawy') 
       OR lower(name_ar) = lower('Adel Mohammed Sawy')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '339' <> '' AND code = '339')
       OR lower(name) = lower('Karim Adel Adly') 
       OR lower(name_ar) = lower('Karim Adel Adly')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '89' <> '' AND code = '89')
       OR lower(name) = lower('Ahmed Mohammed El Sahaty') 
       OR lower(name_ar) = lower('Ahmed Mohammed El Sahaty')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '181' <> '' AND code = '181')
       OR lower(name) = lower('Ibrahim khaled abd el aty') 
       OR lower(name_ar) = lower('Ibrahim khaled abd el aty')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '145' <> '' AND code = '145')
       OR lower(name) = lower('Fares Amer Ismael') 
       OR lower(name_ar) = lower('Fares Amer Ismael')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '174' <> '' AND code = '174')
       OR lower(name) = lower('Badr ayman mohammed al sid') 
       OR lower(name_ar) = lower('Badr ayman mohammed al sid')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '266' <> '' AND code = '266')
       OR lower(name) = lower('Ahmed Abd El Rahim') 
       OR lower(name_ar) = lower('Ahmed Abd El Rahim')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '361' <> '' AND code = '361')
       OR lower(name) = lower('Abd el Rahman mostafa mohammed') 
       OR lower(name_ar) = lower('Abd el Rahman mostafa mohammed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '388' <> '' AND code = '388')
       OR lower(name) = lower('Hassan Atef Ahmd ali') 
       OR lower(name_ar) = lower('Hassan Atef Ahmd ali')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Zaki Gamal Zaki') 
       OR lower(name_ar) = lower('Zaki Gamal Zaki')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '59' <> '' AND code = '59')
       OR lower(name) = lower('Abd el nabi Mehanni') 
       OR lower(name_ar) = lower('Abd el nabi Mehanni')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '325' <> '' AND code = '325')
       OR lower(name) = lower('Anwar Magdy Mahmoud Mohamed') 
       OR lower(name_ar) = lower('Anwar Magdy Mahmoud Mohamed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '146' <> '' AND code = '146')
       OR lower(name) = lower('Mohammed Frg Abdelalim') 
       OR lower(name_ar) = lower('Mohammed Frg Abdelalim')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '375' <> '' AND code = '375')
       OR lower(name) = lower('Mohamed Gmal Abd Alaziz Gafr') 
       OR lower(name_ar) = lower('Mohamed Gmal Abd Alaziz Gafr')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '363' <> '' AND code = '363')
       OR lower(name) = lower('Amer hany Amer') 
       OR lower(name_ar) = lower('Amer hany Amer')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '251' <> '' AND code = '251')
       OR lower(name) = lower('Radwan Mohamed') 
       OR lower(name_ar) = lower('Radwan Mohamed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '295' <> '' AND code = '295')
       OR lower(name) = lower('Alaa Ali Mohamed Ali Almsry') 
       OR lower(name_ar) = lower('Alaa Ali Mohamed Ali Almsry')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '347' <> '' AND code = '347')
       OR lower(name) = lower('Omar Sabry Mostafa') 
       OR lower(name_ar) = lower('Omar Sabry Mostafa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Mina George') 
       OR lower(name_ar) = lower('Mina George')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '283' <> '' AND code = '283')
       OR lower(name) = lower('Ahmed Wageh Abd El Alim') 
       OR lower(name_ar) = lower('Ahmed Wageh Abd El Alim')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '79' <> '' AND code = '79')
       OR lower(name) = lower('Bssam el bdry') 
       OR lower(name_ar) = lower('Bssam el bdry')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '96' <> '' AND code = '96')
       OR lower(name) = lower('Khaled Ashraf Aly Khaled') 
       OR lower(name_ar) = lower('Khaled Ashraf Aly Khaled')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '195' <> '' AND code = '195')
       OR lower(name) = lower('Ibrahim hasan abd El Alim sid') 
       OR lower(name_ar) = lower('Ibrahim hasan abd El Alim sid')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '245' <> '' AND code = '245')
       OR lower(name) = lower('Mustafa mohammed saad abo gali') 
       OR lower(name_ar) = lower('Mustafa mohammed saad abo gali')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '300' <> '' AND code = '300')
       OR lower(name) = lower('Omar Samy Abd El Hady Hlal') 
       OR lower(name_ar) = lower('Omar Samy Abd El Hady Hlal')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '340' <> '' AND code = '340')
       OR lower(name) = lower('Ahmed Yhia Ismail Abd Alhmid') 
       OR lower(name_ar) = lower('Ahmed Yhia Ismail Abd Alhmid')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '348' <> '' AND code = '348')
       OR lower(name) = lower('Ahmed Mohammed Mostafa Slim') 
       OR lower(name_ar) = lower('Ahmed Mohammed Mostafa Slim')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '385' <> '' AND code = '385')
       OR lower(name) = lower('Krim Mohamed Ali Mahmwd') 
       OR lower(name_ar) = lower('Krim Mohamed Ali Mahmwd')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '387' <> '' AND code = '387')
       OR lower(name) = lower('Osama Mohammady Mohammed ELE.') 
       OR lower(name_ar) = lower('Osama Mohammady Mohammed ELE.')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '391' <> '' AND code = '391')
       OR lower(name) = lower('Saoudi Mohamed Issa') 
       OR lower(name_ar) = lower('Saoudi Mohamed Issa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '178' <> '' AND code = '178')
       OR lower(name) = lower('Mohammed hassan abo al liel') 
       OR lower(name_ar) = lower('Mohammed hassan abo al liel')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '286' <> '' AND code = '286')
       OR lower(name) = lower('Adel Mohammed Sawy') 
       OR lower(name_ar) = lower('Adel Mohammed Sawy')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '339' <> '' AND code = '339')
       OR lower(name) = lower('Karim Adel Adly') 
       OR lower(name_ar) = lower('Karim Adel Adly')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '89' <> '' AND code = '89')
       OR lower(name) = lower('Ahmed Mohammed El Sahaty') 
       OR lower(name_ar) = lower('Ahmed Mohammed El Sahaty')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '181' <> '' AND code = '181')
       OR lower(name) = lower('Ibrahim khaled abd el aty') 
       OR lower(name_ar) = lower('Ibrahim khaled abd el aty')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '145' <> '' AND code = '145')
       OR lower(name) = lower('Fares Amer Ismael') 
       OR lower(name_ar) = lower('Fares Amer Ismael')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '174' <> '' AND code = '174')
       OR lower(name) = lower('Badr ayman mohammed al sid') 
       OR lower(name_ar) = lower('Badr ayman mohammed al sid')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '266' <> '' AND code = '266')
       OR lower(name) = lower('Ahmed Abd El Rahim') 
       OR lower(name_ar) = lower('Ahmed Abd El Rahim')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '361' <> '' AND code = '361')
       OR lower(name) = lower('Abd el Rahman mostafa mohammed') 
       OR lower(name_ar) = lower('Abd el Rahman mostafa mohammed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '388' <> '' AND code = '388')
       OR lower(name) = lower('Hassan Atef Ahmd ali') 
       OR lower(name_ar) = lower('Hassan Atef Ahmd ali')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Zaki Gamal Zaki') 
       OR lower(name_ar) = lower('Zaki Gamal Zaki')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '59' <> '' AND code = '59')
       OR lower(name) = lower('Abd el nabi Mehanni') 
       OR lower(name_ar) = lower('Abd el nabi Mehanni')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '325' <> '' AND code = '325')
       OR lower(name) = lower('Anwar Magdy Mahmoud Mohamed') 
       OR lower(name_ar) = lower('Anwar Magdy Mahmoud Mohamed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '146' <> '' AND code = '146')
       OR lower(name) = lower('Mohammed Frg Abdelalim') 
       OR lower(name_ar) = lower('Mohammed Frg Abdelalim')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '375' <> '' AND code = '375')
       OR lower(name) = lower('Mohamed Gmal Abd Alaziz Gafr') 
       OR lower(name_ar) = lower('Mohamed Gmal Abd Alaziz Gafr')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '363' <> '' AND code = '363')
       OR lower(name) = lower('Amer hany Amer') 
       OR lower(name_ar) = lower('Amer hany Amer')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '251' <> '' AND code = '251')
       OR lower(name) = lower('Radwan Mohamed') 
       OR lower(name_ar) = lower('Radwan Mohamed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '295' <> '' AND code = '295')
       OR lower(name) = lower('Alaa Ali Mohamed Ali Almsry') 
       OR lower(name_ar) = lower('Alaa Ali Mohamed Ali Almsry')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '347' <> '' AND code = '347')
       OR lower(name) = lower('Omar Sabry Mostafa') 
       OR lower(name_ar) = lower('Omar Sabry Mostafa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '283' <> '' AND code = '283')
       OR lower(name) = lower('Ahmed Wageh Abd El Alim') 
       OR lower(name_ar) = lower('Ahmed Wageh Abd El Alim')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '174' <> '' AND code = '174')
       OR lower(name) = lower('Bssam El Bdry') 
       OR lower(name_ar) = lower('Bssam El Bdry')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '96' <> '' AND code = '96')
       OR lower(name) = lower('Khaled Ashraf Aly Khaled') 
       OR lower(name_ar) = lower('Khaled Ashraf Aly Khaled')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '195' <> '' AND code = '195')
       OR lower(name) = lower('Ibrahim hasan abd El Alim sid') 
       OR lower(name_ar) = lower('Ibrahim hasan abd El Alim sid')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Karim Said') 
       OR lower(name_ar) = lower('Karim Said')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
      'Karim Said',
      'Karim Said',
      NULLIF('', ''),
      NULLIF('Project Manager', ''),
      NULLIF('01010012963', ''),
      NULLIF('Redcon', ''),
      'client_rep',
      'client_rep'
    );
  END IF;
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '245' <> '' AND code = '245')
       OR lower(name) = lower('Mustafa mohammed saad abo gali') 
       OR lower(name_ar) = lower('Mustafa mohammed saad abo gali')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '300' <> '' AND code = '300')
       OR lower(name) = lower('Omar Samy Abd El Hady Hlal') 
       OR lower(name_ar) = lower('Omar Samy Abd El Hady Hlal')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '340' <> '' AND code = '340')
       OR lower(name) = lower('Ahmed Yhia Ismail Abd Alhmid') 
       OR lower(name_ar) = lower('Ahmed Yhia Ismail Abd Alhmid')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '348' <> '' AND code = '348')
       OR lower(name) = lower('Ahmed Mohammed Mostafa Slim') 
       OR lower(name_ar) = lower('Ahmed Mohammed Mostafa Slim')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '385' <> '' AND code = '385')
       OR lower(name) = lower('Krim Mohamed Ali Mahmwd') 
       OR lower(name_ar) = lower('Krim Mohamed Ali Mahmwd')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '387' <> '' AND code = '387')
       OR lower(name) = lower('Osama Mohammady Mohammed') 
       OR lower(name_ar) = lower('Osama Mohammady Mohammed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '391' <> '' AND code = '391')
       OR lower(name) = lower('Saoudi Mohamed Issa') 
       OR lower(name_ar) = lower('Saoudi Mohamed Issa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '178' <> '' AND code = '178')
       OR lower(name) = lower('Mohammed hassan abo al liel') 
       OR lower(name_ar) = lower('Mohammed hassan abo al liel')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '286' <> '' AND code = '286')
       OR lower(name) = lower('Adel Mohammed Sawy') 
       OR lower(name_ar) = lower('Adel Mohammed Sawy')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '339' <> '' AND code = '339')
       OR lower(name) = lower('Karim Adel Adly') 
       OR lower(name_ar) = lower('Karim Adel Adly')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
      '00000000-0000-0000-0000-000000000001',
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '89' <> '' AND code = '89')
       OR lower(name) = lower('Ahmed Mohammed El Sahaty') 
       OR lower(name_ar) = lower('Ahmed Mohammed El Sahaty')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '181' <> '' AND code = '181')
       OR lower(name) = lower('Ibrahim khaled abd el aty') 
       OR lower(name_ar) = lower('Ibrahim khaled abd el aty')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '145' <> '' AND code = '145')
       OR lower(name) = lower('Fares Amer Ismael') 
       OR lower(name_ar) = lower('Fares Amer Ismael')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '174' <> '' AND code = '174')
       OR lower(name) = lower('Badr ayman mohammed al sid') 
       OR lower(name_ar) = lower('Badr ayman mohammed al sid')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '266' <> '' AND code = '266')
       OR lower(name) = lower('Ahmed Abd El Rahim') 
       OR lower(name_ar) = lower('Ahmed Abd El Rahim')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '361' <> '' AND code = '361')
       OR lower(name) = lower('Abd el Rahman mostafa mohammed') 
       OR lower(name_ar) = lower('Abd el Rahman mostafa mohammed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '388' <> '' AND code = '388')
       OR lower(name) = lower('Hassan Atef Ahmd ali') 
       OR lower(name_ar) = lower('Hassan Atef Ahmd ali')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Zaki Gamal Zaki') 
       OR lower(name_ar) = lower('Zaki Gamal Zaki')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '59' <> '' AND code = '59')
       OR lower(name) = lower('Abd el nabi Mehanni') 
       OR lower(name_ar) = lower('Abd el nabi Mehanni')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '325' <> '' AND code = '325')
       OR lower(name) = lower('Anwar Magdy Mahmoud Mohamed') 
       OR lower(name_ar) = lower('Anwar Magdy Mahmoud Mohamed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '146' <> '' AND code = '146')
       OR lower(name) = lower('Mohammed Frg Abdelalim') 
       OR lower(name_ar) = lower('Mohammed Frg Abdelalim')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '375' <> '' AND code = '375')
       OR lower(name) = lower('Mohamed Gmal Abd Alaziz Gafr') 
       OR lower(name_ar) = lower('Mohamed Gmal Abd Alaziz Gafr')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '363' <> '' AND code = '363')
       OR lower(name) = lower('Amer hany Amer') 
       OR lower(name_ar) = lower('Amer hany Amer')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '251' <> '' AND code = '251')
       OR lower(name) = lower('Radwan Mohamed') 
       OR lower(name_ar) = lower('Radwan Mohamed')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '295' <> '' AND code = '295')
       OR lower(name) = lower('Alaa Ali Mohamed Ali Almsry') 
       OR lower(name_ar) = lower('Alaa Ali Mohamed Ali Almsry')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '347' <> '' AND code = '347')
       OR lower(name) = lower('Omar Sabry Mostafa') 
       OR lower(name_ar) = lower('Omar Sabry Mostafa')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
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


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '288' <> '' AND code = '288')
       OR lower(name) = lower('Ahmed Maher Fahmy') 
       OR lower(name_ar) = lower('Ahmed Maher Fahmy')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '248' <> '' AND code = '248')
       OR lower(name) = lower('Alaa el Hennawy') 
       OR lower(name_ar) = lower('Alaa el Hennawy')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('Mohamed Atef Mohamed Zidan') 
       OR lower(name_ar) = lower('Mohamed Atef Mohamed Zidan')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '' <> '' AND code = '')
       OR lower(name) = lower('إبراهيم عطا إبراهيم خليل') 
       OR lower(name_ar) = lower('إبراهيم عطا إبراهيم خليل')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
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


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND 'Technical Supervisor' <> '' AND code = 'Technical Supervisor')
       OR lower(name) = lower('123') 
       OR lower(name_ar) = lower('123')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;

COMMIT;