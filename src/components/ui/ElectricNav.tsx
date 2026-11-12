'use client';

import React, { useRef, useEffect, useCallback } from 'react';

export interface ElectricNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  title?: string;
  'aria-label'?: string;
}

export interface ElectricNavProps {
  items: ElectricNavItem[];
  activeId: string;
  onChange?: (id: string) => void;
  className?: string;
  glowColor?: string; // e.g. 'rgba(14, 165, 233, 0.85)'
  coreColor?: string; // e.g. '#0284C7'
  height?: number; // Indicator height in px (default 3.5)
  indicatorWidth?: number | 'auto' | 'full'; // Resting width behavior (default 'auto')
  role?: 'navigation' | 'tablist' | 'radiogroup'; // Accessible role (default 'navigation')
  ariaLabel?: string; // Accessible label (default 'Navigation')
  ariaCurrent?: 'page' | 'step' | 'location' | 'date' | 'time' | boolean; // Current page indicator (default 'page')
}

export function ElectricNav({
  items,
  activeId,
  onChange,
  className = '',
  glowColor = 'rgba(14, 165, 233, 0.85)',
  coreColor = '#0284C7',
  height = 3.5,
  indicatorWidth = 'auto',
  role = 'navigation',
  ariaLabel = 'Navigation',
  ariaCurrent = 'page',
}: ElectricNavProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const itemsRef = useRef<Map<string, HTMLElement>>(new Map());
  const isMountedRef = useRef<boolean>(false);

  // Animation state ref to avoid React render cycles during 60fps RAF loop
  const animRef = useRef<{
    rafId: number | null;
    startTime: number;
    duration: number;
    dir: number; // +1 or -1
    currentHead: number;
    currentTail: number;
    currentW: number;
    isAnimating: boolean;
  }>({
    rafId: null,
    startTime: 0,
    duration: 450, // ms
    dir: 1,
    currentHead: 0,
    currentTail: 0,
    currentW: 44,
    isAnimating: false,
  });

  // Track position and proportional indicator width of a tab
  const getTabRect = useCallback(
    (id: string) => {
      const el = itemsRef.current.get(id);
      const inner = innerRef.current;
      if (!el || !inner) return null;

      const elRect = el.getBoundingClientRect();
      const iRect = inner.getBoundingClientRect();

      const left = elRect.left - iRect.left;
      const width = elRect.width;
      const center = left + width / 2;

      // Determine resting width for this specific tab
      let indW: number;
      if (typeof indicatorWidth === 'number') {
        indW = Math.min(indicatorWidth, Math.max(20, width - 8));
      } else if (indicatorWidth === 'full') {
        indW = Math.max(20, width - 12);
      } else {
        // 'auto' (proportional resting width that scales gracefully)
        indW = Math.max(28, Math.min(width - 16, Math.max(36, Math.round(width * 0.7))));
      }

      return {
        left,
        width,
        center,
        indicatorWidth: indW,
      };
    },
    [indicatorWidth]
  );

  // Draw current indicator on canvas with devicePixelRatio sharpness
  const drawIndicator = useCallback(
    (head: number, tail: number, barY: number, barH: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const left = Math.min(head, tail);
      const right = Math.max(head, tail);
      const w = Math.max(right - left, barH); // at least a pill circle

      ctx.save();
      ctx.scale(dpr, dpr);

      // Glow aura
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 1;

      // Linear gradient for electric surge feel
      const grad = ctx.createLinearGradient(left, 0, right, 0);
      grad.addColorStop(0, coreColor);
      grad.addColorStop(0.5, '#38BDF8');
      grad.addColorStop(1, coreColor);

      ctx.fillStyle = grad;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(left, barY, w, barH, barH / 2);
      } else {
        ctx.rect(left, barY, w, barH);
      }
      ctx.fill();

      // Hot-white center streak
      ctx.shadowBlur = 4;
      ctx.shadowColor = '#FFFFFF';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      const streakW = Math.max(barH, w * 0.55);
      const streakX = left + (w - streakW) / 2;
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(streakX, barY + barH * 0.25, streakW, barH * 0.5, barH * 0.25);
      } else {
        ctx.rect(streakX, barY + barH * 0.25, streakW, barH * 0.5);
      }
      ctx.fill();

      ctx.restore();
    },
    [glowColor, coreColor]
  );

  // Physics animation loop using the "Electric Nav / Surge" formulation
  const animateTo = useCallback(
    (fromId: string, toId: string) => {
      const fromRect = getTabRect(fromId);
      const toRect = getTabRect(toId);
      if (!toRect) return;

      const canvas = canvasRef.current;
      const inner = innerRef.current;
      if (!canvas || !inner) return;

      const targetW = toRect.indicatorWidth;
      const targetCenter = toRect.center;
      const targetLeft = targetCenter - targetW / 2;
      const targetRight = targetCenter + targetW / 2;
      const barY = inner.clientHeight - height - 2;

      if (!fromRect) {
        // Instant snap on mount
        animRef.current.currentHead = targetRight;
        animRef.current.currentTail = targetLeft;
        animRef.current.currentW = targetW;
        drawIndicator(targetRight, targetLeft, barY, height);
        return;
      }

      const fromW = fromRect.indicatorWidth;
      const fromCenter = fromRect.center;
      const fromLeft = fromCenter - fromW / 2;
      const fromRight = fromCenter + fromW / 2;

      const dir = targetCenter > fromCenter ? 1 : -1;
      const dist = Math.abs(targetCenter - fromCenter);

      // Stop ongoing animation
      if (animRef.current.rafId) {
        cancelAnimationFrame(animRef.current.rafId);
      }

      const duration = Math.min(550, Math.max(300, 0.4 * dist + 240));
      const startTime = performance.now();
      animRef.current.startTime = startTime;
      animRef.current.duration = duration;
      animRef.current.dir = dir;
      animRef.current.isAnimating = true;

      const frame = (now: number) => {
        const elapsed = (now - startTime) / duration;
        const t = Math.min(1, Math.max(0, elapsed));

        if (t >= 1) {
          // Snapped to destination
          animRef.current.currentHead = targetRight;
          animRef.current.currentTail = targetLeft;
          animRef.current.currentW = targetW;
          animRef.current.isAnimating = false;
          drawIndicator(targetRight, targetLeft, barY, height);
          return;
        }

        /* ============================================================
           Surge / Electric Nav formula:
           Head moves with smooth ease-in-out toward target.
           Tau determines tail lag (triangle curve peaked at t = 0.5).
           Resting width smoothly morphs between origin and target.
           ============================================================ */
        const headEase = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const tau = 1 - 2 * Math.abs(t - 0.5);
        const maxStretch = Math.min(dist * 0.65, 75);
        const curW = fromW + (targetW - fromW) * headEase;

        let head: number;
        let tail: number;

        if (dir === 1) {
          // Moving right: head is the leading right edge, tail is trailing left edge
          head = fromRight + (targetRight - fromRight) * headEase;
          tail = head - curW - maxStretch * tau;
        } else {
          // Moving left: head is the leading left edge, tail is trailing right edge
          head = fromLeft - (fromLeft - targetLeft) * headEase;
          tail = head + curW + maxStretch * tau;
        }

        animRef.current.currentHead = head;
        animRef.current.currentTail = tail;
        animRef.current.currentW = curW;
        drawIndicator(head, tail, barY, height);

        animRef.current.rafId = requestAnimationFrame(frame);
      };

      animRef.current.rafId = requestAnimationFrame(frame);
    },
    [getTabRect, drawIndicator, height]
  );

  // Keep canvas sized to inner pill container
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const inner = innerRef.current;
    if (!canvas || !inner) return;

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const w = inner.scrollWidth;
    const h = inner.clientHeight;

    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    // Redraw resting indicator under current active tab
    const rect = getTabRect(activeId);
    if (rect) {
      const barY = h - height - 2;
      const left = rect.center - rect.indicatorWidth / 2;
      const right = rect.center + rect.indicatorWidth / 2;
      drawIndicator(right, left, barY, height);
    }
  }, [activeId, getTabRect, drawIndicator, height]);

  // Track previous activeId to animate transitions
  const prevActiveRef = useRef<string>(activeId);

  // Resize listener + ResizeObserver for responsive & dynamic font updates
  useEffect(() => {
    resizeCanvas();
    const inner = innerRef.current;
    if (!inner) return;

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        resizeCanvas();
      });
      ro.observe(inner);
    }

    window.addEventListener('resize', resizeCanvas);
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  // Transition animation on activeId change
  useEffect(() => {
    if (prevActiveRef.current !== activeId) {
      animateTo(prevActiveRef.current, activeId);
      prevActiveRef.current = activeId;
    } else {
      // First mount render
      const raf = requestAnimationFrame(() => {
        const rect = getTabRect(activeId);
        const inner = innerRef.current;
        if (rect && inner) {
          const barY = inner.clientHeight - height - 2;
          const left = rect.center - rect.indicatorWidth / 2;
          const right = rect.center + rect.indicatorWidth / 2;
          drawIndicator(right, left, barY, height);
        }
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [activeId, animateTo, getTabRect, drawIndicator, height]);

  // Ensure active tab is smoothly scrolled into view on mobile / narrow viewports
  useEffect(() => {
    const activeEl = itemsRef.current.get(activeId);
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: isMountedRef.current ? 'smooth' : 'auto',
        block: 'nearest',
        inline: 'nearest',
      });
    }
    isMountedRef.current = true;
  }, [activeId]);

  // Accessible keyboard navigation (ArrowLeft / ArrowRight / Home / End)
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const isRtl =
      typeof document !== 'undefined' &&
      (document.documentElement.dir === 'rtl' ||
        Boolean(containerRef.current?.closest('[dir="rtl"]')));
    const nextKey = isRtl ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = isRtl ? 'ArrowRight' : 'ArrowLeft';

    let targetIndex = -1;
    if (e.key === nextKey) {
      targetIndex = (index + 1) % items.length;
    } else if (e.key === prevKey) {
      targetIndex = (index - 1 + items.length) % items.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
    } else if (e.key === 'End') {
      targetIndex = items.length - 1;
    }

    if (targetIndex !== -1) {
      e.preventDefault();
      const targetItem = items[targetIndex];
      if (targetItem && !targetItem.disabled) {
        itemsRef.current.get(targetItem.id)?.focus();
        onChange?.(targetItem.id);
      }
    }
  };

  const navRoleProps =
    role === 'tablist'
      ? { role: 'tablist', 'aria-label': ariaLabel }
      : role === 'radiogroup'
      ? { role: 'radiogroup', 'aria-label': ariaLabel }
      : { 'aria-label': ariaLabel };

  return (
    <nav
      ref={containerRef}
      className={`relative inline-flex max-w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${className}`}
      {...navRoleProps}
    >
      {/* Scrollable Track Pill Container */}
      <div
        ref={innerRef}
        className="relative inline-flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800/80 backdrop-blur-md shadow-2xs min-w-max select-none"
      >
        {/* Background Canvas for Electric Nav Glowing Slug */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10 w-full h-full rounded-2xl"
          aria-hidden="true"
        />

        {/* Tab Items (Links or Buttons) */}
        <div className="relative z-20 flex items-center gap-1 sm:gap-1.5 w-full">
          {items.map((item, index) => {
            const isActive = item.id === activeId;
            const itemKey = item.id;
            const refCallback = (el: HTMLElement | null) => {
              if (el) itemsRef.current.set(item.id, el);
              else itemsRef.current.delete(item.id);
            };

            const commonClasses = `relative flex items-center gap-2 rtl:gap-2.5 px-3.5 py-2 rtl:px-4 rtl:py-1.5 rounded-xl text-xs font-black transition-colors duration-200 cursor-pointer shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:focus-visible:ring-sky-400 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-900 ${
              item.disabled
                ? 'opacity-40 cursor-not-allowed pointer-events-none'
                : isActive
                ? 'text-slate-950 dark:text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/60 dark:bg-slate-900/60 dark:hover:bg-slate-800/60'
            }`;

            const badgeElement = item.badge !== undefined && (
              <span
                className={`ms-1.5 shrink-0 text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none transition-colors duration-200 ${
                  isActive
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/90 dark:text-sky-300 dark:border dark:border-sky-800/60'
                    : 'bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {item.badge}
              </span>
            );

            const content = (
              <>
                {item.icon && <span className="shrink-0 flex items-center justify-center">{item.icon}</span>}
                <span>{item.label}</span>
                {badgeElement}
              </>
            );

            // If item has href, render accessible link
            if (item.href) {
              return (
                <a
                  key={itemKey}
                  ref={refCallback}
                  href={item.href}
                  target={item.target}
                  rel={item.rel}
                  role="link"
                  aria-current={isActive ? ariaCurrent : undefined}
                  aria-label={item['aria-label']}
                  title={item.title}
                  onClick={(e: React.MouseEvent<HTMLAnchorElement>) => {
                    if (item.disabled) {
                      e.preventDefault();
                      return;
                    }
                    onChange?.(item.id);
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLAnchorElement>) => handleKeyDown(e, index)}
                  className={commonClasses}
                >
                  {content}
                </a>
              );
            }

            // Otherwise render button with context-sensitive ARIA roles
            const buttonAriaProps =
              role === 'tablist'
                ? {
                    role: 'tab' as const,
                    'aria-selected': isActive,
                    tabIndex: isActive ? 0 : -1,
                  }
                : role === 'radiogroup'
                ? {
                    role: 'radio' as const,
                    'aria-checked': isActive,
                  }
                : {
                    'aria-current': isActive ? ariaCurrent : undefined,
                  };

            return (
              <button
                key={itemKey}
                ref={refCallback}
                type="button"
                disabled={item.disabled}
                aria-label={item['aria-label']}
                title={item.title}
                onClick={() => {
                  if (!item.disabled) onChange?.(item.id);
                }}
                onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => handleKeyDown(e, index)}
                className={commonClasses}
                {...buttonAriaProps}
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default ElectricNav;
