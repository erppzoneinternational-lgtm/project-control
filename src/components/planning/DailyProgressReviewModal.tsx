'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { DailyProgress } from '@/types/planning';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/lib/stores/useAuthStore';
import { 
  CheckCircle2, 
  XCircle, 
  X, 
  ClipboardCheck, 
  Loader2, 
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { DailyProgressComments } from './DailyProgressComments';

interface DailyProgressReviewModalProps {
  report: DailyProgress | null;
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const DailyProgressReviewModal: React.FC<DailyProgressReviewModalProps> = ({
  report,
  isOpen,
  onClose,
  projectId,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const approveMutation = useMutation({
    mutationFn: () => DailyProgressService.approveDailyReport(report!.id, projectId, user?.id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
      toast.success(isAr ? 'تم اعتماد التقرير اليومي وتوزيع الكميات على الأنشطة' : 'Report approved & allocations created');
      onClose();
    },
    onError: () => toast.error(isAr ? 'فشل اعتماد التقرير' : 'Failed to approve report'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => DailyProgressService.rejectDailyReport(report!.id, user?.id || '', projectId, rejectReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
      toast.success(isAr ? 'تم رفض التقرير مع توثيق السبب' : 'Report rejected');
      onClose();
    },
    onError: () => toast.error(isAr ? 'فشل رفض التقرير' : 'Failed to reject report'),
  });

  const pmSoftReviewMutation = useMutation({
    mutationFn: (skipped: boolean) => DailyProgressService.pmSoftReview(report!.id, user?.id || '', projectId, skipped),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-reports'] });
      toast.success(isAr ? 'تم تسجيل مراجعة مدير المشروع' : 'PM review logged');
    },
  });

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isAr ? 'مراجعة واعتماد التقرير اليومي' : 'Review & Approve Daily Report'}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-mono">
                  {report.report_date || report.progress_date}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr 
                  ? 'اعتماد مهندس التخطيط يوزع الكميات تلقائياً على أنشطة المشروع ويحدث نسب الإنجاز' 
                  : 'Planner approval triggers automatic allocation to activities and updates progress'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Report Metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">{isAr ? 'التاريخ' : 'Date'}</span>
              <span className="font-bold font-mono text-slate-900 dark:text-slate-100">{report.report_date || report.progress_date}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">{isAr ? 'الحالة' : 'Status'}</span>
              <span className="font-bold uppercase text-emerald-500">{report.status}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">{isAr ? 'مراجعة مدير المشروع' : 'PM Review'}</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {report.pm_reviewed_at 
                  ? (isAr ? 'تمت المراجعة ✅' : 'Reviewed ✅')
                  : report.pm_skipped 
                  ? (isAr ? 'تم التخطي ⏭️' : 'Skipped ⏭️')
                  : (isAr ? 'قيد الانتظار ⏳' : 'Pending ⏳')}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block mb-0.5">{isAr ? 'الطقس والملاحظات' : 'Weather / Notes'}</span>
              <span className="font-medium truncate block text-slate-700 dark:text-slate-300">{report.weather || report.notes || '—'}</span>
            </div>
          </div>

          {/* Lines Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              {isAr ? 'بنود التقرير اليومي المنفذة' : 'Report Lines'} ({report.lines?.length || 0})
            </h4>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 text-start">{isAr ? 'كود البند' : 'Item Code'}</th>
                    <th className="p-3 text-start">{isAr ? 'الوصف' : 'Description'}</th>
                    <th className="p-3 text-center">{isAr ? 'الوحدة' : 'Unit'}</th>
                    <th className="p-3 text-center">{isAr ? 'الكمية اليومية' : 'Qty Today'}</th>
                    <th className="p-3 text-center">{isAr ? 'النسبة اليومية' : 'Pct Today'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {report.lines?.map((line) => (
                    <tr key={line.id}>
                      <td className="p-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {line.boq_item?.item_code || '—'}
                      </td>
                      <td className="p-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        {line.boq_item?.description_ar || '—'}
                      </td>
                      <td className="p-3 text-center text-slate-500 dark:text-slate-400">
                        {line.boq_item?.unit || '—'}
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {line.qty_today}
                      </td>
                      <td className="p-3 text-center font-mono text-slate-600 dark:text-slate-400">
                        {line.pct_today ? `${line.pct_today}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rejection Reason Form */}
          {rejectMode && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-3">
              <label className="block text-xs font-bold text-red-600 dark:text-red-400">
                {isAr ? 'سبب رفض التقرير وإعادته للموقع *' : 'Rejection Reason *'}
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={isAr ? 'اكتب ملاحظات الرفض والتعديل المطلوبة...' : 'Enter rejection comments...'}
                className="w-full p-3 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-red-200 dark:border-red-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                required
              />
            </div>
          )}

          {/* Confidential PM Management Comments */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <DailyProgressComments dailyProgressId={report.id} projectId={projectId} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {!report.pm_reviewed_at && (
              <button
                type="button"
                onClick={() => pmSoftReviewMutation.mutate(false)}
                disabled={pmSoftReviewMutation.isPending}
                className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {isAr ? 'تأكيد مراجعة مدير المشروع' : 'PM Soft Review'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {rejectMode ? (
              <>
                <button
                  type="button"
                  onClick={() => setRejectMode(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => rejectMutation.mutate()}
                  disabled={rejectMutation.isPending || !rejectReason.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-bold shadow-md hover:bg-red-600 transition-all disabled:opacity-50"
                >
                  {rejectMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isAr ? 'تأكيد الرفض' : 'Confirm Reject'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setRejectMode(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  {isAr ? 'رفض التقرير' : 'Reject'}
                </button>
                <button
                  type="button"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-600 transition-all disabled:opacity-50"
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  {isAr ? 'اعتماد التقرير وتوزيع الكميات' : 'Approve & Allocate'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
