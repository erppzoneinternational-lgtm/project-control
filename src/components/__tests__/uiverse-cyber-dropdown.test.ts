import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { UiverseCyberDropdown } from '../ui/UiverseCyberDropdown';

describe('UiverseCyberDropdown Component (Uiverse by Zain-Muhammad)', () => {
  const mockItems = [
    { id: '1', label: 'تصدير إكسل' },
    { id: '2', label: 'تصدير PDF', badge: 'جديد' },
    { id: '3', label: 'حذف السجل', danger: true },
  ];

  it('renders trigger tab and items correctly', () => {
    const html = renderToString(
      React.createElement(UiverseCyberDropdown, {
        label: 'إجراءات سريعة',
        items: mockItems,
        variant: 'cyan',
      })
    );
    expect(html).toContain('إجراءات سريعة');
    expect(html).toContain('تصدير إكسل');
    expect(html).toContain('تصدير PDF');
    expect(html).toContain('جديد');
  });

  it('renders with emerald variant and sm size', () => {
    const html = renderToString(
      React.createElement(UiverseCyberDropdown, {
        label: 'خيارات',
        items: mockItems,
        variant: 'emerald',
        size: 'sm',
      })
    );
    expect(html).toContain('emerald');
    expect(html).toContain('sm');
  });
});
