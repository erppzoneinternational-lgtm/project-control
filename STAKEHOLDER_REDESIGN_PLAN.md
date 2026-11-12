# STAKEHOLDER_REDESIGN_PLAN.md
# PZone ERP — Stakeholders Architecture & RACI Scope Plan (Approved Phase 1)

**Status:** Approved Architectural Specification (Phase 1 Approved — No code edits, no migrations applied, no DB writes, no commits)  
**Author:** Antigravity AI Architecture Team  
**Date:** 2026-08-10  
**Integrity Mode:** Pure Planning & Analysis  

---

## Executive Summary

This document specifies the approved **Phase 1 Stakeholders & RACI Model** for PZone ERP. The approved architecture establishes:
1. **Scope A (Project-Level RACI):** Approved as the Phase 1 model (1 Accountable person per project overall; multiple Responsible, Consulted, Informed).
2. **Freeze Scope B & C:** Process-level (Scope B) and WBS-level (Scope C) are frozen as future options only.
3. **Static Admin RACI Matrix:** Kept strictly as static corporate governance in `/user-management` Admin page (`role-matrix.ts`).
4. **Cardinatlity Rules:** Partial unique index enforces **at most one** `accountable` person per project. `raci_role` is optional/nullable during draft project creation, and presence of an `accountable` person is enforced via UI/business validation before project activation.
5. **Worktree Status:** No new commit or remote DB change. Existing worktree changes remain untracked/modified and require review prior to commit.

---

## 1. Approved Phase 1 RACI Model (Scope A)

### 1.1 Model Definition & Example Assignment

Project-to-Person assignments live in `public.project_stakeholders`. A row represents an individual person's operational role and RACI responsibility on a specific project:

```text
-- Example Row in public.project_stakeholders:
project_id:     "00000000-0000-0000-0000-000000000001"
stakeholder_id: "00000000-0000-0000-0000-000000000002"
role:           "Project Manager"
raci_role:      "accountable"
```

- **Accountable (A):** At most 1 person per project (`uq_project_accountable`).
- **Responsible (R), Consulted (C), Informed (I):** Multiple persons permitted per project.

---

## 2. Concept Separation: Corporate Governance vs. Project Execution

```
┌─────────────────────────────────────────────────────────────────────────┐
│ CONCEPT 1: Static Admin RACI Matrix (Corporate Governance)             │
├─────────────────────────────────────────────────────────────────────────┤
│ Location: src/lib/rbac/role-matrix.ts & /user-management               │
│ Attributes: Company process key + Organizational job roles               │
│ Purpose: Visual corporate policy matrix defining which job titles       │
│          are R/A/C/I for 12 standard company processes.                 │
│          Stays as static corporate governance. NOT project data.        │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ STRICTLY SEPARATE
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ CONCEPT 2: Project Person Assignment (Scope A Execution)                 │
├─────────────────────────────────────────────────────────────────────────┤
│ Location: public.project_stakeholders (Internal Junction Table)         │
│ Attributes: stakeholder_id + project_id + role + raci_role             │
│ Purpose: Assigns a specific individual person to a project with a       │
│          project role and optional raci_role ('accountable', etc.).    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Comparison of RACI Scopes & Status

| Scope | Status | DDL / Constraint | Notes |
|---|---|---|---|
| **Scope A: Project-Level** | **APPROVED PHASE 1** | `CREATE UNIQUE INDEX uq_project_accountable ON public.project_stakeholders (project_id) WHERE raci_role = 'accountable';` | Enforces at most 1 Accountable per project. `raci_role` is nullable on draft creation. |
| **Scope B: Process-Level** | **FROZEN (Future)** | `raci_process_key TEXT` constrained to `RACI_MATRIX` process keys. | Deferred until UI requires process-granular assignment. |
| **Scope C: WBS-Level** | **FROZEN (Future)** | `wbs_item_id UUID` (FK to WBS table). | Table name (`public.pm_wbs_items` vs `pm.wbs_items`) requires live schema verification before any DDL script. |

---

## 4. Accountable Cardinality & Lifecycle Rules

1. **Partial Unique Index Guarantee:**
   - The DDL constraint `CREATE UNIQUE INDEX uq_project_accountable ON public.project_stakeholders (project_id) WHERE raci_role = 'accountable';` guarantees **at most one** `accountable` person per project.
   - It does **NOT** guarantee *at least one* (exactly one) at the database level.
2. **Draft vs. Active Project Lifecycle:**
   - `raci_role` is optional/nullable during draft project creation (`status = 'tender'` or `'not_started'`).
   - UI and business service validation will require an `accountable` person (Project Manager) to be assigned before transitioning project status to `active` / `working`.

---

## 5. DDL Specifications (Scope A Phase 1)

### 5.1 `public.organizations` & `public.organization_memberships`
```sql
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  tax_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System access roles: 'admin', 'manager', 'member', 'viewer' [Owner Decision]
CREATE TABLE IF NOT EXISTS public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  system_role TEXT NOT NULL DEFAULT 'member' CHECK (system_role IN ('admin', 'manager', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);
CREATE INDEX idx_org_memberships_user ON public.organization_memberships(user_id, organization_id);
```

### 5.2 Unified Person Registry: `public.stakeholders` (Person Only)
```sql
CREATE TABLE IF NOT EXISTS public.stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('hr_employee', 'client_contact', 'vendor_contact', 'external')),
  hr_employee_id UUID REFERENCES public.hr_employees(id) ON DELETE SET NULL,
  client_contact_id UUID REFERENCES public.client_contacts(id) ON DELETE SET NULL,
  vendor_contact_id UUID REFERENCES public.vendor_contacts(id) ON DELETE SET NULL,
  external_name_ar TEXT,
  external_name_en TEXT,
  external_phone TEXT,
  external_email TEXT,
  external_job_title TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_stakeholders_org UNIQUE (id, organization_id),
  
  -- Strict 4-Way XOR Check Constraint
  CONSTRAINT chk_stakeholder_source CHECK (
    (CASE WHEN hr_employee_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN client_contact_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN vendor_contact_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN external_name_ar IS NOT NULL THEN 1 ELSE 0 END) = 1
  )
);

CREATE UNIQUE INDEX uq_stakeholders_hr_employee ON public.stakeholders (hr_employee_id) WHERE hr_employee_id IS NOT NULL;
CREATE UNIQUE INDEX uq_stakeholders_client_contact ON public.stakeholders (client_contact_id) WHERE client_contact_id IS NOT NULL;
CREATE UNIQUE INDEX uq_stakeholders_vendor_contact ON public.stakeholders (vendor_contact_id) WHERE vendor_contact_id IS NOT NULL;
```

### 5.3 RACI Relation Table: `public.project_stakeholders` (Scope A DDL)
```sql
CREATE TABLE IF NOT EXISTS public.project_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  project_id UUID NOT NULL,
  stakeholder_id UUID NOT NULL,
  role TEXT NOT NULL, -- e.g. 'Project Manager', 'Site Engineer', 'Consultant Rep'
  raci_role TEXT CHECK (raci_role IN ('responsible', 'accountable', 'consulted', 'informed')),
  is_primary BOOLEAN DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Composite FKs enforce same organization
  CONSTRAINT fk_ps_project FOREIGN KEY (project_id, organization_id)
    天赋REFERENCES public.pm_projects(id, organization_id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_stakeholder FOREIGN KEY (stakeholder_id, organization_id)
    REFERENCES public.stakeholders(id, organization_id) ON DELETE CASCADE,
    
  UNIQUE(project_id, stakeholder_id, role)
);

-- Scope A Constraint: At most ONE Accountable person per project overall
CREATE UNIQUE INDEX uq_project_accountable
  ON public.project_stakeholders (project_id)
  WHERE raci_role = 'accountable';

CREATE INDEX idx_project_stakeholders_proj ON public.project_stakeholders(project_id, role);
CREATE INDEX idx_project_stakeholders_stk ON public.project_stakeholders(stakeholder_id);
```

---

## 6. Item Classification & Worktree Status

### Confirmed Facts **[Confirmed Fact]**
1. Scope A (Project-level RACI) is approved as the Phase 1 model.
2. Admin Page static RACI matrix (`role-matrix.ts`) remains corporate governance.
3. Partial unique index `uq_project_accountable` guarantees **at most one** accountable person per project.
4. Current payload test suite passes 34/34 tests cleanly (`npm test`).
5. Production build (`npm run build`) completes with 0 errors.

### Assumptions **[Assumption]**
1. Scope A fulfills initial project setup and stakeholder management requirements for Phase 1.

### Owner Decisions Needed **[Owner Decision]**
1. **System Access Roles:** Confirm `organization_memberships.system_role` values (`admin`, `manager`, `member`, `viewer`).
2. **Vendor Table Schema:** Confirm target table name for vendor contacts (`public.vendor_contacts` vs `pm.vendor_contacts`).
3. **Phase 0 Execution Approval:** Approve initiation of Phase 0 (backup + live schema export).

### Worktree Status Statement
No new commit or remote DB change. Existing worktree changes remain untracked/modified and require review prior to commit.
