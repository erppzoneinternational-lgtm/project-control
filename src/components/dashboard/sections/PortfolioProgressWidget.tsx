'use client';

import React, { useMemo } from 'react';
import { Project } from '@/types';
import { getProjectValueWithVat } from '@/lib/utils/projectValue';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Activity, 
  ShieldCheck, 
  TrendingUp,
  PieChart as PieChartIcon,
  Layers,
  ArrowUpRight,
  RotateCcw,
  Plus
} from 'lucide-react';
import Link from 'next/link';

interface PortfolioProgressWidgetProps {
  projects: Project[];
  totalProjectsCount?: number;
  activeStatus?: string;
  onStatusSelect?: (status: string) => void;
  onResetFilters?: () => void;
  lang?: 'ar' | 'en';
}

export const PortfolioProgressWidget: React.FC<PortfolioProgressWidgetProps> = ({
  projects = [],
  totalProjectsCount,
  activeStatus = 'all',
  onStatusSelect,
  onResetFilters,
  lang = 'ar',
}) => {
  const isAr = lang === 'ar';
  const totalCount = projects.length;
  const overallCount = totalProjectsCount ?? totalCount;

  // Compute portfolio status aggregations and metrics
  const portfolioMetrics = useMemo(() => {
    let workingCount = 0;
    let finishedCount = 0;
    let handingCount = 0;
    let holdCount = 0;
    let cancelledCount = 0;

    let workingVal = 0;
    let finishedVal = 0;
    let handingVal = 0;
    let holdVal = 0;
    let cancelledVal = 0;

    let totalVal = 0;
    let totalVos = 0;

    let weightedCompletionSum = 0;
    let weightedValueDenominator = 0;

    projects.forEach((p) => {
      const fullProjectVal = getProjectValueWithVat(p);
      const vos = Number(p.vos_value || 0);

      totalVal += fullProjectVal;
      totalVos += vos;

      // Status classification
      const status = p.status || 'working';

      // Completion percentage logic: use real project completion_pct without fabricating fake progress
      let pct = typeof p.completion_pct === 'number' && !isNaN(p.completion_pct) ? p.completion_pct : 0;
      if (pct === 0 && status === 'finished') {
        pct = 100;
      }

      const weight = fullProjectVal > 0 ? fullProjectVal : 1;
      weightedCompletionSum += pct * weight;
      weightedValueDenominator += weight;

      if (status === 'working') {
        workingCount++;
        workingVal += fullProjectVal;
      } else if (status === 'finished') {
        finishedCount++;
        finishedVal += fullProjectVal;
      } else if (status === 'handing_over') {
        handingCount++;
        handingVal += fullProjectVal;
      } else if (status === 'on_hold') {
        holdCount++;
        holdVal += fullProjectVal;
      } else if (status === 'cancelled') {
        cancelledCount++;
        cancelledVal += fullProjectVal;
      } else {
        workingCount++;
        workingVal += fullProjectVal;
      }
    });

    const completionRate = weightedValueDenominator > 0
      ? Math.round(weightedCompletionSum / weightedValueDenominator)
      : (totalCount > 0 ? 0 : 0);

    const activeInFlightCount = workingCount + handingCount;
    const activeInFlightVal = workingVal + handingVal;

    return {
      totalCount,
      totalVal,
      totalVos,
      completionRate,
      workingCount,
      workingVal,
      finishedCount,
      finishedVal,
      handingCount,
      handingVal,
      holdCount,
      holdVal,
      cancelledCount,
      cancelledVal,
      activeInFlightCount,
      activeInFlightVal,
    };
  }, [projects, totalCount]);

  // Format currency with proper RTL/LTR isolation
  const formatCurrency = (val: number) => {
    if (val >= 1e9) {
      const num = (val / 1e9).toFixed(2);
      return isAr ? `${num} مليار ج.م` : `${num}B EGP`;
    }
    if (val >= 1e6) {
      const num = (val / 1e6).toFixed(1);
      return isAr ? `${num} مليون ج.م` : `${num}M EGP`;
    }
    const formatted = new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US').format(Math.round(val));
    return isAr ? `${formatted} ج.م` : `${formatted} EGP`;
  };

  // Status segment specifications
  const segments = useMemo(() => {
    const total = totalCount || 1;
    return [
      {
        key: 'finished',
        label: isAr ? 'منتهي ومسلّم' : 'Finished / Delivered',
        shortLabel: isAr ? 'منتهي' : 'Finished',
        count: portfolioMetrics.finishedCount,
        val: portfolioMetrics.finishedVal,
        pct: Math.round((portfolioMetrics.finishedCount / total) * 100),
        valPct: portfolioMetrics.totalVal > 0 ? Math.round((portfolioMetrics.finishedVal / portfolioMetrics.totalVal) * 100) : 0,
        color: 'from-emerald-500 to-teal-400',
        bgColor: 'bg-emerald-500',
        textColor: 'text-emerald-700 dark:text-emerald-400',
        ringColor: 'ring-emerald-500',
        borderColor: 'border-emerald-500/30',
        badgeBg: 'bg-emerald-500/10 dark:bg-emerald-950/40',
        icon: CheckCircle2,
      },
      {
        key: 'working',
        label: isAr ? 'قيد التنفيذ النشط' : 'Working / In Progress',
        shortLabel: isAr ? 'تنفيذ' : 'Working',
        count: portfolioMetrics.workingCount,
        val: portfolioMetrics.workingVal,
        pct: Math.round((portfolioMetrics.workingCount / total) * 100),
        valPct: portfolioMetrics.totalVal > 0 ? Math.round((portfolioMetrics.workingVal / portfolioMetrics.totalVal) * 100) : 0,
        color: 'from-cyan-500 to-blue-500',
        bgColor: 'bg-cyan-500',
        textColor: 'text-cyan-700 dark:text-cyan-400',
        ringColor: 'ring-cyan-500',
        borderColor: 'border-cyan-500/30',
        badgeBg: 'bg-cyan-500/10 dark:bg-cyan-950/40',
        icon: Activity,
      },
      {
        key: 'handing_over',
        label: isAr ? 'تسليم ابتدائي ومعاينة' : 'Handing Over',
        shortLabel: isAr ? 'تسليم' : 'Handing',
        count: portfolioMetrics.handingCount,
        val: portfolioMetrics.handingVal,
        pct: Math.round((portfolioMetrics.handingCount / total) * 100),
        valPct: portfolioMetrics.totalVal > 0 ? Math.round((portfolioMetrics.handingVal / portfolioMetrics.totalVal) * 100) : 0,
        color: 'from-indigo-500 to-purple-500',
        bgColor: 'bg-indigo-500',
        textColor: 'text-indigo-700 dark:text-indigo-400',
        ringColor: 'ring-indigo-500',
        borderColor: 'border-indigo-500/30',
        badgeBg: 'bg-indigo-500/10 dark:bg-indigo-950/40',
        icon: Clock,
      },
      {
        key: 'on_hold',
        label: isAr ? 'متوقف ومعلق' : 'On Hold',
        shortLabel: isAr ? 'متوقف' : 'On Hold',
        count: portfolioMetrics.holdCount,
        val: portfolioMetrics.holdVal,
        pct: Math.round((portfolioMetrics.holdCount / total) * 100),
        valPct: portfolioMetrics.totalVal > 0 ? Math.round((portfolioMetrics.holdVal / portfolioMetrics.totalVal) * 100) : 0,
        color: 'from-amber-500 to-yellow-400',
        bgColor: 'bg-amber-500',
        textColor: 'text-amber-700 dark:text-amber-400',
        ringColor: 'ring-amber-500',
        borderColor: 'border-amber-500/30',
        badgeBg: 'bg-amber-500/10 dark:bg-amber-950/40',
        icon: AlertTriangle,
      },
      {
        key: 'cancelled',
        label: isAr ? 'ملغي ومستبعد' : 'Cancelled',
        shortLabel: isAr ? 'ملغي' : 'Cancelled',
        count: portfolioMetrics.cancelledCount,
        val: portfolioMetrics.cancelledVal,
        pct: Math.round((portfolioMetrics.cancelledCount / total) * 100),
        valPct: portfolioMetrics.totalVal > 0 ? Math.round((portfolioMetrics.cancelledVal / portfolioMetrics.totalVal) * 100) : 0,
        color: 'from-rose-500 to-red-500',
        bgColor: 'bg-rose-500',
        textColor: 'text-rose-700 dark:text-rose-400',
        ringColor: 'ring-rose-500',
        borderColor: 'border-rose-500/30',
        badgeBg: 'bg-rose-500/10 dark:bg-rose-950/40',
        icon: XCircle,
      },
    ];
  }, [totalCount, portfolioMetrics, isAr]);

  return (
    <section 
      data-testid="portfolio-progress-widget"
      aria-label={isAr ? 'لوحة تقدم المحفظة وتوزيع الحالات' : 'Portfolio Progress and Status Distribution'}
      className="rounded-2xl bg-white dark:bg-slate-900/95 p-5 md:p-6 border border-slate-200/90 dark:border-slate-800 contrast-more:border-slate-500 shadow-xl backdrop-blur-xl space-y-6 transition-all"
    >
      {/* ─── Top Header & Overview Summary ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/90 dark:border-slate-800 contrast-more:border-slate-400">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-950/50 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-md shrink-0">
            <Layers className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 flex-wrap">
              <span>{isAr ? 'معدل إنجاز المحفظة وتوزيع الحالات' : 'Portfolio Progress & Status Distribution'}</span>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30">
                {totalCount} {isAr ? 'مشروع مفلتر' : 'Projects'}
                {totalCount !== overallCount && (
                  <bdi className="ms-1">
                    ({isAr ? 'من أصل' : 'of'} <span className="tabular-nums">{overallCount}</span>)
                  </bdi>
                )}
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 contrast-more:text-slate-900 dark:contrast-more:text-white mt-0.5">
              {isAr 
                ? 'تحليل مباشر لوتيرة التنفيذ الإجمالية، الميزانيات الموزعة، ومؤشرات الجاهزية للتسليم'
                : 'Real-time analysis of execution velocity, allocated capital, and delivery readiness'}
            </p>
          </div>
        </div>

        {/* Global Reset / Status Filter Helper */}
        {activeStatus !== 'all' && onStatusSelect && (
          <button
            type="button"
            onClick={() => onStatusSelect('all')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none"
            aria-label={isAr ? 'إلغاء تصفية الحالة وعرض كافة المشاريع' : 'Reset status filter to view all projects'}
          >
            <span>{isAr ? 'عرض الكل' : 'Show All'}</span>
            <span className="font-mono text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
              ✕
            </span>
          </button>
        )}
      </div>

      {totalCount === 0 ? (
        <div
          role="status"
          aria-label={isAr ? 'لا توجد مشاريع لعرض مؤشرات التقدم' : 'No projects to display progress metrics'}
          className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-inner border border-cyan-200/80 dark:border-cyan-800/80" aria-hidden="true">
            <Layers className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'لا توجد مشاريع لعرض مؤشرات التقدم' : 'No projects to display progress metrics'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {isAr
                ? 'لم تسفر معايير التصفية الحالية عن أي مشاريع لعرض وتيرة التنفيذ ومعدلات الإنجاز. يمكنك إعادة ضبط الفلاتر أو إضافة مشروع جديد.'
                : 'Current filter criteria yielded no projects to calculate progress rates and stages. You can reset filters or add a new project.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {(onResetFilters || activeStatus !== 'all') && (
              <button
                type="button"
                onClick={onResetFilters || (() => onStatusSelect?.('all'))}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/60 dark:hover:bg-cyan-900/50 text-cyan-800 dark:text-cyan-300 text-xs font-bold transition-colors border border-cyan-200 dark:border-cyan-800 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none cursor-pointer"
                aria-label={isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
              </button>
            )}
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none cursor-pointer"
              aria-label={isAr ? 'إضافة مشروع جديد' : 'Add new project'}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'إضافة مشروع جديد' : 'Add New Project'}</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* ─── Hero Overview: Completion Gauge + Stacked Progress Bar ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left: Overall Completion Dial / Metric (lg:col-span-4) */}
        <div className="lg:col-span-4 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className={`text-xs font-bold text-slate-500 dark:text-slate-400 block ${isAr ? 'tracking-normal' : 'uppercase tracking-wider'}`}>
                  {isAr ? 'معدل الإنجاز الإجمالي للمحفظة' : 'Portfolio Completion Rate'}
            </span>
            <div className="flex items-baseline gap-2">
              <span 
                className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tight"
                dir="ltr"
              >
                {portfolioMetrics.completionRate}%
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                <span dir="ltr">
                  {portfolioMetrics.completionRate >= 60 ? (isAr ? 'وتيرة ممتازة' : 'On Track') : (isAr ? 'تحت المتابعة' : 'In Progress')}
                </span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isAr 
                ? `متوسط مرجح بالقيمة المالية لعقود ${totalCount} مشروع`
                : `Value-weighted average across ${totalCount} projects`}
            </p>
          </div>

          {/* Radial SVG Mini Progress Indicator */}
          <div className="relative w-16 h-16 shrink-0 aspect-square flex items-center justify-center" aria-hidden="true">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" preserveAspectRatio="xMidYMid meet">
              <circle
                cx="18"
                cy="18"
                r="14"
                className="text-slate-200 dark:text-slate-800 stroke-current"
                strokeWidth="3.5"
                vectorEffect="non-scaling-stroke"
                fill="none"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                className="text-cyan-500 stroke-current transition-all duration-700 ease-out"
                strokeWidth="3.5"
                strokeDasharray="88"
                strokeDashoffset={Math.max(0, 88 - (88 * portfolioMetrics.completionRate) / 100)}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                fill="none"
              />
            </svg>
            <ShieldCheck className="w-6 h-6 text-cyan-600 dark:text-cyan-400 absolute" />
          </div>
        </div>

        {/* Right: Multi-Segment Stacked Progress Bar (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
              <span>{isAr ? 'توزيع مراحل ومسار تقدم المشاريع' : 'Project Pipeline & Status Breakdown'}</span>
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              {isAr ? 'انقر على أي شريحة لتصفية العرض' : 'Click any segment to filter'}
            </span>
          </div>

          {/* Accessible Segmented Bar */}
          <div 
            role="progressbar" 
            aria-valuenow={portfolioMetrics.completionRate} 
            aria-valuemin={0} 
            aria-valuemax={100}
            aria-valuetext={`${portfolioMetrics.completionRate}% ${isAr ? 'إنجاز' : 'completed'}`}
            className="h-6 w-full rounded-xl bg-slate-100 dark:bg-slate-950 p-1 flex items-stretch gap-1 border border-slate-200 dark:border-slate-800 shadow-inner overflow-hidden"
          >
            {segments.map((seg) => {
              if (seg.count === 0) return null;
              const isSelected = activeStatus === seg.key;
              return (
                <button
                  key={seg.key}
                  type="button"
                  onClick={() => onStatusSelect?.(isSelected ? 'all' : seg.key)}
                  style={{ width: `${Math.max(6, seg.pct)}%` }}
                  title={`${seg.label}: ${seg.count} ${isAr ? 'مشروع' : 'projects'} (${seg.pct}%) - ${formatCurrency(seg.val)}`}
                  className={`h-full bg-gradient-to-r ${seg.color} rounded-lg transition-all duration-300 relative group cursor-pointer hover:brightness-110 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none ${
                    isSelected ? 'ring-2 ring-white dark:ring-slate-200 brightness-125 z-10' : ''
                  }`}
                  aria-label={`${seg.label}: ${seg.count} ${isAr ? 'مشروع' : 'projects'}, ${seg.pct}%`}
                >
                  <span className="sr-only">{seg.label} {seg.count}</span>
                  {/* Floating tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-bold px-2 py-1 rounded-md whitespace-nowrap z-30 shadow-xl border border-slate-800 transition-opacity flex items-center gap-1.5">
                    <span>{seg.shortLabel}:</span>
                    <span className="font-mono tabular-nums" dir="ltr">{seg.count}</span>
                    <span className="font-mono tabular-nums text-cyan-300" dir="ltr">({seg.pct}%)</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Segment Footnote */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <span>
              {isAr ? 'المشاريع النشطة بالتنفيذ والتسليم:' : 'Active in execution & delivery:'}{' '}
              <strong className="text-slate-900 dark:text-white font-mono tabular-nums" dir="ltr">
                {portfolioMetrics.activeInFlightCount}
              </strong>{' '}
              (<bdi>{formatCurrency(portfolioMetrics.activeInFlightVal)}</bdi>)
            </span>
            <span>
              {isAr ? 'أوامر التغيير (VOs):' : 'Variation Orders:'}{' '}
              <bdi className="text-emerald-700 dark:text-emerald-400 font-mono tabular-nums font-bold">
                {formatCurrency(portfolioMetrics.totalVos)}
              </bdi>
            </span>
          </div>
        </div>
      </div>

      {/* ─── Detailed Status Distribution Cards Grid ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
        {segments.map((seg) => {
          const isSelected = activeStatus === seg.key;
          const IconComp = seg.icon;
          return (
            <button
              key={seg.key}
              type="button"
              onClick={() => onStatusSelect?.(isSelected ? 'all' : seg.key)}
              className={`p-3.5 rounded-xl border text-start transition-all cursor-pointer shadow-sm focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none flex flex-col justify-between gap-2.5 ${
                isSelected
                  ? `bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/90 dark:hover:bg-slate-800 ${seg.borderColor} ring-2 ${seg.ringColor} shadow-md`
                  : 'bg-slate-50/70 hover:bg-slate-100/90 dark:bg-slate-950/40 dark:hover:bg-slate-900/80 border-slate-200/90 dark:border-slate-800/80'
              }`}
              aria-pressed={isSelected}
              aria-label={`${seg.label}: ${seg.count} ${isAr ? 'مشروع' : 'projects'}`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className={`flex items-center gap-1.5 text-xs font-bold ${seg.textColor}`}>
                  <IconComp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{seg.shortLabel}</span>
                </span>
                <span 
                  className={`text-xs font-mono font-black px-1.5 py-0.5 rounded-md ${seg.badgeBg} ${seg.textColor} tabular-nums`}
                  dir="ltr"
                >
                  {seg.pct}%
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                <div className="text-xl font-black text-slate-900 dark:text-white font-mono tabular-nums" dir="ltr">
                  {seg.count}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate text-end">
                  <bdi>{formatCurrency(seg.val)}</bdi>
                </div>
              </div>
            </button>
          );
        })}
      </div>
        </>
      )}
    </section>
  );
};

export { PortfolioProgressWidgetSkeleton } from '../DashboardSkeletons';

