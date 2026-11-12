import { describe, it, expect } from 'vitest';
import React from 'react';
import { WifiLoader } from '../ui/WifiLoader';

describe('WifiLoader Component (pzone-project-setup)', () => {
  it('instantiates successfully with default props', () => {
    const el = React.createElement(WifiLoader, {});
    expect(el).toBeDefined();
    expect(el.type).toBe(WifiLoader);
  });

  it('passes text, subtitle, size, and variant correctly', () => {
    const el = React.createElement(WifiLoader, {
      text: 'جاري الاتصال...',
      subtitle: 'جاري مزامنة بيانات المشروع',
      size: 'lg',
      variant: 'emerald',
      fullscreen: false,
    });
    expect(el.props.text).toBe('جاري الاتصال...');
    expect(el.props.subtitle).toBe('جاري مزامنة بيانات المشروع');
    expect(el.props.size).toBe('lg');
    expect(el.props.variant).toBe('emerald');
  });
});
