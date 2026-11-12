import { describe, it, expect } from 'vitest';
import {
  calculateWaterVolume,
  calculateDurationInDays,
  calculateDurationInMonths,
  validateProjectDates,
  calculateGrossMargin,
  calculateVatBreakdown,
  addMonthsToDate,
  PZONE_WATER_SCOPES,
  doesScopeRequireSurfaceArea,
  doesScopeIncludeStationsOrNetworks,
  extractSmartHintsFromProjectName,
  getProjectSectionsStatus,
  validateProjectForCreation,
} from '../project-creation.utils';

describe('project-creation.utils - Water Volume Calculations', () => {
  it.each([
    [100, 1.5, 150],
    [500, 2.0, 1000],
    [25.5, 1.2, 30.6],
    [0, 1.5, 0],
    [-50, 1.5, 0],
    [100, -1.5, 0],
    [NaN, 1.5, 0],
  ])('calculates volume correctly for area=%s and depth=%s -> %s m³', (area, depth, expected) => {
    expect(calculateWaterVolume(area, depth)).toBe(expected);
  });
});

describe('project-creation.utils - Schedule Duration & Date Validation', () => {
  it('calculates duration in days between valid start and finish dates', () => {
    const days = calculateDurationInDays('2026-01-01', '2026-01-31');
    expect(days).toBe(30);
  });

  it('returns 0 if either date is missing or invalid', () => {
    expect(calculateDurationInDays('', '2026-01-31')).toBe(0);
    expect(calculateDurationInDays('2026-01-01', '')).toBe(0);
    expect(calculateDurationInDays('invalid', '2026-01-31')).toBe(0);
  });

  it('calculates approximate duration in months', () => {
    const months = calculateDurationInMonths('2026-01-01', '2026-04-01');
    expect(months).toBe(3.0);
  });

  it('detects inverted dates where finish is before start', () => {
    const res = validateProjectDates('2026-06-01', '2026-05-01');
    expect(res.isValid).toBe(false);
    expect(res.error).toBe('تاريخ الانتهاء المخطط لا يمكن أن يسبق تاريخ البدء');
    expect(res.durationDays).toBe(0);
  });

  it('validates normal sequential dates correctly', () => {
    const res = validateProjectDates('2026-01-01', '2026-07-01');
    expect(res.isValid).toBe(true);
    expect(res.error).toBeUndefined();
    expect(res.durationDays).toBe(181);
    expect(res.durationMonths).toBe(5.9);
  });

  it('adds months to a start date accurately', () => {
    const endDate = addMonthsToDate('2026-01-15', 6);
    expect(endDate).toBe('2026-07-15');
  });
});

describe('project-creation.utils - Gross Margin & Financial Indicators', () => {
  it('classifies healthy margin (>= 20%)', () => {
    const res = calculateGrossMargin(1000000, 750000);
    expect(res.marginEgp).toBe(250000);
    expect(res.marginPct).toBe(25.0);
    expect(res.status).toBe('healthy');
  });

  it('classifies warning margin (10% to 19.9%)', () => {
    const res = calculateGrossMargin(1000000, 850000);
    expect(res.marginEgp).toBe(150000);
    expect(res.marginPct).toBe(15.0);
    expect(res.status).toBe('warning');
  });

  it('classifies critical margin (< 10% or negative)', () => {
    const res = calculateGrossMargin(1000000, 950000);
    expect(res.marginEgp).toBe(50000);
    expect(res.marginPct).toBe(5.0);
    expect(res.status).toBe('critical');

    const loss = calculateGrossMargin(1000000, 1100000);
    expect(loss.marginEgp).toBe(-100000);
    expect(loss.marginPct).toBe(-10.0);
    expect(loss.status).toBe('critical');
  });

  it('safely handles zero contract value without dividing by zero', () => {
    const res = calculateGrossMargin(0, 50000);
    expect(res.marginEgp).toBe(0);
    expect(res.marginPct).toBe(0);
    expect(res.status).toBe('warning');
  });
});

describe('project-creation.utils - Egyptian 14% VAT Breakdown', () => {
  it('calculates 14% VAT and total with VAT correctly', () => {
    const res = calculateVatBreakdown(1000000);
    expect(res.netValue).toBe(1000000);
    expect(res.vatAmount).toBe(140000);
    expect(res.totalWithVat).toBe(1140000);
  });

  it('handles fractional amounts rounded to 2 decimal places', () => {
    const res = calculateVatBreakdown(12345.67);
    expect(res.netValue).toBe(12345.67);
    expect(res.vatAmount).toBe(1728.39);
    expect(res.totalWithVat).toBe(14074.06);
  });
});

describe('project-creation.utils - Context-Driven Scopes, Smart Hints & Any-Step Validation', () => {
  it('contains expected P-Zone core scopes with purified Arabic labels', () => {
    expect(PZONE_WATER_SCOPES.length).toBeGreaterThanOrEqual(6);
    const scopeIds = PZONE_WATER_SCOPES.map((s) => s.id);
    expect(scopeIds).toContain('pools');
    expect(scopeIds).toContain('fountains');
    expect(scopeIds).toContain('lagoons');
    expect(scopeIds).toContain('jacuzzi');
    expect(scopeIds).toContain('treatment');
    expect(scopeIds).toContain('irrigation');
  });

  it('distinguishes surface-area scopes from station/network-only scopes', () => {
    expect(doesScopeRequireSurfaceArea(['pools'])).toBe(true);
    expect(doesScopeRequireSurfaceArea(['lagoons'])).toBe(true);
    expect(doesScopeRequireSurfaceArea(['treatment'])).toBe(false);
    expect(doesScopeRequireSurfaceArea(['irrigation'])).toBe(false);
    expect(doesScopeRequireSurfaceArea(['treatment', 'irrigation'])).toBe(false);

    expect(doesScopeIncludeStationsOrNetworks(['treatment'])).toBe(true);
    expect(doesScopeIncludeStationsOrNetworks(['irrigation'])).toBe(true);
    expect(doesScopeIncludeStationsOrNetworks(['pools'])).toBe(false);
  });

  it('extracts smart hints (scopes, governorate, and entity) from Arabic project name', () => {
    const hints = extractSmartHintsFromProjectName(
      'بحيرات وحمامات سباحة قرية مراسي الساحل الشمالي - إعمار مصر',
      '',
      [
        { id: 'ent-emaar', name_ar: 'إعمار مصر للتنمية', name_en: 'Emaar Misr' },
        { id: 'ent-ora', name_ar: 'أورا ديفلوبرز', name_en: 'Ora Developers' },
      ],
      [
        { id: 'gov-cairo', name_ar: 'القاهرة', name_en: 'Cairo', code: 'CAI' },
        { id: 'gov-matrouh', name_ar: 'مطروح', name_en: 'Matrouh', code: 'MAT' },
      ]
    );

    expect(hints.suggestedScopes).toContain('lagoons');
    expect(hints.suggestedScopes).toContain('pools');
    expect(hints.suggestedScopes).not.toContain('jacuzzi');
    expect(hints.suggestedGovernorate?.id).toBe('gov-matrouh');
    expect(hints.suggestedEntity?.id).toBe('ent-emaar');
  });

  it('allows creating a pump-station-only project with water_area_m2 = 0', () => {
    const stationProject = {
      project_code: '2690',
      project_name: 'توريد وتركيب غرفة طلمبات ومحطة تنقية',
      pzone_role: 'Main Contractor',
      client_id: 'client-uuid-1',
      governorate_id: 'gov-uuid-1',
      water_area_m2: 0,
      planned_start_date: '2026-06-01',
      planned_finish_date: '2026-12-01',
      contract_value: 4500000,
      metadata: {
        water_features: ['treatment'],
        stations_count: 2,
      },
    };

    const check = validateProjectForCreation(stationProject);
    expect(check.isValid).toBe(true);
    expect(check.issues).toHaveLength(0);

    const statuses = getProjectSectionsStatus(stationProject);
    const allSections = Object.values(statuses);
    expect(allSections).toHaveLength(6);
    expect(allSections.every((s) => s.isRequiredReady && s.state === 'complete')).toBe(true);
  });

  it('returns exact target step and fieldId when required data is missing on direct Create click', () => {
    const subMissingOwner = {
      project_code: '2691',
      project_name: 'بحيرات مشروع الساحل',
      pzone_role: 'Sub Contractor',
      client_id: 'contractor-uuid-1',
      governorate_id: 'gov-uuid-1',
      water_area_m2: 1500,
      metadata: {
        water_features: ['lagoons'],
      },
    };

    const resSub = validateProjectForCreation(subMissingOwner);
    expect(resSub.isValid).toBe(false);
    expect(resSub.firstIssue?.step).toBe(2);
    expect(resSub.firstIssue?.fieldId).toBe('owner_client_id');

    const lagoonMissingArea = {
      project_code: '2692',
      project_name: 'بحيرات مشروع الساحل',
      pzone_role: 'Main Contractor',
      client_id: 'owner-uuid-1',
      governorate_id: 'gov-uuid-1',
      water_area_m2: 0,
      metadata: {
        water_features: ['lagoons'],
      },
    };

    const resArea = validateProjectForCreation(lagoonMissingArea);
    expect(resArea.isValid).toBe(false);
    expect(resArea.firstIssue?.step).toBe(4);
    expect(resArea.firstIssue?.fieldId).toBe('water_area_m2');
  });
});
