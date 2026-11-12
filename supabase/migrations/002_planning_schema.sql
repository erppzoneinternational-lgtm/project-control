-- ============================================================================
-- Migration 002: Planning Schema
-- Pzone International ERP — New Supabase Account
-- Date: 2026-08-24
-- Depends on: 001_core_schema.sql
-- ROLLBACK: See bottom of file
-- ============================================================================

-- ============================================================================
-- 1. ZONES
-- ============================================================================

CREATE TABLE public.pm_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  parent_zone_id UUID REFERENCES public.pm_zones(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.pm_zones IS 'Project zones (Lagoon 1, Pump Room 01, etc.) — matches SLX concept';

CREATE TRIGGER pm_zones_updated_at
  BEFORE UPDATE ON public.pm_zones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 2. BOQ SECTIONS (Zone × Discipline hierarchy)
-- ============================================================================

CREATE TABLE public.pm_boq_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES public.pm_zones(id) ON DELETE SET NULL,
  discipline TEXT,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  parent_section_id UUID REFERENCES public.pm_boq_sections(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.pm_boq_sections IS 'BOQ section hierarchy: Zone x Discipline grouping';

CREATE TRIGGER pm_boq_sections_updated_at
  BEFORE UPDATE ON public.pm_boq_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 3. BOQ ITEMS
-- ============================================================================

CREATE TABLE public.pm_boq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  section_id UUID REFERENCES public.pm_boq_sections(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.pm_zones(id) ON DELETE SET NULL,
  item_code TEXT,
  description_ar TEXT NOT NULL,
  description_en TEXT,
  unit TEXT NOT NULL,
  item_type public.boq_item_type NOT NULL DEFAULT 'measurable',
  contract_qty NUMERIC(15,3),
  rate_egp NUMERIC(15,2),
  amount_egp NUMERIC(15,2) GENERATED ALWAYS AS (contract_qty * rate_egp) STORED,
  sort_order INT NOT NULL DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.pm_boq_items IS 'BOQ line items within sections. rate_egp hidden from site_engineer via RPC';

CREATE TRIGGER pm_boq_items_updated_at
  BEFORE UPDATE ON public.pm_boq_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 4. ACTIVITY LIBRARY (company-wide seed catalog)
-- ============================================================================

CREATE TABLE public.pm_activity_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  category TEXT CHECK (category IN (
    'Civil', 'Concrete work', 'Earth Work', 'mechanical',
    'electrical', 'Arcticture', 'General'
  )),
  phase TEXT CHECK (phase IN (
    'Milestones', 'Contractual milestone', 'Mobilization',
    'Engineering', 'Procurement', 'Construction',
    'Testing & Commissioning', 'Taking over certificate'
  )),
  discipline TEXT,
  unit TEXT,
  typical_duration_days INT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.pm_activity_library IS 'Company-wide activity catalog. Seeded from SLX 462 construction activities';

CREATE TRIGGER pm_activity_library_updated_at
  BEFORE UPDATE ON public.pm_activity_library
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 5. PROJECT ACTIVITIES (per-project instances)
-- ============================================================================

CREATE TABLE public.pm_project_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  library_activity_id UUID REFERENCES public.pm_activity_library(id) ON DELETE SET NULL,
  code TEXT,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  zone_id UUID REFERENCES public.pm_zones(id) ON DELETE SET NULL,
  wbs_item_id UUID,
  scope_type public.scope_type NOT NULL DEFAULT 'original',
  vo_number TEXT,
  planned_start DATE,
  planned_finish DATE,
  actual_start DATE,
  actual_finish DATE,
  weight_override NUMERIC(7,4),
  percent_complete NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (percent_complete >= 0 AND percent_complete <= 100),
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- VO activities must have vo_number
  CONSTRAINT vo_requires_number CHECK (
    scope_type != 'vo' OR (vo_number IS NOT NULL AND TRIM(vo_number) != '')
  )
);

COMMENT ON TABLE public.pm_project_activities IS 'Project-specific activities linked from library. percent_complete updated by trigger on allocations';

CREATE TRIGGER pm_project_activities_updated_at
  BEFORE UPDATE ON public.pm_project_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 6. ACTIVITY ↔ BOQ LINKS (Many-to-Many)
-- ============================================================================

CREATE TABLE public.pm_activity_boq_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.pm_project_activities(id) ON DELETE CASCADE,
  boq_item_id UUID NOT NULL REFERENCES public.pm_boq_items(id) ON DELETE CASCADE,
  planned_qty NUMERIC(15,3),
  snapshot_rate_egp NUMERIC(15,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(activity_id, boq_item_id)
);

COMMENT ON TABLE public.pm_activity_boq_links IS 'Many-to-many: activities <-> BOQ items with planned quantities and frozen rates';

-- ============================================================================
-- 7. DAILY REPORTS (header)
-- ============================================================================

CREATE TABLE public.pm_daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  status public.daily_report_status NOT NULL DEFAULT 'draft',
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ,
  -- PM soft review
  pm_reviewed_by UUID REFERENCES auth.users(id),
  pm_reviewed_at TIMESTAMPTZ,
  pm_skipped BOOLEAN NOT NULL DEFAULT FALSE,
  -- Planner final approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  -- Metadata
  notes TEXT,
  weather TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, report_date)
);

COMMENT ON TABLE public.pm_daily_reports IS 'Daily progress report header. Workflow: draft → submitted → [PM review] → approved/rejected';

CREATE TRIGGER pm_daily_reports_updated_at
  BEFORE UPDATE ON public.pm_daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Workflow lock: prevent edits during approval
CREATE OR REPLACE FUNCTION public.enforce_daily_report_workflow()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Can't modify submitted/under_review report (except by planner approving/rejecting)
  IF OLD.status IN ('submitted', 'under_review') AND
     NEW.status NOT IN ('approved', 'rejected', 'draft') THEN
    RAISE EXCEPTION 'Cannot modify daily report during approval workflow (status: %)', OLD.status;
  END IF;
  -- Approved reports are locked
  IF OLD.status = 'approved' THEN
    RAISE EXCEPTION 'Cannot modify approved daily report';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER pm_daily_reports_workflow
  BEFORE UPDATE ON public.pm_daily_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_daily_report_workflow();

-- ============================================================================
-- 8. DAILY REPORT LINES (detail)
-- ============================================================================

CREATE TABLE public.pm_daily_report_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.pm_daily_reports(id) ON DELETE CASCADE,
  boq_item_id UUID NOT NULL REFERENCES public.pm_boq_items(id) ON DELETE RESTRICT,
  qty_today NUMERIC(15,3),
  pct_today NUMERIC(5,2),
  cumulative_qty NUMERIC(15,3),
  cumulative_pct NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Either qty or pct, not both
  CONSTRAINT qty_or_pct CHECK (
    (qty_today IS NOT NULL AND pct_today IS NULL) OR
    (qty_today IS NULL AND pct_today IS NOT NULL) OR
    (qty_today IS NULL AND pct_today IS NULL)
  )
);

COMMENT ON TABLE public.pm_daily_report_lines IS 'Daily report detail: qty (measurable) or % (lump sum) per BOQ item';

-- Lump-sum monotonic enforcement
CREATE OR REPLACE FUNCTION public.enforce_lumpsum_monotonic()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_item_type public.boq_item_type;
  v_prev_cumulative NUMERIC(5,2);
BEGIN
  -- Only enforce for lump_sum items with pct_today
  IF NEW.pct_today IS NULL THEN RETURN NEW; END IF;

  SELECT item_type INTO v_item_type
  FROM public.pm_boq_items
  WHERE id = NEW.boq_item_id;

  IF v_item_type != 'lump_sum' THEN RETURN NEW; END IF;

  -- Get previous cumulative from most recent approved report
  SELECT drl.cumulative_pct INTO v_prev_cumulative
  FROM public.pm_daily_report_lines drl
  JOIN public.pm_daily_reports dr ON dr.id = drl.report_id
  WHERE drl.boq_item_id = NEW.boq_item_id
    AND dr.status = 'approved'
    AND dr.id != COALESCE(NEW.report_id, '00000000-0000-0000-0000-000000000000'::uuid)
  ORDER BY dr.report_date DESC
  LIMIT 1;

  v_prev_cumulative := COALESCE(v_prev_cumulative, 0);

  IF NEW.cumulative_pct < v_prev_cumulative THEN
    RAISE EXCEPTION 'Lump sum cumulative %% cannot decrease (current: %, previous: %)',
      NEW.cumulative_pct, v_prev_cumulative;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER pm_daily_report_lines_monotonic
  BEFORE INSERT OR UPDATE ON public.pm_daily_report_lines
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_lumpsum_monotonic();

-- ============================================================================
-- 9. DAILY REPORT DOCUMENTS/PHOTOS
-- ============================================================================

CREATE TABLE public.pm_daily_report_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.pm_daily_reports(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  description TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.pm_daily_report_documents IS 'Attachments: delivery notes, equipment rental docs, steel deductions, site paperwork';

-- ============================================================================
-- 10. PROGRESS ALLOCATIONS (planner-controlled)
-- ============================================================================

CREATE TABLE public.pm_progress_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_report_line_id UUID NOT NULL REFERENCES public.pm_daily_report_lines(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.pm_project_activities(id) ON DELETE CASCADE,
  boq_item_id UUID NOT NULL REFERENCES public.pm_boq_items(id) ON DELETE RESTRICT,
  allocated_qty NUMERIC(15,3),
  allocated_pct NUMERIC(5,2),
  snapshot_rate_egp NUMERIC(15,2),
  allocated_by UUID NOT NULL REFERENCES auth.users(id),
  allocated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.pm_progress_allocations IS 'Planner maps daily report quantities to activities. Never auto-allocated.';

-- Trigger: update activity percent_complete after allocation
CREATE OR REPLACE FUNCTION public.update_activity_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_activity_id UUID;
  v_budgeted NUMERIC;
  v_earned NUMERIC;
  v_new_pct NUMERIC;
BEGIN
  v_activity_id := COALESCE(NEW.activity_id, OLD.activity_id);

  -- Budgeted cost = SUM of linked BOQ planned_qty * rate
  SELECT COALESCE(SUM(abl.planned_qty * bi.rate_egp), 0)
  INTO v_budgeted
  FROM public.pm_activity_boq_links abl
  JOIN public.pm_boq_items bi ON bi.id = abl.boq_item_id
  WHERE abl.activity_id = v_activity_id;

  -- Earned cost = SUM of allocations * snapshot_rate
  SELECT COALESCE(SUM(pa.allocated_qty * pa.snapshot_rate_egp), 0)
  INTO v_earned
  FROM public.pm_progress_allocations pa
  WHERE pa.activity_id = v_activity_id;

  -- Calculate percent
  IF v_budgeted > 0 THEN
    v_new_pct := LEAST(100, ROUND(v_earned / v_budgeted * 100, 2));
  ELSE
    v_new_pct := 0;
  END IF;

  UPDATE public.pm_project_activities
  SET percent_complete = v_new_pct
  WHERE id = v_activity_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER pm_allocations_update_progress
  AFTER INSERT OR UPDATE OR DELETE ON public.pm_progress_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_activity_progress();

-- ============================================================================
-- 11. WEEKLY REPORTS (auto-generated from approved dailies)
-- ============================================================================

CREATE TABLE public.pm_weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  -- Aggregated data (snapshot)
  total_activities INT,
  completed_activities INT,
  overall_progress_pct NUMERIC(5,2),
  spi NUMERIC(5,3),
  summary_json JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, week_start)
);

COMMENT ON TABLE public.pm_weekly_reports IS 'Auto-generated from approved daily reports. Reviewed by planning_manager.';

CREATE TRIGGER pm_weekly_reports_updated_at
  BEFORE UPDATE ON public.pm_weekly_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 12. MONTHLY REPORTS
-- ============================================================================

CREATE TABLE public.pm_monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  report_month DATE NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  -- EVM fields
  planned_value NUMERIC(15,2),
  earned_value NUMERIC(15,2),
  actual_cost NUMERIC(15,2),
  spi NUMERIC(5,3),
  cpi NUMERIC(5,3),
  overall_progress_pct NUMERIC(5,2),
  summary_json JSONB,
  scurve_data JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, report_month)
);

COMMENT ON TABLE public.pm_monthly_reports IS 'Monthly aggregation with EVM (SPI/CPI), S-Curve data, baseline comparison';

CREATE TRIGGER pm_monthly_reports_updated_at
  BEFORE UPDATE ON public.pm_monthly_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- DROP TRIGGER IF EXISTS pm_monthly_reports_updated_at ON public.pm_monthly_reports;
-- DROP TRIGGER IF EXISTS pm_weekly_reports_updated_at ON public.pm_weekly_reports;
-- DROP TRIGGER IF EXISTS pm_allocations_update_progress ON public.pm_progress_allocations;
-- DROP TRIGGER IF EXISTS pm_daily_report_lines_monotonic ON public.pm_daily_report_lines;
-- DROP TRIGGER IF EXISTS pm_daily_reports_workflow ON public.pm_daily_reports;
-- DROP TRIGGER IF EXISTS pm_daily_reports_updated_at ON public.pm_daily_reports;
-- DROP TRIGGER IF EXISTS pm_project_activities_updated_at ON public.pm_project_activities;
-- DROP TRIGGER IF EXISTS pm_activity_library_updated_at ON public.pm_activity_library;
-- DROP TRIGGER IF EXISTS pm_boq_items_updated_at ON public.pm_boq_items;
-- DROP TRIGGER IF EXISTS pm_boq_sections_updated_at ON public.pm_boq_sections;
-- DROP TRIGGER IF EXISTS pm_zones_updated_at ON public.pm_zones;
-- DROP FUNCTION IF EXISTS public.update_activity_progress;
-- DROP FUNCTION IF EXISTS public.enforce_lumpsum_monotonic;
-- DROP FUNCTION IF EXISTS public.enforce_daily_report_workflow;
-- DROP TABLE IF EXISTS public.pm_monthly_reports;
-- DROP TABLE IF EXISTS public.pm_weekly_reports;
-- DROP TABLE IF EXISTS public.pm_progress_allocations;
-- DROP TABLE IF EXISTS public.pm_daily_report_documents;
-- DROP TABLE IF EXISTS public.pm_daily_report_lines;
-- DROP TABLE IF EXISTS public.pm_daily_reports;
-- DROP TABLE IF EXISTS public.pm_activity_boq_links;
-- DROP TABLE IF EXISTS public.pm_project_activities;
-- DROP TABLE IF EXISTS public.pm_activity_library;
-- DROP TABLE IF EXISTS public.pm_boq_items;
-- DROP TABLE IF EXISTS public.pm_boq_sections;
-- DROP TABLE IF EXISTS public.pm_zones;
