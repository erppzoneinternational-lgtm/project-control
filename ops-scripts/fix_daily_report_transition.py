from db_query import q
import json

sql = """
CREATE OR REPLACE FUNCTION public.rpc_daily_report_transition(
  p_report_id uuid,
  p_action text,
  p_reason text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_report RECORD;
  v_actor_user_id UUID := auth.uid();
  v_from_state TEXT;
  v_to_state TEXT;
  v_is_pm_or_admin BOOLEAN := false;
  v_is_planner BOOLEAN := false;
  v_is_site_eng BOOLEAN := false;
  v_is_submitter BOOLEAN := false;
  v_line RECORD;
BEGIN
  -- 1. Fetch Report
  SELECT * INTO v_report FROM public.pm_daily_progress WHERE id = p_report_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'REPORT_NOT_FOUND: التقرير % غير موجود', p_report_id;
  END IF;

  v_from_state := v_report.status;

  -- 2. Resolve Actor Roles
  IF v_actor_user_id IS NOT NULL THEN
    v_is_pm_or_admin := public.fn_user_has_role(v_actor_user_id, ARRAY[
      'admin', 'project_manager', 'planning_manager', 'ceo', 'coo', 'chairman'
    ]::public.user_role[]);

    v_is_planner := public.fn_user_has_role(v_actor_user_id, ARRAY[
      'admin', 'planning_engineer', 'planning_manager'
    ]::public.user_role[]);

    v_is_site_eng := public.fn_user_has_role(v_actor_user_id, ARRAY[
      'site_engineer', 'admin', 'project_manager', 'planning_manager'
    ]::public.user_role[]);

    v_is_submitter := (v_report.entered_by IS NOT NULL AND v_actor_user_id = v_report.entered_by);
  ELSE
    -- Service role (cron, system)
    v_is_pm_or_admin := true;
    v_is_planner := true;
    v_is_site_eng := true;
    v_is_submitter := true;
  END IF;

  -- 3. Action State Machine Validation
  CASE p_action
    WHEN 'submit' THEN
      IF v_from_state NOT IN ('draft', 'rejected') THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن تقديم تقرير بحالة "%"', v_from_state;
      END IF;
      IF NOT (v_is_submitter OR v_is_pm_or_admin OR v_is_site_eng) THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مهندس الموقع أو مقدم التقرير أو مدير المشروع يمكنه تقديم التقرير';
      END IF;
      v_to_state := 'submitted';

    WHEN 'approve' THEN
      IF v_from_state <> 'submitted' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن اعتماد تقرير بحالة "%"', v_from_state;
      END IF;
      IF NOT (v_is_planner OR v_is_pm_or_admin) THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مهندس التخطيط أو مدير المشروع يمكنه اعتماد التقرير';
      END IF;
      v_to_state := 'approved';

    WHEN 'reject' THEN
      IF v_from_state <> 'submitted' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن رفض تقرير بحالة "%"', v_from_state;
      END IF;
      IF NOT (v_is_planner OR v_is_pm_or_admin) THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مهندس التخطيط أو مدير المشروع يمكنه رفض التقرير';
      END IF;
      IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'REASON_REQUIRED: سبب الرفض مطلوب';
      END IF;
      v_to_state := 'rejected';

    WHEN 'reopen' THEN
      IF v_from_state <> 'approved' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن إعادة فتح تقرير بحالة "%"', v_from_state;
      END IF;
      IF NOT (v_is_planner OR v_is_pm_or_admin) THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مهندس التخطيط أو الأدمن يمكنه إعادة فتح تقرير معتمد';
      END IF;
      IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'REASON_REQUIRED: سبب إعادة الفتح مطلوب';
      END IF;
      v_to_state := 'reopened';

    ELSE
      RAISE EXCEPTION 'UNKNOWN_ACTION: الإجراء "%" غير معروف — الإجراءات المتاحة: submit, approve, reject, reopen', p_action;
  END CASE;

  -- 4. Update Report State
  UPDATE public.pm_daily_progress
  SET
    status = v_to_state,
    submitted_at = CASE WHEN v_to_state = 'submitted' THEN now() ELSE submitted_at END,
    entered_by = COALESCE(entered_by, v_actor_user_id),
    approved_by = CASE WHEN v_to_state = 'approved' THEN v_actor_user_id ELSE approved_by END,
    approved_at = CASE WHEN v_to_state = 'approved' THEN now() ELSE approved_at END,
    rejection_reason = CASE WHEN v_to_state = 'rejected' THEN p_reason ELSE rejection_reason END,
    reopened_reason = CASE WHEN v_to_state = 'reopened' THEN p_reason ELSE reopened_reason END,
    updated_at = now()
  WHERE id = p_report_id;

  -- 5. Auto-Actions on Approve
  IF v_to_state = 'approved' THEN
    -- Freeze BOQ rates and revision on all lines
    UPDATE public.pm_daily_progress_lines l
    SET
      line_status = 'approved',
      line_reviewed_by = v_actor_user_id,
      line_reviewed_at = now(),
      snapshot_rate_egp = COALESCE(l.snapshot_rate_egp, (
        SELECT b.rate_egp FROM public.pm_boq_items b WHERE b.id = l.boq_item_id
      )),
      source_boq_revision = COALESCE(l.source_boq_revision, (
        SELECT b.revision FROM public.pm_boq_items b WHERE b.id = l.boq_item_id
      )),
      updated_at = now()
    WHERE l.daily_progress_id = p_report_id
      AND l.line_status = 'pending';
  END IF;

  -- 6. Auto-Actions on Reopen
  IF v_to_state = 'reopened' THEN
    -- Suspend all allocations linked to this report's lines
    UPDATE public.pm_progress_allocations a
    SET is_suspended = true, updated_at = now()
    FROM public.pm_daily_progress_lines l
    WHERE l.daily_progress_id = p_report_id
      AND a.line_id = l.id
      AND (a.is_suspended IS NULL OR a.is_suspended = false);

    -- Reset line statuses back to pending
    UPDATE public.pm_daily_progress_lines
    SET line_status = 'pending', updated_at = now()
    WHERE daily_progress_id = p_report_id;
  END IF;

  -- 7. Auto-Actions on Reject
  IF v_to_state = 'rejected' THEN
    -- Reset line statuses back to pending for re-edit
    UPDATE public.pm_daily_progress_lines
    SET line_status = 'pending', updated_at = now()
    WHERE daily_progress_id = p_report_id
      AND line_status = 'approved';
  END IF;

  -- 8. Return Result
  RETURN jsonb_build_object(
    'success', true,
    'report_id', p_report_id,
    'previous_status', v_from_state,
    'new_status', v_to_state,
    'actor_user_id', v_actor_user_id
  );
END;
$function$;
"""

res = q(sql)
print("Result:", res)
