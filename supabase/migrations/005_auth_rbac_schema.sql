-- =========================================================
-- AUTH & PERMISSIONS SCHEMA (RLS + RBAC + RACI)
-- Run in Supabase SQL Editor
-- =========================================================

-- 1. Create Profiles Table linked to auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);


-- 2. Trigger to Auto-Create Profile on Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. User Roles Table (RBAC)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage user roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );


-- 4. Contract / Module Access Matrix Table
CREATE TABLE IF NOT EXISTS public.contract_module_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_path TEXT NOT NULL UNIQUE,
  module_label TEXT,
  allowed_roles TEXT[] DEFAULT '{}',
  edit_roles TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.contract_module_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view module access matrix"
  ON public.contract_module_access FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can update module access matrix"
  ON public.contract_module_access FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );


-- 5. Seed Default Module Permissions
INSERT INTO public.contract_module_access (module_path, module_label, allowed_roles, edit_roles)
VALUES
  ('/', 'Home / Progress', ARRAY['all'], ARRAY['admin', 'project_manager']),
  ('/projects', 'Project Setup', ARRAY['project_manager', 'ceo', 'coo', 'chairman', 'contract_admin'], ARRAY['project_manager', 'commercial_manager']),
  ('/ipc-management', 'IPC Management', ARRAY['finance', 'cost_control', 'contract_admin', 'ipc_clerk', 'ceo', 'coo', 'chairman', 'project_manager'], ARRAY['ipc_clerk', 'contract_admin', 'project_manager', 'commercial_manager']),
  ('/collections', 'Collections', ARRAY['finance', 'ceo', 'coo', 'chairman', 'cost_control'], ARRAY['finance']),
  ('/budget', 'Budget', ARRAY['cost_control', 'estimator', 'finance', 'ceo', 'coo', 'chairman'], ARRAY['cost_control', 'estimator', 'commercial_manager']),
  ('/stakeholders', 'Stakeholders', ARRAY['project_manager', 'contract_admin', 'ceo', 'coo', 'chairman', 'commercial_manager'], ARRAY['project_manager', 'contract_admin', 'commercial_manager']),
  ('/user-management', 'User & RACI Admin', ARRAY['admin', 'ceo', 'chairman'], ARRAY['admin'])
ON CONFLICT (module_path) DO NOTHING;
