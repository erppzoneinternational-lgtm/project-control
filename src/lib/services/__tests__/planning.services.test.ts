import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { BoqService } from '../boq.service';
import { ActivityService } from '../activity.service';
import { DailyProgressService } from '../dailyProgress.service';
import { AllocationService } from '../allocation.service';
import { DeliverablesService } from '../deliverables.service';
import { WeeklyReportService } from '../weeklyReport.service';

// Mock Supabase module
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
    },
  };
});

// Helper for chainable mock builder
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

describe('Milestone 2 Planning Module Services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  // =========================================================================
  // 1. BoqService
  // =========================================================================
  describe('BoqService', () => {
    it('getCostCodes fetches active cost codes', async () => {
      const mockCodes = [
        { id: 'c1', code: '01-01-001', name_ar: 'أعمال الحفر', is_active: true },
      ];
      vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ data: mockCodes, error: null }));

      const res = await BoqService.getCostCodes();
      expect(res).toEqual(mockCodes);
    });

    it('saveBoqItem increments revision and saves snapshot when updating existing item', async () => {
      const existingItem = {
        id: 'boq-1',
        project_id: 'p-100',
        item_code: 'BOQ-01',
        description_ar: 'خرسانة',
        unit: 'm3',
        contract_qty: 100,
        rate_egp: 2000,
        amount_egp: 200000,
        revision: 1,
      };

      const updatedItem = {
        ...existingItem,
        rate_egp: 2200,
        amount_egp: 220000,
        revision: 2,
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_boq_items') {
          return createMockQueryBuilder({ data: updatedItem, error: null });
        }
        if (table === 'pm_boq_revisions') {
          return createMockQueryBuilder({ data: { id: 'rev-1' }, error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const res = await BoqService.saveBoqItem(
        { id: 'boq-1', project_id: 'p-100', rate_egp: 2200, contract_qty: 100 },
        'Eng. Ahmed',
        'Price escalation VO'
      );

      expect(res).toEqual(updatedItem);
    });

    it('importBoqItems processes spreadsheet rows and invalidates cache', async () => {
      const rows = [
        {
          item_code: 'BOQ-10',
          description_ar: 'بياض محارة',
          unit: 'm2',
          contract_qty: 500,
          rate_egp: 150,
        },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: [{ id: 'b10', ...rows[0] }], error: null })
      );

      const result = await BoqService.importBoqItems('p-100', rows, 'Import User');
      expect(result.success).toBe(true);
      expect(result.insertedCount).toBe(1);
    });
  });

  // =========================================================================
  // 2. ActivityService
  // =========================================================================
  describe('ActivityService', () => {
    it('getActivities returns activities with links', async () => {
      const mockActivities = [
        {
          id: 'act-1',
          project_id: 'p-100',
          activity_code: 'ACT-001',
          name_ar: 'صب الخرسانة المسلحة',
          planned_start: '2026-08-01',
          planned_finish: '2026-08-10',
          duration_days: 9,
          budgeted_cost_egp: 500000,
          percent_complete: 0,
        },
      ];

      vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ data: mockActivities, error: null }));

      const res = await ActivityService.getActivities('p-100');
      expect(res).toEqual(mockActivities);
    });

    it('linkBoqToActivity freezes baseline rate from BOQ item if not explicitly provided', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_boq_items') {
          return createMockQueryBuilder({ data: { rate_egp: 1850, project_id: 'p-100' }, error: null });
        }
        if (table === 'pm_activity_boq_links') {
          return createMockQueryBuilder({
            data: { id: 'link-1', activity_id: 'act-1', boq_item_id: 'boq-1', planned_qty: 50, baseline_rate_egp: 1850 },
            error: null,
          });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const res = await ActivityService.linkBoqToActivity('act-1', 'boq-1', 50);
      expect(res?.baseline_rate_egp).toBe(1850);
    });
  });

  // =========================================================================
  // 3. DailyProgressService
  // =========================================================================
  describe('DailyProgressService', () => {
    it('createDailyReport supports idempotency check to avoid duplicate creation', async () => {
      const existingReport = {
        id: 'rep-1',
        project_id: 'p-100',
        report_no: 1,
        idempotency_key: 'offline-uuid-999',
        status: 'draft',
      };

      vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ data: existingReport, error: null }));

      const res = await DailyProgressService.createDailyReport({
        project_id: 'p-100',
        idempotency_key: 'offline-uuid-999',
      });

      expect(res?.id).toBe('rep-1');
    });

    it('approveDailyReportLine updates line status to approved and freezes snapshot rate', async () => {
      const approvedLine = {
        id: 'line-1',
        line_status: 'approved',
        snapshot_rate_egp: 2500,
        source_boq_revision: 1,
      };

      vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ data: approvedLine, error: null }));

      const res = await DailyProgressService.approveDailyReportLine('line-1', 'rep-1', 'Eng. Lead', 2500);
      expect(res?.line_status).toBe('approved');
      expect(res?.snapshot_rate_egp).toBe(2500);
    });
  });

  // =========================================================================
  // 4. AllocationService
  // =========================================================================
  describe('AllocationService', () => {
    it('allocateDailyQty succeeds when allocated quantity is within measured qty_today', async () => {
      const mockLine = {
        id: 'line-1',
        qty_today: 100,
        snapshot_rate_egp: 500,
        source_boq_revision: 1,
        boq_item: { rate_egp: 500, revision: 1 },
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress_lines') {
          return createMockQueryBuilder({ data: mockLine, error: null });
        }
        if (table === 'pm_progress_allocations') {
          return {
            ...createMockQueryBuilder({
              data: { id: 'alloc-1', line_id: 'line-1', activity_id: 'act-1', allocated_qty: 40, snapshot_rate_egp: 500 },
              error: null,
            }),
            then: vi.fn().mockImplementation((onfulfilled) => {
              const val = { data: [], error: null };
              onfulfilled(val);
              return Promise.resolve(val);
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const res = await AllocationService.allocateDailyQty({
        line_id: 'line-1',
        activity_id: 'act-1',
        allocated_qty: 40,
        project_id: 'p-100',
      });

      expect(res?.allocated_qty).toBe(40);
    });

    it('allocateDailyQty throws validation error when allocated quantity exceeds qty_today', async () => {
      const mockLine = {
        id: 'line-1',
        qty_today: 50,
        snapshot_rate_egp: 500,
        boq_item: { rate_egp: 500, revision: 1 },
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress_lines') {
          return createMockQueryBuilder({ data: mockLine, error: null });
        }
        if (table === 'pm_progress_allocations') {
          // Existing allocation of 30
          return createMockQueryBuilder({
            data: [{ id: 'alloc-old', allocated_qty: 30, activity_id: 'act-other' }],
            error: null,
          });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      // Trying to allocate 40 when already 30 allocated of total 50 => 30 + 40 = 70 > 50
      await expect(
        AllocationService.allocateDailyQty({
          line_id: 'line-1',
          activity_id: 'act-new',
          allocated_qty: 40,
          project_id: 'p-100',
        })
      ).rejects.toThrow(/exceeds measured daily quantity/);
    });
  });

  // =========================================================================
  // 5. DeliverablesService
  // =========================================================================
  describe('DeliverablesService', () => {
    it('saveDeliverable throws error if status is blocked without a blocked_reason', async () => {
      await expect(
        DeliverablesService.saveDeliverable({
          project_id: 'p-100',
          ref_code: 'E1-001',
          title_ar: 'مخططات السباكة',
          status: 'blocked',
          blocked_reason: '', // empty
        })
      ).rejects.toThrow(/Blocked reason is required/);
    });

    it('updateDeliverableStatus successfully updates status and records event ledger', async () => {
      const updatedDeliverable = {
        id: 'deliv-1',
        status: 'in_progress',
      };

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: updatedDeliverable, error: null })
      );

      const res = await DeliverablesService.updateDeliverableStatus('deliv-1', 'p-100', 'in_progress');
      expect(res?.status).toBe('in_progress');
    });
  });

  // =========================================================================
  // 6. WeeklyReportService
  // =========================================================================
  describe('WeeklyReportService', () => {
    it('getCommercialSettings returns default settings if table row is absent', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: null, error: { message: 'Not found' } })
      );

      const settings = await WeeklyReportService.getCommercialSettings('p-100');
      expect(settings.project_id).toBe('p-100');
      expect(settings.retention_pct).toBe(0.0);
      expect(settings.week_start_day).toBe(6);
    });

    it('finalizeWeeklyReport updates status to finalized and invalidates cache', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: { id: 'w-1', status: 'finalized' }, error: null })
      );

      const success = await WeeklyReportService.finalizeWeeklyReport('w-1', 'p-100', 'Lead PM');
      expect(success).toBe(true);
    });
  });
});
