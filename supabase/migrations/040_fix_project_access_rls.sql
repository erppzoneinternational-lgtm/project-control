-- ============================================================================
-- Migration 040: Fix Project Access RLS Function
-- Pzone International ERP
-- Date: 2026-09-02
-- Purpose: Ensure fn_user_can_access_project correctly grants access to
--          all authorized management and engineering roles across profiles,
--          user_roles, pm_user_project_access, and project_stakeholders.
-- ============================================================================

-- 1. Add missing enum values safely
DO 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'to_manager' AND enumtypid = 'public.user_role'::regtype) THEN
    ALTER TYPE public.user_role ADD VALUE 'to_manager';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'qc_inspector' AND enumtypid = 'public.user_role'::regtype) THEN
    ALTER TYPE public.user_role ADD VALUE 'qc_inspector';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'to_engineer' AND enumtypid = 'public.user_role'::regtype) THEN
    ALTER TYPE public.user_role ADD VALUE 'to_engineer';
  END IF;
END ;

-- 2. Two-parameter version: fn_user_can_access_project(p_user_id, p_project_id)
CREATE OR REPLACE FUNCTION public.fn_user_can_access_project(p_user_id uuid, p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS 
DECLARE
  v_roles text[];
BEGIN
  IF p_user_id IS NULL OR p_project_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check profiles.roles array (converted to text[] for safe matching)
  SELECT roles::text[] INTO v_roles
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_roles && ARRAY[
    'admin', 'ceo', 'coo', 'coo_assistant', 'chairman',
    'board_member', 'commercial_manager', 'planning_manager',
    'planning_engineer', 'project_manager', 'to_manager',
    'technical_office', 'qc_inspector', 'site_engineer', 'to_engineer'
  ]::text[] THEN
    RETURN TRUE;
  END IF;

  -- Check public.user_roles table
  IF EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND ur.role::text IN (
        'admin', 'ceo', 'coo', 'coo_assistant', 'chairman',
        'board_member', 'commercial_manager', 'planning_manager',
        'planning_engineer', 'project_manager', 'to_manager',
        'technical_office', 'qc_inspector', 'site_engineer', 'to_engineer'
      )
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check pm_user_project_access
  IF EXISTS (
    SELECT 1 FROM public.pm_user_project_access upa
    WHERE upa.user_id = p_user_id AND upa.project_id = p_project_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check project_stakeholders link
  IF EXISTS (
    SELECT 1 FROM public.project_stakeholders ps
    JOIN public.stakeholders s ON s.id = ps.stakeholder_id
    WHERE ps.project_id = p_project_id
      AND s.auth_user_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  -- Check direct PM assignment on project
  IF EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.stakeholders s ON s.id = p.project_manager_stakeholder_id
    WHERE p.id = p_project_id
      AND s.auth_user_id = p_user_id
  ) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
;

-- 3. One-parameter version: fn_user_can_access_project(p_project_id)
CREATE OR REPLACE FUNCTION public.fn_user_can_access_project(p_project_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS 
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF p_project_id IS NULL THEN
    RETURN TRUE;
  END IF;
  IF v_uid IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN public.fn_user_can_access_project(v_uid, p_project_id);
END;
;
