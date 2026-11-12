import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { ProjectsPageClient } from '../projects/ProjectsPageClient';
import { ProjectService } from '@/lib/services/project.service';

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
        'projects.no_projects_found': 'لم يتم العثور على مشروعات',
        'projects.no_projects_hint': 'جرب تغيير كلمات البحث أو إعادة ضبط الفلاتر',
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

vi.mock('@/lib/stores/useAuthStore', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'admin@pzone.com' },
  }),
}));

vi.mock('@/lib/hooks/useUserRoles', () => ({
  useUserRoles: () => ({
    roles: ['admin'],
    isAdmin: true,
  }),
}));

vi.mock('@/lib/hooks/useModuleAccess', () => ({
  useModuleAccess: () => ({
    data: [],
  }),
}));

vi.mock('@/lib/rbac/access-control', () => ({
  canAccessPath: () => true,
}));

vi.mock('@/lib/services/project.service', () => ({
  ProjectService: {
    getUserAssignedProjectIds: vi.fn().mockResolvedValue(null),
    getProjects: vi.fn().mockResolvedValue([]),
    getClients: vi.fn().mockResolvedValue([]),
    getGovernorates: vi.fn().mockResolvedValue([]),
  },
}));

// Mock dynamic import for LocationAnalyticsMap
vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="mock-map">Mock Map</div>,
}));

describe('ProjectsPageClient Empty States and Zero-Result Views Audit', () => {
  it('renders initial state with search bar, clear search icon container, and controls', () => {
    const html = ReactDOMServer.renderToStaticMarkup(<ProjectsPageClient />);

    // Search bar is rendered with accessible labels
    expect(html).toContain('id="projects-instant-search"');
    expect(html).toContain('type="search"');
    expect(html).toContain('placeholder="بحث فوري باسم المشروع، الكود، أو العميل..."');

    // View mode tabs exist
    expect(html).toContain('role="tablist"');
    expect(html).toContain('جدول');
    expect(html).toContain('بطاقات');
    expect(html).toContain('كانبان');
    expect(html).toContain('خريطة');
  });

  it('renders accessible touch targets >= 44px for action links and buttons', () => {
    const html = ReactDOMServer.renderToStaticMarkup(<ProjectsPageClient />);

    // Verify touch target requirements
    expect(html).toContain('min-h-[44px]');
  });
});
