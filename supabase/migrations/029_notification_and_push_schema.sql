-- ============================================================
-- 029_notification_and_push_schema.sql
-- Area: Notification Engine & Web Push (WS-1 & WS-8)
-- Entities: pm_push_subscriptions, pm_notifications enhancement,
--           rpc_mark_notifications_read, rpc_unread_notification_count
-- ============================================================

BEGIN;

-- 1. Web Push Subscriptions Table
CREATE TABLE IF NOT EXISTS public.pm_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_push_sub_user_endpoint UNIQUE (user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_sub_user ON public.pm_push_subscriptions(user_id);

-- 2. Enhance pm_notifications table
ALTER TABLE public.pm_notifications
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS link_url TEXT,
  ADD COLUMN IF NOT EXISTS title_en TEXT,
  ADD COLUMN IF NOT EXISTS body_en TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Relax & Expand entity_type check constraint
ALTER TABLE public.pm_notifications
  DROP CONSTRAINT IF EXISTS pm_notifications_entity_type_check;

ALTER TABLE public.pm_notifications
  ADD CONSTRAINT pm_notifications_entity_type_check
  CHECK (entity_type IN ('task', 'inspection', 'report', 'constraint', 'deliverable', 'to_progress', 'comment', 'daily_progress', 'obstruction', 'general', 'system'));

CREATE INDEX IF NOT EXISTS idx_notif_project ON public.pm_notifications(project_id);
CREATE INDEX IF NOT EXISTS idx_notif_entity ON public.pm_notifications(entity_type, entity_id);

-- 3. Notification RPC: Mark Read
CREATE OR REPLACE FUNCTION public.rpc_mark_notifications_read(
  p_notification_ids UUID[] DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_updated_count INT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: User must be authenticated';
  END IF;

  IF p_notification_ids IS NOT NULL AND array_length(p_notification_ids, 1) > 0 THEN
    UPDATE public.pm_notifications
    SET read_at = now()
    WHERE recipient_user_id = v_user_id
      AND id = ANY(p_notification_ids)
      AND read_at IS NULL;
  ELSE
    UPDATE public.pm_notifications
    SET read_at = now()
    WHERE recipient_user_id = v_user_id
      AND read_at IS NULL;
  END IF;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'updated_count', v_updated_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- 4. Notification RPC: Unread Count
CREATE OR REPLACE FUNCTION public.rpc_unread_notification_count()
RETURNS INT AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_count INT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT COUNT(*)::INT INTO v_count
  FROM public.pm_notifications
  WHERE recipient_user_id = v_user_id
    AND read_at IS NULL;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path TO 'public';

-- 5. RLS & Permissions
ALTER TABLE public.pm_push_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pm_push_subscriptions FROM anon, PUBLIC;
GRANT ALL ON public.pm_push_subscriptions TO authenticated, service_role;

DROP POLICY IF EXISTS push_sub_select ON public.pm_push_subscriptions;
DROP POLICY IF EXISTS push_sub_insert ON public.pm_push_subscriptions;
DROP POLICY IF EXISTS push_sub_update ON public.pm_push_subscriptions;
DROP POLICY IF EXISTS push_sub_delete ON public.pm_push_subscriptions;

CREATE POLICY push_sub_select ON public.pm_push_subscriptions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY push_sub_insert ON public.pm_push_subscriptions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY push_sub_update ON public.pm_push_subscriptions
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY push_sub_delete ON public.pm_push_subscriptions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

REVOKE ALL ON FUNCTION public.rpc_mark_notifications_read(UUID[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rpc_unread_notification_count() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rpc_mark_notifications_read(UUID[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_unread_notification_count() TO authenticated, service_role;

COMMIT;
