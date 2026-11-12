import type { BoqInclusionStatus, BoqItem, BoqSection } from '@/types/boq';

/** Axiom: contract total counts only base + added optional items. */
export const COUNTED_STATUSES: ReadonlySet<BoqInclusionStatus> = new Set(['base', 'optional_added']);

export const INCLUSION_META: Record<BoqInclusionStatus, { ar: string; en: string; badge: string }> = {
  base: { ar: 'أساسي', en: 'Base', badge: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' },
  optional_pending: { ar: 'اختياري', en: 'Optional', badge: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
  optional_added: { ar: 'اختياري مُضاف', en: 'Added', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' },
  omitted: { ar: 'محذوف (Omit)', en: 'Omitted', badge: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800' },
};

export function inclusionOf(item: Pick<BoqItem, 'inclusion_status'>): BoqInclusionStatus {
  return item.inclusion_status ?? 'base';
}

export function itemAmount(item: Pick<BoqItem, 'amount_egp' | 'contract_qty' | 'rate_egp'>): number {
  const a = Number(item.amount_egp);
  if (Number.isFinite(a) && item.amount_egp !== null && item.amount_egp !== undefined) return a;
  return (Number(item.contract_qty) || 0) * (Number(item.rate_egp) || 0);
}

export interface BoqTotals {
  base: number;
  optionalAdded: number;
  optionalPending: number;
  omitted: number;
  /** base + optionalAdded */
  contract: number;
  counts: Record<BoqInclusionStatus, number>;
}

export function computeBoqTotals(items: BoqItem[]): BoqTotals {
  const t: BoqTotals = {
    base: 0, optionalAdded: 0, optionalPending: 0, omitted: 0, contract: 0,
    counts: { base: 0, optional_pending: 0, optional_added: 0, omitted: 0 },
  };
  for (const it of items) {
    const s = inclusionOf(it);
    const amt = itemAmount(it);
    t.counts[s] += 1;
    if (s === 'base') t.base += amt;
    else if (s === 'optional_added') t.optionalAdded += amt;
    else if (s === 'optional_pending') t.optionalPending += amt;
    else t.omitted += amt;
  }
  t.contract = t.base + t.optionalAdded;
  return t;
}

/** Allowed state machine. Omit requires reason (enforced by caller/UI). */
export function canTransition(from: BoqInclusionStatus, to: BoqInclusionStatus): boolean {
  if (from === to) return false;
  const map: Record<BoqInclusionStatus, BoqInclusionStatus[]> = {
    base: ['omitted'],
    optional_pending: ['optional_added', 'omitted'],
    optional_added: ['optional_pending', 'omitted'],
    omitted: ['base', 'optional_pending', 'optional_added'],
  };
  return map[from].includes(to);
}

export const UNASSIGNED_PAGE_ID = '__unassigned__';

export interface BoqSheetPage {
  id: string;
  name: string;
  section: BoqSection | null;
  items: BoqItem[];
  totals: BoqTotals;
}

/** Build tab pages: one per section (sheet) in sort order, plus "Unassigned" if needed. */
export function buildSheetPages(sections: BoqSection[], items: BoqItem[]): BoqSheetPage[] {
  const bySection = new Map<string, BoqItem[]>();
  const unassigned: BoqItem[] = [];
  const known = new Set(sections.map((s) => s.id));
  for (const it of items) {
    if (it.section_id && known.has(it.section_id)) {
      const arr = bySection.get(it.section_id) ?? [];
      arr.push(it);
      bySection.set(it.section_id, arr);
    } else {
      unassigned.push(it);
    }
  }
  const pages: BoqSheetPage[] = [...sections]
    .filter((s) => !s.parent_section_id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name_ar.localeCompare(b.name_ar))
    .map((s) => {
      const its = bySection.get(s.id) ?? [];
      return { id: s.id, name: s.name_ar, section: s, items: its, totals: computeBoqTotals(its) };
    });
  if (unassigned.length) {
    pages.push({ id: UNASSIGNED_PAGE_ID, name: 'غير مصنف', section: null, items: unassigned, totals: computeBoqTotals(unassigned) });
  }
  return pages;
}

/** Heuristic: detect optional scope from sheet name / description text. */
export function looksOptional(text: string | null | undefined): boolean {
  if (!text) return false;
  return /\b(optional|provisional|alternative|p\.?\s?s\.?)\b|اختيار|احتياطي|بديل/i.test(text);
}

/** Heuristic clean name for a sheet: "Civil Lagoon 01" -> "Civil Works – Lagoon 1". */
export function prettySheetName(raw: string): string {
  const s = raw.replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const m = s.match(/^(civil|mechanical|mech|electrical|elec|mep|arch(?:itectural)?)\s*(.*)$/i);
  if (!m) return s.replace(/\b0+(\d)/g, '$1');
  const disc = m[1].toLowerCase();
  const label =
    disc.startsWith('civil') ? 'Civil Works' :
    disc.startsWith('mech') ? 'Mechanical' :
    disc.startsWith('elec') ? 'Electrical' :
    disc === 'mep' ? 'MEP' : 'Architectural';
  const rest = m[2].replace(/([a-z])(\d)/gi, '$1 $2').replace(/\b0+(\d)/g, '$1').trim();
  const restCased = rest.replace(/\b\w/g, (c) => c.toUpperCase());
  return restCased ? `${label} – ${restCased}` : label;
}
