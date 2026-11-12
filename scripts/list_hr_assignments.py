import os, urllib.request, json, sys
sys.stdout.reconfigure(encoding='utf-8')

service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '').strip()
if not service_key:
    raise SystemExit('ERROR: Missing required SUPABASE_SERVICE_ROLE_KEY environment variable.')
base = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://tgqpcviqmgtdddiqvqdw.supabase.co').strip()

# Check all active project_stakeholders
url = f'{base}/rest/v1/project_stakeholders?is_active=eq.true&select=project_id,project_role,start_date,stakeholders(id,name,name_ar,phone,employee_code)&order=start_date.desc.nullslast'
req = urllib.request.Request(url, headers={'apikey': service_key, 'Authorization': f'Bearer {service_key}'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))

# Also get project codes
url_p = f'{base}/rest/v1/pm_projects?select=id,project_code,project_name,pm_full_name'
req_p = urllib.request.Request(url_p, headers={'apikey': service_key, 'Authorization': f'Bearer {service_key}'})
with urllib.request.urlopen(req_p) as resp:
    p_data = {p['id']: p for p in json.loads(resp.read().decode('utf-8'))}

pm_roles = ['project manager', 'senior project manager', 'مدير مشروع', 'pm']
seen = set()
print("=== VERIFIED LIVE HR ASSIGNMENTS (FROM project_stakeholders) ===")
for r in data:
    role = (r.get('project_role') or '').lower()
    if any(p in role for p in pm_roles) and not any(ex in role for ex in ['technical office', 'planning', 'construction', 'qc', 'qa', 'safety', 'survey', 'civil project']):
        pid = r['project_id']
        stk = r.get('stakeholders') or {}
        pinfo = p_data.get(pid, {})
        code = pinfo.get('project_code', 'UNKNOWN')
        name = stk.get('name_ar') or stk.get('name')
        if (code, name) not in seen:
            seen.add((code, name))
            st_pm = pinfo.get('pm_full_name') or 'NONE'
            print(f"Code: {code:6} | Current Static: {st_pm:25} | Verified Live HR PM: {name:25} | Role: {r.get('project_role')}")
