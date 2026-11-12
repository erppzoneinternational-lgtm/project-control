-- 013_anon_access_lockdown.sql  (v2 — revised after first deployment attempt)
-- QA finding C3 (Critical): public/unauthenticated access to stakeholder PII,
-- user_roles, contract_module_access and client tables.
--
-- ROOT CAUSE (discovered during first deployment round): these tables carry
-- grants to role **PUBLIC**. Revoking from `anon` alone is ineffective because
-- every role (including anon) inherits PUBLIC privileges.
--
-- Fix: revoke from BOTH `anon` and `PUBLIC`. Authenticated grants are kept so
-- logged-in application users are unaffected. No data is touched.

BEGIN;

-- v1 targets (anon-only revokes proved insufficient)
REVOKE ALL ON public.stakeholders FROM anon;
REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.contract_module_access FROM anon;
REVOKE ALL ON public.clients FROM anon;
REVOKE ALL ON public.pm_clients FROM anon;

-- v2: the real vector — inherited PUBLIC privileges
REVOKE ALL ON public.stakeholders FROM PUBLIC;
REVOKE ALL ON public.user_roles FROM PUBLIC;
REVOKE ALL ON public.contract_module_access FROM PUBLIC;
REVOKE ALL ON public.clients FROM PUBLIC;
REVOKE ALL ON public.pm_clients FROM PUBLIC;

COMMIT;

-- ROLLBACK: (restores prior exposure — emergency use only)
-- BEGIN;
-- GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.stakeholders TO PUBLIC;
-- GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.user_roles TO PUBLIC;
-- GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.contract_module_access TO PUBLIC;
-- GRANT SELECT ON public.clients TO PUBLIC;
-- GRANT SELECT ON public.pm_clients TO PUBLIC;
-- COMMIT;
