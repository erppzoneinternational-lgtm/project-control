import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {
  resolveProjectBilingualNames,
  ProjectBilingualNameCell,
  ProjectNameInput,
} from '@/components/projects/ProjectBilingualNameCell';
import {
  INITIAL_PROJECT_FORM_DATA,
  isProjectFormDirty,
  saveProjectFormDraft,
  loadProjectFormDraft,
  clearProjectFormDraft,
  combineProjectNames,
  ProjectFormData,
} from '@/lib/utils/project-draft.utils';
import NewProjectPage from '@/app/(dashboard)/projects/new/page';
import { buildCreatePayload, buildUpdatePayload } from '@/lib/services/project.payload';

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

describe('Public Project Name & Stacked Bilingual Display Suite', () => {
  // =========================================================================
  // 1. Dynamic Resolution of Bilingual Names
  // =========================================================================
  describe('1. Dynamic resolution of bilingual names', () => {
    it('resolves explicit public_name with standard hyphen delimiter (" - ")', () => {
      const project: ProjectNameInput = {
        project_name: 'حمامات سباحة وبحيرات',
        project_name_en: 'Swimming Pools & Lagoons',
        public_name: 'بحيرات منتجع سيلفر ساندس - Silver Sands Lagoons',
      };

      const resolved = resolveProjectBilingualNames(project);
      expect(resolved.nameAr).toBe('بحيرات منتجع سيلفر ساندس');
      expect(resolved.nameEn).toBe('Silver Sands Lagoons');
    });

    it('resolves explicit public_name when reversed (English first, Arabic second)', () => {
      const project: ProjectNameInput = {
        public_name: 'Silver Sands Lagoons - بحيرات منتجع سيلفر ساندس',
      };

      const resolved = resolveProjectBilingualNames(project);
      expect(resolved.nameAr).toBe('بحيرات منتجع سيلفر ساندس');
      expect(resolved.nameEn).toBe('Silver Sands Lagoons');
    });

    it('resolves explicit public_name with alternative delimiters (" / ", " | ")', () => {
      const slashProject: ProjectNameInput = {
        public_name: 'منتجع دي باي / D-Bay Resort',
      };
      const resolvedSlash = resolveProjectBilingualNames(slashProject);
      expect(resolvedSlash.nameAr).toBe('منتجع دي باي');
      expect(resolvedSlash.nameEn).toBe('D-Bay Resort');

      const pipeProject: ProjectNameInput = {
        public_name: 'فوكا باي لاجون | Fouka Bay Lagoon',
      };
      const resolvedPipe = resolveProjectBilingualNames(pipeProject);
      expect(resolvedPipe.nameAr).toBe('فوكا باي لاجون');
      expect(resolvedPipe.nameEn).toBe('Fouka Bay Lagoon');
    });

    it('handles multiple hyphens in the English portion gracefully', () => {
      const project: ProjectNameInput = {
        public_name: 'كمبوند الساحل - D-Bay North-Coast Waterpark',
      };

      const resolved = resolveProjectBilingualNames(project);
      expect(resolved.nameAr).toBe('كمبوند الساحل');
      expect(resolved.nameEn).toBe('D-Bay North-Coast Waterpark');
    });

    it('resolves Arabic public_name without delimiter by falling back to project_name_en for English', () => {
      const project: ProjectNameInput = {
        project_name: 'الاسم الأصلي',
        project_name_en: 'Original Name EN',
        public_name: 'اسم عام مخصص بالعربية',
      };

      const resolved = resolveProjectBilingualNames(project);
      expect(resolved.nameAr).toBe('اسم عام مخصص بالعربية');
      expect(resolved.nameEn).toBe('Original Name EN');
    });

    it('resolves English public_name without delimiter by keeping project_name as Arabic', () => {
      const project: ProjectNameInput = {
        project_name: 'مشروع العلمين',
        public_name: 'Alamein Marina Lagoons',
      };

      const resolved = resolveProjectBilingualNames(project);
      expect(resolved.nameAr).toBe('مشروع العلمين');
      expect(resolved.nameEn).toBe('Alamein Marina Lagoons');
    });

    it('dynamically resolves legacy project without public_name using project_name and project_name_en', () => {
      const project: ProjectNameInput = {
        project_name: 'مشروع بحيرات سيلفر ساندس',
        project_name_en: 'Silver Sands Lagoons',
      };

      const resolved = resolveProjectBilingualNames(project);
      expect(resolved.nameAr).toBe('مشروع بحيرات سيلفر ساندس');
      expect(resolved.nameEn).toBe('Silver Sands Lagoons');
    });

    it('dynamically resolves legacy project using name_ar and name_en fields', () => {
      const project: ProjectNameInput = {
        name_ar: 'لاجون مراسي',
        name_en: 'Marassi Lagoon',
      };

      const resolved = resolveProjectBilingualNames(project);
      expect(resolved.nameAr).toBe('لاجون مراسي');
      expect(resolved.nameEn).toBe('Marassi Lagoon');
    });

    it('dynamically resolves project with project_code when no name is provided', () => {
      const project: ProjectNameInput = {
        project_code: '2614',
      };

      const resolved = resolveProjectBilingualNames(project);
      expect(resolved.nameAr).toBe('مشروع 2614');
      expect(resolved.nameEn).toBeNull();
    });

    it('handles public_name where both parts are Arabic without misclassifying partB as English', () => {
      const project: ProjectNameInput = {
        public_name: 'مشروع مارينا - المرحلة الأولى',
      };

      const resolved = resolveProjectBilingualNames(project);
      expect(resolved.nameAr).toBe('مشروع مارينا - المرحلة الأولى');
      expect(resolved.nameEn).toBeNull();

      // With project_name_en present
      const projectWithEn: ProjectNameInput = {
        public_name: 'مشروع مارينا - المرحلة الأولى',
        project_name_en: 'Marina Phase 1',
      };
      const resolvedWithEn = resolveProjectBilingualNames(projectWithEn);
      expect(resolvedWithEn.nameAr).toBe('مشروع مارينا - المرحلة الأولى');
      expect(resolvedWithEn.nameEn).toBe('Marina Phase 1');
    });

    it('falls back to project_name or project_code when public_name is delimiter/punctuation-only', () => {
      const punctOnlyWithAr: ProjectNameInput = {
        public_name: ' - ',
        project_name: 'مشروع النرجس',
      };
      const resolvedAr = resolveProjectBilingualNames(punctOnlyWithAr);
      expect(resolvedAr.nameAr).toBe('مشروع النرجس');
      expect(resolvedAr.nameEn).toBeNull();

      const punctOnlyWithCode: ProjectNameInput = {
        public_name: ' / ',
        project_code: '2618',
      };
      const resolvedCode = resolveProjectBilingualNames(punctOnlyWithCode);
      expect(resolvedCode.nameAr).toBe('مشروع 2618');
      expect(resolvedCode.nameEn).toBeNull();
    });
  });

  // =========================================================================
  // 2. Legacy Projects with Arabic Only
  // =========================================================================
  describe('2. Legacy projects with Arabic only', () => {
    it('returns nameEn: null cleanly with no trailing hyphens or empty tags', () => {
      const legacyArabicOnly: ProjectNameInput = {
        id: 'leg-1',
        project_code: '2411',
        project_name: 'مشروع النرجس الجديد',
        project_name_en: null,
        public_name: null,
      };

      const resolved = resolveProjectBilingualNames(legacyArabicOnly);
      expect(resolved.nameAr).toBe('مشروع النرجس الجديد');
      expect(resolved.nameEn).toBeNull();

      // Render cell
      const html = ReactDOMServer.renderToString(
        <ProjectBilingualNameCell project={legacyArabicOnly} />
      );

      // Must render Arabic with dir="rtl"
      expect(html).toContain('مشروع النرجس الجديد');
      expect(html).toContain('dir="rtl"');

      // MUST NOT render English ltr container or trailing separators
      expect(html).not.toContain('dir="ltr"');
      expect(html).not.toContain(' - ');
      expect(html).not.toContain('undefined');
      expect(html).not.toContain('null');
    });

    it('treats whitespace-only English name as absent and returns nameEn: null', () => {
      const projectWithWhitespaceEn: ProjectNameInput = {
        project_name: 'مشروع الفردوس',
        project_name_en: '   ',
        public_name: '',
      };

      const resolved = resolveProjectBilingualNames(projectWithWhitespaceEn);
      expect(resolved.nameAr).toBe('مشروع الفردوس');
      expect(resolved.nameEn).toBeNull();

      const html = ReactDOMServer.renderToString(
        <ProjectBilingualNameCell project={projectWithWhitespaceEn} />
      );
      expect(html).toContain('مشروع الفردوس');
      expect(html).not.toContain('dir="ltr"');
    });

    it('cleans leading and trailing delimiter garbage from dirty legacy data', () => {
      const dirtyProject: ProjectNameInput = {
        project_name: ' - مشروع مائي تجريبي - ',
        project_name_en: ' / Test Water Project / ',
      };

      const resolved = resolveProjectBilingualNames(dirtyProject);
      expect(resolved.nameAr).toBe('مشروع مائي تجريبي');
      expect(resolved.nameEn).toBe('Test Water Project');
    });
  });

  // =========================================================================
  // 3. Stacked Bilingual Cell Rendering
  // =========================================================================
  describe('3. Stacked bilingual cell rendering', () => {
    it('renders stacked bilingual layout with Arabic on top and English on bottom', () => {
      const project: ProjectNameInput = {
        id: 'prj-101',
        project_name: 'منتجع فوكا باي لاجون',
        project_name_en: 'Fouka Bay Lagoon',
      };

      const html = ReactDOMServer.renderToString(
        <ProjectBilingualNameCell project={project} />
      );

      // Top row: Arabic in bold with dir="rtl"
      expect(html).toContain('dir="rtl"');
      expect(html).toContain('font-bold');
      expect(html).toContain('منتجع فوكا باي لاجون');

      // Bottom row: English in secondary typography with dir="ltr"
      expect(html).toContain('dir="ltr"');
      expect(html).toContain('font-mono');
      expect(html).toContain('Fouka Bay Lagoon');

      // Layout structure: flex flex-col
      expect(html).toContain('flex flex-col');
    });

    it('renders Next.js Link when href prop is passed', () => {
      const project: ProjectNameInput = {
        id: 'prj-link-1',
        project_name: 'لاجون دي باي',
        project_name_en: 'D-Bay Lagoon',
      };

      const html = ReactDOMServer.renderToString(
        <ProjectBilingualNameCell
          project={project}
          href="/projects/prj-link-1"
          title="عرض تفاصيل المشروع"
        />
      );

      expect(html).toContain('href="/projects/prj-link-1"');
      expect(html).toContain('title="عرض تفاصيل المشروع"');
      expect(html).toContain('hover:underline');
      expect(html).toContain('لاجون دي باي');
      expect(html).toContain('D-Bay Lagoon');
    });

    it('renders plain container without Link when href is omitted', () => {
      const project: ProjectNameInput = {
        project_name: 'مشروع ثابت',
        project_name_en: 'Static Project',
      };

      const html = ReactDOMServer.renderToString(
        <ProjectBilingualNameCell project={project} />
      );

      expect(html).not.toContain('<a');
      expect(html).not.toContain('href=');
      expect(html).toContain('مشروع ثابت');
      expect(html).toContain('Static Project');
    });
  });

  // =========================================================================
  // 4. Form Combine Button Logic & State Integration
  // =========================================================================
  describe('4. Form combine button logic & state integration', () => {
    it('combines both Arabic and English names into "${ar} - ${en}"', () => {
      const ar = 'حمامات سباحة وبحيرات سيلفر ساندس';
      const en = 'Silver Sands Pools & Lagoons';

      expect(combineProjectNames(ar, en)).toBe('حمامات سباحة وبحيرات سيلفر ساندس - Silver Sands Pools & Lagoons');
    });

    it('combines cleanly when only Arabic is present (no trailing hyphen)', () => {
      expect(combineProjectNames('مشروع الفردوس', '')).toBe('مشروع الفردوس');
      expect(combineProjectNames('مشروع الفردوس', '   ')).toBe('مشروع الفردوس');
      expect(combineProjectNames('مشروع الفردوس', null)).toBe('مشروع الفردوس');
      expect(combineProjectNames('مشروع الفردوس', undefined)).toBe('مشروع الفردوس');
    });

    it('combines cleanly when only English is present (no leading hyphen)', () => {
      expect(combineProjectNames('', 'Silver Sands Lagoons')).toBe('Silver Sands Lagoons');
      expect(combineProjectNames('   ', 'Silver Sands Lagoons')).toBe('Silver Sands Lagoons');
      expect(combineProjectNames(null, 'Silver Sands Lagoons')).toBe('Silver Sands Lagoons');
      expect(combineProjectNames(undefined, 'Silver Sands Lagoons')).toBe('Silver Sands Lagoons');
    });

    it('returns empty string when both fields are empty or missing', () => {
      expect(combineProjectNames('', '')).toBe('');
      expect(combineProjectNames('   ', '   ')).toBe('');
      expect(combineProjectNames(null, null)).toBe('');
      expect(combineProjectNames(undefined, undefined)).toBe('');
    });

    it('renders the public_name input and combine button in NewProjectPage', () => {
      const html = ReactDOMServer.renderToString(<NewProjectPage />);

      // Public name field must exist in Section 1 with purified Arabic labels
      expect(html).toContain('id="public_name"');
      expect(html).toContain('اسم العرض المختصر');

      // Auto-generate button must be rendered with clean Arabic text
      expect(html).toContain('توليد تلقائي');
    });

    it('marks form as dirty when public_name is populated', () => {
      const pristine = { ...INITIAL_PROJECT_FORM_DATA };
      expect(isProjectFormDirty(pristine)).toBe(false);

      const withPublicName: ProjectFormData = {
        ...INITIAL_PROJECT_FORM_DATA,
        public_name: 'اسم المشروع المخصص',
      };
      expect(isProjectFormDirty(withPublicName)).toBe(true);
    });

    it('persists and restores public_name in localStorage drafts', () => {
      const mockStorage: Record<string, string> = {};
      const storageMock: Storage = {
        getItem: vi.fn((key: string) => mockStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete mockStorage[key];
        }),
        clear: vi.fn(() => {}),
        key: vi.fn(),
        length: 0,
      };

      const formData: ProjectFormData = {
        ...INITIAL_PROJECT_FORM_DATA,
        project_code: '2615',
        project_name: 'بحيرات منتجع سيلفر ساندس',
        project_name_en: 'Silver Sands Lagoons',
        public_name: 'بحيرات منتجع سيلفر ساندس - Silver Sands Lagoons',
      };

      saveProjectFormDraft(
        {
          formData,
          currentStep: 1,
          averageDepthM: 1.4,
          isAutoVolume: true,
          isVatEnabled: true,
        },
        storageMock
      );

      const restored = loadProjectFormDraft(storageMock);
      expect(restored).not.toBeNull();
      expect(restored?.formData.public_name).toBe(
        'بحيرات منتجع سيلفر ساندس - Silver Sands Lagoons'
      );
    });

    it('serializes public_name in buildCreatePayload and dual-persists into metadata', () => {
      const payload = buildCreatePayload({
        project_code: '2616',
        project_name: 'مشروع المارينا',
        project_name_en: 'Marina Project',
        public_name: 'مشروع المارينا - Marina Project',
        metadata: { existing_meta: true },
      });

      expect(payload.public_name).toBe('مشروع المارينا - Marina Project');
      expect((payload.metadata as Record<string, unknown>).public_name).toBe(
        'مشروع المارينا - Marina Project'
      );
      expect((payload.metadata as Record<string, unknown>).existing_meta).toBe(true);
    });

    it('allows public_name in buildUpdatePayload without stripping it', () => {
      const updatePayload = buildUpdatePayload({
        public_name: 'اسم عام معدل',
        unexpected_key: 'should_be_stripped',
      });

      expect(updatePayload.public_name).toBe('اسم عام معدل');
      expect(updatePayload).not.toHaveProperty('unexpected_key');
    });
  });
});
