import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import {
  KpiService,
  calculateRate,
  calculateAverageDuration,
  UNIFIED_TAXONOMY_LABELS_AR,
} from '../kpi.service';

// Mock Supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Fluent Mock Query Builder Helper
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
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    then: vi.fn().mockImplementation((onfulfilled, onrejected) => {
      return Promise.resolve(resolveValue).then(onfulfilled, onrejected);
    }),
  };
  return builder as MockQueryBuilder;
};

describe('KpiService Unit Test Suite (WS-5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  // 1. getTOEngineerKPIs: calculates On-Time Delivery Rate (on_time / completed) * 100
  it('getTOEngineerKPIs: calculates On-Time Delivery Rate (on_time / completed) * 100', async () => {
    const mockItems = [
      {
        id: 'item-1',
        status: 'approved',
        due_date: '2026-08-30',
        completed_at: '2026-08-28', // on time
        consultant_status: 'A',
        submission_revision: 1,
        item_type: 'drawing',
      },
      {
        id: 'item-2',
        status: 'returned',
        due_date: '2026-08-25',
        completed_at: '2026-08-29', // delayed
        consultant_status: 'B',
        submission_revision: 1,
        item_type: 'drawing',
      },
      {
        id: 'item-3',
        status: 'ready_to_return',
        due_date: '2026-09-01',
        completed_at: '2026-08-31', // on time
        consultant_status: 'A',
        submission_revision: 1,
        item_type: 'drawing',
      },
      {
        id: 'item-4',
        status: 'in_progress',
        due_date: '2026-09-10',
        consultant_status: 'pending',
        submission_revision: 1,
      },
    ];

    const builder = createMockQueryBuilder({ data: mockItems, error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const kpis = await KpiService.getTOEngineerKPIs('sh-eng-1');

    expect(kpis.total_assigned).toBe(4);
    expect(kpis.total_completed).toBe(3);
    // 2 on-time out of 3 completed = 66.7%
    expect(kpis.on_time_delivery_rate_pct).toBe(66.7);
  });

  // 2. getTOEngineerKPIs: calculates Code C/D Revision Rate accurately
  it('getTOEngineerKPIs: calculates Code C/D Revision Rate accurately', async () => {
    const mockItems = [
      { id: 'i-1', consultant_status: 'A', status: 'approved' },
      { id: 'i-2', consultant_status: 'B', status: 'approved' },
      { id: 'i-3', consultant_status: 'C', status: 'in_progress' },
      { id: 'i-4', consultant_status: 'D', status: 'blocked' },
    ];

    const builder = createMockQueryBuilder({ data: mockItems, error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const kpis = await KpiService.getTOEngineerKPIs('sh-eng-1');

    // 2 Code C/D out of 4 reviewed = 50%
    expect(kpis.code_cd_revision_rate_pct).toBe(50);
    expect(kpis.items_with_code_c).toBe(1);
  });

  // 3. getTOEngineerKPIs: calculates First-Pass Approval Rate (code A/B on rev 1)
  it('getTOEngineerKPIs: calculates First-Pass Approval Rate', async () => {
    const mockItems = [
      { id: 'i-1', submission_revision: 1, consultant_status: 'A' }, // Pass on Rev 1
      { id: 'i-2', submission_revision: 1, consultant_status: 'C' }, // Fail on Rev 1
      { id: 'i-3', submission_revision: 2, consultant_status: 'A' }, // Rev 2 pass (not first-pass)
    ];

    const builder = createMockQueryBuilder({ data: mockItems, error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const kpis = await KpiService.getTOEngineerKPIs('sh-eng-1');

    // 1 pass out of 2 first submissions = 50%
    expect(kpis.first_pass_approval_rate_pct).toBe(50);
  });

  // 4. getTOEngineerKPIs: calculates Average Completion Duration in days
  it('getTOEngineerKPIs: calculates Average Completion Duration in days', async () => {
    const mockItems = [
      {
        id: 'i-1',
        status: 'approved',
        work_started_at: '2026-08-01T00:00:00Z',
        completed_at: '2026-08-05T00:00:00Z', // 4 days
      },
      {
        id: 'i-2',
        status: 'approved',
        work_started_at: '2026-08-10T00:00:00Z',
        completed_at: '2026-08-16T00:00:00Z', // 6 days
      },
    ];

    const builder = createMockQueryBuilder({ data: mockItems, error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const kpis = await KpiService.getTOEngineerKPIs('sh-eng-1');

    // Average (4 + 6) / 2 = 5.0 days
    expect(kpis.average_completion_duration_days).toBe(5);
  });

  // 5. getTOEngineerKPIs: returns 0% rates without dividing by zero when total completed is 0
  it('getTOEngineerKPIs: returns 0% rates without dividing by zero when total completed is 0', async () => {
    const builder = createMockQueryBuilder({ data: [], error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const kpis = await KpiService.getTOEngineerKPIs('sh-empty');

    expect(kpis.total_assigned).toBe(0);
    expect(kpis.total_completed).toBe(0);
    expect(kpis.on_time_delivery_rate_pct).toBe(0);
    expect(kpis.code_cd_revision_rate_pct).toBe(0);
    expect(kpis.first_pass_approval_rate_pct).toBe(0);
    expect(kpis.average_completion_duration_days).toBe(0);
  });

  // 6. getProjectSiteProductivity: aggregates total idle man-hours and average daily manpower
  it('getProjectSiteProductivity: aggregates total idle man-hours and average daily manpower', async () => {
    const mockReports = [
      { id: 'r-1', manpower_count: 20 },
      { id: 'r-2', manpower_count: 30 },
    ];

    const mockObstructions = [
      { id: 'obs-1', idle_manpower: 5, obstruction_type: 'weather', eot_days: 2 },
      { id: 'obs-2', idle_manpower: 10, obstruction_type: 'equipment', eot_days: 3 },
    ];

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pm_daily_progress') {
        return createMockQueryBuilder({ data: mockReports, error: null });
      }
      if (table === 'pm_daily_obstructions') {
        return createMockQueryBuilder({ data: mockObstructions, error: null });
      }
      return createMockQueryBuilder({ data: null, error: null });
    });

    const productivity = await KpiService.getProjectSiteProductivity('p-1');

    expect(productivity.total_daily_reports).toBe(2);
    expect(productivity.average_daily_manpower).toBe(25); // (20 + 30) / 2
    // Idle manpower: (5 + 10) * 8 = 120 hours
    expect(productivity.total_idle_manpower_hours).toBe(120);
    expect(productivity.total_obstructions_count).toBe(2);
  });

  // 7. getProjectSiteProductivity: aggregates EOT claimed days across all obstructions
  it('getProjectSiteProductivity: aggregates EOT claimed days across all obstructions', async () => {
    const mockObstructions = [
      { id: 'o-1', obstruction_type: 'owner_directive', eot_days: 7, idle_manpower: 0 },
      { id: 'o-2', obstruction_type: 'permit_authority', eot_days: 14, idle_manpower: 0 },
    ];

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pm_daily_obstructions') {
        return createMockQueryBuilder({ data: mockObstructions, error: null });
      }
      return createMockQueryBuilder({ data: [], error: null });
    });

    const productivity = await KpiService.getProjectSiteProductivity('p-1');

    expect(productivity.total_eot_claimed_days).toBe(21); // 7 + 14
  });

  // 8. getProjectSiteProductivity: breaks down obstructions by the 11 unified taxonomy types
  it('getProjectSiteProductivity: breaks down obstructions by the 11 unified taxonomy types', async () => {
    const mockObstructions = [
      { id: 'o-1', obstruction_type: 'weather', idle_manpower: 4, eot_days: 1 },
      { id: 'o-2', obstruction_type: 'drawing_delay', idle_manpower: 6, eot_days: 2 },
      { id: 'o-3', obstruction_type: 'material_approval', idle_manpower: 2, eot_days: 1 }, // maps to material_delay
    ];

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pm_daily_obstructions') {
        return createMockQueryBuilder({ data: mockObstructions, error: null });
      }
      return createMockQueryBuilder({ data: [], error: null });
    });

    const productivity = await KpiService.getProjectSiteProductivity('p-1');

    expect(productivity.obstructions_by_taxonomy).toHaveLength(11);

    const weatherItem = productivity.obstructions_by_taxonomy.find((t) => t.type === 'weather');
    expect(weatherItem?.count).toBe(1);
    expect(weatherItem?.idle_hours).toBe(32); // 4 * 8

    const materialItem = productivity.obstructions_by_taxonomy.find((t) => t.type === 'material_delay');
    expect(materialItem?.count).toBe(1);
  });

  // 9. getPortfolioKPIs: computes cross-project on-time rate and identifies high-risk projects
  it('getPortfolioKPIs: computes cross-project on-time rate and identifies high-risk projects', async () => {
    const mockProjects = [
      { id: 'p-1', name_ar: 'مشروع أ', code: 'P01', status: 'working' },
      { id: 'p-2', name_ar: 'مشروع ب', code: 'P02', status: 'working' },
    ];

    const mockObstructions = [
      { id: 'obs-1', project_id: 'p-1', obstruction_type: 'owner_directive', eot_days: 10, resolved_at: null },
      { id: 'obs-2', project_id: 'p-1', obstruction_type: 'weather', eot_days: 5, resolved_at: null },
      { id: 'obs-3', project_id: 'p-2', obstruction_type: 'drawing_delay', eot_days: 3, resolved_at: '2026-08-30' },
    ];

    const mockDeliverableItems = [
      { id: 'i-1', status: 'approved', consultant_status: 'A', due_date: '2026-08-30', completed_at: '2026-08-25' },
      { id: 'i-2', status: 'returned', consultant_status: 'C', due_date: '2026-08-30', completed_at: '2026-08-26' },
    ];

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'projects') return createMockQueryBuilder({ data: mockProjects, error: null });
      if (table === 'pm_daily_obstructions') return createMockQueryBuilder({ data: mockObstructions, error: null });
      if (table === 'pm_deliverable_items') return createMockQueryBuilder({ data: mockDeliverableItems, error: null });
      return createMockQueryBuilder({ data: null, error: null });
    });

    const portfolio = await KpiService.getPortfolioKPIs();

    expect(portfolio.total_active_projects).toBe(2);
    expect(portfolio.overall_to_on_time_pct).toBe(100);
    expect(portfolio.overall_code_cd_rate_pct).toBe(50);
    expect(portfolio.total_eot_risk_days).toBe(15); // obs-1 (10) + obs-2 (5)
    expect(portfolio.high_risk_projects).toHaveLength(1);
    expect(portfolio.high_risk_projects[0].project_id).toBe('p-1');
    expect(portfolio.high_risk_projects[0].spi).toBeNull();
  });

  // 10. Metric calculation pure functions test suite
  it('Metric calculation pure functions test suite', () => {
    expect(calculateRate(0, 0)).toBe(0);
    expect(calculateRate(3, 4)).toBe(75);
    expect(calculateRate(1, 3)).toBe(33.3);

    expect(calculateAverageDuration([])).toBe(0);
    expect(
      calculateAverageDuration([
        { work_started_at: '2026-08-01', completed_at: '2026-08-04' },
      ])
    ).toBe(3);
  });

  // 11. Error propagation test suite
  it('propagates errors when database operations fail', async () => {
    const queryError = new Error('Database failure');
    const failingBuilder = {
      ...createMockQueryBuilder(null),
      then: vi.fn().mockImplementation((onfulfilled, onrejected) => {
        return Promise.reject(queryError).then(onfulfilled, onrejected);
      }),
    };
    vi.mocked(supabase.from).mockReturnValue(failingBuilder as never);

    await expect(KpiService.getTOEngineerKPIs('sh-error')).rejects.toThrow('Database failure');
    await expect(KpiService.getProjectSiteProductivity('p-error')).rejects.toThrow('Database failure');
    await expect(KpiService.getPortfolioKPIs()).rejects.toThrow('Database failure');
  });
});
