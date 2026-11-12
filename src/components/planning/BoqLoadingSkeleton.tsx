'use client';

import React from 'react';

interface BoqLoadingSkeletonProps {
  showSidebar?: boolean;
}

export const BoqLoadingSkeleton: React.FC<BoqLoadingSkeletonProps> = ({ showSidebar = true }) => {
  return (
    <div className="space-y-6 w-full animate-pulse" aria-busy="true" aria-label="جاري تحميل جدول الكميات">
      {/* Top Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-2">
            <div className="h-5 w-64 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-3 w-80 bg-slate-100 dark:bg-slate-800/60 rounded-md" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-72 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>

      {/* Rate Analysis & KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-6 w-32 bg-slate-300 dark:bg-slate-700 rounded" />
              <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800/70 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Action Toolbar Skeleton */}
      <div className="h-14 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-44 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-9 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-9 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>

      {/* Master BOQ Explorer: Division Tree + Table Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Division Tree Panel Skeleton */}
        {showSidebar && (
          <div className="lg:col-span-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-5 w-12 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="h-9 w-full bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="space-y-2 pt-2">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700 rounded" />
                  </div>
                  <div className="h-3 w-10 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BOQ Table Skeleton */}
        <div className={showSidebar ? 'lg:col-span-9 space-y-4' : 'lg:col-span-12 space-y-4'}>
          {/* Filter row skeleton */}
          <div className="flex items-center justify-between gap-3">
            <div className="h-9 w-72 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-9 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            </div>
          </div>

          {/* Table Container Skeleton */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            {/* Header */}
            <div className="h-11 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 gap-4">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-48 bg-slate-200 dark:bg-slate-700 rounded flex-1" />
              <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {[1, 2, 3, 4, 5, 6, 7].map((row) => (
                <div key={row} className="px-4 py-3.5 flex items-center gap-4">
                  <div className="h-4 w-16 bg-emerald-100/50 dark:bg-emerald-950/30 rounded" />
                  <div className="h-4 w-16 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-2.5 w-1/3 bg-slate-100 dark:bg-slate-800/50 rounded" />
                  </div>
                  <div className="h-4 w-8 bg-slate-100 dark:bg-slate-800 rounded text-center" />
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-14 bg-slate-100 dark:bg-slate-800 rounded-full" />
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-4 w-24 bg-emerald-100/60 dark:bg-emerald-950/40 rounded font-bold" />
                  <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                </div>
              ))}
            </div>

            {/* Sticky Totals Footer Skeleton */}
            <div className="h-12 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3.5 w-40 bg-emerald-200/50 dark:bg-emerald-900/40 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-7 w-16 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
