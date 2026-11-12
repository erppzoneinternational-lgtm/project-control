import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDbState = {
  stakeholders: new Map<string, Record<string, any>>(),
  projectStakeholders: [] as Array<Record<string, any>>,
  stakeholderInsertCalls: 0,
  simulateRaceConflictOnce: null as null | { winnerRow: Record<string, any> },
};

function createStatefulMockSupabaseClient() {
  return {
    from(table: string) {
      const filters: Array<{ op: 'eq' | 'ilike'; col: string; val: any }> = [];
      let pendingInsertPayload: Record<string, any> | null = null;
      let mode: 'select' | 'insert' = 'select';

      const evaluateSelect = (): Record<string, any>[] => {
        const rows =
          table === 'stakeholders'
            ? Array.from(mockDbState.stakeholders.values())
            : table === 'project_stakeholders'
              ? [...mockDbState.projectStakeholders]
              : [];

        return rows.filter((row) =>
          filters.every((f) => {
            const cell = row[f.col];
            if (f.op === 'eq') return cell === f.val;
            if (f.op === 'ilike') {
              if (typeof cell !== 'string' || typeof f.val !== 'string') return false;
              const pattern = f.val.replace(/%/g, '').toLowerCase();
              return cell.toLowerCase() === pattern;
            }
            return true;
          })
        );
      };

      const executeInsert = (): { data: any; error: any } => {
        const record = { ...(pendingInsertPayload || {}) };

        if (table === 'stakeholders') {
          mockDbState.stakeholderInsertCalls += 1;

          if (mockDbState.simulateRaceConflictOnce) {
            const { winnerRow } = mockDbState.simulateRaceConflictOnce;
            mockDbState.simulateRaceConflictOnce = null;
            mockDbState.stakeholders.set(winnerRow.id, winnerRow);
            return {
              data: null,
              error: {
                code: '23505',
                message: 'duplicate key value violates unique constraint "stakeholders_email_key"',
              },
            };
          }

          if (record.email) {
            const dupEmail = Array.from(mockDbState.stakeholders.values()).find(
              (s) =>
                typeof s.email === 'string' &&
                s.email.toLowerCase() === String(record.email).toLowerCase() &&
                s.id !== record.id
            );
            if (dupEmail) {
              return {
                data: null,
                error: {
                  code: '23505',
                  message: 'duplicate key value violates unique constraint "stakeholders_email_key"',
                },
              };
            }
          }

          const stored = {
            id: record.id || `stk-${mockDbState.stakeholders.size + 1}`,
            ...record,
            created_at: '2020-01-01T00:00:00.000Z',
          };
          mockDbState.stakeholders.set(stored.id, stored);
          return { data: stored, error: null };
        }

        if (table === 'project_stakeholders') {
          if (!mockDbState.stakeholders.has(record.stakeholder_id)) {
            return {
              data: null,
              error: {
                code: '23503',
                message: `insert or update on table "project_stakeholders" violates foreign key constraint "project_stakeholders_stakeholder_id_fkey": Key (stakeholder_id)=(${record.stakeholder_id}) is not present in table "stakeholders"`,
              },
            };
          }

          if (
            record.raci_role === 'accountable' &&
            mockDbState.projectStakeholders.some(
              (ps) => ps.project_id === record.project_id && ps.raci_role === 'accountable'
            )
          ) {
            return {
              data: null,
              error: {
                code: '23505',
                message: 'duplicate key value violates unique constraint "uq_project_accountable"',
              },
            };
          }

          const createdPs = {
            id: `ps-${mockDbState.projectStakeholders.length + 1}`,
            ...record,
            stakeholder: mockDbState.stakeholders.get(record.stakeholder_id),
            created_at: '2020-01-01T00:00:00.000Z',
          };
          mockDbState.projectStakeholders.push(createdPs);
          return { data: createdPs, error: null };
        }

        return { data: record, error: null };
      };

      let cachedInsertOutcome: { data: any; error: any } | null = null;
      const getInsertOutcome = () => {
        if (!cachedInsertOutcome) {
          cachedInsertOutcome = executeInsert();
        }
        return cachedInsertOutcome;
      };

      const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn((col: string, val: any) => {
          filters.push({ op: 'eq', col, val });
          return builder;
        }),
        ilike: vi.fn((col: string, val: any) => {
          filters.push({ op: 'ilike', col, val });
          return builder;
        }),
        limit: vi.fn(() => builder),
        insert: vi.fn((payload: Record<string, any> | Array<Record<string, any>>) => {
          mode = 'insert';
          pendingInsertPayload = Array.isArray(payload) ? payload[0] : payload;
          cachedInsertOutcome = null;
          return builder;
        }),
        upsert: vi.fn((payload: Record<string, any> | Array<Record<string, any>>) => {
          mode = 'insert';
          pendingInsertPayload = Array.isArray(payload) ? payload[0] : payload;
          cachedInsertOutcome = null;
          return builder;
        }),
        maybeSingle: vi.fn(async () => {
          if (mode === 'insert') return getInsertOutcome();
          const matched = evaluateSelect();
          return { data: matched[0] ?? null, error: null };
        }),
        single: vi.fn(async () => {
          if (mode === 'insert') return getInsertOutcome();
          const matched = evaluateSelect();
          if (matched.length === 0) {
            return { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
          }
          return { data: matched[0], error: null };
        }),
        then(onfulfilled?: (val: any) => any, onrejected?: (reason: any) => any) {
          const promise = Promise.resolve().then(() => {
            if (mode === 'insert') return getInsertOutcome();
            return { data: evaluateSelect(), error: null };
          });
          return promise.then(onfulfilled, onrejected);
        },
      };

      return builder;
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

vi.mock('@/lib/supabase', () => ({
  supabase: createStatefulMockSupabaseClient(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createSupabaseBrowserClient: () => createStatefulMockSupabaseClient(),
  createHrDbClient: () => createStatefulMockSupabaseClient(),
}));

import { ensureLocalStakeholderForAssignment } from '@/lib/services/hr.service';
import { ProjectService } from '@/lib/services/project.service';
import { StakeholderFull } from '@/types';

/**
 * Dual-Supabase Stakeholder Synchronization & RACI Guard Suite
 *
 * Exercises:
 * - `ensureLocalStakeholderForAssignment(employee, dbClient)` in `src/lib/services/hr.service.ts`
 * - `ProjectService.addProjectStakeholder(payload)` in `src/lib/services/project.service.ts`
 *
 * Covers:
 * (a) Existing stakeholder ID fast-path without redundant insert.
 * (b) Case-insensitive email deduplication returning the existing local UUID.
 * (c) Auto-insert of missing HR employee (`ftmguacqywsucjhjiacn`) into `public.stakeholders`
 *     before `project_stakeholders` FK check (preventing PostgreSQL Error 23503).
 * (d) Concurrent `23505` email unique-constraint race fallback.
 * (e) Single-Accountable RACI invariant per project (`uq_project_accountable`).
 */
describe('Dual-Supabase Stakeholder Assignment & Auto-Sync Guard Suite', () => {
  const TARGET_PROJECT_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
  const dbClient = createStatefulMockSupabaseClient();

  const sampleHrEmployee: StakeholderFull & { is_hr_employee: true } = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name_ar: 'م. أحمد إبراهيم',
    name_en: 'Ahmed Ibrahim',
    role: 'Senior Site Engineer',
    job_title: 'Senior Site Engineer',
    email: 'Ahmed.Ibrahim@Pzone-Egypt.com',
    phone: '+201001234567',
    employee_code: 'EMP-0142',
    organization_id: '00000000-0000-0000-0000-000000000001',
    organization_name: 'Pzoneinternational',
    organization_code: 'PZONE',
    stakeholder_kind: 'employee',
    is_active: true,
    assigned_projects_count: 0,
    is_system_user: false,
    is_hr_employee: true,
  };

  function extractStakeholderId(res: unknown): string {
    if (typeof res === 'string') return res;
    if (res && typeof res === 'object' && 'id' in res && typeof (res as { id: unknown }).id === 'string') {
      return (res as { id: string }).id;
    }
    throw new Error(`Unexpected return shape from ensureLocalStakeholderForAssignment: ${JSON.stringify(res)}`);
  }

  beforeEach(() => {
    mockDbState.stakeholders.clear();
    mockDbState.projectStakeholders = [];
    mockDbState.stakeholderInsertCalls = 0;
    mockDbState.simulateRaceConflictOnce = null;
  });

  describe('1. Local Stakeholder Resolution & Auto-Insert Paths', () => {
    it('SYNC-01 (a): fast-paths when stakeholder ID already exists locally without re-inserting', async () => {
      mockDbState.stakeholders.set(sampleHrEmployee.id, {
        id: sampleHrEmployee.id,
        name_ar: sampleHrEmployee.name_ar,
        email: 'ahmed.ibrahim@pzone-egypt.com',
        stakeholder_kind: 'employee',
        is_active: true,
      });

      const resolved = await ensureLocalStakeholderForAssignment(sampleHrEmployee, dbClient as any);
      const localId = extractStakeholderId(resolved);

      expect(localId).toBe(sampleHrEmployee.id);
      expect(mockDbState.stakeholderInsertCalls).toBe(0);
      expect(mockDbState.stakeholders.size).toBe(1);
    });

    it('SYNC-02 (b): deduplicates by case-insensitive email match and returns existing local stakeholder ID', async () => {
      const preExistingLocalUuid = '99999999-9999-4999-8999-999999999999';
      mockDbState.stakeholders.set(preExistingLocalUuid, {
        id: preExistingLocalUuid,
        name_ar: 'أحمد إبراهيم',
        email: 'ahmed.ibrahim@pzone-egypt.com',
        stakeholder_kind: 'employee',
        is_active: true,
      });

      const resolved = await ensureLocalStakeholderForAssignment(sampleHrEmployee, dbClient as any);
      const localId = extractStakeholderId(resolved);

      expect(localId).toBe(preExistingLocalUuid);
      expect(mockDbState.stakeholderInsertCalls).toBe(0);
      expect(mockDbState.stakeholders.size).toBe(1);
    });

    it('SYNC-03 (c): auto-inserts missing HR employee into local stakeholders so addProjectStakeholder passes FK check', async () => {
      // Without syncing first, direct project assignment fails with PostgreSQL FK violation 23503
      await expect(
        ProjectService.addProjectStakeholder({
          project_id: TARGET_PROJECT_ID,
          stakeholder_id: sampleHrEmployee.id,
          project_role: sampleHrEmployee.job_title ?? undefined,
          raci_role: 'responsible',
          party_kind: 'employee',
        })
      ).rejects.toThrow(/23503|project_stakeholders_stakeholder_id_fkey/);

      // Sync via ensureLocalStakeholderForAssignment, then assign to project
      const resolved = await ensureLocalStakeholderForAssignment(sampleHrEmployee, dbClient as any);
      const localId = extractStakeholderId(resolved);

      expect(localId).toBe(sampleHrEmployee.id);
      expect(mockDbState.stakeholders.has(sampleHrEmployee.id)).toBe(true);
      expect(mockDbState.stakeholders.get(sampleHrEmployee.id)?.name_ar).toBe('م. أحمد إبراهيم');

      const assignment = await ProjectService.addProjectStakeholder({
        project_id: TARGET_PROJECT_ID,
        stakeholder_id: localId,
        project_role: sampleHrEmployee.job_title ?? undefined,
        raci_role: 'responsible',
        party_kind: 'employee',
      });

      expect(assignment.project_id).toBe(TARGET_PROJECT_ID);
      expect(assignment.stakeholder_id).toBe(sampleHrEmployee.id);
      expect(assignment.raci_role).toBe('responsible');
    });

    it('SYNC-04 (d): recovers from concurrent 23505 email unique-constraint race by re-selecting winning row', async () => {
      const concurrentWinnerId = '77777777-7777-4777-8777-777777777777';
      mockDbState.simulateRaceConflictOnce = {
        winnerRow: {
          id: concurrentWinnerId,
          name_ar: sampleHrEmployee.name_ar,
          email: 'ahmed.ibrahim@pzone-egypt.com',
          stakeholder_kind: 'employee',
          is_active: true,
        },
      };

      const resolved = await ensureLocalStakeholderForAssignment(sampleHrEmployee, dbClient as any);
      const localId = extractStakeholderId(resolved);

      expect(localId).toBe(concurrentWinnerId);
      expect(mockDbState.stakeholderInsertCalls).toBe(1);
    });
  });

  describe('2. Single-Accountable RACI Invariant Enforcement (e)', () => {
    it('SYNC-05 (e): allows one Accountable stakeholder per project and rejects a second Accountable assignment', async () => {
      const firstId = extractStakeholderId(
        await ensureLocalStakeholderForAssignment(sampleHrEmployee, dbClient as any)
      );

      const firstAssigned = await ProjectService.addProjectStakeholder({
        project_id: TARGET_PROJECT_ID,
        stakeholder_id: firstId,
        project_role: 'Project Manager',
        raci_role: 'accountable',
        party_kind: 'employee',
      });
      expect(firstAssigned.raci_role).toBe('accountable');

      const secondEmployee: StakeholderFull & { is_hr_employee: true } = {
        ...sampleHrEmployee,
        id: 'b1ffcd88-8d1c-4fe9-cc7e-7cc8ce491b22',
        name_ar: 'م. محمود حسن',
        name_en: 'Mahmoud Hassan',
        email: 'mahmoud.hassan@pzone-egypt.com',
        employee_code: 'EMP-0199',
      };
      const secondId = extractStakeholderId(
        await ensureLocalStakeholderForAssignment(secondEmployee, dbClient as any)
      );

      await expect(
        ProjectService.addProjectStakeholder({
          project_id: TARGET_PROJECT_ID,
          stakeholder_id: secondId,
          project_role: 'Project Director',
          raci_role: 'accountable',
          party_kind: 'employee',
        })
      ).rejects.toThrow('لا يمكن تعيين أكثر من مسؤول رئيسي (Accountable) واحد للمشروع');

      expect(mockDbState.projectStakeholders).toHaveLength(1);

      // Assigning second employee as 'responsible' on the same project succeeds
      const responsibleAssigned = await ProjectService.addProjectStakeholder({
        project_id: TARGET_PROJECT_ID,
        stakeholder_id: secondId,
        project_role: 'Senior Engineer',
        raci_role: 'responsible',
        party_kind: 'employee',
      });
      expect(responsibleAssigned.raci_role).toBe('responsible');
      expect(mockDbState.projectStakeholders).toHaveLength(2);
    });
  });
});
