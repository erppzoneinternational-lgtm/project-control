# APPLY REPORT — Canonical Generation Alignment — 2026-08-24

**Project:** tgqpcviqmgtdddiqvqdw (live production)
**Executor:** automated subagent run via `ops-scripts/db_query.py` (Supabase Management API, role `postgres`)
**Scope:** apply missing Supabase migrations to the live DB, adapted to the canonical schema (`public.projects` base table, no pre-existing `pm` schema), then reconcile column gaps.
**Safety:** additive/idempotent DDL only; no existing tables dropped; no column types altered; row data touched only by 007's intentional backfill.

---

## 1. Per-file status

| # | File | Status | Signature verification |
|---|------|--------|------------------------|
| 1 | PRE-STEP: `public.vendors` (inline) | **APPLIED** | columns + 3 allow-all policies + grants confirmed via catalogs |
| 2 | `002_stakeholders_tables.sql` | **APPLIED** (adapted) | `pm.project_client_contacts/site_resources/subcontractors` tables + all 6 public compat views present |
| 3 | `005_auth_rbac_schema.sql` | **APPLIED** (adapted) | `on_auth_user_created` trigger on auth.users; `contract_module_access` created, RLS on, 2 policies, 7 seed rows |
| 4 | `01_create_project_tabs_tables.sql` | **APPLIED** (adapted) | 7 tab tables + `pm_archive_logs`; archive triggers on the 6 tab tables |
| 5 | `007_stakeholders_phase1_redesign.sql` | **APPLIED** (adapted) | `organizations` seeded w/ fixed UUID `00000000-…-0001`; 239 stakeholder rows backfilled (0 unbackfilled after); `project_stakeholders`, CHECK constraint, both security-invoker views queryable |
| 6 | `012_planning_module.sql` | **APPLIED** (adapted, statement-by-statement) | 216 statements split from file; 208 OK first pass + 8 failed → root-caused & fixed (see §3); all functions/views/buckets verified afterwards |
| 7 | `011_rls_project_tab_tables.sql` | **APPLIED** (as-is; BEGIN/COMMIT stripped for statement execution) | 56/56 stmts OK; RLS enabled with auth+service_role policies on all 7 tab tables; `organization_id` added |
| — | `003_m2_integrity_security_audit.sql`, `008_*`, `009_*`, `010_*`, `013_*`, `014_*`, `012_planning_module_rollback.sql`, `001_initial_pm_schema.sql` | **SKIP** (per instructions / REMEDIATION_LOG.md) | n/a |

## 2. Adaptive changes made (beyond the instructed pm.projects → public.projects)

1. **002**: only `pm.projects → public.projects` (×3). Base tables intentionally left in new `pm` schema; public compat views kept per instructions.
2. **005**: removed profiles table+policies and user_roles table+policies blocks (view preserved). **`handle_new_user()` adapted**: live `profiles` has `full_name_ar/full_name_en`, not `full_name` → function inserts `full_name_ar` (falls back to `raw_user_meta_data->>'name'`). Original would have broken every future signup.
3. **01**: `stakeholder_id TEXT → UUID` in `pm_project_team` (live `stakeholders.id` is uuid; TEXT FK would fail with datatype-mismatch). **Removed `trg_archive_pm_projects`**: `BEFORE DELETE` triggers are illegal on views (`public.pm_projects` is a VIEW whose delete path is owned by the 009 INSTEAD OF trigger).
4. **007**: `stakeholder_id TEXT → UUID` in `project_stakeholders` (same reason). View `stakeholders_full`: live stakeholders lacks `name/job_title/code/department/company/type` → mapped `COALESCE(name_en,name_ar) AS name`, `role AS job_title`, `NULL::text` placeholders (aliases preserved so app code keeps working). View `stakeholder_project_register`: `project_code/project_name/project_name_en → code/name_ar/name_en` aliases.
5. **Pre-reconciliation before 012** (42 ADD COLUMN IF NOT EXISTS, extracted verbatim from 012 defs): `projects.completion_pct`; `pm_boq_items.is_current/superseded_at`; `pm_boq_revisions.project_id/revision_no`; `pm_activity_library.activity_code/library_code/default_unit`; `pm_project_activities` ×18 (activity_code, duration_days, budgeted_cost_egp, boq_link_mode, status, is_archived, floats, calendar_type, …); `pm_progress_allocations.project_id/source_boq_revision/is_suspended/suspended_at/created_by/created_at/updated_at`; `pm_activity_boq_links.baseline_rate_egp/updated_at`; `pm_weekly_reports.status/aggregates/pdf_path/xlsx_path/finalized_by`. Required because 012's views/functions reference these columns at CREATE time against legacy same-name tables. NOT NULL only where 012 defines a DEFAULT (uniform fill); CHECK constraints skipped on added columns (documented deviation, low risk — defaults satisfy original checks).
6. **012**: `pm.projects → public.projects` (×22 incl. inside `fn_recalc_activity`); `v_commercial_summary` aliases `p.code AS project_code`, `p.name_ar AS project_name`; stakeholder-name COALESCEs in `v_activity_evm`/`v_deliverables_kanban` (+GROUP BY); audit block retargeted `pm.audit_logs → public.pm_audit_logs` (×12), guard literal retargeted so `fn_audit_progress_allocations` actually writes to the live audit table, index column `created_at → changed_at` (live audit table's timestamp column).
7. **Post-012**: added `pm_progress_allocations.line_id UUID REFERENCES pm_daily_progress_lines(id)` + `idx_alloc_line` (deferred because FK target is created by 012 itself).
8. **Reconciliation pass**: `pm_change_orders.time_extension_days INT DEFAULT 0`, `pm_change_orders.approval_status TEXT`, `pm_project_team.role_sub_type TEXT` (002 attempted this ALTER before the table existed → was a no-op). Verified against `src/types/index.ts` ChangeOrder/ProjectInvoice/ProjectSubcontractor/ProjectTeamMember/WBSItem/PaymentMilestone/ProjectDocument interfaces and service-layer usage (`projectTabs.service.ts`, `project.payload.ts`, `activity.service.ts`).

### Known acceptable deviations (documented, no action)
- `pm_boq_items.amount_egp` remains a plain numeric column (legacy); 012 defines it GENERATED ALWAYS STORED — converting requires DROP of the existing column, forbidden by rules.
- `UNIQUE(project_id, item_code)` on legacy `pm_boq_items` and other intra-file UNIQUE constraints on pre-existing tables were not retro-fitted (CREATE IF NOT EXISTS semantics; adding unique constraints risks failure on duplicate data).
- Legacy extra columns (`pm_boq_items.section_id/zone_id/item_type`, `pm_progress_allocations.daily_report_line_id/allocated_pct/boq_item_id/allocated_by/allocated_at`) left untouched.
- `pm_user_project_access.access_level` is a native enum `access_level` (legacy); labels verified = `view,operate,manage` — matches 012/app expectations, untouched per "never alter types".
- 007's `is_active` ADD COLUMN omitted (column already existed).

## 3. Errors encountered (verbatim) and resolution

All errors occurred during statement-by-statement execution of adapted 012 (216 statements):

1. `#55` `ERROR: 42703: column "line_id" does not exist` — `CREATE INDEX idx_alloc_line ON public.pm_progress_allocations(line_id)`
2. `#129` `ERROR: 42703: column a.line_id does not exist` — `CREATE OR REPLACE VIEW public.v_boq_with_actuals`
3. `#130` `ERROR: 42P01: relation "public.v_boq_with_actuals" does not exist` — `v_boq_current` (cascade)
4. `#131` `ERROR: 42703: column a.line_id does not exist` — `v_activity_evm`
5. `#132` cascade — `v_activity_progress`
6. `#133` `ERROR: 42703: column a.line_id does not exist` — `v_daily_progress_summary`
7. `#136` `ERROR: 42703: column a.line_id does not exist` — `v_commercial_summary`
8. `#138` `ERROR: 42703: column a.line_id does not exist` — `v_scurve_actual`

**Single root cause:** `pm_progress_allocations.line_id` had been deferred out of the pre-pass (its FK target didn't exist yet). Resolution: added the column with FK post-012, re-ran the 4 view statements + index explicitly; all succeeded on first retry. **Statements that ultimately failed permanently: 0.**

Tooling note: the Management API returns SQL errors as `{"message": "Failed to run sql query: ERROR: ..."}` rather than `{"error": ...}`; `ops-scripts/sql_runner.py` was patched mid-run to detect both shapes (earlier steps' success had been independently verified via catalog queries, so no silent failures slipped through).

Also noted (no error): `ALTER TABLE public.pm_progress_allocations ADD COLUMN line_id REFERENCES public.pm_daily_progress_lines(id)` during the pre-pass returned `ERROR: 42P01: relation "public.pm_daily_progress_lines" does not exist` → deferred to post-012 as described.

## 4. REST probe results (GET /rest/v1/{table}?select=*&limit=1, service_role)

**38 / 38 returned HTTP 200** (service_role bypasses RLS as expected; zero non-200s):

```
pm_change_orders 200      pm_invoices 200               pm_payment_milestones 200
pm_project_documents 200  pm_project_team 200           pm_wbs_items 200
pm_archive_logs 200       pm_project_client_contacts 200  pm_project_site_resources 200
pm_project_subcontractors 200  pm_cost_codes 200        pm_boq_sub_materials 200
pm_boq_milestone_steps 200 pm_activity_dependencies 200 pm_schedule_versions 200
pm_activity_calendar_exceptions 200  pm_daily_progress 200  pm_daily_progress_lines 200
pm_daily_progress_photos 200   pm_daily_manpower_logs 200   pm_daily_equipment_logs 200
pm_deliverables 200       pm_deliverable_items 200      pm_deliverable_attachments 200
pm_deliverable_events 200 pm_rfi_register 200           pm_daily_obstructions 200
pm_mos_entries 200        pm_material_transactions 200  pm_subcontractor_targets 200
pm_commercial_settings 200 pm_approval_delegations 200  pm_holds 200
pm_scurve_cache 200       organizations 200             project_stakeholders 200
vendors 200               contract_module_access 200
```

SQL-side counts (queryability check): `SELECT COUNT(*) FROM pm_change_orders` → 0 ✓, `pm_deliverables` → 0 ✓, `pm_daily_progress` → 0 ✓ (all brand-new, empty).

## 5. Row counts — newly created tables

| table | rows | table | rows |
|---|---|---|---|
| vendors | 0 | organizations | 1 |
| project_stakeholders | 0 | contract_module_access | 7 |
| pm_cost_codes | 0 | pm_boq_sub_materials | 0 |
| pm_boq_milestone_steps | 0 | pm_activity_dependencies | 0 |
| pm_schedule_versions | 0 | pm_activity_calendar_exceptions | 0 |
| pm_daily_progress | 0 | pm_daily_progress_lines | 0 |
| pm_daily_progress_photos | 0 | pm_daily_manpower_logs | 0 |
| pm_daily_equipment_logs | 0 | pm_deliverables | 0 |
| pm_deliverable_items | 0 | pm_deliverable_attachments | 0 |
| pm_deliverable_events | 0 | pm_deliverable_dependencies | 0 |
| pm_rfi_register | 0 | pm_daily_obstructions | 0 |
| pm_material_transactions | 0 | pm_material_allocations | 0 |
| pm_mos_entries | 0 | pm_subcontractor_targets | 0 |
| pm_commercial_settings | 0 | pm_approval_delegations | 0 |
| pm_holds | 0 | pm_scurve_cache | 0 |

Backfill effect (intentional, from 007): 239 existing stakeholders rows now carry `organization_id='00000000-0000-0000-0000-000000000001'`, `stakeholder_kind='employee'`.

Pre-existing data untouched elsewhere (e.g., `pm_projects` compat view, projects rows).

## 6. Artifacts

- `supabase/migrations/015_canonical_generation_alignment.sql` — union of everything actually applied (traceability).
- `ops-scripts/sql_runner.py` — dollar-quote-aware statement splitter/executor (with Management-API error-shape handling).
- `ops-scripts/tmp_adapted/*.adapted.sql` — the exact adapted files executed.
- `ops-scripts/step*.py`, `rest_probe_results.json`, `row_counts.json` — reproducible run scripts + raw outputs.
