import { Project } from './index';

export interface CloseoutHandoverVerification {
  toc_received: boolean;
  toc_reference?: string;
  toc_date?: string;
  snags_resolved: boolean;
  snag_list_type?: 'no_snags' | 'minor_only' | 'critical_pending';
  as_built_handed_over: boolean;
  om_manuals_handed_over: boolean;
  testing_commissioning_passed: boolean;
  all_handover_met: boolean;
  unmet_reasons: string[];
}

export interface CloseoutRetentionVerification {
  has_retention: boolean;
  retention_pct: number;
  total_retention_amount: number;
  tranche_1_amount: number; // TOC Release (50%)
  tranche_1_collected: boolean;
  tranche_1_collected_at?: string;
  tranche_2_amount: number; // DLP Release (50% after 1 year)
  tranche_2_collected: boolean;
  tranche_2_collected_at?: string;
  retention_fully_settled: boolean;
  unmet_reasons: string[];
}

export interface CloseoutGuaranteesVerification {
  // Performance Bond (خطاب ضمان حسن التنفيذ)
  performance_bond_applicable: boolean;
  performance_bond_number?: string;
  performance_bond_bank?: string;
  performance_bond_amount: number;
  performance_bond_returned: boolean;
  performance_bond_return_ref?: string;
  performance_bond_return_date?: string;

  // Advance Payment Bond (خطاب ضمان الدفعة المقدمة)
  advance_payment_bond_applicable: boolean;
  advance_payment_bond_number?: string;
  advance_payment_fully_amortized: boolean;
  advance_payment_bond_returned: boolean;
  advance_payment_return_ref?: string;

  // Guarantee Checks (شيكات الضمان المسلمة للعميل)
  guarantee_checks_applicable: boolean;
  guarantee_checks_count: number;
  all_checks_retrieved: boolean;
  checks_retrieval_notes?: string;

  // Contractual Deductions Recoverable 1 Year After TOC (استقطاعات تعاقدية تسترد بعد عام من التسليم)
  contractual_deductions_1yr_applicable: boolean;
  deductions_amount: number;
  is_one_year_passed_from_toc: boolean;
  elapsed_days_from_toc: number;
  remaining_days_to_one_year: number;
  deductions_refunded: boolean;
  deductions_refund_ref?: string;

  all_guarantees_met: boolean;
  unmet_reasons: string[];
}

export interface CloseoutClearanceVerification {
  final_settlement_signed: boolean;
  discharge_letter_ref?: string;
  all_invoices_settled: boolean;
  closeout_notes?: string;
  closeout_engineer_name?: string;
  closed_at?: string;
  all_clearance_met: boolean;
  unmet_reasons: string[];
}

export interface ProjectCloseoutAuditPayload {
  handover: CloseoutHandoverVerification;
  retention: CloseoutRetentionVerification;
  guarantees: CloseoutGuaranteesVerification;
  clearance: CloseoutClearanceVerification;
  is_eligible_for_closeout: boolean;
  closed_by?: string;
  closed_at: string;
  override_justification?: string;
}

export interface CloseoutReadinessReport {
  is_ready: boolean;
  handover: CloseoutHandoverVerification;
  retention: CloseoutRetentionVerification;
  guarantees: CloseoutGuaranteesVerification;
  clearance: CloseoutClearanceVerification;
  all_blockers: string[];
}
