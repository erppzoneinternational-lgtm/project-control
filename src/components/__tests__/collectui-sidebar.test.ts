import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CollectUiSidebar } from '../ui/CollectUiSidebar';

describe('CollectUiSidebar Component (CollectUI Inspiration)', () => {
  it('renders default Arabic sections and items in RTL mode', () => {
    const html = renderToString(
      React.createElement(CollectUiSidebar, {
        locale: 'ar',
        dir: 'rtl',
        theme: 'dark',
        activeItemId: 'dashboard',
      })
    );

    expect(html).toContain('الرئيسية والمشاريع');
    expect(html).toContain('لوحة المؤشرات العامة');
    expect(html).toContain('جداول الكميات والتسعير');
    expect(html).toContain('منصة مهندس الموقع');
    expect(html).toContain('بحث في الأقسام والمشاريع...');
  });

  it('renders English custom navigation sections in LTR mode', () => {
    const customSections = [
      {
        id: 'c1',
        title: 'Contract Management',
        items: [
          { id: 'submittals', label: 'Material Submittals', count: 42 },
          { id: 'rfis', label: 'RFIs & Clarifications', count: 7 },
        ],
      },
    ];

    const html = renderToString(
      React.createElement(CollectUiSidebar, {
        locale: 'en',
        dir: 'ltr',
        theme: 'light',
        sections: customSections,
        activeItemId: 'submittals',
      })
    );

    expect(html).toContain('Contract Management');
    expect(html).toContain('Material Submittals');
    expect(html).toContain('42');
    expect(html).toContain('RFIs &amp; Clarifications');
  });
});
