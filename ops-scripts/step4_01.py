"""Build + run ADAPTED 01_create_project_tabs_tables.sql.
Adaptations:
 - pm.projects -> public.projects (FK targets)
 - pm_project_team.stakeholder_id TEXT -> UUID (live stakeholders.id is uuid)
 - REMOVED trg_archive_pm_projects block: BEFORE DELETE triggers are not allowed on views;
   public.pm_projects is a VIEW whose delete path is already owned by the 009 INSTEAD OF trigger.
"""
from sql_runner import exec_file
from db_query import q
import json

with open("../supabase/migrations/01_create_project_tabs_tables.sql", encoding="utf-8") as fh:
    src = fh.read()

n1 = src.count("pm.projects")
out = src.replace("pm.projects", "public.projects")

# stakeholder_id type fix on pm_project_team
old_line = "    stakeholder_id TEXT REFERENCES public.stakeholders(id) ON DELETE SET NULL,"
new_line = "    stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,"
assert old_line in out, "stakeholder_id line not found"
out = out.replace(old_line, new_line)

# remove the pm_projects archive trigger block
block = """DROP TRIGGER IF EXISTS trg_archive_pm_projects ON public.pm_projects;
CREATE TRIGGER trg_archive_pm_projects
    BEFORE DELETE ON public.pm_projects
    FOR EACH ROW EXECUTE FUNCTION public.fn_archive_before_delete();

"""
assert block in out, "pm_projects trigger block not found"
out = out.replace(block, "")

with open("tmp_adapted/01_project_tabs.adapted.sql", "w", encoding="utf-8") as fh:
    fh.write("-- Adapted 01_create_project_tabs_tables.sql:\n--  * pm.projects -> public.projects (%d)\n--  * pm_project_team.stakeholder_id TEXT -> UUID\n--  * removed trg_archive_pm_projects (view; BEFORE DELETE not allowed)\n" % n1 + out)

res = exec_file("tmp_adapted/01_project_tabs.adapted.sql")
fails = [r for r in res if not r["ok"]]
print("FAILED:", len(fails))
for f in fails:
    print(f["sql"][:400], "\nERR:", (f["error"] or "")[:400])

for t in ["pm_project_team", "pm_wbs_items", "pm_payment_milestones", "pm_project_documents", "pm_change_orders", "pm_invoices", "pm_archive_logs"]:
    r = q("select count(*) from information_schema.tables where table_schema='public' and table_name='%s'" % t)
    print(t, "exists:", r[0]["count"] == 1)
f2 = q("select count(*) from pg_proc where proname='fn_archive_before_delete'")
print("fn_archive_before_delete:", f2)
tr = q("select tgname from pg_trigger where tgrelid='public.pm_change_orders'::regclass and not tgisinternal")
print("triggers on pm_change_orders:", tr)
