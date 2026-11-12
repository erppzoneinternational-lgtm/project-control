import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { BoqContractReconciliationBanner } from '../planning/BoqContractReconciliationBanner';
import { BoqContractReconciliationReport } from '@/lib/utils/boq-cost-control.utils';
import { Project } from '@/types';

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe('BoqContractReconciliationBanner (Server Render Tests)', () => {
  const mockProject: Project = {
    id: 'proj-001',
    project_name: 'مشروع برج الأمل',
    project_code: 'AML-01',
    contract_value: 5000000,
    vos_value: 500000,
    total_contract_value: 5500000,
    estimated_budget: 5000000,
    estimated_cost: 4500000,
    water_area_m2: 0,
    water_vol_m3: 0,
    completion_pct: 50,
    status: 'working',
    created_at: '',
    updated_at: '',
  };

  it('renders reconciled banner when is_matched is true', () => {
    const report: BoqContractReconciliationReport = {
      contract_original_value: 5000000,
      vos_net_value: 500000,
      revised_contract_value: 5500000,
      boq_original_total: 5000000,
      boq_revised_total: 5500000,
      variance: 0,
      is_matched: true,
      status: 'matched',
      alert_message_ar: 'المقايسة التعاقدية متطابقة بالكامل مع القيمة الختامية للعقد.',
      alert_message_en: 'BOQ is fully reconciled.',
      items_count: 50,
      vo_items_count: 5,
    };

    const html = ReactDOMServer.renderToString(
      <BoqContractReconciliationBanner
        reconciliation={report}
        project={mockProject}
        isCostControlView={false}
        onToggleCostControlView={vi.fn()}
      />
    );

    expect(html).toContain('موقف مطابقة المقايسة مع القيمة الختامية للعقد');
    expect(html).toContain('متطابقة 100%');
    expect(html).toContain('إدارة أوامر التغيير');
    expect(html).toContain('أعمدة التحكم بالتكاليف');
    expect(html).toContain('/projects/proj-001?tab=vos');
  });

  it('renders warning alert and variance badge when is_matched is false (variance)', () => {
    const report: BoqContractReconciliationReport = {
      contract_original_value: 5000000,
      vos_net_value: 500000,
      revised_contract_value: 5500000,
      boq_original_total: 5000000,
      boq_revised_total: 6000000,
      variance: 500000,
      is_matched: false,
      status: 'boq_exceeds',
      alert_message_ar: 'تنبيه تحكم التكاليف: إجمالي المقايسة يتجاوز القيمة التعاقدية.',
      alert_message_en: 'Cost Control Alert: Current BOQ total exceeds approved contract value.',
      items_count: 50,
      vo_items_count: 5,
    };

    const html = ReactDOMServer.renderToString(
      <BoqContractReconciliationBanner
        reconciliation={report}
        project={mockProject}
        isCostControlView={true}
        onToggleCostControlView={vi.fn()}
      />
    );

    expect(html).toContain('تنبيه: فارق');
    expect(html).toContain('يتجاوز');
    expect(html).toContain('إخفاء مسار التحكم بالتكاليف');
  });

  it('renders nothing when project is null', () => {
    const report: BoqContractReconciliationReport = {
      contract_original_value: 0,
      vos_net_value: 0,
      revised_contract_value: 0,
      boq_original_total: 0,
      boq_revised_total: 0,
      variance: 0,
      is_matched: true,
      status: 'matched',
      alert_message_ar: '',
      alert_message_en: '',
      items_count: 0,
      vo_items_count: 0,
    };

    const html = ReactDOMServer.renderToString(
      <BoqContractReconciliationBanner
        reconciliation={report}
        project={null}
        isCostControlView={false}
        onToggleCostControlView={vi.fn()}
      />
    );

    expect(html).toBe('');
  });
});
