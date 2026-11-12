-- ============================================================
-- 034_unified_obstruction_taxonomy.sql
-- Area: Unified Obstruction & Delay Taxonomy (WS-4)
-- Entities: pm_daily_obstructions scoping & EOT, 11 categories,
--           backfill legacy types, pm_task_constraints alignment
-- ============================================================

BEGIN;

-- 1. Add Scoping and EOT columns to pm_daily_obstructions
ALTER TABLE public.pm_daily_obstructions
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'task' CHECK (scope IN ('task', 'site_wide')),
  ADD COLUMN IF NOT EXISTS eot_days NUMERIC(6,2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES public.pm_site_tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deliverable_item_id UUID REFERENCES public.pm_deliverable_items(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS financial_impact_egp NUMERIC(15,2) DEFAULT 0.00;

-- 2. Update Obstruction Type Constraint to 11 Unified Taxonomy Categories
ALTER TABLE public.pm_daily_obstructions
  DROP CONSTRAINT IF EXISTS pm_daily_obstructions_obstruction_type_check;

ALTER TABLE public.pm_daily_obstructions
  ADD CONSTRAINT pm_daily_obstructions_obstruction_type_check
  CHECK (obstruction_type IN (
    'owner_directive',
    'weather',
    'material_delay',
    'drawing_delay',
    'subcontractor',
    'permit_authority',
    'equipment',
    'manpower',
    'safety',
    'access',
    'other',
    -- Legacy values allowed for safe in-place migration
    'material_approval', 'site_access', 'client_works', 'equipment_idle', 'labor_shortage'
  ));

-- 3. Backfill Legacy Obstruction Types
UPDATE public.pm_daily_obstructions SET obstruction_type = 'material_delay' WHERE obstruction_type = 'material_approval';
UPDATE public.pm_daily_obstructions SET obstruction_type = 'access' WHERE obstruction_type = 'site_access';
UPDATE public.pm_daily_obstructions SET obstruction_type = 'owner_directive' WHERE obstruction_type = 'client_works';
UPDATE public.pm_daily_obstructions SET obstruction_type = 'equipment' WHERE obstruction_type = 'equipment_idle';
UPDATE public.pm_daily_obstructions SET obstruction_type = 'manpower' WHERE obstruction_type = 'labor_shortage';

-- 4. Align pm_task_constraints Check Constraint
ALTER TABLE public.pm_task_constraints
  DROP CONSTRAINT IF EXISTS pm_task_constraints_type_check;

ALTER TABLE public.pm_task_constraints
  ADD CONSTRAINT pm_task_constraints_type_check
  CHECK (type IN (
    'owner_directive', 'weather', 'material_delay', 'drawing_delay',
    'subcontractor', 'permit_authority', 'equipment', 'manpower',
    'safety', 'access', 'other',
    -- legacy
    'material', 'drawing', 'approval'
  ));

CREATE INDEX IF NOT EXISTS idx_obstructions_task ON public.pm_daily_obstructions(task_id);
CREATE INDEX IF NOT EXISTS idx_obstructions_deliv_item ON public.pm_daily_obstructions(deliverable_item_id);
CREATE INDEX IF NOT EXISTS idx_obstructions_scope ON public.pm_daily_obstructions(scope);

COMMIT;
