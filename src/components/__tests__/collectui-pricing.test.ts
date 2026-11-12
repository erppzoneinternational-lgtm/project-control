import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CollectUiPricingCard } from '../ui/CollectUiPricingCard';

describe('CollectUiPricingCard Component (CollectUI Inspiration)', () => {
  it('renders default title, subtitle, and pricing tiers in LTR mode', () => {
    const html = renderToString(
      React.createElement(CollectUiPricingCard, {
        locale: 'en',
        dir: 'ltr',
      })
    );
    expect(html).toContain('Engineering Contracts &amp; Pricing Plans');
    expect(html).toContain('Site Field Edition');
    expect(html).toContain('Enterprise Turnkey');
    expect(html).toContain('Megaproject Joint Venture');
    expect(html).toContain('$490');
    expect(html).toContain('$1,290');
  });

  it('renders Arabic copy and contract plans in RTL mode', () => {
    const html = renderToString(
      React.createElement(CollectUiPricingCard, {
        locale: 'ar',
        dir: 'rtl',
        title: 'باقات التعاقدات الهندسية المعتمدة',
      })
    );
    expect(html).toContain('باقات التعاقدات الهندسية المعتمدة');
    expect(html).toContain('باقة الموقع الميداني');
    expect(html).toContain('باقة إدارة المشروعات الكبرى');
    expect(html).toContain('15,000 ج.م');
    expect(html).toContain('38,000 ج.م');
  });
});
