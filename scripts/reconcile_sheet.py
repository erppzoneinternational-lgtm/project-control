"""
Reconcile spreadsheet data against ongoing_projects via Supabase MCP.
Output: clean SQL statements ready for execute_sql.
Handles date normalization and type safety.
"""
import openpyxl
import sys
import os
import re
import datetime

sys.stdout.reconfigure(encoding='utf-8')

XLSX_PATH = r"C:\Users\Hassan\Downloads\Projects (1).xlsx"

# Sheet col -> DB col
FIELD_MAP = {
    'Project Name': ('project_name', 'text'),
    'Status': ('status', 'text'),
    'Contract Value': ('contract_value', 'numeric'),
    'V.Os Value': ('vos_value', 'numeric'),
    'Estimated Cost': ('estimated_cost', 'numeric'),
    'Contract Date': ('contract_date', 'date'),
    'Contract Duration': ('contract_duration', 'text'),
    'Contract Status': ('contract_status', 'text'),
    'HARD COPY status': ('hardcopy_status', 'text'),
    'Water Area (m2)': ('water_area_m2', 'numeric'),
    'Water Vol (m3)': ('water_vol_m3', 'numeric'),
    'Owner/Main contract': ('owner_main_contract', 'text'),
    'Pzone Role': ('pzone_role', 'text'),
    'Site Location': ('site_location', 'text'),
    'Start date planned': ('start_date_planned', 'date'),
    'Start date Actual': ('start_date_actual', 'date'),
    'Finish Date planned': ('finish_date_planned', 'date'),
    'Finish Date Actual': ('finish_date_actual', 'date'),
    'Status of Estimated Cost Sheet': ('status_cost_sheet', 'text'),
    'Status of time schedule': ('status_time_schedule', 'text'),
    'Remark': ('remark', 'text'),
    'Site possision letter': ('site_position_letter', 'text'),
    'TOC letter': ('toc_letter', 'text'),
    'invoices link': ('invoices_link', 'text'),
    'Project Area': ('zone', 'text'),
}

SKIP_VALUES = {'', 'None', 'none', 'nan', 'NaN', 'null', 'NULL'}

def normalize_date(v):
    """Convert any date format to YYYY-MM-DD."""
    if v is None:
        return None
    if isinstance(v, datetime.datetime):
        return v.strftime('%Y-%m-%d')
    if isinstance(v, datetime.date):
        return v.strftime('%Y-%m-%d')
    s = str(v).strip().split(' ')[0]  # Drop time part
    if not s or s in SKIP_VALUES:
        return None
    # Try ISO format YYYY-MM-DD
    if re.match(r'^\d{4}-\d{2}-\d{2}$', s):
        return s
    # Try DD-MM-YYYY
    m = re.match(r'^(\d{2})-(\d{2})-(\d{4})$', s)
    if m:
        return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    # Try DD/MM/YYYY
    m = re.match(r'^(\d{2})/(\d{2})/(\d{4})$', s)
    if m:
        return f"{m.group(3)}-{m.group(2)}-{m.group(1)}"
    return None

def normalize_numeric(v):
    """Clean numeric value."""
    if v is None:
        return None
    if isinstance(v, (int, float)):
        return str(v) if v != 0 or True else None  # keep 0
    s = str(v).strip().replace(',', '')
    if s in SKIP_VALUES:
        return None
    try:
        n = float(s)
        return str(int(n)) if n == int(n) else str(n)
    except:
        return None

def sql_escape(v):
    if v is None:
        return 'NULL'
    s = str(v).replace("'", "''")
    return f"'{s}'"

def parse_xlsx():
    wb = openpyxl.load_workbook(XLSX_PATH, read_only=True, data_only=True)
    ws = wb.active
    rows = list(ws.iter_rows(values_only=True))
    header = [str(h).strip() if h else '' for h in rows[0]]
    
    projects = []
    for row in rows[1:]:
        if not row[1] or not str(row[1]).strip():
            continue
        d = {}
        for i, h in enumerate(header):
            if i < len(row):
                d[h] = row[i]
        projects.append(d)
    wb.close()
    return projects

def main():
    sheet_projects = parse_xlsx()
    print(f"Parsed {len(sheet_projects)} projects from XLSX")
    
    # Build SQL for each project
    all_sql = []
    
    for sp in sheet_projects:
        code = str(sp.get('Project Code', '')).strip()
        if not code:
            continue
        
        updates = []
        for sheet_col, (db_col, col_type) in FIELD_MAP.items():
            raw = sp.get(sheet_col)
            if raw is None:
                continue
            
            if col_type == 'date':
                val = normalize_date(raw)
                if val:
                    updates.append(f"{db_col} = {sql_escape(val)}")
            elif col_type == 'numeric':
                val = normalize_numeric(raw)
                if val is not None:
                    updates.append(f"{db_col} = {val}")
            else:
                val = str(raw).strip()
                if val and val not in SKIP_VALUES and val != '0.0000, 0.0000':
                    updates.append(f"{db_col} = {sql_escape(val)}")
        
        # Also set client_name from owner
        owner = sp.get('Owner/Main contract')
        if owner and str(owner).strip():
            updates.append(f"client_name = {sql_escape(str(owner).strip())}")
        
        if updates:
            set_clause = ', '.join(updates)
            sql = f"UPDATE ongoing_projects SET {set_clause}, updated_at = NOW() WHERE project_code = '{code}';"
            all_sql.append(sql)
    
    print(f"Generated {len(all_sql)} UPDATE statements")
    
    # Write to file
    out_path = os.path.join(os.path.dirname(__file__), 'reconcile_clean.sql')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('BEGIN;\n\n')
        for sql in all_sql:
            f.write(sql + '\n')
        f.write('\nCOMMIT;\n')
    
    print(f"Written to {out_path}")
    
    # Also output as single combined statement for Supabase MCP execution
    combined = 'BEGIN;\n' + '\n'.join(all_sql) + '\nCOMMIT;'
    combined_path = os.path.join(os.path.dirname(__file__), 'reconcile_combined.sql')
    with open(combined_path, 'w', encoding='utf-8') as f:
        f.write(combined)
    print(f"Combined SQL: {combined_path}")
    print(f"Combined length: {len(combined)} chars")

if __name__ == "__main__":
    main()
