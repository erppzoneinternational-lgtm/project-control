import { describe, it, expect } from 'vitest';
import { detectDeliverableDiscipline } from '../TODisciplineBadge';
import { DeliverableItem } from '@/types/planning';

describe('Technical Office Governance & Logic', () => {
  describe('detectDeliverableDiscipline', () => {
    it('detects architectural discipline from sheet prefix', () => {
      const item: Partial<DeliverableItem> = { sheet_number: 'A-101', description: 'Floor Plan' };
      expect(detectDeliverableDiscipline(item as DeliverableItem)).toBe('architectural');
    });

    it('detects structural discipline from sheet prefix', () => {
      const item: Partial<DeliverableItem> = { sheet_number: 'S-201', description: 'Foundation Details' };
      expect(detectDeliverableDiscipline(item as DeliverableItem)).toBe('structural');
    });

    it('detects MEP discipline from sheet prefix', () => {
      const item: Partial<DeliverableItem> = { sheet_number: 'M-301', description: 'HVAC Ducting' };
      expect(detectDeliverableDiscipline(item as DeliverableItem)).toBe('mep');
    });

    it('detects discipline from Arabic structural keywords', () => {
      const item: Partial<DeliverableItem> = { sheet_number: 'DWG-001', description: 'لوحة تفريد حديد الأعمدة والقواعد' };
      expect(detectDeliverableDiscipline(item as DeliverableItem)).toBe('structural');
    });

    it('detects discipline from Arabic architectural keywords', () => {
      const item: Partial<DeliverableItem> = { sheet_number: 'DWG-002', description: 'لوحة تشطيبات الأرضيات والواجهات' };
      expect(detectDeliverableDiscipline(item as DeliverableItem)).toBe('architectural');
    });

    it('detects discipline from Arabic MEP keywords', () => {
      const item: Partial<DeliverableItem> = { sheet_number: 'DWG-003', description: 'لوحة تمديدات الصرف الصحي والتغذية' };
      expect(detectDeliverableDiscipline(item as DeliverableItem)).toBe('mep');
    });

    it('defaults to other when unrecognized', () => {
      const item: Partial<DeliverableItem> = { sheet_number: 'GEN-01', description: 'General Notes' };
      expect(detectDeliverableDiscipline(item as DeliverableItem)).toBe('other');
    });
  });
});
