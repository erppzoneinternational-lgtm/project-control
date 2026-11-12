import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CollectUiCtaBanner } from '../ui/CollectUiCtaBanner';

describe('CollectUiCtaBanner Component (CollectUI Inspiration)', () => {
  it('renders default Arabic content with features and badge in RTL mode', () => {
    const html = renderToString(
      React.createElement(CollectUiCtaBanner, {
        locale: 'ar',
        dir: 'rtl',
        theme: 'dark',
      })
    );

    expect(html).toContain('عزز كفاءة التحكم في عقود ومشاريع التشييد الكبرى');
    expect(html).toContain('معتمد وموثوق من استشاريي إدارة المشاريع');
    expect(html).toContain('ربط WBS والكميات');
    expect(html).toContain('تكامل 100% مع BOQ');
    expect(html).toContain('ابدأ التشغيل المعتمد');
  });

  it('renders English content when locale is en and custom props', () => {
    const html = renderToString(
      React.createElement(CollectUiCtaBanner, {
        locale: 'en',
        dir: 'ltr',
        theme: 'light',
        title: 'Custom Enterprise Banner',
        badgeText: 'Verified Partner',
        primaryCtaText: 'Get Started Now',
      })
    );

    expect(html).toContain('Custom Enterprise Banner');
    expect(html).toContain('Verified Partner');
    expect(html).toContain('Get Started Now');
    expect(html).toContain('WBS &amp; BOQ Synergy');
  });
});
