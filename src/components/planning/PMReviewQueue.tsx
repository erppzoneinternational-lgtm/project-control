'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Loader2,
  ShieldCheck,
  Send,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SiteTask, SiteTaskService } from '@/lib/services/siteTask.service';
import { TaskOntologyService } from '@/lib/services/taskOntology.service';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface Props {
  tasks: (SiteTask & { assignee_name?: string; zone_name?: string })[];
  projectId: string;
  onRefresh: () => void;
}

export default function PMReviewQueue({ tasks, projectId, onRefresh }: Props) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [selectedTask, setSelectedTask] = useState<SiteTask | null>(null);
  const [actionType, setActionType] = useState<'accept_verify' | 'accept_wir' | 'reject' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [wirType, setWirType] = useState<'WIR' | 'MIR' | 'pre_pour'>('WIR');
  const [submitting, setSubmitting] = useState(false);

  // Canonical state machine (migration 025): the state is 'pm_review'.
  // 'submitted_for_pm' is a pm_task_events EVENT type, never a task status.
  const pmReviewTasks = tasks.filter((t) => t.status === 'pm_review');

  const handleAction = async () => {
    if (!selectedTask || !actionType) return;
    setSubmitting(true);
    try {
      if (actionType === 'reject') {
        if (!rejectReason.trim()) {
          toast.error(isAr ? 'سبب الرفض إلزامي' : 'Rejection reason is required');
          setSubmitting(false);
          return;
        }
        await SiteTaskService.transitionTaskState({
          taskId: selectedTask.id,
          toState: 'rejected',
          reason: rejectReason,
        });
        toast.success(
          isAr
            ? 'تم رفض المهمة وإعادتها للتنفيذ ومتابعة التعديلات'
            : 'Task rejected and returned to rework'
        );
      } else if (actionType === 'accept_verify') {
        await SiteTaskService.transitionTaskState({
          taskId: selectedTask.id,
          toState: 'approved',
          reason: 'اعتماد مدير المشروع',
        });
        toast.success(isAr ? 'تم اعتماد المهمة بنجاح' : 'Task approved successfully');
      } else if (actionType === 'accept_wir') {
        // Create WIR and move to inspection_pending
        const requestNo = `WIR-${Date.now().toString().slice(-4)}`;
        await TaskOntologyService.createInspectionRequest({
          task_id: selectedTask.id,
          project_id: projectId,
          request_no: requestNo,
          inspection_type: wirType,
          required_at: new Date().toISOString().slice(0, 10),
          assigned_qc_id: selectedTask.qc_stakeholder_id || null,
          status: 'pending',
        });
        await SiteTaskService.transitionTaskState({
          taskId: selectedTask.id,
          toState: 'qc_pending',
          reason: isAr ? `طلب فحص أعمال جودة ${requestNo}` : `Quality inspection request ${requestNo}`,
        });
        toast.success(
          isAr
            ? `تم تحويل المهمة لفحص الجودة بنجاح (${requestNo})`
            : `Task routed to QC inspection (${requestNo})`
        );
      }

      setSelectedTask(null);
      setActionType(null);
      setRejectReason('');
      onRefresh();
    } catch (err) {
      logger.error('Failed to process review', { detail: err });
      toast.error((err as Error).message || (isAr ? 'حدث خطأ أثناء معالجة الطلب' : 'Failed to process review'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* PM Queue Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50/90 via-amber-50/50 to-orange-50/40 dark:from-amber-950/30 dark:via-amber-950/20 dark:to-orange-950/10 border border-amber-200/90 dark:border-amber-900/60 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-xl text-amber-700 dark:text-amber-300 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-amber-950 dark:text-amber-100">
              {isAr ? 'قائمة مراجعات واعتمادات مدير المشروع' : 'PM Review Action Queue'}
            </h3>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
              {isAr
                ? `${pmReviewTasks.length} مهام بانتظار قرار مدير المشروع (اعتماد نهائي / تحويل للفحص الفني / رفض)`
                : `${pmReviewTasks.length} tasks awaiting PM review decision`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            {pmReviewTasks.length} {isAr ? 'مهام معلقة' : 'Pending Tasks'}
          </span>
        </div>
      </div>

      {/* Review Queue Cards */}
      {pmReviewTasks.length === 0 ? (
        <div className="py-14 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-2 bg-slate-50/50 dark:bg-slate-900/30">
          <CheckCircle2 className="w-9 h-9 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {isAr ? 'لا توجد مهام بانتظار مراجعة مدير المشروع' : 'No tasks waiting for PM review'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAr ? 'جميع المهام المنفذة تم اعتمادها أو توجيهها بالكامل' : 'All submitted site tasks have been processed'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {pmReviewTasks.map((t) => (
            <div
              key={t.id}
              className="group bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl p-4 space-y-3.5 shadow-xs hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800/80 transition-all duration-200"
            >
              {/* Card Header Status & Date */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100/90 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900/60">
                  <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  {isAr ? 'بانتظار المراجعة' : 'Pending Review'}
                </span>
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                  {t.planned_date}
                </span>
              </div>

              {/* Task Title & Description */}
              <div className="space-y-1">
                <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-2 leading-snug">
                  {t.title_ar}
                </h4>
                {t.description && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>

              {/* Assignee & Progress Bar */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 truncate max-w-[160px]">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{t.assignee_name || (isAr ? 'المهندس المنفذ' : 'Assignee')}</span>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono text-xs">
                    {t.progress_pct}% {isAr ? 'مكتمل' : 'completed'}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, t.progress_pct || 0))}%` }}
                  />
                </div>
              </div>

              {/* PM Action Buttons */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(t);
                    setActionType('accept_verify');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'اعتماد' : 'Approve'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(t);
                    setActionType('accept_wir');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isAr ? 'طلب فحص أعمال' : 'Request WIR'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedTask(t);
                    setActionType('reject');
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 shadow-xs"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{isAr ? 'رفض' : 'Reject'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      {selectedTask && actionType && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {actionType === 'reject' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                ) : actionType === 'accept_wir' ? (
                  <ShieldCheck className="w-5 h-5 text-blue-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {actionType === 'reject'
                    ? (isAr ? 'رفض المهمة وإعادتها للتنفيذ' : 'Reject Task for Rework')
                    : actionType === 'accept_wir'
                    ? (isAr ? 'تحويل المهمة لفحص واستلام الجودة' : 'Route to QC Inspection (WIR)')
                    : (isAr ? 'اعتماد المهمة نهائياً' : 'Approve & Verify Task')}
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{selectedTask.title_ar}</p>
            </div>

            {actionType === 'reject' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'سبب الرفض (إلزامي)*' : 'Rejection Reason (Mandatory)*'}
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={isAr ? 'اكتب الملاحظات وأسباب عدم مطابقة التنفيذ...' : 'Describe non-conformance reasons...'}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-rose-500 focus-visible:ring-2 focus-visible:ring-rose-500/20 transition-all"
                />
              </div>
            )}

            {actionType === 'accept_wir' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {isAr ? 'نوع الفحص المطلوب' : 'Inspection Type'}
                </label>
                <select
                  value={wirType}
                  onChange={(e) => setWirType(e.target.value as 'WIR' | 'MIR' | 'pre_pour')}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 transition-all cursor-pointer"
                >
                  {isAr ? (
                    <>
                      <option value="WIR">طلب استلام أعمال موقعية (فحص تنفيذي)</option>
                      <option value="MIR">طلب فحص واستلام المواد الموردة</option>
                      <option value="pre_pour">إذن وفحص صب الخرسانة المسلحة</option>
                    </>
                  ) : (
                    <>
                      <option value="WIR">WIR — Work Inspection Request</option>
                      <option value="MIR">MIR — Material Inspection Request</option>
                      <option value="pre_pour">Pre-Pour — Concrete Pour Authorization</option>
                    </>
                  )}
                </select>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedTask(null);
                  setActionType(null);
                }}
                disabled={submitting}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 dark:active:bg-slate-700 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleAction}
                disabled={submitting}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 shadow-sm ${
                  actionType === 'reject'
                    ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500'
                    : actionType === 'accept_wir'
                    ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-500'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-500'
                }`}
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isAr ? 'تأكيد القرار' : 'Confirm Decision'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

