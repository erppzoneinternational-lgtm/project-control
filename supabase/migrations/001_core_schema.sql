-- ============================================================================
-- Migration 001: Core Schema (Foundation)
-- Pzone International ERP — New Supabase Account
-- Date: 2026-08-24
-- ROLLBACK: Drop all tables/types in reverse order (see bottom of file)
-- ============================================================================

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

CREATE TYPE public.user_role AS ENUM (
  'admin',
  'ceo',
  'coo',
  'coo_assistant',
  'chairman',
  'board_member',
  'commercial_manager',
  'project_manager',
  'planning_manager',
  'planning_engineer',
  'site_engineer',
  'cost_control',
  'estimator',
  'contract_admin',
  'technical_office',
  'finance',
  'ipc_clerk',
  'procurement',
  'inventory'
);

CREATE TYPE public.project_status AS ENUM (
  'tender',
  'study',
  'awarded',
  'setup',
  'working',
  'on_hold',
  'handing_over',
  'finished',
  'closed',
  'cancelled'
);

CREATE TYPE public.daily_report_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected'
);

CREATE TYPE public.boq_item_type AS ENUM (
  'measurable',
  'lump_sum'
);

CREATE TYPE public.scope_type AS ENUM (
  'original',
  'vo'
);

CREATE TYPE public.access_level AS ENUM (
  'view',
  'operate',
  'manage'
);

-- ============================================================================
-- 2. PROFILES (extends auth.users)
-- ============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name_ar TEXT NOT NULL,
  full_name_en TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  roles public.user_role[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'User profiles extending auth.users with role assignments';

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name_ar, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name_ar', NEW.email),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 3. CLIENTS
-- ============================================================================

CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  type TEXT CHECK (type IN ('developer', 'main_contractor', 'owner', 'other')),
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.clients IS 'Client registry — developers, contractors, owners';

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 4. STAKEHOLDERS
-- ============================================================================

CREATE TABLE public.stakeholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  role TEXT,
  organization TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.stakeholders IS 'Stakeholder directory';

CREATE TRIGGER stakeholders_updated_at
  BEFORE UPDATE ON public.stakeholders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 5. PROJECTS
-- ============================================================================

CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  code TEXT UNIQUE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  status public.project_status NOT NULL DEFAULT 'tender',
  planned_start DATE,
  planned_finish DATE,
  actual_start DATE,
  actual_finish DATE,
  location TEXT,
  description TEXT,
  contract_type TEXT,
  contract_value NUMERIC(15,2),
  -- on_hold fields
  suspension_reason TEXT,
  suspended_at TIMESTAMPTZ,
  suspended_by UUID REFERENCES auth.users(id),
  resumed_at TIMESTAMPTZ,
  resumed_by UUID REFERENCES auth.users(id),
  -- cancelled fields
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users(id),
  -- metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.projects IS 'Project registry — geographic sites';

-- Enforce suspension_reason when on_hold
CREATE OR REPLACE FUNCTION public.enforce_project_status_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- on_hold requires suspension_reason
  IF NEW.status = 'on_hold' AND (NEW.suspension_reason IS NULL OR TRIM(NEW.suspension_reason) = '') THEN
    RAISE EXCEPTION 'suspension_reason is required when status is on_hold';
  END IF;
  -- on_hold: auto-set suspended_at
  IF NEW.status = 'on_hold' AND (OLD IS NULL OR OLD.status != 'on_hold') THEN
    NEW.suspended_at = NOW();
  END IF;
  -- cancelled requires cancellation_reason
  IF NEW.status = 'cancelled' AND (NEW.cancellation_reason IS NULL OR TRIM(NEW.cancellation_reason) = '') THEN
    RAISE EXCEPTION 'cancellation_reason is required when status is cancelled';
  END IF;
  -- cancelled: auto-set cancelled_at
  IF NEW.status = 'cancelled' AND (OLD IS NULL OR OLD.status != 'cancelled') THEN
    NEW.cancelled_at = NOW();
  END IF;
  -- resumed: clear suspension fields when leaving on_hold
  IF OLD IS NOT NULL AND OLD.status = 'on_hold' AND NEW.status != 'on_hold' THEN
    NEW.resumed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_status_rules
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_project_status_rules();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 6. PROJECT USER ACCESS (assignment-based)
-- ============================================================================

CREATE TABLE public.pm_user_project_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  access_level public.access_level NOT NULL DEFAULT 'view',
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

COMMENT ON TABLE public.pm_user_project_access IS 'Per-project user assignments with access level';

-- ============================================================================
-- 7. PRICE VIEW GRANTS (planning_manager → planning_engineer delegation)
-- ============================================================================

CREATE TABLE public.pm_price_view_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  granted_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  UNIQUE(granted_to, project_id)
);

COMMENT ON TABLE public.pm_price_view_grants IS 'Delegated price visibility: planning_manager grants planning_engineer view access';

-- ============================================================================
-- 8. AUDIT LOG (sacred write-only)
-- ============================================================================

CREATE TABLE public.pm_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'STATUS_CHANGE')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  context TEXT -- free-text: 'migration', 'status_change', etc.
);

COMMENT ON TABLE public.pm_audit_logs IS 'Append-only audit log — R4 compliance. No UPDATE or DELETE ever.';

-- Audit trigger for project status changes
CREATE OR REPLACE FUNCTION public.audit_project_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.pm_audit_logs (table_name, record_id, action, old_data, new_data, changed_by)
    VALUES (
      'projects',
      NEW.id,
      'STATUS_CHANGE',
      jsonb_build_object('status', OLD.status),
      jsonb_build_object(
        'status', NEW.status,
        'suspension_reason', NEW.suspension_reason,
        'cancellation_reason', NEW.cancellation_reason
      ),
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER projects_audit_status
  AFTER UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_project_status_change();

-- ============================================================================
-- 9. fn_user_can_access_project (FIXED: NULL → FALSE)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_user_can_access_project(
  p_user_id UUID,
  p_project_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_roles public.user_role[];
BEGIN
  -- NULL inputs → FALSE (fixes old bug where NULL → TRUE)
  IF p_user_id IS NULL OR p_project_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get user roles
  SELECT roles INTO v_roles
  FROM public.profiles
  WHERE id = p_user_id;

  -- Global roles: see all projects
  IF v_roles && ARRAY[
    'admin', 'ceo', 'coo', 'coo_assistant', 'chairman',
    'board_member', 'commercial_manager'
  ]::public.user_role[] THEN
    RETURN TRUE;
  END IF;

  -- Check project assignment
  RETURN EXISTS (
    SELECT 1
    FROM public.pm_user_project_access
    WHERE user_id = p_user_id
      AND project_id = p_project_id
  );
END;
$$;

COMMENT ON FUNCTION public.fn_user_can_access_project IS 'Project-scoped access check. NULL inputs return FALSE. Global roles bypass assignment check.';

-- ============================================================================
-- 10. HELPER: fn_user_has_role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_user_has_role(
  p_user_id UUID,
  p_required_roles public.user_role[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_roles public.user_role[];
BEGIN
  IF p_user_id IS NULL THEN RETURN FALSE; END IF;

  SELECT roles INTO v_roles
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN v_roles && p_required_roles;
END;
$$;

COMMENT ON FUNCTION public.fn_user_has_role IS 'Check if user has any of the specified roles';

-- ============================================================================
-- 11. HELPER: fn_user_can_see_prices
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_user_can_see_prices(
  p_user_id UUID,
  p_project_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_roles public.user_role[];
BEGIN
  IF p_user_id IS NULL THEN RETURN FALSE; END IF;

  SELECT roles INTO v_roles
  FROM public.profiles
  WHERE id = p_user_id;

  -- site_engineer NEVER sees prices
  IF v_roles && ARRAY['site_engineer']::public.user_role[]
     AND NOT (v_roles && ARRAY['admin', 'commercial_manager', 'cost_control', 'estimator',
                                'project_manager', 'ceo', 'coo', 'chairman',
                                'planning_manager']::public.user_role[])
  THEN
    RETURN FALSE;
  END IF;

  -- Financial roles always see prices
  IF v_roles && ARRAY[
    'admin', 'commercial_manager', 'cost_control', 'estimator',
    'project_manager', 'ceo', 'coo', 'chairman', 'planning_manager'
  ]::public.user_role[] THEN
    RETURN TRUE;
  END IF;

  -- planning_engineer: check delegation
  IF v_roles && ARRAY['planning_engineer']::public.user_role[] THEN
    RETURN EXISTS (
      SELECT 1
      FROM public.pm_price_view_grants
      WHERE granted_to = p_user_id
        AND project_id = p_project_id
        AND revoked_at IS NULL
    );
  END IF;

  -- Default: no prices
  RETURN FALSE;
END;
$$;

COMMENT ON FUNCTION public.fn_user_can_see_prices IS 'Price visibility gate. Enforced at RPC level. planning_engineer sees prices only if planning_manager delegates.';

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- DROP TRIGGER IF EXISTS projects_audit_status ON public.projects;
-- DROP TRIGGER IF EXISTS projects_status_rules ON public.projects;
-- DROP TRIGGER IF EXISTS projects_updated_at ON public.projects;
-- DROP TRIGGER IF EXISTS stakeholders_updated_at ON public.stakeholders;
-- DROP TRIGGER IF EXISTS clients_updated_at ON public.clients;
-- DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.fn_user_can_see_prices;
-- DROP FUNCTION IF EXISTS public.fn_user_has_role;
-- DROP FUNCTION IF EXISTS public.fn_user_can_access_project;
-- DROP FUNCTION IF EXISTS public.audit_project_status_change;
-- DROP FUNCTION IF EXISTS public.enforce_project_status_rules;
-- DROP FUNCTION IF EXISTS public.update_updated_at;
-- DROP FUNCTION IF EXISTS public.handle_new_user;
-- DROP TABLE IF EXISTS public.pm_audit_logs;
-- DROP TABLE IF EXISTS public.pm_price_view_grants;
-- DROP TABLE IF EXISTS public.pm_user_project_access;
-- DROP TABLE IF EXISTS public.projects;
-- DROP TABLE IF EXISTS public.stakeholders;
-- DROP TABLE IF EXISTS public.clients;
-- DROP TABLE IF EXISTS public.profiles;
-- DROP TYPE IF EXISTS public.access_level;
-- DROP TYPE IF EXISTS public.scope_type;
-- DROP TYPE IF EXISTS public.boq_item_type;
-- DROP TYPE IF EXISTS public.daily_report_status;
-- DROP TYPE IF EXISTS public.project_status;
-- DROP TYPE IF EXISTS public.user_role;
