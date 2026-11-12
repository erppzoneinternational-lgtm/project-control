-- ============================================================
-- 049_wbs_enhancement.sql
-- Phase M1: WBS Hierarchy & EVM Integration Schema
-- Enhances pm_wbs_items with parent-child hierarchy and EVM metric tracking
-- Adds foreign keys linking activities and BOQ items to WBS items
-- ============================================================

BEGIN;

-- 1. Add hierarchy and EVM columns to pm_wbs_items
ALTER TABLE public.pm_wbs_items
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.pm_wbs_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS title_en text,
  ADD COLUMN IF NOT EXISTS budgeted_cost numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS actual_cost numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS earned_value numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Add foreign keys safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_activities_wbs_item'
  ) THEN
    ALTER TABLE public.pm_project_activities
      ADD CONSTRAINT fk_activities_wbs_item
      FOREIGN KEY (wbs_item_id) REFERENCES public.pm_wbs_items(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_boq_wbs_item'
  ) THEN
    ALTER TABLE public.pm_boq_items
      ADD CONSTRAINT fk_boq_wbs_item
      FOREIGN KEY (wbs_item_id) REFERENCES public.pm_wbs_items(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wbs_items_parent ON public.pm_wbs_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_wbs_items_project ON public.pm_wbs_items(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_wbs_item ON public.pm_project_activities(wbs_item_id);
CREATE INDEX IF NOT EXISTS idx_boq_items_wbs_item ON public.pm_boq_items(wbs_item_id);

COMMIT;

NOTIFY pgrst, 'reload schema';
