import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

/**
 * DDL Execution Syntax & PostgreSQL Error 42809 Regression Guard
 * Target Migrations: 050_contracts_tables.sql – 062_qa_prelaunch_remediation.sql
 *
 * Verifies the remediated schema state:
 * 1. Zero occurrences of illegal view foreign keys (`REFERENCES public.pm_projects(id)`)
 *    across the entire `supabase/migrations/` directory (PostgreSQL Error 42809).
 * 2. All 11 project-scoped tables in 050–054 reference base table `public.projects(id) ON DELETE CASCADE`.
 * 3. Migration 056 enforces `security_invoker = true` on views, `SET search_path = public` on
 *    SECURITY DEFINER functions, server-side `v_boq_current` price masking, and storage RLS.
 * 4. `validateDdlSyntax` rejects view-targeted FKs while passing all 13 live `CREATE TABLE` blocks.
 */

export function validateDdlSyntax(sqlSnippet: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (/REFERENCES\s+(public\.)?pm_projects\s*\(/i.test(sqlSnippet)) {
    errors.push('PostgreSQL Error 42809: Cannot declare foreign key referencing view "pm_projects".');
  }

  if (/project_id\s+UUID/i.test(sqlSnippet)) {
    if (!/REFERENCES\s+public\.projects\s*\(\s*id\s*\)/i.test(sqlSnippet)) {
      errors.push('Invalid FK Target: project_id must reference base table "public.projects(id)".');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

describe('Migrations 050–056 DDL Execution Syntax & Security Hardening Guard', () => {
  const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');

  const targetMigrations: Array<{
    file: string;
    expectedProjectFkCount: number;
    projectScopedTables: string[];
  }> = [
    {
      file: '050_contracts_tables.sql',
      expectedProjectFkCount: 5,
      projectScopedTables: [
        'pm_contracts',
        'pm_claims',
        'pm_variation_orders',
        'pm_eot_requests',
        'pm_ipc_certificates',
      ],
    },
    {
      file: '051_cost_control_tables.sql',
      expectedProjectFkCount: 2,
      projectScopedTables: ['pm_cost_snapshots', 'pm_budget_lines'],
    },
    {
      file: '052_tender_tables.sql',
      expectedProjectFkCount: 0,
      projectScopedTables: [],
    },
    {
      file: '053_document_control_tables.sql',
      expectedProjectFkCount: 2,
      projectScopedTables: ['pm_controlled_documents', 'pm_document_transmittals'],
    },
    {
      file: '054_hse_tables.sql',
      expectedProjectFkCount: 2,
      projectScopedTables: ['pm_hse_incidents', 'pm_hse_inspections'],
    },
  ];

  const allSqlFiles = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const migrationContents = new Map<string, string>();
  for (const file of allSqlFiles) {
    migrationContents.set(file, fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
  }

  describe('1. Repository-Wide Elimination of View Foreign Keys (Regression: Error 42809)', () => {
    it('DDL-01: zero migrations in supabase/migrations/ reference view public.pm_projects(id)', () => {
      expect(allSqlFiles.length).toBeGreaterThanOrEqual(70);

      const offendingFiles: string[] = [];
      for (const file of allSqlFiles) {
        const sql = migrationContents.get(file) || '';
        if (/REFERENCES\s+(public\.)?pm_projects\s*\(/i.test(sql)) {
          offendingFiles.push(file);
        }
      }

      expect(offendingFiles).toEqual([]);
    });

    it.each(targetMigrations)(
      'DDL-02: $file is marked APPLIED TO LIVE SUPABASE and has $expectedProjectFkCount base-table project FKs',
      ({ file, expectedProjectFkCount, projectScopedTables }) => {
        expect(migrationContents.has(file)).toBe(true);
        const sql = migrationContents.get(file)!;

        expect(sql).toContain('-- Status: APPLIED TO LIVE SUPABASE (tgqpcviqmgtdddiqvqdw)');
        expect(sql.match(/REFERENCES\s+(public\.)?pm_projects\s*\(/gi) || []).toHaveLength(0);

        const validProjectFks =
          sql.match(/project_id\s+UUID\s+NOT\s+NULL\s+REFERENCES\s+public\.projects\(id\)\s+ON\s+DELETE\s+CASCADE/gi) ||
          [];
        expect(validProjectFks).toHaveLength(expectedProjectFkCount);

        for (const table of projectScopedTables) {
          const tableBlockRegex = new RegExp(
            `CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+public\\.${table}\\s*\\([\\s\\S]*?\\);`,
            'i'
          );
          const match = sql.match(tableBlockRegex);
          expect(match, `Expected CREATE TABLE block for ${table} in ${file}`).not.toBeNull();
          expect(validateDdlSyntax(match![0])).toEqual({ isValid: true, errors: [] });
        }
      }
    );

    it('DDL-03: totals exactly 11 base-table public.projects(id) FKs across migrations 050–054', () => {
      const totalValidFks = targetMigrations.reduce((sum, { file }) => {
        const sql = migrationContents.get(file) || '';
        const matches = sql.match(/REFERENCES\s+public\.projects\(id\)/gi) || [];
        return sum + matches.length;
      }, 0);

      expect(totalValidFks).toBe(11);
    });
  });

  describe('2. DDL Validator Guard Behavior (validateDdlSyntax)', () => {
    it('DDL-04: rejects DDL declaring a foreign key against view pm_projects with PostgreSQL Error 42809', () => {
      const flawedDdl = `
        CREATE TABLE public.pm_contracts (
          id UUID PRIMARY KEY,
          project_id UUID NOT NULL REFERENCES public.pm_projects(id) ON DELETE CASCADE
        );
      `;
      const result = validateDdlSyntax(flawedDdl);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'PostgreSQL Error 42809: Cannot declare foreign key referencing view "pm_projects".'
      );
    });

    it('DDL-05: rejects DDL declaring project_id UUID without referencing public.projects(id)', () => {
      const unreferencedProjectDdl = `
        CREATE TABLE public.pm_cost_snapshots (
          id UUID PRIMARY KEY,
          project_id UUID NOT NULL
        );
      `;
      const result = validateDdlSyntax(unreferencedProjectDdl);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Invalid FK Target: project_id must reference base table "public.projects(id)".'
      );
    });

    it('DDL-06: accepts pre-project tender tables (052_tender_tables.sql) that have no project_id column', () => {
      const sql052 = migrationContents.get('052_tender_tables.sql')!;
      const blocks = sql052.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+public\.\w+\s*\([\s\S]*?\);/gi) || [];

      expect(blocks).toHaveLength(2);
      for (const block of blocks) {
        expect(validateDdlSyntax(block)).toEqual({ isValid: true, errors: [] });
      }
    });
  });

  describe('3. Migration 056 Security, RLS View Invoker & Storage Hardening', () => {
    const file056 = '062_qa_prelaunch_remediation.sql';

    it('DDL-07: exists on disk and carries live deployment status header', () => {
      expect(migrationContents.has(file056)).toBe(true);
      const sql = migrationContents.get(file056)!;
      expect(sql).toContain('-- Status: APPLIED TO LIVE SUPABASE (tgqpcviqmgtdddiqvqdw)');
    });

    it.each([
      'pm_cities',
      'pm_clients',
      'pm_governorates',
      'pm_project_client_contacts',
      'pm_project_site_resources',
      'pm_project_subcontractors',
      'pm_projects',
      'pm_projects_with_manager',
      'pm_stakeholders',
      'project_client_contacts',
      'project_site_resources',
      'project_subcontractors',
      'v_boq_with_actuals',
    ])('DDL-08: enables security_invoker = true on public.%s', (viewName) => {
      const sql = migrationContents.get(file056)!;
      expect(sql).toContain(`ALTER VIEW public.${viewName} SET (security_invoker = true);`);
    });

    it.each([
      'public.rpc_site_task_transition(uuid, text, text, jsonb, numeric)',
      'public.rpc_reassign_task(uuid, uuid, text, text)',
      'public.rpc_replan_task(uuid, date, date, text)',
      'public.trg_pm_projects_delete()',
      'public.trg_pm_projects_insert()',
      'public.trg_pm_projects_update()',
    ])('DDL-09: locks SET search_path = public on SECURITY DEFINER function %s', (fnSignature) => {
      const sql = migrationContents.get(file056)!;
      expect(sql).toContain(`ALTER FUNCTION ${fnSignature} SET search_path = public;`);
    });

    it('DDL-10: enforces server-side price masking in v_boq_current and public read on progress-photos', () => {
      const sql = migrationContents.get(file056)!;

      expect(sql).toContain('CREATE OR REPLACE VIEW public.v_boq_current WITH (security_invoker = true)');
      expect(sql).toContain('public.fn_user_can_see_prices(auth.uid(), project_id)');
      expect(sql).toMatch(/UPDATE\s+storage\.buckets\s+SET\s+public\s*=\s*true\s+WHERE\s+id\s*=\s*'progress-photos'/i);
      expect(sql).toContain('CREATE POLICY "project_scoped_read_progress_documents" ON storage.objects');
      expect(sql).toContain('CREATE POLICY "project_scoped_insert_progress_documents" ON storage.objects');
    });
  });
});
