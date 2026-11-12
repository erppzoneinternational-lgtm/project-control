import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { TOProgressService } from '../toProgress.service';
import { DeliverableItem, ToProgressLog } from '@/types/planning';

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
    then: vi.fn().mockImplementation((onfulfilled) => {
      return Promise.resolve(resolveValue).then(onfulfilled);
    }),
  };
  return builder as MockQueryBuilder;
};

describe('TOProgressService Unit Test Suite (WS-2 & WS-6)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  // 1. getAssignedTasks: returns deliverable items assigned to stakeholder
  it('getAssignedTasks: returns deliverable items assigned to stakeholder', async () => {
    const mockItems = [
      {
        id: 'item-1',
        deliverable_id: 'deliv-1',
        item_type: 'drawing',
        description: 'Structural foundation layout',
        assigned_stakeholder_id: 'sh-engineer-1',
        progress_pct: 45,
        status: 'in_progress',
      },
    ];

    const builder = createMockQueryBuilder({ data: mockItems, error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const items = await TOProgressService.getAssignedTasks('sh-engineer-1');

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('item-1');
  });

  // 2. getAssignedTasks: filters by projectId when provided
  it('getAssignedTasks: filters by projectId when provided', async () => {
    const builder = createMockQueryBuilder({ data: [], error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    await TOProgressService.getAssignedTasks('sh-engineer-1', 'proj-123');
  });

  // 3. logDailyProgress: rejects progress percentages outside [0, 100]
  it('logDailyProgress: rejects progress percentages outside [0, 100]', async () => {
    await expect(
      TOProgressService.logDailyProgress({
        deliverable_item_id: 'item-1',
        project_id: 'proj-1',
        progress_pct: 120,
      })
    ).rejects.toThrow(/INVALID_PROGRESS_PERCENT/);

    await expect(
      TOProgressService.logDailyProgress({
        deliverable_item_id: 'item-1',
        project_id: 'proj-1',
        progress_pct: -5,
      })
    ).rejects.toThrow(/INVALID_PROGRESS_PERCENT/);
  });

  // 4. logDailyProgress: creates pm_to_progress_logs record in draft status
  it('logDailyProgress: creates pm_to_progress_logs record in draft status', async () => {
    const mockLog: Partial<ToProgressLog> = {
      id: 'log-1',
      deliverable_item_id: 'item-1',
      project_id: 'proj-1',
      progress_pct: 60,
      notes: 'Completed rebar layout',
      to_manager_approved: false,
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pm_to_progress_logs') {
        return {
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockLog, error: null }),
            }),
          }),
        } as never;
      }
      if (table === 'pm_deliverable_items') {
        return createMockQueryBuilder({ data: null, error: null });
      }
      return createMockQueryBuilder({ data: null, error: null });
    });

    const result = await TOProgressService.logDailyProgress({
      deliverable_item_id: 'item-1',
      project_id: 'proj-1',
      progress_pct: 60,
      work_description: 'Completed rebar layout',
    });

    expect(result).toBeDefined();
    expect(result?.id).toBe('log-1');
    expect(result?.progress_pct).toBe(60);
    expect(result?.status).toBe('draft');
  });

  // 5. logDailyProgress: updates pm_deliverable_items.progress_pct
  it('logDailyProgress: updates pm_deliverable_items.progress_pct', async () => {
    const mockLog = { id: 'log-2', deliverable_item_id: 'item-1', progress_pct: 75 };
    let itemProgressUpdated = false;

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pm_to_progress_logs') {
        return {
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockLog, error: null }),
            }),
          }),
        } as never;
      }
      if (table === 'pm_deliverable_items') {
        return {
          update: vi.fn().mockImplementation((payload) => {
            if (payload.progress_pct === 75) {
              itemProgressUpdated = true;
            }
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        } as never;
      }
      return createMockQueryBuilder({ data: null, error: null });
    });

    await TOProgressService.logDailyProgress({
      deliverable_item_id: 'item-1',
      project_id: 'proj-1',
      progress_pct: 75,
    });

    expect(itemProgressUpdated).toBe(true);
  });

  // 6. getProgressHistory: returns chronological log entries for an item
  it('getProgressHistory: returns chronological log entries for an item', async () => {
    const mockHistory = [
      { id: 'log-2', log_date: '2026-08-31', progress_pct: 80, notes: 'Rev 2 updates' },
      { id: 'log-1', log_date: '2026-08-30', progress_pct: 40, notes: 'Initial pass' },
    ];

    const builder = createMockQueryBuilder({ data: mockHistory, error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const history = await TOProgressService.getProgressHistory('item-1');

    expect(history).toHaveLength(2);
    expect(history[0].progress_pct).toBe(80);
    expect(history[1].progress_pct).toBe(40);
  });

  // 7. submitProgressForApproval: changes deliverable item status to ready_to_return
  it('submitProgressForApproval: changes deliverable item status to ready_to_return', async () => {
    let itemStatusSubmitted = false;

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pm_to_progress_logs') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        } as never;
      }
      if (table === 'pm_deliverable_items') {
        return {
          update: vi.fn().mockImplementation((payload) => {
            if (payload.status === 'ready_to_return') {
              itemStatusSubmitted = true;
            }
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        } as never;
      }
      return createMockQueryBuilder({ data: null, error: null });
    });

    const success = await TOProgressService.submitProgressForApproval('item-1', 'log-1');

    expect(success).toBe(true);
    expect(itemStatusSubmitted).toBe(true);
  });

  // 8. getApprovalQueue: returns pending submitted logs with joined engineer and deliverable names
  it('getApprovalQueue: returns pending submitted logs with joined engineer and deliverable names', async () => {
    const mockQueueRow = {
      id: 'log-q-1',
      progress_pct: 100,
      notes: 'Drawing ready for consultant transmittal',
      to_manager_approved: false,
      deliverable_item: {
        id: 'item-q-1',
        description: 'Piping schematic',
        deliverable: {
          id: 'deliv-1',
          ref_code: 'E1-002',
          title_ar: 'اعتماد المخططات الميكانيكية',
          project_id: 'proj-1',
          project: { name_ar: 'مشروع أبراج النيل' },
        },
      },
      engineer: {
        id: 'eng-1',
        name_ar: 'م. أحمد مهدي',
        employee_code: 'EMP-104',
      },
    };

    const builder = createMockQueryBuilder({ data: [mockQueueRow], error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const queue = await TOProgressService.getApprovalQueue('proj-1');

    expect(queue).toHaveLength(1);
    expect(queue[0].deliverable.ref_code).toBe('E1-002');
    expect(queue[0].engineer.name_ar).toBe('م. أحمد مهدي');
    expect(queue[0].log.status).toBe('submitted');
  });

  // 9. signOffProgress: sets log to approved, sets to_manager_approved = true, updates reviewer timestamp
  it('signOffProgress: sets log to approved, sets to_manager_approved = true, updates reviewer timestamp', async () => {
    let logApproved = false;
    let itemApproved = false;

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pm_to_progress_logs') {
        return {
          update: vi.fn().mockImplementation((payload) => {
            if (payload.to_manager_approved === true && payload.approved_by === 'mgr-1') {
              logApproved = true;
            }
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        } as never;
      }
      if (table === 'pm_deliverable_items') {
        return {
          update: vi.fn().mockImplementation((payload) => {
            if (payload.to_manager_approved === true && payload.status === 'ready_to_return') {
              itemApproved = true;
            }
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        } as never;
      }
      return createMockQueryBuilder({ data: null, error: null });
    });

    const success = await TOProgressService.signOffProgress({
      logId: 'log-1',
      deliverableItemId: 'item-1',
      approved: true,
      managerStakeholderId: 'mgr-1',
      comments: 'Approved for transmittal',
    });

    expect(success).toBe(true);
    expect(logApproved).toBe(true);
    expect(itemApproved).toBe(true);
  });

  // 10. signOffProgress: sets log to rejected with comments if manager rejects
  it('signOffProgress: sets log to rejected with comments if manager rejects', async () => {
    let rejectionLogged = false;
    let itemResetToInProgress = false;

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pm_to_progress_logs') {
        return {
          update: vi.fn().mockImplementation((payload) => {
            if (payload.to_manager_approved === false && payload.rejection_reason === 'Missing elevation tags') {
              rejectionLogged = true;
            }
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        } as never;
      }
      if (table === 'pm_deliverable_items') {
        return {
          update: vi.fn().mockImplementation((payload) => {
            if (payload.to_manager_approved === false && payload.status === 'in_progress') {
              itemResetToInProgress = true;
            }
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          }),
        } as never;
      }
      return createMockQueryBuilder({ data: null, error: null });
    });

    const success = await TOProgressService.signOffProgress({
      logId: 'log-1',
      deliverableItemId: 'item-1',
      approved: false,
      managerStakeholderId: 'mgr-1',
      comments: 'Missing elevation tags',
    });

    expect(success).toBe(true);
    expect(rejectionLogged).toBe(true);
    expect(itemResetToInProgress).toBe(true);
  });

  // 11. Consultant Code C trigger: auto-increments submission_revision and resets status to in_progress
  it('Consultant Code C trigger: auto-increments submission_revision and resets status to in_progress', async () => {
    let payloadSent: Record<string, unknown> = null as never;

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pm_deliverable_items') {
        return {
          update: vi.fn().mockImplementation((payload) => {
            payloadSent = payload;
            return {
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'item-1', ...payload },
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

    const result = await TOProgressService.handleConsultantReview({
      itemId: 'item-1',
      consultantStatus: 'C',
      currentRevision: 2,
    });

    expect(result).toBeDefined();
    expect(payloadSent.submission_revision).toBe(3);
    expect(payloadSent.status).toBe('in_progress');
    expect(payloadSent.to_manager_approved).toBe(false);
  });

  // 12. Consultant Code A/B trigger: sets item status to returned/approved and unblocks item
  it('Consultant Code A/B trigger: sets item status to approved/returned and auto-unblocks item', async () => {
    let payloadSent: Record<string, unknown> = null as never;

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pm_deliverable_items') {
        return {
          update: vi.fn().mockImplementation((payload) => {
            payloadSent = payload;
            return {
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { id: 'item-1', ...payload },
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

    const result = await TOProgressService.handleConsultantReview({
      itemId: 'item-1',
      consultantStatus: 'A',
      currentRevision: 1,
    });

    expect(result).toBeDefined();
    expect(payloadSent.to_manager_approved).toBe(true);
    expect(payloadSent.progress_pct).toBe(100);
    expect(payloadSent.blocked_reason).toBeNull();
  });

  // 13. assignDeliverableItem: assigns TO engineer, sets assigned_by, assigned_at, and optional due_date
  it('assignDeliverableItem: assigns TO engineer, sets assigned_by, assigned_at, and due_date', async () => {
    const assignedItem: Partial<DeliverableItem> = {
      id: 'item-1',
      assigned_stakeholder_id: 'eng-salem',
      assigned_by: 'mgr-omar',
      due_date: '2026-09-15',
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pm_deliverable_items') {
        return {
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: assignedItem, error: null }),
              }),
            }),
          }),
        } as never;
      }
      return createMockQueryBuilder({ data: null, error: null });
    });

    const res = await TOProgressService.assignDeliverableItem({
      itemId: 'item-1',
      assignedStakeholderId: 'eng-salem',
      assignedBy: 'mgr-omar',
      dueDate: '2026-09-15',
    });

    expect(res).toBeDefined();
    expect(res?.assigned_stakeholder_id).toBe('eng-salem');
    expect(res?.due_date).toBe('2026-09-15');
  });

  // 14. Cache invalidations on mutations
  it('Cache invalidations on mutations', async () => {
    const invalidateSpy = vi.spyOn(appCache, 'invalidate');

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pm_to_progress_logs') {
        return {
          upsert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'l-1' }, error: null }),
            }),
          }),
        } as never;
      }
      return createMockQueryBuilder({ data: null, error: null });
    });

    await TOProgressService.logDailyProgress({
      deliverable_item_id: 'item-mut-1',
      project_id: 'p-1',
      progress_pct: 50,
    });

    expect(invalidateSpy).toHaveBeenCalledWith('toProgress:');
    expect(invalidateSpy).toHaveBeenCalledWith('toProgress:history:item-mut-1');
    expect(invalidateSpy).toHaveBeenCalledWith('deliverables:');
  });
});
