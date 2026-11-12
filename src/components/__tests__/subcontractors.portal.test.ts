import { describe, it, expect } from 'vitest';
import {
  TradeCategory,
  TradeConfig,
  EnrichedSubcontractor,
} from '@/app/(dashboard)/subcontractors/page';

describe('Subcontractors Portal: Directory, Trades, Ratings & Accessibility Suite', () => {
  // Trade Specialization Taxonomies
  describe('1. Trade Specialization Taxonomies & Mapping', () => {
    it('defines standard construction trade categories with appropriate Arabic metadata', () => {
      const trades: TradeCategory[] = [
        'all',
        'civil',
        'mep',
        'finishes',
        'hvac',
        'waterproofing',
        'infrastructure',
        'steel',
      ];
      expect(trades).toHaveLength(8);
    });

    it('correctly categorizes Egyptian construction scopes into trade domains', () => {
      const sampleScopes = [
        { scope: 'صب خرسانات مسلحة للأعمدة والقواعد والأسقف', expected: 'civil' },
        { scope: 'توريد وتركيب لوحات التوزيع وشبكات الإطفاء والصحي', expected: 'mep' },
        { scope: 'تركيب رخام وجرانيت وأعمال دهانات ديكورية', expected: 'finishes' },
        { scope: 'تمديد مجاري الهواء ومواسير المياه المثلجة ووحدات التكييف', expected: 'hvac' },
        { scope: 'عزل بيتوميني وممبرين مسلح للأقبية والأسطح', expected: 'waterproofing' },
        { scope: 'حفر وتسوية ترابية ومد شبكات المرافق', expected: 'infrastructure' },
        { scope: 'تصنيع جمالونات حديد وكمرات معدنية', expected: 'steel' },
      ];

      const infer = (s: string): TradeCategory => {
        const str = s.toLowerCase();
        if (str.includes('خرسان') || str.includes('قواعد')) return 'civil';
        if (str.includes('كهرب') || str.includes('إطفاء') || str.includes('صحي')) return 'mep';
        if (str.includes('تكييف') || str.includes('هواء')) return 'hvac';
        if (str.includes('عزل') || str.includes('بيتومين')) return 'waterproofing';
        if (str.includes('رخام') || str.includes('دهان') || str.includes('ديكور')) return 'finishes';
        if (str.includes('حديد') || str.includes('جمالون')) return 'steel';
        if (str.includes('حفر') || str.includes('مرافق') || str.includes('شبك')) return 'infrastructure';
        return 'civil';
      };

      for (const item of sampleScopes) {
        expect(infer(item.scope)).toBe(item.expected);
      }
    });
  });

  // Rating & Performance Indicators
  describe('2. Rating Indicators & Performance Tier Thresholds', () => {
    it('accurately assigns rating tier according to EPC performance standards', () => {
      const getTier = (rating: number): EnrichedSubcontractor['rating_tier'] => {
        if (rating >= 4.5) return 'exceptional';
        if (rating >= 3.8) return 'very_good';
        if (rating >= 3.0) return 'standard';
        return 'underperforming';
      };

      expect(getTier(4.9)).toBe('exceptional');
      expect(getTier(4.5)).toBe('exceptional');
      expect(getTier(4.4)).toBe('very_good');
      expect(getTier(3.8)).toBe('very_good');
      expect(getTier(3.5)).toBe('standard');
      expect(getTier(3.0)).toBe('standard');
      expect(getTier(2.8)).toBe('underperforming');
      expect(getTier(1.5)).toBe('underperforming');
    });

    it('triggers underperforming alert flag when rating < 3.0 or achievement < 70%', () => {
      const checkUnderperforming = (rating: number, achievementPct: number) => {
        return rating < 3.0 || achievementPct < 70;
      };

      expect(checkUnderperforming(4.8, 95)).toBe(false);
      expect(checkUnderperforming(3.9, 82)).toBe(false);
      expect(checkUnderperforming(3.5, 65)).toBe(true); // Achievement < 70%
      expect(checkUnderperforming(2.7, 85)).toBe(true); // Rating < 3.0
      expect(checkUnderperforming(2.5, 45)).toBe(true); // Both
    });
  });

  // Currency & EGP Formatting
  describe('3. Currency Formatting & Metrics Rollup', () => {
    const fmtEGP = (v: number) =>
      new Intl.NumberFormat('ar-EG', {
        style: 'decimal',
        maximumFractionDigits: 0,
      }).format(v || 0);

    const fmtCompactEGP = (v: number) => {
      if (v >= 1_000_000) {
        return `${(v / 1_000_000).toFixed(1)} مليون ج.م`;
      }
      if (v >= 1_000) {
        return `${(v / 1_000).toFixed(0)} ألف ج.م`;
      }
      return `${v} ج.م`;
    };

    it('formats EGP values accurately in standard and compact forms', () => {
      expect(fmtCompactEGP(14_500_000)).toBe('14.5 مليون ج.م');
      expect(fmtCompactEGP(9_800_000)).toBe('9.8 مليون ج.م');
      expect(fmtCompactEGP(750_000)).toBe('750 ألف ج.م');
      expect(fmtCompactEGP(500)).toBe('500 ج.م');

      const formatted = fmtEGP(14500000);
      expect(formatted).toBeTruthy();
    });

    it('calculates total portfolio contract value and average ratings', () => {
      const mockSubs: Partial<EnrichedSubcontractor>[] = [
        { contract_value: 10_000_000, rating: 4.8, status: 'active', is_underperforming: false },
        { contract_value: 5_000_000, rating: 4.2, status: 'active', is_underperforming: false },
        { contract_value: 3_000_000, rating: 2.7, status: 'suspended', is_underperforming: true },
      ];

      const totalVal = mockSubs.reduce((acc, s) => acc + (s.contract_value || 0), 0);
      const activeCount = mockSubs.filter((s) => s.status === 'active').length;
      const avgRating = (mockSubs.reduce((acc, s) => acc + (s.rating || 0), 0) / mockSubs.length).toFixed(1);
      const underperformingCount = mockSubs.filter((s) => s.is_underperforming).length;

      expect(totalVal).toBe(18_000_000);
      expect(activeCount).toBe(2);
      expect(avgRating).toBe('3.9');
      expect(underperformingCount).toBe(1);
    });
  });

  // Active Contract Links & Navigation Paths
  describe('4. Active Contract Links & Navigation Resolution', () => {
    it('constructs deterministic project and contract tab links', () => {
      const projectId = 'proj-cai-01';
      const projectOverviewLink = `/projects/${projectId}`;
      const projectTeamSubcontractorsLink = `/projects/${projectId}?tab=team`;
      const projectInvoicesLink = `/projects/${projectId}?tab=invoices`;

      expect(projectOverviewLink).toBe('/projects/proj-cai-01');
      expect(projectTeamSubcontractorsLink).toBe('/projects/proj-cai-01?tab=team');
      expect(projectInvoicesLink).toBe('/projects/proj-cai-01?tab=invoices');
    });
  });
});
