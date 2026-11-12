BEGIN;

INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Hesham El Seifi')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Evram Rafat')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '283' <> '' AND code = '283')
     OR lower(name) = lower('Ahmed Wageh Abd El Alim')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '79' <> '' AND code = '79')
     OR lower(name) = lower('Bssam el bdry')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '96' <> '' AND code = '96')
     OR lower(name) = lower('Khaled Ashraf Aly Khaled')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '195' <> '' AND code = '195')
     OR lower(name) = lower('Ibrahim hasan abd El Alim sid')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '245' <> '' AND code = '245')
     OR lower(name) = lower('Mustafa mohammed saad abo gali')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '300' <> '' AND code = '300')
     OR lower(name) = lower('Omar Samy Abd El Hady Hlal')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '340' <> '' AND code = '340')
     OR lower(name) = lower('Ahmed Yhia Ismail Abd Alhmid')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '348' <> '' AND code = '348')
     OR lower(name) = lower('Ahmed Mohammed Mostafa Slim')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '385' <> '' AND code = '385')
     OR lower(name) = lower('Karim mohamed Ali Mahmoud Mohamed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '387' <> '' AND code = '387')
     OR lower(name) = lower('Osama Mohammady Mohammed ELE.')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '391' <> '' AND code = '391')
     OR lower(name) = lower('Saoudi Mohamed Issa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '178' <> '' AND code = '178')
     OR lower(name) = lower('Mohammed hassan abo al liel')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '286' <> '' AND code = '286')
     OR lower(name) = lower('Adel Mohammed Sawy')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '339' <> '' AND code = '339')
     OR lower(name) = lower('Karim Adel Adly')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '89' <> '' AND code = '89')
     OR lower(name) = lower('Ahmed Mohammed El Sahaty')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '181' <> '' AND code = '181')
     OR lower(name) = lower('Ibrahim khaled abd el aty')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '145' <> '' AND code = '145')
     OR lower(name) = lower('Fares Amer Ismael')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '174' <> '' AND code = '174')
     OR lower(name) = lower('Badr ayman mohammed al sid')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '266' <> '' AND code = '266')
     OR lower(name) = lower('Ahmed Abd El Rahim')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '361' <> '' AND code = '361')
     OR lower(name) = lower('Abd el Rahman mostafa mohammed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '388' <> '' AND code = '388')
     OR lower(name) = lower('Hassan Atef Ahmd ali')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Zaki Gamal Zaki')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '59' <> '' AND code = '59')
     OR lower(name) = lower('Abd el nabi Mehanni')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '325' <> '' AND code = '325')
     OR lower(name) = lower('Anwar Magdy Mahmoud Mohamed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '146' <> '' AND code = '146')
     OR lower(name) = lower('Mohammed Frg Abdelalim')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '375' <> '' AND code = '375')
     OR lower(name) = lower('Mohamed Gmal Abd Alaziz Gafr')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '363' <> '' AND code = '363')
     OR lower(name) = lower('Amer hany Amer')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '251' <> '' AND code = '251')
     OR lower(name) = lower('Radwan Mohamed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '295' <> '' AND code = '295')
     OR lower(name) = lower('Alaa Ali Mohamed Ali Almsry')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '347' <> '' AND code = '347')
     OR lower(name) = lower('Omar Sabry Mostafa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Mina George')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '283' <> '' AND code = '283')
     OR lower(name) = lower('Ahmed Wageh Abd El Alim')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '79' <> '' AND code = '79')
     OR lower(name) = lower('Bssam el bdry')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '96' <> '' AND code = '96')
     OR lower(name) = lower('Khaled Ashraf Aly Khaled')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '195' <> '' AND code = '195')
     OR lower(name) = lower('Ibrahim hasan abd El Alim sid')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '245' <> '' AND code = '245')
     OR lower(name) = lower('Mustafa mohammed saad abo gali')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '300' <> '' AND code = '300')
     OR lower(name) = lower('Omar Samy Abd El Hady Hlal')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '340' <> '' AND code = '340')
     OR lower(name) = lower('Ahmed Yhia Ismail Abd Alhmid')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '348' <> '' AND code = '348')
     OR lower(name) = lower('Ahmed Mohammed Mostafa Slim')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '385' <> '' AND code = '385')
     OR lower(name) = lower('Krim Mohamed Ali Mahmwd')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '387' <> '' AND code = '387')
     OR lower(name) = lower('Osama Mohammady Mohammed ELE.')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '391' <> '' AND code = '391')
     OR lower(name) = lower('Saoudi Mohamed Issa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '178' <> '' AND code = '178')
     OR lower(name) = lower('Mohammed hassan abo al liel')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '286' <> '' AND code = '286')
     OR lower(name) = lower('Adel Mohammed Sawy')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '339' <> '' AND code = '339')
     OR lower(name) = lower('Karim Adel Adly')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '89' <> '' AND code = '89')
     OR lower(name) = lower('Ahmed Mohammed El Sahaty')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '181' <> '' AND code = '181')
     OR lower(name) = lower('Ibrahim khaled abd el aty')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '145' <> '' AND code = '145')
     OR lower(name) = lower('Fares Amer Ismael')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '174' <> '' AND code = '174')
     OR lower(name) = lower('Badr ayman mohammed al sid')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '266' <> '' AND code = '266')
     OR lower(name) = lower('Ahmed Abd El Rahim')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '361' <> '' AND code = '361')
     OR lower(name) = lower('Abd el Rahman mostafa mohammed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '388' <> '' AND code = '388')
     OR lower(name) = lower('Hassan Atef Ahmd ali')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Zaki Gamal Zaki')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '59' <> '' AND code = '59')
     OR lower(name) = lower('Abd el nabi Mehanni')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '325' <> '' AND code = '325')
     OR lower(name) = lower('Anwar Magdy Mahmoud Mohamed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '146' <> '' AND code = '146')
     OR lower(name) = lower('Mohammed Frg Abdelalim')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '375' <> '' AND code = '375')
     OR lower(name) = lower('Mohamed Gmal Abd Alaziz Gafr')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '363' <> '' AND code = '363')
     OR lower(name) = lower('Amer hany Amer')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '251' <> '' AND code = '251')
     OR lower(name) = lower('Radwan Mohamed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '295' <> '' AND code = '295')
     OR lower(name) = lower('Alaa Ali Mohamed Ali Almsry')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '347' <> '' AND code = '347')
     OR lower(name) = lower('Omar Sabry Mostafa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '283' <> '' AND code = '283')
     OR lower(name) = lower('Ahmed Wageh Abd El Alim')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '174' <> '' AND code = '174')
     OR lower(name) = lower('Bssam El Bdry')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '96' <> '' AND code = '96')
     OR lower(name) = lower('Khaled Ashraf Aly Khaled')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '195' <> '' AND code = '195')
     OR lower(name) = lower('Ibrahim hasan abd El Alim sid')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Karim Said')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '245' <> '' AND code = '245')
     OR lower(name) = lower('Mustafa mohammed saad abo gali')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '300' <> '' AND code = '300')
     OR lower(name) = lower('Omar Samy Abd El Hady Hlal')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '340' <> '' AND code = '340')
     OR lower(name) = lower('Ahmed Yhia Ismail Abd Alhmid')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '348' <> '' AND code = '348')
     OR lower(name) = lower('Ahmed Mohammed Mostafa Slim')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '385' <> '' AND code = '385')
     OR lower(name) = lower('Krim Mohamed Ali Mahmwd')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '387' <> '' AND code = '387')
     OR lower(name) = lower('Osama Mohammady Mohammed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '391' <> '' AND code = '391')
     OR lower(name) = lower('Saoudi Mohamed Issa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '178' <> '' AND code = '178')
     OR lower(name) = lower('Mohammed hassan abo al liel')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '286' <> '' AND code = '286')
     OR lower(name) = lower('Adel Mohammed Sawy')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '339' <> '' AND code = '339')
     OR lower(name) = lower('Karim Adel Adly')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '89' <> '' AND code = '89')
     OR lower(name) = lower('Ahmed Mohammed El Sahaty')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '181' <> '' AND code = '181')
     OR lower(name) = lower('Ibrahim khaled abd el aty')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '145' <> '' AND code = '145')
     OR lower(name) = lower('Fares Amer Ismael')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '174' <> '' AND code = '174')
     OR lower(name) = lower('Badr ayman mohammed al sid')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '266' <> '' AND code = '266')
     OR lower(name) = lower('Ahmed Abd El Rahim')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '361' <> '' AND code = '361')
     OR lower(name) = lower('Abd el Rahman mostafa mohammed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '388' <> '' AND code = '388')
     OR lower(name) = lower('Hassan Atef Ahmd ali')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Zaki Gamal Zaki')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '59' <> '' AND code = '59')
     OR lower(name) = lower('Abd el nabi Mehanni')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '325' <> '' AND code = '325')
     OR lower(name) = lower('Anwar Magdy Mahmoud Mohamed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '146' <> '' AND code = '146')
     OR lower(name) = lower('Mohammed Frg Abdelalim')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '375' <> '' AND code = '375')
     OR lower(name) = lower('Mohamed Gmal Abd Alaziz Gafr')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '363' <> '' AND code = '363')
     OR lower(name) = lower('Amer hany Amer')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '251' <> '' AND code = '251')
     OR lower(name) = lower('Radwan Mohamed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '295' <> '' AND code = '295')
     OR lower(name) = lower('Alaa Ali Mohamed Ali Almsry')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '347' <> '' AND code = '347')
     OR lower(name) = lower('Omar Sabry Mostafa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Abdel Menem Yassine')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '288' <> '' AND code = '288')
     OR lower(name) = lower('Ahmed Maher Fahmy')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '248' <> '' AND code = '248')
     OR lower(name) = lower('Alaa el Hennawy')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Mohamed Atef Mohamed Zidan')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('إبراهيم عطا إبراهيم خليل')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('أحمد حمام كامل الأمير')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '346' <> '' AND code = '346')
     OR lower(name) = lower('Mohammed Mamdouh Hassan Ali')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '287' <> '' AND code = '287')
     OR lower(name) = lower('Mohammed Abd El Razek Fahmy الشباسي')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '324' <> '' AND code = '324')
     OR lower(name) = lower('Galal Abd El Aty Sadek')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Omar Magdi')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '91' <> '' AND code = '91')
     OR lower(name) = lower('Ahmed Mohammed Shehata abd alglil')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '151' <> '' AND code = '151')
     OR lower(name) = lower('Mostafa Amir Ahmed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '331' <> '' AND code = '331')
     OR lower(name) = lower('Mahmoud Khaled Ahmed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '373' <> '' AND code = '373')
     OR lower(name) = lower('Mohamed Mohsn Barkat Moamed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '212' <> '' AND code = '212')
     OR lower(name) = lower('Mohammed ali hasan Ibrahim El lbani')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '210' <> '' AND code = '210')
     OR lower(name) = lower('Ali Ayman Ali')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '294' <> '' AND code = '294')
     OR lower(name) = lower('Mohamed Nasser Mahmoud')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('حامد السيد إبراهيم الخواجة')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('رجب عبد البديع')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '284' <> '' AND code = '284')
     OR lower(name) = lower('Ahmed Rateb Mahmoud')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '91' <> '' AND code = '91')
     OR lower(name) = lower('Ahmed Mohammed Shehata abd alglil')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '151' <> '' AND code = '151')
     OR lower(name) = lower('Mostafa Amir Ahmed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '331' <> '' AND code = '331')
     OR lower(name) = lower('Mahmoud Khaled Ahmed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '373' <> '' AND code = '373')
     OR lower(name) = lower('Mohamed Mohsn Barkat Moamed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '212' <> '' AND code = '212')
     OR lower(name) = lower('Mohammed ali hasan Ibrahim El lbani')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '210' <> '' AND code = '210')
     OR lower(name) = lower('Ali Ayman Ali')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '294' <> '' AND code = '294')
     OR lower(name) = lower('Mohamed Nasser Mahmoud')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('حامد السيد إبراهيم الخواجة')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('رجب عبد البديع')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '284' <> '' AND code = '284')
     OR lower(name) = lower('Ahmed Rateb Mahmoud')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Tarek Shawkat')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '41' <> '' AND code = '41')
     OR lower(name) = lower('Osama ShahIn')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '398' <> '' AND code = '398')
     OR lower(name) = lower('Mhmwd Mohamed Abd Altif Mohamed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '384' <> '' AND code = '384')
     OR lower(name) = lower('Akram Mohammed Abd Al-Alim')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '383' <> '' AND code = '383')
     OR lower(name) = lower('Mahmoud Mostafa Abd al kader')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '341' <> '' AND code = '341')
     OR lower(name) = lower('Ahmed Kamel Abd El Razek')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '315' <> '' AND code = '315')
     OR lower(name) = lower('Mostafa Ali Ahmed Rabee''')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '267' <> '' AND code = '267')
     OR lower(name) = lower('Amr Ahmed gouda Mhmwd Aldwi')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Basem Abd Al Daim Mohamed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Eslam Said Abd Alrazek Mostfa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Mohamed Al Sid Ahmed Al Sid')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '333' <> '' AND code = '333')
     OR lower(name) = lower('Abdulkhaliq Gharib Abdulkhaliq Muhammad')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '230' <> '' AND code = '230')
     OR lower(name) = lower('Ahmed Shaaban Ahmed Morsy')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('أحمد أشرف محمد فرج جاد')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('محمود عادل')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Ahmed Youssef')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '41' <> '' AND code = '41')
     OR lower(name) = lower('Osama ShahIn')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '241' <> '' AND code = '241')
     OR lower(name) = lower('Sherif Sayed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Nabil Abd El Aal')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '231' <> '' AND code = '231')
     OR lower(name) = lower('EL Sayed Amer')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Tamer Safwat')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '41' <> '' AND code = '41')
     OR lower(name) = lower('Osama ShahIn')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '122' <> '' AND code = '122')
     OR lower(name) = lower('Wael said mahmoud Daha')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '213' <> '' AND code = '213')
     OR lower(name) = lower('Abd El Rahman Saad')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '335' <> '' AND code = '335')
     OR lower(name) = lower('Omar Nabil Abd El Aal')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '231' <> '' AND code = '231')
     OR lower(name) = lower('EL Sayed Amer')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Ahmed Ashraf Al-Tigani')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '41' <> '' AND code = '41')
     OR lower(name) = lower('Osama ShahIn')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Abdel Menem Yassine')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '247' <> '' AND code = '247')
     OR lower(name) = lower('Mina Nabil')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '293' <> '' AND code = '293')
     OR lower(name) = lower('Mohammed Gamal Zaki')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Mohamed Nasef Roshdy')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Zaho')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '152' <> '' AND code = '152')
     OR lower(name) = lower('Ibrahim Gomaa Ibrahim Abd Alrhman')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '217' <> '' AND code = '217')
     OR lower(name) = lower('Mokhtar Qodb Krim Gmaa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '249' <> '' AND code = '249')
     OR lower(name) = lower('Ali Khalifa Nazeef')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Zaho')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '152' <> '' AND code = '152')
     OR lower(name) = lower('Ibrahim Gomaa Ibrahim Abd Alrhman')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '217' <> '' AND code = '217')
     OR lower(name) = lower('Mokhtar Qodb Krim Gmaa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '249' <> '' AND code = '249')
     OR lower(name) = lower('Ali Khalifa Nazeef')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '224' <> '' AND code = '224')
     OR lower(name) = lower('Nagy Neseim')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Ahmed Emad')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
     OR lower(name) = lower('Pola Morris')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '55' <> '' AND code = '55')
     OR lower(name) = lower('Mostafa Adel')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Shady El-Kordy')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '109' <> '' AND code = '109')
     OR lower(name) = lower('El-Sayed Mohamed Ali')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Mohamed Alaa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
     OR lower(name) = lower('Pola Morris')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '55' <> '' AND code = '55')
     OR lower(name) = lower('Mostafa Adel')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Shady El-Kordy')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '109' <> '' AND code = '109')
     OR lower(name) = lower('El-Sayed Mohamed Ali')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '135' <> '' AND code = '135')
     OR lower(name) = lower('Mohamed Alaa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
     OR lower(name) = lower('Pola Morris')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '90' <> '' AND code = '90')
     OR lower(name) = lower('Mohamed Shaaban')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '25' <> '' AND code = '25')
     OR lower(name) = lower('Abdel Rahman Azab')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '108' <> '' AND code = '108')
     OR lower(name) = lower('Abdel Razek Mohamed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '249' <> '' AND code = '249')
     OR lower(name) = lower('Ali Khalifa Nazeef')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Naser Gomaa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Kamal Abdel Hameed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
     OR lower(name) = lower('Pola Morris')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '90' <> '' AND code = '90')
     OR lower(name) = lower('Mohamed Shaaban')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '25' <> '' AND code = '25')
     OR lower(name) = lower('Abdel Rahman Azab')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '108' <> '' AND code = '108')
     OR lower(name) = lower('Abdel Razek Mohamed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '249' <> '' AND code = '249')
     OR lower(name) = lower('Ali Khalifa Nazeef')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Naser Gomaa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Kamal Abdel Hameed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
     OR lower(name) = lower('Pola Morris')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '90' <> '' AND code = '90')
     OR lower(name) = lower('Mohamed Shaaban')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '25' <> '' AND code = '25')
     OR lower(name) = lower('Abdel Rahman Azab')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '108' <> '' AND code = '108')
     OR lower(name) = lower('Abdel Razek Mohamed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '249' <> '' AND code = '249')
     OR lower(name) = lower('Ali Khalifa Nazeef')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Naser Gomaa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Kamal Abdel Hameed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
     OR lower(name) = lower('Pola Morris')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Zaho')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '152' <> '' AND code = '152')
     OR lower(name) = lower('Ibrahim Gomaa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '249' <> '' AND code = '249')
     OR lower(name) = lower('Ali Khalifa Nazeef')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '217' <> '' AND code = '217')
     OR lower(name) = lower('Mokhtar Kotb')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '344' <> '' AND code = '344')
     OR lower(name) = lower('Mohamed El-Bakry')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
     OR lower(name) = lower('Pola Morris')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Eng. Tamer')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '152' <> '' AND code = '152')
     OR lower(name) = lower('Ibrahim Gomaa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '249' <> '' AND code = '249')
     OR lower(name) = lower('Ali Khalifa Nazeef')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '217' <> '' AND code = '217')
     OR lower(name) = lower('Mokhtar Kotb')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '344' <> '' AND code = '344')
     OR lower(name) = lower('Mohamed El-Bakry')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
     OR lower(name) = lower('Pola Morris')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '152' <> '' AND code = '152')
     OR lower(name) = lower('Ibrahim Gomaa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '249' <> '' AND code = '249')
     OR lower(name) = lower('Ali Khalifa Nazeef')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '217' <> '' AND code = '217')
     OR lower(name) = lower('Mokhtar Kotb')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '344' <> '' AND code = '344')
     OR lower(name) = lower('Mohamed El-Bakry')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
     OR lower(name) = lower('Pola Morris')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('Mohamed Hosny')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '152' <> '' AND code = '152')
     OR lower(name) = lower('Ibrahim Gomaa')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '249' <> '' AND code = '249')
     OR lower(name) = lower('Ali Khalifa Nazeef')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '217' <> '' AND code = '217')
     OR lower(name) = lower('Mokhtar Kotb')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '344' <> '' AND code = '344')
     OR lower(name) = lower('Mohamed El-Bakry')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '226' <> '' AND code = '226')
     OR lower(name) = lower('Pola Morris')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '' <> '' AND code = '')
     OR lower(name) = lower('العميد جمال سالم')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '19' <> '' AND code = '19')
     OR lower(name) = lower('Mostafa Omar')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '67' <> '' AND code = '67')
     OR lower(name) = lower('Mawhoub Mahmoud Ahmed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '13' <> '' AND code = '13')
     OR lower(name) = lower('Salah Azzazi Abd el fattah')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '67' <> '' AND code = '67')
     OR lower(name) = lower('Mawhoub Mahmoud Ahmed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '13' <> '' AND code = '13')
     OR lower(name) = lower('Salah Azzazi Abd el fattah')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '67' <> '' AND code = '67')
     OR lower(name) = lower('Mawhoub Mahmoud Ahmed')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '13' <> '' AND code = '13')
     OR lower(name) = lower('Salah Azzazi Abd el fattah')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Project Manager' <> '' AND code = 'Project Manager')
     OR lower(name) = lower('184')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Site Engeneer' <> '' AND code = 'Site Engeneer')
     OR lower(name) = lower('138')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Site Engeneer' <> '' AND code = 'Site Engeneer')
     OR lower(name) = lower('400/1000')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Technical Office Manager' <> '' AND code = 'Technical Office Manager')
     OR lower(name) = lower('57')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Planning Section Head' <> '' AND code = 'Planning Section Head')
     OR lower(name) = lower('329')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Mechanical Section Head' <> '' AND code = 'Mechanical Section Head')
     OR lower(name) = lower('226')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Electrical Section Head' <> '' AND code = 'Electrical Section Head')
     OR lower(name) = lower('25')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Team Leader DC' <> '' AND code = 'Team Leader DC')
     OR lower(name) = lower('56')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Senior Document Control' <> '' AND code = 'Senior Document Control')
     OR lower(name) = lower('205')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Senior Civil Technical Office' <> '' AND code = 'Senior Civil Technical Office')
     OR lower(name) = lower('179')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Civil Technical Office' <> '' AND code = 'Civil Technical Office')
     OR lower(name) = lower('229')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Senior Technical Office' <> '' AND code = 'Senior Technical Office')
     OR lower(name) = lower('93')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Electrical Technical Office' <> '' AND code = 'Electrical Technical Office')
     OR lower(name) = lower('94')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Electrical Technical Office' <> '' AND code = 'Electrical Technical Office')
     OR lower(name) = lower('358')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Mechanical Technical Office' <> '' AND code = 'Mechanical Technical Office')
     OR lower(name) = lower('302')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Mechanical Technical Office' <> '' AND code = 'Mechanical Technical Office')
     OR lower(name) = lower('299')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Civil Supervisor' <> '' AND code = 'Civil Supervisor')
     OR lower(name) = lower('403/1003')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Civil Supervisor' <> '' AND code = 'Civil Supervisor')
     OR lower(name) = lower('249')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Technical Supervisor' <> '' AND code = 'Technical Supervisor')
     OR lower(name) = lower('1')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Surveyor' <> '' AND code = 'Surveyor')
     OR lower(name) = lower('210')
);


INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND 'Technical Supervisor' <> '' AND code = 'Technical Supervisor')
     OR lower(name) = lower('123')
);


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Senior Project Manager', ''), 'عضو فريق'),
  'accountable',
  'client',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Hesham El Seifi')
  OR lower(s.name_ar) = lower('Hesham El Seifi')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'contractor',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Evram Rafat')
  OR lower(s.name_ar) = lower('Evram Rafat')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil project manger', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '283' <> '' AND s.code = '283')
  OR lower(s.name) = lower('Ahmed Wageh Abd El Alim')
  OR lower(s.name_ar) = lower('Ahmed Wageh Abd El Alim')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '79' <> '' AND s.code = '79')
  OR lower(s.name) = lower('Bssam el bdry')
  OR lower(s.name_ar) = lower('Bssam el bdry')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '96' <> '' AND s.code = '96')
  OR lower(s.name) = lower('Khaled Ashraf Aly Khaled')
  OR lower(s.name_ar) = lower('Khaled Ashraf Aly Khaled')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '195' <> '' AND s.code = '195')
  OR lower(s.name) = lower('Ibrahim hasan abd El Alim sid')
  OR lower(s.name_ar) = lower('Ibrahim hasan abd El Alim sid')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '245' <> '' AND s.code = '245')
  OR lower(s.name) = lower('Mustafa mohammed saad abo gali')
  OR lower(s.name_ar) = lower('Mustafa mohammed saad abo gali')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '300' <> '' AND s.code = '300')
  OR lower(s.name) = lower('Omar Samy Abd El Hady Hlal')
  OR lower(s.name_ar) = lower('Omar Samy Abd El Hady Hlal')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '340' <> '' AND s.code = '340')
  OR lower(s.name) = lower('Ahmed Yhia Ismail Abd Alhmid')
  OR lower(s.name_ar) = lower('Ahmed Yhia Ismail Abd Alhmid')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '348' <> '' AND s.code = '348')
  OR lower(s.name) = lower('Ahmed Mohammed Mostafa Slim')
  OR lower(s.name_ar) = lower('Ahmed Mohammed Mostafa Slim')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '385' <> '' AND s.code = '385')
  OR lower(s.name) = lower('Karim mohamed Ali Mahmoud Mohamed')
  OR lower(s.name_ar) = lower('Karim mohamed Ali Mahmoud Mohamed')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '387' <> '' AND s.code = '387')
  OR lower(s.name) = lower('Osama Mohammady Mohammed ELE.')
  OR lower(s.name_ar) = lower('Osama Mohammady Mohammed ELE.')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '391' <> '' AND s.code = '391')
  OR lower(s.name) = lower('Saoudi Mohamed Issa')
  OR lower(s.name_ar) = lower('Saoudi Mohamed Issa')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '178' <> '' AND s.code = '178')
  OR lower(s.name) = lower('Mohammed hassan abo al liel')
  OR lower(s.name_ar) = lower('Mohammed hassan abo al liel')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '286' <> '' AND s.code = '286')
  OR lower(s.name) = lower('Adel Mohammed Sawy')
  OR lower(s.name_ar) = lower('Adel Mohammed Sawy')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '339' <> '' AND s.code = '339')
  OR lower(s.name) = lower('Karim Adel Adly')
  OR lower(s.name_ar) = lower('Karim Adel Adly')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '89' <> '' AND s.code = '89')
  OR lower(s.name) = lower('Ahmed Mohammed El Sahaty')
  OR lower(s.name_ar) = lower('Ahmed Mohammed El Sahaty')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '181' <> '' AND s.code = '181')
  OR lower(s.name) = lower('Ibrahim khaled abd el aty')
  OR lower(s.name_ar) = lower('Ibrahim khaled abd el aty')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '145' <> '' AND s.code = '145')
  OR lower(s.name) = lower('Fares Amer Ismael')
  OR lower(s.name_ar) = lower('Fares Amer Ismael')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '174' <> '' AND s.code = '174')
  OR lower(s.name) = lower('Badr ayman mohammed al sid')
  OR lower(s.name_ar) = lower('Badr ayman mohammed al sid')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '266' <> '' AND s.code = '266')
  OR lower(s.name) = lower('Ahmed Abd El Rahim')
  OR lower(s.name_ar) = lower('Ahmed Abd El Rahim')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '361' <> '' AND s.code = '361')
  OR lower(s.name) = lower('Abd el Rahman mostafa mohammed')
  OR lower(s.name_ar) = lower('Abd el Rahman mostafa mohammed')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '388' <> '' AND s.code = '388')
  OR lower(s.name) = lower('Hassan Atef Ahmd ali')
  OR lower(s.name_ar) = lower('Hassan Atef Ahmd ali')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Zaki Gamal Zaki')
  OR lower(s.name_ar) = lower('Zaki Gamal Zaki')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '59' <> '' AND s.code = '59')
  OR lower(s.name) = lower('Abd el nabi Mehanni')
  OR lower(s.name_ar) = lower('Abd el nabi Mehanni')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '325' <> '' AND s.code = '325')
  OR lower(s.name) = lower('Anwar Magdy Mahmoud Mohamed')
  OR lower(s.name_ar) = lower('Anwar Magdy Mahmoud Mohamed')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '146' <> '' AND s.code = '146')
  OR lower(s.name) = lower('Mohammed Frg Abdelalim')
  OR lower(s.name_ar) = lower('Mohammed Frg Abdelalim')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '375' <> '' AND s.code = '375')
  OR lower(s.name) = lower('Mohamed Gmal Abd Alaziz Gafr')
  OR lower(s.name_ar) = lower('Mohamed Gmal Abd Alaziz Gafr')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '363' <> '' AND s.code = '363')
  OR lower(s.name) = lower('Amer hany Amer')
  OR lower(s.name_ar) = lower('Amer hany Amer')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('DC', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '251' <> '' AND s.code = '251')
  OR lower(s.name) = lower('Radwan Mohamed')
  OR lower(s.name_ar) = lower('Radwan Mohamed')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('أمين مخزن', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '295' <> '' AND s.code = '295')
  OR lower(s.name) = lower('Alaa Ali Mohamed Ali Almsry')
  OR lower(s.name_ar) = lower('Alaa Ali Mohamed Ali Almsry')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('محاسب', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '347' <> '' AND s.code = '347')
  OR lower(s.name) = lower('Omar Sabry Mostafa')
  OR lower(s.name_ar) = lower('Omar Sabry Mostafa')
)
WHERE p.project_code = '2401'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'contractor',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Mina George')
  OR lower(s.name_ar) = lower('Mina George')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil project manger', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '283' <> '' AND s.code = '283')
  OR lower(s.name) = lower('Ahmed Wageh Abd El Alim')
  OR lower(s.name_ar) = lower('Ahmed Wageh Abd El Alim')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '79' <> '' AND s.code = '79')
  OR lower(s.name) = lower('Bssam el bdry')
  OR lower(s.name_ar) = lower('Bssam el bdry')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '96' <> '' AND s.code = '96')
  OR lower(s.name) = lower('Khaled Ashraf Aly Khaled')
  OR lower(s.name_ar) = lower('Khaled Ashraf Aly Khaled')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '195' <> '' AND s.code = '195')
  OR lower(s.name) = lower('Ibrahim hasan abd El Alim sid')
  OR lower(s.name_ar) = lower('Ibrahim hasan abd El Alim sid')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '245' <> '' AND s.code = '245')
  OR lower(s.name) = lower('Mustafa mohammed saad abo gali')
  OR lower(s.name_ar) = lower('Mustafa mohammed saad abo gali')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '300' <> '' AND s.code = '300')
  OR lower(s.name) = lower('Omar Samy Abd El Hady Hlal')
  OR lower(s.name_ar) = lower('Omar Samy Abd El Hady Hlal')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '340' <> '' AND s.code = '340')
  OR lower(s.name) = lower('Ahmed Yhia Ismail Abd Alhmid')
  OR lower(s.name_ar) = lower('Ahmed Yhia Ismail Abd Alhmid')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '348' <> '' AND s.code = '348')
  OR lower(s.name) = lower('Ahmed Mohammed Mostafa Slim')
  OR lower(s.name_ar) = lower('Ahmed Mohammed Mostafa Slim')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '385' <> '' AND s.code = '385')
  OR lower(s.name) = lower('Krim Mohamed Ali Mahmwd')
  OR lower(s.name_ar) = lower('Krim Mohamed Ali Mahmwd')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '387' <> '' AND s.code = '387')
  OR lower(s.name) = lower('Osama Mohammady Mohammed ELE.')
  OR lower(s.name_ar) = lower('Osama Mohammady Mohammed ELE.')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '391' <> '' AND s.code = '391')
  OR lower(s.name) = lower('Saoudi Mohamed Issa')
  OR lower(s.name_ar) = lower('Saoudi Mohamed Issa')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '178' <> '' AND s.code = '178')
  OR lower(s.name) = lower('Mohammed hassan abo al liel')
  OR lower(s.name_ar) = lower('Mohammed hassan abo al liel')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '286' <> '' AND s.code = '286')
  OR lower(s.name) = lower('Adel Mohammed Sawy')
  OR lower(s.name_ar) = lower('Adel Mohammed Sawy')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '339' <> '' AND s.code = '339')
  OR lower(s.name) = lower('Karim Adel Adly')
  OR lower(s.name_ar) = lower('Karim Adel Adly')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '89' <> '' AND s.code = '89')
  OR lower(s.name) = lower('Ahmed Mohammed El Sahaty')
  OR lower(s.name_ar) = lower('Ahmed Mohammed El Sahaty')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '181' <> '' AND s.code = '181')
  OR lower(s.name) = lower('Ibrahim khaled abd el aty')
  OR lower(s.name_ar) = lower('Ibrahim khaled abd el aty')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '145' <> '' AND s.code = '145')
  OR lower(s.name) = lower('Fares Amer Ismael')
  OR lower(s.name_ar) = lower('Fares Amer Ismael')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '174' <> '' AND s.code = '174')
  OR lower(s.name) = lower('Badr ayman mohammed al sid')
  OR lower(s.name_ar) = lower('Badr ayman mohammed al sid')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '266' <> '' AND s.code = '266')
  OR lower(s.name) = lower('Ahmed Abd El Rahim')
  OR lower(s.name_ar) = lower('Ahmed Abd El Rahim')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '361' <> '' AND s.code = '361')
  OR lower(s.name) = lower('Abd el Rahman mostafa mohammed')
  OR lower(s.name_ar) = lower('Abd el Rahman mostafa mohammed')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '388' <> '' AND s.code = '388')
  OR lower(s.name) = lower('Hassan Atef Ahmd ali')
  OR lower(s.name_ar) = lower('Hassan Atef Ahmd ali')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Zaki Gamal Zaki')
  OR lower(s.name_ar) = lower('Zaki Gamal Zaki')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '59' <> '' AND s.code = '59')
  OR lower(s.name) = lower('Abd el nabi Mehanni')
  OR lower(s.name_ar) = lower('Abd el nabi Mehanni')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '325' <> '' AND s.code = '325')
  OR lower(s.name) = lower('Anwar Magdy Mahmoud Mohamed')
  OR lower(s.name_ar) = lower('Anwar Magdy Mahmoud Mohamed')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '146' <> '' AND s.code = '146')
  OR lower(s.name) = lower('Mohammed Frg Abdelalim')
  OR lower(s.name_ar) = lower('Mohammed Frg Abdelalim')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '375' <> '' AND s.code = '375')
  OR lower(s.name) = lower('Mohamed Gmal Abd Alaziz Gafr')
  OR lower(s.name_ar) = lower('Mohamed Gmal Abd Alaziz Gafr')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '363' <> '' AND s.code = '363')
  OR lower(s.name) = lower('Amer hany Amer')
  OR lower(s.name_ar) = lower('Amer hany Amer')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('DC', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '251' <> '' AND s.code = '251')
  OR lower(s.name) = lower('Radwan Mohamed')
  OR lower(s.name_ar) = lower('Radwan Mohamed')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('أمين مخزن', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '295' <> '' AND s.code = '295')
  OR lower(s.name) = lower('Alaa Ali Mohamed Ali Almsry')
  OR lower(s.name_ar) = lower('Alaa Ali Mohamed Ali Almsry')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('محاسب', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '347' <> '' AND s.code = '347')
  OR lower(s.name) = lower('Omar Sabry Mostafa')
  OR lower(s.name_ar) = lower('Omar Sabry Mostafa')
)
WHERE p.project_code = '2402'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil project manger', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '283' <> '' AND s.code = '283')
  OR lower(s.name) = lower('Ahmed Wageh Abd El Alim')
  OR lower(s.name_ar) = lower('Ahmed Wageh Abd El Alim')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '174' <> '' AND s.code = '174')
  OR lower(s.name) = lower('Bssam El Bdry')
  OR lower(s.name_ar) = lower('Bssam El Bdry')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '96' <> '' AND s.code = '96')
  OR lower(s.name) = lower('Khaled Ashraf Aly Khaled')
  OR lower(s.name_ar) = lower('Khaled Ashraf Aly Khaled')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil site eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '195' <> '' AND s.code = '195')
  OR lower(s.name) = lower('Ibrahim hasan abd El Alim sid')
  OR lower(s.name_ar) = lower('Ibrahim hasan abd El Alim sid')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'contractor',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Karim Said')
  OR lower(s.name_ar) = lower('Karim Said')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '245' <> '' AND s.code = '245')
  OR lower(s.name) = lower('Mustafa mohammed saad abo gali')
  OR lower(s.name_ar) = lower('Mustafa mohammed saad abo gali')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '300' <> '' AND s.code = '300')
  OR lower(s.name) = lower('Omar Samy Abd El Hady Hlal')
  OR lower(s.name_ar) = lower('Omar Samy Abd El Hady Hlal')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '340' <> '' AND s.code = '340')
  OR lower(s.name) = lower('Ahmed Yhia Ismail Abd Alhmid')
  OR lower(s.name_ar) = lower('Ahmed Yhia Ismail Abd Alhmid')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '348' <> '' AND s.code = '348')
  OR lower(s.name) = lower('Ahmed Mohammed Mostafa Slim')
  OR lower(s.name_ar) = lower('Ahmed Mohammed Mostafa Slim')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '385' <> '' AND s.code = '385')
  OR lower(s.name) = lower('Krim Mohamed Ali Mahmwd')
  OR lower(s.name_ar) = lower('Krim Mohamed Ali Mahmwd')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '387' <> '' AND s.code = '387')
  OR lower(s.name) = lower('Osama Mohammady Mohammed')
  OR lower(s.name_ar) = lower('Osama Mohammady Mohammed')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '391' <> '' AND s.code = '391')
  OR lower(s.name) = lower('Saoudi Mohamed Issa')
  OR lower(s.name_ar) = lower('Saoudi Mohamed Issa')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '178' <> '' AND s.code = '178')
  OR lower(s.name) = lower('Mohammed hassan abo al liel')
  OR lower(s.name_ar) = lower('Mohammed hassan abo al liel')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '286' <> '' AND s.code = '286')
  OR lower(s.name) = lower('Adel Mohammed Sawy')
  OR lower(s.name_ar) = lower('Adel Mohammed Sawy')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '339' <> '' AND s.code = '339')
  OR lower(s.name) = lower('Karim Adel Adly')
  OR lower(s.name_ar) = lower('Karim Adel Adly')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '89' <> '' AND s.code = '89')
  OR lower(s.name) = lower('Ahmed Mohammed El Sahaty')
  OR lower(s.name_ar) = lower('Ahmed Mohammed El Sahaty')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '181' <> '' AND s.code = '181')
  OR lower(s.name) = lower('Ibrahim khaled abd el aty')
  OR lower(s.name_ar) = lower('Ibrahim khaled abd el aty')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '145' <> '' AND s.code = '145')
  OR lower(s.name) = lower('Fares Amer Ismael')
  OR lower(s.name_ar) = lower('Fares Amer Ismael')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '174' <> '' AND s.code = '174')
  OR lower(s.name) = lower('Badr ayman mohammed al sid')
  OR lower(s.name_ar) = lower('Badr ayman mohammed al sid')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '266' <> '' AND s.code = '266')
  OR lower(s.name) = lower('Ahmed Abd El Rahim')
  OR lower(s.name_ar) = lower('Ahmed Abd El Rahim')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '361' <> '' AND s.code = '361')
  OR lower(s.name) = lower('Abd el Rahman mostafa mohammed')
  OR lower(s.name_ar) = lower('Abd el Rahman mostafa mohammed')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '388' <> '' AND s.code = '388')
  OR lower(s.name) = lower('Hassan Atef Ahmd ali')
  OR lower(s.name_ar) = lower('Hassan Atef Ahmd ali')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Zaki Gamal Zaki')
  OR lower(s.name_ar) = lower('Zaki Gamal Zaki')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '59' <> '' AND s.code = '59')
  OR lower(s.name) = lower('Abd el nabi Mehanni')
  OR lower(s.name_ar) = lower('Abd el nabi Mehanni')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '325' <> '' AND s.code = '325')
  OR lower(s.name) = lower('Anwar Magdy Mahmoud Mohamed')
  OR lower(s.name_ar) = lower('Anwar Magdy Mahmoud Mohamed')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '146' <> '' AND s.code = '146')
  OR lower(s.name) = lower('Mohammed Frg Abdelalim')
  OR lower(s.name_ar) = lower('Mohammed Frg Abdelalim')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '375' <> '' AND s.code = '375')
  OR lower(s.name) = lower('Mohamed Gmal Abd Alaziz Gafr')
  OR lower(s.name_ar) = lower('Mohamed Gmal Abd Alaziz Gafr')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '363' <> '' AND s.code = '363')
  OR lower(s.name) = lower('Amer hany Amer')
  OR lower(s.name_ar) = lower('Amer hany Amer')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('DC', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '251' <> '' AND s.code = '251')
  OR lower(s.name) = lower('Radwan Mohamed')
  OR lower(s.name_ar) = lower('Radwan Mohamed')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('أمين مخزن', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '295' <> '' AND s.code = '295')
  OR lower(s.name) = lower('Alaa Ali Mohamed Ali Almsry')
  OR lower(s.name_ar) = lower('Alaa Ali Mohamed Ali Almsry')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('محاسب', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '347' <> '' AND s.code = '347')
  OR lower(s.name) = lower('Omar Sabry Mostafa')
  OR lower(s.name_ar) = lower('Omar Sabry Mostafa')
)
WHERE p.project_code = '2403'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'contractor',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Abdel Menem Yassine')
  OR lower(s.name_ar) = lower('Abdel Menem Yassine')
)
WHERE p.project_code = '2511'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '288' <> '' AND s.code = '288')
  OR lower(s.name) = lower('Ahmed Maher Fahmy')
  OR lower(s.name_ar) = lower('Ahmed Maher Fahmy')
)
WHERE p.project_code = '2511'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '248' <> '' AND s.code = '248')
  OR lower(s.name) = lower('Alaa el Hennawy')
  OR lower(s.name_ar) = lower('Alaa el Hennawy')
)
WHERE p.project_code = '2511'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Mohamed Atef Mohamed Zidan')
  OR lower(s.name_ar) = lower('Mohamed Atef Mohamed Zidan')
)
WHERE p.project_code = '2511'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Hotel Security', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('إبراهيم عطا إبراهيم خليل')
  OR lower(s.name_ar) = lower('إبراهيم عطا إبراهيم خليل')
)
WHERE p.project_code = '2511'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Hotel Store Keeper', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('أحمد حمام كامل الأمير')
  OR lower(s.name_ar) = lower('أحمد حمام كامل الأمير')
)
WHERE p.project_code = '2511'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '346' <> '' AND s.code = '346')
  OR lower(s.name) = lower('Mohammed Mamdouh Hassan Ali')
  OR lower(s.name_ar) = lower('Mohammed Mamdouh Hassan Ali')
)
WHERE p.project_code = '2511'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '287' <> '' AND s.code = '287')
  OR lower(s.name) = lower('Mohammed Abd El Razek Fahmy الشباسي')
  OR lower(s.name_ar) = lower('Mohammed Abd El Razek Fahmy الشباسي')
)
WHERE p.project_code = '2511'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '324' <> '' AND s.code = '324')
  OR lower(s.name) = lower('Galal Abd El Aty Sadek')
  OR lower(s.name_ar) = lower('Galal Abd El Aty Sadek')
)
WHERE p.project_code = '2511'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Construction Manager', ''), 'عضو فريق'),
  'accountable',
  'client',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Omar Magdi')
  OR lower(s.name_ar) = lower('Omar Magdi')
)
WHERE p.project_code = '2405'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '91' <> '' AND s.code = '91')
  OR lower(s.name) = lower('Ahmed Mohammed Shehata abd alglil')
  OR lower(s.name_ar) = lower('Ahmed Mohammed Shehata abd alglil')
)
WHERE p.project_code = '2405'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '151' <> '' AND s.code = '151')
  OR lower(s.name) = lower('Mostafa Amir Ahmed')
  OR lower(s.name_ar) = lower('Mostafa Amir Ahmed')
)
WHERE p.project_code = '2405'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '331' <> '' AND s.code = '331')
  OR lower(s.name) = lower('Mahmoud Khaled Ahmed')
  OR lower(s.name_ar) = lower('Mahmoud Khaled Ahmed')
)
WHERE p.project_code = '2405'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '373' <> '' AND s.code = '373')
  OR lower(s.name) = lower('Mohamed Mohsn Barkat Moamed')
  OR lower(s.name_ar) = lower('Mohamed Mohsn Barkat Moamed')
)
WHERE p.project_code = '2405'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '212' <> '' AND s.code = '212')
  OR lower(s.name) = lower('Mohammed ali hasan Ibrahim El lbani')
  OR lower(s.name_ar) = lower('Mohammed ali hasan Ibrahim El lbani')
)
WHERE p.project_code = '2405'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '210' <> '' AND s.code = '210')
  OR lower(s.name) = lower('Ali Ayman Ali')
  OR lower(s.name_ar) = lower('Ali Ayman Ali')
)
WHERE p.project_code = '2405'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('DC', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '294' <> '' AND s.code = '294')
  OR lower(s.name) = lower('Mohamed Nasser Mahmoud')
  OR lower(s.name_ar) = lower('Mohamed Nasser Mahmoud')
)
WHERE p.project_code = '2405'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('حامد السيد إبراهيم الخواجة')
  OR lower(s.name_ar) = lower('حامد السيد إبراهيم الخواجة')
)
WHERE p.project_code = '2405'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('رجب عبد البديع')
  OR lower(s.name_ar) = lower('رجب عبد البديع')
)
WHERE p.project_code = '2405'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Accountant', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '284' <> '' AND s.code = '284')
  OR lower(s.name) = lower('Ahmed Rateb Mahmoud')
  OR lower(s.name_ar) = lower('Ahmed Rateb Mahmoud')
)
WHERE p.project_code = '2405'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '91' <> '' AND s.code = '91')
  OR lower(s.name) = lower('Ahmed Mohammed Shehata abd alglil')
  OR lower(s.name_ar) = lower('Ahmed Mohammed Shehata abd alglil')
)
WHERE p.project_code = '2419'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '151' <> '' AND s.code = '151')
  OR lower(s.name) = lower('Mostafa Amir Ahmed')
  OR lower(s.name_ar) = lower('Mostafa Amir Ahmed')
)
WHERE p.project_code = '2419'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '331' <> '' AND s.code = '331')
  OR lower(s.name) = lower('Mahmoud Khaled Ahmed')
  OR lower(s.name_ar) = lower('Mahmoud Khaled Ahmed')
)
WHERE p.project_code = '2419'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Electrical Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '373' <> '' AND s.code = '373')
  OR lower(s.name) = lower('Mohamed Mohsn Barkat Moamed')
  OR lower(s.name_ar) = lower('Mohamed Mohsn Barkat Moamed')
)
WHERE p.project_code = '2419'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '212' <> '' AND s.code = '212')
  OR lower(s.name) = lower('Mohammed ali hasan Ibrahim El lbani')
  OR lower(s.name_ar) = lower('Mohammed ali hasan Ibrahim El lbani')
)
WHERE p.project_code = '2419'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '210' <> '' AND s.code = '210')
  OR lower(s.name) = lower('Ali Ayman Ali')
  OR lower(s.name_ar) = lower('Ali Ayman Ali')
)
WHERE p.project_code = '2419'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('DC', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '294' <> '' AND s.code = '294')
  OR lower(s.name) = lower('Mohamed Nasser Mahmoud')
  OR lower(s.name_ar) = lower('Mohamed Nasser Mahmoud')
)
WHERE p.project_code = '2419'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('حامد السيد إبراهيم الخواجة')
  OR lower(s.name_ar) = lower('حامد السيد إبراهيم الخواجة')
)
WHERE p.project_code = '2419'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('رجب عبد البديع')
  OR lower(s.name_ar) = lower('رجب عبد البديع')
)
WHERE p.project_code = '2419'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Accountant', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '284' <> '' AND s.code = '284')
  OR lower(s.name) = lower('Ahmed Rateb Mahmoud')
  OR lower(s.name_ar) = lower('Ahmed Rateb Mahmoud')
)
WHERE p.project_code = '2419'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'contractor',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Tarek Shawkat')
  OR lower(s.name_ar) = lower('Tarek Shawkat')
)
WHERE p.project_code = '2604'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '41' <> '' AND s.code = '41')
  OR lower(s.name) = lower('Osama ShahIn')
  OR lower(s.name_ar) = lower('Osama ShahIn')
)
WHERE p.project_code = '2604'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '398' <> '' AND s.code = '398')
  OR lower(s.name) = lower('Mhmwd Mohamed Abd Altif Mohamed')
  OR lower(s.name_ar) = lower('Mhmwd Mohamed Abd Altif Mohamed')
)
WHERE p.project_code = '2604'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('civil site Eng', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '384' <> '' AND s.code = '384')
  OR lower(s.name) = lower('Akram Mohammed Abd Al-Alim')
  OR lower(s.name_ar) = lower('Akram Mohammed Abd Al-Alim')
)
WHERE p.project_code = '2604'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Planning Eng ( civil )', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '383' <> '' AND s.code = '383')
  OR lower(s.name) = lower('Mahmoud Mostafa Abd al kader')
  OR lower(s.name_ar) = lower('Mahmoud Mostafa Abd al kader')
)
WHERE p.project_code = '2604'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Safety', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '341' <> '' AND s.code = '341')
  OR lower(s.name) = lower('Ahmed Kamel Abd El Razek')
  OR lower(s.name_ar) = lower('Ahmed Kamel Abd El Razek')
)
WHERE p.project_code = '2604'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Accountant', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '315' <> '' AND s.code = '315')
  OR lower(s.name) = lower('Mostafa Ali Ahmed Rabee''')
  OR lower(s.name_ar) = lower('Mostafa Ali Ahmed Rabee''')
)
WHERE p.project_code = '2604'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '267' <> '' AND s.code = '267')
  OR lower(s.name) = lower('Amr Ahmed gouda Mhmwd Aldwi')
  OR lower(s.name_ar) = lower('Amr Ahmed gouda Mhmwd Aldwi')
)
WHERE p.project_code = '2604'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Basem Abd Al Daim Mohamed')
  OR lower(s.name_ar) = lower('Basem Abd Al Daim Mohamed')
)
WHERE p.project_code = '2604'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyors', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Eslam Said Abd Alrazek Mostfa')
  OR lower(s.name_ar) = lower('Eslam Said Abd Alrazek Mostfa')
)
WHERE p.project_code = '2604'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('DC', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Mohamed Al Sid Ahmed Al Sid')
  OR lower(s.name_ar) = lower('Mohamed Al Sid Ahmed Al Sid')
)
WHERE p.project_code = '2604'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '333' <> '' AND s.code = '333')
  OR lower(s.name) = lower('Abdulkhaliq Gharib Abdulkhaliq Muhammad')
  OR lower(s.name_ar) = lower('Abdulkhaliq Gharib Abdulkhaliq Muhammad')
)
WHERE p.project_code = '2604'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '230' <> '' AND s.code = '230')
  OR lower(s.name) = lower('Ahmed Shaaban Ahmed Morsy')
  OR lower(s.name_ar) = lower('Ahmed Shaaban Ahmed Morsy')
)
WHERE p.project_code = '2604'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('أحمد أشرف محمد فرج جاد')
  OR lower(s.name_ar) = lower('أحمد أشرف محمد فرج جاد')
)
WHERE p.project_code = '2604'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('محمود عادل')
  OR lower(s.name_ar) = lower('محمود عادل')
)
WHERE p.project_code = '2604'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'contractor',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Ahmed Youssef')
  OR lower(s.name_ar) = lower('Ahmed Youssef')
)
WHERE p.project_code = '2421'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '41' <> '' AND s.code = '41')
  OR lower(s.name) = lower('Osama ShahIn')
  OR lower(s.name_ar) = lower('Osama ShahIn')
)
WHERE p.project_code = '2421'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Architecture Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '241' <> '' AND s.code = '241')
  OR lower(s.name) = lower('Sherif Sayed')
  OR lower(s.name_ar) = lower('Sherif Sayed')
)
WHERE p.project_code = '2421'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Nabil Abd El Aal')
  OR lower(s.name_ar) = lower('Nabil Abd El Aal')
)
WHERE p.project_code = '2421'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '231' <> '' AND s.code = '231')
  OR lower(s.name) = lower('EL Sayed Amer')
  OR lower(s.name_ar) = lower('EL Sayed Amer')
)
WHERE p.project_code = '2421'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Projects Director', ''), 'عضو فريق'),
  'accountable',
  'client',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Tamer Safwat')
  OR lower(s.name_ar) = lower('Tamer Safwat')
)
WHERE p.project_code = '2404'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '41' <> '' AND s.code = '41')
  OR lower(s.name) = lower('Osama ShahIn')
  OR lower(s.name_ar) = lower('Osama ShahIn')
)
WHERE p.project_code = '2404'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '122' <> '' AND s.code = '122')
  OR lower(s.name) = lower('Wael said mahmoud Daha')
  OR lower(s.name_ar) = lower('Wael said mahmoud Daha')
)
WHERE p.project_code = '2404'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mech Eng', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '213' <> '' AND s.code = '213')
  OR lower(s.name) = lower('Abd El Rahman Saad')
  OR lower(s.name_ar) = lower('Abd El Rahman Saad')
)
WHERE p.project_code = '2404'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '335' <> '' AND s.code = '335')
  OR lower(s.name) = lower('Omar Nabil Abd El Aal')
  OR lower(s.name_ar) = lower('Omar Nabil Abd El Aal')
)
WHERE p.project_code = '2404'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '231' <> '' AND s.code = '231')
  OR lower(s.name) = lower('EL Sayed Amer')
  OR lower(s.name_ar) = lower('EL Sayed Amer')
)
WHERE p.project_code = '2404'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Ahmed Ashraf Al-Tigani')
  OR lower(s.name_ar) = lower('Ahmed Ashraf Al-Tigani')
)
WHERE p.project_code = '2404'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '41' <> '' AND s.code = '41')
  OR lower(s.name) = lower('Osama ShahIn')
  OR lower(s.name_ar) = lower('Osama ShahIn')
)
WHERE p.project_code = '2512'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'contractor',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Abdel Menem Yassine')
  OR lower(s.name_ar) = lower('Abdel Menem Yassine')
)
WHERE p.project_code = '2412'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Civil Site Eng.', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '247' <> '' AND s.code = '247')
  OR lower(s.name) = lower('Mina Nabil')
  OR lower(s.name_ar) = lower('Mina Nabil')
)
WHERE p.project_code = '2412'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Surveyor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '293' <> '' AND s.code = '293')
  OR lower(s.name) = lower('Mohammed Gamal Zaki')
  OR lower(s.name_ar) = lower('Mohammed Gamal Zaki')
)
WHERE p.project_code = '2412'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Store Keeper', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Mohamed Nasef Roshdy')
  OR lower(s.name_ar) = lower('Mohamed Nasef Roshdy')
)
WHERE p.project_code = '2412'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('MEP Manager', ''), 'عضو فريق'),
  'accountable',
  'contractor',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Zaho')
  OR lower(s.name_ar) = lower('Zaho')
)
WHERE p.project_code = '2308'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '152' <> '' AND s.code = '152')
  OR lower(s.name) = lower('Ibrahim Gomaa Ibrahim Abd Alrhman')
  OR lower(s.name_ar) = lower('Ibrahim Gomaa Ibrahim Abd Alrhman')
)
WHERE p.project_code = '2308'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '217' <> '' AND s.code = '217')
  OR lower(s.name) = lower('Mokhtar Qodb Krim Gmaa')
  OR lower(s.name_ar) = lower('Mokhtar Qodb Krim Gmaa')
)
WHERE p.project_code = '2308'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '249' <> '' AND s.code = '249')
  OR lower(s.name) = lower('Ali Khalifa Nazeef')
  OR lower(s.name_ar) = lower('Ali Khalifa Nazeef')
)
WHERE p.project_code = '2308'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('MEP Manager', ''), 'عضو فريق'),
  'accountable',
  'contractor',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Zaho')
  OR lower(s.name_ar) = lower('Zaho')
)
WHERE p.project_code = '2308'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Site Engeneer', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '152' <> '' AND s.code = '152')
  OR lower(s.name) = lower('Ibrahim Gomaa Ibrahim Abd Alrhman')
  OR lower(s.name_ar) = lower('Ibrahim Gomaa Ibrahim Abd Alrhman')
)
WHERE p.project_code = '2308'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '217' <> '' AND s.code = '217')
  OR lower(s.name) = lower('Mokhtar Qodb Krim Gmaa')
  OR lower(s.name_ar) = lower('Mokhtar Qodb Krim Gmaa')
)
WHERE p.project_code = '2308'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '249' <> '' AND s.code = '249')
  OR lower(s.name) = lower('Ali Khalifa Nazeef')
  OR lower(s.name_ar) = lower('Ali Khalifa Nazeef')
)
WHERE p.project_code = '2308'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '224' <> '' AND s.code = '224')
  OR lower(s.name) = lower('Nagy Neseim')
  OR lower(s.name_ar) = lower('Nagy Neseim')
)
WHERE p.project_code = '2606'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Senior Surveyor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Ahmed Emad')
  OR lower(s.name_ar) = lower('Ahmed Emad')
)
WHERE p.project_code = '2606'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '226' <> '' AND s.code = '226')
  OR lower(s.name) = lower('Pola Morris')
  OR lower(s.name_ar) = lower('Pola Morris')
)
WHERE p.project_code = '2606'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '55' <> '' AND s.code = '55')
  OR lower(s.name) = lower('Mostafa Adel')
  OR lower(s.name_ar) = lower('Mostafa Adel')
)
WHERE p.project_code = '2602'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Construction Manager', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Shady El-Kordy')
  OR lower(s.name_ar) = lower('Shady El-Kordy')
)
WHERE p.project_code = '2602'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '109' <> '' AND s.code = '109')
  OR lower(s.name) = lower('El-Sayed Mohamed Ali')
  OR lower(s.name_ar) = lower('El-Sayed Mohamed Ali')
)
WHERE p.project_code = '2602'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Mohamed Alaa')
  OR lower(s.name_ar) = lower('Mohamed Alaa')
)
WHERE p.project_code = '2602'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '226' <> '' AND s.code = '226')
  OR lower(s.name) = lower('Pola Morris')
  OR lower(s.name_ar) = lower('Pola Morris')
)
WHERE p.project_code = '2602'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '55' <> '' AND s.code = '55')
  OR lower(s.name) = lower('Mostafa Adel')
  OR lower(s.name_ar) = lower('Mostafa Adel')
)
WHERE p.project_code = '2603'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Construction Manager', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Shady El-Kordy')
  OR lower(s.name_ar) = lower('Shady El-Kordy')
)
WHERE p.project_code = '2603'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '109' <> '' AND s.code = '109')
  OR lower(s.name) = lower('El-Sayed Mohamed Ali')
  OR lower(s.name_ar) = lower('El-Sayed Mohamed Ali')
)
WHERE p.project_code = '2603'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '135' <> '' AND s.code = '135')
  OR lower(s.name) = lower('Mohamed Alaa')
  OR lower(s.name_ar) = lower('Mohamed Alaa')
)
WHERE p.project_code = '2603'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '226' <> '' AND s.code = '226')
  OR lower(s.name) = lower('Pola Morris')
  OR lower(s.name_ar) = lower('Pola Morris')
)
WHERE p.project_code = '2603'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '90' <> '' AND s.code = '90')
  OR lower(s.name) = lower('Mohamed Shaaban')
  OR lower(s.name_ar) = lower('Mohamed Shaaban')
)
WHERE p.project_code = '2272'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Construction Manager', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '25' <> '' AND s.code = '25')
  OR lower(s.name) = lower('Abdel Rahman Azab')
  OR lower(s.name_ar) = lower('Abdel Rahman Azab')
)
WHERE p.project_code = '2272'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '108' <> '' AND s.code = '108')
  OR lower(s.name) = lower('Abdel Razek Mohamed')
  OR lower(s.name_ar) = lower('Abdel Razek Mohamed')
)
WHERE p.project_code = '2272'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '249' <> '' AND s.code = '249')
  OR lower(s.name) = lower('Ali Khalifa Nazeef')
  OR lower(s.name_ar) = lower('Ali Khalifa Nazeef')
)
WHERE p.project_code = '2272'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Naser Gomaa')
  OR lower(s.name_ar) = lower('Naser Gomaa')
)
WHERE p.project_code = '2272'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Kamal Abdel Hameed')
  OR lower(s.name_ar) = lower('Kamal Abdel Hameed')
)
WHERE p.project_code = '2272'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '226' <> '' AND s.code = '226')
  OR lower(s.name) = lower('Pola Morris')
  OR lower(s.name_ar) = lower('Pola Morris')
)
WHERE p.project_code = '2272'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '90' <> '' AND s.code = '90')
  OR lower(s.name) = lower('Mohamed Shaaban')
  OR lower(s.name_ar) = lower('Mohamed Shaaban')
)
WHERE p.project_code = '2406'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Construction Manager', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '25' <> '' AND s.code = '25')
  OR lower(s.name) = lower('Abdel Rahman Azab')
  OR lower(s.name_ar) = lower('Abdel Rahman Azab')
)
WHERE p.project_code = '2406'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '108' <> '' AND s.code = '108')
  OR lower(s.name) = lower('Abdel Razek Mohamed')
  OR lower(s.name_ar) = lower('Abdel Razek Mohamed')
)
WHERE p.project_code = '2406'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '249' <> '' AND s.code = '249')
  OR lower(s.name) = lower('Ali Khalifa Nazeef')
  OR lower(s.name_ar) = lower('Ali Khalifa Nazeef')
)
WHERE p.project_code = '2406'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Naser Gomaa')
  OR lower(s.name_ar) = lower('Naser Gomaa')
)
WHERE p.project_code = '2406'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Kamal Abdel Hameed')
  OR lower(s.name_ar) = lower('Kamal Abdel Hameed')
)
WHERE p.project_code = '2406'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '226' <> '' AND s.code = '226')
  OR lower(s.name) = lower('Pola Morris')
  OR lower(s.name_ar) = lower('Pola Morris')
)
WHERE p.project_code = '2406'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '90' <> '' AND s.code = '90')
  OR lower(s.name) = lower('Mohamed Shaaban')
  OR lower(s.name_ar) = lower('Mohamed Shaaban')
)
WHERE p.project_code = '2601'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Construction Manager', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '25' <> '' AND s.code = '25')
  OR lower(s.name) = lower('Abdel Rahman Azab')
  OR lower(s.name_ar) = lower('Abdel Rahman Azab')
)
WHERE p.project_code = '2601'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '108' <> '' AND s.code = '108')
  OR lower(s.name) = lower('Abdel Razek Mohamed')
  OR lower(s.name_ar) = lower('Abdel Razek Mohamed')
)
WHERE p.project_code = '2601'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '249' <> '' AND s.code = '249')
  OR lower(s.name) = lower('Ali Khalifa Nazeef')
  OR lower(s.name_ar) = lower('Ali Khalifa Nazeef')
)
WHERE p.project_code = '2601'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Naser Gomaa')
  OR lower(s.name_ar) = lower('Naser Gomaa')
)
WHERE p.project_code = '2601'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Kamal Abdel Hameed')
  OR lower(s.name_ar) = lower('Kamal Abdel Hameed')
)
WHERE p.project_code = '2601'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '226' <> '' AND s.code = '226')
  OR lower(s.name) = lower('Pola Morris')
  OR lower(s.name_ar) = lower('Pola Morris')
)
WHERE p.project_code = '2601'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('MEP Manager', ''), 'عضو فريق'),
  'accountable',
  'contractor',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Zaho')
  OR lower(s.name_ar) = lower('Zaho')
)
WHERE p.project_code = '2308'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '152' <> '' AND s.code = '152')
  OR lower(s.name) = lower('Ibrahim Gomaa')
  OR lower(s.name_ar) = lower('Ibrahim Gomaa')
)
WHERE p.project_code = '2308'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '249' <> '' AND s.code = '249')
  OR lower(s.name) = lower('Ali Khalifa Nazeef')
  OR lower(s.name_ar) = lower('Ali Khalifa Nazeef')
)
WHERE p.project_code = '2308'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '217' <> '' AND s.code = '217')
  OR lower(s.name) = lower('Mokhtar Kotb')
  OR lower(s.name_ar) = lower('Mokhtar Kotb')
)
WHERE p.project_code = '2308'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '344' <> '' AND s.code = '344')
  OR lower(s.name) = lower('Mohamed El-Bakry')
  OR lower(s.name_ar) = lower('Mohamed El-Bakry')
)
WHERE p.project_code = '2308'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '226' <> '' AND s.code = '226')
  OR lower(s.name) = lower('Pola Morris')
  OR lower(s.name_ar) = lower('Pola Morris')
)
WHERE p.project_code = '2308'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'contractor',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Eng. Tamer')
  OR lower(s.name_ar) = lower('Eng. Tamer')
)
WHERE p.project_code = '2414'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '152' <> '' AND s.code = '152')
  OR lower(s.name) = lower('Ibrahim Gomaa')
  OR lower(s.name_ar) = lower('Ibrahim Gomaa')
)
WHERE p.project_code = '2414'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '249' <> '' AND s.code = '249')
  OR lower(s.name) = lower('Ali Khalifa Nazeef')
  OR lower(s.name_ar) = lower('Ali Khalifa Nazeef')
)
WHERE p.project_code = '2414'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '217' <> '' AND s.code = '217')
  OR lower(s.name) = lower('Mokhtar Kotb')
  OR lower(s.name_ar) = lower('Mokhtar Kotb')
)
WHERE p.project_code = '2414'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '344' <> '' AND s.code = '344')
  OR lower(s.name) = lower('Mohamed El-Bakry')
  OR lower(s.name_ar) = lower('Mohamed El-Bakry')
)
WHERE p.project_code = '2414'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '226' <> '' AND s.code = '226')
  OR lower(s.name) = lower('Pola Morris')
  OR lower(s.name_ar) = lower('Pola Morris')
)
WHERE p.project_code = '2414'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '152' <> '' AND s.code = '152')
  OR lower(s.name) = lower('Ibrahim Gomaa')
  OR lower(s.name_ar) = lower('Ibrahim Gomaa')
)
WHERE p.project_code = '2333'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '249' <> '' AND s.code = '249')
  OR lower(s.name) = lower('Ali Khalifa Nazeef')
  OR lower(s.name_ar) = lower('Ali Khalifa Nazeef')
)
WHERE p.project_code = '2333'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '217' <> '' AND s.code = '217')
  OR lower(s.name) = lower('Mokhtar Kotb')
  OR lower(s.name_ar) = lower('Mokhtar Kotb')
)
WHERE p.project_code = '2333'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '344' <> '' AND s.code = '344')
  OR lower(s.name) = lower('Mohamed El-Bakry')
  OR lower(s.name_ar) = lower('Mohamed El-Bakry')
)
WHERE p.project_code = '2333'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '226' <> '' AND s.code = '226')
  OR lower(s.name) = lower('Pola Morris')
  OR lower(s.name_ar) = lower('Pola Morris')
)
WHERE p.project_code = '2333'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Technical Office Manager', ''), 'عضو فريق'),
  'accountable',
  'contractor',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('Mohamed Hosny')
  OR lower(s.name_ar) = lower('Mohamed Hosny')
)
WHERE p.project_code = '2269'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '152' <> '' AND s.code = '152')
  OR lower(s.name) = lower('Ibrahim Gomaa')
  OR lower(s.name_ar) = lower('Ibrahim Gomaa')
)
WHERE p.project_code = '2269'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '249' <> '' AND s.code = '249')
  OR lower(s.name) = lower('Ali Khalifa Nazeef')
  OR lower(s.name_ar) = lower('Ali Khalifa Nazeef')
)
WHERE p.project_code = '2269'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '217' <> '' AND s.code = '217')
  OR lower(s.name) = lower('Mokhtar Kotb')
  OR lower(s.name_ar) = lower('Mokhtar Kotb')
)
WHERE p.project_code = '2269'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '344' <> '' AND s.code = '344')
  OR lower(s.name) = lower('Mohamed El-Bakry')
  OR lower(s.name_ar) = lower('Mohamed El-Bakry')
)
WHERE p.project_code = '2269'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Mechanical Section Head', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '226' <> '' AND s.code = '226')
  OR lower(s.name) = lower('Pola Morris')
  OR lower(s.name_ar) = lower('Pola Morris')
)
WHERE p.project_code = '2269'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('', ''), 'عضو فريق'),
  'accountable',
  'client',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '' <> '' AND s.code = '')
  OR lower(s.name) = lower('العميد جمال سالم')
  OR lower(s.name_ar) = lower('العميد جمال سالم')
)
WHERE p.project_code = '1044'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Project Manager', ''), 'عضو فريق'),
  'accountable',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '19' <> '' AND s.code = '19')
  OR lower(s.name) = lower('Mostafa Omar')
  OR lower(s.name_ar) = lower('Mostafa Omar')
)
WHERE p.project_code = '1044'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '67' <> '' AND s.code = '67')
  OR lower(s.name) = lower('Mawhoub Mahmoud Ahmed')
  OR lower(s.name_ar) = lower('Mawhoub Mahmoud Ahmed')
)
WHERE p.project_code = '1044'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '13' <> '' AND s.code = '13')
  OR lower(s.name) = lower('Salah Azzazi Abd el fattah')
  OR lower(s.name_ar) = lower('Salah Azzazi Abd el fattah')
)
WHERE p.project_code = '1044'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '67' <> '' AND s.code = '67')
  OR lower(s.name) = lower('Mawhoub Mahmoud Ahmed')
  OR lower(s.name_ar) = lower('Mawhoub Mahmoud Ahmed')
)
WHERE p.project_code = '2105'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '13' <> '' AND s.code = '13')
  OR lower(s.name) = lower('Salah Azzazi Abd el fattah')
  OR lower(s.name_ar) = lower('Salah Azzazi Abd el fattah')
)
WHERE p.project_code = '2105'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '67' <> '' AND s.code = '67')
  OR lower(s.name) = lower('Mawhoub Mahmoud Ahmed')
  OR lower(s.name_ar) = lower('Mawhoub Mahmoud Ahmed')
)
WHERE p.project_code = '2106'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('Supervisor', ''), 'عضو فريق'),
  'responsible',
  'employee',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '13' <> '' AND s.code = '13')
  OR lower(s.name) = lower('Salah Azzazi Abd el fattah')
  OR lower(s.name_ar) = lower('Salah Azzazi Abd el fattah')
)
WHERE p.project_code = '2106'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 1099858552', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Project Manager' <> '' AND s.code = 'Project Manager')
  OR lower(s.name) = lower('184')
  OR lower(s.name_ar) = lower('184')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('01070474455', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Site Engeneer' <> '' AND s.code = 'Site Engeneer')
  OR lower(s.name) = lower('138')
  OR lower(s.name_ar) = lower('138')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('01090177295-01044992840', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Site Engeneer' <> '' AND s.code = 'Site Engeneer')
  OR lower(s.name) = lower('400/1000')
  OR lower(s.name_ar) = lower('400/1000')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('1066220357', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Technical Office Manager' <> '' AND s.code = 'Technical Office Manager')
  OR lower(s.name) = lower('57')
  OR lower(s.name_ar) = lower('57')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('1021111762', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Planning Section Head' <> '' AND s.code = 'Planning Section Head')
  OR lower(s.name) = lower('329')
  OR lower(s.name_ar) = lower('329')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 10 69826535', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Mechanical Section Head' <> '' AND s.code = 'Mechanical Section Head')
  OR lower(s.name) = lower('226')
  OR lower(s.name_ar) = lower('226')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 1050222189', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Electrical Section Head' <> '' AND s.code = 'Electrical Section Head')
  OR lower(s.name) = lower('25')
  OR lower(s.name_ar) = lower('25')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('1066220351', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Team Leader DC' <> '' AND s.code = 'Team Leader DC')
  OR lower(s.name) = lower('56')
  OR lower(s.name_ar) = lower('56')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 1025485140', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Senior Document Control' <> '' AND s.code = 'Senior Document Control')
  OR lower(s.name) = lower('205')
  OR lower(s.name_ar) = lower('205')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 1020100511', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Senior Civil Technical Office' <> '' AND s.code = 'Senior Civil Technical Office')
  OR lower(s.name) = lower('179')
  OR lower(s.name_ar) = lower('179')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 1012342472', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Civil Technical Office' <> '' AND s.code = 'Civil Technical Office')
  OR lower(s.name) = lower('229')
  OR lower(s.name_ar) = lower('229')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 1080015702', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Senior Technical Office' <> '' AND s.code = 'Senior Technical Office')
  OR lower(s.name) = lower('93')
  OR lower(s.name_ar) = lower('93')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 10 64666801', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Electrical Technical Office' <> '' AND s.code = 'Electrical Technical Office')
  OR lower(s.name) = lower('94')
  OR lower(s.name_ar) = lower('94')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 10 80015694', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Electrical Technical Office' <> '' AND s.code = 'Electrical Technical Office')
  OR lower(s.name) = lower('358')
  OR lower(s.name_ar) = lower('358')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 10 50434497', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Mechanical Technical Office' <> '' AND s.code = 'Mechanical Technical Office')
  OR lower(s.name) = lower('302')
  OR lower(s.name_ar) = lower('302')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 10 32980999', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Mechanical Technical Office' <> '' AND s.code = 'Mechanical Technical Office')
  OR lower(s.name) = lower('299')
  OR lower(s.name_ar) = lower('299')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 10 60289473', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Civil Supervisor' <> '' AND s.code = 'Civil Supervisor')
  OR lower(s.name) = lower('403/1003')
  OR lower(s.name_ar) = lower('403/1003')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 10 92565747', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Civil Supervisor' <> '' AND s.code = 'Civil Supervisor')
  OR lower(s.name) = lower('249')
  OR lower(s.name_ar) = lower('249')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 1090043116', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Technical Supervisor' <> '' AND s.code = 'Technical Supervisor')
  OR lower(s.name) = lower('1')
  OR lower(s.name_ar) = lower('1')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Surveyor' <> '' AND s.code = 'Surveyor')
  OR lower(s.name) = lower('210')
  OR lower(s.name_ar) = lower('210')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );


INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 1065736661', ''), 'عضو فريق'),
  'accountable',
  'consultant',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND 'Technical Supervisor' <> '' AND s.code = 'Technical Supervisor')
  OR lower(s.name) = lower('123')
  OR lower(s.name_ar) = lower('123')
)
WHERE p.project_code = '12 منشأ مائي + خرسانة وميكانيكا"'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );

COMMIT;