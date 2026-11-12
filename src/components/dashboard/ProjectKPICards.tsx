'use client';

import React from 'react';
import {
  Clock,
  DollarSign,
  HardHat,
  ShieldAlert,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { PlanningKpis, SiteProductivityKPIs } from '@/types/planning';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProjectKPICardsSkeleton } from './DashboardSkeletons';

export interface ProjectKPICardsProps {
  projectId?: string;
  projectName?: string;
  planningKpis?: Partial<PlanningKpis> | null;
  siteProductivity?: Partial<SiteProductivityKPIs> | null;
  qcPassRate?: number;
  totalWirs?: number;
  className?: string;
  isLoading?: boolean;
}

export const ProjectKPICards: React.FC<ProjectKPICardsProps> = ({
  projectName,
  planningKpis,
  siteProductivity,
  qcPassRate,
  totalWirs,
  className = '',
  isLoading = false,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  // Extract EVM & Site Metrics truthfully without hardcoded fallbacks
  const spi = planningKpis?.spi !== undefined && planningKpis?.spi !== null ? Number(planningKpis.spi) : null;
  const cpi = planningKpis?.cpi !== undefined && planningKpis?.cpi !== null ? Number(planningKpis.cpi) : null;
  const plannedCompletionPct = planningKpis?.planned_completion_pct != null ? Number(planningKpis.planned_completion_pct) : null;
  const actualCompletionPct = planningKpis?.actual_completion_pct != null ? Number(planningKpis.actual_completion_pct) : null;

  const totalObstructions = siteProductivity?.total_obstructions_count ?? null;
  const activeObstructions = siteProductivity?.active_obstructions_count ?? null;
  const totalEotDays = siteProductivity?.total_eot_claimed_days ?? null;
  const totalIdleHours = siteProductivity?.total_idle_manpower_hours ?? null;
  const avgManpower = siteProductivity?.average_daily_manpower ?? null;

  // Site Productivity Index: (actualCompletionPct / plannedCompletionPct) * 100
  const productivityRatio = (plannedCompletionPct != null && plannedCompletionPct > 0 && actualCompletionPct != null)
    ? Math.round((actualCompletionPct / plannedCompletionPct) * 100)
    : null;

  // Health helpers
  const getSpiHealth = (val: number | null) => {
    if (val === null) return { status: 'neutral', labelAr: 'غير متوفر', labelEn: 'N/A', color: 'slate' };
    if (val >= 0.95) return { status: 'healthy', labelAr: 'ضمن المخطط', labelEn: 'On Track', color: 'emerald' };
    if (val >= 0.85) return { status: 'warning', labelAr: 'تأخر طفيف', labelEn: 'Minor Delay', color: 'amber' };
    return { status: 'critical', labelAr: 'تأخر حرج', labelEn: 'Critical Delay', color: 'rose' };
  };

  const getCpiHealth = (val: number | null) => {
    if (val === null) return { status: 'neutral', labelAr: 'غير متوفر', labelEn: 'N/A', color: 'slate' };
    if (val >= 1.0) return { status: 'healthy', labelAr: 'ضمن الميزانية', labelEn: 'Under Budget', color: 'emerald' };
    if (val >= 0.9) return { status: 'warning', labelAr: 'تجاوز طفيف', labelEn: 'Minor Overrun', color: 'amber' };
    return { status: 'critical', labelAr: 'تجاوز حرج', labelEn: 'Over Budget', color: 'rose' };
  };

  const spiHealth = getSpiHealth(spi);
  const cpiHealth = getCpiHealth(cpi);

  if (isLoading) {
    return <ProjectKPICardsSkeleton projectName={projectName} />;
  }

  return (
    <div className={`space-y-4 ${className}`} data-testid="project-kpi-cards">
      {/* Header if Project Name provided */}
      {projectName && (
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isAr ? `المؤشرات التنفيذية لصحة المشروع: ${projectName}` : `Executive Health Indicators: ${projectName}`}
            </h3>
          </div>
        </div>
      )}

      {/* Grid of 5 Executive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Schedule Performance Index (SPI) */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3" data-testid="kpi-card-spi">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'مؤشر أداء الجدول (SPI)' : 'Schedule Index (SPI)'}
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                spiHealth.status === 'healthy'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : spiHealth.status === 'warning'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
              }`}
            >
              <Clock className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white" data-testid="kpi-spi-value">
              {spi !== null ? spi.toFixed(2) : '—'}
            </span>
            <span
              className={`text-[11px] font-bold ${
                spiHealth.status === 'healthy'
                  ? 'text-emerald-600'
                  : spiHealth.status === 'warning'
                  ? 'text-amber-600'
                  : spiHealth.status === 'critical'
                  ? 'text-rose-600'
                  : 'text-slate-400'
              }`}
            >
              {isAr ? spiHealth.labelAr : spiHealth.labelEn}
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
            <div className="flex justify-between">
              <span>{isAr ? 'المنجز الفعلي:' : 'Actual:'}</span>
              <strong className="font-mono text-slate-700 dark:text-slate-300">
                {actualCompletionPct !== null ? `${actualCompletionPct}%` : '—'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'المخطط الأساسي:' : 'Planned:'}</span>
              <strong className="font-mono text-slate-700 dark:text-slate-300">
                {plannedCompletionPct !== null ? `${plannedCompletionPct}%` : '—'}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 2: Cost Performance Index (CPI) */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3" data-testid="kpi-card-cpi">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'مؤشر كفاءة التكلفة (CPI)' : 'Cost Index (CPI)'}
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                cpiHealth.status === 'healthy'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : cpiHealth.status === 'warning'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : cpiHealth.status === 'critical'
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
              }`}
            >
              <DollarSign className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white" data-testid="kpi-cpi-value">
              {cpi !== null ? cpi.toFixed(2) : '—'}
            </span>
            <span
              className={`text-[11px] font-bold ${
                cpiHealth.status === 'healthy'
                  ? 'text-emerald-600'
                  : cpiHealth.status === 'warning'
                  ? 'text-amber-600'
                  : cpiHealth.status === 'critical'
                  ? 'text-rose-600'
                  : 'text-slate-400'
              }`}
            >
              {isAr ? cpiHealth.labelAr : cpiHealth.labelEn}
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
            <div className="flex justify-between">
              <span>{isAr ? 'المستهدف التعاقدي:' : 'Contract Target:'}</span>
              <strong className="font-mono text-slate-700 dark:text-slate-300">1.00</strong>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'القيمة المكتسبة EV:' : 'Earned Value:'}</span>
              <strong className="font-mono text-emerald-600">
                {planningKpis?.earned_value_egp ? `${(planningKpis.earned_value_egp / 1000000).toFixed(1)}M` : '—'}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 3: Site Productivity Index */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3" data-testid="kpi-card-productivity">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'إنتاجية الموقع الميدانية' : 'Site Productivity'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <HardHat className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900 dark:text-white" data-testid="kpi-productivity-value">
              {productivityRatio !== null ? `${productivityRatio}%` : '—'}
            </span>
            {productivityRatio !== null ? (
              <span className="text-[11px] font-bold text-blue-600">
                {productivityRatio >= 90 ? (isAr ? 'وتيرة ممتازة' : 'Pace High') : (isAr ? 'تحتاج تعزيز' : 'Pace Low')}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-slate-400">
                {isAr ? 'غير مسجل' : 'N/A'}
              </span>
            )}
          </div>

          <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
            <div className="flex justify-between">
              <span>{isAr ? 'متوسط العمالة اليومية:' : 'Avg Daily Manpower:'}</span>
              <strong className="font-mono text-slate-700 dark:text-slate-300">
                {avgManpower !== null ? `${avgManpower} ${isAr ? 'عامل' : 'workers'}` : '—'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'ساعات التوقف (Idle):' : 'Idle Hours:'}</span>
              <strong className="font-mono text-rose-600">
                {totalIdleHours !== null ? `${totalIdleHours}h` : '—'}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 4: Active Delay Impact & EOT Exposure */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3" data-testid="kpi-card-eot">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'مطالبات التمديد (EOT Risk)' : 'EOT Claim Exposure'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-purple-700 dark:text-purple-400" data-testid="kpi-eot-value">
              {totalEotDays !== null ? `+${totalEotDays}` : '—'}
            </span>
            <span className="text-xs font-bold text-slate-400">
              {totalEotDays !== null ? (isAr ? 'يوم تمديد' : 'days') : ''}
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
            <div className="flex justify-between">
              <span>{isAr ? 'معوقات نشطة مفتوحة:' : 'Active Obstructions:'}</span>
              <strong className="font-mono text-amber-600">
                {activeObstructions !== null ? `${activeObstructions} ${isAr ? 'عائق' : 'active'}` : '—'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'إجمالي المعوقات:' : 'Total Obstructions:'}</span>
              <strong className="font-mono text-slate-700 dark:text-slate-300">
                {totalObstructions !== null ? totalObstructions : '—'}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 5: QC Pass Rate (First-Pass Inspections) */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-3" data-testid="kpi-card-qc">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'نسبة قبول الجودة (QC WIR)' : 'QC Inspection Pass Rate'}
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-700 dark:text-emerald-400" data-testid="kpi-qc-value">
              {qcPassRate != null ? `${qcPassRate}%` : '—'}
            </span>
            {qcPassRate != null ? (
              <span className="text-[11px] font-bold text-emerald-600">
                {isAr ? 'مطابق للمواصفات' : 'Standard'}
              </span>
            ) : (
              <span className="text-[11px] font-bold text-slate-400">
                {isAr ? 'غير مسجل' : 'N/A'}
              </span>
            )}
          </div>

          <div className="space-y-1 text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
            <div className="flex justify-between">
              <span>{isAr ? 'إجمالي طلبات الفحص WIR:' : 'Total WIRs:'}</span>
              <strong className="font-mono text-slate-700 dark:text-slate-300">
                {totalWirs != null ? `${totalWirs} ${isAr ? 'طلب' : 'inspections'}` : '—'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span>{isAr ? 'الاعتماد من أول فحص:' : 'First-Pass Rate:'}</span>
              <strong className="font-mono text-emerald-600">
                {qcPassRate != null ? `${qcPassRate}%` : '—'}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { ProjectKPICardsSkeleton } from './DashboardSkeletons';

