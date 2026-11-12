import sys
sys.path.append('scripts')
import parse_data

rows = parse_data.parse_data(parse_data.RAW_TSV)

print(f"Loaded {len(rows)} records.")

sql_inserts = []
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
    
    sql_inserts.append(f"""
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

# Split 250 inserts into 3 blocks
c1 = sql_inserts[0:80]
c2 = sql_inserts[80:160]
c3 = sql_inserts[160:]

with open('scripts/assign_part1.sql', 'w', encoding='utf-8') as f:
    f.write("BEGIN;\n" + "\n".join(c1) + "\nCOMMIT;")

with open('scripts/assign_part2.sql', 'w', encoding='utf-8') as f:
    f.write("BEGIN;\n" + "\n".join(c2) + "\nCOMMIT;")

with open('scripts/assign_part3.sql', 'w', encoding='utf-8') as f:
    f.write("BEGIN;\n" + "\n".join(c3) + "\nCOMMIT;")

print("Saved assign_part1.sql, assign_part2.sql, assign_part3.sql")
