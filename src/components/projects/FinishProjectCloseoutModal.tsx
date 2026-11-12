'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Project } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
const fmtCurrency = (val: number) => {
  return `${Number(val || 0).toLocaleString('eg-EG', { maximumFractionDigits: 0 })} ج.م`;
};
import {
  ProjectCloseoutAuditPayload,
  CloseoutReadinessReport,
} from '@/types/closeout';
import { evaluateProjectCloseoutReadiness } from '@/lib/utils/closeout-governance.utils';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Banknote,
  FileCheck2,
  Calendar,
  X,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Info,
  Building2,
  CreditCard,
  Lock,
  Unlock,
  AlertOctagon,
} from 'lucide-react';

export interface FinishProjectCloseoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCloseout: (payload: ProjectCloseoutAuditPayload) => Promise<void>;
  project: Project;
  loading?: boolean;
}

export const FinishProjectCloseoutModal: React.FC<FinishProjectCloseoutModalProps> = ({
  isOpen,
  onClose,
  onConfirmCloseout,
  project,
  loading = false,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const initialReport = useMemo(() => {
    return evaluateProjectCloseoutReadiness(project);
  }, [project]);

  // Form State initialized from current project evaluation
  // 1. Handover Checks
  const [tocReceived, setTocReceived] = useState<boolean>(initialReport.handover.toc_received);
  const [tocReference, setTocReference] = useState<string>(initialReport.handover.toc_reference || '');
  const [snagsResolved, setSnagsResolved] = useState<boolean>(initialReport.handover.snags_resolved);
  const [asBuiltHandedOver, setAsBuiltHandedOver] = useState<boolean>(initialReport.handover.as_built_handed_over);
  const [omManualsHandedOver, setOmManualsHandedOver] = useState<boolean>(initialReport.handover.om_manuals_handed_over);
  const [testingCommissioningPassed, setTestingCommissioningPassed] = useState<boolean>(initialReport.handover.testing_commissioning_passed);

  // 2. Retention Checks
  const [tranche1Collected, setTranche1Collected] = useState<boolean>(initialReport.retention.tranche_1_collected);
  const [tranche1CollectedDate, setTranche1CollectedDate] = useState<string>(
    initialReport.retention.tranche_1_collected_at || new Date().toISOString().split('T')[0]
  );
  const [tranche2Collected, setTranche2Collected] = useState<boolean>(initialReport.retention.tranche_2_collected);
  const [tranche2CollectedDate, setTranche2CollectedDate] = useState<string>(
    initialReport.retention.tranche_2_collected_at || new Date().toISOString().split('T')[0]
  );

  // 3. Guarantees & Checks
  const [performanceBondReturned, setPerformanceBondReturned] = useState<boolean>(
    initialReport.guarantees.performance_bond_returned
  );
  const [performanceBondReturnRef, setPerformanceBondReturnRef] = useState<string>(
    initialReport.guarantees.performance_bond_return_ref || ''
  );
  const [performanceBondReturnDate, setPerformanceBondReturnDate] = useState<string>(
    initialReport.guarantees.performance_bond_return_date || new Date().toISOString().split('T')[0]
  );

  const [advancePaymentBondReturned, setAdvancePaymentBondReturned] = useState<boolean>(
    initialReport.guarantees.advance_payment_bond_returned
  );
  const [advancePaymentReturnRef, setAdvancePaymentReturnRef] = useState<string>(
    initialReport.guarantees.advance_payment_return_ref || ''
  );

  const [allChecksRetrieved, setAllChecksRetrieved] = useState<boolean>(
    initialReport.guarantees.all_checks_retrieved
  );
  const [checksRetrievalNotes, setChecksRetrievalNotes] = useState<string>(
    initialReport.guarantees.checks_retrieval_notes || ''
  );

  const [deductionsRefunded, setDeductionsRefunded] = useState<boolean>(
    initialReport.guarantees.deductions_refunded
  );
  const [deductionsRefundRef, setDeductionsRefundRef] = useState<string>(
    initialReport.guarantees.deductions_refund_ref || ''
  );

  // 4. Final Settlement & Clearance
  const [finalSettlementSigned, setFinalSettlementSigned] = useState<boolean>(
    initialReport.clearance.final_settlement_signed
  );
  const [dischargeLetterRef, setDischargeLetterRef] = useState<string>(
    initialReport.clearance.discharge_letter_ref || ''
  );
  const [closeoutEngineerName, setCloseoutEngineerName] = useState<string>(
    initialReport.clearance.closeout_engineer_name || ''
  );
  const [closeoutNotes, setCloseoutNotes] = useState<string>(
    initialReport.clearance.closeout_notes || ''
  );

  // Exception / Override management
  const [allowOverride, setAllowOverride] = useState<boolean>(false);
  const [overrideJustification, setOverrideJustification] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Active section accordions
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    handover: true,
    retention: true,
    guarantees: true,
    clearance: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const rep = evaluateProjectCloseoutReadiness(project);
      setTocReceived(rep.handover.toc_received);
      setTocReference(rep.handover.toc_reference || '');
      setSnagsResolved(rep.handover.snags_resolved);
      setAsBuiltHandedOver(rep.handover.as_built_handed_over);
      setOmManualsHandedOver(rep.handover.om_manuals_handed_over);
      setTestingCommissioningPassed(rep.handover.testing_commissioning_passed);

      setTranche1Collected(rep.retention.tranche_1_collected);
      setTranche2Collected(rep.retention.tranche_2_collected);

      setPerformanceBondReturned(rep.guarantees.performance_bond_returned);
      setPerformanceBondReturnRef(rep.guarantees.performance_bond_return_ref || '');
      setAdvancePaymentBondReturned(rep.guarantees.advance_payment_bond_returned);
      setAdvancePaymentReturnRef(rep.guarantees.advance_payment_return_ref || '');
      setAllChecksRetrieved(rep.guarantees.all_checks_retrieved);
      setChecksRetrievalNotes(rep.guarantees.checks_retrieval_notes || '');
      setDeductionsRefunded(rep.guarantees.deductions_refunded);

      setFinalSettlementSigned(rep.clearance.final_settlement_signed);
      setDischargeLetterRef(rep.clearance.discharge_letter_ref || '');
      setCloseoutEngineerName(rep.clearance.closeout_engineer_name || '');
      setCloseoutNotes(rep.clearance.closeout_notes || '');
      setErrorMessage('');
    }
  }, [isOpen, project]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || loading) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  // Dynamic live readiness based on form inputs
  const liveReadiness = useMemo(() => {
    const unmet: string[] = [];

    // Handover
    if (!tocReceived) unmet.push(isAr ? 'شهادة الاستلام الابتدائي TOC غير معتمدة' : 'TOC certificate not certified');
    if (!snagsResolved) unmet.push(isAr ? 'ملاحظات الاستلام Snags لم تكتمل' : 'Snag list items not completed');
    if (!asBuiltHandedOver) unmet.push(isAr ? 'الرسومات التنفيذية As-Built لم تُسلم' : 'As-built drawings not submitted');
    if (!omManualsHandedOver) unmet.push(isAr ? 'كتيبات التشغيل والصيانة لم تُسلم' : 'O&M manuals not submitted');
    if (!testingCommissioningPassed) unmet.push(isAr ? 'تجارب التشغيل والاختبار لم تُعتمد' : 'T&C not certified');

    // Retention
    if (initialReport.retention.has_retention && initialReport.retention.total_retention_amount > 0) {
      if (!tranche1Collected) unmet.push(isAr ? 'الشريحة الأولى من محتجز الضمان (TOC) لم تُستلم' : 'Retention Tranche 1 not collected');
      if (!tranche2Collected) unmet.push(isAr ? 'الشريحة الثانية من محتجز الضمان (DLP) لم تُستلم' : 'Retention Tranche 2 not collected');
    }

    // Guarantees
    if (initialReport.guarantees.performance_bond_applicable && !performanceBondReturned) {
      unmet.push(isAr ? 'خطاب ضمان حسن التنفيذ لم يُسترد ويُلغَ' : 'Performance bond not retrieved/cancelled');
    }
    if (initialReport.guarantees.advance_payment_bond_applicable && !advancePaymentBondReturned) {
      unmet.push(isAr ? 'خطاب ضمان الدفعة المقدمة لم يُسترد' : 'Advance payment guarantee not retrieved');
    }
    if (initialReport.guarantees.guarantee_checks_applicable && !allChecksRetrieved) {
      unmet.push(isAr ? 'توجد شيكات ضمان تعاقدية لم تُسترد' : 'Guarantee checks not retrieved');
    }
    if (initialReport.guarantees.contractual_deductions_1yr_applicable && !initialReport.guarantees.is_one_year_passed_from_toc) {
      unmet.push(
        isAr
          ? `فترة عام من TOC لم تكتمل (متبقي ${initialReport.guarantees.remaining_days_to_one_year} يوماً)`
          : `1 year from TOC not elapsed (${initialReport.guarantees.remaining_days_to_one_year} days remaining)`
      );
    }
    if (initialReport.guarantees.contractual_deductions_1yr_applicable && !deductionsRefunded) {
      unmet.push(isAr ? 'الاستقطاعات التعاقدية المؤجلة بعد عام لم تُسوَّ' : '1-year contractual deductions not settled');
    }

    // Clearance
    if (!finalSettlementSigned) {
      unmet.push(isAr ? 'المخالصة النهائية وإبراء الذمة لم تُوقع' : 'Final settlement & clearance not signed');
    }

    const isAllStrictlyMet = unmet.length === 0;
    const canSubmit = isAllStrictlyMet || (allowOverride && overrideJustification.trim().length >= 10);

    return {
      unmet,
      isAllStrictlyMet,
      canSubmit,
    };
  }, [
    tocReceived,
    snagsResolved,
    asBuiltHandedOver,
    omManualsHandedOver,
    testingCommissioningPassed,
    tranche1Collected,
    tranche2Collected,
    performanceBondReturned,
    advancePaymentBondReturned,
    allChecksRetrieved,
    deductionsRefunded,
    finalSettlementSigned,
    allowOverride,
    overrideJustification,
    initialReport,
    isAr,
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!liveReadiness.canSubmit) {
      setErrorMessage(
        isAr
          ? 'لا يمكن إنهاء المشروع لوجود متطلبات تعاقدية معلقة. يجب استيفاء كافة المتطلبات أو إدخال مبرر استثناء إداري معتمد (10 أحرف على الأقل).'
          : 'Cannot finish project with pending requirements. Satisfy all conditions or provide an approved override justification.'
      );
      return;
    }

    const payload: ProjectCloseoutAuditPayload = {
      handover: {
        toc_received: tocReceived,
        toc_reference: tocReference.trim() || undefined,
        toc_date: initialReport.handover.toc_date,
        snags_resolved: snagsResolved,
        snag_list_type: initialReport.handover.snag_list_type,
        as_built_handed_over: asBuiltHandedOver,
        om_manuals_handed_over: omManualsHandedOver,
        testing_commissioning_passed: testingCommissioningPassed,
        all_handover_met:
          tocReceived &&
          snagsResolved &&
          asBuiltHandedOver &&
          omManualsHandedOver &&
          testingCommissioningPassed,
        unmet_reasons: [],
      },
      retention: {
        has_retention: initialReport.retention.has_retention,
        retention_pct: initialReport.retention.retention_pct,
        total_retention_amount: initialReport.retention.total_retention_amount,
        tranche_1_amount: initialReport.retention.tranche_1_amount,
        tranche_1_collected: tranche1Collected,
        tranche_1_collected_at: tranche1Collected ? tranche1CollectedDate : undefined,
        tranche_2_amount: initialReport.retention.tranche_2_amount,
        tranche_2_collected: tranche2Collected,
        tranche_2_collected_at: tranche2Collected ? tranche2CollectedDate : undefined,
        retention_fully_settled: tranche1Collected && tranche2Collected,
        unmet_reasons: [],
      },
      guarantees: {
        performance_bond_applicable: initialReport.guarantees.performance_bond_applicable,
        performance_bond_number: initialReport.guarantees.performance_bond_number,
        performance_bond_bank: initialReport.guarantees.performance_bond_bank,
        performance_bond_amount: initialReport.guarantees.performance_bond_amount,
        performance_bond_returned: performanceBondReturned,
        performance_bond_return_ref: performanceBondReturnRef.trim() || undefined,
        performance_bond_return_date: performanceBondReturned ? performanceBondReturnDate : undefined,

        advance_payment_bond_applicable: initialReport.guarantees.advance_payment_bond_applicable,
        advance_payment_bond_number: initialReport.guarantees.advance_payment_bond_number,
        advance_payment_fully_amortized: true,
        advance_payment_bond_returned: advancePaymentBondReturned,
        advance_payment_return_ref: advancePaymentReturnRef.trim() || undefined,

        guarantee_checks_applicable: initialReport.guarantees.guarantee_checks_applicable,
        guarantee_checks_count: initialReport.guarantees.guarantee_checks_count,
        all_checks_retrieved: allChecksRetrieved,
        checks_retrieval_notes: checksRetrievalNotes.trim() || undefined,

        contractual_deductions_1yr_applicable: initialReport.guarantees.contractual_deductions_1yr_applicable,
        deductions_amount: initialReport.guarantees.deductions_amount,
        is_one_year_passed_from_toc: initialReport.guarantees.is_one_year_passed_from_toc,
        elapsed_days_from_toc: initialReport.guarantees.elapsed_days_from_toc,
        remaining_days_to_one_year: initialReport.guarantees.remaining_days_to_one_year,
        deductions_refunded: deductionsRefunded,
        deductions_refund_ref: deductionsRefundRef.trim() || undefined,

        all_guarantees_met:
          performanceBondReturned &&
          advancePaymentBondReturned &&
          allChecksRetrieved &&
          deductionsRefunded,
        unmet_reasons: [],
      },
      clearance: {
        final_settlement_signed: finalSettlementSigned,
        discharge_letter_ref: dischargeLetterRef.trim() || undefined,
        all_invoices_settled: true,
        closeout_notes: closeoutNotes.trim() || undefined,
        closeout_engineer_name: closeoutEngineerName.trim() || undefined,
        closed_at: new Date().toISOString(),
        all_clearance_met: finalSettlementSigned,
        unmet_reasons: [],
      },
      is_eligible_for_closeout: liveReadiness.isAllStrictlyMet,
      closed_at: new Date().toISOString(),
      override_justification: allowOverride ? overrideJustification.trim() : undefined,
    };

    await onConfirmCloseout(payload);
  };

  return (
    <div
      id="finish_project_closeout_modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="closeout_modal_title"
      aria-describedby="closeout_modal_desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${
              liveReadiness.isAllStrictlyMet
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
            }`}>
              {liveReadiness.isAllStrictlyMet ? (
                <ShieldCheck className="w-6 h-6" />
              ) : (
                <AlertOctagon className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 id="closeout_modal_title" className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{isAr ? 'بوابة الإغلاق التعاقدي والتسليم النهائي للمشروع' : 'Contract Closeout & Final Handover Gate'}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                  liveReadiness.isAllStrictlyMet
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300/50 dark:border-emerald-800/50'
                    : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300/50 dark:border-amber-800/50'
                }`}>
                  {liveReadiness.isAllStrictlyMet
                    ? (isAr ? 'مستوفي للشروط ✓' : 'Fully Compliant ✓')
                    : (isAr ? `${liveReadiness.unmet.length} متطلبات معلقة ⚠️` : `${liveReadiness.unmet.length} Pending ⚠️`)}
                </span>
              </h3>
              <p id="closeout_modal_desc" className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? `مشروع: ${project.name_ar || project.name_en || 'مشروع بدون اسم'} (${project.project_code || project.code || 'PRJ'})`
                  : `Project: ${project.name_en || project.name_ar} (${project.project_code || project.code || 'PRJ'})`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-start [scrollbar-width:thin]">
          {/* Summary Warning Banner if requirements pending */}
          {!liveReadiness.isAllStrictlyMet && (
            <div className="p-4 rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-amber-900 dark:text-amber-200">
                    {isAr ? 'تنبيه تعاقدي صارم قبل إنهاء المشروع:' : 'Contractual Closeout Constraints:'}
                  </h4>
                  <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    {isAr
                      ? 'طبقا للقانون المدني المصري وعقود الفيديك (FIDIC)، لا يجوز اعتبار المشروع "منتهي" (Finished) إلا بعد استيفاء التسليم الابتدائي واستلام كافة مستحقات محتجز الضمان وقفل واسترداد خطابات الضمان والشيكات البنكية بعد مرور عام من الـ TOC.'
                      : 'Under FIDIC & civil contract standards, a project cannot be declared "Finished" until Taking-Over is certified, retention is fully collected, and bank guarantees are released.'}
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-900 dark:text-amber-200 pt-1 font-semibold">
                    {liveReadiness.unmet.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ── Pillar 1: Handover & TOC Compliance ── */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('handover')}
              className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800/80 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  {isAr ? '1. استيفاء متطلبات مرحلة التسليم الابتدائي (TOC Gate)' : '1. Handover & TOC Requirements'}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  tocReceived && snagsResolved && asBuiltHandedOver && omManualsHandedOver && testingCommissioningPassed
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {tocReceived && snagsResolved ? (isAr ? 'مستوفى' : 'Completed') : (isAr ? 'معلق' : 'Pending')}
                </span>
                {openSections.handover ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
              </div>
            </button>

            {openSections.handover && (
              <div className="p-4 space-y-3.5 text-xs">
                {/* TOC Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={tocReceived}
                      onChange={(e) => setTocReceived(e.target.checked)}
                      className="mt-0.5 rounded-md text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 w-4 h-4 dark:bg-slate-900 dark:border-slate-700"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {isAr ? 'صدور محضر الاستلام الابتدائي (TOC)' : 'Taking-Over Certificate (TOC)'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr ? 'شهادة رسمية معتمدة من استشاري المالك' : 'Official certified certificate'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={snagsResolved}
                      onChange={(e) => setSnagsResolved(e.target.checked)}
                      className="mt-0.5 rounded-md text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 w-4 h-4 dark:bg-slate-900 dark:border-slate-700"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {isAr ? 'إغلاق قائمة الملاحظات (Snag List)' : 'Snag List Clearance'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr ? 'معالجة كافة الملاحظات الحرجة وإبراء الذمة' : 'All critical punch list items cleared'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={asBuiltHandedOver}
                      onChange={(e) => setAsBuiltHandedOver(e.target.checked)}
                      className="mt-0.5 rounded-md text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 w-4 h-4 dark:bg-slate-900 dark:border-slate-700"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {isAr ? 'تسليم الرسومات التنفيذية (As-Built)' : 'As-Built Drawings'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr ? 'الرسومات المطابقة لما تم تنفيذه فعلياً' : 'Final drawings submitted to client'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={omManualsHandedOver}
                      onChange={(e) => setOmManualsHandedOver(e.target.checked)}
                      className="mt-0.5 rounded-md text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 w-4 h-4 dark:bg-slate-900 dark:border-slate-700"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {isAr ? 'تسليم كتيبات التشغيل والصيانة (O&M)' : 'O&M Manuals'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr ? 'كتيبات المعدات والضمانات للمشروع' : 'Operation & maintenance guides'}
                      </span>
                    </div>
                  </label>
                </div>

                {/* Reference Input */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                  <label htmlFor="closeout_toc_ref" className="text-slate-600 dark:text-slate-300 font-medium shrink-0">
                    {isAr ? 'رقم / إشارة محضر TOC:' : 'TOC Reference:'}
                  </label>
                  <input
                    id="closeout_toc_ref"
                    type="text"
                    value={tocReference}
                    onChange={(e) => setTocReference(e.target.value)}
                    placeholder={isAr ? 'مثال: TOC-2026-088' : 'e.g. TOC-2026-088'}
                    className="flex-1 py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Pillar 2: Retention Money Collection & Settlement ── */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('retention')}
              className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800/80 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  {isAr ? '2. استلام وتصفية محتجز الضمان (Retention Collection)' : '2. Retention Settlement'}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  tranche1Collected && tranche2Collected
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {tranche1Collected && tranche2Collected ? (isAr ? 'مستلم بالكامل' : 'Fully Settled') : (isAr ? 'متبقي مبالغ' : 'Pending')}
                </span>
                {openSections.retention ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
              </div>
            </button>

            {openSections.retention && (
              <div className="p-4 space-y-3.5 text-xs">
                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2.5 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20 dark:border-emerald-500/30">
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{isAr ? 'نسبة الاستقطاع' : 'Retention Rate'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{initialReport.retention.retention_pct}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{isAr ? 'إجمالي المحتجز' : 'Total Withheld'}</span>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {fmtCurrency(initialReport.retention.total_retention_amount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{isAr ? 'حالة التصفية' : 'Status'}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {tranche1Collected && tranche2Collected ? (isAr ? '✅ مصفى' : 'Settled') : (isAr ? '⏳ قيد الاسترداد' : 'Pending')}
                    </span>
                  </div>
                </div>

                {/* Tranche 1 & Tranche 2 Confirmation */}
                <div className="space-y-2.5">
                  {/* Tranche 1 */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tranche1Collected}
                        onChange={(e) => setTranche1Collected(e.target.checked)}
                        className="rounded-md text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 w-4 h-4 dark:bg-slate-900 dark:border-slate-700"
                      />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {isAr ? 'الشريحة الأولى (50% عند التسليم الابتدائي TOC):' : 'Tranche 1 (50% on TOC):'}
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 ms-1">
                          {fmtCurrency(initialReport.retention.tranche_1_amount)}
                        </span>
                      </div>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{isAr ? 'تاريخ الاستلام:' : 'Date:'}</span>
                      <input
                        type="date"
                        value={tranche1CollectedDate}
                        onChange={(e) => setTranche1CollectedDate(e.target.value)}
                        disabled={!tranche1Collected}
                        className="py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Tranche 2 */}
                  <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tranche2Collected}
                        onChange={(e) => setTranche2Collected(e.target.checked)}
                        className="rounded-md text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 w-4 h-4 dark:bg-slate-900 dark:border-slate-700"
                      />
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {isAr ? 'الشريحة الثانية (50% بعد انتهاء فترة الضمان DLP):' : 'Tranche 2 (50% on Final DLP):'}
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 ms-1">
                          {fmtCurrency(initialReport.retention.tranche_2_amount)}
                        </span>
                      </div>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{isAr ? 'تاريخ الاستلام:' : 'Date:'}</span>
                      <input
                        type="date"
                        value={tranche2CollectedDate}
                        onChange={(e) => setTranche2CollectedDate(e.target.value)}
                        disabled={!tranche2Collected}
                        className="py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Pillar 3: Retrieval of Guarantees, Checks & 1-Year Deductions ── */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('guarantees')}
              className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800/80 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  {isAr ? '3. قفل واسترداد خطابات الضمان والشيكات البنكية (LGs & Checks)' : '3. Guarantees & Checks Retrieval'}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  performanceBondReturned && advancePaymentBondReturned && allChecksRetrieved && deductionsRefunded
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {performanceBondReturned && advancePaymentBondReturned && allChecksRetrieved
                    ? (isAr ? 'مستردة بالكامل' : 'Retrieved')
                    : (isAr ? 'ضمانات معلقة' : 'Pending')}
                </span>
                {openSections.guarantees ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
              </div>
            </button>

            {openSections.guarantees && (
              <div className="p-4 space-y-3.5 text-xs">
                {/* 1-Year Milestone from TOC tracker */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  initialReport.guarantees.is_one_year_passed_from_toc
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-500/30'
                }`}>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${initialReport.guarantees.is_one_year_passed_from_toc ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {isAr ? 'موقف مرور عام كامل على الاستلام الابتدائي (DLP / 1-Year from TOC):' : '1-Year Milestone from TOC:'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {initialReport.guarantees.is_one_year_passed_from_toc
                          ? (isAr ? `✅ انقضى عام كامل (مر ${initialReport.guarantees.elapsed_days_from_toc} يوماً) - يحق استرداد كافة الضمانات` : `1 year passed (${initialReport.guarantees.elapsed_days_from_toc} days)`)
                          : (isAr ? `⏳ لم يكتمل عام بعد (مر ${initialReport.guarantees.elapsed_days_from_toc} يوماً، متبقي ${initialReport.guarantees.remaining_days_to_one_year} يوماً)` : `${initialReport.guarantees.remaining_days_to_one_year} days remaining`)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Performance Bond LG */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {isAr ? 'خطاب ضمان حسن التنفيذ (Performance Bond LG):' : 'Performance Bond Guarantee:'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {initialReport.guarantees.performance_bond_number ? `رقم الخطاب: ${initialReport.guarantees.performance_bond_number} · البنك: ${initialReport.guarantees.performance_bond_bank || 'المصرف'}` : isAr ? 'خطاب ضمان بنكي ابتدائي' : 'Bank guarantee'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      {fmtCurrency(initialReport.guarantees.performance_bond_amount)}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={performanceBondReturned}
                        onChange={(e) => setPerformanceBondReturned(e.target.checked)}
                        className="rounded-md text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 w-4 h-4 dark:bg-slate-900 dark:border-slate-700"
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {isAr ? 'تم استرداد أصل الخطاب وإلغاؤه لدى البنك' : 'Original LG retrieved and cancelled'}
                      </span>
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={isAr ? 'رقم إشعار الإلغاء / المخالصة' : 'Cancellation Ref'}
                        value={performanceBondReturnRef}
                        onChange={(e) => setPerformanceBondReturnRef(e.target.value)}
                        disabled={!performanceBondReturned}
                        className="py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                      />
                      <input
                        type="date"
                        value={performanceBondReturnDate}
                        onChange={(e) => setPerformanceBondReturnDate(e.target.value)}
                        disabled={!performanceBondReturned}
                        className="py-1 px-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* Advance Payment LG */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {isAr ? 'خطاب ضمان الدفعة المقدمة (Advance Payment LG):' : 'Advance Payment Guarantee:'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr ? 'تم استهلاك كامل الدفعة المقدمة من المستخلصات 100%' : '100% amortized via IPCs'}
                      </span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={advancePaymentBondReturned}
                        onChange={(e) => setAdvancePaymentBondReturned(e.target.checked)}
                        className="rounded-md text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 w-4 h-4 dark:bg-slate-900 dark:border-slate-700"
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {isAr ? 'تم استرداد أصل الخطاب وقفله' : 'Retrieved & closed'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Guarantee Checks & Contractual Deductions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={allChecksRetrieved}
                      onChange={(e) => setAllChecksRetrieved(e.target.checked)}
                      className="mt-0.5 rounded-md text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 w-4 h-4 dark:bg-slate-900 dark:border-slate-700"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {isAr ? 'استرداد وقفل شيكات الضمان المسلمة' : 'Guarantee Checks Retrieved'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr ? 'سحب أي شيكات ضمان كانت مودعة لدى العميل' : 'All guarantee checks recovered'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={deductionsRefunded}
                      onChange={(e) => setDeductionsRefunded(e.target.checked)}
                      className="mt-0.5 rounded-md text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 w-4 h-4 dark:bg-slate-900 dark:border-slate-700"
                    />
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {isAr ? 'تسوية استقطاعات ما بعد مرور عام' : '1-Year Deductions Settled'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {isAr ? 'استرداد أية مبالغ أو استقطاعات مؤجلة لعام من TOC' : 'Refund contractual deductions post-TOC'}
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ── Pillar 4: Final Clearance & Settlement ── */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-xs">
            <button
              type="button"
              onClick={() => toggleSection('clearance')}
              className="w-full px-4 py-3.5 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800/80 cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                  {isAr ? '4. المخالصة النهائية وإبراء الذمة (Final Settlement & Discharge)' : '4. Final Settlement & Clearance'}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  finalSettlementSigned
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                }`}>
                  {finalSettlementSigned ? (isAr ? 'موقعة' : 'Signed') : (isAr ? 'معلقة' : 'Pending')}
                </span>
                {openSections.clearance ? <ChevronUp className="w-4 h-4 text-slate-400 dark:text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" />}
              </div>
            </button>

            {openSections.clearance && (
              <div className="p-4 space-y-3.5 text-xs">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={finalSettlementSigned}
                    onChange={(e) => setFinalSettlementSigned(e.target.checked)}
                    className="mt-0.5 rounded-md text-emerald-600 dark:text-emerald-500 focus:ring-emerald-500 w-4 h-4 dark:bg-slate-900 dark:border-slate-700"
                  />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">
                      {isAr ? 'توقيع المخالصة النهائية المتبادلة وإبراء الذمة (Discharge Certificate)' : 'Final Discharge Signed'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isAr ? 'إقرار من الطرفين بتسوية كافة المستحقات والمطالبات الختامية' : 'Mutual zero claims and full settlement'}
                    </span>
                  </div>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="discharge_ref_input" className="font-medium text-slate-600 dark:text-slate-300 block mb-1">
                      {isAr ? 'رقم وثيقة المخالصة / المرجع:' : 'Discharge Document Ref:'}
                    </label>
                    <input
                      id="discharge_ref_input"
                      type="text"
                      value={dischargeLetterRef}
                      onChange={(e) => setDischargeLetterRef(e.target.value)}
                      placeholder={isAr ? 'مثال: FDS-2026-90' : 'e.g. FDS-2026-90'}
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="closeout_engineer_input" className="font-medium text-slate-600 dark:text-slate-300 block mb-1">
                      {isAr ? 'مهندس العقود / المحاسب المسؤول:' : 'Contract Engineer / Responsible Officer:'}
                    </label>
                    <input
                      id="closeout_engineer_input"
                      type="text"
                      value={closeoutEngineerName}
                      onChange={(e) => setCloseoutEngineerName(e.target.value)}
                      placeholder={isAr ? 'اسم المهندس المسؤول' : 'Engineer Name'}
                      className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="closeout_notes_input" className="font-medium text-slate-600 dark:text-slate-300 block mb-1">
                    {isAr ? 'ملاحظات وتوصيات الإغلاق النهائي:' : 'Final Closeout Notes:'}
                  </label>
                  <textarea
                    id="closeout_notes_input"
                    value={closeoutNotes}
                    onChange={(e) => setCloseoutNotes(e.target.value)}
                    rows={2}
                    placeholder={isAr ? 'أي ملاحظات تعاقدية إضافية بشأن الإغلاق النهائي للمشروع...' : 'Additional contractual remarks...'}
                    className="w-full py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Administrative Override Option if Requirements Pending ── */}
          {!liveReadiness.isAllStrictlyMet && (
            <div className="p-4 rounded-2xl border border-dashed border-rose-300 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowOverride}
                  onChange={(e) => setAllowOverride(e.target.checked)}
                  className="rounded-md text-rose-600 focus:ring-rose-500 w-4 h-4 dark:bg-slate-900 dark:border-slate-700"
                />
                <span className="font-bold text-rose-800 dark:text-rose-200">
                  {isAr ? 'تفعيل استثناء إداري معتمد لإنهاء المشروع استثنائياً مع وجود معلقات' : 'Authorized Administrative Override for Conditional Closeout'}
                </span>
              </label>

              {allowOverride && (
                <div className="space-y-1.5 ps-6">
                  <label htmlFor="override_justification_input" className="text-[11px] font-bold text-rose-700 dark:text-rose-300 block">
                    {isAr ? 'مبررات الاستثناء وموافقة الإدارة العليا (إلزامي):' : 'Override Justification & Senior Management Approval (Mandatory):'}
                  </label>
                  <input
                    id="override_justification_input"
                    type="text"
                    value={overrideJustification}
                    onChange={(e) => setOverrideJustification(e.target.value)}
                    placeholder={isAr ? 'مثال: تم الإغلاق بموجب قرار مجلس الإدارة رقم 45 بتاريخ ...' : 'Management approval resolution ref...'}
                    className="w-full py-1.5 px-3 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={loading || !liveReadiness.canSubmit}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-black text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isAr ? 'اعتماد الإغلاق النهائي للمشروع (Finished) ✓' : 'Approve Final Closeout (Finished) ✓'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
