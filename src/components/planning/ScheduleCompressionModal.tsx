'use client';

import React, { useMemo, useState } from 'react';
import {
  Zap,
  CheckCircle2,
  Loader2,
  X,
  ArrowRight,
  ArrowLeft,
  Layers,
  Filter,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  computeCompression,
  type CompressionActivity,
  type CompressionPlan,
} from '@/lib/scheduling/compression';
import type { GanttActivity } from './GanttChart';
import { logger } from '@/lib/logger';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activities: GanttActivity[];
  projectId?: string;
  onSuccess?: () => void;
}

const fmtD = (d: Date | null, locale: string) =>
  d
    ? new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d)
    : '—';

export default function ScheduleCompressionModal({
  isOpen,
  onClose,
  activities,
  onSuccess,
}: Props) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const ArrowIcon = isAr ? ArrowLeft : ArrowRight;

  const [fromActivityId, setFromActivityId] = useState<string>('all');
  const [applying, setApplying] = useState(false);

  // Map GanttActivity to CompressionActivity subset
  const validActs: (CompressionActivity & { code: string; name: string })[] = useMemo(() => {
    return activities
      .filter((a): a is GanttActivity & { id: string; start: Date; finish: Date } =>
        Boolean(a.id && a.start && a.finish)
      )
      .map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        start: a.start,
        finish: a.finish,
        is_milestone: a.milestone,
        percent_complete: a.pct,
      }));
  }, [activities]);

  const actMap = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>();
    for (const a of validActs) {
      map.set(a.id, { code: a.code, name: a.name });
    }
    return map;
  }, [validActs]);

  const plan: CompressionPlan = useMemo(() => {
    if (!validActs.length) return { changes: [], daysSaved: 0 };
    const opts = fromActivityId !== 'all' ? { fromId: fromActivityId } : {};
    try {
      return computeCompression(validActs, opts);
    } catch (e) {
      logger.error('Failed to compute compression', { detail: e });
      return { changes: [], daysSaved: 0 };
    }
  }, [validActs, fromActivityId]);

  if (!isOpen) return null;

  const handleApply = async () => {
    if (!plan.changes.length) {
      toast.info(
        isAr ? 'لا توجد فجوات للتعديل — الجدول مضغوط بالفعل' : 'No gaps to adjust — schedule is already compact'
      );
      onClose();
      return;
    }

    setApplying(true);
    try {
      // Batch update in chunks of 25 to respect RPC/PostgREST limits
      const chunkSize = 25;
      for (let i = 0; i < plan.changes.length; i += chunkSize) {
        const chunk = plan.changes.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map((ch) =>
            supabase
              .from('pm_project_activities')
              .update({
                planned_start: ch.newStart.toISOString(),
                planned_finish: ch.newFinish.toISOString(),
              })
              .eq('id', ch.id)
          )
        );
      }

      toast.success(
        isAr
          ? `تم ضغط الجدول — ${plan.changes.length} نشاط تم تعديله (${plan.daysSaved} يوم تم توفيرها)`
          : `Schedule compressed — ${plan.changes.length} activities updated (${plan.daysSaved} days saved)`
      );

      // Trigger refresh
      window.dispatchEvent(new CustomEvent('schedule-activity-updated'));
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      logger.error('Failed to apply schedule compression', { detail: err });
      toast.error((isAr ? 'فشل تطبيق ضغط الجدول: ' : 'Failed to apply compression: ') + ((err as Error).message || ''));
    } finally {
      setApplying(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                {isAr ? 'ضغط الجدول الزمني' : 'Compress Schedule'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'إغلاق الفجوات الزمنية غير المبررة وسحب الأنشطة لتواريخ أبكر دون المساس بمددها'
                  : 'Close idle gaps and pull activities earlier while preserving their original durations'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={applying}
            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls & Summary */}
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/50">
            {/* Scope selector */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <label htmlFor="compression-scope-select" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'نطاق التطبيق:' : 'Scope:'}
              </label>
              <select
                id="compression-scope-select"
                aria-label={isAr ? 'نطاق التطبيق' : 'Scope'}
                value={fromActivityId}
                onChange={(e) => setFromActivityId(e.target.value)}
                disabled={applying}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 outline-none focus:border-emerald-500"
              >
                <option value="all">
                  {isAr ? 'كامل أنشطة المشروع' : 'Entire Project Schedule'}
                </option>
                {validActs.map((act) => (
                  <option key={act.id} value={act.id}>
                    {isAr ? `من النشاط (${act.code} - ${act.name}) وما بعده` : `From (${act.code} - ${act.name}) onward`}
                  </option>
                ))}
              </select>
            </div>

            {/* Metrics */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  {isAr ? 'الأيام الموفرة:' : 'Days saved:'}{' '}
                  <strong className="text-sm font-black">{plan.daysSaved}</strong> {isAr ? 'يوم' : 'days'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold">
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {isAr ? 'الأنشطة المتأثرة:' : 'Affected activities:'}{' '}
                  <strong className="text-sm font-black">{plan.changes.length}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
            <div className="max-h-[320px] overflow-y-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 z-10">
                  <tr>
                    <th className="px-3 py-2 text-start">{isAr ? 'كود النشاط' : 'Code'}</th>
                    <th className="px-3 py-2 text-start">{isAr ? 'اسم النشاط' : 'Activity Name'}</th>
                    <th className="px-3 py-2 text-start">{isAr ? 'التاريخ القديم' : 'Current Dates'}</th>
                    <th className="px-3 py-2 text-center w-8"></th>
                    <th className="px-3 py-2 text-start">{isAr ? 'التاريخ الجديد المقترح' : 'New Proposed Dates'}</th>
                    <th className="px-3 py-2 text-center">{isAr ? 'الفارق' : 'Shift'}</th>
                    <th className="px-3 py-2 text-start">{isAr ? 'ملاحظة' : 'Note'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {plan.changes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 dark:text-slate-500">
                        {isAr
                          ? 'الجدول مضغوط بالفعل — لا توجد أنشطة سيتم تحريك تواريخها'
                          : 'Schedule is already optimized — no activity dates need shifting'}
                      </td>
                    </tr>
                  ) : (
                    plan.changes.map((ch) => {
                      const meta = actMap.get(ch.id);
                      const shiftDays = Math.round(
                        (ch.oldStart.getTime() - ch.newStart.getTime()) / 86400000
                      );

                      return (
                        <tr
                          key={ch.id}
                          className="hover:bg-emerald-50/40 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/20 transition-colors"
                        >
                          <td className="px-3 py-2 font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                            {meta?.code || ch.id.slice(0, 8)}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200 max-w-[220px] truncate">
                            {meta?.name || '—'}
                          </td>
                          <td className="px-3 py-2 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                            {fmtD(ch.oldStart, locale)} → {fmtD(ch.oldFinish, locale)}
                          </td>
                          <td className="px-1 py-2 text-center text-emerald-600 dark:text-emerald-400">
                            <ArrowIcon className="w-3.5 h-3.5 inline" />
                          </td>
                          <td className="px-3 py-2 font-mono text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                            {fmtD(ch.newStart, locale)} → {fmtD(ch.newFinish, locale)}
                          </td>
                          <td className="px-3 py-2 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                            -{shiftDays} {isAr ? 'يوم' : 'd'}
                          </td>
                          <td className="px-3 py-2">
                            {ch.started && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                                {isAr ? 'بدأ تنفيذ' : 'Started'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <button
            type="button"
            onClick={onClose}
            disabled={applying}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={applying || plan.changes.length === 0}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {applying ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isAr ? 'جاري تطبيق الضغط...' : 'Applying compression...'}</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {isAr
                    ? `تطبيق الضغط (${plan.changes.length} نشاط)`
                    : `Apply Compression (${plan.changes.length} acts)`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
