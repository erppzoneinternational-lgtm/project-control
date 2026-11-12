import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, vi } from 'vitest';
import { TORoleWorkflowGuide, PORTAL_ROLE_GUIDES } from '../TORoleWorkflowGuide';
import { TOInteractiveStepGuide } from '../TOInteractiveStepGuide';
import TechnicalOfficePortalPage from '@/app/(dashboard)/technical-office/page';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    toggleLocale: vi.fn(),
  }),
}));

vi.mock('@/lib/stores/useAuthStore', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'eng@pzone.com' },
  }),
}));

vi.mock('@/lib/stores/useProjectStore', () => ({
  useProjectStore: () => ({
    activeProjectId: 'proj-2604',
    setActiveProjectId: vi.fn(),
  }),
}));

vi.mock('@/lib/hooks/useUserRoles', () => ({
  useUserRoles: () => ({
    roles: ['to_manager'],
    isAdmin: true,
  }),
}));

vi.mock('@/lib/hooks/useAssignedProjects', () => ({
  useAssignedProjects: () => ({
    projects: [
      {
        id: 'proj-2604',
        project_code: '2604',
        project_name_ar: 'مشروع سيلكس',
        project_name: 'SLX',
        // Simulate Supabase joined relation object for client & project_manager
        client: { id: 'client-1', name_ar: 'شركة سيلكس المالكة', name_en: 'SLX Client' },
        project_manager: { id: 'pm-1', name_ar: 'م. أحمد سليمان', name_en: 'Eng. Ahmed Soliman' },
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [],
    isLoading: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}));

describe('TORoleWorkflowGuide & TechnicalOfficePortalPage', () => {
  it('renders all 10 job roles with their Arabic responsibilities and portal locations', () => {
    const html = renderToString(<TORoleWorkflowGuide />);

    expect(html).toContain('دليل الأدوار ومسارات العمل — كل واحد بيعمل إيه وفين في الموقع؟');
    expect(html).toContain('بيعمل إيه؟ (المهام والخطوات اليومية):');
    expect(html).toContain('فين في الموقع؟ (اضغط على أي شاشة للانتقال إليها فوراً):');

    for (const role of PORTAL_ROLE_GUIDES) {
      expect(html).toContain(role.titleAr);
      expect(html).toContain(role.summaryAr);
    }
  });

  it('renders modal wrapper when isModal is true', () => {
    const html = renderToString(<TORoleWorkflowGuide isModal={true} onClose={() => {}} />);
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it('renders TechnicalOfficePortalPage without crashing when project.client and project.project_manager are relation objects', () => {
    const html = renderToString(<TechnicalOfficePortalPage />);
    expect(html).toContain('2604');
    expect(html).toContain('مشروع سيلكس');
    expect(html).toContain('شركة سيلكس المالكة');
    expect(html).toContain('م. أحمد سليمان');
    expect(html).toContain('دليل الأدوار والعمل: كل واحد بيعمل إيه وفين؟');
    expect(html).toContain('مرشد العمل التفاعلي (١ ⬅ ٢ ⬅ ٣)');
  });

  it('renders TOInteractiveStepGuide 3-step coach for Engineer, Manager, and COO screens', () => {
    const engHtml = renderToString(<TOInteractiveStepGuide activeTab="e1_drawings" pageContext="tasks" />);
    expect(engHtml).toContain('مخططات الورشة واللوحات التنفيذية');
    expect(engHtml).toContain('١. اختر تخصصك ومهامك');
    expect(engHtml).toContain('٢. حدّث نسبة الإنجاز أو سجّل عائقاً');
    expect(engHtml).toContain('٣. ارفع اللوحة لطابور فحص المدير');

    const mgrHtml = renderToString(<TOInteractiveStepGuide activeTab="approvals" pageContext="dashboard" />);
    expect(mgrHtml).toContain('طابور فحص واعتماد المدير');
    expect(mgrHtml).toContain('١. راجع المخرجات الجاهزة للفحص');

    const cooHtml = renderToString(<TOInteractiveStepGuide activeTab="coo_radar" pageContext="dashboard" />);
    expect(cooHtml).toContain('رادار المعوقات التنفيذي والإدارة العليا');
    expect(cooHtml).toContain('١. افحص عوائق الصب الخرساني والتوريد');
  });
});

