import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { StatusBadge } from '../ui/StatusBadge';
import { ProjectCard } from '../ui/ProjectCard';
import { DataTable } from '../ui/DataTable';
import { Project } from '@/types';

// Mock Language Context & Enterprise App Shell
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    t: (key: string) => {
      const dict: Record<string, string> = {
        'projects.title': 'مشاريع بي زون',
        'projects.subtitle': 'سجل ومحفظة المشاريع',
        'projects.new_project': 'مشروع جديد',
        'projects.total_projects': 'إجمالي المشاريع',
        'projects.total_projects_sub': 'المسجلة في النظام',
        'projects.active_projects': 'المشاريع النشطة',
        'projects.active_projects_sub': 'قيد التنفيذ',
        'projects.total_contract_value': 'إجمالي قيم العقود',
        'projects.total_contract_value_sub': 'شامل التعديلات',
        'projects.total_water_area': 'إجمالي مسطحات المياه',
        'projects.total_water_area_sub': 'مجموع م²',
        'projects.all_statuses': 'جميع الحالات',
        'projects.all_roles': 'جميع الأدوار',
        'projects.all_clients': 'جميع العملاء',
        'projects.all_govs': 'جميع المحافظات',
        'projects.client': 'العميل',
        'projects.role': 'الدور',
        'projects.status': 'الحالة',
        'projects.reset_filters': 'إعادة ضبط الفلاتر',
        'projects.no_projects_found': 'لم يتم العثور على مشاريع',
        'projects.no_projects_hint': 'جرّب تعديل الفلاتر أو كلمات البحث',
        'statuses.working': 'قيد التنفيذ',
        'statuses.finished': 'منتهي',
        'statuses.on_hold': 'موقوف مؤقتاً',
        'statuses.not_started': 'لم يبدأ',
        'statuses.tender': 'عطاء',
        'statuses.handing_over': 'قيد التسليم',
        'statuses.cancelled': 'ملغي',
      };
      return dict[key] || key;
    },
    toggleLocale: vi.fn(),
  }),
}));

vi.mock('@/components/layout/EnterpriseAppShell', () => ({
  useEnterpriseShell: () => ({
    isDark: false,
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/projects',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

const mockProject: Project = {
  id: 'prj-test-101',
  project_code: 'PZ-2026-01',
  project_name: 'مشروع بحيرة العلمين الكريستالية',
  project_name_en: 'Alamein Crystal Lagoon Project',
  client_id: 'cl-1',
  client: {
    id: 'cl-1',
    name_ar: 'إعمار مصر للتطوير العقاري',
    name_en: 'Emaar Misr',
  },
  status: 'working',
  pzone_role: 'Main Contractor',
  contract_value: 28500000,
  estimated_budget: 25000000,
  estimated_cost: 23000000,
  total_contract_value: 28500000,
  water_area_m2: 14500,
  water_vol_m3: 22000,
  completion_pct: 65,
  pm_full_name: 'م. حسن علي سليمان',
  site_location_address: 'العلمين الجديدة - الساحل الشمالي',
  vos_value: 1200000,
  created_at: '2026-01-10T10:00:00Z',
  updated_at: '2026-03-01T10:00:00Z',
};

describe('Projects Directory & Cards UI/UX Audit & Refinements', () => {
  describe('1. StatusBadge Contrast & Accessibility', () => {
    it('renders working status with accessible high-contrast colors and pulse indicator', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <StatusBadge status="working" lang="ar" />
      );
      expect(html).toContain('قيد التنفيذ');
      expect(html).toContain('text-sky-800');
      expect(html).toContain('bg-sky-50');
      expect(html).toContain('role="status"');
    });

    it('renders on_hold status with high-contrast amber theme', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <StatusBadge status="on_hold" lang="ar" />
      );
      expect(html).toContain('موقوف مؤقتاً');
      expect(html).toContain('text-amber-900');
      expect(html).toContain('bg-amber-50');
    });

    it('renders finished status with high-contrast emerald theme', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <StatusBadge status="finished" lang="ar" />
      );
      expect(html).toContain('منتهي');
      expect(html).toContain('text-emerald-800');
      expect(html).toContain('bg-emerald-50');
    });

    it('supports English localized text when requested', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <StatusBadge status="tender" lang="en" />
      );
      expect(html).toContain('Tender');
      expect(html).toContain('text-indigo-800');
    });
  });

  describe('2. ProjectCard Data Density, Progress & Currency', () => {
    it('correctly resolves total_contract_value and formats currency cleanly', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={mockProject} lang="ar" />
      );
      // 28,500,000 formatted
      expect(html).toContain('28,500,000');
      expect(html).toContain('ج.م');
      expect(html).toContain('#PZ-2026-01');
      expect(html).toContain('إعمار مصر للتطوير العقاري');
    });

    it('displays Variation Orders (VOs) when present', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={mockProject} lang="ar" />
      );
      expect(html).toContain('+ VOs 1,200,000');
    });

    it('always renders the progress bar even when completion_pct is 0 to avoid layout shift', () => {
      const zeroProgressProject: Project = {
        ...mockProject,
        id: 'prj-zero',
        completion_pct: 0,
        status: 'not_started',
      };
      const html = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={zeroProgressProject} lang="ar" />
      );
      expect(html).toContain('role="progressbar"');
      expect(html).toContain('aria-valuenow="0"');
      expect(html).toContain('0%');
    });

    it('provides minimum 40px touch targets for action links and buttons', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={mockProject} lang="ar" />
      );
      // Details button touch target (min-h-[40px] or min-h-[44px])
      expect(html).toMatch(/min-h-\[(40px|44px)\]/);
      // Edit button touch target (min-w-[40px] or min-w-[44px])
      expect(html).toMatch(/min-w-\[(40px|44px)\]/);
    });

    it('formats water area in m² with localized units', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={mockProject} lang="ar" />
      );
      expect(html).toContain('14,500');
      expect(html).toContain('م²');
    });

    it('enforces RTL layout mirroring with dir="rtl", reversed gradients, and mirrored navigation arrow', () => {
      const htmlAr = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={mockProject} lang="ar" />
      );
      // Root card direction is rtl
      expect(htmlAr).toContain('dir="rtl"');
      // Top accent bar mirrors in RTL
      expect(htmlAr).toContain('rtl:bg-gradient-to-l');
      // Project code has bidi isolation
      expect(htmlAr).toContain('<bdi dir="ltr">#PZ-2026-01</bdi>');
      // Navigation action arrow is horizontally mirrored in RTL
      expect(htmlAr).toContain('rtl:-scale-x-100');

      // In English, direction switches to ltr
      const htmlEn = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={mockProject} lang="en" />
      );
      expect(htmlEn).toContain('dir="ltr"');
      expect(htmlEn).toContain('Details');
    });

    it('applies semantic progress bar gradients matching project statuses and percentage tiers', () => {
      // 1. Finished project -> Emerald to Teal
      const finishedHtml = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={{ ...mockProject, status: 'finished', completion_pct: 100 }} lang="ar" />
      );
      expect(finishedHtml).toContain('from-emerald-500 to-teal-500');
      expect(finishedHtml).toContain('rtl:bg-gradient-to-l');

      // 2. Handing over project -> Teal to Emerald
      const handingOverHtml = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={{ ...mockProject, status: 'handing_over', completion_pct: 95 }} lang="ar" />
      );
      expect(handingOverHtml).toContain('from-teal-500 to-emerald-500');

      // 3. On Hold project -> Amber gradient
      const onHoldHtml = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={{ ...mockProject, status: 'on_hold', completion_pct: 40 }} lang="ar" />
      );
      expect(onHoldHtml).toContain('from-amber-500 to-amber-600');

      // 4. Cancelled project -> Rose gradient
      const cancelledHtml = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={{ ...mockProject, status: 'cancelled', completion_pct: 25 }} lang="ar" />
      );
      expect(cancelledHtml).toContain('from-rose-500 to-rose-600');

      // 5. Tender project -> Indigo gradient
      const tenderHtml = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={{ ...mockProject, status: 'tender', completion_pct: 10 }} lang="ar" />
      );
      expect(tenderHtml).toContain('from-indigo-500 to-blue-500');

      // 6. Working project tiers: >=80% emerald, >=50% sky, >=20% amber, <20% slate
      const p85Html = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={{ ...mockProject, status: 'working', completion_pct: 85 }} lang="ar" />
      );
      expect(p85Html).toContain('from-emerald-500 to-teal-500');

      const p60Html = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={{ ...mockProject, status: 'working', completion_pct: 60 }} lang="ar" />
      );
      expect(p60Html).toContain('from-sky-500 to-cyan-500');

      const p35Html = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={{ ...mockProject, status: 'working', completion_pct: 35 }} lang="ar" />
      );
      expect(p35Html).toContain('from-amber-500 to-orange-500');
    });

    it('exhibits tactile card hover elevation classes for physical depth and emerald glow', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <ProjectCard project={mockProject} lang="ar" />
      );
      // Lift elevation
      expect(html).toContain('hover:-translate-y-1.5');
      // Elevated ambient shadow
      expect(html).toContain('hover:shadow-2xl');
      expect(html).toContain('hover:shadow-emerald-500/15');
      // Border highlight
      expect(html).toContain('hover:border-emerald-500/50');
      // Smooth transition
      expect(html).toContain('transition-all duration-300');
    });
  });

  describe('3. DataTable Touch Targets & Ergonomics', () => {
    it('renders pagination buttons with minimum 44px touch targets', () => {
      const manyProjects = Array.from({ length: 45 }, (_, i) => ({
        ...mockProject,
        id: `prj-${i}`,
        project_code: `PZ-${i + 1}`,
      }));

      const html = ReactDOMServer.renderToStaticMarkup(
        <DataTable
          projects={manyProjects}
          lang="ar"
          pageSize={10}
          pagination={true}
        />
      );

      // Pagination nav buttons have min-w-[44px] min-h-[44px]
      expect(html).toContain('min-w-[44px] min-h-[44px]');
      // Page size selector has min-h-[44px]
      expect(html).toContain('id="dataTablePageSize"');
      expect(html).toContain('min-h-[44px]');
    });

    it('renders table row actions with min-w-[40px] min-h-[40px] touch targets', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <DataTable projects={[mockProject]} lang="ar" />
      );
      expect(html).toMatch(/min-w-\[(40px|44px)\] min-h-\[(40px|44px)\]/);
    });

    it('renders rich aggregated footer with total contract value and water area', () => {
      const html = ReactDOMServer.renderToStaticMarkup(
        <DataTable projects={[mockProject]} lang="ar" />
      );
      expect(html).toContain('إجمالي قيم العقود');
      expect(html).toContain('إجمالي المسطح المائي');
      expect(html).toContain('14,500.00');
    });
  });
});
