-- ============================================================
-- 036_monotonic_cumulative_guard.sql
-- Guard G6: MONOTONIC_CUMULATIVE
-- Prevents TO deliverable item progress from decreasing,
-- EXCEPT when submission_revision changes (Code C reset).
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.fn_monotonic_to_progress_guard()
RETURNS TRIGGER AS $$
BEGIN
  -- Only enforce when progress_pct is being decreased
  IF NEW.progress_pct < OLD.progress_pct THEN
    -- Exception: Code C revision bump resets progress to 0 — allow it
    IF NEW.submission_revision IS DISTINCT FROM OLD.submission_revision THEN
      RETURN NEW;
    END IF;

    -- Exception: Admin/system override via consultant_status change
    IF NEW.consultant_status IS DISTINCT FROM OLD.consultant_status THEN
      RETURN NEW;
    END IF;

    RAISE EXCEPTION 'MONOTONIC_VIOLATION: نسبة الإنجاز التراكمية لا يمكن أن تنقص (% → %)',
      OLD.progress_pct, NEW.progress_pct;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

DROP TRIGGER IF EXISTS trg_monotonic_to_progress ON public.pm_deliverable_items;
CREATE TRIGGER trg_monotonic_to_progress
  BEFORE UPDATE OF progress_pct ON public.pm_deliverable_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_monotonic_to_progress_guard();

COMMIT;
