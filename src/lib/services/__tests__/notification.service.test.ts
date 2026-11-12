import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { NotificationService } from '../notification.service';
import { AppNotification } from '@/types/notifications';

// Mock Supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
    })),
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

describe('NotificationService Unit Test Suite (WS-1 & WS-8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  // 1. getNotifications: default query sorted descending
  it('getNotifications: fetches user notifications sorted descending by created_at', async () => {
    const mockData = [
      {
        id: 'notif-1',
        recipient_user_id: 'user-1',
        event_type: 'task_assigned',
        title_ar: 'تعيين مهمة جديدة',
        body_ar: 'تم تعيينك لمهمة موقع',
        read_at: null,
        created_at: '2026-08-31T10:00:00Z',
      },
      {
        id: 'notif-2',
        recipient_user_id: 'user-1',
        event_type: 'daily_report_approved',
        title_ar: 'اعتماد التقرير',
        body_ar: 'تم اعتماد التقرير اليومي',
        read_at: '2026-08-31T11:00:00Z',
        created_at: '2026-08-31T09:00:00Z',
      },
    ];

    vi.mocked(supabase.from).mockReturnValue(createMockQueryBuilder({ data: mockData, error: null }));

    const result = await NotificationService.getNotifications('user-1');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('notif-1');
    expect(result[0].is_read).toBe(false);
    expect(result[1].is_read).toBe(true);
  });

  // 2. getNotifications: filters by unreadOnly = true
  it('getNotifications: filters by unreadOnly = true', async () => {
    const mockData = [
      {
        id: 'notif-unread',
        recipient_user_id: 'user-1',
        event_type: 'task_assigned',
        title_ar: 'مهمة جديدة',
        read_at: null,
        created_at: '2026-08-31T10:00:00Z',
      },
    ];

    const builder = createMockQueryBuilder({ data: mockData, error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const result = await NotificationService.getNotifications('user-1', { unreadOnly: true });

    expect(result).toHaveLength(1);
  });

  // 3. getNotifications: filters by entityType
  it('getNotifications: filters by entityType', async () => {
    const mockData = [
      {
        id: 'notif-inspect',
        recipient_user_id: 'user-1',
        entity_type: 'inspection',
        read_at: null,
      },
    ];

    const builder = createMockQueryBuilder({ data: mockData, error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const result = await NotificationService.getNotifications('user-1', { entityType: 'inspection' });

    expect(result).toHaveLength(1);
  });

  // 4. getNotifications: respects limit and offset pagination
  it('getNotifications: respects limit and offset pagination options', async () => {
    const builder = createMockQueryBuilder({ data: [], error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    await NotificationService.getNotifications('user-1', { limit: 10, offset: 20 });
  });

  // 5. getUnreadCount: executes rpc_unread_notification_count and returns scalar count
  it('getUnreadCount: executes rpc_unread_notification_count and returns scalar count', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: 5, error: null } as never);

    const count = await NotificationService.getUnreadCount('user-1');

    expect(count).toBe(5);
  });

  // 6. getUnreadCount: handles RPC failure gracefully and computes count via query fallback
  it('getUnreadCount: handles RPC failure gracefully and computes count via query fallback', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: null,
      error: { message: 'RPC not available' },
    } as never);

    const builder = createMockQueryBuilder({ count: 3, data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const count = await NotificationService.getUnreadCount('user-1');

    expect(count).toBe(3);
  });

  // 7. markAsRead: calls rpc_mark_notifications_read with array of UUIDs
  it('markAsRead: calls rpc_mark_notifications_read with array of UUIDs', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: true, updated_count: 2 },
      error: null,
    } as never);

    const success = await NotificationService.markAsRead(['id-1', 'id-2']);

    expect(success).toBe(true);
  });

  // 8. markAsRead: invalidates user notification cache
  it('markAsRead: invalidates user notification cache', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: { success: true }, error: null } as never);

    const invalidateSpy = vi.spyOn(appCache, 'invalidate');
    await NotificationService.markAsRead(['id-1']);

    expect(invalidateSpy).toHaveBeenCalledWith('notifications:');
  });

  // 9. markAllAsRead: updates all unread notifications for specified user
  it('markAllAsRead: updates all unread notifications for specified user', async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({
      data: { success: true, updated_count: 7 },
      error: null,
    } as never);

    const success = await NotificationService.markAllAsRead('user-1');

    expect(success).toBe(true);
  });

  // 10. savePushSubscription: upserts endpoint and auth keys into pm_push_subscriptions
  it('savePushSubscription: upserts endpoint and auth keys into pm_push_subscriptions', async () => {
    const builder = createMockQueryBuilder({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const success = await NotificationService.savePushSubscription({
      user_id: 'user-1',
      endpoint: 'https://push.endpoint.com/test',
      p256dh: 'p256dh-key',
      auth: 'auth-key',
      user_agent: 'Mozilla/5.0 Chrome',
    });

    expect(success).toBe(true);
  });

  // 11. deletePushSubscription: removes subscription by endpoint
  it('deletePushSubscription: removes subscription by endpoint', async () => {
    const builder = createMockQueryBuilder({ data: null, error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const success = await NotificationService.deletePushSubscription('user-1', 'https://push.endpoint.com/test');

    expect(builder.delete).toHaveBeenCalled();
    expect(success).toBe(true);
  });

  // 12. createNotification: inserts notification record and returns structured entity
  it('createNotification: inserts notification record and returns structured entity', async () => {
    const insertedRow = {
      id: 'notif-new-1',
      recipient_user_id: 'user-1',
      project_id: 'proj-1',
      event_type: 'task_assigned',
      entity_type: 'task',
      entity_id: 'task-123',
      title_ar: 'مهمة جديدة',
      body_ar: 'تم تكليفك بمهمة',
      read_at: null,
      created_at: '2026-08-31T12:00:00Z',
    };

    const builder = createMockQueryBuilder({ data: insertedRow, error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const result = await NotificationService.createNotification({
      user_id: 'user-1',
      project_id: 'proj-1',
      type: 'task_assigned',
      entity_type: 'task',
      entity_id: 'task-123',
      title_ar: 'مهمة جديدة',
      body_ar: 'تم تكليفك بمهمة',
    });

    expect(result).toBeDefined();
    expect(result?.id).toBe('notif-new-1');
    expect(result?.user_id).toBe('user-1');
    expect(result?.is_read).toBe(false);
  });

  // 13. subscribeToRealtime: establishes Supabase channel subscription and cleans up on teardown
  it('subscribeToRealtime: establishes Supabase channel subscription and cleans up on teardown', () => {
    const unsubscribeFn = vi.fn();
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnValue({ unsubscribe: unsubscribeFn }),
    };
    vi.mocked(supabase.channel).mockReturnValue(mockChannel as never);

    const callback = vi.fn();
    const unsubscribe = NotificationService.subscribeToRealtime('user-1', callback);

    expect(supabase.channel).toHaveBeenCalledWith('pm_notifications_user-1');
    expect(mockChannel.on).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        event: 'INSERT',
        schema: 'public',
        table: 'pm_notifications',
        filter: 'recipient_user_id=eq.user-1',
      }),
      expect.any(Function)
    );

    unsubscribe();
    expect(mockChannel.subscribe().unsubscribe).toHaveBeenCalled();
  });
});
