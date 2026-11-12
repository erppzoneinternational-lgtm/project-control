BEGIN;
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
  'responsible',
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
  'responsible',
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
COMMIT;