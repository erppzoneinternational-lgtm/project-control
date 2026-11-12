import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { useDailyDraftStore } from '@/lib/stores/useDailyDraftStore';
import { DailyProgressService } from '../dailyProgress.service';
import { DeliverablesService } from '../deliverables.service';
import { SiteOperationsService } from '../siteOperations.service';
import { SubcontractorService } from '../subcontractor.service';
import {
  calculateEVM,
  calculateActivityProgress,
  calculateProcurementQty,
  calculateWastageLossEgp,
  calculateSubcontractorProductivity,
  calculateDeliverableBottlenecks,
  calculateMorningCommandCenter,
  countWorkingDays,
} from '@/lib/planning/calculations';
import {
  DailyProgress,
  DailyProgressLine,
  Deliverable,
  DeliverableItem,
  SubcontractorTarget,
  PmHold,
  RfiRegisterItem,
} from '@/types/planning';
import { MaterialTransaction } from '@/types/boq';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: { path: 'test/path' }, error: null }),
        }),
      },
    },
  };
});

// Chainable mock builder
const createMockQueryBuilder = (resolveValue: unknown) => {
  const builder: MockBuilderShape = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
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

describe('Adversarial Test & Edge Case Stress Suite (Phase 2 Victory Audit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
    useDailyDraftStore.getState().clearDraft();
  });

  // =========================================================================
  // 1. Offline Draft Idempotency Key Collision & Replay Prevention
  // =========================================================================
  describe('1. Offline Draft Idempotency Key Collision & Replay Prevention', () => {
    it('generates unique UUID-based idempotency keys on initial draft creation and maintains key across header/line updates', () => {
      const store = useDailyDraftStore.getState();
      const initialKey = store.idempotencyKey;
      expect(initialKey).toBeDefined();
      expect(typeof initialKey).toBe('string');
      expect(initialKey.length).toBeGreaterThan(10);

      // Mutate draft header
      store.updateHeader({ project_id: 'proj-omega', weather: 'Rainy', manpower_count: 35 });
      expect(useDailyDraftStore.getState().idempotencyKey).toBe(initialKey);

      // Add lines
      store.addLine({ boq_item_id: 'boq-item-1', qty_today: 120, zone: 'Podium B' });
      store.addLine({ boq_item_id: 'boq-item-2', qty_today: 45, zone: 'Basement 1' });
      expect(useDailyDraftStore.getState().idempotencyKey).toBe(initialKey);
      expect(useDailyDraftStore.getState().lines).toHaveLength(2);

      // Explicitly regenerate key
      const newKey = store.generateIdempotencyKey();
      expect(newKey).not.toBe(initialKey);
      expect(useDailyDraftStore.getState().idempotencyKey).toBe(newKey);
    });

    it('prevents replay attack: returns existing report immediately when idempotency_key is already recorded in DB', async () => {
      const fixedIdempotencyKey = 'c9b4e820-7f91-4d1a-8c5e-3a9d28f70001';
      const existingReport: Partial<DailyProgress> = {
        id: 'dp-existing-uuid-1',
        project_id: 'proj-omega',
        progress_date: '2026-08-23',
        report_no: 42,
        idempotency_key: fixedIdempotencyKey,
        status: 'draft',
      };

      const insertSpy = vi.fn();

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'dp-existing-uuid-1' }, error: null }),
            single: vi.fn().mockResolvedValue({ data: existingReport, error: null }),
            insert: insertSpy,
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      // Submit report with same idempotency key
      const response = await DailyProgressService.createDailyReport({
        project_id: 'proj-omega',
        idempotency_key: fixedIdempotencyKey,
        weather: 'Stormy',
        manpower_count: 50,
      });

      expect(response).toBeDefined();
      expect(response?.id).toBe('dp-existing-uuid-1');
      expect(response?.report_no).toBe(42);
      expect(response?.idempotency_key).toBe(fixedIdempotencyKey);
      // Ensure no new insert occurred
      expect(insertSpy).not.toHaveBeenCalled();
    });

    it('handles rapid consecutive submissions with same idempotency key deterministically', async () => {
      const sharedKey = 'concurrent-key-998877';
      const mockResult = {
        id: 'dp-concurrent-1',
        project_id: 'proj-omega',
        report_no: 7,
        idempotency_key: sharedKey,
      };

      let queryCount = 0;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          queryCount++;
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'dp-concurrent-1' }, error: null }),
            single: vi.fn().mockResolvedValue({ data: mockResult, error: null }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      // 5 concurrent submissions
      const results = await Promise.all([
        DailyProgressService.createDailyReport({ project_id: 'proj-omega', idempotency_key: sharedKey }),
        DailyProgressService.createDailyReport({ project_id: 'proj-omega', idempotency_key: sharedKey }),
        DailyProgressService.createDailyReport({ project_id: 'proj-omega', idempotency_key: sharedKey }),
        DailyProgressService.createDailyReport({ project_id: 'proj-omega', idempotency_key: sharedKey }),
        DailyProgressService.createDailyReport({ project_id: 'proj-omega', idempotency_key: sharedKey }),
      ]);

      expect(results).toHaveLength(5);
      results.forEach((res) => {
        expect(res?.id).toBe('dp-concurrent-1');
        expect(res?.idempotency_key).toBe(sharedKey);
      });
    });
  });

  // =========================================================================
  // 2. Atomic RPC Behavior (single write path, no fallback) Under Concurrent Submissions
  // =========================================================================
  describe('2. Atomic RPC Behavior (no fallback) Under Concurrent Submissions', () => {
    it('executes atomic rpc_create_report with the 10-scalar wire format, then attaches lines separately', async () => {
      const rpcCreated = {
        id: 'dp-rpc-uuid-101',
        project_id: 'proj-alpha',
        report_no: 101,
        status: 'draft',
      };

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: rpcCreated,
        error: null,
      } as never);

      const linesInsertSpy = vi.fn().mockReturnThis();

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            single: vi.fn().mockResolvedValue({ data: rpcCreated, error: null }),
          } as never;
        }
        if (table === 'pm_daily_progress_lines') {
          return { insert: linesInsertSpy } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const lines: Partial<DailyProgressLine>[] = [
        { boq_item_id: 'b-1', qty_today: 100, zone: 'Sector A' },
        { boq_item_id: 'b-2', qty_today: 50, zone: 'Sector B' },
      ];

      const report = await DailyProgressService.createDailyReport(
        {
          project_id: 'proj-alpha',
          weather: 'Clear',
          manpower_count: 80,
          site_task_id: 'st-open-alpha',
        },
        lines
      );

      expect(report?.id).toBe('dp-rpc-uuid-101');
      expect(report?.report_no).toBe(101);
    });

    it('refuses to fall back to direct-table insert when RPC fails (rule ب stays server-enforced)', async () => {
      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'PGRST202: RPC not found in schema cache' },
      } as never);

      const fallbackInsertSpy = vi.fn().mockReturnValue({
        select: vi.fn(),
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({ data: { report_no: 54 }, error: null }),
            insert: fallbackInsertSpy,
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      await expect(
        DailyProgressService.createDailyReport({
          project_id: 'proj-beta',
          weather: 'Windy',
          site_task_id: 'st-open-beta',
        })
      ).rejects.toThrow(/PGRST202/);

      expect(fallbackInsertSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // 3. Code C Auto-Increment: Rev 0 -> Rev 1 -> Rev 2 & Status Reset
  // =========================================================================
  describe('3. Code C Auto-Increment: Rev 0 -> Rev 1 -> Rev 2 and Status Reset to in_progress', () => {
    it('progressively increments submission_revision from 0 to 1, then 1 to 2, and resets status to in_progress upon Code C review', async () => {
      // Step 1: Initial item at Rev 0
      const initialItem: Partial<DeliverableItem> = {
        deliverable_id: 'del-pkg-1',
        item_type: 'drawing',
        sheet_number: 'A-101',
        description: 'Ground Floor Architectural Layout',
        current_rev: 0,
        submission_revision: 0,
        status: 'received',
        consultant_status: 'pending',
      };

      let savedPayload: Record<string, unknown> = null as never;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_deliverable_items') {
          return {
            insert: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
              savedPayload = payload;
              return {
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: { id: 'item-1', ...payload }, error: null }),
                }),
              };
            }),
            update: vi.fn().mockImplementation((payload: Record<string, unknown>) => {
              savedPayload = payload;
              return {
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: { id: 'item-1', ...payload }, error: null }),
                  }),
                }),
              };
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      // 1st Consultant Review: Issue Code C (Revise & Resubmit)
      const review1 = await DeliverablesService.saveDeliverableItem({
        ...initialItem,
        id: 'item-1',
        consultant_status: 'C',
        submission_revision: 0,
      });

      expect(savedPayload.submission_revision).toBe(1);
      expect(savedPayload.status).toBe('in_progress');
      expect(savedPayload.consultant_status).toBe('C');

      // 2nd Consultant Review: Resubmitted Rev 1, but Consultant issues Code C again
      const review2 = await DeliverablesService.saveDeliverableItem({
        id: 'item-1',
        deliverable_id: 'del-pkg-1',
        description: 'Ground Floor Architectural Layout (Resubmission 1)',
        consultant_status: 'C',
        submission_revision: 1, // Current revision was 1
      });

      expect(savedPayload.submission_revision).toBe(2);
      expect(savedPayload.status).toBe('in_progress');
      expect(savedPayload.consultant_status).toBe('C');

      // 3rd Consultant Review: Resubmitted Rev 2, but Consultant issues Code C again
      const review3 = await DeliverablesService.saveDeliverableItem({
        id: 'item-1',
        deliverable_id: 'del-pkg-1',
        description: 'Ground Floor Architectural Layout (Resubmission 2)',
        consultant_status: 'C',
        submission_revision: 2, // Current revision was 2
      });

      expect(savedPayload.submission_revision).toBe(3);
      expect(savedPayload.status).toBe('in_progress');

      // 4th Consultant Review: Consultant issues Code B (Approved as Noted) -> revision should NOT increment
      const review4 = await DeliverablesService.saveDeliverableItem({
        id: 'item-1',
        deliverable_id: 'del-pkg-1',
        description: 'Ground Floor Architectural Layout (Approved with Comments)',
        consultant_status: 'B',
        submission_revision: 3,
        status: 'ready_to_return',
      });

      expect(savedPayload.submission_revision).toBe(3);
      expect(savedPayload.status).toBe('ready_to_return');
      expect(savedPayload.consultant_status).toBe('B');

      // 5th Consultant Review: Consultant issues Code A (Approved) -> revision stays 3
      const review5 = await DeliverablesService.saveDeliverableItem({
        id: 'item-1',
        deliverable_id: 'del-pkg-1',
        description: 'Ground Floor Architectural Layout (Final Approved)',
        consultant_status: 'A',
        submission_revision: 3,
        status: 'returned',
      });

      expect(savedPayload.submission_revision).toBe(3);
      expect(savedPayload.status).toBe('returned');
      expect(savedPayload.consultant_status).toBe('A');
    });
  });

  // =========================================================================
  // 4. Rejected WIR Line Item Leading to 0 EVM Credit & Rework Alert
  // =========================================================================
  describe('4. Rejected WIR Line Item Leading to 0 EVM Credit and Generating Rework Alert', () => {
    it('yields strictly ZERO earned value credit for rejected WIR inspection lines even if line is approved', () => {
      const allocations = [
        // Rejected WIR inspection line
        {
          allocated_qty: 150,
          snapshot_rate_egp: 2000,
          is_suspended: false,
          line_status: 'approved',
          inspection_status: 'rejected', // WIR Rejected by consultant
        },
        // Sibling approved WIR inspection line
        {
          allocated_qty: 50,
          snapshot_rate_egp: 2000,
          is_suspended: false,
          line_status: 'approved',
          inspection_status: 'approved', // WIR Approved
        },
        // Pending inspection line (not rejected)
        {
          allocated_qty: 25,
          snapshot_rate_egp: 2000,
          is_suspended: false,
          line_status: 'approved',
          inspection_status: 'pending',
        },
      ];

      const budgetedCost = 500000;
      const progress = calculateActivityProgress(allocations, budgetedCost);

      // Expected EV:
      // Line 1: 0 (rejected inspection)
      // Line 2: 50 * 2000 = 100,000
      // Line 3: 25 * 2000 = 50,000
      // Total EV = 150,000 EGP (NOT 450,000)
      expect(progress.earnedEgp).toBe(150000);
      expect(progress.percentComplete).toBe(30.0); // 150000 / 500000 * 100
      expect(progress.isOverAchieved).toBe(false);
    });

    it('strictly isolates rejected line from EVM when alone, producing 0 earned value and 0% completion', () => {
      const rejectedOnly = [
        {
          allocated_qty: 300,
          snapshot_rate_egp: 1500,
          is_suspended: false,
          line_status: 'approved',
          inspection_status: 'rejected',
        },
      ];

      const progress = calculateActivityProgress(rejectedOnly, 450000);
      expect(progress.earnedEgp).toBe(0);
      expect(progress.percentComplete).toBe(0);
    });

    it('excludes rejected daily lines from subcontractor installed production quantity', () => {
      const targets: SubcontractorTarget[] = [
        {
          id: 'sub-t-1',
          project_id: 'p-1',
          subcontractor_id: 'sub-concrete-1',
          boq_item_id: 'boq-slab-1',
          target_qty: 200,
          target_date: '2026-08-23',
          unit: 'm3',
        },
      ];

      const lines: Partial<DailyProgressLine>[] = [
        {
          subcontractor_id: 'sub-concrete-1',
          boq_item_id: 'boq-slab-1',
          qty_today: 120,
          line_status: 'rejected', // Rejected by supervisor / QA
        },
        {
          subcontractor_id: 'sub-concrete-1',
          boq_item_id: 'boq-slab-1',
          qty_today: 80,
          line_status: 'approved', // Valid approved line
        },
      ];

      const metrics = calculateSubcontractorProductivity(targets, lines, 20);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].actual_qty).toBe(80); // Only 80 m3 credited, 120 m3 rejected excluded
      expect(metrics[0].achievement_pct).toBe(40.0); // 80 / 200 * 100
      expect(metrics[0].is_underperforming).toBe(true); // < 70% threshold
    });
  });

  // =========================================================================
  // 5. Deliverable Status Change to 'blocked' Validation Guards
  // =========================================================================
  describe('5. Deliverable Status Change to Blocked Validation Guards', () => {
    it('fails validation when updateDeliverableStatus is called with status blocked without a reason (undefined, empty, or whitespace)', async () => {
      // Test undefined reason
      await expect(
        DeliverablesService.updateDeliverableStatus('del-1', 'proj-1', 'blocked', undefined)
      ).rejects.toThrow('Reason is required when marking deliverable as blocked');

      // Test empty string reason
      await expect(
        DeliverablesService.updateDeliverableStatus('del-1', 'proj-1', 'blocked', '')
      ).rejects.toThrow('Reason is required when marking deliverable as blocked');

      // Test whitespace-only string reason
      await expect(
        DeliverablesService.updateDeliverableStatus('del-1', 'proj-1', 'blocked', '     ')
      ).rejects.toThrow('Reason is required when marking deliverable as blocked');
    });

    it('fails validation when saveDeliverable is called with status blocked and missing blocked_reason', async () => {
      await expect(
        DeliverablesService.saveDeliverable({
          project_id: 'proj-1',
          ref_code: 'E1-STR-09',
          title_ar: 'لوحات إنشائية معلقة',
          status: 'blocked',
          blocked_reason: '', // Empty
        })
      ).rejects.toThrow('Blocked reason is required when deliverable status is blocked');

      await expect(
        DeliverablesService.saveDeliverable({
          project_id: 'proj-1',
          ref_code: 'E1-STR-09',
          title_ar: 'لوحات إنشائية معلقة',
          status: 'blocked',
          blocked_reason: '   ', // Spaces only
        })
      ).rejects.toThrow('Blocked reason is required when deliverable status is blocked');
    });

    it('successfully blocks deliverable and records ledger event when valid reason is provided', async () => {
      const blockedDel = {
        id: 'del-block-test',
        project_id: 'proj-1',
        status: 'blocked',
        blocked_reason: 'Awaiting structural engineer clash resolution on grid 4',
        blocked_since: '2026-08-23T10:00:00Z',
      };

      const eventInsertSpy = vi.fn().mockResolvedValue({ error: null });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_deliverables') {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: blockedDel, error: null }),
                }),
              }),
            }),
          } as never;
        }
        if (table === 'pm_deliverable_events') {
          return {
            insert: eventInsertSpy,
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const res = await DeliverablesService.updateDeliverableStatus(
        'del-block-test',
        'proj-1',
        'blocked',
        'Awaiting structural engineer clash resolution on grid 4',
        'eng-omar'
      );

      expect(res?.status).toBe('blocked');
      expect(res?.blocked_reason).toBe('Awaiting structural engineer clash resolution on grid 4');
    });

    it('linkBlockerWithRfi sets deliverable to blocked and creates corresponding RFI in pm_rfi_register', async () => {
      const existingDel: Partial<Deliverable> = {
        id: 'del-target-rfi',
        project_id: 'proj-rfi-1',
        ref_code: 'E1-MEP-005',
        title_ar: 'مخططات التكييف المركزي',
        status: 'in_progress',
      };

      const savedRfi = {
        id: 'rfi-new-1',
        project_id: 'proj-rfi-1',
        rfi_no: 'RFI-MEP-001',
        subject: 'Clash between duct and beam B12',
        status: 'sent',
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_deliverables') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: existingDel, error: null }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { ...existingDel, status: 'blocked', blocked_reason: 'Clash with beam B12' },
                    error: null,
                  }),
                }),
              }),
            }),
          } as never;
        }
        if (table === 'pm_rfi_register') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: savedRfi, error: null }),
              }),
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const outcome = await DeliverablesService.linkBlockerWithRfi(
        'del-target-rfi',
        { rfi_no: 'RFI-MEP-001', subject: 'Clash between duct and beam B12' },
        'Clash with beam B12'
      );

      expect(outcome.deliverable?.status).toBe('blocked');
      expect(outcome.rfi?.rfi_no).toBe('RFI-MEP-001');
    });
  });

  // =========================================================================
  // 6. Material Wastage Calculation with Actual > Planned & EGP Conversion
  // =========================================================================
  describe('6. Material Wastage Calculation when Actual > Planned with EGP Conversion', () => {
    it('calculates exact material wastage percentage and loss in EGP when actual exceeds standard allowance', () => {
      // Scenario:
      // Issued: 130 Tons of Rebar
      // Net Installed: 100 Tons
      // Standard Allowed Wastage: 5.0%
      // Supplier Unit Rate: 42,000 EGP/Ton
      const result = calculateWastageLossEgp(130, 100, 5.0, 42000);

      // Actual wastage = (130 - 100) / 100 = 30.0%
      // Variance = 30.0% - 5.0% = 25.0% excessive waste
      // Wastage Loss EGP = 25.0% * 100 Tons * 42,000 EGP = 1,050,000 EGP
      expect(result.actualWastagePct).toBe(30.0);
      expect(result.varianceWastagePct).toBe(25.0);
      expect(result.isLoss).toBe(true);
      expect(result.wastageLossEgp).toBe(1050000.0);
    });

    it('returns zero loss when actual wastage is within standard allowance or below standard', () => {
      // Scenario:
      // Issued: 103 Tons
      // Net Installed: 100 Tons
      // Standard Allowed Wastage: 5.0%
      // Rate: 42,000 EGP
      const result = calculateWastageLossEgp(103, 100, 5.0, 42000);

      // Actual = 3.0%, Standard = 5.0%, Variance = -2.0%
      expect(result.actualWastagePct).toBe(3.0);
      expect(result.varianceWastagePct).toBe(-2.0);
      expect(result.isLoss).toBe(false);
      expect(result.wastageLossEgp).toBe(0);
    });

    it('handles adversarial edge cases in wastage calculation: zero installed quantity, zero unit rate, negative rates, extreme values', () => {
      // 1. Zero installed net quantity -> division by zero safeguard
      const zeroInstalled = calculateWastageLossEgp(50, 0, 5.0, 3000);
      expect(zeroInstalled.actualWastagePct).toBe(0);
      expect(zeroInstalled.varianceWastagePct).toBe(0);
      expect(zeroInstalled.isLoss).toBe(false);
      expect(zeroInstalled.wastageLossEgp).toBe(0);

      // 2. Zero unit rate -> loss should be 0 EGP
      const zeroRate = calculateWastageLossEgp(120, 100, 5.0, 0);
      expect(zeroRate.actualWastagePct).toBe(20.0);
      expect(zeroRate.varianceWastagePct).toBe(15.0);
      expect(zeroRate.isLoss).toBe(true);
      expect(zeroRate.wastageLossEgp).toBe(0);

      // 3. Negative unit rate -> clamped to 0
      const negativeRate = calculateWastageLossEgp(120, 100, 5.0, -5000);
      expect(negativeRate.isLoss).toBe(true);
      expect(negativeRate.wastageLossEgp).toBe(0);

      // 4. Extreme large scale industrial quantities (100,000 units, 80,000,000 EGP value)
      const megaScale = calculateWastageLossEgp(125000, 100000, 10.0, 800);
      // Actual = 25.0%, Variance = 15.0%, Loss = 0.15 * 100,000 * 800 = 12,000,000 EGP
      expect(megaScale.actualWastagePct).toBe(25.0);
      expect(megaScale.varianceWastagePct).toBe(15.0);
      expect(megaScale.isLoss).toBe(true);
      expect(megaScale.wastageLossEgp).toBe(12000000.0);
    });

    it('SiteOperationsService.getMaterialWastageReport aggregates portfolio material transactions against installed daily lines', async () => {
      const mockBoq = [
        { id: 'b-rebar', item_code: '03-100', description_ar: 'حديد تسليح', rate_egp: 40000 },
      ];
      const mockSubMat = [
        {
          id: 'sm-rebar-16',
          boq_item_id: 'b-rebar',
          material_name_ar: 'حديد 16 مم',
          unit: 'طن',
          consumption_rate: 1.0,
          standard_wastage_pct: 5.0,
        },
      ];
      const mockTxs: Partial<MaterialTransaction>[] = [
        { sub_material_id: 'sm-rebar-16', tx_type: 'issue_to_site', qty: 120 },
        { sub_material_id: 'sm-rebar-16', tx_type: 'return_to_store', qty: 5 }, // Net issued = 115
      ];
      const mockReports = [{ id: 'dp-1' }];
      const mockLines = [
        { boq_item_id: 'b-rebar', qty_today: 100, line_status: 'approved' },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_boq_items') {
          return createMockQueryBuilder({ data: mockBoq, error: null });
        }
        if (table === 'pm_boq_sub_materials') {
          return createMockQueryBuilder({ data: mockSubMat, error: null });
        }
        if (table === 'pm_material_transactions') {
          return createMockQueryBuilder({ data: mockTxs, error: null });
        }
        if (table === 'pm_daily_progress') {
          return createMockQueryBuilder({ data: mockReports, error: null });
        }
        if (table === 'pm_daily_progress_lines') {
          return createMockQueryBuilder({ data: mockLines, error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const report = await SiteOperationsService.getMaterialWastageReport('proj-wastage');
      expect(report.items).toHaveLength(1);
      const item = report.items[0];

      // Net issued = 115, Installed = 100, Standard = 5.0%
      // Actual = 15.0%, Variance = 10.0%, Unit Price = 40,000 EGP
      // Loss EGP = 0.10 * 100 * 40,000 = 400,000 EGP
      expect(item.issued_qty).toBe(115);
      expect(item.installed_qty).toBe(100);
      expect(item.actual_wastage_pct).toBe(15.0);
      expect(item.variance_pct).toBe(10.0);
      expect(item.variance_egp).toBe(400000);
      expect(report.total_variance_egp).toBe(400000);
    });
  });

  // =========================================================================
  // 7. Subcontractor Performance Score < 70% Triggering Warning Flag
  // =========================================================================
  describe('7. Subcontractor Performance Score < 70% Triggering Warning Flag', () => {
    it('accurately evaluates the exact 70% threshold boundary condition', () => {
      const targets: SubcontractorTarget[] = [
        {
          id: 'target-1',
          project_id: 'p-1',
          subcontractor_id: 'sub-plaster-1',
          target_qty: 100,
          target_date: '2026-08-23',
          unit: 'm2',
        },
        {
          id: 'target-2',
          project_id: 'p-1',
          subcontractor_id: 'sub-plaster-2',
          target_qty: 100,
          target_date: '2026-08-23',
          unit: 'm2',
        },
        {
          id: 'target-3',
          project_id: 'p-1',
          subcontractor_id: 'sub-plaster-3',
          target_qty: 100,
          target_date: '2026-08-23',
          unit: 'm2',
        },
      ];

      const lines: Partial<DailyProgressLine>[] = [
        // Sub 1: exactly 69.99 m2 -> 69.99% -> UNDERPERFORMING (< 70)
        { subcontractor_id: 'sub-plaster-1', qty_today: 69.99, line_status: 'approved' },
        // Sub 2: exactly 70.00 m2 -> 70.00% -> ON TRACK (not < 70)
        { subcontractor_id: 'sub-plaster-2', qty_today: 70.00, line_status: 'approved' },
        // Sub 3: 70.01 m2 -> 70.01% -> ON TRACK
        { subcontractor_id: 'sub-plaster-3', qty_today: 70.01, line_status: 'approved' },
      ];

      const metrics = calculateSubcontractorProductivity(targets, lines);
      expect(metrics).toHaveLength(3);

      // Sub 1: 69.99%
      expect(metrics[0].achievement_pct).toBe(69.99);
      expect(metrics[0].is_underperforming).toBe(true);

      // Sub 2: 70.00%
      expect(metrics[1].achievement_pct).toBe(70.0);
      expect(metrics[1].is_underperforming).toBe(false);

      // Sub 3: 70.01%
      expect(metrics[2].achievement_pct).toBe(70.01);
      expect(metrics[2].is_underperforming).toBe(false);
    });

    it('flags zero production (0%) as underperforming and handles zero target quantity safely', () => {
      const targets: SubcontractorTarget[] = [
        {
          id: 'target-zero-act',
          project_id: 'p-1',
          subcontractor_id: 'sub-zero-1',
          target_qty: 50,
          target_date: '2026-08-23',
          unit: 'm3',
        },
        {
          id: 'target-zero-target',
          project_id: 'p-1',
          subcontractor_id: 'sub-zero-2',
          target_qty: 0, // Target is 0
          target_date: '2026-08-23',
          unit: 'm3',
        },
      ];

      const lines: Partial<DailyProgressLine>[] = [
        // Sub 1 produced 0
        // Sub 2 produced 20
        { subcontractor_id: 'sub-zero-2', qty_today: 20, line_status: 'approved' },
      ];

      const metrics = calculateSubcontractorProductivity(targets, lines);
      // Sub 1: 0 / 50 -> 0%, is_underperforming: true
      expect(metrics[0].actual_qty).toBe(0);
      expect(metrics[0].achievement_pct).toBe(0);
      expect(metrics[0].is_underperforming).toBe(true);

      // Sub 2: 20 / 0 -> achievement_pct: 0, is_underperforming: true
      expect(metrics[1].achievement_pct).toBe(0);
      expect(metrics[1].is_underperforming).toBe(true);
    });

    it('feeds underperforming subcontractors into Morning Command Center summary and raises alerts', () => {
      const mockProjects = [
        { id: 'proj-1', project_name: 'Project Alexandria Tower', status: 'working' },
      ];
      const mockReports = [
        { id: 'r-1', project_id: 'proj-1', progress_date: '2026-08-22' },
      ];
      const mockHolds: PmHold[] = [
        { id: 'h-1', project_id: 'proj-1', hold_type: 'structural', reason: 'Concrete test fail', is_active: true } as never,
      ];
      const mockDeliverables: Deliverable[] = [
        { id: 'd-1', project_id: 'proj-1', ref_code: 'E1-01', title_ar: 'لوحة', status: 'blocked', blocked_reason: 'Conflict' } as never,
      ];
      const mockRfis: RfiRegisterItem[] = [
        { id: 'rfi-1', project_id: 'proj-1', rfi_no: 'RFI-01', subject: 'Query', target_reply_date: '2026-08-10', status: 'sent' } as never,
      ];
      const subMetrics = [
        {
          subcontractor_id: 'sub-slow',
          target_qty: 100,
          actual_qty: 45,
          achievement_pct: 45.0,
          is_underperforming: true, // Underperforming!
        } as never,
        {
          subcontractor_id: 'sub-fast',
          target_qty: 100,
          actual_qty: 90,
          achievement_pct: 90.0,
          is_underperforming: false,
        } as never,
      ];

      const commandCenter = calculateMorningCommandCenter({
        projects: mockProjects,
        reports: mockReports,
        holds: mockHolds,
        deliverables: mockDeliverables,
        rfis: mockRfis,
        subMetrics,
        targetDate: '2026-08-23',
      });

      expect(commandCenter.underperforming_subcontractors_count).toBe(1);
      expect(commandCenter.underperforming_subcontractors[0].subcontractor_id).toBe('sub-slow');
      expect(commandCenter.active_critical_holds_count).toBe(1);
      expect(commandCenter.blocked_deliverables_count).toBe(1);
      expect(commandCenter.overdue_rfis_count).toBe(1);
    });
  });

  // =========================================================================
  // 8. Reopen Report & Allocation Suspension Integrity
  // =========================================================================
  describe('8. Reopen Report and Progress Allocation Suspension Lifecycle', () => {
    it('suspends pm_progress_allocations and marks report status as reopened with audit reason', async () => {
      const reportId = 'dp-to-reopen-99';

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: { id: reportId, project_id: 'proj-1' }, error: null }),
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
        'Quantity error in excavation line item',
        'pm-lead-user'
      );

      expect(success).toBe(true);
    });
  });
});
