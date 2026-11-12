import sys
sys.path.append('scripts')
import parse_data

rows = parse_data.parse_data(parse_data.RAW_TSV)

# Create a clean SQL file that does bulk matching & insertion in 1 step
sql_lines = ["BEGIN;"]

# 1. First, create all missing stakeholders
for r in rows:
    name = r['name'].strip()
    emp_code = r['emp_code'].strip()
    title = r['title'].strip()
    mobile = r['mobile'].strip()
    company = r['company'].strip()
    owner_role = r['owner_role'].strip()
    
    if not name or name == 'NA':
        continue
        
    stk_kind = 'employee' if company == 'P.Zone' else 'client_rep'
    escaped_name = name.replace("'", "''")
    escaped_title = title.replace("'", "''")
    escaped_company = company.replace("'", "''")
    escaped_mobile = mobile.replace("'", "''")
    escaped_code = emp_code.replace("'", "''")
    
    sql_lines.append(f"""
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.stakeholders 
    WHERE (code IS NOT NULL AND '{escaped_code}' <> '' AND code = '{escaped_code}')
       OR lower(name) = lower('{escaped_name}') 
       OR lower(name_ar) = lower('{escaped_name}')
  ) THEN
    INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
    VALUES (
      'stk_' || replace(gen_random_uuid()::text, '-', ''),
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
END $$;
""")

sql_lines.append("COMMIT;")

with open('scripts/create_stakeholders.sql', 'w', encoding='utf-8') as f:
    f.write("\n".join(sql_lines))

print("Generated scripts/create_stakeholders.sql")
