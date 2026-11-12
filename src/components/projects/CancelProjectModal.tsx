'use client';

import React, { useState, useEffect, useRef } from 'react';
import { XCircle, AlertTriangle, X, Check, Loader2, Info } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface CancelProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  projectName?: string;
  currentReason?: string;
  loading?: boolean;
}

const PRESET_REASONS_AR = [
  'بناءً على طلب العميل / المالك',
  'إلغاء المشروع قبل البدء في التنفيذ',
  'عدم الاتفاق على الشروط التعاقدية أو المالية',
  'معوقات قانونية أو تراخيص موقعية',
  'قرار من إدارة الشركة بإنهاء التعاقد',
  'تعثر العميل في سداد الدفعة المقدمة',
];

const PRESET_REASONS_EN = [
  'Requested by Client / Owner',
  'Cancelled prior to construction commencement',
  'Disagreement on contractual or financial terms',
  'Legal constraints or site licensing issues',
  'Corporate management decision to terminate',
  'Client default on advance payment',
];

export const CancelProjectModal: React.FC<CancelProjectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  projectName = '',
  currentReason = '',
  loading = false,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const presets = isAr ? PRESET_REASONS_AR : PRESET_REASONS_EN;

  const [reason, setReason] = useState(currentReason);
  const [errorMsg, setErrorMsg] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setReason(currentReason || presets[0]);
      setErrorMsg('');
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen, currentReason]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || loading) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length < 3) {
      setErrorMsg(isAr ? 'يرجى إدخال سبب إلغاء المشروع (3 أحرف على الأقل)' : 'Please enter a valid cancellation reason (at least 3 characters)');
      textareaRef.current?.focus();
      return;
    }
    setErrorMsg('');
    await onConfirm(trimmed);
  };

  const handlePresetSelect = (presetText: string) => {
    setReason(presetText);
    setErrorMsg('');
    textareaRef.current?.focus();
  };

  return (
    <div
      id="cancel_project_modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel_modal_title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn"
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-200/80 dark:border-rose-800/60 overflow-hidden transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 dark:border-rose-900/40 bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-sm">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 id="cancel_modal_title" className="text-base font-black text-slate-900 dark:text-slate-100">
                {isAr ? 'تأكيد إلغاء المشروع' : 'Confirm Project Cancellation'}
              </h2>
              {projectName && (
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 line-clamp-1">
                  {projectName}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-800/50 text-rose-800 dark:text-rose-300 text-xs">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {isAr
                ? 'تحويل حالة المشروع إلى (ملغي) يوثق إنهاء الأعمال رسمياً. يرجى توضيح سبب الإلغاء لحفظه بالسجل الإداري.'
                : 'Setting project status to (Cancelled) formally logs work termination. Please document the reason for audit records.'}
            </p>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {isAr ? 'أسباب شائعة (انقر للاختيار السريع):' : 'Common Reasons (Click to select):'}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {presets.map((preset) => {
                const isSelected = reason === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handlePresetSelect(preset)}
                    className={`text-xs px-3 py-2 rounded-xl font-bold transition-all cursor-pointer border min-h-[44px] inline-flex items-center justify-center ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text Area */}
          <div>
            <label htmlFor="cancel_reason_input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'سبب الإلغاء التفصيلي:' : 'Detailed Cancellation Reason:'}
              <span className="text-rose-600 dark:text-rose-400 ms-1">*</span>
            </label>
            <textarea
              id="cancel_reason_input"
              ref={textareaRef}
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              placeholder={isAr ? 'اكتب سبب الإلغاء أو عدّل الاختيار أعلاه...' : 'Write cancellation reason or edit selection above...'}
              className={`w-full px-3.5 py-2.5 rounded-2xl text-xs bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 ${
                errorMsg
                  ? 'border-rose-500 ring-2 ring-rose-500/20'
                  : 'border-slate-200 dark:border-slate-800 focus:border-rose-500 focus:ring-rose-500/20'
              }`}
            />
            {errorMsg && (
              <p role="alert" className="text-[11px] font-bold text-rose-500 dark:text-rose-400 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer min-h-[44px]"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/25 disabled:opacity-50 transition-all cursor-pointer min-h-[44px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{isAr ? 'تأكيد إلغاء المشروع' : 'Confirm Cancellation'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
