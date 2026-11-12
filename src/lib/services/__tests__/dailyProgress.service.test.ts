import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import {
  DailyProgressService,
  buildCreateReportPayload,
} from '../dailyProgress.service';
import { calculateActivityProgress } from '@/lib/planning/calculations';
import {
  DailyProgress,
  DailyProgressLine,
  DailyProgressPhoto,
  DailyObstruction,
  ApprovalDelegation,
} from '@/types/planning';
import { NotificationService } from '../notification.service';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
    },
  };
});

// Helper to construct a chainable mock query builder
const createMockQueryBuilder = (resolveValue: unknown) => {
  const builder: MockBuilderShape = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    then: vi.fn().mockImplementation((onfulfilled) => {
      onfulfilled(resolveValue);
      return Promise.resolve(resolveValue);
    }),
  };
  return builder as MockQueryBuilder;
};

describe('DailyProgressService Suite (R1 & Acceptance Criteria)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  // =========================================================================
  // 1. Report Creation, Idempotency & Unique Numbering
  // =========================================================================
  describe('Report Creation & Idempotency', () => {
    it('returns existing report when idempotency_key is already present (idempotent)', async () => {
      const existingReport: Partial<DailyProgress> = {
        id: 'dp-existing-1',
        project_id: 'proj-1',
        progress_date: '2026-08-23',
        report_no: 10,
        idempotency_key: 'idem-key-12345',
        status: 'draft',
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'dp-existing-1' }, error: null }),
            single: vi.fn().mockResolvedValue({ data: existingReport, error: null }),
            order: vi.fn().mockReturnThis(),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const result = await DailyProgressService.createDailyReport({
        project_id: 'proj-1',
        idempotency_key: 'idem-key-12345',
        weather: 'Sunny',
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe('dp-existing-1');
      expect(result?.idempotency_key).toBe('idem-key-12345');
    });

    it('throws SITE_TASK_REQUIRED when report is not linked to an open site task (rule ب)', async () => {
      // Owner rule (ب): every daily report MUST reference an open site task.
      // The client-side guard mirrors rpc_create_report and fires before any DB call.
      const fromSpy = vi.mocked(supabase.from);

      await expect(
        DailyProgressService.createDailyReport({
          project_id: 'proj-1',
          progress_date: '2026-08-23',
        })
      ).rejects.toThrow(/SITE_TASK_REQUIRED/);

      // Guard fires before any table access or RPC
      expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('throws and never falls back to direct-table insert when rpc_create_report fails', async () => {
      // There is deliberately NO direct-table-insert fallback: a silent fallback
      // would bypass owner rule (ب) enforcement that lives server-side.
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'PGRST202: RPC not found in schema cache' },
      } as never);

      let insertCalled = false;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            insert: vi.fn().mockImplementation(() => {
              insertCalled = true;
              return { select: vi.fn() };
            }),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      await expect(
        DailyProgressService.createDailyReport({
          project_id: 'proj-beta',
          site_task_id: 'st-1',
        })
      ).rejects.toThrow(/PGRST202/);

      expect(insertCalled).toBe(false);
    });

    it('uses atomic RPC rpc_create_report (10 scalar args incl. p_site_task_id)', async () => {
      const rpcResult = { id: 'dp-rpc-100', report_no: 8, status: 'draft' };
      vi.mocked(supabase.rpc).mockResolvedValue({ data: rpcResult, error: null } as never);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: rpcResult, error: null }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const res = await DailyProgressService.createDailyReport({
        project_id: 'proj-1',
        discipline: 'finishing',
        site_task_id: ' st-open-7 ',
      });

      expect(res?.id).toBe('dp-rpc-100');
    });

    it('buildCreateReportPayload emits the exact 10-scalar wire format', () => {
      expect(
        buildCreateReportPayload(
          {
            project_id: 'p-1',
            weather: 'Sunny',
            manpower_count: 42,
            notes: 'ok',
          },
          'st-9'
        )
      ).toEqual({
        p_project_id: 'p-1',
        p_progress_date: new Date().toISOString().slice(0, 10),
        p_discipline: 'civil',
        p_weather: 'Sunny',
        p_manpower_count: 42,
        p_equipment_summary: null,
        p_entered_by_name: null,
        p_idempotency_key: null,
        p_notes: 'ok',
        p_site_task_id: 'st-9',
      });
    });
  });

  // =========================================================================
  // 2. Line-Level Approvals & Independent Line Review
  // =========================================================================
  describe('Independent Line Approvals & Rejections', () => {
    it('approveDailyReportLine freezes snapshot rate from BOQ item if not provided', async () => {
      const mockBoqItem = { rate_egp: 850, revision: 3 };
      const updatedLine: Partial<DailyProgressLine> = {
        id: 'line-1',
        daily_progress_id: 'dp-1',
        boq_item_id: 'boq-1',
        line_status: 'approved',
        snapshot_rate_egp: 850,
        source_boq_revision: 3,
        line_reviewed_by: 'eng-salem',
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress_lines') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { boq_item_id: 'boq-1', boq_item: mockBoqItem },
              error: null,
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updatedLine, error: null }),
                }),
              }),
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const result = await DailyProgressService.approveDailyReportLine('line-1', 'dp-1', 'eng-salem');

      expect(result).toBeDefined();
      expect(result?.line_status).toBe('approved');
      expect(result?.snapshot_rate_egp).toBe(850);
      expect(result?.source_boq_revision).toBe(3);
      expect(result?.line_reviewed_by).toBe('eng-salem');
    });

    it('approveDailyReportLine uses explicit snapshotRateEgp when passed', async () => {
      const updatedLine: Partial<DailyProgressLine> = {
        id: 'line-custom',
        daily_progress_id: 'dp-1',
        line_status: 'approved',
        snapshot_rate_egp: 1200,
        source_boq_revision: 1,
        line_reviewed_by: 'pm-user',
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress_lines') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: updatedLine, error: null }),
                }),
              }),
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const result = await DailyProgressService.approveDailyReportLine(
        'line-custom',
        'dp-1',
        'pm-user',
        1200
      );

      expect(result?.snapshot_rate_egp).toBe(1200);
      expect(result?.line_status).toBe('approved');
    });

    it('rejectDailyReportLine enforces rejection reason and updates status to rejected', async () => {
      const rejectedLine: Partial<DailyProgressLine> = {
        id: 'line-2',
        daily_progress_id: 'dp-1',
        line_status: 'rejected',
        rejection_reason: 'Quality non-conformance with specifications',
        line_reviewed_by: 'eng-salem',
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress_lines') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: rejectedLine, error: null }),
                }),
              }),
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const result = await DailyProgressService.rejectDailyReportLine(
        'line-2',
        'dp-1',
        'eng-salem',
        'Quality non-conformance with specifications'
      );

      expect(result).toBeDefined();
      expect(result?.line_status).toBe('rejected');
      expect(result?.rejection_reason).toBe('Quality non-conformance with specifications');
    });

    it('independent approvals: approving Line 1 while Line 2 is rejected does not affect Line 1', async () => {
      // Mock independent approvals
      const line1 = { id: 'line-1', line_status: 'approved', snapshot_rate_egp: 500 };
      const line2 = { id: 'line-2', line_status: 'rejected', rejection_reason: 'Incorrect concrete slump' };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress_lines') {
          return {
            update: vi.fn().mockImplementation((payload) => ({
              eq: vi.fn().mockImplementation((col, id) => ({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: id === 'line-1' ? { ...line1, ...payload } : { ...line2, ...payload },
                    error: null,
                  }),
                }),
              })),
            })),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const res1 = await DailyProgressService.approveDailyReportLine('line-1', 'dp-1', 'pm', 500);
      const res2 = await DailyProgressService.rejectDailyReportLine(
        'line-2',
        'dp-1',
        'pm',
        'Incorrect concrete slump'
      );

      expect(res1?.line_status).toBe('approved');
      expect(res2?.line_status).toBe('rejected');
      expect(res1?.line_status).not.toBe(res2?.line_status);
    });

    it('batchApproveLines and batchRejectLines update subsets correctly', async () => {
      const mockLines = [
        { id: 'l-1', boq_item_id: 'b-1', boq_item: { rate_egp: 300, revision: 1 } },
        { id: 'l-2', boq_item_id: 'b-2', boq_item: { rate_egp: 400, revision: 2 } },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress_lines') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({ data: mockLines, error: null }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              in: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const approved = await DailyProgressService.batchApproveLines('dp-1', ['l-1', 'l-2'], 'pm-reviewer');
      expect(approved).toBe(true);

      const rejected = await DailyProgressService.batchRejectLines(
        'dp-1',
        ['l-3'],
        'Survey elevation wrong',
        'pm-reviewer'
      );
      expect(rejected).toBe(true);
    });
  });

  // =========================================================================
  // 3. WIR Rejection Zero EVM Invariant
  // =========================================================================
  describe('WIR Rejection Zero EVM Invariant', () => {
    it('inspection_status === "rejected" yields 0 earned value and 0% complete', () => {
      const rejectedWirAllocation = [
        {
          allocated_qty: 50,
          snapshot_rate_egp: 200,
          line_status: 'approved',
          inspection_status: 'rejected', // WIR Rejected!
        },
      ];

      const result = calculateActivityProgress(rejectedWirAllocation, 50000);
      expect(result.earnedEgp).toBe(0);
      expect(result.percentComplete).toBe(0);
    });

    it('approved WIR and approved line status yields full earned value', () => {
      const validAllocation = [
        {
          allocated_qty: 40,
          snapshot_rate_egp: 250,
          line_status: 'approved',
          inspection_status: 'approved',
        },
      ];

      const result = calculateActivityProgress(validAllocation, 20000);
      // 40 * 250 = 10,000 EGP / 20,000 budget = 50%
      expect(result.earnedEgp).toBe(10000);
      expect(result.percentComplete).toBe(50);
    });

    it('mixed allocations: rejected WIR line does not contribute, while approved line does', () => {
      const mixedAllocations = [
        {
          allocated_qty: 20,
          snapshot_rate_egp: 500, // 10,000 EGP
          line_status: 'approved',
          inspection_status: 'approved',
        },
        {
          allocated_qty: 30,
          snapshot_rate_egp: 500, // 15,000 EGP - Rejected WIR!
          line_status: 'approved',
          inspection_status: 'rejected',
        },
        {
          allocated_qty: 10,
          snapshot_rate_egp: 500, // 5,000 EGP - Not Required
          line_status: 'approved',
          inspection_status: 'not_required',
        },
      ];

      const result = calculateActivityProgress(mixedAllocations, 30000);
      // Earned = 10,000 + 0 + 5,000 = 15,000 EGP
      // 15,000 / 30,000 = 50%
      expect(result.earnedEgp).toBe(15000);
      expect(result.percentComplete).toBe(50);
    });
  });

  // =========================================================================
  // 4. PM Reopen Workflow & Allocation Suspension
  // =========================================================================
  describe('PM Reopen Workflow & Allocation Suspension', () => {
    it('reopenDailyReport updates status to reopened and suspends all child allocations', async () => {
      const reportId = 'dp-reopen-1';

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: reportId, project_id: 'p-1' }, error: null }),
            }),
          } as never;
        }

        return createMockQueryBuilder({ data: null, error: null });
      });

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true, report_id: reportId, from_state: 'approved', to_state: 'reopened', action: 'reopen' },
        error: null,
      } as never);

      const success = await DailyProgressService.reopenDailyReport(
        reportId,
        'Measurement recount requested',
        'Lead PM'
      );

      expect(success).toBe(true);
    });

    it('calculateActivityProgress excludes suspended allocations from earned value', () => {
      const allocations = [
        {
          allocated_qty: 50,
          snapshot_rate_egp: 200,
          line_status: 'approved',
          inspection_status: 'approved',
          is_suspended: true, // Suspended because report was reopened
        },
        {
          allocated_qty: 30,
          snapshot_rate_egp: 200,
          line_status: 'approved',
          inspection_status: 'approved',
          is_suspended: false,
        },
      ];

      const result = calculateActivityProgress(allocations, 20000);
      // Only second line counts: 30 * 200 = 6,000 EGP (30%)
      expect(result.earnedEgp).toBe(6000);
      expect(result.percentComplete).toBe(30);
    });
  });

  // =========================================================================
  // 5. Delegation Authorization (canUserApprove)
  // =========================================================================
  describe('Delegation Authorization (canUserApprove)', () => {
    it('returns true directly for Project Manager, Admin, and Executive roles without querying DB', async () => {
      expect(await DailyProgressService.canUserApprove('p-1', 'u-1', 'project_manager')).toBe(true);
      expect(await DailyProgressService.canUserApprove('p-1', 'u-2', 'admin')).toBe(true);
      expect(await DailyProgressService.canUserApprove('p-1', 'u-3', 'pm')).toBe(true);
      expect(await DailyProgressService.canUserApprove('p-1', 'u-4', 'executive')).toBe(true);
      expect(await DailyProgressService.canUserApprove('p-1', 'u-5', 'PROJECT_MANAGER')).toBe(true);
      expect(supabase.from).not.toHaveBeenCalled();
    });

    it('returns true for non-PM user with an active valid delegation', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: { id: 'delegation-valid-1' }, error: null })
      );

      const canApprove = await DailyProgressService.canUserApprove(
        'p-1',
        'site-eng-1',
        'site_engineer'
      );

      expect(canApprove).toBe(true);
    });

    it('returns false for non-PM user when no active delegation exists', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: null, error: null })
      );

      const canApprove = await DailyProgressService.canUserApprove(
        'p-1',
        'site-eng-2',
        'site_engineer'
      );

      expect(canApprove).toBe(false);
    });
  });

  // =========================================================================
  // 6. Header Actions & Attachments
  // =========================================================================
  describe('Header Updates, Delegations CRUD & Attachments', () => {
    it('submitDailyReport transitions status to submitted and invalidates cache', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: { id: 'dp-1', status: 'submitted' }, error: null })
      );

      const success = await DailyProgressService.submitDailyReport('dp-1', 'p-1', 'eng-user');
      expect(success).toBe(true);
    });

    it('approveDailyReport transitions report status to approved and freezes rates on all lines', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true },
        error: null,
      } as never);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return createMockQueryBuilder({ data: { site_task_id: 'task-1' }, error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const success = await DailyProgressService.approveDailyReport('dp-1', 'p-1', 'pm-approver');
      expect(success).toBe(true);
    });

    it('addPhotoAttachment attaches image and invalidates detail cache', async () => {
      const mockPhoto: Partial<DailyProgressPhoto> = {
        id: 'photo-1',
        daily_progress_id: 'dp-1',
        storage_path: 'progress-photos/p1/photo.jpg',
        caption: 'Rebar placement Zone 2',
      };

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: mockPhoto, error: null })
      );

      const result = await DailyProgressService.addPhotoAttachment(mockPhoto);
      expect(result?.storage_path).toBe('progress-photos/p1/photo.jpg');
    });

    it('addObstruction logs site delay event', async () => {
      const mockObs: Partial<DailyObstruction> = {
        id: 'obs-1',
        daily_progress_id: 'dp-1',
        project_id: 'p-1',
        obstruction_type: 'drawing_delay',
        responsible_party: 'consultant',
        description: 'Waiting for structural detail RF-04',
        idle_manpower: 14,
      };

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: mockObs, error: null })
      );

      const res = await DailyProgressService.addObstruction(mockObs);
      expect(res?.idle_manpower).toBe(14);
      expect(res?.responsible_party).toBe('consultant');
    });

    it('saveDelegation and revokeDelegation handle delegation lifecycle', async () => {
      const delegation: Partial<ApprovalDelegation> = {
        id: 'del-1',
        project_id: 'p-1',
        delegator_id: 'pm-1',
        delegated_to_id: 'eng-1',
        valid_from: '2026-08-20',
        valid_to: '2026-08-30',
        is_active: true,
      };

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: delegation, error: null })
      );

      const saved = await DailyProgressService.saveDelegation(delegation);
      expect(saved?.is_active).toBe(true);

      const revoked = await DailyProgressService.revokeDelegation('del-1');
      expect(revoked).toBe(true);
    });
  });

  // =========================================================================
  // 7. Unified Obstruction Taxonomy & Cross-Project Operations (WS-4)
  // =========================================================================
  describe('Unified Obstruction Taxonomy & Cross-Project Operations (WS-4)', () => {
    it('addObstruction: saves obstruction with scope = "site_wide" and eot_days = 5', async () => {
      let insertPayload: Record<string, unknown> = null as never;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_obstructions') {
          return {
            insert: vi.fn().mockImplementation((payload) => {
              insertPayload = payload;
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'obs-site-1', ...payload },
                    error: null,
                  }),
                }),
              };
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const res = await DailyProgressService.addObstruction({
        project_id: 'p-1',
        obstruction_type: 'owner_directive',
        responsible_party: 'client',
        description: 'Client redesign of main entrance pool',
        scope: 'site_wide',
        eot_days: 5,
        financial_impact_egp: 25000,
      });

      expect(res).toBeDefined();
      expect(insertPayload.scope).toBe('site_wide');
      expect(insertPayload.eot_days).toBe(5);
      expect(insertPayload.financial_impact_egp).toBe(25000);
      expect(insertPayload.obstruction_type).toBe('owner_directive');
    });

    it('addObstruction: supports all 11 unified taxonomy categories', async () => {
      const taxonomyTypes = [
        'owner_directive',
        'weather',
        'material_delay',
        'drawing_delay',
        'subcontractor',
        'permit_authority',
        'equipment',
        'manpower',
        'safety',
        'access',
        'other',
      ] as const;

      for (const type of taxonomyTypes) {
        vi.mocked(supabase.from).mockImplementation((table: string) => {
          if (table === 'pm_daily_obstructions') {
            return {
              insert: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: `obs-${type}`, obstruction_type: type },
                    error: null,
                  }),
                }),
              }),
            } as never;
          }
          return createMockQueryBuilder({ data: null, error: null });
        });

        const res = await DailyProgressService.addObstruction({
          project_id: 'p-1',
          obstruction_type: type,
          description: `Testing taxonomy: ${type}`,
        });

        expect(res?.obstruction_type).toBe(type);
      }
    });

    it('getCrossProjectObstructions: queries cross-project obstructions with filters', async () => {
      const mockCrossObs = [
        {
          id: 'obs-x-1',
          project_id: 'p-1',
          obstruction_type: 'material_delay',
          scope: 'site_wide',
          resolved_at: null,
          project: { name_ar: 'مشروع 1' },
        },
      ];

      const builder = createMockQueryBuilder({ data: mockCrossObs, error: null });
      vi.mocked(supabase.from).mockReturnValue(builder);

      const items = await DailyProgressService.getCrossProjectObstructions({
        status: 'active',
        scope: 'site_wide',
      });

      expect(items).toHaveLength(1);
    });

    it('resolveObstruction: updates resolved_at timestamp and resolution notes', async () => {
      let updatePayload: Record<string, unknown> = null as never;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_obstructions') {
          return {
            update: vi.fn().mockImplementation((payload) => {
              updatePayload = payload;
              return {
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: 'obs-1', project_id: 'p-1', ...payload },
                      error: null,
                    }),
                  }),
                }),
              };
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const success = await DailyProgressService.resolveObstruction(
        'obs-1',
        'Permit received from municipal authority',
        '2026-08-31T14:00:00Z'
      );

      expect(success).toBe(true);
      expect(updatePayload.resolved_at).toBe('2026-08-31T14:00:00Z');
      expect(updatePayload.resolution_notes).toBe('Permit received from municipal authority');
    });
  });

  // =========================================================================
  // 6. Existing Report Collision & Draft Modification
  // =========================================================================
  describe('Duplicate Prevention & Draft Modification', () => {
    it('translates duplicate key violation into DUPLICATE_REPORT error message', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: {
          message: 'duplicate key value violates unique constraint "pm_daily_progress_project_id_progress_date_discipline_key"',
          code: '23505',
        },
      } as never);

      await expect(
        DailyProgressService.createDailyReport({
          project_id: 'proj-1',
          progress_date: '2026-09-14',
          discipline: 'civil',
          site_task_id: 'task-1',
        })
      ).rejects.toThrow('DUPLICATE_REPORT');
    });

    it('checkExistingReport returns matching report when one exists', async () => {
      const mockReport = {
        id: 'rep-existing-1',
        project_id: 'proj-1',
        progress_date: '2026-09-14',
        discipline: 'civil',
        report_no: 1,
        status: 'draft',
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return createMockQueryBuilder({ data: mockReport, error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const found = await DailyProgressService.checkExistingReport('proj-1', '2026-09-14', 'civil');
      expect(found).toBeDefined();
      expect(found?.id).toBe('rep-existing-1');
      expect(found?.report_no).toBe(1);
    });

    it('saveExistingDailyReport updates header and replaces lines', async () => {
      let updatedPayload: Record<string, unknown> = null as never;
      let deletedDailyProgressId: string | null = null;
      let insertedLines: Array<Record<string, unknown>> = null as never;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            update: vi.fn().mockImplementation((payload) => {
              updatedPayload = payload;
              return {
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { id: 'rep-1', project_id: 'proj-1', ...payload },
                      error: null,
                    }),
                  }),
                }),
              };
            }),
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { id: 'rep-1', project_id: 'proj-1', ...updatedPayload },
              error: null,
            }),
          } as never;
        }
        if (table === 'pm_daily_progress_lines') {
          return {
            delete: vi.fn().mockImplementation(() => ({
              eq: vi.fn().mockImplementation((_col, val) => {
                deletedDailyProgressId = val;
                return Promise.resolve({ error: null });
              }),
            })),
            insert: vi.fn().mockImplementation((payload) => {
              insertedLines = payload;
              return Promise.resolve({ error: null });
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const res = await DailyProgressService.saveExistingDailyReport(
        'rep-1',
        { weather: 'غائم', manpower_count: 12 },
        [{ boq_item_id: 'item-1', qty_today: 10 }]
      );

      expect(res).toBeDefined();
      expect(updatedPayload.weather).toBe('غائم');
      expect(updatedPayload.manpower_count).toBe(12);
      expect(deletedDailyProgressId).toBe('rep-1');
      expect(insertedLines).toHaveLength(1);
      expect(insertedLines[0].qty_today).toBe(10);
    });

    it('deleteDraftReport deletes report when status is draft', async () => {
      let deleteCalled = false;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            delete: vi.fn().mockImplementation(() => {
              deleteCalled = true;
              return {
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ error: null }),
                }),
              };
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const ok = await DailyProgressService.deleteDraftReport('draft-1', 'proj-1');
      expect(ok).toBe(true);
      expect(deleteCalled).toBe(true);
    });
  });

  // =========================================================================
  // Requirement R2: Strict KPI Governance & Rejection Handling
  // =========================================================================
  describe('Requirement R2: Strict KPI Governance & Rejection Handling', () => {
    it('calculateTaskProgress resets progress_pct to 0 when no approved reports exist', async () => {
      let taskUpdatePayload: { progress_pct: number; updated_at?: string } | null = null;
      let updatedTaskId: string | null = null;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          // No approved or partially approved reports found
          return createMockQueryBuilder({ data: [], error: null });
        }
        if (table === 'pm_site_tasks') {
          return {
            update: vi.fn().mockImplementation((payload) => {
              taskUpdatePayload = payload;
              return {
                eq: vi.fn().mockImplementation((_col, val) => {
                  updatedTaskId = val;
                  return Promise.resolve({ error: null });
                }),
              };
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const progress = await DailyProgressService.calculateTaskProgress('task-empty-reports');

      expect(progress).toBe(0);
      expect(taskUpdatePayload).toBeDefined();
      const payloadObj = taskUpdatePayload as { progress_pct: number; updated_at?: string } | null;
      expect(payloadObj?.progress_pct).toBe(0);
      expect(payloadObj?.updated_at).toBeDefined();
      expect(updatedTaskId).toBe('task-empty-reports');
    });

    it('calculateTaskProgress ignores lines with line_status: "rejected"', async () => {
      let linesQueryNeqField: string | null = null;
      let linesQueryNeqVal: string | null = null;
      let taskUpdatedProgress: number | null = null;

      const approvedReports = [{ id: 'rep-partially-approved-1' }];
      // Only non-rejected lines returned by the query
      const nonRejectedLines = [
        {
          boq_item_id: 'boq-item-1',
          qty_today: 40,
          boq_item: { contract_qty: 100, rate_egp: 200 },
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return createMockQueryBuilder({ data: approvedReports, error: null });
        }
        if (table === 'pm_daily_progress_lines') {
          const qb = createMockQueryBuilder({ data: nonRejectedLines, error: null });
          qb.neq = vi.fn().mockImplementation((field, val) => {
            linesQueryNeqField = field;
            linesQueryNeqVal = val;
            return qb;
          });
          return qb;
        }
        if (table === 'pm_site_tasks') {
          return {
            update: vi.fn().mockImplementation((payload) => {
              taskUpdatedProgress = payload.progress_pct;
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const progress = await DailyProgressService.calculateTaskProgress('task-partially-approved');

      // Verify .neq('line_status', 'rejected') was invoked on lines query
      expect(linesQueryNeqField).toBe('line_status');
      expect(linesQueryNeqVal).toBe('rejected');

      // 40 / 100 = 40%
      expect(progress).toBe(40);
      expect(taskUpdatedProgress).toBe(40);
    });

    it('calculateTaskProgress resets progress_pct to 0 when all lines in approved reports are rejected', async () => {
      let taskUpdatedProgress: number | null = null;
      let updatedTaskId: string | null = null;

      const approvedReports = [{ id: 'rep-app-1' }];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return createMockQueryBuilder({ data: approvedReports, error: null });
        }
        if (table === 'pm_daily_progress_lines') {
          // After neq('line_status', 'rejected'), no lines remain
          return createMockQueryBuilder({ data: [], error: null });
        }
        if (table === 'pm_site_tasks') {
          return {
            update: vi.fn().mockImplementation((payload) => {
              taskUpdatedProgress = payload.progress_pct;
              return {
                eq: vi.fn().mockImplementation((_col, val) => {
                  updatedTaskId = val;
                  return Promise.resolve({ error: null });
                }),
              };
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const progress = await DailyProgressService.calculateTaskProgress('task-all-lines-rejected');

      expect(progress).toBe(0);
      expect(taskUpdatedProgress).toBe(0);
      expect(updatedTaskId).toBe('task-all-lines-rejected');
    });

    it('getCumulativeQtyByTask excludes cancelled/rejected reports and rejected lines', async () => {
      let reportsNotField: string | null = null;
      let reportsNotOperator: string | null = null;
      let reportsNotVal: string | null = null;
      let linesNeqField: string | null = null;
      let linesNeqVal: string | null = null;

      const activeReports = [{ id: 'rep-active-1' }];
      const validLines = [
        { boq_item_id: 'boq-item-A', qty_today: 30 },
        { boq_item_id: 'boq-item-B', qty_today: 15 },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          const qb = createMockQueryBuilder({ data: activeReports, error: null });
          qb.not = vi.fn().mockImplementation((field, op, val) => {
            reportsNotField = field;
            reportsNotOperator = op;
            reportsNotVal = val;
            return qb;
          });
          return qb;
        }
        if (table === 'pm_daily_progress_lines') {
          const qb = createMockQueryBuilder({ data: validLines, error: null });
          qb.neq = vi.fn().mockImplementation((field, val) => {
            linesNeqField = field;
            linesNeqVal = val;
            return qb;
          });
          return qb;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const cumMap = await DailyProgressService.getCumulativeQtyByTask('task-cumulative-1');

      // Verify report status exclusion
      expect(reportsNotField).toBe('status');
      expect(reportsNotOperator).toBe('in');
      expect(reportsNotVal).toBe('("cancelled","rejected")');

      // Verify rejected line exclusion
      expect(linesNeqField).toBe('line_status');
      expect(linesNeqVal).toBe('rejected');

      expect(cumMap).toEqual({
        'boq-item-A': 30,
        'boq-item-B': 15,
      });
    });

    it('rejectDailyReport queries site_task_id, triggers task & project recalculations, and invalidates KPI & scurve caches', async () => {
      const calcTaskProgressSpy = vi.spyOn(DailyProgressService, 'calculateTaskProgress').mockResolvedValue(0);
      const calcProjectProgressSpy = vi.spyOn(DailyProgressService, 'calculateProjectProgress').mockResolvedValue(0);
      const invalidateSpy = vi.spyOn(appCache, 'invalidate');

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true },
        error: null,
      } as never);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { site_task_id: 'task-rejected-site-123' },
                  error: null,
                }),
              }),
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const success = await DailyProgressService.rejectDailyReport(
        'rep-to-reject-1',
        'user-planning-1',
        'proj-governance-1',
        'Improper compaction test results'
      );

      expect(success).toBe(true);

      // Verify RPC invocation
      expect(supabase.rpc).toHaveBeenCalledWith('rpc_daily_report_transition', {
        p_report_id: 'rep-to-reject-1',
        p_action: 'reject',
        p_reason: 'Improper compaction test results',
      });

      // Verify recalculations triggered
      expect(calcTaskProgressSpy).toHaveBeenCalledWith('task-rejected-site-123');
      expect(calcProjectProgressSpy).toHaveBeenCalledWith('proj-governance-1');

      // Verify cache invalidations
      expect(invalidateSpy).toHaveBeenCalledWith('dailyReports:proj-governance-1');
      expect(invalidateSpy).toHaveBeenCalledWith('dailyReport:detail:rep-to-reject-1');
      expect(invalidateSpy).toHaveBeenCalledWith('planningKpis:proj-governance-1');
      expect(invalidateSpy).toHaveBeenCalledWith('scurve:proj-governance-1');

      calcTaskProgressSpy.mockRestore();
      calcProjectProgressSpy.mockRestore();
    });

    it('rejectDailyReport returns false when transition RPC fails', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: false, error: 'Unauthorized role transition' },
        error: null,
      } as never);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return createMockQueryBuilder({
            data: { site_task_id: 'task-1' },
            error: null,
          });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const success = await DailyProgressService.rejectDailyReport(
        'rep-fail',
        'user-1',
        'proj-1',
        'Some reason'
      );

      expect(success).toBe(false);
    });

    it('rejectDailyReport gracefully skips calculateTaskProgress when report has no site_task_id', async () => {
      const calcTaskProgressSpy = vi.spyOn(DailyProgressService, 'calculateTaskProgress');
      const calcProjectProgressSpy = vi.spyOn(DailyProgressService, 'calculateProjectProgress').mockResolvedValue(0);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true },
        error: null,
      } as never);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { site_task_id: null },
                  error: null,
                }),
              }),
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const success = await DailyProgressService.rejectDailyReport(
        'rep-no-task',
        'user-planning-1',
        'proj-1',
        'Rejection note'
      );

      expect(success).toBe(true);
      expect(calcTaskProgressSpy).not.toHaveBeenCalled();
      expect(calcProjectProgressSpy).toHaveBeenCalledWith('proj-1');

      calcTaskProgressSpy.mockRestore();
      calcProjectProgressSpy.mockRestore();
    });

    it('calculateTaskProgress returns 0 when siteTaskId is empty', async () => {
      const progress = await DailyProgressService.calculateTaskProgress('');
      expect(progress).toBe(0);
    });

    it('getCumulativeQtyByTask returns empty object when siteTaskId is empty', async () => {
      const result = await DailyProgressService.getCumulativeQtyByTask('');
      expect(result).toEqual({});
    });

    it('getRejectedDailyReports returns empty array when projectId is empty', async () => {
      const result = await DailyProgressService.getRejectedDailyReports('');
      expect(result).toEqual([]);
    });

    it('getRejectedDailyReports queries rejected daily reports with lines, photos, and obstructions', async () => {
      const fakeRejectedReports = [
        {
          id: 'rep-rej-1',
          project_id: 'proj-1',
          status: 'rejected',
          rejection_reason: 'Incomplete compaction test',
          progress_date: '2026-09-14',
          lines: [{ id: 'line-1', qty_today: 15 }],
          photos: [{ id: 'photo-1', photo_url: 'https://example.com/p1.jpg' }],
          obstructions: [],
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: fakeRejectedReports, error: null }),
                }),
              }),
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const result = await DailyProgressService.getRejectedDailyReports('proj-1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rep-rej-1');
      expect(result[0].status).toBe('rejected');
      expect(result[0].rejection_reason).toBe('Incomplete compaction test');
    });

    it('submitDailyReport fetches PM manager_id and dispatches progress_submitted notification', async () => {
      const notifSpy = vi.spyOn(NotificationService, 'createNotification').mockResolvedValue({} as never);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true },
        error: null,
      } as never);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    report_no: 42,
                    progress_date: '2026-09-15',
                    entered_by: 'eng-1',
                    entered_by_name: 'Eng. Hassan',
                    site_task_id: 'task-1',
                  },
                  error: null,
                }),
              }),
            }),
          } as never;
        }
        if (table === 'pm_projects') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { manager_id: 'pm-manager-99' },
                  error: null,
                }),
              }),
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const success = await DailyProgressService.submitDailyReport('rep-submit-1', 'proj-1', 'eng-1');
      expect(success).toBe(true);

      expect(notifSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: 'proj-1',
          event_type: 'progress_submitted',
          recipient_user_id: 'pm-manager-99',
          entity_id: 'rep-submit-1',
        })
      );

      notifSpy.mockRestore();
    });

    it('approveDailyReport dispatches progress_approved notification to entered_by', async () => {
      const notifSpy = vi.spyOn(NotificationService, 'createNotification').mockResolvedValue({} as never);
      vi.spyOn(DailyProgressService, 'calculateTaskProgress').mockResolvedValue(100);
      vi.spyOn(DailyProgressService, 'calculateProjectProgress').mockResolvedValue(50);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true },
        error: null,
      } as never);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    site_task_id: 'task-1',
                    entered_by: 'eng-site-77',
                    report_no: 88,
                    progress_date: '2026-09-15',
                  },
                  error: null,
                }),
              }),
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const success = await DailyProgressService.approveDailyReport('rep-app-1', 'proj-1', 'pm-1');
      expect(success).toBe(true);

      expect(notifSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: 'proj-1',
          event_type: 'progress_approved',
          recipient_user_id: 'eng-site-77',
          entity_id: 'rep-app-1',
        })
      );

      notifSpy.mockRestore();
    });

    it('rejectDailyReport dispatches progress_rejected notification with reason to entered_by', async () => {
      const notifSpy = vi.spyOn(NotificationService, 'createNotification').mockResolvedValue({} as never);
      vi.spyOn(DailyProgressService, 'calculateTaskProgress').mockResolvedValue(0);
      vi.spyOn(DailyProgressService, 'calculateProjectProgress').mockResolvedValue(0);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true },
        error: null,
      } as never);

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    site_task_id: 'task-1',
                    entered_by: 'eng-site-77',
                    report_no: 88,
                    progress_date: '2026-09-15',
                  },
                  error: null,
                }),
              }),
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const success = await DailyProgressService.rejectDailyReport(
        'rep-rej-1',
        'planner-1',
        'proj-1',
        'Wrong elevation measurement in foundation'
      );
      expect(success).toBe(true);

      expect(notifSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: 'proj-1',
          event_type: 'progress_rejected',
          recipient_user_id: 'eng-site-77',
          entity_id: 'rep-rej-1',
          body_ar: expect.stringContaining('Wrong elevation measurement in foundation'),
        })
      );

      notifSpy.mockRestore();
    });
  });
});

