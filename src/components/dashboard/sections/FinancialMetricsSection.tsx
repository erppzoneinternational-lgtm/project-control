'use client';

import React, { useMemo, useState } from 'react';
import { Project } from '@/types';
import { getProjectValueWithVat } from '@/lib/utils/projectValue';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Table as TableIcon,
  BarChart3,
  Layers,
  Sparkles,
} from 'lucide-react';

export interface FinancialMetricsSectionProps {
  projects: Project[];
  activeStatus?: string;
  onStatusSelect?: (status: string) => void;
  lang?: 'ar' | 'en';
  className?: string;
}

const STAGE_CONFIG: Record<
  string,
  { labelAr: string; labelEn: string; color: string; border: string }
> = {
  working: {
    labelAr: 'قيد التنفيذ (Working)',
    labelEn: 'Working',
    color: '#06B6D4',
    border: 'border-cyan-500/30',
  },
  finished: {
    labelAr: 'منتهي (Finished)',
    labelEn: 'Finished',
    color: '#10B981',
    border: 'border-emerald-500/30',
  },
  handing_over: {
    labelAr: 'تسليم ابتدائي (Handing)',
    labelEn: 'Handing Over',
    color: '#6366F1',
    border: 'border-indigo-500/30',
  },
  on_hold: {
    labelAr: 'متوقف (On Hold)',
    labelEn: 'On Hold',
    color: '#F59E0B',
    border: 'border-amber-500/30',
  },
  cancelled: {
    labelAr: 'ملغي (Cancelled)',
    labelEn: 'Cancelled',
    color: '#F43F5E',
    border: 'border-rose-500/30',
  },
};

function formatCurrency(val: number): string {
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)} مليار ج.م`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(1)} مليون ج.م`;
  return `${new Intl.NumberFormat('en-US').format(Math.round(val))} ج.م`;
}

function formatAxisValue(val: number): string {
  if (val >= 1e9) return `${(val / 1e9).toFixed(1)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(0)}K`;
  return `${val}`;
}

export const FinancialMetricsSection: React.FC<FinancialMetricsSectionProps> = ({
  projects = [],
  activeStatus = 'all',
  onStatusSelect,
  lang = 'ar',
  className = '',
}) => {
  const isAr = lang === 'ar';
  const [showTable, setShowTable] = useState(false);

  // Financial metrics aggregation
  const { financialData, totalPortfolioValue, totalVosValue, voRatio } = useMemo(() => {
    const buckets: Record<string, { count: number; totalVal: number; vosVal: number }> = {
      working: { count: 0, totalVal: 0, vosVal: 0 },
      finished: { count: 0, totalVal: 0, vosVal: 0 },
      handing_over: { count: 0, totalVal: 0, vosVal: 0 },
      on_hold: { count: 0, totalVal: 0, vosVal: 0 },
      cancelled: { count: 0, totalVal: 0, vosVal: 0 },
    };

    let totalPortfolio = 0;
    let totalVos = 0;

    projects.forEach((p) => {
      const s = p.status || 'working';
      const key = buckets[s] ? s : 'working';
      const pVal = getProjectValueWithVat(p);
      const pVos = Number(p.vos_value || 0);

      buckets[key].count += 1;
      buckets[key].totalVal += pVal;
      buckets[key].vosVal += pVos;

      totalPortfolio += pVal;
      totalVos += pVos;
    });

    const denom = totalPortfolio || 1;
    const data = Object.entries(buckets).map(([key, item]) => {
      const cfg = STAGE_CONFIG[key] || {
        labelAr: key,
        labelEn: key,
        color: '#94A3B8',
        border: 'border-slate-500/30',
      };
      return {
        key,
        name: isAr ? cfg.labelAr : cfg.labelEn,
        shortName: isAr ? cfg.labelAr.split(' ')[0] : cfg.labelEn,
        count: item.count,
        totalVal: item.totalVal,
        vosVal: item.vosVal,
        valInMillions: Number((item.totalVal / 1e6).toFixed(1)),
        sharePct: Number(((item.totalVal / denom) * 100).toFixed(1)),
        color: cfg.color,
      };
    });

    return {
      financialData: data,
      totalPortfolioValue: totalPortfolio,
      totalVosValue: totalVos,
      voRatio: ((totalVos / denom) * 100).toFixed(1),
    };
  }, [projects, isAr]);

  return (
    <section
      aria-labelledby="financial-metrics-title"
      className={`rounded-2xl bg-white/95 dark:bg-slate-900/90 p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800/80 shadow-xl backdrop-blur-xl space-y-5 transition-colors ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
            <DollarSign className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3
              id="financial-metrics-title"
              className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2"
            >
              <span>
                {isAr
                  ? 'مؤشرات التوزيع المالي للمحفظة (Financial Portfolio Metrics)'
                  : 'Financial Portfolio Allocation Metrics'}
              </span>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                EGP Live
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'تحليل دقيق لتوزيع قيم العقود، أوامر التغيير (VOs)، وحجم المحفظة بحسب المراحل'
                : 'Accurate breakdown of contract values, variation orders, and portfolio volume'}
            </p>
          </div>
        </div>

        {/* Financial Highlights & Table Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap self-end sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/70 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {isAr ? 'الإجمالي:' : 'Total:'}
            </span>
            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
              <bdi>{formatCurrency(totalPortfolioValue)}</bdi>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowTable(!showTable)}
            aria-expanded={showTable}
            aria-controls="financial-data-view"
            aria-label={
              showTable
                ? isAr
                  ? 'العودة للرسم البياني المالي'
                  : 'Switch to financial chart'
                : isAr
                ? 'عرض جدول البيانات المالي الميسر'
                : 'Switch to accessible financial table'
            }
            className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
          >
            {showTable ? (
              <>
                <BarChart3 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                <span>{isAr ? 'رسم بياني' : 'Chart View'}</span>
              </>
            ) : (
              <>
                <TableIcon className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                <span>{isAr ? 'جدول البيانات' : 'Data Table'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main View: Chart or Accessible Table */}
      <div id="financial-data-view" className="w-full min-w-0">
        {showTable ? (
          <div className="h-72 sm:h-80 overflow-y-auto rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 p-2">
            <table
              className="w-full text-xs text-start"
              aria-label={isAr ? 'جدول مؤشرات التوزيع المالي' : 'Financial Metrics Table'}
            >
              <caption className="sr-only">
                {isAr
                  ? 'قيم العقود وأوامر التغيير والنسب المئوية لكل مرحلة'
                  : 'Contract values, VOs, and percentages per stage'}
              </caption>
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                  <th scope="col" className="p-2.5 text-start">
                    {isAr ? 'المرحلة التشغيلية' : 'Stage'}
                  </th>
                  <th scope="col" className="p-2.5 text-center">
                    {isAr ? 'عدد المشاريع' : 'Projects'}
                  </th>
                  <th scope="col" className="p-2.5 text-center">
                    {isAr ? 'الحصة من المحفظة' : 'Share %'}
                  </th>
                  <th scope="col" className="p-2.5 text-end">
                    {isAr ? 'أوامر التغيير (VOs)' : 'VOs Value'}
                  </th>
                  <th scope="col" className="p-2.5 text-end">
                    {isAr ? 'إجمالي القيمة' : 'Total Value'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {financialData.map((row) => (
                  <tr
                    key={row.key}
                    className="hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <td className="p-2.5 text-slate-900 dark:text-slate-100 font-bold flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: row.color }}
                        aria-hidden="true"
                      />
                      <span>{row.name}</span>
                    </td>
                    <td className="p-2.5 text-center font-mono text-slate-600 dark:text-slate-400">
                      {row.count}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                      {row.sharePct}%
                    </td>
                    <td className="p-2.5 text-end font-mono text-cyan-600 dark:text-cyan-400">
                      <bdi>{formatCurrency(row.vosVal)}</bdi>
                    </td>
                    <td className="p-2.5 text-end font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      <bdi>{formatCurrency(row.totalVal)}</bdi>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Recharts ResponsiveContainer with debouncing and minWidth={0} to guarantee zero ResizeObserver loop errors */
          <div
            className="w-full min-w-0 h-72 sm:h-80 overflow-hidden"
            role="img"
            aria-label={
              isAr
                ? 'رسم بياني شريطي لمؤشرات التوزيع المالي'
                : 'Bar chart of financial portfolio distribution'
            }
          >
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260} debounce={50}>
              <BarChart
                data={financialData}
                margin={{ top: 15, right: 15, left: 10, bottom: 25 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148, 163, 184, 0.15)"
                  vertical={false}
                />
                <XAxis
                  dataKey="shortName"
                  stroke="#64748B"
                  fontSize={11}
                  interval={0}
                  dy={6}
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
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
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
                    `${formatCurrency(Number(val))} (${item?.payload?.count ?? 0} ${isAr ? 'مشاريع' : 'projects'} - ${item?.payload?.sharePct ?? 0}%)`,
                    isAr ? 'إجمالي القيمة' : 'Total Value',
                  ]}
                />
                <Bar
                  dataKey="totalVal"
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
                  {financialData.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={entry.color}
                      opacity={
                        activeStatus === 'all' || activeStatus === entry.key ? 1 : 0.35
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Interactive Legend & Sub-Metrics Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          {financialData.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => onStatusSelect?.(activeStatus === d.key ? 'all' : d.key)}
              className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                activeStatus === d.key
                  ? 'bg-slate-200 dark:bg-slate-700 border-emerald-500 ring-1 ring-emerald-500'
                  : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
              aria-label={`${d.name}: ${d.count}`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: d.color }}
                aria-hidden="true"
              />
              <span>{d.shortName}</span>
              <span className="font-mono text-slate-400 tabular-nums" dir="ltr">
                ({d.count})
              </span>
            </button>
          ))}
        </div>

        {/* Variation Orders summary badge */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-xl">
          <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
          <span>
            {isAr ? 'أوامر التغيير (VOs):' : 'Approved VOs:'}{' '}
            <strong className="font-mono font-bold"><bdi>{formatCurrency(totalVosValue)}</bdi></strong> ({voRatio}%)
          </span>
        </div>
      </div>
    </section>
  );
};

export const FinancialMetricsSectionSkeleton: React.FC = () => (
  <div className="rounded-2xl bg-white dark:bg-slate-900/90 p-6 border border-slate-200 dark:border-slate-800 space-y-4 animate-pulse">
    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-1.5">
          <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-64 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
      <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
    </div>
    <div className="h-72 w-full bg-slate-100 dark:bg-slate-950/60 rounded-xl" />
  </div>
);
