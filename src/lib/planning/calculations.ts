import {
  ScurvePoint,
  SubcontractorTarget,
  SubcontractorProductivityMetric,
  DailyProgressLine,
  DailyObstruction,
  ObstructionType,
  Deliverable,
  DailyProgress,
  PmHold,
  RfiRegisterItem,
  MorningCommandCenterSummary,
} from '@/types/planning';

export interface EvmCalculationParams {
  earnedValueEgp: number;        // BCWP (Budgeted Cost of Work Performed)
  plannedValueEgp: number;       // BCWS (Budgeted Cost of Work Scheduled)
  actualCostEgp?: number;        // ACWP (Actual Cost of Work Performed)
  budgetAtCompletionEgp: number; // BAC (Budget At Completion)
}

export interface EvmMetrics {
  bcwp: number;
  bcws: number;
  acwp: number;
  bac: number;
  cv: number;                    // Cost Variance (BCWP - ACWP)
  sv: number;                    // Schedule Variance (BCWP - BCWS)
  cpi: number;                   // Cost Performance Index (BCWP / ACWP)
  spi: number;                   // Schedule Performance Index (BCWP / BCWS)
  eac: number;                   // Estimate At Completion (BAC / CPI)
  etc: number;                   // Estimate To Complete (EAC - ACWP)
  vac: number;                   // Variance At Completion (BAC - EAC)
  tcpi: number;                  // To-Complete Performance Index
}

/**
 * Pure function: Calculate full Earned Value Management (EVM) parameters.
 */
export function calculateEVM(params: EvmCalculationParams): EvmMetrics {
  const bcwp = Math.max(0, params.earnedValueEgp);
  const bcws = Math.max(0, params.plannedValueEgp);
  const acwp = Math.max(0, params.actualCostEgp ?? 0);
  const bac = Math.max(0, params.budgetAtCompletionEgp);

  const cv = bcwp - acwp;
  const sv = bcwp - bcws;

  // CPI: BCWP / ACWP (1.0 if ACWP == 0 and BCWP == 0, or positive fallback)
  let cpi = 1.0;
  if (acwp > 0) {
    cpi = bcwp / acwp;
  } else if (bcwp > 0) {
    cpi = 1.0; // Perfect cost index if no actual costs recorded yet
  }

  // SPI: BCWP / BCWS
  let spi = 1.0;
  if (bcws > 0) {
    spi = bcwp / bcws;
  } else if (bcwp > 0) {
    spi = 1.0;
  }

  // EAC: BAC / CPI when CPI > 0; PMI fallback ACWP + (BAC - BCWP) when ACWP > 0 and CPI <= 0
  let eac = bac;
  if (cpi > 0) {
    eac = bac / cpi;
  } else if (acwp > 0) {
    eac = acwp + Math.max(0, bac - bcwp);
  }
  const etc = Math.max(0, eac - acwp);
  const vac = bac - eac;

  // TCPI: (BAC - BCWP) / (BAC - ACWP)
  const remainingBudget = bac - acwp;
  const remainingWork = bac - bcwp;
  const tcpi = remainingBudget > 0 ? Math.max(0, remainingWork / remainingBudget) : 1.0;

  return {
    bcwp: Number(bcwp.toFixed(2)),
    bcws: Number(bcws.toFixed(2)),
    acwp: Number(acwp.toFixed(2)),
    bac: Number(bac.toFixed(2)),
    cv: Number(cv.toFixed(2)),
    sv: Number(sv.toFixed(2)),
    cpi: Number(cpi.toFixed(4)),
    spi: Number(spi.toFixed(4)),
    eac: Number(eac.toFixed(2)),
    etc: Number(etc.toFixed(2)),
    vac: Number(vac.toFixed(2)),
    tcpi: Number(tcpi.toFixed(4)),
  };
}

/**
 * Pure function: Calculate Estimate At Completion (EAC) forecasting (D13).
 * When ACWP > 0 and CPI is valid: EAC = BAC / CPI
 * When ACWP == 0 or CPI is undefined: EAC = ACWP + (BAC - BCWP)
 */
export function calculateEacForecasting(bac: number, bcwp: number, acwp: number, cpi?: number | null): number {
  if (acwp > 0 && cpi && cpi > 0) {
    return Number((bac / cpi).toFixed(2));
  }
  return Number((acwp + Math.max(0, bac - bcwp)).toFixed(2));
}

export interface AllocationProgressItem {
  allocated_qty: number;
  snapshot_rate_egp: number;
  is_suspended?: boolean;
  line_status?: string;
  inspection_status?: string;
}

/**
 * Pure function: Calculate earned value and percent complete for an activity.
 * Ignores suspended allocations and rejected inspection lines.
 */
export function calculateActivityProgress(
  allocations: AllocationProgressItem[],
  budgetedCostEgp: number
): {
  earnedEgp: number;
  percentComplete: number;
  isOverAchieved: boolean;
  rawRatio: number;
} {
  const earnedEgp = allocations
    .filter((a) => {
      if (a.is_suspended) return false;
      if (a.line_status && a.line_status !== 'approved') return false;
      if (a.inspection_status === 'rejected') return false;
      return a.allocated_qty > 0 && a.snapshot_rate_egp >= 0;
    })
    .reduce((sum, a) => sum + a.allocated_qty * a.snapshot_rate_egp, 0);

  if (budgetedCostEgp <= 0) {
    return {
      earnedEgp: Number(earnedEgp.toFixed(2)),
      percentComplete: 0,
      isOverAchieved: false,
      rawRatio: 0,
    };
  }

  const rawRatio = (earnedEgp / budgetedCostEgp) * 100;
  const percentComplete = Math.min(100, Math.max(0, rawRatio));

  return {
    earnedEgp: Number(earnedEgp.toFixed(2)),
    percentComplete: Number(percentComplete.toFixed(2)),
    isOverAchieved: rawRatio > 100,
    rawRatio: Number(rawRatio.toFixed(2)),
  };
}

/**
 * Pure function: Calculate overall project percent complete weighted by budgeted cost.
 */
export function calculateProjectProgress(
  activities: { budgeted_cost_egp: number; percent_complete: number }[]
): number {
  const totalBudget = activities.reduce((sum, a) => sum + Math.max(0, a.budgeted_cost_egp), 0);
  if (totalBudget <= 0) return 0;

  const weightedEarned = activities.reduce((sum, a) => {
    const budget = Math.max(0, a.budgeted_cost_egp);
    const pct = Math.min(100, Math.max(0, a.percent_complete));
    return sum + budget * (pct / 100);
  }, 0);

  return Number(((weightedEarned / totalBudget) * 100).toFixed(2));
}

/**
 * Pure function: Calculate required procurement quantity including standard wastage.
 * Formula: contractQty * consumptionRate * (1 + wastagePct / 100)
 */
export function calculateProcurementQty(
  contractQty: number,
  consumptionRate = 1.0,
  wastagePct = 0
): number {
  if (contractQty <= 0) return 0;
  const rate = Math.max(0, consumptionRate);
  const waste = Math.max(0, wastagePct);
  const total = contractQty * rate * (1 + waste / 100);
  return Number(total.toFixed(3));
}

/**
 * Pure function: Calculate material wastage loss in percentage and EGP value.
 */
export function calculateWastageLossEgp(
  issuedQty: number,
  installedNetQty: number,
  standardWastagePct: number,
  supplierUnitPriceEgp: number,
  options?: { treatZeroInstalledAsWriteOff?: boolean }
): {
  actualWastagePct: number;
  varianceWastagePct: number;
  isLoss: boolean;
  wastageLossEgp: number;
} {
  if (installedNetQty <= 0) {
    if (options?.treatZeroInstalledAsWriteOff && issuedQty > 0) {
      return {
        actualWastagePct: 100,
        varianceWastagePct: Number((100 - standardWastagePct).toFixed(2)),
        isLoss: true,
        wastageLossEgp: Number((issuedQty * Math.max(0, supplierUnitPriceEgp)).toFixed(2)),
      };
    }
    return {
      actualWastagePct: 0,
      varianceWastagePct: 0,
      isLoss: false,
      wastageLossEgp: 0,
    };
  }

  const actualWastagePct = ((issuedQty - installedNetQty) / installedNetQty) * 100;
  const varianceWastagePct = actualWastagePct - standardWastagePct;
  const isLoss = varianceWastagePct > 0;
  const wastageLossEgp = isLoss
    ? (varianceWastagePct / 100) * installedNetQty * Math.max(0, supplierUnitPriceEgp)
    : 0;

  return {
    actualWastagePct: Number(actualWastagePct.toFixed(2)),
    varianceWastagePct: Number(varianceWastagePct.toFixed(2)),
    isLoss,
    wastageLossEgp: Number(wastageLossEgp.toFixed(2)),
  };
}

/**
 * Count working days between two dates, excluding Friday (Egypt standard 6-day week).
 */
export function countWorkingDays(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;

  let count = 0;
  const cur = new Date(start);
  while (cur <= end) {
    if (cur.getUTCDay() !== 5) { // 5 = Friday in JavaScript Date (UTC-safe for YYYY-MM-DD)
      count++;
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}

/**
 * Pure function: Generate time-phased S-curve points (planned BCWS and actual BCWP).
 */
export function generateScurveData(
  activities: { planned_start: string; planned_finish: string; budgeted_cost_egp: number }[],
  allocations: { date: string; earned_egp: number }[],
  startDate: string,
  endDate: string
): ScurvePoint[] {
  const totalBudget = activities.reduce((sum, a) => sum + Math.max(0, a.budgeted_cost_egp), 0);
  if (totalBudget <= 0) return [];

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return [];

  // Group allocations by date
  const earnedByDate = new Map<string, number>();
  for (const alloc of allocations) {
    const curVal = earnedByDate.get(alloc.date) || 0;
    earnedByDate.set(alloc.date, curVal + alloc.earned_egp);
  }

  const points: ScurvePoint[] = [];
  const current = new Date(start);
  let cumulativeEarned = 0;

  while (current <= end) {
    const dateStr = current.toISOString().slice(0, 10);

    // 1. Calculate Planned Value (BCWS) up to current date
    let cumulativeBcws = 0;
    for (const act of activities) {
      const actStart = new Date(act.planned_start);
      const actEnd = new Date(act.planned_finish);
      const actBudget = Math.max(0, act.budgeted_cost_egp);

      if (current < actStart) {
        continue;
      } else if (current >= actEnd) {
        cumulativeBcws += actBudget;
      } else {
        const totalWorkDays = countWorkingDays(act.planned_start, act.planned_finish);
        const elapsedWorkDays = countWorkingDays(act.planned_start, dateStr);
        const ratio = totalWorkDays > 0 ? elapsedWorkDays / totalWorkDays : 0;
        cumulativeBcws += actBudget * Math.min(1, Math.max(0, ratio));
      }
    }

    // 2. Add any earned value for this date
    if (earnedByDate.has(dateStr)) {
      cumulativeEarned += earnedByDate.get(dateStr)!;
    }

    const plannedPct = Math.min(100, Math.max(0, (cumulativeBcws / totalBudget) * 100));
    const actualPct = Math.min(100, Math.max(0, (cumulativeEarned / totalBudget) * 100));

    points.push({
      date: dateStr,
      planned_pct: Number(plannedPct.toFixed(2)),
      actual_pct: Number(actualPct.toFixed(2)),
      earned_egp: Number(cumulativeEarned.toFixed(2)),
      planned_egp: Number(cumulativeBcws.toFixed(2)),
    });

    current.setDate(current.getDate() + 1);
  }

  return points;
}

/**
 * Pure function: Calculate subcontractor productivity metrics.
 * Computes achievement_pct = (actual_qty / target_qty) * 100, flags is_underperforming = achievement_pct < 70.
 */
export function calculateSubcontractorProductivity(
  targets: SubcontractorTarget[],
  lines: Partial<DailyProgressLine>[],
  manpower = 0
): SubcontractorProductivityMetric[] {
  return targets.map((target) => {
    const matchingLines = lines.filter((l) => {
      if (l.subcontractor_id !== target.subcontractor_id) return false;
      if (target.boq_item_id && l.boq_item_id !== target.boq_item_id) return false;
      if (l.line_status === 'rejected') return false;
      return true;
    });

    const actual_qty = matchingLines.reduce((sum, l) => sum + (Number(l.qty_today) || 0), 0);
    const target_qty = Math.max(0, target.target_qty);
    const achievement_pct = target_qty > 0 ? Number(((actual_qty / target_qty) * 100).toFixed(2)) : 0;
    const is_underperforming = achievement_pct < 70;

    return {
      subcontractor_id: target.subcontractor_id,
      boq_item_id: target.boq_item_id,
      target_qty: Number(target_qty.toFixed(2)),
      actual_qty: Number(actual_qty.toFixed(2)),
      achievement_pct,
      is_underperforming,
      manpower,
      unit: target.unit,
      period_start: target.period_start || target.target_date,
      period_end: target.period_end || target.target_date,
    };
  });
}

export interface EotObstructionSummary {
  totalObstructions: number;
  totalIdleManpower: number;
  byResponsibleParty: {
    responsible_party: string;
    count: number;
    total_idle_manpower: number;
    obstruction_types: ObstructionType[];
    items: DailyObstruction[];
  }[];
  byObstructionType: {
    obstruction_type: ObstructionType;
    count: number;
    total_idle_manpower: number;
  }[];
}

/**
 * Pure function: Calculate EOT Obstruction summary.
 * Aggregates delays by responsible party and total idle hours/manpower.
 */
export function calculateEotObstructionSummary(
  obstructions: DailyObstruction[]
): EotObstructionSummary {
  let totalIdleManpower = 0;
  const partyMap = new Map<
    string,
    {
      responsible_party: string;
      count: number;
      total_idle_manpower: number;
      obstruction_types: Set<ObstructionType>;
      items: DailyObstruction[];
    }
  >();

  const typeMap = new Map<
    ObstructionType,
    {
      obstruction_type: ObstructionType;
      count: number;
      total_idle_manpower: number;
    }
  >();

  for (const obs of obstructions) {
    const manpower = obs.idle_manpower || 0;
    totalIdleManpower += manpower;

    // By responsible party
    const partyKey = obs.responsible_party || 'other';
    if (!partyMap.has(partyKey)) {
      partyMap.set(partyKey, {
        responsible_party: partyKey,
        count: 0,
        total_idle_manpower: 0,
        obstruction_types: new Set<ObstructionType>(),
        items: [],
      });
    }
    const partyEntry = partyMap.get(partyKey)!;
    partyEntry.count += 1;
    partyEntry.total_idle_manpower += manpower;
    partyEntry.obstruction_types.add(obs.obstruction_type);
    partyEntry.items.push(obs);

    // By obstruction type
    const typeKey = obs.obstruction_type || 'other';
    if (!typeMap.has(typeKey)) {
      typeMap.set(typeKey, {
        obstruction_type: typeKey,
        count: 0,
        total_idle_manpower: 0,
      });
    }
    const typeEntry = typeMap.get(typeKey)!;
    typeEntry.count += 1;
    typeEntry.total_idle_manpower += manpower;
  }

  return {
    totalObstructions: obstructions.length,
    totalIdleManpower,
    byResponsibleParty: Array.from(partyMap.values()).map((p) => ({
      ...p,
      obstruction_types: Array.from(p.obstruction_types),
    })),
    byObstructionType: Array.from(typeMap.values()),
  };
}

/**
 * Pure function: Identify deliverable bottlenecks.
 * Identifies deliverables blocked > 7 days or overdue RFIs / blocked items.
 */
export function calculateDeliverableBottlenecks(deliverables: Deliverable[]): Deliverable[] {
  const now = Date.now();
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  return deliverables.filter((d) => {
    if (d.status === 'blocked') {
      return true;
    }

    if (d.blocked_since) {
      const blockedMs = now - new Date(d.blocked_since).getTime();
      if (blockedMs >= SEVEN_DAYS_MS) {
        return true;
      }
    }

    if (d.items && d.items.length > 0) {
      const hasBlockedItem = d.items.some(
        (item) => item.status === 'blocked' || item.consultant_status === 'C'
      );
      if (hasBlockedItem) {
        return true;
      }
    }

    if (d.due_date && d.status !== 'returned' && d.status !== 'ready_to_return') {
      const dueMs = new Date(d.due_date).getTime();
      if (!isNaN(dueMs) && dueMs < now) {
        return true;
      }
    }

    return false;
  });
}

/**
 * Pure function: Calculate Morning Command Center summary.
 * Computes silent sites with no report yesterday, active critical holds, blocked deliverables count,
 * overdue RFIs, underperforming subcontractors.
 */
export function calculateMorningCommandCenter(params: {
  projects: any[];
  reports: Partial<DailyProgress>[];
  holds: PmHold[];
  deliverables: Deliverable[];
  rfis: RfiRegisterItem[];
  subMetrics: SubcontractorProductivityMetric[];
  targetDate?: string;
}): MorningCommandCenterSummary {
  const targetDate = params.targetDate || new Date().toISOString().slice(0, 10);
  const curDate = new Date(targetDate);
  const yesterdayDate = new Date(curDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  // 1. Silent sites
  const silentSites: { project_id: string; project_name: string; last_report_date?: string }[] = [];

  for (const project of params.projects) {
    const projReports = params.reports.filter((r) => r.project_id === project.id);
    const hasRecentReport = projReports.some(
      (r) => r.progress_date === yesterdayStr || r.progress_date === targetDate
    );

    if (!hasRecentReport) {
      const sortedReports = [...projReports].sort((a, b) =>
        (b.progress_date || '').localeCompare(a.progress_date || '')
      );
      const lastReportDate = sortedReports[0]?.progress_date;
      silentSites.push({
        project_id: project.id,
        project_name: project.project_name || project.project_name_ar || project.project_code || project.id,
        last_report_date: lastReportDate,
      });
    }
  }

  // 2. Active critical holds
  const activeCriticalHolds = params.holds.filter((h) => h.is_active);

  // 3. Blocked deliverables
  const blockedDeliverables = params.deliverables.filter(
    (d) => d.status === 'blocked' || d.items?.some((i) => i.status === 'blocked')
  );

  // 4. Overdue RFIs
  const overdueRfis = params.rfis.filter((r) => {
    if (r.status === 'overdue') return true;
    if (
      r.target_reply_date &&
      r.target_reply_date < targetDate &&
      r.status !== 'answered' &&
      r.status !== 'closed'
    ) {
      return true;
    }
    return false;
  });

  // 5. Underperforming subcontractors
  const underperformingSubs = params.subMetrics.filter((m) => m.is_underperforming);

  // Active projects count
  const totalActiveProjects = params.projects.filter(
    (p) => p.status === 'working' || p.status === 'tender' || !p.status || p.status !== 'finished'
  ).length;

  return {
    date: targetDate,
    silent_sites_count: silentSites.length,
    silent_sites: silentSites,
    active_critical_holds_count: activeCriticalHolds.length,
    active_critical_holds: activeCriticalHolds,
    blocked_deliverables_count: blockedDeliverables.length,
    blocked_deliverables: blockedDeliverables,
    overdue_rfis_count: overdueRfis.length,
    overdue_rfis: overdueRfis,
    underperforming_subcontractors_count: underperformingSubs.length,
    underperforming_subcontractors: underperformingSubs,
    total_active_projects: totalActiveProjects,
  };
}

export interface IpcDeductionParams {
  grossAmount: number;
  retentionPct: number;
  advanceRecoveryPct: number;
  totalAdvancePaid: number;
  cumulativeAdvanceRecoveredBefore: number;
  contractValue: number;
  retentionCapPct?: number;
  cumulativeRetentionWithheldBefore: number;
  otherDeductions?: number;
  clampNegativeNet?: boolean;
}

export interface IpcDeductionCalculationResult {
  grossAmount: number;
  retentionDeduction: number;
  advanceRecoveryDeduction: number;
  otherDeductions: number;
  totalDeductions: number;
  netPayable: number;
  cumulativeAdvanceRecoveredAfter: number;
  remainingAdvanceToRecover: number;
  isAdvanceFullyRecovered: boolean;
  cumulativeRetentionWithheldAfter: number;
  remainingRetentionCapacity: number;
  isRetentionCapped: boolean;
}

/**
 * Pure function: Calculate contractual IPC deductions (FIDIC Cl. 14.2 / 14.3 / 14.9).
 * Enforces cumulative retention cap (% of Contract Price) and remaining advance recovery cap.
 */
export function calculateContractualIpc(
  params: IpcDeductionParams
): IpcDeductionCalculationResult {
  const gross = Math.max(0, Number(params.grossAmount) || 0);
  const retPct = Math.max(0, Number(params.retentionPct) || 0);
  const advPct = Math.max(0, Number(params.advanceRecoveryPct) || 0);
  const totalAdv = Math.max(0, Number(params.totalAdvancePaid) || 0);
  const advRecoveredBefore = Math.max(0, Number(params.cumulativeAdvanceRecoveredBefore) || 0);
  const contractVal = Math.max(0, Number(params.contractValue) || 0);
  const retentionCapPct = Math.max(0, Number(params.retentionCapPct ?? 10));
  const retWithheldBefore = Math.max(0, Number(params.cumulativeRetentionWithheldBefore) || 0);
  const otherDed = Math.max(0, Number(params.otherDeductions ?? 0) || 0);

  // 1. FIDIC Cl. 14.3 / 14.9 Retention Cap
  const maxRetentionAllowed = (contractVal * retentionCapPct) / 100;
  const remainingRetentionBefore = Math.max(0, maxRetentionAllowed - retWithheldBefore);
  const uncappedRetention = (gross * retPct) / 100;
  const retentionDeduction = Number(Math.min(uncappedRetention, remainingRetentionBefore).toFixed(2));
  const cumulativeRetentionWithheldAfter = Number((retWithheldBefore + retentionDeduction).toFixed(2));
  const remainingRetentionCapacity = Number(
    Math.max(0, maxRetentionAllowed - cumulativeRetentionWithheldAfter).toFixed(2)
  );
  const isRetentionCapped =
    uncappedRetention > remainingRetentionBefore ||
    (maxRetentionAllowed > 0 && remainingRetentionCapacity <= 0);

  // 2. FIDIC Cl. 14.2 Advance Payment Recovery Cap
  const remainingAdvanceBefore = totalAdv > 0 ? Math.max(0, totalAdv - advRecoveredBefore) : 0;
  const uncappedAdvance = totalAdv > 0 ? (gross * advPct) / 100 : 0;
  const advanceRecoveryDeduction = Number(Math.min(uncappedAdvance, remainingAdvanceBefore).toFixed(2));
  const cumulativeAdvanceRecoveredAfter = Number((advRecoveredBefore + advanceRecoveryDeduction).toFixed(2));
  const remainingAdvanceToRecover = Number(
    (totalAdv > 0 ? Math.max(0, totalAdv - cumulativeAdvanceRecoveredAfter) : 0).toFixed(2)
  );
  const isAdvanceFullyRecovered = totalAdv > 0 && remainingAdvanceToRecover <= 0;

  // 3. Totals & Net Payable
  const grossAmount = Number(gross.toFixed(2));
  const otherDeductions = Number(otherDed.toFixed(2));
  const totalDeductions = Number((retentionDeduction + advanceRecoveryDeduction + otherDeductions).toFixed(2));
  const rawNetPayable = grossAmount - totalDeductions;
  const netPayable = Number(
    (params.clampNegativeNet === false ? rawNetPayable : Math.max(0, rawNetPayable)).toFixed(2)
  );

  return {
    grossAmount,
    retentionDeduction,
    advanceRecoveryDeduction,
    otherDeductions,
    totalDeductions,
    netPayable,
    cumulativeAdvanceRecoveredAfter,
    remainingAdvanceToRecover,
    isAdvanceFullyRecovered,
    cumulativeRetentionWithheldAfter,
    remainingRetentionCapacity,
    isRetentionCapped,
  };
}
