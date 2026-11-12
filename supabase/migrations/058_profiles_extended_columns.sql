-- Migration 058: Profiles Extended Columns & RLS Policy Alignment
-- Supports full_name_ar, full_name_en, job_title and allows admins/executives to manage profiles

-- 1. Extend columns
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS full_name_ar text,
  ADD COLUMN IF NOT EXISTS full_name_en text,
  ADD COLUMN IF NOT EXISTS job_title text;

-- 2. Helper function to check admin/executive privileges safely without RLS recursion
CREATE OR REPLACE FUNCTION public.is_pzone_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE (user_id = auth.uid() OR id = auth.uid())
      AND ('admin' = ANY(roles) OR 'ceo' = ANY(roles) OR 'coo' = ANY(roles) OR 'chairman' = ANY(roles))
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_pzone_admin() TO authenticated, service_role;

-- 3. Update profiles RLS: Allow users to update their own profile and admins to update all
ALTER POLICY "Users can update own profile" 
  ON public.profiles 
  USING (auth.uid() = user_id OR auth.uid() = id) 
  WITH CHECK (auth.uid() = user_id OR auth.uid() = id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can update all profiles'
  ) THEN
    CREATE POLICY "Admins can update all profiles"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (public.is_pzone_admin())
      WITH CHECK (public.is_pzone_admin());
  END IF;
END $$;

-- 4. Enable realtime publication for profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
