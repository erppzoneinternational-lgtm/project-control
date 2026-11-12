-- ============================================================
-- anon_exposure_audit.sql  — READ-ONLY. Safe to run in the Supabase SQL editor.
-- Run against the ERP project (ref in NEXT_PUBLIC_SUPABASE_URL), before AND
-- after applying 20261004100000_revoke_anon_exposure.sql.
-- Every result set should be EMPTY except where noted.
-- ============================================================

-- 1. Policies that give anon/PUBLIC an always-true rule.
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE (roles::text[] @> ARRAY['anon'] OR roles::text[] @> ARRAY['public'])
  AND (qual IS NULL OR qual = 'true' OR with_check = 'true')
  AND schemaname IN ('public', 'pm', 'storage')
ORDER BY schemaname, tablename, policyname;
-- Expected leftover: storage.objects anon_read_progress_photos (public photo bucket, decision pending).

-- 2. Tables where anon still holds INSERT/UPDATE/DELETE/TRUNCATE.
SELECT table_schema, table_name, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS anon_privileges
FROM information_schema.role_table_grants
WHERE grantee = 'anon'
  AND table_schema IN ('public', 'pm')
  AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
GROUP BY table_schema, table_name
ORDER BY table_schema, table_name;

-- 3. Tables with RLS DISABLED (anon key can read/write everything if grants exist).
SELECT n.nspname AS schema, c.relname AS table
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r' AND n.nspname IN ('public', 'pm') AND NOT c.relrowsecurity
ORDER BY 1, 2;

-- 4. Functions anon can EXECUTE (rpc_health_ping is the only expected row).
SELECT n.nspname AS schema, p.proname AS function, p.prosecdef AS security_definer
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND has_function_privilege('anon', p.oid, 'EXECUTE')
  AND p.proname LIKE 'rpc\_%'
ORDER BY p.proname;
