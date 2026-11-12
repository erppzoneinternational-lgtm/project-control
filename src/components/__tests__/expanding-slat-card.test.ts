import { describe, it, expect } from 'vitest';
import React from 'react';
import { ExpandingSlatCard, SlatItem } from '../ui/ExpandingSlatCard';

describe('ExpandingSlatCard Component (pzone-project-setup)', () => {
  it('instantiates successfully with default items', () => {
    const element = React.createElement(ExpandingSlatCard, {});
    expect(element).toBeDefined();
    expect(element.type).toBe(ExpandingSlatCard);
  });

  it('accepts custom items and variants', () => {
    const customItems: SlatItem[] = [
      { id: '1', title: 'ALPHA', titleAr: 'ألفا', href: '/alpha' },
      { id: '2', title: 'BETA', titleAr: 'بيتا', onClick: () => {} },
    ];
    const element = React.createElement(ExpandingSlatCard, {
      items: customItems,
      variant: 'emerald',
      width: 280,
      height: 200,
      ariaLabel: 'Custom Navigation Card',
    });
    expect(element.props.items).toEqual(customItems);
    expect(element.props.variant).toBe('emerald');
    expect(element.props.width).toBe(280);
    expect(element.props.height).toBe(200);
    expect(element.props.ariaLabel).toBe('Custom Navigation Card');
  });

  it('supports all defined color variants', () => {
    const variants = ['pink', 'emerald', 'amber', 'cyan', 'blue', 'purple'] as const;
    variants.forEach((v) => {
      const el = React.createElement(ExpandingSlatCard, { variant: v });
      expect(el.props.variant).toBe(v);
    });
  });
});
