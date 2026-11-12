import { describe, it, expect } from 'vitest';
import { parseWorkbookMatrices } from '@/lib/boq/smartParse';

describe('smartParse weight / LS sheets', () => {
  it('prices weight rows as weight x sheet total, SN row gets weight from later spec row', () => {
    const matrix: unknown[][] = [
      ['ITEM NO.', 'ITEM DESCRIPTION', 'ITEM UNIT', 'WIEGHT'],
      ['1', 'Filters', '', ''],
      ['', 'Supply and install filters', 'No.', 0.6],
      ['2', 'Pumps', 'L.S', 0.4],
      ['TOTAL WORKS', '', 1000, 1],
    ];
    const { pages } = parseWorkbookMatrices([{ name: 'MECH-Pool', matrix }]);
    const p = pages.find((x) => x.include)!;
    expect(p).toBeTruthy();
    expect(p.rows.map((r) => [r.sn, r.qty, r.unit, Math.round(r.total)])).toEqual([
      ['1', 1, 'LS', 600],
      ['2', 1, 'LS', 400],
    ]);
  });

  it('keeps identical facility sheets (twin pump rooms) but flags them', () => {
    const m = (): unknown[][] => [
      ['ITEM NO.', 'ITEM DESCRIPTION', 'ITEM UNIT', 'WIEGHT'],
      ['1', 'Concrete', 'm3', 1],
      ['TOTAL CIVIL', '', 500, 1],
    ];
    const { pages } = parseWorkbookMatrices([{ name: 'PR - P2', matrix: m() }, { name: 'PR - P3', matrix: m() }]);
    expect(pages.filter((p) => p.include)).toHaveLength(2);
    expect(pages[1].note).toMatch(/راجع/);
  });
});
