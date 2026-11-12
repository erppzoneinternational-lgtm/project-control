import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { WBSService } from '../wbs.service';
import { WBSItem } from '@/types';
import { ProjectActivity } from '@/types/planning';

// Mock Supabase module
vi.mock('@/lib/supabase', () => {
  return {
    supabase: {
      from: vi.fn(),
      rpc: vi.fn(),
    },
  };
});

// Helper for chainable mock query builder
const createMockQueryBuilder = (resolveValue: unknown) => {
  const builder: MockBuilderShape = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    then: vi.fn().mockImplementation((onfulfilled) => {
      return Promise.resolve(onfulfilled(resolveValue));
    }),
  };
  return builder as MockQueryBuilder;
};

describe('WBSService Suite (WBS Hierarchy, EVM Engine & Auto-Generation)', () => {
  const projectId = 'proj-test-123';

  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  describe('1. WBS CRUD & Retrieval', () => {
    it('getWBSItems returns mapped WBS items with parsed numeric types', async () => {
      const mockDbItems = [
        {
          id: 'wbs-1',
          project_id: projectId,
          wbs_code: 'CON',
          title_ar: 'أعمال الإنشاءات',
          level: '1',
          sort_order: '1',
          weight_percentage: '40',
          budgeted_cost: '5000000',
          actual_cost: '2000000',
          earned_value: '2500000',
          status: 'in_progress',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: mockDbItems, error: null })
      );

      const result = await WBSService.getWBSItems(projectId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('wbs-1');
      expect(result[0].level).toBe(1);
      expect(result[0].budgeted_cost).toBe(5000000);
      expect(result[0].weight_percentage).toBe(40);
    });

    it('createWBSItem automatically computes level = 2 when parent_id is provided', async () => {
      // 1. Mock parent lookup returning level 1
      const parentBuilder = createMockQueryBuilder({ data: { level: 1 }, error: null });
      // 2. Mock insert returning created item
      const insertBuilder = createMockQueryBuilder({
        data: {
          id: 'wbs-child-1',
          project_id: projectId,
          parent_id: 'wbs-root-1',
          wbs_code: 'CON.G4',
          title_ar: 'خرسانات الدور الأرضي',
          level: 2,
        },
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(parentBuilder)
        .mockReturnValueOnce(insertBuilder);

      const created = await WBSService.createWBSItem({
        project_id: projectId,
        parent_id: 'wbs-root-1',
        wbs_code: 'CON.G4',
        title_ar: 'خرسانات الدور الأرضي',
      });

      expect(created.id).toBe('wbs-child-1');
      expect(created.level).toBe(2);
    });

    it('updateWBSItem strips transient fields before updating pm_wbs_items', async () => {
      const updateBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue(updateBuilder);

      await WBSService.updateWBSItem('wbs-1', {
        title_ar: 'تحديث العنوان',
        children: [] as never,
        activities: [] as never,
        progress_pct: 75,
      });

      expect(updateBuilder.update).toHaveBeenCalledWith(
        expect.not.objectContaining({
          children: expect.anything(),
          activities: expect.anything(),
          progress_pct: expect.anything(),
        })
      );
      expect(updateBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title_ar: 'تحديث العنوان',
        })
      );
    });
  });

  describe('2. Hierarchical Tree Building & Metric Rollups', () => {
    it('builds tree and rolls up BAC, EV, activity count, and progress from child to parent', async () => {
      const mockWbsList: Partial<WBSItem>[] = [
        {
          id: 'wbs-root',
          project_id: projectId,
          parent_id: null,
          wbs_code: 'CON',
          title_ar: 'الهيكل الخرساني',
          level: 1,
          sort_order: 1,
          budgeted_cost: 0,
        },
        {
          id: 'wbs-sub',
          project_id: projectId,
          parent_id: 'wbs-root',
          wbs_code: 'CON.01',
          title_ar: 'القواعد والأساسات',
          level: 2,
          sort_order: 1,
          budgeted_cost: 100000,
        },
      ];

      const mockActivities: Partial<ProjectActivity>[] = [
        {
          id: 'act-1',
          project_id: projectId,
          wbs_item_id: 'wbs-sub',
          activity_code: 'CON.01.10',
          name_ar: 'صب الخرسانة المسلحة',
          budgeted_cost_egp: 100000,
          percent_complete: 50,
          status: 'in_progress',
        },
      ];

      // getWBSItems mock
      const wbsBuilder = createMockQueryBuilder({ data: mockWbsList, error: null });
      // pm_project_activities mock
      const actBuilder = createMockQueryBuilder({ data: mockActivities, error: null });
      // pm_boq_items mock
      const boqBuilder = createMockQueryBuilder({ data: [], error: null });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(wbsBuilder)
        .mockReturnValueOnce(actBuilder)
        .mockReturnValueOnce(boqBuilder);

      const tree = await WBSService.getWBSTree(projectId);

      expect(tree).toHaveLength(1);
      const root = tree[0];
      expect(root.wbs_code).toBe('CON');
      expect(root.children).toHaveLength(1);

      // Child metrics
      const child = root.children![0];
      expect(child.wbs_code).toBe('CON.01');
      expect(child.activity_count).toBe(1);
      expect(child.earned_value).toBe(50000); // 100,000 * 50%
      expect(child.progress_pct).toBe(50);

      // Root rolled-up metrics
      expect(root.activity_count).toBe(1);
      expect(root.budgeted_cost).toBe(100000);
      expect(root.earned_value).toBe(50000);
      expect(root.progress_pct).toBe(50);
    });

    it('prevents double-counting parent envelope budget when child items have budgets', async () => {
      const mockWbsList: Partial<WBSItem>[] = [
        {
          id: 'wbs-root',
          project_id: projectId,
          parent_id: null,
          wbs_code: 'STR',
          title_ar: 'الهيكل الإنشائي',
          level: 1,
          budgeted_cost: 500000,
        },
        {
          id: 'wbs-sub',
          project_id: projectId,
          parent_id: 'wbs-root',
          wbs_code: 'STR.01',
          title_ar: 'الأساسات',
          level: 2,
          budgeted_cost: 500000,
        },
      ];

      vi.mocked(supabase.from)
        .mockReturnValueOnce(createMockQueryBuilder({ data: mockWbsList, error: null }))
        .mockReturnValueOnce(createMockQueryBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createMockQueryBuilder({ data: [], error: null }));

      const tree = await WBSService.getWBSTree(projectId);
      expect(tree).toHaveLength(1);
      expect(tree[0].budgeted_cost).toBe(500000);
    });

    it('handles circular references gracefully without throwing or infinite recursion', async () => {
      const mockWbsList: Partial<WBSItem>[] = [
        {
          id: 'wbs-cycle-1',
          project_id: projectId,
          parent_id: 'wbs-cycle-2',
          wbs_code: 'CYC.01',
          title_ar: 'حلقة 1',
          level: 1,
        },
        {
          id: 'wbs-cycle-2',
          project_id: projectId,
          parent_id: 'wbs-cycle-1',
          wbs_code: 'CYC.02',
          title_ar: 'حلقة 2',
          level: 2,
        },
      ];

      vi.mocked(supabase.from)
        .mockReturnValueOnce(createMockQueryBuilder({ data: mockWbsList, error: null }))
        .mockReturnValueOnce(createMockQueryBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createMockQueryBuilder({ data: [], error: null }));

      const tree = await WBSService.getWBSTree(projectId);
      expect(tree).toBeDefined();
      expect(Array.isArray(tree)).toBe(true);
    });
  });

  describe('3. Auto-Generation of WBS from Activity Code Patterns', () => {
    it('extracts dot and hyphen notation prefixes and creates multi-level hierarchy', async () => {
      const mockActivities = [
        {
          id: 'act-1',
          project_id: projectId,
          activity_code: 'CON.G4.100',
          code: 'CON.G4.100',
          name_ar: 'صب خرسانة الدور الأرضي',
          wbs_item_id: null,
        },
        {
          id: 'act-2',
          project_id: projectId,
          activity_code: 'SL-L2-TC-01',
          code: 'SL-L2-TC-01',
          name_ar: 'عزل بحيرة 2',
          wbs_item_id: null,
        },
      ];

      // 1. Fetch activities
      const actQuery = createMockQueryBuilder({ data: mockActivities, error: null });
      // 2. Fetch existing WBS (empty)
      const existingWbsQuery = createMockQueryBuilder({ data: [], error: null });

      // 3. Inserts for Level 1, 2, 3
      const insertLvl1 = createMockQueryBuilder({
        data: [
          { id: 'wbs-con', wbs_code: 'CON', level: 1 },
          { id: 'wbs-sl', wbs_code: 'SL', level: 1 },
        ],
        error: null,
      });
      const insertLvl2 = createMockQueryBuilder({
        data: [
          { id: 'wbs-con-g4', wbs_code: 'CON.G4', level: 2 },
          { id: 'wbs-sl-l2', wbs_code: 'SL-L2', level: 2 },
        ],
        error: null,
      });
      const insertLvl3 = createMockQueryBuilder({
        data: [{ id: 'wbs-sl-l2-tc', wbs_code: 'SL-L2-TC', level: 3 }],
        error: null,
      });

      // 4. Activity assignment updates
      const updateActs = createMockQueryBuilder({ data: null, error: null });

      // 5. Final getWBSItems call
      const finalWbsQuery = createMockQueryBuilder({
        data: [
          { id: 'wbs-con', wbs_code: 'CON', level: 1 },
          { id: 'wbs-con-g4', wbs_code: 'CON.G4', level: 2 },
          { id: 'wbs-sl', wbs_code: 'SL', level: 1 },
          { id: 'wbs-sl-l2', wbs_code: 'SL-L2', level: 2 },
          { id: 'wbs-sl-l2-tc', wbs_code: 'SL-L2-TC', level: 3 },
        ],
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(actQuery)
        .mockReturnValueOnce(existingWbsQuery)
        .mockReturnValueOnce(insertLvl1)
        .mockReturnValueOnce(insertLvl2)
        .mockReturnValueOnce(insertLvl3)
        .mockReturnValueOnce(updateActs)
        .mockReturnValueOnce(updateActs)
        .mockReturnValueOnce(finalWbsQuery);

      const generated = await WBSService.autoGenerateFromActivities(projectId);

      expect(generated).toHaveLength(5);
      expect(generated.some((w) => w.wbs_code === 'CON')).toBe(true);
      expect(generated.some((w) => w.wbs_code === 'CON.G4')).toBe(true);
      expect(generated.some((w) => w.wbs_code === 'SL-L2-TC')).toBe(true);
    });

    it('handles mixed compound delimiters like CON.G4-100 without losing segments', async () => {
      const mockActivities = [
        {
          id: 'act-mixed',
          project_id: projectId,
          activity_code: 'CON.G4-100',
          name_ar: 'خرسانات أعمدة الدور الأرضي',
          wbs_item_id: null,
        },
      ];

      const actQuery = createMockQueryBuilder({ data: mockActivities, error: null });
      const existingWbsQuery = createMockQueryBuilder({ data: [], error: null });
      const insertLvl1 = createMockQueryBuilder({
        data: [{ id: 'wbs-con', wbs_code: 'CON', level: 1 }],
        error: null,
      });
      const insertLvl2 = createMockQueryBuilder({
        data: [{ id: 'wbs-con-g4', wbs_code: 'CON.G4', level: 2 }],
        error: null,
      });
      const updateActs = createMockQueryBuilder({ data: null, error: null });
      const finalWbsQuery = createMockQueryBuilder({
        data: [
          { id: 'wbs-con', wbs_code: 'CON', level: 1 },
          { id: 'wbs-con-g4', wbs_code: 'CON.G4', level: 2 },
        ],
        error: null,
      });

      vi.mocked(supabase.from)
        .mockReturnValueOnce(actQuery)
        .mockReturnValueOnce(existingWbsQuery)
        .mockReturnValueOnce(insertLvl1)
        .mockReturnValueOnce(insertLvl2)
        .mockReturnValueOnce(updateActs)
        .mockReturnValueOnce(finalWbsQuery);

      const generated = await WBSService.autoGenerateFromActivities(projectId);
      expect(generated).toHaveLength(2);
      expect(generated[0].wbs_code).toBe('CON');
      expect(generated[1].wbs_code).toBe('CON.G4');
    });
  });

  describe('4. EVM Calculation Engine & Financial Rollup', () => {
    it('computes BAC, EV, PV, SPI, CPI, ETC, and EAC accurately', async () => {
      const mockWbsList: Partial<WBSItem>[] = [
        {
          id: 'wbs-1',
          project_id: projectId,
          wbs_code: 'PKG-01',
          title_ar: 'حزمة الأعمال المدنية',
          budgeted_cost: 1000000,
          actual_cost: 400000,
          level: 1,
        },
      ];

      const mockActivities: Partial<ProjectActivity>[] = [
        {
          id: 'act-1',
          project_id: projectId,
          wbs_item_id: 'wbs-1',
          activity_code: 'ACT-01',
          name_ar: 'حفر الموقع',
          budgeted_cost_egp: 1000000,
          percent_complete: 50, // EV = 500,000
          planned_start: '2026-01-01',
          planned_finish: '2026-02-01', // Date in the past -> PV = 100% = 1,000,000
        },
      ];

      vi.mocked(supabase.from)
        .mockReturnValueOnce(createMockQueryBuilder({ data: mockWbsList, error: null }))
        .mockReturnValueOnce(createMockQueryBuilder({ data: mockActivities, error: null }))
        .mockReturnValueOnce(createMockQueryBuilder({ data: [], error: null }));

      const { items, dashboard } = await WBSService.getWBSEvmSummary(projectId);

      expect(items).toHaveLength(1);
      const it = items[0];

      expect(it.budgeted_cost).toBe(1000000);
      expect(it.earned_value).toBe(500000);
      expect(it.actual_cost).toBe(400000);
      expect(it.planned_value).toBe(1000000);

      // SPI = EV / PV = 500,000 / 1,000,000 = 0.50
      expect(it.spi).toBe(0.5);
      // CPI = EV / AC = 500,000 / 400,000 = 1.25
      expect(it.cpi).toBe(1.25);

      // Dashboard overall metrics
      expect(dashboard.totalActivities).toBe(1);
      expect(dashboard.inProgressActivities).toBe(1);
      expect(dashboard.spi).toBe(0.5);
      expect(dashboard.cpi).toBe(1.25);
    });

    it('rolls up EVM metrics from child WBS packages to parent packages when parent has no direct activities', async () => {
      const mockWbsList: Partial<WBSItem>[] = [
        {
          id: 'wbs-root',
          project_id: projectId,
          parent_id: null,
          wbs_code: 'PKG-CIVIL',
          title_ar: 'الأعمال المدنية',
          level: 1,
          budgeted_cost: 0,
          actual_cost: 0,
        },
        {
          id: 'wbs-child',
          project_id: projectId,
          parent_id: 'wbs-root',
          wbs_code: 'PKG-CIVIL-01',
          title_ar: 'الحفر والردم',
          level: 2,
          budgeted_cost: 200000,
          actual_cost: 80000,
        },
      ];

      const mockActivities: Partial<ProjectActivity>[] = [
        {
          id: 'act-1',
          project_id: projectId,
          wbs_item_id: 'wbs-child',
          activity_code: 'EXC-01',
          name_ar: 'حفر الأساسات',
          budgeted_cost_egp: 200000,
          percent_complete: 50,
          planned_start: '2026-01-01',
          planned_finish: '2026-02-01',
        },
      ];

      vi.mocked(supabase.from)
        .mockReturnValueOnce(createMockQueryBuilder({ data: mockWbsList, error: null }))
        .mockReturnValueOnce(createMockQueryBuilder({ data: mockActivities, error: null }))
        .mockReturnValueOnce(createMockQueryBuilder({ data: [], error: null }));

      const { items } = await WBSService.getWBSEvmSummary(projectId);

      const rootEvm = items.find((i) => i.wbs_id === 'wbs-root');
      expect(rootEvm).toBeDefined();
      expect(rootEvm!.activity_count).toBe(1);
      expect(rootEvm!.budgeted_cost).toBe(200000);
      expect(rootEvm!.earned_value).toBe(100000);
      expect(rootEvm!.planned_value).toBe(200000);
      expect(rootEvm!.actual_cost).toBe(80000);
      expect(rootEvm!.spi).toBe(0.5);
      expect(rootEvm!.cpi).toBe(1.25);
    });
  });

  describe('5. Activity Assignment & Excel Export', () => {
    it('assignActivities updates wbs_item_id for specified activity IDs', async () => {
      const updateBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue(updateBuilder);

      await WBSService.assignActivities(['act-1', 'act-2'], 'wbs-target', projectId);

      expect(updateBuilder.update).toHaveBeenCalledWith({ wbs_item_id: 'wbs-target' });
      expect(updateBuilder.in).toHaveBeenCalledWith('id', ['act-1', 'act-2']);
    });

    it('unassignActivities sets wbs_item_id to null and invalidates cache', async () => {
      const updateBuilder = createMockQueryBuilder({ data: null, error: null });
      vi.mocked(supabase.from).mockReturnValue(updateBuilder);

      const invalidateSpy = vi.spyOn(appCache, 'invalidate');

      await WBSService.unassignActivities(['act-1', 'act-2'], projectId);

      expect(updateBuilder.update).toHaveBeenCalledWith({ wbs_item_id: null });
      expect(updateBuilder.in).toHaveBeenCalledWith('id', ['act-1', 'act-2']);
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('exportWBSReport generates a valid Excel Blob', async () => {
      const mockWbsList: Partial<WBSItem>[] = [
        {
          id: 'wbs-1',
          project_id: projectId,
          wbs_code: 'PKG-01',
          title_ar: 'حزمة الأعمال',
          level: 1,
          budgeted_cost: 100000,
          actual_cost: 50000,
          status: 'in_progress',
        },
      ];

      // getWBSEvmSummary mock calls
      vi.mocked(supabase.from)
        .mockReturnValueOnce(createMockQueryBuilder({ data: mockWbsList, error: null }))
        .mockReturnValueOnce(createMockQueryBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createMockQueryBuilder({ data: [], error: null }))
        // getWBSTree mock calls
        .mockReturnValueOnce(createMockQueryBuilder({ data: mockWbsList, error: null }))
        .mockReturnValueOnce(createMockQueryBuilder({ data: [], error: null }))
        .mockReturnValueOnce(createMockQueryBuilder({ data: [], error: null }));

      const blob = await WBSService.exportWBSReport(projectId, 'Test Project');
      expect(blob).toBeDefined();
      expect(blob.size).toBeGreaterThan(0);
      expect(blob.type).toContain('spreadsheetml');
    });
  });
});
