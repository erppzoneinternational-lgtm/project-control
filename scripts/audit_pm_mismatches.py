import os, urllib.request, json, sys
sys.stdout.reconfigure(encoding='utf-8')

service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '').strip()
if not service_key:
    raise SystemExit('ERROR: Missing required SUPABASE_SERVICE_ROLE_KEY environment variable.')
base = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://tgqpcviqmgtdddiqvqdw.supabase.co').strip()

# 1. Fetch all pm_projects
url = f'{base}/rest/v1/pm_projects?select=id,project_code,project_name,pm_full_name,project_manager_name_raw,site_location_address&deleted_at=is.null&order=project_code.asc'
req = urllib.request.Request(url, headers={'apikey': service_key, 'Authorization': f'Bearer {service_key}'})
with urllib.request.urlopen(req) as resp:
    projects = json.loads(resp.read().decode('utf-8'))

# 2. Fetch all project_stakeholders with is_active=true
url_stk = f'{base}/rest/v1/project_stakeholders?is_active=eq.true&select=project_id,project_role,stakeholder_id,stakeholders(id,name,name_ar,job_title)'
req_stk = urllib.request.Request(url_stk, headers={'apikey': service_key, 'Authorization': f'Bearer {service_key}'})
with urllib.request.urlopen(req_stk) as resp:
    stk_rows = json.loads(resp.read().decode('utf-8'))

def is_pm_role(role):
    if not role: return False
    r = role.strip().lower()
    for excl in ['technical office', 'planning', 'construction', 'qc', 'qa', 'safety', 'survey', 'commercial']:
        if excl in r: return False
    return ('project manager' in r or 'مدير مشروع' in r or 'مدير المشروعات' in r or r == 'pm')

pm_by_proj = {}
for r in stk_rows:
    role = r.get('project_role') or ''
    if is_pm_role(role):
        stk = r.get('stakeholders') or {}
        stk_name = stk.get('name') or stk.get('name_ar') or ''
        pm_by_proj.setdefault(r['project_id'], []).append({
            'role': role,
            'name': stk_name,
            'stk_id': stk.get('id')
        })

print(f"Total projects: {len(projects)}")
print(f"Projects with assigned HR PM: {len(pm_by_proj)}")
print("=" * 110)
print(f"{'Code':6} | {'Project Name':40} | {'Static DB PM':25} | {'Active Live HR PM'}")
print("-" * 110)

mismatches = []
for p in projects:
    pid = p['id']
    code = p['project_code']
    name = p['project_name'] or ''
    current_pm = p.get('pm_full_name') or p.get('project_manager_name_raw') or 'NONE'
    hr_pms = pm_by_proj.get(pid, [])
    
    if hr_pms:
        hr_desc = ", ".join([f"{x['name']} [{x['role']}]" for x in hr_pms])
        matches = any(x['name'].strip().lower() in current_pm.lower() or current_pm.lower() in x['name'].strip().lower() for x in hr_pms)
        if not matches:
            mismatches.append((code, name[:38], current_pm, hr_desc))
            print(f"MISMATCH: {code:6} | {name[:38]:40} | {current_pm:25} | {hr_desc}")
    else:
        # No HR PM assigned
        pass

print("=" * 110)
print(f"Total Mismatches Found: {len(mismatches)}")
