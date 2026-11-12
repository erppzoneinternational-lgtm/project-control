-- ============================================================
-- 035_kpi_engine_and_reporting_views.sql
-- Area: KPI Engine & Reporting Views (WS-5 & WS-4)
-- Entities: v_to_engineer_kpi, v_cross_project_obstructions,
--           v_project_kpi_summary
-- ============================================================

BEGIN;

-- 1. View: Technical Office Engineer KPI Summary
CREATE OR REPLACE VIEW public.v_to_engineer_kpi WITH (security_invoker = true) AS
SELECT
  s.id AS stakeholder_id,
  s.name_ar AS engineer_name_ar,
  s.name_en AS engineer_name_en,
  s.email,
  COUNT(di.id)::INT AS total_assigned_items,
  COUNT(di.id) FILTER (WHERE di.status IN ('approved', 'returned', 'ready_to_return'))::INT AS completed_items,
  COUNT(di.id) FILTER (WHERE di.status = 'in_progress')::INT AS in_progress_items,
  COUNT(di.id) FILTER (WHERE di.status = 'blocked')::INT AS blocked_items,
  COUNT(di.id) FILTER (WHERE di.consultant_status IN ('A', 'B'))::INT AS code_ab_items,
  COUNT(di.id) FILTER (WHERE di.consultant_status = 'C')::INT AS code_c_items,
  COUNT(di.id) FILTER (WHERE di.consultant_status = 'D')::INT AS code_d_items,
  CASE
    WHEN COUNT(di.id) = 0 THEN 0.00
    ELSE ROUND((COUNT(di.id) FILTER (WHERE di.status IN ('approved', 'returned', 'ready_to_return'))::NUMERIC / COUNT(di.id)::NUMERIC) * 100.0, 2)
  END AS completion_rate_pct,
  CASE
    WHEN COUNT(di.id) = 0 THEN 0.00
    ELSE ROUND((COUNT(di.id) FILTER (WHERE di.consultant_status IN ('C', 'D'))::NUMERIC / COUNT(di.id)::NUMERIC) * 100.0, 2)
  END AS rejection_rate_pct,
  ROUND(AVG(
    CASE
      WHEN di.work_started_at IS NOT NULL AND di.completed_at IS NOT NULL
      THEN EXTRACT(EPOCH FROM (di.completed_at - di.work_started_at)) / 86400.0
      ELSE NULL
    END
  )::NUMERIC, 1) AS avg_duration_days
FROM public.stakeholders s
LEFT JOIN public.pm_deliverable_items di ON di.assigned_stakeholder_id = s.id
GROUP BY s.id, s.name_ar, s.name_en, s.email;

-- 2. View: Cross-Project Obstructions & Delay Register
CREATE OR REPLACE VIEW public.v_cross_project_obstructions WITH (security_invoker = true) AS
SELECT
  obs.id,
  obs.project_id,
  p.name_ar AS project_name_ar,
  p.name_en AS project_name_en,
  p.code AS project_code,
  obs.daily_progress_id,
  dp.report_no AS daily_report_no,
  dp.progress_date AS report_date,
  obs.task_id,
  st.title_ar AS task_title_ar,
  obs.deliverable_item_id,
  di.description AS deliverable_item_desc,
  obs.obstruction_type,
  obs.scope,
  obs.responsible_party,
  obs.description,
  obs.idle_manpower,
  obs.idle_equipment_summary,
  obs.eot_days,
  obs.financial_impact_egp,
  obs.started_at,
  obs.resolved_at,
  CASE WHEN obs.resolved_at IS NULL THEN 'active' ELSE 'resolved' END AS status,
  CASE
    WHEN obs.resolved_at IS NOT NULL THEN
      ROUND((EXTRACT(EPOCH FROM (obs.resolved_at - obs.started_at)) / 86400.0)::NUMERIC, 1)
    ELSE
      ROUND((EXTRACT(EPOCH FROM (now() - obs.started_at)) / 86400.0)::NUMERIC, 1)
  END AS duration_days,
  obs.created_at
FROM public.pm_daily_obstructions obs
JOIN public.projects p ON p.id = obs.project_id
LEFT JOIN public.pm_daily_progress dp ON dp.id = obs.daily_progress_id
LEFT JOIN public.pm_site_tasks st ON st.id = obs.task_id
LEFT JOIN public.pm_deliverable_items di ON di.id = obs.deliverable_item_id;

-- 3. View: Project KPI Executive Summary
CREATE OR REPLACE VIEW public.v_project_kpi_summary WITH (security_invoker = true) AS
SELECT
  p.id AS project_id,
  p.name_ar AS project_name_ar,
  p.name_en AS project_name_en,
  p.code AS project_code,
  p.status AS project_status,
  -- Tasks
  COUNT(DISTINCT st.id)::INT AS total_tasks,
  COUNT(DISTINCT st.id) FILTER (WHERE st.status IN ('approved', 'done', 'closed'))::INT AS completed_tasks,
  COUNT(DISTINCT st.id) FILTER (WHERE st.status = 'in_progress')::INT AS in_progress_tasks,
  COUNT(DISTINCT st.id) FILTER (WHERE st.status = 'pm_review')::INT AS pending_pm_review_tasks,
  COUNT(DISTINCT st.id) FILTER (WHERE st.status = 'qc_pending')::INT AS pending_qc_tasks,
  -- Daily Progress
  COUNT(DISTINCT dp.id)::INT AS total_daily_reports,
  COUNT(DISTINCT dp.id) FILTER (WHERE dp.status = 'approved')::INT AS approved_daily_reports,
  COUNT(DISTINCT dp.id) FILTER (WHERE dp.status = 'submitted')::INT AS submitted_daily_reports,
  -- Deliverables
  COUNT(DISTINCT di.id)::INT AS total_deliverable_items,
  COUNT(DISTINCT di.id) FILTER (WHERE di.to_manager_approved = true)::INT AS to_approved_items,
  COUNT(DISTINCT di.id) FILTER (WHERE di.consultant_status IN ('A', 'B'))::INT AS consultant_approved_items,
  COUNT(DISTINCT di.id) FILTER (WHERE di.consultant_status = 'C')::INT AS consultant_code_c_items,
  -- Obstructions
  COUNT(DISTINCT obs.id) FILTER (WHERE obs.resolved_at IS NULL)::INT AS active_obstructions,
  COALESCE(SUM(obs.eot_days), 0.0)::NUMERIC(8,2) AS total_eot_days
FROM public.projects p
LEFT JOIN public.pm_site_tasks st ON st.project_id = p.id
LEFT JOIN public.pm_daily_progress dp ON dp.project_id = p.id
LEFT JOIN public.pm_deliverables d ON d.project_id = p.id
LEFT JOIN public.pm_deliverable_items di ON di.deliverable_id = d.id
LEFT JOIN public.pm_daily_obstructions obs ON obs.project_id = p.id
GROUP BY p.id, p.name_ar, p.name_en, p.code, p.status;

COMMIT;
