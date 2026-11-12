-- ============================================================
-- 023_project_task_ontology.sql — Project Task Ontology & Engineering Graph
-- Area: Planning → Site Execution → PM Review → QC/WIR → Verified Progress
-- Conforms to: docs/PRD_PROJECT_TASK_ONTOLOGY.md
-- ============================================================

BEGIN;

-- ── 1. Stakeholders auth identity mapping ───────────────────────
ALTER TABLE public.stakeholders
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_stakeholders_auth_user_id ON public.stakeholders(auth_user_id);

-- ── 2. Component Instances (Repeated physical units in one project) ──
CREATE TABLE IF NOT EXISTS public.pm_component_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  component_type TEXT NOT NULL CHECK (component_type IN
    ('lagoon_body', 'pump_room', 'pump_room_with_tank', 'building', 'infrastructure', 'zone_area', 'general')),
  zone_id UUID REFERENCES public.pm_zones(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_component_instances_proj_code UNIQUE (project_id, code)
);

CREATE INDEX IF NOT EXISTS idx_comp_inst_proj ON public.pm_component_instances(project_id);
CREATE INDEX IF NOT EXISTS idx_comp_inst_zone ON public.pm_component_instances(zone_id);

-- ── 3. Work Packages (Controlled planning scope) ─────────────────
CREATE TABLE IF NOT EXISTS public.pm_work_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title_ar TEXT NOT NULL,
  title_en TEXT,
  component_instance_id UUID REFERENCES public.pm_component_instances(id) ON DELETE SET NULL,
  zone_id UUID REFERENCES public.pm_zones(id) ON DELETE SET NULL,
  schedule_activity_id UUID REFERENCES public.pm_project_activities(id) ON DELETE SET NULL,
  planned_start DATE,
  planned_finish DATE,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN
    ('planned', 'released', 'in_progress', 'completed', 'cancelled')),
  revision INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_work_packages_proj_code_rev UNIQUE (project_id, code, revision)
);

CREATE INDEX IF NOT EXISTS idx_work_pkg_proj ON public.pm_work_packages(project_id);
CREATE INDEX IF NOT EXISTS idx_work_pkg_comp ON public.pm_work_packages(component_instance_id);
CREATE INDEX IF NOT EXISTS idx_work_pkg_zone ON public.pm_work_packages(zone_id);
CREATE INDEX IF NOT EXISTS idx_work_pkg_act ON public.pm_work_packages(schedule_activity_id);

-- ── 4. Work Package BOQ Scope Bridge ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.pm_work_package_boq_scope (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_package_id UUID NOT NULL REFERENCES public.pm_work_packages(id) ON DELETE CASCADE,
  boq_item_id UUID NOT NULL REFERENCES public.pm_boq_items(id) ON DELETE CASCADE,
  planned_qty NUMERIC(15,4) NOT NULL DEFAULT 0,
  unit TEXT,
  CONSTRAINT uq_wp_boq_item UNIQUE (work_package_id, boq_item_id)
);

CREATE INDEX IF NOT EXISTS idx_wp_boq_wp ON public.pm_work_package_boq_scope(work_package_id);
CREATE INDEX IF NOT EXISTS idx_wp_boq_item ON public.pm_work_package_boq_scope(boq_item_id);

-- ── 5. Enhance pm_site_tasks for Ontology & Engineering Graph ────
ALTER TABLE public.pm_site_tasks
  ADD COLUMN IF NOT EXISTS task_instance_key TEXT,
  ADD COLUMN IF NOT EXISTS work_package_id UUID REFERENCES public.pm_work_packages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS component_instance_id UUID REFERENCES public.pm_component_instances(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS template_id TEXT,
  ADD COLUMN IF NOT EXISTS planned_start_at DATE,
  ADD COLUMN IF NOT EXISTS planned_finish_at DATE,
  ADD COLUMN IF NOT EXISTS actual_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS actual_finish_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS measurement_method TEXT NOT NULL DEFAULT 'quantity' CHECK (measurement_method IN ('quantity', 'milestone', 'weighted_step', 'duration')),
  ADD COLUMN IF NOT EXISTS progress_source TEXT NOT NULL DEFAULT 'daily_report' CHECK (progress_source IN ('daily_report', 'inspection', 'manual_pm')),
  ADD COLUMN IF NOT EXISTS planned_qty NUMERIC(15,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS verified_qty NUMERIC(15,4) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS revision INT NOT NULL DEFAULT 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_tasks_instance_key
  ON public.pm_site_tasks(project_id, task_instance_key)
  WHERE task_instance_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_site_tasks_wp ON public.pm_site_tasks(work_package_id);
CREATE INDEX IF NOT EXISTS idx_site_tasks_comp ON public.pm_site_tasks(component_instance_id);

-- ── 6. Task Assignments (Primary, PM reviewer, QC, Watchers) ─────
CREATE TABLE IF NOT EXISTS public.pm_task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.pm_site_tasks(id) ON DELETE CASCADE,
  stakeholder_id UUID NOT NULL REFERENCES public.stakeholders(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('primary_assignee', 'pm_reviewer', 'qc_inspector', 'watcher', 'delegate')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  released_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT uq_task_stakeholder_role UNIQUE (task_id, stakeholder_id, role)
);

CREATE INDEX IF NOT EXISTS idx_task_assign_task ON public.pm_task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assign_stk ON public.pm_task_assignments(stakeholder_id);

-- ── 7. Inspection Requests (WIR / QC lifecycle) ───────────────────
CREATE TABLE IF NOT EXISTS public.pm_inspection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.pm_site_tasks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  request_no TEXT NOT NULL,
  inspection_type TEXT NOT NULL DEFAULT 'WIR' CHECK (inspection_type IN
    ('WIR', 'MIR', 'NCR', 'pre_pour', 'survey', 'final_handover')),
  required_at DATE NOT NULL,
  assigned_qc_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN
    ('pending', 'approved', 'rejected', 'cancelled')),
  decision_at TIMESTAMPTZ,
  decision_by UUID REFERENCES auth.users(id),
  reason TEXT,
  evidence_urls TEXT[],
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_inspection_req_no UNIQUE (project_id, request_no)
);

CREATE INDEX IF NOT EXISTS idx_insp_req_task ON public.pm_inspection_requests(task_id);
CREATE INDEX IF NOT EXISTS idx_insp_req_proj ON public.pm_inspection_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_insp_req_qc ON public.pm_inspection_requests(assigned_qc_id);
CREATE INDEX IF NOT EXISTS idx_insp_req_status ON public.pm_inspection_requests(status);

-- ── 8. Task Events (Append-only immutable audit trail) ────────────
CREATE TABLE IF NOT EXISTS public.pm_task_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.pm_site_tasks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'released', 'started', 'submitted_for_pm',
    'pm_accepted', 'pm_rejected', 'inspection_created',
    'inspection_passed', 'inspection_rejected', 'reopened_rework',
    'verified', 'closed', 'cancelled', 'reassigned', 'replanned',
    'scope_changed', 'constraint_logged', 'constraint_resolved',
    'migration_backfill'
  )),
  actor_user_id UUID REFERENCES auth.users(id),
  actor_stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  from_state TEXT,
  to_state TEXT,
  reason TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_events_task ON public.pm_task_events(task_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_events_proj ON public.pm_task_events(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_events_type ON public.pm_task_events(event_type);

-- ── 9. Notifications (In-app delivery & escalations) ──────────────
CREATE TABLE IF NOT EXISTS public.pm_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'inspection', 'report', 'constraint')),
  entity_id UUID NOT NULL,
  title_ar TEXT NOT NULL,
  body_ar TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notif_recipient ON public.pm_notifications(recipient_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_unread ON public.pm_notifications(recipient_user_id) WHERE read_at IS NULL;

-- ── 10. Task Constraints (Blockers / Obstructions) ─────────────────
CREATE TABLE IF NOT EXISTS public.pm_task_constraints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.pm_site_tasks(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN
    ('material', 'drawing', 'access', 'approval', 'weather', 'safety', 'equipment', 'manpower', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  owner_stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  required_by DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'waived')),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_constraints_task ON public.pm_task_constraints(task_id);
CREATE INDEX IF NOT EXISTS idx_task_constraints_proj ON public.pm_task_constraints(project_id);

-- ── 11. Cross-Project Integrity Trigger Function ──────────────────
CREATE OR REPLACE FUNCTION public.fn_check_task_project_integrity()
RETURNS TRIGGER AS $$
DECLARE
  v_zone_proj UUID;
  v_comp_proj UUID;
  v_wp_proj   UUID;
  v_act_proj  UUID;
  v_boq_proj  UUID;
BEGIN
  -- Zone project validation
  IF NEW.zone_id IS NOT NULL THEN
    SELECT project_id INTO v_zone_proj FROM public.pm_zones WHERE id = NEW.zone_id;
    IF v_zone_proj IS NOT NULL AND v_zone_proj <> NEW.project_id THEN
      RAISE EXCEPTION 'CROSS_PROJECT_VIOLATION: zone_id % belongs to project %, not %',
        NEW.zone_id, v_zone_proj, NEW.project_id;
    END IF;
  END IF;

  -- Component instance project validation
  IF NEW.component_instance_id IS NOT NULL THEN
    SELECT project_id INTO v_comp_proj FROM public.pm_component_instances WHERE id = NEW.component_instance_id;
    IF v_comp_proj IS NOT NULL AND v_comp_proj <> NEW.project_id THEN
      RAISE EXCEPTION 'CROSS_PROJECT_VIOLATION: component_instance_id % belongs to project %, not %',
        NEW.component_instance_id, v_comp_proj, NEW.project_id;
    END IF;
  END IF;

  -- Work package project validation
  IF NEW.work_package_id IS NOT NULL THEN
    SELECT project_id INTO v_wp_proj FROM public.pm_work_packages WHERE id = NEW.work_package_id;
    IF v_wp_proj IS NOT NULL AND v_wp_proj <> NEW.project_id THEN
      RAISE EXCEPTION 'CROSS_PROJECT_VIOLATION: work_package_id % belongs to project %, not %',
        NEW.work_package_id, v_wp_proj, NEW.project_id;
    END IF;
  END IF;

  -- Schedule activity project validation
  IF NEW.activity_id IS NOT NULL THEN
    SELECT project_id INTO v_act_proj FROM public.pm_project_activities WHERE id = NEW.activity_id;
    IF v_act_proj IS NOT NULL AND v_act_proj <> NEW.project_id THEN
      RAISE EXCEPTION 'CROSS_PROJECT_VIOLATION: activity_id % belongs to project %, not %',
        NEW.activity_id, v_act_proj, NEW.project_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_site_tasks_project_integrity ON public.pm_site_tasks;
CREATE TRIGGER trg_site_tasks_project_integrity
  BEFORE INSERT OR UPDATE ON public.pm_site_tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_check_task_project_integrity();

-- ── 12. RPC: Transition Task State with Mandatory Audit ───────────
CREATE OR REPLACE FUNCTION public.rpc_site_task_transition(
  p_task_id UUID,
  p_to_state TEXT,
  p_reason TEXT DEFAULT NULL,
  p_evidence_payload JSONB DEFAULT '{}'::jsonb,
  p_verified_qty NUMERIC DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_task RECORD;
  v_actor_user_id UUID := auth.uid();
  v_actor_stakeholder_id UUID;
  v_from_state TEXT;
  v_new_progress NUMERIC;
BEGIN
  -- 1. Fetch Task
  SELECT * INTO v_task FROM public.pm_site_tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND: Task % does not exist', p_task_id;
  END IF;

  v_from_state := v_task.status;

  -- 2. Resolve Actor Stakeholder
  IF v_actor_user_id IS NOT NULL THEN
    SELECT id INTO v_actor_stakeholder_id FROM public.stakeholders WHERE auth_user_id = v_actor_user_id LIMIT 1;
  END IF;

  -- 3. Transition Validation
  IF p_to_state IN ('rejected', 'rework', 'cancelled') AND (p_reason IS NULL OR trim(p_reason) = '') THEN
    RAISE EXCEPTION 'REASON_REQUIRED: A non-empty reason is mandatory for rejection or cancellation';
  END IF;

  -- 4. Calculate new verified progress if verified_qty passed
  IF p_verified_qty IS NOT NULL THEN
    IF v_task.planned_qty > 0 THEN
      v_new_progress := LEAST(100.00, GREATEST(0.00, (p_verified_qty / v_task.planned_qty) * 100.00));
    ELSE
      v_new_progress := v_task.progress_pct;
    END IF;
  ELSE
    v_new_progress := CASE
      WHEN p_to_state IN ('approved', 'verified', 'done', 'closed') THEN 100.00
      ELSE v_task.progress_pct
    END;
  END IF;

  -- 5. Update Task
  UPDATE public.pm_site_tasks
  SET
    status = p_to_state,
    rejection_reason = CASE WHEN p_to_state IN ('rejected', 'rework') THEN p_reason ELSE rejection_reason END,
    progress_pct = v_new_progress,
    verified_qty = COALESCE(p_verified_qty, verified_qty),
    actual_start_at = CASE WHEN p_to_state = 'in_progress' AND actual_start_at IS NULL THEN now() ELSE actual_start_at END,
    actual_finish_at = CASE WHEN p_to_state IN ('approved', 'verified', 'done', 'closed') THEN now() ELSE actual_finish_at END,
    updated_at = now()
  WHERE id = p_task_id;

  -- 6. Record Immutable Task Event
  INSERT INTO public.pm_task_events (
    task_id, project_id, event_type, actor_user_id, actor_stakeholder_id,
    from_state, to_state, reason, payload
  ) VALUES (
    p_task_id, v_task.project_id,
    CASE
      WHEN p_to_state = 'released' THEN 'released'
      WHEN p_to_state = 'in_progress' THEN 'started'
      WHEN p_to_state = 'pm_review' OR p_to_state = 'submitted_for_pm' THEN 'submitted_for_pm'
      WHEN p_to_state = 'approved' OR p_to_state = 'verified' THEN 'verified'
      WHEN p_to_state = 'rejected' OR p_to_state = 'rework' THEN 'reopened_rework'
      WHEN p_to_state = 'done' OR p_to_state = 'closed' THEN 'closed'
      WHEN p_to_state = 'cancelled' THEN 'cancelled'
      ELSE 'scope_changed'
    END,
    v_actor_user_id, v_actor_stakeholder_id,
    v_from_state, p_to_state, p_reason, p_evidence_payload
  );

  RETURN jsonb_build_object(
    'success', true,
    'task_id', p_task_id,
    'from_state', v_from_state,
    'to_state', p_to_state,
    'progress_pct', v_new_progress
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 13. RPC: Replan Task (Preserves Baseline, logs event) ──────────
CREATE OR REPLACE FUNCTION public.rpc_replan_task(
  p_task_id UUID,
  p_new_planned_start DATE,
  p_new_planned_finish DATE,
  p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_task RECORD;
  v_actor_user_id UUID := auth.uid();
  v_actor_stakeholder_id UUID;
BEGIN
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RAISE EXCEPTION 'REASON_REQUIRED: A valid reason is mandatory for replanning a task';
  END IF;

  SELECT * INTO v_task FROM public.pm_site_tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND: Task % does not exist', p_task_id;
  END IF;

  IF v_actor_user_id IS NOT NULL THEN
    SELECT id INTO v_actor_stakeholder_id FROM public.stakeholders WHERE auth_user_id = v_actor_user_id LIMIT 1;
  END IF;

  UPDATE public.pm_site_tasks
  SET
    planned_start_at = p_new_planned_start,
    planned_finish_at = p_new_planned_finish,
    due_date = p_new_planned_finish,
    revision = revision + 1,
    updated_at = now()
  WHERE id = p_task_id;

  INSERT INTO public.pm_task_events (
    task_id, project_id, event_type, actor_user_id, actor_stakeholder_id,
    from_state, to_state, reason, payload
  ) VALUES (
    p_task_id, v_task.project_id, 'replanned',
    v_actor_user_id, v_actor_stakeholder_id,
    v_task.status, v_task.status, p_reason,
    jsonb_build_object(
      'old_start', v_task.planned_start_at,
      'old_finish', v_task.planned_finish_at,
      'new_start', p_new_planned_start,
      'new_finish', p_new_planned_finish
    )
  );

  RETURN jsonb_build_object('success', true, 'task_id', p_task_id, 'revision', v_task.revision + 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 14. RPC: Reassign Task ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.rpc_reassign_task(
  p_task_id UUID,
  p_new_stakeholder_id UUID,
  p_role TEXT DEFAULT 'primary_assignee',
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_task RECORD;
  v_actor_user_id UUID := auth.uid();
  v_actor_stakeholder_id UUID;
BEGIN
  SELECT * INTO v_task FROM public.pm_site_tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND: Task % does not exist', p_task_id;
  END IF;

  IF v_actor_user_id IS NOT NULL THEN
    SELECT id INTO v_actor_stakeholder_id FROM public.stakeholders WHERE auth_user_id = v_actor_user_id LIMIT 1;
  END IF;

  -- Deactivate previous primary assignee if reassigning primary
  IF p_role = 'primary_assignee' THEN
    UPDATE public.pm_task_assignments
    SET is_active = false, released_at = now()
    WHERE task_id = p_task_id AND role = 'primary_assignee' AND is_active = true;

    UPDATE public.pm_site_tasks
    SET assignee_stakeholder_id = p_new_stakeholder_id, updated_at = now()
    WHERE id = p_task_id;
  ELSIF p_role = 'qc_inspector' THEN
    UPDATE public.pm_site_tasks
    SET qc_stakeholder_id = p_new_stakeholder_id, updated_at = now()
    WHERE id = p_task_id;
  END IF;

  -- Insert new active assignment
  INSERT INTO public.pm_task_assignments (
    task_id, stakeholder_id, role, assigned_by, assigned_at, is_active
  ) VALUES (
    p_task_id, p_new_stakeholder_id, p_role, v_actor_user_id, now(), true
  )
  ON CONFLICT (task_id, stakeholder_id, role)
  DO UPDATE SET is_active = true, released_at = NULL, assigned_at = now();

  -- Record event
  INSERT INTO public.pm_task_events (
    task_id, project_id, event_type, actor_user_id, actor_stakeholder_id,
    from_state, to_state, reason, payload
  ) VALUES (
    p_task_id, v_task.project_id, 'reassigned',
    v_actor_user_id, v_actor_stakeholder_id,
    v_task.status, v_task.status, p_reason,
    jsonb_build_object('role', p_role, 'new_stakeholder_id', p_new_stakeholder_id)
  );

  RETURN jsonb_build_object('success', true, 'task_id', p_task_id, 'new_stakeholder_id', p_new_stakeholder_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 15. Permissions and Grants ────────────────────────────────────
GRANT SELECT, INSERT, UPDATE ON public.pm_component_instances TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pm_work_packages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pm_work_package_boq_scope TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pm_task_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pm_inspection_requests TO authenticated;
GRANT SELECT, INSERT ON public.pm_task_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pm_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pm_task_constraints TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

COMMIT;
