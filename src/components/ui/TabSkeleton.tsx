import React from 'react';

export function TabSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-4">
      {/* Header bar skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl p-4 space-y-3">
            <div className="h-4 w-24 bg-slate-300 dark:bg-slate-700 rounded"></div>
            <div className="h-8 w-16 bg-slate-300 dark:bg-slate-700 rounded"></div>
          </div>
        ))}
      </div>

      {/* Main card skeleton */}
      <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl p-6 space-y-4">
        <div className="h-6 w-3/4 bg-slate-300 dark:bg-slate-700 rounded"></div>
        <div className="h-4 w-1/2 bg-slate-300 dark:bg-slate-700 rounded"></div>
        <div className="h-32 w-full bg-slate-300 dark:bg-slate-700 rounded-xl mt-4"></div>
      </div>
    </div>
  );
}

export default TabSkeleton;

