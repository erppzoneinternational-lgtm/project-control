import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import robots from '@/app/robots';
import {
  pzoneOrganizationSchema,
  pzoneLocalBusinessSchema,
  pzoneProjectSchema,
} from '@/components/seo/JsonLd';
import { trackGAEvent } from '@/lib/analytics/ga';

describe('Milestone 2: SEO, Metadata & Analytics', () => {
  describe('robots.ts', () => {
    it('returns valid metadata route robots configuration', () => {
      const result = robots();
      expect(result).toBeDefined();
      expect(result.sitemap).toBe('https://pzoneinternational.com/sitemap.xml');
      expect(result.rules).toEqual({
        userAgent: '*',
        allow: ['/', '/case-studies', '/privacy-policy', '/thank-you'],
        disallow: ['/(dashboard)/', '/api/', '/user-management/'],
      });
    });
  });

  describe('JsonLd schemas', () => {
    it('defines pzoneOrganizationSchema correctly', () => {
      expect(pzoneOrganizationSchema['@type']).toBe('Organization');
      expect(pzoneOrganizationSchema.name).toBe('Pzoneinternational Engine');
      expect(pzoneOrganizationSchema.url).toBe('https://pzoneinternational.com');
      expect(pzoneOrganizationSchema.contactPoint.telephone).toBe('+201000000000');
    });

    it('defines pzoneLocalBusinessSchema correctly with GeneralContractor', () => {
      expect(pzoneLocalBusinessSchema['@type']).toBe('GeneralContractor');
      expect(pzoneLocalBusinessSchema.name).toBe('Pzone Water Scope Construction');
      expect(pzoneLocalBusinessSchema.telephone).toBe('+201000000000');
      expect(pzoneLocalBusinessSchema.address).toEqual({
        '@type': 'PostalAddress',
        streetAddress: 'Fifth Settlement',
        addressLocality: 'New Cairo',
        addressRegion: 'Cairo',
        addressCountry: 'Egypt',
      });
    });

    it('defines pzoneProjectSchema correctly', () => {
      expect(pzoneProjectSchema['@type']).toBe('Project');
      expect(pzoneProjectSchema.name).toBe('Pzone Water Scope Project Management');
      expect(pzoneProjectSchema.provider.name).toBe('Pzoneinternational Engine');
    });
  });

  describe('GA4 Analytics helper (ga.ts)', () => {
    const originalWindow = global.window;

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      global.window = originalWindow;
    });

    it('executes trackGAEvent safely when window.gtag is not defined', () => {
      // Should not throw error
      expect(() => trackGAEvent('click', 'button', 'cta', 1)).not.toThrow();
    });

    it('calls window.gtag when defined', () => {
      const mockGtag = vi.fn();
      // @ts-ignore
      global.window = { gtag: mockGtag };

      trackGAEvent('submit', 'form', 'contact', 10);

      expect(mockGtag).toHaveBeenCalledWith('event', 'submit', {
        event_category: 'form',
        event_label: 'contact',
        value: 10,
      });
    });
  });
});
