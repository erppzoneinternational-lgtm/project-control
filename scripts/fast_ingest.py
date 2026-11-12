import sys
sys.path.append('scripts')
import parse_data

rows = parse_data.parse_data(parse_data.RAW_TSV)

print(f"Loaded {len(rows)} data rows.")

# 1. Build a single SQL script to create all unique stakeholders and project stakeholders
sql_parts = []
sql_parts.append("BEGIN;")

# First insert missing stakeholders
for r in rows:
    name = r['name'].strip()
    emp_code = r['emp_code'].strip()
    title = r['title'].strip()
    mobile = r['mobile'].strip()
    company = r['company'].strip()
    
    if not name or name == 'NA':
        continue
        
    stk_kind = 'employee' if company == 'P.Zone' else 'client_rep'
    e_name = name.replace("'", "''")
    e_title = title.replace("'", "''")
    e_company = company.replace("'", "''")
    e_mobile = mobile.replace("'", "''")
    e_code = emp_code.replace("'", "''")
    
    sql_parts.append(f"""
INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
SELECT 
  'stk_' || replace(gen_random_uuid()::text, '-', ''),
  '00000000-0000-0000-0000-000000000001',
  '{e_name}',
  '{e_name}',
  NULLIF('{e_code}', ''),
  NULLIF('{e_title}', ''),
  NULLIF('{e_mobile}', ''),
  NULLIF('{e_company}', ''),
  '{stk_kind}',
  '{stk_kind}'
WHERE NOT EXISTS (
  SELECT 1 FROM public.stakeholders 
  WHERE (code IS NOT NULL AND '{e_code}' <> '' AND code = '{e_code}')
     OR lower(name) = lower('{e_name}')
);
""")

# Second link stakeholders to projects
for r in rows:
    proj_code = r['project_code'].strip()
    company = r['company'].strip()
    owner_role = r['owner_role'].strip()
    name = r['name'].strip()
    emp_code = r['emp_code'].strip()
    title = r['title'].strip()
    
    if not name or name == 'NA':
        continue
        
    raci = 'responsible'
    if 'project manager' in title.lower() or 'director' in title.lower() or 'head' in title.lower() or company != 'P.Zone':
        raci = 'accountable'
        
    party_kind = 'employee'
    if company != 'P.Zone':
        if 'owner' in owner_role.lower():
            party_kind = 'client'
        elif 'main' in owner_role.lower():
            party_kind = 'contractor'
        else:
            party_kind = 'consultant'
            
    e_name = name.replace("'", "''")
    e_title = title.replace("'", "''")
    e_code = emp_code.replace("'", "''")
    e_pcode = proj_code.replace("'", "''")
    
    sql_parts.append(f"""
INSERT INTO public.project_stakeholders (id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at)
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  p.id,
  s.id,
  COALESCE(NULLIF('{e_title}', ''), 'عضو فريق'),
  '{raci}',
  '{party_kind}',
  NOW()
FROM public.pm_projects p
JOIN public.stakeholders s ON (
  (s.code IS NOT NULL AND '{e_code}' <> '' AND s.code = '{e_code}')
  OR lower(s.name) = lower('{e_name}')
  OR lower(s.name_ar) = lower('{e_name}')
)
WHERE p.project_code = '{e_pcode}'
  AND NOT EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    WHERE ps.project_id = p.id AND ps.stakeholder_id = s.id
  );
""")

sql_parts.append("COMMIT;")

with open('scripts/fast_ingest.sql', 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_parts))

print("Saved scripts/fast_ingest.sql")
