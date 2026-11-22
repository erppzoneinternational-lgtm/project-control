'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  RotateCw,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  LogIn,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { portalLoginUrl } from '@/lib/supabase/config';

export default function RootErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [copied, setCopied] = useState(false);
  const isProduction = process.env.NODE_ENV === 'production';

  useEffect(() => {
    logger.error('Root application error caught by RootErrorBoundary', {
      errorMessage: error.message,
      digest: error.digest,
      ...(isProduction ? {} : { stack: error.stack }),
    });
  }, [error, isProduction]);

  const handleCopyReport = async () => {
    const reportText = [
      `[P.ZONE ERP ROOT ERROR REPORT]`,
      `Timestamp: ${new Date().toISOString()}`,
      `Error: ${error.name || 'Error'}: ${error.message || 'Unknown error'}`,
      error.digest ? `Digest: ${error.digest}` : '',
      typeof window !== 'undefined' ? `URL: ${window.location.href}` : '',
      !isProduction && error.stack ? `Stack:\n${error.stack}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(reportText);
        setCopied(true);
        toast.success('تم نسخ تقرير الخطأ الفني بنجاح');
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      toast.error('تعذر نسخ التقرير تلقائياً');
    }
  };

  const handleFullReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      dir="rtl"
      className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 sm:p-6 lg:p-8"
    >
      <div className="relative w-full max-w-2xl rounded-3xl border border-rose-500/30 bg-slate-900/90 shadow-2xl p-6 sm:p-10 text-center space-y-6">
        {/* Pulsing Visual Icon */}
        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg">
          <AlertTriangle className="w-8 h-8" aria-hidden="true" />
          <span className="absolute -top-1 -end-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
          </span>
        </div>

        {/* Headings */}
        <div className="space-y-2 max-w-lg mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold">
            <span>منظومة بي زون | تعافي الأخطاء</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            حدث تعثر غير متوقع في المنظومة
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            نعتذر عن هذا التعثر المؤقت. تم رصد الخطأ تلقائياً في سجلات النظام. يمكنك إعادة المحاولة أو العودة إلى لوحة التحكم أو تسجيل الدخول.
          </p>
          {error.digest && (
            <p className="text-[11px] font-mono text-slate-500" dir="ltr">
              Digest: {error.digest}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="min-h-[44px] min-w-[44px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span>إعادة المحاولة / Retry</span>
          </button>

          <Link
            href="/dashboard"
            className="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors border border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>لوحة التحكم</span>
          </Link>

          <a
            href={portalLoginUrl(
              typeof window !== 'undefined' ? window.location.href : 'https://projects.pzoneinternational.com'
            )}
            className="min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors border border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <LogIn className="w-4 h-4" aria-hidden="true" />
            <span>تسجيل الدخول</span>
          </a>

          <button
            type="button"
            onClick={handleFullReload}
            className="min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors border border-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            <RotateCw className="w-4 h-4" aria-hidden="true" />
            <span>تحديث الصفحة</span>
          </button>

          <button
            type="button"
            onClick={handleCopyReport}
            className="min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-300 font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors border border-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span className="text-emerald-400 font-bold">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                <span>نسخ تقرير الدعم</span>
              </>
            )}
          </button>
        </div>

        {/* Collapsible Tech Details */}
        <div className="pt-3 border-t border-slate-800 text-start max-w-xl mx-auto">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer select-none"
            aria-expanded={showTechnicalDetails}
          >
            <Terminal className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
            <span>
              {showTechnicalDetails
                ? 'إخفاء التفاصيل الفنية / Hide Details'
                : 'عرض التفاصيل الفنية للمطورين / Technical Details'}
            </span>
            {showTechnicalDetails ? (
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            )}
          </button>

          {showTechnicalDetails && (
            <div
              dir="ltr"
              className="mt-3 p-3.5 rounded-2xl bg-black/60 border border-slate-800 text-xs font-mono text-rose-400 space-y-1.5 select-all overflow-x-auto"
            >
              <div className="text-slate-300 font-bold">
                {error.name}: {isProduction ? 'Unexpected application error' : error.message}
              </div>
              {!isProduction && error.stack && (
                <pre className="text-[10px] text-slate-500 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pt-1 border-t border-slate-900">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
