import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { FloatingLabelInput } from '../ui/FloatingLabelInput';

describe('FloatingLabelInput Component (pzone-project-setup)', () => {
  it('instantiates successfully with label and default props', () => {
    const el = React.createElement(FloatingLabelInput, { label: 'اسم المشروع' });
    expect(el).toBeDefined();
    expect(el.type).toBe(FloatingLabelInput);
    expect(el.props.label).toBe('اسم المشروع');
  });

  it('passes value, error, and dir correctly', () => {
    const handleChange = vi.fn();
    const el = React.createElement(FloatingLabelInput, {
      label: 'اسم العميل (بالعربي)',
      value: 'شركة إعمار',
      error: 'اسم غير صالح',
      dir: 'rtl',
      fullWidth: true,
      onChange: handleChange,
    });
    expect(el.props.label).toBe('اسم العميل (بالعربي)');
    expect(el.props.value).toBe('شركة إعمار');
    expect(el.props.error).toBe('اسم غير صالح');
    expect(el.props.dir).toBe('rtl');
    expect(el.props.fullWidth).toBe(true);
  });
});
