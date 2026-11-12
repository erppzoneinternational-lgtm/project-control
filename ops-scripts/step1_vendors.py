"""PRE-STEP: create public.vendors + RLS + allow-all policies + grants (pattern of 002)."""
import json
from db_query import q

SQL = """
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to vendors" ON public.vendors;
DROP POLICY IF EXISTS "Allow service_role access to vendors" ON public.vendors;
DROP POLICY IF EXISTS "Allow anon access to vendors" ON public.vendors;
CREATE POLICY "Allow authenticated access to vendors" ON public.vendors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role access to vendors" ON public.vendors FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access to vendors" ON public.vendors FOR ALL TO anon USING (true) WITH CHECK (true);
GRANT ALL ON public.vendors TO authenticated, service_role, anon;
"""

for i, stmt in enumerate([s.strip() for s in SQL.split(";") if s.strip()], 1):
    r = q(stmt)
    ok = not (isinstance(r, list) and r and isinstance(r[0], dict) and "error" in r[0])
    print(f"stmt {i}: {'OK' if ok else 'ERR: ' + json.dumps(r)[:300]}")

# verify
v = q("select column_name, data_type from information_schema.columns where table_schema='public' and table_name='vendors' order by ordinal_position")
print("VENDORS COLS:", ", ".join(c["column_name"] for c in v))
p = q("select policyname, roles from pg_policies where schemaname='public' and tablename='vendors'")
print("POLICIES:", p)
g = q("select privilege_type from information_schema.role_table_grants where table_schema='public' and table_name='vendors' and grantee in ('authenticated','service_role','anon') group by 1 order by 1")
print("GRANTS:", [x["privilege_type"] for x in g])
