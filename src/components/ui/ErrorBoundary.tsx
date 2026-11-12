'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check, ChevronDown, ChevronUp, Terminal } from 'lucide-react';
import { logger } from '@/lib/logger';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitleAr?: string;
  fallbackTitleEn?: string;
  fallbackMessageAr?: string;
  fallbackMessageEn?: string;
  onReset?: () => void;
  showHomeButton?: boolean;
  homeUrl?: string;
  compact?: boolean;
  className?: string;
  fallbackComponent?: React.ComponentType<{ error: Error | null; reset: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showTechnicalDetails: boolean;
  copied: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  public state: State = {
    hasError: false,
    error: null,
    showTechnicalDetails: false,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      showTechnicalDetails: false,
      copied: false,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error', { detail: error, errorInfo });
  }

  private handleRetry = () => {
    this.props.onReset?.();
    this.setState({
      hasError: false,
      error: null,
      showTechnicalDetails: false,
      copied: false,
    });
  };

  private handleCopy = async () => {
    if (!this.state.error) return;
    const report = [
      `[PZONE ERP ERROR REPORT]`,
      `Timestamp: ${new Date().toISOString()}`,
      `Error: ${this.state.error.name}: ${this.state.error.message}`,
      this.state.error.stack ? `Stack:\n${this.state.error.stack}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(report);
        this.setState({ copied: true });
        setTimeout(() => this.setState({ copied: false }), 2500);
      }
    } catch {
      // Fallback ignore clipboard failure
    }
  };

  private toggleDetails = () => {
    this.setState((prev) => ({ showTechnicalDetails: !prev.showTechnicalDetails }));
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        const FallbackComp = this.props.fallbackComponent;
        return <FallbackComp error={this.state.error} reset={this.handleRetry} />;
      }

      const titleAr = this.props.fallbackTitleAr || 'تعذر تحميل هذا القسم حالياً';
      const titleEn = this.props.fallbackTitleEn || 'Unable to load component';
      const messageAr =
        this.props.fallbackMessageAr ||
        'نعتذر عن هذا التعثر غير المتوقع. بياناتك ومؤشراتك الفنية بأمان، يمكنك إعادة المحاولة للمتابعة.';
      const messageEn =
        this.props.fallbackMessageEn ||
        'An unexpected error occurred. Your data is safe. Please try again.';

      if (this.props.compact) {
        return (
          <div
            role="alert"
            aria-live="assertive"
            dir="rtl"
            className={`p-4 rounded-2xl glass-card border-rose-500/25 bg-rose-500/5 dark:bg-rose-950/20 text-start flex items-center justify-between gap-3 my-2 ${this.props.className || ''}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {titleAr}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {this.state.error?.message || titleEn}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={this.handleRetry}
              className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        );
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          dir="rtl"
          className={`relative overflow-hidden p-6 sm:p-8 rounded-3xl glass-card border border-rose-500/30 bg-gradient-to-b from-rose-500/[0.07] via-white/80 to-slate-50 dark:via-slate-900/90 dark:to-slate-950 shadow-xl max-w-2xl mx-auto my-6 text-center space-y-5 transition-all ${this.props.className || ''}`}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 end-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 start-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Alert Icon Badge */}
          <div className="relative mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-md">
            <AlertTriangle className="w-8 h-8" aria-hidden="true" />
            <span className="absolute -top-1 -end-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
            </span>
          </div>

          {/* Headings */}
          <div className="space-y-1.5 max-w-lg mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs font-bold mb-1">
              <span>نظام التعافي الذاتي من الأخطاء</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {titleAr}
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {messageAr}
            </p>
            <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 pt-0.5" dir="ltr">
              {titleEn} &mdash; {messageEn}
            </p>
          </div>

          {/* Action Recovery Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={this.handleRetry}
              className="min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>إعادة المحاولة / Retry</span>
            </button>

            {this.props.showHomeButton && (
              <a
                href={this.props.homeUrl || '/dashboard'}
                className="min-h-[44px] min-w-[44px] px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors border border-slate-200 dark:border-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                <span>العودة للوحة القيادة</span>
              </a>
            )}

            <button
              type="button"
              onClick={this.handleCopy}
              className="min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-colors border border-slate-200/80 dark:border-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              title="نسخ تقرير الخطأ الفني لمشاركته مع الدعم"
            >
              {this.state.copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">تم نسخ التقرير</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>نسخ تقرير الدعم</span>
                </>
              )}
            </button>
          </div>

          {/* Technical Details Accordion */}
          {this.state.error && (
            <div className="pt-3 max-w-lg mx-auto text-start">
              <button
                type="button"
                onClick={this.toggleDetails}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer select-none"
                aria-expanded={this.state.showTechnicalDetails}
              >
                <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
                <span>
                  {this.state.showTechnicalDetails
                    ? 'إخفاء التفاصيل الفنية / Hide Details'
                    : 'عرض التفاصيل الفنية للمطورين / Technical Details'}
                </span>
                {this.state.showTechnicalDetails ? (
                  <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                )}
              </button>

              {this.state.showTechnicalDetails && (
                <div
                  dir="ltr"
                  className="mt-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-rose-400 space-y-1.5 select-all overflow-x-auto shadow-inner"
                >
                  <div className="text-slate-400 font-bold">
                    {this.state.error.name}: {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <pre className="text-[10px] text-slate-500 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto pt-1 border-t border-slate-900">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}


