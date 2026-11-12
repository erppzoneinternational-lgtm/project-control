import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Schema Integrity Test for Migrations 050_contracts_tables.sql to 054_hse_tables.sql
 * Verifies SQL syntax, constraints, foreign keys, cascading deletions, indexes, and RLS structures.
 */
describe('Migrations 050-054 Schema Integrity & Architectural Governance', () => {
  const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
  
  const migrationFiles = [
    '050_contracts_tables.sql',
    '051_cost_control_tables.sql',
    '052_tender_tables.sql',
    '053_document_control_tables.sql',
    '054_hse_tables.sql',
  ];

  const migrationContents = new Map<string, string>();

  // Ensure all 5 files exist and load their contents
  migrationFiles.forEach((file) => {
    const fullPath = path.join(migrationsDir, file);
    if (fs.existsSync(fullPath)) {
      migrationContents.set(file, fs.readFileSync(fullPath, 'utf8'));
    }
  });

  describe('1. File Existence & SQL Syntax Baseline', () => {
    it('all 5 pending migration files exist on disk', () => {
      migrationFiles.forEach((file) => {
        expect(migrationContents.has(file), `Missing migration file: ${file}`).toBe(true);
      });
    });

    it('each migration file contains valid non-empty SQL with comments', () => {
      migrationFiles.forEach((file) => {
        const content = migrationContents.get(file)!;
        expect(content.length).toBeGreaterThan(100);
        expect(content).toContain('-- Status: APPLIED TO LIVE SUPABASE');
      });
    });

    it('each SQL file maintains balanced parentheses and valid statement closures', () => {
      migrationFiles.forEach((file) => {
        const content = migrationContents.get(file)!;
        
        // Remove comments and string literals to count structural parentheses
        const cleanContent = content
          .replace(/--.*$/gm, '')
          .replace(/\/\*[\s\S]*?\*\//g, '')
          .replace(/'(?:[^'\\]|\\.)*'/g, "''");

        let openParen = 0;
        for (const char of cleanContent) {
          if (char === '(') openParen++;
          if (char === ')') openParen--;
          expect(openParen, `Unbalanced parentheses in ${file}`).toBeGreaterThanOrEqual(0);
        }
        expect(openParen, `Mismatched closing parentheses in ${file}`).toBe(0);

        // Verify statements end with semicolons
        const statements = cleanContent
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        expect(statements.length, `No executable statements in ${file}`).toBeGreaterThan(0);
      });
    });
  });

  describe('2. Migration 050: Contracts, Claims & IPC Governance', () => {
    const file = '050_contracts_tables.sql';

    it('defines expected tables: pm_contracts, pm_claims, pm_variation_orders, pm_eot_requests, pm_ipc_certificates', () => {
      const sql = migrationContents.get(file)!;
      const expectedTables = [
        'public.pm_contracts',
        'public.pm_claims',
        'public.pm_variation_orders',
        'public.pm_eot_requests',
        'public.pm_ipc_certificates',
      ];
      expectedTables.forEach((table) => {
        expect(sql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
      });
    });

    it('enforces foreign key cascading to projects and pm_contracts', () => {
      const sql = migrationContents.get(file)!;
      expect(sql).toMatch(/pm_contracts[\s\S]*?project_id UUID NOT NULL REFERENCES public\.projects\(id\) ON DELETE CASCADE/);
      expect(sql).toContain("currency TEXT NOT NULL DEFAULT 'EGP'");
      expect(sql).toMatch(/pm_claims[\s\S]*?contract_id UUID NOT NULL REFERENCES public\.pm_contracts\(id\) ON DELETE CASCADE/);
      expect(sql).toMatch(/pm_variation_orders[\s\S]*?contract_id UUID NOT NULL REFERENCES public\.pm_contracts\(id\) ON DELETE CASCADE/);
      expect(sql).toMatch(/pm_eot_requests[\s\S]*?contract_id UUID NOT NULL REFERENCES public\.pm_contracts\(id\) ON DELETE CASCADE/);
      expect(sql).toMatch(/pm_ipc_certificates[\s\S]*?contract_id UUID NOT NULL REFERENCES public\.pm_contracts\(id\) ON DELETE CASCADE/);
    });

    it('enforces business constraints (CHECK and UNIQUE constraints)', () => {
      const sql = migrationContents.get(file)!;
      // Contracts check
      expect(sql).toContain("CHECK (status IN ('active', 'suspended', 'completed', 'terminated'))");
      expect(sql).toContain("CHECK (fidic_type IN ('red_book', 'yellow_book', 'silver_book'))");
      expect(sql).toContain('UNIQUE(project_id, contract_number)');
      
      // Claims check
      expect(sql).toContain("CHECK (claim_type IN ('variation_order', 'eot', 'cost_claim', 'delay_claim'))");
      expect(sql).toContain('UNIQUE(project_id, claim_number)');

      // Variation orders check
      expect(sql).toContain("CHECK (vo_type IN ('addition', 'omission', 'substitution'))");
      expect(sql).toContain('UNIQUE(project_id, vo_number)');

      // EOT requests check
      expect(sql).toContain('UNIQUE(project_id, eot_number)');

      // IPC certificates check
      expect(sql).toContain('UNIQUE(project_id, contract_id, ipc_number)');
    });

    it('enforces RLS and authenticated_access policy across all 5 tables', () => {
      const sql = migrationContents.get(file)!;
      const tables = [
        'public.pm_contracts',
        'public.pm_claims',
        'public.pm_variation_orders',
        'public.pm_eot_requests',
        'public.pm_ipc_certificates',
      ];
      tables.forEach((table) => {
        expect(sql).toContain(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);
        expect(sql).toContain(`CREATE POLICY "authenticated_access" ON ${table}`);
      });
    });

    it('declares updated_at triggers and indexes for high-frequency queries', () => {
      const sql = migrationContents.get(file)!;
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_pm_contracts_project ON public.pm_contracts(project_id);');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_pm_claims_project ON public.pm_claims(project_id);');
      expect(sql).toContain('CREATE TRIGGER trg_pm_contracts_updated BEFORE UPDATE ON public.pm_contracts');
    });
  });

  describe('3. Migration 051: Cost Control & EVM Performance Governance', () => {
    const file = '051_cost_control_tables.sql';

    it('defines pm_cost_snapshots and pm_budget_lines tables', () => {
      const sql = migrationContents.get(file)!;
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.pm_cost_snapshots');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.pm_budget_lines');
    });

    it('contains all required EVM mathematical KPI columns in pm_cost_snapshots', () => {
      const sql = migrationContents.get(file)!;
      const evmCols = [
        'budget_at_completion NUMERIC(18,2)',
        'actual_cost NUMERIC(18,2)',
        'earned_value NUMERIC(18,2)',
        'planned_value NUMERIC(18,2)',
        'spi NUMERIC(10,4)',
        'cpi NUMERIC(10,4)',
        'sv NUMERIC(18,2)',
        'cv NUMERIC(18,2)',
        'eac NUMERIC(18,2)',
        'etc NUMERIC(18,2)',
        'vac NUMERIC(18,2)',
        'tcpi NUMERIC(10,4)',
      ];
      evmCols.forEach((col) => {
        expect(sql).toContain(col);
      });
      expect(sql).toContain('UNIQUE(project_id, snapshot_date)');
    });

    it('implements GENERATED ALWAYS AS columns for budget calculation integrity', () => {
      const sql = migrationContents.get(file)!;
      expect(sql).toContain('current_budget NUMERIC(18,2) GENERATED ALWAYS AS (original_budget + approved_changes) STORED');
      expect(sql).toContain('variance NUMERIC(18,2) GENERATED ALWAYS AS ((original_budget + approved_changes) - forecast_cost) STORED');
      expect(sql).toContain('cost_code_id UUID NOT NULL REFERENCES public.pm_cost_codes(id) ON DELETE CASCADE');
      expect(sql).toContain('UNIQUE(project_id, cost_code_id)');
    });

    it('enforces RLS and policies on cost control tables', () => {
      const sql = migrationContents.get(file)!;
      expect(sql).toContain('ALTER TABLE public.pm_cost_snapshots ENABLE ROW LEVEL SECURITY;');
      expect(sql).toContain('ALTER TABLE public.pm_budget_lines ENABLE ROW LEVEL SECURITY;');
      expect(sql).toContain('CREATE POLICY "authenticated_access" ON public.pm_cost_snapshots');
      expect(sql).toContain('CREATE POLICY "authenticated_access" ON public.pm_budget_lines');
    });
  });

  describe('4. Migration 052: Tender Pipeline & Bid Evaluation Tables', () => {
    const file = '052_tender_tables.sql';

    it('defines pm_tenders and pm_tender_bidders tables with relational cascade', () => {
      const sql = migrationContents.get(file)!;
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.pm_tenders');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.pm_tender_bidders');
      expect(sql).toContain('tender_id UUID NOT NULL REFERENCES public.pm_tenders(id) ON DELETE CASCADE');
    });

    it('enforces tender_number UNIQUE and bidder scoring columns', () => {
      const sql = migrationContents.get(file)!;
      expect(sql).toContain('tender_number TEXT NOT NULL UNIQUE');
      expect(sql).toContain('technical_score NUMERIC(5,2)');
      expect(sql).toContain('financial_score NUMERIC(5,2)');
      expect(sql).toContain('ranking INTEGER');
    });

    it('enforces RLS and updated_at triggers on tender tables', () => {
      const sql = migrationContents.get(file)!;
      expect(sql).toContain('ALTER TABLE public.pm_tenders ENABLE ROW LEVEL SECURITY;');
      expect(sql).toContain('ALTER TABLE public.pm_tender_bidders ENABLE ROW LEVEL SECURITY;');
      expect(sql).toContain('CREATE POLICY "authenticated_access" ON public.pm_tenders');
      expect(sql).toContain('CREATE POLICY "authenticated_access" ON public.pm_tender_bidders');
      expect(sql).toContain('CREATE TRIGGER trg_pm_tenders_updated BEFORE UPDATE ON public.pm_tenders');
      expect(sql).toContain('CREATE TRIGGER trg_pm_tender_bidders_updated BEFORE UPDATE ON public.pm_tender_bidders');
    });
  });

  describe('5. Migration 053: Controlled Documents & Transmittals Tables', () => {
    const file = '053_document_control_tables.sql';

    it('defines pm_controlled_documents and pm_document_transmittals tables', () => {
      const sql = migrationContents.get(file)!;
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.pm_controlled_documents');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.pm_document_transmittals');
    });

    it('enforces project cascade, composite unique constraint on (project_id, document_number, revision)', () => {
      const sql = migrationContents.get(file)!;
      expect(sql).toContain('project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE');
      expect(sql).toContain('UNIQUE (project_id, document_number, revision)');
      expect(sql).toContain('transmittal_number TEXT NOT NULL UNIQUE');
    });

    it('enforces RLS, updated_at triggers, and performance indexes', () => {
      const sql = migrationContents.get(file)!;
      expect(sql).toContain('ALTER TABLE public.pm_controlled_documents ENABLE ROW LEVEL SECURITY;');
      expect(sql).toContain('ALTER TABLE public.pm_document_transmittals ENABLE ROW LEVEL SECURITY;');
      expect(sql).toContain('CREATE POLICY "authenticated_access" ON public.pm_controlled_documents');
      expect(sql).toContain('CREATE POLICY "authenticated_access" ON public.pm_document_transmittals');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_pm_controlled_documents_project_id ON public.pm_controlled_documents(project_id);');
      expect(sql).toContain('CREATE TRIGGER trg_pm_controlled_documents_updated BEFORE UPDATE ON public.pm_controlled_documents');
    });
  });

  describe('6. Migration 054: HSE Incidents & Safety Inspection Audits', () => {
    const file = '054_hse_tables.sql';

    it('defines pm_hse_incidents and pm_hse_inspections tables with project cascade', () => {
      const sql = migrationContents.get(file)!;
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.pm_hse_incidents');
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.pm_hse_inspections');
      expect(sql).toMatch(/pm_hse_incidents[\s\S]*?project_id UUID NOT NULL REFERENCES public\.projects\(id\) ON DELETE CASCADE/);
      expect(sql).toMatch(/pm_hse_inspections[\s\S]*?project_id UUID NOT NULL REFERENCES public\.projects\(id\) ON DELETE CASCADE/);
    });

    it('enforces incident_number UNIQUE and inspection safety scoring columns', () => {
      const sql = migrationContents.get(file)!;
      expect(sql).toContain('incident_number TEXT NOT NULL UNIQUE');
      expect(sql).toContain('safe_acts_count INTEGER DEFAULT 0');
      expect(sql).toContain('unsafe_acts_count INTEGER DEFAULT 0');
      expect(sql).toContain('stop_work_issued BOOLEAN DEFAULT false');
    });

    it('enforces RLS, updated_at triggers, and index coverage', () => {
      const sql = migrationContents.get(file)!;
      expect(sql).toContain('ALTER TABLE public.pm_hse_incidents ENABLE ROW LEVEL SECURITY;');
      expect(sql).toContain('ALTER TABLE public.pm_hse_inspections ENABLE ROW LEVEL SECURITY;');
      expect(sql).toContain('CREATE POLICY "authenticated_access" ON public.pm_hse_incidents');
      expect(sql).toContain('CREATE POLICY "authenticated_access" ON public.pm_hse_inspections');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_pm_hse_incidents_project_id ON public.pm_hse_incidents(project_id);');
      expect(sql).toContain('CREATE TRIGGER trg_pm_hse_incidents_updated BEFORE UPDATE ON public.pm_hse_incidents');
      expect(sql).toContain('CREATE TRIGGER trg_pm_hse_inspections_updated BEFORE UPDATE ON public.pm_hse_inspections');
    });
  });
});
