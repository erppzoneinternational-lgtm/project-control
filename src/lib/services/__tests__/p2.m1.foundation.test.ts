import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import {
  calculateSubcontractorProductivity,
  calculateEotObstructionSummary,
  calculateDeliverableBottlenecks,
  calculateMorningCommandCenter,
} from '@/lib/planning/calculations';
import { useDailyDraftStore } from '@/lib/stores/useDailyDraftStore';
import { DailyProgressService } from '../dailyProgress.service';
import { SiteOperationsService } from '../siteOperations.service';
import { HoldsService } from '../holds.service';
import { SubcontractorService } from '../subcontractor.service';
import { DeliverablesService } from '../deliverables.service';
import { CommandCenterService } from '../commandCenter.service';
import {
  SubcontractorTarget,
  DailyProgressLine,
  DailyObstruction,
  Deliverable,
  DailyProgress,
  PmHold,
  RfiRegisterItem,
  ApprovalDelegation,
} from '@/types/planning';
import { MaterialTransaction } from '@/types/boq';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
    },
  };
});

// Chainable query builder helper
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

describe('Milestone P2-M1: Foundation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
    useDailyDraftStore.getState().clearDraft();
  });

  // =========================================================================
  // 1. Pure Calculation Functions
  // =========================================================================
  describe('Planning Calculation Pure Functions', () => {
    it('calculateSubcontractorProductivity computes achievement_pct and flags underperforming', () => {
      const targets: SubcontractorTarget[] = [
        {
          id: 't-1',
          project_id: 'p-1',
          subcontractor_id: 'sub-1',
          boq_item_id: 'boq-1',
          target_qty: 100,
          target_date: '2026-08-20',
          unit: 'm2',
        },
        {
          id: 't-2',
          project_id: 'p-1',
          subcontractor_id: 'sub-2',
          boq_item_id: 'boq-2',
          target_qty: 100,
          target_date: '2026-08-20',
          unit: 'm2',
        },
      ];

      const lines: Partial<DailyProgressLine>[] = [
        {
          subcontractor_id: 'sub-1',
          boq_item_id: 'boq-1',
          qty_today: 85,
          line_status: 'approved',
        },
        {
          subcontractor_id: 'sub-2',
          boq_item_id: 'boq-2',
          qty_today: 50,
          line_status: 'approved',
        },
        {
          // Rejected line should not count
          subcontractor_id: 'sub-2',
          boq_item_id: 'boq-2',
          qty_today: 30,
          line_status: 'rejected',
        },
      ];

      const metrics = calculateSubcontractorProductivity(targets, lines, 10);
      expect(metrics).toHaveLength(2);

      // Sub 1: 85% => not underperforming
      expect(metrics[0].subcontractor_id).toBe('sub-1');
      expect(metrics[0].actual_qty).toBe(85);
      expect(metrics[0].achievement_pct).toBe(85);
      expect(metrics[0].is_underperforming).toBe(false);

      // Sub 2: 50% => underperforming (< 70%)
      expect(metrics[1].subcontractor_id).toBe('sub-2');
      expect(metrics[1].actual_qty).toBe(50);
      expect(metrics[1].achievement_pct).toBe(50);
      expect(metrics[1].is_underperforming).toBe(true);
    });

    it('calculateEotObstructionSummary aggregates delays by party and type', () => {
      const obstructions: DailyObstruction[] = [
        {
          id: 'obs-1',
          daily_progress_id: 'dp-1',
          project_id: 'p-1',
          obstruction_type: 'drawing_delay',
          responsible_party: 'Consultant',
          description: 'Delayed drawing approval',
          idle_manpower: 12,
          started_at: '2026-08-10',
        },
        {
          id: 'obs-2',
          daily_progress_id: 'dp-1',
          project_id: 'p-1',
          obstruction_type: 'site_access',
          responsible_party: 'Client',
          description: 'Gate blocked',
          idle_manpower: 8,
          started_at: '2026-08-11',
        },
        {
          id: 'obs-3',
          daily_progress_id: 'dp-2',
          project_id: 'p-1',
          obstruction_type: 'drawing_delay',
          responsible_party: 'Consultant',
          description: 'Revised RFI pending',
          idle_manpower: 5,
          started_at: '2026-08-12',
        },
      ];

      const summary = calculateEotObstructionSummary(obstructions);
      expect(summary.totalObstructions).toBe(3);
      expect(summary.totalIdleManpower).toBe(25);

      const consultantParty = summary.byResponsibleParty.find((p) => p.responsible_party === 'Consultant');
      expect(consultantParty?.count).toBe(2);
      expect(consultantParty?.total_idle_manpower).toBe(17);

      const drawingType = summary.byObstructionType.find((t) => t.obstruction_type === 'drawing_delay');
      expect(drawingType?.count).toBe(2);
      expect(drawingType?.total_idle_manpower).toBe(17);
    });

    it('calculateDeliverableBottlenecks identifies blocked deliverables and items', () => {
      const deliverables: Deliverable[] = [
        {
          id: 'del-1',
          project_id: 'p-1',
          ref_code: 'E1-001',
          title_ar: 'سباكة',
          kind: 'E1',
          received_from: 'technical_office',
          received_at: '2026-08-01',
          status: 'blocked',
          blocked_reason: 'RFI 05 pending',
          priority: 'high',
        },
        {
          id: 'del-2',
          project_id: 'p-1',
          ref_code: 'E1-002',
          title_ar: 'كهرباء',
          kind: 'E1',
          received_from: 'technical_office',
          received_at: '2026-08-01',
          status: 'in_progress',
          priority: 'normal',
          items: [
            {
              id: 'it-1',
              deliverable_id: 'del-2',
              item_type: 'drawing',
              description: 'Single line diagram',
              current_rev: 1,
              consultant_status: 'C', // Code C trigger
              submission_revision: 2,
              status: 'in_progress',
            },
          ],
        },
        {
          id: 'del-3',
          project_id: 'p-1',
          ref_code: 'E1-003',
          title_ar: 'أرضيات',
          kind: 'E1',
          received_from: 'technical_office',
          received_at: '2026-08-01',
          status: 'in_progress',
          priority: 'normal',
          items: [],
        },
      ];

      const bottlenecks = calculateDeliverableBottlenecks(deliverables);
      expect(bottlenecks).toHaveLength(2);
      expect(bottlenecks.map((b) => b.id)).toEqual(['del-1', 'del-2']);
    });

    it('calculateMorningCommandCenter identifies silent sites, holds, and overdue items', () => {
      const targetDate = '2026-08-20';
      const projects = [
        { id: 'p-1', project_name: 'Project 1', status: 'working' },
        { id: 'p-2', project_name: 'Project 2', status: 'working' },
      ];

      const reports: Partial<DailyProgress>[] = [
        { project_id: 'p-1', progress_date: '2026-08-19', status: 'submitted' },
      ];

      const holds: PmHold[] = [
        {
          id: 'h-1',
          project_id: 'p-2',
          hold_type: 'financial',
          scope_type: 'project',
          reason: 'Client payment delayed',
          is_active: true,
          placed_by: 'PM',
          placed_at: '2026-08-15',
        },
      ];

      const rfis: RfiRegisterItem[] = [
        {
          id: 'r-1',
          project_id: 'p-1',
          rfi_no: 'RFI-001',
          subject: 'Clarification',
          sent_date: '2026-08-01',
          target_reply_date: '2026-08-10', // overdue compared to 2026-08-20
          status: 'sent',
        },
      ];

      const deliverables: Deliverable[] = [
        {
          id: 'd-1',
          project_id: 'p-2',
          ref_code: 'D-01',
          title_ar: 'لوحات',
          kind: 'E1',
          received_from: 'technical_office',
          received_at: '2026-08-01',
          status: 'blocked',
          blocked_reason: 'Hold in place',
          priority: 'high',
        },
      ];

      const summary = calculateMorningCommandCenter({
        projects,
        reports,
        holds,
        deliverables,
        rfis,
        subMetrics: [
          {
            subcontractor_id: 'sub-x',
            target_qty: 100,
            actual_qty: 40,
            achievement_pct: 40,
            is_underperforming: true,
          },
        ],
        targetDate,
      });

      expect(summary.date).toBe(targetDate);
      expect(summary.silent_sites_count).toBe(1);
      expect(summary.silent_sites[0].project_id).toBe('p-2');
      expect(summary.active_critical_holds_count).toBe(1);
      expect(summary.blocked_deliverables_count).toBe(1);
      expect(summary.overdue_rfis_count).toBe(1);
      expect(summary.underperforming_subcontractors_count).toBe(1);
    });
  });

  // =========================================================================
  // 2. Zustand Store: useDailyDraftStore
  // =========================================================================
  describe('Zustand Draft Store (useDailyDraftStore)', () => {
    it('manages draft header, lines, and idempotency key', () => {
      const store = useDailyDraftStore.getState();

      store.updateHeader({ project_id: 'p-100', progress_date: '2026-08-23', weather: 'Sunny' });
      expect(useDailyDraftStore.getState().header.weather).toBe('Sunny');

      store.addLine({ id: 'line-1', boq_item_id: 'boq-1', qty_today: 25 });
      store.addLine({ id: 'line-2', boq_item_id: 'boq-2', qty_today: 50 });
      expect(useDailyDraftStore.getState().lines).toHaveLength(2);

      store.updateLine('line-1', { qty_today: 30 });
      expect(useDailyDraftStore.getState().lines[0].qty_today).toBe(30);

      store.removeLine(1); // remove index 1
      expect(useDailyDraftStore.getState().lines).toHaveLength(1);

      const oldKey = useDailyDraftStore.getState().idempotencyKey;
      const newKey = store.generateIdempotencyKey();
      expect(newKey).not.toBe(oldKey);

      store.clearDraft();
      expect(useDailyDraftStore.getState().lines).toHaveLength(0);
      expect(useDailyDraftStore.getState().header).toEqual({});
    });
  });

  // =========================================================================
  // 3. Service Layer: DailyProgressService
  // =========================================================================
  describe('DailyProgressService Extensions', () => {
    it('reopenDailyReport updates status and suspends progress allocations', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress') {
          return createMockQueryBuilder({ data: { id: 'dp-1', project_id: 'p-1' }, error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true, report_id: 'dp-1', from_state: 'approved', to_state: 'reopened', action: 'reopen' },
        error: null,
      } as never);

      const success = await DailyProgressService.reopenDailyReport('dp-1', 'Site measurement revision', 'Lead PM');
      expect(success).toBe(true);
    });

    it('batchApproveLines and batchRejectLines update line status correctly', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_daily_progress_lines') {
          return createMockQueryBuilder({
            data: [
              {
                id: 'l-1',
                boq_item_id: 'boq-1',
                boq_item: { rate_egp: 1200, revision: 2 },
              },
            ],
            error: null,
          });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const approveRes = await DailyProgressService.batchApproveLines('dp-1', ['l-1'], 'Eng. Ahmed');
      expect(approveRes).toBe(true);

      const rejectRes = await DailyProgressService.batchRejectLines('dp-1', ['l-1'], 'Over-measurement', 'Eng. Ahmed');
      expect(rejectRes).toBe(true);
    });

    it('canUserApprove verifies PM role or active delegation', async () => {
      // 1. PM role returns true without querying delegation
      const isPm = await DailyProgressService.canUserApprove('p-1', 'user-pm', 'project_manager');
      expect(isPm).toBe(true);

      // 2. Non-PM checks delegation table
      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: { id: 'del-1' }, error: null })
      );
      const isDelegated = await DailyProgressService.canUserApprove('p-1', 'user-site-eng', 'site_engineer');
      expect(isDelegated).toBe(true);
    });
  });

  // =========================================================================
  // 4. Service Layer: SiteOperationsService
  // =========================================================================
  describe('SiteOperationsService', () => {
    it('saves and updates MOS entries', async () => {
      const mockEntry = {
        id: 'mos-1',
        project_id: 'p-1',
        description_ar: 'حديد تسليح 16مم',
        unit: 'ton',
        qty_supplied: 50,
        status: 'on_site' as const,
      };

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: mockEntry, error: null })
      );

      const saved = await SiteOperationsService.saveMosEntry(mockEntry);
      expect(saved).toEqual(mockEntry);

      const updated = await SiteOperationsService.updateMosStatus('mos-1', 'installed');
      expect(updated).toEqual(mockEntry);
    });

    it('records material transactions and computes wastage report', async () => {
      const mockTx: Partial<MaterialTransaction> = {
        project_id: 'p-1',
        sub_material_id: 'sm-1',
        tx_type: 'issue_to_site',
        qty: 120,
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_material_transactions') {
          return createMockQueryBuilder({ data: [{ id: 'tx-1', ...mockTx }], error: null });
        }
        if (table === 'pm_boq_items') {
          return createMockQueryBuilder({
            data: [{ id: 'boq-1', item_code: 'BOQ-01', rate_egp: 100 }],
            error: null,
          });
        }
        if (table === 'pm_boq_sub_materials') {
          return createMockQueryBuilder({
            data: [
              {
                id: 'sm-1',
                boq_item_id: 'boq-1',
                material_name_ar: 'عزل مائي',
                unit: 'm2',
                consumption_rate: 1.0,
                standard_wastage_pct: 5.0,
              },
            ],
            error: null,
          });
        }
        if (table === 'pm_daily_progress') {
          return createMockQueryBuilder({ data: [{ id: 'dp-1' }], error: null });
        }
        if (table === 'pm_daily_progress_lines') {
          return createMockQueryBuilder({
            data: [{ boq_item_id: 'boq-1', qty_today: 100, line_status: 'approved' }],
            error: null,
          });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const report = await SiteOperationsService.getMaterialWastageReport('p-1');
      expect(report.project_id).toBe('p-1');
      expect(report.items).toHaveLength(1);
      // Net issued: 120, Net installed: 100, Actual waste: (120-100)/100 = 20%, Standard: 5% => Variance: 15%
      expect(report.items[0].actual_wastage_pct).toBe(20);
      expect(report.items[0].variance_pct).toBe(15);
      expect(report.items[0].variance_egp).toBe(1500); // 15% * 100 installed * 100 EGP = 1500
    });
  });

  // =========================================================================
  // 5. Service Layer: HoldsService
  // =========================================================================
  describe('HoldsService', () => {
    it('manages holds and checks if scope is on hold', async () => {
      const activeHold: PmHold = {
        id: 'hold-1',
        project_id: 'p-1',
        hold_type: 'site',
        scope_type: 'zone',
        ref_value: 'Zone-A',
        reason: 'Soil test failure',
        is_active: true,
        placed_by: 'Consultant',
        placed_at: '2026-08-01',
      };

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: [activeHold], error: null })
      );

      const isZoneAHold = await HoldsService.isScopeOnHold('p-1', 'zone', 'Zone-A');
      expect(isZoneAHold).toBe(true);

      const isZoneBHold = await HoldsService.isScopeOnHold('p-1', 'zone', 'Zone-B');
      expect(isZoneBHold).toBe(false);
    });
  });

  // =========================================================================
  // 6. Service Layer: DeliverablesService & SubcontractorService
  // =========================================================================
  describe('DeliverablesService & SubcontractorService', () => {
    it('saveDeliverableItem increments submission revision and resets status on Code C', async () => {
      const codeCItem = {
        id: 'item-1',
        deliverable_id: 'del-1',
        consultant_status: 'C' as const,
        submission_revision: 1,
        status: 'received' as const,
      };

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({
          data: { ...codeCItem, submission_revision: 2, status: 'in_progress' },
          error: null,
        })
      );

      const result = await DeliverablesService.saveDeliverableItem(codeCItem);
      expect(result?.submission_revision).toBe(2);
      expect(result?.status).toBe('in_progress');
    });

    it('getCooDeliverablesSummary calculates metrics correctly', async () => {
      const mockDeliverables: Deliverable[] = [
        {
          id: 'd-1',
          project_id: 'p-1',
          ref_code: 'E1-001',
          title_ar: 'رسومات إنشائية',
          kind: 'E1',
          received_from: 'technical_office',
          received_at: '2026-08-01',
          status: 'in_progress',
          priority: 'normal',
          items: [
            {
              id: 'it-1',
              deliverable_id: 'd-1',
              item_type: 'drawing',
              description: 'Footings',
              current_rev: 1,
              consultant_status: 'C',
              submission_revision: 2,
              status: 'in_progress',
            },
          ],
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_deliverables') {
          return createMockQueryBuilder({ data: mockDeliverables, error: null });
        }
        if (table === 'pm_rfi_register') {
          return createMockQueryBuilder({ data: [], error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const cooSummary = await DeliverablesService.getCooDeliverablesSummary('p-1');
      expect(cooSummary.total_deliverables).toBe(1);
      expect(cooSummary.in_progress_count).toBe(1);
      expect(cooSummary.code_c_count).toBe(1);
    });

    it('SubcontractorService fetches targets and calculates productivity', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_subcontractor_targets') {
          return createMockQueryBuilder({
            data: [
              {
                id: 'st-1',
                project_id: 'p-1',
                subcontractor_id: 'sub-alpha',
                target_qty: 200,
                target_date: '2026-08-20',
              },
            ],
            error: null,
          });
        }
        if (table === 'pm_daily_progress') {
          return createMockQueryBuilder({
            data: [
              {
                id: 'dp-1',
                manpower_count: 15,
                lines: [
                  {
                    id: 'l-1',
                    subcontractor_id: 'sub-alpha',
                    qty_today: 180,
                    line_status: 'approved',
                  },
                ],
              },
            ],
            error: null,
          });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const prod = await SubcontractorService.getSubcontractorProductivity('p-1');
      expect(prod).toHaveLength(1);
      expect(prod[0].achievement_pct).toBe(90); // 180 / 200 = 90%
      expect(prod[0].is_underperforming).toBe(false);
    });
  });
});
