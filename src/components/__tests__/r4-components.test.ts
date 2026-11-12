import { describe, it, expect } from 'vitest';
import arJson from '@/locales/ar.json';
import enJson from '@/locales/en.json';
import { TESTIMONIALS_DATA } from '@/components/marketing/TestimonialsSection';
import { LEADERSHIP_MEMBERS, LIVE_WORK_GALLERY } from '@/components/marketing/TeamAndLiveWorkGallery';
import { CASE_STUDIES_DATA } from '@/data/case-studies';

// Recursive helper to compare JSON object keys parity
function getKeys(obj: any, prefix = ''): string[] {
  let keys: string[] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys = keys.concat(getKeys(obj[key], fullPath));
      } else {
        keys.push(fullPath);
      }
    }
  }
  return keys.sort();
}

describe('Milestone 4 (R4 Case Studies, Testimonials & Team Showcase)', () => {

  describe('1. Translation Key Integrity (r4 namespace)', () => {
    it('contains r4 root namespace in ar.json and en.json', () => {
      expect(arJson).toHaveProperty('r4');
      expect(enJson).toHaveProperty('r4');
    });

    it('contains caseStudies, testimonials, teamShowcase, and metrics in ar.json', () => {
      expect(arJson.r4).toHaveProperty('caseStudies');
      expect(arJson.r4).toHaveProperty('testimonials');
      expect(arJson.r4).toHaveProperty('teamShowcase');
      expect(arJson.r4).toHaveProperty('metrics');
    });

    it('contains caseStudies, testimonials, teamShowcase, and metrics in en.json', () => {
      expect(enJson.r4).toHaveProperty('caseStudies');
      expect(enJson.r4).toHaveProperty('testimonials');
      expect(enJson.r4).toHaveProperty('teamShowcase');
      expect(enJson.r4).toHaveProperty('metrics');
    });

    it('enforces exact 1-to-1 key parity between ar.json r4 and en.json r4', () => {
      const arKeys = getKeys(arJson.r4);
      const enKeys = getKeys(enJson.r4);
      expect(arKeys).toEqual(enKeys);
    });

    it('includes required stats labels in r4.caseStudies', () => {
      expect(arJson.r4.caseStudies.stats.projects).toBe('70+');
      expect(enJson.r4.caseStudies.stats.projects).toBe('70+');
      expect(arJson.r4.caseStudies.stats.surfaceArea).toBe('150,000 m²');
      expect(enJson.r4.caseStudies.stats.surfaceArea).toBe('150,000 m²');
      expect(arJson.r4.caseStudies.stats.contractValue).toBe('450M+ EGP');
      expect(enJson.r4.caseStudies.stats.contractValue).toBe('450M+ EGP');
    });
  });

  describe('2. Testimonials Dataset & Verified Badges', () => {
    it('defines 5 developer & contractor testimonials', () => {
      expect(TESTIMONIALS_DATA.length).toBe(5);
    });

    it('includes key real estate developers (Emaar Misr, SODIC, Palm Hills)', () => {
      const companies = TESTIMONIALS_DATA.map((t) => t.company.en);
      expect(companies).toContain('Emaar Misr');
      expect(companies).toContain('SODIC Developments');
      expect(companies).toContain('Palm Hills Developments');
    });

    it('includes Tier-1 main contractors (Hassan Allam, Orascom)', () => {
      const companies = TESTIMONIALS_DATA.map((t) => t.company.en);
      expect(companies).toContain('Hassan Allam Construction');
      expect(companies).toContain('Orascom Construction');
    });

    it('verifies all testimonials have 5-star ratings and valid badge types', () => {
      TESTIMONIALS_DATA.forEach((item) => {
        expect(item.rating).toBe(5);
        expect(['developer', 'contractor']).toContain(item.badgeType);
        expect(item.quote.ar.length).toBeGreaterThan(20);
        expect(item.quote.en.length).toBeGreaterThan(20);
      });
    });
  });

  describe('3. Leadership Profiles & Live Work Gallery Dataset', () => {
    it('defines 4 key executive leadership members', () => {
      expect(LEADERSHIP_MEMBERS.length).toBe(4);
      const roles = LEADERSHIP_MEMBERS.map((m) => m.roleKey);
      expect(roles).toContain('Managing Director');
      expect(roles).toContain('Technical Director');
      expect(roles).toContain('Chief Hydraulic Engineer');
      expect(roles).toContain('Site PM');
    });

    it('defines live site work photos covering all 5 categories', () => {
      expect(LIVE_WORK_GALLERY.length).toBeGreaterThanOrEqual(5);
      const categories = LIVE_WORK_GALLERY.map((g) => g.category);
      expect(categories).toContain('shotcrete');
      expect(categories).toContain('piping');
      expect(categories).toContain('nozzles');
      expect(categories).toContain('filtration');
      expect(categories).toContain('finishing');
    });

    it('verifies each live work photo contains technical specifications and locations', () => {
      LIVE_WORK_GALLERY.forEach((photo) => {
        expect(photo.techSpec.ar).toBeDefined();
        expect(photo.techSpec.en).toBeDefined();
        expect(photo.location.ar).toBeDefined();
        expect(photo.location.en).toBeDefined();
      });
    });
  });

  describe('4. Case Studies Dataset & BOQ Specs Interactivity', () => {
    it('defines at least 6 Egyptian water scope case studies', () => {
      expect(CASE_STUDIES_DATA.length).toBeGreaterThanOrEqual(6);
    });

    it('covers all water scope categories (fountains, pools, lagoons, hydraulic)', () => {
      const categories = CASE_STUDIES_DATA.map((p) => p.category);
      expect(categories).toContain('fountains');
      expect(categories).toContain('pools');
      expect(categories).toContain('lagoons');
      expect(categories).toContain('hydraulic');
    });

    it('filters projects correctly by category tab', () => {
      const poolsProjects = CASE_STUDIES_DATA.filter((p) => p.category === 'pools');
      expect(poolsProjects.length).toBe(2);

      const lagoonsProjects = CASE_STUDIES_DATA.filter((p) => p.category === 'lagoons');
      expect(lagoonsProjects.length).toBe(2);

      const fountainsProjects = CASE_STUDIES_DATA.filter((p) => p.category === 'fountains');
      expect(fountainsProjects.length).toBe(1);

      const hydraulicProjects = CASE_STUDIES_DATA.filter((p) => p.category === 'hydraulic');
      expect(hydraulicProjects.length).toBe(1);
    });

    it('verifies project detail modal specifications and BOQ highlights', () => {
      CASE_STUDIES_DATA.forEach((project) => {
        expect(project.boqHighlights.ar.length).toBeGreaterThanOrEqual(3);
        expect(project.boqHighlights.en.length).toBeGreaterThanOrEqual(3);
        expect(project.hydraulicSpecs.ar).toBeDefined();
        expect(project.civilSpecs.ar).toBeDefined();
        expect(project.testimonialQuote.ar).toBeDefined();
      });
    });
  });

});
