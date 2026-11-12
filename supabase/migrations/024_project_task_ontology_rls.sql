-- ============================================================
-- 024_project_task_ontology_rls.sql — RLS lockdown for Task Ontology tables
-- FIXED VERSION: no DO $$ block — CREATE POLICY is DDL, can't use PL/pgSQL vars.
-- All role arrays are inlined as ARRAY[...]::public.user_role[] literals.
-- ============================================================

BEGIN;

-- ── 1. Enable RLS on all 8 task-ontology tables ──────────────────
ALTER TABLE public.pm_component_instances     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_work_packages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_work_package_boq_scope  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_task_assignments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_task_constraints         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_task_events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_inspection_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_notifications            ENABLE ROW LEVEL SECURITY;

-- ── 2. Revoke anon + PUBLIC (the real vector — see 013) ───────────
REVOKE ALL ON public.pm_component_instances    FROM anon, PUBLIC;
REVOKE ALL ON public.pm_work_packages          FROM anon, PUBLIC;
REVOKE ALL ON public.pm_work_package_boq_scope FROM anon, PUBLIC;
REVOKE ALL ON public.pm_task_assignments        FROM anon, PUBLIC;
REVOKE ALL ON public.pm_task_constraints        FROM anon, PUBLIC;
REVOKE ALL ON public.pm_task_events             FROM anon, PUBLIC;
REVOKE ALL ON public.pm_inspection_requests     FROM anon, PUBLIC;
REVOKE ALL ON public.pm_notifications           FROM anon, PUBLIC;

-- ── 3. Grant to authenticated + service_role ─────────────────────
GRANT ALL ON public.pm_component_instances    TO authenticated, service_role;
GRANT ALL ON public.pm_work_packages          TO authenticated, service_role;
GRANT ALL ON public.pm_work_package_boq_scope TO authenticated, service_role;
GRANT ALL ON public.pm_task_assignments        TO authenticated, service_role;
GRANT ALL ON public.pm_task_constraints        TO authenticated, service_role;
GRANT ALL ON public.pm_task_events             TO authenticated, service_role;
GRANT ALL ON public.pm_inspection_requests     TO authenticated, service_role;
GRANT ALL ON public.pm_notifications           TO authenticated, service_role;

-- ── 4. Policies ────────────────────────────────────────────────────

-- 4.1 pm_component_instances (project_id)
DROP POLICY IF EXISTS comp_inst_select ON public.pm_component_instances;
DROP POLICY IF EXISTS comp_inst_write  ON public.pm_component_instances;
CREATE POLICY comp_inst_select ON public.pm_component_instances
  FOR SELECT TO authenticated
  USING (public.fn_user_can_access_project(auth.uid(), project_id));
CREATE POLICY comp_inst_write ON public.pm_component_instances
  FOR ALL TO authenticated
  -- PRD persona: planning engineer creates work packages/tasks → allowed here
  USING (public.fn_user_can_access_project(auth.uid(), project_id)
         AND public.fn_user_has_role(auth.uid(), ARRAY['admin','planning_manager','planning_engineer','project_manager']::public.user_role[]))
  WITH CHECK (public.fn_user_can_access_project(auth.uid(), project_id)
              AND public.fn_user_has_role(auth.uid(), ARRAY['admin','planning_manager','planning_engineer','project_manager']::public.user_role[]));

-- 4.2 pm_work_packages (project_id)
DROP POLICY IF EXISTS work_pkg_select ON public.pm_work_packages;
DROP POLICY IF EXISTS work_pkg_write  ON public.pm_work_packages;
CREATE POLICY work_pkg_select ON public.pm_work_packages
  FOR SELECT TO authenticated
  USING (public.fn_user_can_access_project(auth.uid(), project_id));
CREATE POLICY work_pkg_write ON public.pm_work_packages
  FOR ALL TO authenticated
  USING (public.fn_user_can_access_project(auth.uid(), project_id)
         AND public.fn_user_has_role(auth.uid(), ARRAY['admin','planning_manager','planning_engineer','project_manager']::public.user_role[]))
  WITH CHECK (public.fn_user_can_access_project(auth.uid(), project_id)
              AND public.fn_user_has_role(auth.uid(), ARRAY['admin','planning_manager','planning_engineer','project_manager']::public.user_role[]));

-- 4.3 pm_work_package_boq_scope (work_package_id -> pm_work_packages.project_id)
DROP POLICY IF EXISTS wp_boq_select ON public.pm_work_package_boq_scope;
DROP POLICY IF EXISTS wp_boq_write  ON public.pm_work_package_boq_scope;
CREATE POLICY wp_boq_select ON public.pm_work_package_boq_scope
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pm_work_packages wp
    WHERE wp.id = work_package_id
      AND public.fn_user_can_access_project(auth.uid(), wp.project_id)
  ));
CREATE POLICY wp_boq_write ON public.pm_work_package_boq_scope
  FOR ALL TO authenticated
  USING (public.fn_user_has_role(auth.uid(), ARRAY['admin','planning_manager','planning_engineer','project_manager']::public.user_role[])
         AND EXISTS (
           SELECT 1 FROM public.pm_work_packages wp
           WHERE wp.id = work_package_id
             AND public.fn_user_can_access_project(auth.uid(), wp.project_id)
         ))
  WITH CHECK (public.fn_user_has_role(auth.uid(), ARRAY['admin','planning_manager','planning_engineer','project_manager']::public.user_role[])
              AND EXISTS (
                SELECT 1 FROM public.pm_work_packages wp
                WHERE wp.id = work_package_id
                  AND public.fn_user_can_access_project(auth.uid(), wp.project_id)
              ));

-- 4.4 pm_task_assignments (task_id -> pm_site_tasks.project_id)
DROP POLICY IF EXISTS task_assign_select ON public.pm_task_assignments;
DROP POLICY IF EXISTS task_assign_write  ON public.pm_task_assignments;
CREATE POLICY task_assign_select ON public.pm_task_assignments
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.pm_site_tasks st
    WHERE st.id = task_id
      AND public.fn_user_can_access_project(auth.uid(), st.project_id)
  ));
CREATE POLICY task_assign_write ON public.pm_task_assignments
  FOR ALL TO authenticated
  USING (public.fn_user_has_role(auth.uid(), ARRAY['admin','planning_manager','planning_engineer','project_manager']::public.user_role[])
         AND EXISTS (
           SELECT 1 FROM public.pm_site_tasks st
           WHERE st.id = task_id
             AND public.fn_user_can_access_project(auth.uid(), st.project_id)
         ))
  WITH CHECK (public.fn_user_has_role(auth.uid(), ARRAY['admin','planning_manager','planning_engineer','project_manager']::public.user_role[])
              AND EXISTS (
                SELECT 1 FROM public.pm_site_tasks st
                WHERE st.id = task_id
                  AND public.fn_user_can_access_project(auth.uid(), st.project_id)
              ));

-- 4.5 pm_task_constraints (project_id) — anyone on the project can log/resolve
DROP POLICY IF EXISTS task_constraint_select ON public.pm_task_constraints;
DROP POLICY IF EXISTS task_constraint_write  ON public.pm_task_constraints;
CREATE POLICY task_constraint_select ON public.pm_task_constraints
  FOR SELECT TO authenticated
  USING (public.fn_user_can_access_project(auth.uid(), project_id));
CREATE POLICY task_constraint_write ON public.pm_task_constraints
  FOR ALL TO authenticated
  USING (public.fn_user_can_access_project(auth.uid(), project_id))
  WITH CHECK (public.fn_user_can_access_project(auth.uid(), project_id));

-- 4.6 pm_task_events (project_id) — append-only audit trail (INSERT only, no UPDATE/DELETE)
DROP POLICY IF EXISTS task_events_select ON public.pm_task_events;
DROP POLICY IF EXISTS task_events_insert ON public.pm_task_events;
CREATE POLICY task_events_select ON public.pm_task_events
  FOR SELECT TO authenticated
  USING (public.fn_user_can_access_project(auth.uid(), project_id));
CREATE POLICY task_events_insert ON public.pm_task_events
  FOR INSERT TO authenticated
  WITH CHECK (public.fn_user_can_access_project(auth.uid(), project_id));
-- No UPDATE / DELETE policies: events are immutable per PRD.

-- 4.7 pm_inspection_requests (project_id) — site engineer creates, QC/PM decide
DROP POLICY IF EXISTS insp_req_select ON public.pm_inspection_requests;
DROP POLICY IF EXISTS insp_req_write  ON public.pm_inspection_requests;
CREATE POLICY insp_req_select ON public.pm_inspection_requests
  FOR SELECT TO authenticated
  USING (public.fn_user_can_access_project(auth.uid(), project_id));
CREATE POLICY insp_req_write ON public.pm_inspection_requests
  FOR ALL TO authenticated
  USING (public.fn_user_can_access_project(auth.uid(), project_id))
  WITH CHECK (public.fn_user_can_access_project(auth.uid(), project_id));

-- 4.8 pm_notifications (recipient_user_id) — private, recipient-only
DROP POLICY IF EXISTS notif_select    ON public.pm_notifications;
DROP POLICY IF EXISTS notif_insert    ON public.pm_notifications;
DROP POLICY IF EXISTS notif_mark_read ON public.pm_notifications;
CREATE POLICY notif_select ON public.pm_notifications
  FOR SELECT TO authenticated
  USING (recipient_user_id = auth.uid());
CREATE POLICY notif_insert ON public.pm_notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);
CREATE POLICY notif_mark_read ON public.pm_notifications
  FOR UPDATE TO authenticated
  USING (recipient_user_id = auth.uid())
  WITH CHECK (recipient_user_id = auth.uid());

COMMIT;

-- ============================================================
-- ROLLBACK (emergency — restores pre-lockdown exposure)
-- ============================================================
-- BEGIN;
-- ALTER TABLE public.pm_component_instances     DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pm_work_packages           DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pm_work_package_boq_scope  DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pm_task_assignments         DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pm_task_constraints         DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pm_task_events              DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pm_inspection_requests      DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pm_notifications            DISABLE ROW LEVEL SECURITY;
-- COMMIT;
