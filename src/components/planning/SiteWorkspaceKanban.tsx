'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock, PlayCircle, ShieldCheck, CheckCircle2, Search,
  Filter, Sparkles, MapPin, Calendar, HardHat, ChevronRight,
  Loader2, AlertTriangle, ArrowRight, User, XCircle, RefreshCw
} from 'lucide-react';
import { SiteTask } from '@/lib/services/siteTask.service';
import { DailyProgress } from '@/types/planning';

interface SiteWorkspaceKanbanProps {
  tasks: SiteTask[];
  projectId: string;
  zoneMap?: Record<string, string>;
  rejectedReports?: DailyProgress[];
  onOpenWizard: (task: SiteTask) => void;
  onStartTask: (taskId: string) => Promise<void>;
  actingId: string | null;
  onRefresh: () => void;
}

export function SiteWorkspaceKanban({
  tasks,
  projectId,
  zoneMap = {},
  rejectedReports = [],
  onOpenWizard,
  onStartTask,
  actingId,
  onRefresh,
}: SiteWorkspaceKanbanProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const q = searchQuery.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title_ar.toLowerCase().includes(q) ||
        (t.task_code && t.task_code.toLowerCase().includes(q)) ||
        (t.zone && typeof t.zone === 'object' && t.zone.name_ar && t.zone.name_ar.toLowerCase().includes(q))
    );
  }, [tasks, searchQuery]);

  // Group tasks into 5 kanban lanes
  const lanes = useMemo(() => {
    const planned: SiteTask[] = [];
    const inProgress: SiteTask[] = [];
    const pendingReview: SiteTask[] = [];
    const rejected: SiteTask[] = [];
    const completed: SiteTask[] = [];

    const rejectedTaskIds = new Set(
      (rejectedReports || []).map((r) => r.site_task_id).filter(Boolean)
    );

    for (const t of filteredTasks) {
      const isTaskRejected = t.status === 'rejected' || rejectedTaskIds.has(t.id);
      if (t.status === 'done' || t.status === 'approved' || Number(t.progress_pct) >= 100) {
        completed.push(t);
      } else if (isTaskRejected) {
        rejected.push(t);
      } else if (t.status === 'pm_review' || t.status === 'qc_pending' || (t.progress_pct > 0 && !t.progress_verified)) {
        pendingReview.push(t);
      } else if (t.status === 'in_progress') {
        inProgress.push(t);
      } else {
        planned.push(t);
      }
    }

    return {
      planned,
      inProgress,
      pendingReview,
      rejected,
      completed,
    };
  }, [filteredTasks, rejectedReports]);

  return (
    <div className="space-y-4">
      {/* Kanban Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="تصفية بطاقات الكانبان بالاسم أو الكود..."
              aria-label="تصفية بطاقات الكانبان بالاسم أو الكود"
              className="w-full pr-8 pl-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap text-xs font-bold text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>مخطط: <strong className="font-mono text-slate-800 dark:text-white">{lanes.planned.length}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>جاري: <strong className="font-mono text-blue-600">{lanes.inProgress.length}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>بانتظار الاعتماد: <strong className="font-mono text-amber-600">{lanes.pendingReview.length}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>مرفوض: <strong className="font-mono text-rose-600">{lanes.rejected.length}</strong></span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>معتمد: <strong className="font-mono text-emerald-600">{lanes.completed.length}</strong></span>
          </span>
        </div>
      </div>

      {/* 5 Lanes Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 items-start">
        {/* ── LANE 1: PLANNED ── */}
        <div className="bg-slate-100/70 dark:bg-slate-800/40 rounded-2xl p-3 space-y-3 border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-200">
                مخطط اليوم ({lanes.planned.length})
              </h3>
            </div>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="space-y-2.5 min-h-[320px]">
            {lanes.planned.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                لا توجد مهام جديدة بانتظار البدء
              </div>
            ) : (
              lanes.planned.map((t) => {
                const zoneName = (t.zone && typeof t.zone === 'object' && 'name_ar' in t.zone ? t.zone.name_ar : null) || (t.zone_id ? zoneMap[t.zone_id] : null) || '—';
                const isBusy = actingId === t.id;
                return (
                  <div
                    key={t.id}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 hover:border-slate-300 dark:hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono font-bold text-[10px] text-slate-400">
                        {t.task_code || `#${t.id.slice(0, 6)}`}
                      </span>
                      {zoneName !== '—' && (
                        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-bold">
                          {zoneName}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed line-clamp-2">
                      {t.title_ar}
                    </h4>

                    <div className="pt-1">
                      <button
                        onClick={() => onStartTask(t.id)}
                        disabled={isBusy}
                        className="w-full py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                      >
                        {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                        <span>ابدأ التنفيذ الآن</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── LANE 2: IN PROGRESS ── */}
        <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl p-3 space-y-3 border border-blue-200/60 dark:border-blue-900/40">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <h3 className="text-xs font-black text-blue-900 dark:text-blue-200">
                جاري العمل ({lanes.inProgress.length})
              </h3>
            </div>
            <PlayCircle className="w-3.5 h-3.5 text-blue-500" />
          </div>

          <div className="space-y-2.5 min-h-[320px]">
            {lanes.inProgress.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-blue-200 dark:border-blue-900/40 rounded-xl">
                لا توجد مهام قيد التنفيذ حالياً
              </div>
            ) : (
              lanes.inProgress.map((t) => {
                const zoneName = (t.zone && typeof t.zone === 'object' && 'name_ar' in t.zone ? t.zone.name_ar : null) || (t.zone_id ? zoneMap[t.zone_id] : null) || '—';
                const pct = Number(t.progress_pct) || 0;
                return (
                  <div
                    key={t.id}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-blue-200 dark:border-blue-900 shadow-sm space-y-2.5 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono font-bold text-[10px] text-blue-600 dark:text-blue-400">
                        {t.task_code || `#${t.id.slice(0, 6)}`}
                      </span>
                      {zoneName !== '—' && (
                        <span className="text-[9px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded font-bold border border-blue-100 dark:border-blue-900">
                          {zoneName}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed line-clamp-2">
                      {t.title_ar}
                    </h4>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-400">نسبة الإنجاز:</span>
                        <span className="font-mono text-emerald-600 font-black">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Trigger -> Opens Wizard */}
                    <div className="pt-1">
                      <button
                        onClick={() => onOpenWizard(t)}
                        className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>تسجيل إنجاز اليوم</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── LANE 3: PENDING REVIEW ── */}
        <div className="bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl p-3 space-y-3 border border-amber-200/60 dark:border-amber-900/40">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-xs font-black text-amber-900 dark:text-amber-200">
                بانتظار الاعتماد ({lanes.pendingReview.length})
              </h3>
            </div>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
          </div>

          <div className="space-y-2.5 min-h-[320px]">
            {lanes.pendingReview.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-amber-200 dark:border-amber-900/40 rounded-xl">
                لا توجد تقارير تنتظر المراجعة
              </div>
            ) : (
              lanes.pendingReview.map((t) => {
                const zoneName = (t.zone && typeof t.zone === 'object' && 'name_ar' in t.zone ? t.zone.name_ar : null) || (t.zone_id ? zoneMap[t.zone_id] : null) || '—';
                const pct = Number(t.progress_pct) || 0;
                return (
                  <div
                    key={t.id}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-amber-200 dark:border-amber-900/60 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono font-bold text-[10px] text-amber-600 dark:text-amber-400">
                        {t.task_code || `#${t.id.slice(0, 6)}`}
                      </span>
                      <span className="text-[9px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-200 dark:border-amber-800">
                        قيد المراجعة
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed line-clamp-2">
                      {t.title_ar}
                    </h4>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-400">المرفوع:</span>
                        <span className="font-mono text-amber-600 font-black">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>في لوحة التخطيط</span>
                      <button
                        onClick={() => onOpenWizard(t)}
                        className="text-amber-600 hover:text-amber-700 dark:text-amber-300 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>تحديث</span>
                        <ChevronRight className="w-3 h-3 rotate-180" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── LANE 4: REJECTED / NEEDS REWORK ── */}
        <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl p-3 space-y-3 border border-rose-200/60 dark:border-rose-900/40">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h3 className="text-xs font-black text-rose-900 dark:text-rose-200">
                مرفوضة للمعالجة ({lanes.rejected.length})
              </h3>
            </div>
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>

          <div className="space-y-2.5 min-h-[320px]">
            {lanes.rejected.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-rose-200 dark:border-rose-900/40 rounded-xl">
                لا توجد مهام مرفوضة بحاجة لتعديل
              </div>
            ) : (
              lanes.rejected.map((t) => {
                const zoneName = (t.zone && typeof t.zone === 'object' && 'name_ar' in t.zone ? t.zone.name_ar : null) || (t.zone_id ? zoneMap[t.zone_id] : null) || '—';
                const matchingRej = rejectedReports?.find((r) => r.site_task_id === t.id);
                const reason = matchingRej?.rejection_reason || matchingRej?.progress_rejection_reason || t.rejection_reason;
                return (
                  <div
                    key={t.id}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3 border-2 border-rose-300 dark:border-rose-800 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono font-bold text-[10px] text-rose-600 dark:text-rose-400">
                        {t.task_code || `#${t.id.slice(0, 6)}`}
                      </span>
                      <span className="text-[9px] bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 px-1.5 py-0.5 rounded font-bold border border-rose-300 dark:border-rose-800">
                        مرفوضة
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed line-clamp-2">
                      {t.title_ar}
                    </h4>

                    {reason && (
                      <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-[10px] text-rose-700 dark:text-rose-300 leading-tight">
                        <strong>سبب الرفض:</strong> {reason}
                      </div>
                    )}

                    <div className="pt-1">
                      <button
                        onClick={() => onOpenWizard(t)}
                        className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>معالجة وإعادة التقديم</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── LANE 5: VERIFIED / COMPLETED ── */}
        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-2xl p-3 space-y-3 border border-emerald-200/60 dark:border-emerald-900/40">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                معتمد ومكتمل ({lanes.completed.length})
              </h3>
            </div>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>

          <div className="space-y-2.5 min-h-[320px]">
            {lanes.completed.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-emerald-200 dark:border-emerald-900/40 rounded-xl">
                لا توجد مهام منتهية ومعتمدة بالكامل بعد
              </div>
            ) : (
              lanes.completed.map((t) => {
                const zoneName = (t.zone && typeof t.zone === 'object' && 'name_ar' in t.zone ? t.zone.name_ar : null) || (t.zone_id ? zoneMap[t.zone_id] : null) || '—';
                return (
                  <div
                    key={t.id}
                    className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-emerald-200 dark:border-emerald-900/60 shadow-sm space-y-2 opacity-90"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono font-bold text-[10px] text-emerald-600 dark:text-emerald-400">
                        {t.task_code || `#${t.id.slice(0, 6)}`}
                      </span>
                      <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-200 dark:border-emerald-800">
                        ✓ معتمد
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
                      {t.title_ar}
                    </h4>

                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span>إنجاز كامل:</span>
                      <span className="font-mono text-emerald-600 font-black">100%</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

