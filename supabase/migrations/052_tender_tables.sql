-- Tender Tables
-- Status: APPLIED TO LIVE SUPABASE (tgqpcviqmgtdddiqvqdw)

CREATE TABLE IF NOT EXISTS public.pm_tenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_number TEXT NOT NULL UNIQUE,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    client_name TEXT NOT NULL,
    category TEXT,
    status TEXT DEFAULT 'DRAFT',
    estimated_budget NUMERIC(15,2),
    submission_deadline TIMESTAMPTZ,
    bond_amount NUMERIC(15,2),
    bond_validity_days INTEGER,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pm_tender_bidders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID NOT NULL REFERENCES public.pm_tenders(id) ON DELETE CASCADE,
    bidder_name TEXT NOT NULL,
    submitted_at TIMESTAMPTZ,
    bid_amount NUMERIC(15,2),
    technical_score NUMERIC(5,2),
    financial_score NUMERIC(5,2),
    ranking INTEGER,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pm_tenders_status ON public.pm_tenders(status);
CREATE INDEX IF NOT EXISTS idx_pm_tenders_submission_deadline ON public.pm_tenders(submission_deadline);
CREATE INDEX IF NOT EXISTS idx_pm_tender_bidders_tender_id ON public.pm_tender_bidders(tender_id);

-- Updated_at Triggers
DROP TRIGGER IF EXISTS trg_pm_tenders_updated ON public.pm_tenders;
CREATE TRIGGER trg_pm_tenders_updated BEFORE UPDATE ON public.pm_tenders FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_pm_tender_bidders_updated ON public.pm_tender_bidders;
CREATE TRIGGER trg_pm_tender_bidders_updated BEFORE UPDATE ON public.pm_tender_bidders FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- RLS
ALTER TABLE public.pm_tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_tender_bidders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_access" ON public.pm_tenders;
CREATE POLICY "authenticated_access" ON public.pm_tenders FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_access" ON public.pm_tender_bidders;
CREATE POLICY "authenticated_access" ON public.pm_tender_bidders FOR ALL TO authenticated USING (true) WITH CHECK (true);
