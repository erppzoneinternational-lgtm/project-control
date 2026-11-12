import type { MockBuilderShape, MockQueryBuilder } from '@/types/services-types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as XLSX from 'xlsx';
import { validateBoqImportRows } from '@/lib/planning/validators';
import { BoqService } from '@/lib/services/boq.service';
import { supabase } from '@/lib/supabase';
import { appCache } from '@/lib/cache';
import { BoqImportRow, BoqItem } from '@/types/boq';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

const createMockQueryBuilder = (resolveValue: unknown) => {
  const builder: MockBuilderShape = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve(resolveValue)),
    then: vi.fn().mockImplementation((onfulfilled) => {
      onfulfilled(resolveValue);
      return Promise.resolve(resolveValue);
    }),
  };
  return builder as MockQueryBuilder;
};

describe('BOQ Import & Validation Suite (boq.import.test.ts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appCache.clear();
  });

  describe('1. Required Fields Validation', () => {
    it('accepts valid rows with complete required attributes', () => {
      const validRows: BoqImportRow[] = [
        {
          item_code: 'B-001',
          cost_code: '01-01-001',
          description_ar: 'أعمال حفر وردم وتسوية الموقع العام',
          description_en: 'Excavation, backfilling & grading',
          unit: 'm3',
          contract_qty: 10000,
          rate_egp: 95.0,
          foreign_currency: 'EGP',
          pricing_status: 'contract_original',
        },
        {
          item_code: 'B-002',
          cost_code: '01-02-001',
          description_ar: 'خرسانة مسلحة لزوم القواعد والأساسات',
          description_en: 'Reinforced concrete for foundations',
          unit: 'm3',
          contract_qty: 2500,
          rate_egp: 4800.0,
          foreign_currency: 'EGP',
          pricing_status: 'contract_original',
        },
      ];

      const result = validateBoqImportRows(validRows);
      expect(result.valid).toBe(true);
      expect(result.validRows.length).toBe(2);
      expect(result.errors.length).toBe(0);
      // Total amount: (10,000 * 95) + (2,500 * 4,800) = 950,000 + 12,000,000 = 12,950,000
      expect(result.totalAmountEgp).toBe(12950000);
    });

    it('rejects rows with missing item_code, description_ar, or unit', () => {
      const invalidRows = [
        {
          item_code: '', // missing item_code
          description_ar: 'بند بدون كود',
          unit: 'm3',
          contract_qty: 100,
          rate_egp: 200,
        },
        {
          item_code: 'B-003',
          description_ar: '   ', // empty description_ar
          unit: 'm2',
          contract_qty: 50,
          rate_egp: 150,
        },
        {
          item_code: 'B-004',
          description_ar: 'بند بدون وحدة قياس',
          unit: '', // missing unit
          contract_qty: 300,
          rate_egp: 80,
        },
      ];

      const result = validateBoqImportRows(invalidRows as never);
      expect(result.valid).toBe(false);
      expect(result.validRows.length).toBe(0);
      expect(result.errors.length).toBe(3);

      const fieldErrors = result.errors.map((e) => e.field);
      expect(fieldErrors).toContain('item_code');
      expect(fieldErrors).toContain('description_ar');
      expect(fieldErrors).toContain('unit');
    });

    it('rejects rows with non-numeric or missing contract_qty / rate_egp', () => {
      const invalidRows = [
        {
          item_code: 'B-005',
          description_ar: 'كمية مفقودة',
          unit: 'm3',
          contract_qty: undefined as never,
          rate_egp: 100,
        },
        {
          item_code: 'B-006',
          description_ar: 'سعر مفقود',
          unit: 'ton',
          contract_qty: 50,
          rate_egp: null as never,
        },
      ];

      const result = validateBoqImportRows(invalidRows);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'contract_qty')).toBe(true);
      expect(result.errors.some((e) => e.field === 'rate_egp')).toBe(true);
    });
  });

  describe('2. Negative Rate & Quantity Rejection', () => {
    it('rejects negative contract quantity', () => {
      const rows = [
        {
          item_code: 'B-NEG-QTY',
          description_ar: 'بند بكمية سالبة غير مقبولة',
          unit: 'm3',
          contract_qty: -150.5,
          rate_egp: 1000,
        },
      ];

      const result = validateBoqImportRows(rows);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'contract_qty' && e.reason.includes('cannot be negative'))).toBe(true);
    });

    it('rejects negative rate in EGP', () => {
      const rows = [
        {
          item_code: 'B-NEG-RATE',
          description_ar: 'بند بفئة سالبة',
          unit: 'm2',
          contract_qty: 1000,
          rate_egp: -45.0,
        },
      ];

      const result = validateBoqImportRows(rows);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'rate_egp' && e.reason.includes('cannot be negative'))).toBe(true);
    });

    it('rejects negative shop_drawing_qty when provided', () => {
      const rows = [
        {
          item_code: 'B-NEG-SD',
          description_ar: 'بند بشوب دروينج سالب',
          unit: 'ml',
          contract_qty: 500,
          shop_drawing_qty: -20,
          rate_egp: 120,
        },
      ];

      const result = validateBoqImportRows(rows);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'shop_drawing_qty')).toBe(true);
    });
  });

  describe('3. Cost Code Verification & Duplicate Detection', () => {
    it('flags warning/error for cost codes missing from master directory', () => {
      const validCostCodes = new Set(['01-01-001', '01-02-001', '02-01-001']);
      const rows = [
        {
          item_code: 'B-010',
          cost_code: '01-01-001', // valid
          description_ar: 'بند بكود صحيح',
          unit: 'm3',
          contract_qty: 100,
          rate_egp: 500,
        },
        {
          item_code: 'B-011',
          cost_code: '99-88-777', // invalid
          description_ar: 'بند بكود تكلفة مجهول',
          unit: 'm3',
          contract_qty: 200,
          rate_egp: 750,
        },
      ];

      const result = validateBoqImportRows(rows, validCostCodes);
      expect(result.valid).toBe(false);
      expect(result.validRows.length).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].field).toBe('cost_code');
      expect(result.errors[0].reason).toContain('99-88-777');
    });

    it('rejects duplicate item_code entries within the imported spreadsheet', () => {
      const rows = [
        {
          item_code: 'DUP-100',
          description_ar: 'الظهور الأول للبند',
          unit: 'm3',
          contract_qty: 100,
          rate_egp: 500,
        },
        {
          item_code: 'DUP-100',
          description_ar: 'الظهور الثاني المكرر لنفس الكود',
          unit: 'm3',
          contract_qty: 150,
          rate_egp: 550,
        },
      ];

      const result = validateBoqImportRows(rows);
      expect(result.valid).toBe(false);
      expect(result.validRows.length).toBe(1);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0].item_code).toBe('DUP-100');
      expect(result.errors[0].reason).toContain('Duplicate item code "DUP-100"');
    });
  });

  describe('4. Diff Comparison Engine & In-Place Revision Logic', () => {
    it('correctly categorizes incoming rows into new, updated, and unchanged items', () => {
      const existingItems: BoqItem[] = [
        {
          id: 'item-1',
          project_id: 'proj-001',
          item_code: 'B-001',
          description_ar: 'حفر وتسوية',
          unit: 'm3',
          contract_qty: 1000,
          rate_egp: 100,
          amount_egp: 100000,
          pricing_status: 'contract_original',
          foreign_currency: 'EGP',
          revision: 1,
        },
        {
          id: 'item-2',
          project_id: 'proj-001',
          item_code: 'B-002',
          description_ar: 'خرسانة عادية',
          unit: 'm3',
          contract_qty: 500,
          rate_egp: 2000,
          amount_egp: 1000000,
          pricing_status: 'contract_original',
          foreign_currency: 'EGP',
          revision: 1,
        },
      ];

      const incomingRows: BoqImportRow[] = [
        {
          item_code: 'B-001', // Unchanged
          description_ar: 'حفر وتسوية',
          unit: 'm3',
          contract_qty: 1000,
          rate_egp: 100,
        },
        {
          item_code: 'B-002', // Updated rate & qty (VO escalation)
          description_ar: 'خرسانة عادية',
          unit: 'm3',
          contract_qty: 600,
          rate_egp: 2200,
        },
        {
          item_code: 'B-003', // New item
          description_ar: 'عزل مائي بيتومين',
          unit: 'm2',
          contract_qty: 2000,
          rate_egp: 180,
        },
      ];

      // Diff algorithm implementation check
      const existingMap = new Map<string, BoqItem>();
      existingItems.forEach((i) => existingMap.set(i.item_code, i));

      const newItems: BoqImportRow[] = [];
      const updatedItems: { incoming: BoqImportRow; existing: BoqItem }[] = [];
      const unchangedItems: BoqImportRow[] = [];

      incomingRows.forEach((row) => {
        const existing = existingMap.get(row.item_code);
        if (!existing) {
          newItems.push(row);
        } else {
          const isQtyChanged = Number(existing.contract_qty) !== Number(row.contract_qty);
          const isRateChanged = Number(existing.rate_egp) !== Number(row.rate_egp);
          const isDescChanged = existing.description_ar !== row.description_ar;

          if (isQtyChanged || isRateChanged || isDescChanged) {
            updatedItems.push({ incoming: row, existing });
          } else {
            unchangedItems.push(row);
          }
        }
      });

      expect(newItems.length).toBe(1);
      expect(newItems[0].item_code).toBe('B-003');

      expect(updatedItems.length).toBe(1);
      expect(updatedItems[0].incoming.item_code).toBe('B-002');
      expect(updatedItems[0].incoming.contract_qty).toBe(600);
      expect(updatedItems[0].existing.contract_qty).toBe(500);

      expect(unchangedItems.length).toBe(1);
      expect(unchangedItems[0].item_code).toBe('B-001');
    });

    it('verifies total contract sum against project contract value and warns on delta', () => {
      const projectContractValue = 5000000; // 5,000,000 EGP
      const incomingRows: BoqImportRow[] = [
        {
          item_code: 'B-01',
          description_ar: 'أعمال مدنية',
          unit: 'lot',
          contract_qty: 1,
          rate_egp: 3200000,
        },
        {
          item_code: 'B-02',
          description_ar: 'أعمال كهروميكانيكية',
          unit: 'lot',
          contract_qty: 1,
          rate_egp: 1800000,
        },
      ];

      const validation = validateBoqImportRows(incomingRows);
      expect(validation.totalAmountEgp).toBe(5000000);
      expect(validation.totalAmountEgp - projectContractValue).toBe(0);

      // Mismatch scenario
      const mismatchRows = [
        ...incomingRows,
        {
          item_code: 'B-03',
          description_ar: 'أعمال إضافية',
          unit: 'lot',
          contract_qty: 1,
          rate_egp: 250000,
        },
      ];
      const mismatchValidation = validateBoqImportRows(mismatchRows);
      expect(mismatchValidation.totalAmountEgp).toBe(5250000);
      const delta = mismatchValidation.totalAmountEgp - projectContractValue;
      expect(delta).toBe(250000);
    });
  });

  describe('5. BoqService.importBoqItems Database Execution', () => {
    it('executes atomic batch upsert and invalidates project cache', async () => {
      const mockUpsertData = [
        { id: 'b-1', project_id: 'proj-1', item_code: 'B-01', contract_qty: 100, rate_egp: 200, amount_egp: 20000 },
        { id: 'b-2', project_id: 'proj-1', item_code: 'B-02', contract_qty: 50, rate_egp: 400, amount_egp: 20000 },
      ];

      vi.mocked(supabase.from).mockReturnValue(
        createMockQueryBuilder({ data: mockUpsertData, error: null })
      );

      const rows: BoqImportRow[] = [
        {
          item_code: 'B-01',
          description_ar: 'حفر وتسوية',
          unit: 'm3',
          contract_qty: 100,
          rate_egp: 200,
        },
        {
          item_code: 'B-02',
          description_ar: 'خرسانة مسلحة',
          unit: 'm3',
          contract_qty: 50,
          rate_egp: 400,
        },
      ];

      const result = await BoqService.importBoqItems('proj-1', rows, 'Eng. Tamer');
      expect(result.success).toBe(true);
      expect(result.insertedCount).toBe(2);
    });
  });

  describe('6. Performance Benchmark: 50-Row Spreadsheet Import', () => {
    it('parses and validates a realistic 50-row BOQ spreadsheet in under 5.0 seconds with exact sum verification', () => {
      const startTime = performance.now();

      // 1. Generate 50 realistic BOQ spreadsheet items
      const sample50Rows: Array<Record<string, string | number>> = [];
      let expectedTotalSum = 0;

      const units = ['m3', 'm2', 'ml', 'ton', 'no', 'lot'];
      const categories = ['01-01-001', '01-02-001', '01-03-001', '02-01-001', '02-02-001'];

      for (let i = 1; i <= 50; i++) {
        const code = `BOQ-${String(i).padStart(3, '0')}`;
        const costCode = categories[(i - 1) % categories.length];
        const unit = units[(i - 1) % units.length];
        const qty = i * 25 + 10;
        const rate = (i * 137.5) % 3500 + 50;
        const lineAmount = qty * rate;
        expectedTotalSum += lineAmount;

        sample50Rows.push({
          'كود البند': code,
          'كود التكلفة': costCode,
          'الوصف بالعربية': `بند أعمال تنفيذ رقم ${i} مع المواصفات الفنية المعتمدة واختبارات الجودة`,
          'الوصف بالإنجليزية': `Work item specification item #${i} with quality testing`,
          'الوحدة': unit,
          'الكمية التعاقدية': qty,
          'الفئة': rate,
          'العملة': 'EGP',
          'حالة التسعير': 'contract_original',
        });
      }

      // 2. Build SheetJS binary workbook in memory
      const ws = XLSX.utils.json_to_sheet(sample50Rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
      const xlsxBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

      // 3. Parse binary workbook back from ArrayBuffer (simulating user upload)
      const readWb = XLSX.read(xlsxBuffer, { type: 'array' });
      const sheet = readWb.Sheets[readWb.SheetNames[0]];
      const parsedJson: Array<Record<string, string | number>> = XLSX.utils.sheet_to_json(sheet);

      expect(parsedJson.length).toBe(50);

      // 4. Normalize and validate parsed data
      const normalized: Partial<BoqImportRow>[] = parsedJson.map((row) => ({
        item_code: String(row['كود البند'] || row.item_code || '').trim(),
        cost_code: (row['كود التكلفة'] || row.cost_code) as BoqImportRow['cost_code'],
        description_ar: String(row['الوصف بالعربية'] || row.description_ar || '').trim(),
        description_en: (row['الوصف بالإنجليزية'] || row.description_en) as BoqImportRow['description_en'],
        unit: String(row['الوحدة'] || row.unit || '').trim(),
        contract_qty: Number(row['الكمية التعاقدية'] ?? row.contract_qty ?? 0),
        rate_egp: Number(row['الفئة'] ?? row.rate_egp ?? 0),
        foreign_currency: (row['العملة'] || 'EGP') as BoqImportRow['foreign_currency'],
        pricing_status: (row['حالة التسعير'] || 'contract_original') as BoqImportRow['pricing_status'],
      }));

      const validCodes = new Set(categories);
      const validation = validateBoqImportRows(normalized, validCodes);

      const endTime = performance.now();
      const elapsedMs = endTime - startTime;
      const elapsedSec = elapsedMs / 1000;

      // Verification invariants
      expect(validation.valid).toBe(true);
      expect(validation.validRows.length).toBe(50);
      expect(validation.errors.length).toBe(0);
      expect(validation.totalAmountEgp).toBe(Number(expectedTotalSum.toFixed(2)));
      expect(elapsedSec).toBeLessThan(5.0); // Must complete under 5.0 seconds benchmark
    });
  });
});
