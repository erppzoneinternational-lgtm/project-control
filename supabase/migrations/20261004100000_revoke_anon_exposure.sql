-- ============================================================
-- 20261004100000_revoke_anon_exposure.sql
-- Close anonymous (visitor-key) access on the ERP database.
--
-- Evidence (2026-10-04, project tgqpcviqmgtdddiqvqdw):
--   * 13 SECURITY DEFINER rpc_* functions executable by anon
--     (section 1 already applied manually in SQL editor; repeated here so
--      the repo matches the database — safe to run again).
--   * Anon-key REST probe could READ without login:
--       stakeholders 378, pm_stakeholders 378, project_stakeholders 313,
--       project_team_with_auth 313, pm_projects 86, pm_clients 60,
--       v_stakeholders_missing_auth_link 357, v_to_engineer_kpi 378, ...
--   * anon held INSERT/UPDATE/DELETE(/TRUNCATE) grants on ~50 objects.
--   * 9 policies granted to role PUBLIC (includes anon).
--
-- Effect on the app: none for logged-in users. No page reads the DB before
-- login; keep-alive uses rpc_health_ping (left public). Idempotent.
-- ============================================================

-- ── 1. rpc_* functions: logged-in users + system only ────────────────────────
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname LIKE 'rpc\_%'
      AND p.proname <> 'rpc_health_ping'   -- intentionally public (keep-alive)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f.sig);
  END LOOP;
END $$;

-- ── 2. Visitors lose ALL access to tables and views ──────────────────────────
-- Views matter most: they run as their owner and skip RLS, which is how the
-- probe read stakeholders/projects/clients without logging in.
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'pm') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA pm FROM anon';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA pm FROM anon';
  END IF;
END $$;

-- ── 3. New tables/views must not auto-grant visitors (stops regressions) ────
-- Applies to objects created by the role running this (postgres).
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;

-- ── 4. Policies granted to PUBLIC → logged-in users only ────────────────────
-- PUBLIC = everyone incl. anon. Narrowing to `authenticated` keeps the exact
-- same rule for logged-in users and removes visitors.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname IN ('public', 'pm')
      AND roles::text[] @> ARRAY['public']
  LOOP
    EXECUTE format('ALTER POLICY %I ON %I.%I TO authenticated',
                   r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;
