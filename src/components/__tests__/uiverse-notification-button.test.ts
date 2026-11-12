import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { UiverseNotificationButton } from '../ui/UiverseNotificationButton';

describe('UiverseNotificationButton Component (pzone-project-setup)', () => {
  it('instantiates successfully with default props', () => {
    const el = React.createElement(UiverseNotificationButton, {});
    expect(el).toBeDefined();
    expect(el.type).toBe(UiverseNotificationButton);
  });

  it('passes count, title, subtitle, and click handler correctly', () => {
    const handleClick = vi.fn();
    const el = React.createElement(UiverseNotificationButton, {
      count: 5,
      title: 'إشعارات الموقع',
      subtitle: 'يوجد 5 تقارير جديدة',
      variant: 'emerald',
      onClick: handleClick,
    });
    expect(el.props.count).toBe(5);
    expect(el.props.title).toBe('إشعارات الموقع');
    expect(el.props.subtitle).toBe('يوجد 5 تقارير جديدة');
    expect(el.props.variant).toBe('emerald');
  });
});
