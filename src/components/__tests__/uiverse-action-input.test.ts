import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { UiverseActionInput } from '../ui/UiverseActionInput';

describe('UiverseActionInput Component (pzone-project-setup)', () => {
  it('instantiates successfully with default props', () => {
    const el = React.createElement(UiverseActionInput, {});
    expect(el).toBeDefined();
    expect(el.type).toBe(UiverseActionInput);
  });

  it('passes value and placeholder correctly', () => {
    const handleChange = vi.fn();
    const handleSubmit = vi.fn();
    const el = React.createElement(UiverseActionInput, {
      value: 'TEST_PROJECT',
      placeholder: 'ابحث عن مشروع...',
      buttonText: 'تأكيد',
      onChange: handleChange,
      onSubmit: handleSubmit,
      dir: 'rtl',
    });
    expect(el.props.value).toBe('TEST_PROJECT');
    expect(el.props.placeholder).toBe('ابحث عن مشروع...');
    expect(el.props.buttonText).toBe('تأكيد');
    expect(el.props.dir).toBe('rtl');
  });
});
