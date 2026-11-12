import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { DeliverablesService } from '../deliverables.service';
import { calculateDeliverableBottlenecks } from '@/lib/planning/calculations';
import {
  Deliverable,
  DeliverableItem,
  DeliverableStatus,
  RfiRegisterItem,
  CooDeliverablesSummary,
} from '@/types/planning';

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

describe('DeliverablesService Suite (R4 & Deliverables Workflow)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  // =========================================================================
  // 1. Kanban State Transitions & Lifecycle
  // =========================================================================
  describe('Kanban State Transitions & CRUD', () => {
    it('getDeliverables retrieves deliverables filtered by status and utilizes cache', async () => {
      const mockDeliverables: Partial<Deliverable>[] = [
        {
          id: 'del-1',
          project_id: 'p-1',
          ref_code: 'E1-ARC-01',
          title_ar: 'لوحات المعماري',
          status: 'in_progress',
        },
        {
          id: 'del-2',
          project_id: 'p-1',
          ref_code: 'E1-STR-01',
          title_ar: 'لوحات الإنشائي',
          status: 'in_progress',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: mockDeliverables, error: null })
      );

      const items = await DeliverablesService.getDeliverables('p-1', 'in_progress');
      expect(items).toHaveLength(2);
      expect(items[0].ref_code).toBe('E1-ARC-01');

      // Second call should return from cache without re-querying Supabase
      const cached = await DeliverablesService.getDeliverables('p-1', 'in_progress');
      expect(cached).toHaveLength(2);
    });

    it('updateDeliverableStatus transitions deliverable through normal workflow', async () => {
      const transitions: DeliverableStatus[] = [
        'received',
        'in_progress',
        'ready_to_return',
        'returned',
      ];

      for (const targetStatus of transitions) {
        const mockDel: Partial<Deliverable> = {
          id: 'del-100',
          project_id: 'p-1',
          status: targetStatus,
        };

        vi.mocked(supabase.from).mockImplementation((table: string) => {
          if (table === 'pm_deliverables') {
            return {
              update: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: mockDel, error: null }),
                  }),
                }),
              }),
            } as never;
          }
          if (table === 'pm_deliverable_events') {
            return {
              insert: vi.fn().mockResolvedValue({ error: null }),
            } as never;
          }
          return createMockQueryBuilder({ data: null, error: null });
        });

        const updated = await DeliverablesService.updateDeliverableStatus(
          'del-100',
          'p-1',
          targetStatus,
          undefined,
          'eng-lead'
        );

        expect(updated?.status).toBe(targetStatus);
      }
    });

    it('saveDeliverable creates a new deliverable package with default status received', async () => {
      const newDel: Partial<Deliverable> = {
        project_id: 'p-1',
        ref_code: 'E2-MEP-01',
        title_ar: 'اعتماد خامات السباكة',
        kind: 'E2',
      };

      const createdDel = {
        id: 'del-new-1',
        ...newDel,
        status: 'received',
        created_at: '2026-08-23T10:00:00Z',
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_deliverables') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: createdDel, error: null }),
              }),
            }),
          } as never;
        }
        if (table === 'pm_deliverable_events') {
          return {
            insert: vi.fn().mockResolvedValue({ error: null }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const res = await DeliverablesService.saveDeliverable(newDel, 'eng-creator');
      expect(res?.id).toBe('del-new-1');
      expect(res?.status).toBe('received');
      expect(res?.kind).toBe('E2');
    });
  });

  // =========================================================================
  // 2. Blocker Reason Enforcement & Mandatory RFI Linkage
  // =========================================================================
  describe('Blocker Reason Enforcement & RFI Linkage', () => {
    it('saveDeliverable throws error if status is blocked without a valid reason', async () => {
      await expect(
        DeliverablesService.saveDeliverable({
          project_id: 'p-1',
          ref_code: 'E1-01',
          status: 'blocked',
          blocked_reason: '', // Empty reason!
        })
      ).rejects.toThrow(/Blocked reason is required/);

      await expect(
        DeliverablesService.saveDeliverable({
          project_id: 'p-1',
          ref_code: 'E1-01',
          status: 'blocked',
          blocked_reason: '   ', // Whitespace only!
        })
      ).rejects.toThrow(/Blocked reason is required/);
    });

    it('updateDeliverableStatus throws error if status is blocked without a valid reason', async () => {
      await expect(
        DeliverablesService.updateDeliverableStatus('del-1', 'p-1', 'blocked', '')
      ).rejects.toThrow(/Reason is required/);

      await expect(
        DeliverablesService.updateDeliverableStatus('del-1', 'p-1', 'blocked', '   ')
      ).rejects.toThrow(/Reason is required/);
    });

    it('linkBlockerWithRfi marks deliverable blocked and creates linked RFI in pm_rfi_register', async () => {
      const existingDel: Partial<Deliverable> = {
        id: 'del-block-1',
        project_id: 'p-1',
        ref_code: 'E1-STR-50',
        title_ar: 'لوحات الأعمدة',
        status: 'in_progress',
      };

      const blockedDel: Partial<Deliverable> = {
        ...existingDel,
        status: 'blocked',
        blocked_reason: 'Structural column discrepancy with architectural grid',
      };

      const savedRfi: Partial<RfiRegisterItem> = {
        id: 'rfi-new-1',
        project_id: 'p-1',
        rfi_no: 'RFI-STR-010',
        subject: 'Blocker for E1-STR-50: Structural column discrepancy with architectural grid',
        status: 'sent',
      };

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_deliverables') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingDel, error: null }),
            }),
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
            insert: vi.fn().mockResolvedValue({ error: null }),
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

      const blockerReason = 'Structural column discrepancy with architectural grid';
      const result = await DeliverablesService.linkBlockerWithRfi(
        'del-block-1',
        { rfi_no: 'RFI-STR-010' },
        blockerReason
      );

      expect(result.deliverable).toBeDefined();
      expect(result.deliverable?.status).toBe('blocked');
      expect(result.deliverable?.blocked_reason).toBe(blockerReason);

      expect(result.rfi).toBeDefined();
      expect(result.rfi?.id).toBe('rfi-new-1');
      expect(result.rfi?.status).toBe('sent');
      expect(result.rfi?.subject).toContain('Blocker for E1-STR-50');
    });
  });

  // =========================================================================
  // 3. Consultant Code C Revision Cycle
  // =========================================================================
  describe('Consultant Code C Revision Cycle', () => {
    it('automatically increments submission_revision and resets status to in_progress on Code C', async () => {
      const itemToUpdate: Partial<DeliverableItem> = {
        id: 'item-drawing-1',
        deliverable_id: 'del-1',
        description: 'Ground Floor HVAC Ducting',
        submission_revision: 2,
        consultant_status: 'C', // Code C received
        status: 'ready_to_return', // Old status
      };

      let insertedPayload: Record<string, unknown> = null as never;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_deliverable_items') {
          return {
            update: vi.fn().mockImplementation((payload) => {
              insertedPayload = payload;
              return {
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { ...itemToUpdate, ...payload },
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

      const res = await DeliverablesService.saveDeliverableItem(itemToUpdate);

      expect(res).toBeDefined();
      // submission_revision was 2, should auto-increment to 3
      expect(insertedPayload.submission_revision).toBe(3);
      // Status must be reset to 'in_progress' for technical office rework
      expect(insertedPayload.status).toBe('in_progress');
      expect(res?.submission_revision).toBe(3);
      expect(res?.status).toBe('in_progress');
    });

    it('retains submission_revision and status on Code A or Code B approval', async () => {
      const itemCodeA: Partial<DeliverableItem> = {
        id: 'item-drawing-2',
        deliverable_id: 'del-1',
        description: 'Foundation Details',
        submission_revision: 1,
        consultant_status: 'A',
        status: 'returned',
      };

      let insertedPayload: Record<string, unknown> = null as never;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_deliverable_items') {
          return {
            update: vi.fn().mockImplementation((payload) => {
              insertedPayload = payload;
              return {
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({
                      data: { ...itemCodeA, ...payload },
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

      const res = await DeliverablesService.saveDeliverableItem(itemCodeA);

      expect(res).toBeDefined();
      expect(insertedPayload.submission_revision).toBe(1);
      expect(insertedPayload.status).toBe('returned');
    });
  });

  // =========================================================================
  // 4. Engineer Assignments & Work Duration Tracking
  // =========================================================================
  describe('Engineer Assignments & Work Timestamps', () => {
    it('startWorkOnItem assigns stakeholder and invokes rpc_deliverable_item_transition with start_work', async () => {
      const itemId = 'item-101';
      const stakeholderId = 'stk-eng-ahmed';

      let updatePayload: Record<string, unknown> = null as never;

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_deliverable_items') {
          return {
            update: vi.fn().mockImplementation((payload) => {
              updatePayload = payload;
              return {
                eq: vi.fn().mockResolvedValue({ error: null }),
              };
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: itemId,
                    deliverable_id: 'del-1',
                    status: 'in_progress',
                    assigned_stakeholder_id: stakeholderId,
                    work_started_at: '2026-08-20T08:00:00.000Z',
                  },
                  error: null,
                }),
              }),
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true, item_id: itemId, action: 'start_work' },
        error: null,
      } as never);

      const item = await DeliverablesService.startWorkOnItem(itemId, stakeholderId);

      expect(item).toBeDefined();
      expect(item?.status).toBe('in_progress');
      expect(updatePayload.assigned_stakeholder_id).toBe(stakeholderId);
      expect(updatePayload.work_started_at).toBeDefined();
      expect(supabase.rpc).toHaveBeenCalledWith('rpc_deliverable_item_transition', {
        p_item_id: itemId,
        p_action: 'start_work',
      });
    });

    it('completeWorkOnItem transitions to ready_to_return via rpc_deliverable_item_transition', async () => {
      const itemId = 'item-101';

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_deliverable_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: itemId,
                    deliverable_id: 'del-1',
                    status: 'ready_to_return',
                    completed_at: '2026-08-23T14:00:00.000Z',
                  },
                  error: null,
                }),
              }),
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true, item_id: itemId, action: 'submit_to_manager' },
        error: null,
      } as never);

      const item = await DeliverablesService.completeWorkOnItem(itemId);

      expect(item).toBeDefined();
      expect(item?.status).toBe('ready_to_return');
      expect(supabase.rpc).toHaveBeenCalledWith('rpc_deliverable_item_transition', {
        p_item_id: itemId,
        p_action: 'submit_to_manager',
      });
    });

    it('managerApproveItem, managerRejectItem, recordConsultantCode, blockItem, unblockItem call rpc_deliverable_item_transition', async () => {
      const itemId = 'item-202';

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_deliverable_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: itemId,
                    deliverable_id: 'del-1',
                    status: 'returned',
                  },
                  error: null,
                }),
              }),
            }),
          } as never;
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: { success: true, item_id: itemId },
        error: null,
      } as never);

      // Manager approve
      await DeliverablesService.managerApproveItem(itemId);
      expect(supabase.rpc).toHaveBeenCalledWith('rpc_deliverable_item_transition', {
        p_item_id: itemId,
        p_action: 'manager_approve',
        p_reason: null,
        p_consultant_code: null,
      });

      // Manager reject
      await DeliverablesService.managerRejectItem(itemId, 'Missing dimensions');
      expect(supabase.rpc).toHaveBeenCalledWith('rpc_deliverable_item_transition', {
        p_item_id: itemId,
        p_action: 'manager_reject',
        p_reason: 'Missing dimensions',
        p_consultant_code: null,
      });

      // Record consultant code
      await DeliverablesService.recordConsultantCode(itemId, 'A', 'Approved with no comments');
      expect(supabase.rpc).toHaveBeenCalledWith('rpc_deliverable_item_transition', {
        p_item_id: itemId,
        p_action: 'record_consultant_code',
        p_reason: 'Approved with no comments',
        p_consultant_code: 'A',
      });

      // Block
      await DeliverablesService.blockItem(itemId, 'Awaiting structural calculations');
      expect(supabase.rpc).toHaveBeenCalledWith('rpc_deliverable_item_transition', {
        p_item_id: itemId,
        p_action: 'block',
        p_reason: 'Awaiting structural calculations',
        p_consultant_code: null,
      });

      // Unblock
      await DeliverablesService.unblockItem(itemId);
      expect(supabase.rpc).toHaveBeenCalledWith('rpc_deliverable_item_transition', {
        p_item_id: itemId,
        p_action: 'unblock',
        p_reason: null,
        p_consultant_code: null,
      });
    });

    it('calculates duration between work_started_at and completed_at accurately', () => {
      const startedAt = '2026-08-20T08:00:00.000Z';
      const completedAt = '2026-08-23T14:00:00.000Z';

      const durationHours = (new Date(completedAt).getTime() - new Date(startedAt).getTime()) / (1000 * 60 * 60);
      expect(durationHours).toBe(78); // 3 days + 6 hours
    });
  });

  // =========================================================================
  // 5. getMyDeliverables Personal Filtering
  // =========================================================================
  describe('getMyDeliverables Filtering', () => {
    it('getMyDeliverables filters deliverable items for the assigned engineer', async () => {
      const engineerId = 'stk-engineer-mohamed';
      const myItems: Partial<DeliverableItem>[] = [
        {
          id: 'item-1',
          deliverable_id: 'del-1',
          assigned_stakeholder_id: engineerId,
          description: 'Shop drawing Section A',
          status: 'in_progress',
        },
        {
          id: 'item-2',
          deliverable_id: 'del-2',
          assigned_stakeholder_id: engineerId,
          description: 'Shop drawing Section B',
          status: 'ready_to_return',
        },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: myItems, error: null })
      );

      const items = await DeliverablesService.getMyDeliverables(engineerId);
      expect(items).toHaveLength(2);
      expect(items[0].assigned_stakeholder_id).toBe(engineerId);
      expect(items[1].assigned_stakeholder_id).toBe(engineerId);
    });

    it('returns empty array when engineer has no assigned deliverables', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: [], error: null })
      );

      const items = await DeliverablesService.getMyDeliverables('stk-unassigned');
      expect(items).toEqual([]);
    });
  });

  // =========================================================================
  // 6. COO Portfolio Aggregation & Bottleneck Analysis
  // =========================================================================
  describe('COO Portfolio Aggregation & Bottlenecks', () => {
    it('getCooDeliverablesSummary aggregates counts, Code C items, overdue RFIs and bottlenecks', async () => {
      const mockDeliverables: Deliverable[] = [
        {
          id: 'del-1',
          project_id: 'p-1',
          ref_code: 'E1-01',
          title_ar: 'معماري 1',
          kind: 'E1',
          received_from: 'technical_office',
          received_at: '2026-08-01',
          status: 'in_progress',
          priority: 'high',
          items: [
            {
              id: 'it-1',
              deliverable_id: 'del-1',
              item_type: 'drawing',
              description: 'Detail 1',
              current_rev: 1,
              consultant_status: 'C', // Code C!
              submission_revision: 2,
              status: 'in_progress',
            },
          ],
        },
        {
          id: 'del-2',
          project_id: 'p-1',
          ref_code: 'E1-02',
          title_ar: 'إنشائي 1',
          kind: 'E1',
          received_from: 'technical_office',
          received_at: '2026-08-01',
          status: 'blocked', // Blocked!
          blocked_reason: 'RFI 05 pending',
          priority: 'high',
          items: [],
        },
        {
          id: 'del-3',
          project_id: 'p-1',
          ref_code: 'E2-01',
          title_ar: 'خامات 1',
          kind: 'E2',
          received_from: 'technical_office',
          received_at: '2026-08-01',
          status: 'ready_to_return',
          priority: 'normal',
          items: [],
        },
        {
          id: 'del-4',
          project_id: 'p-1',
          ref_code: 'E2-02',
          title_ar: 'خامات 2',
          kind: 'E2',
          received_from: 'technical_office',
          received_at: '2026-08-01',
          status: 'returned',
          priority: 'normal',
          items: [],
        },
      ];

      const mockRfis: RfiRegisterItem[] = [
        {
          id: 'rfi-1',
          project_id: 'p-1',
          rfi_no: 'RFI-01',
          subject: 'Clarification',
          sent_date: '2026-08-01',
          target_reply_date: '2020-01-01', // Past date -> Overdue
          status: 'sent',
        },
        {
          id: 'rfi-2',
          project_id: 'p-1',
          rfi_no: 'RFI-02',
          subject: 'Fixture type',
          sent_date: '2026-08-20',
          target_reply_date: '2099-12-31', // Far future date -> Not overdue
          status: 'sent',
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_deliverables') {
          return createMockQueryBuilder({ data: mockDeliverables, error: null });
        }
        if (table === 'pm_rfi_register') {
          return createMockQueryBuilder({ data: mockRfis, error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const summary: CooDeliverablesSummary = await DeliverablesService.getCooDeliverablesSummary('p-1');

      expect(summary.total_deliverables).toBe(4);
      expect(summary.in_progress_count).toBe(1);
      expect(summary.blocked_count).toBe(1);
      expect(summary.ready_to_return_count).toBe(1);
      expect(summary.returned_count).toBe(1);
      expect(summary.code_c_count).toBe(1);
      expect(summary.overdue_rfis_count).toBe(1);
      expect(summary.bottlenecks).toHaveLength(2); // del-1 (Code C item) & del-2 (blocked)
    });
  });

  // =========================================================================
  // 7. RFI Register Operations
  // =========================================================================
  describe('RFI Register Operations', () => {
    it('getRfiRegister retrieves list of project RFIs', async () => {
      const mockRfis = [
        { id: 'r-1', project_id: 'p-1', rfi_no: 'RFI-001', subject: 'Soil report query' },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: mockRfis, error: null })
      );

      const rfis = await DeliverablesService.getRfiRegister('p-1');
      expect(rfis).toHaveLength(1);
      expect(rfis[0].rfi_no).toBe('RFI-001');
    });

    it('saveRfiItem creates and updates RFI items', async () => {
      const rfi: Partial<RfiRegisterItem> = {
        project_id: 'p-1',
        rfi_no: 'RFI-002',
        subject: 'Tile specification discrepancy',
        status: 'draft',
      };

      const savedRfi = { id: 'rfi-saved-1', ...rfi };

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: savedRfi, error: null })
      );

      const result = await DeliverablesService.saveRfiItem(rfi);
      expect(result?.id).toBe('rfi-saved-1');
      expect(result?.rfi_no).toBe('RFI-002');
    });
  });
});
