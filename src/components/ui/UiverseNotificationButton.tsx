'use client';

/**
 * UiverseNotificationButton — زر التنبيهات النيوني المتوهج مع شارة النبض
 * ──────────────────────────────────────────────────────────────────────────
 * Adapted from Uiverse.io by themrsami.
 * Features:
 *  - Outer animated ping badge with unread count
 *  - Deep black & neon emerald gradient border with hover ambient glow
 *  - Pulsing bell container with backdrop blur
 *  - Dynamic 3-stage animated dot trail
 *  - Full RTL/LTR and Dark/Light mode support
 */

import React from 'react';
import { Bell } from 'lucide-react';

export interface UiverseNotificationButtonProps {
  id?: string;
  count?: number;
  title?: string;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
  variant?: 'emerald' | 'blue' | 'amber';
  compact?: boolean;
  dir?: 'rtl' | 'ltr';
  ariaLabel?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  ariaHasPopup?: boolean | 'dialog' | 'menu' | 'listbox' | 'tree' | 'grid';
}

export const UiverseNotificationButton = React.forwardRef<
  HTMLButtonElement,
  UiverseNotificationButtonProps
>(
  (
    {
      id,
      count = 3,
      title = 'تحديثات جديدة',
      subtitle = 'تفقد مركز الإشعارات',
      onClick,
      className = '',
      variant = 'emerald',
      compact = false,
      dir,
      ariaLabel,
      ariaExpanded,
      ariaControls,
      ariaHasPopup,
    },
    ref
  ) => {
    const isEmerald = variant === 'emerald';
    const isBlue = variant === 'blue';

    const glowShadow = isBlue
      ? 'shadow-blue-500/20'
    : isEmerald
    ? 'shadow-emerald-500/20'
    : 'shadow-amber-500/20';

  const iconGradient = isBlue
    ? 'from-blue-400 to-blue-600'
    : isEmerald
    ? 'from-emerald-400 to-emerald-600'
    : 'from-amber-400 to-amber-600';

  const iconBlur = isBlue
    ? 'bg-blue-500/50'
    : isEmerald
    ? 'bg-emerald-500/50'
    : 'bg-amber-500/50';

  const subtextColor = isBlue
    ? 'text-blue-600 dark:text-blue-400/80'
    : isEmerald
    ? 'text-emerald-600 dark:text-emerald-400/80'
    : 'text-amber-600 dark:text-amber-400/80';

  const dotColor = isBlue
    ? 'bg-blue-500'
    : isEmerald
    ? 'bg-emerald-500'
    : 'bg-amber-500';

  const dotColor50 = isBlue
    ? 'bg-blue-500/50'
    : isEmerald
    ? 'bg-emerald-500/50'
    : 'bg-amber-500/50';

  const dotColor30 = isBlue
    ? 'bg-blue-500/30'
    : isEmerald
    ? 'bg-emerald-500/30'
    : 'bg-amber-500/30';

  const outerGradient = isBlue
    ? 'from-blue-400 via-blue-500 to-blue-600'
    : isEmerald
    ? 'from-emerald-400 via-emerald-500 to-emerald-600'
    : 'from-amber-400 via-amber-500 to-amber-600';

  return (
    <button
      ref={ref}
      id={id}
      type="button"
      onClick={onClick}
      dir={dir}
      aria-label={ariaLabel || `${title}: ${count} ${subtitle}`}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-haspopup={ariaHasPopup}
      className={`group relative inline-block min-w-[44px] min-h-[44px] text-start cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl select-none transition-transform active:scale-[0.98] ${className}`}
    >
      {/* Ping Badge if count > 0 */}
      {count > 0 && (
        <div
          className={`absolute -top-2 z-10 pointer-events-none ${
            dir === 'rtl' ? '-start-2' : '-end-2'
          }`}
          style={{ [dir === 'rtl' ? 'left' : 'right']: '-6px' }}
        >
          <div className="flex h-5 w-5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white dark:ring-stone-950 tabular-nums leading-none">
              {count > 99 ? '99+' : count}
            </span>
          </div>
        </div>
      )}

      <div
        className={`relative overflow-hidden rounded-xl bg-gradient-to-bl from-slate-200 via-slate-100 to-slate-200 dark:from-gray-900 dark:via-gray-950 dark:to-black p-[1px] shadow-2xl ${glowShadow} border border-slate-200/80 dark:border-transparent transition-all duration-300`}
      >
        <div
          className={`relative flex items-center ${
            compact ? 'gap-2 px-3 py-2' : 'gap-4 px-4 sm:px-6 py-2.5 sm:py-3'
          } rounded-xl bg-white/95 dark:bg-gray-950 transition-all duration-300 group-hover:bg-slate-50 dark:group-hover:bg-gray-950/70`}
        >
          {/* Glowing Icon Container */}
          <div
            className={`relative flex ${
              compact ? 'h-8 w-8' : 'h-10 w-10'
            } shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${iconGradient} transition-transform duration-300 group-hover:scale-110 shadow-sm`}
          >
            <Bell className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-white relative z-10`} />
            <div
              className={`absolute inset-0 rounded-lg ${iconBlur} blur-sm transition-all duration-300 group-hover:blur-md`}
            />
          </div>

          {/* Titles */}
          {!compact && (
            <div className="flex flex-col items-start min-w-0">
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {title}
              </span>
              <span className={`text-[10px] sm:text-[11px] font-medium ${subtextColor} truncate`}>
                {subtitle}
              </span>
            </div>
          )}

          {/* Dot Trail */}
          {!compact && (
            <div className="ms-auto flex items-center gap-1 shrink-0 ps-2">
              <div
                className={`h-1.5 w-1.5 rounded-full ${dotColor} transition-transform duration-300 group-hover:scale-150`}
              />
              <div
                className={`h-1.5 w-1.5 rounded-full ${dotColor50} transition-transform duration-300 group-hover:scale-150 group-hover:delay-100`}
              />
              <div
                className={`h-1.5 w-1.5 rounded-full ${dotColor30} transition-transform duration-300 group-hover:scale-150 group-hover:delay-200`}
              />
            </div>
          )}
        </div>

        {/* Hover Ambient Glow Overlay */}
        <div
          className={`absolute inset-0 rounded-xl bg-gradient-to-br ${outerGradient} opacity-10 dark:opacity-20 transition-opacity duration-300 group-hover:opacity-30 dark:group-hover:opacity-40 pointer-events-none`}
        />
      </div>
    </button>
  );
});

UiverseNotificationButton.displayName = 'UiverseNotificationButton';

export const NotificationBadgeButton = UiverseNotificationButton;
export default UiverseNotificationButton;
