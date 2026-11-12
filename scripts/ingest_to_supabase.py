import os
import json
import urllib.request
import parse_data

# Use Supabase REST API with Service Role key or execute via SQL script generator
# Let's generate a complete SQL script file containing all INSERT / ON CONFLICT statements!

# 1. Fetch current stakeholders map from DB or build SQL that handles matching safely.

def build_sql():
    rows = parse_data.parse_data(parse_data.RAW_TSV)
    
    sql_lines = []
    sql_lines.append("-- Stakeholders & Project Stakeholders Ingestion Script")
    sql_lines.append("BEGIN;")
    
    # Track unique new external stakeholders to insert
    # Key: (name.lower(), company.lower())
    seen_stks = set()
    
    for r in rows:
        proj_code = r['project_code']
        company = r['company']
        owner_role = r['owner_role']
        name = r['name'].strip()
        emp_code = r['emp_code'].strip()
        title = r['title'].strip()
        mobile = r['mobile'].strip()
        
        if not name or name == 'NA':
            continue
            
        # Standardize RACI
        raci = 'R'
        if 'project manager' in title.lower() or 'director' in title.lower() or 'head' in title.lower() or company != 'P.Zone':
            raci = 'A'
            
        party_kind = 'employee'
        if company != 'P.Zone':
            if 'owner' in owner_role.lower():
                party_kind = 'client'
            elif 'main' in owner_role.lower():
                party_kind = 'contractor'
            else:
                party_kind = 'consultant'
                
        # Generate safe SQL block to find or create stakeholder, then insert project_stakeholder
        
        # 1. Find stakeholder by code (if emp_code exists) or by name
        # 2. If not exists, insert new stakeholder
        
        escaped_name = name.replace("'", "''")
        escaped_title = title.replace("'", "''")
        escaped_company = company.replace("'", "''")
        escaped_mobile = mobile.replace("'", "''")
        escaped_code = emp_code.replace("'", "''")
        escaped_proj_code = proj_code.replace("'", "''")
        
        stk_var = f"v_stk_id_{len(sql_lines)}"
        
        sql_lines.append(f"""
DO $$
DECLARE
  v_proj_id uuid;
  v_stk_id text;
BEGIN
  -- 1. Get project_id
  SELECT id INTO v_proj_id FROM public.pm_projects WHERE project_code = '{escaped_proj_code}' LIMIT 1;
  
  IF v_proj_id IS NOT NULL THEN
    -- 2. Find or Insert Stakeholder
    IF '{escaped_code}' <> '' THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE code = '{escaped_code}' LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      SELECT id INTO v_stk_id FROM public.stakeholders WHERE lower(name) = lower('{escaped_name}') OR lower(name_ar) = lower('{escaped_name}') LIMIT 1;
    END IF;
    
    IF v_stk_id IS NULL THEN
      v_stk_id := 'stk_' || gen_random_uuid()::text;
      INSERT INTO public.stakeholders (id, organization_id, name, name_ar, code, job_title, phone, company, type, stakeholder_kind)
      VALUES (
        v_stk_id, 
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f', 
        '{escaped_name}', 
        '{escaped_name}', 
        NULLIF('{escaped_code}', ''), 
        NULLIF('{escaped_title}', ''), 
        NULLIF('{escaped_mobile}', ''), 
        NULLIF('{escaped_company}', ''), 
        '{party_kind}', 
        '{party_kind}'
      );
    END IF;
    
    -- 3. Link to Project Stakeholders if not already linked
    IF NOT EXISTS (
      SELECT 1 FROM public.project_stakeholders 
      WHERE project_id = v_proj_id AND stakeholder_id = v_stk_id
    ) THEN
      INSERT INTO public.project_stakeholders (
        id, organization_id, project_id, stakeholder_id, project_role, raci_role, party_kind, assigned_at
      ) VALUES (
        gen_random_uuid(),
        'e8f7c9b2-1a3b-4c5d-8e9f-0a1b2c3d4e5f',
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

    sql_lines.append("COMMIT;")
    return "\n".join(sql_lines)

if __name__ == '__main__':
    sql = build_sql()
    with open('scripts/ingest_stakeholders.sql', 'w', encoding='utf-8') as f:
        f.write(sql)
    print("Generated SQL script: scripts/ingest_stakeholders.sql")
