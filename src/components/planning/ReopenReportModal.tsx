'use client';

import React, { useState } from 'react';
import { 
  X, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  PauseCircle,
  FileText
} from 'lucide-react';
import { DailyProgress } from '@/types/planning';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { useAuth } from '@/lib/stores/useAuthStore';
import { logger } from '@/lib/logger';

interface ReopenReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DailyProgress | null;
  onSuccess?: () => void;
}

export const ReopenReportModal: React.FC<ReopenReportModalProps> = ({
  isOpen,
  onClose,
  report,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('سبب إعادة فتح اليومية إلزامي');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const ok = await DailyProgressService.reopenDailyReport(
        report.id,
        reason.trim(),
        user?.id || 'project_manager'
      );

      if (!ok) {
        throw new Error('فشل إعادة فتح التقرير اليومي، يرجى التحقق من الصلاحيات');
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      logger.error('Error reopening report', { detail: err });
      setErrorMsg((err as Error).message || 'حدث خطأ أثناء إعادة فتح اليومية');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-purple-50/50 dark:bg-purple-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-500/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>إعادة فتح التقرير اليومي #{report.report_no}</span>
                <span className="font-mono text-xs text-purple-700 dark:text-purple-400">
                  ({report.progress_date})
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                صلاحية خاصة بمدير المشروع فقط (PM Privilege)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Banner */}
        <div className="p-4 mx-6 mt-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>تنبيه هام حول الأثر المحاسبي والزمني:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800/90 dark:text-amber-300/90 ps-1">
            <li>
              سيتم تغيير حالة التقرير إلى <strong className="font-bold">معاد فتحه (reopened)</strong>.
            </li>
            <li>
              سيتم <strong className="font-bold">تجميد وتعليق (Suspend)</strong> كافة التوزيعات المرتبطة بأنشطة التخطيط (Progress Allocations).
            </li>
            <li>
              سيتم استبعاد الكميات المحسوبة من منحنى S-Curve ومؤشرات الأداء EVM حتى يُعاد تقديم التقرير واعتماده مجدداً.
            </li>
          </ul>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              <span>سبب وتبرير إعادة فتح اليومية * (إلزامي للتدقيق المالي)</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: تصحيح الكمية المنفذة في بند الخرسانة المسلحة بعد مراجعة تقرير الاستشاري الميداني..."
              className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500/20"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                <PauseCircle className="w-4 h-4" />
              )}
              <span>تأكيد إعادة الفتح وتجميد التوزيعات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
