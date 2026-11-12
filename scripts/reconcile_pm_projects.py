"""
Reconcile spreadsheet data against pm_projects table.
pm_projects has different column names and status format than ongoing_projects.
Uses lowercase status values: finished, working, on_hold, cancelled, handing_over
"""
import openpyxl
import sys
import os
import re
import datetime

sys.stdout.reconfigure(encoding='utf-8')

XLSX_PATH = r"C:\Users\Hassan\Downloads\Projects (1).xlsx"

# Status mapping: Sheet value -> pm_projects value
PM_STATUS_MAP = {
    'Finished': 'finished',
    'Working': 'working',
    'Hold': 'on_hold',
    'Handing over': 'handing_over',
    'Cancelled': 'cancelled',
    'Not started': 'not_started',
}

# Sheet col -> pm_projects col
FIELD_MAP = {
    'Project Name': ('project_name', 'text'),
    'Contract Value': ('contract_value', 'numeric'),
    'V.Os Value': ('vos_value', 'numeric'),
    'Estimated Cost': ('estimated_cost', 'numeric'),
    'Estimated': ('estimated_budget', 'numeric'),
    'Contract Date': ('contract_date', 'date'),
    'Contract Duration': ('contract_duration_months', 'skip'),  # text in sheet, int in DB — skip
    'Contract Status': ('contract_status', 'text'),
    'HARD COPY status': ('hardcopy_status', 'text'),
    'Water Area (m2)': ('water_area_m2', 'numeric'),
    'Water Vol (m3)': ('water_vol_m3', 'numeric'),
    'Pzone Role': ('pzone_role', 'text'),
    'Site Location': ('site_location_address', 'text'),
    'Start date planned': ('planned_start_date', 'date'),
    'Start date Actual': ('actual_start_date', 'date'),
    'Finish Date planned': ('planned_finish_date', 'date'),
    'Finish Date Actual': ('actual_finish_date', 'date'),
    'Site possision letter': ('site_possession_letter', 'text'),
    'TOC letter': ('toc_letter', 'text'),
    'Owner/Main contract': ('client_name_raw', 'text'),
}

SKIP_VALUES = {'', 'None', 'none', 'nan', 'NaN', 'null', 'NULL'}

def normalize_date(v):
    if v is None: return None
    if isinstance(v, datetime.datetime): return v.strftime('%Y-%m-%d')
    if isinstance(v, datetime.date): return v.strftime('%Y-%m-%d')
    s = str(v).strip().split(' ')[0]
    if not s or s in SKIP_VALUES: return None
    if re.match(r'^\d{4}-\d{2}-\d{2}$', s): return s
    m = re.match(r'^(\d{2})-(\d{2})-(\d{4})$', s)
    if m: return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    m = re.match(r'^(\d{2})/(\d{2})/(\d{4})$', s)
    if m: return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    return None

def normalize_numeric(v):
    if v is None: return None
    if isinstance(v, (int, float)): return str(v)
    s = str(v).strip().replace(',', '')
    if s in SKIP_VALUES: return None
    # Skip text values like 'Not Available', 'Available'
    try:
        n = float(s)
        return str(int(n)) if n == int(n) else str(n)
    except:
        return None

def sql_escape(v):
    if v is None: return 'NULL'
    s = str(v).replace("'", "''")
    return f"'{s}'"

def parse_xlsx():
    wb = openpyxl.load_workbook(XLSX_PATH, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    header = [str(h).strip() if h else '' for h in rows[0]]
    projects = []
    for row in rows[1:]:
        if not row[1] or not str(row[1]).strip(): continue
        d = {}
        for i, h in enumerate(header):
            if i < len(row): d[h] = row[i]
        projects.append(d)
    wb.close()
    return projects

def main():
    sheet_projects = parse_xlsx()
    print(f"Parsed {len(sheet_projects)} projects from XLSX")
    
    all_sql = []
    
    for sp in sheet_projects:
        code = str(sp.get('Project Code', '')).strip()
        if not code: continue
        
        updates = []
        
        # Status (special mapping)
        sheet_status = str(sp.get('Status', '')).strip()
        if sheet_status in PM_STATUS_MAP:
            updates.append(f"status = '{PM_STATUS_MAP[sheet_status]}'")
        
        for sheet_col, (db_col, col_type) in FIELD_MAP.items():
            if col_type == 'skip': continue
            raw = sp.get(sheet_col)
            if raw is None: continue
            
            if col_type == 'date':
                val = normalize_date(raw)
                if val: updates.append(f"{db_col} = {sql_escape(val)}")
            elif col_type == 'numeric':
                val = normalize_numeric(raw)
                if val is not None: updates.append(f"{db_col} = {val}")
            else:
                val = str(raw).strip()
                if val and val not in SKIP_VALUES and val != '0.0000, 0.0000':
                    updates.append(f"{db_col} = {sql_escape(val)}")
        
        # GPS from site_location
        site_loc = sp.get('Site Location')
        if site_loc:
            loc_str = str(site_loc).strip()
            if loc_str and loc_str != '0.0000, 0.0000':
                parts = loc_str.split(',')
                if len(parts) == 2:
                    try:
                        lat = float(parts[0].strip())
                        lng = float(parts[1].strip())
                        if lat != 0 and lng != 0:
                            updates.append(f"gps_lat = {lat}")
                            updates.append(f"gps_lng = {lng}")
                    except:
                        pass
        
        if updates:
            set_clause = ', '.join(updates)
            sql = f"UPDATE pm_projects SET {set_clause}, updated_at = NOW() WHERE project_code = '{code}' AND deleted_at IS NULL;"
            all_sql.append(sql)
    
    print(f"Generated {len(all_sql)} UPDATE statements for pm_projects")
    
    # Split into batches
    batch_size = 12
    for i in range(0, len(all_sql), batch_size):
        batch = all_sql[i:i+batch_size]
        path = os.path.join(os.path.dirname(__file__), f'pm_batch_{i//batch_size + 1}.sql')
        with open(path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(batch))
        print(f"  Batch {i//batch_size + 1}: {len(batch)} statements -> {path}")

if __name__ == "__main__":
    main()
