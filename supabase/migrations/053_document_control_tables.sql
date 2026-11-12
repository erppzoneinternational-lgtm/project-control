-- Document Control Tables
-- Status: APPLIED TO LIVE SUPABASE (tgqpcviqmgtdddiqvqdw)

CREATE TABLE IF NOT EXISTS public.pm_controlled_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    document_number TEXT NOT NULL,
    revision TEXT,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    type TEXT,
    discipline TEXT,
    status TEXT DEFAULT 'DRAFT',
    file_url TEXT,
    file_size_bytes BIGINT,
    mime_type TEXT,
    issued_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, document_number, revision)
);

CREATE TABLE IF NOT EXISTS public.pm_document_transmittals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transmittal_number TEXT NOT NULL UNIQUE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    sender TEXT,
    recipient TEXT,
    purpose TEXT,
    transmission_date TIMESTAMPTZ,
    documents_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'SENT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pm_controlled_documents_project_id ON public.pm_controlled_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_controlled_documents_status ON public.pm_controlled_documents(status);
CREATE INDEX IF NOT EXISTS idx_pm_document_transmittals_project_id ON public.pm_document_transmittals(project_id);

-- Updated_at Triggers
DROP TRIGGER IF EXISTS trg_pm_controlled_documents_updated ON public.pm_controlled_documents;
CREATE TRIGGER trg_pm_controlled_documents_updated BEFORE UPDATE ON public.pm_controlled_documents FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_pm_document_transmittals_updated ON public.pm_document_transmittals;
CREATE TRIGGER trg_pm_document_transmittals_updated BEFORE UPDATE ON public.pm_document_transmittals FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- RLS
ALTER TABLE public.pm_controlled_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_document_transmittals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_access" ON public.pm_controlled_documents;
CREATE POLICY "authenticated_access" ON public.pm_controlled_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_access" ON public.pm_document_transmittals;
CREATE POLICY "authenticated_access" ON public.pm_document_transmittals FOR ALL TO authenticated USING (true) WITH CHECK (true);
