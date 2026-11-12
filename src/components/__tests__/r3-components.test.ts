import { describe, it, expect } from 'vitest';
import { defaultFaqItems } from '../ui/FAQAccordion';
import { pzoneHubLocations } from '../marketing/InteractiveMapsDirections';
import arJson from '../../locales/ar.json';
import enJson from '../../locales/en.json';

describe('Milestone 3 (R3 Conversion UX & Interactive Components)', () => {
  describe('Translation Key Integrity (r3 namespace)', () => {
    it('contains all required r3 keys in ar.json', () => {
      expect(arJson).toHaveProperty('r3');
      expect(arJson.r3).toHaveProperty('hero_cta');
      expect(arJson.r3).toHaveProperty('sticky_cta');
      expect(arJson.r3).toHaveProperty('response_promise');
      expect(arJson.r3).toHaveProperty('faq');
      expect(arJson.r3).toHaveProperty('breadcrumbs');
      expect(arJson.r3).toHaveProperty('interactive_map');

      expect(arJson.r3.hero_cta.headline).toContain('مبدعون في هندسة المنشآت المائية');
      expect(arJson.r3.sticky_cta.call_us).toBe('اتصل بنا');
      expect(arJson.r3.response_promise.badge).toContain('< 2 ساعة');
    });

    it('contains all required r3 keys in en.json', () => {
      expect(enJson).toHaveProperty('r3');
      expect(enJson.r3).toHaveProperty('hero_cta');
      expect(enJson.r3).toHaveProperty('sticky_cta');
      expect(enJson.r3).toHaveProperty('response_promise');
      expect(enJson.r3).toHaveProperty('faq');
      expect(enJson.r3).toHaveProperty('breadcrumbs');
      expect(enJson.r3).toHaveProperty('interactive_map');

      expect(enJson.r3.hero_cta.headline).toContain('Pzone');
      expect(enJson.r3.sticky_cta.call_us).toBe('Call Us');
      expect(enJson.r3.response_promise.badge).toContain('< 2 Hours');
    });
  });

  describe('FAQAccordion Default Q&A Dataset', () => {
    it('defines at least 8 comprehensive bilingual Q&A items', () => {
      expect(defaultFaqItems.length).toBeGreaterThanOrEqual(8);
    });

    it('includes 14% VAT compliance Q&A', () => {
      const vatFaq = defaultFaqItems.find((item) => item.id === 'faq-2');
      expect(vatFaq).toBeDefined();
      expect(vatFaq?.questionAr).toContain('14% VAT');
      expect(vatFaq?.answerAr).toContain('ضريبة القيمة المضافة');
    });

    it('includes Site Possession & TOC letter Q&A', () => {
      const tocFaq = defaultFaqItems.find((item) => item.id === 'faq-4');
      expect(tocFaq).toBeDefined();
      expect(tocFaq?.questionAr).toContain('Site Possession');
      expect(tocFaq?.answerAr).toContain('TOC Letter');
    });

    it('includes civil & MEP 10-year warranty Q&A', () => {
      const warrantyFaq = defaultFaqItems.find((item) => item.id === 'faq-3');
      expect(warrantyFaq).toBeDefined();
      expect(warrantyFaq?.answerAr).toContain('10 سنوات');
    });
  });

  describe('InteractiveMapsDirections Hub Locations Dataset', () => {
    it('defines 5 Pzone HQ & Regional Office locations across Egypt', () => {
      expect(pzoneHubLocations.length).toBe(5);
    });

    it('includes Pzone Head Office in New Cairo with exact GPS coordinates', () => {
      const hq = pzoneHubLocations.find((hub) => hub.id === 'hq-new-cairo');
      expect(hq).toBeDefined();
      expect(hq?.lat).toBe(30.0289);
      expect(hq?.lng).toBe(31.4913);
    });

    it('includes North Coast & Red Sea regional hubs', () => {
      const northCoast = pzoneHubLocations.find((hub) => hub.id === 'north-coast-hub');
      const redSea = pzoneHubLocations.find((hub) => hub.id === 'red-sea-hub');
      expect(northCoast).toBeDefined();
      expect(redSea).toBeDefined();
    });
  });
});
