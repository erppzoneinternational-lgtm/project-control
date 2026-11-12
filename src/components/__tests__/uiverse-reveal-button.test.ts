import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { UiverseRevealButton } from '../ui/UiverseRevealButton';

describe('UiverseRevealButton Component (pzone-project-setup)', () => {
  it('instantiates with default props', () => {
    const el = React.createElement(UiverseRevealButton, {});
    expect(el).toBeDefined();
    expect(el.type).toBe(UiverseRevealButton);
  });

  it('accepts custom label, color, and size', () => {
    const handleClick = vi.fn();
    const el = React.createElement(UiverseRevealButton, {
      label: 'مفضلة',
      color: 'emerald',
      size: 'sm',
      onClick: handleClick,
    });
    expect(el.props.label).toBe('مفضلة');
    expect(el.props.color).toBe('emerald');
    expect(el.props.size).toBe('sm');
  });

  it('renders link when href is provided', () => {
    const el = React.createElement(UiverseRevealButton, {
      label: 'Like',
      href: '/favorites',
    });
    expect(el.props.href).toBe('/favorites');
  });
});
