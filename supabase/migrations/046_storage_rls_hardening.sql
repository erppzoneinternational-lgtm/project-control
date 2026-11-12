-- ============================================================
-- 046_storage_rls_hardening.sql
-- M1 - Storage Bucket Isolation (V6)
-- Drops blanket storage policies; replaces with project-scoped RLS
-- that verifies membership via pm_user_project_access.
-- Idempotent: DROP POLICY IF EXISTS before every CREATE POLICY.
-- ============================================================

-- 1. DROP ALL BLANKET / OPEN STORAGE POLICIES

-- progress-photos (anon + open auth blankets from 012_planning_module)
DROP POLICY IF EXISTS "anon_read_progress_photos"            ON storage.objects;
DROP POLICY IF EXISTS "auth_read_progress_photos"            ON storage.objects;
DROP POLICY IF EXISTS "auth_insert_progress_photos"          ON storage.objects;

-- deliverables (open auth blankets from 012_planning_module)
DROP POLICY IF EXISTS "auth_read_deliverables"               ON storage.objects;
DROP POLICY IF EXISTS "auth_insert_deliverables"             ON storage.objects;

-- project-schedules (open auth blankets from 012_planning_module)
DROP POLICY IF EXISTS "auth_read_project_schedules"          ON storage.objects;
DROP POLICY IF EXISTS "auth_insert_project_schedules"        ON storage.objects;

-- Scoped policies from 004_storage_buckets (drop for clean replacement)
DROP POLICY IF EXISTS "progress_docs_read"                   ON storage.objects;
DROP POLICY IF EXISTS "progress_docs_insert"                 ON storage.objects;
DROP POLICY IF EXISTS "progress_docs_delete"                 ON storage.objects;
DROP POLICY IF EXISTS "schedules_read"                       ON storage.objects;
DROP POLICY IF EXISTS "schedules_insert"                     ON storage.objects;
DROP POLICY IF EXISTS "schedules_delete"                     ON storage.objects;
DROP POLICY IF EXISTS "deliverables_read"                    ON storage.objects;
DROP POLICY IF EXISTS "deliverables_insert"                  ON storage.objects;
DROP POLICY IF EXISTS "deliverables_delete"                  ON storage.objects;

-- 2. PROJECT-SCOPED REPLACEMENT POLICIES
--    First path segment = project UUID.
--    Membership via pm_user_project_access; admins bypass via user_roles.

-- progress-photos

DROP POLICY IF EXISTS "project_scoped_read_progress_photos"   ON storage.objects;
CREATE POLICY "project_scoped_read_progress_photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'progress-photos' AND (
      EXISTS (
        SELECT 1 FROM public.pm_user_project_access upa
        WHERE upa.project_id::text = (storage.foldername(name))[1]
          AND upa.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager','project_manager')
      )
    )
  );

DROP POLICY IF EXISTS "project_scoped_insert_progress_photos"  ON storage.objects;
CREATE POLICY "project_scoped_insert_progress_photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'progress-photos' AND (
      EXISTS (
        SELECT 1 FROM public.pm_user_project_access upa
        WHERE upa.project_id::text = (storage.foldername(name))[1]
          AND upa.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager',
                          'project_manager','site_engineer','planning_engineer','planning_manager')
      )
    )
  );

DROP POLICY IF EXISTS "project_scoped_update_progress_photos"  ON storage.objects;
CREATE POLICY "project_scoped_update_progress_photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'progress-photos' AND (
      EXISTS (
        SELECT 1 FROM public.pm_user_project_access upa
        WHERE upa.project_id::text = (storage.foldername(name))[1]
          AND upa.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager','project_manager')
      )
    )
  );

-- deliverables

DROP POLICY IF EXISTS "project_scoped_read_deliverables"       ON storage.objects;
CREATE POLICY "project_scoped_read_deliverables" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'deliverables' AND (
      EXISTS (
        SELECT 1 FROM public.pm_user_project_access upa
        WHERE upa.project_id::text = (storage.foldername(name))[1]
          AND upa.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager','project_manager')
      )
    )
  );

DROP POLICY IF EXISTS "project_scoped_insert_deliverables"     ON storage.objects;
CREATE POLICY "project_scoped_insert_deliverables" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'deliverables' AND (
      EXISTS (
        SELECT 1 FROM public.pm_user_project_access upa
        WHERE upa.project_id::text = (storage.foldername(name))[1]
          AND upa.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager',
                          'project_manager','technical_office','planning_engineer','planning_manager')
      )
    )
  );

DROP POLICY IF EXISTS "project_scoped_update_deliverables"     ON storage.objects;
CREATE POLICY "project_scoped_update_deliverables" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'deliverables' AND (
      EXISTS (
        SELECT 1 FROM public.pm_user_project_access upa
        WHERE upa.project_id::text = (storage.foldername(name))[1]
          AND upa.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager','project_manager')
      )
    )
  );

-- project-schedules

DROP POLICY IF EXISTS "project_scoped_read_project_schedules"  ON storage.objects;
CREATE POLICY "project_scoped_read_project_schedules" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'project-schedules' AND (
      EXISTS (
        SELECT 1 FROM public.pm_user_project_access upa
        WHERE upa.project_id::text = (storage.foldername(name))[1]
          AND upa.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager','project_manager')
      )
    )
  );

DROP POLICY IF EXISTS "project_scoped_insert_project_schedules" ON storage.objects;
CREATE POLICY "project_scoped_insert_project_schedules" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'project-schedules' AND (
      EXISTS (
        SELECT 1 FROM public.pm_user_project_access upa
        WHERE upa.project_id::text = (storage.foldername(name))[1]
          AND upa.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager',
                          'project_manager','planning_engineer','planning_manager')
      )
    )
  );

DROP POLICY IF EXISTS "project_scoped_update_project_schedules" ON storage.objects;
CREATE POLICY "project_scoped_update_project_schedules" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'project-schedules' AND (
      EXISTS (
        SELECT 1 FROM public.pm_user_project_access upa
        WHERE upa.project_id::text = (storage.foldername(name))[1]
          AND upa.user_id = auth.uid()
      ) OR
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('admin','ceo','coo','chairman','commercial_manager','project_manager')
      )
    )
  );

-- service_role bypass (required for server-side operations)

DROP POLICY IF EXISTS "service_role_storage_all"              ON storage.objects;
CREATE POLICY "service_role_storage_all" ON storage.objects
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
