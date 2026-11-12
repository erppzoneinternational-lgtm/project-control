"""Check live DB state for stakeholders page."""
import sys, json, os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db_query import q

sep = '\n' + '='*60 + '\n'

# 1. stakeholders_full view columns
print(sep + '1. stakeholders_full view columns')
rows = q("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stakeholders_full' ORDER BY ordinal_position")
print(json.dumps(rows, ensure_ascii=False, indent=2))

# 2. stakeholders base table columns
print(sep + '2. stakeholders table columns')
rows = q("SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'stakeholders' ORDER BY ordinal_position")
print(json.dumps(rows, ensure_ascii=False, indent=2))

# 3. project_stakeholders columns
print(sep + '3. project_stakeholders columns')
rows = q("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'project_stakeholders' ORDER BY ordinal_position")
print(json.dumps(rows, ensure_ascii=False, indent=2))

# 4. Sample stakeholders_full data (5 rows) - only safe ascii columns
print(sep + '4. Sample stakeholders_full (5 rows)')
rows = q("SELECT id, name, job_title, stakeholder_kind, organization_name, is_active, assigned_projects_count, employee_code, email, phone FROM public.stakeholders_full LIMIT 5")
print(json.dumps(rows, ensure_ascii=False, indent=2))

# 5. Count by kind
print(sep + '5. Count by stakeholder_kind')
rows = q("SELECT stakeholder_kind, COUNT(*) AS cnt FROM public.stakeholders GROUP BY stakeholder_kind ORDER BY cnt DESC")
print(json.dumps(rows, ensure_ascii=False, indent=2))

# 6. organizations table
print(sep + '6. organizations table')
rows = q("SELECT id, name, code, org_type FROM public.organizations LIMIT 5")
print(json.dumps(rows, ensure_ascii=False, indent=2))

# 7. RLS on stakeholders
print(sep + '7. RLS policies on stakeholders')
rows = q("SELECT policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stakeholders'")
print(json.dumps(rows, ensure_ascii=False, indent=2))

# 8. RLS on project_stakeholders
print(sep + '8. RLS policies on project_stakeholders')
rows = q("SELECT policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_stakeholders'")
print(json.dumps(rows, ensure_ascii=False, indent=2))

# 9. Grants on views
print(sep + '9. Grants on stakeholders_full view')
rows = q("SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name='stakeholders_full'")
print(json.dumps(rows, ensure_ascii=False, indent=2))

# 10. Total stakeholders count
print(sep + '10. Total stakeholders count')
rows = q("SELECT COUNT(*) AS total FROM public.stakeholders")
print(json.dumps(rows, ensure_ascii=False, indent=2))

# 11. stakeholders_full view is security_invoker?
print(sep + '11. View security options')
rows = q("SELECT viewname, definition FROM pg_views WHERE schemaname='public' AND viewname='stakeholders_full'")
if rows:
    defn = rows[0].get('definition', '')
    print('security_invoker present:', 'security_invoker' in defn.lower())
    print(json.dumps([{'viewname': rows[0].get('viewname'), 'has_security_invoker': 'security_invoker' in defn.lower()}], indent=2))

# 12. Check stakeholders_full grants to anon
print(sep + '12. anon can SELECT stakeholders_full?')
rows = q("SELECT has_table_privilege('anon', 'public.stakeholders_full', 'SELECT') AS can_select")
print(json.dumps(rows, ensure_ascii=False, indent=2))
