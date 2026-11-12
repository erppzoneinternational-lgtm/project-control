'use client';

import React, { useMemo, useId } from 'react';
import { Clock, AlertTriangle, CheckCircle2, ShieldAlert, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface SLAProgressBarProps {
  createdAt?: string | Date | null;
  dueAt?: string | Date | null;
  targetHours?: number;
  label?: string;
  compact?: boolean;
  className?: string;
  showDetails?: boolean;
  tooltipPlacement?: 'auto' | 'top' | 'top-start' | 'top-end';
  dir?: 'rtl' | 'ltr';
  locale?: 'ar' | 'en';
}

function parseDateMs(dateInput?: string | Date | null): number | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    const time = dateInput.getTime();
    return isNaN(time) ? null : time;
  }
  if (typeof dateInput === 'string') {
    const time = new Date(dateInput).getTime();
    return isNaN(time) ? null : time;
  }
  return null;
}

function formatDuration(ms: number, isOverdue: boolean, isAr: boolean): string {
  const absMs = Math.abs(ms);

  const totalMinutes = Math.floor(absMs / (1000 * 60));
  const totalHours = Math.floor(absMs / (1000 * 60 * 60));
  const totalDays = Math.floor(absMs / (1000 * 60 * 60 * 24));

  if (isAr) {
    const prefix = isOverdue ? 'متأخر' : 'متبقي';
    if (totalDays >= 2) return `${prefix} ${totalDays} يوم`;
    if (totalDays === 1) return `${prefix} يوم واحد`;
    if (totalHours >= 2) return `${prefix} ${totalHours} ساعة`;
    if (totalHours === 1) return `${prefix} ساعة واحدة`;
    if (totalMinutes >= 1) return `${prefix} ${totalMinutes} دقيقة`;
    return isOverdue ? 'متأخر الآن' : 'متبقي أقل من دقيقة';
  }

  const prefix = isOverdue ? 'Overdue by' : 'Remaining';
  if (totalDays >= 2) return `${prefix} ${totalDays}d`;
  if (totalDays === 1) return `${prefix} 1d`;
  if (totalHours >= 2) return `${prefix} ${totalHours}h`;
  if (totalHours === 1) return `${prefix} 1h`;
  if (totalMinutes >= 1) return `${prefix} ${totalMinutes}m`;
  return isOverdue ? 'Overdue now' : '< 1m left';
}

function formatDateShort(dateMs: number | null, locale: string = 'ar'): string {
  if (!dateMs) return '—';
  const d = new Date(dateMs);
  return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SLAProgressBar: React.FC<SLAProgressBarProps> = ({
  createdAt,
  dueAt,
  targetHours,
  label = 'مستوى الخدمة (SLA)',
  compact = false,
  className = '',
  showDetails = true,
  tooltipPlacement = 'auto',
  dir: propDir,
  locale: propLocale,
}) => {
  const langContext = useLanguage();
  const dir = propDir || langContext.dir || 'rtl';
  const locale = propLocale || langContext.locale || 'ar';
  const isRtl = dir === 'rtl';
  const isAr = locale === 'ar';
  const tooltipId = useId();

  const calculation = useMemo(() => {
    const now = Date.now();
    const createdMs = parseDateMs(createdAt);
    let dueMs = parseDateMs(dueAt);

    // Fallback: calculate dueMs from targetHours if dueAt not given
    if (!dueMs && createdMs && targetHours && targetHours > 0) {
      dueMs = createdMs + targetHours * 3600 * 1000;
    }

    if (!dueMs) {
      return {
        percent: 0,
        isOverdue: false,
        timeText: isAr ? 'غير محدد موعد' : 'No deadline',
        colorCategory: 'sage' as const,
        createdMs,
        dueMs: null,
      };
    }

    const remainingMs = dueMs - now;
    const isOverdue = remainingMs < 0;
    const timeText = formatDuration(remainingMs, isOverdue, isAr);

    let percent = 0;
    if (createdMs && dueMs > createdMs) {
      const totalDuration = dueMs - createdMs;
      const elapsed = now - createdMs;
      percent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
      if (isOverdue) percent = 100;
    } else {
      percent = isOverdue ? 100 : 50;
    }

    let colorCategory: 'sage' | 'amber' | 'coral' = 'sage';
    if (isOverdue || percent > 85) {
      colorCategory = 'coral';
    } else if (percent >= 60) {
      colorCategory = 'amber';
    } else {
      colorCategory = 'sage';
    }

    return {
      percent,
      isOverdue,
      timeText,
      colorCategory,
      createdMs,
      dueMs,
    };
  }, [createdAt, dueAt, targetHours, isAr]);

  const { percent, isOverdue, timeText, colorCategory, createdMs, dueMs } = calculation;

  // Polished Color Styles with directional RTL grading and enhanced dark mode contrast
  const colorStyles = useMemo(() => {
    switch (colorCategory) {
      case 'sage':
        return {
          bar: 'bg-gradient-to-r rtl:bg-gradient-to-l from-emerald-500 to-teal-400 dark:from-emerald-400 dark:to-teal-300 shadow-[0_0_8px_rgba(16,185,129,0.25)]',
          text: 'text-emerald-700 dark:text-emerald-300',
          badge: 'bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200/90 dark:border-emerald-800/80',
          dot: 'bg-emerald-500 dark:bg-emerald-400',
          icon: CheckCircle2,
          borderAccent: 'border-emerald-500/40',
        };
      case 'amber':
        return {
          bar: 'bg-gradient-to-r rtl:bg-gradient-to-l from-amber-500 to-orange-400 dark:from-amber-400 dark:to-orange-300 shadow-[0_0_8px_rgba(245,158,11,0.25)]',
          text: 'text-amber-800 dark:text-amber-300',
          badge: 'bg-amber-50/90 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border-amber-200/90 dark:border-amber-800/80',
          dot: 'bg-amber-500 dark:bg-amber-400',
          icon: Clock,
          borderAccent: 'border-amber-500/40',
        };
      case 'coral':
      default:
        return {
          bar: 'bg-gradient-to-r rtl:bg-gradient-to-l from-rose-500 to-red-600 dark:from-rose-500 dark:to-red-400 shadow-[0_0_10px_rgba(244,63,94,0.35)]',
          text: 'text-rose-700 dark:text-rose-300',
          badge: `bg-rose-50/90 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200/90 dark:border-rose-800/80 ${isOverdue ? 'ring-1 ring-rose-500/40' : ''}`,
          dot: 'bg-rose-500 dark:bg-rose-400',
          icon: isOverdue ? ShieldAlert : AlertTriangle,
          borderAccent: 'border-rose-500/40',
        };
    }
  }, [colorCategory, isOverdue]);

  const IconComponent = colorStyles.icon;

  const ariaValueText = useMemo(() => {
    return isAr
      ? `${label}: ${percent}% مستهلك، ${timeText}`
      : `${label}: ${percent}% elapsed, ${timeText}`;
  }, [label, percent, timeText, isAr]);

  // Determine Tooltip Placement classes (RTL-aware)
  const tooltipPositionClass = useMemo(() => {
    if (tooltipPlacement === 'top') {
      return 'left-1/2 -translate-x-1/2';
    }
    if (tooltipPlacement === 'top-start') {
      return isRtl ? 'right-0 translate-x-0' : 'left-0 translate-x-0';
    }
    if (tooltipPlacement === 'top-end') {
      return isRtl ? 'left-0 translate-x-0' : 'right-0 translate-x-0';
    }
    // 'auto' placement
    if (compact) {
      return isRtl ? 'right-0 translate-x-0' : 'left-0 translate-x-0';
    }
    return 'left-1/2 -translate-x-1/2';
  }, [tooltipPlacement, isRtl, compact]);

  const tooltipArrowClass = useMemo(() => {
    if (tooltipPlacement === 'top') {
      return 'left-1/2 -translate-x-1/2';
    }
    if (tooltipPlacement === 'top-start') {
      return isRtl ? 'right-4' : 'left-4';
    }
    if (tooltipPlacement === 'top-end') {
      return isRtl ? 'left-4' : 'right-4';
    }
    if (compact) {
      return isRtl ? 'right-4' : 'left-4';
    }
    return 'left-1/2 -translate-x-1/2';
  }, [tooltipPlacement, isRtl, compact]);

  // Reusable Tooltip element
  const tooltipNode = (
    <div
      role="tooltip"
      id={tooltipId}
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-full mb-2 z-50 transition-all duration-200 ease-out opacity-0 invisible translate-y-1 group-hover/sla:opacity-100 group-hover/sla:visible group-hover/sla:translate-y-0 group-focus-within/sla:opacity-100 group-focus-within/sla:visible group-focus-within/sla:translate-y-0 ${tooltipPositionClass}`}
    >
      <div
        className={`w-60 p-2.5 rounded-xl bg-slate-900/95 dark:bg-slate-950/95 text-white border ${colorStyles.borderAccent} shadow-2xl backdrop-blur-md text-xs space-y-2`}
        dir={dir}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
          <span className="font-semibold text-slate-200 text-[11px] truncate flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{label}</span>
          </span>
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded tabular-nums border ${colorStyles.badge}`}>
            {percent}%
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] px-0.5">
          <span className="text-slate-400 font-medium">{isAr ? 'الحالة:' : 'Status:'}</span>
          <span className={`font-semibold tabular-nums tracking-tight ${colorStyles.text}`}>
            {timeText}
          </span>
        </div>

        {(createdMs || dueMs) && (
          <div className="space-y-1 pt-1.5 border-t border-slate-800/90 text-[10px] text-slate-300">
            {createdMs && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">{isAr ? 'البداية:' : 'Start:'}</span>
                <span className="font-mono text-slate-300 tabular-nums">
                  {formatDateShort(createdMs, locale)}
                </span>
              </div>
            )}
            {dueMs && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">{isAr ? 'الاستحقاق:' : 'Due:'}</span>
                <span
                  className={`font-mono tabular-nums ${
                    isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'
                  }`}
                >
                  {formatDateShort(dueMs, locale)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Arrow Indicator */}
      <div
        className={`absolute top-full -mt-px w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-slate-900 dark:border-t-slate-950 ${tooltipArrowClass}`}
      />
    </div>
  );

  if (compact) {
    return (
      <div className={`relative group/sla inline-flex items-center gap-2 select-none ${className}`}>
        {/* Compact Progress Bar Track */}
        <div
          role="progressbar"
          tabIndex={0}
          aria-label={label}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={ariaValueText}
          aria-describedby={tooltipId}
          title={`${label}: ${percent}% (${timeText})`}
          className="w-16 sm:w-24 h-2 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70 overflow-hidden shrink-0 cursor-help focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50"
        >
          <div
            className={`h-full transition-all duration-500 rounded-full ${colorStyles.bar}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Compact Pill Badge */}
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap tracking-tight tabular-nums transition-colors shadow-2xs ${colorStyles.badge}`}
        >
          <IconComponent className="w-3 h-3 shrink-0" />
          <span>{timeText}</span>
        </span>

        {/* Hover & Focus RTL Tooltip */}
        {tooltipNode}
      </div>
    );
  }

  return (
    <div
      className={`relative group/sla glass-card bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 p-3.5 rounded-2xl shadow-2xs space-y-2.5 transition-all ${className}`}
    >
      {/* Top row: Label & Time Status Badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
          <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          <span className="truncate">{label}</span>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 tracking-tight tabular-nums shadow-2xs ${colorStyles.badge}`}
        >
          <IconComponent className="w-3.5 h-3.5 shrink-0" />
          <span>{timeText}</span>
        </span>
      </div>

      {/* Progress Bar Track */}
      <div className="space-y-1">
        <div
          role="progressbar"
          tabIndex={0}
          aria-label={label}
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={ariaValueText}
          aria-describedby={tooltipId}
          title={`${label}: ${percent}% (${timeText})`}
          className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/70 overflow-hidden cursor-help focus:outline-none focus:ring-2 focus:ring-emerald-500/50 dark:focus:ring-emerald-400/50"
        >
          <div
            className={`h-full transition-all duration-500 rounded-full ${colorStyles.bar}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400">
          <span className="tabular-nums">0%</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
            {percent}% {isAr ? 'مستهلك' : 'elapsed'}
          </span>
          <span className="tabular-nums">100%</span>
        </div>
      </div>

      {/* Bottom dates breakdown */}
      {showDetails && (createdMs || dueMs) && (
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {isAr ? 'البداية:' : 'Start:'}
            </span>
            <span className="font-mono font-medium text-slate-700 dark:text-slate-200 tabular-nums">
              {formatDateShort(createdMs, locale)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {isAr ? 'الاستحقاق:' : 'Due:'}
            </span>
            <span
              className={`font-mono font-semibold tabular-nums ${
                isOverdue
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
            >
              {formatDateShort(dueMs, locale)}
            </span>
          </div>
        </div>
      )}

      {/* Hover & Focus RTL Tooltip */}
      {tooltipNode}
    </div>
  );
};

export default SLAProgressBar;
