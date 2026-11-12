'use client';

import React from 'react';

/**
 * Pixel-perfect loading skeletons for dashboard components.
 * Designed to preserve exact bounding boxes, responsive grids,
 * and flex structures to eliminate Cumulative Layout Shift (CLS).
 */

export const ExecutiveFilterBarSkeleton: React.FC = () => {
  return (
    <div
      data-testid="executive-filter-bar-skeleton"
      className="p-4 rounded-2xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-2xl space-y-4 animate-pulse"
      aria-hidden="true"
    >
      {/* Top Bar Header Skeleton */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-4 w-60 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-80 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
      </div>

      {/* Dynamic Filter Controls Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-3 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="md:col-span-3 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="md:col-span-3 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="md:col-span-3 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
};

export const ExecutiveKPICardsSkeleton: React.FC = () => {
  return (
    <div
      data-testid="executive-kpi-cards-skeleton"
      className="space-y-4 animate-pulse"
      aria-hidden="true"
    >
      {/* Primary KPI Row (4 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-slate-900/90 p-5 border border-slate-200/90 dark:border-slate-800 shadow-xl backdrop-blur-xl space-y-3 min-h-[168px] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>

            <div>
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="flex items-end gap-1.5 h-8 mt-2.5">
                {[40, 60, 80, 50, 90].map((h, idx) => (
                  <div
                    key={idx}
                    style={{ height: `${h}%` }}
                    className="flex-1 bg-slate-200 dark:bg-slate-800 rounded-xs"
                  />
                ))}
              </div>
            </div>

            <div className="h-3.5 w-44 bg-slate-200 dark:bg-slate-800 rounded mt-2" />
          </div>
        ))}
      </div>

      {/* Secondary Status Filter Badges Row (5 Badges) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-3 h-11 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 flex items-center justify-between"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="h-4 w-6 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const PortfolioProgressWidgetSkeleton: React.FC = () => {
  return (
    <div
      data-testid="portfolio-progress-widget-skeleton"
      className="rounded-2xl bg-white dark:bg-slate-900/95 p-5 md:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xl backdrop-blur-xl space-y-6 animate-pulse"
      aria-hidden="true"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-5 w-56 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="h-3 w-80 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
      </div>

      {/* Hero Overview: Completion Gauge + Stacked Progress Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left Dial */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-2.5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
        </div>

        {/* Right Stacked Progress */}
        <div className="lg:col-span-8 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="h-3.5 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="h-6 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center justify-between">
            <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
      </div>

      {/* Detailed Status Distribution Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="p-3.5 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col justify-between gap-2.5 min-h-[74px]"
          >
            <div className="flex items-center justify-between gap-1.5">
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-7 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="h-6 w-8 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ProjectCompletionEditorSkeleton: React.FC = () => {
  return (
    <div
      data-testid="completion-editor-skeleton"
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 p-4 space-y-3 animate-pulse"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="h-8 w-56 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="h-3.5 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="h-2 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-14 rounded-lg bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SuggestedActionsAndRisksSkeleton: React.FC = () => {
  return (
    <div
      data-testid="suggested-actions-risks-skeleton"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse"
      aria-hidden="true"
    >
      {/* Left Column (7 cols) */}
      <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900/90 p-5 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-52 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="h-5 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-2 min-h-[96px]"
            >
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Right Column (5 cols) */}
      <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900/90 p-5 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="h-4 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 min-h-[58px]"
            >
              <div className="space-y-1 flex-1">
                <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3.5 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ExecutiveInsightsSectionSkeleton: React.FC = () => {
  return (
    <div
      data-testid="executive-insights-skeleton"
      className="rounded-2xl bg-slate-900 p-5 border border-slate-800 shadow-xl backdrop-blur-xl space-y-4 animate-pulse"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-800" />
          <div className="space-y-1">
            <div className="h-4 w-64 bg-slate-800 rounded" />
            <div className="h-3 w-80 bg-slate-800 rounded" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-2 min-h-[88px]"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-700 rounded" />
              <div className="h-4 w-12 bg-slate-700 rounded" />
            </div>
            <div className="h-3 w-full bg-slate-700 rounded" />
            <div className="h-3 w-4/5 bg-slate-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const LocationAnalyticsMapSkeleton: React.FC = () => {
  return (
    <div
      data-testid="location-analytics-map-skeleton"
      className="rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl overflow-hidden flex flex-col space-y-0 animate-pulse"
      aria-hidden="true"
    >
      {/* Upper Control Bar Skeleton */}
      <header className="p-4 bg-slate-50/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-4 w-60 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="h-3 w-80 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="h-8 sm:w-64 min-w-[200px] bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-8 w-52 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </header>

      {/* Macro-Region Quick Switcher Nav Skeleton */}
      <nav className="p-3 bg-slate-100/60 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-8 w-28 sm:w-36 bg-slate-200 dark:bg-slate-800 rounded-lg shrink-0"
          />
        ))}
      </nav>

      {/* Main Map Body Split Skeleton */}
      <div className="relative w-full h-[440px] sm:h-[500px] md:h-[560px] lg:h-[620px] xl:h-[660px] flex overflow-hidden bg-slate-100 dark:bg-slate-950">
        {/* Map Canvas Shimmer */}
        <div className="flex-1 h-full flex items-center justify-center relative">
          <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
          <div className="flex flex-col items-center gap-2 text-slate-400 z-10">
            <div className="w-12 h-12 rounded-full border-2 border-slate-300 dark:border-slate-700 border-t-emerald-500 animate-spin" />
            <span className="text-xs font-mono font-medium">جاري تهيئة الخريطة الجغرافية...</span>
          </div>
        </div>

        {/* Project Inspector Side Panel Skeleton (lg screens) */}
        <div className="hidden lg:flex flex-col w-[450px] xl:w-[480px] shrink-0 border-s border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-950/95 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-28 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
          <div className="h-24 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    </div>
  );
};

export const ClientAnalyticsSectionSkeleton: React.FC = () => {
  return (
    <div
      data-testid="client-analytics-section-skeleton"
      className="rounded-2xl bg-white dark:bg-slate-900/90 p-6 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl space-y-6 animate-pulse"
      aria-hidden="true"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1">
            <div className="h-4 w-52 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-72 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
        <div className="h-8 w-44 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 h-80 rounded-xl bg-slate-100 dark:bg-slate-950 p-4 flex flex-col justify-between">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
              <div
                style={{ width: `${80 - i * 12}%` }}
                className="h-5 bg-slate-200 dark:bg-slate-800 rounded"
              />
            </div>
          ))}
        </div>

        <div className="lg:col-span-6 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2 min-h-[52px]"
            >
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const StatusDistributionChartSkeleton: React.FC = () => {
  return (
    <div
      data-testid="status-distribution-chart-skeleton"
      className="rounded-2xl bg-white dark:bg-slate-900/90 p-6 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl space-y-4 animate-pulse"
      aria-hidden="true"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1">
            <div className="h-4 w-52 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-72 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
      </div>
      <div className="h-72 rounded-xl bg-slate-100 dark:bg-slate-950 p-4 flex items-end justify-around gap-4">
        {[45, 75, 55, 30, 20].map((h, i) => (
          <div
            key={i}
            style={{ height: `${h}%` }}
            className="w-16 bg-slate-200 dark:bg-slate-800 rounded-t-lg"
          />
        ))}
      </div>
    </div>
  );
};

export const AquaticEngineeringSectionSkeleton: React.FC = () => {
  return (
    <div
      data-testid="aquatic-engineering-skeleton"
      className="rounded-2xl bg-white dark:bg-slate-900/90 p-6 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl space-y-6 animate-pulse"
      aria-hidden="true"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1">
            <div className="h-4 w-52 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-72 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-8 w-32 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-8 w-32 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 h-[120px]">
            <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 h-[120px]">
            <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
        <div className="lg:col-span-7 rounded-xl bg-slate-100 dark:bg-slate-950 p-4 h-[256px]" />
      </div>
    </div>
  );
};

export const ProjectKPICardsSkeleton: React.FC<{ projectName?: string }> = ({ projectName }) => {
  return (
    <div
      data-testid="project-kpi-cards-skeleton"
      className="space-y-4 animate-pulse"
      aria-hidden="true"
    >
      {projectName && (
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
      )}

      {/* Grid of 5 Executive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((idx) => (
          <div
            key={idx}
            className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3 min-h-[176px]"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-8 w-8 rounded-xl bg-slate-200 dark:bg-slate-800" />
            </div>

            <div className="flex items-baseline gap-2">
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>

            <div className="space-y-1.5 text-[11px] border-t border-slate-100 dark:border-slate-800 pt-2">
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-10 bg-slate-200 dark:bg-slate-800 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TOEngineerKPIDashboardSkeleton: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div
      data-testid="to-engineer-kpi-dashboard-skeleton"
      className={`space-y-6 animate-pulse ${className}`}
      aria-hidden="true"
    >
      {/* Top Header Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="h-5 w-72 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3.5 w-96 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="h-8 w-32 rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>

      {/* 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3 min-h-[142px]"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-9 w-9 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="sm:col-span-7 h-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* Leaderboard Table Skeleton */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-1">
                  <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-2.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-8">
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Engineer Deep-Dive Card Skeleton */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-1">
              <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-3 w-60 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          </div>
          <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-100 dark:border-slate-800 p-3 text-center space-y-2 h-[72px]"
            >
              <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
              <div className="h-5 w-12 bg-slate-200 dark:bg-slate-800 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ProjectsAnalyticsDashboardSkeleton: React.FC = () => {
  return (
    <div
      data-testid="projects-analytics-dashboard-skeleton"
      className="space-y-6 text-start font-sans animate-pulse"
      dir="rtl"
      aria-hidden="true"
    >
      {/* Top Bar Controls & View Switcher Tabs Skeleton */}
      <nav className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-950/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80">
          <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-8 w-52 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-8 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </nav>

      {/* Global Dynamic Executive Filter Bar */}
      <ExecutiveFilterBarSkeleton />

      {/* Executive Top KPI Cards */}
      <ExecutiveKPICardsSkeleton />

      {/* Portfolio Progress & Status Distribution Widget */}
      <PortfolioProgressWidgetSkeleton />

      {/* Project Completion Editor */}
      <ProjectCompletionEditorSkeleton />

      {/* Executive View Sections */}
      <div className="space-y-6">
        <SuggestedActionsAndRisksSkeleton />
        <ExecutiveInsightsSectionSkeleton />
        <LocationAnalyticsMapSkeleton />
        <ClientAnalyticsSectionSkeleton />
      </div>
    </div>
  );
};
