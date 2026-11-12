"""COLUMN RECONCILIATION PASS: dump live columns for every app-facing table,
compare against expectations (012 defs / src types / services), apply additive fixes only."""
import json
from db_query import q

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
    # legacy-generation tables also reconciled against 012 defs:
    "pm_boq_items", "pm_boq_sections", "pm_boq_revisions", "pm_project_activities",
    "pm_progress_allocations", "pm_activity_library", "pm_activity_boq_links",
    "pm_weekly_reports", "pm_zones", "pm_user_project_access", "projects",
]

cols = {}
missing_tables = []
for t in TABLES:
    r = q("select column_name from information_schema.columns where table_schema='public' and table_name='%s' order by ordinal_position" % t)
    if not r or (isinstance(r[0], dict) and ("error" in r[0] or "message" in r[0])):
        missing_tables.append(t)
        continue
    cols[t] = [c["column_name"] for c in r]

print("MISSING TABLES:", missing_tables or "none")

# ---- required-column expectations gathered from src/types/index.ts + src/lib/services ----
EXPECTATIONS = {
    # from ChangeOrder interface + projectTabs.service.ts writes
    "pm_change_orders": ["id", "project_id", "vo_number", "title_ar", "amount_egp", "time_extension_days",
                         "status", "approval_status", "approval_date", "created_at"],
    # from ProjectInvoice
    "pm_invoices": ["id", "project_id", "ipc_number", "claimed_amount", "approved_amount", "submission_date", "status", "created_at"],
    # from ProjectSubcontractor (via compat view over pm.project_subcontractors - same cols)
    "pm_project_team": ["id", "project_id", "stakeholder_id", "person_name", "role_category",
                        "role_title_ar", "role_title_en", "role_sub_type", "phone", "email", "notes", "created_at"],
    "pm_wbs_items": ["id", "project_id", "wbs_code", "title_ar", "description", "weight_percentage", "status", "created_at"],
    "pm_payment_milestones": ["id", "project_id", "milestone_name_ar", "percentage", "amount_egp", "due_date", "status", "created_at"],
    "pm_project_documents": ["id", "project_id", "document_type", "title_ar", "file_path", "issue_date", "notes", "created_at"],
    "projects": ["id", "code", "name_ar", "client_id", "status", "planned_start", "planned_finish",
                 "actual_start", "actual_finish", "location", "description", "contract_type",
                 "contract_value", "completion_pct", "created_by", "created_at", "updated_at"],
}

gaps = {}
for t, req in EXPECTATIONS.items():
    have = set(cols.get(t, []))
    miss = [c for c in req if c not in have]
    if miss:
        gaps[t] = miss

print("\nGAPS vs app expectations:")
print(json.dumps(gaps, indent=1) if gaps else "  none")

# ---- apply additive fixes ----
FIXES = [
    ("public.pm_change_orders", "time_extension_days", "INT DEFAULT 0"),
    ("public.pm_change_orders", "approval_status", "TEXT"),
    ("public.pm_change_orders", "organization_id",
     "UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.organizations(id)"),
    ("public.pm_invoices", "organization_id",
     "UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.organizations(id)"),
]
# role_sub_type on pm_project_team (002's ALTER ran before the table existed)
if "role_sub_type" in gaps.get("pm_project_team", []):
    FIXES.insert(0, ("public.pm_project_team", "role_sub_type", "TEXT"))

applied, failed = 0, []
for tbl, col, definition in FIXES:
    stmt = f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS {col} {definition}"
    r = q(stmt)
    if isinstance(r, list) and r and isinstance(r[0], dict) and ("error" in r[0] or "message" in r[0]):
        failed.append((stmt, json.dumps(r)[:200]))
        print("ERR:", stmt[:110], "->", json.dumps(r)[:180])
    else:
        applied += 1
print(f"\nreconciliation fixes applied: {applied}/{len(FIXES)}, failures: {len(failed)}")

# ---- verify all expectation tables now clean ----
print("\nPOST-FIX VERIFICATION:")
all_ok = True
for t, req in EXPECTATIONS.items():
    r = q("select column_name from information_schema.columns where table_schema='public' and table_name='%s'" % t)
    have = {c["column_name"] for c in r}
    miss = [c for c in req if c not in have]
    if miss:
        all_ok = False
        print(f"  STILL MISSING {t}: {miss}")
print("  ALL EXPECTED COLUMNS PRESENT" if all_ok else "  GAPS REMAIN")

# ---- enum check on pm_user_project_access.access_level ----
r = q("""select t.typname, string_agg(e.enumlabel, ',' order by e.enumsortorder) as labels
from pg_type t join pg_enum e on e.enumtypid=t.oid
where t.typname='project_access_level' group by 1""")
print("\naccess_level enum:", r)
r2 = q("select column_name, udt_name from information_schema.columns where table_name='pm_user_project_access' and column_name='access_level'")
print("column type:", r2)

# ---- row counts of newly created tables ----
NEW = ["vendors", "organizations", "project_stakeholders", "contract_module_access",
       "pm_cost_codes", "pm_boq_sub_materials", "pm_boq_milestone_steps", "pm_activity_dependencies",
       "pm_schedule_versions", "pm_activity_calendar_exceptions", "pm_daily_progress",
       "pm_daily_progress_lines", "pm_daily_progress_photos", "pm_daily_manpower_logs",
       "pm_daily_equipment_logs", "pm_deliverables", "pm_deliverable_items",
       "pm_deliverable_attachments", "pm_deliverable_events", "pm_deliverable_dependencies",
       "pm_rfi_register", "pm_daily_obstructions", "pm_material_transactions",
       "pm_material_allocations", "pm_mos_entries", "pm_subcontractor_targets",
       "pm_commercial_settings", "pm_approval_delegations", "pm_holds", "pm_scurve_cache"]
print("\nROW COUNTS (new tables):")
counts = {}
for t in NEW:
    r = q(f"select count(*) as n from public.{t}")
    n = r[0]["n"] if r and isinstance(r[0], dict) and "n" in r[0] else "ERR"
    counts[t] = n
print(json.dumps(counts, indent=1))
with open("row_counts.json", "w") as fh:
    json.dump(counts, fh, indent=1)
