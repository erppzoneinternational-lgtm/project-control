import sys
sys.path.append('scripts')
import parse_data

rows = parse_data.parse_data(parse_data.RAW_TSV)

# Write a python script that directly connects to Supabase database or executes SQL statements

sql_inserts = []
for r in rows:
    proj_code = r['project_code']
    company = r['company'].strip()
    owner_role = r['owner_role'].strip()
    name = r['name'].strip()
    emp_code = r['emp_code'].strip()
    title = r['title'].strip()
    mobile = r['mobile'].strip()
    
    if not name or name == 'NA':
        continue
        
    raci = 'responsible'
    if 'project manager' in title.lower() or 'director' in title.lower() or 'head' in title.lower() or company != 'P.Zone':
        raci = 'accountable'
        
    stk_kind = 'employee' if company == 'P.Zone' else 'client_rep'
    party_kind = 'employee'
    if company != 'P.Zone':
        if 'owner' in owner_role.lower():
            party_kind = 'client'
        elif 'main' in owner_role.lower():
            party_kind = 'contractor'
        else:
            party_kind = 'consultant'
            
    escaped_name = name.replace("'", "''")
    escaped_title = title.replace("'", "''")
    escaped_company = company.replace("'", "''")
    escaped_mobile = mobile.replace("'", "''")
    escaped_code = emp_code.replace("'", "''")
    escaped_proj_code = proj_code.replace("'", "''")
    
    sql_inserts.append(f"""
DO $$
DECLARE
  v_proj_id uuid;
  v_stk_id text;
BEGIN
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '{escaped_proj_code}' LIMIT 1;
  IF v_proj_id IS NOT NULL THEN
    IF '{escaped_code}' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '{escaped_code}' LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('{escaped_name}') OR lower(name_ar) = lower('{escaped_name}') LIMIT 1;
    END IF;
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || replace(gen_random_uuid()::text, '-', '');
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        '00000000-0000-0000-0000-000000000001', 
        '{escaped_name}', 
        '{escaped_name}', 
        NULLIF('{escaped_code}', ''), 
        NULLIF('{escaped_title}', ''), 
        NULLIF('{escaped_mobile}', ''), 
        NULLIF('{escaped_company}', ''), 
        '{stk_kind}', 
        '{stk_kind}'
      );
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000001',
        v_proj_id,
        v_stk_id,
        COALESCE(NULLIF('{escaped_title}', ''), 'عضو فريق'),
        '{raci}',
        '{party_kind}',
        NOW()
      );
    END IF;
  END IF;
END $$;
""")

chunk_size = 40
chunks = [sql_inserts[i:i + chunk_size] for i in range(0, len(sql_inserts), chunk_size)]
print(f"Generated {len(chunks)} chunks.")

for idx, c in enumerate(chunks):
    chunk_content = "BEGIN;\n" + "\n".join(c) + "\nCOMMIT;"
    with open(f'scripts/clean_chunk_{idx+1}.sql', 'w', encoding='utf-8') as f:
        f.write(chunk_content)
    print(f"Saved clean_chunk_{idx+1}.sql with {len(c)} statements.")
