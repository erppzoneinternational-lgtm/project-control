import os, urllib.request, json, sys
sys.stdout.reconfigure(encoding='utf-8')

key = (
    os.environ.get('HR_SUPABASE_SERVICE_ROLE_KEY')
    or os.environ.get('NEXT_PUBLIC_HR_SUPABASE_ANON_KEY')
    or ''
).strip()
if not key:
    raise SystemExit('ERROR: Missing required HR_SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_HR_SUPABASE_ANON_KEY environment variable.')
base = os.environ.get('NEXT_PUBLIC_HR_SUPABASE_URL', 'https://ftmguacqywsucjhjiacn.supabase.co').strip()

url = f'{base}/rest/v1/employees?select=id,first_name,last_name,employee_code,status,custom_fields&limit=200'
headers = {'apikey': key, 'Authorization': f'Bearer {key}'}

req = urllib.request.Request(url, headers=headers)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print(f'Total employees: {len(data)}')
    print()
    for emp in data:
        cf = emp.get('custom_fields') or {}
        ar_name = cf.get('fullNameArabic', '')
        en_name = f"{emp['first_name']} {emp['last_name']}"
        code = emp.get('employee_code', '')
        status = emp.get('status', '')
        job = cf.get('jobTitle', '')
        print(f'{code:>4} | {status:8} | {ar_name:40} | {en_name:30} | {job}')
