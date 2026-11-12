"""
Full reconciliation of all 77 projects from PZ Dashboard CSV into the REAL LIVE production DB (tgqpcviqmgtdddiqvqdw)
via Supabase REST API with service_role key.
Preserves PM fields and un-deletes valid projects (2610, 2611).
Inserts 2609 if missing.
"""
import csv
import json
import os
import urllib.request
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

CSV_PATH = r"D:\ERP\Database\PZ. Projects Dashboard - Projects Details.csv"
BASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://tgqpcviqmgtdddiqvqdw.supabase.co").strip()
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
if not SERVICE_KEY:
    raise SystemExit("ERROR: Missing required SUPABASE_SERVICE_ROLE_KEY environment variable.")

PM_STATUS_MAP = {
    'Finished': 'finished',
    'Working': 'working',
    'Hold': 'on_hold',
    'Handing over': 'handing_over',
    'Cancelled': 'cancelled',
    'Not started': 'not_started',
}

SKIP_VALUES = {'', 'None', 'none', 'nan', 'NaN', 'null', 'NULL'}

def clean_numeric(v):
    if not v or v.strip() in SKIP_VALUES:
        return None
    s = v.strip().replace(',', '').replace(' ', '')
    try:
        n = float(s)
        return int(n) if n == int(n) else n
    except:
        return None

def normalize_date(v):
    if not v or v.strip() in SKIP_VALUES:
        return None
    s = v.strip().split(' ')[0]
    if re.match(r'^\d{4}-\d{2}-\d{2}$', s): return s
    m = re.match(r'^(\d{2})-(\d{2})-(\d{4})$', s)
    if m: return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    m = re.match(r'^(\d{2})/(\d{2})/(\d{4})$', s)
    if m: return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    return None

def fetch_existing_projects():
    url = f"{BASE_URL}/rest/v1/pm_projects?select=id,project_code,deleted_at"
    req = urllib.request.Request(url, headers={
        'apikey': SERVICE_KEY,
        'Authorization': f'Bearer {SERVICE_KEY}'
    })
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        return {p['project_code']: p for p in data if p.get('project_code')}

def sync_all():
    existing = fetch_existing_projects()
    print(f"Fetched {len(existing)} existing projects in live DB tgqpcviqmgtdddiqvqdw.")

    projects = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row.get('Project Code', '').strip()
            if code:
                projects.append(row)

    print(f"Parsed {len(projects)} projects from CSV.")

    updated_count = 0
    inserted_count = 0

    for sp in projects:
        code = sp['Project Code'].strip()
        name = sp.get('Project Name', '').strip()
        status_raw = sp.get('Status', '').strip()
        status = PM_STATUS_MAP.get(status_raw, 'working')

        payload = {
            'deleted_at': None, # Un-delete if soft-deleted
        }

        if name:
            payload['project_name'] = name
            payload['name_ar'] = name
            payload['project_name_ar'] = name

        if status:
            payload['status'] = status

        cv = clean_numeric(sp.get('Contract Value', ''))
        if cv is not None:
            payload['contract_value'] = cv

        vo = clean_numeric(sp.get('V.Os Value', ''))
        if vo is not None:
            payload['vos_value'] = vo

        ec = clean_numeric(sp.get('Estimated Cost', ''))
        if ec is not None:
            payload['estimated_cost'] = ec

        cd = normalize_date(sp.get('Contract Date', ''))
        if cd:
            payload['contract_date'] = cd

        cs = sp.get('Contract Status', '').strip()
        if cs:
            payload['contract_status'] = cs

        hc = sp.get('HARD COPY status', '').strip()
        if hc:
            payload['hardcopy_status'] = hc

        wa = clean_numeric(sp.get('Water Area (m2)', ''))
        if wa is not None:
            payload['water_area_m2'] = wa

        wv = clean_numeric(sp.get('Water Vol (m3)', ''))
        if wv is not None:
            payload['water_vol_m3'] = wv

        owner = sp.get('Owner/Main contract', '').strip()
        if owner:
            payload['client_name_raw'] = owner

        role = sp.get('Pzone Role', '').strip()
        if role:
            payload['pzone_role'] = role

        loc = sp.get('Site Location', '').strip()
        if loc and loc != '0.0000, 0.0000':
            payload['site_location_address'] = loc
            parts = loc.split(',')
            if len(parts) == 2:
                try:
                    lat = float(parts[0].strip())
                    lng = float(parts[1].strip())
                    if lat != 0 and lng != 0:
                        payload['gps_lat'] = lat
                        payload['gps_lng'] = lng
                        payload['latitude'] = lat
                        payload['longitude'] = lng
                except:
                    pass

        sd_p = normalize_date(sp.get('Start date planned', ''))
        if sd_p:
            payload['planned_start_date'] = sd_p

        sd_a = normalize_date(sp.get('Start date Actual', ''))
        if sd_a:
            payload['actual_start_date'] = sd_a

        fd_p = normalize_date(sp.get('Finish Date planned', ''))
        if fd_p:
            payload['planned_finish_date'] = fd_p

        fd_a = normalize_date(sp.get('Finish Date Actual', ''))
        if fd_a:
            payload['actual_finish_date'] = fd_a

        spl = sp.get('Site possision letter', '').strip()
        if spl:
            payload['site_possession_letter'] = spl

        toc = sp.get('TOC letter', '').strip()
        if toc:
            payload['toc_letter'] = toc

        # PROTECTED: Do not touch project_manager_id, project_manager_stakeholder_id, project_manager_name_raw if not needed
        # We explicitly preserve existing PM linking!

        if code in existing:
            # UPDATE (PATCH)
            url = f"{BASE_URL}/rest/v1/pm_projects?project_code=eq.{code}"
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'apikey': SERVICE_KEY,
                    'Authorization': f'Bearer {SERVICE_KEY}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                method='PATCH'
            )
            try:
                with urllib.request.urlopen(req) as resp:
                    updated_count += 1
            except urllib.error.HTTPError as e:
                print(f"Error updating {code}: HTTP {e.code} - {e.read().decode('utf-8')}")
        else:
            # INSERT (POST)
            payload['project_code'] = code
            payload['code'] = code
            url = f"{BASE_URL}/rest/v1/pm_projects"
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'apikey': SERVICE_KEY,
                    'Authorization': f'Bearer {SERVICE_KEY}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                method='POST'
            )
            try:
                with urllib.request.urlopen(req) as resp:
                    inserted_count += 1
                    print(f"Inserted new project {code}")
            except urllib.error.HTTPError as e:
                print(f"Error inserting {code}: HTTP {e.code} - {e.read().decode('utf-8')}")

    print(f"\nFinished sync into tgqpcviqmgtdddiqvqdw:")
    print(f"  Updated: {updated_count}")
    print(f"  Inserted: {inserted_count}")

if __name__ == '__main__':
    sync_all()
