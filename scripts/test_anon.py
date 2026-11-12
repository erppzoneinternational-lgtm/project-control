import os, urllib.request, json, sys
sys.stdout.reconfigure(encoding='utf-8')

anon_key = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', '').strip()
if not anon_key:
    raise SystemExit('ERROR: Missing required NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.')
base = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', 'https://dwpdrclupradpnsminvi.supabase.co').strip()

# Test what the frontend would see
url = f'{base}/rest/v1/pm_projects_with_manager?select=project_code,project_name,status&deleted_at=is.null&order=project_code.desc&limit=10'
headers = {
    'apikey': anon_key,
    'Authorization': f'Bearer {anon_key}',
}

req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f'Results: {len(data)}')
        for p in data:
            print(f"  {p['project_code']} | {p['status']:12} | {p['project_name']}")
except urllib.error.HTTPError as e:
    print(f'HTTP {e.code}: {e.reason}')
    print(e.read().decode('utf-8')[:500])
