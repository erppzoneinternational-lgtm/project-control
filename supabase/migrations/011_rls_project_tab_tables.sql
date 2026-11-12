-- Migration 011: RLS Security Policies for Project Tab Tables
-- Target: public.pm_project_team, public.pm_wbs_items, public.pm_payment_milestones,
--         public.pm_project_documents, public.pm_change_orders, public.pm_invoices, public.pm_archive_logs
-- Description: Add organization_id column, enable RLS, revoke anon access, and create authenticated policies.

BEGIN;

-- 1. Add organization_id to all tab tables
ALTER TABLE IF EXISTS public.pm_project_team 
ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.organizations(id);

ALTER TABLE IF EXISTS public.pm_wbs_items 
ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.organizations(id);

ALTER TABLE IF EXISTS public.pm_payment_milestones 
ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.organizations(id);

ALTER TABLE IF EXISTS public.pm_project_documents 
ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.organizations(id);

ALTER TABLE IF EXISTS public.pm_change_orders 
ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.organizations(id);

ALTER TABLE IF EXISTS public.pm_invoices 
ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.organizations(id);

ALTER TABLE IF EXISTS public.pm_archive_logs 
ADD COLUMN IF NOT EXISTS organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES public.organizations(id);

-- 2. Enable Row Level Security
ALTER TABLE IF EXISTS public.pm_project_team ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pm_wbs_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pm_payment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pm_project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pm_change_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pm_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pm_archive_logs ENABLE ROW LEVEL SECURITY;

-- 3. Revoke Anon Privileges
REVOKE ALL ON public.pm_project_team FROM anon;
REVOKE ALL ON public.pm_wbs_items FROM anon;
REVOKE ALL ON public.pm_payment_milestones FROM anon;
REVOKE ALL ON public.pm_project_documents FROM anon;
REVOKE ALL ON public.pm_change_orders FROM anon;
REVOKE ALL ON public.pm_invoices FROM anon;
REVOKE ALL ON public.pm_archive_logs FROM anon;

-- 4. Create Authenticated & Service Role Policies
-- pm_project_team
DROP POLICY IF EXISTS "auth_access_pm_project_team" ON public.pm_project_team;
CREATE POLICY "auth_access_pm_project_team" ON public.pm_project_team 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_pm_project_team" ON public.pm_project_team;
CREATE POLICY "service_role_pm_project_team" ON public.pm_project_team 
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- pm_wbs_items
DROP POLICY IF EXISTS "auth_access_pm_wbs_items" ON public.pm_wbs_items;
CREATE POLICY "auth_access_pm_wbs_items" ON public.pm_wbs_items 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_pm_wbs_items" ON public.pm_wbs_items;
CREATE POLICY "service_role_pm_wbs_items" ON public.pm_wbs_items 
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- pm_payment_milestones
DROP POLICY IF EXISTS "auth_access_pm_payment_milestones" ON public.pm_payment_milestones;
CREATE POLICY "auth_access_pm_payment_milestones" ON public.pm_payment_milestones 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_pm_payment_milestones" ON public.pm_payment_milestones;
CREATE POLICY "service_role_pm_payment_milestones" ON public.pm_payment_milestones 
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- pm_project_documents
DROP POLICY IF EXISTS "auth_access_pm_project_documents" ON public.pm_project_documents;
CREATE POLICY "auth_access_pm_project_documents" ON public.pm_project_documents 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_pm_project_documents" ON public.pm_project_documents;
CREATE POLICY "service_role_pm_project_documents" ON public.pm_project_documents 
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- pm_change_orders
DROP POLICY IF EXISTS "auth_access_pm_change_orders" ON public.pm_change_orders;
CREATE POLICY "auth_access_pm_change_orders" ON public.pm_change_orders 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_pm_change_orders" ON public.pm_change_orders;
CREATE POLICY "service_role_pm_change_orders" ON public.pm_change_orders 
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- pm_invoices
DROP POLICY IF EXISTS "auth_access_pm_invoices" ON public.pm_invoices;
CREATE POLICY "auth_access_pm_invoices" ON public.pm_invoices 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_pm_invoices" ON public.pm_invoices;
CREATE POLICY "service_role_pm_invoices" ON public.pm_invoices 
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- pm_archive_logs
DROP POLICY IF EXISTS "auth_access_pm_archive_logs" ON public.pm_archive_logs;
CREATE POLICY "auth_access_pm_archive_logs" ON public.pm_archive_logs 
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_pm_archive_logs" ON public.pm_archive_logs;
CREATE POLICY "service_role_pm_archive_logs" ON public.pm_archive_logs 
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 5. Grant permissions to authenticated & service_role
GRANT ALL ON public.pm_project_team TO authenticated, service_role;
GRANT ALL ON public.pm_wbs_items TO authenticated, service_role;
GRANT ALL ON public.pm_payment_milestones TO authenticated, service_role;
GRANT ALL ON public.pm_project_documents TO authenticated, service_role;
GRANT ALL ON public.pm_change_orders TO authenticated, service_role;
GRANT ALL ON public.pm_invoices TO authenticated, service_role;
GRANT ALL ON public.pm_archive_logs TO authenticated, service_role;

COMMIT;
