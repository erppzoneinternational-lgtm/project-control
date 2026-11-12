'use client';

import React from 'react';

interface HseSkeletonProps {
  locale?: string;
}

export const HseSkeleton: React.FC<HseSkeletonProps> = ({ locale = 'ar' }) => {
  const isAr = locale === 'ar';

  return (
    <div
      className="p-6 space-y-6 max-w-7xl mx-auto w-full animate-pulse"
      aria-busy="true"
      aria-live="polite"
      role="status"
      dir="rtl"
    >
      <span className="sr-only">
        {isAr
          ? 'جاري تحميل لوحة تحكم السلامة والصحة المهنية والبيئة...'
          : 'Loading HSE Dashboard and Safety Metrics...'}
      </span>

      {/* Header Bar Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="space-y-2">
            <div className="h-6 w-64 bg-slate-300 dark:bg-slate-700 rounded-md" />
            <div className="h-3.5 w-96 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-44 bg-slate-300 dark:bg-slate-700 rounded-xl" />
        </div>
      </div>

      {/* Safe Man-Hours & HSE Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ساعات العمل الآمنة', sub: 'بدون إصابات وقت ضائع' },
          { label: 'أيام بدون وقت ضائع', sub: 'LTI-Free Days' },
          { label: 'سجل الحوادث والوقائع', sub: 'Total HSE Incidents' },
          { label: 'متوسط تقييم السلامة', sub: 'Audit Compliance Score' },
        ].map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
            </div>
            <div className="space-y-2">
              <div className="h-7 w-32 bg-slate-300 dark:bg-slate-700 rounded-md" />
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full" />
              <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800/80 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Card Skeleton */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex items-center gap-2 p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="h-10 w-full sm:w-80 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="p-4 space-y-3">
          {/* Table Header */}
          <div className="h-10 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl flex items-center justify-between px-4">
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
          </div>

          {/* Table Rows */}
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="h-14 w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between px-4"
            >
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
              <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HseSkeleton;
