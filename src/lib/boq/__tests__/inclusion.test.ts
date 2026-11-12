import { describe, it, expect } from 'vitest';
import {
  computeBoqTotals, canTransition, buildSheetPages, prettySheetName, looksOptional, UNASSIGNED_PAGE_ID,
} from '@/lib/boq/inclusion';
import type { BoqItem, BoqSection } from '@/types/boq';

const it_ = (id: string, amt: number, status?: BoqItem['inclusion_status'], section_id: string | null = null) =>
  ({ id, amount_egp: amt, contract_qty: 1, rate_egp: amt, inclusion_status: status, section_id } as unknown as BoqItem);

describe('BOQ inclusion', () => {
  it('contract = base + optional_added only', () => {
    const t = computeBoqTotals([it_('a', 100), it_('b', 50, 'optional_pending'), it_('c', 30, 'optional_added'), it_('d', 999, 'omitted')]);
    expect(t.contract).toBe(130);
    expect(t.optionalPending).toBe(50);
    expect(t.omitted).toBe(999);
  });

  it('state machine', () => {
    expect(canTransition('base', 'omitted')).toBe(true);
    expect(canTransition('base', 'optional_added')).toBe(false);
    expect(canTransition('optional_pending', 'optional_added')).toBe(true);
    expect(canTransition('omitted', 'base')).toBe(true);
    expect(canTransition('base', 'base')).toBe(false);
  });

  it('builds one page per section + unassigned', () => {
    const secs = [{ id: 's1', name_ar: 'Civil Works – Lagoon 1', sort_order: 1 }] as BoqSection[];
    const pages = buildSheetPages(secs, [it_('a', 10, 'base', 's1'), it_('b', 5)]);
    expect(pages.map((p) => p.id)).toEqual(['s1', UNASSIGNED_PAGE_ID]);
    expect(pages[0].totals.contract).toBe(10);
  });

  it('heuristics', () => {
    expect(looksOptional('Optional Scop')).toBe(true);
    expect(looksOptional('Civil Lagoon 01')).toBe(false);
    expect(prettySheetName('Civil Lagoon 01')).toContain('Lagoon 1');
    expect(prettySheetName('Civil Lagoon 01').startsWith('Civil Works')).toBe(true);
  });
});
