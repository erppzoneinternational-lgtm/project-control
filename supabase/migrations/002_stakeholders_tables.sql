-- Migration 002: Project Stakeholders Hub Tables
-- Milestone M1: Database Migrations for Stakeholders Management

-- 1. Ensure schema pm exists
CREATE SCHEMA IF NOT EXISTS pm;

-- 2. Table: pm.project_client_contacts
CREATE TABLE IF NOT EXISTS pm.project_client_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES pm.projects(id) ON DELETE CASCADE,
    party_type TEXT NOT NULL CHECK (party_type IN ('client', 'consultant', 'main_contractor_above')),
    company_name TEXT,
    contact_name TEXT NOT NULL,
    job_title TEXT,
    contact_title TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table: pm.project_site_resources
CREATE TABLE IF NOT EXISTS pm.project_site_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES pm.projects(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('equipment_operator', 'driver')),
    resource_name TEXT NOT NULL,
    person_name TEXT,
    phone TEXT,
    vehicle_equipment_type TEXT,
    sub_type TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Table: pm.project_subcontractors
CREATE TABLE IF NOT EXISTS pm.project_subcontractors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES pm.projects(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    specialization TEXT,
    scope_description TEXT,
    scope_of_work TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'completed')),
    contract_status TEXT DEFAULT 'active',
    contract_value NUMERIC,
    start_date DATE,
    end_date DATE,
    rep_name TEXT,
    rep_phone TEXT,
    rep_email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Add role_sub_type column to project_team tables if not exists
ALTER TABLE IF EXISTS pm.project_team ADD COLUMN IF NOT EXISTS role_sub_type TEXT;
ALTER TABLE IF EXISTS public.pm_project_team ADD COLUMN IF NOT EXISTS role_sub_type TEXT;

-- 6. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_pcc_project_id ON pm.project_client_contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_pcc_project_party ON pm.project_client_contacts(project_id, party_type);

CREATE INDEX IF NOT EXISTS idx_psr_project ON pm.project_site_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_psr_project_type ON pm.project_site_resources(project_id, resource_type);

CREATE INDEX IF NOT EXISTS idx_psub_project ON pm.project_subcontractors(project_id);
CREATE INDEX IF NOT EXISTS idx_psub_project_status ON pm.project_subcontractors(project_id, status);

-- 7. Enable RLS and Configure Security Policies
ALTER TABLE pm.project_client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm.project_site_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm.project_subcontractors ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if any
DROP POLICY IF EXISTS "Allow authenticated access to project_client_contacts" ON pm.project_client_contacts;
DROP POLICY IF EXISTS "Allow service_role access to project_client_contacts" ON pm.project_client_contacts;
DROP POLICY IF EXISTS "Allow anon access to project_client_contacts" ON pm.project_client_contacts;

CREATE POLICY "Allow authenticated access to project_client_contacts" ON pm.project_client_contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role access to project_client_contacts" ON pm.project_client_contacts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access to project_client_contacts" ON pm.project_client_contacts FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to project_site_resources" ON pm.project_site_resources;
DROP POLICY IF EXISTS "Allow service_role access to project_site_resources" ON pm.project_site_resources;
DROP POLICY IF EXISTS "Allow anon access to project_site_resources" ON pm.project_site_resources;

CREATE POLICY "Allow authenticated access to project_site_resources" ON pm.project_site_resources FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role access to project_site_resources" ON pm.project_site_resources FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access to project_site_resources" ON pm.project_site_resources FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated access to project_subcontractors" ON pm.project_subcontractors;
DROP POLICY IF EXISTS "Allow service_role access to project_subcontractors" ON pm.project_subcontractors;
DROP POLICY IF EXISTS "Allow anon access to project_subcontractors" ON pm.project_subcontractors;

CREATE POLICY "Allow authenticated access to project_subcontractors" ON pm.project_subcontractors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow service_role access to project_subcontractors" ON pm.project_subcontractors FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon access to project_subcontractors" ON pm.project_subcontractors FOR ALL TO anon USING (true) WITH CHECK (true);

-- 8. Table Permissions / Grants
GRANT ALL ON pm.project_client_contacts TO authenticated, service_role, anon;
GRANT ALL ON pm.project_site_resources TO authenticated, service_role, anon;
GRANT ALL ON pm.project_subcontractors TO authenticated, service_role, anon;

-- 9. Expose Public Views for PostgREST Client Compatibility
CREATE OR REPLACE VIEW public.pm_project_client_contacts AS SELECT * FROM pm.project_client_contacts;
CREATE OR REPLACE VIEW public.pm_project_site_resources AS SELECT * FROM pm.project_site_resources;
CREATE OR REPLACE VIEW public.pm_project_subcontractors AS SELECT * FROM pm.project_subcontractors;

CREATE OR REPLACE VIEW public.project_client_contacts AS SELECT * FROM pm.project_client_contacts;
CREATE OR REPLACE VIEW public.project_site_resources AS SELECT * FROM pm.project_site_resources;
CREATE OR REPLACE VIEW public.project_subcontractors AS SELECT * FROM pm.project_subcontractors;

GRANT ALL ON public.pm_project_client_contacts TO authenticated, service_role, anon;
GRANT ALL ON public.pm_project_site_resources TO authenticated, service_role, anon;
GRANT ALL ON public.pm_project_subcontractors TO authenticated, service_role, anon;

GRANT ALL ON public.project_client_contacts TO authenticated, service_role, anon;
GRANT ALL ON public.project_site_resources TO authenticated, service_role, anon;
GRANT ALL ON public.project_subcontractors TO authenticated, service_role, anon;
