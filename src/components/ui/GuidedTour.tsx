'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, Check } from 'lucide-react';

export interface TourStep {
  targetId: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  tipAr?: string;
  tipEn?: string;
  position?: 'bottom' | 'top' | 'left' | 'right' | 'center';
}

export interface GuidedTourProps {
  steps: TourStep[];
  isActive: boolean;
  onClose: () => void;
  isAr?: boolean;
  initialStep?: number;
  onStepChange?: (index: number) => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

interface TooltipCoords {
  top: number;
  left: number;
  arrowPlacement: 'top' | 'bottom' | 'left' | 'right' | 'none';
  arrowOffset: number;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  isActive,
  onClose,
  isAr = true,
  initialStep = 0,
  onStepChange,
}) => {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipCoords, setTooltipCoords] = useState<TooltipCoords>({
    top: 0,
    left: 0,
    arrowPlacement: 'none',
    arrowOffset: 0,
  });

  const tooltipRef = useRef<HTMLDivElement>(null);

  // Sync step change
  const setStep = useCallback(
    (index: number) => {
      setCurrentStep(index);
      if (onStepChange) onStepChange(index);
    },
    [onStepChange]
  );

  const activeStep = steps[currentStep] || steps[0];

  // Update rect and positioning
  const updatePosition = useCallback(() => {
    if (!isActive || !activeStep) return;

    if (activeStep.position === 'center' || !activeStep.targetId) {
      setTargetRect(null);
      return;
    }

    const targetEl = document.getElementById(activeStep.targetId);
    if (!targetEl) {
      setTargetRect(null);
      return;
    }

    const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;

    const rect = targetEl.getBoundingClientRect();
    const padding = 8;
    const computedRect: TargetRect = {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      bottom: rect.bottom + padding,
      right: rect.right + padding,
    };

    setTargetRect(computedRect);

    // Scroll into view with optimal breathing room
    const targetHeight = rect.height;
    const isVeryTall = targetHeight > viewportH * 0.55;

    if (isVeryTall) {
      // For large section cards, ensure header and top context are clearly visible
      if (rect.top < 60 || rect.top > 160) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
      }
    } else {
      const inViewport =
        rect.top >= 20 &&
        rect.left >= 20 &&
        rect.bottom <= viewportH - 20 &&
        rect.right <= viewportW - 20;

      if (!inViewport) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }

    // Compute Tooltip Coordinates
    const tooltipWidth = Math.min(viewportW - 32, tooltipRef.current?.offsetWidth || 420);
    const tooltipHeight = tooltipRef.current?.offsetHeight || 240;

    let placement = activeStep.position || 'bottom';
    let top = 0;
    let left = 0;
    let arrowPlacement: 'top' | 'bottom' | 'left' | 'right' | 'none' = 'none';

    // Horizontal centering relative to target
    const targetCenterX = computedRect.left + computedRect.width / 2;
    left = targetCenterX - tooltipWidth / 2;

    // Viewport clamping horizontally
    left = Math.max(16, Math.min(viewportW - tooltipWidth - 16, left));
    const arrowOffset = Math.max(24, Math.min(tooltipWidth - 24, targetCenterX - left));

    const spaceBelow = viewportH - computedRect.bottom;
    const spaceAbove = computedRect.top;

    if (placement === 'bottom') {
      if (spaceBelow >= tooltipHeight + 16) {
        top = computedRect.bottom + 12;
        arrowPlacement = 'top';
      } else if (spaceAbove >= tooltipHeight + 16) {
        top = computedRect.top - tooltipHeight - 12;
        arrowPlacement = 'bottom';
      } else {
        // Large target or small laptop screen: dock to edge with most breathing room
        if (spaceBelow >= spaceAbove) {
          top = viewportH - tooltipHeight - 16;
          arrowPlacement = 'none';
        } else {
          top = 16;
          arrowPlacement = 'none';
        }
      }
    } else if (placement === 'top') {
      if (spaceAbove >= tooltipHeight + 16) {
        top = computedRect.top - tooltipHeight - 12;
        arrowPlacement = 'bottom';
      } else if (spaceBelow >= tooltipHeight + 16) {
        top = computedRect.bottom + 12;
        arrowPlacement = 'top';
      } else {
        if (spaceAbove >= spaceBelow) {
          top = 16;
          arrowPlacement = 'none';
        } else {
          top = viewportH - tooltipHeight - 16;
          arrowPlacement = 'none';
        }
      }
    } else {
      if (spaceBelow >= tooltipHeight + 16) {
        top = computedRect.bottom + 12;
        arrowPlacement = 'top';
      } else if (spaceAbove >= tooltipHeight + 16) {
        top = computedRect.top - tooltipHeight - 12;
        arrowPlacement = 'bottom';
      } else {
        top = viewportH - tooltipHeight - 16;
        arrowPlacement = 'none';
      }
    }

    // STRICT VIEWPORT CLAMP: Tooltip must NEVER bleed outside the screen
    const maxTop = Math.max(16, viewportH - tooltipHeight - 16);
    top = Math.max(16, Math.min(maxTop, top));

    setTooltipCoords({
      top,
      left,
      arrowPlacement,
      arrowOffset,
    });
  }, [isActive, activeStep]);

  useEffect(() => {
    updatePosition();
    const handleScrollOrResize = () => updatePosition();

    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    const timer = setTimeout(updatePosition, 100);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      clearTimeout(timer);
    };
  }, [updatePosition]);

  // Recalculate coordinates across paint phases when step changes to capture exact DOM height
  useEffect(() => {
    updatePosition();
    const t1 = setTimeout(updatePosition, 40);
    const t2 = setTimeout(updatePosition, 160);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [currentStep, updatePosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (isAr) handleNext();
        else handlePrev();
      } else if (e.key === 'ArrowLeft') {
        if (isAr) handlePrev();
        else handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, currentStep, isAr]);

  if (!isActive || !activeStep) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setStep(currentStep - 1);
    }
  };

  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto animate-in fade-in duration-200">
      {/* ── High-Tech Dynamic Spotlight Cutout ── */}
      {targetRect ? (
        <>
          {/* Transparent click blocker with mouse-wheel pass-through so page can be scrolled */}
          <div
            className="fixed inset-0 z-[100] pointer-events-auto bg-transparent touch-pan-y"
            onClick={onClose}
            onWheel={(e) => {
              window.scrollBy({ top: e.deltaY, behavior: 'auto' });
            }}
          />

          {/* Spotlight Highlight Box around actual target element with massive box-shadow backdrop */}
          <div
            className="fixed z-[101] pointer-events-none transition-all duration-300 ease-out rounded-2xl border-2 border-emerald-500 dark:border-emerald-400 shadow-[0_0_0_9999px_rgba(15,23,42,0.5),0_0_20px_rgba(16,185,129,0.4)] dark:shadow-[0_0_0_9999px_rgba(3,7,18,0.78),0_0_25px_rgba(16,185,129,0.55)]"
            style={{
              top: `${Math.max(0, targetRect.top)}px`,
              left: `${Math.max(0, targetRect.left)}px`,
              width: `${targetRect.width}px`,
              height: `${targetRect.height}px`,
            }}
          >
            {/* Pulsing Beacon Indicator */}
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white shadow-xs" />
            </span>
          </div>
        </>
      ) : (
        /* Full Backdrop fallback if target element not currently mounted */
        <div
          className="fixed inset-0 z-[100] bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-xs pointer-events-auto"
          onClick={onClose}
        />
      )}

      {/* ── Dynamic Floating Tooltip Card ── */}
      <div
        ref={tooltipRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-step-title"
        aria-describedby="tour-step-desc"
        aria-label={isAr ? activeStep.titleAr : activeStep.titleEn}
        className={`fixed z-[105] pointer-events-auto w-[calc(100vw-32px)] sm:w-[440px] max-w-lg max-h-[min(540px,calc(100vh-32px))] flex flex-col bg-white/95 dark:bg-slate-900/98 border border-slate-200 dark:border-emerald-500/50 rounded-2xl shadow-2xl shadow-slate-900/15 dark:shadow-2xl backdrop-blur-md text-slate-900 dark:text-slate-100 transition-all duration-200 ease-out ${
          !targetRect
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
            : ''
        }`}
        style={
          targetRect
            ? {
                top: `${tooltipCoords.top}px`,
                left: `${tooltipCoords.left}px`,
              }
            : undefined
        }
        dir="rtl"
      >
        {/* Directional Pointer Arrow */}
        {targetRect && tooltipCoords.arrowPlacement === 'top' && (
          <div
            className="absolute -top-2 w-3.5 h-3.5 bg-white dark:bg-slate-900 border-t border-l border-slate-200 dark:border-emerald-500/50 rotate-45"
            style={{ left: `${tooltipCoords.arrowOffset}px` }}
          />
        )}
        {targetRect && tooltipCoords.arrowPlacement === 'bottom' && (
          <div
            className="absolute -bottom-2 w-3.5 h-3.5 bg-slate-50 dark:bg-slate-950 border-b border-r border-slate-200 dark:border-emerald-500/50 rotate-45"
            style={{ left: `${tooltipCoords.arrowOffset}px` }}
          />
        )}

        {/* Header / Step Tracker */}
        <div className="shrink-0 flex items-center justify-between px-4 pt-3.5 pb-2.5 sm:px-5 sm:pt-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/40 flex items-center justify-center font-black text-xs shrink-0">
              {currentStep + 1}
            </span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              {isAr
                ? `جولة إرشادية حية · خطوة ${currentStep + 1} من ${steps.length}`
                : `Interactive Tour · Step ${currentStep + 1} of ${steps.length}`}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] -m-2 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            aria-label={isAr ? 'إغلاق الجولة الإرشادية' : 'Close guided tour'}
            title={isAr ? 'إغلاق الجولة' : 'Close Tour'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Body (Scrollable if text exceeds available height) */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-3 sm:px-5 sm:py-3.5 space-y-2 [scrollbar-width:thin] scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          <h4 id="tour-step-title" className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug">
            {isAr ? activeStep.titleAr : activeStep.titleEn}
          </h4>
          <p id="tour-step-desc" className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {isAr ? activeStep.descAr : activeStep.descEn}
          </p>

          {(activeStep.tipAr || activeStep.tipEn) && (
            <div className="p-2.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-500/30 dark:text-emerald-300 text-[11px] leading-relaxed flex items-start gap-2 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <span>{isAr ? activeStep.tipAr : activeStep.tipEn}</span>
            </div>
          )}
        </div>

        {/* Step Indicator Dots */}
        <div className="shrink-0 flex items-center justify-center gap-1.5 py-1 px-4" role="tablist" aria-label="Tour progress">
          {steps.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              className="p-1 min-w-[24px] min-h-[24px] flex items-center justify-center cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-full focus-visible:outline-none"
              aria-label={isAr ? `الانتقال إلى خطوة ${i + 1}` : `Jump to step ${i + 1}`}
              aria-current={i === currentStep ? 'step' : undefined}
            >
              <span
                className={`h-1.5 rounded-full transition-all block ${
                  i === currentStep
                    ? 'w-6 bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)] dark:shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                    : 'w-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-500'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Footer Navigation Buttons: Locked and always 100% visible */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3 border-t border-slate-100 dark:border-slate-800 gap-2 bg-slate-50/80 dark:bg-slate-950/40 rounded-b-2xl">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="min-h-[44px] inline-flex items-center gap-1 px-3.5 sm:px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none shadow-xs dark:shadow-none"
          >
            {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            <span>{isAr ? 'السابق' : 'Previous'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            >
              {isAr ? 'إنهاء' : 'Skip'}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-5 sm:px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-black transition-all shadow-md shadow-emerald-600/30 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:outline-none"
            >
              <span>{isLast ? (isAr ? 'تم بنجاح ✓' : 'Done ✓') : isAr ? 'التالي' : 'Next'}</span>
              {!isLast &&
                (isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
