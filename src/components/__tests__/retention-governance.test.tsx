import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { RetentionReleaseGovernanceCard } from '@/components/contracts/RetentionReleaseGovernanceCard';
import { Project } from '@/types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    dir: 'rtl',
    t: (k: string) => k,
  }),
}));

describe('RetentionReleaseGovernanceCard (FIDIC Sub-Clause 14.9)', () => {
  const eligibleProject: Project = {
    id: 'proj-ret-001',
    project_name: 'مشروع حمام السباحة الأولمبي',
    contract_value: 4000000,
    vos_value: 1000000,
    total_contract_value: 5000000,
    status: 'handing_over',
    toc_letter: 'TOC-CONFIRMED',
    metadata: {
      retention_rate_pct: 5,
      handover_checklist: {
        toc_received: true,
        dlp_start_date: '2026-01-01',
      },
    },
  } as unknown as Project;

  it('renders FIDIC 14.9 retention governance card and header', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <RetentionReleaseGovernanceCard project={eligibleProject} />
    );

    expect(html).toContain('حوكمة صرف محجوز ضمان حسن التنفيذ');
    expect(html).toContain('FIDIC Sub-Clause 14.9');
    expect(html).toContain('الدفعة الأولى: 50% عند الاستلام الابتدائي');
    expect(html).toContain('الدفعة الثانية: 50% عند الاستلام النهائي');
  });

  it('computes 5% retention and 50%/50% tranche splits accurately', () => {
    // Total Contract: 5,000,000 EGP
    // 5% Retention = 250,000 EGP
    // Tranche 1 = 125,000 EGP
    // Tranche 2 = 125,000 EGP
    const html = ReactDOMServer.renderToStaticMarkup(
      <RetentionReleaseGovernanceCard project={eligibleProject} />
    );

    expect(html).toContain('5,000,000');
    expect(html).toContain('250,000');
    expect(html).toContain('125,000');
  });

  it('recognizes Tranche 1 as eligible when project is in handover with TOC', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <RetentionReleaseGovernanceCard project={eligibleProject} />
    );

    expect(html).toContain('مستحق الصرف تعاقدياً');
    expect(html).toContain('اعتماد وصرف 50%');
  });

  it('blocks Tranche 1 when project is still working and TOC is missing', () => {
    const workingProject: Project = {
      id: 'proj-ret-002',
      contract_value: 2000000,
      total_contract_value: 2000000,
      status: 'working',
      toc_letter: undefined,
      metadata: {},
    } as unknown as Project;

    const html = ReactDOMServer.renderToStaticMarkup(
      <RetentionReleaseGovernanceCard project={workingProject} />
    );

    expect(html).toContain('معلق بانتظار استيفاء TOC');
  });

  it('displays paid badge when tranches are marked released in metadata', () => {
    const releasedProject: Project = {
      ...eligibleProject,
      metadata: {
        ...eligibleProject.metadata,
        retention_tranche_1_released: true,
        retention_tranche_2_released: true,
      },
    } as unknown as Project;

    const html = ReactDOMServer.renderToStaticMarkup(
      <RetentionReleaseGovernanceCard project={releasedProject} />
    );

    expect(html).toContain('تم صرف الدفعة');
    expect(html).toContain('تم صرف الدفعة النهائية');
    expect(html).toContain('100% تم الإفراج عنه');
  });
});
