import { describe, it, expect } from 'vitest';
import { 
  getProjectMacroRegion, 
  matchesRegionFilter, 
  resolveProjectCoords, 
  getMacroRegionId 
} from '../regionMatcher';
import { Project, Governorate } from '@/types';

describe('regionMatcher', () => {
  const dummyGov = (id: string, code: string, name_ar: string, name_en: string): Governorate => ({
    id,
    code,
    name_ar,
    name_en,
  });

  const dummyProject = (overrides: Partial<Project>): Project => ({
    id: 'test-1',
    project_code: 'PZ-001',
    project_name: 'Test Project',
    status: 'working',
    contract_value: 1000000,
    estimated_budget: 900000,
    estimated_cost: 850000,
    water_area_m2: 500,
    water_vol_m3: 300,
    completion_pct: 0,
    vos_value: 0,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  });

  describe('resolveProjectCoords', () => {
    it('uses direct latitude and longitude when present', () => {
      const p = dummyProject({ latitude: 31.1, longitude: 29.8 } as any);
      expect(resolveProjectCoords(p)).toEqual([31.1, 29.8]);
    });

    it('resolves governorate coords if direct GPS is absent', () => {
      const p = dummyProject({ governorate: dummyGov('g1', 'MAT', 'مطروح', 'Matrouh') });
      const coords = resolveProjectCoords(p);
      expect(coords[0]).toBeGreaterThanOrEqual(30.7);
    });

    it('infers from address keywords when governorate is absent', () => {
      const p = dummyProject({ site_location_address: 'فيلا فاخرة في الساحل الشمالي' });
      const coords = resolveProjectCoords(p);
      expect(coords[0]).toBeGreaterThanOrEqual(30.7);
    });

    it('falls back to Cairo center if no geo data exists', () => {
      const p = dummyProject({});
      expect(resolveProjectCoords(p)).toEqual([30.0444, 31.2357]);
    });
  });

  describe('getProjectMacroRegion', () => {
    it('classifies Matrouh/North Coast projects as coast', () => {
      const p1 = dummyProject({ governorate: dummyGov('g1', 'MAT', 'مطروح', 'Matrouh') });
      const p2 = dummyProject({ site_location_address: 'قرية هاسيندا - الساحل الشمالي' });
      const p3 = dummyProject({ latitude: 31.2, longitude: 29.9 } as any);

      expect(getProjectMacroRegion(p1)).toBe('coast');
      expect(getProjectMacroRegion(p2)).toBe('coast');
      expect(getProjectMacroRegion(p3)).toBe('coast');
    });

    it('classifies Cairo & Giza projects as cairo', () => {
      const p1 = dummyProject({ governorate: dummyGov('g2', 'CAI', 'القاهرة', 'Cairo') });
      const p2 = dummyProject({ governorate: dummyGov('g3', 'GIZ', 'الجيزة', 'Giza') });
      const p3 = dummyProject({ site_location_address: 'كمبوند بالم هيلز - الشيخ زايد' });

      expect(getProjectMacroRegion(p1)).toBe('cairo');
      expect(getProjectMacroRegion(p2)).toBe('cairo');
      expect(getProjectMacroRegion(p3)).toBe('cairo');
    });

    it('classifies Red Sea and Gouna projects as gouna', () => {
      const p1 = dummyProject({ governorate: dummyGov('g4', 'RED', 'البحر الأحمر', 'Red Sea') });
      const p2 = dummyProject({ site_location_address: 'منتجع الجونة - الغردقة' });
      const p3 = dummyProject({ site_location_address: 'مشروع العين السخنة' });

      expect(getProjectMacroRegion(p1)).toBe('gouna');
      expect(getProjectMacroRegion(p2)).toBe('gouna');
      expect(getProjectMacroRegion(p3)).toBe('gouna');
    });

    it('classifies Upper Egypt / Luxor / Aswan projects as upper', () => {
      const p1 = dummyProject({ governorate: dummyGov('g5', 'LUX', 'الأقصر', 'Luxor') });
      const p2 = dummyProject({ governorate: dummyGov('g6', 'ASW', 'أسوان', 'Aswan') });
      const p3 = dummyProject({ latitude: 25.68, longitude: 32.63 } as any);

      expect(getProjectMacroRegion(p1)).toBe('upper');
      expect(getProjectMacroRegion(p2)).toBe('upper');
      expect(getProjectMacroRegion(p3)).toBe('upper');
    });
  });

  describe('matchesRegionFilter', () => {
    const coastProject = dummyProject({ 
      governorate: dummyGov('g1', 'MAT', 'مطروح', 'Matrouh'),
      site_location_address: 'العلمين الجديدة',
    });
    const cairoProject = dummyProject({ 
      governorate: dummyGov('g2', 'CAI', 'القاهرة', 'Cairo'),
      site_location_address: 'التجمع الخامس',
    });
    const gizaProject = dummyProject({
      governorate: dummyGov('g3', 'GIZ', 'الجيزة', 'Giza'),
      site_location_address: 'مدينة 6 أكتوبر',
    });
    const gounaProject = dummyProject({
      governorate: dummyGov('g4', 'RED', 'البحر الأحمر', 'Red Sea'),
      site_location_address: 'الجونة',
    });
    const luxorProject = dummyProject({
      governorate: dummyGov('g5', 'LUX', 'الأقصر', 'Luxor'),
      site_location_address: 'العوامية - الأقصر',
    });

    it('returns true for "all" or empty filter', () => {
      expect(matchesRegionFilter(coastProject, 'all')).toBe(true);
      expect(matchesRegionFilter(cairoProject, '')).toBe(true);
    });

    it('matches by macro code "coast"', () => {
      expect(matchesRegionFilter(coastProject, 'coast')).toBe(true);
      expect(matchesRegionFilter(cairoProject, 'coast')).toBe(false);
      expect(matchesRegionFilter(gounaProject, 'coast')).toBe(false);
      expect(matchesRegionFilter(luxorProject, 'coast')).toBe(false);
    });

    it('matches by macro code "cairo"', () => {
      expect(matchesRegionFilter(cairoProject, 'cairo')).toBe(true);
      expect(matchesRegionFilter(gizaProject, 'cairo')).toBe(true);
      expect(matchesRegionFilter(coastProject, 'cairo')).toBe(false);
    });

    it('matches by macro code "gouna"', () => {
      expect(matchesRegionFilter(gounaProject, 'gouna')).toBe(true);
      expect(matchesRegionFilter(coastProject, 'gouna')).toBe(false);
    });

    it('matches by macro code "upper"', () => {
      expect(matchesRegionFilter(luxorProject, 'upper')).toBe(true);
      expect(matchesRegionFilter(cairoProject, 'upper')).toBe(false);
    });

    it('matches Arabic macro-region labels', () => {
      expect(matchesRegionFilter(coastProject, 'الساحل الشمالي والعلمين')).toBe(true);
      expect(matchesRegionFilter(coastProject, 'الساحل الشمالي')).toBe(true);
      expect(matchesRegionFilter(cairoProject, 'القاهرة الكبرى والعاصمة')).toBe(true);
      expect(matchesRegionFilter(cairoProject, 'القاهرة الكبرى')).toBe(true);
      expect(matchesRegionFilter(gounaProject, 'الجونة والبحر الأحمر')).toBe(true);
      expect(matchesRegionFilter(luxorProject, 'الأقصر والصعيد')).toBe(true);
    });

    it('matches compound dropdown labels like "الجيزة و 6 أكتوبر"', () => {
      expect(matchesRegionFilter(gizaProject, 'الجيزة و 6 أكتوبر')).toBe(true);
      expect(matchesRegionFilter(cairoProject, 'الجيزة و 6 أكتوبر')).toBe(false);
    });

    it('matches specific governorates bidirectional', () => {
      expect(matchesRegionFilter(coastProject, 'مطروح')).toBe(true);
      expect(matchesRegionFilter(luxorProject, 'الأقصر')).toBe(true);
      expect(matchesRegionFilter(cairoProject, 'القاهرة')).toBe(true);
    });
  });

  describe('getMacroRegionId', () => {
    it('normalizes various labels to canonical IDs', () => {
      expect(getMacroRegionId('coast')).toBe('coast');
      expect(getMacroRegionId('الساحل الشمالي والعلمين')).toBe('coast');
      expect(getMacroRegionId('cairo')).toBe('cairo');
      expect(getMacroRegionId('القاهرة الكبرى والعاصمة')).toBe('cairo');
      expect(getMacroRegionId('gouna')).toBe('gouna');
      expect(getMacroRegionId('الجونة والبحر الأحمر')).toBe('gouna');
      expect(getMacroRegionId('upper')).toBe('upper');
      expect(getMacroRegionId('الأقصر والصعيد')).toBe('upper');
      expect(getMacroRegionId('all')).toBe('all');
      expect(getMacroRegionId('كل مصر')).toBe('all');
    });
  });
});
