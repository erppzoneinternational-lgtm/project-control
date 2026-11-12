-- ============================================================
-- 030_event_notification_triggers.sql
-- Area: Automated Event Notifications (WS-1 & WS-8)
-- Entities: fn_get_project_role_users, trg_site_tasks_notify,
--           trg_daily_progress_notify, trg_inspection_notify
-- ============================================================

BEGIN;

-- 1. Helper function to find project team auth users by RACI / project role / system role
CREATE OR REPLACE FUNCTION public.fn_get_project_role_users(
  p_project_id UUID,
  p_roles TEXT[]
)
RETURNS TABLE(auth_user_id UUID) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  -- Match project stakeholders with linked auth account
  SELECT DISTINCT s.auth_user_id
  FROM public.project_stakeholders ps
  JOIN public.stakeholders s ON s.id = ps.stakeholder_id
  WHERE ps.project_id = p_project_id
    AND s.auth_user_id IS NOT NULL
    AND (
      ('project_manager' = ANY(p_roles) AND ps.raci_role = 'accountable')
      OR ps.project_role = ANY(p_roles)
      OR s.role = ANY(p_roles)
    )
  UNION
  -- Match pm_user_project_access
  SELECT DISTINCT upa.user_id AS auth_user_id
  FROM public.pm_user_project_access upa
  JOIN public.user_roles ur ON ur.user_id = upa.user_id
  WHERE upa.project_id = p_project_id
    AND ur.role::text = ANY(p_roles);
$$;

-- 2. Trigger: Site Task Status Notifications
CREATE OR REPLACE FUNCTION public.fn_trg_site_tasks_notify()
RETURNS TRIGGER AS $$
DECLARE
  v_assignee_user UUID;
  v_qc_user UUID;
  v_rec RECORD;
BEGIN
  -- Resolve assignee auth_user_id
  IF NEW.assignee_stakeholder_id IS NOT NULL THEN
    SELECT auth_user_id INTO v_assignee_user FROM public.stakeholders WHERE id = NEW.assignee_stakeholder_id;
  END IF;

  -- Resolve QC auth_user_id
  IF NEW.qc_stakeholder_id IS NOT NULL THEN
    SELECT auth_user_id INTO v_qc_user FROM public.stakeholders WHERE id = NEW.qc_stakeholder_id;
  END IF;

  -- Case A: Newly assigned engineer
  IF (TG_OP = 'INSERT' AND NEW.assignee_stakeholder_id IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND NEW.assignee_stakeholder_id IS DISTINCT FROM OLD.assignee_stakeholder_id AND NEW.assignee_stakeholder_id IS NOT NULL) THEN
    IF v_assignee_user IS NOT NULL AND (auth.uid() IS NULL OR v_assignee_user <> auth.uid()) THEN
      INSERT INTO public.pm_notifications (
        recipient_user_id, project_id, event_type, entity_type, entity_id,
        title_ar, body_ar, link_url, metadata
      ) VALUES (
        v_assignee_user, NEW.project_id, 'task_assigned', 'task', NEW.id,
        'تعيين مهمة موقع جديدة',
        'تم تعيينك لتنفيذ المهمة: ' || NEW.title_ar,
        '/planning/site-tasks',
        jsonb_build_object('task_id', NEW.id, 'status', NEW.status)
      );
    END IF;
  END IF;

  -- Case B: Submitted for PM Review
  IF TG_OP = 'UPDATE' AND NEW.status = 'pm_review' AND OLD.status <> 'pm_review' THEN
    FOR v_rec IN SELECT auth_user_id FROM public.fn_get_project_role_users(NEW.project_id, ARRAY['project_manager', 'planning_manager']) LOOP
      IF v_rec.auth_user_id IS NOT NULL AND (auth.uid() IS NULL OR v_rec.auth_user_id <> auth.uid()) THEN
        INSERT INTO public.pm_notifications (
          recipient_user_id, project_id, event_type, entity_type, entity_id,
          title_ar, body_ar, link_url, metadata
        ) VALUES (
          v_rec.auth_user_id, NEW.project_id, 'task_submitted_pm', 'task', NEW.id,
          'مهمة بانتظار مراجعة مدير المشروع',
          'تم تقديم المهمة: ' || NEW.title_ar || ' للاعتماد',
          '/planning/site-tasks',
          jsonb_build_object('task_id', NEW.id, 'status', NEW.status)
        );
      END IF;
    END LOOP;
  END IF;

  -- Case C: Routed to QC
  IF TG_OP = 'UPDATE' AND NEW.status = 'qc_pending' AND OLD.status <> 'qc_pending' THEN
    IF v_qc_user IS NOT NULL AND (auth.uid() IS NULL OR v_qc_user <> auth.uid()) THEN
      INSERT INTO public.pm_notifications (
        recipient_user_id, project_id, event_type, entity_type, entity_id,
        title_ar, body_ar, link_url, metadata
      ) VALUES (
        v_qc_user, NEW.project_id, 'task_qc_requested', 'task', NEW.id,
        'طلب فحص جودة لمهمة موقع',
        'المهمة: ' || NEW.title_ar || ' تتطلب فحص الجودة (WIR)',
        '/planning/site-tasks',
        jsonb_build_object('task_id', NEW.id, 'status', NEW.status)
      );
    END IF;
  END IF;

  -- Case D: Approved / Rejected -> Notify Assignee
  IF TG_OP = 'UPDATE' AND NEW.status IN ('approved', 'rejected') AND OLD.status <> NEW.status THEN
    IF v_assignee_user IS NOT NULL AND (auth.uid() IS NULL OR v_assignee_user <> auth.uid()) THEN
      INSERT INTO public.pm_notifications (
        recipient_user_id, project_id, event_type, entity_type, entity_id,
        title_ar, body_ar, link_url, metadata
      ) VALUES (
        v_assignee_user, NEW.project_id,
        CASE WHEN NEW.status = 'approved' THEN 'task_approved' ELSE 'task_rejected' END,
        'task', NEW.id,
        CASE WHEN NEW.status = 'approved' THEN 'تم اعتماد المهمة بنجاح' ELSE 'تم رفض المهمة / إعادة عمل' END,
        CASE WHEN NEW.status = 'approved' THEN 'تم اعتماد المهمة: ' || NEW.title_ar ELSE 'سبب الرفض: ' || COALESCE(NEW.rejection_reason, 'لم يحدد سبب') END,
        '/planning/site-tasks',
        jsonb_build_object('task_id', NEW.id, 'status', NEW.status, 'rejection_reason', NEW.rejection_reason)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

DROP TRIGGER IF EXISTS trg_site_tasks_notify ON public.pm_site_tasks;
CREATE TRIGGER trg_site_tasks_notify
  AFTER INSERT OR UPDATE ON public.pm_site_tasks
  FOR EACH ROW EXECUTE FUNCTION public.fn_trg_site_tasks_notify();

-- 3. Trigger: Daily Progress Submissions & Reviews
CREATE OR REPLACE FUNCTION public.fn_trg_daily_progress_notify()
RETURNS TRIGGER AS $$
DECLARE
  v_rec RECORD;
BEGIN
  -- Submitted -> Notify PM / Planning Manager
  IF NEW.status = 'submitted' AND (TG_OP = 'INSERT' OR OLD.status <> 'submitted') THEN
    FOR v_rec IN SELECT auth_user_id FROM public.fn_get_project_role_users(NEW.project_id, ARRAY['project_manager', 'planning_manager']) LOOP
      IF v_rec.auth_user_id IS NOT NULL AND (auth.uid() IS NULL OR v_rec.auth_user_id <> auth.uid()) THEN
        INSERT INTO public.pm_notifications (
          recipient_user_id, project_id, event_type, entity_type, entity_id,
          title_ar, body_ar, link_url, metadata
        ) VALUES (
          v_rec.auth_user_id, NEW.project_id, 'daily_report_submitted', 'daily_progress', NEW.id,
          'تقرير يومي جديد قيد المراجعة',
          'تم تقديم التقرير اليومي رقم ' || NEW.report_no || ' بتاريخ ' || NEW.progress_date,
          '/planning/daily-progress',
          jsonb_build_object('report_id', NEW.id, 'report_no', NEW.report_no)
        );
      END IF;
    END LOOP;
  END IF;

  -- Approved / Rejected -> Notify Submitter (entered_by)
  IF TG_OP = 'UPDATE' AND NEW.status IN ('approved', 'rejected') AND OLD.status <> NEW.status THEN
    IF NEW.entered_by IS NOT NULL AND (auth.uid() IS NULL OR NEW.entered_by <> auth.uid()) THEN
      INSERT INTO public.pm_notifications (
        recipient_user_id, project_id, event_type, entity_type, entity_id,
        title_ar, body_ar, link_url, metadata
      ) VALUES (
        NEW.entered_by, NEW.project_id,
        CASE WHEN NEW.status = 'approved' THEN 'daily_report_approved' ELSE 'daily_report_rejected' END,
        'daily_progress', NEW.id,
        CASE WHEN NEW.status = 'approved' THEN 'تم اعتماد التقرير اليومي' ELSE 'تم رفض التقرير اليومي' END,
        CASE WHEN NEW.status = 'approved' THEN 'تم اعتماد التقرير اليومي رقم ' || NEW.report_no ELSE 'تم رفض التقرير رقم ' || NEW.report_no || '، السبب: ' || COALESCE(NEW.rejection_reason, 'لم يحدد') END,
        '/planning/daily-progress',
        jsonb_build_object('report_id', NEW.id, 'status', NEW.status)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

DROP TRIGGER IF EXISTS trg_daily_progress_notify ON public.pm_daily_progress;
CREATE TRIGGER trg_daily_progress_notify
  AFTER INSERT OR UPDATE OF status ON public.pm_daily_progress
  FOR EACH ROW EXECUTE FUNCTION public.fn_trg_daily_progress_notify();

-- 4. Trigger: Inspection Requests
CREATE OR REPLACE FUNCTION public.fn_trg_inspection_notify()
RETURNS TRIGGER AS $$
DECLARE
  v_qc_user UUID;
BEGIN
  IF NEW.assigned_qc_id IS NOT NULL THEN
    SELECT auth_user_id INTO v_qc_user FROM public.stakeholders WHERE id = NEW.assigned_qc_id;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    IF v_qc_user IS NOT NULL AND (auth.uid() IS NULL OR v_qc_user <> auth.uid()) THEN
      INSERT INTO public.pm_notifications (
        recipient_user_id, project_id, event_type, entity_type, entity_id,
        title_ar, body_ar, link_url, metadata
      ) VALUES (
        v_qc_user, NEW.project_id, 'inspection_created', 'inspection', NEW.id,
        'طلب فحص جودة جديد (WIR/MIR)',
        'طلب الفحص رقم ' || NEW.request_no || ' بانتظار المعاينة',
        '/planning/site-tasks',
        jsonb_build_object('inspection_id', NEW.id, 'request_no', NEW.request_no)
      );
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.status IN ('approved', 'rejected') AND OLD.status <> NEW.status THEN
    IF NEW.created_by IS NOT NULL AND (auth.uid() IS NULL OR NEW.created_by <> auth.uid()) THEN
      INSERT INTO public.pm_notifications (
        recipient_user_id, project_id, event_type, entity_type, entity_id,
        title_ar, body_ar, link_url, metadata
      ) VALUES (
        NEW.created_by, NEW.project_id,
        CASE WHEN NEW.status = 'approved' THEN 'inspection_approved' ELSE 'inspection_rejected' END,
        'inspection', NEW.id,
        CASE WHEN NEW.status = 'approved' THEN 'تم قبول الفحص' ELSE 'تم رفض الفحص' END,
        'تم البت في طلب الفحص رقم ' || NEW.request_no || ' بالحالة: ' || NEW.status,
        '/planning/site-tasks',
        jsonb_build_object('inspection_id', NEW.id, 'status', NEW.status)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

DROP TRIGGER IF EXISTS trg_inspection_notify ON public.pm_inspection_requests;
CREATE TRIGGER trg_inspection_notify
  AFTER INSERT OR UPDATE OF status ON public.pm_inspection_requests
  FOR EACH ROW EXECUTE FUNCTION public.fn_trg_inspection_notify();

COMMIT;
