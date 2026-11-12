-- Migration 003: M2 Integrity, Security & Audit
-- Workspace: pzone-project-setup

-- a. Delete duplicate alias for 'احمد شحاتة' to prevent unique constraint failure
DELETE FROM pm.project_manager_aliases WHERE alias = 'احمد شحاتة' AND alias_normalized = 'احمد شحاته';

-- b. Add UNIQUE constraint on alias_normalized
ALTER TABLE pm.project_manager_aliases ADD CONSTRAINT uq_alias_normalized UNIQUE (alias_normalized);

-- Clean up duplicate backfill_initial history entries before adding unique index
DELETE FROM pm.project_manager_history h1
USING pm.project_manager_history h2
WHERE h1.project_id = h2.project_id
  AND h1.change_reason = 'backfill_initial'
  AND h2.change_reason = 'backfill_initial'
  AND h1.id > h2.id;

-- c. Add unique indices on pm.project_manager_history
CREATE UNIQUE INDEX IF NOT EXISTS uq_pm_history_backfill ON pm.project_manager_history (project_id) WHERE (change_reason = 'backfill_initial');
CREATE UNIQUE INDEX IF NOT EXISTS uq_pm_history_live ON pm.project_manager_history (project_id, changed_at, pm_name_raw) WHERE (change_reason != 'backfill_initial' OR change_reason IS NULL);

-- d. Harden pm.log_pm_change() trigger function with EXCEPTION block
CREATE OR REPLACE FUNCTION pm.log_pm_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_alias       pm.project_manager_aliases%ROWTYPE;
  v_full_name   text;
  v_raw_name    text;
  v_reason      text;
  v_user        text;
BEGIN
  v_raw_name := NEW.project_manager_name_raw;

  IF v_raw_name IS NULL OR trim(v_raw_name) = '' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.project_manager_name_raw IS NOT DISTINCT FROM NEW.project_manager_name_raw THEN
      RETURN NEW;
    END IF;
    v_reason := 'manual_update';
  ELSE
    v_reason := 'initial_assignment';
  END IF;

  -- Resolve alias using normalized comparison
  SELECT * INTO v_alias
  FROM pm.project_manager_aliases
  WHERE public.normalize_arabic(alias) = public.normalize_arabic(v_raw_name)
  LIMIT 1;

  -- Resolve full name from stakeholders
  IF v_alias.stakeholder_id IS NOT NULL THEN
    SELECT name INTO v_full_name
    FROM public.stakeholders
    WHERE id = v_alias.stakeholder_id;
  END IF;

  BEGIN
    v_user := current_setting('request.jwt.claims', true)::json->>'sub';
  EXCEPTION WHEN OTHERS THEN
    v_user := 'system';
  END;

  INSERT INTO pm.project_manager_history (
    project_id, pm_name_raw, pm_canonical_name,
    pm_stakeholder_id, pm_full_name,
    changed_at, changed_by, change_reason
  ) VALUES (
    NEW.id,
    v_raw_name,
    COALESCE(v_alias.canonical_name, v_raw_name),
    v_alias.stakeholder_id,
    COALESCE(v_full_name, v_alias.canonical_name, v_raw_name),
    now(),
    COALESCE(v_user, 'system'),
    v_reason
  );

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_log_pm_change ON pm.projects;
CREATE TRIGGER trg_log_pm_change AFTER INSERT OR UPDATE OF project_manager_name_raw, project_manager_stakeholder_id ON pm.projects FOR EACH ROW EXECUTE FUNCTION pm.log_pm_change();

-- e. Enable RLS on pm.project_manager_history and add policies
ALTER TABLE pm.project_manager_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to project_manager_history" ON pm.project_manager_history;
CREATE POLICY "Allow authenticated access to project_manager_history" ON pm.project_manager_history FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow service_role access to project_manager_history" ON pm.project_manager_history;
CREATE POLICY "Allow service_role access to project_manager_history" ON pm.project_manager_history FOR ALL TO service_role USING (true);

-- f. Create pm.project_manager_aliases_log table
CREATE TABLE IF NOT EXISTS pm.project_manager_aliases_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(20) NOT NULL,
    alias_id UUID,
    alias TEXT NOT NULL,
    canonical_name TEXT NOT NULL,
    stakeholder_id TEXT,
    changed_at TIMESTAMPTZ DEFAULT now(),
    changed_by TEXT DEFAULT 'system'
);
ALTER TABLE pm.project_manager_aliases_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated access to project_manager_aliases_log" ON pm.project_manager_aliases_log;
CREATE POLICY "Allow authenticated access to project_manager_aliases_log" ON pm.project_manager_aliases_log FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow service_role access to project_manager_aliases_log" ON pm.project_manager_aliases_log;
CREATE POLICY "Allow service_role access to project_manager_aliases_log" ON pm.project_manager_aliases_log FOR ALL TO service_role USING (true);

-- g. Create function pm.log_alias_change() and trigger trg_log_alias_change
CREATE OR REPLACE FUNCTION pm.log_alias_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user TEXT;
BEGIN
  BEGIN
    v_user := current_setting('request.jwt.claims', true)::json->>'sub';
  EXCEPTION WHEN OTHERS THEN
    v_user := 'system';
  END;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO pm.project_manager_aliases_log (
      action, alias_id, alias, canonical_name, stakeholder_id, changed_at, changed_by
    ) VALUES (
      'DELETE',
      OLD.id,
      OLD.alias,
      OLD.canonical_name,
      OLD.stakeholder_id,
      now(),
      COALESCE(v_user, 'system')
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO pm.project_manager_aliases_log (
      action, alias_id, alias, canonical_name, stakeholder_id, changed_at, changed_by
    ) VALUES (
      'UPDATE',
      NEW.id,
      NEW.alias,
      NEW.canonical_name,
      NEW.stakeholder_id,
      now(),
      COALESCE(v_user, 'system')
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO pm.project_manager_aliases_log (
      action, alias_id, alias, canonical_name, stakeholder_id, changed_at, changed_by
    ) VALUES (
      'INSERT',
      NEW.id,
      NEW.alias,
      NEW.canonical_name,
      NEW.stakeholder_id,
      now(),
      COALESCE(v_user, 'system')
    );
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$function$;

DROP TRIGGER IF EXISTS trg_log_alias_change ON pm.project_manager_aliases;
CREATE TRIGGER trg_log_alias_change
AFTER INSERT OR UPDATE OR DELETE ON pm.project_manager_aliases
FOR EACH ROW EXECUTE FUNCTION pm.log_alias_change();
