-- ============================================================
-- 047_boq_price_gate_rls.sql
-- M2 - BOQ Price Gate RLS (V7)
-- Replaces the blanket open SELECT policy on pm_boq_items
-- with a project-membership-scoped SELECT policy.
-- App-layer price masking in boq.service.ts remains unchanged.
-- Idempotent: DROP POLICY IF EXISTS before every CREATE POLICY.
-- ============================================================

-- Drop the blanket open SELECT policy (created by 012_planning_module DO loop)
DROP POLICY IF EXISTS "auth_select_pm_boq_items" ON public.pm_boq_items;

-- Drop any legacy select policies that may exist
DROP POLICY IF EXISTS "boq_items_select" ON public.pm_boq_items;

-- Create unified project-membership SELECT policy.
-- All roles that have access to the project can SELECT rows;
-- price columns (rate_egp, amount_egp, etc.) are masked at
-- the application layer (boq.service.ts getBoqItems).
CREATE POLICY "boq_select_members" ON public.pm_boq_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pm_user_project_access upa
      WHERE upa.project_id = pm_boq_items.project_id
        AND upa.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager','project_manager',
                        'cost_control','estimator','planning_engineer','planning_manager',
                        'site_engineer','qc_engineer','technical_office','contract_admin')
    )
  );

-- Service role bypass
DROP POLICY IF EXISTS "service_role_pm_boq_items" ON public.pm_boq_items;
CREATE POLICY "service_role_pm_boq_items" ON public.pm_boq_items
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- NOTE: INSERT/UPDATE/DELETE policies ("boq_items_modify", "auth_update_pm_boq_items",
-- "auth_insert_pm_boq_items", "service_role_pm_boq_items") are NOT touched.
-- Only the SELECT policy is replaced.
