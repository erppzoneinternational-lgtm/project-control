import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { KanbanView } from '../ui/KanbanView';
import { Project } from '@/types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    t: (key: string) => key,
  }),
}));

vi.mock('@/lib/hooks/useUserRoles', () => ({
  useUserRoles: () => ({
    roles: ['admin'],
    isAdmin: true,
    isLoading: false,
  }),
}));

const mockProjects: Project[] = [
  {
    id: 'proj-1',
    project_code: '2401',
    project_name: 'مشروع حمام سباحة 1',
    project_name_ar: 'مشروع حمام سباحة 1',
    status: 'working',
    contract_value_egp: 1000000,
    water_area_m2: 500,
  } as Project,
  {
    id: 'proj-2',
    project_code: '2402',
    project_name: 'مشروع بحيرة 2',
    project_name_ar: 'مشروع بحيرة 2',
    status: 'finished',
    contract_value_egp: 2000000,
    water_area_m2: 1200,
  } as Project,
];

describe('KanbanView Tender Column Verification', () => {
  it('renders the Tender (مرحلة العطاء) column as the first core column even when it has 0 projects', () => {
    const html = ReactDOMServer.renderToStaticMarkup(<KanbanView projects={mockProjects} />);

    // Tender column header must exist
    expect(html).toContain('مرحلة العطاء (Tender)');

    // Since mockProjects has 0 tender projects, the column empty state should be rendered
    expect(html).toContain('لا توجد مشاريع بهذه الحالة');
    expect(html).toContain('/projects/new?status=tender');

    // Other populated columns must also render
    expect(html).toContain('قيد التنفيذ (Working)');
    expect(html).toContain('منتهي (Finished)');
  });

  it('renders projects in the Tender column when projects with status=tender exist', () => {
    const projectsWithTender: Project[] = [
      ...mockProjects,
      {
        id: 'proj-tender',
        project_code: '2501',
        project_name_ar: 'مشروع منتجع الجونة المائي - دراسة عطاء',
        status: 'tender',
        contract_value_egp: 15000000,
        water_area_m2: 3500,
        pzone_role: 'main_contractor',
      } as Project,
    ];

    const html = ReactDOMServer.renderToStaticMarkup(<KanbanView projects={projectsWithTender} />);

    expect(html).toContain('مرحلة العطاء (Tender)');
    expect(html).toContain('مشروع منتجع الجونة المائي - دراسة عطاء');
    expect(html).toContain('#2501');
  });

  it('ensures tender column comes first in the DOM structure', () => {
    const html = ReactDOMServer.renderToStaticMarkup(<KanbanView projects={mockProjects} />);

    const tenderIndex = html.indexOf('مرحلة العطاء (Tender)');
    const workingIndex = html.indexOf('قيد التنفيذ (Working)');
    const finishedIndex = html.indexOf('منتهي (Finished)');

    expect(tenderIndex).toBeGreaterThan(-1);
    expect(workingIndex).toBeGreaterThan(-1);
    expect(tenderIndex).toBeLessThan(workingIndex);
    expect(workingIndex).toBeLessThan(finishedIndex);
  });
});
