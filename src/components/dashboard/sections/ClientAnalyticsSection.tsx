'use client';

import React, { useMemo } from 'react';
import { Project, Client } from '@/types';
import { Users, RotateCcw, Plus } from 'lucide-react';
import Link from 'next/link';
import { getProjectValueWithVat } from '@/lib/utils/projectValue';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

function formatProjectsCountAr(count: number): string {
  if (count === 0) return '0 مشروع';
  if (count === 1) return 'مشروع واحد';
  if (count === 2) return 'مشروعان';
  if (count >= 3 && count <= 10) return `${count} مشاريع`;
  return `${count} مشروعاً`;
}

interface ClientAnalyticsSectionProps {
  projects: Project[];
  clientsList?: Client[];
  onClientSelect?: (clientId: string) => void;
  onResetFilters?: () => void;
  lang?: 'ar' | 'en';
}

export const ClientAnalyticsSection: React.FC<ClientAnalyticsSectionProps> = ({
  projects,
  onClientSelect,
  onResetFilters,
  lang = 'ar',
}) => {
  const isAr = lang === 'ar';
  const clientPortfolioData = useMemo(() => {
    const clientMap: Record<string, { id: string; name: string; value: number; count: number }> = {};

    projects.forEach((p) => {
      const clientId = p.client_id || 'raw';
      const clientName = p.client?.name_ar || p.client_name_raw || 'عميل غير محدد';

      if (!clientMap[clientName]) {
        clientMap[clientName] = { id: clientId, name: clientName, value: 0, count: 0 };
      }

      const val = getProjectValueWithVat(p);
      clientMap[clientName].value += val;
      clientMap[clientName].count += 1;
    });

    const entries = Object.values(clientMap).sort((a, b) => b.value - a.value);
    const totalEnterpriseValue = entries.reduce((acc, c) => acc + c.value, 0) || 1;

    return entries.slice(0, 10).map((c) => ({
      ...c,
      displayName: c.name.length > 28 ? c.name.slice(0, 26) + '…' : c.name,
      sharePct: Number(((c.value / totalEnterpriseValue) * 100).toFixed(1)),
    }));
  }, [projects]);

  const [viewMode, setViewMode] = React.useState<'split' | 'chart' | 'list'>('split');

  const formatShortValue = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(0)}M`;
    return String(val);
  };

  const formatFullCurrency = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)} مليار ج.م`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)} مليون ج.م`;
    return `${new Intl.NumberFormat('en-US').format(val)} ج.م`;
  };

  return (
    <div data-testid="client-analytics-section" className="rounded-2xl bg-white dark:bg-slate-900/90 p-6 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span>{isAr ? 'تحليلات تصنيف ومحفظة العملاء' : 'Client Portfolio & Ranking'}</span>
              <bdi className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">
                (Client Portfolio &amp; Ranking)
              </bdi>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                Top 10 Clients
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">تصنيف كبار المطورين والعملاء بحسب قيمة العقود وعدد المشاريع</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold" role="group" aria-label={isAr ? 'نمط عرض تحليلات العملاء' : 'Client view mode'}>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              aria-pressed={viewMode === 'split'}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                viewMode === 'split'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {isAr ? 'عرض مدمج' : 'Split'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('chart')}
              aria-pressed={viewMode === 'chart'}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                viewMode === 'chart'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {isAr ? 'رسم بياني' : 'Chart'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {isAr ? 'كروت تفصيلية' : 'List'}
            </button>
          </div>

          {clientPortfolioData.length > 0 && (
            <span className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl whitespace-nowrap">
              {isAr ? 'أكبر عميل: ' : 'Top Client: '}
              <bdi className="font-bold">{clientPortfolioData[0]?.name}</bdi> ({clientPortfolioData[0]?.sharePct}%)
            </span>
          )}
        </div>
      </div>

      {/* Grid: Bar Chart + Detailed Ranking List OR Empty State */}
      {clientPortfolioData.length === 0 ? (
        <div
          role="status"
          aria-label={isAr ? 'لا توجد بيانات عملاء لعرض التحليلات' : 'No client data available'}
          className="h-80 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-200/80 dark:border-emerald-800/80" aria-hidden="true">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'لا توجد بيانات عملاء لعرض التحليلات' : 'No client data available'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {isAr
                ? 'لا توجد مشاريع مرتبطة بعملاء مطابقة للفلاتر الحالية. يمكنك إعادة ضبط الفلاتر أو إضافة مشروع جديد.'
                : 'No projects linked to clients match current filters. You can reset filters or add a new project.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {onResetFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-colors border border-emerald-200 dark:border-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none cursor-pointer"
                aria-label={isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
              </button>
            )}
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none cursor-pointer"
              aria-label={isAr ? 'إضافة مشروع جديد' : 'Add new project'}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'إضافة مشروع جديد' : 'Add New Project'}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Horizontal Bar Chart (Controlled by viewMode) */}
          {(viewMode === 'split' || viewMode === 'chart') && (
            <div
              className={`${viewMode === 'chart' ? 'lg:col-span-12 h-96' : 'lg:col-span-6 h-80'} min-w-0 w-full overflow-hidden`}
              role="img"
              aria-label="رسم بياني شريطي لأكبر 10 عملاء حسب قيمة العقود"
              dir="ltr"
            >
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260} debounce={50}>
                <BarChart
                  data={clientPortfolioData}
                  layout="vertical"
                  margin={{ top: 10, right: 35, left: 10, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" horizontal={false} />
                  <XAxis type="number" stroke="#64748B" fontSize={10} tickFormatter={(val) => formatShortValue(val)} />
                  <YAxis
                    dataKey="displayName"
                    type="category"
                    stroke="#64748B"
                    fontSize={11}
                    width={viewMode === 'chart' ? 220 : 185}
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
                      fontSize: '11px',
                      direction: 'rtl',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
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
                    labelFormatter={(label: any, items: any) => items?.[0]?.payload?.name || label}
                    formatter={(val: any, _, item: any) => [
                      `${formatFullCurrency(Number(val))} (${formatProjectsCountAr(item.payload.count)} - حصة ${item.payload.sharePct}%)`,
                      'قيمة العقود'
                    ]}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {clientPortfolioData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#6366F1' : index === 1 ? '#06B6D4' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Detailed Client Ranking List (Controlled by viewMode) */}
          {(viewMode === 'split' || viewMode === 'list') && (
            <div
              className={`${
                viewMode === 'list'
                  ? 'lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[500px]'
                  : 'lg:col-span-6 space-y-3 max-h-80'
              } overflow-y-auto pe-1`}
            >
              {clientPortfolioData.map((c, idx) => {
                const isClickable = c.id !== 'raw' && Boolean(onClientSelect);
                return (
                  <div
                    key={c.name}
                    role={isClickable ? 'button' : undefined}
                    tabIndex={isClickable ? 0 : undefined}
                    onClick={() => c.id !== 'raw' && onClientSelect?.(c.id)}
                    onKeyDown={(e) => {
                      if ((e.key === 'Enter' || e.key === ' ') && c.id !== 'raw') {
                        e.preventDefault();
                        onClientSelect?.(c.id);
                      }
                    }}
                    className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 transition-all space-y-1.5 ${
                      isClickable
                        ? 'hover:bg-slate-100 hover:border-emerald-500/40 dark:hover:bg-slate-900/80 dark:hover:border-emerald-500/40 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none'
                        : 'cursor-default'
                    }`}
                    title={isClickable ? (isAr ? 'إضغط لتصفية اللوحة لهذا العميل فقط' : 'Click to filter dashboard for this client') : undefined}
                  >
                    <div className="flex items-center justify-between text-xs font-bold gap-2">
                      <span className="text-slate-900 dark:text-slate-100 flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-black flex items-center justify-center border border-emerald-500/20 shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="truncate max-w-[220px]" title={c.name}>{c.name}</span>
                      </span>
                      <div className="flex items-center gap-1.5 font-mono shrink-0">
                        <span className="text-emerald-700 dark:text-emerald-400 font-black">{c.sharePct}%</span>
                        <span className="text-slate-500 dark:text-slate-400 text-[10px]">(<bdi>{formatFullCurrency(c.value)}</bdi>)</span>
                        <span className="text-slate-600 dark:text-slate-400 text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded">{formatProjectsCountAr(c.count)}</span>
                      </div>
                    </div>

                    <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 overflow-hidden p-0.5" dir="ltr">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-purple-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(3, c.sharePct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { ClientAnalyticsSectionSkeleton } from '../DashboardSkeletons';

