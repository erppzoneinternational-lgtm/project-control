'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw, 
  XCircle, 
  Save, 
  FileCode
} from 'lucide-react';
import { DeliverableItem, ConsultantApprovalCode } from '@/types/planning';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { logger } from '@/lib/logger';

interface ConsultantReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: DeliverableItem | null;
  onSuccess: (updatedItem: DeliverableItem) => void;
  isAr?: boolean;
}

export const ConsultantReviewModal: React.FC<ConsultantReviewModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
  isAr = true,
}) => {
  const [selectedCode, setSelectedCode] = useState<ConsultantApprovalCode>('A');
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && item) {
      setSelectedCode(item.consultant_status !== 'pending' ? item.consultant_status : 'A');
      setComments('');
      setError(null);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const codes = [
    {
      code: 'A' as ConsultantApprovalCode,
      title: isAr ? 'كود A — معتمد بالكامل' : 'Code A — Approved',
      desc: isAr ? 'اعتماد رسمي كامل دون أي ملاحظات' : 'Full official approval without comments',
      color: 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/25 text-emerald-900 dark:text-emerald-200',
      icon: CheckCircle2,
      badge: 'bg-emerald-500 text-white',
    },
    {
      code: 'B' as ConsultantApprovalCode,
      title: isAr ? 'كود B — معتمد مع ملاحظات' : 'Code B — Approved with Comments',
      desc: isAr ? 'اعتماد مشروط مع الالتزام بتنفيذ الملاحظات في الموقع' : 'Conditional approval incorporating site comments',
      color: 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/25 text-blue-900 dark:text-blue-200',
      icon: AlertCircle,
      badge: 'bg-blue-500 text-white',
    },
    {
      code: 'C' as ConsultantApprovalCode,
      title: isAr ? 'كود C — إعادة تقديم بعد التعديل' : 'Code C — Revise & Resubmit',
      desc: isAr ? 'تعديل المخططات ورفع رقم التقديم وإعادة العرض على الاستشاري' : 'Revise drawings, increment submission number and resubmit',
      color: 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/25 text-amber-900 dark:text-amber-200',
      icon: RotateCcw,
      badge: 'bg-amber-500 text-white',
    },
    {
      code: 'D' as ConsultantApprovalCode,
      title: isAr ? 'كود D — مرفوض بالكامل' : 'Code D — Rejected',
      desc: isAr ? 'رفض كامل للمخطط أو العينة وإلزام بتقديم بديل مطابق' : 'Complete rejection of deliverable or sample, compliant alternative required',
      color: 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/25 text-rose-900 dark:text-rose-200',
      icon: XCircle,
      badge: 'bg-rose-500 text-white',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const now = new Date().toISOString();
      const currentRevHistory = item.rev_history || [];

      // Append entry to rev history
      const updatedRevHistory = [
        ...currentRevHistory,
        {
          rev: item.current_rev,
          date: now,
          by: isAr ? 'استشاري المشروع' : 'Project Consultant',
          notes: isAr
            ? `اعتماد كود ${selectedCode}: ${comments || 'دون ملاحظات إضافية'}`
            : `Approval Code ${selectedCode}: ${comments || 'No additional comments'}`,
        },
      ];

      const payload: Partial<DeliverableItem> = {
        ...item,
        consultant_status: selectedCode,
        rev_history: updatedRevHistory,
      };

      const result = await DeliverablesService.saveDeliverableItem(payload);
      if (result) {
        onSuccess(result);
        onClose();
      } else {
        setError(isAr ? 'فشل تسجيل مراجعة الاستشاري.' : 'Failed to record consultant review.');
      }
    } catch (err: unknown) {
      const errInfo = err as { message?: string; code?: string; details?: string } | null | undefined;
      logger.error('ConsultantReviewModal error', { detail: err });
      setError(errInfo?.message || (isAr ? 'حدث خطأ أثناء الحفظ.' : 'An error occurred during save.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {isAr ? 'تسجيل قرار اعتماد الاستشاري' : 'Consultant Review & Approval'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                {item.sheet_number ? `${item.sheet_number} — ` : ''}{item.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
            className="cursor-pointer p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Current Rev info */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="text-slate-600 dark:text-slate-400">
              {isAr ? 'رقم الإصدار الحالي:' : 'Current Revision:'}
            </span>
            <span className="font-mono font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
              {isAr 
                ? `مراجعة ${item.current_rev} (التقديم رقم ${item.submission_revision || 1})`
                : `Rev ${item.current_rev} (Submission #${item.submission_revision || 1})`}
            </span>
          </div>

          {/* Code Selection Cards */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'قرار الاستشاري:' : 'Consultant Decision Code:'}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {codes.map((c) => {
                const Icon = c.icon;
                const isSelected = selectedCode === c.code;
                return (
                  <button
                    type="button"
                    key={c.code}
                    onClick={() => setSelectedCode(c.code)}
                    className={`w-full text-start p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-[0.99] ${
                      isSelected
                        ? `${c.color} ring-2 ring-emerald-500/20 shadow-xs`
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-xl font-bold font-mono text-xs flex items-center justify-center shrink-0 shadow-xs ${c.badge}`}>
                        {c.code}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          {c.desc}
                        </div>
                      </div>
                    </div>
                    <Icon className={`w-4 h-4 shrink-0 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-30'}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Code C Notice */}
          {selectedCode === 'C' && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>{isAr ? 'إجراء آلي عند اختيار كود C:' : 'Automatic action for Code C:'}</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                {isAr
                  ? `سيتم تلقائياً رفع رقم التقديم من التقديم رقم ${item.submission_revision || 1} إلى التقديم رقم ${(item.submission_revision || 1) + 1}، وإعادة حالة المخرج إلى «قيد العمل» لإجراء التعديلات المطلوبة.`
                  : `Submission revision will automatically increment from #${item.submission_revision || 1} to #${(item.submission_revision || 1) + 1}, and status will reset to "In Progress" for revisions.`}
              </p>
            </div>
          )}

          {/* Comments */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'ملاحظات وتوجيهات الاستشاري (اختياري)' : 'Consultant Comments & Instructions (Optional)'}
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={isAr ? 'اكتب ملاحظات الاعتماد أو تفاصيل التعديل المطلوبة...' : 'Enter approval notes or required revision details...'}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
            />
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="cursor-pointer px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all shadow-md shadow-emerald-700/20 active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>{submitting ? (isAr ? 'جاري التسجيل...' : 'Saving...') : (isAr ? 'اعتماد القرار' : 'Confirm Decision')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
