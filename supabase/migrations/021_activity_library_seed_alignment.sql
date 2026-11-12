-- 021_activity_library_seed_alignment.sql
-- Align pm_activity_library for seeding from 'New Execution Step Per Projects Components.xlsx'
-- (standard execution steps per component type: lagoon_body / pump_room / pump_room_with_tank).
-- Idempotent: safe to re-run.

ALTER TABLE public.pm_activity_library
  ADD COLUMN IF NOT EXISTS component_type text,
  ADD COLUMN IF NOT EXISTS step_no numeric,
  ADD COLUMN IF NOT EXISTS task_owner text,
  ADD COLUMN IF NOT EXISTS source_sheet text,
  ADD COLUMN IF NOT EXISTS phase_ar text,
  ADD COLUMN IF NOT EXISTS qc_note text;

CREATE INDEX IF NOT EXISTS idx_pm_activity_library_component
  ON public.pm_activity_library (component_type);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pm_activity_library_comp_code
  ON public.pm_activity_library (component_type, library_code);
