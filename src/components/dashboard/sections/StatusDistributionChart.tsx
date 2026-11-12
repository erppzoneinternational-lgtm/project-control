'use client';

import React, { useMemo } from 'react';
import { Project } from '@/types';
import { getProjectValueWithVat } from '@/lib/utils/projectValue';
import { 
  PieChart as PieChartIcon, 
  RotateCcw,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

interface StatusDistributionChartProps {
  projects: Project[];
  activeStatus?: string;
  onStatusSelect?: (status: string) => void;
  onResetFilters?: () => void;
  lang?: 'ar' | 'en';
}

const STATUS_CONFIG: Record<string, { labelAr: string; labelEn: string; color: string }> = {
  finished: { labelAr: 'منتهي', labelEn: 'Finished', color: '#10B981' },
  working: { labelAr: 'قيد التنفيذ', labelEn: 'Working', color: '#06B6D4' },
  handing_over: { labelAr: 'تسليم ابتدائي', labelEn: 'Handing Over', color: '#6366F1' },
  on_hold: { labelAr: 'متوقف', labelEn: 'On Hold', color: '#F59E0B' },
  cancelled: { labelAr: 'ملغي', labelEn: 'Cancelled', color: '#F43F5E' },
};

export const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({
  projects = [],
  activeStatus = 'all',
  onStatusSelect,
  onResetFilters,
  lang = 'ar',
}) => {
  const isAr = lang === 'ar';

  const chartData = useMemo(() => {
    const counts: Record<string, { count: number; totalValue: number }> = {
      finished: { count: 0, totalValue: 0 },
      working: { count: 0, totalValue: 0 },
      handing_over: { count: 0, totalValue: 0 },
      on_hold: { count: 0, totalValue: 0 },
      cancelled: { count: 0, totalValue: 0 },
    };

    projects.forEach((p) => {
      const s = p.status || 'working';
      const key = counts[s] ? s : 'working';
      counts[key].count += 1;
      const val = getProjectValueWithVat(p);
      counts[key].totalValue += val;
    });

    const totalProjects = projects.length || 1;

    return Object.entries(counts).map(([key, data]) => {
      const cfg = STATUS_CONFIG[key] || { labelAr: key, labelEn: key, color: '#94A3B8' };
      return {
        key,
        name: isAr ? cfg.labelAr : cfg.labelEn,
        count: data.count,
        totalValue: data.totalValue,
        valueInMillions: Number((data.totalValue / 1e6).toFixed(1)),
        pct: Math.round((data.count / totalProjects) * 100),
        color: cfg.color,
      };
    });
  }, [projects, isAr]);

  const formatAxisValue = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
    return `${val}`;
  };

  return (
    <div 
      data-testid="status-distribution-chart"
      aria-label={isAr ? 'رسم بياني لتوزيع حالات المشاريع وقيمها' : 'Project Status Distribution and Value Chart'}
      className="rounded-2xl bg-white dark:bg-slate-900/90 p-6 border border-slate-200 dark:border-slate-800 contrast-more:border-slate-500 shadow-xl backdrop-blur-xl space-y-4"
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 contrast-more:border-slate-400">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <PieChartIcon className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span>{isAr ? 'توزيع حالات المشاريع والقيم المالية' : 'Project Status & Financial Distribution'}</span>
              <bdi className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">
                (Project Status &amp; Financial Distribution)
              </bdi>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAr ? 'مقارنة حجم العقود وعدد المشاريع لكل مرحلة تشغيلية' : 'Comparison of contract volume and project count per stage'}
            </p>
          </div>
        </div>

        {activeStatus !== 'all' && (
          <span className="text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-lg">
            {isAr ? 'تصفية نشطة' : 'Filter Active'}
          </span>
        )}
      </div>

      {projects.length === 0 ? (
        <div
          role="status"
          aria-label={isAr ? 'لا توجد بيانات مشاريع لتوزيع الحالات' : 'No project data for status distribution'}
          className="h-72 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-inner border border-cyan-200/80 dark:border-cyan-800/80" aria-hidden="true">
            <PieChartIcon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'لا توجد بيانات مشاريع لتوزيع الحالات' : 'No project data for status distribution'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {isAr
                ? 'لا توجد مشاريع مطابقة للفلاتر المحددة حالياً. يمكنك إعادة ضبط الفلاتر أو إضافة مشروع جديد.'
                : 'No projects match the currently selected filters. You can reset filters or add a new project.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
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
          {/* Bar Chart with Dual Metric Readout & Debounced ResizeObserver Protection */}
          <div className="w-full min-w-0 h-72 overflow-hidden" dir="ltr">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260} debounce={50}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 5, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748B" 
                  fontSize={11} 
                  interval={0} 
                  dy={5}
                  tick={{ fill: '#94A3B8' }}
                />
                <YAxis 
                  stroke="#64748B" 
                  fontSize={10} 
                  width={50} 
                  tickFormatter={formatAxisValue} 
                  tick={{ fill: '#94A3B8' }}
                />
                <Tooltip
                  allowEscapeViewBox={{ x: false, y: false }}
                  wrapperStyle={{ zIndex: 1000, pointerEvents: 'none' }}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                  contentStyle={{ 
                    backgroundColor: 'rgba(11, 19, 43, 0.95)', 
                    borderColor: 'rgba(51, 65, 85, 0.6)', 
                    borderRadius: '12px', 
                    color: '#fff', 
                    fontSize: '12px', 
                    direction: isAr ? 'rtl' : 'ltr',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(8px)',
                    padding: '8px 12px',
                    maxWidth: '280px',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                  itemStyle={{
                    color: '#E2E8F0',
                    fontSize: '11px',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                    padding: '2px 0',
                  }}
                  labelStyle={{
                    color: '#F8FAFC',
                    fontWeight: 'bold',
                    marginBottom: '4px',
                    whiteSpace: 'normal',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                  formatter={(val: any, _: any, item: any) => [
                    `${item.payload.count} ${isAr ? 'مشاريع' : 'projects'} (${(Number(val) / 1e6).toFixed(1)}M EGP - ${item.payload.pct}%)`,
                    isAr ? 'القيمة الإجمالية' : 'Total Value'
                  ]}
                />
                <Bar 
                  dataKey="totalValue" 
                  radius={[6, 6, 0, 0]} 
                  maxBarSize={55}
                  cursor="pointer"
                  onClick={(entry) => {
                    if (entry && onStatusSelect) {
                      const keyStr = String(entry.key ?? '');
                      onStatusSelect(activeStatus === keyStr ? 'all' : keyStr);
                    }
                  }}
                >
                  {chartData.map((entry) => (
                    <Cell 
                      key={entry.key} 
                      fill={entry.color} 
                      opacity={activeStatus === 'all' || activeStatus === entry.key ? 1 : 0.35}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Accessible Interactive Legend */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            {chartData.map((d) => (
              <button
                key={d.key}
                type="button"
                onClick={() => onStatusSelect?.(activeStatus === d.key ? 'all' : d.key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none ${
                  activeStatus === d.key
                    ? 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white border-cyan-500 ring-1 ring-cyan-500'
                    : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/60 dark:hover:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
                aria-label={`${d.name}: ${d.count}`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name}</span>
                <span className="font-mono text-slate-400 tabular-nums" dir="ltr">({d.count})</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export { StatusDistributionChartSkeleton } from '../DashboardSkeletons';
export { FinancialMetricsSection } from './FinancialMetricsSection';

