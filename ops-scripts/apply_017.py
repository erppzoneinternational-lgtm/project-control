"""Apply migration 017 statement-by-statement with $$-aware splitting."""
import re
import sys

sys.path.insert(0, r"D:/ERP/Project/Pzone Prortal/Project Management/2. Post Contract/1. Project Setup/1. Project/pzone-project-setup/ops-scripts")
from db_query import q

sql = open(r"D:/ERP/Project/Pzone Prortal/Project Management/2. Post Contract/1. Project Setup/1. Project/pzone-project-setup/supabase/migrations/017_site_tasks.sql", encoding="utf-8").read()
body = sql.split("BEGIN;", 1)[1].rsplit("COMMIT;", 1)[0]

# $$-aware statement splitter
stmts = []
buf = []
depth = 0
for line in body.splitlines():
    buf.append(line)
    depth += line.count("$$") 
    if depth % 2 == 0 and line.rstrip().endswith(";"):
        stmts.append("\n".join(buf).strip())
        buf = []
        depth = 0
if buf and "\n".join(buf).strip():
    stmts.append("\n".join(buf).strip())

stmts = [s for s in stmts if s and not all(l.strip().startswith("--") or not l.strip() for l in s.splitlines())]
print(f"{len(stmts)} statements")

fails = 0
for i, s in enumerate(stmts, 1):
    first = next((l.strip() for l in s.splitlines() if l.strip() and not l.strip().startswith("--")), s[:60])
    r = q(s)
    err = r and isinstance(r[0], dict) and ("error" in r[0] or "message" in r[0])
    if err:
        fails += 1
        print(f"[{i}] ERR: {str(r[0])[:200]}  | {first[:60]}")
    else:
        print(f"[{i}] OK | {first[:70]}")

print(f"\nDONE — fails: {fails}")
print(q("SELECT to_regclass('public.pm_site_tasks') AS t;"))
