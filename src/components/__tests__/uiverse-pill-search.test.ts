import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { UiversePillSearch } from '../ui/UiversePillSearch';

describe('UiversePillSearch Component (Uiverse by uiverse-astronaut)', () => {
  it('renders search input with placeholder and shortcut pill', () => {
    const html = renderToString(
      React.createElement(UiversePillSearch, {
        value: '',
        placeholder: 'بحث في أصحاب المصلحة...',
        shortcut: '⌘K',
      })
    );
    expect(html).toContain('بحث في أصحاب المصلحة...');
    expect(html).toContain('⌘K');
    expect(html).toContain('cir-search');
  });

  it('renders with clear button when value is provided', () => {
    const html = renderToString(
      React.createElement(UiversePillSearch, {
        value: 'استشاري',
        variant: 'emerald',
        size: 'sm',
      })
    );
    expect(html).toContain('value="استشاري"');
    expect(html).toContain('aria-label="مسح البحث"');
  });
});
