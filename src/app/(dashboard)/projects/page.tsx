'use client';

import React from 'react';
import { ProjectsPageClient } from '@/components/projects/ProjectsPageClient';

function ProjectsPageSkeleton() {
  return (
    <div className="w-full space-y-6 animate-pulse" aria-busy="true" aria-label="جاري تحميل صفحة المشاريع">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-3 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
      {/* Row 1 Skeleton: Financial & Scale Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {[1, 2, 3, 4, 5, 6].map((k) => (
          <div key={`r1-${k}`} className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4" />
        ))}
      </div>
      {/* Row 2 Skeleton: Lifecycle & Operational Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {[1, 2, 3, 4, 5, 6].map((k) => (
          <div key={`r2-${k}`} className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4" />
        ))}
      </div>
      <div className="h-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4" />
      <div className="h-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4" />
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <React.Suspense fallback={<ProjectsPageSkeleton />}>
      <ProjectsPageClient />
    </React.Suspense>
  );
}
