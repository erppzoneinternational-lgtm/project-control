"""Build + run ADAPTED 012_planning_module.sql statement-by-statement.
Adaptations (documented per occurrence):
 1. pm.projects -> public.projects (all refs incl. inside fn_recalc_activity UPDATE + v_commercial_summary FROM)
 2. v_commercial_summary: p.project_code -> p.code AS project_code ; p.project_name -> p.name_ar AS project_name
    (canonical projects columns are code/name_ar/name_en)
 3. v_activity_evm / v_deliverables_kanban: stakeholders has no 'name' column ->
    COALESCE(s.name_en, s.name_ar) / s.name_ar (+ GROUP BY adjusted)
 4. Audit hardening block + fn_audit_progress_allocations: pm.audit_logs does not exist;
    live audit table is public.pm_audit_logs (cols ... changed_at not created_at):
    - guard literal retargeted to public.pm_audit_logs
    - all pm.audit_logs refs -> public.pm_audit_logs
    - index column created_at -> changed_at
 5. Prepends ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS completion_pct NUMERIC(5,2)
BEGIN/COMMIT stripped by runner (statement-per-statement execution).
"""
from sql_runner import exec_file
from db_query import q

with open("../supabase/migrations/012_planning_module.sql", encoding="utf-8") as fh:
    src = fh.read()

out = src
log = []

# --- specific view fixes BEFORE generic replaces ---
n = out.count("p.project_code,")
out = out.replace("p.project_code,", "p.code AS project_code,")
log.append(f"v_commercial_summary project_code: {n}")
n = out.count("p.project_name,")
out = out.replace("p.project_name,", "p.name_ar AS project_name,")
log.append(f"v_commercial_summary project_name: {n}")
n = out.count("s.name AS responsible_stakeholder_name")
out = out.replace("s.name AS responsible_stakeholder_name",
                  "COALESCE(s.name_en, s.name_ar) AS responsible_stakeholder_name")
log.append(f"v_activity_evm stakeholder name: {n}")
n = out.count("s.name AS current_holder_name,")
out = out.replace("s.name AS current_holder_name,", "s.name_ar AS current_holder_name,")
log.append(f"v_deliverables_kanban holder name: {n}")
n = out.count("GROUP BY d.id, s.name;")
out = out.replace("GROUP BY d.id, s.name;", "GROUP BY d.id, s.name_ar;")
log.append(f"kanban GROUP BY: {n}")

# --- audit guard retarget ---
guard_old = "WHERE table_schema = 'pm' AND table_name = 'audit_logs'"
guard_new = "WHERE table_schema = 'public' AND table_name = 'pm_audit_logs'"
assert guard_old in out
n = out.count(guard_old)
out = out.replace(guard_old, guard_new)
log.append(f"audit guard retarget: {n}")

# --- generic pm.projects ---
n = out.count("pm.projects")
out = out.replace("pm.projects", "public.projects")
log.append(f"pm.projects -> public.projects: {n}")

# --- pm.audit_logs -> public.pm_audit_logs ---
n = out.count("pm.audit_logs")
out = out.replace("pm.audit_logs", "public.pm_audit_logs")
log.append(f"pm.audit_logs -> public.pm_audit_logs: {n}")

# --- audit index column ---
idx_old = "(table_name, record_id, created_at DESC)"
idx_new = "(table_name, record_id, changed_at DESC)"
assert idx_old in out
out = out.replace(idx_old, idx_new)
log.append("audit index changed_at: 1")

# --- prepend completion_pct ---
header = """-- ADAPTED 012_planning_module.sql (canonical-generation alignment) - see APPLY_REPORT_20260824.md
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS completion_pct NUMERIC(5,2);

"""
out = header + out

with open("tmp_adapted/012_planning_module.adapted.sql", "w", encoding="utf-8") as fh:
    fh.write(out)

print("ADAPTATION LOG:")
for l in log:
    print(" -", l)

# leftover suspicious pm.<obj> refs?
import re
leftovers = sorted(set(re.findall(r"(?<![\w.])pm\.(?!projects\b)([a-zA-Z_][\w]*)", out)))
print("leftover pm.* refs:", leftovers)

res = exec_file("tmp_adapted/012_planning_module.adapted.sql")
fails = [r for r in res if not r["ok"]]
print(f"\nTOTAL {len(res)} stmts, FAILED {len(fails)}")
for f in fails:
    print("=" * 60)
    print(f"FAILED #{f['no']}: {f['sql'][:500]}")
    print("ERR:", (f["error"] or "")[:400])
