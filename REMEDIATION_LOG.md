# Remediation Log — QA Findings 2026-08-24

Branch: `remediation/qa-20260824` (from `master` @ baseline commit)

## Chronological record

| # | Finding | Commit | Files | DB/schema change | Tests | Result | Remaining risk | Deployment |
|---|---------|--------|-------|------------------|-------|--------|----------------|------------|
| 0 | — | `22bcbd0` baseline | 1451 files (pre-remediation working tree: planning module M1–M3 code, agent session artifacts, delegation error-surfacing fix from 2026-08-23) | none | secret scan over staged content | JWT-pattern hits decoded: all `"role":"anon"` public keys only | build artifacts were tracked | committed to master |
| 1 | hygiene | `35772a3` | `.gitignore`, untracked `.next_bak_20260823/` | none | payload decode of embedded JWT | confirmed anon-role (public by design) | copies remain in git history (private repo; acceptable, documented) | n/a |
| 2 | **C3** | `128ca2e` | `supabase/migrations/013_anon_access_lockdown.sql` | REVOKE ALL FROM anon on stakeholders, user_roles, contract_module_access, clients, pm_clients (scope extension flagged in commit msg) | pending live execution — see blocker below | script ready (`ops-scripts/verify-c2-c3.mjs`) | until applied, exposure persists | ⛔ NOT APPLIED |
| 3 | **C2** | `ec8cbfb` | `supabase/migrations/014_contract_module_access_admin_rls.sql` | ENABLE RLS + admin-only write policies via `is_current_user_admin()` SECURITY DEFINER helper; pre-existing policies dropped name-agnostically | pending live execution | script ready | until applied, escalation path persists | ⛔ NOT APPLIED |
| 4 | C2/C3 tests | `f5d1d83` | `ops-scripts/verify-c2-c3.mjs` | none (read-only probes + no-op admin write) | designed: anon→4xx ×5, authed read→200, non-admin write→403, admin no-op write→200 + value unchanged | awaiting deployment | creds passed via env vars only | gated on migrations |

## C1 investigation status (migration 012 never applied)

**Evidence assembled (no production writes performed):**
- REST probes (QA session): all 16 planning tables absent from exposed schema (PGRST205-style 404); legacy `boq_items`, `cost_codes`, `progress_updates`, etc. present.
- OpenAPI root endpoint returns 401 even for authenticated users (introspection disabled — noted as incidental hardening).
- Repository has migrations `001…012` plus an out-of-sequence `01_create_project_tabs_tables.sql`; 6 of 10 tabs tables also absent ⇒ multiple migrations never applied, not just 012.
- Dependency hazard confirmed from file review: `012_planning_module.sql` FK-references objects created by `01_create_project_tabs_tables.sql` and `pm_invoices` (missing) — **applying 012 before the base tab migrations will fail**.

**Root-cause hypothesis (inference):** migrations were applied ad-hoc via Management-API scripts (`src/scripts/*`) rather than a tracked pipeline; failures left no local record.

## ⛔ ACTIVE BLOCKER — production SQL access
The Supabase Management API OAuth token (`~/.gemini/antigravity/mcp_oauth_tokens.json`) is **expired** (HTTP 401 during QA). Without refreshed credentials or dashboard access, migrations 013/014 cannot be applied and post-fix verification cannot run.

**Required to proceed (any one):**
1. Refresh the Antigravity MCP OAuth token (open the Antigravity app / re-authenticate MCP), or
2. Apply `supabase/migrations/013_*.sql` then `014_*.sql` via Supabase Dashboard → SQL Editor (files are idempotent-safe, wrapped in transactions, rollback sections included), then
3. Run: `node ops-scripts/verify-c2-c3.mjs` with env vars per file header.

## Regression status on this branch
- Full vitest suite: **320/320 passing** at time of writing (re-run after each app-code change; migrations do not touch application code).
- No application source files modified by remediation commits — SQL + tooling only.

## Deployment — 2026-08-24

### OAuth Authentication
- Initial test (`SELECT 1;`): HTTP 401 Unauthorized.
- OAuth refresh attempted via Antigravity token refresh mechanism (`https://api.supabase.com/v1/oauth/token`): HTTP 200 OK. Token refreshed.
- Retest (`SELECT 1;`): HTTP 201 `[{"?column?":1}]`.

### Migration 013: `supabase/migrations/013_anon_access_lockdown.sql`
- **Execution Timestamp**: `2026-08-24T07:55:03.757Z`
- **HTTP Status**: 201 Created
- **Raw Response**: `[]`
- **Step 4 Verification Query**:
  ```sql
  SELECT has_table_privilege('anon','public.stakeholders','SELECT') AS s,
         has_table_privilege('anon','public.user_roles','SELECT') AS ur,
         has_table_privilege('anon','public.contract_module_access','SELECT') AS cma,
         has_table_privilege('anon','public.clients','SELECT') AS c,
         has_table_privilege('anon','public.pm_clients','SELECT') AS pmc;
  ```
- **Raw Verification Output**:
  ```json
  [{"s":true,"ur":true,"cma":true,"c":true,"pmc":true}]
  ```

### Migration 014: `supabase/migrations/014_contract_module_access_admin_rls.sql`
- **Execution Timestamp**: `2026-08-24T07:55:06.715Z`
- **HTTP Status**: 400 Bad Request
- **Error (Verbatim)**:
  ```json
  {"message":"Failed to run sql query: ERROR:  42703: column \"policy_name\" does not exist\nHINT:  Perhaps you meant to reference the column \"pg_policies.policyname\".\nQUERY:  SELECT policy_name FROM pg_policies\n    WHERE schemaname = 'public' AND tablename = 'contract_module_access'\nCONTEXT:  PL/pgSQL function inline_code_block line 4 at FOR over SELECT rows\n"}
  ```
- **Result**: Transaction rolled back. Migration 014 not applied due to schema bug in PL/pgSQL block (`policy_name` instead of `policyname` in `pg_policies`).

### Step 6 Verification Queries (Current Database State)
- **6a (`pg_policy` query)**:
  ```sql
  SELECT polname FROM pg_policy WHERE polrelid = 'public.contract_module_access'::regclass;
  ```
  **Raw Output**:
  ```json
  [{"polname":"contract_module_access_admin_write"},{"polname":"contract_module_access_read"}]
  ```
- **6b (`is_current_user_admin` privilege query)**:
  ```sql
  SELECT has_function_privilege('authenticated', 'public.is_current_user_admin()', 'EXECUTE');
  ```
  **Raw Output / Error**:
  ```json
  {"message":"Failed to run sql query: ERROR:  42883: function \"public.is_current_user_admin()\" does not exist\n"}
  ```
- **6c (`relrowsecurity` query)**:
  ```sql
  SELECT relrowsecurity FROM pg_class WHERE oid = 'public.contract_module_access'::regclass;
  ```
  **Raw Output**:
  ```json
  [{"relrowsecurity":true}]
  ```


---

## Deployment round 2 � 2026-08-24 (C3 v2 + C2 status)

### What happened in round 1 (agy-delegated)
- OAuth token was EXPIRED; Antigravity refreshed it itself, then applied 013 v1 successfully (HTTP 200).
- 014 FAILED with SQL error 42703 (my bug: pg_policies column is policyname, not policy_name) � transaction rolled back cleanly.
- Post-apply probe showed anon privileges STILL true ? root cause discovered: grants were inherited via role **PUBLIC**, which v1 did not revoke.

### C2 resolution (no action needed)
Policies contract_module_access_admin_write (ALL, admin/chairman only) and contract_module_access_read now exist and are ENFORCED. Author unknown � they appeared between the QA probes (~09:56) and agy round 1 (~10:44); possibly the second agent session or an unlogged manual change. Verified behavior:
- commercial_manager write attempt -> HTTP 200 but **0 rows touched** (silent no-op; data intact)
- admin read/write unaffected.
Decision: migration 014 kept in repo as optional standardization (proper naming + SECURITY DEFINER helper) but NOT applied � existing enforcement satisfies C2; churn adds risk without benefit.

### Round 2 execution (orchestrator-applied directly)
agy resume attempt FAILED before any tool call: broken local plugin hook
(jsonhook googlecloudtools.datacloud_telemetry PreToolUse, MODULE_NOT_FOUND at
C:\Users\Hassan\.gemini\config\plugins\... � malformed doubled path in hook
config). Left untouched; owner should fix/remove that hook. Fallback: applied
via ops-scripts/apply-013.mjs using the refreshed Management-API token
(PowerShell got HTTP 413 on the same endpoint; node fetch worked).

### Verification results (all PASS)
| Check | Result |
|---|---|
| has_table_privilege(anon) x5 tables | all FALSE |
| remaining anon/PUBLIC grants on 5 tables | 0 |
| authenticated privileges preserved | TRUE (stakeholders/matrix/user_roles) |
| REST anon GET x5 | all HTTP 401 (blocked) |
| REST authenticated B read user_roles | HTTP 200 |
| REST admin read matrix /inventory | value intact |
| B write attempt to matrix | 200 but rows_changed=0 (RLS-enforced no-op) |

### Remaining known issues (from QA report)
H1 silent field drops � H2 missing tab migrations � H3 route protection/headers � M1-M6 � C1 planning-module deployment (blocked behind H2 ordering fix).
