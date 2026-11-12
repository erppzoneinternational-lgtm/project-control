import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CollectUiAnalyticsCard } from '../ui/CollectUiAnalyticsCard';

describe('CollectUiAnalyticsCard Component (CollectUI Inspiration)', () => {
  it('renders default title, metric, and rows in LTR mode', () => {
    const html = renderToString(
      React.createElement(CollectUiAnalyticsCard, {
        locale: 'en',
        dir: 'ltr',
        theme: 'dark',
      })
    );
    expect(html).toContain('Field Performance &amp; BOQ Analytics');
    expect(html).toContain('84.6%');
    expect(html).toContain('Reinforced Concrete Foundations');
    expect(html).toContain('CON-001');
    expect(html).toContain('2,400 m³');
  });

  it('renders Arabic title, metric, and categories in RTL mode', () => {
    const html = renderToString(
      React.createElement(CollectUiAnalyticsCard, {
        locale: 'ar',
        dir: 'rtl',
        theme: 'light',
      })
    );
    expect(html).toContain('تحليلات الأداء الميداني وجدول الكميات');
    expect(html).toContain('أعمال الخرسانة المسلحة للأساسات');
    expect(html).toContain('هندسة مدنية');
    expect(html).toContain('مكتمل');
  });
});
