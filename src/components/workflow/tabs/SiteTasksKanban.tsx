'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  Calendar,
  User,
  MapPin,
  Play,
  Send,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  CheckCheck,
  Layers,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Inbox,
  ArrowRight,
  Filter,
  Flame,
  Activity,
} from 'lucide-react';
import {
  SiteTask,
  SiteTaskService,
  SiteTaskStatus,
  SiteTaskZone,
} from '@/lib/services/siteTask.service';
import { WorkflowKanbanColumn, KanbanColorScheme } from '../WorkflowKanbanColumn';
import { UnifiedStatusBadge } from '../UnifiedStatusBadge';
import { SLAProgressBar } from '../SLAProgressBar';
import { ReasonModal } from '../ReasonModal';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';

export interface SiteTasksKanbanProps {
  projectId: string;
  userRoles: string[];
  myStakeholderId?: string | null;
  activeFilter: string;
  onCardClick: (taskId: string) => void;
}

interface ColumnConfig {
  id: SiteTaskStatus;
  title: string;
  subtitle: string;
  colorScheme: KanbanColorScheme;
  statuses: SiteTaskStatus[];
  icon: React.ComponentType<{ className?: string }>;
}

const KANBAN_COLUMNS: ColumnConfig[] = [
  {
    id: 'pending',
    title: 'معلقة',
    subtitle: 'بانتظار بدء العمل',
    colorScheme: 'slate',
    statuses: ['pending'],
    icon: Clock,
  },
  {
    id: 'in_progress',
    title: 'قيد التنفيذ',
    subtitle: 'العمل جارٍ بالموقع',
    colorScheme: 'blue',
    statuses: ['in_progress', 'rejected'],
    icon: Play,
  },
  {
    id: 'pm_review',
    title: 'مراجعة PM',
    subtitle: 'بانتظار اعتماد مدير المشروع',
    colorScheme: 'amber',
    statuses: ['pm_review'],
    icon: Send,
  },
  {
    id: 'qc_pending',
    title: 'بانتظار QC',
    subtitle: 'فحص واستلام الجودة WIR',
    colorScheme: 'purple',
    statuses: ['qc_pending'],
    icon: ShieldCheck,
  },
  {
    id: 'approved',
    title: 'معتمدة',
    subtitle: 'تم اجتياز الفحص والاعتماد',
    colorScheme: 'emerald',
    statuses: ['approved'],
    icon: CheckCircle2,
  },
  {
    id: 'done',
    title: 'مكتملة',
    subtitle: 'مهام منجزة ومغلقة',
    colorScheme: 'emerald',
    statuses: ['done'],
    icon: CheckCheck,
  },
];

export const SiteTasksKanban: React.FC<SiteTasksKanbanProps> = ({
  projectId,
  userRoles,
  myStakeholderId,
  activeFilter,
  onCardClick,
}) => {
  const [tasks, setTasks] = useState<SiteTask[]>([]);
  const [zones, setZones] = useState<SiteTaskZone[]>([]);
  const [stakeholdersMap, setStakeholdersMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [transitioningTaskId, setTransitioningTaskId] = useState<string | null>(null);

  // Rejection reason modal state for quick reject actions
  const [rejectModalTaskId, setRejectModalTaskId] = useState<string | null>(null);

  // Role permissions
  const isSiteEng = userRoles.some((r) =>
    ['admin', 'site_engineer', 'project_manager'].includes(r)
  );
  const isPM = userRoles.some((r) =>
    ['admin', 'project_manager', 'planning_manager', 'coo', 'ceo'].includes(r)
  );
  const isQC = userRoles.some((r) =>
    ['admin', 'qc_inspector', 'project_manager'].includes(r)
  );

  // Fetch tasks and metadata
  const loadData = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const isSiteOnly =
        userRoles.includes('site_engineer') &&
        !userRoles.includes('admin') &&
        !userRoles.includes('project_manager') &&
        Boolean(myStakeholderId);

      const [tasksData, zonesData, stakeholdersRes] = await Promise.all([
        isSiteOnly && myStakeholderId
          ? SiteTaskService.getTasksForAssignee(projectId, myStakeholderId)
          : SiteTaskService.getTasksForProject(projectId),
        SiteTaskService.getZones(projectId),
        supabase.from('stakeholders').select('id, name_ar').eq('is_active', true),
      ]);

      setTasks(tasksData || []);
      setZones(zonesData || []);

      const sMap = new Map<string, string>();
      (stakeholdersRes.data || []).forEach((s: { id: string; name_ar: string }) => {
        sMap.set(s.id, s.name_ar);
      });
      setStakeholdersMap(sMap);
    } catch (err) {
      logger.error('Failed to load tasks for kanban', { detail: err, projectId });
      toast.error('حدث خطأ أثناء تحميل مهام الموقع');
    } finally {
      setLoading(false);
    }
  }, [projectId, userRoles, myStakeholderId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Zone lookup map
  const zoneMap = useMemo(() => {
    const map = new Map<string, string>();
    zones.forEach((z) => {
      map.set(z.id, z.name_ar);
    });
    return map;
  }, [zones]);

  // Quick State Transition Handler
  const handleQuickTransition = async (
    e: React.MouseEvent,
    task: SiteTask,
    toState: SiteTaskStatus,
    reason?: string
  ) => {
    e.stopPropagation();
    setTransitioningTaskId(task.id);
    try {
      await SiteTaskService.transitionTaskState({
        taskId: task.id,
        toState,
        reason,
      });
      toast.success(`تم تحديث حالة المهمة إلى "${toState}" بنجاح`);
      await loadData();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل تنفيذ الإجراء السريع';
      logger.error('Quick transition failed', { detail: err });
      toast.error(message);
    } finally {
      setTransitioningTaskId(null);
    }
  };

  // Filter tasks based on activeFilter
  const filteredTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const filter = (activeFilter || 'all').toLowerCase().trim();
    if (filter === 'all' || filter === '') return tasks;

    const todayStr = new Date().toISOString().slice(0, 10);

    return tasks.filter((task) => {
      // 1. My tasks filter
      if (filter === 'mine' || filter === 'my_tasks') {
        return (
          myStakeholderId &&
          (task.assignee_stakeholder_id === myStakeholderId ||
            task.qc_stakeholder_id === myStakeholderId)
        );
      }

      // 1.1 Planning Engineer Filters: Critical Path & Near Critical
      if (filter === 'critical_path' || filter === 'critical') {
        const float = (task as any).total_float ?? (task.priority === 'urgent' ? 0 : task.priority === 'high' ? 4 : 18);
        return float === 0 || (task as any).is_critical === true;
      }
      if (filter === 'near_critical') {
        const float = (task as any).total_float ?? (task.priority === 'urgent' ? 0 : task.priority === 'high' ? 4 : 18);
        return float <= 14;
      }

      // 2. Urgent / High priority
      if (filter === 'urgent') {
        return task.priority === 'urgent';
      }
      if (filter === 'high' || filter === 'priority') {
        return task.priority === 'high' || task.priority === 'urgent';
      }

      // 3. Overdue
      if (filter === 'overdue') {
        const dueDate = task.due_date || task.planned_date;
        return (
          Boolean(dueDate && dueDate < todayStr) &&
          task.status !== 'done' &&
          task.status !== 'approved' &&
          task.status !== 'cancelled'
        );
      }

      // 4. Today's tasks
      if (filter === 'today') {
        return task.planned_date === todayStr || task.due_date === todayStr;
      }

      // 5. WIR / QC pending
      if (filter === 'qc_pending' || filter === 'wir_pending') {
        return task.status === 'qc_pending';
      }

      // 6. PM review
      if (filter === 'pm_review') {
        return task.status === 'pm_review';
      }

      // 7. Rework / Rejected
      if (filter === 'rework' || filter === 'rejected') {
        return task.status === 'rejected';
      }

      // 8. Task type
      if (
        ['execution', 'inspection', 'material_delivery', 'handover', 'general'].includes(filter)
      ) {
        return task.task_type === filter;
      }

      // 9. Free text search
      const zoneName = (task.zone?.name_ar || zoneMap.get(task.zone_id || '') || '').toLowerCase();
      const assigneeName = (
        task.assignee?.name_ar || stakeholdersMap.get(task.assignee_stakeholder_id || '') || ''
      ).toLowerCase();
      const title = (task.title_ar || '').toLowerCase();
      const taskCode = (task.task_code || task.id || '').toLowerCase();

      return (
        title.includes(filter) ||
        zoneName.includes(filter) ||
        assigneeName.includes(filter) ||
        taskCode.includes(filter)
      );
    });
  }, [tasks, activeFilter, myStakeholderId, zoneMap, stakeholdersMap]);

  // Group tasks by Kanban column
  const tasksByColumn = useMemo(() => {
    const grouped: Record<SiteTaskStatus, SiteTask[]> = {
      pending: [],
      in_progress: [],
      pm_review: [],
      qc_pending: [],
      approved: [],
      done: [],
      rejected: [],
      cancelled: [],
    };

    filteredTasks.forEach((task) => {
      const status = task.status;
      if (grouped[status]) {
        grouped[status].push(task);
      } else {
        grouped.pending.push(task);
      }
    });

    return grouped;
  }, [filteredTasks]);

  // Priority indicator dot/badge
  const renderPriorityBadge = (priority: string) => {
    if (priority === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
          عاجل
        </span>
      );
    }
    if (priority === 'high') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
          عالي
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-md shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>لوحة مهام الموقع (Site Tasks Kanban)</span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono text-[11px]">
            {filteredTasks.length} مهمة
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث اللوحة</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Container (6 Columns) */}
      {loading && tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-28 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-xs font-medium">جاري تحميل لوحة المهام الميدانية...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4 items-start min-w-full">
          {KANBAN_COLUMNS.map((col) => {
            const IconComp = col.icon;
            // Aggregate tasks for this column based on configured statuses
            const columnTasks = col.statuses.flatMap((st) => tasksByColumn[st] || []);

            return (
              <WorkflowKanbanColumn
                key={col.id}
                title={col.title}
                subtitle={col.subtitle}
                count={columnTasks.length}
                colorScheme={col.colorScheme}
                icon={<IconComp className="w-4 h-4 shrink-0" />}
                emptyText="لا توجد مهام في هذه المرحلة"
              >
                {columnTasks.map((task) => {
                  const isTransitioning = transitioningTaskId === task.id;
                  const isRejected = task.status === 'rejected';
                  const zoneName =
                    task.zone?.name_ar || zoneMap.get(task.zone_id || '') || 'بدون منطقة';
                  const assigneeName =
                    task.assignee?.name_ar ||
                    stakeholdersMap.get(task.assignee_stakeholder_id || '') ||
                    'غير مسند';
                  const taskCode =
                    task.task_code || `TSK-${task.id.slice(0, 6).toUpperCase()}`;

                  return (
                    <div
                      key={task.id}
                      onClick={() => onCardClick(task.id)}
                      className={`glass-card group relative bg-white dark:bg-slate-900 border rounded-2xl p-3.5 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-700 select-none space-y-3 ${
                        isRejected
                          ? 'border-rose-300 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20'
                          : 'border-slate-200/80 dark:border-slate-800/80'
                      }`}
                    >
                      {/* Top Badges & Priority */}
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700/60">
                          {taskCode}
                        </span>

                        <div className="flex items-center gap-1 shrink-0">
                          {renderPriorityBadge(task.priority)}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300">
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>ملاحظات</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Task Title */}
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-relaxed group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {task.title_ar}
                      </h4>

                      {/* Zone & Assignee Row */}
                      <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{zoneName}</span>
                        </div>

                        <div className="flex items-center gap-1.5 truncate">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{assigneeName}</span>
                        </div>
                      </div>

                      {/* Progress & Due Date */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{task.planned_date || task.due_date || '—'}</span>
                          </span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {task.progress_pct || 0}%
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
                          <div
                            className="h-full bg-emerald-600 dark:bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.max(0, task.progress_pct || 0))}%` }}
                          />
                        </div>
                      </div>

                      {/* Planning Float & Activity ID Badge */}
                      {(() => {
                        const totalFloat = (task as any).total_float ?? (task.priority === 'urgent' ? 0 : task.priority === 'high' ? 4 : 18);
                        const isCrit = totalFloat === 0 || (task as any).is_critical === true;
                        const isNearCrit = !isCrit && totalFloat <= 14;

                        return (
                          <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 text-[10px]">
                            <div className="flex items-center gap-1 font-mono">
                              {isCrit ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold animate-pulse">
                                  <Flame className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                  <span>مسار حرج | TF: 0d</span>
                                </span>
                              ) : isNearCrit ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                                  <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  <span>شبه حرج | TF: {totalFloat}d</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-medium">
                                  <Activity className="w-3 h-3 text-slate-400" />
                                  <span>TF: {totalFloat}d</span>
                                </span>
                              )}
                            </div>
                            {task.activity_id && (
                              <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                                {task.activity_id}
                              </span>
                            )}
                          </div>
                        );
                      })()}

                      {/* Rejection Note snippet if rejected */}
                      {isRejected && task.rejection_reason && (
                        <div className="text-[10px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-xl border border-rose-200 dark:border-rose-900 line-clamp-1">
                          سبب الملاحظة: {task.rejection_reason}
                        </div>
                      )}

                      {/* Quick Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-1.5">
                        {/* 1. Pending → Start */}
                        {task.status === 'pending' && isSiteEng && (
                          <button
                            type="button"
                            disabled={isTransitioning}
                            onClick={(e) => handleQuickTransition(e, task, 'in_progress')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-bold hover:bg-sky-100 transition disabled:opacity-50"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>بدء</span>
                          </button>
                        )}

                        {/* 2. In Progress → Submit PM */}
                        {task.status === 'in_progress' && isSiteEng && (
                          <button
                            type="button"
                            disabled={isTransitioning}
                            onClick={(e) => handleQuickTransition(e, task, 'pm_review')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[11px] font-bold hover:bg-amber-100 transition disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            <span>تقديم PM</span>
                          </button>
                        )}

                        {/* 3. PM Review → Approve / QC / Reject */}
                        {task.status === 'pm_review' && isPM && (
                          <>
                            <button
                              type="button"
                              disabled={isTransitioning}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRejectModalTaskId(task.id);
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-50"
                              title="رفض"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={isTransitioning}
                              onClick={(e) => handleQuickTransition(e, task, 'qc_pending')}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-bold hover:bg-purple-100 transition disabled:opacity-50"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>إحالة QC</span>
                            </button>

                            <button
                              type="button"
                              disabled={isTransitioning}
                              onClick={(e) => handleQuickTransition(e, task, 'approved')}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>اعتماد</span>
                            </button>
                          </>
                        )}

                        {/* 4. QC Pending → Accept / Reject */}
                        {task.status === 'qc_pending' && (isQC || isPM) && (
                          <>
                            <button
                              type="button"
                              disabled={isTransitioning}
                              onClick={(e) => {
                                e.stopPropagation();
                                setRejectModalTaskId(task.id);
                              }}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-50"
                              title="رفض الفحص"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={isTransitioning}
                              onClick={(e) => handleQuickTransition(e, task, 'approved')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold hover:bg-emerald-100 transition disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>قبول QC</span>
                            </button>
                          </>
                        )}

                        {/* 5. Approved → Close */}
                        {task.status === 'approved' && isPM && (
                          <button
                            type="button"
                            disabled={isTransitioning}
                            onClick={(e) => handleQuickTransition(e, task, 'done')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-[11px] font-bold shadow-xs hover:bg-emerald-800 transition disabled:opacity-50"
                          >
                            <CheckCheck className="w-3 h-3" />
                            <span>إغلاق المهمة</span>
                          </button>
                        )}

                        {/* 6. Rejected → Restart */}
                        {task.status === 'rejected' && (isSiteEng || isPM) && (
                          <button
                            type="button"
                            disabled={isTransitioning}
                            onClick={(e) => handleQuickTransition(e, task, 'in_progress')}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-[11px] font-bold hover:bg-sky-100 transition disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>إعادة البدء</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </WorkflowKanbanColumn>
            );
          })}
        </div>
      )}

      {/* Quick Rejection Modal */}
      <ReasonModal
        isOpen={Boolean(rejectModalTaskId)}
        onClose={() => setRejectModalTaskId(null)}
        onConfirm={async (reason) => {
          if (!rejectModalTaskId) return;
          try {
            await SiteTaskService.transitionTaskState({
              taskId: rejectModalTaskId,
              toState: 'rejected',
              reason,
            });
            toast.success('تم تسجيل الملاحظات ورفض المهمة بنجاح');
            setRejectModalTaskId(null);
            await loadData();
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'فشل رفض المهمة';
            toast.error(message);
          }
        }}
        title="رفض المهمة وتسجيل الملاحظات"
        subtitle="يتطلب الرفض كتابة الملاحظات والأسباب الفنية لإرسالها لمهندس الموقع."
        confirmLabel="تأكيد الرفض"
        confirmVariant="danger"
      />
    </div>
  );
};

export default SiteTasksKanban;
