import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ContractTab } from '../ContractTab';
import { Project } from '@/types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({ locale: 'ar', t: (k: string) => k }),
}));

vi.mock('@/lib/hooks/useUserRoles', () => ({
  useUserRoles: () => ({
    roles: ['admin'],
    isAdmin: true,
    isLoading: false,
  }),
}));

describe('ContractTab', () => {
  const dummyProject: Project = {
    id: 'proj-1',
    project_code: 'PZ-001',
    project_name: 'مشروع حمام السباحة',
    client_name: 'أوراسكوم',
    contract_value: 5000000,
    status: 'working',
    created_at: '2026-09-30T12:22:22.720907+00:00',
    metadata: {
      retention_pct: 10,
      advance_payment_pct: 15,
      performance_bond_pct: 5,
    },
  } as unknown as Project;

  it('instantiates ContractTab as a valid React element', () => {
    const el = React.createElement(ContractTab, { project: dummyProject });
    expect(React.isValidElement(el)).toBe(true);
    expect(el.props.project.id).toBe('proj-1');
  });

  it('accepts onProjectUpdate callback and edge case project data', () => {
    const onUpdate = () => {};
    const minimalProject = { id: 'p-min', project_code: 'P-0' } as unknown as Project;
    const el = React.createElement(ContractTab, { project: minimalProject, onProjectUpdate: onUpdate });
    expect(React.isValidElement(el)).toBe(true);
    expect(el.props.onProjectUpdate).toBe(onUpdate);
  });

  it('displays unified company name (بي زون التجارية / P.Zone International), hides leaked created_at timestamps, and renders Contracts Engineer alert when dates are missing', () => {
    const leakedTimestampProject: Project = {
      id: 'proj-leak',
      project_code: 'PZ-2026-885',
      project_name: 'مشروع تجريبي',
      client_name_ar: 'شركة إعمار مصر',
      contract_value: 15000000,
      created_at: '2026-09-30T12:22:22.720907+00:00',
      start_date: '2026-09-30T12:22:22.720907+00:00',
      metadata: {},
    } as unknown as Project;

    const html = renderToStaticMarkup(<ContractTab project={leakedTimestampProject} />);

    // Unified company name
    expect(html).toContain('بي زون التجارية (P.Zone International)');
    expect(html).not.toContain('Pzone International Project Control');
    expect(html).not.toContain('شركة بي زون الدولية لإدارة المشروعات');

    // Never leak raw created_at ISO timestamp as a contract date
    expect(html).not.toContain('2026-09-30T12:22:22.720907+00:00');

    // Shows Contracts Engineer verification alert banner
    expect(html).toContain('تنبيه لمهندس العقود: مطلوب متابعة التواريخ التعاقدية والتأكيد على صحتها');
    expect(html).toContain('إرسال تنبيه متابعة لمهندس العقود');
    expect(html).toContain('شركة إعمار مصر');
  });
});
