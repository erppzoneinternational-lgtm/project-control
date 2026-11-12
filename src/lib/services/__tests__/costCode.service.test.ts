import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { CostCodeService } from '../costCode.service';
import { CostCode } from '@/types/boq';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

const createMockBuilder = (resolveValue: unknown) => {
  const builder: MockBuilderShape = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    then: vi.fn().mockImplementation((onfulfilled) => {
      onfulfilled(resolveValue);
      return Promise.resolve(resolveValue);
    }),
  };
  return builder as MockQueryBuilder;
};

const MOCK_COST_CODES: CostCode[] = [
  {
    id: 'cc-hdr-m',
    code: 'M00',
    name_ar: 'المواد والتوريدات العامة',
    name_en: 'General Materials',
    category: 'materials',
    prefix: 'M',
    is_header: true,
    is_system: true,
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'cc-leaf-m1',
    code: 'M01.01',
    name_ar: 'أسمنت بورتلاندي عادي',
    name_en: 'Ordinary Portland Cement',
    category: 'materials',
    parent_code: 'M00',
    prefix: 'M',
    is_header: false,
    is_system: true,
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'cc-leaf-m2',
    code: 'M01.02',
    name_ar: 'حديد تسليح عالي المقاومة',
    name_en: 'High Tensile Deformed Rebar',
    category: 'materials',
    parent_code: 'M00',
    prefix: 'M',
    is_header: false,
    is_system: true,
    is_active: true,
    sort_order: 3,
  },
  {
    id: 'cc-custom-1',
    code: 'CUST-01',
    name_ar: 'كود مخصص مشروع',
    name_en: 'Custom Project Code',
    category: 'other',
    prefix: 'C',
    is_header: false,
    is_system: false,
    is_active: true,
    sort_order: 10,
  },
];

describe('CostCodeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  describe('getCostCodes', () => {
    it('fetches cost codes with default ordering', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createMockBuilder({ data: MOCK_COST_CODES, error: null })
      );

      const result = await CostCodeService.getCostCodes();
      expect(result).toHaveLength(4);
      expect(result[0].code).toBe('M00');
    });

    it('filters by category when specified', async () => {
      const mockQuery = createMockBuilder({
        data: MOCK_COST_CODES.filter((c) => c.category === 'materials'),
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await CostCodeService.getCostCodes({ category: 'materials' });
      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'materials');
      expect(result).toHaveLength(3);
    });

    it('filters by prefix when specified', async () => {
      const mockQuery = createMockBuilder({
        data: MOCK_COST_CODES.filter((c) => c.prefix === 'M'),
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await CostCodeService.getCostCodes({ prefix: 'M' });
      expect(mockQuery.eq).toHaveBeenCalledWith('prefix', 'M');
      expect(result).toHaveLength(3);
    });

    it('filters headers only when is_header = true', async () => {
      const mockQuery = createMockBuilder({
        data: MOCK_COST_CODES.filter((c) => c.is_header),
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await CostCodeService.getCostCodes({ is_header: true });
      expect(mockQuery.eq).toHaveBeenCalledWith('is_header', true);
      expect(result).toHaveLength(1);
      expect(result[0].is_header).toBe(true);
    });

    it('filters leaves only when is_header = false', async () => {
      const mockQuery = createMockBuilder({
        data: MOCK_COST_CODES.filter((c) => !c.is_header),
        error: null,
      });
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await CostCodeService.getCostCodes({ is_header: false });
      expect(mockQuery.eq).toHaveBeenCalledWith('is_header', false);
      expect(result).toHaveLength(3);
    });

    it('filters by search term across code and arabic name', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createMockBuilder({ data: MOCK_COST_CODES, error: null })
      );

      const result = await CostCodeService.getCostCodes({ search: 'أسمنت' });
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe('M01.01');
    });
  });

  describe('getCostCodeTree', () => {
    it('structures headers and child leaf items into a hierarchy', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createMockBuilder({ data: MOCK_COST_CODES, error: null })
      );

      const tree = await CostCodeService.getCostCodeTree();
      expect(tree.headers.length).toBeGreaterThanOrEqual(1);

      const headerNode = tree.headers.find((node) => node.code === 'M00');
      expect(headerNode).toBeDefined();
      expect(headerNode?.children).toHaveLength(2);
      expect(headerNode?.children?.map((c) => c.code)).toEqual(['M01.01', 'M01.02']);

      expect(tree.standaloneLeafCodes).toHaveLength(1);
      expect(tree.standaloneLeafCodes[0].code).toBe('CUST-01');
    });
  });

  describe('getCostCodeById & getCostCodeByCode', () => {
    it('returns single cost code by ID', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createMockBuilder({ data: MOCK_COST_CODES[1], error: null })
      );

      const code = await CostCodeService.getCostCodeById('cc-leaf-m1');
      expect(code).toBeDefined();
      expect(code?.code).toBe('M01.01');
    });

    it('returns single cost code by code string', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createMockBuilder({ data: MOCK_COST_CODES[0], error: null })
      );

      const code = await CostCodeService.getCostCodeByCode('M00');
      expect(code).toBeDefined();
      expect(code?.code).toBe('M00');
    });
  });

  describe('saveCostCode & Immutability Security', () => {
    it('blocks updating or mutating system master cost codes and returns null', async () => {
      const result = await CostCodeService.saveCostCode({
        id: 'cc-hdr-m',
        code: 'M00-MUTATED',
        name_ar: 'تعديل غير مصرح',
        category: 'materials',
        is_system: true,
      });

      expect(result).toBeNull();
    });

    it('inserts a new custom cost code with is_system forced to false', async () => {
      const newCodePayload: Partial<CostCode> = {
        code: 'NEW-01',
        name_ar: 'بند تكلفة إضافي',
        category: 'other',
      };

      const insertedCode: CostCode = {
        id: 'new-id-123',
        code: 'NEW-01',
        name_ar: 'بند تكلفة إضافي',
        category: 'other',
        is_system: false,
        is_active: true,
      };

      const mockQuery = createMockBuilder({ data: insertedCode, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await CostCodeService.saveCostCode(newCodePayload);
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({ is_system: false, code: 'NEW-01' })
      );
      expect(result?.id).toBe('new-id-123');
      expect(result?.is_system).toBe(false);
    });

    it('updates an existing non-system custom code successfully', async () => {
      const updatedCode: CostCode = {
        ...MOCK_COST_CODES[3],
        name_ar: 'تعديل الكود المخصص',
      };

      const mockQuery = createMockBuilder({ data: updatedCode, error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await CostCodeService.saveCostCode({
        id: 'cc-custom-1',
        name_ar: 'تعديل الكود المخصص',
        is_system: false,
      });

      expect(mockQuery.update).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('is_system', false);
      expect(result?.name_ar).toBe('تعديل الكود المخصص');
    });
  });

  describe('Entity Cost Code Assignments', () => {
    it('assigns cost code to a BOQ item', async () => {
      const mockQuery = createMockBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const success = await CostCodeService.assignCostCodeToBoqItem('boq-item-1', 'cc-leaf-m1');
      expect(success).toBe(true);
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ cost_code_id: 'cc-leaf-m1' })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'boq-item-1');
    });

    it('unlinks cost code from a BOQ item when passed null', async () => {
      const mockQuery = createMockBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const success = await CostCodeService.assignCostCodeToBoqItem('boq-item-1', null);
      expect(success).toBe(true);
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ cost_code_id: null })
      );
    });

    it('assigns cost code to a site task', async () => {
      const mockQuery = createMockBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const success = await CostCodeService.assignCostCodeToSiteTask('task-100', 'cc-leaf-m2');
      expect(success).toBe(true);
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ cost_code_id: 'cc-leaf-m2' })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'task-100');
    });

    it('assigns cost code to a project activity', async () => {
      const mockQuery = createMockBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const success = await CostCodeService.assignCostCodeToActivity('act-55', 'cc-leaf-m1');
      expect(success).toBe(true);
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({ cost_code_id: 'cc-leaf-m1' })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'act-55');
    });

    it('performs bulk assignment across multiple IDs', async () => {
      const mockQuery = createMockBuilder({ error: null });
      vi.mocked(supabase.from).mockReturnValue(mockQuery);

      const result = await CostCodeService.bulkAssignCostCode(
        ['item-1', 'item-2', 'item-3'],
        'cc-leaf-m1',
        'boq'
      );

      expect(result.success).toBe(3);
      expect(result.failed).toBe(0);
      expect(mockQuery.in).toHaveBeenCalledWith('id', ['item-1', 'item-2', 'item-3']);
    });
  });

  describe('getStats', () => {
    it('computes accurate cost code counts, system vs custom, and divisions', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createMockBuilder({ data: MOCK_COST_CODES, error: null })
      );

      const stats = await CostCodeService.getStats();
      expect(stats.total).toBe(4);
      expect(stats.systemMasterCodes).toBe(3);
      expect(stats.parentGroupHeaders).toBe(1);
      expect(stats.leafTransactionalCodes).toBe(3);
      expect(stats.divisionBreakdown.M).toBe(3);
      expect(stats.divisionBreakdown.C).toBe(1);
    });
  });
});
