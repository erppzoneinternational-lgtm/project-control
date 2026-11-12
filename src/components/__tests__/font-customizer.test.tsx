import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AVAILABLE_FONTS, FontProvider, FONT_STORAGE_KEY } from '@/contexts/FontContext';
import { FontCustomizerModal } from '../layout/FontCustomizerModal';
import { FontCustomizerButton } from '../layout/FontCustomizerButton';

describe('Font Customization System & Multi-Font Library', () => {
  it('contains all 16 registered font families from the fonts package', () => {
    expect(AVAILABLE_FONTS.length).toBe(16);

    const fontIds = AVAILABLE_FONTS.map((f) => f.id);
    expect(fontIds).toContain('default');
    expect(fontIds).toContain('hayyakum-allah');
    expect(fontIds).toContain('tajarib-taweel');
    expect(fontIds).toContain('as-wc26');
    expect(fontIds).toContain('grtsk');
    expect(fontIds).toContain('cordale');
    
    // ZYAEA artistic collection
    expect(fontIds).toContain('zyaea-abyss');
    expect(fontIds).toContain('zyaea-ambidextrous');
    expect(fontIds).toContain('zyaea-celestial');
    expect(fontIds).toContain('zyaea-ethereal');
    expect(fontIds).toContain('zyaea-habseligkeit');
    expect(fontIds).toContain('zyaea-meteor');
    expect(fontIds).toContain('zyaea-nooneandyou');
    expect(fontIds).toContain('zyaea-petrichor');
    expect(fontIds).toContain('zyaea-sage');
    expect(fontIds).toContain('zyaea-xanadu');
  });

  it('ensures each font has valid metadata, category, and css family stack', () => {
    for (const font of AVAILABLE_FONTS) {
      expect(font.id).toBeTruthy();
      expect(font.name).toBeTruthy();
      expect(font.nameEn).toBeTruthy();
      expect(font.family).toBeTruthy();
      expect(['system', 'editorial', 'modern', 'artistic']).toContain(font.category);
      expect(font.weights.length).toBeGreaterThan(0);
      expect(font.descriptionAr).toBeTruthy();
    }
  });

  it('renders FontCustomizerButton with trigger icon and tooltip', () => {
    const html = renderToString(
      React.createElement(
        FontProvider,
        null,
        React.createElement(FontCustomizerButton, { className: 'custom-btn-test' })
      )
    );
    expect(html).toContain('custom-btn-test');
    expect(html).toContain('button');
  });

  it('renders FontCustomizerModal when open with live search and font cards', () => {
    const html = renderToString(
      React.createElement(
        FontProvider,
        null,
        React.createElement(FontCustomizerModal, {
          forceOpen: true,
          onClose: () => {},
        })
      )
    );
    
    // Check for modal header & count badge
    expect(html).toContain('تخصيص خط المنظومة');
    expect(html).toContain('16');
    expect(html).toContain('خط متاح');
    expect(html).toContain('حيّاكم الله');
    expect(html).toContain('تجاريب');
    expect(html).toContain('AS-WC26');
    expect(html).toContain('TRY Grtsk');
    expect(html).toContain('Cordale');
    expect(html).toContain('ZYAEA');
  });

  it('does not render modal contents when forceOpen is false and not open in context', () => {
    const html = renderToString(
      React.createElement(
        FontProvider,
        null,
        React.createElement(FontCustomizerModal, {
          forceOpen: false,
          onClose: () => {},
        })
      )
    );
    expect(html).toBe('');
  });
});
