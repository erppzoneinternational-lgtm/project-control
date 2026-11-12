import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PROJECT_FORM_DRAFT_KEY,
  INITIAL_PROJECT_FORM_DATA,
  isProjectFormDirty,
  saveProjectFormDraft,
  loadProjectFormDraft,
  clearProjectFormDraft,
  mergeDraftWithInitial,
  combineProjectNames,
  ProjectFormData,
} from '../project-draft.utils';

describe('project-draft.utils - Draft Preservation & Dirty Detection', () => {
  let mockStorage: Record<string, string>;
  let storageAdapter: Storage;

  beforeEach(() => {
    mockStorage = {};
    storageAdapter = {
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
  });

  describe('isProjectFormDirty', () => {
    it('returns false for pristine initial form state on step 1', () => {
      const isDirty = isProjectFormDirty(INITIAL_PROJECT_FORM_DATA, 1, 1.4, true, true);
      expect(isDirty).toBe(false);
    });

    it('returns true if user moved past step 1', () => {
      expect(isProjectFormDirty(INITIAL_PROJECT_FORM_DATA, 2, 1.4, true, true)).toBe(true);
      expect(isProjectFormDirty(INITIAL_PROJECT_FORM_DATA, 3, 1.4, true, true)).toBe(true);
    });

    it('returns true if project_name has input', () => {
      const modified: ProjectFormData = {
        ...INITIAL_PROJECT_FORM_DATA,
        project_name: 'مشروع حمام سباحة خاص',
      };
      expect(isProjectFormDirty(modified, 1, 1.4, true, true)).toBe(true);
    });

    it('returns true if client_id is selected', () => {
      const modified: ProjectFormData = {
        ...INITIAL_PROJECT_FORM_DATA,
        client_id: 'client-123',
      };
      expect(isProjectFormDirty(modified, 1, 1.4, true, true)).toBe(true);
    });

    it('returns true if governorate or address is set', () => {
      const modifiedGov: ProjectFormData = {
        ...INITIAL_PROJECT_FORM_DATA,
        governorate_id: 'gov-cairo',
      };
      expect(isProjectFormDirty(modifiedGov, 1, 1.4, true, true)).toBe(true);

      const modifiedAddress: ProjectFormData = {
        ...INITIAL_PROJECT_FORM_DATA,
        site_location_address: 'التجمع الخامس',
      };
      expect(isProjectFormDirty(modifiedAddress, 1, 1.4, true, true)).toBe(true);
    });

    it('returns true if hydraulic specs (area, volume, depth) are changed', () => {
      const modifiedArea: ProjectFormData = {
        ...INITIAL_PROJECT_FORM_DATA,
        water_area_m2: 250,
      };
      expect(isProjectFormDirty(modifiedArea, 1, 1.4, true, true)).toBe(true);

      // Depth changed
      expect(isProjectFormDirty(INITIAL_PROJECT_FORM_DATA, 1, 2.0, true, true)).toBe(true);

      // Auto volume disabled
      expect(isProjectFormDirty(INITIAL_PROJECT_FORM_DATA, 1, 1.4, false, true)).toBe(true);
    });

    it('returns true if dates or financial numbers are set', () => {
      const modifiedDates: ProjectFormData = {
        ...INITIAL_PROJECT_FORM_DATA,
        planned_start_date: '2026-04-01',
      };
      expect(isProjectFormDirty(modifiedDates, 1, 1.4, true, true)).toBe(true);

      const modifiedMoney: ProjectFormData = {
        ...INITIAL_PROJECT_FORM_DATA,
        contract_value: 5000000,
      };
      expect(isProjectFormDirty(modifiedMoney, 1, 1.4, true, true)).toBe(true);

      // VAT disabled
      expect(isProjectFormDirty(INITIAL_PROJECT_FORM_DATA, 1, 1.4, true, false)).toBe(true);
    });
  });

  describe('saveProjectFormDraft & loadProjectFormDraft', () => {
    it('saves draft to storage with timestamp and loads it back accurately', () => {
      const draftData = {
        formData: {
          ...INITIAL_PROJECT_FORM_DATA,
          project_name: 'منتجع بي زون لاجون',
          client_id: 'c-456',
          contract_value: 12000000,
        },
        currentStep: 3,
        averageDepthM: 1.8,
        isAutoVolume: true,
        isVatEnabled: true,
      };

      const saveOk = saveProjectFormDraft(draftData, storageAdapter);
      expect(saveOk).toBe(true);
      expect(storageAdapter.setItem).toHaveBeenCalledWith(
        PROJECT_FORM_DRAFT_KEY,
        expect.any(String)
      );

      const loaded = loadProjectFormDraft(storageAdapter);
      expect(loaded).not.toBeNull();
      expect(loaded?.formData.project_name).toBe('منتجع بي زون لاجون');
      expect(loaded?.formData.client_id).toBe('c-456');
      expect(loaded?.formData.contract_value).toBe(12000000);
      expect(loaded?.currentStep).toBe(3);
      expect(loaded?.averageDepthM).toBe(1.8);
      expect(loaded?.savedAt).toBeGreaterThan(0);
    });

    it('returns null when no draft exists in storage', () => {
      const loaded = loadProjectFormDraft(storageAdapter);
      expect(loaded).toBeNull();
    });

    it('returns null safely when storage content is corrupted JSON', () => {
      mockStorage[PROJECT_FORM_DRAFT_KEY] = 'not-valid-json{{{';
      const loaded = loadProjectFormDraft(storageAdapter);
      expect(loaded).toBeNull();
    });

    it('handles storage exceptions gracefully when saving', () => {
      const failingStorage = {
        ...storageAdapter,
        setItem: vi.fn(() => {
          throw new Error('QuotaExceededError');
        }),
      };

      const result = saveProjectFormDraft(
        {
          formData: INITIAL_PROJECT_FORM_DATA,
          currentStep: 1,
          averageDepthM: 1.4,
          isAutoVolume: true,
          isVatEnabled: true,
        },
        failingStorage as any
      );
      expect(result).toBe(false);
    });
  });

  describe('clearProjectFormDraft', () => {
    it('removes draft item from storage', () => {
      mockStorage[PROJECT_FORM_DRAFT_KEY] = JSON.stringify({
        formData: INITIAL_PROJECT_FORM_DATA,
      });

      const clearOk = clearProjectFormDraft(storageAdapter);
      expect(clearOk).toBe(true);
      expect(storageAdapter.removeItem).toHaveBeenCalledWith(PROJECT_FORM_DRAFT_KEY);
      expect(mockStorage[PROJECT_FORM_DRAFT_KEY]).toBeUndefined();
    });
  });

  describe('mergeDraftWithInitial', () => {
    it('fills in missing metadata and clamps invalid step numbers', () => {
      const partialDraft = {
        formData: {
          project_name: 'مشروع جزئي',
        } as any,
        currentStep: 99, // Invalid step > 5
      };

      const merged = mergeDraftWithInitial(partialDraft);
      expect(merged.formData.project_name).toBe('مشروع جزئي');
      expect(merged.formData.pzone_role).toBe('Main Contractor');
      expect(merged.formData.metadata.water_depth_m).toBe(1.4);
      expect(merged.currentStep).toBe(1); // clamped to 1
      expect(merged.averageDepthM).toBe(1.4);
    });
  });

  describe('combineProjectNames', () => {
    it('merges both Arabic and English names with " - " separator', () => {
      expect(combineProjectNames('مشروع النرجس', 'Al Narges Project')).toBe(
        'مشروع النرجس - Al Narges Project'
      );
    });

    it('returns only Arabic name when English is empty or missing', () => {
      expect(combineProjectNames('مشروع النرجس', '')).toBe('مشروع النرجس');
      expect(combineProjectNames('مشروع النرجس', null)).toBe('مشروع النرجس');
      expect(combineProjectNames('مشروع النرجس', undefined)).toBe('مشروع النرجس');
    });

    it('returns only English name when Arabic is empty or missing', () => {
      expect(combineProjectNames('', 'Al Narges Project')).toBe('Al Narges Project');
      expect(combineProjectNames(null, 'Al Narges Project')).toBe('Al Narges Project');
      expect(combineProjectNames(undefined, 'Al Narges Project')).toBe('Al Narges Project');
    });

    it('returns empty string when both names are absent or whitespace', () => {
      expect(combineProjectNames('', '')).toBe('');
      expect(combineProjectNames('  ', '   ')).toBe('');
      expect(combineProjectNames(null, null)).toBe('');
      expect(combineProjectNames(undefined, undefined)).toBe('');
    });
  });
});
