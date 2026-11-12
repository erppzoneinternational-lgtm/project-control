import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { getProjectValue, getProjectValueWithVat, calculateProjectTotalWithVat } from '../utils/projectValue';
import { todayCairo, nowCairo, hoursSince, isSilentSite } from '../utils/cairoDate';
import { calculateEacForecasting } from '../planning/calculations';

describe('Phase 3: Truthful Dashboard & EVM / Financial Math', () => {
  describe('Project Value & VAT Calculations (Single Source of Truth)', () => {
    it('calculates project value from base contract value when no VOs exist', () => {
      const p = { contract_value: 1000000 };
      expect(getProjectValue(p)).toBe(1000000);
    });

    it('calculates project value including variation orders (VOs)', () => {
      const p = { contract_value: 2000000, vos_value: 350000 };
      expect(getProjectValue(p)).toBe(2350000);
    });

    it('calculates project value with 14% Egyptian VAT correctly', () => {
      const p = { contract_value: 1000000, vos_value: 200000 };
      // Base: 1,200,000 * 1.14 = 1,368,000
      expect(getProjectValueWithVat(p)).toBe(1368000);
    });

    it('uses existing total_value_with_vat_egp if explicitly provided', () => {
      const p = { total_value_with_vat_egp: 5000000, contract_value: 4000000 };
      expect(getProjectValueWithVat(p)).toBe(5000000);
    });

    it('handles null, undefined, and NaN values safely returning 0', () => {
      expect(getProjectValue(null as any)).toBe(0);
      expect(getProjectValue({})).toBe(0);
      expect(getProjectValue({ contract_value: NaN })).toBe(0);
      expect(getProjectValueWithVat(null as any)).toBe(0);
      expect(calculateProjectTotalWithVat(0, 0)).toBe(0);
    });
  });

  describe('Cairo Timezone & Operational Health Utilities', () => {
    it('returns today date string in YYYY-MM-DD format for Cairo timezone', () => {
      const today = todayCairo();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('returns valid Cairo Date object', () => {
      const now = nowCairo();
      expect(now).toBeInstanceOf(Date);
      expect(!isNaN(now.getTime())).toBe(true);
    });

    it('calculates hours elapsed accurately', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
      const hours = hoursSince(threeHoursAgo);
      expect(hours).toBeGreaterThanOrEqual(2.9);
      expect(hours).toBeLessThanOrEqual(3.2);
    });

    it('identifies silent sites based on 48h threshold', () => {
      const freshReport = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const staleReport = new Date(Date.now() - 52 * 3600 * 1000).toISOString();

      expect(isSilentSite(freshReport, 48)).toBe(false);
      expect(isSilentSite(staleReport, 48)).toBe(true);
      expect(isSilentSite(null, 48)).toBe(true);
    });
  });

  describe('EAC Forecasting & EVM Calculations', () => {
    it('calculates EAC forecast correctly using CPI performance factor', () => {
      const bac = 1000000;
      const bcwp = 400000; // EV
      const acwp = 500000; // AC (CPI = 400k / 500k = 0.80)
      const cpi = bcwp / acwp;

      const eac = calculateEacForecasting(bac, bcwp, acwp, cpi);
      // Expected EAC = 500,000 + (1,000,000 - 400,000) / 0.8 = 500,000 + 750,000 = 1,250,000
      expect(eac).toBe(1250000);
    });

    it('returns BAC when no work has been performed or CPI is zero (zero-division guard)', () => {
      expect(calculateEacForecasting(1000000, 0, 0, 0)).toBe(1000000);
      expect(calculateEacForecasting(1000000, 100000, 100000, 0)).toBe(1000000);
    });
  });

  describe('Codebase Guard: Verify Absence of Fabricated Metrics & Frozen Values', () => {
    const rootDir = path.resolve(__dirname, '../../../');

    it('ensures no frozen 2026-09-29 date exists in dashboard components or pages', () => {
      const dashboardPagePath = path.join(rootDir, 'src/app/(dashboard)/dashboard/page.tsx');
      const content = fs.readFileSync(dashboardPagePath, 'utf8');
      expect(content).not.toContain('2026-09-29T12:00:00');
    });

    it('ensures no hardcoded "73 Projects" or "77 SITES SYNCED" string constants exist', () => {
      const dashboardPagePath = path.join(rootDir, 'src/app/(dashboard)/dashboard/page.tsx');
      const setupPagePath = path.join(rootDir, 'src/app/(dashboard)/project-setup/page.tsx');

      const dashContent = fs.readFileSync(dashboardPagePath, 'utf8');
      const setupContent = fs.readFileSync(setupPagePath, 'utf8');

      expect(dashContent).not.toContain('73 Projects');
      expect(dashContent).not.toContain('73 مشروعاً');
      expect(setupContent).not.toContain('77 SITES SYNCED');
    });

    it('ensures ProjectKPICards does not have fake fallback defaults (92.5, 48, etc.)', () => {
      const kpiCardsPath = path.join(rootDir, 'src/components/dashboard/ProjectKPICards.tsx');
      const content = fs.readFileSync(kpiCardsPath, 'utf8');

      expect(content).not.toContain('qcPassRate = 92.5');
      expect(content).not.toContain('totalWirs = 48');
      expect(content).not.toContain(': 0.94');
      expect(content).not.toContain(': 1.02');
    });

    it('ensures AquaticEngineeringSection does not contain fake fallback numbers (6584, 6202)', () => {
      const aquaticPath = path.join(rootDir, 'src/components/dashboard/sections/AquaticEngineeringSection.tsx');
      const content = fs.readFileSync(aquaticPath, 'utf8');

      expect(content).not.toContain(': 6584');
      expect(content).not.toContain(': 6202');
    });
  });
});
