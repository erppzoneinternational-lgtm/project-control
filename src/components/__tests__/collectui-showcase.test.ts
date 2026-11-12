import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CollectUiShowcaseCard } from '../ui/CollectUiShowcaseCard';

describe('CollectUiShowcaseCard Component (CollectUI Inspiration)', () => {
  it('renders default Arabic values with category, author and metrics in RTL mode', () => {
    const html = renderToString(
      React.createElement(CollectUiShowcaseCard, {
        locale: 'ar',
        dir: 'rtl',
        theme: 'dark',
      })
    );

    expect(html).toContain('هندسة إنشائية');
    expect(html).toContain('أعمال صب الخرسانة المسلحة');
    expect(html).toContain('م. فاروق السعيد');
    expect(html).toContain('معتمد 100%');
    expect(html).toContain('2,850 م³');
  });

  it('renders English custom props in LTR mode', () => {
    const html = renderToString(
      React.createElement(CollectUiShowcaseCard, {
        locale: 'en',
        dir: 'ltr',
        theme: 'light',
        title: 'Excavation Phase 2',
        category: 'Earthworks',
        authorName: 'Eng. Sarah',
        metricsValue: '12,000 m³',
        statusBadge: 'In Progress',
      })
    );

    expect(html).toContain('Excavation Phase 2');
    expect(html).toContain('Earthworks');
    expect(html).toContain('Eng. Sarah');
    expect(html).toContain('12,000 m³');
    expect(html).toContain('In Progress');
  });
});
