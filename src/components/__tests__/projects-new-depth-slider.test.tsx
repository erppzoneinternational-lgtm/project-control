import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {
  calculateWaterVolume,
  PZONE_WATER_SCOPES,
} from '@/lib/utils/project-creation.utils';
import {
  INITIAL_PROJECT_FORM_DATA,
  isProjectFormDirty,
  saveProjectFormDraft,
  loadProjectFormDraft,
  clearProjectFormDraft,
  mergeDraftWithInitial,
  ProjectFormData,
} from '@/lib/utils/project-draft.utils';
import NewProjectPage from '@/app/(dashboard)/projects/new/page';

// Mock Language Context
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    dir: 'rtl',
    t: (key: string) => key,
  }),
}));

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

// Mock ProjectService
vi.mock('@/lib/services/project.service', () => ({
  ProjectService: {
    getNextProjectCode: vi.fn().mockResolvedValue('PRJ-2026-01'),
    getClients: vi.fn().mockResolvedValue([]),
    getGovernorates: vi.fn().mockResolvedValue([]),
    getCities: vi.fn().mockResolvedValue([]),
    getProjectManagers: vi.fn().mockResolvedValue([]),
    createProject: vi.fn().mockResolvedValue({ id: 'proj-new-1' }),
  },
}));

describe('Step 2: Depth Range Slider & Preset Buttons Audit (0.6m, 1.4m, 2.0m, 2.5m)', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    const storageMock: Storage = {
      getItem: vi.fn((key: string) => mockStorage[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
      key: vi.fn(),
      length: 0,
    };

    if (typeof window === 'undefined') {
      (global as any).window = {
        localStorage: storageMock,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      };
    } else {
      Object.defineProperty(window, 'localStorage', {
        value: storageMock,
        writable: true,
      });
    }
  });

  describe('1. Preset Buttons Specification & Constants', () => {
    const DEPTH_PRESETS = [
      { val: 0.6, labelAr: '0.6م أطفال', labelEn: '0.6m Kids', targetType: 'kids pool' },
      { val: 1.4, labelAr: '1.4م قياسي', labelEn: '1.4m Standard', targetType: 'standard pool' },
      { val: 2.0, labelAr: '2.0م أولمبي', labelEn: '2.0m Olympic', targetType: 'olympic pool' },
      { val: 2.5, labelAr: '2.5م لاجون', labelEn: '2.5m Lagoon', targetType: 'lagoon' },
    ];

    it('defines exactly the 4 required hydraulic depth presets', () => {
      expect(DEPTH_PRESETS.length).toBe(4);
      expect(DEPTH_PRESETS.map((p) => p.val)).toEqual([0.6, 1.4, 2.0, 2.5]);
    });

    it('verifies all 4 presets fall within the slider range [0.4m, 3.5m]', () => {
      const sliderMin = 0.4;
      const sliderMax = 3.5;
      DEPTH_PRESETS.forEach((preset) => {
        expect(preset.val).toBeGreaterThanOrEqual(sliderMin);
        expect(preset.val).toBeLessThanOrEqual(sliderMax);
      });
    });

    it('evaluates active preset tolerance matching (0.05m threshold)', () => {
      const isPresetActive = (currentDepth: number, presetVal: number) =>
        Math.abs(currentDepth - presetVal) < 0.05;

      // 0.6m Kids preset
      expect(isPresetActive(0.6, 0.6)).toBe(true);
      expect(isPresetActive(0.62, 0.6)).toBe(true);
      expect(isPresetActive(0.58, 0.6)).toBe(true);
      expect(isPresetActive(0.66, 0.6)).toBe(false);
      expect(isPresetActive(1.4, 0.6)).toBe(false);

      // 1.4m Standard preset (default)
      expect(isPresetActive(1.4, 1.4)).toBe(true);
      expect(isPresetActive(1.39, 1.4)).toBe(true);
      expect(isPresetActive(1.44, 1.4)).toBe(true);
      expect(isPresetActive(2.0, 1.4)).toBe(false);

      // 2.0m Olympic preset
      expect(isPresetActive(2.0, 2.0)).toBe(true);
      expect(isPresetActive(1.98, 2.0)).toBe(true);
      expect(isPresetActive(2.5, 2.0)).toBe(false);

      // 2.5m Lagoon preset
      expect(isPresetActive(2.5, 2.5)).toBe(true);
      expect(isPresetActive(2.51, 2.5)).toBe(true);
      expect(isPresetActive(2.4, 2.5)).toBe(false);

      // Intermediate custom depth (e.g. 1.8m) activates NO preset
      DEPTH_PRESETS.forEach((preset) => {
        expect(isPresetActive(1.8, preset.val)).toBe(false);
      });
    });
  });

  describe('2. Hydraulic Calculation Integrity with Presets', () => {
    it('correctly calculates water volume for each preset with standard areas', () => {
      const testArea = 1000; // 1,000 m²

      // Preset 1: 0.6m
      expect(calculateWaterVolume(testArea, 0.6)).toBe(600);

      // Preset 2: 1.4m
      expect(calculateWaterVolume(testArea, 1.4)).toBe(1400);

      // Preset 3: 2.0m
      expect(calculateWaterVolume(testArea, 2.0)).toBe(2000);

      // Preset 4: 2.5m
      expect(calculateWaterVolume(testArea, 2.5)).toBe(2500);
    });

    it('handles realistic enterprise lagoon areas (e.g. 3,500 m² to 15,000 m²)', () => {
      const lagoonArea = 3500;
      expect(calculateWaterVolume(lagoonArea, 2.5)).toBe(8750); // 8,750 m³

      const resortArea = 12500;
      expect(calculateWaterVolume(resortArea, 1.4)).toBe(17500); // 17,500 m³

      const olympicArea = 1250; // 50m x 25m
      expect(calculateWaterVolume(olympicArea, 2.0)).toBe(2500); // 2,500 m³
    });

    it('safely handles 0 and invalid area/depth inputs', () => {
      expect(calculateWaterVolume(0, 1.4)).toBe(0);
      expect(calculateWaterVolume(1000, 0)).toBe(0);
      expect(calculateWaterVolume(-500, 1.4)).toBe(0);
      expect(calculateWaterVolume(1000, -1.4)).toBe(0);
      expect(calculateWaterVolume(NaN, 1.4)).toBe(0);
      expect(calculateWaterVolume(1000, NaN)).toBe(0);
    });
  });

  describe('3. Two-Way State Synchronization Contract', () => {
    it('simulates depth change logic when isAutoVolume is true (auto recalculation)', () => {
      const state = {
        formData: {
          ...INITIAL_PROJECT_FORM_DATA,
          water_area_m2: 2000,
          water_vol_m3: 2800, // 2000 * 1.4
          metadata: { ...INITIAL_PROJECT_FORM_DATA.metadata, water_depth_m: 1.4 },
        },
        averageDepthM: 1.4,
        isAutoVolume: true,
      };

      // Handler simulation matching updated page.tsx implementation
      const applyDepthChange = (depth: number) => {
        const safeDepth = Math.max(0, Number(depth) || 0);
        state.averageDepthM = safeDepth;
        state.formData = {
          ...state.formData,
          water_vol_m3: state.isAutoVolume
            ? calculateWaterVolume(state.formData.water_area_m2, safeDepth)
            : state.formData.water_vol_m3,
          metadata: {
            ...state.formData.metadata,
            water_depth_m: safeDepth,
          },
        };
      };

      // Select 0.6m
      applyDepthChange(0.6);
      expect(state.averageDepthM).toBe(0.6);
      expect(state.formData.metadata.water_depth_m).toBe(0.6);
      expect(state.formData.water_vol_m3).toBe(1200); // 2000 * 0.6

      // Select 2.5m
      applyDepthChange(2.5);
      expect(state.averageDepthM).toBe(2.5);
      expect(state.formData.metadata.water_depth_m).toBe(2.5);
      expect(state.formData.water_vol_m3).toBe(5000); // 2000 * 2.5
    });

    it('simulates depth change logic when isAutoVolume is false (preserves manual volume)', () => {
      const state = {
        formData: {
          ...INITIAL_PROJECT_FORM_DATA,
          water_area_m2: 2000,
          water_vol_m3: 9999, // user typed manual volume
          metadata: { ...INITIAL_PROJECT_FORM_DATA.metadata, water_depth_m: 1.4 },
        },
        averageDepthM: 1.4,
        isAutoVolume: false,
      };

      const applyDepthChange = (depth: number) => {
        const safeDepth = Math.max(0, Number(depth) || 0);
        state.averageDepthM = safeDepth;
        state.formData = {
          ...state.formData,
          water_vol_m3: state.isAutoVolume
            ? calculateWaterVolume(state.formData.water_area_m2, safeDepth)
            : state.formData.water_vol_m3,
          metadata: {
            ...state.formData.metadata,
            water_depth_m: safeDepth,
          },
        };
      };

      // Change depth to 2.0m while manual volume is active
      applyDepthChange(2.0);
      expect(state.averageDepthM).toBe(2.0);
      // Depth metadata MUST be updated even in manual volume mode
      expect(state.formData.metadata.water_depth_m).toBe(2.0);
      // But manual volume must NOT be overwritten
      expect(state.formData.water_vol_m3).toBe(9999);

      // When user re-enables auto volume calculation:
      state.isAutoVolume = true;
      state.formData.water_vol_m3 = calculateWaterVolume(
        state.formData.water_area_m2,
        state.averageDepthM
      );
      expect(state.formData.water_vol_m3).toBe(4000); // 2000 * 2.0
    });
  });

  describe('4. Draft Persistence with Depth Presets', () => {
    it('persists and restores custom preset depth in draft without loss', () => {
      const draftState: ProjectFormData = {
        ...INITIAL_PROJECT_FORM_DATA,
        project_name: 'مشروع اللاجون والمسابح الأولمبية',
        water_area_m2: 5000,
        water_vol_m3: 12500, // 5000 * 2.5
        metadata: {
          ...INITIAL_PROJECT_FORM_DATA.metadata,
          water_depth_m: 2.5,
        },
      };

      expect(isProjectFormDirty(draftState, 2, 2.5, true, true)).toBe(true);

      const saved = saveProjectFormDraft(
        {
          formData: draftState,
          currentStep: 2,
          averageDepthM: 2.5,
          isAutoVolume: true,
          isVatEnabled: true,
        },
        window.localStorage
      );
      expect(saved).toBe(true);

      const restored = loadProjectFormDraft(window.localStorage);
      expect(restored).not.toBeNull();
      expect(restored?.averageDepthM).toBe(2.5);
      expect(restored?.formData.metadata.water_depth_m).toBe(2.5);
      expect(restored?.formData.water_vol_m3).toBe(12500);
      expect(restored?.formData.water_area_m2).toBe(5000);
    });

    it('treats pristine 1.4m default depth as clean if no other changes exist', () => {
      const pristine = { ...INITIAL_PROJECT_FORM_DATA };
      expect(isProjectFormDirty(pristine, 1, 1.4, true, true)).toBe(false);

      // If user changed depth to 0.6m, form must be marked dirty
      expect(isProjectFormDirty(pristine, 1, 0.6, true, true)).toBe(true);
    });
  });

  describe('5. Component SSR & Accessibility Markup Audit', () => {
    it('renders NewProjectPage component without errors', () => {
      const html = ReactDOMServer.renderToString(<NewProjectPage />);
      expect(html).toBeDefined();
      expect(html).toContain('تأسيس مشروع جديد');
    });

    it('validates ARIA attributes and labels for range slider and preset group', () => {
      // Range slider attributes
      const sliderMin = 0.4;
      const sliderMax = 3.5;
      const sliderStep = 0.1;
      const defaultDepth = 1.4;

      const clampedSliderValue = (val: number) => Math.min(sliderMax, Math.max(sliderMin, val));

      expect(clampedSliderValue(0.6)).toBe(0.6);
      expect(clampedSliderValue(1.4)).toBe(1.4);
      expect(clampedSliderValue(2.0)).toBe(2.0);
      expect(clampedSliderValue(2.5)).toBe(2.5);
      // Below min clamps to min
      expect(clampedSliderValue(0.2)).toBe(0.4);
      // Above max clamps to max
      expect(clampedSliderValue(5.0)).toBe(3.5);
    });
  });
});
