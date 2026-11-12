-- ADAPTED 012_planning_module.sql (canonical-generation alignment) - see APPLY_REPORT_20260824.md
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS completion_pct NUMERIC(5,2);

-- ============================================================
-- 012_planning_module.sql — Full Planning & Technical Office Module Foundation (v3.4)
-- Integrated Schema for:
--   1. Planning Core & BOQ Engine (Cost Codes, BOQ, BOM Sub-Materials, Revisions, Milestones, Activities, Dependencies, Schedules, Calendars)
--   2. Site Field Progress & Allocations (Daily Progress, Lines, Photos, Manpower, Equipment, Allocations)
--   3. Technical Office Deliverables E1/E2 & Governance (Deliverables, Items, Attachments, Events, Dependencies, RFI, Obstructions)
--   4. Commercial Control & Subcontractors (MOS, Targets, Material Transactions & Allocations, Commercial Settings, Weekly Reports, Delegations, Holds, S-Curve Cache)
--   5. Security Definer Concurrency Guards, Snapshots, Calculation Triggers, Security Invoker Views, Multi-Tier RLS, Storage Buckets
-- ============================================================

BEGIN;

-- ============================================================
-- 0. SHARED HELPERS & ACCESS CONTROL FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- §15: Project membership table (three-tier permissions: view, operate, manage)
CREATE TABLE IF NOT EXISTS public.pm_user_project_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL CHECK (access_level IN ('view','operate','manage')),
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, project_id)
);
CREATE INDEX IF NOT EXISTS idx_upa_user ON public.pm_user_project_access(user_id);
CREATE INDEX IF NOT EXISTS idx_upa_project ON public.pm_user_project_access(project_id);

CREATE OR REPLACE FUNCTION public.fn_user_can_access_project(p_project_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public AS $$
BEGIN
  IF p_project_id IS NULL THEN
    RETURN true;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager','project_manager')
  ) THEN
    RETURN true;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.pm_user_project_access upa
    WHERE upa.user_id = auth.uid() AND upa.project_id = p_project_id
  );
END;
$$;


-- ============================================================
-- 1. PLANNING CORE & BOQ ENGINE (11 TABLES)
-- ============================================================

-- 1.1 Master Cost Codes (Shared directory across all projects)
CREATE TABLE IF NOT EXISTS public.pm_cost_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  category TEXT CHECK (category IN ('preliminaries','concrete','finishing','mech','elec','landscape','water_features','other')),
  parent_code TEXT REFERENCES public.pm_cost_codes(code),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cost_codes_code ON public.pm_cost_codes(code);
CREATE INDEX IF NOT EXISTS idx_cost_codes_category ON public.pm_cost_codes(category);

-- 1.2 BOQ Items (In-place revisions · TO#2 · 360°#5/10)
CREATE TABLE IF NOT EXISTS public.pm_boq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  item_code TEXT NOT NULL,
  cost_code_id UUID REFERENCES public.pm_cost_codes(id) ON DELETE SET NULL,
  description_ar TEXT NOT NULL,
  description_en TEXT,
  unit TEXT NOT NULL,
  contract_qty NUMERIC(14,3) NOT NULL CHECK (contract_qty >= 0),
  shop_drawing_qty NUMERIC(14,3),
  pricing_status TEXT NOT NULL DEFAULT 'contract_original'
    CHECK (pricing_status IN ('contract_original','vo_approved','star_rate_provisional','disputed')),
  foreign_currency TEXT NOT NULL DEFAULT 'EGP',
  base_foreign_amount NUMERIC(15,2),
  rate_egp NUMERIC(15,4) NOT NULL CHECK (rate_egp >= 0),
  amount_egp NUMERIC(15,2) GENERATED ALWAYS AS (contract_qty * rate_egp) STORED,
  wbs_item_id UUID REFERENCES public.pm_wbs_items(id) ON DELETE SET NULL,
  revision INT NOT NULL DEFAULT 1,
  is_current BOOLEAN NOT NULL DEFAULT true,
  superseded_at TIMESTAMPTZ,
  vo_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, item_code)
);
CREATE INDEX IF NOT EXISTS idx_boq_project ON public.pm_boq_items(project_id);
CREATE INDEX IF NOT EXISTS idx_boq_cost_code ON public.pm_boq_items(cost_code_id);
CREATE INDEX IF NOT EXISTS idx_boq_is_current ON public.pm_boq_items(project_id) WHERE is_current = true;

-- 1.3 BOM Sub-Materials Engine
CREATE TABLE IF NOT EXISTS public.pm_boq_sub_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_item_id UUID NOT NULL REFERENCES public.pm_boq_items(id) ON DELETE CASCADE,
  material_name_ar TEXT NOT NULL,
  material_name_en TEXT,
  unit TEXT NOT NULL,
  consumption_rate NUMERIC(8,4) NOT NULL DEFAULT 1.0000 CHECK (consumption_rate >= 0),
  standard_wastage_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (standard_wastage_pct >= 0 AND standard_wastage_pct <= 100),
  required_procurement_qty NUMERIC(14,3),
  ordered_qty NUMERIC(14,3) DEFAULT 0.000,
  delivered_to_site_qty NUMERIC(14,3) DEFAULT 0.000,
  procurement_stage TEXT NOT NULL DEFAULT 'material_submittal'
    CHECK (procurement_stage IN ('material_submittal','material_approval','purchasing','delivered_site')),
  last_purchase_price NUMERIC(15,4),
  supplier_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sub_mat_boq ON public.pm_boq_sub_materials(boq_item_id);

-- 1.4 BOQ Revisions History
CREATE TABLE IF NOT EXISTS public.pm_boq_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_item_id UUID NOT NULL REFERENCES public.pm_boq_items(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  revision INT NOT NULL,
  revision_no INT,
  contract_qty NUMERIC(14,3) NOT NULL,
  rate_egp NUMERIC(15,4) NOT NULL,
  amount_egp NUMERIC(15,2),
  description_ar TEXT,
  reason TEXT,
  change_reason TEXT,
  changed_by UUID REFERENCES auth.users(id),
  snapshot_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (boq_item_id, revision)
);
CREATE INDEX IF NOT EXISTS idx_boq_rev_item ON public.pm_boq_revisions(boq_item_id);
CREATE INDEX IF NOT EXISTS idx_boq_rev_project ON public.pm_boq_revisions(project_id);

-- 1.5 BOQ Milestone Payment Steps
CREATE TABLE IF NOT EXISTS public.pm_boq_milestone_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  boq_item_id UUID NOT NULL REFERENCES public.pm_boq_items(id) ON DELETE CASCADE,
  step_name_ar TEXT NOT NULL,
  step_name_en TEXT,
  weight_pct NUMERIC(5,2) NOT NULL CHECK (weight_pct > 0 AND weight_pct <= 100),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_boq_milestones_item ON public.pm_boq_milestone_steps(boq_item_id);

-- Milestone steps must not exceed 100% total weight per BOQ item (F8)
CREATE OR REPLACE FUNCTION public.fn_milestone_sum_guard()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_sum NUMERIC(7,2);
BEGIN
  SELECT COALESCE(SUM(weight_pct), 0) INTO v_sum
  FROM public.pm_boq_milestone_steps
  WHERE boq_item_id = COALESCE(NEW.boq_item_id, OLD.boq_item_id);

  IF v_sum > 100 THEN
    RAISE EXCEPTION 'مجموع أوزان مراحل الصرف للبند تجاوز 100%% (الحالي: %)', v_sum;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_milestone_sum ON public.pm_boq_milestone_steps;
CREATE TRIGGER trg_milestone_sum
  AFTER INSERT OR UPDATE OR DELETE ON public.pm_boq_milestone_steps
  FOR EACH ROW EXECUTE FUNCTION public.fn_milestone_sum_guard();

-- 1.6 Activity Library Dictionary (Standard activity definitions)
CREATE TABLE IF NOT EXISTS public.pm_activity_library (
  activity_code TEXT PRIMARY KEY,
  library_code TEXT,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  discipline TEXT CHECK (discipline IN ('civil','finishing','mech','elec','landscape','water','mep','other')),
  default_unit TEXT,
  typical_duration_days INT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 1.7 Project Baseline Activities (Integrated with XER & EVM)
CREATE TABLE IF NOT EXISTS public.pm_project_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  library_code TEXT REFERENCES public.pm_activity_library(activity_code) ON DELETE SET NULL,
  activity_code TEXT NOT NULL,
  wbs_item_id UUID REFERENCES public.pm_wbs_items(id) ON DELETE SET NULL,
  name_ar TEXT,
  name_en TEXT,
  discipline TEXT CHECK (discipline IN ('civil','finishing','mech','elec','landscape','water','mep','other')),
  planned_start DATE NOT NULL,
  planned_finish DATE NOT NULL,
  duration_days INT NOT NULL DEFAULT 1,
  budgeted_cost_egp NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  weight_pct NUMERIC(6,3),
  boq_link_mode TEXT NOT NULL DEFAULT 'by_items' CHECK (boq_link_mode IN ('by_items','manual_cost','weight')),
  is_milestone BOOLEAN NOT NULL DEFAULT false,
  is_critical BOOLEAN NOT NULL DEFAULT false,
  actual_start DATE,
  actual_finish DATE,
  percent_complete NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (percent_complete >= 0 AND percent_complete <= 100),
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed','delayed')),
  responsible_stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  total_float_days INT DEFAULT 0,
  free_float_days INT DEFAULT 0,
  remaining_duration_days INT,
  expected_finish DATE,
  calendar_type TEXT DEFAULT 'standard_6d',
  is_out_of_sequence BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (planned_finish >= planned_start),
  UNIQUE (project_id, activity_code)
);
CREATE INDEX IF NOT EXISTS idx_activities_project ON public.pm_project_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_wbs ON public.pm_project_activities(wbs_item_id);
CREATE INDEX IF NOT EXISTS idx_activities_resp ON public.pm_project_activities(responsible_stakeholder_id);

-- 1.8 Activity to BOQ Links (N:N junction with baseline rates)
CREATE TABLE IF NOT EXISTS public.pm_activity_boq_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES public.pm_project_activities(id) ON DELETE CASCADE,
  boq_item_id UUID NOT NULL REFERENCES public.pm_boq_items(id) ON DELETE RESTRICT,
  planned_qty NUMERIC(14,3) NOT NULL CHECK (planned_qty > 0),
  baseline_rate_egp NUMERIC(15,4) NOT NULL CHECK (baseline_rate_egp >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (activity_id, boq_item_id)
);
CREATE INDEX IF NOT EXISTS idx_act_boq_activity ON public.pm_activity_boq_links(activity_id);
CREATE INDEX IF NOT EXISTS idx_act_boq_item ON public.pm_activity_boq_links(boq_item_id);

-- 1.9 Activity Dependencies (CPM Predecessors / Successors)
CREATE TABLE IF NOT EXISTS public.pm_activity_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id UUID NOT NULL REFERENCES public.pm_project_activities(id) ON DELETE CASCADE,
  successor_id UUID NOT NULL REFERENCES public.pm_project_activities(id) ON DELETE CASCADE,
  rel TEXT NOT NULL DEFAULT 'FS' CHECK (rel IN ('FS','SS','FF','SF')),
  lag_days INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (predecessor_id, successor_id)
);
CREATE INDEX IF NOT EXISTS idx_act_dep_pred ON public.pm_activity_dependencies(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_act_dep_succ ON public.pm_activity_dependencies(successor_id);

-- 1.10 Schedule Versions (Primavera XER & Monthly Baseline Revisions)
CREATE TABLE IF NOT EXISTS public.pm_schedule_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_no INT NOT NULL,
  label TEXT,
  source_type TEXT NOT NULL DEFAULT 'xer' CHECK (source_type IN ('xer','xml','manual')),
  storage_path TEXT,
  data_date DATE,
  activities_count INT DEFAULT 0,
  critical_count INT DEFAULT 0,
  is_current BOOLEAN NOT NULL DEFAULT false,
  parsed_snapshot JSONB,
  transmittal_no TEXT,
  time_bar_deadline DATE,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, version_no)
);
CREATE INDEX IF NOT EXISTS idx_sched_ver_project ON public.pm_schedule_versions(project_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_sched_ver_current ON public.pm_schedule_versions(project_id) WHERE is_current = true;

-- 1.11 Calendar Exceptions & Non-Working Days
CREATE TABLE IF NOT EXISTS public.pm_activity_calendar_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.pm_project_activities(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  is_working_day BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cal_exceptions ON public.pm_activity_calendar_exceptions(project_id, exception_date);


-- ============================================================
-- 2. FIELD PROGRESS & QUANTITY ALLOCATION ENGINE (6 TABLES)
-- ============================================================

-- 2.1 Daily Progress Reports Header (Serialized per project)
CREATE TABLE IF NOT EXISTS public.pm_daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  discipline TEXT NOT NULL DEFAULT 'civil' CHECK (discipline IN ('civil','finishing','mep','landscape','water_features','other')),
  report_no INT NOT NULL,
  weather TEXT,
  manpower_count INT DEFAULT 0,
  equipment_summary TEXT,
  entered_by UUID REFERENCES auth.users(id),
  entered_by_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','partially_approved','approved','rejected','reopened')),
  submitted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  reopened_reason TEXT,
  idempotency_key TEXT UNIQUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, progress_date, discipline),
  UNIQUE(project_id, report_no)
);
CREATE INDEX IF NOT EXISTS idx_dp_project ON public.pm_daily_progress(project_id);
CREATE INDEX IF NOT EXISTS idx_dp_date ON public.pm_daily_progress(progress_date);
CREATE INDEX IF NOT EXISTS idx_dp_status ON public.pm_daily_progress(status);

-- 2.2 Daily Progress Lines (Report detail lines)
CREATE TABLE IF NOT EXISTS public.pm_daily_progress_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_progress_id UUID NOT NULL REFERENCES public.pm_daily_progress(id) ON DELETE CASCADE,
  boq_item_id UUID NOT NULL REFERENCES public.pm_boq_items(id) ON DELETE RESTRICT,
  qty_today NUMERIC(14,3) NOT NULL CHECK (qty_today > 0),
  zone TEXT,
  remarks TEXT,
  is_material_on_site BOOLEAN NOT NULL DEFAULT false,
  snapshot_rate_egp NUMERIC(15,4),
  source_boq_revision INT,
  line_status TEXT NOT NULL DEFAULT 'pending' CHECK (line_status IN ('pending','approved','rejected')),
  line_reviewed_by UUID REFERENCES auth.users(id),
  line_reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  subcontractor_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  is_claimable_vo BOOLEAN NOT NULL DEFAULT false,
  wir_no TEXT,
  inspection_status TEXT NOT NULL DEFAULT 'not_required' CHECK (inspection_status IN ('not_required','submitted','lab_pending','approved','rejected')),
  supplied_qty NUMERIC(14,3),
  ref_deliverable_item_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dpl_report ON public.pm_daily_progress_lines(daily_progress_id);
CREATE INDEX IF NOT EXISTS idx_dpl_boq ON public.pm_daily_progress_lines(boq_item_id);
CREATE INDEX IF NOT EXISTS idx_dpl_status ON public.pm_daily_progress_lines(line_status);

-- 2.3 Daily Progress Photo Attachments
CREATE TABLE IF NOT EXISTS public.pm_daily_progress_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_progress_id UUID NOT NULL REFERENCES public.pm_daily_progress(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL DEFAULT '',
  photo_url TEXT,
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_dp_photos ON public.pm_daily_progress_photos(daily_progress_id);

-- 2.4 Daily Manpower Logs
CREATE TABLE IF NOT EXISTS public.pm_daily_manpower_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_progress_id UUID NOT NULL REFERENCES public.pm_daily_progress(id) ON DELETE CASCADE,
  trade TEXT NOT NULL,
  headcount INT NOT NULL CHECK (headcount >= 0),
  working_hours NUMERIC(4,2) DEFAULT 8.0,
  subcontractor_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_manpower_dp ON public.pm_daily_manpower_logs(daily_progress_id);

-- 2.5 Daily Equipment Logs
CREATE TABLE IF NOT EXISTS public.pm_daily_equipment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_progress_id UUID NOT NULL REFERENCES public.pm_daily_progress(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  qty INT NOT NULL DEFAULT 1 CHECK (qty >= 0),
  operating_hours NUMERIC(4,2) DEFAULT 8.0,
  idle_hours NUMERIC(4,2) DEFAULT 0.0,
  operator_name TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','breakdown','standby')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_equipment_dp ON public.pm_daily_equipment_logs(daily_progress_id);

-- 2.6 Quantity Progress Allocations (Heart of the EVM Engine)
CREATE TABLE IF NOT EXISTS public.pm_progress_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_id UUID NOT NULL REFERENCES public.pm_daily_progress_lines(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.pm_project_activities(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  allocated_qty NUMERIC(14,3) NOT NULL CHECK (allocated_qty > 0),
  snapshot_rate_egp NUMERIC(15,4) NOT NULL DEFAULT 0.0000,
  source_boq_revision INT,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  suspended_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (line_id, activity_id)
);
CREATE INDEX IF NOT EXISTS idx_alloc_line ON public.pm_progress_allocations(line_id);
CREATE INDEX IF NOT EXISTS idx_alloc_act ON public.pm_progress_allocations(activity_id);
CREATE INDEX IF NOT EXISTS idx_alloc_project ON public.pm_progress_allocations(project_id);


-- ============================================================
-- 3. TECHNICAL OFFICE DELIVERABLES (E1 / E2) & RFI MODULE (7 TABLES)
-- ============================================================

-- 3.1 Deliverables Package Header
CREATE TABLE IF NOT EXISTS public.pm_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  ref_code TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('E1','E2','material_list','drawing_list','other')),
  received_from TEXT DEFAULT 'technical_office',
  received_at DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received','in_progress','blocked','ready_to_return','returned')),
  current_holder_stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  blocked_reason TEXT,
  blocked_since TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deliv_project ON public.pm_deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_deliv_status ON public.pm_deliverables(status);
CREATE INDEX IF NOT EXISTS idx_deliv_holder ON public.pm_deliverables(current_holder_stakeholder_id);

-- 3.2 Deliverable Items Register (Drawings & Submittals)
CREATE TABLE IF NOT EXISTS public.pm_deliverable_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES public.pm_deliverables(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('material','drawing')),
  sheet_number TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','approved','rejected','resubmitted')),
  current_rev INT NOT NULL DEFAULT 0,
  rev_history JSONB,
  assigned_stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  work_started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  current_holder_stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  blocked_reason TEXT,
  blocked_since TIMESTAMPTZ,
  consultant_status TEXT DEFAULT 'pending' CHECK (consultant_status IN ('pending','A','B','C','D')),
  submission_revision INT DEFAULT 1,
  linked_activity_id UUID REFERENCES public.pm_project_activities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deliv_items_pkg ON public.pm_deliverable_items(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_deliv_items_status ON public.pm_deliverable_items(status);
CREATE INDEX IF NOT EXISTS idx_deliv_items_act ON public.pm_deliverable_items(linked_activity_id);

-- Add foreign key constraint from daily lines to deliverable items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_dpl_deliverable_item'
  ) THEN
    ALTER TABLE public.pm_daily_progress_lines
      ADD CONSTRAINT fk_dpl_deliverable_item
      FOREIGN KEY (ref_deliverable_item_id)
      REFERENCES public.pm_deliverable_items(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

-- 3.3 Deliverable Document Attachments
CREATE TABLE IF NOT EXISTS public.pm_deliverable_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES public.pm_deliverables(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_kind TEXT NOT NULL DEFAULT 'drawing' CHECK (file_kind IN ('list','drawing','submittal','spec','other')),
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deliv_att ON public.pm_deliverable_attachments(deliverable_id);

-- 3.4 Deliverable Timeline Events (Immutable audit log)
CREATE TABLE IF NOT EXISTS public.pm_deliverable_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES public.pm_deliverables(id) ON DELETE CASCADE,
  deliverable_item_id UUID REFERENCES public.pm_deliverable_items(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('status_change','holder_change','block','unblock','comment','delay','revision_bump')),
  from_value TEXT,
  to_value TEXT,
  by_stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deliv_events ON public.pm_deliverable_events(deliverable_id, created_at DESC);

-- 3.5 Deliverable Dependencies
CREATE TABLE IF NOT EXISTS public.pm_deliverable_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id UUID NOT NULL REFERENCES public.pm_deliverables(id) ON DELETE CASCADE,
  depends_on_deliverable_id UUID NOT NULL REFERENCES public.pm_deliverables(id) ON DELETE CASCADE,
  dependency_type TEXT NOT NULL DEFAULT 'predecessor' CHECK (dependency_type IN ('predecessor','material_approval','rfi_response','drawing_approval')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (deliverable_id, depends_on_deliverable_id)
);

-- 3.6 RFI Register (Request For Information)
CREATE TABLE IF NOT EXISTS public.pm_rfi_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  rfi_no TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_reply_date DATE,
  replied_date DATE,
  reply_summary TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','overdue','answered','closed')),
  related_deliverable_item_id UUID REFERENCES public.pm_deliverable_items(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, rfi_no)
);
CREATE INDEX IF NOT EXISTS idx_rfi_project ON public.pm_rfi_register(project_id);
CREATE INDEX IF NOT EXISTS idx_rfi_status ON public.pm_rfi_register(status);

-- 3.7 Site Obstructions & Idle Time Logs
CREATE TABLE IF NOT EXISTS public.pm_daily_obstructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_progress_id UUID REFERENCES public.pm_daily_progress(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  obstruction_type TEXT NOT NULL CHECK (obstruction_type IN ('drawing_delay','material_approval','site_access','client_works','weather','equipment_idle','labor_shortage','other')),
  responsible_party TEXT,
  description TEXT NOT NULL,
  idle_manpower INT DEFAULT 0,
  idle_equipment_summary TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  evidence_path TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_obstructions_project ON public.pm_daily_obstructions(project_id);
CREATE INDEX IF NOT EXISTS idx_obstructions_dp ON public.pm_daily_obstructions(daily_progress_id);


-- ============================================================
-- 4. COMMERCIAL CONTROL, MATERIALS & GOVERNANCE (9 TABLES)
-- ============================================================

-- 4.1 Site Material Transactions (Issues, Returns, Adjustments, Waste)
CREATE TABLE IF NOT EXISTS public.pm_material_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_material_id UUID NOT NULL REFERENCES public.pm_boq_sub_materials(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tx_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('issue_to_site','return_to_store','adjustment','waste_writeoff','received_on_site')),
  qty NUMERIC(14,3) NOT NULL CHECK (qty != 0),
  zone TEXT,
  ref_wir_no TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mat_tx_sub ON public.pm_material_transactions(sub_material_id);
CREATE INDEX IF NOT EXISTS idx_mat_tx_project ON public.pm_material_transactions(project_id);

-- 4.2 Material Allocations to Activities & Zones
CREATE TABLE IF NOT EXISTS public.pm_material_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sub_material_id UUID NOT NULL REFERENCES public.pm_boq_sub_materials(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.pm_project_activities(id) ON DELETE CASCADE,
  allocated_qty NUMERIC(14,3) NOT NULL CHECK (allocated_qty > 0),
  zone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (sub_material_id, activity_id, zone)
);
CREATE INDEX IF NOT EXISTS idx_mat_alloc_project ON public.pm_material_allocations(project_id);

-- 4.3 Materials On Site (MOS) Register
CREATE TABLE IF NOT EXISTS public.pm_mos_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  boq_item_id UUID REFERENCES public.pm_boq_items(id) ON DELETE SET NULL,
  description_ar TEXT NOT NULL,
  unit TEXT NOT NULL,
  qty_supplied NUMERIC(14,3) NOT NULL CHECK (qty_supplied > 0),
  source_ref TEXT,
  status TEXT NOT NULL DEFAULT 'on_site' CHECK (status IN ('on_site','partially_installed','installed')),
  subcontractor_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mos_project ON public.pm_mos_entries(project_id);

-- 4.4 Subcontractor Production Targets (Fixed FK & Schema Alignment)
CREATE TABLE IF NOT EXISTS public.pm_subcontractor_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  subcontractor_id UUID NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  boq_item_id UUID REFERENCES public.pm_boq_items(id) ON DELETE SET NULL,
  target_date DATE,
  period_start DATE,
  period_end DATE,
  target_qty NUMERIC(14,3) NOT NULL CHECK (target_qty >= 0),
  target_crew INT DEFAULT 1,
  achieved_qty NUMERIC(14,3) DEFAULT 0.000,
  unit TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (period_end IS NULL OR period_start IS NULL OR period_end >= period_start)
);
CREATE INDEX IF NOT EXISTS idx_sub_targets_project ON public.pm_subcontractor_targets(project_id);
CREATE INDEX IF NOT EXISTS idx_sub_targets_sub ON public.pm_subcontractor_targets(subcontractor_id);

-- 4.5 Commercial Project Settings
CREATE TABLE IF NOT EXISTS public.pm_commercial_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  retention_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (retention_pct >= 0 AND retention_pct <= 100),
  advance_amortization_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (advance_amortization_pct >= 0 AND advance_amortization_pct <= 100),
  other_deductions_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (other_deductions_pct >= 0 AND other_deductions_pct <= 100),
  waste_alert_threshold_pct NUMERIC(5,2) NOT NULL DEFAULT 5.00 CHECK (waste_alert_threshold_pct >= 0 AND waste_alert_threshold_pct <= 100),
  week_start_day SMALLINT NOT NULL DEFAULT 6,
  weekly_send_day SMALLINT NOT NULL DEFAULT 4,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4.6 Weekly Progress Reports & Aggregates
CREATE TABLE IF NOT EXISTS public.pm_weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','finalized')),
  aggregates JSONB,
  pdf_path TEXT,
  xlsx_path TEXT,
  generated_by UUID REFERENCES auth.users(id),
  finalized_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, week_start)
);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_proj ON public.pm_weekly_reports(project_id);

-- 4.7 Approval Delegations (Aligned with Stakeholder FKs)
CREATE TABLE IF NOT EXISTS public.pm_approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  delegator_id UUID REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  delegated_to_id UUID REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  delegate_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'daily_progress' CHECK (scope IN ('daily_progress','boq','deliverables','all')),
  valid_from DATE NOT NULL DEFAULT CURRENT_DATE,
  valid_to DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  revoked_at TIMESTAMPTZ,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (valid_to >= valid_from)
);
CREATE INDEX IF NOT EXISTS idx_delegations_proj ON public.pm_approval_delegations(project_id);
CREATE INDEX IF NOT EXISTS idx_delegations_delegator ON public.pm_approval_delegations(delegator_id);
CREATE INDEX IF NOT EXISTS idx_delegations_delegated_to ON public.pm_approval_delegations(delegated_to_id);

-- 4.8 Quality & Safety Holds (Stop-Work Notices · Schema Aligned)
CREATE TABLE IF NOT EXISTS public.pm_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scope_type TEXT NOT NULL DEFAULT 'project' CHECK (scope_type IN ('zone','activity','boq_item','project')),
  scope TEXT CHECK (scope IN ('zone','activity','boq_item','project')),
  ref_value TEXT,
  hold_type TEXT NOT NULL DEFAULT 'site' CHECK (hold_type IN ('financial','commercial','legal','technical','site','ncr','safety','consultant','other')),
  ref_no TEXT,
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN DEFAULT true,
  reason TEXT NOT NULL,
  placed_by TEXT DEFAULT 'system',
  closed_by TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_holds_project ON public.pm_holds(project_id);
CREATE INDEX IF NOT EXISTS idx_holds_scope ON public.pm_holds(project_id, scope_type, is_active);

-- 4.9 S-Curve Cumulative Cache
CREATE TABLE IF NOT EXISTS public.pm_scurve_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  cutoff_date DATE NOT NULL,
  planned_cumulative_egp NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  actual_cumulative_egp NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  earned_cumulative_egp NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  planned_cumulative_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  actual_cumulative_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  cached_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, cutoff_date)
);
CREATE INDEX IF NOT EXISTS idx_scurve_cache_proj ON public.pm_scurve_cache(project_id, cutoff_date);


-- ============================================================
-- 5. SECURITY DEFINER FUNCTIONS & TRIGGERS
-- ============================================================

-- 5.1 Allocation Quantity, Concurrency Guard & Hold Freezing
CREATE OR REPLACE FUNCTION public.fn_check_allocation_qty()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pm AS $$
DECLARE
  v_line RECORD;
  v_act RECORD;
  v_current_sum NUMERIC(14,3);
BEGIN
  -- Row lock on daily line to prevent concurrent over-allocation
  SELECT l.id, l.qty_today, l.line_status, l.snapshot_rate_egp, l.source_boq_revision,
         l.inspection_status, l.is_material_on_site, l.zone, l.boq_item_id,
         dp.project_id, dp.status AS report_status
  INTO v_line
  FROM public.pm_daily_progress_lines l
  JOIN public.pm_daily_progress dp ON dp.id = l.daily_progress_id
  WHERE l.id = NEW.line_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Daily progress line % not found', NEW.line_id;
  END IF;

  IF v_line.line_status != 'approved' THEN
    RAISE EXCEPTION 'Cannot allocate quantities to a non-approved line (current status: %)', v_line.line_status;
  END IF;

  -- Gate: parent report must be approved or partially approved (line-level workflow)
  IF v_line.report_status NOT IN ('approved','partially_approved') THEN
    RAISE EXCEPTION 'التقرير اليومي غير معتمد بعد (الحالة: %) — لا توزيع قبل الاعتماد', v_line.report_status;
  END IF;

  -- Gate: WIR / inspection must be accepted (R10 — لا Earned على غير المستلم)
  IF COALESCE(v_line.inspection_status, 'not_required') NOT IN ('approved','not_required') THEN
    RAISE EXCEPTION 'الكمية غير معتمدة الاستلام بعد (WIR: %) — لا تُحتسب Earned حتى الاعتماد', v_line.inspection_status;
  END IF;

  -- Gate: material-on-site movements are never allocated (R10/GC-1)
  IF v_line.is_material_on_site THEN
    RAISE EXCEPTION 'حركة تشوين مواد (is_material_on_site) لا تُوزَّع على الأنشطة';
  END IF;

  -- Gate: active quality/safety hold freezes allocation (PM#5)
  IF EXISTS (
    SELECT 1 FROM public.pm_holds h
    WHERE (h.is_active = true OR h.active = true)
      AND h.project_id = v_line.project_id
      AND ( ( (h.scope_type = 'boq_item' OR h.scope = 'boq_item') AND h.ref_value = v_line.boq_item_id::text)
         OR ( (h.scope_type = 'zone' OR h.scope = 'zone') AND h.ref_value = v_line.zone) )
  ) THEN
    RAISE EXCEPTION 'يوجد Hold مفتوح على هذا البند/الزون (جودة أو سلامة) — التوزيع مجمد حتى الإغلاق';
  END IF;

  SELECT id, project_id, status, is_archived, budgeted_cost_egp
  INTO v_act
  FROM public.pm_project_activities
  WHERE id = NEW.activity_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Project activity % not found', NEW.activity_id;
  END IF;

  IF v_act.project_id != v_line.project_id THEN
    RAISE EXCEPTION 'Cross-project violation: line project (%) does not match activity project (%)', v_line.project_id, v_act.project_id;
  END IF;

  IF NEW.project_id IS NOT NULL AND NEW.project_id != v_line.project_id THEN
    RAISE EXCEPTION 'Allocation project_id (%) must match line project (%)', NEW.project_id, v_line.project_id;
  END IF;
  NEW.project_id := v_line.project_id;

  SELECT COALESCE(SUM(allocated_qty), 0)
  INTO v_current_sum
  FROM public.pm_progress_allocations
  WHERE line_id = NEW.line_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF (v_current_sum + NEW.allocated_qty) > v_line.qty_today THEN
    RAISE EXCEPTION 'Over-allocation error: Total allocated (%.3f) exceeds line approved quantity (%.3f)',
      (v_current_sum + NEW.allocated_qty), v_line.qty_today;
  END IF;

  IF NEW.snapshot_rate_egp IS NULL OR NEW.snapshot_rate_egp = 0 THEN
    NEW.snapshot_rate_egp := COALESCE(v_line.snapshot_rate_egp, 0.0000);
  END IF;
  IF NEW.source_boq_revision IS NULL THEN
    NEW.source_boq_revision := v_line.source_boq_revision;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_allocation_qty ON public.pm_progress_allocations;
CREATE TRIGGER trg_check_allocation_qty
  BEFORE INSERT OR UPDATE ON public.pm_progress_allocations
  FOR EACH ROW EXECUTE FUNCTION public.fn_check_allocation_qty();


-- 5.2 Line Approval Snapshot Freezing
CREATE OR REPLACE FUNCTION public.fn_line_approved_snapshot()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pm AS $$
DECLARE
  v_boq RECORD;
BEGIN
  IF NEW.line_status = 'approved' AND (OLD.line_status IS DISTINCT FROM NEW.line_status OR NEW.snapshot_rate_egp IS NULL) THEN
    SELECT rate_egp, revision INTO v_boq
    FROM public.pm_boq_items
    WHERE id = NEW.boq_item_id;

    IF FOUND THEN
      NEW.snapshot_rate_egp := v_boq.rate_egp;
      NEW.source_boq_revision := v_boq.revision;
    END IF;

    IF NEW.line_reviewed_at IS NULL THEN
      NEW.line_reviewed_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_line_approved_snapshot ON public.pm_daily_progress_lines;
CREATE TRIGGER trg_line_approved_snapshot
  BEFORE UPDATE OF line_status ON public.pm_daily_progress_lines
  FOR EACH ROW EXECUTE FUNCTION public.fn_line_approved_snapshot();


-- 5.3 Activity & Project EVM Recalculation Trigger
CREATE OR REPLACE FUNCTION public.fn_recalc_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pm AS $$
DECLARE
  v_act_id UUID;
  v_project_id UUID;
  v_earned NUMERIC(15,2);
  v_budget NUMERIC(15,2);
  v_pct NUMERIC(5,2);
  v_min_date DATE;
  v_link_mode TEXT;
  v_total_budget NUMERIC(15,2);
  v_weighted_completion NUMERIC(15,2);
BEGIN
  v_act_id := COALESCE(NEW.activity_id, OLD.activity_id);
  
  SELECT project_id, budgeted_cost_egp, boq_link_mode
  INTO v_project_id, v_budget, v_link_mode
  FROM public.pm_project_activities
  WHERE id = v_act_id;

  IF NOT FOUND THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF v_link_mode != 'manual_cost' THEN
    SELECT 
      COALESCE(SUM(a.allocated_qty * a.snapshot_rate_egp), 0),
      MIN(dp.progress_date)
    INTO v_earned, v_min_date
    FROM public.pm_progress_allocations a
    JOIN public.pm_daily_progress_lines l ON l.id = a.line_id
    JOIN public.pm_daily_progress dp ON dp.id = l.daily_progress_id
    WHERE a.activity_id = v_act_id
      AND a.is_suspended = false
      AND l.line_status = 'approved';

    IF v_budget > 0 THEN
      v_pct := LEAST(100.00, ROUND((v_earned / v_budget) * 100.0, 2));
    ELSE
      v_pct := 0.00;
    END IF;

    UPDATE public.pm_project_activities
    SET 
      percent_complete = v_pct,
      status = CASE 
        WHEN v_pct >= 100.00 THEN 'completed'
        WHEN v_pct > 0.00 THEN 'in_progress'
        ELSE 'not_started'
      END,
      actual_start = COALESCE(actual_start, v_min_date),
      actual_finish = CASE WHEN v_pct >= 100.00 THEN COALESCE(actual_finish, CURRENT_DATE) ELSE NULL END,
      updated_at = now()
    WHERE id = v_act_id;
  END IF;

  IF v_project_id IS NOT NULL THEN
    SELECT 
      COALESCE(SUM(budgeted_cost_egp), 0),
      COALESCE(SUM(budgeted_cost_egp * (percent_complete / 100.0)), 0)
    INTO v_total_budget, v_weighted_completion
    FROM public.pm_project_activities
    WHERE project_id = v_project_id AND is_archived = false;

    IF v_total_budget > 0 THEN
      UPDATE public.projects
      SET 
        completion_pct = LEAST(100.00, ROUND((v_weighted_completion / v_total_budget) * 100.0, 2)),
        updated_at = now()
      WHERE id = v_project_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_activity ON public.pm_progress_allocations;
CREATE TRIGGER trg_recalc_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.pm_progress_allocations
  FOR EACH ROW EXECUTE FUNCTION public.fn_recalc_activity();


-- 5.4 Activity Budget Auto-Recalculation Trigger
CREATE OR REPLACE FUNCTION public.fn_recalc_budget()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pm AS $$
DECLARE
  v_act_id UUID;
  v_new_budget NUMERIC(15,2);
  v_link_mode TEXT;
BEGIN
  v_act_id := COALESCE(NEW.activity_id, OLD.activity_id);

  SELECT boq_link_mode INTO v_link_mode
  FROM public.pm_project_activities
  WHERE id = v_act_id;

  IF FOUND AND v_link_mode = 'by_items' THEN
    SELECT COALESCE(SUM(planned_qty * baseline_rate_egp), 0)
    INTO v_new_budget
    FROM public.pm_activity_boq_links
    WHERE activity_id = v_act_id;

    UPDATE public.pm_project_activities
    SET 
      budgeted_cost_egp = v_new_budget,
      updated_at = now()
    WHERE id = v_act_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recalc_budget ON public.pm_activity_boq_links;
CREATE TRIGGER trg_recalc_budget
  AFTER INSERT OR UPDATE OR DELETE ON public.pm_activity_boq_links
  FOR EACH ROW EXECUTE FUNCTION public.fn_recalc_budget();


-- 5.5 Cross-Project Boundary Guard Triggers
CREATE OR REPLACE FUNCTION public.fn_check_cross_project_act_boq()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_act_pid UUID;
  v_boq_pid UUID;
BEGIN
  SELECT project_id INTO v_act_pid FROM public.pm_project_activities WHERE id = NEW.activity_id;
  SELECT project_id INTO v_boq_pid FROM public.pm_boq_items WHERE id = NEW.boq_item_id;
  IF v_act_pid IS DISTINCT FROM v_boq_pid THEN
    RAISE EXCEPTION 'خطأ ربط عبر المشاريع: مشروع النشاط (%) لا يطابق مشروع بند الكميات (%)', v_act_pid, v_boq_pid;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_act_boq_cross_project ON public.pm_activity_boq_links;
CREATE TRIGGER trg_check_act_boq_cross_project
  BEFORE INSERT OR UPDATE ON public.pm_activity_boq_links
  FOR EACH ROW EXECUTE FUNCTION public.fn_check_cross_project_act_boq();

CREATE OR REPLACE FUNCTION public.fn_check_cross_project_daily_lines()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_dp_pid UUID;
  v_boq_pid UUID;
BEGIN
  SELECT project_id INTO v_dp_pid FROM public.pm_daily_progress WHERE id = NEW.daily_progress_id;
  SELECT project_id INTO v_boq_pid FROM public.pm_boq_items WHERE id = NEW.boq_item_id;
  IF v_dp_pid IS DISTINCT FROM v_boq_pid THEN
    RAISE EXCEPTION 'خطأ سطر يومية عبر المشاريع: مشروع التقرير (%) لا يطابق مشروع بند الكميات (%)', v_dp_pid, v_boq_pid;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_daily_lines_cross_project ON public.pm_daily_progress_lines;
CREATE TRIGGER trg_check_daily_lines_cross_project
  BEFORE INSERT OR UPDATE ON public.pm_daily_progress_lines
  FOR EACH ROW EXECUTE FUNCTION public.fn_check_cross_project_daily_lines();


-- 5.6 Progress Allocations Audit Trigger
CREATE OR REPLACE FUNCTION public.fn_audit_progress_allocations()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pm AS $$
DECLARE
  v_rec_id UUID;
  v_old_data JSONB := NULL;
  v_new_data JSONB := NULL;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_rec_id := OLD.id;
    v_old_data := to_jsonb(OLD);
  ELSIF TG_OP = 'UPDATE' THEN
    v_rec_id := NEW.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSE -- INSERT
    v_rec_id := NEW.id;
    v_new_data := to_jsonb(NEW);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pm_audit_logs') THEN
    INSERT INTO public.pm_audit_logs (
      table_name,
      record_id,
      action,
      old_data,
      new_data,
      changed_by,
      created_at
    ) VALUES (
      'pm_progress_allocations',
      v_rec_id,
      TG_OP,
      v_old_data,
      v_new_data,
      auth.uid(),
      now()
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_pm_progress_allocations ON public.pm_progress_allocations;
CREATE TRIGGER trg_audit_pm_progress_allocations
  AFTER INSERT OR UPDATE OR DELETE ON public.pm_progress_allocations
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_progress_allocations();


-- 5.7 Deliverable Blocker Guard
CREATE OR REPLACE FUNCTION public.fn_deliverable_blocker_guard()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  IF NEW.status = 'blocked' THEN
    IF NEW.blocked_reason IS NULL OR length(trim(NEW.blocked_reason)) = 0 THEN
      RAISE EXCEPTION 'Deliverable cannot be set to blocked without a non-empty blocked_reason';
    END IF;
    NEW.blocked_since := COALESCE(OLD.blocked_since, now());
  ELSIF OLD.status = 'blocked' AND NEW.status != 'blocked' THEN
    NEW.blocked_since := NULL;
    NEW.blocked_reason := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deliverable_blocker_guard ON public.pm_deliverables;
CREATE TRIGGER trg_deliverable_blocker_guard
  BEFORE INSERT OR UPDATE OF status, blocked_reason ON public.pm_deliverables
  FOR EACH ROW EXECUTE FUNCTION public.fn_deliverable_blocker_guard();


-- 5.8 Serialized Daily Progress Report Creation RPC
CREATE OR REPLACE FUNCTION public.rpc_create_report(
  p_project_id UUID,
  p_progress_date DATE,
  p_discipline TEXT DEFAULT 'civil',
  p_weather TEXT DEFAULT NULL,
  p_manpower_count INT DEFAULT 0,
  p_equipment_summary TEXT DEFAULT NULL,
  p_entered_by_name TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS public.pm_daily_progress
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pm AS $$
DECLARE
  v_report_no INT;
  v_report public.pm_daily_progress;
  v_existing public.pm_daily_progress;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing
    FROM public.pm_daily_progress
    WHERE idempotency_key = p_idempotency_key;
    
    IF FOUND THEN
      RETURN v_existing;
    END IF;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('pm_daily_progress_' || p_project_id::text));

  SELECT COALESCE(MAX(report_no), 0) + 1 INTO v_report_no
  FROM public.pm_daily_progress
  WHERE project_id = p_project_id;

  INSERT INTO public.pm_daily_progress (
    project_id, progress_date, discipline, report_no, weather,
    manpower_count, equipment_summary, entered_by, entered_by_name,
    status, idempotency_key, notes
  ) VALUES (
    p_project_id, p_progress_date, COALESCE(p_discipline, 'civil'), v_report_no, p_weather,
    COALESCE(p_manpower_count, 0), p_equipment_summary, auth.uid(), p_entered_by_name,
    'draft', p_idempotency_key, p_notes
  ) RETURNING * INTO v_report;

  RETURN v_report;
END;
$$;


-- 5.9 Atomic Schedule Version Promotion RPC
CREATE OR REPLACE FUNCTION public.fn_promote_schedule_version(
  p_version_id UUID
) RETURNS public.pm_schedule_versions
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pm AS $$
DECLARE
  v_ver public.pm_schedule_versions;
BEGIN
  SELECT * INTO v_ver
  FROM public.pm_schedule_versions
  WHERE id = p_version_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Schedule version % not found', p_version_id;
  END IF;

  UPDATE public.pm_schedule_versions
  SET is_current = false
  WHERE project_id = v_ver.project_id AND id != p_version_id;

  UPDATE public.pm_schedule_versions
  SET is_current = true
  WHERE id = p_version_id
  RETURNING * INTO v_ver;

  RETURN v_ver;
END;
$$;


-- 5.10 Master Audit & Soft Archive Before Delete Function Extension
CREATE OR REPLACE FUNCTION public.fn_archive_before_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pm AS $$
DECLARE
  v_entity_name TEXT;
  v_project_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'pm_boq_items' THEN
    IF EXISTS (SELECT 1 FROM public.pm_daily_progress_lines WHERE boq_item_id = OLD.id) THEN
      RAISE EXCEPTION 'Cannot delete BOQ item % because it has associated daily progress lines. Archive or mark superseded instead.', OLD.item_code;
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'pm_project_activities' THEN
    IF EXISTS (SELECT 1 FROM public.pm_progress_allocations WHERE activity_id = OLD.id) THEN
      RAISE EXCEPTION 'Cannot delete activity % because it has progress allocations. Mark as archived instead.', OLD.activity_code;
    END IF;
  END IF;

  IF TG_TABLE_NAME = 'pm_daily_progress' THEN
    IF OLD.status = 'approved' THEN
      RAISE EXCEPTION 'Cannot delete an approved daily progress report (Report #%). Must be reopened first.', OLD.report_no;
    END IF;
  END IF;

  v_entity_name := COALESCE(
    CASE 
      WHEN TG_TABLE_NAME = 'pm_projects' THEN OLD.project_name
      WHEN TG_TABLE_NAME = 'pm_project_team' THEN OLD.person_name
      WHEN TG_TABLE_NAME = 'pm_wbs_items' THEN OLD.title_ar
      WHEN TG_TABLE_NAME = 'pm_payment_milestones' THEN OLD.milestone_name_ar
      WHEN TG_TABLE_NAME = 'pm_project_documents' THEN OLD.title_ar
      WHEN TG_TABLE_NAME = 'pm_change_orders' THEN OLD.title_ar
      WHEN TG_TABLE_NAME = 'pm_invoices' THEN OLD.ipc_number
      WHEN TG_TABLE_NAME = 'pm_cost_codes' THEN OLD.code || ' - ' || OLD.name_ar
      WHEN TG_TABLE_NAME = 'pm_boq_items' THEN OLD.item_code || ' - ' || OLD.description_ar
      WHEN TG_TABLE_NAME = 'pm_boq_sub_materials' THEN OLD.material_name_ar
      WHEN TG_TABLE_NAME = 'pm_project_activities' THEN OLD.activity_code || ' - ' || COALESCE(OLD.name_ar, OLD.name_en, 'Activity')
      WHEN TG_TABLE_NAME = 'pm_daily_progress' THEN 'Report #' || OLD.report_no::text || ' (' || OLD.progress_date::text || ')'
      WHEN TG_TABLE_NAME = 'pm_deliverables' THEN OLD.ref_code || ' - ' || OLD.title_ar
      WHEN TG_TABLE_NAME = 'pm_deliverable_items' THEN OLD.description
      WHEN TG_TABLE_NAME = 'pm_rfi_register' THEN OLD.rfi_no || ' - ' || OLD.subject
      WHEN TG_TABLE_NAME = 'pm_weekly_reports' THEN 'Week ' || OLD.week_start::text
      ELSE TG_TABLE_NAME
    END, 'Archived Item'
  );

  v_project_id := CASE 
    WHEN TG_TABLE_NAME = 'pm_projects' THEN OLD.id
    WHEN TG_TABLE_NAME = 'pm_cost_codes' THEN NULL
    WHEN TG_TABLE_NAME = 'pm_activity_library' THEN NULL
    WHEN TG_TABLE_NAME = 'pm_user_project_access' THEN OLD.project_id
    WHEN TG_TABLE_NAME = 'pm_boq_items' THEN OLD.project_id
    WHEN TG_TABLE_NAME = 'pm_project_activities' THEN OLD.project_id
    WHEN TG_TABLE_NAME = 'pm_daily_progress' THEN OLD.project_id
    WHEN TG_TABLE_NAME = 'pm_deliverables' THEN OLD.project_id
    WHEN TG_TABLE_NAME = 'pm_rfi_register' THEN OLD.project_id
    WHEN TG_TABLE_NAME = 'pm_weekly_reports' THEN OLD.project_id
    WHEN TG_TABLE_NAME = 'pm_commercial_settings' THEN OLD.project_id
    WHEN TG_TABLE_NAME = 'pm_holds' THEN OLD.project_id
    ELSE NULL
  END;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pm_archive_logs') THEN
    INSERT INTO public.pm_archive_logs (
      entity_type,
      entity_id,
      entity_name,
      project_id,
      archived_data,
      deleted_by,
      archived_at
    ) VALUES (
      TG_TABLE_NAME,
      OLD.id,
      v_entity_name,
      v_project_id,
      to_jsonb(OLD),
      COALESCE(auth.jwt() ->> 'email', 'System User'),
      now()
    );
  END IF;

  RETURN OLD;
END;
$$;

-- Attach updated_at triggers
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'pm_cost_codes', 'pm_boq_items', 'pm_boq_sub_materials', 'pm_boq_milestone_steps',
    'pm_activity_library', 'pm_project_activities', 'pm_activity_boq_links',
    'pm_daily_progress', 'pm_daily_progress_lines', 'pm_progress_allocations',
    'pm_deliverables', 'pm_deliverable_items', 'pm_rfi_register', 'pm_daily_obstructions',
    'pm_mos_entries', 'pm_subcontractor_targets', 'pm_commercial_settings', 'pm_weekly_reports',
    'pm_approval_delegations', 'pm_holds'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();', t, t);
  END LOOP;
END;
$$;

-- Attach archiving triggers
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'pm_cost_codes', 'pm_boq_items', 'pm_boq_sub_materials',
    'pm_project_activities', 'pm_daily_progress',
    'pm_deliverables', 'pm_deliverable_items', 'pm_rfi_register',
    'pm_weekly_reports', 'pm_holds'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_archive_%I ON public.%I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_archive_%I BEFORE DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.fn_archive_before_delete();', t, t);
  END LOOP;
END;
$$;


-- ============================================================
-- 6. SECURITY INVOKER VIEWS (6 Core Views + Dashboards)
-- ============================================================

-- 6.1 View: v_boq_with_actuals (and v_boq_current)
CREATE OR REPLACE VIEW public.v_boq_with_actuals
WITH (security_invoker = true) AS
SELECT 
  b.id,
  b.project_id,
  b.item_code,
  b.cost_code_id,
  c.code AS cost_code,
  c.name_ar AS cost_code_name_ar,
  b.description_ar,
  b.description_en,
  b.unit,
  b.contract_qty,
  b.shop_drawing_qty,
  b.pricing_status,
  b.foreign_currency,
  b.base_foreign_amount,
  b.rate_egp,
  b.amount_egp,
  b.wbs_item_id,
  w.title_ar AS wbs_title_ar,
  b.revision,
  b.is_current,
  b.vo_ref,
  COALESCE(act.total_allocated_qty, 0) AS total_installed_qty,
  COALESCE(act.total_earned_egp, 0) AS total_earned_egp,
  CASE 
    WHEN b.contract_qty > 0 THEN ROUND((COALESCE(act.total_allocated_qty, 0) / b.contract_qty) * 100.0, 2)
    ELSE 0.00 
  END AS qty_completion_pct,
  b.notes,
  b.created_at,
  b.updated_at
FROM public.pm_boq_items b
LEFT JOIN public.pm_cost_codes c ON c.id = b.cost_code_id
LEFT JOIN public.pm_wbs_items w ON w.id = b.wbs_item_id
LEFT JOIN (
  SELECT 
    l.boq_item_id,
    SUM(a.allocated_qty) AS total_allocated_qty,
    SUM(a.allocated_qty * a.snapshot_rate_egp) AS total_earned_egp
  FROM public.pm_progress_allocations a
  JOIN public.pm_daily_progress_lines l ON l.id = a.line_id
  WHERE a.is_suspended = false AND l.line_status = 'approved'
  GROUP BY l.boq_item_id
) act ON act.boq_item_id = b.id;

CREATE OR REPLACE VIEW public.v_boq_current
WITH (security_invoker = true) AS
SELECT * FROM public.v_boq_with_actuals WHERE is_current = true;

-- 6.2 View: v_activity_evm (and v_activity_progress)
CREATE OR REPLACE VIEW public.v_activity_evm
WITH (security_invoker = true) AS
SELECT 
  pa.id,
  pa.project_id,
  pa.activity_code,
  pa.name_ar,
  pa.name_en,
  pa.discipline,
  pa.planned_start,
  pa.planned_finish,
  pa.duration_days,
  pa.budgeted_cost_egp,
  pa.weight_pct,
  pa.boq_link_mode,
  pa.is_milestone,
  pa.is_critical,
  pa.actual_start,
  pa.actual_finish,
  pa.percent_complete,
  pa.status,
  pa.responsible_stakeholder_id,
  COALESCE(s.name_en, s.name_ar) AS responsible_stakeholder_name,
  COALESCE(earned.ev_amount, 0) AS earned_value_egp,
  (pa.budgeted_cost_egp - COALESCE(earned.ev_amount, 0)) AS remaining_budget_egp,
  pa.total_float_days,
  pa.free_float_days,
  pa.is_out_of_sequence,
  pa.notes,
  pa.created_at,
  pa.updated_at
FROM public.pm_project_activities pa
LEFT JOIN public.stakeholders s ON s.id = pa.responsible_stakeholder_id
LEFT JOIN (
  SELECT 
    a.activity_id,
    SUM(a.allocated_qty * a.snapshot_rate_egp) AS ev_amount
  FROM public.pm_progress_allocations a
  JOIN public.pm_daily_progress_lines l ON l.id = a.line_id
  WHERE a.is_suspended = false AND l.line_status = 'approved'
  GROUP BY a.activity_id
) earned ON earned.activity_id = pa.id;

CREATE OR REPLACE VIEW public.v_activity_progress
WITH (security_invoker = true) AS
SELECT * FROM public.v_activity_evm;

-- 6.3 View: v_daily_progress_summary (and v_daily_log)
CREATE OR REPLACE VIEW public.v_daily_progress_summary
WITH (security_invoker = true) AS
SELECT 
  dp.id,
  dp.project_id,
  dp.progress_date,
  dp.discipline,
  dp.report_no,
  dp.weather,
  dp.manpower_count,
  dp.equipment_summary,
  dp.entered_by,
  dp.entered_by_name,
  dp.status,
  dp.submitted_at,
  dp.approved_by,
  dp.approved_at,
  dp.rejection_reason,
  dp.reopened_reason,
  COUNT(dpl.id) AS lines_count,
  COALESCE(SUM(dpl.qty_today), 0) AS total_qty_reported,
  COALESCE(SUM(dpl.qty_today * COALESCE(dpl.snapshot_rate_egp, b.rate_egp, 0)), 0) AS total_value_reported_egp,
  COALESCE(alloc.total_allocated_qty, 0) AS total_allocated_qty,
  (COALESCE(SUM(dpl.qty_today), 0) - COALESCE(alloc.total_allocated_qty, 0)) AS unallocated_qty,
  dp.notes,
  dp.created_at,
  dp.updated_at
FROM public.pm_daily_progress dp
LEFT JOIN public.pm_daily_progress_lines dpl ON dpl.daily_progress_id = dp.id
LEFT JOIN public.pm_boq_items b ON b.id = dpl.boq_item_id
LEFT JOIN (
  SELECT 
    l2.daily_progress_id,
    SUM(a.allocated_qty) AS total_allocated_qty
  FROM public.pm_progress_allocations a
  JOIN public.pm_daily_progress_lines l2 ON l2.id = a.line_id
  WHERE a.is_suspended = false
  GROUP BY l2.daily_progress_id
) alloc ON alloc.daily_progress_id = dp.id
GROUP BY dp.id, alloc.total_allocated_qty;

CREATE OR REPLACE VIEW public.v_daily_log
WITH (security_invoker = true) AS
SELECT 
  dpl.id AS line_id,
  dp.project_id,
  dp.progress_date,
  dp.report_no,
  dp.discipline,
  dp.status AS report_status,
  b.item_code,
  b.description_ar,
  b.unit,
  dpl.qty_today,
  dpl.zone,
  dpl.line_status,
  dpl.inspection_status,
  dpl.snapshot_rate_egp,
  dpl.remarks
FROM public.pm_daily_progress_lines dpl
JOIN public.pm_daily_progress dp ON dp.id = dpl.daily_progress_id
JOIN public.pm_boq_items b ON b.id = dpl.boq_item_id;

-- 6.4 View: v_deliverables_kanban
CREATE OR REPLACE VIEW public.v_deliverables_kanban
WITH (security_invoker = true) AS
SELECT 
  d.id,
  d.project_id,
  d.ref_code,
  d.title_ar,
  d.title_en,
  d.kind,
  d.received_from,
  d.received_at,
  d.due_date,
  d.status,
  d.current_holder_stakeholder_id,
  s.name_ar AS current_holder_name,
  d.blocked_reason,
  d.blocked_since,
  CASE 
    WHEN d.blocked_since IS NOT NULL THEN (CURRENT_DATE - d.blocked_since::date)
    ELSE 0
  END AS days_blocked,
  (CURRENT_DATE - d.received_at) AS age_days,
  d.priority,
  COUNT(di.id) AS total_items_count,
  COUNT(di.id) FILTER (WHERE di.status = 'approved') AS approved_items_count,
  COUNT(di.id) FILTER (WHERE di.consultant_status IN ('A','B')) AS consultant_approved_count,
  d.notes,
  d.created_at,
  d.updated_at
FROM public.pm_deliverables d
LEFT JOIN public.stakeholders s ON s.id = d.current_holder_stakeholder_id
LEFT JOIN public.pm_deliverable_items di ON di.deliverable_id = d.id
GROUP BY d.id, s.name_ar;

-- 6.5 View: v_commercial_summary
CREATE OR REPLACE VIEW public.v_commercial_summary
WITH (security_invoker = true) AS
SELECT 
  p.id AS project_id,
  p.code AS project_code,
  p.name_ar AS project_name,
  p.contract_value AS contract_value_egp,
  COALESCE(boq.total_boq_amount, 0) AS total_boq_amount_egp,
  COALESCE(ev.total_earned_value, 0) AS earned_value_egp,
  COALESCE(inv.total_invoiced_approved, 0) AS total_invoiced_egp,
  (p.contract_value - COALESCE(ev.total_earned_value, 0)) AS remaining_to_earn_egp,
  CASE 
    WHEN p.contract_value > 0 THEN ROUND((COALESCE(ev.total_earned_value, 0) / p.contract_value) * 100.0, 2)
    ELSE 0.00
  END AS commercial_progress_pct,
  cs.retention_pct,
  cs.advance_amortization_pct,
  cs.waste_alert_threshold_pct
FROM public.projects p
LEFT JOIN public.pm_commercial_settings cs ON cs.project_id = p.id
LEFT JOIN (
  SELECT project_id, SUM(amount_egp) AS total_boq_amount
  FROM public.pm_boq_items
  WHERE is_current = true
  GROUP BY project_id
) boq ON boq.project_id = p.id
LEFT JOIN (
  SELECT 
    a.project_id,
    SUM(a.allocated_qty * a.snapshot_rate_egp) AS total_earned_value
  FROM public.pm_progress_allocations a
  JOIN public.pm_daily_progress_lines l ON l.id = a.line_id
  WHERE a.is_suspended = false AND l.line_status = 'approved'
  GROUP BY a.project_id
) ev ON ev.project_id = p.id
LEFT JOIN (
  SELECT 
    project_id,
    SUM(approved_amount) AS total_invoiced_approved
  FROM public.pm_invoices
  WHERE status = 'approved' OR status = 'paid'
  GROUP BY project_id
) inv ON inv.project_id = p.id;

-- 6.6 View: v_procurement_bom_status
CREATE OR REPLACE VIEW public.v_procurement_bom_status
WITH (security_invoker = true) AS
SELECT 
  sm.id,
  b.project_id,
  b.id AS boq_item_id,
  b.item_code,
  b.description_ar AS boq_description_ar,
  sm.material_name_ar,
  sm.material_name_en,
  sm.unit,
  sm.consumption_rate,
  sm.standard_wastage_pct,
  b.contract_qty AS boq_contract_qty,
  ROUND(b.contract_qty * sm.consumption_rate * (1 + (sm.standard_wastage_pct / 100.0)), 3) AS calculated_required_qty,
  COALESCE(sm.required_procurement_qty, ROUND(b.contract_qty * sm.consumption_rate * (1 + (sm.standard_wastage_pct / 100.0)), 3)) AS required_procurement_qty,
  sm.ordered_qty,
  sm.delivered_to_site_qty,
  (COALESCE(sm.required_procurement_qty, ROUND(b.contract_qty * sm.consumption_rate * (1 + (sm.standard_wastage_pct / 100.0)), 3)) - sm.ordered_qty) AS remaining_to_order_qty,
  sm.procurement_stage,
  sm.last_purchase_price,
  sm.supplier_ref,
  sm.notes,
  sm.created_at,
  sm.updated_at
FROM public.pm_boq_sub_materials sm
JOIN public.pm_boq_items b ON b.id = sm.boq_item_id;

-- 6.7 View: v_scurve_actual
CREATE OR REPLACE VIEW public.v_scurve_actual
WITH (security_invoker = true) AS
SELECT 
  dp.project_id,
  dp.progress_date,
  SUM(a.allocated_qty * a.snapshot_rate_egp) AS daily_earned_egp,
  SUM(SUM(a.allocated_qty * a.snapshot_rate_egp)) OVER (
    PARTITION BY dp.project_id 
    ORDER BY dp.progress_date 
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS cumulative_earned_egp
FROM public.pm_progress_allocations a
JOIN public.pm_daily_progress_lines l ON l.id = a.line_id
JOIN public.pm_daily_progress dp ON dp.id = l.daily_progress_id
WHERE a.is_suspended = false AND l.line_status = 'approved'
GROUP BY dp.project_id, dp.progress_date;


-- ============================================================
-- 7. MULTI-TIER ROW LEVEL SECURITY (RLS) & STORAGE BUCKETS
-- ============================================================

-- Enable RLS across all tables
ALTER TABLE public.pm_user_project_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_cost_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_boq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_boq_sub_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_boq_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_boq_milestone_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_activity_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_activity_boq_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_activity_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_schedule_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_activity_calendar_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_daily_progress_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_daily_progress_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_daily_manpower_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_daily_equipment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_progress_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_deliverable_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_deliverable_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_deliverable_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_deliverable_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_rfi_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_daily_obstructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_material_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_material_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_mos_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_subcontractor_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_commercial_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_approval_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_scurve_cache ENABLE ROW LEVEL SECURITY;

-- 7.1 pm_user_project_access Policies
DROP POLICY IF EXISTS "upa_select_policy" ON public.pm_user_project_access;
CREATE POLICY "upa_select_policy" ON public.pm_user_project_access
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager','project_manager')
    )
  );

DROP POLICY IF EXISTS "upa_all_admin" ON public.pm_user_project_access;
CREATE POLICY "upa_all_admin" ON public.pm_user_project_access
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin','ceo','coo','chairman')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin','ceo','coo','chairman')
    )
  );

DROP POLICY IF EXISTS "upa_service_role" ON public.pm_user_project_access;
CREATE POLICY "upa_service_role" ON public.pm_user_project_access
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7.2 Directory & Reference Tables (pm_cost_codes, pm_activity_library)
DROP POLICY IF EXISTS "cost_codes_select" ON public.pm_cost_codes;
CREATE POLICY "cost_codes_select" ON public.pm_cost_codes FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "cost_codes_write" ON public.pm_cost_codes;
CREATE POLICY "cost_codes_write" ON public.pm_cost_codes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','ceo','coo','commercial_manager','estimator','cost_control')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','ceo','coo','commercial_manager','estimator','cost_control')));
DROP POLICY IF EXISTS "cost_codes_service" ON public.pm_cost_codes;
CREATE POLICY "cost_codes_service" ON public.pm_cost_codes FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "activity_lib_select" ON public.pm_activity_library;
CREATE POLICY "activity_lib_select" ON public.pm_activity_library FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "activity_lib_write" ON public.pm_activity_library;
CREATE POLICY "activity_lib_write" ON public.pm_activity_library FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','ceo','coo','commercial_manager','scheduler','project_manager')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','ceo','coo','commercial_manager','scheduler','project_manager')));
DROP POLICY IF EXISTS "activity_lib_service" ON public.pm_activity_library;
CREATE POLICY "activity_lib_service" ON public.pm_activity_library FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7.3 Write-Only Audit Log Hardening for public.pm_audit_logs (Immutable & Secure)
ALTER TABLE public.pm_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to audit_logs" ON public.pm_audit_logs;
DROP POLICY IF EXISTS "Allow service_role access to audit_logs" ON public.pm_audit_logs;
DROP POLICY IF EXISTS "auth_read_audit_logs" ON public.pm_audit_logs;
DROP POLICY IF EXISTS "auth_insert_audit_logs" ON public.pm_audit_logs;
DROP POLICY IF EXISTS "service_role_all_audit_logs" ON public.pm_audit_logs;

CREATE POLICY "auth_read_audit_logs" ON public.pm_audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager','project_manager','cost_control')
    )
  );

CREATE POLICY "service_role_all_audit_logs" ON public.pm_audit_logs
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

REVOKE INSERT, UPDATE, DELETE ON public.pm_audit_logs FROM authenticated, anon;

CREATE INDEX IF NOT EXISTS idx_audit_logs_record
  ON public.pm_audit_logs (table_name, record_id, changed_at DESC);

-- 7.4 Generic Project-Scoped Policies for Operational Tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'pm_boq_items', 'pm_boq_sub_materials', 'pm_boq_revisions', 'pm_boq_milestone_steps',
    'pm_project_activities', 'pm_activity_boq_links', 'pm_activity_dependencies',
    'pm_schedule_versions', 'pm_activity_calendar_exceptions',
    'pm_daily_progress', 'pm_daily_progress_lines', 'pm_daily_progress_photos',
    'pm_daily_manpower_logs', 'pm_daily_equipment_logs', 'pm_progress_allocations',
    'pm_deliverables', 'pm_deliverable_items', 'pm_deliverable_attachments',
    'pm_deliverable_events', 'pm_deliverable_dependencies', 'pm_rfi_register',
    'pm_daily_obstructions', 'pm_material_transactions', 'pm_material_allocations',
    'pm_mos_entries', 'pm_subcontractor_targets', 'pm_commercial_settings',
    'pm_weekly_reports', 'pm_approval_delegations', 'pm_holds', 'pm_scurve_cache'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "auth_select_%I" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "auth_select_%I" ON public.%I FOR SELECT TO authenticated USING (true);', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "auth_insert_%I" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "auth_insert_%I" ON public.%I FOR INSERT TO authenticated WITH CHECK (true);', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "auth_update_%I" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "auth_update_%I" ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true);', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "service_role_%I" ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY "service_role_%I" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true);', t, t);
  END LOOP;
END;
$$;

-- 7.5 Storage Buckets & Storage RLS Policies
INSERT INTO storage.buckets (id, name, public) VALUES
  ('project-schedules', 'project-schedules', false),
  ('deliverables', 'deliverables', false),
  ('progress-photos', 'progress-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "auth_read_project_schedules" ON storage.objects;
CREATE POLICY "auth_read_project_schedules" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'project-schedules');

DROP POLICY IF EXISTS "auth_insert_project_schedules" ON storage.objects;
CREATE POLICY "auth_insert_project_schedules" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-schedules');

DROP POLICY IF EXISTS "auth_read_deliverables" ON storage.objects;
CREATE POLICY "auth_read_deliverables" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'deliverables');

DROP POLICY IF EXISTS "auth_insert_deliverables" ON storage.objects;
CREATE POLICY "auth_insert_deliverables" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'deliverables');

DROP POLICY IF EXISTS "auth_read_progress_photos" ON storage.objects;
CREATE POLICY "auth_read_progress_photos" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'progress-photos');

DROP POLICY IF EXISTS "anon_read_progress_photos" ON storage.objects;
CREATE POLICY "anon_read_progress_photos" ON storage.objects
  FOR SELECT TO anon USING (bucket_id = 'progress-photos');

DROP POLICY IF EXISTS "auth_insert_progress_photos" ON storage.objects;
CREATE POLICY "auth_insert_progress_photos" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'progress-photos');

COMMIT;
