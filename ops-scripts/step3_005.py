"""Build ADAPTED 005_auth_rbac_schema.sql:
- drop the public.profiles table+policies block (profiles exists w/ different columns)
- drop the public.user_roles table+policies block (user_roles is a VIEW - keep it)
- adapt handle_new_user to live profiles columns (full_name_ar instead of full_name)
- keep contract_module_access + RLS + admin policies + seed
- keep handle_new_user function + on_auth_user_created trigger
"""
from sql_runner import split_sql
from db_query import q
import json

MIG = "../supabase/migrations/005_auth_rbac_schema.sql"
with open(MIG, encoding="utf-8") as fh:
    src = fh.read()

ADAPTED = """-- ADAPTED 005_auth_rbac_schema.sql (canonical-generation alignment)
-- Changes vs original:
--  * REMOVED: CREATE TABLE public.profiles + its RLS policies (table exists; live columns differ)
--  * REMOVED: CREATE TABLE public.user_roles + its policies ('user_roles' is an existing VIEW over profiles.roles - untouched)
--  * ADAPTED: handle_new_user() writes full_name_ar (live profiles column) instead of full_name
--  * KEPT: contract_module_access table + RLS + admin policies + seed INSERT ON CONFLICT DO NOTHING
--  * KEPT: handle_new_user function + on_auth_user_created trigger

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name_ar)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.contract_module_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_path TEXT NOT NULL UNIQUE,
  module_label TEXT,
  allowed_roles TEXT[] DEFAULT '{}',
  edit_roles TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contract_module_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view module access matrix"
  ON public.contract_module_access FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update module access matrix"
  ON public.contract_module_access FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

INSERT INTO public.contract_module_access (module_path, module_label, allowed_roles, edit_roles)
VALUES
  ('/', 'Home / Progress', ARRAY['all'], ARRAY['admin', 'project_manager']),
  ('/projects', 'Project Setup', ARRAY['project_manager', 'ceo', 'coo', 'chairman', 'contract_admin'], ARRAY['project_manager', 'commercial_manager']),
  ('/ipc-management', 'IPC Management', ARRAY['finance', 'cost_control', 'contract_admin', 'ipc_clerk', 'ceo', 'coo', 'chairman', 'project_manager'], ARRAY['ipc_clerk', 'contract_admin', 'project_manager', 'commercial_manager']),
  ('/collections', 'Collections', ARRAY['finance', 'ceo', 'coo', 'chairman', 'cost_control'], ARRAY['finance']),
  ('/budget', 'Budget', ARRAY['cost_control', 'estimator', 'finance', 'ceo', 'coo', 'chairman'], ARRAY['cost_control', 'estimator', 'commercial_manager']),
  ('/stakeholders', 'Stakeholders', ARRAY['project_manager', 'contract_admin', 'ceo', 'coo', 'chairman', 'commercial_manager'], ARRAY['project_manager', 'contract_admin', 'commercial_manager']),
  ('/user-management', 'User & RACI Admin', ARRAY['admin', 'ceo', 'chairman'], ARRAY['admin'])
ON CONFLICT (module_path) DO NOTHING;
"""

with open("tmp_adapted/005_auth_rbac.adapted.sql", "w", encoding="utf-8") as fh:
    fh.write(ADAPTED)

# sanity: original file must not be modified
with open(MIG, encoding="utf-8") as fh:
    assert fh.read() == src, "original modified!"
print("adapted file written")

# execute statement-by-statement
stmts = [s for s in split_sql(ADAPTED)]
print(f"{len(stmts)} statements")
for i, st in enumerate(stmts, 1):
    r = q(st)
    ok = not (isinstance(r, list) and r and isinstance(r[0], dict) and "error" in r[0])
    print(f"[{i}] {'OK' if ok else 'ERR ' + json.dumps(r)[:300]}")

# verify signature objects
v = q("select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal")
print("TRIGGERS on auth.users:", v)
t = q("select column_name from information_schema.columns where table_schema='public' and table_name='contract_module_access' order by ordinal_position")
print("contract_module_access cols:", [x["column_name"] for x in t])
c = q("select count(*) from public.contract_module_access")
print("seed rows:", c)
p = q("select policyname from pg_policies where schemaname='public' and tablename='contract_module_access'")
print("policies:", p)
f = q("select prosrc from pg_proc where proname='handle_new_user'")
print("handle_new_user uses full_name_ar:", "full_name_ar" in (f[0]["prosrc"] if f else ""))
