-- 1. Add stored generated column pm_name_normalized to pm.projects
ALTER TABLE pm.projects ADD COLUMN IF NOT EXISTS pm_name_normalized text GENERATED ALWAYS AS (public.normalize_arabic(project_manager_name_raw)) STORED;

-- 2. Create index on pm_name_normalized
CREATE INDEX IF NOT EXISTS idx_pm_projects_name_normalized ON pm.projects (pm_name_normalized);

-- 3. Add FK column project_manager_stakeholder_id to pm.projects
ALTER TABLE pm.projects ADD COLUMN IF NOT EXISTS project_manager_stakeholder_id text REFERENCES public.stakeholders(id) ON DELETE SET NULL;

-- 4. Create index on FK
CREATE INDEX IF NOT EXISTS idx_pm_projects_pm_stakeholder_id ON pm.projects (project_manager_stakeholder_id);

-- 5. Backfill existing projects with matching stakeholder_id
UPDATE pm.projects p 
SET project_manager_stakeholder_id = a.stakeholder_id 
FROM pm.project_manager_aliases a 
WHERE p.project_manager_stakeholder_id IS NULL 
  AND a.alias_normalized = public.normalize_arabic(p.project_manager_name_raw) 
  AND a.stakeholder_id IS NOT NULL;

-- 6. Update public.pm_projects_with_manager view
DROP VIEW IF EXISTS public.pm_projects_with_manager;

CREATE VIEW public.pm_projects_with_manager AS
SELECT 
  p.*,
  COALESCE(s.name, a.canonical_name, p.project_manager_name_raw) AS pm_full_name,
  COALESCE(a.canonical_name, s.name) AS pm_canonical_name,
  COALESCE(s.phone, NULL) AS pm_phone,
  COALESCE(s.code, NULL) AS pm_code,
  COALESCE(s.job_title, NULL) AS pm_job_title,
  p.project_manager_stakeholder_id AS pm_stakeholder_id
FROM pm.projects p
LEFT JOIN public.stakeholders s ON p.project_manager_stakeholder_id = s.id
LEFT JOIN pm.project_manager_aliases a ON p.project_manager_stakeholder_id IS NULL AND a.alias_normalized = p.pm_name_normalized;
