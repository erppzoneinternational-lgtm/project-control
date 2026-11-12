import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CollectUiNetworkDirectory } from '../ui/CollectUiNetworkDirectory';

describe('CollectUiNetworkDirectory Component (CollectUI Inspiration)', () => {
  it('renders default Arabic content, groups, and add partner card in RTL mode', () => {
    const html = renderToString(
      React.createElement(CollectUiNetworkDirectory, {
        locale: 'ar',
        dir: 'rtl',
        theme: 'dark',
      })
    );

    expect(html).toContain('دليل الشركاء والمنظومة الهندسية');
    expect(html).toContain('دار الهندسة');
    expect(html).toContain('المقاولون العرب');
    expect(html).toContain('إضافة شريك أو جهة جديدة 🙌');
    expect(html).toContain('dargroup.com');
  });

  it('renders English custom directory groups in LTR mode', () => {
    const customGroups = [
      {
        id: 'tech',
        title: 'BIM & Planning Software',
        items: [
          { id: '1', name: 'Autodesk Revit', domain: 'autodesk.com', isHot: true },
          { id: '2', name: 'Oracle Primavera P6', domain: 'oracle.com' },
        ],
      },
    ];

    const html = renderToString(
      React.createElement(CollectUiNetworkDirectory, {
        locale: 'en',
        dir: 'ltr',
        theme: 'light',
        title: 'Engineering Software Directory',
        groups: customGroups,
      })
    );

    expect(html).toContain('Engineering Software Directory');
    expect(html).toContain('BIM &amp; Planning Software');
    expect(html).toContain('Autodesk Revit');
    expect(html).toContain('autodesk.com');
    expect(html).toContain('Oracle Primavera P6');
  });
});
