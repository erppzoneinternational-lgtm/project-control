import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CollectUiDashboardBanner } from '../ui/CollectUiDashboardBanner';

describe('CollectUiDashboardBanner Component (CollectUI Dashboard)', () => {
  it('renders default title, subtitle, and KPI numbers', () => {
    const html = renderToString(
      React.createElement(CollectUiDashboardBanner, {
        totalProjects: 15,
        activeProjects: 9,
        completionRate: 80,
        totalStakeholders: 52,
        locale: 'en',
        dir: 'ltr',
      })
    );
    expect(html).toContain('Dashboard UI Design Inspiration');
    expect(html).toContain('15');
    expect(html).toContain('9');
    expect(html).toContain('80');
    expect(html).toContain('52');
  });

  it('renders Arabic copy and quick links', () => {
    const html = renderToString(
      React.createElement(CollectUiDashboardBanner, {
        totalProjects: 20,
        activeProjects: 12,
        locale: 'ar',
        dir: 'rtl',
      })
    );
    expect(html).toContain('لوحة القيادة والمؤشرات التنفيذية');
    expect(html).toContain('مشروع جديد');
    expect(html).toContain('دليل الشركاء');
  });
});
