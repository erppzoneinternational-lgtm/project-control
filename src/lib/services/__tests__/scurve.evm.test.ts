import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  calculateEVM,
  calculateActivityProgress,
  calculateProjectProgress,
  countWorkingDays,
  generateScurveData,
  calculateMorningCommandCenter,
} from '@/lib/planning/calculations';
import { CommandCenterService } from '../commandCenter.service';
import { WeeklyReportService } from '../weeklyReport.service';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { ScurvePoint, DailyProgress } from '@/types/planning';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Helper for chainable query mock builder
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

// Helper: add calendar or working days to date string (YYYY-MM-DD)
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

describe('Phase 4: S-Curve Engine & EVM Calculations Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  // =========================================================================
  // 1. S-Curve Generation Engine (Early, Late, and Actual EV Curves)
  // =========================================================================
  describe('1. S-Curve Generation Engine & Envelope Invariants', () => {
    const baselineActivities = [
      {
        activity_code: 'ACT-01',
        planned_start: '2026-09-01',
        planned_finish: '2026-09-10',
        budgeted_cost_egp: 200000,
        total_float_days: 0, // Critical path activity
      },
      {
        activity_code: 'ACT-02',
        planned_start: '2026-09-05',
        planned_finish: '2026-09-20',
        budgeted_cost_egp: 300000,
        total_float_days: 5, // 5 days float
      },
      {
        activity_code: 'ACT-03',
        planned_start: '2026-09-15',
        planned_finish: '2026-09-30',
        budgeted_cost_egp: 500000,
        total_float_days: 0, // Critical path activity
      },
    ];

    const actualAllocations = [
      { date: '2026-09-05', earned_egp: 50000 },
      { date: '2026-09-10', earned_egp: 150000 },
      { date: '2026-09-15', earned_egp: 100000 },
      { date: '2026-09-20', earned_egp: 200000 },
    ];

    it('generates strictly monotonic non-decreasing Planned Early curve reaching 100% on project finish', () => {
      const startDate = '2026-09-01';
      const endDate = '2026-09-30';
      const earlyPoints = generateScurveData(baselineActivities, actualAllocations, startDate, endDate);

      expect(earlyPoints.length).toBe(30); // 30 calendar days in September

      // Check first day
      expect(earlyPoints[0].date).toBe('2026-09-01');
      expect(earlyPoints[0].planned_pct).toBeGreaterThanOrEqual(0);

      // Check monotonicity
      for (let i = 1; i < earlyPoints.length; i++) {
        const prev = earlyPoints[i - 1];
        const curr = earlyPoints[i];
        expect(curr.planned_egp).toBeGreaterThanOrEqual(prev.planned_egp);
        expect(curr.planned_pct).toBeGreaterThanOrEqual(prev.planned_pct);
      }

      // Check finish boundary
      const lastPoint = earlyPoints[earlyPoints.length - 1];
      expect(lastPoint.date).toBe('2026-09-30');
      expect(lastPoint.planned_egp).toBe(1000000); // 200k + 300k + 500k
      expect(lastPoint.planned_pct).toBe(100);
    });

    it('generates Planned Late curve based on total_float_days forming valid S-Curve envelope (Early >= Late at all dates)', () => {
      const startDate = '2026-09-01';
      const endDate = '2026-09-30';

      // Compute late schedule by shifting dates by total_float_days
      const lateActivities = baselineActivities.map((act) => ({
        activity_code: act.activity_code,
        planned_start: addDays(act.planned_start, act.total_float_days),
        planned_finish: addDays(act.planned_finish, act.total_float_days),
        budgeted_cost_egp: act.budgeted_cost_egp,
      }));

      const earlyPoints = generateScurveData(baselineActivities, [], startDate, endDate);
      const latePoints = generateScurveData(lateActivities, [], startDate, endDate);

      expect(earlyPoints.length).toBe(latePoints.length);

      // Envelope Invariant: Planned Early % >= Planned Late % at every time t
      for (let i = 0; i < earlyPoints.length; i++) {
        expect(earlyPoints[i].planned_egp).toBeGreaterThanOrEqual(latePoints[i].planned_egp);
        expect(earlyPoints[i].planned_pct).toBeGreaterThanOrEqual(latePoints[i].planned_pct);
      }

      // Both curves must start at 0% progress range and reach 100% on total project finish
      expect(earlyPoints[0].planned_pct).toBeGreaterThanOrEqual(0);
      expect(latePoints[0].planned_pct).toBeGreaterThanOrEqual(0);
      expect(earlyPoints[earlyPoints.length - 1].planned_pct).toBe(100);
      expect(latePoints[latePoints.length - 1].planned_pct).toBe(100);
    });

    it('verifies when all activities have zero float (critical path), Late curve strictly matches Early curve', () => {
      const criticalActivities = [
        { planned_start: '2026-10-01', planned_finish: '2026-10-15', budgeted_cost_egp: 400000, total_float_days: 0 },
        { planned_start: '2026-10-16', planned_finish: '2026-10-31', budgeted_cost_egp: 600000, total_float_days: 0 },
      ];

      const lateActivities = criticalActivities.map((act) => ({
        planned_start: addDays(act.planned_start, act.total_float_days),
        planned_finish: addDays(act.planned_finish, act.total_float_days),
        budgeted_cost_egp: act.budgeted_cost_egp,
      }));

      const earlyPoints = generateScurveData(criticalActivities, [], '2026-10-01', '2026-10-31');
      const latePoints = generateScurveData(lateActivities, [], '2026-10-01', '2026-10-31');

      for (let i = 0; i < earlyPoints.length; i++) {
        expect(earlyPoints[i].planned_egp).toBe(latePoints[i].planned_egp);
        expect(earlyPoints[i].planned_pct).toBe(latePoints[i].planned_pct);
      }
    });

    it('generates cumulative monotonic Actual Earned Value curve from daily report allocations', () => {
      const startDate = '2026-09-01';
      const endDate = '2026-09-30';
      const points = generateScurveData(baselineActivities, actualAllocations, startDate, endDate);

      // Verify Actual EV monotonicity
      for (let i = 1; i < points.length; i++) {
        expect(points[i].earned_egp).toBeGreaterThanOrEqual(points[i - 1].earned_egp);
        expect(points[i].actual_pct).toBeGreaterThanOrEqual(points[i - 1].actual_pct);
      }

      // Check specific accumulation points
      // By 2026-09-05: 50,000 EGP (5% of 1M)
      const pt05 = points.find((p) => p.date === '2026-09-05');
      expect(pt05?.earned_egp).toBe(50000);
      expect(pt05?.actual_pct).toBe(5.0);

      // By 2026-09-10: 50,000 + 150,000 = 200,000 EGP (20% of 1M)
      const pt10 = points.find((p) => p.date === '2026-09-10');
      expect(pt10?.earned_egp).toBe(200000);
      expect(pt10?.actual_pct).toBe(20.0);

      // By 2026-09-20: 200,000 + 100,000 + 200,000 = 500,000 EGP (50% of 1M)
      const pt20 = points.find((p) => p.date === '2026-09-20');
      expect(pt20?.earned_egp).toBe(500000);
      expect(pt20?.actual_pct).toBe(50.0);

      // After 2026-09-20, earned stays at 500,000 (50%) through project finish
      const pt30 = points.find((p) => p.date === '2026-09-30');
      expect(pt30?.earned_egp).toBe(500000);
      expect(pt30?.actual_pct).toBe(50.0);
    });

    it('handles empty activities or zero budget safely by returning empty array', () => {
      expect(generateScurveData([], actualAllocations, '2026-09-01', '2026-09-30')).toEqual([]);
      expect(
        generateScurveData(
          [{ planned_start: '2026-09-01', planned_finish: '2026-09-30', budgeted_cost_egp: 0 }],
          actualAllocations,
          '2026-09-01',
          '2026-09-30'
        )
      ).toEqual([]);
    });

    it('handles invalid date ranges (start > end or invalid format) gracefully', () => {
      expect(generateScurveData(baselineActivities, actualAllocations, '2026-09-30', '2026-09-01')).toEqual([]);
      expect(generateScurveData(baselineActivities, actualAllocations, 'invalid-date', '2026-09-30')).toEqual([]);
    });
  });

  // =========================================================================
  // 2. Real-time EVM Metrics & Zero-Division Guards
  // =========================================================================
  describe('2. Real-time EVM Metrics & Zero-Division Guards', () => {
    it('calculates standard EVM metrics accurately for on-track project (EV=PV=AC=500k, BAC=1M)', () => {
      const metrics = calculateEVM({
        earnedValueEgp: 500000,
        plannedValueEgp: 500000,
        actualCostEgp: 500000,
        budgetAtCompletionEgp: 1000000,
      });

      expect(metrics.bcwp).toBe(500000);
      expect(metrics.bcws).toBe(500000);
      expect(metrics.acwp).toBe(500000);
      expect(metrics.bac).toBe(1000000);
      expect(metrics.cv).toBe(0);
      expect(metrics.sv).toBe(0);
      expect(metrics.cpi).toBe(1.0);
      expect(metrics.spi).toBe(1.0);
      expect(metrics.eac).toBe(1000000);
      expect(metrics.etc).toBe(500000);
      expect(metrics.vac).toBe(0);
      expect(metrics.tcpi).toBe(1.0);
    });

    it('calculates EVM metrics for under-budget, ahead-of-schedule project (EV=600k, PV=500k, AC=400k, BAC=1M)', () => {
      const metrics = calculateEVM({
        earnedValueEgp: 600000,
        plannedValueEgp: 500000,
        actualCostEgp: 400000,
        budgetAtCompletionEgp: 1000000,
      });

      // CV = EV - AC = 600k - 400k = +200,000 EGP (Favorable)
      expect(metrics.cv).toBe(200000);
      // SV = EV - PV = 600k - 500k = +100,000 EGP (Ahead)
      expect(metrics.sv).toBe(100000);
      // CPI = EV / AC = 600k / 400k = 1.50
      expect(metrics.cpi).toBe(1.5);
      // SPI = EV / PV = 600k / 500k = 1.20
      expect(metrics.spi).toBe(1.2);
      // EAC = BAC / CPI = 1,000,000 / 1.5 = 666,666.67
      expect(metrics.eac).toBe(666666.67);
      // ETC = EAC - AC = 666,666.67 - 400,000 = 266,666.67
      expect(metrics.etc).toBe(266666.67);
      // VAC = BAC - EAC = 1,000,000 - 666,666.67 = +333,333.33
      expect(metrics.vac).toBe(333333.33);
      // TCPI = (BAC - EV) / (BAC - AC) = (1M - 600k) / (1M - 400k) = 400k / 600k = 0.6667
      expect(metrics.tcpi).toBe(0.6667);
    });

    it('calculates EVM metrics for over-budget, delayed project (EV=300k, PV=500k, AC=450k, BAC=1M)', () => {
      const metrics = calculateEVM({
        earnedValueEgp: 300000,
        plannedValueEgp: 500000,
        actualCostEgp: 450000,
        budgetAtCompletionEgp: 1000000,
      });

      // CV = EV - AC = 300k - 450k = -150,000 EGP (Cost overrun)
      expect(metrics.cv).toBe(-150000);
      // SV = EV - PV = 300k - 500k = -200,000 EGP (Schedule delay)
      expect(metrics.sv).toBe(-200000);
      // CPI = 300k / 450k = 0.6667
      expect(metrics.cpi).toBe(0.6667);
      // SPI = 300k / 500k = 0.60
      expect(metrics.spi).toBe(0.6);
      // EAC = BAC / CPI = 1,000,000 / 0.6667 = 1,500,000.00
      expect(metrics.eac).toBe(1500000);
      // ETC = EAC - AC = 1.5M - 450k = 1,050,000.00
      expect(metrics.etc).toBe(1050000);
      // VAC = BAC - EAC = 1M - 1.5M = -500,000.00
      expect(metrics.vac).toBe(-500000);
      // TCPI = (1M - 300k) / (1M - 450k) = 700k / 550k = 1.2727
      expect(metrics.tcpi).toBe(1.2727);
    });

    // --- ZERO-DIVISION GUARDS ---
    describe('Strict Zero-Division & Edge Guards', () => {
      it('Guard 1: AC = 0 with EV = 0, PV = 0, BAC = 0 (Day 0 Inception state)', () => {
        const metrics = calculateEVM({
          earnedValueEgp: 0,
          plannedValueEgp: 0,
          actualCostEgp: 0,
          budgetAtCompletionEgp: 0,
        });

        expect(metrics.bcwp).toBe(0);
        expect(metrics.bcws).toBe(0);
        expect(metrics.acwp).toBe(0);
        expect(metrics.bac).toBe(0);
        expect(metrics.cv).toBe(0);
        expect(metrics.sv).toBe(0);
        expect(metrics.cpi).toBe(1.0); // Guarded: not NaN
        expect(metrics.spi).toBe(1.0); // Guarded: not NaN
        expect(metrics.eac).toBe(0);   // Guarded: not NaN
        expect(metrics.etc).toBe(0);
        expect(metrics.vac).toBe(0);
        expect(metrics.tcpi).toBe(1.0); // Guarded: not NaN
      });

      it('Guard 2: AC = 0 with EV > 0 (Work executed before actual costs recorded)', () => {
        const metrics = calculateEVM({
          earnedValueEgp: 150000,
          plannedValueEgp: 200000,
          actualCostEgp: 0,
          budgetAtCompletionEgp: 1000000,
        });

        expect(metrics.cpi).toBe(1.0); // Guarded fallback
        expect(metrics.eac).toBe(1000000); // 1M / 1.0 = 1M
        expect(metrics.etc).toBe(1000000);
        expect(metrics.tcpi).toBe(0.85); // (1M - 150k) / (1M - 0) = 850k / 1M = 0.85
      });

      it('Guard 3: PV = 0 with EV > 0 (Unscheduled/early work executed)', () => {
        const metrics = calculateEVM({
          earnedValueEgp: 100000,
          plannedValueEgp: 0,
          actualCostEgp: 80000,
          budgetAtCompletionEgp: 500000,
        });

        expect(metrics.spi).toBe(1.0); // Guarded: not Infinity
        expect(metrics.sv).toBe(100000); // 100k - 0 = 100k
        expect(metrics.cpi).toBe(1.25); // 100k / 80k = 1.25
      });

      it('Guard 4: EV = 0 with PV > 0 and AC > 0 (Cost incurred with zero progress / stalled site)', () => {
        const metrics = calculateEVM({
          earnedValueEgp: 0,
          plannedValueEgp: 250000,
          actualCostEgp: 100000,
          budgetAtCompletionEgp: 1000000,
        });

        expect(metrics.cpi).toBe(0); // 0 / 100k = 0
        expect(metrics.spi).toBe(0); // 0 / 250k = 0
        expect(metrics.cv).toBe(-100000);
        expect(metrics.sv).toBe(-250000);
        expect(metrics.eac).toBe(1100000); // Guard: cpi === 0 & acwp > 0 returns ACWP + (BAC - BCWP) per PMI standard
      });

      it('Guard 5: AC >= BAC (Budget fully exhausted or exceeded, remaining budget <= 0)', () => {
        const metrics = calculateEVM({
          earnedValueEgp: 700000,
          plannedValueEgp: 1000000,
          actualCostEgp: 1200000, // Exceeded 1M budget
          budgetAtCompletionEgp: 1000000,
        });

        // Remaining budget = 1M - 1.2M = -200k <= 0
        expect(metrics.tcpi).toBe(1.0); // Guarded fallback (not negative or divided by zero)
        expect(metrics.cv).toBe(-500000); // 700k - 1.2M = -500k
      });

      it('Guard 6: Negative inputs sanitized via Math.max(0, val)', () => {
        const metrics = calculateEVM({
          earnedValueEgp: -50000,
          plannedValueEgp: -100000,
          actualCostEgp: -20000,
          budgetAtCompletionEgp: -500000,
        });

        expect(metrics.bcwp).toBe(0);
        expect(metrics.bcws).toBe(0);
        expect(metrics.acwp).toBe(0);
        expect(metrics.bac).toBe(0);
        expect(metrics.cpi).toBe(1.0);
        expect(metrics.spi).toBe(1.0);
      });
    });
  });

  // =========================================================================
  // 3. Silent Site Detector (>48h Dormancy Alert)
  // =========================================================================
  describe('3. Silent Site Detector (>48h Dormancy Alert)', () => {
    const mockProjects = [
      { id: 'proj-active-1', project_name: 'Mall of Egypt Tower', status: 'working' },
      { id: 'proj-active-2', project_name: 'Palm Hills Zone B', status: 'working' },
      { id: 'proj-silent-1', project_name: 'Capital Heights Compound', status: 'working' },
      { id: 'proj-never-reported', project_name: 'New Giza Medical Hub', status: 'working' },
      { id: 'proj-finished', project_name: 'Old Cairo Museum (Finished)', status: 'finished' },
    ];

    const targetDate = '2026-08-24';
    // yesterday = 2026-08-23
    // >48h dormant = last report on or before 2026-08-22 or no reports

    it('identifies silent sites (>48h dormancy) and excludes actively reported sites', () => {
      const reports: Partial<DailyProgress>[] = [
        // proj-active-1 reported today (2026-08-24)
        { project_id: 'proj-active-1', progress_date: '2026-08-24', status: 'approved' },
        // proj-active-2 reported yesterday (2026-08-23)
        { project_id: 'proj-active-2', progress_date: '2026-08-23', status: 'submitted' },
        // proj-silent-1 last reported 3 days ago (2026-08-21) -> Silent site!
        { project_id: 'proj-silent-1', progress_date: '2026-08-21', status: 'approved' },
        { project_id: 'proj-silent-1', progress_date: '2026-08-20', status: 'approved' },
        // proj-never-reported has 0 reports -> Silent site!
      ];

      const summary = calculateMorningCommandCenter({
        projects: mockProjects,
        reports,
        holds: [],
        deliverables: [],
        rfis: [],
        subMetrics: [],
        targetDate,
      });

      expect(summary.date).toBe(targetDate);
      expect(summary.silent_sites_count).toBe(3); // proj-silent-1, proj-never-reported, proj-finished

      const silentIds = summary.silent_sites.map((s) => s.project_id);
      expect(silentIds).toContain('proj-silent-1');
      expect(silentIds).toContain('proj-never-reported');
      expect(silentIds).not.toContain('proj-active-1');
      expect(silentIds).not.toContain('proj-active-2');

      // Verify recorded last_report_date
      const silent1 = summary.silent_sites.find((s) => s.project_id === 'proj-silent-1');
      expect(silent1?.last_report_date).toBe('2026-08-21');
      expect(silent1?.project_name).toBe('Capital Heights Compound');

      const neverReported = summary.silent_sites.find((s) => s.project_id === 'proj-never-reported');
      expect(neverReported?.last_report_date).toBeUndefined();
    });

    it('correctly calculates total active projects count excluding finished ones', () => {
      const summary = calculateMorningCommandCenter({
        projects: mockProjects,
        reports: [],
        holds: [],
        deliverables: [],
        rfis: [],
        subMetrics: [],
        targetDate,
      });

      // 4 active (working) + 1 finished = 4 active projects
      expect(summary.total_active_projects).toBe(4);
    });

    it('handles projects with out-of-order progress dates and picks the latest report date', () => {
      const reports = [
        { project_id: 'proj-silent-1', progress_date: '2026-08-10' },
        { project_id: 'proj-silent-1', progress_date: '2026-08-18' },
        { project_id: 'proj-silent-1', progress_date: '2026-08-15' },
      ];

      const summary = calculateMorningCommandCenter({
        projects: [{ id: 'proj-silent-1', project_name: 'Site A' }],
        reports,
        holds: [],
        deliverables: [],
        rfis: [],
        subMetrics: [],
        targetDate: '2026-08-24',
      });

      expect(summary.silent_sites_count).toBe(1);
      expect(summary.silent_sites[0].last_report_date).toBe('2026-08-18');
    });

    it('flags site as silent if reported 2 days ago (exact 48h boundary)', () => {
      const reports = [
        { project_id: 'proj-exact-48', progress_date: '2026-08-22' }, // 2 days before 2026-08-24
      ];

      const summary = calculateMorningCommandCenter({
        projects: [{ id: 'proj-exact-48', project_name: 'Site 48h' }],
        reports,
        holds: [],
        deliverables: [],
        rfis: [],
        subMetrics: [],
        targetDate: '2026-08-24',
      });

      expect(summary.silent_sites_count).toBe(1);
      expect(summary.silent_sites[0].project_id).toBe('proj-exact-48');
      expect(summary.silent_sites[0].last_report_date).toBe('2026-08-22');
    });
  });

  // =========================================================================
  // 4. Service Orchestration & Integration Tests
  // =========================================================================
  describe('4. CommandCenterService & WeeklyReportService S-Curve EVM Integration', () => {
    it('CommandCenterService.getMorningCommandCenterSummary fetches project and returns rollups', async () => {
      const mockProject = {
        id: 'p-101',
        project_code: 'PRJ-101',
        project_name: 'Skyline Residence',
        project_name_ar: 'أبراج سكاي لاين',
        status: 'working',
      };

      const mockReports = [
        { id: 'rep-1', project_id: 'p-101', progress_date: '2026-08-24', status: 'approved' },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'projects') {
          return createMockQueryBuilder({ data: mockProject, error: null });
        }
        if (table === 'pm_daily_progress') {
          return createMockQueryBuilder({ data: mockReports, error: null });
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
        return createMockQueryBuilder({ data: [], error: null });
      });

      const summary = await CommandCenterService.getMorningCommandCenterSummary('p-101', '2026-08-24');
      expect(summary.date).toBe('2026-08-24');
      expect(summary.silent_sites_count).toBe(0); // Has report on 2026-08-24
    });

    it('WeeklyReportService.getScurveData calculates S-Curve points from Supabase activities and allocations', async () => {
      const mockActivities = [
        { activity_code: 'A1', planned_start: '2026-08-01', planned_finish: '2026-08-10', budgeted_cost_egp: 100000 },
        { activity_code: 'A2', planned_start: '2026-08-05', planned_finish: '2026-08-15', budgeted_cost_egp: 100000 },
      ];

      const mockAllocations = [
        {
          allocated_qty: 10,
          snapshot_rate_egp: 5000, // 50,000 EGP
          created_at: '2026-08-05T10:00:00Z',
          line: { daily_progress: { progress_date: '2026-08-05' } },
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_project_activities') {
          return createMockQueryBuilder({ data: mockActivities, error: null });
        }
        if (table === 'pm_progress_allocations') {
          return createMockQueryBuilder({ data: mockAllocations, error: null });
        }
        return createMockQueryBuilder({ data: [], error: null });
      });

      const points = await WeeklyReportService.getScurveData('p-101');
      expect(points.length).toBe(15); // 2026-08-01 to 2026-08-15

      const pt05 = points.find((p) => p.date === '2026-08-05');
      expect(pt05?.earned_egp).toBe(50000);
      expect(pt05?.actual_pct).toBe(25.0); // 50k / 200k = 25%

      const lastPoint = points[points.length - 1];
      expect(lastPoint.planned_egp).toBe(200000);
      expect(lastPoint.planned_pct).toBe(100);
    });

    it('CommandCenterService.getPortfolioCommandCenterSummary aggregates active projects and detects portfolio silent sites', async () => {
      const mockActiveProjects = [
        { id: 'proj-1', project_name: 'Project Alpha', status: 'working' },
        { id: 'proj-2', project_name: 'Project Beta', status: 'working' },
        { id: 'proj-3', project_name: 'Project Gamma', status: 'tender' },
      ];

      const mockReports = [
        // Project 1 reported today (2026-08-24)
        { project_id: 'proj-1', progress_date: '2026-08-24', status: 'approved' },
        // Project 2 reported 5 days ago (2026-08-19) -> Silent!
        { project_id: 'proj-2', progress_date: '2026-08-19', status: 'approved' },
        // Project 3 never reported -> Silent!
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'projects') {
          return createMockQueryBuilder({ data: mockActiveProjects, error: null });
        }
        if (table === 'pm_daily_progress') {
          return createMockQueryBuilder({ data: mockReports, error: null });
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
        if (table === 'pm_daily_progress_lines') {
          return createMockQueryBuilder({ data: [], error: null });
        }
        return createMockQueryBuilder({ data: [], error: null });
      });

      const portfolioSummary = await CommandCenterService.getPortfolioCommandCenterSummary('2026-08-24');
      expect(portfolioSummary.date).toBe('2026-08-24');
      expect(portfolioSummary.total_active_projects).toBe(3);
      expect(portfolioSummary.silent_sites_count).toBe(2); // proj-2 and proj-3

      const silentSiteIds = portfolioSummary.silent_sites.map((s) => s.project_id);
      expect(silentSiteIds).toContain('proj-2');
      expect(silentSiteIds).toContain('proj-3');
      expect(silentSiteIds).not.toContain('proj-1');
    });
  });

  // =========================================================================
  // 5. Numerical Edge Cases & Adversarial Stress Tests
  // =========================================================================
  describe('5. Numerical Edge Cases & Adversarial Stress Tests', () => {
    it('handles mega-project scale (500M EGP BAC) with floating point accuracy', () => {
      const megaBac = 500000000;
      const earned = 175432100.55;
      const planned = 210987654.32;
      const cost = 160543210.12;

      const metrics = calculateEVM({
        earnedValueEgp: earned,
        plannedValueEgp: planned,
        actualCostEgp: cost,
        budgetAtCompletionEgp: megaBac,
      });

      expect(metrics.bac).toBe(500000000);
      expect(metrics.bcwp).toBe(175432100.55);
      expect(metrics.cv).toBe(14888890.43); // 175,432,100.55 - 160,543,210.12 = 14,888,890.43
      expect(metrics.sv).toBe(-35555553.77); // 175,432,100.55 - 210,987,654.32 = -35,555,553.77
      expect(metrics.cpi).toBe(1.0927); // 175432100.55 / 160543210.12 = 1.09274...
      expect(metrics.spi).toBe(0.8315); // 175432100.55 / 210987654.32 = 0.83148...
      expect(metrics.eac).toBe(457565091.04); // 500M / (175432100.55 / 160543210.12) = 457565091.04
    });

    it('evaluates activity progress with multiple lines having tiny fractions and roundings', () => {
      const allocations = [
        { allocated_qty: 0.003, snapshot_rate_egp: 33333.33, line_status: 'approved' }, // 99.99999
        { allocated_qty: 0.007, snapshot_rate_egp: 33333.33, line_status: 'approved' }, // 233.33331
      ];

      const progress = calculateActivityProgress(allocations, 1000);
      expect(progress.earnedEgp).toBe(333.33);
      expect(progress.percentComplete).toBe(33.33);
    });

    it('verifies calculateProjectProgress weights activities by budgeted cost correctly across disparate budgets', () => {
      const activities = [
        { budgeted_cost_egp: 9000000, percent_complete: 10 },  // 900k earned
        { budgeted_cost_egp: 1000000, percent_complete: 100 }, // 1M earned
      ];

      // Total Budget = 10,000,000. Total Earned = 1,900,000 => 19.0%
      const totalPct = calculateProjectProgress(activities);
      expect(totalPct).toBe(19.0);
    });
  });
});
