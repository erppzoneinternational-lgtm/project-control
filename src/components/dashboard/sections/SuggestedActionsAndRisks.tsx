'use client';

import React, { useMemo } from 'react';
import { Project } from '@/types';
import { 
  Zap, 
  AlertTriangle, 
  TrendingUp, 
  ShieldAlert, 
  ArrowRightLeft, 
  CheckCircle2, 
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { getProjectValueWithVat } from '@/lib/utils/projectValue';
import { resolveProjectRegionName } from '@/lib/geo/regionMatcher';

function formatProjectsCountAr(count: number): string {
  if (count === 0) return '0 مشروع';
  if (count === 1) return 'مشروع واحد';
  if (count === 2) return 'مشروعان';
  if (count >= 3 && count <= 10) return `${count} مشاريع`;
  return `${count} مشروعاً`;
}

function formatSitesCountAr(count: number): string {
  if (count === 0) return '0 موقع';
  if (count === 1) return 'موقع واحد';
  if (count === 2) return 'موقعان';
  if (count >= 3 && count <= 10) return `${count} مواقع`;
  return `${count} موقعاً`;
}

interface SuggestedActionsAndRisksProps {
  projects: Project[];
  onProjectSelect?: (projectId: string) => void;
  lang?: 'ar' | 'en';
}

export const SuggestedActionsAndRisks: React.FC<SuggestedActionsAndRisksProps> = ({
  projects,
  onProjectSelect,
  lang = 'ar',
}) => {
  const analysis = useMemo(() => {
    // 1. Calculate Risk Projects
    const onHold = projects.filter((p) => p.status === 'on_hold');
    const handingOver = projects.filter((p) => p.status === 'handing_over');

    // Highest Value Project
    const highestValueProject = [...projects].sort((a, b) => {
      const valA = getProjectValueWithVat(a);
      const valB = getProjectValueWithVat(b);
      return valB - valA;
    })[0];

    // Highest Unit Cost / Area Project
    const highestAreaProject = [...projects].sort((a, b) => {
      const areaA = Number(a.water_area_m2 || a.total_water_area_m2 || 0);
      const areaB = Number(b.water_area_m2 || b.total_water_area_m2 || 0);
      return areaB - areaA;
    })[0];

    // Client Share
    const clientCounts: Record<string, number> = {};
    projects.forEach((p) => {
      const c = p.client_name_raw || p.client?.name_ar || 'عميل خاص';
      clientCounts[c] = (clientCounts[c] || 0) + 1;
    });
    const topClient = Object.entries(clientCounts).sort((a, b) => b[1] - a[1])[0];
    const topClientShare = topClient ? Math.round((topClient[1] / (projects.length || 1)) * 100) : 0;

    // Generated Action Recommendations (Strictly data-driven, no fabricated placeholders)
    const actions: Array<{
      id: string;
      type: 'warning' | 'critical' | 'success';
      badge: string;
      title: string;
      description: string;
      actionText: string;
      projectId?: string;
    }> = [];

    if (onHold.length > 0 && onHold[0]) {
      actions.push({
        id: 'action_on_hold',
        type: 'warning',
        badge: 'مخاطر توقف',
        title: `${formatProjectsCountAr(onHold.length)} متوقفة تتطلب مراجعة تنفيذية عاجلة`,
        description: `مشروع "${onHold[0].project_name || onHold[0].project_code}" متوقف. يُوصى بجدولة اجتماع مع مدير المشروع لحل المعوقات الفنية وتوقيع محاضر الاستلام.`,
        actionText: 'مراجعة أسباب التوقف',
        projectId: onHold[0].id,
      });
    }

    if (topClient && topClientShare >= 30 && projects.length > 0) {
      actions.push({
        id: 'action_concentration',
        type: 'critical',
        badge: 'تركز العملاء',
        title: `العميل "${topClient[0]}" يستحوذ على ${topClientShare}% من المحفظة`,
        description: 'مخاطر تركز اعتمادي مرتفع على عميل رئيسي واحد. يُوصى بتنويع سلة المناقصات والبدء في استهداف عملاء القطاع السياحي والفندقي بالبحر الأحمر.',
        actionText: 'توزيع مخاطر المحفظة',
      });
    }

    if (handingOver.length > 0 && handingOver[0]) {
      actions.push({
        id: 'action_handover',
        type: 'success',
        badge: 'فرصة تحصيل',
        title: `${formatProjectsCountAr(handingOver.length)} جاهزة للتسليم والتحصيل النهائي`,
        description: 'يُوصى بالتعجيل بإجراءات المعاينة مع الاستشاري لاعتماد المستخلصات الختامية وصرف الضمانات البنكية احتجازاً للسيولة.',
        actionText: 'تسريع التحصيل',
        projectId: handingOver[0].id,
      });
    }

    return {
      onHold,
      handingOver,
      highestValueProject,
      highestAreaProject,
      actions,
    };
  }, [projects]);

  const formatCurrency = (val: number) => {
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M EGP`;
    return `${val.toLocaleString()} EGP`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Side: Suggested Executive Actions Engine (lg:col-span-7) */}
      <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900/90 p-5 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                محرك الإجراءات التنفيذية المقترحة (Suggested Actions Engine)
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  AI Decision Support
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">توصيات تشغيلية مدعومة بالبيانات لتقليل زمن اتخاذ القرار الإداري</p>
            </div>
          </div>
        </div>

        {/* Action Cards Stream */}
        <div className="space-y-3">
          {analysis.actions.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
              لا توجد إجراءات حرجة معلقة حالياً - المحفظة تسير وفق الخطة المعتمدة.
            </div>
          ) : (
            analysis.actions.map((act) => (
              <div
                key={act.id}
                className={`p-3.5 rounded-xl border transition-all space-y-2 ${
                  act.type === 'critical'
                    ? 'bg-rose-500/5 border-rose-500/30 text-slate-900 dark:text-slate-100 hover:bg-rose-500/10 dark:hover:bg-rose-500/10 hover:border-rose-500/50'
                    : act.type === 'warning'
                    ? 'bg-amber-500/5 border-amber-500/30 text-slate-900 dark:text-slate-100 hover:bg-amber-500/10 dark:hover:bg-amber-500/10 hover:border-amber-500/50'
                    : 'bg-emerald-500/5 border-emerald-500/30 text-slate-900 dark:text-slate-100 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/10 hover:border-emerald-500/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono ${
                      act.type === 'critical'
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                        : act.type === 'warning'
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    {act.badge}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-cyan-500" /> إجراء موصى به
                  </span>
                </div>

                <div className="font-bold text-xs leading-snug">{act.title}</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{act.description}</p>

                {act.projectId && (
                  <div className="pt-1 flex justify-end">
                    <Link
                      href={`/projects/${act.projectId}`}
                      onClick={() => onProjectSelect?.(act.projectId!)}
                      className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:underline flex items-center gap-1 transition-colors"
                    >
                      <span>{act.actionText}</span>
                      <ChevronLeft className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Side: Top Operational Risks Matrix (lg:col-span-5) */}
      <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900/90 p-5 border border-slate-200 dark:border-slate-800 shadow-xl backdrop-blur-xl flex flex-col justify-between space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">مصفوفة المخاطر الأكبر (Top Operational Risks)</h3>
          </div>
          <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
            Realtime Audit
          </span>
        </div>

        <div className="space-y-3">
          {/* Risk 1: Highest Value Focus */}
          {analysis.highestValueProject && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 transition-colors flex items-center justify-between gap-3">
              <div className="space-y-0.5 truncate">
                <div className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> أعلى قيمة تعاقدية مهددة
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                  {analysis.highestValueProject.id ? (
                    <Link
                      href={`/projects/${analysis.highestValueProject.id}`}
                      onClick={() => onProjectSelect?.(analysis.highestValueProject.id)}
                      className="hover:underline hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors"
                    >
                      {analysis.highestValueProject.project_name}
                    </Link>
                  ) : (
                    analysis.highestValueProject.project_name
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {analysis.highestValueProject.client_name_raw || analysis.highestValueProject.client?.name_ar}
                </div>
              </div>
              <div className="text-start font-mono shrink-0">
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  <bdi>{formatCurrency(getProjectValueWithVat(analysis.highestValueProject))}</bdi>
                </div>
                <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {analysis.highestValueProject.completion_pct !== undefined && analysis.highestValueProject.completion_pct !== null
                    ? <bdi>{analysis.highestValueProject.completion_pct}% إنجاز</bdi>
                    : '—'}
                </span>
              </div>
            </div>
          )}

          {/* Risk 2: Highest Area Scope */}
          {analysis.highestAreaProject && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-900/80 transition-colors flex items-center justify-between gap-3">
              <div className="space-y-0.5 truncate">
                <div className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3" /> أكبر مساحة مائية قيد المتابعة
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                  {analysis.highestAreaProject.id ? (
                    <Link
                      href={`/projects/${analysis.highestAreaProject.id}`}
                      onClick={() => onProjectSelect?.(analysis.highestAreaProject.id)}
                      className="hover:underline hover:text-cyan-700 dark:hover:text-cyan-400 transition-colors"
                    >
                      {analysis.highestAreaProject.project_name}
                    </Link>
                  ) : (
                    analysis.highestAreaProject.project_name
                  )}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {resolveProjectRegionName(analysis.highestAreaProject)}
                </div>
              </div>
              <div className="text-start font-mono shrink-0">
                <div className="text-xs font-black text-cyan-600 dark:text-cyan-400">
                  <span>{Number(analysis.highestAreaProject.water_area_m2 || analysis.highestAreaProject.total_water_area_m2 || 0).toLocaleString()}</span>{' '}
                  <bdi>م²</bdi>
                </div>
                <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                  مائي مباشر
                </span>
              </div>
            </div>
          )}

          {/* Risk 3: On Hold Alert Summary */}
          {analysis.onHold.length > 0 ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/15 dark:hover:bg-amber-500/15 transition-colors flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> تنبيه التوقف المؤقت
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  {formatProjectsCountAr(analysis.onHold.length)} متوقفة تتطلب مراجعة
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/20 px-2 py-1 rounded-lg">
                {formatSitesCountAr(analysis.onHold.length)}
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/15 dark:hover:bg-emerald-500/15 transition-colors flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> انتظام المواقع
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                  لا توجد مشاريع متوقفة حالياً
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded-lg">
                0 متوقف
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { SuggestedActionsAndRisksSkeleton } from '../DashboardSkeletons';

