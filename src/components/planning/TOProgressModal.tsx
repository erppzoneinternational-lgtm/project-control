'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sliders,
  Clock,
  FileText,
  AlertTriangle,
  Send,
  Save,
  History,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import {
  DeliverableItem,
  Deliverable,
  ToProgressLog,
  UnifiedObstructionType,
} from '@/types/planning';
import { TOProgressService, CreateToProgressLogDTO } from '@/lib/services/toProgress.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/lib/stores/useAuthStore';
import { logger } from '@/lib/logger';

export const UNIFIED_OBSTRUCTION_TAXONOMY: {
  type: UnifiedObstructionType;
  labelAr: string;
  labelEn: string;
}[] = [
  { type: 'owner_directive', labelAr: 'توجيهات وتعليمات المالك / الاستشاري', labelEn: 'Owner / Consultant Directive' },
  { type: 'weather', labelAr: 'ظروف جوية قاهرة (أمطار / حرارة)', labelEn: 'Adverse Weather' },
  { type: 'material_delay', labelAr: 'تأخر توريد أو اعتماد المواد والخامات', labelEn: 'Material Delay' },
  { type: 'drawing_delay', labelAr: 'تأخر اعتماد اللوحات والمخططات', labelEn: 'Drawing Approval Delay' },
  { type: 'subcontractor', labelAr: 'تعثر أو نقص عمالة مقاول الباطن', labelEn: 'Subcontractor Default' },
  { type: 'permit_authority', labelAr: 'تأخر التراخيص والتصاريح الحكومية', labelEn: 'Permit / Authority Delay' },
  { type: 'equipment', labelAr: 'تعطل أو توقف المعدات والآليات', labelEn: 'Equipment Breakdown' },
  { type: 'manpower', labelAr: 'نقص في العمالة الفنية المتخصصة', labelEn: 'Manpower Shortage' },
  { type: 'safety', labelAr: 'ملاحظات واشتراطات السلامة المهنية', labelEn: 'Safety / HSE Suspension' },
  { type: 'access', labelAr: 'تعذر استلام / دخول الموقع والعوائق الميدانية', labelEn: 'Site Access Restriction' },
  { type: 'other', labelAr: 'إعاقة أخرى غير مصنفة', labelEn: 'Other Obstruction' },
];

export interface TOProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliverableItem: DeliverableItem | null;
  deliverable?: Deliverable | null;
  projectName?: string;
  onSuccess?: (log: ToProgressLog) => void;
  initialObstructionMode?: boolean;
}

export const TOProgressModal: React.FC<TOProgressModalProps> = ({
  isOpen,
  onClose,
  deliverableItem,
  deliverable,
  projectName = '',
  onSuccess,
  initialObstructionMode = false,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'log' | 'history'>('log');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [hoursSpent, setHoursSpent] = useState<number | ''>(0);
  const [workDescription, setWorkDescription] = useState<string>('');
  const [hasObstruction, setHasObstruction] = useState<boolean>(false);
  const [obstructionType, setObstructionType] = useState<UnifiedObstructionType>('drawing_delay');
  const [obstructionNotes, setObstructionNotes] = useState<string>('');
  const [logDate, setLogDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const [historyLogs, setHistoryLogs] = useState<ToProgressLog[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync initial values whenever deliverableItem changes
  useEffect(() => {
    if (deliverableItem) {
      const currentVal = deliverableItem.progress_pct ?? 0;
      setProgressPct(currentVal);
      setHoursSpent(0);
      setWorkDescription('');
      setHasObstruction(Boolean(initialObstructionMode || deliverableItem.status === 'blocked'));
      setObstructionType('drawing_delay');
      setObstructionNotes(deliverableItem.blocked_reason || '');
      setLogDate(new Date().toISOString().slice(0, 10));
      setErrorMessage(null);
      setSuccessMessage(null);
      setActiveTab('log');
      loadHistory(deliverableItem.id);
    }
  }, [deliverableItem, initialObstructionMode]);

  const loadHistory = async (itemId: string) => {
    setIsLoadingHistory(true);
    try {
      const logs = await TOProgressService.getProgressHistory(itemId);
      setHistoryLogs(logs);
    } catch (err) {
      logger.warn('Error loading progress history', { detail: err });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const initialProgress = deliverableItem?.progress_pct ?? 0;
  const progressDelta = useMemo(() => {
    return Number((progressPct - initialProgress).toFixed(1));
  }, [progressPct, initialProgress]);

  const getObstructionLabel = (type: string | null | undefined) => {
    if (!type) return '';
    const item = UNIFIED_OBSTRUCTION_TAXONOMY.find((t) => t.type === type);
    if (!item) return type;
    return isAr ? item.labelAr : item.labelEn;
  };

  if (!isOpen || !deliverableItem) return null;

  const handleSave = async (submitForApproval = false) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (progressPct < 0 || progressPct > 100) {
      setErrorMessage(
        isAr ? 'نسبة الإنجاز يجب أن تكون بين 0% و 100%' : 'Progress must be between 0% and 100%'
      );
      return;
    }

    if (hasObstruction && !obstructionNotes.trim()) {
      setErrorMessage(
        isAr
          ? 'يرجى كتابة تفاصيل ووصف العائق الفني'
          : 'Please provide description/notes for the reported obstruction'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const projectId = deliverableItem.deliverable?.project_id || deliverable?.project_id || '';
      const payload: CreateToProgressLogDTO = {
        deliverable_item_id: deliverableItem.id,
        project_id: projectId,
        stakeholder_id: deliverableItem.assigned_stakeholder_id || user?.id,
        logged_by: user?.id,
        progress_pct: Number(progressPct),
        work_description: workDescription.trim() || undefined,
        hours_spent: typeof hoursSpent === 'number' ? hoursSpent : null,
        obstruction_type: hasObstruction ? obstructionType : null,
        obstruction_notes: hasObstruction ? obstructionNotes.trim() : null,
        log_date: logDate,
      };

      const savedLog = await TOProgressService.logDailyProgress(payload);
      if (!savedLog) throw new Error('Failed to save daily progress');

      if (submitForApproval) {
        await TOProgressService.submitProgressForApproval(deliverableItem.id, savedLog.id);
      }

      setSuccessMessage(
        submitForApproval
          ? isAr
            ? 'تم حفظ التقدم وتقديمه للاعتماد بنجاح'
            : 'Progress saved and submitted for manager approval successfully'
          : isAr
          ? 'تم حفظ المسودة اليومية بنجاح'
          : 'Draft daily log saved successfully'
      );

      if (onSuccess) {
        onSuccess(savedLog);
      }

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      logger.error('TOProgressModal error', { detail: err });
      setErrorMessage((err as Error).message || (isAr ? 'حدث خطأ أثناء حفظ التقدم' : 'Failed to save progress log'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="to-progress-modal-title"
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 bg-stone-50 dark:bg-stone-900/90 border-b border-stone-200 dark:border-stone-800 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {deliverableItem.sheet_number || deliverable?.ref_code || (isAr ? 'مخطط تسليم' : 'DELIVERABLE')}
              </span>
              <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                {isAr ? `إصدار ${deliverableItem.current_rev ?? 0}` : `Rev ${deliverableItem.current_rev ?? 0}`}
              </span>
              {projectName && (
                <span className="text-[11px] text-stone-400">
                  • {projectName}
                </span>
              )}
            </div>
            <h2 id="to-progress-modal-title" className="text-sm sm:text-base font-black text-stone-900 dark:text-white">
              {deliverableItem.description || deliverable?.title_ar || (isAr ? 'تسجيل إنجاز يومي للمكتب الفني' : 'TO Daily Progress Log')}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق نافذة التسجيل' : 'Close progress dialog'}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 pt-2 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/40">
          <button
            type="button"
            onClick={() => setActiveTab('log')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 rounded-t-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeTab === 'log'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            {isAr ? 'تسجيل التقدم اليومي' : 'Daily Progress Entry'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 rounded-t-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            {isAr ? 'سجل الإنجاز السابق' : 'Progress History'}
            {historyLogs.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                {historyLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'log' ? (
            <div className="space-y-4">
              {/* Progress Slider & Value */}
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    {isAr ? 'نسبة الإنجاز الإجمالية للمخطط' : 'Total Drawing Progress (%)'}
                  </label>
                  <div className="flex items-center gap-2">
                    {progressDelta !== 0 && (
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-full ${
                          progressDelta > 0
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                        }`}
                      >
                        {progressDelta > 0 ? (isAr ? `+${progressDelta}% اليوم` : `+${progressDelta}% today`) : `${progressDelta}%`}
                      </span>
                    )}
                    <span className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">
                      {progressPct}%
                    </span>
                  </div>
                </div>

                {/* Slider Input */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={progressPct}
                  onChange={(e) => setProgressPct(Number(e.target.value))}
                  className="w-full h-2 bg-stone-200 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                />

                {/* Quick Step Buttons & Presets */}
                <div className="space-y-2 pt-1">
                  {/* Fine Incremental Steps (+5%, +10%, +15%, +20%) */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-stone-400 ms-1">
                      {isAr ? 'إضافة سريعة:' : 'Quick Add:'}
                    </span>
                    {[+5, +10, +15, +20, +25].map((delta) => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => setProgressPct((prev) => Math.min(100, Math.max(0, prev + delta)))}
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        +{delta}%
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setProgressPct(0)}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-700 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      0%
                    </button>
                    <button
                      type="button"
                      onClick={() => setProgressPct(100)}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      100%
                    </button>
                  </div>

                  {/* Standard Milestone Presets */}
                  <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 pt-1 border-t border-stone-200/60 dark:border-stone-800">
                    {[10, 25, 50, 75, 90, 100].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setProgressPct(preset)}
                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                          progressPct === preset
                            ? 'bg-emerald-600 text-white font-bold shadow-xs'
                            : 'text-stone-600 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 font-semibold'
                        }`}
                      >
                        {preset}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Log Date & Work Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-500" />
                    {isAr ? 'تاريخ التقرير اليومي' : 'Log Date'}
                  </label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-500" />
                    {isAr ? 'ساعات العمل المبذولة اليوم' : 'Hours Spent Today'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={hoursSpent}
                    placeholder="0"
                    onChange={(e) => setHoursSpent(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Work Description / Notes */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-stone-500" />
                  {isAr ? 'وصف العمل المنجز والملاحظات' : 'Work Done Description & Notes'}
                </label>
                <textarea
                  rows={3}
                  value={workDescription}
                  onChange={(e) => setWorkDescription(e.target.value)}
                  placeholder={
                    isAr
                      ? 'تم إنهاء تفاصيل قطاعات الأعمدة ومراجعة تداخلات حديد التسليح مع شبكة الصرف...'
                      : 'Completed column section details and coordinated reinforcement bars with drainage...'
                  }
                  className="w-full p-3 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 resize-none leading-relaxed"
                />
              </div>

              {/* Obstruction Toggle & Section */}
              <div
                className={`p-3.5 rounded-xl border transition-all space-y-3 ${
                  hasObstruction
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900/60'
                    : 'bg-stone-50 dark:bg-stone-800/30 border-stone-200 dark:border-stone-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`w-4 h-4 ${
                        hasObstruction ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400'
                      }`}
                    />
                    <div>
                      <span className="text-xs font-black text-stone-900 dark:text-stone-100">
                        {isAr ? 'هل يوجد عائق يمنع استكمال المخطط؟' : 'Is there an active obstruction?'}
                      </span>
                      <p className="text-[10px] text-stone-500 dark:text-stone-400">
                        {isAr
                          ? 'تصنيف العائق وفق المنظومة الموحدة لتوثيق استحقاقات التمديد الزمني والمطالبات التعاقدية'
                          : 'Categorize obstruction under unified taxonomy for EOT FIDIC claims'}
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={hasObstruction}
                    onChange={(e) => setHasObstruction(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer accent-amber-600"
                  />
                </div>

                {hasObstruction && (
                  <div className="space-y-3 pt-2 border-t border-amber-200 dark:border-amber-900/50 animate-in fade-in">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                        {isAr ? 'نوع وتصنيف العائق' : 'Obstruction Category'}
                      </label>
                      <select
                        value={obstructionType}
                        onChange={(e) => setObstructionType(e.target.value as UnifiedObstructionType)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 font-medium cursor-pointer"
                      >
                        {UNIFIED_OBSTRUCTION_TAXONOMY.map((tax) => (
                          <option key={tax.type} value={tax.type}>
                            {isAr ? tax.labelAr : tax.labelEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-amber-900 dark:text-amber-300">
                        {isAr ? 'تفاصيل العائق والإجراء المطلوب' : 'Obstruction Details & Action Needed'}
                      </label>
                      <textarea
                        rows={2}
                        value={obstructionNotes}
                        onChange={(e) => setObstructionNotes(e.target.value)}
                        placeholder={
                          isAr
                            ? 'مطلوب اعتماد المعماري لتعديل مناسيب السقف المعلق قبل إتمام مسارات التكييف...'
                            : 'Architectural approval required for ceiling levels before finalizing duct routes...'
                        }
                        className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* History Tab */
            <div className="space-y-2">
              {isLoadingHistory ? (
                <div className="py-12 text-center text-xs text-stone-400 animate-pulse">
                  {isAr ? 'جاري تحميل سجل التقدم...' : 'Loading history...'}
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <History className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
                  <p className="text-xs font-bold text-stone-500">
                    {isAr ? 'لا يوجد سجل إنجاز سابق لهذا المخطط' : 'No previous logs for this item'}
                  </p>
                </div>
              ) : (
                historyLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {log.progress_pct}%
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-stone-400 font-mono">
                          {log.log_date}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                            log.to_manager_approved
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                        >
                          {log.to_manager_approved
                            ? isAr
                              ? 'معتمد من مدير المكتب'
                              : 'Approved'
                            : isAr
                            ? 'مسودة / قيد المراجعة'
                            : 'Pending Sign-off'}
                        </span>
                      </div>
                    </div>

                    {log.notes && (
                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        {log.notes}
                      </p>
                    )}

                    {log.obstruction_type && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-900/40 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>
                          {isAr ? 'عائق مسجل:' : 'Obstruction:'}{' '}
                          {getObstructionLabel(log.obstruction_type)}
                          {log.obstruction_notes ? ` - ${log.obstruction_notes}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 dark:bg-stone-900/90 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          {activeTab === 'log' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={isSubmitting}
                className="px-3.5 py-2 text-xs font-bold rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-3.5 h-3.5" />
                {isAr ? 'حفظ كمسودة' : 'Save Draft'}
              </button>

              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" />
                {isAr ? 'تقديم للاعتماد' : 'Submit to Manager'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
