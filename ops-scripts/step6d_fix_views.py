"""Re-apply the 4 remaining 012 objects: idx_alloc_line index + 3 views (v_daily_progress_summary,
v_commercial_summary, v_scurve_actual) - extracted from adapted file by content match."""
from sql_runner import split_sql, run_statement

with open("tmp_adapted/012_planning_module.adapted.sql", encoding="utf-8") as fh:
    stmts = [s for s in split_sql(fh.read())]

targets = [
    lambda s: "CREATE INDEX IF NOT EXISTS idx_alloc_line" in s,
    lambda s: "CREATE OR REPLACE VIEW public.v_daily_progress_summary" in s,
    lambda s: "CREATE OR REPLACE VIEW public.v_commercial_summary" in s,
    lambda s: "CREATE OR REPLACE VIEW public.v_scurve_actual" in s,
]
for match in targets:
    hits = [s for s in stmts if match(s)]
    if not hits:
        print("NOT FOUND for matcher", match)
        continue
    res = run_statement(hits[0])
    print("OK " if res["ok"] else "ERR", " ".join(hits[0].split())[:90])
    if not res["ok"]:
        print("  ERR:", (res["error"] or "")[:300])

# verify
from db_query import q
r = q("select table_name from information_schema.views where table_schema='public' and table_name in ('v_daily_progress_summary','v_commercial_summary','v_scurve_actual')")
print("now present:", sorted(x["table_name"] for x in r))
r2 = q("select indexname from pg_indexes where schemaname='public' and indexname='idx_alloc_line'")
print("index:", r2)

# smoke-test each 012 view actually queries
for v in ["v_boq_with_actuals","v_boq_current","v_activity_evm","v_activity_progress",
          "v_daily_progress_summary","v_daily_log","v_deliverables_kanban",
          "v_commercial_summary","v_procurement_bom_status","v_scurve_actual"]:
    rr = q(f"select count(*) from public.{v}")
    err = isinstance(rr, list) and rr and isinstance(rr[0], dict) and ("error" in rr[0] or "message" in rr[0])
    print(v, "-> ERR" if err else "-> OK", str(rr)[:120] if err else "")
