import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { SnagListTrackingBoard, SnagItem } from '@/components/projects/SnagListTrackingBoard';
import { Project } from '@/types';

vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    dir: 'rtl',
    t: (k: string) => k,
  }),
}));

describe('SnagListTrackingBoard (Punch-List & DLP Warranty Board)', () => {
  const customSnags: SnagItem[] = [
    {
      id: 'sng-t1',
      code: 'SNG-101',
      discipline: 'mechanical',
      location: 'غرفة المحابس الرئيسية',
      descriptionAr: 'معالجة تسريب محبس السحب الرئيسي للفلتر رقم 1',
      priority: 'high',
      status: 'open',
      targetDate: '2026-10-20',
      assignedTo: 'م. حسام الدين',
    },
    {
      id: 'sng-t2',
      code: 'SNG-102',
      discipline: 'electrical',
      location: 'اللوحة الفرعية للإنارة الغاطسة',
      descriptionAr: 'استبدال فيوز قاطع الحماية التفاضلية 30mA',
      priority: 'critical',
      status: 'verified',
      targetDate: '2026-10-05',
      resolvedDate: '2026-10-04',
      assignedTo: 'م. كريم سامي',
    },
  ];

  const projectWithSnags: Project = {
    id: 'proj-snags-001',
    project_name: 'مشروع لاندسكيب وحمام سباحة زايد',
    contract_value: 3500000,
    status: 'handing_over',
    metadata: {
      handover_checklist: {
        dlp_start_date: '2026-09-01',
        snag_clearance_days: 14,
      },
      snags_dlp: customSnags,
    },
  } as unknown as Project;

  it('renders DLP warranty progress section and countdown', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <SnagListTrackingBoard project={projectWithSnags} />
    );

    expect(html).toContain('متابعة فترة ضمان العيوب التعاقدية');
    expect(html).toContain('365 يوماً');
    expect(html).toContain('تاريخ البدء: 2026-09-01');
  });

  it('displays accurate snag metric counters', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <SnagListTrackingBoard project={projectWithSnags} />
    );

    expect(html).toContain('إجمالي الملاحظات');
    expect(html).toContain('مفتوحة قيد التلافي');
    expect(html).toContain('معتمدة ومغلقة');
    expect(html).toContain('50%'); // 1 out of 2 closed = 50%
  });

  it('renders snag list items with codes, descriptions, and disciplines', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <SnagListTrackingBoard project={projectWithSnags} />
    );

    expect(html).toContain('SNG-101');
    expect(html).toContain('معالجة تسريب محبس السحب الرئيسي للفلتر رقم 1');
    expect(html).toContain('غرفة المحابس الرئيسية');
    expect(html).toContain('م. حسام الدين');

    expect(html).toContain('SNG-102');
    expect(html).toContain('استبدال فيوز قاطع الحماية التفاضلية 30mA');
    expect(html).toContain('معتمد ومغلق');
  });

  it('renders search and filter controls and add button', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <SnagListTrackingBoard project={projectWithSnags} />
    );

    expect(html).toContain('بحث بالكود أو التوصيف أو الموقع');
    expect(html).toContain('جميع التخصصات');
    expect(html).toContain('جميع الحالات');
    expect(html).toContain('إضافة ملاحظة');
  });
});
