'use client';

import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Percent,
  DollarSign,
  Building2,
  Calendar,
  Clock,
  HelpCircle,
  FileCheck,
  AlertTriangle,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { BondCalcType, RetentionType } from '@/lib/utils/retention-bond-tracking.utils';

export interface ProjectGuaranteesData {
  advance_payment_pct?: number;
  advance_payment?: {
    has_advance: boolean;
    percentage: number;
    bond_number?: string;
    issuing_bank?: string;
    returned?: boolean;
  };
  has_performance_bond?: boolean;
  performance_bond?: {
    has_bond: boolean;
    bond_number?: string;
    issuing_bank?: string;
    calc_type: BondCalcType;
    percentage?: number;
    manual_value?: number;
    issue_date?: string;
    expiry_date?: string;
    release_days?: number;
    released?: boolean;
  };
  retention_terms?: {
    type: RetentionType;
    calc_base: 'base' | 'total';
    rate_pct: number;
    manual_amount?: number;
    toc_release_pct: number; // percentage released upon TOC, e.g. 50% or 100%
    release_days?: number;
    bond_number?: string;
    issuing_bank?: string;
    tranche_1_released?: boolean;
    tranche_2_released?: boolean;
  };
  // Backward compatibility fields
  performance_bond_pct?: number;
  retention_pct?: number;
  retention_release_days?: number;
  performance_bond_release_days?: number;
  [key: string]: unknown;
}

export interface ProjectGuaranteesSectionProps {
  metadata: ProjectGuaranteesData;
  onChange: (updatedMetadata: ProjectGuaranteesData) => void;
  contractBaseValue: number;
  vosValue?: number;
  isAr?: boolean;
  readOnly?: boolean;
}

const COMMON_EGYPT_BANKS = [
  'البنك الأهلي المصري',
  'بنك مصر',
  'البنك التجاري الدولي',
  'بنك القاهرة',
  'بنك قطر الوطني',
  'بنك الإسكندرية',
  'البنك العربي الأفريقي الدولي',
  'بنك التعمير والإسكان',
  'بنك فيصل الإسلامي المصري',
  'بنك إتش إس بي سي مصر',
  'بنك أبوظبي التجاري',
  'البنك الأهلي المتحد',
];

export const ProjectGuaranteesSection: React.FC<ProjectGuaranteesSectionProps> = ({
  metadata,
  onChange,
  contractBaseValue,
  vosValue = 0,
  isAr = true,
  readOnly = false,
}) => {
  const totalContract = contractBaseValue + (vosValue || 0);

  // Advance Payment State
  const advPct = Number(metadata.advance_payment?.percentage ?? metadata.advance_payment_pct ?? 15);
  const adv = metadata.advance_payment || {
    has_advance: advPct > 0,
    percentage: advPct,
    bond_number: (metadata.advance_payment_bond_number as string) || '',
    issuing_bank: (metadata.advance_payment_bond_bank as string) || '',
    returned: Boolean(metadata.advance_payment_bond_returned),
  };

  // Performance Bond State
  const pb = metadata.performance_bond || {
    has_bond: metadata.has_performance_bond ?? (Boolean((metadata.performance_bond_pct ?? 5) > 0)),
    bond_number: '',
    issuing_bank: '',
    calc_type: 'percentage_base' as BondCalcType,
    percentage: metadata.performance_bond_pct ?? 5,
    manual_value: 0,
    release_days: metadata.performance_bond_release_days ?? 30,
    released: false,
  };

  // Retention Terms State
  const ret = metadata.retention_terms || {
    type: 'cash_deduction' as RetentionType,
    calc_base: 'total' as const,
    rate_pct: metadata.retention_pct ?? 10,
    toc_release_pct: 50,
    release_days: metadata.retention_release_days ?? 30,
    bond_number: '',
    issuing_bank: '',
    tranche_1_released: false,
    tranche_2_released: false,
  };

  // Computed Live Previews
  const computedAdvanceAmount = React.useMemo(() => {
    if (!adv.has_advance) return 0;
    return Math.round(contractBaseValue * ((adv.percentage || 0) / 100));
  }, [adv, contractBaseValue]);

  const computedPbAmount = React.useMemo(() => {
    if (!pb.has_bond) return 0;
    if (pb.calc_type === 'manual') return pb.manual_value || 0;
    const rate = (pb.percentage || 0) / 100;
    return pb.calc_type === 'percentage_total'
      ? Math.round(totalContract * rate)
      : Math.round(contractBaseValue * rate);
  }, [pb, contractBaseValue, totalContract]);

  const computedTotalRetention = React.useMemo(() => {
    if (ret.type === 'none') return 0;
    if (ret.manual_amount && ret.manual_amount > 0) return ret.manual_amount;
    const base = ret.calc_base === 'base' ? contractBaseValue : totalContract;
    return Math.round(base * ((ret.rate_pct || 0) / 100));
  }, [ret, contractBaseValue, totalContract]);

  const computedTocReleaseAmount = React.useMemo(() => {
    return Math.round(computedTotalRetention * ((ret.toc_release_pct || 0) / 100));
  }, [computedTotalRetention, ret.toc_release_pct]);

  const computedDlpReleaseAmount = React.useMemo(() => {
    return Math.max(0, computedTotalRetention - computedTocReleaseAmount);
  }, [computedTotalRetention, computedTocReleaseAmount]);

  const updateAdv = (patch: Partial<typeof adv>) => {
    const updatedAdv = { ...adv, ...patch };
    const effectivePct = updatedAdv.has_advance ? (updatedAdv.percentage ?? 15) : 0;
    onChange({
      ...metadata,
      advance_payment: {
        ...updatedAdv,
        percentage: effectivePct,
      },
      advance_payment_pct: effectivePct,
      advance_payment_bond_number: updatedAdv.bond_number,
      advance_payment_bond_bank: updatedAdv.issuing_bank,
      advance_payment_bond_returned: updatedAdv.returned,
    });
  };

  const updatePb = (patch: Partial<typeof pb>) => {
    const updatedPb = { ...pb, ...patch };
    onChange({
      ...metadata,
      has_performance_bond: updatedPb.has_bond,
      performance_bond: updatedPb,
      // Backward compatibility sync
      performance_bond_pct: updatedPb.percentage,
      performance_bond_release_days: updatedPb.release_days,
    });
  };

  const updateRet = (patch: Partial<typeof ret>) => {
    const updatedRet = { ...ret, ...patch };
    onChange({
      ...metadata,
      retention_terms: updatedRet,
      // Backward compatibility sync
      retention_pct: updatedRet.rate_pct,
      retention_release_days: updatedRet.release_days,
      retention_toc_release_pct: updatedRet.toc_release_pct,
    });
  };

  return (
    <div className="space-y-5" dir={isAr ? 'rtl' : 'ltr'}>
      {/* SECTION HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-100">
              {isAr ? 'الدفعة المقدمة وخطابات الضمان والمستقطعات التعاقدية' : 'Advance Payment, Bank Guarantees & Retention Terms'}
            </h3>
            <p className="text-[10px] text-slate-400">
              {isAr
                ? 'تحديد نسبة الدفعة المقدمة، خطابات حسن التنفيذ، واستقطاعات محجوز الضمان ونسب الصرف عند الاستلام الابتدائي'
                : 'Configure advance payment, performance bonds, calculation base, and retention release rules upon TOC'}
            </p>
          </div>
        </div>
      </div>

      {/* 0. ADVANCE PAYMENT CARD (الدفعة المقدمة وخطاب ضمان الدفعة المقدمة) */}
      <div className="p-4 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-200/80 dark:border-sky-900/50 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-sky-500 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'الدفعة المقدمة التعاقدية وخطاب ضمان الدفعة المقدمة' : 'Advance Payment & Guarantee'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'هل توجد دفعة مقدمة بالعقد؟' : 'Has advance payment?'}
            </span>
            <div className="inline-flex rounded-xl p-0.5 bg-slate-200 dark:bg-slate-800">
              <button
                type="button"
                disabled={readOnly}
                onClick={() => updateAdv({ has_advance: true, percentage: adv.percentage > 0 ? adv.percentage : 15 })}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  adv.has_advance
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {isAr ? 'نعم (توجد)' : 'Yes'}
              </button>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => updateAdv({ has_advance: false, percentage: 0 })}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  !adv.has_advance
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {isAr ? 'لا (بدون)' : 'No'}
              </button>
            </div>
          </div>
        </div>

        {adv.has_advance && (
          <div className="space-y-3 pt-2 border-t border-sky-200/60 dark:border-sky-800/60 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="adv_rate_pct" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'نسبة الدفعة المقدمة من أصل العقد (%):' : 'Advance Payment Rate (%):'}
                </label>
                <div className="relative">
                  <input
                    id="adv_rate_pct"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    dir="ltr"
                    disabled={readOnly}
                    value={adv.percentage ?? 15}
                    onChange={(e) => updateAdv({ percentage: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })}
                    placeholder="15"
                    className="glass-input w-full font-mono text-xs ps-3 pe-8 py-2"
                  />
                  <span className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-xs text-slate-400 font-bold select-none">
                    %
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  {[10, 15, 20, 25, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={readOnly}
                      onClick={() => updateAdv({ percentage: preset })}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                        adv.percentage === preset
                          ? 'bg-sky-600 text-white'
                          : 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 hover:bg-sky-200'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="adv_bond_number" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'رقم خطاب ضمان الدفعة المقدمة:' : 'Advance Bond Ref #:'}
                </label>
                <input
                  id="adv_bond_number"
                  type="text"
                  dir="ltr"
                  disabled={readOnly}
                  value={adv.bond_number || ''}
                  onChange={(e) => updateAdv({ bond_number: e.target.value })}
                  placeholder={isAr ? 'اختياري - رقم الخطاب البنكي' : 'Optional - Bond Ref #'}
                  className="glass-input w-full font-mono text-xs py-2"
                />
              </div>

              <div>
                <label htmlFor="adv_issuing_bank" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'البنك المصدر لخطاب الدفعة المقدمة:' : 'Issuing Bank:'}
                </label>
                <input
                  id="adv_issuing_bank"
                  type="text"
                  list="egypt-banks-list"
                  disabled={readOnly}
                  value={adv.issuing_bank || ''}
                  onChange={(e) => updateAdv({ issuing_bank: e.target.value })}
                  placeholder={isAr ? 'اختر البنك...' : 'Select bank...'}
                  className="glass-input w-full text-xs py-2"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between text-xs">
              <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300">
                {isAr ? `قيمة الدفعة المقدمة المحتسبة (${adv.percentage}% من أصل العقد):` : 'Calculated Advance Payment Amount:'}
              </span>
              <span className="font-mono font-black text-sky-700 dark:text-sky-300 text-sm">
                {computedAdvanceAmount.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 1. PERFORMANCE BOND CARD (خطاب ضمان حسن التنفيذ) */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'خطاب ضمان حسن الأداء وحسن التنفيذ' : 'Performance Bond'}
            </span>
          </div>

          {/* Toggle has bond */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isAr ? 'هل يوجد خطاب ضمان للمشروع؟' : 'Is there a guarantee bond?'}
            </span>
            <div className="inline-flex rounded-xl p-0.5 bg-slate-200 dark:bg-slate-800">
              <button
                type="button"
                disabled={readOnly}
                onClick={() => updatePb({ has_bond: true })}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  pb.has_bond
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {isAr ? 'نعم (يوجد)' : 'Yes'}
              </button>
              <button
                type="button"
                disabled={readOnly}
                onClick={() => updatePb({ has_bond: false })}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  !pb.has_bond
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {isAr ? 'لا (بدون)' : 'No'}
              </button>
            </div>
          </div>
        </div>

        {pb.has_bond && (
          <div className="space-y-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 animate-in fade-in duration-200">
            {/* Calculation Method Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {isAr ? 'طريقة تحديد قيمة خطاب الضمان:' : 'Bond Value Calculation Method:'}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => updatePb({ calc_type: 'percentage_base' })}
                  className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                    pb.calc_type === 'percentage_base'
                      ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{isAr ? 'نسبة من أصل العقد' : '% of Base Contract'}</span>
                    <Percent className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'بدون أوامر التغيير (Base Value)' : 'Excluding variations (VOs)'}
                  </p>
                </button>

                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => updatePb({ calc_type: 'percentage_total' })}
                  className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                    pb.calc_type === 'percentage_total'
                      ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{isAr ? 'نسبة من الإجمالي' : '% of Total Contract'}</span>
                    <Receipt className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'شاملة أوامر التغيير (Base + VOs)' : 'Including variations (VOs)'}
                  </p>
                </button>

                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => updatePb({ calc_type: 'manual' })}
                  className={`p-2.5 rounded-xl border text-start transition-all cursor-pointer ${
                    pb.calc_type === 'manual'
                      ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">{isAr ? 'قيمة مالية يدوياً' : 'Manual Amount'}</span>
                    <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {isAr ? 'إدخال رقم ثابت بالجنيه (EGP)' : 'Fixed numeric amount in EGP'}
                  </p>
                </button>
              </div>
            </div>

            {/* Inputs: Percentage or Manual Value */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {pb.calc_type === 'manual' ? (
                <div className="sm:col-span-2">
                  <label htmlFor="pb_manual_value" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'قيمة خطاب الضمان يدوياً (ج.م):' : 'Manual Bond Amount (EGP):'}
                  </label>
                  <div className="relative">
                    <input
                      id="pb_manual_value"
                      type="number"
                      min="0"
                      step="any"
                      dir="ltr"
                      disabled={readOnly}
                      value={pb.manual_value || ''}
                      onChange={(e) => updatePb({ manual_value: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="glass-input w-full font-mono text-xs ps-3 pe-12 py-2"
                    />
                    <span className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-xs text-slate-400 font-bold select-none">
                      EGP
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label htmlFor="pb_percentage" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'نسبة خطاب الضمان (%):' : 'Bond Percentage (%):'}
                  </label>
                  <div className="relative">
                    <input
                      id="pb_percentage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      dir="ltr"
                      disabled={readOnly}
                      value={pb.percentage ?? 5}
                      onChange={(e) => updatePb({ percentage: parseFloat(e.target.value) || 0 })}
                      placeholder="5"
                      className="glass-input w-full font-mono text-xs ps-3 pe-8 py-2"
                    />
                    <span className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-xs text-slate-400 font-bold select-none">
                      %
                    </span>
                  </div>
                </div>
              )}

              {/* Bond Reference Number */}
              <div>
                <label htmlFor="pb_bond_number" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'رقم خطاب الضمان (Bond Ref #):' : 'Bond Reference Number:'}
                </label>
                <input
                  id="pb_bond_number"
                  type="text"
                  dir="ltr"
                  disabled={readOnly}
                  value={pb.bond_number || ''}
                  onChange={(e) => updatePb({ bond_number: e.target.value })}
                  placeholder="e.g. LG-2024/0912"
                  className="glass-input w-full font-mono text-xs py-2"
                />
              </div>

              {/* Issuing Bank */}
              <div>
                <label htmlFor="pb_issuing_bank" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'البنك المصدر للخطاب:' : 'Issuing Bank:'}
                </label>
                <input
                  id="pb_issuing_bank"
                  type="text"
                  list="egypt-banks-list"
                  disabled={readOnly}
                  value={pb.issuing_bank || ''}
                  onChange={(e) => updatePb({ issuing_bank: e.target.value })}
                  placeholder={isAr ? 'اختر أو اكتب اسم البنك...' : 'Bank name...'}
                  className="glass-input w-full text-xs py-2"
                />
                <datalist id="egypt-banks-list">
                  {COMMON_EGYPT_BANKS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              {/* Days to return after TOC */}
              <div>
                <label htmlFor="pb_release_days" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'أيام الاسترداد بعد الاستلام الابتدائي:' : 'Return Days after TOC:'}
                </label>
                <div className="relative">
                  <input
                    id="pb_release_days"
                    type="number"
                    min="0"
                    dir="ltr"
                    disabled={readOnly}
                    value={pb.release_days ?? 30}
                    onChange={(e) => updatePb({ release_days: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="glass-input w-full font-mono text-xs ps-3 pe-12 py-2"
                  />
                  <span className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-[11px] text-slate-400 font-bold select-none">
                    {isAr ? 'يوم' : 'days'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live Calculation Banner */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {isAr ? 'القيمة المحسوبة لخطاب حسن التنفيذ:' : 'Computed Performance Bond Value:'}
                </span>
                <span className="font-mono font-black text-amber-700 dark:text-amber-300 text-sm">
                  {computedPbAmount.toLocaleString()} EGP
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {pb.calc_type === 'percentage_base'
                  ? `(من أصل العقد: ${contractBaseValue.toLocaleString()} ج.م)`
                  : pb.calc_type === 'percentage_total'
                  ? `(من إجمالي العقد مع VOs: ${totalContract.toLocaleString()} ج.م)`
                  : `(قيمة ثابتة يدوية)`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. RETENTION MONEY TERMS (محجوز الضمان والمستقطعات) */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-500 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'محجوز ضمان الأعمال والصيانة (Retention Money Terms)' : 'Retention Money Terms'}
            </span>
          </div>

          {/* Retention Type Selector */}
          <div className="inline-flex rounded-xl p-0.5 bg-slate-200 dark:bg-slate-800">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => updateRet({ type: 'cash_deduction' })}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                ret.type === 'cash_deduction'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isAr ? 'استقطاع نقدي بالمستخلصات' : 'Cash Deductions'}
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => updateRet({ type: 'retention_bond' })}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                ret.type === 'retention_bond'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isAr ? 'خطاب ضمان محجوز' : 'Retention Bond'}
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => updateRet({ type: 'none' })}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                ret.type === 'none'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {isAr ? 'بدون محجوز' : 'No Retention'}
            </button>
          </div>
        </div>

        {ret.type !== 'none' && (
          <div className="space-y-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Retention Percentage */}
              <div>
                <label htmlFor="ret_rate_pct" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'نسبة استقطاع المحجوز (%):' : 'Retention Rate (%):'}
                </label>
                <div className="relative">
                  <input
                    id="ret_rate_pct"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    dir="ltr"
                    disabled={readOnly}
                    value={ret.rate_pct ?? 5}
                    onChange={(e) => updateRet({ rate_pct: parseFloat(e.target.value) || 0 })}
                    placeholder="5"
                    className="glass-input w-full font-mono text-xs ps-3 pe-8 py-2"
                  />
                  <span className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-xs text-slate-400 font-bold select-none">
                    %
                  </span>
                </div>
              </div>

              {/* Calculation Base (Base vs Total with VOs) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'أساس احتساب المحجوز:' : 'Calculation Base:'}
                </label>
                <select
                  disabled={readOnly}
                  value={ret.calc_base || 'total'}
                  onChange={(e) => updateRet({ calc_base: e.target.value as 'base' | 'total' })}
                  className="glass-input w-full text-xs py-2"
                >
                  <option value="total">{isAr ? 'شامل أوامر التغيير VOs (Total)' : 'Including VOs'}</option>
                  <option value="base">{isAr ? 'على أصل العقد فقط بدون VOs' : 'Base Contract Only'}</option>
                </select>
              </div>

              {/* TOC Release Percentage (Customizable, NOT fixed 50%!) */}
              <div>
                <label htmlFor="ret_toc_release_pct" className="block text-[11px] font-bold text-purple-700 dark:text-purple-300 mb-1">
                  {isAr ? 'نسبة الصرف عند الاستلام الابتدائي TOC:' : 'TOC Release %:'}
                </label>
                <div className="relative">
                  <input
                    id="ret_toc_release_pct"
                    type="number"
                    min="0"
                    max="100"
                    step="5"
                    dir="ltr"
                    disabled={readOnly}
                    value={ret.toc_release_pct ?? 50}
                    onChange={(e) =>
                      updateRet({ toc_release_pct: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })
                    }
                    placeholder="50"
                    className="glass-input w-full font-mono text-xs ps-3 pe-8 py-2 border-purple-300 dark:border-purple-800"
                  />
                  <span className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-xs text-purple-600 dark:text-purple-400 font-bold select-none">
                    %
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isAr ? 'النسبة المستردة بالاستلام الابتدائي (مثال: 50% أو 100%)' : 'Portion released at TOC'}
                </p>
              </div>

              {/* Contractual days to return retention after TOC */}
              <div>
                <label htmlFor="ret_release_days" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'أيام الاسترداد بعد الاستلام الابتدائي:' : 'Release Days after TOC:'}
                </label>
                <div className="relative">
                  <input
                    id="ret_release_days"
                    type="number"
                    min="0"
                    dir="ltr"
                    disabled={readOnly}
                    value={ret.release_days ?? 30}
                    onChange={(e) => updateRet({ release_days: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="glass-input w-full font-mono text-xs ps-3 pe-12 py-2"
                  />
                  <span className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-[11px] text-slate-400 font-bold select-none">
                    {isAr ? 'يوم' : 'days'}
                  </span>
                </div>
              </div>
            </div>

            {/* If retention bond, input bond number & bank */}
            {ret.type === 'retention_bond' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60">
                <div>
                  <label htmlFor="ret_bond_number" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'رقم خطاب ضمان المحجوز:' : 'Retention Bond Ref #:'}
                  </label>
                  <input
                    id="ret_bond_number"
                    type="text"
                    dir="ltr"
                    disabled={readOnly}
                    value={ret.bond_number || ''}
                    onChange={(e) => updateRet({ bond_number: e.target.value })}
                    placeholder="e.g. RB-2024/055"
                    className="glass-input w-full font-mono text-xs py-2"
                  />
                </div>
                <div>
                  <label htmlFor="ret_issuing_bank" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'البنك المصدر لخطاب المحجوز:' : 'Issuing Bank:'}
                  </label>
                  <input
                    id="ret_issuing_bank"
                    type="text"
                    list="egypt-banks-list"
                    disabled={readOnly}
                    value={ret.issuing_bank || ''}
                    onChange={(e) => updateRet({ issuing_bank: e.target.value })}
                    placeholder={isAr ? 'اختر البنك...' : 'Bank name...'}
                    className="glass-input w-full text-xs py-2"
                  />
                </div>
              </div>
            )}

            {/* Tranche Breakdown Live Preview */}
            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  {isAr ? `إجمالي المحجوز (${ret.rate_pct}%):` : 'Total Retention:'}
                </span>
                <span className="font-mono font-black text-purple-800 dark:text-purple-300 text-sm">
                  {computedTotalRetention.toLocaleString()} EGP
                </span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">
                  {isAr ? `الدفعة 1 عند الاستلام TOC (${ret.toc_release_pct}%):` : 'Tranche 1 (TOC):'}
                </span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                  {computedTocReleaseAmount.toLocaleString()} EGP
                </span>
              </div>
              <div>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 block">
                  {isAr ? `الدفعة 2 بعد انتهاء الصيانة DLP (${100 - (ret.toc_release_pct || 0)}%):` : 'Tranche 2 (DLP):'}
                </span>
                <span className="font-mono font-bold text-blue-700 dark:text-blue-300 text-sm">
                  {computedDlpReleaseAmount.toLocaleString()} EGP
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
