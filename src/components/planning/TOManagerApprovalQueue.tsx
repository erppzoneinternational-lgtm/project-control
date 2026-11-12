'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertTriangle,
  RotateCw,
  Search,
  CheckCheck,
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserCheck,
  X,
  Send,
  AlertCircle,
} from 'lucide-react';
import { ToApprovalQueueItem, TOProgressService } from '@/lib/services/toProgress.service';
import { ProjectService } from '@/lib/services/project.service';
import { Project, Stakeholder } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/lib/stores/useAuthStore';
import { logger } from '@/lib/logger';

export interface TOManagerApprovalQueueProps {
  projectId?: string;
  onItemApproved?: (item: ToApprovalQueueItem) => void;
}

export const TOManagerApprovalQueue: React.FC<TOManagerApprovalQueueProps> = ({
  projectId: propProjectId,
  onItemApproved,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();

  const [queueItems, setQueueItems] = useState<ToApprovalQueueItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [engineers, setEngineers] = useState<Stakeholder[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(propProjectId || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Rejection Feedback Modal
  const [rejectingItem, setRejectingItem] = useState<ToApprovalQueueItem | null>(null);
  const [rejectionComments, setRejectionComments] = useState<string>('');

  // Reassign Modal
  const [reassigningItem, setReassigningItem] = useState<ToApprovalQueueItem | null>(null);
  const [targetEngineerId, setTargetEngineerId] = useState<string>('');

  // Success / Error Feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Helper to translate obstruction types cleanly into Arabic without English words
  const formatObstructionType = (type?: string | null) => {
    if (!type) return '';
    if (!isAr) return type;
    const map: Record<string, string> = {
      technical: 'عائق فني أو استفسار تصميمي',
      consultant: 'تأخر اعتماد الاستشاري',
      site: 'تعارض في الموقع',
      client: 'تعديلات من المالك',
      material: 'تأخر توريد أو اعتماد المواد',
      coordination: 'تعارض تنسيقي بين التخصصات',
      other: 'عائق تنفيذي عام',
    };
    return map[type.toLowerCase()] || type;
  };

  // Load Reference Projects & Engineers
  useEffect(() => {
    async function loadRefs() {
      try {
        const [prjs, stks] = await Promise.all([
          ProjectService.getProjects({}),
          ProjectService.getProjectManagers(),
        ]);
        setProjects(prjs);
        setEngineers(stks);
      } catch (err) {
        logger.warn('Error loading reference data', { detail: err });
      }
    }
    loadRefs();
  }, []);

  // Fetch Queue Items
  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const pid = selectedProjectId === 'all' ? undefined : selectedProjectId;
      const data = await TOProgressService.getApprovalQueue(pid);
      setQueueItems(data);
      setSelectedIds([]);
    } catch (err) {
      logger.error('Error fetching approval queue', { detail: err });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [selectedProjectId]);

  // KPIs
  const kpis = useMemo(() => {
    const totalPending = queueItems.length;
    const withObstructions = queueItems.filter((q) => Boolean(q.log.obstruction_type)).length;
    const highProgressDeltas = queueItems.filter((q) => {
      const oldPct = q.deliverable_item?.progress_pct ?? 0;
      const newPct = q.log.progress_pct ?? 0;
      return newPct - oldPct >= 25;
    }).length;

    return { totalPending, withObstructions, highProgressDeltas };
  }, [queueItems]);

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return queueItems.filter((item) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const sheet = (item.deliverable_item?.sheet_number || '').toLowerCase();
        const desc = (item.deliverable_item?.description || '').toLowerCase();
        const eng = (item.engineer?.name_ar || '').toLowerCase();
        const ref = (item.deliverable?.ref_code || '').toLowerCase();

        if (!sheet.includes(q) && !desc.includes(q) && !eng.includes(q) && !ref.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [queueItems, searchQuery]);

  // Handle Single Approval
  const handleApprove = async (item: ToApprovalQueueItem) => {
    setIsProcessing(true);
    setFeedback(null);
    try {
      const success = await TOProgressService.signOffProgress({
        logId: item.log.id,
        deliverableItemId: item.deliverable_item.id,
        approved: true,
        managerStakeholderId: user?.id || '00000000-0000-0000-0000-000000000000',
      });

      if (!success) throw new Error('Failed to approve item');

      setFeedback({
        type: 'success',
        message: isAr
          ? item.deliverable_item?.sheet_number
            ? `تم اعتماد إنجاز المخطط (${item.deliverable_item.sheet_number}) بنجاح`
            : 'تم اعتماد إنجاز المخطط بنجاح'
          : `Approved progress for ${item.deliverable_item?.sheet_number || 'item'}`,
      });

      if (onItemApproved) {
        onItemApproved(item);
      }

      await loadQueue();
    } catch (err) {
      logger.error('Approval error', { detail: err });
      setFeedback({
        type: 'error',
        message: isAr ? 'فشل اعتماد الإنجاز، يرجى المحاولة لاحقاً' : (err as Error).message || 'Failed to approve progress',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Batch Approval
  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    setFeedback(null);

    const itemsToApprove = queueItems.filter((q) => selectedIds.includes(q.id || q.log.id));
    let successCount = 0;

    for (const item of itemsToApprove) {
      try {
        const ok = await TOProgressService.signOffProgress({
          logId: item.log.id,
          deliverableItemId: item.deliverable_item.id,
          approved: true,
          managerStakeholderId: user?.id || '00000000-0000-0000-0000-000000000000',
        });
        if (ok) successCount++;
      } catch (err) {
        logger.error('Batch signoff error for item', { detail: { itemId: item.id, error: err } });
      }
    }

    setFeedback({
      type: 'success',
      message: isAr
        ? `تم اعتماد ${successCount} من أصل ${itemsToApprove.length} مخطط بنجاح`
        : `Successfully approved ${successCount} of ${itemsToApprove.length} items`,
    });

    await loadQueue();
    setIsProcessing(false);
  };

  // Handle Rejection
  const handleConfirmReject = async () => {
    if (!rejectingItem) return;
    setIsProcessing(true);
    try {
      const success = await TOProgressService.signOffProgress({
        logId: rejectingItem.log.id,
        deliverableItemId: rejectingItem.deliverable_item.id,
        approved: false,
        managerStakeholderId: user?.id || '00000000-0000-0000-0000-000000000000',
        comments: rejectionComments.trim() || (isAr ? 'مطلوب مراجعة وتعديل من قبل مدير المكتب الفني' : 'Revision requested by TO Manager'),
      });

      if (!success) throw new Error('Failed to reject item');

      setFeedback({
        type: 'success',
        message: isAr
          ? 'تم إرجاع التقرير للمهندس لإعادة المراجعة والتعديل'
          : 'Log returned to engineer for revision',
      });

      setRejectingItem(null);
      setRejectionComments('');
      await loadQueue();
    } catch (err) {
      logger.error('Rejection error', { detail: err });
      setFeedback({
        type: 'error',
        message: isAr ? 'فشل رفض التقرير، يرجى المحاولة لاحقاً' : (err as Error).message || 'Failed to reject log',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Reassignment
  const handleConfirmReassign = async () => {
    if (!reassigningItem || !targetEngineerId) return;
    setIsProcessing(true);
    try {
      const result = await TOProgressService.assignDeliverableItem({
        itemId: reassigningItem.deliverable_item.id,
        assignedStakeholderId: targetEngineerId,
        assignedBy: user?.id || (isAr ? 'مدير المكتب الفني' : 'TO Manager'),
      });

      if (!result) throw new Error('Failed to reassign item');

      setFeedback({
        type: 'success',
        message: isAr
          ? 'تمت إعادة تعيين المخطط للمهندس الجديد بنجاح'
          : 'Deliverable item reassigned successfully',
      });

      setReassigningItem(null);
      setTargetEngineerId('');
      await loadQueue();
    } catch (err) {
      logger.error('Reassign error', { detail: err });
      setFeedback({
        type: 'error',
        message: isAr ? 'فشل إعادة التعيين، يرجى المحاولة لاحقاً' : (err as Error).message || 'Failed to reassign item',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredQueue.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQueue.map((q) => q.id || q.log.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-5">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 text-xs font-bold">
            <span>{isAr ? 'طلبات بانتظار الاعتماد' : 'Pending Sign-offs'}</span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-stone-900 dark:text-white">
            {kpis.totalPending}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-bold">
            <span>{isAr ? 'تقارير بها عوائق مسجلة' : 'Logs with Obstructions'}</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400">
            {kpis.withObstructions}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <span>{isAr ? 'قفزات إنجاز ملحوظة (≥ 25%)' : 'High Progress Deltas (≥25%)'}</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">
            {kpis.highProgressDeltas}
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr
                ? 'بحث برقم المخطط، أو الوصف، أو مهندس المكتب الفني...'
                : 'Search by sheet, description, or engineer...'
            }
            className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {!propProjectId && projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
            >
              <option value="all">{isAr ? 'كل المشاريع' : 'All Projects'}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name || p.project_code}
                </option>
              ))}
            </select>
          )}

          {/* Batch Approve Button */}
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBatchApprove}
              disabled={isProcessing}
              className="px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98] shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
            >
              {isProcessing ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              {isAr ? `اعتماد المحدد (${selectedIds.length})` : `Approve Selected (${selectedIds.length})`}
            </button>
          )}

          <button
            type="button"
            onClick={loadQueue}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
            title={isAr ? 'تحديث قائمة المراجعة' : 'Refresh queue'}
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded-lg p-0.5"
            aria-label={isAr ? 'إغلاق الإشعار' : 'Close notification'}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Batch Selection Action Bar */}
      {filteredQueue.length > 0 && (
        <div
          className={`p-3 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
            selectedIds.length > 0
              ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 shadow-sm'
              : 'bg-stone-50/80 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedIds.length === filteredQueue.length && filteredQueue.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900 cursor-pointer border-stone-300 dark:border-stone-600"
              />
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                {isAr ? 'تحديد كل التقارير المعلقة' : 'Select all pending logs'}
              </span>
            </label>

            {selectedIds.length > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                {isAr
                  ? `تم تحديد ${selectedIds.length} من أصل ${filteredQueue.length}`
                  : `${selectedIds.length} of ${filteredQueue.length} selected`}
              </span>
            ) : (
              <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                {filteredQueue.length} {isAr ? 'تقرير قيد المراجعة والاعتماد' : 'items awaiting review'}
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 text-xs font-bold rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
              >
                {isAr ? 'إلغاء التحديد' : 'Deselect All'}
              </button>

              <button
                type="button"
                onClick={handleBatchApprove}
                disabled={isProcessing}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98] shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
              >
                {isProcessing ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                {isAr ? `اعتماد المحدد (${selectedIds.length})` : `Approve Selected (${selectedIds.length})`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Queue Items List */}
      {isLoading ? (
        <div className="py-16 text-center space-y-3">
          <RotateCw className="w-6 h-6 text-emerald-500 animate-spin mx-auto" />
          <p className="text-xs text-stone-400 font-medium">
            {isAr ? 'جارٍ تحميل قائمة اعتماد المكتب الفني...' : 'Loading approval queue...'}
          </p>
        </div>
      ) : filteredQueue.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200/50 dark:border-emerald-800/40">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-black text-stone-800 dark:text-stone-200">
            {isAr ? 'لا توجد تقارير معلقة بانتظار الاعتماد' : 'Approval queue is empty'}
          </h3>
          <p className="text-xs text-stone-400 max-w-sm mx-auto">
            {isAr
              ? 'تم اعتماد جميع التقارير اليومية المقدمة من مهندسي المكتب الفني'
              : 'All daily progress logs have been reviewed and approved.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredQueue.map((item) => {
            const itemId = item.id || item.log.id;
            const isSelected = selectedIds.includes(itemId);
            const reportedPct = item.log.progress_pct ?? 0;
            const previousPct = item.deliverable_item?.progress_pct ?? 0;
            const delta = reportedPct - previousPct;

            return (
              <div
                key={itemId}
                className={`p-4 rounded-2xl bg-white dark:bg-stone-900 border transition-all space-y-3.5 ${
                  isSelected
                    ? 'border-emerald-500/80 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-md ring-1 ring-emerald-500/30'
                    : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(itemId)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900 mt-1 cursor-pointer border-stone-300 dark:border-stone-600"
                    />

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-black px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700">
                          {item.deliverable_item?.sheet_number || (isAr ? 'بدون رقم مخطط' : 'DWG-000')}
                        </span>
                        <span className="text-[11px] font-bold text-stone-500 bg-stone-100/60 dark:bg-stone-800/60 px-2 py-0.5 rounded-md border border-stone-200/50 dark:border-stone-700/50">
                          {isAr ? 'مراجعة' : 'Rev'} {item.deliverable_item?.current_rev ?? 0}
                        </span>
                        {item.deliverable?.ref_code && (
                          <span className="text-[10px] font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200/60 dark:border-emerald-800/50">
                            {item.deliverable.ref_code}
                          </span>
                        )}
                        {item.deliverable?.project_name && (
                          <span className="text-[11px] text-stone-400">
                            • {item.deliverable.project_name}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-black text-stone-900 dark:text-white">
                        {item.deliverable_item?.description ||
                          (isAr ? item.deliverable?.title_ar : (item.deliverable as any)?.title_en || item.deliverable?.title_ar) ||
                          (isAr ? 'بند مخرج غير مسمى' : 'Deliverable Item')}
                      </h4>
                    </div>
                  </div>

                  {/* Engineer Info */}
                  <div className="text-end shrink-0">
                    <div className="flex items-center gap-1.5 justify-end text-xs font-bold text-stone-800 dark:text-stone-200">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      <span>{item.engineer?.name_ar || (isAr ? 'مهندس المكتب الفني' : 'TO Engineer')}</span>
                    </div>
                    <span className="text-[10px] font-mono text-stone-400">
                      {item.log.log_date}
                    </span>
                  </div>
                </div>

                {/* Progress Comparison Strip */}
                <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-stone-500 font-semibold">
                      <span>{isAr ? 'النسبة السابقة:' : 'Old:'}</span>
                      <span className="font-mono font-bold text-stone-700 dark:text-stone-300">
                        {previousPct}%
                      </span>
                    </div>

                    <ArrowRight className="w-3.5 h-3.5 text-stone-400 rtl:rotate-180 shrink-0" />

                    <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      <span>{isAr ? 'المسجلة حديثاً:' : 'Reported:'}</span>
                      <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                        {reportedPct}%
                      </span>
                    </div>

                    {delta !== 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                        +{delta}%
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-stone-600 dark:text-stone-300 flex-1 sm:text-start">
                    <span className="font-bold text-stone-700 dark:text-stone-200">{isAr ? 'بيان الأعمال:' : 'Notes:'} </span>
                    <span>{item.log.notes || (isAr ? 'لا توجد ملاحظات مدونة' : 'No description provided')}</span>
                  </div>
                </div>

                {/* Obstruction Banner if logged */}
                {item.log.obstruction_type && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold">{isAr ? 'عائق تشغيلي مسجل: ' : 'Obstruction: '}</span>
                      <span>
                        {formatObstructionType(item.log.obstruction_type)}
                        {item.log.obstruction_notes ? ` — ${item.log.obstruction_notes}` : ''}
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-100 dark:border-stone-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      setReassigningItem(item);
                      setTargetEngineerId(item.engineer?.id || '');
                    }}
                    disabled={isProcessing}
                    className="px-3 py-1.5 text-xs font-bold rounded-xl text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    {isAr ? 'إعادة تعيين لمهندس آخر' : 'Reassign Item'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRejectingItem(item)}
                      disabled={isProcessing}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-900/50 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      {isAr ? 'طلب تعديل / رفض' : 'Reject / Revise'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(item)}
                      disabled={isProcessing}
                      className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98] shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isAr ? 'اعتماد التقرير' : 'Approve Progress'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection / Revision Feedback Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" />
                  {isAr ? 'طلب تعديل أو رفض تقرير الإنجاز' : 'Request Revision / Reject Log'}
                </h3>
                <p className="text-xs text-stone-500">
                  {rejectingItem.deliverable_item?.sheet_number || (isAr ? 'بدون رقم مخطط' : 'No Sheet')} — {rejectingItem.engineer?.name_ar || (isAr ? 'مهندس المكتب الفني' : 'TO Engineer')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded-lg p-0.5"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                {isAr ? 'سبب الرفض والتوجيهات الفنية للمهندس' : 'Rejection Reason & Engineering Feedback'}
              </label>
              <textarea
                rows={3}
                value={rejectionComments}
                onChange={(e) => setRejectionComments(e.target.value)}
                placeholder={
                  isAr
                    ? 'يرجى مراجعة تفريد حديد الأعمدة ومطابقة مناسيب التأسيس مع التقرير الجيوتقني قبل اعتماد نسبة 70%...'
                    : 'Please review rebar detailing and coordinate foundation levels before claiming 70%...'
                }
                className="w-full p-3 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-3.5 py-2 text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-500 active:scale-[0.98] shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
              >
                <Send className="w-3.5 h-3.5" />
                {isAr ? 'تأكيد الرفض والإرجاع' : 'Confirm & Return'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Engineer Modal */}
      {reassigningItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-stone-900 dark:text-white flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  {isAr ? 'إعادة تعيين المخطط لمهندس آخر' : 'Reassign Deliverable Item'}
                </h3>
                <p className="text-xs text-stone-500">
                  {reassigningItem.deliverable_item?.sheet_number || (isAr ? 'بدون رقم مخطط' : 'No Sheet')} — {reassigningItem.deliverable_item?.description || (isAr ? 'بدون وصف' : 'No description')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReassigningItem(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 rounded-lg p-0.5"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                {isAr ? 'اختر المهندس الجديد' : 'Select New TO Engineer'}
              </label>
              <select
                value={targetEngineerId}
                onChange={(e) => setTargetEngineerId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
              >
                <option value="">{isAr ? '-- اختر مهندس المكتب الفني --' : '-- Select Engineer --'}</option>
                {engineers.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.name_ar} {eng.employee_code ? `(${eng.employee_code})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setReassigningItem(null)}
                className="px-3.5 py-2 text-xs font-bold text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmReassign}
                disabled={isProcessing || !targetEngineerId}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 active:scale-[0.98] shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isAr ? 'تأكيد التعيين' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
