# PHASE1_MIGRATION_PACKAGE.md
# PZone ERP — Phase 1 Migration Package (Option A Approved Scope)

**Status:** Draft Package for Review (No code edits, no migrations applied, no DB writes, no commits)  
**Author:** Antigravity AI Architecture Team  
**Date:** 2026-08-10  
**Target Environment:** Supabase Production Instance `dwpdrclupradpnsminvi`  

---

## Executive Summary

This package provides the complete, production-grade Phase 1 migration artifacts for the **Stakeholders & RACI Redesign**.
It strictly implements **Option A (Evolve `public.stakeholders` with text-PK)** without creating un-needed sub-tables (`hr_employees`, `client_contacts`, `vendor_contacts`).

All SQL scripts contained herein are **DRY-RUN FOR REVIEW ONLY**. Nothing has been or will be applied to remote Supabase until owner review is complete.

---

## 1. Owner Confirmation Prerequisites

Before applying Step 1 of the migration, the owner must confirm the official Organization Details:
- **Default Organization ID:** `'00000000-0000-0000-0000-000000000001'` (Matches existing `organization_id` default in 71 `pm.projects` rows)
- **Organization Code:** `'PZONE'`
- **Organization Name (Arabic):** `'مجموعة بي زون'` (or confirmed official company name)
- **Tax / Commercial Registration:** *(Optional)*

---

## 2. Migration DDL Script (`007_stakeholders_phase1_redesign.sql`)

```sql
-- ============================================================================
-- Migration: 007_stakeholders_phase1_redesign.sql
-- Description: Phase 1 Stakeholder Redesign & Scope A RACI Model
-- Target Schemas: public, pm
-- Policy: Additive, Idempotent, Zero-Downtime
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- Step 1: Create Multi-Tenant Organizations Base Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  tax_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Default PZone Tenant
INSERT INTO public.organizations (id, code, name_ar, name_en)
VALUES ('00000000-0000-0000-0000-000000000001', 'PZONE', 'مجموعة بي زون', 'PZone Group')
ON CONFLICT (id) DO UPDATE SET
  code = EXCLUDED.code,
  name_ar = EXCLUDED.name_ar;

-- ----------------------------------------------------------------------------
-- Step 2: Evolve Existing public.stakeholders Table (Add Columns)
-- ----------------------------------------------------------------------------
ALTER TABLE public.stakeholders
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS stakeholder_kind TEXT,
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES pm.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ----------------------------------------------------------------------------
-- Step 3: Backfill 233 Existing Employee Rows
-- ----------------------------------------------------------------------------
UPDATE public.stakeholders
SET 
  stakeholder_kind = 'employee',
  organization_id = '00000000-0000-0000-0000-000000000001',
  is_active = COALESCE(is_active, true)
WHERE stakeholder_kind IS NULL;

-- Make stakeholder_kind NOT NULL after backfill
ALTER TABLE public.stakeholders 
  ALTER COLUMN stakeholder_kind SET NOT NULL,
  ALTER COLUMN stakeholder_kind SET DEFAULT 'employee';

-- Add Enum-Like Validation for stakeholder_kind
ALTER TABLE public.stakeholders 
  DROP CONSTRAINT IF EXISTS chk_stakeholder_kind_enum,
  ADD CONSTRAINT chk_stakeholder_kind_enum 
  CHECK (stakeholder_kind IN ('employee', 'client_contact', 'vendor_contact', 'external'));

-- ----------------------------------------------------------------------------
-- Step 4: Add Relational Validation CHECK Constraint
-- ----------------------------------------------------------------------------
ALTER TABLE public.stakeholders
  DROP CONSTRAINT IF EXISTS chk_stakeholder_kind_relations,
  ADD CONSTRAINT chk_stakeholder_kind_relations CHECK (
    (stakeholder_kind = 'employee' AND client_id IS NULL AND vendor_id IS NULL) OR
    (stakeholder_kind = 'client_contact' AND client_id IS NOT NULL AND vendor_id IS NULL) OR
    (stakeholder_kind = 'vendor_contact' AND vendor_id IS NOT NULL AND client_id IS NULL) OR
    (stakeholder_kind = 'external' AND client_id IS NULL AND vendor_id IS NULL)
  );

-- Indexes for Stakeholders Querying
CREATE INDEX IF NOT EXISTS idx_stakeholders_kind ON public.stakeholders(stakeholder_kind);
CREATE INDEX IF NOT EXISTS idx_stakeholders_client ON public.stakeholders(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholders_vendor ON public.stakeholders(vendor_id) WHERE vendor_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- Step 5: Create public.project_stakeholders Relation Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES pm.projects(id) ON DELETE CASCADE,
  stakeholder_id TEXT NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  raci_role TEXT CHECK (raci_role IN ('responsible', 'accountable', 'consulted', 'informed')),
  is_primary BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT uq_project_stakeholder_role UNIQUE (project_id, stakeholder_id, role)
);

-- Scope A Constraint: At most ONE Accountable person per project overall
CREATE UNIQUE INDEX IF NOT EXISTS uq_project_accountable
  ON public.project_stakeholders (project_id)
  WHERE raci_role = 'accountable';

CREATE INDEX IF NOT EXISTS idx_project_stakeholders_proj ON public.project_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_stk ON public.project_stakeholders(stakeholder_id);

-- ----------------------------------------------------------------------------
-- Step 6: Security Invoker Views for Exposed Queries
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.stakeholders_full
WITH (security_invoker = true) AS
SELECT
  s.id AS stakeholder_id,
  s.organization_id,
  s.stakeholder_kind,
  s.name AS name_ar,
  s.code AS employee_code,
  s.phone,
  s.email,
  s.job_title,
  s.department,
  s.company AS company_raw,
  CASE
    WHEN s.stakeholder_kind = 'employee' THEN 'بي زون'
    WHEN s.stakeholder_kind = 'client_contact' THEN c.name_ar
    WHEN s.stakeholder_kind = 'vendor_contact' THEN v.name
    ELSE 'جهة خارجية'
  END AS display_company_name,
  s.client_id,
  s.vendor_id,
  s.is_active,
  s.notes,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'project_id', ps.project_id,
          'project_code', p.project_code,
          'project_name', p.project_name,
          'role', ps.role,
          'raci_role', ps.raci_role,
          'is_primary', ps.is_primary,
          'start_date', ps.start_date
        )
      )
      FROM public.project_stakeholders ps
      JOIN pm.projects p ON ps.project_id = p.id
      WHERE ps.stakeholder_id = s.id
    ),
    '[]'::jsonb
  ) AS assigned_projects,
  s.created_at,
  s.updated_at
FROM public.stakeholders s
LEFT JOIN pm.clients c ON s.stakeholder_kind = 'client_contact' AND s.client_id = c.id
LEFT JOIN public.vendors v ON s.stakeholder_kind = 'vendor_contact' AND s.vendor_id = v.id;

CREATE OR REPLACE VIEW public.stakeholder_project_register
WITH (security_invoker = true) AS
SELECT
  ps.id AS assignment_id,
  ps.organization_id,
  s.id AS stakeholder_id,
  s.stakeholder_kind,
  s.name AS person_name_ar,
  s.phone,
  s.email,
  s.job_title,
  CASE
    WHEN s.stakeholder_kind = 'employee' THEN 'بي زون'
    WHEN s.stakeholder_kind = 'client_contact' THEN c.name_ar
    WHEN s.stakeholder_kind = 'vendor_contact' THEN v.name
    ELSE 'خارجي'
  END AS display_company_name,
  p.id AS project_id,
  p.project_code,
  p.project_name,
  p.pzone_role AS project_pzone_role,
  p.status AS project_status,
  ps.role AS assigned_role,
  ps.raci_role,
  ps.is_primary,
  ps.start_date AS assignment_start_date,
  ps.end_date AS assignment_end_date
FROM public.project_stakeholders ps
JOIN public.stakeholders s ON ps.stakeholder_id = s.id
JOIN pm.projects p ON ps.project_id = p.id
LEFT JOIN pm.clients c ON s.stakeholder_kind = 'client_contact' AND s.client_id = c.id
LEFT JOIN public.vendors v ON s.stakeholder_kind = 'vendor_contact' AND s.vendor_id = v.id;

COMMIT;
```

---

## 3. Rollback Script (`007_stakeholders_phase1_redesign_undo.sql`)

```sql
-- ============================================================================
-- Rollback: 007_stakeholders_phase1_redesign_undo.sql
-- Description: Clean, idempotent rollback of Phase 1 Stakeholders Redesign
-- Policy: Zero data loss for original 233 public.stakeholders rows
-- ============================================================================

BEGIN;

-- Drop Security Invoker Views
DROP VIEW IF EXISTS public.stakeholder_project_register;
DROP VIEW IF EXISTS public.stakeholders_full;

-- Drop Project Stakeholders Relation Table & Indexes
DROP INDEX IF EXISTS public.uq_project_accountable;
DROP TABLE IF EXISTS public.project_stakeholders CASCADE;

-- Remove Constraints and Added Columns from public.stakeholders
ALTER TABLE public.stakeholders
  DROP CONSTRAINT IF EXISTS chk_stakeholder_kind_relations,
  DROP CONSTRAINT IF EXISTS chk_stakeholder_kind_enum;

DROP INDEX IF EXISTS public.idx_stakeholders_kind;
DROP INDEX IF EXISTS public.idx_stakeholders_client;
DROP INDEX IF EXISTS public.idx_stakeholders_vendor;

ALTER TABLE public.stakeholders
  DROP COLUMN IF EXISTS organization_id,
  DROP COLUMN IF EXISTS stakeholder_kind,
  DROP COLUMN IF EXISTS client_id,
  DROP COLUMN IF EXISTS vendor_id,
  DROP COLUMN IF EXISTS is_active,
  DROP COLUMN IF EXISTS notes;

-- Drop Multi-Tenant Organizations Base Table
DROP TABLE IF EXISTS public.organizations CASCADE;

COMMIT;
```

---

## 4. Row-Count Reconciliation & Verification Queries

Run these queries **before** and **after** migration execution to verify 0 data loss:

```sql
-- 1. Verify 233 Stakeholders Preserved
SELECT 
  count(*) AS total_stakeholders,
  count(CASE WHEN stakeholder_kind = 'employee' THEN 1 END) AS employee_count,
  count(organization_id) AS org_assigned_count
FROM public.stakeholders;
-- Expected output: total_stakeholders = 233, employee_count = 233, org_assigned_count = 233

-- 2. Verify CHECK Constraint Safety
SELECT count(*) AS invalid_kind_relations
FROM public.stakeholders
WHERE NOT (
  (stakeholder_kind = 'employee' AND client_id IS NULL AND vendor_id IS NULL) OR
  (stakeholder_kind = 'client_contact' AND client_id IS NOT NULL AND vendor_id IS NULL) OR
  (stakeholder_kind = 'vendor_contact' AND vendor_id IS NOT NULL AND client_id IS NULL) OR
  (stakeholder_kind = 'external' AND client_id IS NULL AND vendor_id IS NULL)
);
-- Expected output: invalid_kind_relations = 0

-- 3. Verify Accountable Constraint Integrity
SELECT project_id, count(*) AS accountable_count
FROM public.project_stakeholders
WHERE raci_role = 'accountable'
GROUP BY project_id
HAVING count(*) > 1;
-- Expected output: 0 rows (no project has > 1 accountable person)
```

---

## 5. Application Impact & Affected App Files List

When DDL is approved and applied, the following application files will be updated:

| File Path | Component / Layer | Planned Edit Summary |
|---|---|---|
| [`src/types/index.ts`](file:///D:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/types/index.ts) | TypeScript Types | Add `StakeholderKind`, `ProjectStakeholder`, `RaciRole`, `StakeholderFull` interfaces. |
| [`src/lib/services/project.service.ts`](file:///D:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/lib/services/project.service.ts) | Service Layer | Add `getProjectStakeholders()`, `addProjectStakeholder()`, `removeProjectStakeholder()`. |
| [`src/components/projects/tabs/TeamTab.tsx`](file:///D:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/components/projects/tabs/TeamTab.tsx) | Project Detail UI | Update Team Tab to query from `project_stakeholders` with RACI badges (A, R, C, I). |
| [`src/app/(dashboard)/stakeholders/page.tsx`](file:///D:/ERP/Project/Pzone%20Prortal/Project%20Management/2.%20Post%20Contract/1.%20Project%20Setup/1.%20Project/pzone-project-setup/src/app/(dashboard)/stakeholders/page.tsx) | Dashboard Page | New Stakeholders Registry page displaying persons, companies, kind, and project count. |

---

## 6. Logic Fix & Review Sign-off Summary

- **Skill Invocation:** `/logic-fix-all` & `/fix-review`
- **Scope Verification:** Phase 1 Target strictly limited to Option A without touching RLS, WBS, legacy `public.clients`, or `public.project_wbs`.
- **Database Statement Execution Status:** ZERO (0) SQL executed remotely.
- **Code Edit Status:** ZERO (0) code edits made.
- **Git Commit Status:** ZERO (0) commits made.
