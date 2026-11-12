'use client';

import React, { useRef, useMemo, useCallback } from 'react';
import { SlidersHorizontal, Layers, RotateCcw } from 'lucide-react';

export interface FilterChip {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }> | React.ReactNode;
  badgeVariant?: 'default' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple' | 'slate' | string;
}

export interface QuickFilterBarProps {
  chips: FilterChip[];
  activeChipId: string;
  onSelectChip: (id: string) => void;
  onOpenAdvanced?: () => void;
  isAdvancedActive?: boolean;
  totalCount?: number;
  className?: string;
  onClearAll?: () => void;
  showClearAll?: boolean;
  clearAllLabel?: string;
  wrap?: boolean;
  dir?: 'rtl' | 'ltr' | 'auto';
}

const getBadgeClasses = (variant: string | undefined, isActive: boolean): string => {
  if (isActive) {
    return 'bg-white/20 dark:bg-slate-950/30 text-white border border-white/25 shadow-xs';
  }
  switch (variant) {
    case 'amber':
    case 'warning':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/70 dark:border-amber-800/60';
    case 'rose':
    case 'danger':
    case 'red':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/70 dark:border-rose-800/60';
    case 'emerald':
    case 'success':
    case 'green':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-800/60';
    case 'sky':
    case 'info':
    case 'blue':
      return 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300/70 dark:border-sky-800/60';
    case 'purple':
    case 'violet':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300/70 dark:border-purple-800/60';
    case 'slate':
    default:
      return 'bg-slate-200 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-300/50 dark:border-slate-600/40';
  }
};

export const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  chips,
  activeChipId,
  onSelectChip,
  onOpenAdvanced,
  isAdvancedActive = false,
  totalCount,
  className = '',
  onClearAll,
  showClearAll,
  clearAllLabel = 'مسح الفلاتر',
  wrap = false,
  dir = 'auto',
}) => {
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Determine whether any non-default filter is currently active
  const isFilterActive = useMemo(() => {
    const isFirstChip = chips.length > 0 && chips[0].id === activeChipId;
    const isExplicitAll = activeChipId === 'all';
    return (!isFirstChip && !isExplicitAll) || Boolean(isAdvancedActive);
  }, [chips, activeChipId, isAdvancedActive]);

  const canShowClearAll = showClearAll !== undefined ? showClearAll : isFilterActive;

  // Handle clear-all / reset logic
  const handleClear = useCallback(() => {
    if (onClearAll) {
      onClearAll();
    } else if (chips.length > 0) {
      onSelectChip(chips[0].id);
    }
  }, [onClearAll, chips, onSelectChip]);

  // RTL-aware Keyboard Navigation for filter chips
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const total = chips.length;
      if (total <= 1) return;

      const isRtl =
        dir === 'rtl' ||
        (dir !== 'ltr' &&
          (typeof document !== 'undefined'
            ? document.dir === 'rtl' || document.documentElement.dir === 'rtl'
            : true));

      let targetIndex = -1;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          // In RTL layout, ArrowRight moves backward towards start (index - 1)
          targetIndex = isRtl ? (index - 1 + total) % total : (index + 1) % total;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          // In RTL layout, ArrowLeft moves forward towards end (index + 1)
          targetIndex = isRtl ? (index + 1) % total : (index - 1 + total) % total;
          break;
        case 'Home':
          e.preventDefault();
          targetIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          targetIndex = total - 1;
          break;
        default:
          return;
      }

      if (targetIndex >= 0 && chipRefs.current[targetIndex]) {
        chipRefs.current[targetIndex]?.focus();
      }
    },
    [chips.length, dir]
  );

  return (
    <div
      role="toolbar"
      aria-label="شريط الفلاتر السريعة"
      className={`glass-card bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800/90 p-2 sm:p-2.5 rounded-2xl shadow-xs flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5 sm:gap-3 transition-colors ${className}`}
    >
      {/* Filter Chips List (Scrollable or Wrapped) */}
      <div
        ref={containerRef}
        role="group"
        aria-label="خيارات التصفية السريعة"
        className={`flex-1 min-w-0 ${
          wrap
            ? 'flex flex-wrap items-center gap-1.5 sm:gap-2 py-0.5'
            : 'overflow-x-auto no-scrollbar scroll-smooth py-0.5 flex items-center gap-1.5 sm:gap-2'
        }`}
      >
        {chips.map((chip, index) => {
          const isActive = chip.id === activeChipId;
          const IconComponent = typeof chip.icon === 'function' ? chip.icon : null;
          const badgeClass = getBadgeClasses(chip.badgeVariant, isActive);
          const accessibleLabel = `${chip.label}${
            typeof chip.count === 'number' ? ` (${chip.count})` : ''
          }`;

          return (
            <button
              key={chip.id}
              ref={(el) => {
                chipRefs.current[index] = el;
              }}
              type="button"
              role="button"
              aria-pressed={isActive}
              aria-label={accessibleLabel}
              onClick={() => onSelectChip(chip.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`group inline-flex items-center gap-2 px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 select-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-[0.98] ${
                isActive
                  ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-sm shadow-emerald-700/25 ring-2 ring-emerald-500/30 border border-emerald-600 dark:border-emerald-500'
                  : 'bg-slate-100/80 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-700/60'
              }`}
            >
              {/* RTL Icon Placement */}
              {IconComponent ? (
                <IconComponent
                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                    isActive
                      ? 'text-emerald-100'
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                  }`}
                  aria-hidden="true"
                />
              ) : React.isValidElement(chip.icon) ? (
                <span
                  className={`w-3.5 h-3.5 shrink-0 inline-flex items-center justify-center transition-colors ${
                    isActive
                      ? 'text-emerald-100'
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                  }`}
                  aria-hidden="true"
                >
                  {chip.icon}
                </span>
              ) : null}

              <span>{chip.label}</span>

              {/* Active / Inactive Badge Styling */}
              {typeof chip.count === 'number' && (
                <span
                  className={`min-w-[18px] h-4.5 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none inline-flex items-center justify-center transition-colors ${badgeClass}`}
                >
                  {chip.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Advanced Filter, Clear-All Button & Total Counter */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 border-s border-slate-200 dark:border-slate-800 ps-2.5 sm:ps-3 ms-auto md:ms-0">
        {/* Clear All Button */}
        {canShowClearAll && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="إعادة ضبط الفلاتر واستعراض الكل"
            title="إعادة ضبط الفلاتر"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/70 dark:border-slate-700/60 hover:border-rose-200 dark:hover:border-rose-900/60 transition-all duration-150 select-none shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0 rtl:scale-x-[-1]" aria-hidden="true" />
            <span className="hidden sm:inline">{clearAllLabel}</span>
          </button>
        )}

        {/* Total Count */}
        {typeof totalCount === 'number' && (
          <div
            role="status"
            aria-label={`إجمالي السجلات: ${totalCount}`}
            className="hidden md:flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 font-mono px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60"
          >
            <Layers className="w-3 h-3 text-slate-400" aria-hidden="true" />
            <span>الإجمالي: {totalCount}</span>
          </div>
        )}

        {/* Advanced Filter Button */}
        {onOpenAdvanced && (
          <button
            type="button"
            onClick={onOpenAdvanced}
            aria-haspopup="dialog"
            aria-expanded={isAdvancedActive}
            aria-pressed={isAdvancedActive}
            aria-label="تصفية وفلترة متقدمة"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all duration-150 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-[0.98] ${
              isAdvancedActive
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <SlidersHorizontal
              className={`w-3.5 h-3.5 ${
                isAdvancedActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              aria-hidden="true"
            />
            <span className="hidden xs:inline">فلتر متقدم</span>
            <span className="xs:hidden">تصفية</span>
            {isAdvancedActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuickFilterBar;
