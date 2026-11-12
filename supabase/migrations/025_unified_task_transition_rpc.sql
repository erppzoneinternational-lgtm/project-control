-- ============================================================
-- 025_unified_task_transition_rpc.sql
-- Replaces BOTH the old 3-arg and new 5-arg rpc_site_task_transition
-- with ONE authoritative RPC that has:
--   ✅ State machine validation (v_allowed)
--   ✅ Role gates per transition
--   ✅ Assignee/QC assignment validation
--   ✅ Immutable audit events (pm_task_events)
--   ✅ Derived progress calculation
--   ✅ Actual date tracking
-- ============================================================

BEGIN;

-- 1. Drop both old overloads
DROP FUNCTION IF EXISTS public.rpc_site_task_transition(uuid, text, text);
DROP FUNCTION IF EXISTS public.rpc_site_task_transition(uuid, text, text, jsonb, numeric);

-- 2. Create the unified RPC
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
  v_allowed TEXT[];
  v_new_progress NUMERIC;
  v_event_type TEXT;
  v_is_assignee BOOLEAN := false;
  v_is_pm_or_admin BOOLEAN := false;
  v_is_qc_assigned BOOLEAN := false;
BEGIN
  -- ── 1. Fetch Task ──
  SELECT * INTO v_task FROM public.pm_site_tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND: Task % does not exist', p_task_id;
  END IF;

  v_from_state := v_task.status;

  -- ── 2. Resolve Actor Identity & Roles ──
  IF v_actor_user_id IS NOT NULL THEN
    SELECT id INTO v_actor_stakeholder_id
    FROM public.stakeholders
    WHERE auth_user_id = v_actor_user_id
    LIMIT 1;

    v_is_assignee := (v_actor_stakeholder_id IS NOT NULL
      AND v_actor_stakeholder_id = v_task.assignee_stakeholder_id);

    v_is_pm_or_admin := public.fn_user_has_role(v_actor_user_id, ARRAY[
      'admin', 'project_manager', 'planning_manager', 'planning_engineer'
    ]::public.user_role[]);

    v_is_qc_assigned := (v_actor_stakeholder_id IS NOT NULL
      AND v_actor_stakeholder_id = v_task.qc_stakeholder_id);
  ELSE
    -- Service role / system background operations (auth.uid() IS NULL)
    v_is_pm_or_admin := true;
    v_is_assignee := true;
    v_is_qc_assigned := true;
  END IF;

  -- ── 4. State Machine — allowed transitions ──
  v_allowed := CASE v_from_state
    WHEN 'pending'     THEN ARRAY['in_progress', 'cancelled']
    WHEN 'in_progress' THEN ARRAY['pm_review', 'cancelled']
    WHEN 'pm_review'   THEN ARRAY['qc_pending', 'approved', 'rejected']
    WHEN 'qc_pending'  THEN ARRAY['approved', 'rejected']
    WHEN 'rejected'    THEN ARRAY['in_progress', 'cancelled']
    WHEN 'approved'    THEN ARRAY['done']
    ELSE ARRAY[]::TEXT[]
  END;

  IF NOT (p_to_state = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'INVALID_TRANSITION: Cannot transition from "%" to "%"', v_from_state, p_to_state;
  END IF;

  -- ── 5. Role Gates per Transition ──

  -- pending → in_progress: only assignee or PM/admin
  IF v_from_state = 'pending' AND p_to_state = 'in_progress' THEN
    IF NOT (v_is_assignee OR v_is_pm_or_admin) THEN
      RAISE EXCEPTION 'FORBIDDEN: Only the assigned engineer or PM/admin can start this task';
    END IF;
  END IF;

  -- in_progress → pm_review: only assignee or PM/admin
  IF v_from_state = 'in_progress' AND p_to_state = 'pm_review' THEN
    IF NOT (v_is_assignee OR v_is_pm_or_admin) THEN
      RAISE EXCEPTION 'FORBIDDEN: Only the assigned engineer can submit for PM review';
    END IF;
  END IF;

  -- pm_review → approved/qc_pending/rejected: only PM/admin
  IF v_from_state = 'pm_review' AND p_to_state IN ('approved', 'qc_pending', 'rejected') THEN
    IF NOT v_is_pm_or_admin THEN
      RAISE EXCEPTION 'FORBIDDEN: Only PM/planning_manager/admin can approve, route to QC, or reject';
    END IF;
  END IF;

  -- qc_pending → approved/rejected: only QC assigned or PM/admin
  IF v_from_state = 'qc_pending' AND p_to_state IN ('approved', 'rejected') THEN
    IF NOT (v_is_qc_assigned OR v_is_pm_or_admin) THEN
      RAISE EXCEPTION 'FORBIDDEN: Only the assigned QC inspector or PM/admin can decide QC outcome';
    END IF;
  END IF;

  -- rejected → in_progress: only assignee or PM/admin
  IF v_from_state = 'rejected' AND p_to_state = 'in_progress' THEN
    IF NOT (v_is_assignee OR v_is_pm_or_admin) THEN
      RAISE EXCEPTION 'FORBIDDEN: Only the assigned engineer or PM/admin can restart after rejection';
    END IF;
  END IF;

  -- approved → done: only PM/admin
  IF v_from_state = 'approved' AND p_to_state = 'done' THEN
    IF NOT v_is_pm_or_admin THEN
      RAISE EXCEPTION 'FORBIDDEN: Only PM/admin can close a task';
    END IF;
  END IF;

  -- cancellation: only PM/admin
  IF p_to_state = 'cancelled' THEN
    IF NOT v_is_pm_or_admin THEN
      RAISE EXCEPTION 'FORBIDDEN: Only PM/planning_manager/admin can cancel a task';
    END IF;
  END IF;

  -- ── 6. Mandatory reason for rejection/cancellation ──
  IF p_to_state IN ('rejected', 'cancelled') AND (p_reason IS NULL OR trim(p_reason) = '') THEN
    RAISE EXCEPTION 'REASON_REQUIRED: A non-empty reason is mandatory for rejection or cancellation';
  END IF;

  -- ── 7. Calculate progress ──
  IF p_verified_qty IS NOT NULL THEN
    IF v_task.planned_qty > 0 THEN
      v_new_progress := LEAST(100.00, GREATEST(0.00, (p_verified_qty / v_task.planned_qty) * 100.00));
    ELSE
      v_new_progress := v_task.progress_pct;
    END IF;
  ELSE
    v_new_progress := CASE
      WHEN p_to_state IN ('approved', 'done') THEN 100.00
      ELSE v_task.progress_pct
    END;
  END IF;

  -- ── 8. Update Task ──
  UPDATE public.pm_site_tasks
  SET
    status = p_to_state,
    rejection_reason = CASE WHEN p_to_state = 'rejected' THEN p_reason ELSE rejection_reason END,
    progress_pct = v_new_progress,
    verified_qty = COALESCE(p_verified_qty, verified_qty),
    actual_start_at = CASE
      WHEN p_to_state = 'in_progress' AND actual_start_at IS NULL THEN now()
      ELSE actual_start_at
    END,
    actual_finish_at = CASE
      WHEN p_to_state IN ('approved', 'done') THEN now()
      ELSE actual_finish_at
    END,
    updated_at = now()
  WHERE id = p_task_id;

  -- ── 9. Map to event_type ──
  v_event_type := CASE
    WHEN p_to_state = 'in_progress' AND v_from_state = 'pending'   THEN 'started'
    WHEN p_to_state = 'in_progress' AND v_from_state = 'rejected'  THEN 'reopened_rework'
    WHEN p_to_state = 'pm_review'                                   THEN 'submitted_for_pm'
    WHEN p_to_state = 'approved' AND v_from_state = 'pm_review'    THEN 'pm_accepted'
    WHEN p_to_state = 'approved' AND v_from_state = 'qc_pending'   THEN 'inspection_passed'
    WHEN p_to_state = 'qc_pending'                                  THEN 'inspection_created'
    WHEN p_to_state = 'rejected' AND v_from_state = 'pm_review'    THEN 'pm_rejected'
    WHEN p_to_state = 'rejected' AND v_from_state = 'qc_pending'   THEN 'inspection_rejected'
    WHEN p_to_state = 'done'                                        THEN 'closed'
    WHEN p_to_state = 'cancelled'                                   THEN 'cancelled'
    ELSE 'scope_changed'
  END;

  -- ── 10. Record Immutable Audit Event ──
  INSERT INTO public.pm_task_events (
    task_id, project_id, event_type, actor_user_id, actor_stakeholder_id,
    from_state, to_state, reason, payload
  ) VALUES (
    p_task_id, v_task.project_id, v_event_type,
    v_actor_user_id, v_actor_stakeholder_id,
    v_from_state, p_to_state, p_reason, p_evidence_payload
  );

  -- ── 11. Return result ──
  RETURN jsonb_build_object(
    'success', true,
    'task_id', p_task_id,
    'from_state', v_from_state,
    'to_state', p_to_state,
    'progress_pct', v_new_progress,
    'event_type', v_event_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

COMMIT;
