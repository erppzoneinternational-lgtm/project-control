BEGIN;
INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('0 10 80015694', ''), 'عضو فريق'),
  'responsible',
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
  'responsible',
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
COMMIT;