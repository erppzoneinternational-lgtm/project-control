import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { UiverseSpinButton } from '../ui/UiverseSpinButton';

describe('UiverseSpinButton Component (Uiverse by andrew-demchenk0)', () => {
  it('renders default label and icon correctly', () => {
    const html = renderToString(React.createElement(UiverseSpinButton, { label: 'تحديث البيانات' }));
    expect(html).toContain('تحديث البيانات');
    expect(html).toContain('svg-icon');
    expect(html).toContain('lable');
  });

  it('renders with custom variant and spinning state', () => {
    const html = renderToString(React.createElement(UiverseSpinButton, {
      variant: 'emerald',
      isSpinning: true,
      label: 'جاري المزامنة...',
    }));
    expect(html).toContain('جاري المزامنة...');
    expect(html).toContain('spinning');
  });
});
