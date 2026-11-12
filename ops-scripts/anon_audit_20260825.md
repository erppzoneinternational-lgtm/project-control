# Anon Access Audit & Tightening — 2026-08-25

**Project:** Pzone ERP — Supabase ref `tgqpcviqmgtdddiqvqdw` (eu-west-3) — **LIVE DB**
**Executed via:** `ops-scripts/db_query.py` → Supabase Management API (`POST /v1/projects/{ref}/database/query`)
**Scope:** anon RLS policies + anon table-level grants in user schemas (`public`, `pm`). Storage/auth internals intentionally NOT touched.
**Trigger:** handoff flagged ~8 legacy anon policies still open despite migrations 004/010/011/013.

---

## 1. Before-state

### 1a. Anon policies — `SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check FROM pg_policies WHERE 'anon' = ANY(roles)` → 12 rows

| # | schema.table | policy | cmd | roles | qual / with_check |
|---|---|---|---|---|---|
| 1 | pm.project_client_contacts | Allow anon access to project_client_contacts | ALL | {anon} | true / true |
| 2 | pm.project_site_resources | Allow anon access to project_site_resources | ALL | {anon} | true / true |
| 3 | pm.project_subcontractors | Allow anon access to project_subcontractors | ALL | {anon} | true / true |
| 4 | public.cities | cities_all | ALL | {anon,authenticated,service_role} | true / true |
| 5 | public.governorates | gov_all | ALL | {anon,authenticated,service_role} | true / true |
| 6 | public.organizations | Allow anon access to organizations | ALL | {anon} | true / true |
| 7 | public.pm_schedule_reports | sched_rep_anon_all | ALL | {anon,authenticated} | true / true |
| 8 | public.pm_schedule_versions | sched versions anon all | ALL | {anon,authenticated} | true / true |
| 9 | public.pm_schedule_versions | sched_ver_anon_all | ALL | {anon,authenticated} | true / true *(duplicate)* |
| 10 | public.project_stakeholders | Allow anon access to project_stakeholders | ALL | {anon} | true / true |
| 11 | public.vendors | Allow anon access to vendors | ALL | {anon} | true / true |
| 12 | storage.objects | anon_read_progress_photos | SELECT | {anon} | `(bucket_id = 'progress-photos')` |

Raw dump preserved in `_anon_before_policies.json` (session scratch; content embedded above).

### 1b. Anon table grants — `information_schema.role_table_grants WHERE grantee='anon'` → **586 rows**

Breakdown by schema:

| schema | tables w/ anon grant | rows |
|---|---|---|
| pm | 3 | 21 |
| public | 77 (incl. views v_*, stakeholders_full, stakeholder_project_register, user_roles, contract_module_access, clients, employees, profiles…) | 536 |
| realtime | 2 | 4 |
| storage | 8 | 25 |

Every one of the 87 tables/views in `public`+`pm` carried full CRUD+TRUNCATE+REFERENCES+TRIGGER to anon. Sequence grants to anon in user schemas: none found.

### 1c. Safety pre-checks (all passed before any write)

- **RLS:** 0 tables in `public`/`pm` have RLS disabled → every table is policy-gated.
- **PUBLIC role:** 0 PUBLIC grants remain in user schemas (migration 013's cleanup held) → revoking anon fully closes unauthenticated access; nothing inherited.
- **Authenticated coverage:** all 87 tables hold direct `authenticated` grants; affected tables have dedicated authenticated/service_role policies (except cities/governorates/pm_schedule_reports — handled by recreation below).
- **App usage:** `cities`/`governorates` are fetched only from `(dashboard)` route-group pages (projects/new, projects, projects/[id]/edit) — post-login only. No pre-auth consumer found for any affected table.

## 2. Classification

| Hit | Class | Basis |
|---|---|---|
| #1–#3 pm.* contacts/site_resources/subcontractors | **LEGACY-OPEN** | Scaffolded in `002_stakeholders_tables.sql`; explicitly dropped by `004_security_hardening.sql`. Separate per-role policies exist → plain drop safe. |
| #6 organizations, #10 project_stakeholders | **LEGACY-OPEN** | Explicitly dropped by `010_revoke_anon_access.sql`; per-role policies exist. |
| #11 vendors | **LEGACY-OPEN** | Same scaffold pattern ("Allow anon access to …", ALL/true); separate authenticated+service_role policies exist. |
| #9 sched_ver_anon_all (+ #8 duplicate) | **LEGACY-OPEN** | Duplicate scaffolds on pm_schedule_versions which already has dedicated `auth_insert/select/update_*` + `schedule_versions_all {authenticated}` + service_role policies → redundant, plain drop safe. |
| #4 cities_all, #5 gov_all | **LEGACY-OPEN** (recreate, not plain drop) | Same wide-open scaffold style; only policy on those tables covers authenticated too → recreated WITHOUT anon to avoid breaking dashboard lookups. |
| #7 sched_rep_anon_all | **LEGACY-OPEN** (recreate, not plain drop) | Only policy on pm_schedule_reports covers both roles → recreated WITHOUT anon. |
| #12 storage.objects anon_read_progress_photos | **INTENTIONAL-PUBLIC? → UNCERTAIN, LEFT IN PLACE** | storage internal (out of scope by instruction). Note: bucket `progress-photos` is marked `public:false`, yet this policy lets anon read its objects — flagged for owner review (§6). |

INTENTIONAL-PUBLIC in user schemas: none found.

## 3. Actions executed (single transaction, committed cleanly)

```sql
BEGIN;
-- Phase A: drop legacy anon-only policies (per-role policies already exist)
DROP POLICY IF EXISTS "Allow anon access to project_client_contacts" ON pm.project_client_contacts;
DROP POLICY IF EXISTS "Allow anon access to project_site_resources"   ON pm.project_site_resources;
DROP POLICY IF EXISTS "Allow anon access to project_subcontractors"   ON pm.project_subcontractors;
DROP POLICY IF EXISTS "Allow anon access to organizations"            ON public.organizations;
DROP POLICY IF EXISTS "Allow anon access to project_stakeholders"     ON public.project_stakeholders;
DROP POLICY IF EXISTS "Allow anon access to vendors"                  ON public.vendors;
DROP POLICY IF EXISTS "sched versions anon all"                       ON public.pm_schedule_versions;
DROP POLICY IF EXISTS "sched_ver_anon_all"                            ON public.pm_schedule_versions;

-- Phase B: recreate combined-role policies WITHOUT anon
-- (original names kept so future DROP IF EXISTS migrations still match)
DROP POLICY IF EXISTS "cities_all" ON public.cities;
CREATE POLICY "cities_all" ON public.cities FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "gov_all" ON public.governorates;
CREATE POLICY "gov_all" ON public.governorates FOR ALL TO authenticated, service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "sched_rep_anon_all" ON public.pm_schedule_reports;
CREATE POLICY "sched_rep_anon_all" ON public.pm_schedule_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Phase C: strip every anon privilege in user schemas (tables incl. views + sequences)
REVOKE ALL ON ALL TABLES    IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES    IN SCHEMA pm     FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA pm     FROM anon;
COMMIT;
NOTIFY pgrst, 'reload schema';
```

Result: `[]` (no errors; transaction committed).

## 4. After-state proof

### 4a. Anon policies after — same pg_policies query → 1 row

```json
[{"schemaname":"storage","tablename":"objects","policyname":"anon_read_progress_photos",
  "cmd":"SELECT","roles":"{anon}"}]
```

→ **0 anon policies remain in `public`/`pm`.** Only the out-of-scope storage policy remains.

### 4b. Anon table grants after — same role_table_grants query → 29 rows, **all in `realtime.*`/`storage.*`**

Platform-managed defaults (buckets, buckets_analytics, buckets_vectors, objects, s3_multipart_uploads[_parts], vector_indexes, realtime.messages/subscription). Per instruction, storage internals were not modified.

### 4c. User-schema summary after

```json
[{"tables_total":87,"tables_with_anon_grant":0,"anon_grant_rows":0}]
```

Anon sequence grants in user schemas: `[]`. Materialized views in user schemas: 0 (so ALL TABLES covered everything).

### 4d. App-safety spot check

Top-policy-count tables (pm_boq_revisions=8, pm_activity_boq_links=6, pm_progress_allocations=6, pm_project_activities=6, pm_weekly_reports=6, pm_boq_items=6, pm_schedule_versions=5, pm_activity_library=5) — all `authed_covered=true`. Logged-in app users unaffected.

## 5. Function exposure check (report-only; nothing changed)

```sql
SELECT proname, proconfig FROM pg_proc WHERE prosecdef AND (proconfig IS NULL OR proconfig::text NOT LIKE '%search_path%') LIMIT 50;
```
(filtered to user schemas; result)

| proname | proconfig | EXECUTE granted to |
|---|---|---|
| handle_new_user | NULL | PUBLIC, anon, authenticated, postgres, service_role |
| fn_check_cross_project_daily_lines | NULL | PUBLIC, anon, authenticated, postgres, service_role |
| fn_check_cross_project_act_boq | NULL | PUBLIC, anon, authenticated, postgres, service_role |

Findings: three SECURITY DEFINER functions lack a pinned `search_path` (search-path hijack hardening opportunity) and are EXECUTE-able by PUBLIC/anon. Not auto-fixed because they are live trigger/check functions (`handle_new_user` fires on auth signups) — setting `SET search_path` without reading each body risks breakage; that change needs an owner-reviewed migration.

## 6. Flagged items / recommended follow-ups (NOT acted on)

1. **`storage.objects` policy `anon_read_progress_photos`** — bucket `progress-photos` is `public:false`, yet this policy permits anonymous SELECT (metadata/listing/read path) on that bucket. If photos are only ever shown to logged-in users, consider dropping/replacing it in a storage-scoped change. Left untouched per instructions.
2. **SECURITY DEFINER functions** (§5): recommend a reviewed migration adding `SET search_path = ''` (schema-qualified bodies) and narrowing EXECUTE where anon isn't needed.
3. Policy names `cities_all` / `gov_all` / `sched_rep_anon_all` were deliberately kept (now authenticated-only) so existing `DROP POLICY IF EXISTS` migrations remain valid; rename at leisure in a later cosmetic migration.

## 7. Re-verification queries

```sql
-- must return 0 rows for public/pm
SELECT * FROM pg_policies WHERE 'anon' = ANY(roles) AND schemaname IN ('public','pm');
-- must return 0 rows
SELECT * FROM information_schema.role_table_grants WHERE grantee='anon' AND table_schema IN ('public','pm');
```

*Scratch evidence files used during this audit (`_anon_before_*.json`, `_anon_after_*.json`, `_anon_verify_final.py`) were removed after the report was written; raw before/after values are embedded above.*
