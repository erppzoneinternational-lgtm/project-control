# SCHEMA_DESIGN_SPEC.md
# PZone ERP — Enterprise Database Architecture Specification

**Status:** Approved Specification Draft (Phase 1 Approved Scope A RACI Model)  
**Architecture Policy:** No SQL migrations applied until schema spec is approved and verified against live remote schema.

---

## 1. Core Architectural Choices

1. **`stakeholder = person only` (Strict Rule) [Confirmed Fact]**
   - A `stakeholder` represents an **individual person only** (employees, client contacts, vendor contacts, external specialists).
   - Companies (Clients, Vendors, Subcontractors, Consultants) are stored in company domain tables (`clients`, `vendors`, `project_parties`).

2. **Single Source of Truth (4-Way XOR Rule) [Confirmed Fact]**
   - Every `stakeholder` record references **EXACTLY ONE** origin (`hr_employee_id`, `client_contact_id`, `vendor_contact_id`, or `external_name_ar`).
   - Unique partial indexes guarantee at most 1 `stakeholder` record per `hr_employee_id`, `client_contact_id`, and `vendor_contact_id`.

3. **Strict Separation of System Access vs. Operational RACI [Confirmed Fact]**
   - `organization_memberships.system_role`: Application access (`admin`, `manager`, `member`, `viewer`) **[Owner Decision]**.
   - `project_stakeholders.raci_role`: Project deliverable responsibility (`responsible`, `accountable`, `consulted`, `informed`).

4. **Approved Scope A RACI Model (Single Accountable Person per Project) [Confirmed Fact]**
   - Partial unique index `uq_project_accountable` guarantees **at most one** `accountable` person per project.
   - `raci_role` is optional/nullable during draft project creation (`status = 'tender'` / `'not_started'`).
   - Presence of an `accountable` person is enforced via UI/business validation before project activation.

5. **Security Invoker Views [Confirmed Fact]**
   - `public.stakeholders_full` and `public.stakeholder_project_register` use `WITH (security_invoker = true)`.

---

## 2. DDL Specifications

### 2.1 System Access: `public.organization_memberships`
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

-- system_role: 'admin', 'manager', 'member', 'viewer' [Owner Decision]
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

### 2.2 Unified Person Registry: `public.stakeholders`
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

### 2.3 RACI Relation Table: `public.project_stakeholders` (Scope A Approved)
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
  
  CONSTRAINT fk_ps_project FOREIGN KEY (project_id, organization_id)
    REFERENCES public.pm_projects(id, organization_id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_stakeholder FOREIGN KEY (stakeholder_id, organization_id)
    REFERENCES public.stakeholders(id, organization_id) ON DELETE CASCADE,
    
  UNIQUE(project_id, stakeholder_id, role)
);

-- Scope A Constraint: At most 1 Accountable person per project overall
CREATE UNIQUE INDEX uq_project_accountable
  ON public.project_stakeholders (project_id)
  WHERE raci_role = 'accountable';
```

---

## 3. Security Invoker Views

### 3.1 `public.stakeholders_full`
```sql
CREATE OR REPLACE VIEW public.stakeholders_full
WITH (security_invoker = true) AS
SELECT
  s.id AS stakeholder_id,
  s.organization_id,
  s.source_type,
  COALESCE(e.name_ar, cc.name_ar, vc.name_ar, s.external_name_ar) AS name_ar,
  COALESCE(e.name_en, cc.name_en, vc.name_en, s.external_name_en) AS name_en,
  COALESCE(e.phone, cc.phone, vc.phone, s.external_phone) AS phone,
  COALESCE(e.email, cc.email, vc.email, s.external_email) AS email,
  COALESCE(e.job_title, cc.job_title, vc.job_title, s.external_job_title, 'خبير خارجي') AS job_title,
  CASE
    WHEN s.source_type = 'hr_employee' THEN 'بي زون'
    WHEN s.source_type = 'client_contact' THEN c.name_ar
    WHEN s.source_type = 'vendor_contact' THEN v.name_ar
    ELSE 'جهة خارجية'
  END AS company_name,
  c.id AS client_id,
  v.id AS vendor_id,
  e.employee_code,
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
      JOIN public.pm_projects p ON ps.project_id = p.id
      WHERE ps.stakeholder_id = s.id
    ),
    '[]'::jsonb
  ) AS assigned_projects,
  s.created_at,
  s.updated_at
FROM public.stakeholders s
LEFT JOIN public.hr_employees e ON s.source_type = 'hr_employee' AND s.hr_employee_id = e.id
LEFT JOIN public.client_contacts cc ON s.source_type = 'client_contact' AND s.client_contact_id = cc.id
LEFT JOIN public.clients c ON cc.client_id = c.id
LEFT JOIN public.vendor_contacts vc ON s.source_type = 'vendor_contact' AND s.vendor_contact_id = vc.id
LEFT JOIN public.vendors v ON vc.vendor_id = v.id;
```

### 3.2 `public.stakeholder_project_register`
```sql
CREATE OR REPLACE VIEW public.stakeholder_project_register
WITH (security_invoker = true) AS
SELECT
  ps.id AS assignment_id,
  ps.organization_id,
  s.id AS stakeholder_id,
  s.source_type,
  COALESCE(e.name_ar, cc.name_ar, vc.name_ar, s.external_name_ar) AS person_name_ar,
  COALESCE(e.phone, cc.phone, vc.phone, s.external_phone) AS phone,
  COALESCE(e.email, cc.email, vc.email, s.external_email) AS email,
  COALESCE(e.job_title, cc.job_title, vc.job_title, s.external_job_title) AS job_title,
  CASE
    WHEN s.source_type = 'hr_employee' THEN 'بي زون'
    WHEN s.source_type = 'client_contact' THEN c.name_ar
    WHEN s.source_type = 'vendor_contact' THEN v.name_ar
    ELSE 'خارجي'
  END AS company_name,
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
JOIN public.pm_projects p ON ps.project_id = p.id
LEFT JOIN public.hr_employees e ON s.source_type = 'hr_employee' AND s.hr_employee_id = e.id
LEFT JOIN public.client_contacts cc ON s.source_type = 'client_contact' AND s.client_contact_id = cc.id
LEFT JOIN public.clients c ON cc.client_id = c.id
LEFT JOIN public.vendor_contacts vc ON s.source_type = 'vendor_contact' AND s.vendor_contact_id = vc.id
LEFT JOIN public.vendors v ON vc.vendor_id = v.id;
```
