import { describe, it, expect, vi } from 'vitest';
import {
  generateReportCode,
  formatCurrency,
  generatePrintHtml,
  exportReportToExcel,
  exportReportToCsv,
  type ReportColumn,
  type ReportConfig,
  DEFAULT_REPORT_SIGNATURES,
} from '../reportEngine';

interface TestItem {
  id: string;
  code: string;
  name: string;
  amount: number;
  status: string;
}

const testData: TestItem[] = [
  { id: '1', code: 'PZ-001', name: 'مشروع أبراج الساحل', amount: 5000000, status: 'قيد التنفيذ' },
  { id: '2', code: 'PZ-002', name: 'مشروع فندق اللوتس', amount: 12500000, status: 'منتهي' },
];

const testColumns: ReportColumn<TestItem>[] = [
  { id: 'code', labelAr: 'الكود', labelEn: 'Code', getValue: (d) => d.code, defaultVisible: true },
  { id: 'name', labelAr: 'اسم المشروع', labelEn: 'Project Name', getValue: (d) => d.name, defaultVisible: true },
  {
    id: 'amount',
    labelAr: 'القيمة',
    labelEn: 'Amount',
    getValue: (d) => d.amount,
    formatPrint: (d) => formatCurrency(d.amount),
    formatExcel: (d) => d.amount,
    isCurrency: true,
    defaultVisible: true,
  },
  { id: 'status', labelAr: 'الحالة', labelEn: 'Status', getValue: (d) => d.status, defaultVisible: false },
];

const baseConfig: ReportConfig = {
  title: 'تقرير اختبار المشروعات',
  subtitle: 'ملخص تحليلي للمحفظة',
  reportCode: 'PZ-REP-20261008-001',
  orientation: 'landscape',
  paperSize: 'a4',
  fontSize: 'md',
  includeKpis: true,
  includeSignatures: true,
  includeTimestamp: true,
  includePageNumbers: true,
  selectedColumnIds: ['code', 'name', 'amount'],
  signatures: DEFAULT_REPORT_SIGNATURES,
  generatedBy: 'م. حسن سليمان',
  notes: 'توجيهات مهمة بشأن سرعة استرداد محجوز الضمان',
};

describe('reportEngine', () => {
  it('generates consistent report codes and formats currency', () => {
    const code = generateReportCode('PZ-TEST');
    expect(code).toMatch(/^PZ-TEST-\d{8}-\d{3}$/);

    expect(formatCurrency(1500000)).toBe('1,500,000.00 EGP');
    expect(formatCurrency(0)).toBe('0.00 EGP');
    expect(formatCurrency(null)).toBe('0.00 EGP');
  });

  it('generates comprehensive print HTML with letterhead, notes, table, and signatures', () => {
    const kpis = [
      { id: 'kpi-1', label: 'إجمالي المشروعات', value: 2, tone: 'emerald' as const },
      { id: 'kpi-2', label: 'إجمالي القيمة التعاقدية', value: '17,500,000 EGP', tone: 'amber' as const },
    ];

    const html = generatePrintHtml(baseConfig, testColumns, testData, kpis);

    // Verify Title & Letterhead
    expect(html).toContain('تقرير اختبار المشروعات');
    expect(html).toContain('PZ-REP-20261008-001');
    expect(html).toContain('شركة بي زون التجارية');
    expect(html).toContain('P.Zone International');
    expect(html).not.toContain('او P.Zone');
    expect(html).not.toContain('أو P.Zone');
    expect(html).not.toContain('التجارية او');
    expect(html).not.toContain('التجارية أو');
    expect(html).toContain('م. حسن سليمان');

    // Verify KPIs
    expect(html).toContain('إجمالي المشروعات');
    expect(html).toContain('17,500,000 EGP');

    // Verify Notes
    expect(html).toContain('توجيهات مهمة بشأن سرعة استرداد محجوز الضمان');

    // Verify Table Headers & Data
    expect(html).toContain('الكود');
    expect(html).toContain('Project Name');
    expect(html).toContain('مشروع أبراج الساحل');
    expect(html).toContain('5,000,000.00 EGP');

    // Verify Tfoot Total Value Row
    expect(html).toContain('Total value');
    expect(html).toContain('الإجمالي العام');
    expect(html).toContain('17,500,000.00 EGP');

    // Verify Signatures
    expect(html).toContain('مهندس التخطيط وضبط المشروعات');
    expect(html).toContain('مدير عام المشروعات (PMO)');
  });

  it('exports valid Excel workbook with RTL and headers', () => {
    const kpis = [{ id: 'kpi-1', label: 'إجمالي المشروعات', value: 2 }];
    expect(() => {
      exportReportToExcel(baseConfig, testColumns, testData, kpis);
    }).not.toThrow();
  });

  it('exports valid CSV with UTF-8 BOM', () => {
    expect(() => {
      exportReportToCsv(baseConfig, testColumns, testData);
    }).not.toThrow();
  });
});
