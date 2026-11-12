import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { ProjectsPageClient } from '../projects/ProjectsPageClient';
import { ContractDetailDrawer } from '../contracts/ContractDetailDrawer';
import { Project } from '@/types';

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

vi.mock('@/lib/hooks/useRouteAccess', () => ({
  useRouteAccess: () => ({
    hasPermission: () => true,
    userRole: 'admin',
    canCreateProject: true,
    canEditProject: true,
  }),
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

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Physical Hardcopy Contracts Governance & Telemetry', () => {
  const mockProjects = [
    {
      id: 'proj-1',
      project_code: 'P01',
      project_name: 'مشروع حمام سباحة النرجس',
      status: 'working',
      contract_value: 10000000,
      total_contract_value: 10000000,
      hardcopy_status: 'موجود hard copy معتمد',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'proj-2',
      project_code: 'P02',
      project_name: 'مشروع بحيرة زايد',
      status: 'working',
      contract_value: 20000000,
      total_contract_value: 20000000,
      hardcopy_status: 'غير موجود hard copy معتمد',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'proj-3',
      project_code: 'P03',
      project_name: 'مشروع نافورة العاصمة',
      status: 'handing_over',
      contract_value: 15000000,
      total_contract_value: 15000000,
      hardcopy_status: 'موجود hard copy معتمد فى التأمينات',
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
    {
      id: 'proj-4',
      project_code: 'P04',
      project_name: 'مشروع مائي بدون بيانات عقد ورقي',
      status: 'working',
      contract_value: 5000000,
      total_contract_value: 5000000,
      hardcopy_status: undefined,
      created_at: '2026-01-01',
      updated_at: '2026-01-01',
    },
  ] as unknown as Project[];

  it('correctly filters projects missing physical paper contracts at company HQ', () => {
    const isMissingHardcopyAtHQ = (hs?: string) =>
      !hs || hs === 'غير موجود hard copy معتمد' || hs === 'غير مكتمل' || hs === 'None';

    const missing = mockProjects.filter((p) => isMissingHardcopyAtHQ(p.hardcopy_status));
    expect(missing).toHaveLength(2);
    expect(missing.map((p) => p.id)).toEqual(['proj-2', 'proj-4']);

    const inCompany = mockProjects.filter((p) => p.hardcopy_status === 'موجود hard copy معتمد');
    expect(inCompany).toHaveLength(1);
    expect(inCompany[0].id).toBe('proj-1');

    const inInsurance = mockProjects.filter((p) => p.hardcopy_status === 'موجود hard copy معتمد فى التأمينات');
    expect(inInsurance).toHaveLength(1);
    expect(inInsurance[0].id).toBe('proj-3');
  });

  it('renders quick filter pill for missing hardcopy contracts in ProjectsPageClient', () => {
    const html = ReactDOMServer.renderToString(<ProjectsPageClient />);

    expect(html).toContain('عقود ورقية مفقودة بالشركة');
  });

  it('renders ContractDetailDrawer with physical hardcopy status card and options', () => {
    const mockContractData = {
      projectId: 'proj-2',
      projectCode: 'P02',
      projectName: 'مشروع بحيرة زايد',
      clientName: 'إعمار مصر',
      contractorName: 'بي زون',
      contractSigningDate: '2025-01-01',
      status: 'working',
      contractAmount: 20000000,
      hardcopyStatus: 'غير موجود hard copy معتمد',
    };

    const html = ReactDOMServer.renderToString(
      <ContractDetailDrawer
        isOpen={true}
        onClose={vi.fn()}
        contract={mockContractData as any}
        onHardcopyStatusChange={vi.fn()}
      />
    );

    expect(html).toContain('موقف النسخة الورقية المعتمدة (Hardcopy)');
    expect(html).toContain('غير موجود hard copy معتمد بالشركة');
    expect(html).toContain('موجود hard copy معتمد بالشركة');
    expect(html).toContain('موجود hard copy معتمد فى التأمينات');
  });
});
