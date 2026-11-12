-- ============================================================
-- 012_planning_module_rollback.sql — Reversible Rollback for Planning & Technical Office Module (v3.4)
-- Drops all objects created by 012_planning_module.sql in reverse dependency order.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. DROP STORAGE POLICIES & BUCKETS
-- ============================================================

DROP POLICY IF EXISTS "auth_read_project_schedules" ON storage.objects;
DROP POLICY IF EXISTS "auth_insert_project_schedules" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_deliverables" ON storage.objects;
DROP POLICY IF EXISTS "auth_insert_deliverables" ON storage.objects;
DROP POLICY IF EXISTS "auth_read_progress_photos" ON storage.objects;
DROP POLICY IF EXISTS "anon_read_progress_photos" ON storage.objects;
DROP POLICY IF EXISTS "auth_insert_progress_photos" ON storage.objects;

DELETE FROM storage.buckets WHERE id IN ('project-schedules', 'deliverables', 'progress-photos');


-- ============================================================
-- 2. DROP VIEWS (REVERSE ORDER WITH CASCADE)
-- ============================================================

DROP VIEW IF EXISTS public.v_scurve_actual CASCADE;
DROP VIEW IF EXISTS public.v_procurement_bom_status CASCADE;
DROP VIEW IF EXISTS public.v_commercial_summary CASCADE;
DROP VIEW IF EXISTS public.v_deliverables_kanban CASCADE;
DROP VIEW IF EXISTS public.v_daily_log CASCADE;
DROP VIEW IF EXISTS public.v_daily_progress_summary CASCADE;
DROP VIEW IF EXISTS public.v_activity_progress CASCADE;
DROP VIEW IF EXISTS public.v_activity_evm CASCADE;
DROP VIEW IF EXISTS public.v_boq_current CASCADE;
DROP VIEW IF EXISTS public.v_boq_with_actuals CASCADE;


-- ============================================================
-- 3. DROP TABLES (REVERSE DEPENDENCY ORDER WITH CASCADE)
-- ============================================================

DROP TABLE IF EXISTS public.pm_scurve_cache CASCADE;
DROP TABLE IF EXISTS public.pm_holds CASCADE;
DROP TABLE IF EXISTS public.pm_approval_delegations CASCADE;
DROP TABLE IF EXISTS public.pm_weekly_reports CASCADE;
DROP TABLE IF EXISTS public.pm_commercial_settings CASCADE;
DROP TABLE IF EXISTS public.pm_subcontractor_targets CASCADE;
DROP TABLE IF EXISTS public.pm_mos_entries CASCADE;
DROP TABLE IF EXISTS public.pm_material_allocations CASCADE;
DROP TABLE IF EXISTS public.pm_material_transactions CASCADE;
DROP TABLE IF EXISTS public.pm_daily_obstructions CASCADE;
DROP TABLE IF EXISTS public.pm_rfi_register CASCADE;
DROP TABLE IF EXISTS public.pm_deliverable_dependencies CASCADE;
DROP TABLE IF EXISTS public.pm_deliverable_events CASCADE;
DROP TABLE IF EXISTS public.pm_deliverable_attachments CASCADE;
DROP TABLE IF EXISTS public.pm_deliverable_items CASCADE;
DROP TABLE IF EXISTS public.pm_deliverables CASCADE;
DROP TABLE IF EXISTS public.pm_progress_allocations CASCADE;
DROP TABLE IF EXISTS public.pm_daily_equipment_logs CASCADE;
DROP TABLE IF EXISTS public.pm_daily_manpower_logs CASCADE;
DROP TABLE IF EXISTS public.pm_daily_progress_photos CASCADE;
DROP TABLE IF EXISTS public.pm_daily_progress_lines CASCADE;
DROP TABLE IF EXISTS public.pm_daily_progress CASCADE;
DROP TABLE IF EXISTS public.pm_activity_calendar_exceptions CASCADE;
DROP TABLE IF EXISTS public.pm_schedule_versions CASCADE;
DROP TABLE IF EXISTS public.pm_activity_dependencies CASCADE;
DROP TABLE IF EXISTS public.pm_activity_boq_links CASCADE;
DROP TABLE IF EXISTS public.pm_project_activities CASCADE;
DROP TABLE IF EXISTS public.pm_activity_library CASCADE;
DROP TABLE IF EXISTS public.pm_boq_milestone_steps CASCADE;
DROP TABLE IF EXISTS public.pm_boq_revisions CASCADE;
DROP TABLE IF EXISTS public.pm_boq_sub_materials CASCADE;
DROP TABLE IF EXISTS public.pm_boq_items CASCADE;
DROP TABLE IF EXISTS public.pm_cost_codes CASCADE;
DROP TABLE IF EXISTS public.pm_user_project_access CASCADE;


-- ============================================================
-- 4. DROP FUNCTIONS & RPCS (WITH CASCADE)
-- ============================================================

DROP FUNCTION IF EXISTS public.fn_milestone_sum_guard() CASCADE;
DROP FUNCTION IF EXISTS public.fn_promote_schedule_version(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.rpc_create_report(UUID, DATE, TEXT, TEXT, INT, TEXT, TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.fn_deliverable_blocker_guard() CASCADE;
DROP FUNCTION IF EXISTS public.fn_recalc_budget() CASCADE;
DROP FUNCTION IF EXISTS public.fn_recalc_activity() CASCADE;
DROP FUNCTION IF EXISTS public.fn_check_cross_project_act_boq() CASCADE;
DROP FUNCTION IF EXISTS public.fn_check_cross_project_daily_lines() CASCADE;
DROP FUNCTION IF EXISTS public.fn_audit_progress_allocations() CASCADE;
DROP FUNCTION IF EXISTS public.fn_line_approved_snapshot() CASCADE;
DROP FUNCTION IF EXISTS public.fn_check_allocation_qty() CASCADE;
DROP FUNCTION IF EXISTS public.fn_user_can_access_project(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.fn_set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.fn_archive_before_delete() CASCADE;


-- ============================================================
-- 5. DROP AUDIT LOG INDEXES & HARDENING CLEANUP
-- ============================================================

DROP INDEX IF EXISTS pm.idx_audit_logs_record;

COMMIT;
