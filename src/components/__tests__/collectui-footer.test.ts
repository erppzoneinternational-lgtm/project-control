import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CollectUiFooter } from '../ui/CollectUiFooter';

describe('CollectUiFooter Component (CollectUI Inspiration)', () => {
  it('renders brand, tagline, and links in LTR mode', () => {
    const html = renderToString(
      React.createElement(CollectUiFooter, {
        locale: 'en',
        dir: 'ltr',
      })
    );
    expect(html).toContain('Pzone ERP Portal');
    expect(html).toContain('Projects &amp; Contracts');
    expect(html).toContain('Controls &amp; Planning');
    expect(html).toContain('PostgreSQL 16 Cloud Engine Online');
  });

  it('renders Arabic brand, columns, and copyright in RTL mode', () => {
    const html = renderToString(
      React.createElement(CollectUiFooter, {
        locale: 'ar',
        dir: 'rtl',
      })
    );
    expect(html).toContain('منظومة Pzone ERP الإنشائية');
    expect(html).toContain('المشروعات والعقود');
    expect(html).toContain('الرقابة والتخطيط');
    expect(html).toContain('النواة السحابية متصلة ومؤمنة');
  });
});
