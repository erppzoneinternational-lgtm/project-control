import { Project } from '@/types';
import {
  CloseoutHandoverVerification,
  CloseoutRetentionVerification,
  CloseoutGuaranteesVerification,
  CloseoutClearanceVerification,
  CloseoutReadinessReport,
  ProjectCloseoutAuditPayload,
} from '@/types/closeout';
import {
  hasTocCertificate,
  getHandoverDate,
} from './retention-bond-tracking.utils';

/**
 * Evaluates whether a project is contractually ready for Final Finish (Closeout)
 * enforcing FIDIC & PMI standards: Handover compliance, full retention collection,
 * retrieval of all letters of guarantee and checks, and 1-year TOC milestone completion.
 */
export function evaluateProjectCloseoutReadiness(
  project: Project,
  now: Date = new Date()
): CloseoutReadinessReport {
  const meta = (project.metadata || {}) as Record<string, any>;
  const handoverMeta = meta.handover_checklist || {};
  const closeoutMeta = (meta.closeout_audit || {}) as Partial<ProjectCloseoutAuditPayload>;

  // 1. Handover Verification
  const hasToc = hasTocCertificate(project) || Boolean(handoverMeta.toc_received);
  const tocReference = handoverMeta.toc_reference || (hasToc ? project.toc_letter : '') || '';
  const handoverDateObj = getHandoverDate(project);
  const tocDate = handoverDateObj ? handoverDateObj.toISOString().split('T')[0] : '';
  const snagsResolved =
    handoverMeta.snag_list_completed === true ||
    handoverMeta.snag_list_type === 'no_snags' ||
    Boolean(closeoutMeta.handover?.snags_resolved);
  const snagListType = handoverMeta.snag_list_type || 'minor_only';
  const asBuiltHandedOver =
    handoverMeta.as_built_submitted ?? closeoutMeta.handover?.as_built_handed_over ?? true;
  const omManualsHandedOver =
    handoverMeta.om_manuals_submitted ?? closeoutMeta.handover?.om_manuals_handed_over ?? true;
  const testingCommissioningPassed =
    handoverMeta.testing_commissioning_passed ??
    closeoutMeta.handover?.testing_commissioning_passed ??
    true;

  const handoverUnmet: string[] = [];
  if (!hasToc) {
    handoverUnmet.push('محضر أو شهادة الاستلام الابتدائي (TOC) غير مسجلة أو غير معتمدة');
  }
  if (!snagsResolved && snagListType === 'critical_pending') {
    handoverUnmet.push('توجد ملاحظات حرجة معلقة في قائمة الاستلام (Snag List) لم تُعالج');
  }
  if (!asBuiltHandedOver) {
    handoverUnmet.push('لم يتم تسليم الرسومات التنفيذية المعتمدة كما نُفذت (As-Built Drawings)');
  }
  if (!omManualsHandedOver) {
    handoverUnmet.push('لم يتم تسليم كتيبات التشغيل والصيانة (O&M Manuals)');
  }
  if (!testingCommissioningPassed) {
    handoverUnmet.push('محاضر وتجارب التشغيل والاختبار (Testing & Commissioning) لم تُعتمد');
  }

  const allHandoverMet = handoverUnmet.length === 0;

  const handover: CloseoutHandoverVerification = {
    toc_received: hasToc,
    toc_reference: tocReference || undefined,
    toc_date: tocDate || undefined,
    snags_resolved: snagsResolved,
    snag_list_type: snagListType,
    as_built_handed_over: asBuiltHandedOver,
    om_manuals_handed_over: omManualsHandedOver,
    testing_commissioning_passed: testingCommissioningPassed,
    all_handover_met: allHandoverMet,
    unmet_reasons: handoverUnmet,
  };

  // 2. Retention Verification
  const contractBase = Number(project.contract_value || project.contract_value_egp || 0);
  const vosValue = Number(project.vos_value || 0);
  const totalContract = Number(project.total_contract_value || contractBase + vosValue);

  const retentionTerms = meta.retention_terms || {};
  const retentionType = retentionTerms.type ?? (meta.retention_type || 'cash_deduction');
  const hasRetention = retentionType !== 'none';
  const retentionRatePct = Number(
    retentionTerms.rate_pct ?? meta.retention_rate_pct ?? meta.retention_pct ?? (hasRetention ? 5 : 0)
  );

  const totalRetentionAmount = hasRetention
    ? Math.round(totalContract * (retentionRatePct / 100))
    : 0;

  const tocReleasePct = Number(retentionTerms.toc_release_pct ?? meta.retention_toc_release_pct ?? 50);
  const tranche1Amount = Math.round(totalRetentionAmount * (tocReleasePct / 100));
  const tranche2Amount = Math.max(0, totalRetentionAmount - tranche1Amount);

  const tranche1Collected =
    !hasRetention ||
    Boolean(
      closeoutMeta.retention?.tranche_1_collected ||
        meta.retention_tranche_1_released ||
        retentionTerms.tranche_1_released
    );

  const tranche2Collected =
    !hasRetention ||
    Boolean(
      closeoutMeta.retention?.tranche_2_collected ||
        meta.retention_tranche_2_released ||
        retentionTerms.tranche_2_released
    );

  const retentionUnmet: string[] = [];
  if (hasRetention && totalRetentionAmount > 0) {
    if (!tranche1Collected) {
      handoverUnmet.length === 0;
      retentionUnmet.push('لم يتم تأكيد استلام الشريحة الأولى من محتجز الضمان (TOC Tranche 1)');
    }
    if (!tranche2Collected) {
      retentionUnmet.push('لم يتم استلام وتصفية الشريحة الثانية من محتجز الضمان بعد انتهاء الضمان (Tranche 2)');
    }
  }

  const retentionFullySettled = !hasRetention || (tranche1Collected && tranche2Collected);

  const retention: CloseoutRetentionVerification = {
    has_retention: hasRetention,
    retention_pct: retentionRatePct,
    total_retention_amount: totalRetentionAmount,
    tranche_1_amount: tranche1Amount,
    tranche_1_collected: tranche1Collected,
    tranche_1_collected_at: closeoutMeta.retention?.tranche_1_collected_at,
    tranche_2_amount: tranche2Amount,
    tranche_2_collected: tranche2Collected,
    tranche_2_collected_at: closeoutMeta.retention?.tranche_2_collected_at,
    retention_fully_settled: retentionFullySettled,
    unmet_reasons: retentionUnmet,
  };

  // 3. Guarantees, Checks & Contractual Deductions Verification
  const pbMeta = meta.performance_bond || {};
  const hasPb = Boolean(
    pbMeta.has_bond ??
      meta.has_performance_bond ??
      (Number(meta.performance_bond_pct || 0) > 0)
  );
  const pbAmount = Number(
    pbMeta.manual_value ||
      (contractBase * (Number(pbMeta.percentage ?? meta.performance_bond_pct ?? 5) / 100))
  );
  const pbReturned =
    !hasPb ||
    Boolean(
      closeoutMeta.guarantees?.performance_bond_returned ||
        pbMeta.released ||
        meta.performance_bond_released
    );

  const hasAdv = Number(meta.advance_payment_pct ?? meta.down_payment_pct ?? 0) > 0;
  const advReturned =
    !hasAdv ||
    Boolean(
      closeoutMeta.guarantees?.advance_payment_bond_returned ||
        meta.advance_payment_bond_returned
    );

  const hasChecks = Boolean(
    meta.has_guarantee_checks ?? closeoutMeta.guarantees?.guarantee_checks_applicable
  );
  const checksRetrieved =
    !hasChecks ||
    Boolean(
      closeoutMeta.guarantees?.all_checks_retrieved ?? meta.guarantee_checks_retrieved ?? true
    );

  // 1-Year Milestone from TOC for Deductions & Guarantees
  let elapsedDays = 0;
  let remainingDays = 365;
  let isOneYearPassed = false;

  if (handoverDateObj && !isNaN(handoverDateObj.getTime())) {
    const diffMs = now.getTime() - handoverDateObj.getTime();
    elapsedDays = Math.max(0, Math.floor(diffMs / 86400000));
    remainingDays = Math.max(0, 365 - elapsedDays);
    isOneYearPassed = elapsedDays >= 365;
  }

  const hasContractualDeductions = Boolean(
    meta.has_contractual_deductions_1yr ??
      closeoutMeta.guarantees?.contractual_deductions_1yr_applicable ??
      (hasRetention && totalRetentionAmount > 0)
  );

  const deductionsRefunded =
    !hasContractualDeductions ||
    Boolean(
      closeoutMeta.guarantees?.deductions_refunded ??
        (tranche2Collected && isOneYearPassed)
    );

  const guaranteesUnmet: string[] = [];
  if (hasPb && !pbReturned) {
    guaranteesUnmet.push('خطاب ضمان حسن التنفيذ (Performance Bond) لم يتم استرداده وإلغاؤه لدى البنك والعميل');
  }
  if (hasAdv && !advReturned) {
    guaranteesUnmet.push('خطاب ضمان الدفعة المقدمة لم يتم استرداده وقفله بعد اكتمال الاستهلاك');
  }
  if (hasChecks && !checksRetrieved) {
    guaranteesUnmet.push('توجد شيكات ضمان تعاقدية لدى العميل لم يتم استردادها وقفلها');
  }
  if (hasContractualDeductions && !isOneYearPassed) {
    guaranteesUnmet.push(
      `فترة مرور عام كامل من الاستلام الابتدائي TOC لم تنقضِ بعد (مر ${elapsedDays} يوماً، متبقي ${remainingDays} يوماً)`
    );
  }
  if (hasContractualDeductions && isOneYearPassed && !deductionsRefunded) {
    guaranteesUnmet.push('الاستقطاعات التعاقدية المؤجلة بعد عام من TOC لم يتم تسويتها واستردادها');
  }

  const allGuaranteesMet = guaranteesUnmet.length === 0;

  const guarantees: CloseoutGuaranteesVerification = {
    performance_bond_applicable: hasPb,
    performance_bond_number: pbMeta.bond_number || meta.performance_bond_number,
    performance_bond_bank: pbMeta.issuing_bank || meta.performance_bond_bank,
    performance_bond_amount: pbAmount,
    performance_bond_returned: pbReturned,
    performance_bond_return_ref: closeoutMeta.guarantees?.performance_bond_return_ref,
    performance_bond_return_date: closeoutMeta.guarantees?.performance_bond_return_date,

    advance_payment_bond_applicable: hasAdv,
    advance_payment_bond_number: meta.advance_payment_bond_number,
    advance_payment_fully_amortized: true,
    advance_payment_bond_returned: advReturned,
    advance_payment_return_ref: closeoutMeta.guarantees?.advance_payment_return_ref,

    guarantee_checks_applicable: hasChecks,
    guarantee_checks_count: Number(meta.guarantee_checks_count || 1),
    all_checks_retrieved: checksRetrieved,
    checks_retrieval_notes: closeoutMeta.guarantees?.checks_retrieval_notes,

    contractual_deductions_1yr_applicable: hasContractualDeductions,
    deductions_amount: tranche2Amount,
    is_one_year_passed_from_toc: isOneYearPassed,
    elapsed_days_from_toc: elapsedDays,
    remaining_days_to_one_year: remainingDays,
    deductions_refunded: deductionsRefunded,
    deductions_refund_ref: closeoutMeta.guarantees?.deductions_refund_ref,

    all_guarantees_met: allGuaranteesMet,
    unmet_reasons: guaranteesUnmet,
  };

  // 4. Clearance Verification
  const finalSettlementSigned = Boolean(
    closeoutMeta.clearance?.final_settlement_signed || meta.final_settlement_signed
  );
  const clearanceUnmet: string[] = [];
  if (!finalSettlementSigned) {
    clearanceUnmet.push('المخالصة النهائية المعتمدة وإبراء الذمة التعاقدي لم يتم توقيعها');
  }

  const allClearanceMet = clearanceUnmet.length === 0;

  const clearance: CloseoutClearanceVerification = {
    final_settlement_signed: finalSettlementSigned,
    discharge_letter_ref: closeoutMeta.clearance?.discharge_letter_ref || meta.discharge_letter_ref,
    all_invoices_settled: closeoutMeta.clearance?.all_invoices_settled ?? true,
    closeout_notes: closeoutMeta.clearance?.closeout_notes,
    closeout_engineer_name: closeoutMeta.clearance?.closeout_engineer_name,
    closed_at: closeoutMeta.clearance?.closed_at,
    all_clearance_met: allClearanceMet,
    unmet_reasons: clearanceUnmet,
  };

  // Aggregate blockers
  const allBlockers = [
    ...handoverUnmet,
    ...retentionUnmet,
    ...guaranteesUnmet,
    ...clearanceUnmet,
  ];

  const isReady =
    allHandoverMet &&
    retentionFullySettled &&
    allGuaranteesMet &&
    allClearanceMet;

  return {
    is_ready: isReady,
    handover,
    retention,
    guarantees,
    clearance,
    all_blockers: allBlockers,
  };
}
