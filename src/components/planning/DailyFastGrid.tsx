'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Search,
  Filter,
  Loader2,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { SiteTask } from '@/lib/services/siteTask.service';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import {
  calculateProgressMath,
  validateProgressSubmission,
  deriveDeterministicStatus,
} from '@/lib/planning/dailyProgressMath';
import { toast } from 'sonner';

interface DailyFastGridProps {
  tasks: SiteTask[];
  projectId: string;
  userId?: string;
  onRefreshTasks?: () => void;
  onOpenWizard?: (task: SiteTask) => void;
}

interface GridDraftRow {
  taskId: string;
  todayQty: number;
  notes: string;
}

const STORAGE_KEY_PREFIX = 'pzone_daily_grid_draft_';

export function DailyFastGrid({
  tasks,
  projectId,
  userId,
  onRefreshTasks,
  onOpenWizard,
}: DailyFastGridProps) {
  const [drafts, setDrafts] = useState<Record<string, GridDraftRow>>({});
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // 1. Load drafts from localStorage on mount
  useEffect(() => {
    if (!projectId) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PREFIX + projectId);
      if (saved) {
        setDrafts(JSON.parse(saved));
      }
    } catch {
      // Ignore storage read errors
    }
  }, [projectId]);

  // 2. Persist drafts to localStorage whenever they change
  const saveDraftsToStorage = useCallback(
    (newDrafts: Record<string, GridDraftRow>) => {
      setDrafts(newDrafts);
      try {
        localStorage.setItem(STORAGE_KEY_PREFIX + projectId, JSON.stringify(newDrafts));
      } catch {
        // Ignore storage write errors
      }
    },
    [projectId]
  );

  const handleQtyChange = (taskId: string, rawVal: string) => {
    const val = rawVal === '' ? 0 : parseFloat(rawVal);
    const updated = {
      ...drafts,
      [taskId]: {
        taskId,
        todayQty: isNaN(val) ? 0 : Math.max(0, val),
        notes: drafts[taskId]?.notes || '',
      },
    };
    saveDraftsToStorage(updated);
  };

  const handleNotesChange = (taskId: string, notes: string) => {
    const updated = {
      ...drafts,
      [taskId]: {
        taskId,
        todayQty: drafts[taskId]?.todayQty || 0,
        notes,
      },
    };
    saveDraftsToStorage(updated);
  };

  const handleClearDrafts = () => {
    if (confirm('هل أنت متأكد من مسح جميع مسودات الإدخال غير المحفوظة؟')) {
      saveDraftsToStorage({});
      toast.info('تم مسح المسودات المحلية');
    }
  };

  // Keyboard navigation: Enter moves to the next task's quantity input
  const handleKeyDown = (e: React.KeyboardEvent, index: number, filteredList: SiteTask[]) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextTask = filteredList[index + 1];
      if (nextTask && inputRefs.current[nextTask.id]) {
        inputRefs.current[nextTask.id]?.focus();
        inputRefs.current[nextTask.id]?.select();
      }
    }
  };

  // Filter tasks
  const zones = Array.from(
    new Set(tasks.map((t) => t.zone?.name_ar || 'منطقة عامة').filter(Boolean))
  );

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !search ||
      t.title_ar.toLowerCase().includes(search.toLowerCase()) ||
      (t.task_code && t.task_code.toLowerCase().includes(search.toLowerCase()));
    const matchesZone =
      selectedZone === 'all' || (t.zone?.name_ar || 'منطقة عامة') === selectedZone;
    return matchesSearch && matchesZone;
  });

  const modifiedCount = Object.values(drafts).filter((d) => d.todayQty > 0).length;

  // Save All
  const handleSaveAll = async () => {
    const itemsToSave = Object.values(drafts).filter((d) => {
      if (d.todayQty <= 0) return false;
      const task = tasks.find((t) => t.id === d.taskId);
      return task?.status !== 'done' && task?.status !== 'cancelled';
    });

    if (itemsToSave.length === 0) {
      toast.info('لا توجد مهام مفتوحة قابلة للتسجيل (المهام المكتملة أو الملغاة مغلقة)');
      return;
    }

    setSaving(true);
    try {
      const payload = itemsToSave.map((item) => {
        const task = tasks.find((t) => t.id === item.taskId);
        const contractQty = task?.planned_qty || 0;
        const prevCum = task?.actual_qty || 0;
        const math = calculateProgressMath({
          todayQty: item.todayQty,
          contractQty,
          previousCumulativeQty: prevCum,
        });

        return {
          taskId: item.taskId,
          boqItemId: task?.boq_item_id || undefined,
          todayQty: item.todayQty,
          cumulativeQty: math.totalCumulativeQty,
          todayPct: math.todayPct,
          cumulativePct: math.totalPct,
          notes: item.notes,
        };
      });

      const res = await DailyProgressService.batchSaveDailyProgressLines({
        projectId,
        reportDate: new Date().toISOString().slice(0, 10),
        userId: userId || '',
        items: payload,
      });

      if (!res.success) {
        throw new Error(res.error || 'حدث خطأ أثناء حفظ الإنجاز السريع');
      }

      toast.success(`تم حفظ وإرسال إنجاز ${res.updatedCount} مهمة بنجاح!`);
      saveDraftsToStorage({});
      onRefreshTasks?.();
    } catch (err: unknown) {
      const errInfo = err as { message?: string; code?: string; details?: string } | null | undefined;
      toast.error(errInfo?.message || 'حدث خطأ أثناء حفظ البيانات السريعة');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm" dir="rtl">
      {/* Top Action & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
              الجدول السريع (Fast Grid)
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-mono">
                Excel-like
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              إدخال سريع ومتتابع عبر [Tab] و [Enter] لتسجيل إنجاز اليوم لجميع المهام دفعة واحدة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {modifiedCount > 0 && (
            <button
              onClick={handleClearDrafts}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:border-rose-300 dark:hover:border-rose-700 text-xs font-bold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              مسح المسودة ({modifiedCount})
            </button>
          )}

          <button
            onClick={handleSaveAll}
            disabled={saving || modifiedCount === 0}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-emerald-600/20 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ وإرسال إنجاز اليوم {modifiedCount > 0 ? `(${modifiedCount})` : ''}
          </button>
        </div>
      </div>

      {/* Search & Zone Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث باسم المهمة أو الكود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pr-8 pl-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
          />
        </div>

        <div className="w-44">
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="w-full p-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
          >
            <option value="all">كل المناطق ({zones.length})</option>
            {zones.map((z) => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container with Sticky Header */}
      <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-800 rounded-xl max-h-[65vh]">
        <table className="w-full text-right text-xs border-collapse">
          <thead className="bg-slate-100 dark:bg-slate-800/80 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-black border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="p-2.5 w-16 text-center">كود</th>
              <th className="p-2.5 min-w-[180px]">المهمة</th>
              <th className="p-2.5 w-24">المنطقة</th>
              <th className="p-2.5 w-20 text-center">كمية العقد</th>
              <th className="p-2.5 w-20 text-center">المنفذ سابقاً</th>
              <th className="p-2.5 w-28 text-center bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                كمية اليوم
              </th>
              <th className="p-2.5 w-20 text-center">الإجمالي %</th>
              <th className="p-2.5 w-20 text-center">المتبقي</th>
              <th className="p-2.5 w-24 text-center">الحالة المحسوبة</th>
              <th className="p-2.5 min-w-[140px]">ملاحظات الموقع</th>
              <th className="p-2.5 w-16 text-center">معالج</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTasks.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-8 text-center text-slate-400">
                  لا توجد مهام مطابقة
                </td>
              </tr>
            ) : (
              filteredTasks.map((t, idx) => {
                const contractQty = t.planned_qty || 0;
                const prevCum = t.actual_qty || 0;
                const currentDraft = drafts[t.id];
                const todayQty = currentDraft ? currentDraft.todayQty : 0;

                const math = calculateProgressMath({
                  todayQty,
                  contractQty,
                  previousCumulativeQty: prevCum,
                });

                const status = deriveDeterministicStatus({
                  progressPct: math.totalPct,
                  status: t.status,
                });

                const isModified = todayQty > 0;

                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                      isModified ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="p-2 text-center font-mono text-[10px] text-slate-400">
                      {t.task_code || `#${t.id.slice(0, 5)}`}
                    </td>

                    <td className="p-2 font-bold text-slate-900 dark:text-slate-100 truncate max-w-[220px]">
                      {t.title_ar}
                    </td>

                    <td className="p-2 text-[11px] text-slate-500 truncate max-w-[100px]">
                      {t.zone?.name_ar || '—'}
                    </td>

                    <td className="p-2 text-center font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {contractQty} {t.unit || ''}
                    </td>

                    <td className="p-2 text-center font-mono text-[11px] text-slate-500">
                      {prevCum}
                    </td>

                    {/* Today Qty Input */}
                    <td className={`p-1.5 text-center ${t.status === 'done' || t.status === 'cancelled' ? 'bg-slate-100/60 dark:bg-slate-800/40' : 'bg-emerald-50/40 dark:bg-emerald-950/20'}`}>
                      <input
                        ref={(el) => { inputRefs.current[t.id] = el; }}
                        type="number"
                        step="any"
                        min="0"
                        placeholder={t.status === 'done' || t.status === 'cancelled' ? 'مغلقة' : '0'}
                        disabled={t.status === 'done' || t.status === 'cancelled'}
                        value={todayQty > 0 ? todayQty : ''}
                        onChange={(e) => handleQtyChange(t.id, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, idx, filteredTasks)}
                        title={t.status === 'done' || t.status === 'cancelled' ? 'المهمة مغلقة ومكتملة ولا تقبل إنجاز يومي جديد' : undefined}
                        className={`w-24 text-center font-mono font-bold py-1 px-1.5 rounded-lg border text-xs outline-none ${
                          t.status === 'done' || t.status === 'cancelled'
                            ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500'
                        }`}
                      />
                    </td>

                    <td className="p-2 text-center font-mono font-black text-xs">
                      <span className={math.totalPct >= 100 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}>
                        {math.totalPct}%
                      </span>
                    </td>

                    <td className="p-2 text-center font-mono text-[11px] text-slate-500">
                      {math.remainingQty}
                    </td>

                    <td className="p-2 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : status === 'IN PROGRESS'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : status === 'BLOCKED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="p-1.5">
                      <input
                        type="text"
                        placeholder="ملاحظات..."
                        value={currentDraft?.notes || ''}
                        onChange={(e) => handleNotesChange(t.id, e.target.value)}
                        className="w-full py-1 px-2 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                      />
                    </td>

                    <td className="p-2 text-center">
                      <button
                        onClick={() => onOpenWizard?.(t)}
                        title="فتح المعالج لتسجيل صور أو عمالة"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
