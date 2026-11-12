BEGIN;
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
DO $$ BEGIN
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
COMMIT;