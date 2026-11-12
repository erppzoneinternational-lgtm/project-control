"""Survey live DB objects: tables, views, columns of key tables."""
import json
from db_query import q

def rows(sql):
    r = q(sql)
    if isinstance(r, list) and len(r) == 1 and isinstance(r[0], dict) and "error" in r[0]:
        print("SQL ERROR:", r[0]["error"])
        return []
    return r

tables = rows("""
select table_schema, table_name, table_type
from information_schema.tables
where table_schema not in ('pg_catalog','information_schema')
  and table_schema not like 'pg_toast%'
order by table_schema, table_name
""")
print("=== TABLES/VIEWS ===")
for t in tables:
    print(f"{t['table_schema']}.{t['table_name']} ({t['table_type']})")

print("\n=== public.projects columns ===")
cols = rows("""select column_name, data_type, is_nullable from information_schema.columns
where table_schema='public' and table_name='projects' order by ordinal_position""")
print(", ".join(c["column_name"] for c in cols))

print("\n=== stakeholders columns ===")
cols = rows("""select column_name, data_type from information_schema.columns
where table_schema='public' and table_name='stakeholders' order by ordinal_position""")
print(", ".join(f"{c['column_name']}:{c['data_type']}" for c in cols))

print("\n=== schemas ===")
print(rows("select schema_name from information_schema.schemata where schema_name not in ('pg_catalog','information_schema') order by 1"))
