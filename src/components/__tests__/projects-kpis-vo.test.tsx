import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { ProjectsPageClient } from '../projects/ProjectsPageClient';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/projects',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    t: (key: string) => {
      const dict: Record<string, string> = {
        'projects.title': 'إعداد المشروعات (Project Setup)',
        'projects.subtitle': 'إدارة وحصر مشروعات شركة بي زون',
        'projects.new_project': 'إضافة مشروع جديد',
        'projects.total_projects': 'إجمالي المشروعات',
        'projects.total_projects_sub': 'مشروع مسجل بالمنظومة',
        'projects.active_projects': 'المشاريع قيد التنفيذ',
        'projects.active_projects_sub': 'مشروع يعمل حالياً',
        'projects.base_contract_value': 'العقود الأساسية',
        'projects.base_contract_value_sub': 'قبل أوامر التغيير VOs',
        'projects.vos_value': 'أوامر التغيير (VOs)',
        'projects.vos_value_sub': 'أوامر التغيير المعتمدة',
        'projects.total_contract_value': 'إجمالي قيمة العقود',
        'projects.total_contract_value_sub': 'شاملة أوامر التغيير VOs',
        'projects.total_water_area': 'مسطح المياه الإجمالي',
        'projects.total_water_area_sub': 'مسابح، نوافير، بحيرات',
        'projects.handing_over_projects': 'مشاريع قيد التسليم',
        'projects.handing_over_projects_sub': 'مرحلة الاستلام والمطابقة',
        'projects.completed_projects': 'مشاريع مكتملة',
        'projects.completed_projects_sub': 'منتهية ومسلمة بنجاح',
        'projects.avg_completion': 'متوسط الإنجاز',
        'projects.avg_completion_sub': 'للمشاريع النشطة بالمواقع',
        'projects.total_water_volume': 'المكعب المائي الإجمالي',
        'projects.total_water_volume_sub': 'السعة التخزينية الكلية',
        'projects.on_hold_projects': 'مشاريع متوقفة',
        'projects.on_hold_projects_sub': 'موقوفة مؤقتاً بالمواقع',
        'projects.projects_with_vos': 'مشاريع بأوامر تغيير',
        'projects.projects_with_vos_sub': 'تتضمن بنود وتعديلات VOs',
        'projects.all_statuses': 'جميع الحالات',
        'projects.all_roles': 'جميع الأدوار',
        'projects.all_clients': 'جميع العملاء',
        'projects.all_govs': 'جميع المحافظات',
        'projects.client': 'العميل',
        'projects.status': 'الحالة',
        'projects.role': 'الدور',
      };
      return dict[key] || key;
    },
  }),
}));

vi.mock('@/components/layout/EnterpriseAppShell', () => ({
  useEnterpriseShell: () => ({ isDark: true, toggleTheme: vi.fn() }),
}));

vi.mock('@/lib/stores/useAuthStore', () => ({
  useAuth: () => ({ user: { email: 'admin@pzone.com' } }),
}));

vi.mock('@/lib/hooks/useUserRoles', () => ({
  useUserRoles: () => ({
    roles: ['admin'],
    isAdmin: true,
    hasRole: () => true,
    isLoading: false,
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

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="mock-map">Mock Map</div>,
}));

describe('ProjectsPageClient KPI HUD and VOs Card Audit', () => {
  it('renders all 12 executive cards across 2 symmetrical rows', () => {
    const html = ReactDOMServer.renderToStaticMarkup(<ProjectsPageClient />);

    // Row 1: Financial & Scale Cards (6 Cards)
    expect(html).toContain('إجمالي المشروعات');
    expect(html).toContain('مشروع مسجل بالمنظومة');

    expect(html).toContain('المشاريع قيد التنفيذ');
    expect(html).toContain('مشروع يعمل حالياً');

    expect(html).toContain('العقود الأساسية');
    expect(html).toContain('قبل أوامر التغيير VOs');

    expect(html).toContain('أوامر التغيير (VOs)');
    expect(html).toContain('مشروعاً بأوامر تغيير');

    expect(html).toContain('إجمالي قيمة العقود');
    expect(html).toContain('شاملة أوامر التغيير VOs');

    expect(html).toContain('مسطح المياه الإجمالي');

    // Row 2: Lifecycle & Operational Cards (6 Cards)
    expect(html).toContain('مشاريع قيد التسليم');
    expect(html).toContain('مرحلة الاستلام والمطابقة');

    expect(html).toContain('مشاريع مكتملة');
    expect(html).toContain('منتهية ومسلمة بنجاح');

    expect(html).toContain('إنجاز المشاريع العاملة');

    expect(html).toContain('مشاريع متوقفة');
    expect(html).toContain('موقوفة مؤقتاً بالمواقع');

    expect(html).toContain('مشاريع بأوامر تغيير');

    expect(html).toContain('المكعب المائي الإجمالي');
    expect(html).toContain('السعة التخزينية الكلية');
  });
});
