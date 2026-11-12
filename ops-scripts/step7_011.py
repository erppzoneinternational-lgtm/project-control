"""STEP 7: run 011_rls_project_tab_tables.sql AS-IS (BEGIN/COMMIT stripped by runner)."""
from sql_runner import exec_file
from db_query import q
import json

res = exec_file("../supabase/migrations/011_rls_project_tab_tables.sql")
fails = [r for r in res if not r["ok"]]
print(f"TOTAL {len(res)} stmts, FAILED {len(fails)}")
for f in fails:
    print("FAILED:", f["sql"][:300], "\nERR:", (f["error"] or "")[:300])

# verify: RLS enabled + policies on the 7 tab tables
r = q("""select c.relname, c.relrowsecurity as rls,
       (select count(*) from pg_policies p where p.schemaname='public' and p.tablename=c.relname) as policies
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in
('pm_project_team','pm_wbs_items','pm_payment_milestones','pm_project_documents','pm_change_orders','pm_invoices','pm_archive_logs')
order by 1""")
print(json.dumps(r, indent=1))

# organization_id landed on all 7?
r2 = q("""select c.table_name from information_schema.columns c
where c.table_schema='public' and c.column_name='organization_id'
and c.table_name in ('pm_project_team','pm_wbs_items','pm_payment_milestones','pm_project_documents','pm_change_orders','pm_invoices','pm_archive_logs')""")
print("tables with organization_id:", sorted(x["table_name"] for x in r2))
