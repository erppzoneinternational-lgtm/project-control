'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  ShieldCheck,
  FileCheck2,
  Calculator,
  Save,
  Loader2,
  Sparkles,
  Info,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { ProjectService } from '@/lib/services/project.service';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';

export interface QuickContractProject {
  id: string;
  projectCode: string;
  projectName: string;
  originalValue: number;
  totalValue: number;
  advancePaymentPct: number;
  retentionPct: number;
  performanceBondPct?: number;
  metadata?: Record<string, any>;
}

interface QuickContractTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: QuickContractProject | null;
  onSuccess: (updated: {
    advancePaymentPct: number;
    retentionPct: number;
    performanceBondPct: number;
  }) => void;
  isAr?: boolean;
}

const fmtEGP = (val: number) => {
  return `${Number(val || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} ج.م`;
};

export const QuickContractTermsModal: React.FC<QuickContractTermsModalProps> = ({
  isOpen,
  onClose,
  project,
  onSuccess,
  isAr = true,
}) => {
  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const isViewerOnly =
    roles.length > 0 && roles.every((r) => r.toLowerCase() === 'viewer') && !isAdmin;
  const canEdit = !isViewerOnly && canEditPath('/contracts', roles, isAdmin, dbAccessRules);

  const [advancePct, setAdvancePct] = useState<number>(0);
  const [retentionPct, setRetentionPct] = useState<number>(0);
  const [performanceBondPct, setPerformanceBondPct] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (project) {
      setAdvancePct(Number(project.advancePaymentPct ?? project.metadata?.advance_payment_pct ?? 0));
      setRetentionPct(Number(project.retentionPct ?? project.metadata?.retention_pct ?? 0));
      setPerformanceBondPct(Number(project.performanceBondPct ?? project.metadata?.performance_bond_pct ?? 0));
    }
  }, [project]);

  // Lock body scroll on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !project) return null;

  const originalVal = Number(project.originalValue || 0);
  const totalVal = Number(project.totalValue || project.originalValue || 0);

  const advanceValue = (originalVal * Math.max(0, advancePct)) / 100;
  const retentionValue = (totalVal * Math.max(0, retentionPct)) / 100;
  const performanceBondValue = (originalVal * Math.max(0, performanceBondPct)) / 100;

  const handleApplyPreset = (adv: number, ret: number, pb: number) => {
    if (!canEdit) return;
    setAdvancePct(adv);
    setRetentionPct(ret);
    setPerformanceBondPct(pb);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !project) return;

    const cleanAdv = Math.max(0, Math.min(100, Number(advancePct) || 0));
    const cleanRet = Math.max(0, Math.min(100, Number(retentionPct) || 0));
    const cleanBond = Math.max(0, Math.min(100, Number(performanceBondPct) || 0));

    setSaving(true);
    try {
      const existingMeta = project.metadata || {};
      const updatedMetadata = {
        ...existingMeta,
        advance_payment_pct: cleanAdv,
        advance_payment: {
          ...(existingMeta.advance_payment || {}),
          has_advance: cleanAdv > 0,
          percentage: cleanAdv,
        },
        retention_pct: cleanRet,
        retention_terms: existingMeta.retention_terms
          ? {
              ...existingMeta.retention_terms,
              type: cleanRet > 0 ? (existingMeta.retention_terms.type === 'none' ? 'cash_deduction' : existingMeta.retention_terms.type) : 'none',
              rate_pct: cleanRet,
            }
          : undefined,
        performance_bond_pct: cleanBond,
        has_performance_bond: cleanBond > 0,
        performance_bond: existingMeta.performance_bond
          ? {
              ...existingMeta.performance_bond,
              has_bond: cleanBond > 0,
              percentage: cleanBond,
            }
          : undefined,
        terms_updated_at: new Date().toISOString(),
      };

      await ProjectService.updateProject(project.id, {
        metadata: updatedMetadata,
      });

      toast.success(
        isAr
          ? `تم تحديث الشروط التعاقدية للمشروع (${project.projectCode}) بنجاح`
          : `Contract terms updated for (${project.projectCode})`
      );

      onSuccess({
        advancePaymentPct: cleanAdv,
        retentionPct: cleanRet,
        performanceBondPct: cleanBond,
      });

      onClose();
    } catch (err: any) {
      console.error('Failed to update contract terms:', err);
      toast.error(
        err?.message ||
          (isAr
            ? 'فشل حفظ الشروط التعاقدية في قاعدة البيانات'
            : 'Failed to save contract terms')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Ambient Top Glow Border */}
        <div className="h-1 bg-gradient-to-r from-sky-500 via-purple-500 to-emerald-500 w-full shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                #{project.projectCode}
              </span>
              <span className={`text-[11px] font-bold text-slate-400 dark:text-slate-500 ${isAr ? 'tracking-normal' : 'uppercase tracking-wider'}`}>
                {isAr ? 'ضبط النسب والشروط المالية' : 'Contract Terms Configuration'}
              </span>
            </div>
            <h3
              id="terms-modal-title"
              className="text-base font-bold text-slate-900 dark:text-white truncate max-w-sm sm:max-w-md"
            >
              {project.projectName}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Contract Base Value Pill */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
                {isAr ? 'القيمة الأصلية بالعقد:' : 'Original Contract Value:'}
              </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs tabular-nums">
                {fmtEGP(originalVal)}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-0.5">
                {isAr ? 'الإجمالي مع أوامر التغيير:' : 'Total Contract Value:'}
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs tabular-nums">
                {fmtEGP(totalVal)}
              </span>
            </div>
          </div>

          {/* Quick Presets */}
          {canEdit && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isAr ? 'شروط تعاقدية قياسية جاهزة:' : 'Contract Presets:'}</span>
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleApplyPreset(15, 10, 5)}
                className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'قياسي (15% / 10% / 5%)' : 'Standard (15/10/5)'}
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(25, 10, 5)}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'دفعة 25% (25% / 10% / 5%)' : '25% Advance (25/10/5)'}
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(10, 10, 5)}
                className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'فيديك أحمر (10% / 10% / 5%)' : 'FIDIC Red Book (10/10/5)'}
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(0, 5, 5)}
                className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold transition-colors cursor-pointer"
              >
                {isAr ? 'بدون مقدمة (0% / 5% / 5%)' : 'No Advance (0/5/5)'}
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(0, 0, 0)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 inline me-1" />
                {isAr ? 'تصفير (0%)' : 'Reset (0%)'}
              </button>
            </div>
          </div>
          )}

          {/* Input 1: Advance Payment % */}
          <div className="p-3.5 rounded-xl border border-sky-200/80 dark:border-sky-900/40 bg-sky-50/30 dark:bg-sky-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="input_advance_pct"
                className="flex items-center gap-2 text-xs font-bold text-sky-800 dark:text-sky-300"
              >
                <CreditCard className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>{isAr ? 'نسبة الدفعة المقدمة (%)' : 'Advance Payment %'}</span>
              </label>
              <span className="text-[11px] font-mono font-bold text-sky-600 dark:text-sky-400">
                {advancePct > 0 ? fmtEGP(advanceValue) : isAr ? 'لا توجد' : 'None'}
              </span>
            </div>

            <div className="relative">
              <input
                id="input_advance_pct"
                type="number"
                min="0"
                max="100"
                step="0.1"
                disabled={!canEdit}
                value={advancePct}
                onChange={(e) => setAdvancePct(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 pe-10 text-xs font-mono font-bold rounded-lg border border-sky-200 dark:border-sky-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 disabled:opacity-60"
                placeholder="0"
                dir="ltr"
              />
              <span className="absolute inset-y-0 end-3 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                %
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isAr
                ? 'تُحسب كنسبة من القيمة الأصلية للعقد وتُسترد تدريجياً عبر شهادات الدفع الدورية.'
                : 'Calculated as % of original contract value, amortized across IPCs.'}
            </p>
          </div>

          {/* Input 2: Retention Guarantee % */}
          <div className="p-3.5 rounded-xl border border-purple-200/80 dark:border-purple-900/40 bg-purple-50/30 dark:bg-purple-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="input_retention_pct"
                className="flex items-center gap-2 text-xs font-bold text-purple-800 dark:text-purple-300"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>{isAr ? 'نسبة استقطاع الضمان (%)' : 'Retention Guarantee %'}</span>
              </label>
              <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400">
                {retentionPct > 0 ? fmtEGP(retentionValue) : isAr ? 'لا يوجد' : 'None'}
              </span>
            </div>

            <div className="relative">
              <input
                id="input_retention_pct"
                type="number"
                min="0"
                max="100"
                step="0.1"
                disabled={!canEdit}
                value={retentionPct}
                onChange={(e) => setRetentionPct(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 pe-10 text-xs font-mono font-bold rounded-lg border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                placeholder="0"
                dir="ltr"
              />
              <span className="absolute inset-y-0 end-3 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                %
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isAr
                ? 'تُستقطع من كل مستخلص لحسن التنفيذ والصيانة التعاقدية (50% عند الاستلام الابتدائي و50% عند الاستلام النهائي).'
                : 'Withheld from each IPC until Initial Handover (50%) and Final Handover (50%).'}
            </p>
          </div>

          {/* Input 3: Performance Bond % */}
          <div className="p-3.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="input_performance_bond_pct"
                className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300"
              >
                <FileCheck2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? 'خطاب ضمان حسن التنفيذ (%)' : 'Performance Bond %'}</span>
              </label>
              <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {performanceBondPct > 0 ? fmtEGP(performanceBondValue) : isAr ? 'لا يوجد' : 'None'}
              </span>
            </div>

            <div className="relative">
              <input
                id="input_performance_bond_pct"
                type="number"
                min="0"
                max="100"
                step="0.1"
                disabled={!canEdit}
                value={performanceBondPct}
                onChange={(e) => setPerformanceBondPct(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 pe-10 text-xs font-mono font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                placeholder="0"
                dir="ltr"
              />
              <span className="absolute inset-y-0 end-3 flex items-center text-xs font-bold text-slate-400 pointer-events-none">
                %
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isAr
                ? 'خطاب ضمان بنكي صادر لصالح المالك بنسبة من القيمة الأصلية للعقد.'
                : 'Bank guarantee issued to employer as % of original contract value.'}
            </p>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            {canEdit && (
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs shadow-amber-500/20 transition-all focus:outline-hidden focus:ring-2 focus:ring-amber-500 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{isAr ? 'حفظ الشروط التعاقدية' : 'Save Contract Terms'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
