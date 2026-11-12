import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { LeafletMap } from '../ui/LeafletMap';
import { InteractiveMapsDirections } from '../marketing/InteractiveMapsDirections';

// Mock language context
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    dir: 'rtl',
    t: (k: string) => k,
  }),
}));

describe('Maps Fullscreen Capability Suite', () => {
  describe('LeafletMap Fullscreen', () => {
    it('renders fullscreen toggle button with proper ARIA accessibility', () => {
      const html = renderToString(
        <LeafletMap lat={30.0444} lng={31.2357} title="مشروع الساحل الشمالي" />
      );

      expect(html).toContain('aria-label="تبديل ملء الشاشة"');
      expect(html).toContain('title="عرض الخريطة ملء الشاشة"');
      expect(html).toContain('Google Maps');
    });
  });

  describe('InteractiveMapsDirections Fullscreen', () => {
    it('renders fullscreen button with accessible label on interactive marketing map', () => {
      const html = renderToString(<InteractiveMapsDirections />);

      expect(html).toContain('aria-label="Toggle Fullscreen"');
      expect(html).toContain('title="عرض الخريطة ملء الشاشة"');
    });
  });
});
