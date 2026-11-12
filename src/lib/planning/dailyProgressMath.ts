/**
 * Domain Math & State Determinism for Daily Progress
 * Single source of truth for calculations, validations, and state derivations.
 */

export interface ProgressCalculationResult {
  todayQty: number;
  todayPct: number;
  totalCumulativeQty: number;
  totalPct: number;
  remainingQty: number;
  isOverBudget: boolean;
  overflowQty: number;
}

export type DeterministicTaskStatus =
  | 'PLANNED'
  | 'IN PROGRESS'
  | 'BLOCKED'
  | 'READY FOR REVIEW'
  | 'COMPLETED';

export interface NextActionInfo {
  key: string;
  labelAr: string;
  labelEn: string;
  variant: 'primary' | 'warning' | 'success' | 'neutral';
}

/**
 * Deterministically calculate progress quantities and percentages.
 */
export function calculateProgressMath(params: {
  todayQty: number;
  contractQty: number;
  previousCumulativeQty: number;
}): ProgressCalculationResult {
  const contractQty = Math.max(0, Number(params.contractQty) || 0);
  const previousCumulativeQty = Math.max(0, Number(params.previousCumulativeQty) || 0);
  const todayQty = Math.max(0, Number(params.todayQty) || 0);

  const totalCumulativeQty = Number((previousCumulativeQty + todayQty).toFixed(3));
  const remainingQty = contractQty > 0 ? Number(Math.max(0, contractQty - totalCumulativeQty).toFixed(3)) : 0;

  const todayPct = contractQty > 0 ? Number(((todayQty / contractQty) * 100).toFixed(2)) : 0;
  const totalPct = contractQty > 0 ? Number(((totalCumulativeQty / contractQty) * 100).toFixed(2)) : (totalCumulativeQty > 0 ? 100 : 0);

  const isOverBudget = contractQty > 0 && totalCumulativeQty > contractQty;
  const overflowQty = isOverBudget ? Number((totalCumulativeQty - contractQty).toFixed(3)) : 0;

  return {
    todayQty,
    todayPct,
    totalCumulativeQty,
    totalPct,
    remainingQty,
    isOverBudget,
    overflowQty,
  };
}

/**
 * Calculate today's quantity from an entered completion percentage.
 */
export function calculateQtyFromPct(params: {
  targetTotalPct: number;
  contractQty: number;
  previousCumulativeQty: number;
}): number {
  const contractQty = Math.max(0, Number(params.contractQty) || 0);
  const previousCumulativeQty = Math.max(0, Number(params.previousCumulativeQty) || 0);
  const targetTotalPct = Math.max(0, Math.min(100, Number(params.targetTotalPct) || 0));

  if (contractQty === 0) return 0;

  const targetCumulativeQty = (targetTotalPct / 100) * contractQty;
  const neededTodayQty = Math.max(0, targetCumulativeQty - previousCumulativeQty);
  return Number(neededTodayQty.toFixed(3));
}

/**
 * Strict state machine: Derives the task status deterministically.
 * Rule: BLOCKED is an operational workflow state and does NOT wipe progress.
 */
export function deriveDeterministicStatus(params: {
  progressPct: number;
  hasActiveObstruction?: boolean;
  status?: string;
  isQcPending?: boolean;
  isApproved?: boolean;
}): DeterministicTaskStatus {
  const pct = Math.max(0, Number(params.progressPct) || 0);

  if (params.hasActiveObstruction) {
    return 'BLOCKED';
  }

  if (pct >= 100 || params.status === 'done' || params.status === 'approved') {
    return 'COMPLETED';
  }

  if (params.isQcPending || params.status === 'pm_review' || params.status === 'qc_pending') {
    return 'READY FOR REVIEW';
  }

  if (pct > 0 || params.status === 'in_progress') {
    return 'IN PROGRESS';
  }

  return 'PLANNED';
}

/**
 * Derives the persistent "Next Action" guide for the engineer on any task.
 */
export function deriveNextAction(params: {
  progressPct: number;
  hasActiveObstruction?: boolean;
  hasPhotos?: boolean;
  status?: string;
}): NextActionInfo {
  const status = deriveDeterministicStatus({
    progressPct: params.progressPct,
    hasActiveObstruction: params.hasActiveObstruction,
    status: params.status,
  });

  if (status === 'BLOCKED') {
    return {
      key: 'resolve_obstruction',
      labelAr: 'حل المعوقات واستئناف العمل',
      labelEn: 'Resolve Obstruction',
      variant: 'warning',
    };
  }

  if (status === 'COMPLETED') {
    return {
      key: 'view_report',
      labelAr: 'عرض التقرير النهائي المعتمد',
      labelEn: 'View Final Report',
      variant: 'success',
    };
  }

  if (status === 'READY FOR REVIEW') {
    return {
      key: 'follow_review',
      labelAr: 'متابعة اعتماد الجودة والمدير',
      labelEn: 'Follow-up QC & PM Review',
      variant: 'neutral',
    };
  }

  if (params.progressPct > 0 && !params.hasPhotos) {
    return {
      key: 'add_photo',
      labelAr: 'إرفاق صور وتوثيق الموقع',
      labelEn: 'Add Site Photo',
      variant: 'neutral',
    };
  }

  return {
    key: 'update_progress',
    labelAr: 'تسجيل إنجاز اليوم',
    labelEn: "Update Today's Progress",
    variant: 'primary',
  };
}

/**
 * Validation guard: checks input integrity before submission.
 */
export function validateProgressSubmission(params: {
  todayQty: number;
  contractQty: number;
  previousCumulativeQty: number;
}): { isValid: boolean; errorAr?: string; warningAr?: string } {
  if (params.todayQty < 0) {
    return {
      isValid: false,
      errorAr: 'لا يمكن إدخال كمية سالبة.',
    };
  }

  const calc = calculateProgressMath(params);

  if (calc.isOverBudget) {
    return {
      isValid: true,
      warningAr: `تنبيه: التراكمي الإجمالي (${calc.totalCumulativeQty}) تجاوز كمية العقد الإجمالية (${params.contractQty}) بمقدار ${calc.overflowQty}.`,
    };
  }

  return { isValid: true };
}
