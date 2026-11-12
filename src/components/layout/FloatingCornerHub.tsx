'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  SlidersHorizontal,
  Compass,
  Megaphone,
  X,
  Palette,
  Volume2,
  VolumeX,
  LayoutGrid,
  Columns,
  Minimize2,
  Orbit,
  Globe,
  Radio,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePortalTourStore } from '@/lib/stores/usePortalTourStore';
import { useNavPreferencesStore } from '@/lib/stores/useNavPreferencesStore';
import { useSystemChangelogStore } from '@/lib/stores/useSystemChangelogStore';
import { LATEST_PORTAL_VERSION } from '@/lib/changelog/systemUpdates';
import { useUserActivity } from '@/components/providers/UserActivityTracker';
import { formatDuration } from '@/lib/services/userActivity.service';
import { FontCustomizerButton } from './FontCustomizerButton';
import { TORoleWorkflowGuide } from '@/components/technical-office/TORoleWorkflowGuide';

export interface FloatingCornerHubProps {
  isDark: boolean;
  onThemeToggle: () => void;
}

type DockStyleMode = 'orbital' | 'capsule';

/**
 * Plays an ultra-subtle, futuristic Web Audio crystalline harmonic chord
 * when switching between Solar (Light) and Lunar (Dark) modes.
 */
function playThemeHarmonicChime(toDark: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const freqs = toDark ? [528, 396, 264] : [396, 528, 660];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);

      gain.gain.setValueAtTime(0.0001, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.035, now + idx * 0.045 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + 0.42);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.45);
    });

    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 700);
  } catch {
    // Ignore audio context restrictions
  }
}

export const FloatingCornerHub: React.FC<FloatingCornerHubProps> = ({
  isDark,
  onThemeToggle,
}) => {
  const { locale, toggleLocale } = useLanguage();
  const isAr = locale === 'ar';

  // Unified User Activity Telemetry (eliminates any separate colliding corner pill)
  const {
    status: activityStatus,
    isPinging,
    todayMinutes,
    totalMinutes,
    forceHeartbeat,
  } = useUserActivity();

  const formattedToday = formatDuration(todayMinutes, isAr);
  const formattedTotal = formatDuration(totalMinutes, isAr);

  const activityMeta = {
    active: {
      dot: 'bg-emerald-500',
      ping: 'bg-emerald-400',
      textAr: 'نشط',
      textEn: 'Active',
      badgeCls: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
    },
    idle: {
      dot: 'bg-amber-500',
      ping: 'bg-amber-400',
      textAr: 'خامل',
      textEn: 'Idle',
      badgeCls: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25',
    },
    paused: {
      dot: 'bg-slate-400',
      ping: 'bg-slate-300',
      textAr: 'متوقف',
      textEn: 'Paused',
      badgeCls: 'text-slate-600 dark:text-slate-400 bg-slate-500/10 border-slate-500/25',
    },
  }[activityStatus];

  const openTourSelector = usePortalTourStore((s) => s.openSelector);
  const {
    layoutMode,
    densityMode,
    setLayoutMode,
    setDensityMode,
    openCustomizer,
  } = useNavPreferencesStore();
  const openChangelog = useSystemChangelogStore((s) => s.openChangelog);
  const hasUnreadUpdate = useSystemChangelogStore((s) => s.hasUnreadUpdate);

  const [isExpanded, setIsExpanded] = useState(false);
  const [dockStyle, setDockStyle] = useState<DockStyleMode>('orbital');
  const [showCustomizeMenu, setShowCustomizeMenu] = useState(false);
  const [showRoleGuideModal, setShowRoleGuideModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isAnimatingTheme, setIsAnimatingTheme] = useState(false);
  const [hoveredSatellite, setHoveredSatellite] = useState<string | null>(null);
  const [magneticOffset, setMagneticOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rippleCoords, setRippleCoords] = useState<{
    x: number;
    y: number;
    nextDark: boolean;
  } | null>(null);

  const hubRef = useRef<HTMLDivElement>(null);
  const orbButtonRef = useRef<HTMLButtonElement>(null);

  // Restore saved dock style & sound preference
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedStyle = localStorage.getItem('pzone_corner_hub_style');
    if (savedStyle === 'capsule' || savedStyle === 'orbital') {
      setDockStyle(savedStyle);
    }
    const savedSound = localStorage.getItem('pzone_corner_hub_sound');
    if (savedSound === 'off') {
      setSoundEnabled(false);
    }
  }, []);

  const handleSetDockStyle = (style: DockStyleMode) => {
    setDockStyle(style);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pzone_corner_hub_style', style);
    }
  };

  const handleToggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('pzone_corner_hub_sound', next ? 'on' : 'off');
      }
      return next;
    });
  };

  // Close popover on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (hubRef.current && !hubRef.current.contains(e.target as Node)) {
        setShowCustomizeMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Subtle magnetic pull on the Celestial Core Orb
  const handleOrbMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = Math.max(-6, Math.min(6, (e.clientX - centerX) * 0.22));
    const dy = Math.max(-6, Math.min(6, (e.clientY - centerY) * 0.22));
    setMagneticOffset({ x: dx, y: dy });
  }, []);

  const handleOrbMouseLeave = useCallback(() => {
    setMagneticOffset({ x: 0, y: 0 });
  }, []);

  /**
   * Executes a 3-layer Celestial Eclipse & Shockwave transition from the corner orb
   * across the entire viewport using View Transitions API + Dual Shockwave Rings.
   */
  const triggerEclipseTransition = useCallback(
    (originEl?: HTMLElement | null) => {
      const targetEl = originEl || orbButtonRef.current;
      const rect = targetEl?.getBoundingClientRect();
      const x = rect ? Math.round(rect.left + rect.width / 2) : window.innerWidth / 2;
      const y = rect ? Math.round(rect.top + rect.height / 2) : window.innerHeight / 2;
      const nextDark = !isDark;

      if (soundEnabled) {
        playThemeHarmonicChime(nextDark);
      }

      setIsAnimatingTheme(true);
      setRippleCoords({ x, y, nextDark });

      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const docAny = document as unknown as {
        startViewTransition?: (cb: () => void) => {
          ready: Promise<void>;
          finished: Promise<void>;
        };
      };

      if (
        typeof docAny.startViewTransition === 'function' &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        try {
          document.documentElement.classList.add('pzone-theme-transitioning');

          const transition = docAny.startViewTransition(() => {
            onThemeToggle();
          });

          transition.ready
            .then(() => {
              document.documentElement.animate(
                {
                  clipPath: [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${Math.ceil(maxRadius)}px at ${x}px ${y}px)`,
                  ],
                },
                {
                  duration: 650,
                  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                  pseudoElement: '::view-transition-new(root)',
                }
              );
            })
            .catch(() => {});

          transition.finished.finally(() => {
            document.documentElement.classList.remove('pzone-theme-transitioning');
          });
        } catch {
          onThemeToggle();
        }
      } else {
        onThemeToggle();
      }

      window.setTimeout(() => {
        setIsAnimatingTheme(false);
        setRippleCoords(null);
      }, 720);
    },
    [isDark, onThemeToggle, soundEnabled]
  );

  // Compute radial arc coordinates for Orbital Mode
  // In RTL (bottom-left corner), X goes positive (to the right) and Y goes negative (upward)
  // In LTR (bottom-right corner), X goes negative (to the left) and Y goes negative (upward)
  const dirSign = isAr ? 1 : -1;
  const satellites = [
    {
      id: 'tour-global-role-guide',
      key: 'role-guide',
      label: isAr ? 'دليل الأدوار والعمل' : 'Role & Workflow Guide',
      shortLabel: isAr ? 'دليل الأدوار' : 'Roles',
      subtitle: isAr ? 'كل واحد بيعمل إيه وفين؟' : 'Who does what & where?',
      icon: Compass,
      accent: 'from-teal-500 to-emerald-600 text-white border-teal-400/50 shadow-teal-500/30',
      arcX: dirSign * 78,
      arcY: -6,
      onClick: () => {
        setShowCustomizeMenu(false);
        setShowRoleGuideModal(true);
      },
    },
    {
      id: 'tour-global-help-tour',
      key: 'guided-tour',
      label: isAr ? 'الجولة التعريفية التفاعلية' : 'Interactive Guided Tour',
      shortLabel: isAr ? 'الجولة التعريفية' : 'Tour',
      subtitle: isAr ? 'شرح حي لخطوات الصفحة' : 'Interactive spotlight walkthrough',
      icon: Sparkles,
      accent: 'from-emerald-500 to-cyan-600 text-white border-emerald-400/50 shadow-emerald-500/30',
      arcX: dirSign * 58,
      arcY: -58,
      onClick: () => {
        setShowCustomizeMenu(false);
        openTourSelector();
      },
    },
    {
      id: 'tour-global-more-tools',
      key: 'customizer',
      label: isAr ? 'استوديو تخصيص الواجهة' : 'Workspace & UI Studio',
      shortLabel: isAr ? 'تخصيص' : 'Studio',
      subtitle: isAr ? 'الخطوط، التخطيط، اللغة والتحديثات' : 'Fonts, layout, language & updates',
      icon: SlidersHorizontal,
      accent: showCustomizeMenu
        ? 'from-amber-500 to-orange-600 text-slate-950 border-amber-300 shadow-amber-500/40'
        : 'from-indigo-600 to-violet-700 text-white border-indigo-400/50 shadow-indigo-500/30',
      badge: hasUnreadUpdate,
      arcX: dirSign * 6,
      arcY: -80,
      onClick: () => setShowCustomizeMenu((prev) => !prev),
    },
  ];

  return (
    <>
      {/* ═══ 1. Full-Screen Celestial Eclipse Wave + Dual Shockwave Rings ═══ */}
      {rippleCoords && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden print:hidden"
        >
          {/* Primary Radial Plasma Wave */}
          <span
            style={{
              left: `${rippleCoords.x}px`,
              top: `${rippleCoords.y}px`,
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none animate-[pzoneThemeWave_700ms_cubic-bezier(0.16,1,0.3,1)_forwards] ${
              rippleCoords.nextDark
                ? 'bg-radial from-indigo-500/35 via-teal-500/20 to-transparent'
                : 'bg-radial from-amber-300/45 via-sky-300/25 to-transparent'
            }`}
          />

          {/* Secondary Crisp Refractive Shockwave Ring */}
          <span
            style={{
              left: `${rippleCoords.x}px`,
              top: `${rippleCoords.y}px`,
            }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none border animate-[pzoneShockwaveRing_680ms_cubic-bezier(0.16,1,0.3,1)_forwards] ${
              rippleCoords.nextDark
                ? 'border-teal-400/70 shadow-[0_0_60px_12px_rgba(45,212,191,0.35)]'
                : 'border-amber-400/80 shadow-[0_0_60px_12px_rgba(251,191,36,0.45)]'
            }`}
          />
        </div>
      )}

      {/* ═══ 2. Unified Floating Corner Celestial Command Hub (Zero Collision) ═══ */}
      <div
        ref={hubRef}
        dir={isAr ? 'rtl' : 'ltr'}
        className="fixed bottom-20 md:bottom-7 end-4 md:end-5 z-40 print:hidden flex flex-col items-end gap-2 select-none"
      >
        {/* ═══ A. Holographic Workspace & UI Studio Deck ═══ */}
        {showCustomizeMenu && (
          <div
            role="dialog"
            aria-label={isAr ? 'استوديو تخصيص الواجهة والخطوط' : 'Workspace & UI Customization Studio'}
            className="mb-12 w-[315px] sm:w-[345px] rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/90 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.5)] p-4 space-y-3 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-200 ring-1 ring-black/5 dark:ring-white/10"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm">
                  <Palette className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
                    {isAr ? 'استوديو تخصيص الواجهة الذكي' : 'Smart Workspace Studio'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {isAr ? 'تحكم فوري في المظهر، التخطيط، والخطوط' : 'Instant theme, layout & typography control'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCustomizeMenu(false)}
                className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 0. Unified Live Work Activity Telemetry Card */}
            <div className="p-2.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  {activityStatus === 'active' && (
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isPinging ? 'animate-ping ' + activityMeta.ping : 'opacity-0'
                      }`}
                    />
                  )}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${activityMeta.dot}`} />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-slate-800 dark:text-slate-100">
                      {isAr ? `جلسة العمل: ${activityMeta.textAr}` : `Session: ${activityMeta.textEn}`}
                    </span>
                    <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      {formattedToday}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    {isAr ? `الإجمالي المسجل: ${formattedTotal}` : `Total logged: ${formattedTotal}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={forceHeartbeat}
                title={isAr ? 'مزامنة نبض النشاط الآن' : 'Sync activity heartbeat now'}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] font-black text-emerald-600 dark:text-emerald-400 hover:border-emerald-500 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Radio className={`w-3 h-3 ${isPinging ? 'animate-pulse text-emerald-500' : ''}`} />
                <span>{isAr ? 'مزامنة' : 'Sync'}</span>
              </button>
            </div>

            {/* 1. Interactive Solar vs Lunar Theme Cards */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                {isAr ? 'المشهد البصري (مع تأثير الموجة الضوئية)' : 'Visual Atmosphere'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    if (isDark) triggerEclipseTransition(e.currentTarget);
                  }}
                  className={`relative overflow-hidden rounded-2xl p-2.5 text-start border transition-all cursor-pointer ${
                    !isDark
                      ? 'bg-gradient-to-br from-amber-50 via-orange-50 to-sky-50 border-amber-400 ring-2 ring-amber-400/30 shadow-sm'
                      : 'bg-slate-100/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-sm flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-white dark:bg-amber-100" />
                    </span>
                    {!isDark && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950">
                        {isAr ? 'مفعل' : 'Active'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {isAr ? 'الوضع الصباحي' : 'Solar Light'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {isAr ? 'إضاءة نهارية عالية التباين' : 'High-contrast daylight'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    if (!isDark) triggerEclipseTransition(e.currentTarget);
                  }}
                  className={`relative overflow-hidden rounded-2xl p-2.5 text-start border transition-all cursor-pointer ${
                    isDark
                      ? 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-teal-400/70 ring-2 ring-teal-400/25 shadow-sm'
                      : 'bg-slate-100/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 opacity-75 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-indigo-600 to-teal-400 shadow-sm flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-slate-950" />
                    </span>
                    {isDark && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-teal-400 text-slate-950">
                        {isAr ? 'مفعل' : 'Active'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {isAr ? 'الوضع الليلي' : 'Lunar Dark'}
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    {isAr ? 'مريح للعين في العمل الطويل' : 'Deep obsidian focus'}
                  </p>
                </button>
              </div>
            </div>

            {/* 2. Instant Navigation Layout Mode Switcher */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                {isAr ? 'نمط تخطيط التنقل الرئيسي' : 'Navigation Layout'}
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode('topbar');
                    setDensityMode('standard');
                  }}
                  className={`px-2 py-2 rounded-xl border text-[11px] font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    layoutMode === 'topbar' && densityMode === 'standard'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>{isAr ? 'شريط مزدوج' : 'Dual Bar'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLayoutMode('topbar');
                    setDensityMode('compact');
                  }}
                  className={`px-2 py-2 rounded-xl border text-[11px] font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    layoutMode === 'topbar' && densityMode === 'compact'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'شريط مدمج' : 'Single Bar'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode('sidebar')}
                  className={`px-2 py-2 rounded-xl border text-[11px] font-black flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    layoutMode === 'sidebar'
                      ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-900 dark:text-emerald-200'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>{isAr ? 'قائمة جانبية' : 'Sidebar'}</span>
                </button>
              </div>
            </div>

            {/* 3. Corner Hub Style Switcher (Orbital Fan vs Glass Capsule) */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                {isAr ? 'شكل الكبسولة الطائرة في الزاوية' : 'Corner Hub Geometry'}
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSetDockStyle('orbital')}
                  className={`px-2.5 py-2 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    dockStyle === 'orbital'
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-900 dark:text-indigo-200'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Orbit className="w-3.5 h-3.5" />
                  <span>{isAr ? 'مدار فلكي طائر' : 'Orbital Arc'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetDockStyle('capsule')}
                  className={`px-2.5 py-2 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    dockStyle === 'capsule'
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 border-indigo-500 text-indigo-900 dark:text-indigo-200'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{isAr ? 'كبسولة أفقية' : 'Glass Capsule'}</span>
                </button>
              </div>
            </div>

            {/* 4. Typography & Font Customizer */}
            <div className="px-3 py-2 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {isAr ? 'نوع وحجم الخط العربي:' : 'Arabic Typography:'}
              </span>
              <FontCustomizerButton />
            </div>

            {/* 5. Quick Utility Row: Language + Sound + Changelog + Full Customizer */}
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <button
                type="button"
                onClick={() => {
                  toggleLocale();
                  setShowCustomizeMenu(false);
                }}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{isAr ? 'اللغة' : 'Language'}</span>
                </span>
                <span className="text-[10px] font-mono font-black px-1.5 py-0.5 rounded bg-white dark:bg-slate-900">
                  {isAr ? 'EN' : 'عربي'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleToggleSound}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-teal-500" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>{isAr ? 'الصوت التفاعلي' : 'Audio FX'}</span>
                </span>
                <span className="text-[10px] font-black">
                  {soundEnabled ? (isAr ? 'مفعل' : 'ON') : (isAr ? 'صامت' : 'OFF')}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowCustomizeMenu(false);
                  openCustomizer();
                }}
                className="flex-1 min-h-[40px] px-3 py-2 rounded-2xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعدادات الأشرطة المتقدمة' : 'Advanced Bar Settings'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCustomizeMenu(false);
                  openChangelog();
                }}
                title={isAr ? 'سجل تحديثات المنظومة' : "What's New"}
                className="min-h-[40px] px-3 py-2 rounded-2xl text-xs font-black bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-400/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Megaphone className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-mono text-[11px]">v{LATEST_PORTAL_VERSION}</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══ B. Orbital Constellation Arc OR Sleek Capsule Container ═══ */}
        {dockStyle === 'orbital' ? (
          <div
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => {
              if (!showCustomizeMenu) setIsExpanded(false);
            }}
            className="flex flex-col items-center gap-1"
          >
            <div className="relative flex items-center justify-center w-14 h-14">
              {/* Subtle Orbital Guide Ring when Expanded */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute rounded-full border border-dashed transition-all duration-500 ${
                  isExpanded
                    ? 'w-40 h-40 opacity-35 border-emerald-500/40 dark:border-teal-400/30 scale-100'
                    : 'w-12 h-12 opacity-0 scale-50 border-transparent'
                }`}
              />

              {/* Floating Satellite Nodes along the Quarter-Circle Arc */}
              {satellites.map((sat, idx) => {
                const SatIcon = sat.icon;
                const isHovered = hoveredSatellite === sat.key;
                return (
                  <div
                    key={sat.key}
                    style={{
                      transform: isExpanded
                        ? `translate3d(${sat.arcX}px, ${sat.arcY}px, 0) scale(1)`
                        : 'translate3d(0px, 0px, 0) scale(0.35)',
                      transitionDelay: isExpanded ? `${idx * 45}ms` : '0ms',
                    }}
                    className={`absolute z-30 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      isExpanded
                        ? 'opacity-100 pointer-events-auto'
                        : 'opacity-0 pointer-events-none'
                    }`}
                  >
                    {/* Floating Holographic Label Tooltip on Hover */}
                    {isHovered && (
                      <div
                        className={`pointer-events-none absolute bottom-full mb-2 ${
                          isAr ? 'left-0' : 'right-0'
                        } whitespace-nowrap px-3 py-1.5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white border border-white/15 shadow-xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 z-50`}
                      >
                        <p className="text-[11px] font-black text-emerald-300 leading-tight">
                          {sat.label}
                        </p>
                        <p className="text-[9.5px] font-bold text-slate-300">
                          {sat.subtitle}
                        </p>
                      </div>
                    )}

                    <button
                      id={sat.id}
                      type="button"
                      onClick={sat.onClick}
                      onMouseEnter={() => setHoveredSatellite(sat.key)}
                      onMouseLeave={() => setHoveredSatellite(null)}
                      aria-label={sat.label}
                      title={sat.label}
                      className={`group relative w-11 h-11 rounded-2xl bg-gradient-to-br ${sat.accent} border shadow-lg flex flex-col items-center justify-center gap-0.5 hover:scale-112 active:scale-95 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400`}
                    >
                      <SatIcon className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                      <span className="text-[8px] font-black leading-none tracking-tight opacity-95">
                        {sat.shortLabel.split(' ')[0]}
                      </span>
                      {sat.badge && (
                        <span className="absolute -top-1 -end-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-950 animate-ping" />
                      )}
                    </button>
                  </div>
                );
              })}

              {/* Satellite Orbit Expand/Collapse Mini-Trigger Ring Button */}
              <button
                type="button"
                onClick={() => {
                  setIsExpanded((prev) => !prev);
                  setShowCustomizeMenu(false);
                }}
                title={
                  isAr
                    ? isExpanded
                      ? 'طي المدار العائم'
                      : 'فتح مدار الأدوات السريعة'
                    : isExpanded
                      ? 'Collapse orbital tools'
                      : 'Expand orbital tools'
                }
                aria-label={isAr ? 'تبديل مدار الأدوات السريعة' : 'Toggle orbital tools'}
                className={`absolute -top-1 -start-1 z-50 w-5.5 h-5.5 rounded-full border shadow-md flex items-center justify-center transition-all cursor-pointer ${
                  isExpanded
                    ? 'bg-slate-900 text-emerald-400 border-emerald-500/50 hover:bg-slate-800'
                    : 'bg-emerald-600 text-white border-emerald-300 animate-pulse'
                }`}
              >
                <Orbit className={`w-3 h-3 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* ═══ CENTERPIECE: The Celestial Eclipse Reactor Orb (#tour-global-theme-toggle) ═══ */}
              <button
                ref={orbButtonRef}
                id="tour-global-theme-toggle"
                type="button"
                onClick={(e) => triggerEclipseTransition(e.currentTarget)}
                onMouseMove={handleOrbMouseMove}
                onMouseLeave={() => {
                  handleOrbMouseLeave();
                  setHoveredSatellite(null);
                }}
                onMouseEnter={() => setHoveredSatellite('theme-core')}
                style={{
                  transform: `translate3d(${magneticOffset.x}px, ${magneticOffset.y}px, 0)`,
                }}
                aria-label={isAr ? (isDark ? 'تفعيل الوضع الصباحي' : 'تفعيل الوضع الليلي') : 'Toggle color theme'}
                title={
                  isAr
                    ? isDark
                      ? 'الوضع الليلي مفعل — اضغط للتحول إلى الوضع الصباحي بتأثير الكسوف الضوئي'
                      : 'الوضع الصباحي مفعل — اضغط للتحول إلى الوضع الليلي بتأثير الكسوف الضوئي'
                    : 'Click to trigger Eclipse Theme Transition'
                }
                className={`group relative z-40 w-12.5 h-12.5 rounded-full flex items-center justify-center transition-shadow duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                  isDark
                    ? 'shadow-[0_0_30px_-4px_rgba(45,212,191,0.55),inset_0_2px_10px_rgba(255,255,255,0.2)]'
                    : 'shadow-[0_0_30px_-4px_rgba(251,191,36,0.75),inset_0_2px_10px_rgba(255,255,255,0.6)]'
                }`}
              >
                {/* Spinning Conic Aura Halo */}
                <span
                  aria-hidden="true"
                  className={`absolute -inset-0.5 rounded-full opacity-80 blur-[2px] animate-[pzoneOrbitSpin_10s_linear_infinite] ${
                    isDark
                      ? 'bg-[conic-gradient(from_0deg,#14b8a6,#6366f1,#f59e0b,#14b8a6)]'
                      : 'bg-[conic-gradient(from_0deg,#f59e0b,#38bdf8,#fb7185,#f59e0b)]'
                  }`}
                />

                {/* Inner Celestial Sphere Diorama */}
                <span
                  className={`relative w-11 h-11 rounded-full overflow-hidden flex flex-col items-center justify-center transition-all duration-500 border ${
                    isDark
                      ? 'bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900 border-teal-400/50'
                      : 'bg-gradient-to-b from-sky-400 via-amber-200 to-orange-300 border-amber-300'
                  }`}
                >
                  {/* Custom SVG Celestial Sun & Moon Eclipse Graphic */}
                  <svg
                    viewBox="0 0 64 64"
                    className={`w-8 h-8 transition-transform duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                      isAnimatingTheme
                        ? 'rotate-[360deg] scale-125'
                        : 'group-hover:scale-110'
                    }`}
                    fill="none"
                  >
                    {isDark ? (
                      <>
                        <circle cx="16" cy="18" r="1.3" fill="#fef08a" className="animate-pulse" />
                        <circle cx="48" cy="15" r="1" fill="#5eead4" />
                        <circle cx="14" cy="40" r="1" fill="#c7d2fe" />
                        <circle cx="50" cy="42" r="1.4" fill="#fef08a" className="animate-pulse" />
                        <path
                          d="M38.5 16C30.5 16 24 22.5 24 30.5C24 38.5 30.5 45 38.5 45C42.2 45 45.5 43.6 48 41.3C41.2 42.2 35 36.9 35 30C35 23.5 40.5 18.2 47 18.8C44.5 17 41.6 16 38.5 16Z"
                          fill="url(#lunarGrad)"
                          stroke="#fde68a"
                          strokeWidth="1.2"
                        />
                        <ellipse
                          cx="32"
                          cy="32"
                          rx="22"
                          ry="8"
                          transform="rotate(-24 32 32)"
                          stroke="#2dd4bf"
                          strokeWidth="1"
                          strokeDasharray="3 3"
                          opacity="0.65"
                        />
                        <defs>
                          <linearGradient id="lunarGrad" x1="24" y1="16" x2="48" y2="45" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#fef08a" />
                            <stop offset="1" stopColor="#f59e0b" />
                          </linearGradient>
                        </defs>
                      </>
                    ) : (
                      <>
                        <g stroke="#fffbeb" strokeWidth="2.2" strokeLinecap="round" opacity="0.9">
                          <line x1="32" y1="10" x2="32" y2="14" />
                          <line x1="32" y1="50" x2="32" y2="54" />
                          <line x1="10" y1="32" x2="14" y2="32" />
                          <line x1="50" y1="32" x2="54" y2="32" />
                          <line x1="16.5" y1="16.5" x2="19.5" y2="19.5" />
                          <line x1="44.5" y1="44.5" x2="47.5" y2="47.5" />
                          <line x1="47.5" y1="16.5" x2="44.5" y2="19.5" />
                          <line x1="19.5" y1="44.5" x2="16.5" y2="47.5" />
                        </g>
                        <circle
                          cx="32"
                          cy="32"
                          r="12"
                          fill="url(#solarGrad)"
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        <defs>
                          <radialGradient id="solarGrad" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(29 29) rotate(45) scale(16)">
                            <stop stopColor="#ffffff" />
                            <stop offset="0.5" stopColor="#fde047" />
                            <stop offset="1" stopColor="#f97316" />
                          </radialGradient>
                        </defs>
                      </>
                    )}
                  </svg>

                  {/* Micro Mode Caption Inside Core */}
                  <span
                    className={`text-[7.5px] font-black tracking-tight leading-none -mt-1 ${
                      isDark ? 'text-amber-300' : 'text-slate-950'
                    }`}
                  >
                    {isAr ? (isDark ? 'ليلي' : 'صباحي') : isDark ? 'DARK' : 'LIGHT'}
                  </span>
                </span>

                {/* Hover Callout Pill for Core Orb */}
                {hoveredSatellite === 'theme-core' && (
                  <div
                    className={`pointer-events-none absolute bottom-full mb-2.5 ${
                      isAr ? 'left-0' : 'right-0'
                    } whitespace-nowrap px-3 py-1.5 rounded-2xl bg-slate-900/95 text-white border border-white/15 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 z-50`}
                  >
                    <p className="text-[11px] font-black text-amber-300">
                      {isAr
                        ? isDark
                          ? 'اضغط للتحول إلى الوضع الصباحي ☀️'
                          : 'اضغط للتحول إلى الوضع الليلي 🌙'
                        : isDark
                          ? 'Switch to Solar Light Mode'
                          : 'Switch to Lunar Dark Mode'}
                    </p>
                  </div>
                )}
              </button>
            </div>

            {/* Integrated Docked Telemetry Base Pill (Shown when Orbital Hub is hovered/expanded) */}
            {(isExpanded || showCustomizeMenu) && (
              <button
                type="button"
                onClick={() => setShowCustomizeMenu((prev) => !prev)}
                title={
                  isAr
                    ? `حالة النشاط: ${activityMeta.textAr} (${formattedToday}) — اضغط لفتح استوديو الواجهة`
                    : `Activity: ${activityMeta.textEn} (${formattedToday})`
                }
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/90 dark:border-slate-700/90 shadow-md hover:border-emerald-500/50 transition-all cursor-pointer animate-in fade-in duration-150"
              >
                <span className="relative flex h-2 w-2">
                  {activityStatus === 'active' && (
                    <span
                      className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isPinging ? 'animate-ping ' + activityMeta.ping : 'opacity-0'
                      }`}
                    />
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${activityMeta.dot}`} />
                </span>
                <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">
                  {isAr ? activityMeta.textAr : activityMeta.textEn}
                </span>
                {todayMinutes > 0 && (
                  <span className="text-[9.5px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                    {formattedToday}
                  </span>
                )}
              </button>
            )}
          </div>
        ) : (
          /* ═══ Alternative Mode: Sleek Horizontal Levitating Glass Capsule ═══ */
          <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.4)] ring-1 ring-black/5 dark:ring-white/10">
            <button
              type="button"
              onClick={() => handleSetDockStyle('orbital')}
              title={isAr ? 'التحويل إلى المدار الفلكي الطائر' : 'Switch to Orbital Arc'}
              aria-label={isAr ? 'التحويل إلى المدار الفلكي الطائر' : 'Switch to Orbital Arc'}
              className="w-8 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Orbit className="w-4 h-4" />
            </button>

            {/* Integrated Activity Indicator inside Capsule */}
            <button
              type="button"
              onClick={() => setShowCustomizeMenu((prev) => !prev)}
              className={`h-8 px-2.5 rounded-full border text-[10px] font-black flex items-center gap-1.5 cursor-pointer ${activityMeta.badgeCls}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activityMeta.dot}`} />
              <span>{isAr ? activityMeta.textAr : activityMeta.textEn}</span>
              {todayMinutes > 0 && <span className="font-mono">{formattedToday}</span>}
            </button>

            {satellites.map((sat) => {
              const SatIcon = sat.icon;
              return (
                <button
                  key={sat.key}
                  id={sat.id}
                  type="button"
                  onClick={sat.onClick}
                  aria-label={sat.label}
                  title={sat.label}
                  className="h-9 px-3 rounded-full text-xs font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer relative"
                >
                  <SatIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="hidden sm:inline">{sat.shortLabel}</span>
                  {sat.badge && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  )}
                </button>
              );
            })}

            <button
              ref={orbButtonRef}
              id="tour-global-theme-toggle"
              type="button"
              onClick={(e) => triggerEclipseTransition(e.currentTarget)}
              aria-label={isAr ? (isDark ? 'تفعيل الوضع الصباحي' : 'تفعيل الوضع الليلي') : 'Toggle color theme'}
              className={`h-10 px-3.5 rounded-full font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                isDark
                  ? 'bg-gradient-to-r from-slate-800 via-indigo-950 to-slate-900 text-amber-300 border border-amber-400/40'
                  : 'bg-gradient-to-r from-amber-400 via-orange-400 to-sky-500 text-slate-950 border border-amber-300'
              }`}
            >
              <span>{isAr ? (isDark ? '🌙 الوضع الليلي' : '☀️ الوضع الصباحي') : isDark ? 'Dark' : 'Light'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ═══ 3. Global Role & Workflow Guide Modal ═══ */}
      {showRoleGuideModal && (
        <TORoleWorkflowGuide
          isModal={true}
          onClose={() => setShowRoleGuideModal(false)}
        />
      )}
    </>
  );
};
