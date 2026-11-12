import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { UiverseFloatingDock } from '../ui/UiverseFloatingDock';

describe('UiverseFloatingDock Component (Uiverse by themrsami)', () => {
  it('renders default navigation items with tooltips', () => {
    const html = renderToString(
      React.createElement(UiverseFloatingDock, {
        variant: 'gold',
        position: 'inline',
      })
    );
    expect(html).toContain('لوحة القيادة');
    expect(html).toContain('إعداد المشاريع');
    expect(html).toContain('دليل الشركاء');
    expect(html).toContain('role="navigation"');
  });

  it('renders with custom items, active state, and notification badge', () => {
    const customItems = [
      { id: 'tasks', label: 'المهام', icon: () => React.createElement('svg'), badge: 5, active: true },
    ];
    const html = renderToString(
      React.createElement(UiverseFloatingDock, {
        items: customItems,
        variant: 'emerald',
        position: 'bottom-fixed',
      })
    );
    expect(html).toContain('المهام');
    expect(html).toContain('5');
    expect(html).toContain('emerald');
  });
});
