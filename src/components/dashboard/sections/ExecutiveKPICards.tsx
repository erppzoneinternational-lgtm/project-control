'use client';

import React, { useMemo } from 'react';
import { Project } from '@/types';
import { getProjectValueWithVat } from '@/lib/utils/projectValue';
import { 
  Building2, 
  DollarSign, 
  Calculator, 
  Compass, 
  Sparkles, 
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';

interface ExecutiveKPICardsProps {
  filteredProjects: Project[];
  totalProjectsCount?: number;
  activeStatus?: string;
  onStatusCardClick?: (status: string) => void;
}

export const ExecutiveKPICards: React.FC<ExecutiveKPICardsProps> = ({
  filteredProjects = [],
  activeStatus = 'all',
  onStatusCardClick,
}) => {
  const safeProjects = useMemo(() => Array.isArray(filteredProjects) ? filteredProjects : [], [filteredProjects]);

  const metrics = useMemo(() => {
    const active = safeProjects.filter((p) => (p.status || 'working') === 'working').length;
    const finished = safeProjects.filter((p) => p.status === 'finished').length;
    const handing = safeProjects.filter((p) => p.status === 'handing_over').length;
    const hold = safeProjects.filter((p) => p.status === 'on_hold').length;
    const cancelled = safeProjects.filter((p) => p.status === 'cancelled').length;

    const totalVal = safeProjects.reduce((acc, p) => acc + getProjectValueWithVat(p), 0);

    const totalVos = safeProjects.reduce((acc, p) => acc + Number(p?.vos_value || 0), 0);
    const totalArea = safeProjects.reduce((acc, p) => acc + Number(p?.water_area_m2 || p?.total_water_area_m2 || 0), 0);
    const totalVol = safeProjects.reduce((acc, p) => acc + Number(p?.water_vol_m3 || p?.total_water_volume_m3 || 0), 0);

    const validAreaProjects = safeProjects.filter((p) => Number(p?.water_area_m2 || p?.total_water_area_m2 || 0) > 0);
    const avgCostM2 = validAreaProjects.length > 0 && totalArea > 0
      ? Math.round(validAreaProjects.reduce((a, p) => a + Number(p?.contract_value_egp || p?.contract_value || 0), 0) / totalArea)
      : 0;

    const validVolProjects = safeProjects.filter((p) => Number(p?.water_vol_m3 || p?.total_water_volume_m3 || 0) > 0);
    const avgCostM3 = validVolProjects.length > 0 && totalVol > 0
      ? Math.round(validVolProjects.reduce((a, p) => a + Number(p?.contract_value_egp || p?.contract_value || 0), 0) / totalVol)
      : 0;

    return {
      active,
      finished,
      handing,
      hold,
      cancelled,
      totalVal,
      totalVos,
      totalArea,
      totalVol,
      avgCostM2,
      avgCostM3,
    };
  }, [safeProjects]);

  const formatCurrency = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)} مليار ج.م`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)} مليون ج.م`;
    return `${new Intl.NumberFormat('en-US').format(val)} ج.م`;
  };

  const statusBreakdown = useMemo(() => {
    const total = safeProjects.length || 1;
    return [
      { key: 'working', label: 'قيد التنفيذ', labelEn: 'Working', count: metrics.active, color: 'from-cyan-500 to-blue-500', bg: '#06B6D4' },
      { key: 'finished', label: 'منتهي', labelEn: 'Finished', count: metrics.finished, color: 'from-emerald-500 to-teal-400', bg: '#10B981' },
      { key: 'handing_over', label: 'تسليم ابتدائي', labelEn: 'Handing Over', count: metrics.handing, color: 'from-indigo-500 to-purple-500', bg: '#6366F1' },
      { key: 'on_hold', label: 'متوقف', labelEn: 'On Hold', count: metrics.hold, color: 'from-amber-500 to-yellow-400', bg: '#F59E0B' },
      { key: 'cancelled', label: 'ملغي', labelEn: 'Cancelled', count: metrics.cancelled, color: 'from-rose-500 to-red-500', bg: '#F43F5E' },
    ].map((b) => ({
      ...b,
      pct: Math.round((b.count / total) * 100),
      heightPct: Math.max(25, Math.round((b.count / total) * 100)),
    }));
  }, [safeProjects.length, metrics]);

  return (
    <div className="space-y-4" data-testid="executive-kpi-cards">
      {/* Primary KPI Row with Dynamic Interactive Power BI Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Total Projects Card */}
        <div 
          role="button"
          tabIndex={0}
          aria-label={`إجمالي المشاريع بالمحفظة: ${filteredProjects.length} مشروع. انقر لعرض الكل`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStatusCardClick?.('all'); } }}
          onClick={() => onStatusCardClick?.('all')}
          className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 p-5 border border-slate-200/90 dark:border-slate-800 contrast-more:border-slate-500 hover:border-cyan-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all duration-300 shadow-xl cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none"
        >
          <div className="absolute top-0 end-0 start-0 h-1.5 bg-gradient-to-r from-cyan-500 to-blue-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-normal">إجمالي المشاريع بالمحفظة</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>
          
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums" dir="ltr">{filteredProjects.length}</div>
            <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" aria-hidden="true" /> <span dir="ltr" className="tabular-nums">{Math.round((metrics.active / (filteredProjects.length || 1)) * 100)}%</span>
            </span>
          </div>

          {/* Interactive Dynamic Sparkline Bar Chart */}
          <div className="flex items-end gap-1.5 h-7 mt-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            {statusBreakdown.map((bar) => (
              <div
                key={bar.key}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusCardClick?.(bar.key);
                }}
                title={`${bar.label}: ${bar.count} مشروع (${bar.pct}%) - انقر للتصفية`}
                className={`flex-1 bg-gradient-to-t ${bar.color} rounded-t transition-all duration-200 cursor-pointer hover:scale-110 hover:brightness-125 relative group/bar`}
                style={{ height: `${bar.heightPct}%` }}
              >
                <div className="opacity-0 group-hover/bar:opacity-100 pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md whitespace-nowrap z-30 shadow-xl border border-slate-800 transition-opacity">
                  {bar.count} ({bar.pct}%)
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs font-semibold">
            <span className="text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />
              <span><span className="font-mono tabular-nums" dir="ltr">{metrics.active}</span> تنفيذ</span>
            </span>
            <span className="text-slate-400" aria-hidden="true">•</span>
            <span className="text-emerald-600 dark:text-emerald-400"><span className="font-mono tabular-nums" dir="ltr">{metrics.finished}</span> منتهي</span>
          </div>
        </div>

        {/* Total Contract Value Card */}
        <div 
          role="button"
          tabIndex={0}
          aria-label={`إجمالي قيمة العقود: ${formatCurrency(metrics.totalVal)}. انقر لعرض الكل`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStatusCardClick?.('all'); } }}
          onClick={() => onStatusCardClick?.('all')}
          className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 p-5 border border-slate-200/90 dark:border-slate-800 contrast-more:border-slate-500 hover:border-emerald-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all duration-300 shadow-xl cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
        >
          <div className="absolute top-0 end-0 start-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-normal">إجمالي قيمة العقود (شامل الفروق)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight tabular-nums">
              <bdi>{formatCurrency(metrics.totalVal)}</bdi>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <bdi>{metrics.totalVal > 0 && metrics.totalVos > 0 ? `${((metrics.totalVos / metrics.totalVal) * 100).toFixed(1)}% VOs` : 'عقود معتمدة'}</bdi>
            </span>
          </div>

          {/* Interactive Dynamic Sparkline Bar Chart */}
          <div className="flex items-end gap-1.5 h-7 mt-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            {statusBreakdown.map((bar) => (
              <div
                key={bar.key}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusCardClick?.(bar.key);
                }}
                title={`${bar.label}: ${bar.count} مشروع (${bar.pct}%) - انقر للتصفية`}
                className={`flex-1 bg-gradient-to-t ${bar.color} rounded-t transition-all duration-200 cursor-pointer hover:scale-110 hover:brightness-125 relative group/bar`}
                style={{ height: `${bar.heightPct}%` }}
              >
                <div className="opacity-0 group-hover/bar:opacity-100 pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md whitespace-nowrap z-30 shadow-xl border border-slate-800 transition-opacity">
                  {bar.count} ({bar.pct}%)
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>يتضمن <bdi className="font-mono tabular-nums">{formatCurrency(metrics.totalVos)}</bdi> أرقام تغيير (VOs)</span>
          </p>
        </div>

        {/* Cost per m² Card */}
        <div 
          role="button"
          tabIndex={0}
          aria-label={`متوسط تكلفة التسطيح المائي: ${metrics.avgCostM2.toLocaleString('en-US')} ج.م / م²`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStatusCardClick?.('all'); } }}
          onClick={() => onStatusCardClick?.('all')}
          className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 p-5 border border-slate-200/90 dark:border-slate-800 contrast-more:border-slate-500 hover:border-blue-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all duration-300 shadow-xl cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
        >
          <div className="absolute top-0 end-0 start-0 h-1.5 bg-gradient-to-r from-blue-500 to-emerald-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-normal">متوسط تكلفة التسطيح المائي</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calculator className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-blue-700 dark:text-blue-300 font-mono tabular-nums flex items-baseline gap-1.5" dir="ltr">
              <span>{metrics.avgCostM2 > 0 ? metrics.avgCostM2.toLocaleString('en-US') : '—'}</span>
              <bdi className="text-xs font-sans text-slate-500 dark:text-slate-400">ج.م / م²</bdi>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <bdi>معدل مسطح</bdi>
            </span>
          </div>

          {/* Interactive Dynamic Sparkline Bar Chart */}
          <div className="flex items-end gap-1.5 h-7 mt-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            {statusBreakdown.map((bar) => (
              <div
                key={bar.key}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusCardClick?.(bar.key);
                }}
                title={`${bar.label}: ${bar.count} مشروع (${bar.pct}%) - انقر للتصفية`}
                className={`flex-1 bg-gradient-to-t ${bar.color} rounded-t transition-all duration-200 cursor-pointer hover:scale-110 hover:brightness-125 relative group/bar`}
                style={{ height: `${bar.heightPct}%` }}
              >
                <div className="opacity-0 group-hover/bar:opacity-100 pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md whitespace-nowrap z-30 shadow-xl border border-slate-800 transition-opacity">
                  {bar.count} ({bar.pct}%)
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-2">
            إجمالي المسطحات: <span className="font-mono tabular-nums" dir="ltr">{metrics.totalArea.toLocaleString('en-US')}</span> <bdi>م²</bdi>
          </p>
        </div>

        {/* Cost per m³ Card */}
        <div 
          role="button"
          tabIndex={0}
          aria-label={`متوسط تكلفة التكعيب الهيدروليكي: ${metrics.avgCostM3.toLocaleString('en-US')} ج.م / م³`}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStatusCardClick?.('all'); } }}
          onClick={() => onStatusCardClick?.('all')}
          className="group relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900/90 p-5 border border-slate-200/90 dark:border-slate-800 contrast-more:border-slate-500 hover:border-purple-500/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all duration-300 shadow-xl cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none"
        >
          <div className="absolute top-0 end-0 start-0 h-1.5 bg-gradient-to-r from-purple-500 to-pink-500" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-normal">متوسط تكلفة التكعيب الهيدروليكي</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Compass className="w-4 h-4" aria-hidden="true" />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-purple-700 dark:text-purple-300 font-mono tabular-nums flex items-baseline gap-1.5" dir="ltr">
              <span>{metrics.avgCostM3 > 0 ? metrics.avgCostM3.toLocaleString('en-US') : '—'}</span>
              <bdi className="text-xs font-sans text-slate-500 dark:text-slate-400">ج.م / م³</bdi>
            </div>
            <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <bdi>معدل حجمي</bdi>
            </span>
          </div>

          {/* Interactive Dynamic Sparkline Bar Chart */}
          <div className="flex items-end gap-1.5 h-7 mt-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
            {statusBreakdown.map((bar) => (
              <div
                key={bar.key}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusCardClick?.(bar.key);
                }}
                title={`${bar.label}: ${bar.count} مشروع (${bar.pct}%) - انقر للتصفية`}
                className={`flex-1 bg-gradient-to-t ${bar.color} rounded-t transition-all duration-200 cursor-pointer hover:scale-110 hover:brightness-125 relative group/bar`}
                style={{ height: `${bar.heightPct}%` }}
              >
                <div className="opacity-0 group-hover/bar:opacity-100 pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-md whitespace-nowrap z-30 shadow-xl border border-slate-800 transition-opacity">
                  {bar.count} ({bar.pct}%)
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-2">
            إجمالي الحجم: <span className="font-mono tabular-nums" dir="ltr">{metrics.totalVol.toLocaleString('en-US')}</span> <bdi>م³</bdi>
          </p>
        </div>
      </div>

      {/* Secondary Interactive Status Filter Badges Row */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
        <button
          type="button"
          onClick={() => onStatusCardClick?.(activeStatus === 'working' ? 'all' : 'working')}
          aria-label={`تصفية المشاريع قيد التنفيذ: ${metrics.active} مشروع`}
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm group cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none ${
            activeStatus === 'working'
              ? 'ring-2 ring-cyan-500 bg-cyan-500/15 border-cyan-500 shadow-md'
              : 'bg-white dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 group-hover:text-cyan-500 transition-colors">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 dark:bg-cyan-400 animate-pulse" aria-hidden="true" />
            <span>قيد التنفيذ</span>
            <bdi className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500">(Working)</bdi>
          </span>
          <span className="font-mono text-cyan-600 dark:text-cyan-400 font-black tabular-nums" dir="ltr">{metrics.active}</span>
        </button>

        <button
          type="button"
          onClick={() => onStatusCardClick?.(activeStatus === 'finished' ? 'all' : 'finished')}
          aria-label={`تصفية المشاريع المنتهية: ${metrics.finished} مشروع`}
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm group cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none ${
            activeStatus === 'finished'
              ? 'ring-2 ring-emerald-500 bg-emerald-500/15 border-emerald-500 shadow-md'
              : 'bg-white dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 group-hover:text-emerald-500 transition-colors">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>منتهي</span>
            <bdi className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500">(Finished)</bdi>
          </span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black tabular-nums" dir="ltr">{metrics.finished}</span>
        </button>

        <button
          type="button"
          onClick={() => onStatusCardClick?.(activeStatus === 'handing_over' ? 'all' : 'handing_over')}
          aria-label={`تصفية مشاريع التسليم الابتدائي: ${metrics.handing} مشروع`}
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm group cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none ${
            activeStatus === 'handing_over'
              ? 'ring-2 ring-indigo-500 bg-indigo-500/15 border-indigo-500 shadow-md'
              : 'bg-white dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 group-hover:text-indigo-500 transition-colors">
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            <span>تسليم ابتدائي</span>
            <bdi className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500">(Handing Over)</bdi>
          </span>
          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black tabular-nums" dir="ltr">{metrics.handing}</span>
        </button>

        <button
          type="button"
          onClick={() => onStatusCardClick?.(activeStatus === 'on_hold' ? 'all' : 'on_hold')}
          aria-label={`تصفية المشاريع المتوقفة: ${metrics.hold} مشروع`}
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm group cursor-pointer focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
            activeStatus === 'on_hold'
              ? 'ring-2 ring-amber-500 bg-amber-500/15 border-amber-500 shadow-md'
              : 'bg-white dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 hover:border-amber-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 group-hover:text-amber-500 transition-colors">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span>متوقف</span>
            <bdi className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500">(On Hold)</bdi>
          </span>
          <span className="font-mono text-amber-600 dark:text-amber-400 font-black tabular-nums" dir="ltr">{metrics.hold}</span>
        </button>

        <button
          type="button"
          onClick={() => onStatusCardClick?.(activeStatus === 'cancelled' ? 'all' : 'cancelled')}
          aria-label={`تصفية المشاريع الملغاة: ${metrics.cancelled} مشروع`}
          className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all shadow-sm group cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none ${
            activeStatus === 'cancelled'
              ? 'ring-2 ring-rose-500 bg-rose-500/15 border-rose-500 shadow-md'
              : 'bg-white dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 hover:border-rose-500/50 hover:bg-slate-50 dark:hover:bg-slate-800/60'
          }`}
        >
          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5 group-hover:text-rose-500 transition-colors">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 dark:bg-rose-400" aria-hidden="true" />
            <span>ملغي</span>
            <bdi className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500">(Cancelled)</bdi>
          </span>
          <span className="font-mono text-rose-600 dark:text-rose-400 font-black tabular-nums" dir="ltr">{metrics.cancelled}</span>
        </button>
      </div>
    </div>
  );
};

export { ExecutiveKPICardsSkeleton } from '../DashboardSkeletons';

