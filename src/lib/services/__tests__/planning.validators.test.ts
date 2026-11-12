import { describe, it, expect } from 'vitest';
import {
  validateBoqImportRows,
  validateAllocationQty,
  validateCrossProjectAllocation,
} from '@/lib/planning/validators';

describe('Planning Validators Module', () => {
  describe('validateBoqImportRows', () => {
    it('passes valid rows and computes exact total amount in EGP', () => {
      const rows = [
        {
          item_code: 'BOQ-001',
          cost_code: '01-01-001',
          description_ar: 'حفر في تربة رملية',
          unit: 'm3',
          contract_qty: 1500,
          rate_egp: 85.5,
        },
        {
          item_code: 'BOQ-002',
          cost_code: '01-02-001',
          description_ar: 'خرسانة عادية للأساسات',
          unit: 'm3',
          contract_qty: 400,
          rate_egp: 1850.0,
        },
      ];

      const validCodes = new Set(['01-01-001', '01-02-001', '01-03-001']);
      const result = validateBoqImportRows(rows, validCodes);

      expect(result.valid).toBe(true);
      expect(result.validRows.length).toBe(2);
      expect(result.errors.length).toBe(0);
      // Total: (1500 * 85.50) + (400 * 1850) = 128,250 + 740,000 = 868,250
      expect(result.totalAmountEgp).toBe(868250);
    });

    it('rejects rows with missing required fields', () => {
      const rows = [
        {
          item_code: '', // missing
          description_ar: 'بند تجريبي',
          unit: 'm3',
          contract_qty: 100,
          rate_egp: 50,
        },
        {
          item_code: 'BOQ-003',
          description_ar: '', // missing
          unit: 'm2',
          contract_qty: 200,
          rate_egp: 120,
        },
        {
          item_code: 'BOQ-004',
          description_ar: 'بند بدون وحدة',
          unit: '', // missing
          contract_qty: 10,
          rate_egp: 100,
        },
      ];

      const result = validateBoqImportRows(rows);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(3);
      expect(result.errors.some((e) => e.field === 'item_code')).toBe(true);
      expect(result.errors.some((e) => e.field === 'description_ar')).toBe(true);
      expect(result.errors.some((e) => e.field === 'unit')).toBe(true);
    });

    it('rejects negative contract quantity and rate in EGP', () => {
      const rows = [
        {
          item_code: 'BOQ-005',
          description_ar: 'بند بكمية سالبة',
          unit: 'm3',
          contract_qty: -50,
          rate_egp: 100,
        },
        {
          item_code: 'BOQ-006',
          description_ar: 'بند بسعر سالب',
          unit: 'm2',
          contract_qty: 100,
          rate_egp: -250,
        },
      ];

      const result = validateBoqImportRows(rows);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2);
      expect(result.errors.some((e) => e.reason.includes('Contract quantity cannot be negative'))).toBe(true);
      expect(result.errors.some((e) => e.reason.includes('Rate in EGP cannot be negative'))).toBe(true);
    });

    it('detects duplicate item codes in spreadsheet', () => {
      const rows = [
        {
          item_code: 'BOQ-DUP',
          description_ar: 'بند أول',
          unit: 'm3',
          contract_qty: 10,
          rate_egp: 50,
        },
        {
          item_code: 'BOQ-DUP',
          description_ar: 'بند مكرر',
          unit: 'm3',
          contract_qty: 20,
          rate_egp: 60,
        },
      ];

      const result = validateBoqImportRows(rows);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.reason.includes('Duplicate item code "BOQ-DUP"'))).toBe(true);
    });

    it('flags unrecognized cost codes when validation set is provided', () => {
      const rows = [
        {
          item_code: 'BOQ-007',
          cost_code: '99-99-999', // unrecognized
          description_ar: 'بند مع كود تكلفة غير معرف',
          unit: 'm3',
          contract_qty: 10,
          rate_egp: 50,
        },
      ];

      const validCodes = ['01-01-001', '01-01-002'];
      const result = validateBoqImportRows(rows, validCodes);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'cost_code')).toBe(true);
    });
  });

  describe('validateAllocationQty', () => {
    it('approves allocations when total is within daily installed quantity', () => {
      const allocations = [
        { allocated_qty: 30 },
        { allocated_qty: 45 },
      ];
      const qtyToday = 100;

      const result = validateAllocationQty(allocations, qtyToday);
      expect(result.valid).toBe(true);
      expect(result.totalAllocated).toBe(75);
      expect(result.remainingQty).toBe(25);
      expect(result.error).toBeUndefined();
    });

    it('approves exact match boundary where total allocated equals qtyToday', () => {
      const allocations = [
        { allocated_qty: 50 },
        { allocated_qty: 50 },
      ];
      const result = validateAllocationQty(allocations, 100);
      expect(result.valid).toBe(true);
      expect(result.totalAllocated).toBe(100);
      expect(result.remainingQty).toBe(0);
    });

    it('rejects over-allocation when sum exceeds daily measured quantity', () => {
      const allocations = [
        { allocated_qty: 60 },
        { allocated_qty: 50 },
      ];
      const qtyToday = 100;

      const result = validateAllocationQty(allocations, qtyToday);
      expect(result.valid).toBe(false);
      expect(result.totalAllocated).toBe(110);
      expect(result.error).toContain('exceeds measured daily quantity');
    });

    it('rejects negative allocated quantity', () => {
      const allocations = [
        { allocated_qty: -10 },
      ];
      const result = validateAllocationQty(allocations, 50);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be negative');
    });

    it('rejects negative qtyToday', () => {
      const result = validateAllocationQty([], -10);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be negative');
    });
  });

  describe('validateCrossProjectAllocation', () => {
    it('returns true when project IDs match', () => {
      expect(validateCrossProjectAllocation('proj-123', 'proj-123')).toBe(true);
    });

    it('returns false when project IDs differ', () => {
      expect(validateCrossProjectAllocation('proj-123', 'proj-456')).toBe(false);
    });

    it('returns false when project ID is empty', () => {
      expect(validateCrossProjectAllocation('', 'proj-123')).toBe(false);
    });
  });
});
