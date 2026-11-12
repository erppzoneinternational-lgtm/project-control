import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { generateTaskInstanceKey } from '@/types/task-ontology';
import { filterPendingSteps, LibraryStepRow } from '../activity-library-generation.service';

describe('Project Task Ontology & Engineering Graph', () => {
  describe('Task Instance Key Generation & Uniqueness (FR-02)', () => {
    it('generates deterministic instance keys combining project, component, zone, and step code', () => {
      const key1 = generateTaskInstanceKey({
        projectId: 'proj-1',
        componentInstanceId: 'comp-lagoon-1',
        zoneId: 'zone-a',
        stepCode: 'LB-001',
      });

      const key2 = generateTaskInstanceKey({
        projectId: 'proj-1',
        componentInstanceId: 'comp-lagoon-1',
        zoneId: 'zone-a',
        stepCode: 'LB-001',
      });

      expect(key1).toBe('proj-1::comp-lagoon-1::zone-a::LB-001::r1');
      expect(key1).toBe(key2);
    });

    it('generates distinct keys for repeated component instances in the same project without collisions', () => {
      // Lagoon 1
      const keyLagoon1 = generateTaskInstanceKey({
        projectId: 'proj-1',
        componentInstanceId: 'comp-lagoon-1',
        zoneId: 'zone-a',
        stepCode: 'LB-014',
      });

      // Lagoon 2
      const keyLagoon2 = generateTaskInstanceKey({
        projectId: 'proj-1',
        componentInstanceId: 'comp-lagoon-2',
        zoneId: 'zone-b',
        stepCode: 'LB-014',
      });

      expect(keyLagoon1).not.toBe(keyLagoon2);
      expect(keyLagoon1).toBe('proj-1::comp-lagoon-1::zone-a::LB-014::r1');
      expect(keyLagoon2).toBe('proj-1::comp-lagoon-2::zone-b::LB-014::r1');
    });

    it('handles revision increments for replanned/reversioned tasks', () => {
      const keyRev1 = generateTaskInstanceKey({
        projectId: 'proj-1',
        componentInstanceId: 'comp-1',
        stepCode: 'LB-005',
        revision: 1,
      });

      const keyRev2 = generateTaskInstanceKey({
        projectId: 'proj-1',
        componentInstanceId: 'comp-1',
        stepCode: 'LB-005',
        revision: 2,
      });

      expect(keyRev1).toBe('proj-1::comp-1::nozone::LB-005::r1');
      expect(keyRev2).toBe('proj-1::comp-1::nozone::LB-005::r2');
      expect(keyRev1).not.toBe(keyRev2);
    });
  });

  describe('Idempotent Generation & Scope Filtering (FR-02)', () => {
    const mockSteps: LibraryStepRow[] = [
      { id: '1', library_code: 'LB-001', name_ar: 'Excavation', name_en: null, phase_ar: null, category: null, task_owner: null, qc_note: null, step_no: 1 },
      { id: '2', library_code: 'LB-002', name_ar: 'Base Compaction', name_en: null, phase_ar: null, category: null, task_owner: null, qc_note: null, step_no: 2 },
      { id: '3', library_code: 'LB-003', name_ar: 'Liner Installation', name_en: null, phase_ar: null, category: null, task_owner: null, qc_note: null, step_no: 3 },
    ];

    it('skips already generated steps for the same component instance (100% idempotent)', () => {
      const existingKeys = new Set<string>([
        'proj-1::comp-lagoon-1::zone-a::LB-001::r1',
        'proj-1::comp-lagoon-1::zone-a::LB-002::r1',
      ]);

      const pending = filterPendingSteps(
        mockSteps,
        'proj-1',
        existingKeys,
        new Set(),
        'comp-lagoon-1',
        'zone-a'
      );

      expect(pending.length).toBe(1);
      expect(pending[0].library_code).toBe('LB-003');
    });

    it('allows generating the same step for a second component instance without interference', () => {
      // Lagoon 1 has LB-001, LB-002, LB-003 generated
      const existingKeys = new Set<string>([
        'proj-1::comp-lagoon-1::zone-a::LB-001::r1',
        'proj-1::comp-lagoon-1::zone-a::LB-002::r1',
        'proj-1::comp-lagoon-1::zone-a::LB-003::r1',
      ]);

      // Running for Lagoon 2 (comp-lagoon-2)
      const pendingForLagoon2 = filterPendingSteps(
        mockSteps,
        'proj-1',
        existingKeys,
        new Set(),
        'comp-lagoon-2',
        'zone-b'
      );

      expect(pendingForLagoon2.length).toBe(3);
      expect(pendingForLagoon2.map((s) => s.library_code)).toEqual(['LB-001', 'LB-002', 'LB-003']);
    });
  });
});
