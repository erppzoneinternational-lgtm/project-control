-- ============================================================
-- 026_workflow_stakeholder_linkage.sql
-- Fixes the two broken links in the task workflow:
--
--   FIX 1 (CRITICAL): stakeholders.auth_user_id was added in 023 but
--   NEVER backfilled → migration 025's role gates (v_is_assignee /
--   v_is_qc_assigned) are dead code → site engineers get FORBIDDEN
--   starting/submitting their own tasks.
--   → Backfill by email match (stakeholders.email = auth.users.email).
--     PRD: "Backfill once; stop email lookup for authorization."
--     Duplicate-email guard: one auth user links to at most ONE
--     stakeholder row (is_active + most recent wins) to respect the
--     UNIQUE constraint.
--   → Review view v_stakeholders_missing_auth_link lists anyone left
--     unlinked (fix manually: stakeholders with no email or a
--     different email than the auth account).
--
--   FIX 2: Task assignment is not validated against the project team
--   (project_stakeholders — the Project Setup RACI table, M1–M4).
--   You could assign tasks to people outside the project team,
--   bypassing the accountability model.
--   → fn_is_on_project_team() + fn_project_has_team() helpers
--   → rpc_reassign_task now validates team membership
--   → fn_check_task_project_integrity (from 023) extended: the
--     primary assignee AND the QC inspector must be on the team
--   → new trigger on pm_task_assignments validates every insert/update
--
--   ENFORCEMENT RULE (pragmatic): if the project HAS a defined team
--   (>= 1 row in project_stakeholders), the assignee must be on it.
--   Projects without a team are not blocked (legacy / not yet set up).
--   service_role / background jobs (auth.uid() IS NULL) bypass the
--   trigger check, but NOT the RPC check.
--
-- NOTE: NOT yet applied to the live database. Review + test before deploy.
-- ============================================================

BEGIN;

-- ── 1. FIX 1: Backfill stakeholders.auth_user_id by email match ──
WITH candidates AS (
  SELECT
    s.id  AS stakeholder_id,
    au.id AS user_id,
    ROW_NUMBER() OVER (
      PARTITION BY au.id
      ORDER BY s.is_active DESC, s.updated_at DESC
    ) AS rn
  FROM public.stakeholders s
  JOIN auth.users au
    ON lower(trim(au.email)) = lower(trim(s.email))
  WHERE s.auth_user_id IS NULL
    AND s.email IS NOT NULL
    AND trim(s.email) <> ''
    AND au.email IS NOT NULL
)
UPDATE public.stakeholders s
SET auth_user_id = c.user_id
FROM candidates c
WHERE c.stakeholder_id = s.id
  AND c.rn = 1
  AND s.auth_user_id IS NULL;

-- ── 2. Review view: active stakeholders still missing the auth link ──
-- security_invoker → inherits stakeholders RLS (consistent with 007 views)
CREATE OR REPLACE VIEW public.v_stakeholders_missing_auth_link
WITH (security_invoker = true) AS
SELECT
  s.id,
  s.name_ar,
  s.name_en,
  s.job_title,
  s.email,
  s.is_active
FROM public.stakeholders s
WHERE s.auth_user_id IS NULL
  AND s.is_active = TRUE
ORDER BY s.name_ar;

COMMENT ON VIEW public.v_stakeholders_missing_auth_link IS
  'Active stakeholders with no linked auth user — workflow role gates (assignee/QC) will NOT recognize them until linked.';

-- ── 3. FIX 2: Project-team helpers ──────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_is_on_project_team(
  p_stakeholder_id UUID,
  p_project_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p_stakeholder_id IS NOT NULL
     AND p_project_id IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM public.project_stakeholders ps
       WHERE ps.stakeholder_id = p_stakeholder_id
         AND ps.project_id = p_project_id
     );
$$;

COMMENT ON FUNCTION public.fn_is_on_project_team IS
  'TRUE if the stakeholder is registered on the project team (project_stakeholders, RACI from Project Setup).';

CREATE OR REPLACE FUNCTION public.fn_project_has_team(
  p_project_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p_project_id IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.project_stakeholders ps
       WHERE ps.project_id = p_project_id
     );
$$;

COMMENT ON FUNCTION public.fn_project_has_team IS
  'TRUE if the project has a defined stakeholder team (>= 1 project_stakeholders row).';

REVOKE ALL ON FUNCTION public.fn_is_on_project_team(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_project_has_team(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_is_on_project_team(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_project_has_team(UUID) TO authenticated, service_role;

-- ── 4. FIX 2a: rpc_reassign_task — validate team membership ──────
-- (supersedes the 023 version; adds the team gate)
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

  -- NEW: the assignee must be on the project team (Project Setup RACI)
  IF public.fn_project_has_team(v_task.project_id)
     AND NOT public.fn_is_on_project_team(p_new_stakeholder_id, v_task.project_id) THEN
    RAISE EXCEPTION 'ASSIGNEE_NOT_ON_PROJECT_TEAM: Stakeholder % is not on the project team — add them via Project Setup (Stakeholders) first. / المعيّن ليس ضمن فريق المشروع — أضفه من موديول إدارة أصحاب المصلحة أولًا',
      p_new_stakeholder_id;
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

-- ── 5. FIX 2b: integrity trigger — assignee & QC must be on team ──
-- (supersedes the 023 version; adds assignee/qc team gates to the
--  existing zone/component/work-package/activity checks)
CREATE OR REPLACE FUNCTION public.fn_check_task_project_integrity()
RETURNS TRIGGER AS $$
DECLARE
  v_zone_proj UUID;
  v_comp_proj UUID;
  v_wp_proj   UUID;
  v_act_proj  UUID;
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

  -- NEW: primary assignee must be on the project team
  IF NEW.assignee_stakeholder_id IS NOT NULL
     AND public.fn_project_has_team(NEW.project_id)
     AND NOT public.fn_is_on_project_team(NEW.assignee_stakeholder_id, NEW.project_id) THEN
    RAISE EXCEPTION 'ASSIGNEE_NOT_ON_PROJECT_TEAM: assignee_stakeholder_id % is not on the project team — add them via Project Setup (Stakeholders) first. / المعيّن ليس ضمن فريق المشروع',
      NEW.assignee_stakeholder_id;
  END IF;

  -- NEW: QC inspector must be on the project team
  IF NEW.qc_stakeholder_id IS NOT NULL
     AND public.fn_project_has_team(NEW.project_id)
     AND NOT public.fn_is_on_project_team(NEW.qc_stakeholder_id, NEW.project_id) THEN
    RAISE EXCEPTION 'QC_NOT_ON_PROJECT_TEAM: qc_stakeholder_id % is not on the project team — add them via Project Setup (Stakeholders) first. / مفتش الجودة ليس ضمن فريق المشروع',
      NEW.qc_stakeholder_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 6. FIX 2c: trigger on pm_task_assignments ────────────────────
CREATE OR REPLACE FUNCTION public.fn_validate_task_assignment_team()
RETURNS TRIGGER AS $$
DECLARE
  v_project_id UUID;
BEGIN
  -- service_role / background jobs bypass (no authenticated user)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT project_id INTO v_project_id FROM public.pm_site_tasks WHERE id = NEW.task_id;
  IF v_project_id IS NULL THEN
    RETURN NEW;  -- orphan assignment; FK protects anyway
  END IF;

  IF public.fn_project_has_team(v_project_id)
     AND NOT public.fn_is_on_project_team(NEW.stakeholder_id, v_project_id) THEN
    RAISE EXCEPTION 'ASSIGNEE_NOT_ON_PROJECT_TEAM: stakeholder % is not on the project team — add them via Project Setup (Stakeholders) first. / المعيّن ليس ضمن فريق المشروع',
      NEW.stakeholder_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_task_assignment_team ON public.pm_task_assignments;
CREATE TRIGGER trg_task_assignment_team
  BEFORE INSERT OR UPDATE ON public.pm_task_assignments
  FOR EACH ROW EXECUTE FUNCTION public.fn_validate_task_assignment_team();

COMMIT;

-- ============================================================
-- ROLLBACK (emergency — removes the linkage enforcements)
-- ============================================================
-- BEGIN;
-- DROP TRIGGER IF EXISTS trg_task_assignment_team ON public.pm_task_assignments;
-- DROP FUNCTION IF EXISTS public.fn_validate_task_assignment_team();
-- DROP VIEW  IF EXISTS public.v_stakeholders_missing_auth_link;
-- DROP FUNCTION IF EXISTS public.fn_is_on_project_team(UUID, UUID);
-- DROP FUNCTION IF EXISTS public.fn_project_has_team(UUID);
-- NOTE: the auth_user_id backfill is NOT automatically undone (durable
-- identity per PRD). To undo manually:
--   UPDATE public.stakeholders SET auth_user_id = NULL;
-- COMMIT;
