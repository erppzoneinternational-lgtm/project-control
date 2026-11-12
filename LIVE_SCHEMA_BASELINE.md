# LIVE_SCHEMA_BASELINE.md
# PZone ERP — Phase 0 Live Schema Baseline & Drift Audit

**Execution Date:** 2026-08-10  
**Environment Target:** Production (Supabase Project `dwpdrclupradpnsminvi`)  
**Status:** Read-Only Audit Complete (No code edits, no migrations created, no DB writes, no commits)  

---

## 1. Initial State & Environment Record

### 1.1 Supabase Project Reference
- **Project Reference ID:** `dwpdrclupradpnsminvi`
- **Environment:** Production Instance
- **Database Engine:** PostgreSQL 17.6 (aarch64-unknown-linux-gnu, compiled by GCC 13.2.0)
- **PostgREST Exposed Schemas:** `public`, `pm`

### 1.2 Current Repository Git Status
Recorded command output (`git status --short`):
```text
 M next.config.ts
 M package-lock.json
 M package.json
 M src/app/globals.css
 M src/app/layout.tsx
 D src/app/page.tsx
?? .agents/
?? DB_RLS_BLOCKERS.md
?? ORIGINAL_REQUEST.md
?? PROJECT.md
?? SCHEMA_DESIGN_SPEC.md
?? STAKEHOLDER_REDESIGN_PLAN.md
?? chrome_temp_profile/
?? public/favicon.ico
?? public/icon.png
?? public/images/
?? public/manifest.json
?? public/pzone-logo-dark.png
?? public/pzone-logo-white.png
?? src/app/(auth)/
?? src/app/(dashboard)/
?? src/components/
?? src/contexts/
?? src/lib/
?? src/locales/
?? src/scripts/
?? src/types/
?? supabase/
?? vitest.config.ts
```
> **Worktree Status Statement:** No new commit or remote DB change was made in Phase 0. Existing worktree changes remain untracked/modified and require review before any final commit.

### 1.3 Backup Verification Record
- **Backup Type:** Supabase Managed Daily Automated Backups + Point-in-Time Recovery (PITR).
- **Target Instance:** `dwpdrclupradpnsminvi.supabase.co`
- **Backup Verification Date:** 2026-08-10 17:18 UTC
- **Data Privacy Assurance:** Row counts were captured via standard catalog queries (`information_schema`); zero PII data exported into logs or documentation.

---

## 2. Live Row Counts of Target Tables

| Table Name | Schema | Type | Live Row Count |
|---|---|---|---|
| `pm.projects` | `pm` | Base Table | **71** |
| `public.pm_projects` | `public` | View (Updatable via `INSTEAD OF` triggers) | **71** |
| `public.projects` | `public` | Base Table (Legacy) | 0 |
| `public.stakeholders` | `public` | Base Table | **233** |
| `public.profiles` | `public` | Base Table | **9** |
| `public.user_roles` | `public` | Base Table | **11** |
| `public.contract_module_access` | `public` | Base Table | **26** |
| `pm.project_manager_aliases` | `pm` | Base Table | **34** |
| `pm.project_manager_history` | `pm` | Base Table | **71** |
| `pm.project_client_contacts` | `pm` | Base Table | **2** |
| `pm.project_site_resources` | `pm` | Base Table | **1** |
| `pm.project_subcontractors` | `pm` | Base Table | **1** |
| `pm.project_team` | `pm` | Base Table | **0** |
| `pm.clients` | `pm` | Base Table | **37** |
| `public.clients` | `public` | Base Table (Legacy) | **47** |
| `public.vendors` | `public` | Base Table | **0** |
| `public.project_wbs` | `public` | Base Table | **0** |
| `public.organizations` | `public` | *Does not exist in live DB* | N/A |
| `public.organization_memberships` | `public` | *Does not exist in live DB* | N/A |
| `pm.wbs_items` | `pm` | *Does not exist in live DB* | N/A |

---

## 3. Exact Object Definitions & Schema Facts

### 3.1 Projects Entity
- **`pm.projects` (Base Table):**
  - Columns: `id` (uuid, PK), `organization_id` (uuid, default `'00000000-0000-0000-0000-000000000001'`), `project_code` (text), `project_name` (text), `project_name_en` (text), `client_id` (uuid), `client_name_raw` (text), `pzone_role` (text), `governorate_id` (uuid), `city_id` (uuid), `status` (`pm.project_status` enum), `contract_value` (numeric), `project_manager_id` (uuid), `project_manager_name_raw` (text), `pm_name_normalized` (text), `project_manager_stakeholder_id` (text), `created_at`, `updated_at`, `deleted_at`.
  - Triggers: `trg_log_pm_change` (logs to `pm.project_manager_history`), `audit_projects_trigger` (logs to `pm.audit_log`).
  - RLS: Enabled. Policy `Allow all access to pm.projects` for `{public}` (`USING(true) WITH CHECK(true)`).

- **`public.pm_projects` (View):**
  - Exposed to PostgREST in `public` schema.
  - Has `INSTEAD OF INSERT`, `INSTEAD OF UPDATE`, and `INSTEAD OF DELETE` triggers (`pm_projects_insert_fn`, `pm_projects_update_fn`, `trg_pm_projects_instead_of`) redirecting writes directly to `pm.projects`.

### 3.2 Stakeholders Entity
- **`public.stakeholders` (Base Table):**
  - Primary Key: `id` of type **`text`** (e.g. `'EMP-001'` or text identifiers).
  - Columns: `id` (text), `name` (text), `job_title` (text), `code` (text), `phone` (text), `email` (text), `department` (text), `company` (text), `type` (text, default `'employee'`), `created_at`, `updated_at`.
  - Row Count: **233** records.
  - RLS: Enabled. Permissive policies allow public `SELECT`, `INSERT`, `UPDATE`, `DELETE` (`USING(true)`).

### 3.3 Users & Access Management
- **`public.profiles` (Base Table):**
  - Columns: `id` (uuid), `user_id` (uuid), `full_name` (text), `pending_full_name` (text), `avatar_url` (text), `phone` (text), `department` (text).
  - RLS: Enabled. User-scoped policies (`auth.uid() = user_id`).
- **`public.user_roles` (Base Table):**
  - Columns: `id` (uuid), `user_id` (uuid), `role` (`app_role` enum).
  - RLS: Enabled. Admin management policy using `has_role(auth.uid(), 'admin'::app_role)`.
- **`public.contract_module_access` (Base Table):**
  - Columns: `id` (uuid), `module_path` (text), `module_label` (text), `allowed_roles` (text[]), `edit_roles` (text[]).
  - Row Count: **26** records.

### 3.4 Clients & Vendors Entity
- **`pm.clients` (Base Table):**
  - Columns: `id` (uuid), `organization_id` (uuid), `code` (text), `name_ar` (text), `name_en` (text), `contact_person` (text), `phone` (text), `email` (text), `address` (text).
  - Row Count: **37** records.
- **`public.clients` (Legacy Table):**
  - Row Count: **47** records.
- **`public.vendors` (Base Table):**
  - Located in `public` schema (not `pm`).
  - Columns: `id` (uuid), `code` (text), `name` (text), `type` (text), `email` (text), `phone` (text), `tax_id` (uuid), `address` (text), `contact_person` (text), `is_active` (boolean).
  - Row Count: **0** records.

### 3.5 WBS Structure
- **`public.project_wbs` (Base Table):**
  - Located in `public` schema.
  - Columns: `id` (uuid), `project_id` (uuid), `name` (text).
  - Row Count: **0** records.
  - *Note:* `pm.wbs_items` does **NOT** exist in the live database.

---

## 4. Drift Matrix: Live Schema vs. Code vs. Migrations

| Entity / Concept | Live Database State | Application Code Expectation | Migration Files in Repository | Drift Assessment |
|---|---|---|---|---|
| **Organizations Table** | Does NOT exist | Code passes `organization_id` parameter to payloads | Not defined in `001_initial_pm_schema.sql` | **BLOCKER:** Must be created via additive migration before adding FK constraints. |
| **Organization Memberships** | Does NOT exist | `/user-management` uses `profiles` and `user_roles` | Not defined in migrations | **BLOCKER:** Needs explicit DDL definition if system roles are moved here. |
| **Stakeholders PK Type** | `id` is **`text`** (233 records) | `project.payload.ts` handles `project_manager_stakeholder_id` as string | Schema spec assumed `id` is `uuid` | **DRIFT:** DDL spec must use `text` or `text`-compatible FKs for `stakeholder_id`. |
| **Project Manager Stakeholder FK** | `project_manager_stakeholder_id` is **`text`** | Service saves selected PM stakeholder ID string | Added in `006_pm_full_name_system.sql` | **ALIGNED:** Text type matches `public.stakeholders.id`. |
| **Vendor Table Location** | `public.vendors` (0 rows) | Service references `vendors` | `001_initial_pm_schema.sql` has no `pm.vendors` | **DRIFT:** Vendor entity is `public.vendors`, not `pm.vendors`. |
| **WBS Table Name** | `public.project_wbs` (0 rows) | Code references `project_wbs` | No `pm.wbs_items` table in migrations | **DRIFT:** Live WBS table is `public.project_wbs`. |
| **RLS Policy Security** | Permissive `USING(true)` on `pm.projects` and `public.stakeholders` | UI relies on application-level filtering | Migrations lack org-scoped RLS policies | **DRIFT:** RLS hardening requires multi-tenant auth context. |

---

## 5. Blockers for Stakeholder Redesign Execution

Before any DDL migration for Stakeholders Redesign can be generated or applied, the following blockers must be addressed by Owner Decision:

1. **Missing Multi-Tenant Tables:** `organizations` and `organization_memberships` do not exist in live DB. Adding `organization_id` foreign keys to `project_stakeholders` requires creating `organizations` first and populating a default tenant ID (`00000000-0000-0000-0000-000000000001`).
2. **`stakeholders.id` Primary Key Type:** Live `public.stakeholders` uses `text` primary keys (233 rows). Any junction table (`project_stakeholders`) must reference `stakeholder_id text`, NOT `uuid`.
3. **Vendor Table Schema:** Live DB has `public.vendors` (0 rows), not `pm.vendors`. Contact tables must reference `public.vendors(id)`.
4. **WBS Table Schema:** Live DB has `public.project_wbs` (0 rows), not `pm.wbs_items`.

---

## 6. Proposed Safe Migration Sequence (No SQL Created Yet)

When authorized after owner baseline review:

```text
Phase 1A: Multi-Tenant Foundation (Additive)
  └─ Create public.organizations (with default tenant '00000000-0000-0000-0000-000000000001')
  └─ Create public.organization_memberships

Phase 1B: Contact Sub-Tables (Additive)
  └─ Create public.client_contacts (referencing public.clients / pm.clients)
  └─ Create public.vendor_contacts (referencing public.vendors)

Phase 1C: Stakeholders Transformation & Project Junction (Additive)
  └─ Add source check & contacts FKs to public.stakeholders (using text stakeholder_id)
  └─ Create public.project_stakeholders (referencing pm.projects & public.stakeholders)
  └─ Create Partial Unique Index uq_project_accountable (WHERE raci_role = 'accountable')

Phase 1D: Security Invoker Views (Additive)
  └─ Create public.stakeholders_full WITH (security_invoker = true)
  └─ Create public.stakeholder_project_register WITH (security_invoker = true)
```

---

## 7. Sign-off Criteria

- **Phase 0 Audit Status:** COMPLETE ✅
- **Database Modifying Statements Executed:** ZERO (0) ✅
- **Code Modifications:** ZERO (0) ✅
- **Git Commits:** ZERO (0) ✅
- **Next Action:** Present baseline to owner for review before proceeding to Phase 1.
