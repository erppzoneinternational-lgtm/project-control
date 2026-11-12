'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GuidedTour, TourStep } from './GuidedTour';
import { usePortalTourStore } from '@/lib/stores/usePortalTourStore';
import { ALL_PORTAL_TOURS, TourDefinition } from '@/lib/tour/tourCatalog';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Compass,
  LayoutDashboard,
  GanttChartSquare,
  FolderKanban,
  Sparkles,
  X,
  Play,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Info
} from 'lucide-react';

const ICON_MAP = {
  Compass,
  LayoutDashboard,
  GanttChartSquare,
  FolderKanban,
};

export interface PortalGuidedTourProps {
  isOpen?: boolean;
  activeTourId?: string | null;
  currentStepIndex?: number;
  customSteps?: TourStep[] | null;
  isSelectorOpen?: boolean;
  onClose?: () => void;
  onCloseSelector?: () => void;
}

export const PortalGuidedTour: React.FC<PortalGuidedTourProps> = ({
  isOpen: propIsOpen,
  activeTourId: propActiveTourId,
  currentStepIndex: propCurrentStepIndex,
  customSteps: propCustomSteps,
  isSelectorOpen: propIsSelectorOpen,
  onClose: propOnClose,
  onCloseSelector: propOnCloseSelector,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  
  // Safe pathname retrieval (tolerant of SSR / unit tests without App Router)
  const pathname = (() => {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return usePathname();
    } catch {
      return '';
    }
  })();

  // Safe router retrieval (tolerant of SSR / unit tests without App Router)
  const router = (() => {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useRouter();
    } catch {
      return null;
    }
  })();

  const storeIsOpen = usePortalTourStore((s) => s.isOpen);
  const storeActiveTourId = usePortalTourStore((s) => s.activeTourId);
  const storeCurrentStepIndex = usePortalTourStore((s) => s.currentStepIndex);
  const storeCustomSteps = usePortalTourStore((s) => s.customSteps);
  const storeIsSelectorOpen = usePortalTourStore((s) => s.isSelectorOpen);
  const startTour = usePortalTourStore((s) => s.startTour);
  const storeStopTour = usePortalTourStore((s) => s.stopTour);
  const setStep = usePortalTourStore((s) => s.setStep);
  const storeCloseSelector = usePortalTourStore((s) => s.closeSelector);
  const isCompleted = usePortalTourStore((s) => s.isCompleted);

  // Controlled props take precedence over store for deterministic SSR and unit tests
  const isOpen = propIsOpen !== undefined ? propIsOpen : storeIsOpen;
  const activeTourId = propActiveTourId !== undefined ? propActiveTourId : storeActiveTourId;
  const currentStepIndex = propCurrentStepIndex !== undefined ? propCurrentStepIndex : storeCurrentStepIndex;
  const customSteps = propCustomSteps !== undefined ? propCustomSteps : storeCustomSteps;
  const isSelectorOpen = propIsSelectorOpen !== undefined ? propIsSelectorOpen : storeIsSelectorOpen;
  const stopTour = propOnClose || storeStopTour;
  const closeSelector = propOnCloseSelector || storeCloseSelector;

  // Get active steps
  const activeSteps = customSteps || (activeTourId ? ALL_PORTAL_TOURS[activeTourId]?.steps : null);

  const handleLaunchTour = (tour: TourDefinition) => {
    closeSelector();

    // If target route differs from current pathname, route there first
    if (tour.targetRoute && pathname !== tour.targetRoute) {
      if (router) {
        router.push(tour.targetRoute);
      } else if (typeof window !== 'undefined') {
        window.location.href = tour.targetRoute;
      }
      // Give page brief mount delay before firing spotlight
      setTimeout(() => {
        startTour(tour.id, 0);
      }, 350);
    } else {
      startTour(tour.id, 0);
    }
  };

  return (
    <>
      {/* ── 1. The Active Dynamic Spotlight Guided Tour ── */}
      {isOpen && activeSteps && activeSteps.length > 0 && (
        <GuidedTour
          steps={activeSteps}
          isActive={isOpen}
          onClose={stopTour}
          initialStep={currentStepIndex}
          onStepChange={setStep}
          isAr={isAr}
        />
      )}

      {/* ── 2. The Interactive Tour Hub / Selector Modal ── */}
      {isSelectorOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-modal-title"
          dir="rtl"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSelector();
          }}
        >
          <div className="relative w-full max-w-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            {/* Top Close Button */}
            <button
              type="button"
              onClick={closeSelector}
              className="absolute top-5 end-5 p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label={isAr ? 'إغلاق نافذة الجولات' : 'Close tours modal'}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 pe-8">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs shrink-0">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 id="tour-modal-title" className="text-lg sm:text-xl font-black text-stone-900 dark:text-white leading-tight">
                  {isAr ? 'مركز الجولات التعريفية التفاعلية' : 'Interactive Guided Tours Hub'}
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
                  {isAr
                    ? 'اختر جولة تفاعلية حية للإشارة إلى عناصر ومحاور المنظومة والتعرف على مهامها.'
                    : 'Choose a live spotlight tour to discover system features and essential controls.'}
                </p>
              </div>
            </div>

            {/* Tours Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1 max-h-[60vh] overflow-y-auto">
              {Object.values(ALL_PORTAL_TOURS).map((tour) => {
                const IconComponent = ICON_MAP[tour.iconName] || Compass;
                const completed = isCompleted(tour.id);
                const isCurrentPage = tour.targetRoute ? pathname === tour.targetRoute : tour.id === 'global_portal';

                return (
                  <div
                    key={tour.id}
                    className={`relative flex flex-col justify-between p-4.5 rounded-2xl border transition-all duration-200 group text-start ${
                      isCurrentPage
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/50 shadow-md shadow-emerald-500/5'
                        : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/60 hover:border-emerald-500/40 hover:bg-white dark:hover:bg-stone-800 shadow-xs'
                    }`}
                  >
                    <div>
                      {/* Badge Row */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-stone-200/80 dark:bg-stone-700/80 text-stone-700 dark:text-stone-300">
                          {isAr ? tour.badgeAr : tour.badgeEn}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isCurrentPage && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-600 text-white animate-pulse">
                              {isAr ? 'الصفحة الحالية' : 'Active Page'}
                            </span>
                          )}
                          {completed && (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isAr ? 'مكتملة' : 'Viewed'}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Icon */}
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-black text-stone-900 dark:text-white leading-snug">
                          {isAr ? tour.titleAr : tour.titleEn}
                        </h4>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-stone-600 dark:text-stone-300 mt-2.5 line-clamp-2 leading-relaxed">
                        {isAr ? tour.descAr : tour.descEn}
                      </p>
                    </div>

                    {/* Step count & Action Button */}
                    <div className="mt-4 pt-3 border-t border-stone-200/60 dark:border-stone-700/60 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-stone-400">
                        {isAr ? `${tour.steps.length} محطات تفاعلية` : `${tour.steps.length} interactive steps`}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleLaunchTour(tour)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all cursor-pointer group-hover:scale-105"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isAr ? 'بدء الجولة' : 'Start Tour'}</span>
                        {isAr ? (
                          <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                        ) : (
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Notice */}
            <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs flex items-center gap-2.5">
              <Info className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                {isAr
                  ? 'يتم تسليط الضوء ديناميكياً على الأزرار والشاشات الفعلية مع توجيه أسهم الإرشاد التلقائية ومزامنتها لحظياً.'
                  : 'Elements are dynamically spotlit with auto-tracking directional pointers and real-time positioning.'}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
