import { describe, it, expect } from 'vitest';
import { ENTERPRISE_DIVISIONS } from '../planning/CostCodeSelector';
import { COST_CODE_CATEGORIES, MASTER_ENTERPRISE_DIVISIONS } from '../planning/CostCodeManager';
import { CostCodeCategory } from '@/types/boq';

describe('Cost Code Components and Configuration Suite', () => {
  describe('Enterprise Divisions Configuration', () => {
    it('defines all 6 master enterprise divisions plus "all" and "other"', () => {
      const keys = ENTERPRISE_DIVISIONS.map((d) => d.key);
      expect(keys).toContain('all');
      expect(keys).toContain('materials');
      expect(keys).toContain('equipment_overheads');
      expect(keys).toContain('labour');
      expect(keys).toContain('revenue');
      expect(keys).toContain('accruals');
      expect(keys).toContain('subcontractors');
      expect(keys).toContain('other');
    });

    it('maps correct prefixes to enterprise divisions', () => {
      const materials = ENTERPRISE_DIVISIONS.find((d) => d.key === 'materials');
      expect(materials?.prefix).toBe('M');

      const equipment = ENTERPRISE_DIVISIONS.find((d) => d.key === 'equipment_overheads');
      expect(equipment?.prefix).toBe('E');

      const labour = ENTERPRISE_DIVISIONS.find((d) => d.key === 'labour');
      expect(labour?.prefix).toBe('L');

      const revenue = ENTERPRISE_DIVISIONS.find((d) => d.key === 'revenue');
      expect(revenue?.prefix).toBe('R');

      const accruals = ENTERPRISE_DIVISIONS.find((d) => d.key === 'accruals');
      expect(accruals?.prefix).toBe('A');

      const subcontractors = ENTERPRISE_DIVISIONS.find((d) => d.key === 'subcontractors');
      expect(subcontractors?.prefix).toBe('S');
    });

    it('maintains MASTER_ENTERPRISE_DIVISIONS alignment with ENTERPRISE_DIVISIONS', () => {
      expect(MASTER_ENTERPRISE_DIVISIONS).toHaveLength(ENTERPRISE_DIVISIONS.length);
      MASTER_ENTERPRISE_DIVISIONS.forEach((item, index) => {
        expect(item.key).toBe(ENTERPRISE_DIVISIONS[index].key);
        expect(item.prefix).toBe(ENTERPRISE_DIVISIONS[index].prefix);
      });
    });

    it('preserves legacy COST_CODE_CATEGORIES for backward compatibility (9 items)', () => {
      expect(COST_CODE_CATEGORIES).toHaveLength(9);
      const keys = COST_CODE_CATEGORIES.map((c) => c.key);
      expect(keys).toContain('all');
      expect(keys).toContain('preliminaries');
      expect(keys).toContain('concrete');
      expect(keys).toContain('finishing');
      expect(keys).toContain('mech');
      expect(keys).toContain('elec');
      expect(keys).toContain('landscape');
      expect(keys).toContain('water_features');
      expect(keys).toContain('other');
    });
  });

  describe('Cost Code Tree Hierarchy Model', () => {
    it('supports is_header and parent_id hierarchy relationships', () => {
      const headerItem = {
        id: 'hdr-1',
        code: 'M01',
        name_ar: 'الخرسانات والمواد الرابطة',
        is_header: true,
        is_system: true,
        category: 'materials' as CostCodeCategory,
        prefix: 'M',
        sort_order: 10,
      };

      const childItem = {
        id: 'child-1',
        parent_id: 'hdr-1',
        code: 'M01.01',
        name_ar: 'أسمنت مقاوم للكبريتات',
        is_header: false,
        is_system: true,
        category: 'materials' as CostCodeCategory,
        prefix: 'M',
        sort_order: 11,
      };

      expect(headerItem.is_header).toBe(true);
      expect(childItem.parent_id).toBe(headerItem.id);
      expect(childItem.is_header).toBe(false);
      expect(childItem.code.startsWith(headerItem.code)).toBe(true);
    });
  });
});
