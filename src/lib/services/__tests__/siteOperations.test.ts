import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { SiteOperationsService } from '../siteOperations.service';
import { HoldsService } from '../holds.service';
import { SubcontractorService } from '../subcontractor.service';
import { CommandCenterService } from '../commandCenter.service';
import {
  calculateEotObstructionSummary,
  calculateWastageLossEgp,
  calculateSubcontractorProductivity,
  calculateMorningCommandCenter,
} from '@/lib/planning/calculations';
import {
  DailyObstruction,
  MosEntry,
  MosStatus,
  SubcontractorTarget,
  DailyProgressLine,
  PmHold,
  Deliverable,
  DailyProgress,
  RfiRegisterItem,
} from '@/types/planning';
import { MaterialTransaction } from '@/types/boq';

// Mock Supabase
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
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

describe('Site Operations, Holds, Wastage, Subcontractors & Command Center Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  // =========================================================================
  // 1. calculateEotObstructionSummary (Delays & EOT Claims)
  // =========================================================================
  describe('EOT Obstruction Calculation & Aggregation', () => {
    it('aggregates delays by responsible party and calculates idle manpower accurately', () => {
      const obstructions: DailyObstruction[] = [
        {
          id: 'obs-1',
          daily_progress_id: 'dp-1',
          project_id: 'p-1',
          obstruction_type: 'drawing_delay',
          responsible_party: 'consultant',
          description: 'Delayed structural drawing revision',
          idle_manpower: 10,
          started_at: '2026-08-10',
        },
        {
          id: 'obs-2',
          daily_progress_id: 'dp-1',
          project_id: 'p-1',
          obstruction_type: 'site_access',
          responsible_party: 'client',
          description: 'Site gate locked by security',
          idle_manpower: 15,
          started_at: '2026-08-11',
        },
        {
          id: 'obs-3',
          daily_progress_id: 'dp-2',
          project_id: 'p-1',
          obstruction_type: 'material_approval',
          responsible_party: 'consultant',
          description: 'Material sample approval delayed',
          idle_manpower: 5,
          started_at: '2026-08-12',
        },
      ];

      const summary = calculateEotObstructionSummary(obstructions);

      expect(summary.totalObstructions).toBe(3);
      expect(summary.totalIdleManpower).toBe(30);

      // Consultant party summary (2 events, 15 idle manpower)
      const consultantParty = summary.byResponsibleParty.find((p) => p.responsible_party === 'consultant');
      expect(consultantParty).toBeDefined();
      expect(consultantParty?.count).toBe(2);
      expect(consultantParty?.total_idle_manpower).toBe(15);
      expect(consultantParty?.obstruction_types).toContain('drawing_delay');
      expect(consultantParty?.obstruction_types).toContain('material_approval');

      // Client party summary (1 event, 15 idle manpower)
      const clientParty = summary.byResponsibleParty.find((p) => p.responsible_party === 'client');
      expect(clientParty?.count).toBe(1);
      expect(clientParty?.total_idle_manpower).toBe(15);

      // By obstruction type
      const drawingDelay = summary.byObstructionType.find((t) => t.obstruction_type === 'drawing_delay');
      expect(drawingDelay?.count).toBe(1);
      expect(drawingDelay?.total_idle_manpower).toBe(10);
    });

    it('handles empty obstructions list gracefully', () => {
      const summary = calculateEotObstructionSummary([]);
      expect(summary.totalObstructions).toBe(0);
      expect(summary.totalIdleManpower).toBe(0);
      expect(summary.byResponsibleParty).toEqual([]);
      expect(summary.byObstructionType).toEqual([]);
    });
  });

  // =========================================================================
  // 2. MOS (Material On Site) Lifecycle
  // =========================================================================
  describe('Material On Site (MOS) Tracking & Lifecycle', () => {
    it('getMosEntries fetches entries for a project with caching', async () => {
      const mockEntries: Partial<MosEntry>[] = [
        {
          id: 'mos-1',
          project_id: 'p-1',
          description_ar: 'حديد عز 12 مم',
          unit: 'ton',
          qty_supplied: 40,
          status: 'on_site',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: mockEntries, error: null })
      );

      const list = await SiteOperationsService.getMosEntries('p-1');
      expect(list).toHaveLength(1);
      expect(list[0].description_ar).toBe('حديد عز 12 مم');
    });

    it('saveMosEntry creates and updates MOS entries', async () => {
      const newEntry: Partial<MosEntry> = {
        project_id: 'p-1',
        description_ar: 'أسمنت بورتلاندي',
        unit: 'bag',
        qty_supplied: 200,
        status: 'on_site',
      };

      const savedEntry = { id: 'mos-new-1', ...newEntry };

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: savedEntry, error: null })
      );

      const res = await SiteOperationsService.saveMosEntry(newEntry);
      expect(res?.id).toBe('mos-new-1');
      expect(res?.qty_supplied).toBe(200);
    });

    it('updateMosStatus transitions lifecycle from on_site to partially_installed to installed', async () => {
      const lifecycles: MosStatus[] = ['on_site', 'partially_installed', 'installed'];

      for (const status of lifecycles) {
        const mockMos: Partial<MosEntry> = {
          id: 'mos-life-1',
          project_id: 'p-1',
          status,
        };

        vi.mocked(supabase.from).mockReturnValue(
          createMockQueryBuilder({ data: mockMos, error: null })
        );

        const updated = await SiteOperationsService.updateMosStatus('mos-life-1', status);
        expect(updated?.status).toBe(status);
      }
    });
  });

  // =========================================================================
  // 3. Material Transactions & Wastage Calculations in EGP
  // =========================================================================
  describe('Material Transactions & Wastage In EGP', () => {
    it('calculateWastageLossEgp calculates actual vs standard wastage variance and loss in EGP', () => {
      // Case 1: Over-wastage (Loss)
      // Issued: 115, Installed: 100, Standard Wastage: 5%, Unit Price: 200 EGP
      // Actual Waste % = (115 - 100) / 100 * 100 = 15%
      // Variance % = 15% - 5% = +10%
      // Loss EGP = (10 / 100) * 100 * 200 = 2,000 EGP
      const lossResult = calculateWastageLossEgp(115, 100, 5, 200);
      expect(lossResult.actualWastagePct).toBe(15);
      expect(lossResult.varianceWastagePct).toBe(10);
      expect(lossResult.isLoss).toBe(true);
      expect(lossResult.wastageLossEgp).toBe(2000);

      // Case 2: Within Standard Wastage (No Loss)
      // Issued: 104, Installed: 100, Standard: 5%, Unit Price: 200 EGP
      // Actual Waste % = 4%, Variance % = -1%, isLoss = false, Loss = 0 EGP
      const okResult = calculateWastageLossEgp(104, 100, 5, 200);
      expect(okResult.actualWastagePct).toBe(4);
      expect(okResult.varianceWastagePct).toBe(-1);
      expect(okResult.isLoss).toBe(false);
      expect(okResult.wastageLossEgp).toBe(0);

      // Case 3: Zero installed quantity boundary condition
      const zeroInstalled = calculateWastageLossEgp(50, 0, 5, 200);
      expect(zeroInstalled.actualWastagePct).toBe(0);
      expect(zeroInstalled.isLoss).toBe(false);
      expect(zeroInstalled.wastageLossEgp).toBe(0);
    });

    it('saveMaterialTransaction records issue_to_site and return_to_store transactions', async () => {
      const mockTx: Partial<MaterialTransaction> = {
        project_id: 'p-1',
        sub_material_id: 'sm-1',
        tx_type: 'issue_to_site',
        qty: 150,
        zone: 'Zone 1',
      };

      const savedTx = { id: 'tx-101', ...mockTx };

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: savedTx, error: null })
      );

      const res = await SiteOperationsService.saveMaterialTransaction(mockTx);
      expect(res?.id).toBe('tx-101');
      expect(res?.tx_type).toBe('issue_to_site');
      expect(res?.qty).toBe(150);
    });

    it('getMaterialWastageReport computes comprehensive material wastage report across project', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_boq_items') {
          return createMockQueryBuilder({
            data: [{ id: 'boq-1', item_code: '01.01', rate_egp: 500 }],
            error: null,
          });
        }
        if (table === 'pm_boq_sub_materials') {
          return createMockQueryBuilder({
            data: [
              {
                id: 'sm-1',
                boq_item_id: 'boq-1',
                material_name_ar: 'سيراميك أرضيات',
                unit: 'm2',
                consumption_rate: 1.0,
                standard_wastage_pct: 5,
              },
            ],
            error: null,
          });
        }
        if (table === 'pm_material_transactions') {
          return createMockQueryBuilder({
            data: [
              { sub_material_id: 'sm-1', tx_type: 'issue_to_site', qty: 120 },
              { sub_material_id: 'sm-1', tx_type: 'return_to_store', qty: 10 },
              // Net issued = 110 m2
            ],
            error: null,
          });
        }
        if (table === 'pm_daily_progress') {
          return createMockQueryBuilder({
            data: [{ id: 'dp-1' }],
            error: null,
          });
        }
        if (table === 'pm_daily_progress_lines') {
          return createMockQueryBuilder({
            data: [
              { boq_item_id: 'boq-1', qty_today: 100, line_status: 'approved' },
              // Net installed = 100 m2
            ],
            error: null,
          });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const report = await SiteOperationsService.getMaterialWastageReport('p-1');

      // Net issued: 110, Net installed: 100, Standard: 5%
      // Actual waste = (110 - 100) / 100 = 10%
      // Variance = 10% - 5% = 5%
      // Variance loss EGP = 0.05 * 100 * 500 = 2,500 EGP
      expect(report.items).toHaveLength(1);
      expect(report.items[0].issued_qty).toBe(110);
      expect(report.items[0].installed_qty).toBe(100);
      expect(report.items[0].actual_wastage_pct).toBe(10);
      expect(report.items[0].variance_pct).toBe(5);
      expect(report.items[0].variance_egp).toBe(2500);
      expect(report.items[0].is_loss).toBe(true);
      expect(report.total_variance_egp).toBe(2500);
    });
  });

  // =========================================================================
  // 4. Subcontractor Productivity Tracking (<70% Warning)
  // =========================================================================
  describe('Subcontractor Productivity Tracking', () => {
    it('calculateSubcontractorProductivity calculates achievement % and sets <70% performance alert', () => {
      const targets: SubcontractorTarget[] = [
        {
          id: 'tgt-1',
          project_id: 'p-1',
          subcontractor_id: 'sub-good',
          boq_item_id: 'boq-1',
          target_qty: 200,
          target_date: '2026-08-23',
          unit: 'm2',
        },
        {
          id: 'tgt-2',
          project_id: 'p-1',
          subcontractor_id: 'sub-lagging',
          boq_item_id: 'boq-2',
          target_qty: 100,
          target_date: '2026-08-23',
          unit: 'm3',
        },
      ];

      const lines: Partial<DailyProgressLine>[] = [
        {
          subcontractor_id: 'sub-good',
          boq_item_id: 'boq-1',
          qty_today: 180, // 180 / 200 = 90%
          line_status: 'approved',
        },
        {
          subcontractor_id: 'sub-lagging',
          boq_item_id: 'boq-2',
          qty_today: 60, // 60 / 100 = 60% (< 70%)
          line_status: 'approved',
        },
        {
          // Rejected line should not count towards productivity!
          subcontractor_id: 'sub-lagging',
          boq_item_id: 'boq-2',
          qty_today: 30,
          line_status: 'rejected',
        },
      ];

      const metrics = calculateSubcontractorProductivity(targets, lines, 25);

      expect(metrics).toHaveLength(2);

      // Subcontractor 1 (Good): 90% achievement, not underperforming
      expect(metrics[0].subcontractor_id).toBe('sub-good');
      expect(metrics[0].actual_qty).toBe(180);
      expect(metrics[0].achievement_pct).toBe(90);
      expect(metrics[0].is_underperforming).toBe(false);

      // Subcontractor 2 (Lagging): 60% achievement, underperforming alert flagged
      expect(metrics[1].subcontractor_id).toBe('sub-lagging');
      expect(metrics[1].actual_qty).toBe(60);
      expect(metrics[1].achievement_pct).toBe(60);
      expect(metrics[1].is_underperforming).toBe(true);
    });

    it('SubcontractorService fetches targets and calculates productivity through database data', async () => {
      const targets: SubcontractorTarget[] = [
        {
          id: 'tgt-1',
          project_id: 'p-1',
          subcontractor_id: 'sub-1',
          target_qty: 100,
          target_date: '2026-08-23',
        },
      ];

      const reports = [
        {
          id: 'dp-1',
          progress_date: '2026-08-23',
          manpower_count: 12,
          lines: [
            { id: 'l-1', subcontractor_id: 'sub-1', qty_today: 80, line_status: 'approved' },
          ],
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_subcontractor_targets') {
          return createMockQueryBuilder({ data: targets, error: null });
        }
        if (table === 'pm_daily_progress') {
          return createMockQueryBuilder({ data: reports, error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const metrics = await SubcontractorService.getSubcontractorProductivity('p-1');
      expect(metrics).toHaveLength(1);
      expect(metrics[0].achievement_pct).toBe(80);
      expect(metrics[0].is_underperforming).toBe(false);
    });
  });

  // =========================================================================
  // 5. Active Holds Check (isScopeOnHold & HoldsService)
  // =========================================================================
  describe('PM Holds & Scope On Hold Check', () => {
    it('isScopeOnHold returns true when full project is on active hold', async () => {
      const projectHold: PmHold[] = [
        {
          id: 'hold-1',
          project_id: 'p-1',
          hold_type: 'commercial',
          scope_type: 'project',
          reason: 'Client requested complete stop for redesign',
          is_active: true,
          placed_by: 'PM',
          placed_at: '2026-08-01',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: projectHold, error: null })
      );

      const isZoneOnHold = await HoldsService.isScopeOnHold('p-1', 'zone', 'Zone-A');
      const isActivityOnHold = await HoldsService.isScopeOnHold('p-1', 'activity', 'act-101');

      expect(isZoneOnHold).toBe(true);
      expect(isActivityOnHold).toBe(true);
    });

    it('isScopeOnHold returns true when specific zone or activity is on hold', async () => {
      const scopeHolds: PmHold[] = [
        {
          id: 'hold-2',
          project_id: 'p-1',
          hold_type: 'technical',
          scope_type: 'zone',
          ref_value: 'Basement-1',
          reason: 'Water table leak inspection',
          is_active: true,
          placed_by: 'PM',
          placed_at: '2026-08-01',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: scopeHolds, error: null })
      );

      // Matches Basement-1
      expect(await HoldsService.isScopeOnHold('p-1', 'zone', 'Basement-1')).toBe(true);
      // Different zone -> not on hold
      expect(await HoldsService.isScopeOnHold('p-1', 'zone', 'Roof')).toBe(false);
    });

    it('isScopeOnHold returns false when hold is released (is_active: false)', async () => {
      const inactiveHold: PmHold[] = [
        {
          id: 'hold-3',
          project_id: 'p-1',
          hold_type: 'site',
          scope_type: 'project',
          reason: 'Resolved safety inspection',
          is_active: false, // Released
          placed_by: 'PM',
          placed_at: '2026-08-01',
          closed_at: '2026-08-05',
          closed_by: 'Safety Officer',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: inactiveHold, error: null })
      );

      expect(await HoldsService.isScopeOnHold('p-1', 'zone', 'Zone-A')).toBe(false);
    });

    it('releaseHold deactivates hold and records closed_by and closed_at', async () => {
      const releasedHold = {
        id: 'hold-1',
        project_id: 'p-1',
        is_active: false,
        closed_by: 'PM Hassan',
        closed_at: '2026-08-23T12:00:00Z',
      };

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: releasedHold, error: null })
      );

      const result = await HoldsService.releaseHold('hold-1', 'PM Hassan');
      expect(result?.is_active).toBe(false);
      expect(result?.closed_by).toBe('PM Hassan');
    });
  });

  // =========================================================================
  // 6. Morning Command Center Aggregation
  // =========================================================================
  describe('Morning Command Center Aggregation', () => {
    it('calculateMorningCommandCenter identifies silent sites, active holds, blocked deliverables, overdue RFIs', () => {
      const targetDate = '2026-08-23';
      const yesterday = '2026-08-22';

      const projects = [
        { id: 'proj-active-1', project_name: 'Tower A', status: 'working' },
        { id: 'proj-silent-2', project_name: 'Mall B', status: 'working' },
      ];

      // Only proj-active-1 submitted a report yesterday/today
      const reports: Partial<DailyProgress>[] = [
        { project_id: 'proj-active-1', progress_date: yesterday, status: 'submitted' },
      ];

      const holds: PmHold[] = [
        {
          id: 'h-1',
          project_id: 'proj-silent-2',
          hold_type: 'site',
          scope_type: 'project',
          reason: 'Dewatering permit pending',
          is_active: true,
          placed_by: 'PM',
          placed_at: '2026-08-15',
        },
      ];

      const deliverables: Deliverable[] = [
        {
          id: 'del-blocked',
          project_id: 'proj-silent-2',
          ref_code: 'E1-01',
          title_ar: 'لوحات الواجهات',
          kind: 'E1',
          received_from: 'technical_office',
          received_at: '2026-08-01',
          status: 'blocked',
          blocked_reason: 'RFI pending',
          priority: 'high',
        },
      ];

      const rfis: RfiRegisterItem[] = [
        {
          id: 'rfi-overdue',
          project_id: 'proj-silent-2',
          rfi_no: 'RFI-005',
          subject: 'Facade anchors',
          sent_date: '2026-08-01',
          target_reply_date: '2026-08-10', // < targetDate => Overdue!
          status: 'sent',
        },
      ];

      const subMetrics = [
        {
          subcontractor_id: 'sub-slow',
          target_qty: 100,
          actual_qty: 30,
          achievement_pct: 30,
          is_underperforming: true,
        },
      ];

      const summary = calculateMorningCommandCenter({
        projects,
        reports,
        holds,
        deliverables,
        rfis,
        subMetrics,
        targetDate,
      });

      expect(summary.date).toBe(targetDate);
      expect(summary.silent_sites_count).toBe(1);
      expect(summary.silent_sites[0].project_id).toBe('proj-silent-2');
      expect(summary.active_critical_holds_count).toBe(1);
      expect(summary.blocked_deliverables_count).toBe(1);
      expect(summary.overdue_rfis_count).toBe(1);
      expect(summary.underperforming_subcontractors_count).toBe(1);
      expect(summary.total_active_projects).toBe(2);
    });

    it('CommandCenterService fetches project command center summary accurately', async () => {
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'projects') {
          return createMockQueryBuilder({
            data: { id: 'p-1', project_name: 'Project One', status: 'working' },
            error: null,
          });
        }
        if (table === 'pm_daily_progress') {
          return createMockQueryBuilder({
            data: [{ id: 'dp-1', project_id: 'p-1', progress_date: '2026-08-23' }],
            error: null,
          });
        }
        if (table === 'pm_holds') {
          return createMockQueryBuilder({ data: [], error: null });
        }
        if (table === 'pm_deliverables') {
          return createMockQueryBuilder({ data: [], error: null });
        }
        if (table === 'pm_rfi_register') {
          return createMockQueryBuilder({ data: [], error: null });
        }
        if (table === 'pm_subcontractor_targets') {
          return createMockQueryBuilder({ data: [], error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const summary = await CommandCenterService.getMorningCommandCenterSummary('p-1', '2026-08-23');
      expect(summary.silent_sites_count).toBe(0); // Report submitted today
      expect(summary.date).toBe('2026-08-23');
    });
  });
});
