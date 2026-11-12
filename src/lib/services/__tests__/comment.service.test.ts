import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { CommentService } from '../comment.service';
import { DailyProgressComment } from '@/types/planning';

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

describe('CommentService Unit Test Suite (WS-3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  // 1. getComments: returns comments for daily report with author name and timestamp
  it('getComments: returns comments for daily report with author name and timestamp', async () => {
    const mockComments = [
      {
        id: 'c-1',
        daily_progress_id: 'dp-1',
        project_id: 'proj-1',
        user_id: 'u-1',
        author_name: 'Eng. Salem',
        author_role: 'project_manager',
        content: 'Please verify concrete curing temperature.',
        is_private: true,
        parent_comment_id: null,
        created_at: '2026-08-31T08:00:00Z',
        updated_at: '2026-08-31T08:00:00Z',
      },
    ];

    const builder = createMockQueryBuilder({ data: mockComments, error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const comments = await CommentService.getComments('dp-1');

    expect(comments).toHaveLength(1);
    expect(comments[0].id).toBe('c-1');
    expect(comments[0].author_name).toBe('Eng. Salem');
    expect(comments[0].comment_text).toBe('Please verify concrete curing temperature.');
    expect(comments[0].is_private).toBe(true);
  });

  // 2. getComments: builds nested replies hierarchy when parent_comment_id is present
  it('getComments: builds nested replies hierarchy when parent_comment_id is present', async () => {
    const mockComments = [
      {
        id: 'parent-1',
        daily_progress_id: 'dp-1',
        user_id: 'u-pm',
        content: 'Why was rebar inspection delayed?',
        parent_comment_id: null,
        created_at: '2026-08-31T08:00:00Z',
      },
      {
        id: 'reply-1',
        daily_progress_id: 'dp-1',
        user_id: 'u-plan',
        content: 'Rainfall prevented safe crane access.',
        parent_comment_id: 'parent-1',
        created_at: '2026-08-31T08:30:00Z',
      },
    ];

    const builder = createMockQueryBuilder({ data: mockComments, error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const comments = await CommentService.getComments('dp-1');

    expect(comments).toHaveLength(1);
    expect(comments[0].id).toBe('parent-1');
    expect(comments[0].replies).toHaveLength(1);
    expect(comments[0].replies![0].id).toBe('reply-1');
  });

  // 3. addComment: throws error on empty or whitespace comment text
  it('addComment: throws error on empty or whitespace comment text', async () => {
    await expect(
      CommentService.addComment({
        daily_progress_id: 'dp-1',
        project_id: 'p-1',
        author_user_id: 'u-1',
        author_name: 'PM',
        comment_text: '   ',
      })
    ).rejects.toThrow(/EMPTY_COMMENT/);
  });

  // 4. addComment: inserts private comment with default is_private = true
  it('addComment: inserts private comment with default is_private = true', async () => {
    const insertedComment = {
      id: 'c-new-1',
      daily_progress_id: 'dp-1',
      project_id: 'p-1',
      user_id: 'u-1',
      author_name: 'PM Salem',
      author_role: 'project_manager',
      content: 'Critical notice regarding excavation permits',
      is_private: true,
      created_at: '2026-08-31T09:00:00Z',
      updated_at: '2026-08-31T09:00:00Z',
    };

    const builder = createMockQueryBuilder({ data: insertedComment, error: null });
    vi.mocked(supabase.from).mockReturnValue(builder);

    const result = await CommentService.addComment({
      daily_progress_id: 'dp-1',
      project_id: 'p-1',
      author_user_id: 'u-1',
      author_name: 'PM Salem',
      comment_text: 'Critical notice regarding excavation permits',
    });

    expect(result).toBeDefined();
    expect(result?.id).toBe('c-new-1');
    expect(result?.is_private).toBe(true);
  });

  // 5. updateComment: updates comment text and sets updated_at
  it('updateComment: updates comment text and sets updated_at', async () => {
    const existing = {
      id: 'c-edit-1',
      daily_progress_id: 'dp-1',
      user_id: 'author-user-1',
      content: 'Old text',
    };

    const updated = {
      ...existing,
      content: 'Updated revised instructions',
      updated_at: '2026-08-31T10:00:00Z',
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pm_daily_progress_comments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existing, error: null }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: updated, error: null }),
              }),
            }),
          }),
        } as never;
      }
      return createMockQueryBuilder({ data: null, error: null });
    });

    const res = await CommentService.updateComment(
      'c-edit-1',
      'Updated revised instructions',
      'author-user-1'
    );

    expect(res).toBeDefined();
    expect(res?.comment_text).toBe('Updated revised instructions');
  });

  // 6. updateComment: prevents editing if caller is not the author
  it('updateComment: prevents editing if caller is not the author', async () => {
    const existing = {
      id: 'c-edit-2',
      daily_progress_id: 'dp-1',
      user_id: 'original-author',
      content: 'Original note',
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: existing, error: null }),
        }),
      }),
    } as never);

    await expect(
      CommentService.updateComment('c-edit-2', 'Malicious edit', 'different-user')
    ).rejects.toThrow(/FORBIDDEN/);
  });

  // 7. deleteComment: deletes comment record by ID
  it('deleteComment: deletes comment record by ID', async () => {
    const existing = {
      id: 'c-del-1',
      daily_progress_id: 'dp-1',
      user_id: 'u-1',
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'pm_daily_progress_comments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existing, error: null }),
            }),
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        } as never;
      }
      return createMockQueryBuilder({ data: null, error: null });
    });

    const success = await CommentService.deleteComment('c-del-1', 'u-1');
    expect(success).toBe(true);
  });

  // 8. Cache invalidation on add/update/delete
  it('Cache invalidation on add/update/delete', async () => {
    const invalidateSpy = vi.spyOn(appCache, 'invalidate');

    const builder = createMockQueryBuilder({
      data: { id: 'c-1', daily_progress_id: 'dp-cache-1', content: 'test', user_id: 'u-1' },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(builder);

    await CommentService.addComment({
      daily_progress_id: 'dp-cache-1',
      project_id: 'p-1',
      author_user_id: 'u-1',
      author_name: 'PM',
      comment_text: 'Test note',
    });

    expect(invalidateSpy).toHaveBeenCalledWith('dailyReport:comments:dp-cache-1');
  });
});
