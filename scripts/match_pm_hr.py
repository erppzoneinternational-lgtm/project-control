"""
Match project managers from ongoing_projects/pm_projects to HR employees.
Build UPDATE SQL to link project_manager_stakeholder_id in pm_projects.
"""
import os, urllib.request, json, sys
sys.stdout.reconfigure(encoding='utf-8')

HR_KEY = (
    os.environ.get('HR_SUPABASE_SERVICE_ROLE_KEY')
    or os.environ.get('NEXT_PUBLIC_HR_SUPABASE_ANON_KEY')
    or ''
).strip()
if not HR_KEY:
    raise SystemExit('ERROR: Missing required HR_SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_HR_SUPABASE_ANON_KEY environment variable.')
HR_BASE = os.environ.get('NEXT_PUBLIC_HR_SUPABASE_URL', 'https://ftmguacqywsucjhjiacn.supabase.co').strip()

def fetch_hr_employees():
    url = f'{HR_BASE}/rest/v1/employees?select=id,first_name,last_name,employee_code,status,custom_fields&limit=500'
    headers = {'apikey': HR_KEY, 'Authorization': f'Bearer {HR_KEY}'}
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def normalize_name(name):
    """Normalize Arabic name for matching."""
    if not name: return ''
    # Remove extra spaces, normalize hamza variants
    s = name.strip()
    s = s.replace('ي', 'ى').replace('ة', 'ه').replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا')
    s = ' '.join(s.split())  # collapse whitespace
    return s

def build_name_index(employees):
    """Build multiple indexes for fuzzy matching."""
    index = {}
    for emp in employees:
        cf = emp.get('custom_fields') or {}
        ar_full = cf.get('fullNameArabic', '')
        en_full = f"{emp['first_name']} {emp['last_name']}"
        
        # Index by normalized full Arabic name
        if ar_full:
            key = normalize_name(ar_full)
            index[key] = emp
            
            # Also by first two words (short name)
            parts = ar_full.strip().split()
            if len(parts) >= 2:
                short = ' '.join(parts[:2])
                index[normalize_name(short)] = emp
        
        # Index by English name
        if en_full.strip():
            index[en_full.strip().lower()] = emp
    
    return index

# PM names from the spreadsheet (the abbreviated ones)
PM_NAMES_FROM_SHEET = [
    'مصطفي عمر',
    'بدون',
    'محمد شعبان',
    'ناجى نسيم',
    'مصطفى سليم',
    'مينا سمير',
    'احمد يوسف',
    'احمد سالم',
    'محمد مصطفى',
    'يوسف ابراهيم',
    'سلمى',
]

def main():
    employees = fetch_hr_employees()
    print(f'HR employees: {len(employees)}')
    
    name_index = build_name_index(employees)
    
    print(f'\nMatching PM names from spreadsheet to HR:\n')
    print(f'{"PM Name (Sheet)":25} | {"Match":5} | {"HR Full Name":45} | {"Code":6} | {"HR ID"}')
    print('-' * 130)
    
    matches = {}
    
    for pm_name in PM_NAMES_FROM_SHEET:
        if pm_name == 'بدون':
            print(f'{pm_name:25} | SKIP  | (no PM assigned)')
            continue
        
        norm = normalize_name(pm_name)
        emp = name_index.get(norm)
        
        if emp:
            cf = emp.get('custom_fields') or {}
            ar_full = cf.get('fullNameArabic', '')
            print(f'{pm_name:25} | YES   | {ar_full:45} | {emp["employee_code"]:6} | {emp["id"]}')
            matches[pm_name] = emp
        else:
            # Try substring match
            found = False
            for key, e in name_index.items():
                if norm in key or key.startswith(norm):
                    cf = e.get('custom_fields') or {}
                    ar_full = cf.get('fullNameArabic', '')
                    print(f'{pm_name:25} | FUZZY | {ar_full:45} | {e["employee_code"]:6} | {e["id"]}')
                    matches[pm_name] = e
                    found = True
                    break
            if not found:
                print(f'{pm_name:25} | NO    | (not found in HR)')
    
    # Save matches for later use
    match_data = {}
    for pm_name, emp in matches.items():
        cf = emp.get('custom_fields') or {}
        match_data[pm_name] = {
            'hr_id': emp['id'],
            'employee_code': emp.get('employee_code', ''),
            'full_name_ar': cf.get('fullNameArabic', ''),
            'full_name_en': f"{emp['first_name']} {emp['last_name']}",
        }
    
    with open('scripts/pm_hr_matches.json', 'w', encoding='utf-8') as f:
        json.dump(match_data, f, ensure_ascii=False, indent=2)
    
    print(f'\n\nMatches saved to scripts/pm_hr_matches.json')
    print(f'Matched: {len(matches)} / {len(PM_NAMES_FROM_SHEET) - 1} (excluding بدون)')

if __name__ == '__main__':
    main()
