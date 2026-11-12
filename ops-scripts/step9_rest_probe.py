"""FINAL VERIFICATION: probe every app-facing table via PostgREST with service_role key.
Reads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.local (same file db_query.py uses).
Prints an HTTP-code table and writes rest_probe_results.json.
"""
import json
import subprocess

def env_key(name):
    with open(os.path.join("..", ".env.local"), encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line.startswith(name + "="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise RuntimeError(name + " not found")

import os
REF = "tgqpcviqmgtdddiqvqdw"  # same ref as db_query.py
URL = f"https://{REF}.supabase.co"
KEY = env_key("SUPABASE_SERVICE_ROLE_KEY")

TABLES = [
    "pm_change_orders", "pm_invoices", "pm_payment_milestones", "pm_project_documents",
    "pm_project_team", "pm_wbs_items", "pm_archive_logs",
    "pm_project_client_contacts", "pm_project_site_resources", "pm_project_subcontractors",
    "pm_cost_codes", "pm_boq_sub_materials", "pm_boq_milestone_steps",
    "pm_activity_dependencies", "pm_schedule_versions", "pm_activity_calendar_exceptions",
    "pm_daily_progress", "pm_daily_progress_lines", "pm_daily_progress_photos",
    "pm_daily_manpower_logs", "pm_daily_equipment_logs",
    "pm_deliverables", "pm_deliverable_items", "pm_deliverable_attachments", "pm_deliverable_events",
    "pm_rfi_register", "pm_daily_obstructions", "pm_mos_entries", "pm_material_transactions",
    "pm_subcontractor_targets", "pm_commercial_settings", "pm_approval_delegations",
    "pm_holds", "pm_scurve_cache",
    "organizations", "project_stakeholders", "vendors", "contract_module_access",
]

results = []
for t in TABLES:
    try:
        p = subprocess.run(
            ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
             f"{URL}/rest/v1/{t}?select=*&limit=1",
             "-H", f"apikey: {KEY}", "-H", f"Authorization: Bearer {KEY}"],
            capture_output=True, text=True, timeout=60)
        code = p.stdout.strip()
    except Exception as e:
        code = "EXC:" + repr(e)[:60]
    results.append((t, code))
    print(f"{t:38s} {code}")

ok = sum(1 for _, c in results if c == "200")
print(f"\n== {ok}/{len(results)} returned HTTP 200 ==")
for t, c in results:
    if c != "200":
        print("NON-200:", t, c)

with open("rest_probe_results.json", "w") as fh:
    json.dump(results, fh, indent=1)
