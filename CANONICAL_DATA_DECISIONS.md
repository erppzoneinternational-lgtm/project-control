# CANONICAL_DATA_DECISIONS.md
# PZone ERP — Phase 0.1 Canonical Data Decision Audit

**Audit Date:** 2026-08-10  
**Environment Target:** Production (Supabase Project `dwpdrclupradpnsminvi`)  
**Status:** Read-Only Audit Complete (No code edits, no migrations created, no DB writes, no commits)  

---

## Executive Summary

This document presents the empirical findings of the **Phase 0.1 Canonical Data Decision Audit**. It inspects the live PostgreSQL system catalog to resolve ambiguities surrounding tenants, clients, stakeholders, sub-tables, and foreign key references.

---

## 1. Tenant Reality Audit

### 1.1 Live Data Distribution
Query: `SELECT organization_id, count(*) FROM pm.projects GROUP BY organization_id;`

| `organization_id` Value | Row Count | Null Count | Distinct Count |
|---|---|---|---|
| `'00000000-0000-0000-0000-000000000001'` | **71** | **0** | **1** |

### 1.2 Analysis & Confirmed Facts
- **[Confirmed Fact]** Every single active project (71 of 71) in `pm.projects` has `organization_id = '00000000-0000-0000-0000-000000000001'`.
- **[Confirmed Fact]** There is **NO `organizations` or `organization_memberships` table** in any schema (`pm` or `public`) in the live database.
- **Conclusion:** `00000000-0000-0000-0000-000000000001` is currently a column default placeholder. If an `organizations` table is created in Phase 1, this UUID must be inserted as the default single tenant to prevent foreign key violations.

---

## 2. Canonical Client Source Audit

### 2.1 Live Table Comparison

| Metric / Check | `pm.clients` (Base Table) | `public.clients` (Legacy Table) |
|---|---|---|
| **Live Row Count** | **37** | 47 |
| **PK Data Type** | `uuid` | `uuid` |
| **FK in `pm.projects.client_id`** | **Direct FOREIGN KEY constraint** (`pm_projects_client_id_fkey`) | None |
| **Active Linked Projects** | **70 projects** | **0 projects** |
| **Overlapping PK IDs** | **0 overlapping IDs** between `pm.clients` and `public.clients` | **0** |
| **Exposed Public View** | `public.pm_clients` (View pointing to `pm.clients`) | N/A |

### 2.2 Recommendation & Confirmed Facts
- **[Confirmed Fact]** `pm.clients` is the **only true canonical client table**. All 70 linked projects point strictly to `pm.clients(id)`.
- **Recommendation:** All proposed foreign keys for client contacts or project client relations MUST reference **`pm.clients(id)`**. `public.clients` is a dead legacy table and must never be referenced by new features.

---

## 3. Stakeholder Migration Feasibility & Profiling

### 3.1 Live Data Profiling (`public.stakeholders` - 233 Rows)

Query: `SELECT type, count(*)... FROM public.stakeholders GROUP BY type;`

| Attribute | Profile Result |
|---|---|
| **Total Rows** | **233** |
| **`type` Distribution** | `employee`: **233** (100%), others: 0 |
| **Primary Key Format** | **100% Text IDs** (e.g. `'emp-a790e1dc-6d4c-496e-bee5-1b3d0c1f47a7'`) |
| **Field Completeness** | `name`: 233/233 (100%), `code`: 233/233 (100%), `email`: 233/233 (100%), `company`: 233/233 (100%), `department`: 233/233 (100%), `job_title`: 233/233 (100%) |
| **Active Code References** | **51 projects** in `pm.projects` and **33 aliases** in `pm.project_manager_aliases` already reference these text IDs in `project_manager_stakeholder_id` |

### 3.2 Comparison of Migration Options

#### **Option A: Evolve Existing Text-PK `public.stakeholders`** *(Recommended)*
- **Implementation:** Keep `id text PRIMARY KEY` on `public.stakeholders`. Add source columns (`source_type`, `client_contact_id`, `vendor_contact_id`, `external_name_ar`). Create `public.project_stakeholders` with `stakeholder_id text REFERENCES public.stakeholders(id)`.
- **Pros:**
  1. Zero breaking changes to `pm.projects` (51 linked rows) and `pm.project_manager_aliases` (33 linked rows).
  2. Zero data migration or ID translation risk for the 233 existing employee rows.
  3. 100% compatible with current Next.js payload mappers (`src/lib/services/project.payload.ts`).
- **Cons:** Primary key is `text` (`'emp-...'`) rather than `uuid`.
- **Backfill Plan:** Zero backfill needed for existing 233 employee rows.
- **Rollback Plan:** Instant rollback via DDL drop of added columns.

#### **Option B: Create UUID `stakeholders_v2` with Phased Cutover**
- **Implementation:** Create new `public.stakeholders_v2` with `id uuid PRIMARY KEY`. Migrate 233 rows. Update `pm.projects.project_manager_stakeholder_id` and `pm.project_manager_aliases.stakeholder_id` columns from `text` to `uuid`. Create compatibility view.
- **Pros:** Standardized `uuid` primary key type.
- **Cons:** High risk of breaking live project references, requires multi-table column type migrations, requires Next.js TypeScript type refactoring.

### 3.3 Recommendation
- **[RECOMMENDED] Option A:** Evolve `public.stakeholders` with text-PK for Phase 1. It provides zero downtime, zero data loss risk, and complete backward compatibility with live data.

---

## 4. Source-Table Reality Audit

### 4.1 Live Table Inspection

Querying information schema for proposed sub-tables:

| Proposed Source Table | Live Existence | Live Status & Real Source Location |
|---|---|---|
| `hr_employees` | **DOES NOT EXIST** | Employees live in `public.stakeholders` (`type = 'employee'`, 233 rows). |
| `client_contacts` | **DOES NOT EXIST** | Client contact data is stored in `pm.project_client_contacts` (2 rows) and `pm.clients.contact_person` (text). |
| `vendor_contacts` | **DOES NOT EXIST** | Subcontractor contact data is stored in `pm.project_subcontractors` (1 row, `rep_name`, `rep_phone`). |

### 4.2 Guidance
- **Do NOT create FK constraints to non-existent tables `hr_employees` or `vendor_contacts`.**
- For Phase 1, `public.stakeholders` serves as the primary catalog. When contacts from `pm.project_client_contacts` or `pm.project_subcontractors` are added as project stakeholders, their person entries are registered in `public.stakeholders` with `source_type = 'client_contact'` or `'vendor_contact'`.

---

## 5. Foreign Key & Target Entity Matrix

| Feature Entity | Target Base Table | Schema | Target Primary Key | Proposed FK Column in Junction |
|---|---|---|---|---|
| **Project** | `pm.projects` | `pm` | `id uuid` | `project_id uuid REFERENCES pm.projects(id)` |
| **Stakeholder Person** | `public.stakeholders` | `public` | `id text` | `stakeholder_id text REFERENCES public.stakeholders(id)` |
| **Client** | `pm.clients` | `pm` | `id uuid` | `client_id uuid REFERENCES pm.clients(id)` |
| **Vendor / Subcontractor** | `public.vendors` | `public` | `id uuid` | `vendor_id uuid REFERENCES public.vendors(id)` |
| **WBS (Legacy Reference)** | `public.project_wbs` | `public` | `id uuid` | `wbs_id uuid REFERENCES public.project_wbs(id)` (Frozen) |

---

## 6. Rows Requiring Manual Data Resolution

During the read-only audit, two specific data anomalies were identified:

1. **Unlinked Project (Null Client):**
   - Project `PZONE-PRJ-071` (or 1 project row in `pm.projects`) has `client_id IS NULL`.
   - *Action:* Owner must confirm whether this project should be linked to an existing client in `pm.clients` or remain null.
2. **Unlinked Manager Alias:**
   - 1 row in `pm.project_manager_aliases` has `stakeholder_id IS NULL`.
   - *Action:* Owner can review and link to a stakeholder ID when editing aliases in Admin UI.

---

## 7. Recommended Safe Migration Sequence (Phase 1)

When approved by owner after review:

```text
Step 1: Multi-Tenant Base Table (Additive)
  └─ Create public.organizations (id uuid PK, default tenant '00000000-0000-0000-0000-000000000001')

Step 2: Stakeholders Catalog Enhancement (Additive Columns)
  └─ Add source_type TEXT DEFAULT 'employee' to public.stakeholders
  └─ Add external_name_ar TEXT, external_phone TEXT, external_email TEXT to public.stakeholders

Step 3: RACI Junction Table Creation (Additive Table & Index)
  └─ Create public.project_stakeholders (
       id uuid PK,
       project_id uuid REFERENCES pm.projects(id) ON DELETE CASCADE,
       stakeholder_id text REFERENCES public.stakeholders(id) ON DELETE CASCADE,
       role text NOT NULL,
       raci_role text CHECK (raci_role IN ('responsible', 'accountable', 'consulted', 'informed')),
       is_primary boolean DEFAULT false
     )
  └─ Create Partial Unique Index uq_project_accountable ON public.project_stakeholders(project_id) WHERE raci_role = 'accountable'

Step 4: Security Invoker Views (Additive Views)
  └─ Create public.stakeholders_full WITH (security_invoker = true)
  └─ Create public.stakeholder_project_register WITH (security_invoker = true)
```

---

## 8. Sign-off Criteria

- **Phase 0.1 Audit Status:** COMPLETE ✅
- **Database Modifying Statements Executed:** ZERO (0) ✅
- **Code Modifications:** ZERO (0) ✅
- **Git Commits:** ZERO (0) ✅
- **Next Action:** Present baseline & canonical data decisions to owner for review before creating any DDL migration.
