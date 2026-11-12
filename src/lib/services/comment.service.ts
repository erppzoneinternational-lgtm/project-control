import { supabase } from '@/lib/supabase';
import { appCache, TTL } from '@/lib/cache';
import { DailyProgressComment } from '@/types/planning';
import { logger } from '@/lib/logger';

export interface CreateCommentDTO {
  daily_progress_id: string;
  project_id: string;
  author_user_id?: string;
  user_id?: string;
  author_stakeholder_id?: string | null;
  author_name: string;
  author_role?: string | null;
  comment_text?: string;
  content?: string;
  is_private?: boolean; // default: true
  parent_comment_id?: string | null;
}

export class CommentService {
  /**
   * Fetch comments linked to a daily progress report with author metadata.
   */
  static async getComments(dailyProgressId: string): Promise<DailyProgressComment[]> {
    if (!dailyProgressId) return [];
    const cacheKey = `dailyReport:comments:${dailyProgressId}`;

    return appCache.getOrFetch(cacheKey, TTL.dailyProgress || 15000, async () => {
      try {
        const { data, error } = await supabase
          .from('pm_daily_progress_comments')
          .select('*')
          .eq('daily_progress_id', dailyProgressId)
          .order('created_at', { ascending: true });

        if (error) {
          logger.warn('CommentService.getComments error:', { detail: error });
          return [];
        }

        const rawList = (data || []).map((row) => ({
          ...row,
          author_user_id: row.user_id,
          comment_text: row.content,
          replies: [],
        })) as DailyProgressComment[];

        // Build hierarchical replies if parent_comment_id is present
        const commentMap = new Map<string, DailyProgressComment>();
        const rootComments: DailyProgressComment[] = [];

        rawList.forEach((c) => {
          c.replies = [];
          commentMap.set(c.id, c);
        });

        rawList.forEach((c) => {
          if (c.parent_comment_id && commentMap.has(c.parent_comment_id)) {
            commentMap.get(c.parent_comment_id)!.replies!.push(c);
          } else {
            rootComments.push(c);
          }
        });

        return rootComments;
      } catch (err) {
        logger.warn('CommentService.getComments exception:', { detail: err });
        return [];
      }
    });
  }

  /**
   * Add a comment with author metadata.
   */
  static async addComment(dto: CreateCommentDTO): Promise<DailyProgressComment | null> {
    const text = (dto.comment_text || dto.content || '').trim();
    if (!text) {
      throw new Error('EMPTY_COMMENT: Comment text cannot be empty');
    }

    const userId = dto.author_user_id || dto.user_id;
    if (!userId) {
      throw new Error('USER_REQUIRED: Author user ID is required');
    }

    try {
      const payload: Record<string, unknown> = {
        daily_progress_id: dto.daily_progress_id,
        project_id: dto.project_id,
        user_id: userId,
        author_stakeholder_id: dto.author_stakeholder_id || null,
        author_name: dto.author_name || 'Project Manager',
        author_role: dto.author_role || 'project_manager',
        content: text,
        is_private: dto.is_private !== undefined ? dto.is_private : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (dto.parent_comment_id) {
        payload.parent_comment_id = dto.parent_comment_id;
      }

      const { data, error } = await supabase
        .from('pm_daily_progress_comments')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      appCache.invalidate(`dailyReport:comments:${dto.daily_progress_id}`);

      return {
        ...data,
        author_user_id: data.user_id,
        comment_text: data.content,
        replies: [],
      } as DailyProgressComment;
    } catch (err) {
      logger.error('CommentService.addComment error:', { detail: err });
      throw err;
    }
  }

  /**
   * Update comment text (author only).
   */
  static async updateComment(
    commentId: string,
    commentText: string,
    userId: string
  ): Promise<DailyProgressComment | null> {
    const text = (commentText || '').trim();
    if (!text) {
      throw new Error('EMPTY_COMMENT: Comment text cannot be empty');
    }

    try {
      // Check author
      const { data: existing, error: fetchErr } = await supabase
        .from('pm_daily_progress_comments')
        .select('*')
        .eq('id', commentId)
        .single();

      if (fetchErr || !existing) {
        throw new Error('NOT_FOUND: Comment not found');
      }

      if (existing.user_id !== userId) {
        throw new Error('FORBIDDEN: Only the author can edit this comment');
      }

      const { data, error } = await supabase
        .from('pm_daily_progress_comments')
        .update({
          content: text,
          updated_at: new Date().toISOString(),
        })
        .eq('id', commentId)
        .select()
        .single();

      if (error) throw error;

      appCache.invalidate(`dailyReport:comments:${data.daily_progress_id}`);

      return {
        ...data,
        author_user_id: data.user_id,
        comment_text: data.content,
      } as DailyProgressComment;
    } catch (err) {
      logger.error('CommentService.updateComment error:', { detail: err });
      throw err;
    }
  }

  /**
   * Delete comment (author or admin only).
   */
  static async deleteComment(commentId: string, userId: string): Promise<boolean> {
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from('pm_daily_progress_comments')
        .select('*')
        .eq('id', commentId)
        .single();

      if (fetchErr || !existing) {
        return false;
      }

      const { error } = await supabase
        .from('pm_daily_progress_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      appCache.invalidate(`dailyReport:comments:${existing.daily_progress_id}`);
      return true;
    } catch (err) {
      logger.error('CommentService.deleteComment error:', { detail: err });
      return false;
    }
  }
}
