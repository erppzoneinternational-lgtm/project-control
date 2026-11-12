-- Migration 055: User Onboarding Lifecycle, Pending Status & Customization Grants
-- Ensures public.profiles and pm_user_project_access support controlled activation

-- 1. Extend public.profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending_activation',
  ADD COLUMN IF NOT EXISTS roles text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS price_access_granted boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS activated_by uuid REFERENCES public.profiles(id);

-- Constraint for status
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_status_check'
  ) THEN 
    ALTER TABLE public.profiles 
      ADD CONSTRAINT profiles_status_check 
      CHECK (status IN ('pending_activation', 'active', 'suspended', 'rejected'));
  END IF; 
END $$;

-- 2. Ensure existing profiles with roles are marked as active
UPDATE public.profiles 
SET status = 'active' 
WHERE status IS NULL OR (roles IS NOT NULL AND array_length(roles, 1) > 0 AND status = 'pending_activation');

-- 3. Ensure pm_user_project_access exists
CREATE TABLE IF NOT EXISTS public.pm_user_project_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  created_by uuid,
  UNIQUE(user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_user_project_access_user ON public.pm_user_project_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_project_access_proj ON public.pm_user_project_access(project_id);

-- 4. Enable RLS
ALTER TABLE public.pm_user_project_access ENABLE ROW LEVEL SECURITY;

-- Service role full access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_all_pm_user_project_access') THEN
    CREATE POLICY "service_role_all_pm_user_project_access" 
      ON public.pm_user_project_access 
      FOR ALL 
      TO service_role 
      USING (true) 
      WITH CHECK (true);
  END IF;
END $$;

-- Authenticated users can read their own project access or admin can read all
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_read_own_project_access') THEN
    CREATE POLICY "users_read_own_project_access" 
      ON public.pm_user_project_access 
      FOR SELECT 
      TO authenticated 
      USING (
        auth.uid() = user_id OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND (
            'admin' = ANY(roles) OR 'ceo' = ANY(roles) OR 'coo' = ANY(roles) OR 
            'chairman' = ANY(roles) OR 'commercial_manager' = ANY(roles)
          )
        )
      );
  END IF;
END $$;

-- Admins can manage project access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admins_manage_project_access') THEN
    CREATE POLICY "admins_manage_project_access" 
      ON public.pm_user_project_access 
      FOR ALL 
      TO authenticated 
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND (
            'admin' = ANY(roles) OR 'ceo' = ANY(roles) OR 'coo' = ANY(roles) OR 'chairman' = ANY(roles)
          )
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND (
            'admin' = ANY(roles) OR 'ceo' = ANY(roles) OR 'coo' = ANY(roles) OR 'chairman' = ANY(roles)
          )
        )
      );
  END IF;
END $$;
