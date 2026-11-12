'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  TaskExceptionsService,
  TaskExceptionKPIs,
  TaskExceptionRow,
} from '@/lib/services/taskExceptions.service';

interface Props {
  projectId: string;
}

export default function TaskExceptionsDashboard({ projectId }: Props) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState<TaskExceptionKPIs | null>(null);
  const [exceptions, setExceptions] = useState<TaskExceptionRow[]>([]);

  const loadData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [k, e] = await Promise.all([
        TaskExceptionsService.calculateKPIs(projectId),
        TaskExceptionsService.getRankedExceptions(projectId),
      ]);
      setKpis(k);
      setExceptions(e);
    } catch (err) {
      console.error('TaskExceptionsDashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  if (!projectId) return null;

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
            <span>{isAr ? 'إنجاز المهام المطلقة' : 'Released Completion'}</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
            {kpis ? `${kpis.releasedCompletionPct}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-400">
            {kpis?.completedTasks || 0} / {kpis?.releasedTasks || 0} {isAr ? 'مهمة' : 'tasks'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
            <span>{isAr ? 'الالتزام بالموعد' : 'On-Time Verification'}</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
            {kpis ? `${kpis.onTimeVerificationPct}%` : '—'}
          </div>
          <div className="text-[10px] text-slate-400">
            {isAr ? 'مطابق للجدول المخطط' : 'on schedule'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
            <span>{isAr ? 'مراجعات PM المعلقة' : 'Pending PM Reviews'}</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400 tabular-nums">
            {kpis?.pmReviewAgingCount || 0}
          </div>
          <div className="text-[10px] text-slate-400">
            {isAr ? 'بانتظار اعتماد PM' : 'awaiting PM'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
            <span>{isAr ? 'استلامات QC المتأخرة' : 'Aged QC Inspections'}</span>
            <ShieldAlert className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-lg font-black text-purple-600 dark:text-purple-400 tabular-nums">
            {kpis?.qcInspectionAgingCount || 0}
          </div>
          <div className="text-[10px] text-slate-400">
            {isAr ? 'تجاوزت تاريخ الفحص' : 'past required date'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
            <span>{isAr ? 'إعادة عمل (Rework)' : 'Rework Rate'}</span>
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg font-black text-rose-600 dark:text-rose-400 tabular-nums">
            {kpis?.reworkCount || 0}
          </div>
          <div className="text-[10px] text-slate-400">
            {isAr ? 'مرفوض من PM أو QC' : 'rejected tasks'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-bold">
            <span>{isAr ? 'العوائق والموانع' : 'Active Constraints'}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-lg font-black text-orange-600 dark:text-orange-400 tabular-nums">
            {kpis?.blockedCount || 0}
          </div>
          <div className="text-[10px] text-slate-400">
            {isAr ? 'عوائق موقع مفتوحة' : 'open blockers'}
          </div>
        </div>
      </div>

      {/* Ranked Exception Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white">
              {isAr ? 'جدول الاستثناءات والاختناقات الحرجة (Ranked Exceptions)' : 'Ranked Execution Exceptions'}
            </h3>
            <span className="text-[10px] text-slate-400">({exceptions.length})</span>
          </div>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            aria-label={isAr ? 'تحديث البيانات' : 'Refresh data'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
          </div>
        ) : exceptions.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            {isAr ? 'لا توجد استثناءات أو اختناقات في المشروع — الأداء ممتاز' : 'No active exceptions found'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] text-start">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold">
                <tr>
                  <th className="py-2.5 px-3 text-start">#</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'المهمة' : 'Task'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'المسؤول' : 'Owner'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'المرحلة الحالية' : 'Current Stage'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'أيام التأخير' : 'Overdue Days'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'العائق / سبب الرفض' : 'Blocker / Rejection'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {exceptions.map((ex, idx) => (
                  <tr key={ex.taskId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {ex.taskTitle}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {ex.ownerName}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60">
                        {ex.stage}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      {ex.overdueDays > 0 ? (
                        <span className="text-rose-600">+{ex.overdueDays}d</span>
                      ) : (
                        <span className="text-slate-400">0d</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-sm truncate text-[10px]">
                      {ex.blockerTitle && (
                        <span className="text-orange-600 font-bold block">
                          ⚠️ {ex.blockerTitle}
                        </span>
                      )}
                      {ex.rejectionReason && (
                        <span className="text-rose-600 italic block">
                          ❌ {ex.rejectionReason}
                        </span>
                      )}
                      {!ex.blockerTitle && !ex.rejectionReason && '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
