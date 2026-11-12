import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CollectUi404Card } from '../ui/CollectUi404Card';

describe('CollectUi404Card Component (CollectUI Design System)', () => {
  it('renders 404 code and hero section', () => {
    const html = renderToString(
      React.createElement(CollectUi404Card, {
        locale: 'en',
        dir: 'ltr',
      })
    );
    expect(html).toContain('404');
    expect(html).toContain('404 Page UI Design Inspiration');
    expect(html).toContain('Return Home');
  });

  it('renders Arabic default copy and quick links', () => {
    const html = renderToString(
      React.createElement(CollectUi404Card, {
        locale: 'ar',
        dir: 'rtl',
      })
    );
    expect(html).toContain('الصفحة المطلوبة غير متوفرة');
    expect(html).toContain('العودة للرئيسية');
    expect(html).toContain('دليل المشروعات');
  });
});
