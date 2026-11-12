import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { PmActionCenter, PmActionItem } from '../views/PmActionCenter';

describe('PmActionCenter Component Audit & Enhancements', () => {
  it('1. Renders all 6 core construction obligations (including WIR & Submittals)', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <PmActionCenter
        pendingReportsCount={3}
        pendingTasksCount={5}
        pendingInspectionsCount={4}
        pendingSubmittalsCount={2}
        overdueCount={1}
        weeklyReportReady={true}
        onFilterAction={() => {}}
      />
    );

    // Should include inspection requests & submittals titles
    expect(html).toContain('مراجعة 3 تقارير يومية');
    expect(html).toContain('اعتماد 5 مهام موقعية مكتملة');
    expect(html).toContain('متابعة 4 طلبات فحص واستلام (WIR / MIR)');
    expect(html).toContain('اعتماد 2 مخططات وعينات مواد (Submittals)');
    expect(html).toContain('1 مهام متأخرة تحتاج تصعيد');
    expect(html).toContain('تقرير أسبوعي تنفيذي للمشروع');

    // Should include badges
    expect(html).toContain('4 بانتظار الإجراء');
    expect(html).toContain('2 تتطلب موافقة');
  });

  it('2. Calculates total pending items and critical badge with flame beacon', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <PmActionCenter
        pendingReportsCount={2}
        pendingTasksCount={1}
        pendingInspectionsCount={3}
        pendingSubmittalsCount={1}
        overdueCount={2}
        weeklyReportReady={true}
        onFilterAction={() => {}}
      />
    );

    // Total pending = 2 + 1 + 3 + 1 + 2 + 1 = 10
    expect(html).toContain('10 معلق (2 حرج ⚡)');
    expect(html).toContain('animate-pulse');
  });

  it('3. Renders Quick Decision Workbench with RTL approve/reject buttons and ARIA labels', () => {
    const urgentItems: PmActionItem[] = [
      {
        id: 'test-wir-1',
        type: 'inspection',
        typeLabelAr: 'طلب فحص (WIR)',
        code: 'WIR-2026-099',
        title: 'استلام صب خرسانة الأساسات',
        urgency: 'critical',
        dueTimeText: 'متبقي 30 دقيقة',
        projectTitle: 'أبراج النخيل',
        submittedBy: 'م. سالم',
        requiresReasonOnReject: true,
      },
    ];

    const html = ReactDOMServer.renderToStaticMarkup(
      <PmActionCenter
        pendingReportsCount={0}
        pendingTasksCount={0}
        overdueCount={0}
        urgentItems={urgentItems}
        onFilterAction={() => {}}
      />
    );

    // Check urgency indicator
    expect(html).toContain('WIR-2026-099');
    expect(html).toContain('أولوية قصوى / حرج');
    expect(html).toContain('aria-label="مستوى الإلحاح: أولوية قصوى / حرج"');

    // Check RTL quick action buttons with accessible labels
    expect(html).toContain('اعتماد سريع');
    expect(html).toContain('aria-label="اعتماد سريع لطلب WIR-2026-099"');
    expect(html).toContain('طلب تعديل / رفض');
    expect(html).toContain('aria-label="رفض أو طلب تعديل لطلب WIR-2026-099"');
  });

  it('4. Correctly renders collapsed bar with all 6 categories when collapsed', () => {
    const html = ReactDOMServer.renderToStaticMarkup(
      <PmActionCenter
        pendingReportsCount={4}
        pendingTasksCount={3}
        pendingInspectionsCount={2}
        pendingSubmittalsCount={5}
        overdueCount={1}
        weeklyReportReady={true}
        initialCollapsed={true}
        onFilterAction={() => {}}
      />
    );

    expect(html).toContain('4 تقارير');
    expect(html).toContain('3 مهام');
    expect(html).toContain('2 فحص WIR');
    expect(html).toContain('5 اعتمادات');
    expect(html).toContain('1 متأخرة');
    expect(html).toContain('تقرير أسبوعي جاهز');
    expect(html).toContain('عرض التفاصيل');
  });

  it('5. Renders completion percentage progress bar with accessible role and attributes', () => {
    // 3 obligations met out of 6 (reports=0, tasks=0, inspections=0) => 50%
    const html = ReactDOMServer.renderToStaticMarkup(
      <PmActionCenter
        pendingReportsCount={0}
        pendingTasksCount={0}
        pendingInspectionsCount={0}
        pendingSubmittalsCount={2}
        overdueCount={1}
        weeklyReportReady={false}
        onFilterAction={() => {}}
      />
    );

    expect(html).toContain('اكتمال الالتزامات: 50%');
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="50"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
  });
});
