BEGIN;
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
COMMIT;