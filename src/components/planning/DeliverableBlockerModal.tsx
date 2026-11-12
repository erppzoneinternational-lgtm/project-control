'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  FileQuestion, 
  Save, 
} from 'lucide-react';
import { Deliverable, RfiRegisterItem } from '@/types/planning';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';

interface DeliverableBlockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliverable: Deliverable | null;
  onSuccess: (updatedDeliverable: Deliverable) => void;
}

export const DeliverableBlockerModal: React.FC<DeliverableBlockerModalProps> = ({
  isOpen,
  onClose,
  deliverable,
  onSuccess,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const [reason, setReason] = useState('');
  const [createRfi, setCreateRfi] = useState(false);
  const [rfiNo, setRfiNo] = useState('');
  const [rfiSubject, setRfiSubject] = useState('');
  const [targetReplyDate, setTargetReplyDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && deliverable) {
      setReason(deliverable.blocked_reason || '');
      setCreateRfi(false);
      setRfiNo(`RFI-${deliverable.ref_code}-${Date.now().toString().slice(-4)}`);
      setRfiSubject(isAr
        ? `استفسار فني بخصوص تعطل تسليمة ${deliverable.ref_code}: ${deliverable.title_ar}`
        : `Technical query regarding blocked deliverable ${deliverable.ref_code}: ${deliverable.title_ar}`);
      
      // Default FIDIC target reply date = +7 days
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);
      setTargetReplyDate(targetDate.toISOString().slice(0, 10));
      setError(null);
    }
  }, [isOpen, deliverable, isAr]);

  if (!isOpen || !deliverable) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError(isAr
        ? 'يرجى تحديد سبب التعطل بشكل إجباري لتسجيل المانع.'
        : 'Please specify the blocking reason — it is required to record the blocker.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      if (createRfi) {
        const rfiPayload: Partial<RfiRegisterItem> = {
          project_id: deliverable.project_id,
          rfi_no: rfiNo.trim() || `RFI-${Date.now()}`,
          subject: rfiSubject.trim() || `Blocker for ${deliverable.ref_code}`,
          sent_date: new Date().toISOString().slice(0, 10),
          target_reply_date: targetReplyDate || undefined,
          status: 'sent',
        };

        const res = await DeliverablesService.linkBlockerWithRfi(
          deliverable.id,
          rfiPayload,
          reason.trim()
        );

        if (res.deliverable) {
          onSuccess(res.deliverable);
          onClose();
        } else {
          setError(isAr
            ? 'حدث خطأ أثناء ربط الاستفسار الفني.'
            : 'Error linking the technical query (RFI).');
        }
      } else {
        const updated = await DeliverablesService.updateDeliverableStatus(
          deliverable.id,
          deliverable.project_id,
          'blocked',
          reason.trim()
        );

        if (updated) {
          onSuccess(updated);
          onClose();
        } else {
          setError(isAr
            ? 'فشل تحديث حالة التسليمة إلى معطلة.'
            : 'Failed to update deliverable status to blocked.');
        }
      }
    } catch (err: unknown) {
      logger.error('Failed to block deliverable', { detail: err });
      setError((err as { message?: string } | null)?.message || (isAr
        ? 'حدث خطأ غير متوقع أثناء الحفظ.'
        : 'An unexpected error occurred while saving.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 dark:border-rose-950/40 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isAr ? `تسجيل عائق أو تعليق تسليمة (${deliverable.ref_code})` : `Record Blocker / Deliverable Hold (${deliverable.ref_code})`}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                {isAr ? deliverable.title_ar : (deliverable.title_en || deliverable.title_ar)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
            className="p-2 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div 
              role="alert"
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2.5 shadow-xs animate-in fade-in duration-200"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {/* Mandatory Reason */}
          <div>
            <label htmlFor="deliverableBlockerReason" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 cursor-pointer">
              {isAr ? (
                <>سبب التعطيل أو المانع <span className="text-rose-500">* (إجباري)</span></>
              ) : (
                <>Blocking reason / hold cause <span className="text-rose-500">* (required)</span></>
              )}
            </label>
            <textarea
              id="deliverableBlockerReason"
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isAr
                ? 'مثال: في انتظار رد الاستشاري على تعديل أقطار خط التغذية بالموقع، أو تعارض الرسومات المعمارية مع الإنشائية...'
                : 'e.g. Awaiting consultant response on site feeder line diameter revision, or architectural/structural drawing clash...'}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:focus-visible:ring-rose-400 transition-all duration-150"
            />
          </div>

          {/* Option to generate linked RFI */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <label 
              htmlFor="createRfiToggle"
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isAr ? 'توليد وربط استفسار فني رسمي' : 'Generate & link an official technical query (RFI)'}
                </span>
              </div>
              <input
                type="checkbox"
                id="createRfiToggle"
                checked={createRfi}
                onChange={(e) => setCreateRfi(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 transition"
              />
            </label>

            {createRfi && (
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700/80 space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="rfiNumberInput" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 cursor-pointer">
                      {isAr ? 'رقم الاستفسار الفني' : 'RFI Number'}
                    </label>
                    <input
                      id="rfiNumberInput"
                      type="text"
                      value={rfiNo}
                      onChange={(e) => setRfiNo(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all duration-150"
                    />
                  </div>

                  <div>
                    <label htmlFor="targetReplyDateInput" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 cursor-pointer">
                      {isAr ? 'تاريخ الرد المستهدف (خلال 7 أيام تعاقدياً)' : 'Target reply date (FIDIC ~7 days)'}
                    </label>
                    <input
                      id="targetReplyDateInput"
                      type="date"
                      value={targetReplyDate}
                      onChange={(e) => setTargetReplyDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 dark:[color-scheme:dark] focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all duration-150 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="rfiSubjectInput" className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 cursor-pointer">
                    {isAr ? 'موضوع الاستفسار الفني' : 'Query Subject'}
                  </label>
                  <input
                    id="rfiSubjectInput"
                    type="text"
                    value={rfiSubject}
                    onChange={(e) => setRfiSubject(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all duration-150"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting || !reason.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-rose-600/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'تأكيد التعطيل' : 'Confirm Block')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
