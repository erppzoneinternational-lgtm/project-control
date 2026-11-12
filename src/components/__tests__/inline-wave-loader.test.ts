import { describe, it, expect } from 'vitest';
import React from 'react';
import { InlineWaveLoader } from '../ui/InlineWaveLoader';

describe('InlineWaveLoader Component (pzone-project-setup)', () => {
  it('instantiates successfully with default props', () => {
    const el = React.createElement(InlineWaveLoader, {});
    expect(el).toBeDefined();
    expect(el.type).toBe(InlineWaveLoader);
  });

  it('passes text, size, and showSpinner correctly', () => {
    const el = React.createElement(InlineWaveLoader, {
      text: 'جاري الحفظ...',
      size: 'sm',
      showSpinner: true,
      color: '#ffffff',
    });
    expect(el.props.text).toBe('جاري الحفظ...');
    expect(el.props.size).toBe('sm');
    expect(el.props.color).toBe('#ffffff');
  });
});
