-- ============================================================
-- 039_deliverable_inspection_rpcs.sql
-- Two RPCs:
--   1. rpc_deliverable_item_transition — TO deliverable state machine
--   2. rpc_create_inspection — creates inspection request + auto-assigns QC
-- ============================================================

BEGIN;

-- ================================================================
-- RPC 1: Deliverable Item Transition
-- ================================================================
CREATE OR REPLACE FUNCTION public.rpc_deliverable_item_transition(
  p_item_id UUID,
  p_action TEXT,
  p_reason TEXT DEFAULT NULL,
  p_consultant_code TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_actor_user_id UUID := auth.uid();
  v_actor_stakeholder_id UUID;
  v_from_state TEXT;
  v_to_state TEXT;
  v_is_to_manager BOOLEAN := false;
  v_is_to_engineer BOOLEAN := false;
  v_is_admin BOOLEAN := false;
BEGIN
  -- ── 1. Fetch Item ──
  SELECT * INTO v_item FROM public.pm_deliverable_items WHERE id = p_item_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ITEM_NOT_FOUND: التسليمة % غير موجودة', p_item_id;
  END IF;

  v_from_state := v_item.status;

  -- ── 2. Resolve Actor ──
  IF v_actor_user_id IS NOT NULL THEN
    SELECT id INTO v_actor_stakeholder_id
    FROM public.stakeholders
    WHERE auth_user_id = v_actor_user_id
    LIMIT 1;

    v_is_admin := public.fn_user_has_role(v_actor_user_id, ARRAY['admin']::public.user_role[]);

    v_is_to_manager := v_is_admin OR public.fn_user_has_role(v_actor_user_id, ARRAY[
      'to_manager', 'planning_manager', 'project_manager'
    ]::public.user_role[]);

    v_is_to_engineer := v_is_admin OR (v_actor_stakeholder_id IS NOT NULL
      AND v_actor_stakeholder_id = v_item.assigned_to);
  ELSE
    -- Service role
    v_is_admin := true;
    v_is_to_manager := true;
    v_is_to_engineer := true;
  END IF;

  -- ── 3. Action → State Machine ──
  CASE p_action
    WHEN 'start_work' THEN
      IF v_from_state <> 'pending' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن بدء العمل من حالة "%"', v_from_state;
      END IF;
      IF NOT (v_is_to_engineer OR v_is_to_manager) THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط المهندس المعين أو مدير المكتب الفني';
      END IF;
      v_to_state := 'in_progress';

    WHEN 'submit_to_manager' THEN
      IF v_from_state <> 'in_progress' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن التقديم من حالة "%"', v_from_state;
      END IF;
      IF NOT (v_is_to_engineer OR v_is_to_manager) THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط المهندس المعين';
      END IF;
      v_to_state := 'ready_to_return';

    WHEN 'manager_approve' THEN
      IF v_from_state <> 'ready_to_return' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن الاعتماد من حالة "%"', v_from_state;
      END IF;
      IF NOT v_is_to_manager THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مدير المكتب الفني';
      END IF;
      v_to_state := 'returned';

    WHEN 'manager_reject' THEN
      IF v_from_state <> 'ready_to_return' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن الرفض من حالة "%"', v_from_state;
      END IF;
      IF NOT v_is_to_manager THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مدير المكتب الفني';
      END IF;
      IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'REASON_REQUIRED: سبب الرفض مطلوب';
      END IF;
      v_to_state := 'in_progress';

    WHEN 'record_consultant_code' THEN
      IF v_from_state <> 'returned' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن تسجيل رد الاستشاري من حالة "%"', v_from_state;
      END IF;
      IF NOT v_is_to_manager THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مدير المكتب الفني يسجل رد الاستشاري';
      END IF;
      IF p_consultant_code IS NULL OR p_consultant_code NOT IN ('A', 'B', 'C', 'D') THEN
        RAISE EXCEPTION 'INVALID_CODE: رمز الاستشاري يجب أن يكون A أو B أو C أو D';
      END IF;
      -- The actual state change is handled by the existing trigger (032)
      -- We just set consultant_status and the trigger does the rest
      UPDATE public.pm_deliverable_items
      SET
        consultant_status = p_consultant_code,
        updated_at = now()
      WHERE id = p_item_id;

      -- Log event
      INSERT INTO public.pm_deliverable_events (
        deliverable_id, deliverable_item_id, event_type,
        from_value, to_value, reason
      ) VALUES (
        v_item.deliverable_id, p_item_id, 'consultant_review',
        v_from_state, 'Code ' || p_consultant_code,
        COALESCE(p_reason, 'Consultant Code ' || p_consultant_code)
      );

      RETURN jsonb_build_object(
        'success', true,
        'item_id', p_item_id,
        'action', p_action,
        'consultant_code', p_consultant_code
      );

    WHEN 'block' THEN
      IF v_from_state <> 'in_progress' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن حجب إلا من حالة "in_progress"';
      END IF;
      IF p_reason IS NULL OR trim(p_reason) = '' THEN
        RAISE EXCEPTION 'REASON_REQUIRED: سبب الحجب مطلوب';
      END IF;
      v_to_state := 'blocked';

    WHEN 'unblock' THEN
      IF v_from_state <> 'blocked' THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: لا يمكن فك الحجب إلا من حالة "blocked"';
      END IF;
      IF NOT v_is_to_manager THEN
        RAISE EXCEPTION 'FORBIDDEN: فقط مدير المكتب الفني يمكنه فك الحجب';
      END IF;
      v_to_state := 'in_progress';

    ELSE
      RAISE EXCEPTION 'UNKNOWN_ACTION: الإجراء "%" غير معروف', p_action;
  END CASE;

  -- ── 4. Update Item ──
  UPDATE public.pm_deliverable_items
  SET
    status = v_to_state,
    to_manager_approved = CASE
      WHEN p_action = 'manager_approve' THEN true
      WHEN p_action = 'manager_reject' THEN false
      ELSE to_manager_approved
    END,
    to_manager_approved_at = CASE
      WHEN p_action = 'manager_approve' THEN now()
      ELSE to_manager_approved_at
    END,
    to_manager_approved_by = CASE
      WHEN p_action = 'manager_approve' THEN v_actor_stakeholder_id
      ELSE to_manager_approved_by
    END,
    completed_at = CASE
      WHEN p_action = 'submit_to_manager' THEN now()
      WHEN p_action = 'manager_reject' THEN NULL
      ELSE completed_at
    END,
    blocked_reason = CASE
      WHEN p_action = 'block' THEN p_reason
      WHEN p_action = 'unblock' THEN NULL
      ELSE blocked_reason
    END,
    blocked_since = CASE
      WHEN p_action = 'block' THEN now()
      WHEN p_action = 'unblock' THEN NULL
      ELSE blocked_since
    END,
    updated_at = now()
  WHERE id = p_item_id;

  -- ── 5. Log Event ──
  INSERT INTO public.pm_deliverable_events (
    deliverable_id, deliverable_item_id, event_type,
    from_value, to_value, reason
  ) VALUES (
    v_item.deliverable_id, p_item_id,
    CASE p_action
      WHEN 'start_work' THEN 'status_change'
      WHEN 'submit_to_manager' THEN 'submitted_for_review'
      WHEN 'manager_approve' THEN 'manager_approved'
      WHEN 'manager_reject' THEN 'manager_rejected'
      WHEN 'block' THEN 'blocked'
      WHEN 'unblock' THEN 'unblock'
      ELSE p_action
    END,
    v_from_state, v_to_state,
    p_reason
  );

  -- ── 6. Notifications ──
  -- Notify TO engineer when manager rejects
  IF p_action = 'manager_reject' AND v_item.assigned_to IS NOT NULL THEN
    DECLARE v_eng_user UUID;
    BEGIN
      SELECT auth_user_id INTO v_eng_user FROM public.stakeholders WHERE id = v_item.assigned_to;
      IF v_eng_user IS NOT NULL THEN
        INSERT INTO public.pm_notifications (
          recipient_user_id, project_id, event_type, entity_type, entity_id,
          title_ar, body_ar, link_url, metadata
        ) VALUES (
          v_eng_user, v_item.project_id, 'deliverable_rejected', 'deliverable_item', p_item_id,
          'لوحتك مرفوضة — عدّلها',
          'تم رفض اللوحة: ' || COALESCE(v_item.title, v_item.drawing_no, 'غير محدد') || ' — السبب: ' || p_reason,
          '/to-progress',
          jsonb_build_object('item_id', p_item_id, 'action', p_action)
        );
      END IF;
    END;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'item_id', p_item_id,
    'from_state', v_from_state,
    'to_state', v_to_state,
    'action', p_action
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';


-- ================================================================
-- RPC 2: Create Inspection Request + Auto-Assign QC
-- ================================================================
CREATE OR REPLACE FUNCTION public.rpc_create_inspection(
  p_task_id UUID,
  p_inspection_type TEXT DEFAULT 'wir',
  p_required_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_task RECORD;
  v_actor_user_id UUID := auth.uid();
  v_qc_stakeholder_id UUID;
  v_project_id UUID;
  v_count INT;
  v_new_request_no TEXT;
  v_inspection_id UUID;
  v_type_norm TEXT;
  v_prefix TEXT;
BEGIN
  -- ── 1. Fetch Task ──
  SELECT * INTO v_task FROM public.pm_site_tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'TASK_NOT_FOUND: المهمة % غير موجودة', p_task_id;
  END IF;

  v_project_id := v_task.project_id;

  -- Normalize inspection type to match check constraint: ('WIR', 'MIR', 'NCR', 'pre_pour', 'survey', 'final_handover')
  v_type_norm := CASE
    WHEN lower(p_inspection_type) = 'wir' THEN 'WIR'
    WHEN lower(p_inspection_type) = 'mir' THEN 'MIR'
    WHEN lower(p_inspection_type) = 'ncr' THEN 'NCR'
    ELSE lower(p_inspection_type)
  END;

  -- ── 2. Find QC Inspector ──
  -- Try: task-level qc_stakeholder_id first
  IF v_task.qc_stakeholder_id IS NOT NULL THEN
    v_qc_stakeholder_id := v_task.qc_stakeholder_id;
  ELSE
    -- Find any QC inspector assigned to this project
    SELECT ps.stakeholder_id INTO v_qc_stakeholder_id
    FROM public.project_stakeholders ps
    JOIN public.stakeholders s ON s.id = ps.stakeholder_id
    WHERE ps.project_id = v_project_id
      AND (ps.project_role = 'qc_inspector' OR s.role::text = 'qc_inspector')
    LIMIT 1;
  END IF;

  -- ── 3. Generate Request Number ──
  v_prefix := upper(v_type_norm);
  SELECT count(*) + 1 INTO v_count
  FROM public.pm_inspection_requests
  WHERE project_id = v_project_id;

  v_new_request_no := v_prefix || '-' || lpad(v_count::text, 4, '0');

  WHILE EXISTS (SELECT 1 FROM public.pm_inspection_requests WHERE project_id = v_project_id AND request_no = v_new_request_no) LOOP
    v_count := v_count + 1;
    v_new_request_no := v_prefix || '-' || lpad(v_count::text, 4, '0');
  END LOOP;

  -- ── 4. Insert Inspection Request ──
  INSERT INTO public.pm_inspection_requests (
    task_id, project_id, request_no, inspection_type,
    required_at, assigned_qc_id, status, created_by
  ) VALUES (
    p_task_id, v_project_id, v_new_request_no, v_type_norm,
    COALESCE(p_required_at::date, (now() + INTERVAL '1 day')::date),
    v_qc_stakeholder_id, 'pending', v_actor_user_id
  )
  RETURNING id INTO v_inspection_id;

  -- Note: The trg_inspection_notify trigger (030) handles QC notification automatically

  RETURN jsonb_build_object(
    'success', true,
    'inspection_id', v_inspection_id,
    'task_id', p_task_id,
    'request_no', v_new_request_no,
    'assigned_qc_id', v_qc_stakeholder_id,
    'inspection_type', v_type_norm
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

COMMIT;
