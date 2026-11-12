-- ============================================================================
-- Migration 057: Planning Module Activities & WBS Core Tables
-- Pzone International Project Control
-- Purpose:
--   Establishes the core planning tables (pm_wbs_items, pm_schedule_versions,
--   pm_project_activities, pm_activity_dependencies) in public schema
--   referencing public.projects(id) for full Schedule Pulse & ERP integration.
-- ============================================================================

BEGIN;

-- 1. Create pm_wbs_items table
CREATE TABLE IF NOT EXISTS public.pm_wbs_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.pm_wbs_items(id) ON DELETE SET NULL,
  wbs_code TEXT NOT NULL,
  name_ar TEXT,
  name_en TEXT,
  title_ar TEXT,
  title_en TEXT,
  level INT DEFAULT 1,
  sort_order INT DEFAULT 0,
  status TEXT DEFAULT 'not_started',
  budgeted_cost NUMERIC(15,2) DEFAULT 0,
  actual_cost NUMERIC(15,2) DEFAULT 0,
  earned_value NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create pm_schedule_versions table
CREATE TABLE IF NOT EXISTS public.pm_schedule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_no INT DEFAULT 1,
  version_type TEXT NOT NULL DEFAULT 'baseline',
  title TEXT,
  source_file_name TEXT,
  data_date DATE,
  activities_count INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  submitted_by UUID,
  submitted_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  approval_note TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create pm_project_activities table
CREATE TABLE IF NOT EXISTS public.pm_project_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  schedule_version_id UUID REFERENCES public.pm_schedule_versions(id) ON DELETE SET NULL,
  wbs_item_id UUID REFERENCES public.pm_wbs_items(id) ON DELETE SET NULL,
  code TEXT,
  activity_code TEXT,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  planned_start DATE,
  planned_finish DATE,
  actual_start DATE,
  actual_finish DATE,
  duration_days NUMERIC DEFAULT 1,
  remaining_duration_days NUMERIC,
  percent_complete NUMERIC(5,2) NOT NULL DEFAULT 0,
  weight_override NUMERIC(7,4),
  total_float_days NUMERIC,
  free_float_days NUMERIC,
  is_critical BOOLEAN DEFAULT FALSE,
  is_milestone BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'not_started',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create pm_activity_dependencies table
CREATE TABLE IF NOT EXISTS public.pm_activity_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  predecessor_id TEXT NOT NULL,
  successor_id TEXT NOT NULL,
  dependency_type TEXT DEFAULT 'FS',
  rel TEXT DEFAULT 'FS',
  lag_days NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_pm_activity_dependencies_pair UNIQUE (predecessor_id, successor_id)
);

-- 5. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_pm_wbs_items_project ON public.pm_wbs_items(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_wbs_items_parent ON public.pm_wbs_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_pm_sched_ver_project ON public.pm_schedule_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_proj_act_project ON public.pm_project_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_pm_proj_act_wbs ON public.pm_project_activities(wbs_item_id);
CREATE INDEX IF NOT EXISTS idx_pm_proj_act_version ON public.pm_project_activities(schedule_version_id);
CREATE INDEX IF NOT EXISTS idx_pm_act_dep_project ON public.pm_activity_dependencies(project_id);

-- 6. Enable RLS and setup permissive policies
ALTER TABLE public.pm_wbs_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_schedule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_activity_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pm_wbs_items_auth_all" ON public.pm_wbs_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pm_wbs_items_service_all" ON public.pm_wbs_items
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "pm_schedule_versions_auth_all" ON public.pm_schedule_versions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pm_schedule_versions_service_all" ON public.pm_schedule_versions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "pm_project_activities_auth_all" ON public.pm_project_activities
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pm_project_activities_service_all" ON public.pm_project_activities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "pm_activity_dependencies_auth_all" ON public.pm_activity_dependencies
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "pm_activity_dependencies_service_all" ON public.pm_activity_dependencies
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;
