import { describe, it, expect } from 'vitest';
import { REPORT_CATALOG, REPORT_CATEGORIES, getReportById, getReportsByCategory } from '../reportCatalog';
import { Project } from '@/types';

const mockProjects: Project[] = [
  {
    id: 'p-1',
    project_code: 'PZ-001',
    project_name: 'مشروع مارينا كابيتال 1',
    project_name_en: 'Marina Capital 1',
    public_name: 'مشروع مارينا كابيتال 1 | Marina Capital 1',
    client_name_raw: 'إعمار مصر للتنمية',
    pm_full_name: 'م. أحمد الشريف',
    pzone_role: 'Sub Contractor',
    status: 'working',
    contract_value: 15000000,
    vos_value: 1200000,
    total_contract_value: 16200000,
    completion_pct: 65,
    water_area_m2: 3200,
    water_vol_m3: 4500,
    estimated_budget: 14000000,
    estimated_cost: 13500000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'p-2',
    project_code: 'PZ-002',
    project_name: 'فندق شاطئ الفيروز',
    project_name_en: 'Turquoise Beach Hotel',
    public_name: 'فندق شاطئ الفيروز | Turquoise Beach Hotel',
    client_name_raw: 'مجموعة أوراسكوم',
    pm_full_name: 'م. يوسف النجار',
    pzone_role: 'Main Contractor',
    status: 'handing_over',
    contract_value: 28000000,
    vos_value: 0,
    total_contract_value: 28000000,
    completion_pct: 95,
    water_area_m2: 5000,
    water_vol_m3: 8200,
    estimated_budget: 25000000,
    estimated_cost: 24200000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

describe('REPORT_CATALOG (110 Dynamic Reports)', () => {
  it('contains at least 100 enterprise reports', () => {
    expect(REPORT_CATALOG.length).toBeGreaterThanOrEqual(100);
    expect(REPORT_CATALOG.length).toBe(110);
  });

  it('contains 11 distinct operational categories', () => {
    expect(REPORT_CATEGORIES.length).toBe(11);
  });

  it('has unique IDs and valid codes for every report', () => {
    const ids = new Set<string>();
    const codes = new Set<string>();

    REPORT_CATALOG.forEach((rep) => {
      expect(rep.id).toBeTruthy();
      expect(rep.code).toMatch(/^PZ-/);
      expect(rep.titleAr).toBeTruthy();
      expect(rep.titleEn).toBeTruthy();
      expect(rep.columns.length).toBeGreaterThanOrEqual(4);
      expect(rep.allowedChartTypes.length).toBeGreaterThanOrEqual(3);

      expect(ids.has(rep.id)).toBe(false);
      ids.add(rep.id);
      codes.add(rep.code);
    });

    expect(ids.size).toBe(REPORT_CATALOG.length);
  });

  it('computes chart data and KPIs safely for any dataset', () => {
    REPORT_CATALOG.forEach((rep) => {
      const chartData = rep.computeChartData(mockProjects);
      expect(Array.isArray(chartData)).toBe(true);

      const kpis = rep.computeKpis(mockProjects);
      expect(Array.isArray(kpis)).toBe(true);
      expect(kpis.length).toBeGreaterThanOrEqual(4);

      if (rep.filterProjects) {
        const filtered = rep.filterProjects(mockProjects);
        expect(Array.isArray(filtered)).toBe(true);
      }
    });
  });

  it('can query reports by category or ID', () => {
    const portfolioReps = getReportsByCategory('portfolio');
    expect(portfolioReps.length).toBe(11);

    const first = REPORT_CATALOG[0];
    const retrieved = getReportById(first.id);
    expect(retrieved?.code).toBe(first.code);
  });
});
