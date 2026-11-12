"""PRE-RECONCILIATION PASS (before 012): add columns defined in 012_planning_module.sql
that legacy-generation tables lack. Additive DDL ONLY - ADD COLUMN IF NOT EXISTS.
NOT NULL only where 012 defines a DEFAULT (uniform fill). FK clauses kept where target exists.
CHECK constraints intentionally skipped on added columns (documented in report).
"""
import json
from db_query import q

def run(stmt):
    r = q(stmt)
    ok = not (isinstance(r, list) and r and isinstance(r[0], dict) and "error" in r[0])
    return ok, r

# canonical projects needs completion_pct (used by 012 fn_recalc_activity + src/lib/services/project.payload.ts)
ADDS = [
    # (table, column, definition)
    ("public.projects", "completion_pct", "NUMERIC(5,2)"),
    # --- legacy pm_boq_items vs 012 def ---
    ("public.pm_boq_items", "is_current", "BOOLEAN NOT NULL DEFAULT true"),
    ("public.pm_boq_items", "superseded_at", "TIMESTAMPTZ"),
    # --- legacy pm_boq_revisions vs 012 def ---
    ("public.pm_boq_revisions", "project_id", "UUID REFERENCES public.projects(id) ON DELETE CASCADE"),
    ("public.pm_boq_revisions", "revision_no", "INT"),
    # --- legacy pm_activity_library vs 012 def ---
    ("public.pm_activity_library", "activity_code", "TEXT"),
    ("public.pm_activity_library", "library_code", "TEXT"),
    ("public.pm_activity_library", "default_unit", "TEXT"),
    # --- legacy pm_project_activities vs 012 def ---
    ("public.pm_project_activities", "library_code", "TEXT"),
    ("public.pm_project_activities", "activity_code", "TEXT"),
    ("public.pm_project_activities", "discipline", "TEXT"),
    ("public.pm_project_activities", "duration_days", "INT NOT NULL DEFAULT 1"),
    ("public.pm_project_activities", "budgeted_cost_egp", "NUMERIC(15,2) NOT NULL DEFAULT 0.00"),
    ("public.pm_project_activities", "weight_pct", "NUMERIC(6,3)"),
    ("public.pm_project_activities", "boq_link_mode", "TEXT NOT NULL DEFAULT 'by_items'"),
    ("public.pm_project_activities", "is_milestone", "BOOLEAN NOT NULL DEFAULT false"),
    ("public.pm_project_activities", "is_critical", "BOOLEAN NOT NULL DEFAULT false"),
    ("public.pm_project_activities", "status", "TEXT NOT NULL DEFAULT 'not_started'"),
    ("public.pm_project_activities", "responsible_stakeholder_id", "UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL"),
    ("public.pm_project_activities", "is_archived", "BOOLEAN NOT NULL DEFAULT false"),
    ("public.pm_project_activities", "total_float_days", "INT DEFAULT 0"),
    ("public.pm_project_activities", "free_float_days", "INT DEFAULT 0"),
    ("public.pm_project_activities", "remaining_duration_days", "INT"),
    ("public.pm_project_activities", "expected_finish", "DATE"),
    ("public.pm_project_activities", "calendar_type", "TEXT DEFAULT 'standard_6d'"),
    ("public.pm_project_activities", "is_out_of_sequence", "BOOLEAN NOT NULL DEFAULT false"),
    ("public.pm_project_activities", "notes", "TEXT"),
    # --- legacy pm_progress_allocations vs 012 def ---
    ("public.pm_progress_allocations", "line_id", "UUID REFERENCES public.pm_daily_progress_lines(id) ON DELETE CASCADE"),
    ("public.pm_progress_allocations", "project_id", "UUID REFERENCES public.projects(id) ON DELETE CASCADE"),
    ("public.pm_progress_allocations", "source_boq_revision", "INT"),
    ("public.pm_progress_allocations", "is_suspended", "BOOLEAN NOT NULL DEFAULT false"),
    ("public.pm_progress_allocations", "suspended_at", "TIMESTAMPTZ"),
    ("public.pm_progress_allocations", "created_by", "UUID REFERENCES auth.users(id)"),
    ("public.pm_progress_allocations", "created_at", "TIMESTAMPTZ DEFAULT now()"),
    ("public.pm_progress_allocations", "updated_at", "TIMESTAMPTZ DEFAULT now()"),
    # --- legacy pm_activity_boq_links vs 012 def ---
    ("public.pm_activity_boq_links", "baseline_rate_egp", "NUMERIC(15,4) DEFAULT 0"),
    ("public.pm_activity_boq_links", "updated_at", "TIMESTAMPTZ DEFAULT now()"),
    # --- legacy pm_weekly_reports vs 012 def ---
    ("public.pm_weekly_reports", "status", "TEXT NOT NULL DEFAULT 'draft'"),
    ("public.pm_weekly_reports", "aggregates", "JSONB"),
    ("public.pm_weekly_reports", "pdf_path", "TEXT"),
    ("public.pm_weekly_reports", "xlsx_path", "TEXT"),
    ("public.pm_weekly_reports", "finalized_by", "UUID REFERENCES auth.users(id)"),
]

fails = []
applied = 0
for tbl, col, definition in ADDS:
    stmt = f"ALTER TABLE {tbl} ADD COLUMN IF NOT EXISTS {col} {definition}"
    ok, r = run(stmt)
    if ok:
        applied += 1
    else:
        fails.append((stmt, json.dumps(r)[:300]))
        print("ERR:", stmt[:120], "->", json.dumps(r)[:200])

print(f"column-add statements applied: {applied}/{len(ADDS)}, failures: {len(fails)}")

# verify
verify_sql = """
select c.table_name, c.column_name
from information_schema.columns c
where c.table_schema='public'
and (c.table_name, c.column_name) in (
 ('projects','completion_pct'),
 ('pm_boq_items','is_current'), ('pm_boq_items','superseded_at'),
 ('pm_boq_revisions','project_id'), ('pm_boq_revisions','revision_no'),
 ('pm_activity_library','activity_code'), ('pm_activity_library','library_code'), ('pm_activity_library','default_unit'),
 ('pm_project_activities','library_code'), ('pm_project_activities','activity_code'), ('pm_project_activities','discipline'),
 ('pm_project_activities','duration_days'), ('pm_project_activities','budgeted_cost_egp'), ('pm_project_activities','weight_pct'),
 ('pm_project_activities','boq_link_mode'), ('pm_project_activities','is_milestone'), ('pm_project_activities','is_critical'),
 ('pm_project_activities','status'), ('pm_project_activities','responsible_stakeholder_id'), ('pm_project_activities','is_archived'),
 ('pm_project_activities','total_float_days'), ('pm_project_activities','free_float_days'), ('pm_project_activities','remaining_duration_days'),
 ('pm_project_activities','expected_finish'), ('pm_project_activities','calendar_type'), ('pm_project_activities','is_out_of_sequence'),
 ('pm_project_activities','notes'),
 ('pm_progress_allocations','line_id'), ('pm_progress_allocations','project_id'), ('pm_progress_allocations','source_boq_revision'),
 ('pm_progress_allocations','is_suspended'), ('pm_progress_allocations','suspended_at'), ('pm_progress_allocations','created_by'),
 ('pm_progress_allocations','created_at'), ('pm_progress_allocations','updated_at'),
 ('pm_activity_boq_links','baseline_rate_egp'), ('pm_activity_boq_links','updated_at'),
 ('pm_weekly_reports','status'), ('pm_weekly_reports','aggregates'), ('pm_weekly_reports','pdf_path'),
 ('pm_weekly_reports','xlsx_path'), ('pm_weekly_reports','finalized_by')
)
order by c.table_name, c.column_name
"""
rows = q(verify_sql)
print(f"verified present: {len(rows)} / expected {len(ADDS)}")
have = {(r['table_name'], r['column_name']) for r in rows}
want = {(t.split('.')[-1], c) for t, c, _ in ADDS}
missing = want - have
print("MISSING:", sorted(missing) if missing else "none")
