-- 042_security_definer_search_path_hardening.sql
-- Harden 3 SECURITY DEFINER functions missing SET search_path = ''.
-- Prevents search_path hijacking privilege escalation.
-- Idempotent: CREATE OR REPLACE.

-- 1. handle_new_user (auth.users trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name_ar)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$;

-- 2. fn_check_cross_project_act_boq (activity-BOQ boundary guard)
CREATE OR REPLACE FUNCTION public.fn_check_cross_project_act_boq()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_act_pid UUID;
  v_boq_pid UUID;
BEGIN
  SELECT project_id INTO v_act_pid FROM public.pm_project_activities WHERE id = NEW.activity_id;
  SELECT project_id INTO v_boq_pid FROM public.pm_boq_items WHERE id = NEW.boq_item_id;
  IF v_act_pid IS DISTINCT FROM v_boq_pid THEN
    RAISE EXCEPTION 'خطأ ربط عبر المشاريع: مشروع النشاط (%) لا يطابق مشروع بند الكميات (%)', v_act_pid, v_boq_pid;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. fn_check_cross_project_daily_lines (daily progress-BOQ boundary guard)
CREATE OR REPLACE FUNCTION public.fn_check_cross_project_daily_lines()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_dp_pid UUID;
  v_boq_pid UUID;
BEGIN
  SELECT project_id INTO v_dp_pid FROM public.pm_daily_progress WHERE id = NEW.daily_progress_id;
  SELECT project_id INTO v_boq_pid FROM public.pm_boq_items WHERE id = NEW.boq_item_id;
  IF v_dp_pid IS DISTINCT FROM v_boq_pid THEN
    RAISE EXCEPTION 'خطأ سطر يومية عبر المشاريع: مشروع التقرير (%) لا يطابق مشروع بند الكميات (%)', v_dp_pid, v_boq_pid;
  END IF;
  RETURN NEW;
END;
$$;
