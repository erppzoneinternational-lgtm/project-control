import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import type { Mock } from 'vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { DailyProgressService } from '../dailyProgress.service';
import { CostControlService } from '../costControl.service';
import { NotificationService } from '../notification.service';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Mock NotificationService
vi.mock('../notification.service', () => ({
  NotificationService: {
    createNotification: vi.fn().mockResolvedValue({ id: 'mock-notif-1' }),
  },
}));

const createMockBuilder = (resolveValue: unknown) => {
  const builder: MockBuilderShape = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
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

describe('PMO Governance & Field Operations Sprint (ADR-0006 through ADR-0011)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  // =========================================================================
  // ADR-0006: Site-Initiated Variation Order Draft Generation
  // =========================================================================
  describe('ADR-0006: Site-Initiated Variation Order Drafts', () => {
    it('creates a draft variation order when over-execution is detected with existing contract', async () => {
      let changeOrderCreated = false;
      (supabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'pm_change_orders') {
          const builder = createMockBuilder({ data: null, error: null });
          builder.insert = vi.fn().mockImplementation(() => {
            changeOrderCreated = true;
            return createMockBuilder({
              data: { id: 'vo-new-1', vo_number: 'VO-PRJ-2026-001', status: 'draft' },
              error: null,
            });
          });
          return builder as MockQueryBuilder;
        }
        return createMockBuilder({ data: null, error: null });
      });

      const success = await DailyProgressService.createVariationOrderDraftFromProgress(
        'prj-001',
        'rep-101',
        5,
        'engineer-1'
      );

      expect(success).toBe(true);
      expect(changeOrderCreated).toBe(true);
      expect(NotificationService.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          project_id: 'prj-001',
          event_type: 'vo_draft_created',
          entity_type: 'daily_progress',
        })
      );
    });

    it('creates variation order draft directly in canonical pm_change_orders', async () => {
      let changeOrderCreated = false;
      (supabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'pm_change_orders') {
          const builder = createMockBuilder({ data: null, error: null });
          builder.insert = vi.fn().mockImplementation(() => {
            changeOrderCreated = true;
            return createMockBuilder({
              data: { id: 'vo-new-2', vo_number: 'VO-PRJ-2026-002', status: 'draft' },
              error: null,
            });
          });
          return builder as MockQueryBuilder;
        }
        return createMockBuilder({ data: null, error: null });
      });

      const success = await DailyProgressService.createVariationOrderDraftFromProgress(
        'prj-002',
        'rep-102',
        6,
        'engineer-2'
      );

      expect(success).toBe(true);
      expect(changeOrderCreated).toBe(true);
    });
  });

  // =========================================================================
  // ADR-0007: Automatic Schedule Actuals & Allocations Synchronization
  // =========================================================================
  describe('ADR-0007: Schedule Actuals & Allocation Auto-Sync', () => {
    it('approves daily line, syncs allocation and updates project activity percent_complete', async () => {
      let activityUpdated = false;
      let snapshotRecalculated = false;

      const mockRecalc = vi.spyOn(CostControlService, 'recalculateAndSaveSnapshot')
        .mockImplementation(async () => {
          snapshotRecalculated = true;
          return null;
        });

      (supabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress_lines') {
          return createMockBuilder({
            data: {
              id: 'line-1',
              report_id: 'rep-1',
              boq_item_id: 'boq-1',
              qty_today: 10,
              line_status: 'approved',
            },
            error: null,
          });
        }
        if (table === 'pm_daily_progress') {
          return createMockBuilder({
            data: { project_id: 'prj-001', site_task_id: 'task-1' },
            error: null,
          });
        }
        if (table === 'pm_site_tasks') {
          return createMockBuilder({
            data: { activity_id: 'act-101' },
            error: null,
          });
        }
        if (table === 'pm_progress_allocations') {
          return createMockBuilder({
            data: [{ allocated_qty: 10 }],
            error: null,
          });
        }
        if (table === 'pm_activity_boq_links') {
          return createMockBuilder({
            data: { planned_qty: 20 },
            error: null,
          });
        }
        if (table === 'pm_project_activities') {
          const builder = createMockBuilder({
            data: { id: 'act-101', percent_complete: 50, status: 'in_progress' },
            error: null,
          });
          builder.update = vi.fn().mockImplementation((payload) => {
            activityUpdated = true;
            expect(payload.percent_complete).toBe(50);
            expect(payload.status).toBe('in_progress');
            return createMockBuilder({ data: null, error: null });
          });
          return builder as MockQueryBuilder;
        }
        return createMockBuilder({ data: null, error: null });
      });

      const res = await DailyProgressService.approveDailyReportLine(
        'line-1',
        'rep-1',
        'approver-user-1',
        1000
      );

      expect(res).toBeDefined();
      expect(activityUpdated).toBe(true);
      expect(snapshotRecalculated).toBe(true);
      mockRecalc.mockRestore();
    });
  });

  // =========================================================================
  // ADR-0010: EVM Recalculation & Snapshot Dual-Trigger Mechanism
  // =========================================================================
  describe('ADR-0010: EVM Snapshot Recalculation Engine', () => {
    it('computes EVM metrics (BAC, AC, EV, PV, CPI, SPI) and upserts snapshot', async () => {
      let upsertedSnapshot: Record<string, unknown> = null as never;

      (supabase.from as Mock).mockImplementation((table: string) => {
        if (table === 'pm_project_activities') {
          return createMockBuilder({
            data: [
              {
                id: 'act-1',
                budgeted_cost_egp: 100000,
                percent_complete: 60, // EV = 60,000
                planned_start: '2026-08-01',
                planned_finish: '2026-08-31',
                is_active: true,
              },
              {
                id: 'act-2',
                budgeted_cost_egp: 200000,
                percent_complete: 30, // EV = 60,000
                planned_start: '2026-09-01',
                planned_finish: '2026-09-30',
                is_active: true,
              },
            ],
            error: null,
          });
        }
        if (table === 'pm_budget_lines') {
          return createMockBuilder({
            data: [
              { id: 'b1', current_budget: 300000, actual_cost: 100000 },
            ],
            error: null,
          });
        }
        if (table === 'pm_cost_snapshots') {
          const builder = createMockBuilder({ data: null, error: null });
          builder.upsert = vi.fn().mockImplementation((payload) => {
            upsertedSnapshot = payload;
            return createMockBuilder({ data: payload, error: null });
          });
          return builder as MockQueryBuilder;
        }
        return createMockBuilder({ data: null, error: null });
      });

      const snapshot = await CostControlService.recalculateAndSaveSnapshot('prj-001');

      expect(snapshot).toBeDefined();
      expect(upsertedSnapshot).toBeDefined();
      expect(upsertedSnapshot.project_id).toBe('prj-001');
      // Total BAC = 300k
      expect(upsertedSnapshot.budget_at_completion).toBe(300000);
      // Total EV = 60k + 60k = 120k
      expect(upsertedSnapshot.earned_value).toBe(120000);
      // AC = 100k
      expect(upsertedSnapshot.actual_cost).toBe(100000);
      // CPI = EV / AC = 120k / 100k = 1.20
      expect(upsertedSnapshot.cpi).toBe(1.2);
    });
  });
});
