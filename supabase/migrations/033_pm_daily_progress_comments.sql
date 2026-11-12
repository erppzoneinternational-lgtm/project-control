-- ============================================================
-- 033_pm_daily_progress_comments.sql
-- Area: Project Manager Private Comments System (WS-3)
-- Entities: pm_daily_progress_comments, strict role-based RLS
-- ============================================================

BEGIN;

-- 1. PM Daily Progress Comments Table
CREATE TABLE IF NOT EXISTS public.pm_daily_progress_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_progress_id UUID NOT NULL REFERENCES public.pm_daily_progress(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_stakeholder_id UUID REFERENCES public.stakeholders(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_role TEXT,
  content TEXT NOT NULL,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dp_comments_report ON public.pm_daily_progress_comments(daily_progress_id);
CREATE INDEX IF NOT EXISTS idx_dp_comments_proj ON public.pm_daily_progress_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_dp_comments_user ON public.pm_daily_progress_comments(user_id);

-- 2. Strict RLS Policies (PM, Planning Manager, Exec & Admin only)
ALTER TABLE public.pm_daily_progress_comments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pm_daily_progress_comments FROM anon, PUBLIC;
GRANT ALL ON public.pm_daily_progress_comments TO authenticated, service_role;

DROP POLICY IF EXISTS dp_comments_select ON public.pm_daily_progress_comments;
DROP POLICY IF EXISTS dp_comments_insert ON public.pm_daily_progress_comments;
DROP POLICY IF EXISTS dp_comments_update ON public.pm_daily_progress_comments;
DROP POLICY IF EXISTS dp_comments_delete ON public.pm_daily_progress_comments;

CREATE POLICY dp_comments_select ON public.pm_daily_progress_comments
  FOR SELECT TO authenticated
  USING (
    public.fn_user_can_access_project(auth.uid(), project_id)
    AND (
      NOT is_private
      OR public.fn_user_has_role(auth.uid(), ARRAY[
        'admin', 'project_manager', 'planning_manager', 'ceo', 'coo', 'chairman'
      ]::public.user_role[])
    )
  );

CREATE POLICY dp_comments_insert ON public.pm_daily_progress_comments
  FOR INSERT TO authenticated
  WITH CHECK (
    public.fn_user_can_access_project(auth.uid(), project_id)
    AND (user_id = auth.uid() OR auth.uid() IS NULL)
    AND public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'project_manager', 'planning_manager', 'ceo', 'coo'
    ]::public.user_role[])
  );

CREATE POLICY dp_comments_update ON public.pm_daily_progress_comments
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND public.fn_user_has_role(auth.uid(), ARRAY['admin', 'project_manager', 'planning_manager']::public.user_role[])
  )
  WITH CHECK (
    user_id = auth.uid()
    AND public.fn_user_has_role(auth.uid(), ARRAY['admin', 'project_manager', 'planning_manager']::public.user_role[])
  );

CREATE POLICY dp_comments_delete ON public.pm_daily_progress_comments
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR public.fn_user_has_role(auth.uid(), ARRAY['admin', 'project_manager']::public.user_role[])
  );

COMMIT;
