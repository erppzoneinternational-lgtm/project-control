-- ============================================================
-- 032_deliverable_consultant_auto_unblock.sql
-- Area: Consultant Review Automations (WS-2 & WS-6)
-- Entities: fn_deliverable_consultant_review_automations,
--           fn_deliverable_cascade_package_unblock, triggers
-- ============================================================

BEGIN;

-- 1. Function: Auto-Unblock on Code A/B, Revision Bump on Code C
CREATE OR REPLACE FUNCTION public.fn_deliverable_consultant_review_automations()
RETURNS TRIGGER AS $$
DECLARE
  v_parent_id UUID := NEW.deliverable_id;
BEGIN
  -- Handle Consultant Status Change
  IF NEW.consultant_status IS DISTINCT FROM OLD.consultant_status AND NEW.consultant_status IS NOT NULL THEN

    -- ── CODE A or CODE B: Auto-Unblock & Complete ──
    IF NEW.consultant_status IN ('A', 'B') THEN
      IF NEW.status = 'blocked' THEN
        NEW.status := 'approved';
        NEW.blocked_reason := NULL;
        NEW.blocked_since := NULL;
      ELSIF NEW.status IN ('pending', 'in_progress', 'ready_to_return', 'resubmitted') THEN
        NEW.status := 'approved';
      END IF;

      NEW.progress_pct := 100.00;
      NEW.completed_at := COALESCE(NEW.completed_at, now());

      -- Log event
      INSERT INTO public.pm_deliverable_events (
        deliverable_id, deliverable_item_id, event_type,
        from_value, to_value, reason
      ) VALUES (
        v_parent_id, NEW.id, 'unblock',
        OLD.consultant_status, NEW.consultant_status,
        'Consultant Code ' || NEW.consultant_status || ' approval — auto-unblocked and completed'
      );

    -- ── CODE C: Revision Auto-Increment & Reset to In-Progress ──
    ELSIF NEW.consultant_status = 'C' THEN
      NEW.submission_revision := COALESCE(OLD.submission_revision, 1) + 1;
      NEW.status := 'in_progress';
      NEW.to_manager_approved := false;
      NEW.to_manager_approved_at := NULL;
      NEW.to_manager_approved_by := NULL;
      NEW.completed_at := NULL;

      -- Log event
      INSERT INTO public.pm_deliverable_events (
        deliverable_id, deliverable_item_id, event_type,
        from_value, to_value, reason
      ) VALUES (
        v_parent_id, NEW.id, 'revision_bump',
        COALESCE(OLD.submission_revision, 1)::text,
        NEW.submission_revision::text,
        'Consultant Code C rejected — revision bumped to Rev ' || NEW.submission_revision || ' for rework'
      );

    -- ── CODE D: Rejected ──
    ELSIF NEW.consultant_status = 'D' THEN
      NEW.status := 'rejected';

      INSERT INTO public.pm_deliverable_events (
        deliverable_id, deliverable_item_id, event_type,
        from_value, to_value, reason
      ) VALUES (
        v_parent_id, NEW.id, 'status_change',
        OLD.status, 'rejected',
        'Consultant Code D final rejection'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

DROP TRIGGER IF EXISTS trg_deliverable_consultant_review ON public.pm_deliverable_items;
CREATE TRIGGER trg_deliverable_consultant_review
  BEFORE UPDATE OF consultant_status ON public.pm_deliverable_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_deliverable_consultant_review_automations();

-- 2. After Trigger: Cascade Unblock to Deliverable Package Header
CREATE OR REPLACE FUNCTION public.fn_deliverable_cascade_package_unblock()
RETURNS TRIGGER AS $$
DECLARE
  v_has_blocked BOOLEAN := false;
BEGIN
  -- If this item was unblocked / approved, check if parent deliverable can be unblocked
  IF NEW.status IN ('approved', 'ready_to_return') AND OLD.status = 'blocked' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.pm_deliverable_items
      WHERE deliverable_id = NEW.deliverable_id
        AND status = 'blocked'
        AND id <> NEW.id
    ) INTO v_has_blocked;

    IF NOT v_has_blocked THEN
      UPDATE public.pm_deliverables
      SET
        status = 'ready_to_return',
        blocked_reason = NULL,
        blocked_since = NULL,
        updated_at = now()
      WHERE id = NEW.deliverable_id AND status = 'blocked';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

DROP TRIGGER IF EXISTS trg_deliverable_cascade_unblock ON public.pm_deliverable_items;
CREATE TRIGGER trg_deliverable_cascade_unblock
  AFTER UPDATE OF status, consultant_status ON public.pm_deliverable_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_deliverable_cascade_package_unblock();

COMMIT;
