"""Grant SELECT on all tables needed by stakeholders_full view to anon+authenticated."""
import sys, json, os
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db_query import q

tables = ['clients', 'vendors', 'organizations', 'stakeholders', 'project_stakeholders']

print('=== Checking current anon SELECT grants ===')
for t in tables:
    sql = "SELECT has_table_privilege('anon', 'public." + t + "', 'SELECT') AS can_select"
    r = q(sql)
    print(f'  {t}: {r}')

print('\n=== Granting SELECT to anon + authenticated ===')
for t in tables:
    sql = "GRANT SELECT ON public." + t + " TO anon, authenticated"
    r = q(sql)
    print(f'  GRANT {t}: {r}')

print('\n=== Verifying ===')
for t in tables:
    sql = "SELECT has_table_privilege('anon', 'public." + t + "', 'SELECT') AS can_select"
    r = q(sql)
    print(f'  {t}: {r}')

print('\nDone.')
