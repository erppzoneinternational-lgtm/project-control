import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { FinishProjectCloseoutModal } from '@/components/projects/FinishProjectCloseoutModal';
import { ContractDetailDrawer, ContractDetailData } from '@/components/contracts/ContractDetailDrawer';
import { Project } from '@/types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    dir: 'rtl',
    t: (k: string) => k,
  }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe('Project Closeout Governance & Contract Workspace Gate (حوكمة إنهاء المشروع واسترداد الضمانات)', () => {
  const sampleProject: Project = {
    id: 'proj-closeout-test',
    project_code: 'P-9922',
    project_name: 'مشروع إنشاء شبكة ري وبحيرة صناعية',
    name_ar: 'مشروع إنشاء شبكة ري وبحيرة صناعية',
    name_en: 'Irrigation & Lake Project',
    status: 'handing_over',
    created_at: '2025-01-01',
    updated_at: '2025-01-01',
    contract_value: 8_000_000,
    vos_value: 1_000_000,
    total_contract_value: 9_000_000,
    estimated_budget: 8_000_000,
    estimated_cost: 7_200_000,
    water_area_m2: 1200,
    water_vol_m3: 3000,
    completion_pct: 100,
    actual_finish_date: '2025-05-01',
    toc_letter: 'TOC-APPROVED-REF',
    metadata: {
      retention_pct: 5,
      has_performance_bond: true,
      performance_bond_pct: 5,
      performance_bond_number: 'PB-EG-2025-99',
      performance_bond_bank: 'بنك مصر',
      handover_checklist: {
        toc_received: true,
        handover_at: '2025-05-01',
        snags_count: 0,
        as_built_submitted: true,
        om_manuals_submitted: true,
        testing_commissioning_passed: true,
      },
    },
  };

  const sampleContractData: ContractDetailData = {
    id: 'contract-p9922',
    projectId: 'proj-closeout-test',
    projectCode: 'P-9922',
    projectName: 'مشروع إنشاء شبكة ري وبحيرة صناعية',
    clientName: 'شركة إعمار مصر',
    status: 'handing_over',
    contractNumber: 'CONT-2024-099',
    originalValue: 8_000_000,
    vosValue: 1_000_000,
    totalValue: 9_000_000,
    retentionPct: 5,
    retentionValue: 450_000,
    advancePaymentPct: 10,
    advancePaymentValue: 800_000,
    performanceBondPct: 5,
    performanceBondValue: 400_000,
    currency: 'EGP',
    fidicType: 'FIDIC Red Book 1999',
  };

  it('renders FinishProjectCloseoutModal with all 4 governance pillars', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <FinishProjectCloseoutModal
        isOpen={true}
        onClose={() => {}}
        onConfirmCloseout={async () => {}}
        project={sampleProject}
      />
    );

    // Modal Header and title
    expect(html).toContain('بوابة الإغلاق التعاقدي والتسليم النهائي للمشروع');
    expect(html).toContain('P-9922');

    // Pillar 1: Handover
    expect(html).toContain('1. استيفاء متطلبات مرحلة التسليم الابتدائي (TOC Gate)');

    // Pillar 2: Retention
    expect(html).toContain('2. استلام وتصفية محتجز الضمان (Retention Collection)');
    expect(html).toContain('الشريحة الأولى (50% عند التسليم الابتدائي TOC)');
    expect(html).toContain('الشريحة الثانية (50% بعد انتهاء فترة الضمان DLP)');

    // Pillar 3: Guarantees & Checks
    expect(html).toContain('3. قفل واسترداد خطابات الضمان والشيكات البنكية (LGs &amp; Checks)');
    expect(html).toContain('خطاب ضمان حسن التنفيذ');

    // Pillar 4: Final Settlement & Discharge
    expect(html).toContain('4. المخالصة النهائية وإبراء الذمة (Final Settlement &amp; Discharge)');
  });

  it('renders ContractDetailDrawer with dedicated Closeout & Guarantees Retrieval section', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <ContractDetailDrawer
        isOpen={true}
        onClose={() => {}}
        contract={sampleContractData}
        project={sampleProject}
        isAr={true}
      />
    );

    // Verify presence of closeout control card in Contract Workspace
    expect(html).toContain('حوكمة استرداد الضمانات والإغلاق التعاقدي');
    expect(html).toContain('Closeout Gate');
    expect(html).toContain('فترة مرور عام من تاريخ الاستلام الابتدائي');
  });

  it('displays correct retention breakdown in Closeout Modal', () => {
    // 5% of 9,000,000 = 450,000 EGP total retention
    // 50% = 225,000 EGP Tranche 1
    // 50% = 225,000 EGP Tranche 2
    const html = ReactDOMServer.renderToStaticMarkup(
      <FinishProjectCloseoutModal
        isOpen={true}
        onClose={() => {}}
        onConfirmCloseout={async () => {}}
        project={sampleProject}
      />
    );

    expect(html).toContain('450,000');
    expect(html).toContain('225,000');
  });
});
