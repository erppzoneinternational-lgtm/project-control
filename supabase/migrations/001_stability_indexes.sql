-- Enable trigram extension for ilike search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── pm_projects ─────────────────────────────────────────────────────────────
-- Partial indexes: soft-delete filter runs on EVERY query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pm_projects_active
  ON pm_projects (created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pm_projects_status
  ON pm_projects (status) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pm_projects_pzone_role
  ON pm_projects (pzone_role) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pm_projects_client_id
  ON pm_projects (client_id) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pm_projects_pm_id
  ON pm_projects (project_manager_id) WHERE deleted_at IS NULL;

-- Trigram GIN indexes for ILIKE search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pm_projects_name_trgm
  ON pm_projects USING GIN (project_name gin_trgm_ops) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pm_projects_code_trgm
  ON pm_projects USING GIN (project_code gin_trgm_ops) WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pm_projects_client_name_trgm
  ON pm_projects USING GIN (client_name_raw gin_trgm_ops) WHERE deleted_at IS NULL;

-- ── Child tables (project_id FK index on all 7 child tables) ────────────────
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_project_id
  ON pm_project_team (project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wbs_project_id
  ON pm_wbs_items (project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_milestones_project_id
  ON pm_payment_milestones (project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_docs_project_id
  ON pm_project_documents (project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_co_project_id
  ON pm_change_orders (project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_project_id
  ON pm_invoices (project_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_archive_project_id
  ON pm_archive_logs (project_id, archived_at DESC);
