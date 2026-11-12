'use client';

import React, { useMemo } from 'react';
import { Project } from '@/types';
import { getProjectValueWithVat } from '@/lib/utils/projectValue';
import { resolveProjectRegionName } from '@/lib/geo/regionMatcher';
import { 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Award, 
  Brain 
} from 'lucide-react';

function formatProjectsCountAr(count: number): string {
  if (count === 0) return '0 مشروع';
  if (count === 1) return 'مشروع واحد';
  if (count === 2) return 'مشروعان';
  if (count >= 3 && count <= 10) return `${count} مشاريع`;
  return `${count} مشروعاً`;
}

interface ExecutiveInsightsSectionProps {
  projects: Project[];
  lang?: 'ar' | 'en';
}

export const ExecutiveInsightsSection: React.FC<ExecutiveInsightsSectionProps> = ({
  projects,
}) => {
  const insights = useMemo(() => {
    const totalProjects = projects.length || 1;
    const workingProjects = projects.filter((p) => (p.status || 'working') === 'working');
    const handingProjects = projects.filter((p) => p.status === 'handing_over');
    const holdProjects = projects.filter((p) => p.status === 'on_hold');

    const totalVal = projects.reduce((acc, p) => acc + getProjectValueWithVat(p), 0);
    const totalVos = projects.reduce((acc, p) => acc + Number(p.vos_value || 0), 0);

    // Client concentration insight
    const clientMap: Record<string, number> = {};
    projects.forEach((p) => {
      const cName = p.client?.name_ar || p.client_name_raw || 'غير محدد';
      const val = getProjectValueWithVat(p);
      clientMap[cName] = (clientMap[cName] || 0) + val;
    });

    const sortedClients = Object.entries(clientMap).sort((a, b) => b[1] - a[1]);
    const topClient = sortedClients[0] || ['غير محدد', 0];
    const topClientShare = ((topClient[1] / (totalVal || 1)) * 100).toFixed(1);

    // Top 3 clients share
    const top3Val = (sortedClients[0]?.[1] || 0) + (sortedClients[1]?.[1] || 0) + (sortedClients[2]?.[1] || 0);
    const top3Share = ((top3Val / (totalVal || 1)) * 100).toFixed(1);

    // Regional concentration insight (Grounded in verified governorate / city attributes)
    const regionMap: Record<string, number> = {};
    projects.forEach((p) => {
      const regionName = resolveProjectRegionName(p);
      const val = getProjectValueWithVat(p);
      regionMap[regionName] = (regionMap[regionName] || 0) + val;
    });

    const sortedRegions = Object.entries(regionMap).sort((a, b) => b[1] - a[1]);
    const topRegion = sortedRegions[0] || ['القاهرة الكبرى', 0];
    const topRegionShare = ((topRegion[1] / (totalVal || 1)) * 100).toFixed(1);

    return {
      totalProjects,
      workingCount: workingProjects.length,
      handingCount: handingProjects.length,
      holdCount: holdProjects.length,
      totalVal,
      totalVos,
      voPct: ((totalVos / (totalVal || 1)) * 100).toFixed(1),
      topClientName: topClient[0],
      topClientShare,
      top3Share,
      topRegionName: topRegion[0],
      topRegionShare,
    };
  }, [projects]);

  const formatCurrency = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)} مليار ج.م`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)} مليون ج.م`;
    return `${new Intl.NumberFormat('en-US').format(val)} ج.م`;
  };

  return (
    <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 p-5 border border-emerald-500/20 shadow-xl backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-emerald-500/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-md">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2 flex-wrap">
              <span>{projects.length > 0 ? 'مؤشرات وقرارات الإدارة العليا' : 'مؤشرات الإدارة العليا'}</span>
              <bdi className="text-[11px] font-mono font-medium text-emerald-400/80">
                (Executive Decision Support Engine)
              </bdi>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full animate-pulse">
                AI Automated Insights
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">تحليلات ذكية تلقائية لتسهيل اتخاذ القرارات للـ CEO والـ COO والـ Project Directors</p>
          </div>
        </div>
      </div>

      {/* Grid of 4 Smart Insight Cards with Responsive SVG Micro-Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Insight 1: Market Regional Concentration */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-2 shadow-md min-w-0 w-full overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
            <span className="flex items-center gap-1.5 truncate">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> تمركز عقود المحفظة
            </span>
            <span className="font-mono text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 shrink-0">{insights.topRegionShare}%</span>
          </div>
          <p className="text-xs text-slate-200 font-semibold leading-snug">
            تتركز عقود الشركة الرئيسية في منطقة <strong className="text-emerald-300 font-bold">{insights.topRegionName}</strong> بنسبة <strong>{insights.topRegionShare}%</strong> من القيمة الكلية.
          </p>
          {/* Responsive SVG Micro-Meter */}
          <div className="w-full min-w-0 pt-1" aria-hidden="true">
            <svg className="w-full h-1.5 rounded-full overflow-hidden" viewBox="0 0 100 6" preserveAspectRatio="none">
              <rect x="0" y="0" width="100" height="6" rx="3" fill="#1e293b" />
              <rect
                x="0"
                y="0"
                width={Math.min(100, Math.max(3, Number(insights.topRegionShare) || 0))}
                height="6"
                rx="3"
                fill="#10b981"
                className="transition-all duration-500"
              />
            </svg>
          </div>
        </div>

        {/* Insight 2: Top Clients Portfolio Share */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 space-y-2 shadow-md min-w-0 w-full overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
            <span className="flex items-center gap-1.5 truncate">
              <Award className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> تركيز العملاء الرئيسيين
            </span>
            <span className="font-mono text-[10px] bg-emerald-950 px-2 py-0.5 rounded border border-emerald-900 shrink-0">{insights.top3Share}%</span>
          </div>
          <p className="text-xs text-slate-200 font-semibold leading-snug">
            أكبر 3 عملاء يمثلون <strong className="text-emerald-300 font-bold">{insights.top3Share}%</strong> من عقود المحفظة، بقيادة <strong className="text-white">{insights.topClientName}</strong> ({insights.topClientShare}%).
          </p>
          {/* Responsive SVG Stacked Micro-Meter */}
          <div className="w-full min-w-0 pt-1" aria-hidden="true">
            <svg className="w-full h-1.5 rounded-full overflow-hidden" viewBox="0 0 100 6" preserveAspectRatio="none">
              <rect x="0" y="0" width="100" height="6" rx="3" fill="#1e293b" />
              <rect
                x="0"
                y="0"
                width={Math.min(100, Math.max(3, Number(insights.top3Share) || 0))}
                height="6"
                rx="3"
                fill="#059669"
                className="transition-all duration-500"
              />
              <rect
                x="0"
                y="0"
                width={Math.min(100, Math.max(2, Number(insights.topClientShare) || 0))}
                height="6"
                rx="3"
                fill="#6366f1"
                className="transition-all duration-500"
              />
            </svg>
          </div>
        </div>

        {/* Insight 3: Variation Orders Impact */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-2 shadow-md min-w-0 w-full overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-cyan-400">
            <span className="flex items-center gap-1.5 truncate">
              <DollarSign className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> تأثير أرقام التغيير (VOs)
            </span>
            <span className="font-mono text-[10px] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 shrink-0">{insights.voPct}%</span>
          </div>
          <p className="text-xs text-slate-200 font-semibold leading-snug">
            أوامر التغيير المعتمدة بلغت <strong className="text-cyan-300 font-bold"><bdi>{formatCurrency(insights.totalVos)}</bdi></strong> بنسبة <strong>{insights.voPct}%</strong> أرباح إضافية على الأصل.
          </p>
          {/* Responsive SVG VO Micro-Meter */}
          <div className="w-full min-w-0 pt-1" aria-hidden="true">
            <svg className="w-full h-1.5 rounded-full overflow-hidden" viewBox="0 0 100 6" preserveAspectRatio="none">
              <rect x="0" y="0" width="100" height="6" rx="3" fill="#1e293b" />
              <rect
                x="0"
                y="0"
                width={Math.min(100, Math.max(3, Number(insights.voPct) || 0))}
                height="6"
                rx="3"
                fill="#06b6d4"
                className="transition-all duration-500"
              />
            </svg>
          </div>
        </div>

        {/* Insight 4: Operational Risk & Handover */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-2 shadow-md min-w-0 w-full overflow-hidden">
          <div className="flex items-center justify-between text-xs font-bold text-amber-400">
            <span className="flex items-center gap-1.5 truncate">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> متابعة التسليمات والتعثر
            </span>
            <span className="font-mono text-[10px] bg-amber-950 px-2 py-0.5 rounded border border-amber-800 shrink-0">{formatProjectsCountAr(insights.handingCount + insights.holdCount)}</span>
          </div>
          <p className="text-xs text-slate-200 font-semibold leading-snug">
            يوجد <strong className="text-amber-300 font-bold">{formatProjectsCountAr(insights.handingCount)}</strong> بمرحلة التسليم الابتدائي و <strong className="text-rose-400 font-bold">{formatProjectsCountAr(insights.holdCount)}</strong> تتطلب مراجعة.
          </p>
          {/* Responsive SVG Split Risk Micro-Meter */}
          <div className="w-full min-w-0 pt-1" aria-hidden="true">
            <svg className="w-full h-1.5 rounded-full overflow-hidden" viewBox="0 0 100 6" preserveAspectRatio="none">
              <rect x="0" y="0" width="100" height="6" rx="3" fill="#1e293b" />
              <rect
                x="0"
                y="0"
                width={Math.min(100, Math.max(0, ((insights.handingCount) / (insights.totalProjects || 1)) * 100))}
                height="6"
                rx="3"
                fill="#f59e0b"
                className="transition-all duration-500"
              />
              <rect
                x={Math.min(96, Math.max(0, ((insights.handingCount) / (insights.totalProjects || 1)) * 100))}
                y="0"
                width={Math.min(100, Math.max(0, ((insights.holdCount) / (insights.totalProjects || 1)) * 100))}
                height="6"
                rx="3"
                fill="#f43f5e"
                className="transition-all duration-500"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ExecutiveInsightsSectionSkeleton } from '../DashboardSkeletons';

