-- ============================================================================
-- Migration 004: Storage Buckets (Private)
-- Pzone International ERP — New Supabase Account
-- Date: 2026-08-24
-- Depends on: 001_core_schema.sql
-- ROLLBACK: See bottom of file
-- ============================================================================

-- ============================================================================
-- 1. CREATE PRIVATE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('progress-documents', 'progress-documents', FALSE),
  ('project-schedules', 'project-schedules', FALSE),
  ('deliverables', 'deliverables', FALSE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. STORAGE POLICIES: progress-documents
-- Delivery notes, equipment rental docs, steel deductions, site paperwork
-- ============================================================================

CREATE POLICY "progress_docs_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'progress-documents' AND
    public.fn_user_can_access_project(
      auth.uid(),
      (storage.foldername(name))[1]::uuid
    )
  );

CREATE POLICY "progress_docs_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'progress-documents' AND
    public.fn_user_can_access_project(
      auth.uid(),
      (storage.foldername(name))[1]::uuid
    ) AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'site_engineer', 'planning_engineer', 'planning_manager',
      'project_manager'
    ]::public.user_role[])
  );

CREATE POLICY "progress_docs_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'progress-documents' AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'planning_manager'
    ]::public.user_role[])
  );

-- ============================================================================
-- 3. STORAGE POLICIES: project-schedules
-- ============================================================================

CREATE POLICY "schedules_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'project-schedules' AND
    public.fn_user_can_access_project(
      auth.uid(),
      (storage.foldername(name))[1]::uuid
    )
  );

CREATE POLICY "schedules_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'project-schedules' AND
    public.fn_user_can_access_project(
      auth.uid(),
      (storage.foldername(name))[1]::uuid
    ) AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'planning_manager', 'planning_engineer'
    ]::public.user_role[])
  );

CREATE POLICY "schedules_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'project-schedules' AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'planning_manager'
    ]::public.user_role[])
  );

-- ============================================================================
-- 4. STORAGE POLICIES: deliverables
-- ============================================================================

CREATE POLICY "deliverables_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'deliverables' AND
    public.fn_user_can_access_project(
      auth.uid(),
      (storage.foldername(name))[1]::uuid
    )
  );

CREATE POLICY "deliverables_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'deliverables' AND
    public.fn_user_can_access_project(
      auth.uid(),
      (storage.foldername(name))[1]::uuid
    ) AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'technical_office', 'project_manager'
    ]::public.user_role[])
  );

CREATE POLICY "deliverables_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'deliverables' AND
    public.fn_user_has_role(auth.uid(), ARRAY[
      'admin', 'project_manager'
    ]::public.user_role[])
  );

-- ============================================================================
-- ROLLBACK
-- ============================================================================
-- DROP POLICY IF EXISTS "deliverables_delete" ON storage.objects;
-- DROP POLICY IF EXISTS "deliverables_insert" ON storage.objects;
-- DROP POLICY IF EXISTS "deliverables_read" ON storage.objects;
-- DROP POLICY IF EXISTS "schedules_delete" ON storage.objects;
-- DROP POLICY IF EXISTS "schedules_insert" ON storage.objects;
-- DROP POLICY IF EXISTS "schedules_read" ON storage.objects;
-- DROP POLICY IF EXISTS "progress_docs_delete" ON storage.objects;
-- DROP POLICY IF EXISTS "progress_docs_insert" ON storage.objects;
-- DROP POLICY IF EXISTS "progress_docs_read" ON storage.objects;
-- DELETE FROM storage.buckets WHERE id IN ('progress-documents', 'project-schedules', 'deliverables');
