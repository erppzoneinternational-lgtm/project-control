import os, urllib.request, json, sys
sys.stdout.reconfigure(encoding='utf-8')

service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '').strip()
if not service_key:
    raise SystemExit('ERROR: Missing required SUPABASE_SERVICE_ROLE_KEY environment variable.')
base = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://tgqpcviqmgtdddiqvqdw.supabase.co').strip()

url = f'{base}/rest/v1/pm_projects?select=project_code,project_name,status&deleted_at=is.null&order=project_code.desc&limit=10'
headers = {
    'apikey': service_key,
    'Authorization': f'Bearer {service_key}',
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f'Projects in tgqpcviqmgtdddiqvqdw (count {len(data)}):')
        for p in data:
            print(f"  {p['project_code']} | {p['status']} | {p['project_name']}")
except urllib.error.HTTPError as e:
    print(f'HTTP {e.code}: {e.reason}')
    print(e.read().decode('utf-8'))
