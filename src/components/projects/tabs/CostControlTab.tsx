'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { CostSnapshot, BudgetLine } from '@/types/cost-control';
import { CostControlService } from '@/lib/services/costControl.service';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Scale, 
  Target, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { isFocusedProjectsMode } from '@/lib/config/module-visibility';

export interface CostControlTabProps {
  project: Project;
  onProjectUpdate?: () => void;
}

export const CostControlTab: React.FC<CostControlTabProps> = ({ project }) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [snapshot, setSnapshot] = useState<CostSnapshot | null>(null);
  const [budgetLines, setBudgetLines] = useState<BudgetLine[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [latestSnap, bLines] = await Promise.all([
        CostControlService.getLatestSnapshot(project.id).catch(() => null),
        CostControlService.getBudgetLines(project.id).catch(() => []),
      ]);
      setSnapshot(latestSnap);
      setBudgetLines(bLines);
    } catch (err) {
      console.error('Failed to load cost control tab data:', err);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fmtCurrency = (val: number | undefined | null) =>
    new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(val || 0);

  // Fallback calculations from project budget if no snapshot is available yet
  const bac = snapshot?.budget_at_completion || Number(project.contract_value_egp || project.contract_value || 0);
  const ev = snapshot?.earned_value || 0;
  const pv = snapshot?.planned_value || 0;
  const ac = snapshot?.actual_cost || 0;
  const cpi = snapshot?.cpi || (ac > 0 ? ev / ac : 1.0);
  const spi = snapshot?.spi || (pv > 0 ? ev / pv : 1.0);
  const cv = snapshot?.cv || ev - ac;
  const sv = snapshot?.sv || ev - pv;
  const eac = snapshot?.eac || (cpi > 0 ? bac / cpi : bac);
  const vac = snapshot?.vac || bac - eac;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 shadow-inner">
            <DollarSign className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              {isAr ? 'مراقبة التكاليف والقيمة المكتسبة (EVM)' : 'Cost Control & Earned Value (EVM)'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? `مؤشرات الأداء المالي والزمني للمشروع وفق منهجية إدارة القيمة المكتسبة EVM`
                : `Earned Value Management performance indices, budget variances & forecast at completion`}
            </p>
          </div>
        </div>

        {!isFocusedProjectsMode() && (
          <div className="flex items-center gap-2">
            <Link
              href="/cost-control"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{isAr ? 'لوحة التحكم بالتكاليف الكاملة' : 'Full Cost Workspace'}</span>
            </Link>
          </div>
        )}
      </div>

      {/* Primary EVM Indicators Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CPI Indicator */}
        <div className="rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{isAr ? 'مؤشر أداء التكلفة CPI' : 'Cost Index (CPI)'}</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${cpi >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {cpi.toFixed(2)}
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {cpi >= 1 ? (isAr ? 'وفر بالتكلفة' : 'Under budget') : (isAr ? 'تجاوز تكلفة' : 'Over budget')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            {isAr ? 'النسبة بين القيمة المكتسبة والتكلفة الفعلية (EV / AC)' : 'EV / AC ratio'}
          </p>
        </div>

        {/* SPI Indicator */}
        <div className="rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{isAr ? 'مؤشر أداء الجدول SPI' : 'Schedule Index (SPI)'}</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black font-mono ${spi >= 1 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {spi.toFixed(2)}
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {spi >= 1 ? (isAr ? 'متقدم عن الجدول' : 'Ahead') : (isAr ? 'متأخر عن الجدول' : 'Behind')}
            </span>
          </div>
          <p className="text-[10px] text-slate-400">
            {isAr ? 'النسبة بين القيمة المكتسبة والمخططة (EV / PV)' : 'EV / PV ratio'}
          </p>
        </div>

        {/* Cost Variance (CV) */}
        <div className="rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{isAr ? 'انحراف التكلفة (CV)' : 'Cost Variance (CV)'}</span>
            <Scale className="w-4 h-4 text-purple-500" />
          </div>
          <div className={`text-xl font-black font-mono ${cv >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`} dir="ltr">
            {cv >= 0 ? `+${fmtCurrency(cv)}` : fmtCurrency(cv)}
          </div>
          <p className="text-[10px] text-slate-400">
            {isAr ? 'الفارق بين القيمة المنجزة والمنصرف الفعلي' : 'EV minus AC'}
          </p>
        </div>

        {/* Estimate At Completion (EAC) */}
        <div className="rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{isAr ? 'التكلفة التقديرية عند الإتمام (EAC)' : 'Forecast at Completion'}</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white" dir="ltr">
            {fmtCurrency(eac)}
          </div>
          <p className="text-[10px] text-slate-400">
            {isAr ? `الانحراف النهائي VAC: ${fmtCurrency(vac)}` : `VAC: ${fmtCurrency(vac)}`}
          </p>
        </div>
      </div>

      {/* EVM Financial Triad: PV vs EV vs AC */}
      <div className="rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Wallet className="w-4 h-4 text-amber-600" />
          <span>{isAr ? 'الثالوث المالي للقيمة المكتسبة (PV, EV, AC)' : 'Earned Value Triad'}</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Planned Value */}
          <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/40 space-y-1">
            <span className="text-xs font-bold text-sky-800 dark:text-sky-300">
              {isAr ? 'القيمة المخططة (Planned Value - PV)' : 'Planned Value (PV)'}
            </span>
            <div className="text-xl font-black font-mono text-sky-900 dark:text-sky-100" dir="ltr">
              {fmtCurrency(pv)}
            </div>
            <p className="text-[10px] text-slate-400">
              {isAr ? 'قيمة الأعمال التي كان من المخطط إنجازها حتى اليوم' : 'Work scheduled to date'}
            </p>
          </div>

          {/* Earned Value */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 space-y-1">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              {isAr ? 'القيمة المكتسبة (Earned Value - EV)' : 'Earned Value (EV)'}
            </span>
            <div className="text-xl font-black font-mono text-emerald-900 dark:text-emerald-100" dir="ltr">
              {fmtCurrency(ev)}
            </div>
            <p className="text-[10px] text-slate-400">
              {isAr ? 'القيمة التعاقدية للأعمال المنفذة فعلياً على أرض الموقع' : 'Budgeted cost of work performed'}
            </p>
          </div>

          {/* Actual Cost */}
          <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 space-y-1">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
              {isAr ? 'التكلفة الفعلية (Actual Cost - AC)' : 'Actual Cost (AC)'}
            </span>
            <div className="text-xl font-black font-mono text-rose-900 dark:text-rose-100" dir="ltr">
              {fmtCurrency(ac)}
            </div>
            <p className="text-[10px] text-slate-400">
              {isAr ? 'التكلفة المنصرفة فعلياً من مشتريات وعمالة ومقاولي باطن' : 'Actual cost of work performed'}
            </p>
          </div>
        </div>
      </div>

      {/* Budget Lines & Packages Breakdown Table */}
      <div className="rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>{isAr ? 'ميزانيات البنود وحزم التكاليف (Budget Lines)' : 'Budget Lines & Cost Packages'}</span>
          </h3>
          <span className="text-xs text-slate-400">
            {budgetLines.length} {isAr ? 'حزم تكلفة مسجلة' : 'packages recorded'}
          </span>
        </div>

        {budgetLines.length === 0 ? (
          <div className="rounded-2xl p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
            <Activity className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {isAr
                ? 'لا توجد حزم تكاليف تفصيلية مسجلة لهذا المشروع بعد'
                : 'No cost packages recorded for this project yet'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto">
              {isAr
                ? 'يمكن لمهندس التحكم بالتكاليف (Cost Control Engineer) إضافة حزم العمل والميزانيات التقديرية عبر بوابة Cost Control'
                : 'Cost control engineers can configure budget lines and package breakdowns from the Cost Control portal'}
            </p>
            {!isFocusedProjectsMode() && (
              <div>
                <Link
                  href="/cost-control"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
                >
                  <span>{isAr ? 'فتح بوابة Cost Control' : 'Open Cost Control'}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">{isAr ? 'كود التكلفة' : 'Cost Code'}</th>
                  <th className="py-2.5 px-3 font-semibold">{isAr ? 'بيان الحزمة' : 'Package'}</th>
                  <th className="py-2.5 px-3 font-semibold text-end">{isAr ? 'الميزانية الأصلية' : 'Original'}</th>
                  <th className="py-2.5 px-3 font-semibold text-end">{isAr ? 'التعديلات' : 'Changes'}</th>
                  <th className="py-2.5 px-3 font-semibold text-end">{isAr ? 'الميزانية الحالية' : 'Current'}</th>
                  <th className="py-2.5 px-3 font-semibold text-end">{isAr ? 'المنصرف الفعلي' : 'Actual'}</th>
                  <th className="py-2.5 px-3 font-semibold text-end">{isAr ? 'الانحراف' : 'Variance'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {budgetLines.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-700 dark:text-slate-300">{line.cost_code_id}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-900 dark:text-white font-medium">{line.description_ar}</td>
                    <td className="py-2.5 px-3 text-end">{fmtCurrency(line.original_budget)}</td>
                    <td className="py-2.5 px-3 text-end">{fmtCurrency(line.approved_changes)}</td>
                    <td className="py-2.5 px-3 text-end font-bold text-slate-900 dark:text-white">{fmtCurrency(line.current_budget)}</td>
                    <td className="py-2.5 px-3 text-end text-rose-600 dark:text-rose-400">{fmtCurrency(line.actual_cost)}</td>
                    <td className={`py-2.5 px-3 text-end font-bold ${line.variance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {fmtCurrency(line.variance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

CostControlTab.displayName = 'CostControlTab';
