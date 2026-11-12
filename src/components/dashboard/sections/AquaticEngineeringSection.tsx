'use client';

import React, { useMemo } from 'react';
import { Project } from '@/types';
import { getProjectValueWithVat } from '@/lib/utils/projectValue';
import { 
  Droplets, 
  Compass, 
  Calculator, 
  Layers, 
  RotateCcw,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
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

interface AquaticEngineeringSectionProps {
  projects: Project[];
  lang?: 'ar' | 'en';
  onResetFilters?: () => void;
}

export const AquaticEngineeringSection: React.FC<AquaticEngineeringSectionProps> = ({
  projects,
  lang = 'ar',
  onResetFilters,
}) => {
  const isAr = lang === 'ar';
  const aquaticMetrics = useMemo(() => {
    let totalArea = 0;
    let totalVol = 0;
    let totalAreaVal = 0;
    let totalVolVal = 0;
    let validAreaCount = 0;
    let validVolCount = 0;

    const componentCounts: Record<string, { nameAr: string; nameEn: string; count: number; totalVal: number }> = {
      pool: { nameAr: 'حمامات سباحة', nameEn: 'Swimming Pools', count: 0, totalVal: 0 },
      fountain: { nameAr: 'نوافير مائية', nameEn: 'Fountains', count: 0, totalVal: 0 },
      lagoon: { nameAr: 'بحيرات صناعية', nameEn: 'Lagoons & Lakes', count: 0, totalVal: 0 },
      spa: { nameAr: 'سبا وجاكوزي', nameEn: 'Spa & Jacuzzi', count: 0, totalVal: 0 },
      fiber: { nameAr: 'حمامات فايبر', nameEn: 'Fiber Pools', count: 0, totalVal: 0 },
      waterfall: { nameAr: 'شلالات مائية', nameEn: 'Waterfalls', count: 0, totalVal: 0 },
    };

    projects.forEach((p) => {
      const val = getProjectValueWithVat(p);
      const area = Number(p.water_area_m2 || p.total_water_area_m2 || 0);
      const vol = Number(p.water_vol_m3 || p.total_water_volume_m3 || 0);

      if (area > 0) {
        totalArea += area;
        totalAreaVal += val;
        validAreaCount++;
      }
      if (vol > 0) {
        totalVol += vol;
        totalVolVal += val;
        validVolCount++;
      }

      const name = (p.project_name || '').toLowerCase();
      if (name.includes('بحيرة') || name.includes('lagoon') || name.includes('lake')) {
        componentCounts.lagoon.count++;
        componentCounts.lagoon.totalVal += val;
      }
      if (name.includes('نافورة') || name.includes('fountain')) {
        componentCounts.fountain.count++;
        componentCounts.fountain.totalVal += val;
      }
      if (name.includes('سبا') || name.includes('spa') || name.includes('جاكوزي')) {
        componentCounts.spa.count++;
        componentCounts.spa.totalVal += val;
      }
      if (name.includes('fiber') || name.includes('فايبر')) {
        componentCounts.fiber.count++;
        componentCounts.fiber.totalVal += val;
      }
      if (name.includes('شلال') || name.includes('waterfall')) {
        componentCounts.waterfall.count++;
        componentCounts.waterfall.totalVal += val;
      }
      if (name.includes('حمام') || name.includes('pool')) {
        componentCounts.pool.count++;
        componentCounts.pool.totalVal += val;
      }
    });

    const avgCostM2 = validAreaCount > 0 && totalArea > 0 ? Math.round(totalAreaVal / totalArea) : 0;
    const avgCostM3 = validVolCount > 0 && totalVol > 0 ? Math.round(totalVolVal / totalVol) : 0;

    const componentData = Object.values(componentCounts)
      .map((d) => ({
        name: isAr ? d.nameAr : d.nameEn,
        nameAr: d.nameAr,
        nameEn: d.nameEn,
        count: d.count,
        totalVal: d.totalVal,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalArea,
      totalVol,
      avgCostM2,
      avgCostM3,
      validAreaCount,
      validVolCount,
      componentData,
    };
  }, [projects, isAr]);

  const formatCurrency = (val: number) => {
    if (isAr) {
      if (val >= 1e9) return `${(val / 1e9).toFixed(2)} مليار ج.م`;
      if (val >= 1e6) return `${(val / 1e6).toFixed(1)} مليون ج.م`;
      return `${new Intl.NumberFormat('en-US').format(val)} ج.م`;
    }
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B EGP`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M EGP`;
    return `${new Intl.NumberFormat('en-US').format(val)} EGP`;
  };

  return (
    <div data-testid="aquatic-engineering-section" className="rounded-2xl bg-white dark:bg-slate-900/90 p-6 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span>{isAr ? 'تحليلات المقاولات المائية والمحددات الهيدروليكية' : 'Aquatic Engineering & Hydro-Metrics'}</span>
              <bdi className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">
                (Aquatic Engineering &amp; Hydro-Metrics)
              </bdi>
              <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full">
                Phase 4 Complete
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr ? 'تحليل تكلفة المتر المربع والتكعيب المائي ومكونات البحيرات وحمامات السباحة' : 'Analysis of cost per m², hydro cubic volume, and aquatic component breakdown'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs font-bold">
          <span className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-xl">
            {isAr ? 'إجمالي التسطيح: ' : 'Total Area: '}<span className="tabular-nums">{aquaticMetrics.totalArea.toLocaleString()}</span> <bdi>{isAr ? 'م²' : 'm²'}</bdi>
          </span>
          <span className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-xl">
            {isAr ? 'إجمالي التكعيب: ' : 'Total Volume: '}<span className="tabular-nums">{aquaticMetrics.totalVol.toLocaleString()}</span> <bdi>{isAr ? 'م³' : 'm³'}</bdi>
          </span>
        </div>
      </div>

      {/* Grid: Hydro Metric Cards + Component Breakdown Chart OR Empty State */}
      {projects.length === 0 ? (
        <div
          role="status"
          data-testid="aquatic-empty-state"
          aria-label={isAr ? 'لا توجد بيانات مقاولات مائية متاحة' : 'No aquatic engineering data available'}
          className="h-72 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-inner border border-cyan-200/80 dark:border-cyan-800/80" aria-hidden="true">
            <Droplets className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'لا توجد بيانات مقاولات مائية متاحة' : 'No aquatic engineering data available'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {isAr
                ? 'لا توجد مشاريع ذات مسطحات مائية مطابقة لمعايير البحث الحالية. يمكنك إعادة ضبط الفلاتر أو إضافة مشروع جديد.'
                : 'No projects with aquatic features match current filter criteria. You can reset filters or add a new project.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {onResetFilters && (
              <button
                type="button"
                data-testid="aquatic-reset-filters-btn"
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
              data-testid="aquatic-add-project-link"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition-all border border-slate-700 focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:outline-none cursor-pointer"
              aria-label={isAr ? 'إضافة مشروع جديد' : 'Add new project'}
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAr ? 'إضافة مشروع جديد' : 'Add New Project'}</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Side KPI Cards (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-cyan-500" /> {isAr ? 'متوسط تكلفة التسطيح المائي (EGP / m²)' : 'Avg. Water Area Cost (EGP / m²)'}
                </span>
                <span className="font-mono text-cyan-600 dark:text-cyan-400">
                  {aquaticMetrics.validAreaCount} {isAr ? 'مشروع مسجل' : 'projects'}
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {aquaticMetrics.avgCostM2 > 0 ? (
                  <>
                    <span className="tabular-nums">{aquaticMetrics.avgCostM2.toLocaleString()}</span>{' '}
                    <bdi className="text-xs font-sans text-slate-500 dark:text-slate-400">{isAr ? 'ج.م / م²' : 'EGP / m²'}</bdi>
                  </>
                ) : (
                  '—'
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'يشمل الأعمال الإنشائية والألكتروميكانيكية (EMR) والمسطحات المباشرة.' : 'Includes civil, electromechanical (EMR), and direct surface works.'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 transition-colors hover:border-slate-300 dark:hover:border-slate-700">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-purple-500" /> {isAr ? 'متوسط تكلفة التكعيب الهيدروليكي (EGP / m³)' : 'Avg. Hydraulic Volume Cost (EGP / m³)'}
                </span>
                <span className="font-mono text-purple-600 dark:text-purple-400">
                  {aquaticMetrics.validVolCount} {isAr ? 'مشروع مسجل' : 'projects'}
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {aquaticMetrics.avgCostM3 > 0 ? (
                  <>
                    <span className="tabular-nums">{aquaticMetrics.avgCostM3.toLocaleString()}</span>{' '}
                    <bdi className="text-xs font-sans text-slate-500 dark:text-slate-400">{isAr ? 'ج.م / م³' : 'EGP / m³'}</bdi>
                  </>
                ) : (
                  '—'
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'يشمل أنظمة الفلترة، الطلمبات، الكلورين، والتدوير الهيدروليكي.' : 'Includes filtration systems, pumps, chlorination, and hydraulic turnover.'}
              </p>
            </div>
          </div>

          {/* Right Side Bar Chart (lg:col-span-7) */}
          <div className="lg:col-span-7 min-w-0 rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800 space-y-3 transition-colors hover:border-slate-300 dark:hover:border-slate-700" role="img" aria-label={isAr ? 'رسم بياني شريطي لتوزيع وحدات المكونات المائية بالمحفظة' : 'Bar chart of aquatic component distribution in portfolio'}>
            <div className="flex items-center justify-between text-xs font-bold border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-slate-900 dark:text-white font-black flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-500" /> {isAr ? 'توزيع وحدات المكونات المائية بالمحفظة' : 'Aquatic Component Distribution'}
              </span>
            </div>

            <div className="h-56 w-full min-w-0 overflow-hidden" dir="ltr">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200} debounce={50}>
                <BarChart data={aquaticMetrics.componentData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} interval={0} angle={-15} textAnchor="end" tick={{ fill: '#94A3B8' }} />
                  <YAxis stroke="#64748B" fontSize={10} width={25} tick={{ fill: '#94A3B8' }} />
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
                      direction: isAr ? 'rtl' : 'ltr',
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
                    formatter={(val: any, _, item: any) => [
                      `${val} ${isAr ? 'مشروع' : 'projects'} (${formatCurrency(item.payload.totalVal)})`,
                      isAr ? 'عدد المشاريع' : 'Project Count'
                    ]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {aquaticMetrics.componentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#06B6D4' : index === 1 ? '#6366F1' : '#10B981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { AquaticEngineeringSectionSkeleton } from '../DashboardSkeletons';
export default AquaticEngineeringSection;

