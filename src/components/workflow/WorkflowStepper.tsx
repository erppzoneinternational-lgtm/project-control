'use client';

import React from 'react';
import { Check, X, GitFork } from 'lucide-react';

export interface WorkflowStepItem {
  key: string;
  label: string;
  subLabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface WorkflowStepperProps {
  steps: WorkflowStepItem[];
  currentStep: string;
  variant?: 'linear' | 'fork';
  completedSteps?: string[];
  rejectedSteps?: string[];
  className?: string;
  onStepClick?: (stepKey: string) => void;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  steps,
  currentStep,
  variant = 'linear',
  completedSteps,
  rejectedSteps,
  className = '',
  onStepClick,
}) => {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  // Helper to determine step status
  const getStepStatus = (
    stepKey: string,
    index: number
  ): 'completed' | 'current' | 'rejected' | 'upcoming' => {
    if (rejectedSteps?.includes(stepKey)) {
      return 'rejected';
    }
    if (completedSteps) {
      if (completedSteps.includes(stepKey)) {
        return 'completed';
      }
    } else if (currentIndex >= 0 && index < currentIndex) {
      return 'completed';
    }

    if (stepKey === currentStep) {
      return 'current';
    }

    return 'upcoming';
  };

  const getStatusAriaLabel = (
    status: 'completed' | 'current' | 'rejected' | 'upcoming'
  ) => {
    switch (status) {
      case 'completed':
        return 'مكتمل (Completed)';
      case 'rejected':
        return 'مرفوض / ملاحظات (Rejected)';
      case 'current':
        return 'المرحلة الحالية (Current step)';
      case 'upcoming':
      default:
        return 'قادم (Upcoming)';
    }
  };

  // Connecting line styling between step[index] and step[index+1]
  const getConnectorStyle = (
    status: 'completed' | 'current' | 'rejected' | 'upcoming',
    nextStatus?: 'completed' | 'current' | 'rejected' | 'upcoming'
  ) => {
    if (status === 'completed') {
      if (nextStatus === 'completed') {
        return 'bg-emerald-500 dark:bg-emerald-500';
      }
      if (nextStatus === 'current') {
        return 'bg-gradient-to-r rtl:bg-gradient-to-l from-emerald-500 to-amber-500';
      }
      if (nextStatus === 'rejected') {
        return 'bg-gradient-to-r rtl:bg-gradient-to-l from-emerald-500 to-rose-500';
      }
      return 'bg-emerald-500/70 dark:bg-emerald-500/60';
    }
    if (status === 'rejected') {
      return 'bg-rose-400 dark:bg-rose-500';
    }
    if (status === 'current') {
      return 'bg-gradient-to-r rtl:bg-gradient-to-l from-amber-500 to-slate-200 dark:to-slate-700';
    }
    return 'bg-slate-200 dark:bg-slate-700';
  };

  return (
    <nav
      aria-label="مسار مراحل سير العمل (Workflow Stages)"
      className={`glass-card bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 p-4 rounded-3xl shadow-xs ${className}`}
    >
      {/* Variant Header indicator if Fork */}
      {variant === 'fork' && (
        <div
          role="status"
          className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400"
        >
          <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            <GitFork className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            <span>مسار سير العمل المتشعب (Forked Workflow)</span>
          </span>
          <span className="text-[10px] bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
            مسارات قرار متعددة
          </span>
        </div>
      )}

      {/* Stepper Horizontal Container */}
      <div className="overflow-x-auto scrollbar-none py-2">
        <ol
          role="list"
          className="flex items-start justify-between min-w-max sm:min-w-0 w-full gap-1 sm:gap-2 px-1"
        >
          {steps.map((step, index) => {
            const status = getStepStatus(step.key, index);
            const nextStatus =
              index < steps.length - 1
                ? getStepStatus(steps[index + 1].key, index + 1)
                : undefined;
            const isLast = index === steps.length - 1;
            const isClickable = Boolean(onStepClick);
            const StepIcon = step.icon;

            // Step Indicator Badge / Dot Styles
            const renderStepIndicator = () => {
              switch (status) {
                case 'completed':
                  return (
                    <div
                      className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-emerald-600/30 border border-emerald-400/80 dark:border-emerald-500 ring-2 ring-emerald-500/20 transition-all duration-200 group-hover:scale-105"
                      title="مكتمل"
                    >
                      <Check className="w-4 h-4 stroke-[2.75] drop-shadow-xs" aria-hidden="true" />
                    </div>
                  );
                case 'rejected':
                  return (
                    <div
                      className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-700 text-white flex items-center justify-center font-bold text-xs ring-4 ring-rose-400/25 dark:ring-rose-500/25 shadow-md shadow-rose-500/20 border border-rose-400 dark:border-rose-500 transition-all duration-200 group-hover:scale-105"
                      title="مرفوض / ملاحظات"
                    >
                      <X className="w-4 h-4 stroke-[2.75] drop-shadow-xs" aria-hidden="true" />
                    </div>
                  );
                case 'current':
                  return (
                    <div
                      className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-amber-400/35 dark:ring-amber-500/30 shadow-md shadow-amber-500/35 border border-amber-300 dark:border-amber-400 transition-all duration-200 group-hover:scale-105"
                      title="المرحلة الحالية"
                    >
                      {/* Animated outer glowing ring / radar pulse */}
                      <span className="absolute -inset-1 rounded-full bg-amber-400/40 dark:bg-amber-400/25 animate-ping opacity-60 pointer-events-none" />
                      <span className="absolute -inset-0.5 rounded-full bg-amber-500/30 dark:bg-amber-400/20 blur-[1px] animate-pulse pointer-events-none" />

                      {StepIcon ? (
                        <StepIcon className="relative z-10 w-4 h-4 text-white drop-shadow-xs" />
                      ) : (
                        <span className="relative z-10 w-2.5 h-2.5 rounded-full bg-white shadow-xs animate-pulse" />
                      )}

                      {/* Micro pulse status dot on active step with icon */}
                      {StepIcon && (
                        <span
                          className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 bg-amber-100 border-2 border-amber-600 rounded-full animate-pulse z-20"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  );
                case 'upcoming':
                default:
                  return (
                    <div
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-mono font-medium text-xs transition-all duration-200 group-hover:scale-105"
                      title="قادم"
                    >
                      {StepIcon ? (
                        <StepIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                  );
              }
            };

            const stepContent = (
              <>
                {/* Indicator Icon/Dot aligned to fixed height container */}
                <div className="h-8 sm:h-9 flex items-center justify-center relative">
                  {renderStepIndicator()}
                </div>

                {/* Labels */}
                <div className="mt-2 flex flex-col items-center">
                  <span
                    className={`text-xs leading-tight sm:leading-snug transition-colors line-clamp-2 ${
                      status === 'current'
                        ? 'font-bold text-amber-900 dark:text-amber-300'
                        : status === 'completed'
                        ? 'font-bold text-slate-900 dark:text-slate-100'
                        : status === 'rejected'
                        ? 'font-bold text-rose-700 dark:text-rose-400'
                        : 'font-medium text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>

                  {step.subLabel && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1 font-normal">
                      {step.subLabel}
                    </span>
                  )}

                  {/* Screen reader only status announcement */}
                  <span className="sr-only">
                    {` - ${getStatusAriaLabel(status)}`}
                  </span>
                </div>
              </>
            );

            return (
              <React.Fragment key={step.key}>
                {/* Step Item */}
                <li
                  className={`group flex flex-col items-center text-center flex-shrink-0 ${
                    isClickable ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  style={{ minWidth: '90px', maxWidth: '160px' }}
                  aria-current={status === 'current' ? 'step' : undefined}
                >
                  {isClickable ? (
                    <button
                      type="button"
                      onClick={() => onStepClick?.(step.key)}
                      aria-current={status === 'current' ? 'step' : undefined}
                      aria-label={`${index + 1}: ${step.label} (${getStatusAriaLabel(status)})`}
                      className="w-full flex flex-col items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 rounded-xl p-1 transition-colors"
                    >
                      {stepContent}
                    </button>
                  ) : (
                    <div className="w-full flex flex-col items-center">
                      {stepContent}
                    </div>
                  )}
                </li>

                {/* Horizontal Connector Line */}
                {!isLast && (
                  <li
                    aria-hidden="true"
                    className="flex-1 h-8 sm:h-9 flex items-center px-1 sm:px-2 min-w-[20px] sm:min-w-[36px]"
                  >
                    <div
                      className={`h-[2px] w-full rounded-full transition-all duration-300 ${getConnectorStyle(
                        status,
                        nextStatus
                      )}`}
                    />
                  </li>
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default WorkflowStepper;
