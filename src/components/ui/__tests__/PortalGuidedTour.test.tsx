import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { usePortalTourStore } from '@/lib/stores/usePortalTourStore';
import {
  ALL_PORTAL_TOURS,
  GLOBAL_PORTAL_TOUR_STEPS,
  DASHBOARD_TOUR_STEPS,
  SCHEDULE_PULSE_TOUR_STEPS,
  PROJECT_SETUP_TOUR_STEPS,
} from '@/lib/tour/tourCatalog';
import { PortalGuidedTour } from '../PortalGuidedTour';

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

// Mock Language Context
vi.mock('@/contexts/LanguageContext', () => ({
  useLanguage: () => ({
    locale: 'ar',
    toggleLocale: vi.fn(),
  }),
}));

describe('Portal Guided Tour System & Store', () => {
  beforeEach(() => {
    // Reset Zustand store state before each test
    usePortalTourStore.setState({
      isOpen: false,
      activeTourId: null,
      currentStepIndex: 0,
      customSteps: null,
      isSelectorOpen: false,
      completedTours: [],
    });
  });

  describe('Tour Catalog Grounding & Completeness', () => {
    it('contains all 4 enterprise portal tours with steps and valid targets', () => {
      expect(ALL_PORTAL_TOURS.global_portal).toBeDefined();
      expect(ALL_PORTAL_TOURS.dashboard).toBeDefined();
      expect(ALL_PORTAL_TOURS.schedule_pulse).toBeDefined();
      expect(ALL_PORTAL_TOURS.project_setup).toBeDefined();

      expect(GLOBAL_PORTAL_TOUR_STEPS.length).toBeGreaterThanOrEqual(8);
      expect(DASHBOARD_TOUR_STEPS.length).toBeGreaterThanOrEqual(7);
      expect(SCHEDULE_PULSE_TOUR_STEPS.length).toBeGreaterThanOrEqual(5);
      expect(PROJECT_SETUP_TOUR_STEPS.length).toBeGreaterThanOrEqual(5);

      // Verify all steps have non-empty targetId and bilingual texts
      for (const step of GLOBAL_PORTAL_TOUR_STEPS) {
        expect(step.targetId).toMatch(/^tour-/);
        expect(step.titleAr.length).toBeGreaterThan(0);
        expect(step.titleEn.length).toBeGreaterThan(0);
        expect(step.descAr.length).toBeGreaterThan(0);
      }
    });
  });

  describe('usePortalTourStore State Transitions', () => {
    it('initializes with closed tour and empty completions', () => {
      const state = usePortalTourStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.activeTourId).toBeNull();
      expect(state.currentStepIndex).toBe(0);
      expect(state.isSelectorOpen).toBe(false);
    });

    it('starts a tour and sets active ID and step 0', () => {
      usePortalTourStore.getState().startTour('dashboard', 0);
      const state = usePortalTourStore.getState();
      expect(state.isOpen).toBe(true);
      expect(state.activeTourId).toBe('dashboard');
      expect(state.currentStepIndex).toBe(0);
      expect(state.isSelectorOpen).toBe(false);
    });

    it('navigates next and prev steps accurately', () => {
      usePortalTourStore.getState().startTour('dashboard', 0);
      expect(usePortalTourStore.getState().currentStepIndex).toBe(0);

      usePortalTourStore.getState().nextStep();
      expect(usePortalTourStore.getState().currentStepIndex).toBe(1);

      usePortalTourStore.getState().nextStep();
      expect(usePortalTourStore.getState().currentStepIndex).toBe(2);

      usePortalTourStore.getState().prevStep();
      expect(usePortalTourStore.getState().currentStepIndex).toBe(1);

      usePortalTourStore.getState().setStep(5);
      expect(usePortalTourStore.getState().currentStepIndex).toBe(5);
    });

    it('stops tour and marks active tour completed', () => {
      usePortalTourStore.getState().startTour('global_portal', 2);
      expect(usePortalTourStore.getState().isOpen).toBe(true);

      usePortalTourStore.getState().stopTour();
      const state = usePortalTourStore.getState();
      expect(state.isOpen).toBe(false);
      expect(state.activeTourId).toBeNull();
      expect(state.currentStepIndex).toBe(0);
      expect(usePortalTourStore.getState().isCompleted('global_portal')).toBe(true);
    });

    it('manages tour selector modal state', () => {
      expect(usePortalTourStore.getState().isSelectorOpen).toBe(false);
      usePortalTourStore.getState().openSelector();
      expect(usePortalTourStore.getState().isSelectorOpen).toBe(true);
      usePortalTourStore.getState().closeSelector();
      expect(usePortalTourStore.getState().isSelectorOpen).toBe(false);
    });
  });

  describe('PortalGuidedTour UI Component Rendering', () => {
    it('renders empty when tour and selector are both closed', () => {
      const html = ReactDOMServer.renderToString(
        <PortalGuidedTour isOpen={false} isSelectorOpen={false} />
      );
      expect(html).toBe('');
    });

    it('renders tour selector modal with all enterprise tours when isSelectorOpen is true', () => {
      const html = ReactDOMServer.renderToString(
        <PortalGuidedTour isSelectorOpen={true} />
      );

      expect(html).toContain('مركز الجولات التعريفية التفاعلية');
      expect(html).toContain('الجولة التعريفية العامة للمنظومة');
      expect(html).toContain('جولة لوحة القيادة التنفيذية');
      expect(html).toContain('جولة نبض الجدول الزمني (Schedule Pulse)');
      expect(html).toContain('جولة بوابة إعداد وحوكمة المشاريع');
      expect(html).toContain('بدء الجولة');
    });

    it('renders active guided tour when isOpen is true', () => {
      const html = ReactDOMServer.renderToString(
        <PortalGuidedTour
          isOpen={true}
          activeTourId="global_portal"
          currentStepIndex={0}
        />
      );

      expect(html).toContain('هوية منظومة P.ZONE الذكية والعودة للرئيسية');
      expect(html).toContain('شعار وهوية المنظومة');
      expect(html).toContain('خطوة 1 من');
      expect(html).toContain('التالي');
    });
  });
});
