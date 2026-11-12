'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShieldCheck, 
  Send, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  MessageSquare, 
  Loader2, 
  Lock,
  Clock,
  User,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { CommentService, CreateCommentDTO } from '@/lib/services/comment.service';
import { DailyProgressComment } from '@/types/planning';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/lib/stores/useAuthStore';

export interface DailyProgressCommentsProps {
  dailyProgressId: string;
  projectId: string;
  currentUserId?: string;
  currentUserName?: string;
  currentUserRole?: string;
  isPrivate?: boolean;
  readOnly?: boolean;
  className?: string;
  onCommentAdded?: (comment: DailyProgressComment) => void;
}

export const ROLE_LABELS_MAP: Record<string, { ar: string; en: string; badgeColor: string }> = {
  project_manager: {
    ar: 'مدير المشروع (PM)',
    en: 'Project Manager',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  },
  pm: {
    ar: 'مدير المشروع (PM)',
    en: 'Project Manager',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
  },
  planning_manager: {
    ar: 'مدير التخطيط',
    en: 'Planning Manager',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-800',
  },
  planning_engineer: {
    ar: 'مهندس التخطيط',
    en: 'Planning Engineer',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300 dark:border-blue-800',
  },
  admin: {
    ar: 'مدير النظام',
    en: 'System Admin',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800',
  },
  coo: {
    ar: 'الإدارة العليا (COO)',
    en: 'COO / Executive',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
  },
};

export const DailyProgressComments: React.FC<DailyProgressCommentsProps> = ({
  dailyProgressId,
  projectId,
  currentUserId,
  currentUserName,
  currentUserRole,
  isPrivate = true,
  readOnly = false,
  className = '',
  onCommentAdded,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const effectiveUserId = currentUserId || user?.id || '';
  const effectiveUserName = currentUserName || user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Project Manager');
  const effectiveUserRole = currentUserRole || (user?.user_metadata?.role as string) || 'project_manager';

  const [newCommentText, setNewCommentText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Fetch comments
  const {
    data: comments = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['daily-comments', dailyProgressId],
    queryFn: () => CommentService.getComments(dailyProgressId),
    enabled: Boolean(dailyProgressId),
  });

  // Add Comment Mutation
  const addMutation = useMutation({
    mutationFn: async (text: string) => {
      const dto: CreateCommentDTO = {
        daily_progress_id: dailyProgressId,
        project_id: projectId,
        user_id: effectiveUserId,
        author_user_id: effectiveUserId,
        author_name: effectiveUserName,
        author_role: effectiveUserRole,
        comment_text: text.trim(),
        content: text.trim(),
        is_private: isPrivate,
      };
      return CommentService.addComment(dto);
    },
    onSuccess: (newComment) => {
      setNewCommentText('');
      queryClient.invalidateQueries({ queryKey: ['daily-comments', dailyProgressId] });
      toast.success(isAr ? 'تمت إضافة الملاحظة السرية بنجاح' : 'Confidential comment posted');
      if (newComment && onCommentAdded) {
        onCommentAdded(newComment);
      }
    },
    onError: (err: unknown) => {
      toast.error(isAr ? ((err as { message?: string } | null)?.message || 'فشل إرسال الملاحظة') : ((err as { message?: string } | null)?.message || 'Failed to post comment'));
    },
  });

  // Update Comment Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      return CommentService.updateComment(id, text, effectiveUserId);
    },
    onSuccess: () => {
      setEditingCommentId(null);
      setEditText('');
      queryClient.invalidateQueries({ queryKey: ['daily-comments', dailyProgressId] });
      toast.success(isAr ? 'تم تعديل الملاحظة' : 'Comment updated');
    },
    onError: (err: unknown) => {
      toast.error(isAr ? 'فشل تعديل الملاحظة' : ((err as { message?: string } | null)?.message || 'Failed to update comment'));
    },
  });

  // Delete Comment Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return CommentService.deleteComment(id, effectiveUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-comments', dailyProgressId] });
      toast.success(isAr ? 'تم حذف الملاحظة' : 'Comment deleted');
    },
    onError: () => {
      toast.error(isAr ? 'فشل حذف الملاحظة' : 'Failed to delete comment');
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addMutation.mutate(newCommentText);
  };

  const handleStartEdit = (comment: DailyProgressComment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.content || comment.comment_text || '');
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editText.trim()) return;
    updateMutation.mutate({ id: commentId, text: editText.trim() });
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return timestamp;
    }
  };

  const getAuthorInitials = (name: string) => {
    if (!name) return 'PM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className={`space-y-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm ${className}`} data-testid="daily-progress-comments">
      {/* Confidential Management Banner */}
      {isPrivate && (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-amber-200 text-amber-900 dark:bg-amber-900/80 dark:text-amber-200">
            <Lock className="h-3.5 w-3.5" />
          </div>
          <div className="flex-1">
            <span className="font-bold block">
              {isAr ? 'ملاحظات سرية للإدارة (Confidential Thread)' : 'Confidential Management Thread'}
            </span>
            <span className="text-[11px] text-amber-700 dark:text-amber-400">
              {isAr
                ? 'مرئية فقط لمدير المشروع ومدير التخطيط والإدارة التنفيذية، ولا تظهر في التقرير الخارجي للموقع.'
                : 'Visible only to Project Manager, Planning Manager, and Executives. Excluded from field site exports.'}
            </span>
          </div>
          <ShieldCheck className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 opacity-80" />
        </div>
      )}

      {/* Header / Counter */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {isAr ? 'سجل التوجيهات وملاحظات مدير المشروع' : 'PM Directives & Comments Thread'}
          </h4>
          <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400" data-testid="comments-count">
            {comments.length}
          </span>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-xs">{isAr ? 'جاري تحميل الملاحظات...' : 'Loading comments...'}</span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{isAr ? 'فشل تحميل الملاحظات' : 'Failed to load comments'}</span>
          <button
            type="button"
            onClick={() => refetch()}
            className="font-bold underline hover:no-underline"
          >
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && comments.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-slate-400">
          <MessageSquare className="mx-auto h-7 w-7 opacity-40 mb-1" />
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            {isAr ? 'لا توجد ملاحظات سرية مسجلة على هذا التقرير بعد' : 'No confidential management comments yet'}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
            {isAr ? 'يمكنك تدوين توجيهاتك أو استفساراتك لإدارة التخطيط والمكتب الفني أدناه.' : 'Post a directive or clarification note below.'}
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {comments.map((c) => {
          const isAuthor = (c.user_id && c.user_id === effectiveUserId) || (c.author_user_id && c.author_user_id === effectiveUserId);
          const isEditing = editingCommentId === c.id;
          const roleConfig = ROLE_LABELS_MAP[c.author_role || 'project_manager'] || {
            ar: c.author_role || 'مسؤول',
            en: c.author_role || 'Member',
            badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          };

          return (
            <div
              key={c.id}
              className="group relative rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/70"
              data-testid={`comment-item-${c.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white shadow-sm">
                    {getAuthorInitials(c.author_name)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {c.author_name}
                      </span>
                      <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${roleConfig.badgeColor}`}>
                        {isAr ? roleConfig.ar : roleConfig.en}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                      <Clock className="h-3 w-3" />
                      <span>{formatTimestamp(c.created_at)}</span>
                      {c.updated_at && c.updated_at !== c.created_at && (
                        <span className="italic text-slate-400">({isAr ? 'معدل' : 'edited'})</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Edit / Delete actions for Author */}
                {isAuthor && !readOnly && !isEditing && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(c)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
                      title={isAr ? 'تعديل' : 'Edit'}
                      aria-label="Edit comment"
                      data-testid={`edit-comment-${c.id}`}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(isAr ? 'هل أنت متأكد من حذف هذه الملاحظة؟' : 'Delete this comment?')) {
                          deleteMutation.mutate(c.id);
                        }
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/50 dark:hover:text-red-400 transition-colors"
                      title={isAr ? 'حذف' : 'Delete'}
                      aria-label="Delete comment"
                      data-testid={`delete-comment-${c.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Comment Content / Inline Edit Form */}
              <div className="mt-2.5 text-xs text-slate-700 dark:text-slate-300">
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 p-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      rows={2}
                      data-testid={`edit-textarea-${c.id}`}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(c.id)}
                        disabled={updateMutation.isPending || !editText.trim()}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                        data-testid={`save-edit-${c.id}`}
                      >
                        {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                        <span>{isAr ? 'حفظ التعديل' : 'Save'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="whitespace-pre-line leading-relaxed font-normal">
                    {c.content || c.comment_text}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Comment Box */}
      {!readOnly && (
        <form onSubmit={handleAddSubmit} className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="relative">
            <textarea
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder={
                isAr
                  ? 'أضف ملاحظة توجيهية أو استفسار لإدارة التخطيط (سرية)...'
                  : 'Add a confidential management directive or inquiry...'
              }
              rows={2}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/80 p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none transition-all"
              data-testid="new-comment-textarea"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <User className="h-3.5 w-3.5" />
              <span>{effectiveUserName}</span>
            </div>

            <button
              type="submit"
              disabled={addMutation.isPending || !newCommentText.trim()}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              data-testid="submit-comment-button"
            >
              {addMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>{isAr ? 'إرسال الملاحظة' : 'Post Comment'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
