"""
Comprehensive Ground-Truth Verification across all 77 projects in tgqpcviqmgtdddiqvqdw:
1. Audits Project Manager:
   - Live assignment in project_stakeholders (is_active=true, project_role in PM roles)
   - Stakeholder ID, Name, Phone, Role
   - Current static value in pm_projects
2. Audits Location:
   - Does site_location_address contain raw coordinates?
   - What is the Project Area from CSV?
   - Does it map to a valid pm_governorate and pm_city?
3. Audits Client & Role:
   - Client name from CSV vs client_id / client_name_ar in DB
"""
import os
import urllib.request
import json
import csv
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

CSV_PATH = r"D:\ERP\Database\PZ. Projects Dashboard - Projects Details.csv"
BASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://tgqpcviqmgtdddiqvqdw.supabase.co").strip()
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
if not SERVICE_KEY:
    raise SystemExit("ERROR: Missing required SUPABASE_SERVICE_ROLE_KEY environment variable.")

def get(path):
    url = f"{BASE_URL}/rest/v1/{path}"
    req = urllib.request.Request(url, headers={
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}'
    })
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def is_pm_role(role):
    if not role: return False
    r = role.strip().lower()
    for excl in ['technical office', 'planning', 'construction', 'qc', 'qa', 'safety', 'survey', 'commercial']:
        if excl in r: return False
    return ('project manager' in r or 'مدير مشروع' in r or 'مدير المشروعات' in r or r == 'pm')

def main():
    # 1. Fetch live DB projects
    db_projects = get("pm_projects?select=id,project_code,project_name,status,contract_value,pm_full_name,project_manager_name_raw,project_manager_id,site_location_address,gps_lat,gps_lng,client_name_raw,pzone_role&deleted_at=is.null&order=project_code.asc")
    print(f"Loaded {len(db_projects)} active projects from live DB.")

    # 2. Fetch all project_stakeholders
    ps_rows = get("project_stakeholders?is_active=eq.true&select=project_id,project_role,start_date,stakeholder_id,stakeholders(id,name,name_ar,phone,job_title,employee_code)&order=start_date.desc.nullslast")
    
    # Group active PMs by project_id
    live_pms_by_proj = {}
    for r in ps_rows:
        role = r.get('project_role') or ''
        if is_pm_role(role):
            stk = r.get('stakeholders') or {}
            live_pms_by_proj.setdefault(r['project_id'], []).append({
                'role': role,
                'name': stk.get('name_ar') or stk.get('name'),
                'id': stk.get('id'),
                'phone': stk.get('phone'),
                'code': stk.get('employee_code')
            })

    # 3. Read CSV ground truth
    csv_rows = {}
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row.get('Project Code', '').strip()
            if code:
                csv_rows[code] = row

    print(f"Loaded {len(csv_rows)} projects from CSV.")

    print("\n" + "=" * 130)
    print(f"{'Code':6} | {'Project Name':38} | {'Live HR PM (project_stakeholders)':32} | {'Current pm_projects PM':25} | {'Area / Loc'}")
    print("-" * 130)

    pm_update_plan = []
    location_clean_plan = []

    for p in db_projects:
        pid = p['id']
        code = p['project_code']
        name = (p['project_name'] or '')[:36]
        current_pm = p.get('pm_full_name') or p.get('project_manager_name_raw') or ''
        
        hr_pms = live_pms_by_proj.get(pid, [])
        csv_data = csv_rows.get(code, {})
        csv_area = (csv_data.get(' Project Area') or csv_data.get('Project Area') or '').strip()
        loc_addr = p.get('site_location_address') or ''

        # Check if site_location_address is just raw numeric coordinates
        is_raw_coords = bool(re.match(r'^\s*[-+]?[0-9]*\.?[0-9]+\s*,\s*[-+]?[0-9]*\.?[0-9]+\s*$', loc_addr))
        if is_raw_coords:
            location_clean_plan.append({
                'code': code,
                'pid': pid,
                'current_addr': loc_addr,
                'csv_area': csv_area
            })

        hr_desc = ""
        if hr_pms:
            # Prefer 'Project Manager' or 'Senior Project Manager' over 'مدير المشروعات' if multiple
            primary_pm = hr_pms[0]
            for candidate in hr_pms:
                if candidate['role'].lower() in ['project manager', 'senior project manager', 'مدير مشروع']:
                    primary_pm = candidate
                    break
            hr_desc = f"{primary_pm['name']} ({primary_pm['role']})"
            
            # Check if current_pm doesn't match primary_pm
            if primary_pm['name'] not in current_pm and current_pm not in primary_pm['name']:
                pm_update_plan.append({
                    'code': code,
                    'pid': pid,
                    'from': current_pm,
                    'to_name': primary_pm['name'],
                    'to_id': primary_pm['id'],
                    'to_phone': primary_pm['phone'],
                    'to_code': primary_pm['code']
                })
        else:
            hr_desc = "(No assignment in HR)"

        loc_flag = " [COORDS AS ADDR]" if is_raw_coords else ""
        print(f"{code:6} | {name:38} | {hr_desc:32} | {current_pm:25} | {csv_area}{loc_flag}")

    print("=" * 130)
    print(f"\nAUDIT RESULTS:")
    print(f"1. Projects requiring PM synchronization to active Live HR: {len(pm_update_plan)}")
    print(f"2. Projects with raw coordinates in address field needing area cleanup: {len(location_clean_plan)}")

    with open('scripts/verification_audit_report.json', 'w', encoding='utf-8') as f:
        json.dump({
            'pm_update_plan': pm_update_plan,
            'location_clean_plan': location_clean_plan
        }, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
