-- Migration 007: Stakeholders Phase 1 Redesign & RACI Matrix Schema
-- Target: public, pm
-- Description: Multi-tenant organizations table, stakeholders schema expansion & backfill, project_stakeholders relational table with RACI constraint, security invoker views.

BEGIN;

-- 1. Create public.organizations table & insert default tenant
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    code TEXT UNIQUE NOT NULL,
    org_type TEXT NOT NULL DEFAULT 'internal' CHECK (org_type IN ('internal', 'client', 'vendor', 'consultant', 'other')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.organizations (id, name, name_ar, code, org_type)
VALUES ('00000000-0000-0000-0000-000000000001', 'Pzoneinternational', 'Pzoneinternational', 'PZONE', 'internal')
ON CONFLICT (id) DO NOTHING;

-- 2. Alter public.stakeholders to add new columns
ALTER TABLE public.stakeholders
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) DEFAULT '00000000-0000-0000-0000-000000000001',
ADD COLUMN IF NOT EXISTS stakeholder_kind TEXT DEFAULT 'employee',
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Backfill 233 existing rows
UPDATE public.stakeholders
SET stakeholder_kind = 'employee',
    organization_id = '00000000-0000-0000-0000-000000000001',
    is_active = COALESCE(is_active, true)
WHERE organization_id IS NULL OR stakeholder_kind IS NULL;

ALTER TABLE public.stakeholders
ALTER COLUMN organization_id SET NOT NULL,
ALTER COLUMN stakeholder_kind SET NOT NULL;

-- 4. Add CHECK constraint chk_stakeholder_kind_relations
ALTER TABLE public.stakeholders DROP CONSTRAINT IF EXISTS chk_stakeholder_kind_relations;
ALTER TABLE public.stakeholders
ADD CONSTRAINT chk_stakeholder_kind_relations CHECK (
    stakeholder_kind IN ('employee', 'client_rep', 'vendor_rep', 'external_expert')
    AND (
        (stakeholder_kind = 'employee' AND client_id IS NULL AND vendor_id IS NULL) OR
        (stakeholder_kind = 'client_rep' AND vendor_id IS NULL) OR
        (stakeholder_kind = 'vendor_rep' AND client_id IS NULL) OR
        (stakeholder_kind = 'external_expert')
    )
);

-- Indexes for Stakeholders Querying
CREATE INDEX IF NOT EXISTS idx_stakeholders_kind ON public.stakeholders(stakeholder_kind);
CREATE INDEX IF NOT EXISTS idx_stakeholders_client ON public.stakeholders(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stakeholders_vendor ON public.stakeholders(vendor_id) WHERE vendor_id IS NOT NULL;

-- 5. Create public.project_stakeholders table
CREATE TABLE IF NOT EXISTS public.project_stakeholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.organizations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES pm.projects(id) ON DELETE CASCADE,
    stakeholder_id TEXT NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
    project_role TEXT NOT NULL,
    raci_role TEXT NOT NULL CHECK (raci_role IN ('responsible', 'accountable', 'consulted', 'informed')),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    assigned_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project_id, stakeholder_id)
);

-- 6. Partial Unique Index uq_project_accountable
CREATE UNIQUE INDEX IF NOT EXISTS uq_project_accountable
ON public.project_stakeholders (project_id)
WHERE raci_role = 'accountable';

CREATE INDEX IF NOT EXISTS idx_project_stakeholders_proj ON public.project_stakeholders(project_id);
CREATE INDEX IF NOT EXISTS idx_project_stakeholders_stk ON public.project_stakeholders(stakeholder_id);

-- 7. Create Security Invoker Views
CREATE OR REPLACE VIEW public.stakeholders_full WITH (security_invoker = true) AS
SELECT 
    s.id,
    s.name,
    s.job_title,
    s.code,
    s.phone,
    s.email,
    s.department,
    s.company,
    s.type,
    s.organization_id,
    o.name AS organization_name,
    o.code AS organization_code,
    s.stakeholder_kind,
    s.client_id,
    c.name AS client_name,
    s.vendor_id,
    v.name AS vendor_name,
    s.is_active,
    s.notes,
    s.created_at,
    s.updated_at,
    (
        SELECT COUNT(DISTINCT ps.project_id)::INTEGER
        FROM public.project_stakeholders ps
        WHERE ps.stakeholder_id = s.id
    ) AS assigned_projects_count
FROM public.stakeholders s
LEFT JOIN public.organizations o ON s.organization_id = o.id
LEFT JOIN public.clients c ON s.client_id = c.id
LEFT JOIN public.vendors v ON s.vendor_id = v.id;

CREATE OR REPLACE VIEW public.stakeholder_project_register WITH (security_invoker = true) AS
SELECT 
    ps.id AS assignment_id,
    ps.organization_id,
    ps.project_id,
    p.project_code,
    p.project_name,
    p.project_name_en,
    ps.stakeholder_id,
    s.name AS stakeholder_name,
    s.job_title AS stakeholder_job_title,
    s.stakeholder_kind,
    s.phone AS stakeholder_phone,
    s.email AS stakeholder_email,
    s.company AS stakeholder_company,
    o.name AS organization_name,
    ps.project_role,
    ps.raci_role,
    ps.assigned_at,
    ps.assigned_by,
    ps.notes AS assignment_notes,
    ps.created_at,
    ps.updated_at
FROM public.project_stakeholders ps
JOIN pm.projects p ON ps.project_id = p.id
JOIN public.stakeholders s ON ps.stakeholder_id = s.id
LEFT JOIN public.organizations o ON s.organization_id = o.id;

-- 8. Enable RLS and GRANT permissions
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_stakeholders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated access to organizations" ON public.organizations;
CREATE POLICY "Allow authenticated access to organizations" ON public.organizations FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow service_role access to organizations" ON public.organizations;
CREATE POLICY "Allow service_role access to organizations" ON public.organizations FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon access to organizations" ON public.organizations;
CREATE POLICY "Allow anon access to organizations" ON public.organizations FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to project_stakeholders" ON public.project_stakeholders;
CREATE POLICY "Allow authenticated access to project_stakeholders" ON public.project_stakeholders FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow service_role access to project_stakeholders" ON public.project_stakeholders;
CREATE POLICY "Allow service_role access to project_stakeholders" ON public.project_stakeholders FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon access to project_stakeholders" ON public.project_stakeholders;
CREATE POLICY "Allow anon access to project_stakeholders" ON public.project_stakeholders FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT ALL ON public.organizations TO authenticated, service_role, anon;
GRANT ALL ON public.project_stakeholders TO authenticated, service_role, anon;
GRANT ALL ON public.stakeholders_full TO authenticated, service_role, anon;
GRANT ALL ON public.stakeholder_project_register TO authenticated, service_role, anon;

COMMIT;
