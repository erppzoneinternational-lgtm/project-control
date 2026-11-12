import { describe, it, expect } from 'vitest';
import { evaluateProjectCloseoutReadiness } from '../closeout-governance.utils';
import { Project } from '@/types';

describe('Closeout Governance Engine (حسابات وحوكمة إنهاء المشروع)', () => {
  const mockDateNow = new Date('2026-10-11T12:00:00Z');

  const baseProject: Project = {
    id: 'proj-closeout-1',
    project_code: 'PRJ-101',
    project_name: 'مشروع حمام سباحة أولمبي ولاندسكيب',
    status: 'working',
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
    contract_value: 10_000_000,
    vos_value: 2_000_000,
    total_contract_value: 12_000_000,
    estimated_budget: 10_000_000,
    estimated_cost: 8_500_000,
    water_area_m2: 800,
    water_vol_m3: 1600,
    completion_pct: 100,
    actual_finish_date: '2025-06-01',
    toc_letter: 'TOC-APPROVED-2025-06',
    metadata: {
      retention_pct: 5,
      has_performance_bond: true,
      performance_bond_pct: 5,
      performance_bond_number: 'PB-998811',
      performance_bond_bank: 'National Bank of Egypt',
      advance_payment_pct: 10,
      advance_payment_bond_number: 'AP-554433',
      advance_payment_bond_bank: 'Banque Misr',
      handover_checklist: {
        toc_received: true,
        handover_at: '2025-06-01',
        snags_count: 0,
        as_built_submitted: true,
        om_manuals_submitted: true,
        testing_commissioning_passed: true,
      },
    },
  };

  it('detects unreadiness when retention tranches and guarantees are not settled', () => {
    const report = evaluateProjectCloseoutReadiness(baseProject, mockDateNow);

    expect(report.is_ready).toBe(false);
    expect(report.all_blockers.length).toBeGreaterThan(0);
    // 2025-06-01 to 2026-10-11 is > 365 days (497 days)
    expect(report.guarantees.is_one_year_passed_from_toc).toBe(true);
    expect(report.retention.tranche_1_collected).toBe(false);
    expect(report.retention.tranche_2_collected).toBe(false);
    expect(report.guarantees.performance_bond_returned).toBe(false);
    expect(report.clearance.final_settlement_signed).toBe(false);
  });

  it('correctly calculates 1-year TOC milestone and elapsed days', () => {
    // Project with TOC only 30 days ago
    const recentHandoverProject: Project = {
      ...baseProject,
      actual_finish_date: '2026-09-11',
      toc_letter: 'TOC-RECENT-01',
      metadata: {
        ...baseProject.metadata,
        handover_checklist: {
          toc_received: true,
          handover_at: '2026-09-11',
          snags_count: 0,
          as_built_submitted: true,
          om_manuals_submitted: true,
          testing_commissioning_passed: true,
        },
      },
    };

    const report = evaluateProjectCloseoutReadiness(recentHandoverProject, mockDateNow);

    expect(report.guarantees.is_one_year_passed_from_toc).toBe(false);
    expect(report.guarantees.elapsed_days_from_toc).toBe(30);
    expect(report.guarantees.remaining_days_to_one_year).toBe(335);

    // Blocker exists warning that 1 year has not elapsed yet
    const dlpBlocker = report.guarantees.unmet_reasons.find((b) =>
      b.includes('فترة مرور عام كامل')
    );
    expect(dlpBlocker).toBeDefined();
  });

  it('blocks closeout if handover prerequisites (TOC, as-built, O&M) are missing', () => {
    const incompleteHandoverProject: Project = {
      ...baseProject,
      toc_letter: undefined,
      metadata: {
        ...baseProject.metadata,
        handover_checklist: {
          toc_received: false,
          snag_list_type: 'critical_pending',
          snag_list_completed: false,
          as_built_submitted: false,
          om_manuals_submitted: false,
          testing_commissioning_passed: false,
        },
      },
    };

    const report = evaluateProjectCloseoutReadiness(incompleteHandoverProject, mockDateNow);

    expect(report.is_ready).toBe(false);
    expect(report.handover.all_handover_met).toBe(false);
    expect(report.handover.unmet_reasons.length).toBeGreaterThanOrEqual(4);
    expect(
      report.handover.unmet_reasons.some((r) => r.includes('محضر أو شهادة الاستلام الابتدائي (TOC)'))
    ).toBe(true);
    expect(
      report.handover.unmet_reasons.some((r) => r.includes('الرسومات التنفيذية المعتمدة'))
    ).toBe(true);
  });

  it('approves closeout when all 4 pillars are fully verified and satisfied', () => {
    const fullySatisfiedProject: Project = {
      ...baseProject,
      metadata: {
        ...baseProject.metadata,
        handover_checklist: {
          toc_received: true,
          handover_at: '2025-06-01',
          snags_count: 0,
          snag_list_type: 'no_snags',
          as_built_submitted: true,
          om_manuals_submitted: true,
          testing_commissioning_passed: true,
        },
        retention_tranche_1_released: true,
        retention_tranche_2_released: true,
        performance_bond_released: true,
        advance_payment_bond_returned: true,
        final_settlement_signed: true,
      },
    };

    const report = evaluateProjectCloseoutReadiness(fullySatisfiedProject, mockDateNow);

    expect(report.is_ready).toBe(true);
    expect(report.all_blockers).toHaveLength(0);
    expect(report.handover.all_handover_met).toBe(true);
    expect(report.retention.retention_fully_settled).toBe(true);
    expect(report.guarantees.all_guarantees_met).toBe(true);
    expect(report.clearance.all_clearance_met).toBe(true);
  });

  it('restores previously recorded closeout audit metadata seamlessly', () => {
    const auditedProject: Project = {
      ...baseProject,
      status: 'finished',
      metadata: {
        ...baseProject.metadata,
        closeout_audit: {
          closed_at: '2026-08-01T10:00:00Z',
          closed_by: 'Eng. Hassan Soliman',
          is_eligible_for_closeout: true,
          handover: {
            toc_received: true,
            toc_reference: 'TOC-FINAL-SIGN',
            toc_date: '2025-06-01',
            snags_resolved: true,
            as_built_handed_over: true,
            om_manuals_handed_over: true,
            testing_commissioning_passed: true,
            all_handover_met: true,
            unmet_reasons: [],
          },
          retention: {
            has_retention: true,
            retention_pct: 5,
            total_retention_amount: 600_000,
            tranche_1_amount: 300_000,
            tranche_1_collected: true,
            tranche_1_collected_at: '2025-06-15',
            tranche_2_amount: 300_000,
            tranche_2_collected: true,
            tranche_2_collected_at: '2026-06-15',
            retention_fully_settled: true,
            unmet_reasons: [],
          },
          guarantees: {
            performance_bond_applicable: true,
            performance_bond_amount: 500_000,
            performance_bond_returned: true,
            performance_bond_return_ref: 'PB-RET-001',
            advance_payment_bond_applicable: true,
            advance_payment_fully_amortized: true,
            advance_payment_bond_returned: true,
            guarantee_checks_applicable: false,
            guarantee_checks_count: 0,
            all_checks_retrieved: true,
            contractual_deductions_1yr_applicable: true,
            deductions_amount: 300_000,
            is_one_year_passed_from_toc: true,
            elapsed_days_from_toc: 400,
            remaining_days_to_one_year: 0,
            deductions_refunded: true,
            all_guarantees_met: true,
            unmet_reasons: [],
          },
          clearance: {
            final_settlement_signed: true,
            discharge_letter_ref: 'DISCHARGE-2026-FINAL',
            all_invoices_settled: true,
            all_clearance_met: true,
            unmet_reasons: [],
          },
        },
      },
    };

    const report = evaluateProjectCloseoutReadiness(auditedProject, mockDateNow);

    expect(report.is_ready).toBe(true);
    expect(report.retention.tranche_1_collected).toBe(true);
    expect(report.retention.tranche_2_collected).toBe(true);
    expect(report.guarantees.performance_bond_returned).toBe(true);
    expect(report.clearance.final_settlement_signed).toBe(true);
  });
});
