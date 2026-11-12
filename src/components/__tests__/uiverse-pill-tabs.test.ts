import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { UiversePillTabs } from '../ui/UiversePillTabs';

describe('UiversePillTabs Component (Uiverse by uiverse-astronaut)', () => {
  const mockTabs = [
    { id: 'all', label: 'الكل', count: 12 },
    { id: 'active', label: 'نشط', count: 5 },
    { id: 'completed', label: 'مكتمل', count: 7 },
  ];

  it('renders all tabs and labels correctly', () => {
    const html = renderToString(
      React.createElement(UiversePillTabs, {
        tabs: mockTabs,
        activeTab: 'all',
        onChange: () => {},
      })
    );
    expect(html).toContain('الكل');
    expect(html).toContain('نشط');
    expect(html).toContain('مكتمل');
    expect(html).toContain('cir-tabs');
    expect(html).toContain('12');
  });

  it('renders with blue variant and small size', () => {
    const html = renderToString(
      React.createElement(UiversePillTabs, {
        tabs: mockTabs,
        activeTab: 'active',
        onChange: () => {},
        variant: 'blue',
        size: 'sm',
      })
    );
    expect(html).toContain('blue');
    expect(html).toContain('sm');
  });

  it('renders in fullWidth mode with emerald variant and RTL direction', () => {
    const html = renderToString(
      React.createElement(UiversePillTabs, {
        tabs: mockTabs,
        activeTab: 'all',
        onChange: () => {},
        variant: 'emerald',
        size: 'sm',
        fullWidth: true,
        dir: 'rtl',
      })
    );
    expect(html).toContain('emerald');
    expect(html).toContain('fullWidth');
    expect(html).toContain('dir="rtl"');
  });
});
