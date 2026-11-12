'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { DeliverableItem } from '@/types/planning';
import { TOProgressService } from '@/lib/services/toProgress.service';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export interface TOProgressUpdateModalProps {
  isOpen: boolean;
  item: DeliverableItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const QUICK_PERCENTAGES = [0, 25, 50, 75, 100] as const;

export const TOProgressUpdateModal: React.FC<TOProgressUpdateModalProps> = ({
  isOpen,
  item,
  onClose,
  onSuccess,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [progressPct, setProgressPct] = useState<number>(item?.progress_pct ?? 0);
  const [hoursSpent, setHoursSpent] = useState<string>('');
  const [workDescription, setWorkDescription] = useState<string>('');
  const [submitForSignoff, setSubmitForSignoff] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync initial state when item opens
  React.useEffect(() => {
    if (item) {
      const p = item.progress_pct ?? 0;
      setProgressPct(p);
      setSubmitForSignoff(p >= 100);
      setHoursSpent('');
      setWorkDescription('');
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Log progress in toProgress service
      await TOProgressService.logProgress({
        deliverable_item_id: item.id,
        project_id: item.deliverable?.project_id || '',
        progress_pct: progressPct,
        hours_spent: hoursSpent ? Number(hoursSpent) : null,
        work_description: workDescription.trim() || undefined,
        log_date: new Date().toISOString().slice(0, 10),
      });

      // 2. If progress is 100% or user checked submitForSignoff, transition item to ready_to_return
      if (submitForSignoff || progressPct === 100) {
        await DeliverablesService.completeWorkOnItem(item.id);
      }

      toast.success(
        isAr ? 'تم تحديث نسبة الإنجاز وحفظ السجل بنجاح' : 'Progress logged successfully'
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(isAr ? 'حدث خطأ أثناء حفظ الإنجاز' : 'Failed to log progress');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePercentageChange = (val: number) => {
    const clamped = Math.min(100, Math.max(0, val));
    setProgressPct(clamped);
    if (clamped === 100) {
      setSubmitForSignoff(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="progress-modal-title"
      dir={isAr ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <h3 id="progress-modal-title" className="text-lg font-black text-slate-900 dark:text-white">
              {isAr ? 'تحديث نسبة إنجاز المخطط' : 'Update Deliverable Progress'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {item.sheet_number ? `${item.sheet_number} — ${item.description || ''}` : item.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            aria-label={isAr ? 'إغلاق النافذة' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Progress Slider & Interactive Number Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
              <label htmlFor="progress-range" className="cursor-pointer">
                {isAr ? 'نسبة الإنجاز الفعلي:' : 'Progress Percentage:'}
              </label>
              <div className="flex items-center gap-1.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 rounded-xl px-2.5 py-1">
                <input
                  id="progress-number"
                  type="number"
                  min="0"
                  max="100"
                  value={progressPct}
                  onChange={(e) => handlePercentageChange(Number(e.target.value))}
                  aria-label={isAr ? 'نسبة الإنجاز المئوية' : 'Progress percentage'}
                  className="w-12 text-center font-mono text-sm font-black text-teal-700 dark:text-teal-300 bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 rounded"
                />
                <span className="font-mono text-xs font-bold text-teal-700 dark:text-teal-300 select-none">
                  %
                </span>
              </div>
            </div>

            <input
              id="progress-range"
              type="range"
              min="0"
              max="100"
              step="1"
              value={progressPct}
              onChange={(e) => handlePercentageChange(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />

            {/* Quick Percentage Chips */}
            <div className="grid grid-cols-5 gap-1.5 pt-0.5">
              {QUICK_PERCENTAGES.map((val) => {
                const isSelected = progressPct === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handlePercentageChange(val)}
                    className={`py-1.5 px-2 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
                      isSelected
                        ? 'bg-teal-600 text-white shadow-sm shadow-teal-600/30 dark:bg-teal-500'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {val}%
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hours Spent */}
          <div className="space-y-1.5">
            <label htmlFor="hours-spent-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'ساعات العمل المستغرقة (اختياري):' : 'Hours Spent (Optional):'}
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="hours-spent-input"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={hoursSpent}
                onChange={(e) => setHoursSpent(e.target.value)}
                placeholder={isAr ? 'مثال: 4' : 'e.g., 4'}
                className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="work-desc-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'بيان ما تم تنفيذه في المخطط:' : 'Work Description:'}
            </label>
            <textarea
              id="work-desc-input"
              rows={3}
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              placeholder={
                isAr
                  ? 'اكتب تفاصيل التعديلات، تفريد حديد التسليح، مراجعة المناسيب...'
                  : 'Describe changes, detailing, coordinate checks...'
              }
              className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            />
          </div>

          {/* Submit for TO Manager Review Checkbox */}
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex items-start gap-3">
            <input
              id="signoff-check"
              type="checkbox"
              checked={submitForSignoff}
              onChange={(e) => setSubmitForSignoff(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500"
            />
            <label htmlFor="signoff-check" className="text-xs cursor-pointer select-none space-y-0.5">
              <span className="font-bold text-purple-900 dark:text-purple-200 block">
                {isAr ? 'إرسال المخطط للاعتماد الداخلي لمدير المكتب الفني' : 'Submit for TO Manager Sign-off'}
              </span>
              <span className="text-[11px] text-purple-700 dark:text-purple-300 block">
                {isAr
                  ? 'نقل المخطط إلى قائمة مراجعة المدير قبل تصديره رسمياً للاستشاري.'
                  : 'Moves item to manager review queue before sending to consultant.'}
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-sm shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'حفظ وتأكيد الإنجاز' : 'Save Progress'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

