import os, urllib.request, json, sys
sys.stdout.reconfigure(encoding='utf-8')

service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '').strip()
if not service_key:
    raise SystemExit('ERROR: Missing required SUPABASE_SERVICE_ROLE_KEY environment variable.')
base = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://tgqpcviqmgtdddiqvqdw.supabase.co').strip()

proj_id = '046013f3-8545-4316-9fed-9974b4bebb58'
url = f'{base}/rest/v1/project_stakeholders?project_id=eq.{proj_id}&select=*,stakeholders(*)'
req = urllib.request.Request(url, headers={'apikey': service_key, 'Authorization': f'Bearer {service_key}'})
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print(f'Total project_stakeholders: {len(data)}')
    for ps in data:
        stk = ps.get('stakeholders') or {}
        role = ps.get('project_role')
        active = ps.get('is_active')
        start = ps.get('start_date')
        end = ps.get('end_date')
        name = stk.get('name') or stk.get('name_ar')
        print(f"Role: {role} | Active: {active} | {start} -> {end} | {name}")
