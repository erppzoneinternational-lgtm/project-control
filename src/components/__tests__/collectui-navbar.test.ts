import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CollectUiNavBar } from '../ui/CollectUiNavBar';

describe('CollectUiNavBar Component (CollectUI Inspiration)', () => {
  it('renders default brand, navigation links, and active state in LTR mode', () => {
    const html = renderToString(
      React.createElement(CollectUiNavBar, {
        locale: 'en',
        dir: 'ltr',
        activeItemId: 'dashboard',
      })
    );
    expect(html).toContain('Pzone Portal');
    expect(html).toContain('Dashboard');
    expect(html).toContain('Projects');
    expect(html).toContain('Site Workspace');
    expect(html).toContain('New Project');
  });

  it('renders Arabic brand and links in RTL mode', () => {
    const html = renderToString(
      React.createElement(CollectUiNavBar, {
        locale: 'ar',
        dir: 'rtl',
        activeItemId: 'projects',
        secondaryActionLabel: 'دليل الشركاء',
      })
    );
    expect(html).toContain('منظومة Pzone ERP');
    expect(html).toContain('لوحة القيادة');
    expect(html).toContain('المشروعات');
    expect(html).toContain('مشروع جديد');
    expect(html).toContain('دليل الشركاء');
  });
});
