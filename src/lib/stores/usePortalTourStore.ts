'use client';

import { create } from 'zustand';
import { TourStep } from '@/components/ui/GuidedTour';
import { ALL_PORTAL_TOURS } from '@/lib/tour/tourCatalog';

export interface PortalTourState {
  isOpen: boolean;
  activeTourId: string | null;
  currentStepIndex: number;
  customSteps: TourStep[] | null;
  isSelectorOpen: boolean;
  completedTours: string[];

  // Actions
  startTour: (tourId?: string, initialStep?: number) => void;
  startCustomTour: (steps: TourStep[], initialStep?: number) => void;
  stopTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (index: number) => void;
  openSelector: () => void;
  closeSelector: () => void;
  markCompleted: (tourId: string) => void;
  isCompleted: (tourId: string) => boolean;
}

const getInitialCompleted = (): string[] => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('pzone_portal_completed_tours');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const usePortalTourStore = create<PortalTourState>((set, get) => ({
  isOpen: false,
  activeTourId: null,
  currentStepIndex: 0,
  customSteps: null,
  isSelectorOpen: false,
  completedTours: getInitialCompleted(),

  startTour: (tourId = 'global_portal', initialStep = 0) => {
    set({
      isOpen: true,
      activeTourId: tourId,
      currentStepIndex: initialStep,
      customSteps: null,
      isSelectorOpen: false,
    });
  },

  startCustomTour: (steps: TourStep[], initialStep = 0) => {
    set({
      isOpen: true,
      activeTourId: 'custom',
      currentStepIndex: initialStep,
      customSteps: steps,
      isSelectorOpen: false,
    });
  },

  stopTour: () => {
    const activeId = get().activeTourId;
    if (activeId && activeId !== 'custom') {
      get().markCompleted(activeId);
    }
    set({
      isOpen: false,
      activeTourId: null,
      currentStepIndex: 0,
      customSteps: null,
    });
  },

  nextStep: () => {
    const { currentStepIndex, activeTourId, customSteps, stopTour } = get();
    let total = 0;
    if (customSteps) {
      total = customSteps.length;
    } else if (activeTourId && ALL_PORTAL_TOURS[activeTourId]) {
      total = ALL_PORTAL_TOURS[activeTourId].steps.length;
    }

    if (currentStepIndex < total - 1) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else {
      stopTour();
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  setStep: (index: number) => {
    set({ currentStepIndex: Math.max(0, index) });
  },

  openSelector: () => {
    set({ isSelectorOpen: true });
  },

  closeSelector: () => {
    set({ isSelectorOpen: false });
  },

  markCompleted: (tourId: string) => {
    const completed = get().completedTours;
    if (!completed.includes(tourId)) {
      const next = [...completed, tourId];
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('pzone_portal_completed_tours', JSON.stringify(next));
        } catch {
          // Ignore localStorage errors
        }
      }
      set({ completedTours: next });
    }
  },

  isCompleted: (tourId: string) => {
    return get().completedTours.includes(tourId);
  },
}));
