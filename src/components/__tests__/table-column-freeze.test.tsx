import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { RetentionAndBondsReportModal } from '../contracts/RetentionAndBondsReportModal';
import { ProjectsTable } from '../projects/ProjectsTable';
import { Project } from '@/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/projects',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    dir: 'rtl',
    t: (key: string) => key,
  }),
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
    pm_full_name: 'م. أحمد إبراهيم',
    client: {
      id: 'client-tm',
      name_ar: 'تطوير مصر',
      name_en: 'Tatweer Misr',
    },
    client_name_raw: 'تطوير مصر',
    estimated_budget: 0,
    estimated_cost: 0,
    water_area_m2: 0,
    water_vol_m3: 0,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
  {
    id: 'proj-2',
    project_code: 'PZ-102',
    project_name: 'لاجون دي باي الساحل',
    project_name_en: 'D-Bay Lagoon',
    status: 'handing_over',
    completion_pct: 100,
    contract_value: 8000000,
    vos_value: 500000,
    total_contract_value: 8500000,
    pm_full_name: 'م. حسام علي',
    client: {
      id: 'client-tm',
      name_ar: 'تطوير مصر',
      name_en: 'Tatweer Misr',
    },
    client_name_raw: 'تطوير مصر',
    estimated_budget: 0,
    estimated_cost: 0,
    water_area_m2: 0,
    water_vol_m3: 0,
    created_at: '2026-01-01',
    updated_at: '2026-01-01',
  },
];

describe('Table Column Freeze (تجميد اسم المشروع)', () => {
  it('renders Freeze toggle and sticky first column in RetentionAndBondsReportModal', () => {
    const html = ReactDOMServer.renderToString(
      <RetentionAndBondsReportModal
        isOpen={true}
        onClose={() => {}}
        projects={mockProjects}
      />
    );

    // Toolbar button for Freeze
    expect(html).toContain('تجميد اسم المشروع');

    // Sticky start-0 styling on header and cells
    expect(html).toContain('sticky start-0');
    expect(html).toContain('كود واسم المشروع');
    expect(html).toContain('PZ-102');
  });

  it('renders Freeze Project Name toggle and pinned name column in ProjectsTable', () => {
    const html = ReactDOMServer.renderToString(
      <ProjectsTable projects={mockProjects} lang="ar" pinColumns={true} />
    );

    // Toolbar button for Freeze Project Name
    expect(html).toContain('تجميد اسم المشروع');

    // Table header and cells with pinned classes
    expect(html).toContain('data-testid="project-name-cell"');
    expect(html).toContain('sticky');
    expect(html).toContain('منتجع فوكا باي لاجون');
  });
});
