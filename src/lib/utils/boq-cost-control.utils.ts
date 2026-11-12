import { Project, VariationOrderItem } from '@/types';
import { BoqItem } from '@/types/boq';

export interface BoqCostControlMetrics {
  original_qty: number;
  original_rate: number;
  original_amount: number;
  vo_qty: number;
  vo_rate: number;
  vo_amount: number;
  revised_qty: number;
  revised_rate: number;
  revised_amount: number;
  variance_amount: number;
  variance_pct: number;
  has_vo_impact: boolean;
  pricing_status: string;
  vo_ref?: string;
}

export interface BoqContractReconciliationReport {
  contract_original_value: number;
  vos_net_value: number;
  revised_contract_value: number;
  boq_original_total: number;
  boq_revised_total: number;
  variance: number;
  is_matched: boolean;
  status: 'matched' | 'boq_exceeds' | 'boq_deficient';
  alert_message_ar: string;
  alert_message_en: string;
  items_count: number;
  vo_items_count: number;
}

/**
 * Extracts structured cost control data optionally stored in notes JSON/text.
 */
export function extractCostControlFromNotes(notes?: string | null): {
  vo_qty?: number;
  revised_rate?: number;
  user_note?: string;
} {
  if (!notes || typeof notes !== 'string') return {};
  const trimmed = notes.trim();
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        return {
          vo_qty: typeof parsed.vo_qty === 'number' ? parsed.vo_qty : undefined,
          revised_rate: typeof parsed.revised_rate === 'number' ? parsed.revised_rate : undefined,
          user_note: typeof parsed.user_note === 'string' ? parsed.user_note : undefined,
        };
      }
    } catch {
      // not json, return raw text
    }
  }
  return { user_note: notes };
}

/**
 * Serializes cost control overrides into notes format while preserving human readable remarks.
 */
export function packCostControlIntoNotes(
  currentNotes: string | null | undefined,
  overrides: { vo_qty?: number | null; revised_rate?: number | null; user_note?: string | null }
): string {
  const existing = extractCostControlFromNotes(currentNotes);
  const userNote = overrides.user_note !== undefined ? overrides.user_note : existing.user_note;
  const voQty = overrides.vo_qty !== undefined ? overrides.vo_qty : existing.vo_qty;
  const revisedRate = overrides.revised_rate !== undefined ? overrides.revised_rate : existing.revised_rate;

  if (voQty !== undefined || revisedRate !== undefined) {
    return JSON.stringify({
      vo_qty: voQty ?? null,
      revised_rate: revisedRate ?? null,
      user_note: userNote?.trim() || null,
    });
  }

  return userNote?.trim() || '';
}

/**
 * Computes individual item Cost Control Metrics (Original vs VO Impact vs Revised Contract).
 */
export function computeItemCostControlMetrics(item: BoqItem): BoqCostControlMetrics {
  const parsedNotes = extractCostControlFromNotes(item.notes);

  const rawContractQty = Number(item.contract_qty ?? 0);
  const rawRateEgp = Number(item.rate_egp ?? 0);
  const rawAmountEgp = Number(item.amount_egp ?? (rawContractQty * rawRateEgp));

  const isVoApproved = item.pricing_status === 'vo_approved';

  // Determine VO Quantity:
  // 1. Explicit item.vo_qty
  // 2. Notes JSON override
  // 3. If item is pure VO addition (isVoApproved and contract_qty > 0)
  let originalQty = rawContractQty;
  let originalRate = rawRateEgp;
  let originalAmount = rawAmountEgp;

  // Determine VO Quantity:
  // 1. Explicit item.vo_qty
  // 2. Notes JSON override
  // 3. If item is pure VO addition (isVoApproved and no separate split)
  let voQty = 0;
  if (item.vo_qty !== undefined && item.vo_qty !== null) {
    voQty = Number(item.vo_qty);
  } else if (parsedNotes.vo_qty !== undefined) {
    voQty = Number(parsedNotes.vo_qty);
  } else if (isVoApproved) {
    voQty = rawContractQty;
    originalQty = 0;
    originalAmount = 0;
  }

  // Revised Rate
  let revisedRate = rawRateEgp;
  if (item.revised_rate_egp !== undefined && item.revised_rate_egp !== null) {
    revisedRate = Number(item.revised_rate_egp);
  } else if (parsedNotes.revised_rate !== undefined) {
    revisedRate = Number(parsedNotes.revised_rate);
  } else if (item.vo_rate_egp !== undefined && item.vo_rate_egp !== null && isVoApproved) {
    revisedRate = Number(item.vo_rate_egp);
  }

  // Revised Quantity
  let revisedQty = originalQty + voQty;
  if (item.revised_qty !== undefined && item.revised_qty !== null) {
    revisedQty = Number(item.revised_qty);
  }

  // VO Amount Impact
  let voAmount = 0;
  if (item.vo_amount_egp !== undefined && item.vo_amount_egp !== null) {
    voAmount = Number(item.vo_amount_egp);
  } else {
    voAmount = Number((voQty * revisedRate).toFixed(2));
  }

  // Revised Total Amount
  let revisedAmount = originalAmount + voAmount;
  if (item.revised_amount_egp !== undefined && item.revised_amount_egp !== null) {
    revisedAmount = Number(item.revised_amount_egp);
  } else {
    revisedAmount = Number((revisedQty * revisedRate).toFixed(2));
  }

  // Variance calculation
  const varianceAmount = Number((revisedAmount - originalAmount).toFixed(2));
  const variancePct = originalAmount > 0 
    ? Number(((varianceAmount / originalAmount) * 100).toFixed(2)) 
    : (revisedAmount > 0 ? 100 : 0);
  const hasVoImpact = Math.abs(voQty) > 0 || Math.abs(varianceAmount) > 0 || isVoApproved || Boolean(item.vo_ref);

  return {
    original_qty: originalQty,
    original_rate: originalRate,
    original_amount: originalAmount,
    vo_qty: voQty,
    vo_rate: revisedRate,
    vo_amount: voAmount,
    revised_qty: revisedQty,
    revised_rate: revisedRate,
    revised_amount: revisedAmount,
    variance_amount: varianceAmount,
    variance_pct: variancePct,
    has_vo_impact: hasVoImpact,
    pricing_status: item.pricing_status,
    vo_ref: item.vo_ref || undefined,
  };
}

/**
 * Reconciles the active project's BOQ items with the total contractual value and approved VOs.
 */
export function reconcileProjectBoqWithContract(
  project: Project | null | undefined,
  boqItems: BoqItem[]
): BoqContractReconciliationReport {
  if (!project) {
    return {
      contract_original_value: 0,
      vos_net_value: 0,
      revised_contract_value: 0,
      boq_original_total: 0,
      boq_revised_total: 0,
      variance: 0,
      is_matched: true,
      status: 'matched',
      alert_message_ar: 'لا توجد بيانات مشروع محددة للمطابقة التعاقدية.',
      alert_message_en: 'No project selected for contractual reconciliation.',
      items_count: 0,
      vo_items_count: 0,
    };
  }

  const contractOriginal = Number(project.contract_value ?? project.contract_value_egp ?? 0);
  const vosNet = Number(project.vos_value ?? 0);
  const revisedContractValue = Number(
    project.total_contract_value ?? (contractOriginal + vosNet)
  );

  // Exclude omitted items from active contractual sum
  const activeItems = (boqItems || []).filter((it) => it.inclusion_status !== 'omitted');

  let boqOriginalTotal = 0;
  let boqRevisedTotal = 0;
  let voItemsCount = 0;

  activeItems.forEach((it) => {
    const metrics = computeItemCostControlMetrics(it);
    boqOriginalTotal += metrics.original_amount;
    boqRevisedTotal += metrics.revised_amount;
    if (metrics.has_vo_impact) {
      voItemsCount++;
    }
  });

  boqOriginalTotal = Number(boqOriginalTotal.toFixed(2));
  boqRevisedTotal = Number(boqRevisedTotal.toFixed(2));

  const variance = Number((boqRevisedTotal - revisedContractValue).toFixed(2));
  const isMatched = Math.abs(variance) < 1;

  let status: 'matched' | 'boq_exceeds' | 'boq_deficient' = 'matched';
  if (variance > 1) {
    status = 'boq_exceeds';
  } else if (variance < -1) {
    status = 'boq_deficient';
  }

  const fmtCurrency = (n: number) =>
    Number(Math.abs(n)).toLocaleString('ar-EG', { maximumFractionDigits: 0 }) + ' ج.م';

  let alertMessageAr = '';
  let alertMessageEn = '';

  if (isMatched) {
    alertMessageAr = `المقايسة التعاقدية متطابقة بالكامل مع القيمة الختامية للعقد (${fmtCurrency(revisedContractValue)}).`;
    alertMessageEn = `BOQ is fully reconciled with the final revised contract value.`;
  } else if (status === 'boq_exceeds') {
    alertMessageAr = `تنبيه تحكم التكاليف: إجمالي المقايسة (${fmtCurrency(boqRevisedTotal)}) يتجاوز القيمة التعاقدية المعتمدة (${fmtCurrency(revisedContractValue)}) بزيادة قدرها ${fmtCurrency(variance)}. يلزم مراجعة بنود المقايسة وتعديل الكميات/الأسعار.`;
    alertMessageEn = `Cost Control Alert: Current BOQ total exceeds approved contract value by ${Math.abs(variance).toLocaleString()} EGP.`;
  } else {
    alertMessageAr = `تنبيه تحكم التكاليف: إجمالي المقايسة (${fmtCurrency(boqRevisedTotal)}) يقل عن القيمة التعاقدية المعتمدة (${fmtCurrency(revisedContractValue)}) بعجز قدره ${fmtCurrency(variance)}. يرجى إدراج أوامر التغيير أو توفيق بنود المقايسة.`;
    alertMessageEn = `Cost Control Alert: Current BOQ total is lower than approved contract value by ${Math.abs(variance).toLocaleString()} EGP.`;
  }

  return {
    contract_original_value: contractOriginal,
    vos_net_value: vosNet,
    revised_contract_value: revisedContractValue,
    boq_original_total: boqOriginalTotal,
    boq_revised_total: boqRevisedTotal,
    variance,
    is_matched: isMatched,
    status,
    alert_message_ar: alertMessageAr,
    alert_message_en: alertMessageEn,
    items_count: activeItems.length,
    vo_items_count: voItemsCount,
  };
}
