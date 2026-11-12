import { describe, it, expect } from 'vitest';
import { parseWorkbookMatrices, detectHeader } from '@/lib/boq/smartParse';

describe('smartParse', () => {
  it('detects Arabic two-row header (الوحده / كميه / إجمالى العقد)', () => {
    const m = [
      ['رقم البند', 'البند', 'الوحده', '(USD) الفئة', '', 'العقد', ''],
      ['', '', '', '', '', 'كميه', 'إجمالى العقد'],
    ];
    const h = detectHeader(m)!;
    expect(h.columns.description).toBe(1);
    expect(h.columns.unit).toBe(2);
    expect(h.columns.rate).toBe(3);
    expect(h.columns.qty).toBe(5);
    expect(h.columns.amount).toBe(6);
  });

  it('splits one big sheet into pages by major headings', () => {
    const m: unknown[][] = [
      ['No.', 'Item Description', 'Unit', 'QTY', 'Rate', 'Total Amount'],
      ['', 'Main Contract'],
      ['', 'Civil Works Hotel Pool (Horizon)'],
      ['', 'Coffor Work'],
      [1, 'Coffor Panels', 'M2', 10, 32, 320],
      ['', 'Electro-mechanical BOQ for Hotel Swimming Pool'],
      ['', 'Mechanical Work'],
      [2, 'Sand filter', 'No', 2, 100, 200],
    ];
    const { pages } = parseWorkbookMatrices([{ name: 'BoQ', matrix: m }]);
    expect(pages.map((p) => p.pageName)).toEqual(['Civil Works Hotel Pool (Horizon)', 'Electro-mechanical BOQ for Hotel Swimming Pool']);
    expect(pages[0].rows[0].group).toBe('Coffor Work');
    expect(pages[1].rows[0].total).toBe(200);
  });

  it('facility + lump-sum discipline rows → "Civil Works – Lagoon K"', () => {
    const m: unknown[][] = [
      ['ITEM', 'DESCRIPTION', 'UNIT', '%', 'RATE', 'VO'],
      ['', '', '', '', 'QTY', 'Amount'],
      ['', 'Lagoon K'],
      ['', 'Civil Works', 'LS', 1, '', 1000],
      [1, 'Plain concrete', '', 0.4, 400],
      [2, 'RC', '', 0.6, 600],
      ['', 'Mechanical Works', 'Ls', 1, '', 500],
      [1, 'Filters', '', 1, 500],
    ];
    const { pages } = parseWorkbookMatrices([{ name: 'VO', matrix: m }]);
    expect(pages.map((p) => p.pageName)).toEqual(['Civil Works – Lagoon K', 'Mechanical Works – Lagoon K']);
    expect(pages[0].rows.reduce((s, r) => s + r.total, 0)).toBe(1000);
  });

  it('skips cover sheet and drops duplicate sheet', () => {
    const t = [['No.', 'Description', 'Unit', 'QTY', 'Rate', 'Total'], [1, 'A', 'm', 1, 5, 5], [2, 'B', 'm', 2, 5, 10]];
    const { pages } = parseWorkbookMatrices([
      { name: 'cover', matrix: [['Invoice'], ['x']] },
      { name: 'Invoice', matrix: t },
      { name: 'BoQ', matrix: t },
    ]);
    expect(pages.filter((p) => p.include).map((p) => p.sheetName)).toEqual(['BoQ']);
  });
});
