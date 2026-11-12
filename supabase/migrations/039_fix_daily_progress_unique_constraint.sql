BEGIN;
ALTER TABLE public.pm_daily_progress 
  DROP CONSTRAINT IF EXISTS pm_daily_progress_project_id_progress_date_discipline_key;
COMMIT;
