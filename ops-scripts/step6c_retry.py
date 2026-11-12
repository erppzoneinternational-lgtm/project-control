"""Fix root cause of the 8 failures in step6b: add pm_progress_allocations.line_id (FK target now exists),
then re-run the failed statements (#55,#129,#130,#131,#132,#133,#136,#138) from the adapted file.
"""
from db_query import q
from sql_runner import run_statement, split_sql

# 1) add the column with FK
r = run_statement("ALTER TABLE public.pm_progress_allocations ADD COLUMN IF NOT EXISTS line_id UUID REFERENCES public.pm_daily_progress_lines(id) ON DELETE CASCADE")
print("add line_id:", "OK" if r["ok"] else r["error"][:300])

# 2) re-run previously-failed statements by number
with open("tmp_adapted/012_planning_module.adapted.sql", encoding="utf-8") as fh:
    stmts = [s for s in split_sql(fh.read())]

RETRY = [55, 129, 130, 131, 132, 133, 136, 138]
still_failed = []
for no in RETRY:
    res = run_statement(stmts[no - 1])
    head = " ".join(stmts[no - 1].split())[:80]
    print(f"retry #{no}: {'OK ' if res['ok'] else 'ERR'} {head}")
    if not res["ok"]:
        still_failed.append((no, stmts[no - 1], res["error"]))
        print("   ERR:", (res["error"] or "")[:300])

print("still failed:", len(still_failed))

# 3) retry index #55 once more if it was among failures (dependency order safe now)
