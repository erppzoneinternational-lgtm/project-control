'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  AlertCircle, 
  Loader2, 
  FileText, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2,
  Sparkles,
  Check
} from 'lucide-react';

export interface ReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  title: string;
  subtitle?: string;
  placeholder?: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary' | 'warning';
  isLoading?: boolean;
  /** Optional custom preset reason strings to display as interactive chips */
  presetReasons?: string[];
  /** Whether to show preset reason chips (defaults to true) */
  showPresetReasons?: boolean;
  /** Minimum characters required for submission (defaults to 3) */
  minCharacters?: number;
  /** Text direction override (defaults to 'rtl') */
  dir?: 'rtl' | 'ltr' | 'auto';
  className?: string;
}

const DEFAULT_PRESET_REASONS: Record<'danger' | 'primary' | 'warning', string[]> = {
  danger: [
    'عدم مطابقة المواصفات الفنية أو شيت الملاحظات المعتمد',
    'نقص في المخططات التنفيذية والوثائق الداعمة المطلوبة',
    'وجود تعارض (Clash) بين الأعمال المعمارية والإنشائية',
    'فشل في اختبارات الجودة أو عينات الفحص الميداني',
  ],
  warning: [
    'مطلوب استكمال التوقيعات أو المرفقات الرسمية الناقصة',
    'يرجى معالجة الملاحظات الفنية المرفقة وإعادة التقديم',
    'في انتظار رد الاستشاري على الاستفسار الفني (RFI)',
    'تحديث التواريخ أو البرنامج الزمني وفق المعطيات الجديدة',
  ],
  primary: [
    'معتمد مع الالتزام التام بكافة الملاحظات الميدانية المسجلة',
    'اعتماد مشروط بتوريد عينات مطابقة للمواصفة القياسية',
    'معتمد وفق المخطط التنفيذي والملاحظات الإنشائية',
  ],
};

const variantConfig = {
  danger: {
    headerIcon: ShieldAlert,
    iconBg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900',
    confirmBtn: 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 text-white shadow-rose-600/25',
    accentBorder: 'border-t-rose-500',
    badgeText: 'إجراء رقابي / رفض',
    badgeClass: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
    textareaFocus: 'focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:focus:border-rose-400 dark:focus:ring-rose-500/30',
    chipActive: 'bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-600/20 font-medium',
    chipInactive: 'bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200 hover:border-rose-200 dark:bg-slate-800/80 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-300 dark:border-slate-700 dark:hover:border-rose-800',
  },
  primary: {
    headerIcon: CheckCircle2,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900',
    confirmBtn: 'bg-emerald-700 hover:bg-emerald-800 focus:ring-emerald-500 text-white shadow-emerald-700/25',
    accentBorder: 'border-t-emerald-500',
    badgeText: 'اعتماد ومتابعة',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    textareaFocus: 'focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 dark:focus:border-emerald-400 dark:focus:ring-emerald-500/30',
    chipActive: 'bg-emerald-700 text-white border-emerald-700 shadow-sm shadow-emerald-700/20 font-medium',
    chipInactive: 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-200 hover:border-emerald-200 dark:bg-slate-800/80 dark:hover:bg-emerald-950/40 dark:text-slate-300 dark:hover:text-emerald-300 dark:border-slate-700 dark:hover:border-emerald-800',
  },
  warning: {
    headerIcon: AlertTriangle,
    iconBg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 text-white shadow-amber-600/25',
    accentBorder: 'border-t-amber-500',
    badgeText: 'إعادة وتعديل',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    textareaFocus: 'focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:focus:border-amber-400 dark:focus:ring-amber-500/30',
    chipActive: 'bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-600/20 font-medium',
    chipInactive: 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border-slate-200 hover:border-amber-200 dark:bg-slate-800/80 dark:hover:bg-amber-950/40 dark:text-slate-300 dark:hover:text-amber-300 dark:border-slate-700 dark:hover:border-amber-800',
  },
};

export const ReasonModal: React.FC<ReasonModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  placeholder = 'يرجى توضيح سبب ومبررات اتخاذ هذا القرار بالتفصيل...',
  confirmLabel = 'تأكيد الإجراء',
  confirmVariant = 'primary',
  isLoading = false,
  presetReasons,
  showPresetReasons = true,
  minCharacters = 3,
  dir = 'rtl',
  className = '',
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  const effectiveLoading = isLoading || isSubmitting;
  const currentVariant = variantConfig[confirmVariant] || variantConfig.primary;
  const { 
    headerIcon: HeaderIcon, 
    iconBg, 
    confirmBtn, 
    accentBorder, 
    badgeText, 
    badgeClass, 
    textareaFocus, 
    chipActive, 
    chipInactive 
  } = currentVariant;

  const activePresets = presetReasons ?? DEFAULT_PRESET_REASONS[confirmVariant] ?? [];

  // Reset state and store trigger element on open; restore focus on close
  useEffect(() => {
    if (isOpen) {
      triggerElementRef.current = (document.activeElement as HTMLElement) || null;
      setReason('');
      setError(null);
      setIsSubmitting(false);

      // Autofocus textarea after modal animation completes
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 60);

      return () => clearTimeout(timer);
    } else {
      // Return focus to caller trigger element
      if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
        triggerElementRef.current.focus();
      }
    }
  }, [isOpen]);

  // Focus trap and isolated Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleTrapKeyDown = (e: KeyboardEvent) => {
      // Escape key handler: stop propagation to prevent closing parent drawers
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (!effectiveLoading) {
          onClose();
        }
        return;
      }

      // Focus trap for Tab / Shift+Tab cycling inside the modal
      if (e.key === 'Tab') {
        const container = modalRef.current;
        if (!container) return;

        const focusableSelectors = [
          'button:not([disabled])',
          '[href]:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ].join(', ');

        const focusableElements = Array.from(
          container.querySelectorAll<HTMLElement>(focusableSelectors)
        ).filter((el) => el.offsetParent !== null);

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleTrapKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleTrapKeyDown, true);
    };
  }, [isOpen, effectiveLoading, onClose]);

  if (!isOpen) return null;

  const validateReason = (val: string): string | null => {
    const trimmed = val.trim();
    if (!trimmed) {
      return 'يرجى كتابة سبب الإجراء للمتابعة (حقل إلزامي)';
    }
    if (trimmed.length < minCharacters) {
      return `يرجى تقديم سبب واضح وتفصيلي (الحد الأدنى ${minCharacters} أحرف)`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateReason(reason);
    if (validationError) {
      setError(validationError);
      textareaRef.current?.focus();
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء معالجة الطلب';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePresetClick = (preset: string) => {
    if (effectiveLoading) return;
    if (error) setError(null);

    setReason((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return preset;
      }
      if (trimmed === preset) {
        return '';
      }
      if (trimmed.includes(preset)) {
        return trimmed
          .split('\n')
          .filter((line) => !line.includes(preset))
          .join('\n')
          .trim();
      }
      return `${trimmed}\n• ${preset}`;
    });

    textareaRef.current?.focus();
  };

  const isChipActive = (preset: string) => {
    return reason.includes(preset);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!effectiveLoading && reason.trim().length >= minCharacters) {
        handleSubmit(e);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !effectiveLoading) {
          onClose();
        }
      }}
      dir={dir}
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className={`glass-card bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${accentBorder} border-t-4 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 focus:outline-none ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reason-modal-title"
        aria-describedby={subtitle ? 'reason-modal-desc' : undefined}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
          <div className="flex items-start gap-3.5">
            <div className={`p-2.5 rounded-2xl shrink-0 ${iconBg}`}>
              <HeaderIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="reason-modal-title" className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {title}
                </h3>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${badgeClass}`}>
                  {badgeText}
                </span>
              </div>
              {subtitle ? (
                <p id="reason-modal-desc" className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {subtitle}
                </p>
              ) : (
                <p id="reason-modal-desc" className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  يتطلب هذا الإجراء تسجيل سبب وملاحظات الاعتماد لحفظ السجل الرقابي.
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={effectiveLoading}
            className="p-2 rounded-xl text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 transition disabled:opacity-50"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Validation Error Banner */}
          {error && (
            <div 
              id="reason-modal-error"
              role="alert" 
              aria-live="assertive"
              className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Preset Reason Chips */}
          {showPresetReasons && activePresets.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>أسباب شائعة جاهزة (انقر للإضافة السريعة):</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="أسباب مسبقة">
                {activePresets.map((preset, idx) => {
                  const active = isChipActive(preset);
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={effectiveLoading}
                      onClick={() => handlePresetClick(preset)}
                      className={`text-xs px-2.5 py-1 rounded-xl border transition-all text-start flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                        active ? chipActive : chipInactive
                      }`}
                      aria-pressed={active}
                    >
                      {active && <Check className="w-3 h-3 shrink-0" />}
                      <span>{preset}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Textarea Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label 
                htmlFor="workflow-reason-input"
                className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>سبب الإجراء والمبررات <span className="text-rose-500 dark:text-rose-400">*</span></span>
              </label>

              {reason.length > 0 && !effectiveLoading && (
                <button
                  type="button"
                  onClick={() => {
                    setReason('');
                    setError(null);
                    textareaRef.current?.focus();
                  }}
                  className="text-[11px] text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer"
                >
                  مسح النص
                </button>
              )}
            </div>

            <div className="relative">
              <textarea
                id="workflow-reason-input"
                ref={textareaRef}
                rows={4}
                value={reason}
                disabled={effectiveLoading}
                aria-required="true"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'reason-modal-error' : subtitle ? 'reason-modal-desc' : undefined}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={handleTextareaKeyDown}
                placeholder={placeholder}
                className={`w-full p-3.5 pb-8 rounded-2xl bg-slate-50 dark:bg-slate-950 border text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition resize-none disabled:opacity-60 text-start rtl:text-right ltr:text-left focus:outline-none ${
                  error
                    ? 'border-rose-500 dark:border-rose-500 focus:border-rose-600 dark:focus:border-rose-400 focus:ring-2 focus:ring-rose-500/25 dark:focus:ring-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20'
                    : `border-slate-300 dark:border-slate-800 ${textareaFocus} focus:bg-white dark:bg-slate-900 dark:focus:bg-slate-900`
                }`}
              />
              <div className="absolute bottom-2.5 start-3 end-3 flex items-center justify-between pointer-events-none text-[10px] text-slate-400 dark:text-slate-500 font-mono select-none">
                <span className="flex items-center gap-1 opacity-70">
                  <kbd className="px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[9px] font-sans text-slate-600 dark:text-slate-300">Ctrl+Enter</kbd> للتأكيد السريع
                </span>
                <span>{reason.trim().length} حرف</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={effectiveLoading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 transition disabled:opacity-50 cursor-pointer"
            >
              إلغاء
            </button>

            <button
              type="submit"
              disabled={effectiveLoading || reason.trim().length < minCharacters}
              className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 cursor-pointer ${confirmBtn}`}
            >
              {effectiveLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري المعالجة...</span>
                </>
              ) : (
                <span>{confirmLabel}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReasonModal;
