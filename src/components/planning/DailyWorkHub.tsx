'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Kanban,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Plus,
  Minus,
  Check,
  ChevronRight,
  Filter,
  Search,
  Loader2,
  Camera,
  RefreshCw,
  Layers,
  ArrowUpRight,
  HardHat,
  ShieldCheck,
} from 'lucide-react';
import { SiteTask, SiteTaskService } from '@/lib/services/siteTask.service';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import {
  deriveDeterministicStatus,
  deriveNextAction,
  calculateProgressMath,
  type DeterministicTaskStatus,
} from '@/lib/planning/dailyProgressMath';
import { DailyFastGrid } from './DailyFastGrid';
import { DailyProgressWizardModal } from './DailyProgressWizardModal';
import { toast } from 'sonner';

interface DailyWorkHubProps {
  projectId: string;
  userId?: string;
}

type SurfaceMode = 'kanban' | 'fast_grid';
type FilterPill = 'today' | 'attention' | 'rejected' | 'completed' | 'all';

export function DailyWorkHub({ projectId, userId }: DailyWorkHubProps) {
  const [mode, setMode] = useState<SurfaceMode>('kanban');
  const [filterPill, setFilterPill] = useState<FilterPill>('today');
  const [search, setSearch] = useState('');
  const [tasks, setTasks] = useState<SiteTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Wizard task
  const [wizardTask, setWizardTask] = useState<SiteTask | null>(null);

  // Inline stepper edit state: taskId -> temporary progress %
  const [inlineStepper, setInlineStepper] = useState<Record<string, number>>({});
  const [savingInline, setSavingInline] = useState<Record<string, boolean>>({});

  // 1. Fetch site tasks
  const loadTasks = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await SiteTaskService.getTasksForProject(projectId);
      setTasks(data || []);
    } catch (err) {
      console.error('Failed to load tasks for DailyWorkHub:', err);
      toast.error('فشل في تحميل مهام الموقع للمشروع');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // 2. Filter tasks based on search & pill
  const todayStr = new Date().toISOString().slice(0, 10);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      const matchesSearch =
        !search ||
        t.title_ar.toLowerCase().includes(search.toLowerCase()) ||
        (t.task_code && t.task_code.toLowerCase().includes(search.toLowerCase()));
      if (!matchesSearch) return false;

      // Status
      const status = deriveDeterministicStatus({
        progressPct: t.progress_pct || 0,
        hasActiveObstruction: Boolean(t.rejection_reason && t.status === 'rejected'),
        status: t.status,
      });

      if (filterPill === 'today') {
        // Today filter: planned for today OR in progress OR blocked
        return (
          t.planned_date === todayStr ||
          status === 'IN PROGRESS' ||
          status === 'BLOCKED' ||
          t.status === 'in_progress'
        );
      }

      if (filterPill === 'attention') {
        return status === 'BLOCKED' || t.priority === 'urgent' || t.priority === 'high';
      }

      if (filterPill === 'rejected') {
        return t.status === 'rejected' || Boolean(t.rejection_reason);
      }

      if (filterPill === 'completed') {
        return status === 'COMPLETED';
      }

      return true; // 'all'
    });
  }, [tasks, search, filterPill, todayStr]);

  // Summary counts
  const summary = useMemo(() => {
    let inProgress = 0;
    let blocked = 0;
    let planned = 0;
    let completed = 0;
    let rejected = 0;

    tasks.forEach((t) => {
      const status = deriveDeterministicStatus({
        progressPct: t.progress_pct || 0,
        hasActiveObstruction: Boolean(t.rejection_reason && t.status === 'rejected'),
        status: t.status,
      });
      if (t.status === 'rejected' || Boolean(t.rejection_reason)) rejected++;
      if (status === 'IN PROGRESS') inProgress++;
      else if (status === 'BLOCKED') blocked++;
      else if (status === 'COMPLETED') completed++;
      else planned++;
    });

    return { total: tasks.length, inProgress, blocked, planned, completed, rejected };
  }, [tasks]);

  // Quick inline stepper step change
  const handleStepDelta = (taskId: string, currentPct: number, delta: number) => {
    const existing = inlineStepper[taskId] !== undefined ? inlineStepper[taskId] : currentPct;
    const nextVal = Math.max(0, Math.min(100, existing + delta));
    setInlineStepper((prev) => ({ ...prev, [taskId]: nextVal }));
  };

  // Commit quick inline progress update in seconds!
  const handleSaveInlineProgress = async (task: SiteTask) => {
    const targetPct = inlineStepper[task.id];
    if (targetPct === undefined) return;

    setSavingInline((prev) => ({ ...prev, [task.id]: true }));
    try {
      const contractQty = task.planned_qty || 1;
      const prevCum = task.actual_qty || 0;
      const targetTotalQty = Number(((targetPct / 100) * contractQty).toFixed(3));
      const todayQty = Math.max(0, Number((targetTotalQty - prevCum).toFixed(3)));

      const res = await DailyProgressService.batchSaveDailyProgressLines({
        projectId,
        reportDate: todayStr,
        userId: userId || '',
        items: [
          {
            taskId: task.id,
            boqItemId: task.boq_item_id || undefined,
            todayQty,
            cumulativeQty: targetTotalQty,
            todayPct: Math.round(((todayQty / contractQty) * 100)),
            cumulativePct: targetPct,
            notes: 'تحديث سريع من لوحة العمل اليومي',
          },
        ],
      });

      if (!res.success) {
        throw new Error(res.error || 'فشل حفظ الإنجاز السريع');
      }

      toast.success(`تم حفظ الإنجاز بنجاح (${targetPct}%) للمهمة المحددة`);
      setInlineStepper((prev) => {
        const copy = { ...prev };
        delete copy[task.id];
        return copy;
      });
      await loadTasks();
    } catch (err: unknown) {
      toast.error((err as { message?: string } | null)?.message || 'حدث خطأ أثناء حفظ الإنجاز');
    } finally {
      setSavingInline((prev) => ({ ...prev, [task.id]: false }));
    }
  };

  // Group into Kanban columns
  const kanbanColumns: Record<DeterministicTaskStatus, SiteTask[]> = useMemo(() => {
    const cols: Record<DeterministicTaskStatus, SiteTask[]> = {
      'PLANNED': [],
      'IN PROGRESS': [],
      'BLOCKED': [],
      'READY FOR REVIEW': [],
      'COMPLETED': [],
    };

    filteredTasks.forEach((t) => {
      const status = deriveDeterministicStatus({
        progressPct: inlineStepper[t.id] !== undefined ? inlineStepper[t.id] : (t.progress_pct || 0),
        hasActiveObstruction: Boolean(t.rejection_reason && t.status === 'rejected'),
        status: t.status,
      });
      cols[status].push(t);
    });

    return cols;
  }, [filteredTasks, inlineStepper]);

  return (
    <div className="flex flex-col h-full space-y-4" dir="rtl">
      {/* ?? Top Header & Adaptive Surface Switcher ?? */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              مركز العمل اليومي الميداني (Daily Work Hub)
              <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                {summary.total} مهمة
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              الحالة: {summary.inProgress} قيد التنفيذ • {summary.blocked} معطلة • {summary.planned} بانتظار البدء • {summary.completed} مكتملة
            </p>
          </div>
        </div>

        {/* Adaptive Surface Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setMode('kanban')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
              mode === 'kanban'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            لوحة كانبان (Kanban)
          </button>

          <button
            onClick={() => setMode('fast_grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 ${
              mode === 'fast_grid'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            الجدول السريع (Fast Grid)
          </button>
        </div>
      </div>

      {/* 🔹 Filter Bar & Scope Pills 🔹 */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { key: 'today' as FilterPill, label: 'اليوم (Today)', count: summary.inProgress + summary.blocked },
            { key: 'attention' as FilterPill, label: 'تتطلب متابعة (Attention)', count: summary.blocked },
            { key: 'rejected' as FilterPill, label: 'المرفوضة (Rejected)', count: summary.rejected },
            { key: 'completed' as FilterPill, label: 'المكتملة (Completed)', count: summary.completed },
            { key: 'all' as FilterPill, label: 'جميع المهام', count: summary.total },
          ].map((pill) => (
            <button
              key={pill.key}
              onClick={() => setFilterPill(pill.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap ${
                filterPill === pill.key
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <span>{pill.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  filterPill === pill.key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث سريع..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-8 pl-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none focus:border-emerald-500"
            />
          </div>
          <button
            onClick={loadTasks}
            title="تحديث البيانات"
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 🔹 Surface Content: Kanban vs Fast Grid 🔹 */}
      {mode === 'fast_grid' ? (
        <DailyFastGrid
          tasks={tasks}
          projectId={projectId}
          userId={userId}
          onRefreshTasks={loadTasks}
          onOpenWizard={(task) => setWizardTask(task)}
        />
      ) : (
        /* 🔹 4-Column Kanban Board 🔹 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start overflow-x-auto pb-4 flex-1">
          {[
            { status: 'PLANNED' as DeterministicTaskStatus, label: 'مخططة (PLANNED)', badgeCls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
            { status: 'IN PROGRESS' as DeterministicTaskStatus, label: 'قيد التنفيذ (IN PROGRESS)', badgeCls: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
            { status: 'BLOCKED' as DeterministicTaskStatus, label: 'معطلة / مرفوضة (BLOCKED)', badgeCls: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
            { status: 'COMPLETED' as DeterministicTaskStatus, label: 'مكتملة (COMPLETED)', badgeCls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
          ].map((col) => {
            const colTasks = kanbanColumns[col.status] || [];
            return (
              <div
                key={col.status}
                className="bg-slate-50/60 dark:bg-slate-950/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-3 flex flex-col space-y-3 min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800/80">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${col.badgeCls}`}>
                    {col.label}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                    {colTasks.length}
                  </span>
                </div>

                {/* Column Task Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[68vh] pr-0.5">
                  {colTasks.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 dark:text-slate-500 text-xs">
                      لا توجد مهام في هذا العمود
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const displayPct =
                        inlineStepper[task.id] !== undefined
                          ? inlineStepper[task.id]
                          : (task.progress_pct || 0);

                      const nextAction = deriveNextAction({
                        progressPct: displayPct,
                        hasActiveObstruction: col.status === 'BLOCKED',
                        status: task.status,
                      });

                      const isSaving = savingInline[task.id];
                      const isModified = inlineStepper[task.id] !== undefined;

                      return (
                        <div
                          key={task.id}
                          className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-sm hover:shadow-md transition space-y-3"
                        >
                          {/* Card Top: Code + Priority + Zone */}
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {task.task_code || `#${task.id.slice(0, 5)}`}
                            </span>

                            {task.zone?.name_ar && (
                              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                                {task.zone.name_ar}
                              </span>
                            )}
                          </div>

                          {/* Task Title */}
                          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
                            {task.title_ar}
                          </h4>

                          {/* Progress Bar & Numeric Indicator */}
                          <div className="space-y-1.5 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-slate-500 dark:text-slate-400">نسبة الإنجاز:</span>
                              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
                                {displayPct}%
                              </span>
                            </div>

                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                                style={{ width: `${Math.min(100, displayPct)}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 dark:text-slate-500 pt-0.5">
                              <span>المخطط: {task.planned_qty || 0} {task.unit || ''}</span>
                              <span>المنفذ: {task.actual_qty || 0}</span>
                            </div>
                          </div>

                          {/* 🔹 Quick Stepper (Done in seconds!) 🔹 */}
                          {(() => {
                            const isClosed = task.status === 'done' || task.status === 'cancelled';
                            return (
                              <div className="flex items-center justify-between gap-1 pt-1">
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                  <button
                                    onClick={() => handleStepDelta(task.id, displayPct, -5)}
                                    disabled={isClosed}
                                    className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-xs font-black transition disabled:opacity-30 disabled:cursor-not-allowed"
                                    title={isClosed ? 'المهمة مغلقة' : 'إنقاص 5%'}
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>

                                  <span className="w-10 text-center font-mono font-black text-xs text-slate-900 dark:text-slate-100">
                                    {displayPct}%
                                  </span>

                                  <button
                                    onClick={() => handleStepDelta(task.id, displayPct, 5)}
                                    disabled={isClosed}
                                    className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-xs font-black transition disabled:opacity-30 disabled:cursor-not-allowed"
                                    title={isClosed ? 'المهمة مغلقة' : 'زيادة 5%'}
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                            {/* Quick Save checkmark button if modified */}
                            {isModified ? (
                              <button
                                onClick={() => handleSaveInlineProgress(task)}
                                disabled={isSaving}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-sm flex items-center gap-1"
                              >
                                {isSaving ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                                حفظ
                              </button>
                            ) : (
                              <button
                                onClick={() => setWizardTask(task)}
                                className="p-1.5 text-slate-400 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition text-xs flex items-center gap-1"
                                title="فتح المعالج التفصيلي والصور"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-[10px] font-bold">معالج</span>
                              </button>
                            )}
                          </div>
                        );
                      })()}

                          {/* ?? Persistent Next Action Button ?? */}
                          <button
                            onClick={() => setWizardTask(task)}
                            className={`w-full py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition flex items-center justify-between border ${
                              nextAction.variant === 'warning'
                                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/50 dark:hover:bg-amber-950/60'
                                : nextAction.variant === 'success'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50 dark:hover:bg-emerald-950/60'
                                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500'
                            }`}
                          >
                            <span className="truncate">{nextAction.labelAr}</span>
                            <ArrowUpRight className="w-3 h-3 shrink-0" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ?? Integrated 3-Step Wizard Modal ?? */}
      {wizardTask && (
        <DailyProgressWizardModal
          isOpen={Boolean(wizardTask)}
          onClose={() => setWizardTask(null)}
          task={wizardTask}
          projectId={projectId}
          onSuccess={() => {
            loadTasks();
            setWizardTask(null);
          }}
        />
      )}
    </div>
  );
}
