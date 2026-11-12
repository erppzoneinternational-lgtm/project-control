'use client';

/**
 * UiverseRevealButton — زر الإجراءات والأيقونات التفاعلي بنمط Reveal
 * ──────────────────────────────────────────────────────────────
 * Adapted from Uiverse.io by lvloper with full Next.js, Tailwind,
 * customizable icons, color variants, active state, and accessibility.
 */

import React from 'react';
import Link from 'next/link';

export type RevealButtonColor = 'yellow' | 'emerald' | 'blue' | 'rose' | 'amber' | 'purple';
export type RevealButtonSize = 'sm' | 'md' | 'lg';

export interface UiverseRevealButtonProps {
  label?: string;
  icon?: React.ReactNode;
  color?: RevealButtonColor;
  size?: RevealButtonSize;
  onClick?: () => void;
  href?: string;
  active?: boolean;
  className?: string;
  ariaLabel?: string;
  title?: string;
}

const COLOR_CLASSES: Record<RevealButtonColor, { bg: string; text: string; activeBg: string; activeText: string }> = {
  yellow: {
    bg: 'bg-slate-100/95 dark:bg-slate-800/95 border border-slate-200/90 dark:border-slate-700 group-hover:bg-yellow-300 group-hover:border-yellow-400',
    text: 'text-slate-500 dark:text-slate-400 group-hover:text-stone-900',
    activeBg: 'bg-yellow-400 border border-amber-500 ring-2 ring-amber-400/50 shadow-amber-400/30',
    activeText: 'text-stone-950',
  },
  emerald: {
    bg: 'bg-emerald-500',
    text: 'text-white',
    activeBg: 'bg-emerald-600 ring-2 ring-emerald-400/50',
    activeText: 'text-white',
  },
  blue: {
    bg: 'bg-blue-500',
    text: 'text-white',
    activeBg: 'bg-blue-600 ring-2 ring-blue-400/50',
    activeText: 'text-white',
  },
  rose: {
    bg: 'bg-rose-500',
    text: 'text-white',
    activeBg: 'bg-rose-600 ring-2 ring-rose-400/50',
    activeText: 'text-white',
  },
  amber: {
    bg: 'bg-amber-400',
    text: 'text-stone-900',
    activeBg: 'bg-amber-500 ring-2 ring-amber-400/50',
    activeText: 'text-stone-950',
  },
  purple: {
    bg: 'bg-purple-500',
    text: 'text-white',
    activeBg: 'bg-purple-600 ring-2 ring-purple-400/50',
    activeText: 'text-white',
  },
};

const SIZE_CLASSES: Record<RevealButtonSize, { container: string; circle: string; iconScale: string; text: string }> = {
  sm: {
    container: 'w-11 h-11 min-w-[44px] min-h-[44px]',
    circle: 'w-11 h-11 min-w-[44px] min-h-[44px]',
    iconScale: 'scale-[0.75]',
    text: 'text-[10px]',
  },
  md: {
    container: 'w-14 h-14',
    circle: 'w-14 h-14',
    iconScale: 'scale-100',
    text: 'text-xs',
  },
  lg: {
    container: 'w-16 h-16',
    circle: 'w-16 h-16',
    iconScale: 'scale-110',
    text: 'text-sm',
  },
};

// Default Thumbs Up SVG from lvloper
export function DefaultLikeSvg({ filled = false }: { filled?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 26.463 26.647"
      aria-hidden="true"
    >
      <g transform="translate(1.5 1.5)">
        <path
          d="M7,10V24.188"
          transform="translate(-1.088 -0.541)"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
        <path
          d="M17.37,6.587l-1.182,4.871h6.893a2.365,2.365,0,0,1,2.27,3.027L22.6,23.944a2.365,2.365,0,0,1-2.27,1.7H4.365A2.365,2.365,0,0,1,2,23.282V13.823a2.365,2.365,0,0,1,2.365-2.365H7.628a2.365,2.365,0,0,0,2.116-1.312L13.823,2A3.7,3.7,0,0,1,17.37,6.587Z"
          transform="translate(-2 -2)"
          fill={filled ? 'currentColor' : 'none'}
          fillOpacity={filled ? 0.25 : 0}
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
        />
      </g>
    </svg>
  );
}

export function UiverseRevealButton({
  label = 'Like',
  icon,
  color = 'yellow',
  size = 'md',
  onClick,
  href,
  active = false,
  className = '',
  ariaLabel,
  title,
}: UiverseRevealButtonProps) {
  const colorCfg = COLOR_CLASSES[color] || COLOR_CLASSES.yellow;
  const sizeCfg = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const resolvedAriaLabel = ariaLabel || label;
  const resolvedTitle = title || label;

  const bgClasses = active
    ? `${colorCfg.activeBg} ${colorCfg.activeText}`
    : `${colorCfg.bg.replaceAll('group-hover:', 'group-hover/reveal:')} ${colorCfg.text.replaceAll('group-hover:', 'group-hover/reveal:')}`;

  const content = (
    <div
      className={`overflow-x-visible relative ${sizeCfg.container} overflow-y-clip group/reveal text-center cursor-pointer select-none ${className}`}
      title={resolvedTitle}
    >
      {/* Circle Icon Badge */}
      <div
        className={`flex justify-center items-center ${sizeCfg.circle} rounded-full transition-all duration-300 absolute top-0 group-hover/reveal:scale-[.60] group-hover/reveal:origin-top shadow-sm ${bgClasses}`}
      >
        <div className={sizeCfg.iconScale}>
          {icon || <DefaultLikeSvg filled={active} />}
        </div>
      </div>

      {/* Hidden sliding label */}
      <div
        className={`absolute font-bold -bottom-10 left-1/2 ${sizeCfg.text} text-center ${
          active ? 'text-amber-700 dark:text-amber-300' : 'text-slate-800 dark:text-slate-100'
        } whitespace-nowrap transition-all duration-300 transform -translate-x-1/2 group-hover/reveal:bottom-0`}
      >
        {label}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} aria-label={resolvedAriaLabel} className="inline-flex items-center justify-center min-w-[44px] min-h-[44px]">
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      aria-label={resolvedAriaLabel}
      aria-pressed={active}
      className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] bg-transparent border-0 p-0 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full active:scale-90 transition-transform"
    >
      {content}
    </button>
  );
}
