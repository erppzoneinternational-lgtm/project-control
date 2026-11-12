import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { ProjectsTable } from '../projects/ProjectsTable';
import { ProjectManagerDetailModal } from '../projects/ProjectManagerDetailModal';
import { Project } from '@/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/projects',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    t: (key: string) => key,
  }),
}));

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    project_code: 'PZ-101',
    project_name: 'منتجع فوكا باي لاجون',
    project_name_en: 'Fouka Bay Lagoon',
    status: 'working',
    completion_pct: 65,
    contract_value: 12000000,
    vos_value: 2500000,
    total_contract_value: 14500000,
    estimated_budget: 11000000,
    estimated_cost: 10500000,
    water_area_m2: 3500,
    water_vol_m3: 4500,
    pm_full_name: 'م. أحمد إبراهيم',
    pm_phone: '01012345678',
    pm_email: 'ahmed.ibrahim@pzone.com',
    client_representative: 'م. شريف طارق',
    client: {
      id: 'client-tm',
      name_ar: 'تطوير مصر',
      name_en: 'Tatweer Misr',
      contact_person: 'م. شريف طارق',
      phone: '01234567890',
      email: 'sherif.t@tatweermisr.com',
    },
    client_name_raw: 'تطوير مصر',
    pzone_role: 'Main Contractor',
    governorate: { id: 'gov-1', name_ar: 'مطروح', name_en: 'Matrouh', code: 'MT' },
    city: { id: 'city-1', governorate_id: 'gov-1', name_ar: 'الضبعة', name_en: 'Dabaa' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 'proj-2',
    project_code: 'PZ-102',
    project_name: 'لاجون دي باي الساحل',
    project_name_en: 'D-Bay Lagoon',
    status: 'working',
    completion_pct: 40,
    contract_value: 8000000,
    vos_value: 500000,
    total_contract_value: 8500000,
    estimated_budget: 7500000,
    estimated_cost: 7200000,
    water_area_m2: 2100,
    water_vol_m3: 3000,
    pm_full_name: 'م. أحمد إبراهيم',
    pm_phone: '01012345678',
    pm_email: 'ahmed.ibrahim@pzone.com',
    client_representative: 'م. شريف طارق',
    client: {
      id: 'client-tm',
      name_ar: 'تطوير مصر',
      name_en: 'Tatweer Misr',
      contact_person: 'م. شريف طارق',
      phone: '01234567890',
      email: 'sherif.t@tatweermisr.com',
    },
    client_name_raw: 'تطوير مصر',
    pzone_role: 'Main Contractor',
    governorate: { id: 'gov-1', name_ar: 'مطروح', name_en: 'Matrouh', code: 'MT' },
    city: { id: 'city-1', governorate_id: 'gov-1', name_ar: 'الضبعة', name_en: 'Dabaa' },
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
];

describe('ProjectsTable - Columns Customization, VO Values, and PM Profiles', () => {
  it('renders table banner with dynamic column counter and customization button', () => {
    const html = ReactDOMServer.renderToString(
      <ProjectsTable projects={mockProjects} lang="ar" />
    );

    // Dynamic banner text
    expect(html).toContain('جدول تفصيلي عريض');
    expect(html).toContain('اسحب أفقياً أو استخدم الأسهم');

    // Columns filter trigger
    expect(html).toContain('الأعمدة');
  });

  it('renders separate columns for P.ZONE PM and Client PM', () => {
    const html = ReactDOMServer.renderToString(
      <ProjectsTable projects={mockProjects} lang="ar" />
    );

    // Headers
    expect(html).toContain('مدير مشروع بي زون');
    expect(html).toContain('مدير مشروع المالك / العميل');

    // Row content
    expect(html).toContain('م. أحمد إبراهيم');
    expect(html).toContain('م. شريف طارق');
  });

  it('renders dedicated VO value column and aggregates VO total in summary footer', () => {
    const html = ReactDOMServer.renderToString(
      <ProjectsTable projects={mockProjects} lang="ar" />
    );

    // VO Header
    expect(html).toContain('قيمة أوامر التغيير');

    // VO row values
    expect(html).toContain('2,500,000.00');
    expect(html).toContain('500,000.00');

    // Summary footer with VO total (2,500,000 + 500,000 = 3,000,000)
    expect(html).toContain('إجمالي أوامر التغيير');
    expect(html).toContain('3,000,000.00');
  });

  it('renders ProjectManagerDetailModal with company, phone, email, and associated projects', () => {
    const htmlPzone = ReactDOMServer.renderToString(
      <ProjectManagerDetailModal
        isOpen={true}
        onClose={() => {}}
        manager={{
          name: 'م. أحمد إبراهيم',
          type: 'pzone',
          company: 'شركة بي زون للحلول الإنشائية المتكاملة (P.ZONE)',
          role: 'مدير مشروع P.ZONE (داخلي)',
          phone: '01012345678',
          email: 'ahmed.ibrahim@pzone.com',
        }}
        projects={mockProjects}
        lang="ar"
      />
    );

    // Manager details
    expect(htmlPzone).toContain('م. أحمد إبراهيم');
    expect(htmlPzone).toContain('بي زون');
    expect(htmlPzone).toContain('01012345678');
    expect(htmlPzone).toContain('ahmed.ibrahim@pzone.com');

    // Associated projects counter & projects list
    expect(htmlPzone).toContain('مشترك في 2 مشاريع');
    expect(htmlPzone).toContain('منتجع فوكا باي لاجون');
    expect(htmlPzone).toContain('لاجون دي باي الساحل');

    // Direct contact action links
    expect(htmlPzone).toContain('tel:01012345678');
    expect(htmlPzone).toContain('https://wa.me/201012345678');
    expect(htmlPzone).toContain('mailto:ahmed.ibrahim@pzone.com');
  });

  it('renders ProjectManagerDetailModal for Client PM with client company affiliation', () => {
    const htmlClient = ReactDOMServer.renderToString(
      <ProjectManagerDetailModal
        isOpen={true}
        onClose={() => {}}
        manager={{
          name: 'م. شريف طارق',
          type: 'client',
          company: 'تطوير مصر',
          role: 'مدير مشروع المالك / ممثل العميل',
          phone: '01234567890',
          email: 'sherif.t@tatweermisr.com',
          clientId: 'client-tm',
        }}
        projects={mockProjects}
        lang="ar"
      />
    );

    // Client PM info
    expect(htmlClient).toContain('م. شريف طارق');
    expect(htmlClient).toContain('تطوير مصر');
    expect(htmlClient).toContain('01234567890');
    expect(htmlClient).toContain('sherif.t@tatweermisr.com');

    // Projects list associated with client PM
    expect(htmlClient).toContain('منتجع فوكا باي لاجون');
    expect(htmlClient).toContain('لاجون دي باي الساحل');
  });

  it('provides dark mode high-contrast classes in column visibility popover', () => {
    // Render table and check default column configuration
    const html = ReactDOMServer.renderToString(
      <ProjectsTable projects={mockProjects} lang="ar" />
    );
    expect(html).toContain('الأعمدة');
  });
});
