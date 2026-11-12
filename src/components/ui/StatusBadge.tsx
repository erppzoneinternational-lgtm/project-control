import React from 'react';
import { ProjectStatus } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface StatusBadgeProps {
  status: ProjectStatus;
  lang?: 'ar' | 'en';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusConfig: Record<
  ProjectStatus,
  { ar: string; en: string; bgClass: string; textClass: string; borderClass: string; dotClass: string }
> = {
  tender: {
    ar: 'مرحلة العطاء',
    en: 'Tender',
    bgClass: 'bg-indigo-50 dark:bg-indigo-950/70',
    textClass: 'text-indigo-800 dark:text-indigo-200 font-bold',
    borderClass: 'border-indigo-300 dark:border-indigo-700/80',
    dotClass: 'bg-indigo-500 dark:bg-indigo-400',
  },
  not_started: {
    ar: 'لم يبدأ',
    en: 'Not Started',
    bgClass: 'bg-slate-100 dark:bg-slate-800/90',
    textClass: 'text-slate-800 dark:text-slate-200 font-bold',
    borderClass: 'border-slate-300 dark:border-slate-700',
    dotClass: 'bg-slate-500 dark:bg-slate-400',
  },
  working: {
    ar: 'قيد التنفيذ',
    en: 'Working',
    bgClass: 'bg-sky-50 dark:bg-sky-950/70',
    textClass: 'text-sky-800 dark:text-sky-200 font-bold',
    borderClass: 'border-sky-300 dark:border-sky-700/80',
    dotClass: 'bg-sky-500 dark:bg-sky-400',
  },
  on_hold: {
    ar: 'موقوف مؤقتاً',
    en: 'On Hold',
    bgClass: 'bg-amber-50 dark:bg-amber-950/70',
    textClass: 'text-amber-900 dark:text-amber-200 font-bold',
    borderClass: 'border-amber-300 dark:border-amber-700/80',
    dotClass: 'bg-amber-500 dark:bg-amber-400',
  },
  handing_over: {
    ar: 'قيد التسليم',
    en: 'Handing Over',
    bgClass: 'bg-purple-50 dark:bg-purple-950/70',
    textClass: 'text-purple-800 dark:text-purple-200 font-bold',
    borderClass: 'border-purple-300 dark:border-purple-700/80',
    dotClass: 'bg-purple-500 dark:bg-purple-400',
  },
  finished: {
    ar: 'منتهي',
    en: 'Finished',
    bgClass: 'bg-emerald-50 dark:bg-emerald-950/70',
    textClass: 'text-emerald-800 dark:text-emerald-200 font-bold',
    borderClass: 'border-emerald-300 dark:border-emerald-700/80',
    dotClass: 'bg-emerald-500 dark:bg-emerald-400',
  },
  cancelled: {
    ar: 'ملغي',
    en: 'Cancelled',
    bgClass: 'bg-rose-50 dark:bg-rose-950/70',
    textClass: 'text-rose-800 dark:text-rose-200 font-bold',
    borderClass: 'border-rose-300 dark:border-rose-700/80',
    dotClass: 'bg-rose-500 dark:bg-rose-400',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, lang, size = 'md', className = '' }) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const config = statusConfig[status] || statusConfig.not_started;
  // explicit lang prop wins; otherwise follow the app locale
  const showAr = lang ? lang === 'ar' : isAr;
  
  const sizeClasses = {
    sm: 'px-2.5 py-0.5 text-[11px]',
    md: 'px-3 py-1 text-xs font-bold',
    lg: 'px-4 py-1.5 text-sm font-bold',
  };

  return (
    <span
      role="status"
      dir={showAr ? 'rtl' : 'ltr'}
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs backdrop-blur-md select-none tracking-normal transition-all ${config.bgClass} ${config.textClass} ${config.borderClass} ${sizeClasses[size]} ${className}`}
    >
      <span className={`h-2 w-2 rounded-full ring-2 ring-white/50 dark:ring-slate-900/50 ${config.dotClass}`} aria-hidden="true" />
      <span>{showAr ? config.ar : config.en}</span>
    </span>
  );
};
