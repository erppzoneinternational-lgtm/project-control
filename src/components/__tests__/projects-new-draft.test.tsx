import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {
  PROJECT_FORM_DRAFT_KEY,
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
    getNextProjectCode: vi.fn().mockResolvedValue('PRJ-2026-99'),
    getClients: vi.fn().mockResolvedValue([]),
    getGovernorates: vi.fn().mockResolvedValue([]),
    getCities: vi.fn().mockResolvedValue([]),
    getProjectManagers: vi.fn().mockResolvedValue([]),
    createProject: vi.fn().mockResolvedValue({ id: 'proj-new-1' }),
  },
}));

describe('NewProjectPage - Form Draft Preservation & Accidental Reload Audit', () => {
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

    // Polyfill window / localStorage for node test environment if needed
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

  describe('SSR and Initial Render Integrity', () => {
    it('renders the NewProjectPage component to string without crashing', () => {
      const html = ReactDOMServer.renderToString(<NewProjectPage />);
      expect(html).toContain('تأسيس مشروع جديد');
      expect(html).toContain('القسم');
      expect(html).toContain('من 6');
    });
  });

  describe('Accidental Tab Reload Simulation & Data Recovery', () => {
    it('simulates user filling step 1-4 and verifies complete draft persistence across reload', () => {
      // Step 1: User enters form fields
      const userInputState: ProjectFormData = {
        ...INITIAL_PROJECT_FORM_DATA,
        project_code: '2614',
        project_name: 'بحيرات منتجع سيلفر ساندس الساحل',
        project_name_en: 'Silver Sands Lagoons & Pools',
        client_id: 'client-ora-developer',
        pzone_role: 'Main Contractor',
        governorate_id: 'gov-matrouh',
        city_id: 'city-el-alamein',
        site_location_address: 'الكيلو 135 طريق الإسكندرية مطروح',
        gps_lat: 30.825,
        gps_lng: 29.582,
        water_area_m2: 3500,
        water_vol_m3: 5600,
        planned_start_date: '2026-05-01',
        planned_finish_date: '2026-11-01',
        contract_date: '2026-04-15',
        contract_duration_months: 6,
        contract_value: 28500000,
        contract_value_egp: 28500000,
        total_value_with_vat_egp: 32490000,
        vos_value: 1500000,
        estimated_cost: 21000000,
        estimated_budget: 22000000,
        project_manager_name_raw: 'م. حسان سليمان',
        project_manager_code: 'EMP-001',
        metadata: {
          water_features: ['pools', 'lagoons'],
          water_depth_m: 1.6,
          vat_included: true,
          advance_payment_pct: 10,
          retention_pct: 5,
          owner_name: 'شركة أورا ديفلوبرز مصر',
        },
      };

      expect(isProjectFormDirty(userInputState, 4, 1.6, true, true)).toBe(true);

      // Autosave runs
      const saved = saveProjectFormDraft(
        {
          formData: userInputState,
          currentStep: 4,
          averageDepthM: 1.6,
          isAutoVolume: true,
          isVatEnabled: true,
        },
        window.localStorage
      );
      expect(saved).toBe(true);

      // Step 2: Tab reload occurs (New session loads storage)
      const restored = loadProjectFormDraft(window.localStorage);
      expect(restored).not.toBeNull();
      expect(restored?.formData.project_code).toBe('2614');
      expect(restored?.formData.project_name).toBe('بحيرات منتجع سيلفر ساندس الساحل');
      expect(restored?.formData.contract_value).toBe(28500000);
      expect(restored?.formData.vos_value).toBe(1500000);
      expect(restored?.currentStep).toBe(4);
      expect(restored?.averageDepthM).toBe(1.6);
      expect(restored?.formData.metadata.water_features).toEqual(['pools', 'lagoons']);
      expect(restored?.formData.metadata.owner_name).toBe('شركة أورا ديفلوبرز مصر');

      // Step 3: Verify clear on successful submit
      const cleared = clearProjectFormDraft(window.localStorage);
      expect(cleared).toBe(true);
      expect(loadProjectFormDraft(window.localStorage)).toBeNull();
    });

    it('verifies beforeunload handler contract triggers on dirty state', () => {
      // Create a BeforeUnloadEvent mock
      let defaultPrevented = false;
      let returnValue = 'initial';
      const mockEvent = {
        preventDefault: () => {
          defaultPrevented = true;
        },
        get returnValue() {
          return returnValue;
        },
        set returnValue(val: string) {
          returnValue = val;
        },
      };

      const handler = (e: any, isDirty: boolean, saving: boolean) => {
        if (isDirty && !saving) {
          e.preventDefault();
          e.returnValue = '';
        }
      };

      // When dirty and not saving -> must preventDefault and set returnValue = ''
      handler(mockEvent, true, false);
      expect(defaultPrevented).toBe(true);
      expect(returnValue).toBe('');

      // When saving (submitting) -> must NOT block navigation
      defaultPrevented = false;
      returnValue = 'initial';
      handler(mockEvent, true, true);
      expect(defaultPrevented).toBe(false);
      expect(returnValue).toBe('initial');
    });
  });
});
