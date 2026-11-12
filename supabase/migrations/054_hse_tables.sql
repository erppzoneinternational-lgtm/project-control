-- HSE Tables
-- Status: APPLIED TO LIVE SUPABASE (tgqpcviqmgtdddiqvqdw)

CREATE TABLE IF NOT EXISTS public.pm_hse_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    incident_number TEXT NOT NULL UNIQUE,
    incident_date TIMESTAMPTZ NOT NULL,
    severity TEXT,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    location_description TEXT,
    injury_count INTEGER DEFAULT 0,
    root_cause TEXT,
    corrective_actions TEXT,
    status TEXT DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pm_hse_inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    inspection_date TIMESTAMPTZ NOT NULL,
    inspector_name TEXT NOT NULL,
    score_pct NUMERIC(5,2),
    safe_acts_count INTEGER DEFAULT 0,
    unsafe_acts_count INTEGER DEFAULT 0,
    stop_work_issued BOOLEAN DEFAULT false,
    findings TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pm_hse_incidents_project_id ON public.pm_hse_incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_hse_inspections_project_id ON public.pm_hse_inspections(project_id);

-- Updated_at Triggers
DROP TRIGGER IF EXISTS trg_pm_hse_incidents_updated ON public.pm_hse_incidents;
CREATE TRIGGER trg_pm_hse_incidents_updated BEFORE UPDATE ON public.pm_hse_incidents FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_pm_hse_inspections_updated ON public.pm_hse_inspections;
CREATE TRIGGER trg_pm_hse_inspections_updated BEFORE UPDATE ON public.pm_hse_inspections FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- RLS
ALTER TABLE public.pm_hse_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_hse_inspections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_access" ON public.pm_hse_incidents;
CREATE POLICY "authenticated_access" ON public.pm_hse_incidents FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_access" ON public.pm_hse_inspections;
CREATE POLICY "authenticated_access" ON public.pm_hse_inspections FOR ALL TO authenticated USING (true) WITH CHECK (true);
