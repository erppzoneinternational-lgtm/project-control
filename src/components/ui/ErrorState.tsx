'use client';

import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string | null;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}

export function ErrorState({
  title,
  message,
  error,
  onRetry,
  compact = false,
  className = '',
}: ErrorStateProps) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const errorString =
    error instanceof Error ? error.message : typeof error === 'string' ? error : null;

  const defaultTitle = isAr
    ? 'تعذر تحميل البيانات المطلوبة'
    : 'Unable to Load Requested Data';

  const defaultMessage = isAr
    ? 'حدث خطأ غير متوقع أثناء استرجاع البيانات من قاعدة البيانات. يرجى التحقق من اتصال الشبكة أو المحاولة مرة أخرى.'
    : 'An unexpected error occurred while communicating with the database. Please check your network or try again.';

  if (compact) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className={`p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-3 text-start ${className}`}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
              {title || defaultTitle}
            </p>
            {errorString && (
              <p className="text-[11px] text-rose-700 dark:text-rose-300 font-mono mt-0.5 truncate max-w-md">
                {errorString}
              </p>
            )}
          </div>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isAr ? 'إعادة المحاولة' : 'Retry'}</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-lg text-center space-y-4 max-w-2xl mx-auto my-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
        <AlertTriangle className="w-7 h-7" aria-hidden="true" />
      </div>

      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
          {title || defaultTitle}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-lg mx-auto">
          {message || defaultMessage}
        </p>
      </div>

      {errorString && (
        <div className="pt-2 text-start max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <span>{isAr ? 'تفاصيل الخطأ الفني' : 'Technical error details'}</span>
            {showTechnicalDetails ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          {showTechnicalDetails && (
            <div className="mt-1.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-rose-600 dark:text-rose-400 break-all select-all">
              {errorString}
            </div>
          )}
        </div>
      )}

      {onRetry && (
        <div className="pt-3">
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-all shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>{isAr ? 'إعادة المحاولة' : 'Try Again'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
