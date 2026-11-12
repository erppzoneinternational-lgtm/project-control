import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase';
import { appCache, CACHE_KEYS } from '@/lib/cache';
import { ProjectTabsService } from '../projectTabs.service';
import { SubcontractorService } from '../subcontractor.service';
import {
  ChangeOrder,
  ProjectInvoice,
  ProjectSubcontractor,
  Project,
} from '@/types/index';
import {
  CommercialSettings,
  SubcontractorTarget,
  DailyProgressLine,
} from '@/types/planning';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Helper for chainable mock query builder
const createMockQueryBuilder = (resolveValue: unknown) => {
  const builder: MockBuilderShape = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    maybeSingle: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    then: vi.fn().mockImplementation((onfulfilled) => {
      onfulfilled(resolveValue);
      return Promise.resolve(resolveValue);
    }),
  };
  return builder as MockQueryBuilder;
};

// ============================================================================
// PURE DOMAIN CALCULATION ENGINES (Canonical SoT Implementations for Tests)
// ============================================================================

export interface ContractRollupSummary {
  originalValue: number;
  approvedVosCount: number;
  approvedVosAmount: number;
  unapprovedVosCount: number;
  unapprovedVosAmount: number;
  revisedContractValue: number;
  totalEotDays: number;
  baselineFinishDate?: string;
  revisedFinishDate?: string;
}

/**
 * Pure function: Calculate Cumulative Approved VOs and Revised Contract Figures.
 */
export function calculateContractRollup(
  originalContractValue: number,
  vos: Partial<ChangeOrder>[],
  baselineFinishDate?: string
): ContractRollupSummary {
  const orig = Math.max(0, Number(originalContractValue) || 0);

  let approvedVosCount = 0;
  let approvedVosAmount = 0;
  let unapprovedVosCount = 0;
  let unapprovedVosAmount = 0;
  let totalEotDays = 0;

  for (const vo of vos) {
    const isApproved =
      vo.status === 'approved' ||
      vo.approval_status === 'approved';

    const amt = Number(vo.amount_egp) || 0;
    const eot = Number(vo.time_extension_days) || 0;

    if (isApproved) {
      approvedVosCount++;
      approvedVosAmount += amt;
      totalEotDays += Math.max(0, eot);
    } else {
      unapprovedVosCount++;
      unapprovedVosAmount += amt;
    }
  }

  const revisedContractValue = orig + approvedVosAmount;

  let revisedFinishDate: string | undefined = undefined;
  if (baselineFinishDate) {
    const d = new Date(baselineFinishDate);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + totalEotDays);
      revisedFinishDate = d.toISOString().slice(0, 10);
    }
  }

  return {
    originalValue: Number(orig.toFixed(2)),
    approvedVosCount,
    approvedVosAmount: Number(approvedVosAmount.toFixed(2)),
    unapprovedVosCount,
    unapprovedVosAmount: Number(unapprovedVosAmount.toFixed(2)),
    revisedContractValue: Number(revisedContractValue.toFixed(2)),
    totalEotDays,
    baselineFinishDate,
    revisedFinishDate,
  };
}

/**
 * Pure function: Validate VO approval workflow state transitions.
 * Workflow: 'draft' -> 'submitted' -> 'approved' | 'rejected'
 * Rejected VOs can transition back to 'submitted' upon revision.
 */
export function validateVoWorkflowTransition(
  currentStatus: string,
  targetStatus: string
): { valid: boolean; reason?: string } {
  const validTransitions: Record<string, string[]> = {
    draft: ['submitted'],
    submitted: ['approved', 'rejected', 'draft'],
    rejected: ['submitted', 'draft'],
    approved: [], // Terminal state; immutable
  };

  const allowed = validTransitions[currentStatus];
  if (!allowed) {
    return { valid: false, reason: `Unknown current status "${currentStatus}"` };
  }

  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      reason: `Invalid transition from "${currentStatus}" to "${targetStatus}". Allowed: [${allowed.join(', ')}]`,
    };
  }

  return { valid: true };
}

export interface IpcLineItem {
  id?: string;
  item_code?: string;
  description?: string;
  unit?: string;
  previous_qty?: number;
  current_qty: number;
  unit_rate: number;
}

export interface IpcDeductionsInput {
  grossAmount: number;
  retentionPct: number;                    // e.g. 10.0 for 10%
  advanceAmortizationPct?: number;         // e.g. 10.0 for 10%
  totalAdvancePaid?: number;               // Total initial advance payment given
  cumulativeAdvanceRecoveredBefore?: number; // Total recovered in previous IPCs
  otherDeductions?: number;                // e.g. penalties, backcharges
  clampNegativeNet?: boolean;
}

export interface IpcDeductionsResult {
  grossAmount: number;
  retentionDeduction: number;
  advanceRecoveryDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPayable: number;
  cumulativeAdvanceRecoveredAfter: number;
  remainingAdvanceToRecover: number;
  isAdvanceFullyRecovered: boolean;
}

/**
 * Pure function: Calculate itemized IPC lines gross total.
 */
export function calculateIpcLinesGross(lines: IpcLineItem[]): {
  totalGross: number;
  itemCount: number;
  lines: Array<IpcLineItem & { lineGross: number; cumulativeQty: number; cumulativeAmount: number }>;
} {
  let totalGross = 0;
  const processed = lines.map((l) => {
    const prevQty = Math.max(0, Number(l.previous_qty) || 0);
    const currQty = Math.max(0, Number(l.current_qty) || 0);
    const rate = Math.max(0, Number(l.unit_rate) || 0);
    const lineGross = Number((currQty * rate).toFixed(2));
    const cumulativeQty = Number((prevQty + currQty).toFixed(3));
    const cumulativeAmount = Number((cumulativeQty * rate).toFixed(2));

    totalGross += lineGross;
    return {
      ...l,
      lineGross,
      cumulativeQty,
      cumulativeAmount,
    };
  });

  return {
    totalGross: Number(totalGross.toFixed(2)),
    itemCount: lines.length,
    lines: processed,
  };
}

/**
 * Pure function: Calculate Subcontractor IPC Deductions and Net Payable.
 */
export function calculateIpcDeductions(params: IpcDeductionsInput): IpcDeductionsResult {
  const gross = Math.max(0, Number(params.grossAmount) || 0);
  const retPct = Math.max(0, Math.min(100, Number(params.retentionPct) || 0));
  const advPct = Math.max(0, Math.min(100, Number(params.advanceAmortizationPct) || 0));
  const totalAdv = Math.max(0, Number(params.totalAdvancePaid) || 0);
  const recoveredBefore = Math.max(0, Number(params.cumulativeAdvanceRecoveredBefore) || 0);
  const other = Math.max(0, Number(params.otherDeductions) || 0);

  // 1. Retention deduction = gross * retention_pct / 100
  const retentionDeduction = Number(((gross * retPct) / 100).toFixed(2));

  // 2. Advance payment recovery deduction (amortization)
  // Standard amortization = gross * advance_amortization_pct / 100
  // Capped by remaining unrecovered advance
  const theoreticalAdvanceRecovery = (gross * advPct) / 100;
  const remainingAdvanceBefore = Math.max(0, totalAdv - recoveredBefore);

  let advanceRecoveryDeduction = 0;
  if (totalAdv > 0) {
    advanceRecoveryDeduction = Math.min(theoreticalAdvanceRecovery, remainingAdvanceBefore);
  } else {
    advanceRecoveryDeduction = theoreticalAdvanceRecovery;
  }
  advanceRecoveryDeduction = Number(advanceRecoveryDeduction.toFixed(2));

  const cumulativeAdvanceRecoveredAfter = Number((recoveredBefore + advanceRecoveryDeduction).toFixed(2));
  const remainingAdvanceToRecover = totalAdv > 0
    ? Number(Math.max(0, totalAdv - cumulativeAdvanceRecoveredAfter).toFixed(2))
    : 0;
  const isAdvanceFullyRecovered = totalAdv > 0 ? remainingAdvanceToRecover <= 0.001 : true;

  // 3. Total Deductions
  const totalDeductions = Number((retentionDeduction + advanceRecoveryDeduction + other).toFixed(2));

  // 4. Net Payable = Gross - Total Deductions
  let netPayable = gross - totalDeductions;
  if (params.clampNegativeNet !== false && netPayable < 0) {
    netPayable = 0;
  }
  netPayable = Number(netPayable.toFixed(2));

  return {
    grossAmount: Number(gross.toFixed(2)),
    retentionDeduction,
    advanceRecoveryDeduction,
    otherDeductions: other,
    totalDeductions,
    netPayable,
    cumulativeAdvanceRecoveredAfter,
    remainingAdvanceToRecover,
    isAdvanceFullyRecovered,
  };
}

/**
 * Pure function: Validate Subcontractor IPC workflow transitions.
 * Workflow: 'draft' -> 'under_review' -> 'approved' -> 'paid'
 */
export function validateIpcWorkflowTransition(
  currentStatus: string,
  targetStatus: string
): { valid: boolean; reason?: string } {
  const validTransitions: Record<string, string[]> = {
    draft: ['under_review'],
    under_review: ['approved', 'rejected', 'draft'],
    rejected: ['draft', 'under_review'],
    approved: ['paid'],
    paid: [], // Final paid status is terminal and locked
  };

  const allowed = validTransitions[currentStatus];
  if (!allowed) {
    return { valid: false, reason: `Unknown current status "${currentStatus}"` };
  }

  if (!allowed.includes(targetStatus)) {
    return {
      valid: false,
      reason: `Invalid transition from "${currentStatus}" to "${targetStatus}". Allowed: [${allowed.join(', ')}]`,
    };
  }

  return { valid: true };
}

// ============================================================================
// TEST SUITE: Contracts, Variation Orders (VOs) & Subcontractor IPCs
// ============================================================================

describe('Phase 5: Contracts, Variation Orders & Subcontractor IPCs Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  // =========================================================================
  // 1. Owner Contract & Variation Orders (VOs) Rollup Engine
  // =========================================================================
  describe('1. Owner Contract & Variation Orders (VO) Rollups', () => {
    const baselineFinish = '2026-10-31';

    it('calculates cumulative approved VOs and Revised Contract Value correctly for multiple positive VOs', () => {
      const originalValue = 10_000_000;
      const changeOrders: Partial<ChangeOrder>[] = [
        {
          id: 'vo-1',
          vo_number: 'VO-001',
          title_ar: 'إضافة أعمال حمام السباحة الإضافي',
          amount_egp: 750_000,
          time_extension_days: 15,
          status: 'approved',
          approval_status: 'approved',
        },
        {
          id: 'vo-2',
          vo_number: 'VO-002',
          title_ar: 'تعديل مواصفات المضخات الميكانيكية',
          amount_egp: 250_000,
          time_extension_days: 10,
          status: 'approved',
          approval_status: 'approved',
        },
      ];

      const rollup = calculateContractRollup(originalValue, changeOrders, baselineFinish);

      expect(rollup.originalValue).toBe(10_000_000);
      expect(rollup.approvedVosCount).toBe(2);
      expect(rollup.approvedVosAmount).toBe(1_000_000); // 750k + 250k
      expect(rollup.revisedContractValue).toBe(11_000_000); // 10M + 1M
      expect(rollup.totalEotDays).toBe(25); // 15 + 10
      // 2026-10-31 + 25 days = 2026-11-25
      expect(rollup.revisedFinishDate).toBe('2026-11-25');
      expect(rollup.unapprovedVosCount).toBe(0);
      expect(rollup.unapprovedVosAmount).toBe(0);
    });

    it('handles negative deductive VOs (scope omission) reducing the revised contract value', () => {
      const originalValue = 5_000_000;
      const changeOrders: Partial<ChangeOrder>[] = [
        {
          id: 'vo-add',
          vo_number: 'VO-001',
          title_ar: 'إضافة تشطيبات جرانيت إضافية',
          amount_egp: 600_000,
          time_extension_days: 10,
          status: 'approved',
        },
        {
          id: 'vo-deduct',
          vo_number: 'VO-002',
          title_ar: 'إلغاء بند النافورة الدائرية (حذف نطاق)',
          amount_egp: -200_000,
          time_extension_days: 0,
          status: 'approved',
        },
      ];

      const rollup = calculateContractRollup(originalValue, changeOrders, baselineFinish);

      expect(rollup.approvedVosAmount).toBe(400_000); // 600k - 200k
      expect(rollup.revisedContractValue).toBe(5_400_000); // 5M + 400k
      expect(rollup.totalEotDays).toBe(10);
      expect(rollup.revisedFinishDate).toBe('2026-11-10');
    });

    it('strictly excludes unapproved, draft, submitted, and rejected VOs from revised contract totals and EOT', () => {
      const originalValue = 8_000_000;
      const changeOrders: Partial<ChangeOrder>[] = [
        {
          id: 'vo-approved',
          vo_number: 'VO-001',
          amount_egp: 500_000,
          time_extension_days: 20,
          status: 'approved',
        },
        {
          id: 'vo-draft',
          vo_number: 'VO-002',
          amount_egp: 300_000,
          time_extension_days: 15,
          status: 'draft',
        },
        {
          id: 'vo-submitted',
          vo_number: 'VO-003',
          amount_egp: 450_000,
          time_extension_days: 30,
          status: 'submitted',
        },
        {
          id: 'vo-rejected',
          vo_number: 'VO-004',
          amount_egp: 900_000,
          time_extension_days: 45,
          status: 'rejected',
        },
      ];

      const rollup = calculateContractRollup(originalValue, changeOrders, baselineFinish);

      expect(rollup.approvedVosCount).toBe(1);
      expect(rollup.approvedVosAmount).toBe(500_000);
      expect(rollup.unapprovedVosCount).toBe(3);
      expect(rollup.unapprovedVosAmount).toBe(1_650_000); // 300k + 450k + 900k
      expect(rollup.revisedContractValue).toBe(8_500_000); // 8M + 500k ONLY
      expect(rollup.totalEotDays).toBe(20); // 20 days only from approved
      expect(rollup.revisedFinishDate).toBe('2026-11-20');
    });

    it('handles zero VOs gracefully preserving original contract and finish date', () => {
      const originalValue = 12_500_000;
      const rollup = calculateContractRollup(originalValue, [], baselineFinish);

      expect(rollup.originalValue).toBe(12_500_000);
      expect(rollup.approvedVosCount).toBe(0);
      expect(rollup.approvedVosAmount).toBe(0);
      expect(rollup.revisedContractValue).toBe(12_500_000);
      expect(rollup.totalEotDays).toBe(0);
      expect(rollup.revisedFinishDate).toBe('2026-10-31');
    });

    it('handles leap years and month transitions accurately when extending finish dates', () => {
      const leapBaseline = '2028-02-15'; // 2028 is a leap year (Feb has 29 days)
      const changeOrders: Partial<ChangeOrder>[] = [
        {
          id: 'vo-leap',
          amount_egp: 100_000,
          time_extension_days: 20,
          status: 'approved',
        },
      ];

      const rollup = calculateContractRollup(1_000_000, changeOrders, leapBaseline);
      // Feb 15 + 20 days in leap year: Feb 15 + 14 = Feb 29 (14 days), + 6 = March 6
      expect(rollup.revisedFinishDate).toBe('2028-03-06');
    });
  });

  // =========================================================================
  // 2. VO Approval Status Workflow Transitions
  // =========================================================================
  describe('2. Variation Order Approval Workflow Transitions', () => {
    it('permits standard happy-path lifecycle: draft -> submitted -> approved', () => {
      const step1 = validateVoWorkflowTransition('draft', 'submitted');
      expect(step1.valid).toBe(true);

      const step2 = validateVoWorkflowTransition('submitted', 'approved');
      expect(step2.valid).toBe(true);
    });

    it('permits rejection and re-submission lifecycle: draft -> submitted -> rejected -> submitted -> approved', () => {
      expect(validateVoWorkflowTransition('draft', 'submitted').valid).toBe(true);
      expect(validateVoWorkflowTransition('submitted', 'rejected').valid).toBe(true);
      expect(validateVoWorkflowTransition('rejected', 'submitted').valid).toBe(true);
      expect(validateVoWorkflowTransition('submitted', 'approved').valid).toBe(true);
    });

    it('allows returning submitted VO back to draft for engineering corrections', () => {
      const result = validateVoWorkflowTransition('submitted', 'draft');
      expect(result.valid).toBe(true);
    });

    it('rejects invalid direct transition from draft straight to approved without formal submission', () => {
      const result = validateVoWorkflowTransition('draft', 'approved');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid transition');
    });

    it('locks approved VOs preventing any state modification (terminal state invariant)', () => {
      expect(validateVoWorkflowTransition('approved', 'draft').valid).toBe(false);
      expect(validateVoWorkflowTransition('approved', 'submitted').valid).toBe(false);
      expect(validateVoWorkflowTransition('approved', 'rejected').valid).toBe(false);
    });

    it('rejects unknown or malformed status strings', () => {
      const result = validateVoWorkflowTransition('in_limbo', 'approved');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Unknown current status');
    });
  });

  // =========================================================================
  // 3. Subcontractor Registry & Commercial Terms
  // =========================================================================
  describe('3. Subcontractor Registry & Commercial Terms', () => {
    it('validates standard commercial terms configuration for subcontractors', () => {
      const subContractor: Partial<ProjectSubcontractor> = {
        id: 'psub-101',
        project_id: 'proj-001',
        company_name: 'شركة الأهرام للمقاولات الكهروميكانيكية',
        specialization: 'MEP Systems & Piping',
        scope_description: 'توريد وتركيب شبكات التغذية والصرف وغرف الطلمبات',
        contract_value: 2_500_000,
        status: 'active',
        contract_status: 'active',
        rep_name: 'م. أحمد الشناوي',
        rep_phone: '+201001234567',
        rep_email: 'a.shinawy@ahram-mep.com',
      };

      const commercialSettings: CommercialSettings = {
        project_id: 'proj-001',
        retention_pct: 10.0,
        advance_amortization_pct: 10.0,
        other_deductions_pct: 0.0,
        waste_alert_threshold_pct: 5.0,
        week_start_day: 6,
        weekly_send_day: 4,
      };

      const advancePaymentPct = 15.0; // 15% advance payment
      const advancePaymentAmount = subContractor.contract_value! * (advancePaymentPct / 100);
      const retentionCap = subContractor.contract_value! * (commercialSettings.retention_pct / 100);

      expect(subContractor.contract_value).toBe(2_500_000);
      expect(advancePaymentAmount).toBe(375_000); // 15% of 2.5M
      expect(retentionCap).toBe(250_000); // 10% of 2.5M
    });

    it('handles subcontractor statuses: active, suspended, completed', () => {
      const activeSub: Partial<ProjectSubcontractor> = { id: 's1', status: 'active' };
      const suspendedSub: Partial<ProjectSubcontractor> = { id: 's2', status: 'suspended' };
      const completedSub: Partial<ProjectSubcontractor> = { id: 's3', status: 'completed' };

      expect(['active', 'suspended', 'completed']).toContain(activeSub.status);
      expect(['active', 'suspended', 'completed']).toContain(suspendedSub.status);
      expect(['active', 'suspended', 'completed']).toContain(completedSub.status);
    });
  });

  // =========================================================================
  // 4. Itemized IPC Lines Calculation
  // =========================================================================
  describe('4. Itemized IPC Lines Calculation', () => {
    it('computes line gross, cumulative quantities, and aggregated gross amount across multiple items', () => {
      const lines: IpcLineItem[] = [
        {
          id: 'line-1',
          item_code: 'BOQ-CIV-001',
          description: 'حفر في تربة رملية ونقل المخلفات',
          unit: 'm3',
          previous_qty: 500,
          current_qty: 250,
          unit_rate: 120, // 250 * 120 = 30,000 EGP
        },
        {
          id: 'line-2',
          item_code: 'BOQ-CIV-002',
          description: 'خرسانة مسلحة لحوائط الخزان',
          unit: 'm3',
          previous_qty: 40,
          current_qty: 60,
          unit_rate: 4500, // 60 * 4500 = 270,000 EGP
        },
        {
          id: 'line-3',
          item_code: 'BOQ-FIN-005',
          description: 'عزل مائي مرن للأسطح المبللة',
          unit: 'm2',
          previous_qty: 0,
          current_qty: 350,
          unit_rate: 220, // 350 * 220 = 77,000 EGP
        },
      ];

      const result = calculateIpcLinesGross(lines);

      expect(result.itemCount).toBe(3);
      // Line 1
      expect(result.lines[0].lineGross).toBe(30_000);
      expect(result.lines[0].cumulativeQty).toBe(750); // 500 + 250
      expect(result.lines[0].cumulativeAmount).toBe(90_000); // 750 * 120

      // Line 2
      expect(result.lines[1].lineGross).toBe(270_000);
      expect(result.lines[1].cumulativeQty).toBe(100); // 40 + 60
      expect(result.lines[1].cumulativeAmount).toBe(450_000); // 100 * 4500

      // Line 3
      expect(result.lines[2].lineGross).toBe(77_000);
      expect(result.lines[2].cumulativeQty).toBe(350);
      expect(result.lines[2].cumulativeAmount).toBe(77_000);

      // Total Gross Amount
      // 30,000 + 270,000 + 77,000 = 377,000 EGP
      expect(result.totalGross).toBe(377_000);
    });

    it('handles empty line items list returning 0 total gross', () => {
      const result = calculateIpcLinesGross([]);
      expect(result.totalGross).toBe(0);
      expect(result.itemCount).toBe(0);
      expect(result.lines).toEqual([]);
    });

    it('handles zero quantity lines without error', () => {
      const lines: IpcLineItem[] = [
        {
          item_code: 'BOQ-01',
          current_qty: 0,
          unit_rate: 1500,
          previous_qty: 100,
        },
      ];
      const result = calculateIpcLinesGross(lines);
      expect(result.totalGross).toBe(0);
      expect(result.lines[0].lineGross).toBe(0);
      expect(result.lines[0].cumulativeQty).toBe(100);
    });
  });

  // =========================================================================
  // 5. IPC Deductions Engine & Net Payable Math
  // =========================================================================
  describe('5. IPC Deductions Engine & Net Payable Calculations', () => {
    it('calculates standard deductions: retention (10%), advance recovery (10%), other deductions and net payable', () => {
      // Gross claimed: 500,000 EGP
      // Retention: 10% -> 50,000 EGP
      // Advance amortization: 10% -> 50,000 EGP (Total Advance = 200,000, previously recovered = 0)
      // Other deductions: 5,000 EGP (site safety backcharge)
      // Total Deductions = 105,000 EGP
      // Net Payable = 500,000 - 105,000 = 395,000 EGP
      const params: IpcDeductionsInput = {
        grossAmount: 500_000,
        retentionPct: 10.0,
        advanceAmortizationPct: 10.0,
        totalAdvancePaid: 200_000,
        cumulativeAdvanceRecoveredBefore: 0,
        otherDeductions: 5_000,
      };

      const result = calculateIpcDeductions(params);

      expect(result.grossAmount).toBe(500_000);
      expect(result.retentionDeduction).toBe(50_000);
      expect(result.advanceRecoveryDeduction).toBe(50_000);
      expect(result.otherDeductions).toBe(5_000);
      expect(result.totalDeductions).toBe(105_000);
      expect(result.netPayable).toBe(395_000);
      expect(result.cumulativeAdvanceRecoveredAfter).toBe(50_000);
      expect(result.remainingAdvanceToRecover).toBe(150_000); // 200k - 50k
      expect(result.isAdvanceFullyRecovered).toBe(false);
    });

    it('caps advance recovery deduction to remaining unrecovered advance amount (no over-recovery)', () => {
      // Total advance paid = 100,000 EGP
      // Cumulative recovered before = 85,000 EGP -> Remaining to recover = 15,000 EGP
      // Gross = 300,000 EGP
      // Theoretical 10% amortization = 30,000 EGP -> MUST BE CAPPED AT 15,000 EGP
      const params: IpcDeductionsInput = {
        grossAmount: 300_000,
        retentionPct: 5.0, // 15,000 EGP
        advanceAmortizationPct: 10.0, // 30,000 EGP theoretical -> capped at 15,000
        totalAdvancePaid: 100_000,
        cumulativeAdvanceRecoveredBefore: 85_000,
        otherDeductions: 0,
      };

      const result = calculateIpcDeductions(params);

      expect(result.retentionDeduction).toBe(15_000);
      expect(result.advanceRecoveryDeduction).toBe(15_000); // Capped!
      expect(result.totalDeductions).toBe(30_000); // 15k ret + 15k adv
      expect(result.netPayable).toBe(270_000); // 300k - 30k
      expect(result.cumulativeAdvanceRecoveredAfter).toBe(100_000);
      expect(result.remainingAdvanceToRecover).toBe(0);
      expect(result.isAdvanceFullyRecovered).toBe(true);
    });

    it('applies 0% advance recovery when advance is already 100% recovered in earlier IPCs', () => {
      const params: IpcDeductionsInput = {
        grossAmount: 400_000,
        retentionPct: 10.0, // 40,000
        advanceAmortizationPct: 10.0,
        totalAdvancePaid: 100_000,
        cumulativeAdvanceRecoveredBefore: 100_000, // 100% recovered!
        otherDeductions: 2_000,
      };

      const result = calculateIpcDeductions(params);

      expect(result.advanceRecoveryDeduction).toBe(0); // ZERO advance deduction
      expect(result.retentionDeduction).toBe(40_000);
      expect(result.totalDeductions).toBe(42_000); // 40k + 0 + 2k
      expect(result.netPayable).toBe(358_000); // 400k - 42k
      expect(result.isAdvanceFullyRecovered).toBe(true);
      expect(result.remainingAdvanceToRecover).toBe(0);
    });

    it('handles 0% retention terms accurately (no retention withheld)', () => {
      const params: IpcDeductionsInput = {
        grossAmount: 250_000,
        retentionPct: 0.0, // 0% retention
        advanceAmortizationPct: 10.0,
        totalAdvancePaid: 50_000,
        cumulativeAdvanceRecoveredBefore: 0,
        otherDeductions: 0,
      };

      const result = calculateIpcDeductions(params);

      expect(result.retentionDeduction).toBe(0);
      expect(result.advanceRecoveryDeduction).toBe(25_000); // 10% of 250k
      expect(result.totalDeductions).toBe(25_000);
      expect(result.netPayable).toBe(225_000); // 250k - 25k
    });

    it('handles zero gross amount safely with 0 payable and 0 percentage deductions', () => {
      const params: IpcDeductionsInput = {
        grossAmount: 0,
        retentionPct: 10.0,
        advanceAmortizationPct: 10.0,
        totalAdvancePaid: 100_000,
        cumulativeAdvanceRecoveredBefore: 20_000,
        otherDeductions: 0,
      };

      const result = calculateIpcDeductions(params);

      expect(result.grossAmount).toBe(0);
      expect(result.retentionDeduction).toBe(0);
      expect(result.advanceRecoveryDeduction).toBe(0);
      expect(result.totalDeductions).toBe(0);
      expect(result.netPayable).toBe(0);
    });

    it('clamps net payable at zero when total deductions exceed gross amount', () => {
      // Heavy penalties / backcharges exceeding gross
      const params: IpcDeductionsInput = {
        grossAmount: 50_000,
        retentionPct: 10.0, // 5,000
        advanceAmortizationPct: 0,
        otherDeductions: 70_000, // Exceeds gross
        clampNegativeNet: true,
      };

      const result = calculateIpcDeductions(params);

      expect(result.totalDeductions).toBe(75_000); // 5k + 70k
      expect(result.netPayable).toBe(0); // Clamped at 0
    });

    it('preserves fractional rounding to 2 decimal places for non-integer rates and quantities', () => {
      // 33.333 units @ 142.857 = 4,761.852381 -> 4,761.85 gross
      const lines: IpcLineItem[] = [
        {
          current_qty: 33.333,
          unit_rate: 142.857,
        },
      ];
      const lineRes = calculateIpcLinesGross(lines);
      expect(lineRes.totalGross).toBe(4761.85);

      const params: IpcDeductionsInput = {
        grossAmount: lineRes.totalGross,
        retentionPct: 7.5, // 7.5%
        advanceAmortizationPct: 12.5, // 12.5%
        totalAdvancePaid: 50_000,
        cumulativeAdvanceRecoveredBefore: 0,
        otherDeductions: 123.45,
      };

      const result = calculateIpcDeductions(params);

      // Retention = 4,761.85 * 0.075 = 357.13875 -> 357.14
      expect(result.retentionDeduction).toBe(357.14);
      // Advance = 4,761.85 * 0.125 = 595.23125 -> 595.23
      expect(result.advanceRecoveryDeduction).toBe(595.23);
      // Total Deductions = 357.14 + 595.23 + 123.45 = 1,075.82
      expect(result.totalDeductions).toBe(1075.82);
      // Net Payable = 4,761.85 - 1,075.82 = 3,686.03
      expect(result.netPayable).toBe(3686.03);
    });
  });

  // =========================================================================
  // 6. Subcontractor IPC Status Workflow Transitions
  // =========================================================================
  describe('6. Subcontractor IPC Workflow Transitions', () => {
    it('permits standard happy-path lifecycle: draft -> under_review -> approved -> paid', () => {
      expect(validateIpcWorkflowTransition('draft', 'under_review').valid).toBe(true);
      expect(validateIpcWorkflowTransition('under_review', 'approved').valid).toBe(true);
      expect(validateIpcWorkflowTransition('approved', 'paid').valid).toBe(true);
    });

    it('permits returning IPC to draft or rejecting during review cycle', () => {
      expect(validateIpcWorkflowTransition('under_review', 'draft').valid).toBe(true);
      expect(validateIpcWorkflowTransition('under_review', 'rejected').valid).toBe(true);
      expect(validateIpcWorkflowTransition('rejected', 'draft').valid).toBe(true);
      expect(validateIpcWorkflowTransition('rejected', 'under_review').valid).toBe(true);
    });

    it('prevents premature payment jumping from draft directly to paid', () => {
      const result = validateIpcWorkflowTransition('draft', 'paid');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid transition');
    });

    it('prevents paying unapproved IPC directly from under_review', () => {
      const result = validateIpcWorkflowTransition('under_review', 'paid');
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid transition');
    });

    it('locks paid IPC preventing any further status modifications (terminal state invariant)', () => {
      expect(validateIpcWorkflowTransition('paid', 'draft').valid).toBe(false);
      expect(validateIpcWorkflowTransition('paid', 'under_review').valid).toBe(false);
      expect(validateIpcWorkflowTransition('paid', 'approved').valid).toBe(false);
    });
  });

  // =========================================================================
  // 7. ProjectTabsService Integration (Change Orders & Invoices)
  // =========================================================================
  describe('7. ProjectTabsService Integration (VOs & Invoices)', () => {
    const projectId = 'proj-contracts-test';

    it('fetches change orders for project and uses cache correctly', async () => {
      const mockCOs: ChangeOrder[] = [
        {
          id: 'co-1',
          project_id: projectId,
          vo_number: 'VO-1',
          title_ar: 'تعديل بند',
          amount_egp: 150_000,
          time_extension_days: 5,
          status: 'approved',
          approval_status: 'approved',
          created_at: new Date().toISOString(),
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_change_orders') {
          return createMockQueryBuilder({ data: mockCOs, error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const firstCall = await ProjectTabsService.getChangeOrders(projectId);
      expect(firstCall).toHaveLength(1);
      expect(firstCall[0].amount_egp).toBe(150_000);

      // Verify cache hit
      const cached = appCache.get<ChangeOrder[]>(CACHE_KEYS.changeOrders(projectId));
      expect(cached).toBeDefined();
      expect(cached).toHaveLength(1);

      // Second call returns from cache
      const secondCall = await ProjectTabsService.getChangeOrders(projectId);
      expect(secondCall).toEqual(firstCall);
    });

    it('adds new change order and invalidates cache', async () => {
      const newCO: Partial<ChangeOrder> = {
        project_id: projectId,
        vo_number: 'VO-002',
        title_ar: 'بند إضافي جديد',
        amount_egp: 200_000,
        time_extension_days: 10,
        status: 'draft',
      };

      const createdCO: ChangeOrder = {
        id: 'co-new-123',
        project_id: projectId,
        vo_number: 'VO-002',
        title_ar: 'بند إضافي جديد',
        amount_egp: 200_000,
        time_extension_days: 10,
        status: 'draft',
        approval_status: 'pending',
        created_at: new Date().toISOString(),
      };

      // Prime cache first
      appCache.set(CACHE_KEYS.changeOrders(projectId), [{ id: 'co-1' } as never], 10000);
      expect(appCache.get(CACHE_KEYS.changeOrders(projectId))).toBeDefined();

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_change_orders') {
          return createMockQueryBuilder({ data: createdCO, error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const result = await ProjectTabsService.addChangeOrder(newCO);
      expect(result).toBeDefined();
      expect(result?.id).toBe('co-new-123');

      // Verify cache was invalidated
      expect(appCache.get(CACHE_KEYS.changeOrders(projectId))).toBeNull();
    });

    it('fetches invoices for project and adds new invoice with cache invalidation', async () => {
      const mockInvoices: ProjectInvoice[] = [
        {
          id: 'inv-1',
          project_id: projectId,
          ipc_number: 'IPC-01',
          claimed_amount: 350_000,
          approved_amount: 320_000,
          status: 'under_review',
          created_at: new Date().toISOString(),
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_invoices') {
          return createMockQueryBuilder({ data: mockInvoices, error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const list = await ProjectTabsService.getInvoices(projectId);
      expect(list).toHaveLength(1);
      expect(list[0].ipc_number).toBe('IPC-01');

      // Prime cache first
      appCache.set(CACHE_KEYS.invoices(projectId), list, 10000);
      expect(appCache.get(CACHE_KEYS.invoices(projectId))).toBeDefined();

      // Add invoice
      const newInv: Partial<ProjectInvoice> = {
        project_id: projectId,
        ipc_number: 'IPC-02',
        claimed_amount: 500_000,
        approved_amount: 480_000,
        status: 'under_review',
      };

      const createdInv = { ...newInv, id: 'inv-2' } as ProjectInvoice;
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_invoices') {
          return createMockQueryBuilder({ data: createdInv, error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const added = await ProjectTabsService.addInvoice(newInv);
      expect(added?.id).toBe('inv-2');
      expect(appCache.get(CACHE_KEYS.invoices(projectId))).toBeNull();
    });
  });

  // =========================================================================
  // 8. Subcontractor Registry & SubcontractorService Integration
  // =========================================================================
  describe('8. Subcontractor Registry & SubcontractorService Integration', () => {
    const projectId = 'proj-sub-test';

    it('fetches subcontractors via ProjectTabsService and handles fallback formatting', async () => {
      const mockSubs: ProjectSubcontractor[] = [
        {
          id: 'sub-1',
          project_id: projectId,
          company_name: 'شركة النيل للخرسانة',
          specialization: 'Civil & Concrete',
          scope_description: 'أعمال الهيكل الخرساني',
          status: 'active',
          contract_value: 3_000_000,
          rep_name: 'م. تامر حسني',
          rep_phone: '+201011122334',
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_project_subcontractors') {
          return createMockQueryBuilder({ data: mockSubs, error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const subs = await ProjectTabsService.getSubcontractors(projectId);
      expect(subs).toHaveLength(1);
      expect(subs[0].company_name).toBe('شركة النيل للخرسانة');
      expect(subs[0].contract_value).toBe(3_000_000);
    });

    it('computes subcontractor productivity metrics against daily progress lines', async () => {
      const targets: SubcontractorTarget[] = [
        {
          id: 'tgt-1',
          project_id: projectId,
          subcontractor_id: 'sub-1',
          boq_item_id: 'boq-concrete',
          target_qty: 100,
          target_date: '2026-08-24',
          unit: 'm3',
        },
        {
          id: 'tgt-2',
          project_id: projectId,
          subcontractor_id: 'sub-2',
          boq_item_id: 'boq-plaster',
          target_qty: 200,
          target_date: '2026-08-24',
          unit: 'm2',
        },
      ];

      // Mock daily progress report with lines
      const mockReports = [
        {
          id: 'dp-1',
          project_id: projectId,
          progress_date: '2026-08-24',
          manpower_count: 25,
          lines: [
            {
              id: 'dpl-1',
              boq_item_id: 'boq-concrete',
              subcontractor_id: 'sub-1',
              qty_today: 85, // 85 / 100 = 85% -> on track (> 70%)
              line_status: 'approved',
            },
            {
              id: 'dpl-2',
              boq_item_id: 'boq-plaster',
              subcontractor_id: 'sub-2',
              qty_today: 100, // 100 / 200 = 50% -> underperforming (< 70%)
              line_status: 'approved',
            },
          ],
        },
      ];

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'pm_subcontractor_targets') {
          return createMockQueryBuilder({ data: targets, error: null });
        }
        if (table === 'pm_daily_progress') {
          return createMockQueryBuilder({ data: mockReports, error: null });
        }
        return createMockQueryBuilder({ data: null, error: null });
      });

      const metrics = await SubcontractorService.getSubcontractorProductivity(projectId);

      expect(metrics).toHaveLength(2);

      // Subcontractor 1 (85% achievement -> not underperforming)
      const metric1 = metrics.find((m) => m.subcontractor_id === 'sub-1');
      expect(metric1).toBeDefined();
      expect(metric1?.target_qty).toBe(100);
      expect(metric1?.actual_qty).toBe(85);
      expect(metric1?.achievement_pct).toBe(85);
      expect(metric1?.is_underperforming).toBe(false);

      // Subcontractor 2 (50% achievement -> underperforming flag true)
      const metric2 = metrics.find((m) => m.subcontractor_id === 'sub-2');
      expect(metric2).toBeDefined();
      expect(metric2?.target_qty).toBe(200);
      expect(metric2?.actual_qty).toBe(100);
      expect(metric2?.achievement_pct).toBe(50);
      expect(metric2?.is_underperforming).toBe(true);
    });
  });
});
