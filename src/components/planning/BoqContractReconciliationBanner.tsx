'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Receipt,
  Scale,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import { BoqContractReconciliationReport } from '@/lib/utils/boq-cost-control.utils';
import { Project } from '@/types';

interface BoqContractReconciliationBannerProps {
  reconciliation: BoqContractReconciliationReport;
  project: Project | null;
  isCostControlView: boolean;
  onToggleCostControlView: () => void;
  onFilterVoItems?: () => void;
  isAr?: boolean;
}

export const BoqContractReconciliationBanner: React.FC<BoqContractReconciliationBannerProps> = ({
  reconciliation,
  project,
  isCostControlView,
  onToggleCostControlView,
  onFilterVoItems,
  isAr = true,
}) => {
  if (!project) return null;

  const fmtCurrency = (n: number) => {
    return `${Number(n || 0).toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ج.م`;
  };

  const isMatched = reconciliation.is_matched;
  const varianceAbs = Math.abs(reconciliation.variance);

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${
        isMatched
          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300/80 dark:border-emerald-800/60 text-slate-800 dark:text-slate-200'
          : 'bg-amber-50/75 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80 text-slate-800 dark:text-slate-200'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left / Top: Status & Narrative */}
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div
              className={`p-2 rounded-xl shrink-0 ${
                isMatched
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 animate-pulse'
              }`}
            >
              {isMatched ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                  {isAr ? 'موقف مطابقة المقايسة مع القيمة الختامية للعقد' : 'BOQ vs Contract Value Reconciliation'}
                </h3>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isMatched
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                  }`}
                >
                  {isMatched
                    ? (isAr ? 'متطابقة 100% ✓' : '100% Reconciled ✓')
                    : (isAr ? `تنبيه: فارق ${fmtCurrency(varianceAbs)} ⚠️` : `Variance: ${varianceAbs.toLocaleString()} EGP`)}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                {isMatched
                  ? (isAr
                    ? 'إجمالي بنود المقايسة التعاقدية مطابق تماماً للقيمة الختامية للعقد شاملة كافة أوامر التغيير (VOs) المعتمدة.'
                    : 'Current BOQ total is fully reconciled with the final approved contract value including all VOs.')
                  : (isAr
                    ? `إجمالي المقايسة الحالية (${fmtCurrency(reconciliation.boq_revised_total)}) ${reconciliation.status === 'boq_exceeds' ? 'يتجاوز' : 'يقل عن'} القيمة التعاقدية الختامية (${fmtCurrency(reconciliation.revised_contract_value)}) بفارق قدره (${fmtCurrency(varianceAbs)}). يجب على مهندس التحكم بالتكاليف مراجعة وتعديل بنود المقايسة لتتناسب مع العقد.`
                    : `Current BOQ Total is not reconciled with final contract value. Variance: ${varianceAbs.toLocaleString()} EGP.`)}
              </p>
            </div>
          </div>
        </div>

        {/* Right / Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleCostControlView}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-xs cursor-pointer border ${
              isCostControlView
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20 ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>{isAr ? (isCostControlView ? 'إخفاء مسار التحكم بالتكاليف' : 'أعمدة التحكم بالتكاليف (Cost Control)') : 'Cost Control View'}</span>
          </button>

          <Link
            href={`/projects/${project.id}?tab=vos`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs hover:-translate-y-0.5 hover:shadow-sm active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>{isAr ? 'إدارة أوامر التغيير (VOs)' : 'Manage VOs'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* 4 Comparative Metric Cards (Interactive) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-4 pt-3.5 border-t border-slate-200/70 dark:border-slate-800/80">
        {/* 1. Original Contract Value */}
        <Link
          href={`/projects/${project.id}?tab=contracts`}
          title={isAr ? 'اضغط لفتح تبويب العقود ومراجعة قيمة العقد الأصلية' : 'Click to open Contracts tab'}
          className="group p-3 rounded-xl bg-white/80 hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-200/80 hover:border-emerald-400 dark:border-slate-800 dark:hover:border-emerald-700 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer block"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-medium">
              {isAr ? 'قيمة العقد الأصلية' : 'Original Contract'}
            </span>
            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-emerald-600 dark:text-emerald-400 transition-opacity" />
          </div>
          <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5 block" dir="ltr">
            {fmtCurrency(reconciliation.contract_original_value)}
          </span>
        </Link>

        {/* 2. Approved VOs Net Impact */}
        <Link
          href={`/projects/${project.id}?tab=vos`}
          onClick={(e) => {
            if (onFilterVoItems) {
              e.preventDefault();
              onFilterVoItems();
            }
          }}
          title={isAr ? 'اضغط لعرض وإدارة أوامر التغيير (VOs)' : 'Click to view Variation Orders'}
          className="group p-3 rounded-xl bg-white/80 hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-200/80 hover:border-purple-400 dark:border-slate-800 dark:hover:border-purple-700 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer block"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-medium">{isAr ? 'صافي أوامر التغيير (+/-)' : 'Net VOs (+/-)'}</span>
            <div className="flex items-center gap-1">
              {reconciliation.vos_net_value >= 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-rose-500" />
              )}
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-purple-600 dark:text-purple-400 transition-opacity" />
            </div>
          </div>
          <span
            className={`text-xs sm:text-sm font-bold font-mono mt-0.5 block ${
              reconciliation.vos_net_value > 0
                ? 'text-purple-600 dark:text-purple-400'
                : reconciliation.vos_net_value < 0
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-slate-700 dark:text-slate-300'
            }`}
            dir="ltr"
          >
            {reconciliation.vos_net_value > 0 ? '+' : ''}
            {fmtCurrency(reconciliation.vos_net_value)}
          </span>
        </Link>

        {/* 3. Revised Final Contract Value */}
        <Link
          href={`/projects/${project.id}?tab=cost_control`}
          title={isAr ? 'اضغط لفتح مراقبة التكاليف والمستخلصات' : 'Click to open Cost Control'}
          className="group p-3 rounded-xl bg-white/80 hover:bg-white dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-200/80 hover:border-cyan-400 dark:border-slate-800 dark:hover:border-cyan-700 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer block"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-medium">
              {isAr ? 'القيمة التعاقدية المعدلة (الختامية)' : 'Revised Final Contract'}
            </span>
            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-cyan-600 dark:text-cyan-400 transition-opacity" />
          </div>
          <span className="text-xs sm:text-sm font-bold font-mono text-slate-900 dark:text-white mt-0.5 block" dir="ltr">
            {fmtCurrency(reconciliation.revised_contract_value)}
          </span>
        </Link>

        {/* 4. Active BOQ Total */}
        <button
          type="button"
          onClick={onToggleCostControlView}
          title={isAr ? 'اضغط لتبديل عرض أعمدة التحكم بالتكاليف والمطابقة' : 'Click to toggle Cost Control reconciliation columns'}
          className={`group text-start p-3 rounded-xl border hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] transition-all duration-200 cursor-pointer ${
            isMatched
              ? 'bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border-emerald-300 hover:border-emerald-400 dark:border-emerald-800 dark:hover:border-emerald-700'
              : 'bg-rose-50/50 hover:bg-rose-50 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 border-rose-300 hover:border-rose-400 dark:border-rose-800 dark:hover:border-rose-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
              {isAr ? 'إجمالي المقايسة الحالية' : 'Current BOQ Total'}
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                isMatched
                  ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100'
                  : 'bg-rose-200 text-rose-900 dark:bg-rose-800 dark:text-rose-100'
              }`}
            >
              {isMatched ? (isAr ? 'مطابق' : 'Match') : (isAr ? 'غير مطابق' : 'Mismatch')}
            </span>
          </div>
          <span
            className={`text-xs sm:text-sm font-bold font-mono mt-0.5 block ${
              isMatched ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
            }`}
            dir="ltr"
          >
            {fmtCurrency(reconciliation.boq_revised_total)}
          </span>
        </button>
      </div>
    </div>
  );
};
