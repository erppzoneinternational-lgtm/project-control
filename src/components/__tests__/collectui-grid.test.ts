import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CollectUiDashboardGrid } from '../ui/CollectUiDashboardGrid';

describe('CollectUiDashboardGrid Component (CollectUI Inspiration)', () => {
  it('renders default title, subtitle, and cards in LTR mode', () => {
    const html = renderToString(
      React.createElement(CollectUiDashboardGrid, {
        locale: 'en',
        dir: 'ltr',
      })
    );
    expect(html).toContain('Dashboard UI Design Inspiration');
    expect(html).toContain('Cumulative Progress');
    expect(html).toContain('Cash Flow &amp; IPC Claims');
    expect(html).toContain('74.2%');
    expect(html).toContain('42.8M');
  });

  it('renders Arabic copy and custom cards in RTL mode', () => {
    const html = renderToString(
      React.createElement(CollectUiDashboardGrid, {
        locale: 'ar',
        dir: 'rtl',
        title: 'مؤشرات المشروعات الهندسية',
      })
    );
    expect(html).toContain('مؤشرات المشروعات الهندسية');
    expect(html).toContain('نسبة الإنجاز التراكمي');
    expect(html).toContain('سجل الإنجاز');
  });
});
