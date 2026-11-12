-- ============================================================
-- 037_approved_report_immutable_guard.sql
-- Guard G8: APPROVED_REPORT_IMMUTABLE
-- Blocks direct UPDATE on approved daily reports.
-- Only allowed transition from approved: approved → reopened
-- (via the reopen action in the service/RPC layer).
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_approved_report_immutable_guard()
RETURNS TRIGGER AS $$
BEGIN
  -- If the report is currently approved...
  IF OLD.status = 'approved' THEN
    -- Allow: approved → reopened (the only valid exit from approved)
    IF NEW.status = 'reopened' THEN
      RETURN NEW;
    END IF;

    -- Allow: updating non-content metadata (pm_reviewed_by, pm_reviewed_at, pm_skipped)
    -- These are PM soft-review fields set AFTER approval
    IF NEW.status = 'approved'
       AND NEW.project_id = OLD.project_id
       AND NEW.progress_date = OLD.progress_date
       AND NEW.site_task_id IS NOT DISTINCT FROM OLD.site_task_id
       AND NEW.weather IS NOT DISTINCT FROM OLD.weather
       AND NEW.manpower_count IS NOT DISTINCT FROM OLD.manpower_count
       AND NEW.equipment_summary IS NOT DISTINCT FROM OLD.equipment_summary
       AND NEW.report_no IS NOT DISTINCT FROM OLD.report_no
       AND NEW.entered_by IS NOT DISTINCT FROM OLD.entered_by
    THEN
      -- This is a metadata-only update (pm_reviewed_by etc.) — allow it
      RETURN NEW;
    END IF;

    -- Block everything else
    RAISE EXCEPTION 'APPROVED_REPORT_IMMUTABLE: لا يمكن تعديل تقرير معتمد — يجب رفع الاعتماد أولاً (إعادة فتح)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

DROP TRIGGER IF EXISTS trg_approved_report_immutable ON public.pm_daily_progress;
CREATE TRIGGER trg_approved_report_immutable
  BEFORE UPDATE ON public.pm_daily_progress
  FOR EACH ROW EXECUTE FUNCTION public.fn_approved_report_immutable_guard();

COMMIT;
