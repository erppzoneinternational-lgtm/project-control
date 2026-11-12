-- Cost Control & EVM Tables
-- Status: APPLIED TO LIVE SUPABASE (tgqpcviqmgtdddiqvqdw)

-- Cost snapshots (EVM data points)
CREATE TABLE IF NOT EXISTS public.pm_cost_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  budget_at_completion NUMERIC(18,2) NOT NULL DEFAULT 0,
  actual_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  earned_value NUMERIC(18,2) NOT NULL DEFAULT 0,
  planned_value NUMERIC(18,2) NOT NULL DEFAULT 0,
  spi NUMERIC(10,4) NOT NULL DEFAULT 0,
  cpi NUMERIC(10,4) NOT NULL DEFAULT 0,
  sv NUMERIC(18,2) NOT NULL DEFAULT 0,
  cv NUMERIC(18,2) NOT NULL DEFAULT 0,
  eac NUMERIC(18,2) NOT NULL DEFAULT 0,
  etc NUMERIC(18,2) NOT NULL DEFAULT 0,
  vac NUMERIC(18,2) NOT NULL DEFAULT 0,
  tcpi NUMERIC(10,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, snapshot_date)
);

-- Budget lines per cost code
CREATE TABLE IF NOT EXISTS public.pm_budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  cost_code_id UUID NOT NULL REFERENCES public.pm_cost_codes(id) ON DELETE CASCADE,
  description_ar TEXT NOT NULL,
  description_en TEXT,
  original_budget NUMERIC(18,2) NOT NULL DEFAULT 0,
  approved_changes NUMERIC(18,2) NOT NULL DEFAULT 0,
  current_budget NUMERIC(18,2) GENERATED ALWAYS AS (original_budget + approved_changes) STORED,
  committed_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  actual_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  forecast_cost NUMERIC(18,2) NOT NULL DEFAULT 0,
  variance NUMERIC(18,2) GENERATED ALWAYS AS ((original_budget + approved_changes) - forecast_cost) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, cost_code_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pm_cost_snapshots_project ON public.pm_cost_snapshots(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_cost_snapshots_date ON public.pm_cost_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_pm_budget_lines_project ON public.pm_budget_lines(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_budget_lines_cost_code ON public.pm_budget_lines(cost_code_id);

-- RLS
ALTER TABLE public.pm_cost_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_budget_lines ENABLE ROW LEVEL SECURITY;

-- Policies (single company)
DROP POLICY IF EXISTS "authenticated_access" ON public.pm_cost_snapshots;
CREATE POLICY "authenticated_access" ON public.pm_cost_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_access" ON public.pm_budget_lines;
CREATE POLICY "authenticated_access" ON public.pm_budget_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Updated_at trigger for budget_lines
DROP TRIGGER IF EXISTS trg_pm_budget_lines_updated ON public.pm_budget_lines;
CREATE TRIGGER trg_pm_budget_lines_updated BEFORE UPDATE ON public.pm_budget_lines FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();
