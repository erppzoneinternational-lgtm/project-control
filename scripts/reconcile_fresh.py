"""
Reconcile the FRESH CSV (PZ. Projects Dashboard) against both ongoing_projects and pm_projects.
This CSV has 77 projects up to 2611.
"""
import csv
import sys
import os
import re

sys.stdout.reconfigure(encoding='utf-8')

CSV_PATH = r"D:\ERP\Database\PZ. Projects Dashboard - Projects Details.csv"

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
    """Remove commas and spaces from numeric string."""
    if not v or v.strip() in SKIP_VALUES:
        return None
    s = v.strip().replace(',', '').replace(' ', '')
    try:
        n = float(s)
        return str(int(n)) if n == int(n) else str(n)
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

def sql_escape(v):
    if v is None: return 'NULL'
    s = str(v).replace("'", "''")
    return f"'{s}'"

def parse_csv():
    projects = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            code = row.get('Project Code', '').strip()
            if code:
                projects.append(row)
    return projects

def build_ongoing_sql(sp):
    """Build UPDATE for ongoing_projects."""
    code = sp['Project Code'].strip()
    updates = []
    
    name = sp.get('Project Name', '').strip()
    if name: updates.append(f"project_name = {sql_escape(name)}")
    
    status = sp.get('Status', '').strip()
    if status: updates.append(f"status = {sql_escape(status)}")
    
    cv = clean_numeric(sp.get('Contract Value', ''))
    if cv: updates.append(f"contract_value = {cv}")
    
    vo = clean_numeric(sp.get('V.Os Value', ''))
    if vo: updates.append(f"vos_value = {vo}")
    
    ec = clean_numeric(sp.get('Estimated Cost', ''))
    if ec: updates.append(f"estimated_cost = {ec}")
    
    cd = normalize_date(sp.get('Contract Date', ''))
    if cd: updates.append(f"contract_date = {sql_escape(cd)}")
    
    dur = sp.get('Contract Duration', '').strip()
    if dur: updates.append(f"contract_duration = {sql_escape(dur)}")
    
    cs = sp.get('Contract Status', '').strip()
    if cs: updates.append(f"contract_status = {sql_escape(cs)}")
    
    hc = sp.get('HARD COPY status', '').strip()
    if hc: updates.append(f"hardcopy_status = {sql_escape(hc)}")
    
    wa = clean_numeric(sp.get('Water Area (m2)', ''))
    if wa: updates.append(f"water_area_m2 = {wa}")
    
    wv = clean_numeric(sp.get('Water Vol (m3)', ''))
    if wv: updates.append(f"water_vol_m3 = {wv}")
    
    owner = sp.get('Owner/Main contract', '').strip()
    if owner:
        updates.append(f"owner_main_contract = {sql_escape(owner)}")
        updates.append(f"client_name = {sql_escape(owner)}")
    
    role = sp.get('Pzone Role', '').strip()
    if role: updates.append(f"pzone_role = {sql_escape(role)}")
    
    loc = sp.get('Site Location', '').strip()
    if loc and loc != '0.0000, 0.0000':
        updates.append(f"site_location = {sql_escape(loc)}")
    
    sd_p = normalize_date(sp.get('Start date planned', ''))
    if sd_p: updates.append(f"start_date_planned = {sql_escape(sd_p)}")
    
    sd_a = normalize_date(sp.get('Start date Actual', ''))
    if sd_a: updates.append(f"start_date_actual = {sql_escape(sd_a)}")
    
    fd_p = normalize_date(sp.get('Finish Date planned', ''))
    if fd_p: updates.append(f"finish_date_planned = {sql_escape(fd_p)}")
    
    fd_a = normalize_date(sp.get('Finish Date Actual', ''))
    if fd_a: updates.append(f"finish_date_actual = {sql_escape(fd_a)}")
    
    scs = sp.get('Status of Estimated Cost Sheet', '').strip()
    if scs: updates.append(f"status_cost_sheet = {sql_escape(scs)}")
    
    sts = sp.get('Status of time schedule', '').strip()
    if sts: updates.append(f"status_time_schedule = {sql_escape(sts)}")
    
    rem = sp.get('Remark', '').strip()
    if rem: updates.append(f"remark = {sql_escape(rem)}")
    
    inv = sp.get('invoices link', '').strip()
    if inv: updates.append(f"invoices_link = {sql_escape(inv)}")
    
    zone = sp.get(' Project Area', '').strip() or sp.get('Project Area', '').strip()
    if zone: updates.append(f"zone = {sql_escape(zone)}")
    
    spl = sp.get('Site possision letter', '').strip()
    if spl: updates.append(f"site_position_letter = {sql_escape(spl)}")
    
    toc = sp.get('TOC letter', '').strip()
    if toc: updates.append(f"toc_letter = {sql_escape(toc)}")
    
    if not updates: return None
    set_clause = ', '.join(updates)
    return f"UPDATE ongoing_projects SET {set_clause}, updated_at = NOW() WHERE project_code = '{code}';"

def build_pm_sql(sp):
    """Build UPDATE for pm_projects."""
    code = sp['Project Code'].strip()
    updates = []
    
    name = sp.get('Project Name', '').strip()
    if name: updates.append(f"project_name = {sql_escape(name)}")
    
    status = sp.get('Status', '').strip()
    if status and status in PM_STATUS_MAP:
        updates.append(f"status = '{PM_STATUS_MAP[status]}'")
    
    cv = clean_numeric(sp.get('Contract Value', ''))
    if cv: updates.append(f"contract_value = {cv}")
    
    vo = clean_numeric(sp.get('V.Os Value', ''))
    if vo: updates.append(f"vos_value = {vo}")
    
    ec = clean_numeric(sp.get('Estimated Cost', ''))
    if ec: updates.append(f"estimated_cost = {ec}")
    
    cd = normalize_date(sp.get('Contract Date', ''))
    if cd: updates.append(f"contract_date = {sql_escape(cd)}")
    
    cs = sp.get('Contract Status', '').strip()
    if cs: updates.append(f"contract_status = {sql_escape(cs)}")
    
    hc = sp.get('HARD COPY status', '').strip()
    if hc: updates.append(f"hardcopy_status = {sql_escape(hc)}")
    
    wa = clean_numeric(sp.get('Water Area (m2)', ''))
    if wa: updates.append(f"water_area_m2 = {wa}")
    
    wv = clean_numeric(sp.get('Water Vol (m3)', ''))
    if wv: updates.append(f"water_vol_m3 = {wv}")
    
    owner = sp.get('Owner/Main contract', '').strip()
    if owner: updates.append(f"client_name_raw = {sql_escape(owner)}")
    
    role = sp.get('Pzone Role', '').strip()
    if role: updates.append(f"pzone_role = {sql_escape(role)}")
    
    loc = sp.get('Site Location', '').strip()
    if loc and loc != '0.0000, 0.0000':
        updates.append(f"site_location_address = {sql_escape(loc)}")
        parts = loc.split(',')
        if len(parts) == 2:
            try:
                lat = float(parts[0].strip())
                lng = float(parts[1].strip())
                if lat != 0 and lng != 0:
                    updates.append(f"gps_lat = {lat}")
                    updates.append(f"gps_lng = {lng}")
            except: pass
    
    sd_p = normalize_date(sp.get('Start date planned', ''))
    if sd_p: updates.append(f"planned_start_date = {sql_escape(sd_p)}")
    
    sd_a = normalize_date(sp.get('Start date Actual', ''))
    if sd_a: updates.append(f"actual_start_date = {sql_escape(sd_a)}")
    
    fd_p = normalize_date(sp.get('Finish Date planned', ''))
    if fd_p: updates.append(f"planned_finish_date = {sql_escape(fd_p)}")
    
    fd_a = normalize_date(sp.get('Finish Date Actual', ''))
    if fd_a: updates.append(f"actual_finish_date = {sql_escape(fd_a)}")
    
    spl = sp.get('Site possision letter', '').strip()
    if spl: updates.append(f"site_possession_letter = {sql_escape(spl)}")
    
    toc = sp.get('TOC letter', '').strip()
    if toc: updates.append(f"toc_letter = {sql_escape(toc)}")
    
    if not updates: return None
    set_clause = ', '.join(updates)
    return f"UPDATE pm_projects SET {set_clause}, updated_at = NOW() WHERE project_code = '{code}' AND deleted_at IS NULL;"

def build_ongoing_insert(sp):
    """Build INSERT for new projects in ongoing_projects."""
    code = sp['Project Code'].strip()
    name = sp.get('Project Name', '').strip()
    status = sp.get('Status', '').strip()
    cv = clean_numeric(sp.get('Contract Value', ''))
    ec = clean_numeric(sp.get('Estimated Cost', ''))
    vo = clean_numeric(sp.get('V.Os Value', ''))
    cd = normalize_date(sp.get('Contract Date', ''))
    dur = sp.get('Contract Duration', '').strip()
    cs = sp.get('Contract Status', '').strip()
    hc = sp.get('HARD COPY status', '').strip()
    wa = clean_numeric(sp.get('Water Area (m2)', ''))
    wv = clean_numeric(sp.get('Water Vol (m3)', ''))
    owner = sp.get('Owner/Main contract', '').strip()
    role = sp.get('Pzone Role', '').strip()
    zone = sp.get(' Project Area', '').strip() or sp.get('Project Area', '').strip()
    scs = sp.get('Status of Estimated Cost Sheet', '').strip()
    sts = sp.get('Status of time schedule', '').strip()
    
    cols = ['project_code', 'project_name', 'status', 'contract_value', 'owner_main_contract', 'client_name', 'pzone_role', 'zone', 'contract_status', 'hardcopy_status', 'updated_at']
    vals = [sql_escape(code), sql_escape(name), sql_escape(status), cv or '0', sql_escape(owner), sql_escape(owner), sql_escape(role), sql_escape(zone), sql_escape(cs), sql_escape(hc), 'NOW()']
    
    if ec: cols.append('estimated_cost'); vals.append(ec)
    if vo: cols.append('vos_value'); vals.append(vo)
    if cd: cols.append('contract_date'); vals.append(sql_escape(cd))
    if dur: cols.append('contract_duration'); vals.append(sql_escape(dur))
    if wa: cols.append('water_area_m2'); vals.append(wa)
    if wv: cols.append('water_vol_m3'); vals.append(wv)
    if scs: cols.append('status_cost_sheet'); vals.append(sql_escape(scs))
    if sts: cols.append('status_time_schedule'); vals.append(sql_escape(sts))
    
    return f"INSERT INTO ongoing_projects ({', '.join(cols)}) VALUES ({', '.join(vals)});"

def build_pm_insert(sp):
    """Build INSERT for new projects in pm_projects."""
    code = sp['Project Code'].strip()
    name = sp.get('Project Name', '').strip()
    status = sp.get('Status', '').strip()
    pm_status = PM_STATUS_MAP.get(status, 'working')
    cv = clean_numeric(sp.get('Contract Value', ''))
    ec = clean_numeric(sp.get('Estimated Cost', ''))
    vo = clean_numeric(sp.get('V.Os Value', ''))
    cd = normalize_date(sp.get('Contract Date', ''))
    cs = sp.get('Contract Status', '').strip()
    hc = sp.get('HARD COPY status', '').strip()
    wa = clean_numeric(sp.get('Water Area (m2)', ''))
    wv = clean_numeric(sp.get('Water Vol (m3)', ''))
    owner = sp.get('Owner/Main contract', '').strip()
    role = sp.get('Pzone Role', '').strip()
    
    cols = ['id', 'project_code', 'project_name', 'status', 'contract_value', 'client_name_raw', 'pzone_role', 'contract_status', 'hardcopy_status', 'created_at', 'updated_at']
    vals = ['gen_random_uuid()', sql_escape(code), sql_escape(name), sql_escape(pm_status), cv or '0', sql_escape(owner), sql_escape(role), sql_escape(cs), sql_escape(hc), 'NOW()', 'NOW()']
    
    if ec: cols.append('estimated_cost'); vals.append(ec)
    if vo: cols.append('vos_value'); vals.append(vo)
    if cd: cols.append('contract_date'); vals.append(sql_escape(cd))
    if wa: cols.append('water_area_m2'); vals.append(wa)
    if wv: cols.append('water_vol_m3'); vals.append(wv)
    
    return f"INSERT INTO pm_projects ({', '.join(cols)}) VALUES ({', '.join(vals)});"


def main():
    projects = parse_csv()
    print(f"Parsed {len(projects)} projects from fresh CSV")
    
    # Known codes in ongoing_projects (will check via SQL later)
    # For now, 2609 is definitely new (not in either table)
    # 2610/2611 exist in pm_projects but with test data — UPDATE is fine
    
    # Projects that need INSERT into ongoing_projects
    new_ongoing = ['2609']  # 2610/2611 exist in pm_projects but not ongoing_projects
    
    all_ongoing_update = []
    all_ongoing_insert = []
    all_pm_update = []
    all_pm_insert = []
    
    for sp in projects:
        code = sp['Project Code'].strip()
        
        # ongoing_projects: UPDATE for existing, INSERT for new
        if code in new_ongoing:
            sql = build_ongoing_insert(sp)
            if sql: all_ongoing_insert.append(sql)
        else:
            sql = build_ongoing_sql(sp)
            if sql: all_ongoing_update.append(sql)
        
        # pm_projects: UPDATE for all (2609 might need INSERT if not there)
        if code == '2609':
            sql = build_pm_insert(sp)
            if sql: all_pm_insert.append(sql)
        else:
            sql = build_pm_sql(sp)
            if sql: all_pm_update.append(sql)
    
    print(f"ongoing_projects: {len(all_ongoing_update)} UPDATEs, {len(all_ongoing_insert)} INSERTs")
    print(f"pm_projects: {len(all_pm_update)} UPDATEs, {len(all_pm_insert)} INSERTs")
    
    # Write combined SQL for fresh sync
    out_dir = os.path.dirname(__file__)
    
    # Fresh ongoing updates (only for 2607+ to avoid re-updating already synced rows)
    fresh_codes = {'2607', '2608', '2609', '2610', '2611'}
    fresh_ongoing = [s for s in all_ongoing_update if any(f"project_code = '{c}'" in s for c in fresh_codes)]
    
    with open(os.path.join(out_dir, 'fresh_ongoing.sql'), 'w', encoding='utf-8') as f:
        for sql in fresh_ongoing:
            f.write(sql + '\n')
        for sql in all_ongoing_insert:
            f.write(sql + '\n')
    
    print(f"\nfresh_ongoing.sql: {len(fresh_ongoing)} updates + {len(all_ongoing_insert)} inserts")
    
    # Fresh pm updates (only 2607+)
    fresh_pm = [s for s in all_pm_update if any(f"project_code = '{c}'" in s for c in fresh_codes)]
    
    with open(os.path.join(out_dir, 'fresh_pm.sql'), 'w', encoding='utf-8') as f:
        for sql in fresh_pm:
            f.write(sql + '\n')
        for sql in all_pm_insert:
            f.write(sql + '\n')
    
    print(f"fresh_pm.sql: {len(fresh_pm)} updates + {len(all_pm_insert)} inserts")
    
    # Also: full re-sync SQL (all 77 projects) for both tables
    with open(os.path.join(out_dir, 'full_ongoing_sync.sql'), 'w', encoding='utf-8') as f:
        for sql in all_ongoing_update:
            f.write(sql + '\n')
        for sql in all_ongoing_insert:
            f.write(sql + '\n')
    
    with open(os.path.join(out_dir, 'full_pm_sync.sql'), 'w', encoding='utf-8') as f:
        for sql in all_pm_update:
            f.write(sql + '\n')
        for sql in all_pm_insert:
            f.write(sql + '\n')
    
    print(f"\nfull_ongoing_sync.sql: {len(all_ongoing_update) + len(all_ongoing_insert)} total statements")
    print(f"full_pm_sync.sql: {len(all_pm_update) + len(all_pm_insert)} total statements")

if __name__ == "__main__":
    main()
