import { Project } from '@/types';

export type BondCalcType = 'manual' | 'percentage_base' | 'percentage_total';
export type RetentionType = 'cash_deduction' | 'retention_bond' | 'none';

export interface PerformanceBondData {
  has_bond: boolean;
  bond_number?: string;
  issuing_bank?: string;
  calc_type: BondCalcType;
  percentage?: number; // e.g. 5%
  manual_value?: number;
  calculated_value: number;
  issue_date?: string;
  expiry_date?: string;
  release_days: number;
  released: boolean;
  released_at?: string;
}

export interface RetentionTermsData {
  type: RetentionType;
  calc_base: 'base' | 'total';
  rate_pct: number;
  manual_amount?: number;
  calculated_total: number;
  toc_release_pct: number;
  toc_release_amount: number;
  dlp_release_amount: number;
  release_days: number;
  bond_number?: string;
  issuing_bank?: string;
  tranche_1_released: boolean;
  tranche_2_released: boolean;
}

export interface ProjectRetentionBondMetrics {
  project: Project;
  hasToc: boolean;
  tocReference?: string;
  handoverDateStr: string | null;
  handoverDate: Date | null;
  contractBaseValue: number;
  vosValue: number;
  totalContractValue: number;

  // Retention money details
  retentionType: RetentionType;
  retentionCalcBase: 'base' | 'total';
  retentionRatePct: number;
  totalRetentionAmount: number;
  tocReleasePct: number; // User-defined or default 50%
  tranche1Amount: number; // TOC release amount
  tranche2Amount: number; // Final handover / DLP balance amount
  tranche1Released: boolean;
  tranche2Released: boolean;
  retentionBondNumber?: string;
  retentionBondBank?: string;

  // Performance Bond details
  hasPerformanceBond: boolean;
  performanceBondNumber?: string;
  performanceBondBank?: string;
  performanceBondCalcType: BondCalcType;
  performanceBondPct: number;
  performanceBondManualValue?: number;
  performanceBondAmount: number;
  performanceBondReleased: boolean;
  performanceBondIssueDate?: string;
  performanceBondExpiryDate?: string;
  
  // Contractual tracking for return after handover
  retentionContractualDays: number; // عدد الأيام لاسترداد المبالغ المستقطعة بعد التسليم الابتدائي طبقا للعقد
  bondContractualDays: number; // عدد الأيام لاسترداد خطاب الضمان بعد التسليم الابتدائي طبقا للعقد
  
  retentionDueDate: Date | null;
  retentionDueDateStr: string | null;
  bondDueDate: Date | null;
  bondDueDateStr: string | null;
  
  isRetentionEligible: boolean; // Has TOC and status is handing_over or finished
  isRetentionOverdue: boolean; // Overdue past contractual days and not released
  retentionOverdueDays: number;
  retentionRemainingDays: number;
  
  isBondOverdue: boolean; // Performance bond return past contractual days and not released
  bondOverdueDays: number;
  bondRemainingDays: number;
  
  isMissedBondOrRetention: boolean;
}

/**
 * Checks whether a project has a valid Taking-Over Certificate (TOC)
 */
export function hasTocCertificate(project: Project): boolean {
  if (project.metadata?.handover_checklist?.toc_received === true) {
    return true;
  }
  if (project.metadata?.handover_checklist?.toc_received === false) {
    return false;
  }
  const toc = project.toc_letter?.trim();
  if (!toc) return false;
  const invalidValues = ['غير متاح', 'غير موجود', 'none', 'null', 'undefined', 'لا يوجد'];
  if (invalidValues.includes(toc.toLowerCase())) return false;
  if (toc.toLowerCase().includes('pending toc')) return false;
  if (toc.includes('قيد استيفاء')) return false;
  return true;
}

/**
 * Resolves the baseline handover date (TOC date / actual finish / planned finish)
 */
export function getHandoverDate(project: Project): Date | null {
  const dateCandidates = [
    project.metadata?.handover_checklist?.handover_at,
    project.metadata?.handover_checklist?.dlp_start_date,
    project.actual_finish_date,
    (project as any).finish_date,
    project.planned_finish_date,
    project.updated_at,
  ];

  for (const dateStr of dateCandidates) {
    if (dateStr && typeof dateStr === 'string') {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d;
      }
    }
  }

  return null;
}

/**
 * Parses numeric currency/numbers safely
 */
export function parseNumber(val: unknown, fallback: number = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const n = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(n) ? fallback : n;
}

/**
 * Computes all retention money, TOC, and bond metrics for a single project
 */
export function computeProjectRetentionBondMetrics(
  project: Project,
  now: Date = new Date()
): ProjectRetentionBondMetrics {
  const hasToc = hasTocCertificate(project);
  const tocReference = project.metadata?.handover_checklist?.toc_reference || project.toc_letter || undefined;

  const contractBase = parseNumber(project.contract_value_egp || project.contract_value);
  const vosValue = parseNumber(project.vos_value);
  const totalContractValue = parseNumber(project.total_contract_value) || (contractBase + vosValue);

  // --- Performance Bond (خطاب ضمان حسن التنفيذ) ---
  const pbMeta = (project.metadata as any)?.performance_bond;
  const legacyPbPct = parseNumber((project as any).performance_bond_pct ?? project.metadata?.performance_bond_pct, 0);

  const hasPerformanceBond = pbMeta?.has_bond !== undefined
    ? Boolean(pbMeta.has_bond)
    : (project.metadata?.has_performance_bond !== undefined
        ? Boolean(project.metadata.has_performance_bond)
        : legacyPbPct > 0);

  const performanceBondNumber = pbMeta?.bond_number || project.metadata?.performance_bond_number || '';
  const performanceBondBank = pbMeta?.issuing_bank || project.metadata?.performance_bond_bank || '';
  const performanceBondCalcType: BondCalcType = pbMeta?.calc_type || (project.metadata as any)?.performance_bond_calc_type || 'percentage_base';
  
  const performanceBondPct = parseNumber(
    pbMeta?.percentage ?? project.metadata?.performance_bond_pct ?? (project as any).performance_bond_pct,
    5
  );
  const performanceBondManualValue = parseNumber(
    pbMeta?.manual_value ?? (project.metadata as any)?.performance_bond_manual_value,
    0
  );

  let performanceBondAmount = 0;
  if (hasPerformanceBond) {
    if (performanceBondCalcType === 'manual' && performanceBondManualValue > 0) {
      performanceBondAmount = performanceBondManualValue;
    } else if (performanceBondCalcType === 'percentage_total') {
      performanceBondAmount = Math.round(totalContractValue * (performanceBondPct / 100));
    } else {
      // default: percentage_base (بدون أوامر التغيير VOs)
      performanceBondAmount = Math.round(contractBase * (performanceBondPct / 100));
    }
  }

  // --- Retention Money (محجوز الضمان) ---
  const retMeta = (project.metadata as any)?.retention_terms;
  const retentionType: RetentionType = retMeta?.type || (project.metadata as any)?.retention_type || 'cash_deduction';
  const retentionCalcBase: 'base' | 'total' = retMeta?.calc_base || (project.metadata as any)?.retention_calc_base || 'total';
  
  const retentionRatePct = parseNumber(
    retMeta?.rate_pct ?? project.metadata?.retention_pct ?? project.metadata?.retention_rate_pct ?? (project as any).retention_pct,
    retentionType === 'none' ? 0 : 5
  );

  const retentionBaseValue = retentionCalcBase === 'base' ? contractBase : totalContractValue;
  const totalRetentionAmount = retentionType === 'none'
    ? 0
    : (retMeta?.manual_amount && retMeta.manual_amount > 0
        ? retMeta.manual_amount
        : Math.round(retentionBaseValue * (retentionRatePct / 100)));

  // Custom TOC Release %: instead of assuming 50%, read explicitly, default to 50% only if unspecified
  const tocReleasePct = Math.min(100, Math.max(0, parseNumber(
    retMeta?.toc_release_pct ?? (project.metadata as any)?.retention_toc_release_pct,
    50
  )));

  const tranche1Amount = Math.round(totalRetentionAmount * (tocReleasePct / 100));
  const tranche2Amount = Math.max(0, totalRetentionAmount - tranche1Amount);

  // Release status flags
  const tranche1Released = Boolean(project.metadata?.retention_tranche_1_released || retMeta?.tranche_1_released);
  const tranche2Released = Boolean(project.metadata?.retention_tranche_2_released || retMeta?.tranche_2_released);
  const performanceBondReleased = Boolean(project.metadata?.performance_bond_released || pbMeta?.released);

  // Contractual days to return retention & bond after initial handover
  const retentionContractualDays = Math.max(
    0,
    parseNumber(retMeta?.release_days ?? project.metadata?.retention_release_days, 30)
  );
  const bondContractualDays = Math.max(
    0,
    parseNumber(pbMeta?.release_days ?? project.metadata?.performance_bond_release_days, 30)
  );

  const handoverDate = getHandoverDate(project);
  const handoverDateStr = handoverDate ? handoverDate.toISOString().split('T')[0] : null;

  let retentionDueDate: Date | null = null;
  let retentionDueDateStr: string | null = null;
  let bondDueDate: Date | null = null;
  let bondDueDateStr: string | null = null;

  let isRetentionOverdue = false;
  let retentionOverdueDays = 0;
  let retentionRemainingDays = 0;

  let isBondOverdue = false;
  let bondOverdueDays = 0;
  let bondRemainingDays = 0;

  const isHandingOverOrFinished = project.status === 'finished' || project.status === 'handing_over';
  const isRetentionEligible = isHandingOverOrFinished && hasToc;

  if (handoverDate) {
    // Retention Tranche 1 Due Date
    retentionDueDate = new Date(handoverDate.getTime() + retentionContractualDays * 86400000);
    retentionDueDateStr = retentionDueDate.toISOString().split('T')[0];

    // Performance Bond Due Date
    bondDueDate = new Date(handoverDate.getTime() + bondContractualDays * 86400000);
    bondDueDateStr = bondDueDate.toISOString().split('T')[0];

    const nowTime = now.getTime();

    // Retention overdue calculation (only if retention is applicable, not already released, and project is finished/handing over)
    if (isHandingOverOrFinished && retentionType !== 'none' && !tranche1Released) {
      if (nowTime > retentionDueDate.getTime()) {
        isRetentionOverdue = true;
        retentionOverdueDays = Math.max(
          1,
          Math.floor((nowTime - retentionDueDate.getTime()) / 86400000)
        );
      } else {
        retentionRemainingDays = Math.max(
          0,
          Math.ceil((retentionDueDate.getTime() - nowTime) / 86400000)
        );
      }
    }

    // Performance Bond overdue calculation (only if project actually has a performance bond and not already released)
    if (isHandingOverOrFinished && hasPerformanceBond && !performanceBondReleased) {
      if (nowTime > bondDueDate.getTime()) {
        isBondOverdue = true;
        bondOverdueDays = Math.max(
          1,
          Math.floor((nowTime - bondDueDate.getTime()) / 86400000)
        );
      } else {
        bondRemainingDays = Math.max(
          0,
          Math.ceil((bondDueDate.getTime() - nowTime) / 86400000)
        );
      }
    }
  } else if (isHandingOverOrFinished) {
    // If finished without date, treat as needing attention
    if (!tranche1Released) isRetentionOverdue = false;
    if (!performanceBondReleased) isBondOverdue = false;
  }

  const isMissedBondOrRetention = isRetentionOverdue || isBondOverdue;

  return {
    project,
    hasToc,
    tocReference,
    handoverDateStr,
    handoverDate,
    contractBaseValue: contractBase,
    vosValue,
    totalContractValue,

    // Retention money details
    retentionType,
    retentionCalcBase,
    retentionRatePct,
    totalRetentionAmount,
    tocReleasePct,
    tranche1Amount,
    tranche2Amount,
    tranche1Released,
    tranche2Released,
    retentionBondNumber: retMeta?.bond_number,
    retentionBondBank: retMeta?.issuing_bank,

    // Performance Bond details
    hasPerformanceBond,
    performanceBondNumber,
    performanceBondBank,
    performanceBondCalcType,
    performanceBondPct,
    performanceBondManualValue,
    performanceBondAmount,
    performanceBondReleased,
    performanceBondIssueDate: pbMeta?.issue_date,
    performanceBondExpiryDate: pbMeta?.expiry_date,

    retentionContractualDays,
    bondContractualDays,
    retentionDueDate,
    retentionDueDateStr,
    bondDueDate,
    bondDueDateStr,
    isRetentionEligible,
    isRetentionOverdue,
    retentionOverdueDays,
    retentionRemainingDays,
    isBondOverdue,
    bondOverdueDays,
    bondRemainingDays,
    isMissedBondOrRetention,
  };
}

/**
 * Aggregates portfolio-wide retention and bond tracking KPIs
 */
export function aggregateRetentionBondPortfolio(projects: Project[], now: Date = new Date()) {
  const finishedOrHandover = projects.filter(
    (p) => p.status === 'finished' || p.status === 'handing_over'
  );

  const metricsList = finishedOrHandover.map((p) => computeProjectRetentionBondMetrics(p, now));

  const totalFinishedProjects = projects.filter((p) => p.status === 'finished').length;
  const totalHandingOverProjects = projects.filter((p) => p.status === 'handing_over').length;

  const finishedWithoutTocCount = projects.filter(
    (p) => p.status === 'finished' && !hasTocCertificate(p)
  ).length;

  const finishedWithTocCount = projects.filter(
    (p) => p.status === 'finished' && hasTocCertificate(p)
  ).length;

  const handingOverWithoutTocCount = projects.filter(
    (p) => p.status === 'handing_over' && !hasTocCertificate(p)
  ).length;

  const totalWithheldRetention = metricsList.reduce(
    (sum, m) => sum + m.totalRetentionAmount,
    0
  );

  const totalReleasedRetention = metricsList.reduce(
    (sum, m) =>
      sum +
      (m.tranche1Released ? m.tranche1Amount : 0) +
      (m.tranche2Released ? m.tranche2Amount : 0),
    0
  );

  const totalPendingRetention = Math.max(0, totalWithheldRetention - totalReleasedRetention);

  const missedRetentionProjects = metricsList.filter((m) => m.isRetentionOverdue);
  const missedBondProjects = metricsList.filter((m) => m.isBondOverdue);
  const missedAnyProjects = metricsList.filter((m) => m.isMissedBondOrRetention);

  const totalMissedRetentionValue = missedRetentionProjects.reduce(
    (sum, m) => sum + (m.tranche1Released ? 0 : m.tranche1Amount),
    0
  );

  const totalMissedBondValue = missedBondProjects.reduce(
    (sum, m) => sum + (m.performanceBondReleased ? 0 : m.performanceBondAmount),
    0
  );

  return {
    metricsList,
    totalTrackedProjects: finishedOrHandover.length,
    totalFinishedProjects,
    totalHandingOverProjects,
    finishedWithoutTocCount,
    finishedWithTocCount,
    handingOverWithoutTocCount,
    totalWithheldRetention,
    totalReleasedRetention,
    totalPendingRetention,
    missedRetentionCount: missedRetentionProjects.length,
    missedRetentionValue: totalMissedRetentionValue,
    missedBondCount: missedBondProjects.length,
    missedBondValue: totalMissedBondValue,
    missedAnyCount: missedAnyProjects.length,
  };
}
