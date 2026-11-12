-- Contracts & Claims Tables
-- Status: APPLIED TO LIVE SUPABASE (tgqpcviqmgtdddiqvqdw)

-- Main contracts table
CREATE TABLE IF NOT EXISTS public.pm_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contract_number TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  contractor_name TEXT NOT NULL,
  original_value NUMERIC(18,2) NOT NULL DEFAULT 0,
  revised_value NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EGP',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'completed', 'terminated')),
  fidic_type TEXT CHECK (fidic_type IN ('red_book', 'yellow_book', 'silver_book')),
  retention_pct NUMERIC(5,2) NOT NULL DEFAULT 10,
  advance_payment_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  performance_bond_pct NUMERIC(5,2) NOT NULL DEFAULT 5,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, contract_number)
);

-- Claims table
CREATE TABLE IF NOT EXISTS public.pm_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.pm_contracts(id) ON DELETE CASCADE,
  claim_number TEXT NOT NULL,
  claim_type TEXT NOT NULL CHECK (claim_type IN ('variation_order', 'eot', 'cost_claim', 'delay_claim')),
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description TEXT NOT NULL DEFAULT '',
  claimed_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  approved_amount NUMERIC(18,2),
  submitted_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'closed')),
  submission_date DATE,
  review_date DATE,
  supporting_docs TEXT[] DEFAULT '{}',
  clause_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, claim_number)
);

-- Variation Orders table
CREATE TABLE IF NOT EXISTS public.pm_variation_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.pm_contracts(id) ON DELETE CASCADE,
  vo_number TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description TEXT NOT NULL DEFAULT '',
  vo_type TEXT NOT NULL CHECK (vo_type IN ('addition', 'omission', 'substitution')),
  original_scope TEXT NOT NULL DEFAULT '',
  revised_scope TEXT NOT NULL DEFAULT '',
  cost_impact NUMERIC(18,2) NOT NULL DEFAULT 0,
  time_impact_days INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'closed')),
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, vo_number)
);

-- Extension of Time requests
CREATE TABLE IF NOT EXISTS public.pm_eot_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.pm_contracts(id) ON DELETE CASCADE,
  eot_number TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  requested_days INTEGER NOT NULL DEFAULT 0,
  approved_days INTEGER,
  clause_reference TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'closed')),
  requested_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  submission_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, eot_number)
);

-- IPC Certificates
CREATE TABLE IF NOT EXISTS public.pm_ipc_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contract_id UUID NOT NULL REFERENCES public.pm_contracts(id) ON DELETE CASCADE,
  ipc_number INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_amount NUMERIC(18,2) NOT NULL DEFAULT 0,
  retention_deduction NUMERIC(18,2) NOT NULL DEFAULT 0,
  advance_recovery NUMERIC(18,2) NOT NULL DEFAULT 0,
  previous_certified NUMERIC(18,2) NOT NULL DEFAULT 0,
  current_certified NUMERIC(18,2) NOT NULL DEFAULT 0,
  net_payable NUMERIC(18,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'certified', 'paid')),
  certified_by UUID REFERENCES auth.users(id),
  certified_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, contract_id, ipc_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pm_contracts_project ON public.pm_contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_claims_project ON public.pm_claims(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_claims_contract ON public.pm_claims(contract_id);
CREATE INDEX IF NOT EXISTS idx_pm_claims_status ON public.pm_claims(status);
CREATE INDEX IF NOT EXISTS idx_pm_vo_project ON public.pm_variation_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_vo_contract ON public.pm_variation_orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_pm_eot_project ON public.pm_eot_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_ipc_project ON public.pm_ipc_certificates(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_ipc_contract ON public.pm_ipc_certificates(contract_id);

-- RLS
ALTER TABLE public.pm_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_variation_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_eot_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_ipc_certificates ENABLE ROW LEVEL SECURITY;

-- Policies (single company = authenticated users can access all)
DROP POLICY IF EXISTS "authenticated_access" ON public.pm_contracts;
CREATE POLICY "authenticated_access" ON public.pm_contracts FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_access" ON public.pm_claims;
CREATE POLICY "authenticated_access" ON public.pm_claims FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_access" ON public.pm_variation_orders;
CREATE POLICY "authenticated_access" ON public.pm_variation_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_access" ON public.pm_eot_requests;
CREATE POLICY "authenticated_access" ON public.pm_eot_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_access" ON public.pm_ipc_certificates;
CREATE POLICY "authenticated_access" ON public.pm_ipc_certificates FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pm_contracts_updated ON public.pm_contracts;
CREATE TRIGGER trg_pm_contracts_updated BEFORE UPDATE ON public.pm_contracts FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_pm_claims_updated ON public.pm_claims;
CREATE TRIGGER trg_pm_claims_updated BEFORE UPDATE ON public.pm_claims FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_pm_vo_updated ON public.pm_variation_orders;
CREATE TRIGGER trg_pm_vo_updated BEFORE UPDATE ON public.pm_variation_orders FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_pm_eot_updated ON public.pm_eot_requests;
CREATE TRIGGER trg_pm_eot_updated BEFORE UPDATE ON public.pm_eot_requests FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
DROP TRIGGER IF EXISTS trg_pm_ipc_updated ON public.pm_ipc_certificates;
CREATE TRIGGER trg_pm_ipc_updated BEFORE UPDATE ON public.pm_ipc_certificates FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
