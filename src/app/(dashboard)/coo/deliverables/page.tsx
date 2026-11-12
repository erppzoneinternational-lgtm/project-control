'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CooDeliverablesDashboard } from '@/components/planning/CooDeliverablesDashboard';

function CooDeliverablesContent() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId') || undefined;

  return (
    <main
      dir="rtl"
      className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1750px] w-full mx-auto transition-colors duration-200"
      aria-label="لوحة متابعة المخرجات التشغيلية"
    >
      <CooDeliverablesDashboard initialProjectId={projectId} />
    </main>
  );
}

export default function CooDeliverablesPage() {
  return (
    <Suspense
      fallback={
        <div
          dir="rtl"
          className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1750px] w-full mx-auto animate-pulse"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="sr-only">جاري تحميل لوحة متابعة المخرجات التشغيلية...</div>
          <div className="h-24 bg-slate-100 dark:bg-slate-800/70 rounded-3xl border border-slate-200/50 dark:border-slate-700/50" />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-20 bg-slate-100 dark:bg-slate-800/70 rounded-3xl border border-slate-200/50 dark:border-slate-700/50"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 bg-slate-100 dark:bg-slate-800/70 rounded-3xl border border-slate-200/50 dark:border-slate-700/50" />
            <div className="h-72 bg-slate-100 dark:bg-slate-800/70 rounded-3xl border border-slate-200/50 dark:border-slate-700/50" />
          </div>
          <div className="h-96 bg-slate-100 dark:bg-slate-800/70 rounded-3xl border border-slate-200/50 dark:border-slate-700/50" />
        </div>
      }
    >
      <CooDeliverablesContent />
    </Suspense>
  );
}
