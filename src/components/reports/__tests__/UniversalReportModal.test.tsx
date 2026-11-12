import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { UniversalReportModal } from '../UniversalReportModal';
import { ReportColumn, ReportKpiCard } from '@/lib/reports/reportEngine';

// Mock Sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock Auth
vi.mock('@/lib/stores/useAuthStore', () => ({
  useAuth: () => ({
    user: { email: 'engineer@pzone.com', user_metadata: { full_name: 'م. حسن سليمان' } },
  }),
}));

interface SampleItem {
  id: string;
  code: string;
  name: string;
  cost: number;
}

const mockData: SampleItem[] = [
  { id: '1', code: 'PZ-101', name: 'مشروع الممشى السياحي', cost: 8000000 },
  { id: '2', code: 'PZ-102', name: 'مشروع حديقة الأندلس', cost: 15000000 },
];

const mockColumns: ReportColumn<SampleItem>[] = [
  { id: 'code', labelAr: 'كود المشروع', labelEn: 'Code', getValue: (d) => d.code, defaultVisible: true },
  { id: 'name', labelAr: 'اسم المشروع', labelEn: 'Name', getValue: (d) => d.name, defaultVisible: true },
  { id: 'cost', labelAr: 'التكلفة الإجمالية', labelEn: 'Cost', getValue: (d) => d.cost, defaultVisible: false },
];

const mockKpis: ReportKpiCard[] = [
  { id: 'k1', label: 'إجمالي المشروعات', value: 2, tone: 'default' },
  { id: 'k2', label: 'التكلفة الإجمالية', value: '23,000,000 EGP', tone: 'emerald' },
];

describe('UniversalReportModal', () => {
  it('returns null when isOpen is false', () => {
    const html = ReactDOMServer.renderToString(
      <UniversalReportModal
        isOpen={false}
        onClose={vi.fn()}
        columns={mockColumns}
        data={mockData}
      />
    );
    expect(html).toBe('');
  });

  it('renders modal dialog with studio header, columns, and export buttons when isOpen is true', () => {
    const html = ReactDOMServer.renderToString(
      <UniversalReportModal
        isOpen={true}
        onClose={vi.fn()}
        defaultTitle="تقرير مخصص للتحقق"
        defaultDocCode="PZ-TST-001"
        columns={mockColumns}
        data={mockData}
        kpis={mockKpis}
      />
    );

    expect(html).toContain('استوديو تخصيص وتصدير التقارير الرسمية');
    expect(html).toContain('كود المشروع');
    expect(html).toContain('اسم المشروع');
    expect(html).toContain('تصدير Excel (.xlsx)');
    expect(html).toContain('معاينة وطباعة / PDF');
    expect(html).toContain('تصدير CSV');
  });

  it('renders tabs navigation correctly', () => {
    const html = ReactDOMServer.renderToString(
      <UniversalReportModal
        isOpen={true}
        onClose={vi.fn()}
        defaultTitle="تقرير المشروعات"
        columns={mockColumns}
        data={mockData}
        kpis={mockKpis}
      />
    );

    expect(html).toContain('الأعمدة والحقول');
    expect(html).toContain('الترويسة والملاحظات');
    expect(html).toContain('تنسيق الصفحة والإخراج');
    expect(html).toContain('التوقيعات والاعتماد');
  });
});
