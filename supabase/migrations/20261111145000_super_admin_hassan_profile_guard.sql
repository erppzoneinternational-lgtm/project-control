-- ============================================================================
-- Migration: 20261111145000_super_admin_hassan_profile_guard.sql
-- Purpose:
--   1. Provide canonical `public.fn_is_admin(uuid)` helper aligned with RBAC RLS.
--   2. Harden `public.handle_new_user()` so primary Super Admin accounts
--      (`hassansolimanofficial@gmail.com`, `solimane@pzoneinternational.com`)
--      auto-provision with `roles = ARRAY['admin']`, `status = 'active'`,
--      `is_active = true`, `price_access_granted = true`, `portal_scope = 'internal'`,
--      `project_scope_mode = 'all'`, and ensure conflict updates never downgrade
--      an active profile back to `pending_activation`.
--   3. Idempotently upgrade `public.profiles` for `hassansolimanofficial@gmail.com`
--      to full unrestricted Super Admin access.
-- ============================================================================

-- 1. Canonical `public.fn_is_admin(uuid)` helper
CREATE OR REPLACE FUNCTION public.fn_is_admin(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN public.fn_is_system_or_service_role();
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = p_user_id
      AND p.is_active = true
      AND COALESCE(p.status, 'active') = 'active'
      AND 'admin'::public.user_role = ANY(p.roles)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_is_admin(uuid) TO authenticated, service_role, postgres, supabase_auth_admin;

-- 2. Harden `public.handle_new_user()` trigger function for primary Super Admins & conflict safety
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email_norm text;
  v_is_super_admin boolean := false;
  v_full_name text;
  v_full_name_ar text;
  v_full_name_en text;
  v_stakeholder_name text;
  v_avatar_url text;
  v_stakeholder_id uuid;
  v_phone text;
BEGIN
  v_email_norm := lower(trim(COALESCE(NEW.email, '')));
  v_is_super_admin := v_email_norm IN (
    'hassansolimanofficial@gmail.com',
    'solimane@pzoneinternational.com'
  );

  v_full_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    CASE WHEN v_is_super_admin THEN 'Eng. Hassan Soliman' ELSE NULL END,
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    'مستخدم جديد'
  );

  v_avatar_url := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'avatar_url'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'picture'), '')
  );

  -- Check if email matches an existing stakeholder record
  IF NEW.email IS NOT NULL THEN
    SELECT s.id, s.phone, NULLIF(trim(s.name_ar), '')
    INTO v_stakeholder_id, v_phone, v_stakeholder_name
    FROM public.stakeholders s
    WHERE lower(trim(s.email)) = v_email_norm
    LIMIT 1;

    IF v_stakeholder_name IS NOT NULL AND NOT v_is_super_admin THEN
      v_full_name := v_stakeholder_name;
    END IF;

    IF v_stakeholder_id IS NOT NULL THEN
      UPDATE public.stakeholders
      SET auth_user_id = NEW.id
      WHERE id = v_stakeholder_id
        AND (auth_user_id IS NULL OR auth_user_id = NEW.id);
    END IF;
  END IF;

  v_full_name_ar := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name_ar'), ''),
    v_stakeholder_name,
    CASE WHEN v_is_super_admin THEN 'م/ حسن سليمان' ELSE v_full_name END
  );

  v_full_name_en := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name_en'), ''),
    CASE WHEN v_is_super_admin THEN 'Eng. Hassan Soliman' ELSE NULL END
  );

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    full_name_ar,
    full_name_en,
    department,
    avatar_url,
    phone,
    stakeholder_id,
    is_active,
    status,
    roles,
    price_access_granted,
    portal_scope,
    project_scope_mode,
    activated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    v_full_name,
    v_full_name_ar,
    v_full_name_en,
    CASE
      WHEN v_is_super_admin THEN COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'department'), ''), 'Management')
      ELSE NULLIF(trim(NEW.raw_user_meta_data->>'department'), '')
    END,
    v_avatar_url,
    COALESCE(NEW.raw_user_meta_data->>'phone', v_phone),
    v_stakeholder_id,
    CASE WHEN v_is_super_admin THEN true ELSE false END,
    CASE WHEN v_is_super_admin THEN 'active' ELSE 'pending_activation' END,
    CASE WHEN v_is_super_admin THEN ARRAY['admin']::public.user_role[] ELSE ARRAY[]::public.user_role[] END,
    CASE WHEN v_is_super_admin THEN true ELSE false END,
    'internal',
    'all',
    CASE WHEN v_is_super_admin THEN now() ELSE NULL END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
    full_name_ar = COALESCE(NULLIF(public.profiles.full_name_ar, ''), EXCLUDED.full_name_ar),
    full_name_en = COALESCE(NULLIF(public.profiles.full_name_en, ''), EXCLUDED.full_name_en),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url),
    stakeholder_id = COALESCE(public.profiles.stakeholder_id, EXCLUDED.stakeholder_id),
    is_active = CASE
      WHEN v_is_super_admin THEN true
      ELSE COALESCE(public.profiles.is_active, false)
    END,
    status = CASE
      WHEN v_is_super_admin THEN 'active'
      WHEN public.profiles.status = 'active' THEN 'active'
      ELSE COALESCE(public.profiles.status, EXCLUDED.status)
    END,
    roles = CASE
      WHEN v_is_super_admin AND NOT ('admin'::public.user_role = ANY(COALESCE(public.profiles.roles, ARRAY[]::public.user_role[])))
        THEN array_prepend('admin'::public.user_role, COALESCE(public.profiles.roles, ARRAY[]::public.user_role[]))
      ELSE COALESCE(public.profiles.roles, EXCLUDED.roles)
    END,
    price_access_granted = CASE
      WHEN v_is_super_admin THEN true
      ELSE COALESCE(public.profiles.price_access_granted, false)
    END,
    portal_scope = CASE
      WHEN v_is_super_admin THEN 'internal'
      ELSE COALESCE(public.profiles.portal_scope, 'internal')
    END,
    project_scope_mode = CASE
      WHEN v_is_super_admin THEN 'all'
      ELSE COALESCE(public.profiles.project_scope_mode, 'all')
    END,
    activated_at = CASE
      WHEN v_is_super_admin THEN COALESCE(public.profiles.activated_at, now())
      ELSE public.profiles.activated_at
    END,
    updated_at = now();

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role, supabase_auth_admin;

-- 3. Idempotent Super Admin profile upgrade for hassansolimanofficial@gmail.com
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  full_name_ar,
  full_name_en,
  department,
  job_title,
  roles,
  status,
  is_active,
  price_access_granted,
  portal_scope,
  project_scope_mode,
  activated_at,
  updated_at
)
SELECT
  u.id,
  'hassansolimanofficial@gmail.com',
  'Eng. Hassan Soliman',
  'م/ حسن سليمان',
  'Eng. Hassan Soliman',
  'Management',
  'Super Admin',
  ARRAY['admin']::public.user_role[],
  'active',
  true,
  true,
  'internal',
  'all',
  COALESCE(p.activated_at, now()),
  now()
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE lower(trim(u.email)) = 'hassansolimanofficial@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  email = 'hassansolimanofficial@gmail.com',
  full_name = 'Eng. Hassan Soliman',
  full_name_ar = 'م/ حسن سليمان',
  full_name_en = 'Eng. Hassan Soliman',
  department = COALESCE(NULLIF(public.profiles.department, ''), 'Management'),
  job_title = COALESCE(NULLIF(public.profiles.job_title, ''), 'Super Admin'),
  roles = CASE
    WHEN 'admin'::public.user_role = ANY(COALESCE(public.profiles.roles, ARRAY[]::public.user_role[]))
      THEN public.profiles.roles
    ELSE array_prepend('admin'::public.user_role, COALESCE(public.profiles.roles, ARRAY[]::public.user_role[]))
  END,
  status = 'active',
  is_active = true,
  price_access_granted = true,
  portal_scope = 'internal',
  project_scope_mode = 'all',
  activated_at = COALESCE(public.profiles.activated_at, now()),
  updated_at = now();

NOTIFY pgrst, 'reload schema';
