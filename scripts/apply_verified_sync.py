"""
Apply verified synchronization to tgqpcviqmgtdddiqvqdw:
1. Sync PM columns in pm_projects from verified active project_stakeholders:
   - project_manager_id
   - project_manager_stakeholder_id
   - pm_full_name
   - project_manager_name_raw
   - pm_phone
   - pm_code
2. Clean site_location_address:
   - If site_location_address contains raw coordinates, replace with the verified human-readable area name from CSV.
   - Keep gps_lat / gps_lng / latitude / longitude untouched!
"""
import os
import urllib.request
import json
import csv
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://tgqpcviqmgtdddiqvqdw.supabase.co").strip()
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
if not SERVICE_KEY:
    raise SystemExit("ERROR: Missing required SUPABASE_SERVICE_ROLE_KEY environment variable.")

AREA_AR_MAP = {
    'north coast': 'الساحل الشمالي',
    'التجمع': 'التجمع - القاهرة الجديدة',
    'القاهرة الجديدة': 'القاهرة الجديدة',
    'العاصمة': 'العاصمة الإدارية',
    'اكتوبر': '6 أكتوبر',
    'الجونة': 'الجونة - البحر الأحمر',
    'الشروق': 'مدينة الشروق',
    'el sokhna': 'العين السخنة',
    'الأقصر': 'الأقصر',
    'الاسماعيلية': 'الإسماعيلية',
    'الزمالك': 'الزمالك - القاهرة',
    'المقطم': 'المقطم - القاهرة',
    'el mostakbl city': 'مدينة المستقبل',
}

def patch(table, filter_col, filter_val, payload):
    url = f"{BASE_URL}/rest/v1/{table}?{filter_col}=eq.{filter_val}"
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
    with urllib.request.urlopen(req) as resp:
        return resp.status

def main():
    with open('scripts/verification_audit_report.json', 'r', encoding='utf-8') as f:
        report = json.load(f)

    pm_plan = report['pm_update_plan']
    loc_plan = report['location_clean_plan']

    print(f"Applying PM synchronization for {len(pm_plan)} projects...")
    for item in pm_plan:
        code = item['code']
        payload = {
            'project_manager_id': item['to_id'],
            'project_manager_stakeholder_id': item['to_id'],
            'pm_full_name': item['to_name'],
            'project_manager_name_raw': item['to_name'],
            'updated_at': 'NOW()'
        }
        if item.get('to_phone'):
            payload['pm_phone'] = item['to_phone']
        if item.get('to_code'):
            payload['pm_code'] = item['to_code']

        patch('pm_projects', 'project_code', code, payload)
        print(f"  [OK] Project {code}: PM updated to '{item['to_name']}'")

    print(f"\nApplying location address cleanup for {len(loc_plan)} projects...")
    for item in loc_plan:
        code = item['code']
        csv_area = (item.get('csv_area') or '').strip()
        readable_area = AREA_AR_MAP.get(csv_area.lower(), csv_area) or 'مصر'

        payload = {
            'site_location_address': readable_area,
            'updated_at': 'NOW()'
        }
        patch('pm_projects', 'project_code', code, payload)
        print(f"  [OK] Project {code}: Address cleaned from '{item['current_addr']}' -> '{readable_area}'")

    print("\nSynchronization complete.")

if __name__ == '__main__':
    main()
