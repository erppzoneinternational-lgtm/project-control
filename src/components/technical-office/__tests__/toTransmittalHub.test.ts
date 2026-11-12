import { describe, it, expect } from 'vitest';
import {
  computeNextTransmittalCode,
  validateTransmittalBatch,
} from '../TOTransmittalGovernanceHub';

describe('TOTransmittalGovernanceHub Pure Helpers', () => {
  describe('computeNextTransmittalCode', () => {
    it('defaults to TR-PL-001 when deliverables list is empty or has no codes', () => {
      expect(computeNextTransmittalCode([])).toBe('TR-PL-001');
      expect(
        computeNextTransmittalCode([
          { transmittal_code: null },
          { transmittal_code: '' },
          { transmittal_code: undefined },
        ])
      ).toBe('TR-PL-001');
    });

    it('increments highest numeric suffix matching default prefix TR-PL-', () => {
      const deliverables = [
        { transmittal_code: 'TR-PL-001' },
        { transmittal_code: 'TR-PL-004' },
        { transmittal_code: 'TR-PL-002' },
      ];
      expect(computeNextTransmittalCode(deliverables)).toBe('TR-PL-005');
    });

    it('extracts numeric suffixes from generic TR-[A-Z0-9-]+-(\\d+) patterns', () => {
      const deliverables = [
        { transmittal_code: 'TR-PL-003' },
        { transmittal_code: 'TR-MAR-011' },
        { transmittal_code: 'TR-SHOP-008' },
      ];
      expect(computeNextTransmittalCode(deliverables)).toBe('TR-PL-012');
    });

    it('supports custom prefix and pads numbers to 3 digits', () => {
      expect(computeNextTransmittalCode([], 'TR-MAR-')).toBe('TR-MAR-001');
      expect(
        computeNextTransmittalCode(
          [{ transmittal_code: 'TR-MAR-009' }],
          'TR-MAR-'
        )
      ).toBe('TR-MAR-010');
    });

    it('scans nested deliverable items and rev_history for transmittal codes', () => {
      const deliverables = [
        {
          transmittal_code: 'TR-PL-002',
          items: [
            { transmittal_number: 'TR-PL-006' },
            {
              rev_history: [{ transmittal_number: 'TR-PL-009' }],
            },
          ],
        },
      ];
      expect(computeNextTransmittalCode(deliverables)).toBe('TR-PL-010');
    });
  });

  describe('validateTransmittalBatch', () => {
    it('fails when no items are selected', () => {
      const res = validateTransmittalBatch({
        items: [],
        transmittalCode: 'TR-PL-001',
        consultantName: 'دار الهندسة',
      });
      expect(res.valid).toBe(false);
      expect(res.isValid).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
    });

    it('fails when transmittalCode or consultantName is blank', () => {
      const res = validateTransmittalBatch({
        items: [{ id: '1', sheet_number: 'PL-01', to_manager_approved: true }],
        transmittalCode: '   ',
        consultantName: '',
      });
      expect(res.valid).toBe(false);
      expect(res.errors.length).toBe(2);
    });

    it('fails when batch includes blocked or already returned items', () => {
      const res = validateTransmittalBatch([
        {
          id: '1',
          sheet_number: 'PL-01',
          status: 'blocked',
          blocked_reason: 'Missing invert level',
          to_manager_approved: true,
        },
        {
          id: '2',
          sheet_number: 'PL-02',
          status: 'returned',
          to_manager_approved: true,
        },
      ]);
      expect(res.valid).toBe(false);
      expect(res.errors.length).toBe(2);
    });

    it('passes for internally approved items with valid transmittalCode and consultantName', () => {
      const res = validateTransmittalBatch({
        items: [
          {
            id: '1',
            sheet_number: 'PL-101',
            description: 'General Pool Layout',
            status: 'ready_to_return',
            to_manager_approved: true,
          },
          {
            id: '2',
            sheet_number: 'PL-102',
            description: 'Puddle Flanges Details',
            status: 'in_progress',
            progress_pct: 100,
          },
        ],
        transmittalCode: 'TR-PL-002',
        consultantName: 'دار الهندسة - م. أحمد سمير',
      });
      expect(res.valid).toBe(true);
      expect(res.isValid).toBe(true);
      expect(res.errors).toEqual([]);
    });
  });
});
