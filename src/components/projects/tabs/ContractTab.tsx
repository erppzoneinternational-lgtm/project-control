'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import { Contract, ContractSummary } from '@/types/contracts';
import { contractsService } from '@/lib/services/contracts.service';
import { ProjectService } from '@/lib/services/project.service';
import { NotificationService } from '@/lib/services/notification.service';
import { appCache } from '@/lib/cache';
import {
  FileText,
  DollarSign,
  Calendar,
  Building2,
  CreditCard,
  ExternalLink,
  TrendingUp,
  FileDiff,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  BellRing,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { isFocusedProjectsMode } from '@/lib/config/module-visibility';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';

export interface ContractTabProps {
  project: Project;
  onProjectUpdate?: () => void;
}

/**
 * Strips raw ISO timestamps and rejects accidental `project.created_at` fallbacks.
 */
function cleanContractDate(rawDate: unknown, createdAt?: unknown): string | null {
  if (!rawDate || typeof rawDate !== 'string') return null;
  const trimmed = rawDate.trim();
  if (!trimmed) return null;
  // Reject if the date string is identical to project.created_at (leaked creation timestamp)
  if (createdAt && typeof createdAt === 'string' && trimmed === createdAt.trim()) {
    return null;
  }
  // Reject full ISO timestamps with microseconds that match created_at date prefix when no explicit date was set
  if (trimmed.includes('T') && createdAt && typeof createdAt === 'string') {
    const rawDay = trimmed.split('T')[0];
    const createdDay = createdAt.split('T')[0];
    if (rawDay === createdDay && trimmed.length > 10) {
      return null;
    }
  }
  return trimmed.includes('T') ? trimmed.split('T')[0] : trimmed;
}

export const ContractTab: React.FC<ContractTabProps> = ({ project, onProjectUpdate }) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [summary, setSummary] = useState<ContractSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Contracts Engineer Verification & Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [bannerFeedback, setBannerFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const meta = (project.metadata || {}) as Record<string, any>;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [conList, sum] = await Promise.all([
        contractsService.getContracts(project.id),
        contractsService.getContractSummary(project.id),
      ]);
      setContracts(conList);
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load contract data:', err);
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const primaryContract = contracts[0] || null;

  // Clean contractual dates (never fall back to project.created_at)
  const awardDate = cleanContractDate(
    project.contract_date || meta.contract_date,
    project.created_at
  );
  const startDate = cleanContractDate(
    project.start_date || project.planned_start_date || meta.start_date,
    project.created_at
  );
  const finishDate = cleanContractDate(
    project.planned_finish_date || project.end_date || (project as any).finish_date || meta.end_date,
    project.created_at
  );
  const durationMonths =
    project.contract_duration_months && Number(project.contract_duration_months) > 0
      ? Number(project.contract_duration_months)
      : meta.contract_duration_months && Number(meta.contract_duration_months) > 0
      ? Number(meta.contract_duration_months)
      : null;

  // Commercial percentages — check if explicitly defined rather than inventing filler
  const rawAdvance =
    (project as any)?.advance_payment_pct ??
    meta.advance_payment?.percentage ??
    meta.advance_payment_pct ??
    meta.down_payment_pct;
  const hasExplicitAdvance =
    meta.advance_payment?.has_advance === false ||
    (rawAdvance !== undefined && rawAdvance !== null && rawAdvance !== '');
  const advancePaymentPct =
    meta.advance_payment?.has_advance === false
      ? 0
      : hasExplicitAdvance
      ? Number(rawAdvance)
      : null;

  const rawBond =
    (project as any)?.performance_bond_pct ??
    meta.performance_bond?.percentage ??
    meta.performance_bond_pct;
  const hasExplicitBond =
    meta.has_performance_bond === false ||
    meta.performance_bond?.has_bond === false ||
    (rawBond !== undefined && rawBond !== null && rawBond !== '');
  const performanceBondPct =
    meta.has_performance_bond === false || meta.performance_bond?.has_bond === false
      ? 0
      : hasExplicitBond
      ? Number(rawBond)
      : null;

  const rawRetention =
    (project as any)?.retention_pct ??
    meta.retention_terms?.rate_pct ??
    meta.retention_pct ??
    meta.retention_rate_pct;
  const hasExplicitRetention =
    meta.retention_terms?.type === 'none' ||
    (rawRetention !== undefined && rawRetention !== null && rawRetention !== '');
  const retentionPct =
    meta.retention_terms?.type === 'none'
      ? 0
      : hasExplicitRetention
      ? Number(rawRetention)
      : null;

  const contractForm =
    meta.fidic_type ||
    primaryContract?.fidic_type ||
    (project as any).contract_type ||
    null;

  // Financial figures
  const originalValue = Number(
    summary?.totalOriginalValue || project.contract_value_egp || project.contract_value || 0
  );
  const vosValue = Number(summary?.totalVOs || project.vos_value || 0);
  const netContractValue = Number(summary?.netContractValue || originalValue + vosValue);

  const advancePaymentAmount =
    meta.advance_payment_value && Number(meta.advance_payment_value) > 0
      ? Number(meta.advance_payment_value)
      : advancePaymentPct !== null
      ? (originalValue * advancePaymentPct) / 100
      : null;

  const retentionAmount =
    meta.retention_terms?.manual_amount && Number(meta.retention_terms.manual_amount) > 0
      ? Number(meta.retention_terms.manual_amount)
      : retentionPct !== null
      ? (netContractValue * retentionPct) / 100
      : null;

  const performanceBondAmount =
    meta.performance_bond?.calc_type === 'manual' && Number(meta.performance_bond?.manual_value) > 0
      ? Number(meta.performance_bond.manual_value)
      : performanceBondPct !== null
      ? (netContractValue * performanceBondPct) / 100
      : null;

  // Form state for inline verification & editing
  const defaultContractFormLabel = isAr
    ? 'عقد مقاولة بي زون القياسي'
    : 'P.Zone Standard Construction Contract';

  const [formState, setFormState] = useState({
    contract_date: awardDate || '',
    start_date: startDate || '',
    planned_finish_date: finishDate || '',
    contract_duration_months: durationMonths ? String(durationMonths) : '',
    advance_payment_pct: advancePaymentPct !== null ? String(advancePaymentPct) : '',
    performance_bond_pct: performanceBondPct !== null ? String(performanceBondPct) : '',
    retention_pct: retentionPct !== null ? String(retentionPct) : '',
    fidic_type: contractForm || defaultContractFormLabel,
  });

  useEffect(() => {
    setFormState({
      contract_date: awardDate || '',
      start_date: startDate || '',
      planned_finish_date: finishDate || '',
      contract_duration_months: durationMonths ? String(durationMonths) : '',
      advance_payment_pct: advancePaymentPct !== null ? String(advancePaymentPct) : '',
      performance_bond_pct: performanceBondPct !== null ? String(performanceBondPct) : '',
      retention_pct: retentionPct !== null ? String(retentionPct) : '',
      fidic_type: contractForm || defaultContractFormLabel,
    });
  }, [
    awardDate,
    startDate,
    finishDate,
    durationMonths,
    advancePaymentPct,
    performanceBondPct,
    retentionPct,
    contractForm,
    defaultContractFormLabel,
  ]);

  // Identify missing or unverified fields for Contracts Engineer Alert
  const missingItems: string[] = [];
  if (!awardDate) missingItems.push(isAr ? 'تاريخ التعاقد' : 'Award Date');
  if (!startDate) missingItems.push(isAr ? 'تاريخ أمر الإسناد / البدء' : 'Start Date');
  if (!finishDate) missingItems.push(isAr ? 'تاريخ الإنجاز التعاقدي' : 'Contract Finish Date');
  if (!durationMonths) missingItems.push(isAr ? 'المدة التعاقدية (بالأشهر)' : 'Contract Duration');
  if (advancePaymentPct === null || performanceBondPct === null || retentionPct === null) {
    missingItems.push(isAr ? 'نسب الضمانات والدفعة المقدمة' : 'Guarantee & Advance Percentages');
  }

  const isDatesVerified = Boolean(meta.contract_dates_verified) && missingItems.length === 0;

  // Resolve Client Name from all canonical project fields
  const resolvedClientName = isAr
    ? ((project as any).client?.name_ar ||
       (project as any).client?.name_en ||
       project.client_name_ar ||
       (project as any).client_name_raw ||
       project.client_name ||
       meta.client_name ||
       'غير محدد (يرجى ربط العميل)')
    : ((project as any).client?.name_en ||
       project.client_name ||
       (project as any).client?.name_ar ||
       project.client_name_ar ||
       (project as any).client_name_raw ||
       meta.client_name ||
       'Not Specified');

  const fmtCurrency = (val: number) =>
    new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'EGP',
      maximumFractionDigits: 0,
    }).format(val || 0);

  // Notify Contracts Engineer handler
  const handleNotifyContractsEngineer = async () => {
    setNotifying(true);
    setBannerFeedback(null);
    try {
      const stakeholders = await ProjectService.getProjectStakeholders(project.id);
      const contractsEng = stakeholders.find(
        (s) =>
          (s.project_role || '').toLowerCase().includes('contract') ||
          (s.stakeholder?.role || '').toLowerCase().includes('contract') ||
          (s.project_role || '').includes('عقود') ||
          (s.stakeholder?.role || '').includes('عقود')
      );
      const recipientId =
        contractsEng?.stakeholder_id ||
        project.project_manager_id ||
        (project as any).manager_id ||
        null;

      const missingListText =
        missingItems.length > 0
          ? missingItems.join('، ')
          : isAr
          ? 'مراجعة دورية للتواريخ والشروط التعاقدية'
          : 'Periodic review of contract dates and terms';

      if (recipientId) {
        await NotificationService.createNotification({
          recipient_user_id: recipientId,
          project_id: project.id,
          event_type: 'contract_dates_verification_required',
          entity_type: 'general',
          entity_id: project.id,
          title_ar: `تنبيه مهندس العقود: مراجعة وتأكيد تواريخ عقد المشروع (${project.project_code})`,
          title_en: `Contracts Engineer Alert: Verify Contract Dates (${project.project_code})`,
          body_ar: `يرجى متابعة واستيفاء التواريخ والشروط التعاقدية للمشروع "${project.project_name || project.name_ar || project.project_code}": ${missingListText}.`,
          body_en: `Please verify and confirm contractual dates and terms for project "${project.project_code}": ${missingListText}.`,
          link_url: `/projects/${project.id}?tab=contracts`,
          metadata: {
            project_code: project.project_code,
            missing_fields: missingItems,
          },
        });
      }

      // Record alert timestamp in project metadata
      await ProjectService.updateProject(project.id, {
        metadata: {
          ...meta,
          last_contract_engineer_alert_at: new Date().toISOString(),
          last_contract_engineer_alert_by: 'contracts_portal',
        },
      } as any);

      setBannerFeedback({
        type: 'success',
        text: isAr
          ? `تم إرسال تنبيه رسمي لمهندس العقود لمتابعة وتأكيد التواريخ التعاقدية للمشروع (${project.project_code}).`
          : `Official verification alert sent to Contracts Engineer for project (${project.project_code}).`,
      });
      onProjectUpdate?.();
    } catch (err) {
      console.error('Failed to notify contracts engineer:', err);
      setBannerFeedback({
        type: 'error',
        text: isAr ? 'تعذر إرسال التنبيه، يرجى المحاولة مرة أخرى.' : 'Failed to send alert, please try again.',
      });
    } finally {
      setNotifying(false);
    }
  };

  // Save & Confirm Contract Dates & Terms
  const handleSaveContractTerms = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setBannerFeedback(null);
    try {
      // Auto-compute duration in months if start & finish dates are set and duration is blank
      let computedDuration = formState.contract_duration_months
        ? Number(formState.contract_duration_months)
        : null;
      if (!computedDuration && formState.start_date && formState.planned_finish_date) {
        const d1 = new Date(formState.start_date);
        const d2 = new Date(formState.planned_finish_date);
        const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          computedDuration = Math.max(1, Math.round(diffDays / 30));
        }
      }

      const advPct = formState.advance_payment_pct !== '' ? Number(formState.advance_payment_pct) : null;
      const bondPct = formState.performance_bond_pct !== '' ? Number(formState.performance_bond_pct) : null;
      const retPct = formState.retention_pct !== '' ? Number(formState.retention_pct) : null;

      const updatedMeta = {
        ...meta,
        contract_date: formState.contract_date || null,
        start_date: formState.start_date || null,
        end_date: formState.planned_finish_date || null,
        contract_duration_months: computedDuration,
        advance_payment_pct: advPct,
        performance_bond_pct: bondPct,
        retention_pct: retPct,
        fidic_type: formState.fidic_type.trim() || defaultContractFormLabel,
        contract_dates_verified: true,
        contract_dates_verified_at: new Date().toISOString(),
        contract_dates_verified_by: 'contracts_engineer',
      };

      await ProjectService.updateProject(project.id, {
        contract_date: formState.contract_date || null,
        start_date: formState.start_date || null,
        planned_finish_date: formState.planned_finish_date || null,
        end_date: formState.planned_finish_date || null,
        contract_duration_months: computedDuration,
        metadata: updatedMeta,
      } as any);

      appCache.invalidate(`contracts_${project.id}`);
      appCache.invalidate(`contract_summary_${project.id}`);

      setIsEditing(false);
      setBannerFeedback({
        type: 'success',
        text: isAr
          ? 'تم حفظ وتأكيد صحة التواريخ والشروط التعاقدية بنجاح.'
          : 'Contract dates and commercial terms saved and verified.',
      });
      await loadData();
      onProjectUpdate?.();
    } catch (err) {
      console.error('Failed to save contract terms:', err);
      setBannerFeedback({
        type: 'error',
        text: isAr ? 'حدث خطأ أثناء حفظ البيانات التعاقدية.' : 'Failed to save contractual data.',
      });
    } finally {
      setSaving(false);
    }
  };

  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const canEditProject =
    isAdmin || canEditPath('/projects', roles, isAdmin, dbAccessRules);

  return (
    <div className="space-y-6" data-testid="contract-tab">
      {/* Header Banner */}
      <div className="rounded-3xl p-6 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3.5 rounded-2xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shadow-inner">
            <FileText className="w-7 h-7" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {isAr ? 'بيانات العقد والشروط التعاقدية' : 'Contract & Commercial Terms'}
              </h2>
              {isDatesVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مؤكد من مهندس العقود' : 'Verified by Contracts Eng.'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{isAr ? 'بانتظار مراجعة وتأكيد مهندس العقود' : 'Pending Contracts Eng. Verification'}</span>
                </span>
              )}
              {loading && (
                <span className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 font-medium animate-pulse">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>{isAr ? 'تحديث...' : 'Syncing...'}</span>
                </span>
              )}
            </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {isAr
                ? `رقم العقد: ${primaryContract?.contract_number || project.project_code || '---'} | بي زون التجارية (P.Zone International)`
                : `Contract No: ${primaryContract?.contract_number || project.project_code || '---'} | P.Zone International`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEditProject && (
            <button
              type="button"
              data-testid="contract-tab-edit-toggle-btn"
              onClick={() => setIsEditing((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>
                {isEditing
                  ? isAr
                    ? 'إغلاق نموذج التعديل'
                    : 'Close Editor'
                  : isAr
                  ? 'تحديث وتأكيد التواريخ والشروط'
                  : 'Verify & Edit Terms'}
              </span>
            </button>
          )}

          {!isFocusedProjectsMode() && (
            <Link
              href="/contracts"
              data-testid="contract-tab-hub-link"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{isAr ? 'بوابة إدارة العقود المركزية' : 'Contracts Hub'}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Contracts Engineer Follow-up & Verification Alert Banner */}
      {(!isDatesVerified || bannerFeedback) && (
        <div
          className={`rounded-3xl p-5 border shadow-sm transition-all ${
            !isDatesVerified
              ? 'border-amber-300/90 dark:border-amber-700/70 bg-amber-50/70 dark:bg-amber-950/25'
              : 'border-emerald-300/90 dark:border-emerald-700/70 bg-emerald-50/70 dark:bg-emerald-950/25'
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-2xl shrink-0 ${
                  !isDatesVerified
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {!isDatesVerified ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {!isDatesVerified
                    ? isAr
                      ? 'تنبيه لمهندس العقود: مطلوب متابعة التواريخ التعاقدية والتأكيد على صحتها'
                      : 'Contracts Engineer Alert: Contractual Dates & Terms Require Verification'
                    : isAr
                    ? 'تم تأكيد البيانات والتواريخ التعاقدية'
                    : 'Contractual Dates & Terms Verified'}
                </h3>
                {!isDatesVerified && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isAr
                      ? 'تم منع عرض أي تواريخ تلقائية غير مؤكدة (مثل تاريخ إنشاء السجل). يرجى من مهندس العقود مراجعة العقد الأصلي وتأكيد الحقول التالية:'
                      : 'Unverified system timestamps are hidden. The Contracts Engineer must verify the following contractual fields:'}
                  </p>
                )}

                {missingItems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {missingItems.map((item) => (
                      <span
                        key={item}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-xs"
                      >
                        • {item}
                      </span>
                    ))}
                  </div>
                )}

                {meta.last_contract_engineer_alert_at && !isDatesVerified && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium pt-0.5">
                    {isAr
                      ? `آخر تنبيه مرسل لمهندس العقود: ${cleanContractDate(meta.last_contract_engineer_alert_at)}`
                      : `Last alert sent to Contracts Engineer: ${cleanContractDate(meta.last_contract_engineer_alert_at)}`}
                  </p>
                )}

                {bannerFeedback && (
                  <p
                    className={`text-xs font-bold pt-1 ${
                      bannerFeedback.type === 'success'
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {bannerFeedback.text}
                  </p>
                )}
              </div>
            </div>

            {canEditProject && (
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <button
                  type="button"
                  data-testid="contract-tab-notify-engineer-btn"
                  onClick={handleNotifyContractsEngineer}
                  disabled={notifying}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  {notifying ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <BellRing className="w-4 h-4" />
                  )}
                  <span>
                    {isAr ? 'إرسال تنبيه متابعة لمهندس العقود' : 'Send Alert to Contracts Engineer'}
                  </span>
                </button>

                {!isEditing && (
                  <button
                    type="button"
                    data-testid="contract-tab-confirm-dates-btn"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'تأكيد واستيفاء التواريخ الآن' : 'Confirm Dates Now'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline Editor for Contracts Engineer to Verify & Save Dates/Terms */}
      {isEditing && (
        <form
          onSubmit={handleSaveContractTerms}
          className="rounded-3xl p-6 border-2 border-blue-500/40 dark:border-blue-500/30 bg-white dark:bg-slate-900 shadow-lg space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>
                  {isAr
                    ? 'نموذج مهندس العقود لتأكيد التواريخ والشروط التعاقدية'
                    : 'Contracts Engineer Verification Form'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'أدخل التواريخ الفعلية من نسخة العقد الموقعة لتفعيل المتابعة الزمنية والتنبيهات التلقائية'
                  : 'Enter actual dates from the signed contract to enable schedule tracking'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              aria-label={isAr ? 'إغلاق' : 'Close'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'تاريخ التعاقد / الترسية' : 'Contract / Award Date'}
              </label>
              <input
                type="date"
                value={formState.contract_date}
                onChange={(e) => setFormState((s) => ({ ...s, contract_date: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'تاريخ أمر الإسناد / استلام الموقع' : 'Start / Handover Date'}
              </label>
              <input
                type="date"
                value={formState.start_date}
                onChange={(e) => setFormState((s) => ({ ...s, start_date: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'تاريخ الإنجاز التعاقدي (النهو)' : 'Contractual Finish Date'}
              </label>
              <input
                type="date"
                value={formState.planned_finish_date}
                onChange={(e) => setFormState((s) => ({ ...s, planned_finish_date: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'المدة التعاقدية (بالأشهر)' : 'Contract Duration (Months)'}
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder={isAr ? 'تحسب تلقائياً أو أدخل يدوياً' : 'Auto or manual'}
                value={formState.contract_duration_months}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, contract_duration_months: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'نسبة الدفعة المقدمة (%)' : 'Advance Payment (%)'}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="0 - 100"
                value={formState.advance_payment_pct}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, advance_payment_pct: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'نسبة خطاب ضمان حسن التنفيذ (%)' : 'Performance Bond (%)'}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="0 - 100"
                value={formState.performance_bond_pct}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, performance_bond_pct: e.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'نسبة تأمين الأعمال / الصيانة (%)' : 'Retention Money (%)'}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                placeholder="0 - 100"
                value={formState.retention_pct}
                onChange={(e) => setFormState((s) => ({ ...s, retention_pct: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {isAr ? 'نموذج التعاقد المعتمد' : 'Contract Form'}
              </label>
              <input
                type="text"
                value={formState.fidic_type}
                onChange={(e) => setFormState((s) => ({ ...s, fidic_type: e.target.value }))}
                placeholder={isAr ? 'مثال: عقد مقاولة بي زون القياسي' : 'e.g. Standard Contract'}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:focus:ring-blue-400/40 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              data-testid="contract-tab-save-terms-btn"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 text-white text-xs font-bold shadow-md cursor-pointer transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isAr ? 'حفظ وتأكيد صحة البيانات التعاقدية' : 'Save & Verify Contract Data'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Core Financial Summary — 3 Non-Duplicated Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Original Contract Value */}
        <div className="rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>{isAr ? 'قيمة العقد الأصلية' : 'Original Contract Value'}</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-slate-900 dark:text-white" dir="ltr">
            {fmtCurrency(originalValue)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr ? 'القيمة الابتدائية للتعاقد قبل التعديلات' : 'Initial baseline contract value'}
          </p>
        </div>

        {/* Net Variation Orders */}
        <div className="rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>{isAr ? 'صافي أوامر التغيير المعتمدة' : 'Net Variation Orders'}</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40">
              <FileDiff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div
            className={`text-xl font-black font-mono ${
              vosValue >= 0
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
            dir="ltr"
          >
            {vosValue >= 0 ? `+${fmtCurrency(vosValue)}` : fmtCurrency(vosValue)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isAr ? 'إجمالي الإضافات والخصومات المعتمدة' : 'Total approved VOs'}
          </p>
        </div>

        {/* Revised Total Contract Value */}
        <div className="rounded-2xl p-5 border border-emerald-200/70 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/30 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <span>{isAr ? 'القيمة التعاقدية المعدلة السارية' : 'Revised Contract Value'}</span>
            <div className="p-1.5 rounded-lg bg-emerald-100/70 dark:bg-emerald-900/60">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-xl font-black font-mono text-emerald-700 dark:text-emerald-300" dir="ltr">
            {fmtCurrency(netContractValue)}
          </div>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80">
            {isAr ? 'إجمالي قيمة العقد شاملاً أوامر التغيير' : 'Active contract total including VOs'}
          </p>
        </div>
      </div>

      {/* Main Details Grid: Commercial Conditions + Timeline + Contracting Parties */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Commercial Terms & Verified Schedule */}
        <div className="lg:col-span-2 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
          {/* Commercial Guarantees (Single Source — No Duplication) */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{isAr ? 'الشروط المالية والضمانات التعاقدية' : 'Commercial Terms & Guarantees'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Advance Payment */}
              <div className="rounded-2xl p-4 border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/25 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                    {isAr ? 'الدفعة المقدمة' : 'Advance Payment'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    {advancePaymentPct !== null ? `${advancePaymentPct}%` : isAr ? 'غير مؤكد' : 'Unverified'}
                  </span>
                </div>
                <div className="text-base font-black font-mono text-blue-900 dark:text-blue-100" dir="ltr">
                  {advancePaymentAmount !== null
                    ? fmtCurrency(advancePaymentAmount)
                    : isAr
                    ? 'بانتظار تأكيد النسبة'
                    : 'Pending %'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr ? 'تسترد بنسبة استقطاع من المستخلصات' : 'Amortized from IPCs'}
                </p>
              </div>

              {/* Performance Bond */}
              <div className="rounded-2xl p-4 border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/25 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                    {isAr ? 'ضمان حسن التنفيذ' : 'Performance Bond'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    {performanceBondPct !== null ? `${performanceBondPct}%` : isAr ? 'غير مؤكد' : 'Unverified'}
                  </span>
                </div>
                <div className="text-base font-black font-mono text-indigo-900 dark:text-indigo-100" dir="ltr">
                  {performanceBondAmount !== null
                    ? fmtCurrency(performanceBondAmount)
                    : isAr
                    ? 'بانتظار تأكيد النسبة'
                    : 'Pending %'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr ? 'خطاب ضمان بنكي ابتدائي / نهائي' : 'Bank guarantee'}
                </p>
              </div>

              {/* Retention Money */}
              <div className="rounded-2xl p-4 border border-purple-100 dark:border-purple-900/40 bg-purple-50/40 dark:bg-purple-950/25 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                    {isAr ? 'تأمين الأعمال والصيانة' : 'Retention Money'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                    {retentionPct !== null ? `${retentionPct}%` : isAr ? 'غير مؤكد' : 'Unverified'}
                  </span>
                </div>
                <div className="text-base font-black font-mono text-purple-900 dark:text-purple-100" dir="ltr">
                  {retentionAmount !== null
                    ? fmtCurrency(retentionAmount)
                    : isAr
                    ? 'بانتظار تأكيد النسبة'
                    : 'Pending %'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isAr ? 'يسترد عند التسليم الابتدائي والنهائي' : 'Released upon TOC/DLP'}
                </p>
              </div>
            </div>
          </div>

          {/* Contractual Dates & Schedule */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{isAr ? 'المواعيد والمدد التعاقدية الفعلية' : 'Verified Contractual Dates & Duration'}</span>
              </h4>
              {meta.contract_dates_verified_at && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  {isAr
                    ? `تم التأكيد بتاريخ: ${cleanContractDate(meta.contract_dates_verified_at)}`
                    : `Verified on: ${cleanContractDate(meta.contract_dates_verified_at)}`}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div
                className={`p-3 rounded-xl border ${
                  awardDate
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-100/80 dark:border-slate-800'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/50'
                }`}
              >
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                  {isAr ? 'تاريخ التعاقد' : 'Award Date'}
                </span>
                {awardDate ? (
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{awardDate}</span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    {isAr ? 'غير محدد — مطلوب تأكيد' : 'Unverified'}
                  </span>
                )}
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  startDate
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-100/80 dark:border-slate-800'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/50'
                }`}
              >
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                  {isAr ? 'تاريخ أمر الإسناد / البدء' : 'Start Date'}
                </span>
                {startDate ? (
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{startDate}</span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    {isAr ? 'غير محدد — مطلوب تأكيد' : 'Unverified'}
                  </span>
                )}
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  finishDate
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-100/80 dark:border-slate-800'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/50'
                }`}
              >
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                  {isAr ? 'تاريخ الإنجاز التعاقدي' : 'Contract Finish'}
                </span>
                {finishDate ? (
                  <span className="font-bold font-mono text-slate-800 dark:text-slate-200">{finishDate}</span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    {isAr ? 'غير محدد — مطلوب تأكيد' : 'Unverified'}
                  </span>
                )}
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  durationMonths
                    ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-100/80 dark:border-slate-800'
                    : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/50'
                }`}
              >
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">
                  {isAr ? 'المدة التعاقدية' : 'Contract Duration'}
                </span>
                {durationMonths ? (
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {durationMonths} {isAr ? 'شهر' : 'months'}
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                    {isAr ? 'غير محدد — مطلوب تأكيد' : 'Unverified'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Contracting Parties & Canonical Identity */}
        <div className="rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? 'أطراف التعاقد' : 'Contracting Parties'}</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 block">
                {isAr ? 'صاحب العمل / العميل' : 'Client / Employer'}
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">{resolvedClientName}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 block">
                {isAr ? 'الشركة المنفذة (المقاول)' : 'Contractor'}
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {isAr ? 'بي زون التجارية (P.Zone International)' : 'P.Zone International'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-[10px] text-slate-600 dark:text-slate-300 block">
                {isAr ? 'نموذج التعاقد' : 'Contract Form'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold text-[11px]">
                  {contractForm || (isAr ? 'عقد مقاولة بي زون القياسي' : 'P.Zone Standard Contract')}
                </span>
              </div>
            </div>

            {!isFocusedProjectsMode() && (
              <div className="pt-2">
                <Link
                  href="/contracts/claims"
                  data-testid="contract-tab-claims-link"
                  className="group w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
                >
                  <span>{isAr ? 'سجل المطالبات وتمديد المدة (EOT)' : 'Claims & EOT Register'}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ContractTab.displayName = 'ContractTab';
