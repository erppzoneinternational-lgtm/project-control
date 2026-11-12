-- Adapted 01_create_project_tabs_tables.sql:
--  * pm.projects -> public.projects (6)
--  * pm_project_team.stakeholder_id TEXT -> UUID
--  * removed trg_archive_pm_projects (view; BEFORE DELETE not allowed)
-- Supabase Migration Script: Project Tabs & Archiving System

-- 1. Create pm_project_team table
CREATE TABLE IF NOT EXISTS public.pm_project_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
    person_name TEXT NOT NULL,
    role_category TEXT NOT NULL CHECK (role_category IN ('pzone_internal', 'site_execution', 'client_team', 'subcontractor_consultant')),
    role_title_ar TEXT NOT NULL,
    role_title_en TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create pm_wbs_items table
CREATE TABLE IF NOT EXISTS public.pm_wbs_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    wbs_code TEXT,
    title_ar TEXT NOT NULL,
    description TEXT,
    weight_percentage NUMERIC(5,2) DEFAULT 0,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create pm_payment_milestones table
CREATE TABLE IF NOT EXISTS public.pm_payment_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_name_ar TEXT NOT NULL,
    percentage NUMERIC(5,2) DEFAULT 0,
    amount_egp NUMERIC(15,2) DEFAULT 0,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'due', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create pm_project_documents table
CREATE TABLE IF NOT EXISTS public.pm_project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL CHECK (document_type IN ('site_possession', 'toc', 'contract', 'other')),
    title_ar TEXT NOT NULL,
    file_path TEXT,
    issue_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create pm_change_orders table
CREATE TABLE IF NOT EXISTS public.pm_change_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    vo_number TEXT,
    title_ar TEXT NOT NULL,
    amount_egp NUMERIC(15,2) DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    approval_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create pm_invoices table
CREATE TABLE IF NOT EXISTS public.pm_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    ipc_number TEXT NOT NULL,
    claimed_amount NUMERIC(15,2) DEFAULT 0,
    approved_amount NUMERIC(15,2) DEFAULT 0,
    submission_date DATE,
    status TEXT DEFAULT 'under_review' CHECK (status IN ('under_review', 'approved', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create pm_archive_logs table (Master Archiving Table)
CREATE TABLE IF NOT EXISTS public.pm_archive_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- 'project', 'team_member', 'wbs_item', 'milestone', 'document', 'change_order', 'invoice'
    entity_id UUID,
    entity_name TEXT NOT NULL,
    project_id UUID,
    archived_data JSONB NOT NULL,
    deleted_by TEXT DEFAULT 'System User',
    archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PostgreSQL Trigger Functions for Automatic Archiving before Delete
CREATE OR REPLACE FUNCTION public.fn_archive_before_delete()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.pm_archive_logs (entity_type, entity_id, entity_name, project_id, archived_data)
    VALUES (
        TG_TABLE_NAME,
        OLD.id,
        COALESCE(
            CASE 
                WHEN TG_TABLE_NAME = 'pm_projects' THEN OLD.project_name
                WHEN TG_TABLE_NAME = 'pm_project_team' THEN OLD.person_name
                WHEN TG_TABLE_NAME = 'pm_wbs_items' THEN OLD.title_ar
                WHEN TG_TABLE_NAME = 'pm_payment_milestones' THEN OLD.milestone_name_ar
                WHEN TG_TABLE_NAME = 'pm_project_documents' THEN OLD.title_ar
                WHEN TG_TABLE_NAME = 'pm_change_orders' THEN OLD.title_ar
                WHEN TG_TABLE_NAME = 'pm_invoices' THEN OLD.ipc_number
                ELSE 'Record'
            END, 'Archived Item'
        ),
        CASE 
            WHEN TG_TABLE_NAME = 'pm_projects' THEN OLD.id
            ELSE OLD.project_id
        END,
        to_jsonb(OLD)
    );
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tab tables & projects
DROP TRIGGER IF EXISTS trg_archive_pm_project_team ON public.pm_project_team;
CREATE TRIGGER trg_archive_pm_project_team
    BEFORE DELETE ON public.pm_project_team
    FOR EACH ROW EXECUTE FUNCTION public.fn_archive_before_delete();

DROP TRIGGER IF EXISTS trg_archive_pm_wbs_items ON public.pm_wbs_items;
CREATE TRIGGER trg_archive_pm_wbs_items
    BEFORE DELETE ON public.pm_wbs_items
    FOR EACH ROW EXECUTE FUNCTION public.fn_archive_before_delete();

DROP TRIGGER IF EXISTS trg_archive_pm_payment_milestones ON public.pm_payment_milestones;
CREATE TRIGGER trg_archive_pm_payment_milestones
    BEFORE DELETE ON public.pm_payment_milestones
    FOR EACH ROW EXECUTE FUNCTION public.fn_archive_before_delete();

DROP TRIGGER IF EXISTS trg_archive_pm_change_orders ON public.pm_change_orders;
CREATE TRIGGER trg_archive_pm_change_orders
    BEFORE DELETE ON public.pm_change_orders
    FOR EACH ROW EXECUTE FUNCTION public.fn_archive_before_delete();

DROP TRIGGER IF EXISTS trg_archive_pm_invoices ON public.pm_invoices;
CREATE TRIGGER trg_archive_pm_invoices
    BEFORE DELETE ON public.pm_invoices
    FOR EACH ROW EXECUTE FUNCTION public.fn_archive_before_delete();
