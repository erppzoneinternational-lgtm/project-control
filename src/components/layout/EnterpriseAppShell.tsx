'use client';

import React, { useState, useEffect, useRef, createContext, useContext, Suspense, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { TopNav } from './TopNav';
import { EnterpriseSidebar } from './EnterpriseSidebar';
import { NavCustomizerModal } from './NavCustomizerModal';
import { useNavPreferencesStore } from '@/lib/stores/useNavPreferencesStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { NavigationPersistence } from './NavigationPersistence';
import { UiverseFloatingDock } from '@/components/ui/UiverseFloatingDock';
import { PortalGuidedTour } from '@/components/ui/PortalGuidedTour';
import { SystemChangelogModal } from '@/components/ui/SystemChangelogModal';
import { FloatingCornerHub } from './FloatingCornerHub';
import { isFocusedProjectsMode } from '@/lib/config/module-visibility';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { Archive, FolderKanban, PlusCircle } from 'lucide-react';

export type SidebarMode = 'hidden';

export interface ShellContextType {
  sidebarMode: SidebarMode;
  setSidebarMode: (mode: SidebarMode) => void;
  toggleSidebar: () => void;
  isDark: boolean;
  toggleTheme: () => void;
}

const ShellContext = createContext<ShellContextType>({
  sidebarMode: 'hidden',
  setSidebarMode: () => {},
  toggleSidebar: () => {},
  isDark: true,
  toggleTheme: () => {},
});

export const useEnterpriseShell = () => useContext(ShellContext);

export interface EnterpriseAppShellProps {
  children?: React.ReactNode;
  contentPadding?: string;
  className?: string;
  noPadding?: boolean;
}

export const EnterpriseAppShell: React.FC<EnterpriseAppShellProps> = ({
  children,
  contentPadding,
  className,
  noPadding = false,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const pathname = usePathname();
  const { layoutMode, sidebarCollapsed, toggleSidebarCollapsed } = useNavPreferencesStore();

  // Compute active item for the mobile floating dock
  const dockActiveId = useMemo(() => {
    if (!pathname) return 'dashboard';
    if (pathname === '/dashboard' || pathname.startsWith('/projects/dashboard')) return 'dashboard';
    if (pathname.startsWith('/project-setup') || pathname.startsWith('/projects')) return 'project-setup';
    if (pathname.startsWith('/stakeholders') || pathname.startsWith('/clients')) return 'stakeholders';
    return undefined;
  }, [pathname]);

  // Hydration-safe initial dark mode state matching root layout script & localStorage
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const userPref = localStorage.getItem('pzone_theme_user_pref');
      if (userPref === 'light') return false;
      if (userPref === 'dark') return true;
      const stored = localStorage.getItem('pzone_theme');
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
    }
    return true; // P.Zone default root theme is dark
  });

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Remove preload zero-flicker class once client hydration completes
    document.documentElement.classList.remove('preload');

    // Read stored user preference or default to dark mode
    const userPref = typeof window !== 'undefined' ? localStorage.getItem('pzone_theme_user_pref') : null;
    const storedTheme = typeof window !== 'undefined' ? localStorage.getItem('pzone_theme') : null;
    const activeDark =
      userPref === 'light'
        ? false
        : userPref === 'dark'
        ? true
        : storedTheme === 'light'
        ? false
        : true;

    setIsDark(activeDark);
    if (activeDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.style.colorScheme = 'dark';
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.documentElement.style.colorScheme = 'light';
      document.documentElement.setAttribute('data-theme', 'light');
    }

    // Keep multi-tab sessions synchronized if theme changed in another tab
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === 'pzone_theme' || e.key === 'pzone_theme_user_pref') && e.newValue) {
        const nextDark = e.newValue === 'dark';
        setIsDark(nextDark);
        if (nextDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
          document.documentElement.style.colorScheme = 'dark';
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
          document.documentElement.style.colorScheme = 'light';
          document.documentElement.setAttribute('data-theme', 'light');
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const mainEl = mainRef.current;
    if (!sentinel || !mainEl) return;

    if (typeof IntersectionObserver !== 'undefined') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsScrolled(!entry.isIntersecting);
        },
        {
          root: mainEl,
          threshold: [0, 1],
          rootMargin: '0px 0px 0px 0px',
        }
      );
      observer.observe(sentinel);
      return () => observer.disconnect();
    } else {
      let ticking = false;
      const handleScroll = () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            setIsScrolled(mainEl.scrollTop > 4);
            ticking = false;
          });
          ticking = true;
        }
      };
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
      return () => mainEl.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((prevDark) => {
      const nextDark = !prevDark;
      if (nextDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
        document.documentElement.style.colorScheme = 'dark';
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('pzone_theme', 'dark');
        localStorage.setItem('pzone_theme_user_pref', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
        document.documentElement.style.colorScheme = 'light';
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('pzone_theme', 'light');
        localStorage.setItem('pzone_theme_user_pref', 'light');
      }
      return nextDark;
    });
  }, []);

  const handleSkipToMain = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      mainEl.focus({ preventScroll: false });
      mainEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const focusedMode = isFocusedProjectsMode();
  const { roles, isAdmin } = useUserRoles();
  const canCreateProject = useMemo(() => {
    if (isAdmin) return true;
    return (roles || []).some((r) =>
      ['admin', 'ceo', 'coo', 'commercial_manager', 'planning_manager'].includes(
        String(r).toLowerCase()
      )
    );
  }, [roles, isAdmin]);

  const focusedDockItems = useMemo(
    () => [
      { id: 'project-setup', label: 'قائمة المشاريع', labelEn: 'Projects List', icon: FolderKanban, href: '/projects' },
      ...(canCreateProject
        ? [{ id: 'new-project', label: 'إضافة مشروع', labelEn: 'New Project', icon: PlusCircle, href: '/projects/new' }]
        : []),
      { id: 'archive', label: 'أرشيف المشاريع', labelEn: 'Archive', icon: Archive, href: '/projects/archive' },
    ],
    [canCreateProject]
  );

  const contextValue = useMemo(() => ({
    sidebarMode: (layoutMode === 'sidebar' ? (sidebarCollapsed ? 'rail' : 'expanded') : 'hidden') as any,
    setSidebarMode: () => {},
    toggleSidebar: toggleSidebarCollapsed,
    isDark,
    toggleTheme,
  }), [layoutMode, sidebarCollapsed, toggleSidebarCollapsed, isDark, toggleTheme]);

  return (
    <ShellContext.Provider value={contextValue}>
      <div
        className={`min-h-[100dvh] h-[100dvh] w-full max-w-[100vw] overflow-hidden flex ${
          layoutMode === 'sidebar' ? 'flex-col md:flex-row' : 'flex-col'
        } bg-background text-foreground transition-colors duration-300 ease-in-out font-sans relative print:min-h-0 print:h-auto print:overflow-visible print:bg-white print:text-black print:max-w-none ${
          className || ''
        }`}
      >
        {/* ═══ 1. Skip to Main Content Link (WCAG 2.1 AA 2.4.1 Keyboard & Screen Reader Accessibility) ═══ */}
        <a
          href="#main-content"
          onClick={handleSkipToMain}
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-4 focus:z-50 focus:inline-flex focus:items-center focus:gap-2 focus:px-4 focus:py-2.5 focus:min-h-[44px] focus:min-w-[44px] focus:rounded-xl focus:bg-emerald-600 focus:hover:bg-emerald-700 focus:text-white focus:font-bold focus:text-xs sm:focus:text-sm focus:shadow-2xl focus:ring-2 focus:ring-emerald-400 focus-visible:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-950 focus:outline-none focus:backdrop-blur-md transition-all duration-200 print:hidden"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" aria-hidden="true" />
          <span>
            {isAr
              ? 'تخطي إلى المحتوى الرئيسي (اضغط للإنتقال المباشر)'
              : 'Skip to main content (Press Enter to focus)'}
          </span>
        </a>

        {/* ═══ 1.5. Collapsible Sidebar (When sidebar mode is active on md+ screens) ═══ */}
        {layoutMode === 'sidebar' && (
          <div className="print:hidden h-full shrink-0">
            <EnterpriseSidebar isDark={isDark} onThemeToggle={toggleTheme} />
          </div>
        )}

        {/* ═══ Main Viewport Wrapper (TopNav + Main Scroll Area) ═══ */}
        <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
          {/* ═══ 2. Fixed Top Navigation (Replaces Sidebar) ═══ */}
          <div className="print:hidden shrink-0">
            <TopNav isDark={isDark} onThemeToggle={toggleTheme} />
          </div>

          {/* ═══ 3. Main Application Landmark & Full-Width Edge-to-Edge Content Area ═══ */}
          <main
            id="main-content"
            tabIndex={-1}
            role="main"
            aria-label={isAr ? 'المحتوى الرئيسي لمنظومة بي زون' : 'P.Zone Main Application Content'}
            className={`flex-1 overflow-y-auto overflow-x-hidden w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-inset scroll-smooth print:overflow-visible print:h-auto print:p-0 print:m-0 ${
              noPadding
                ? 'pb-24 md:pb-6'
                : contentPadding || 'px-2 sm:px-3 lg:px-4 pt-2 sm:pt-3 pb-24 md:pb-6'
            } transition-colors duration-300 ease-in-out`}
          >
            <Suspense fallback={null}>
              <NavigationPersistence />
            </Suspense>
            {children}
          </main>
        </div>

        {/* ═══ 4. Accessible Mobile Floating Glass Dock (Uiverse by themrsami) ═══ */}
        <div className="md:hidden print:hidden">
          <UiverseFloatingDock
            items={focusedMode ? focusedDockItems : undefined}
            variant="emerald"
            position="bottom-fixed"
            activeId={dockActiveId}
            dir="rtl"
            ariaLabel={isAr ? 'شريط التنقل السريع للجوال' : 'Mobile Quick Navigation'}
          />
        </div>

        {/* ═══ 4.5. Floating Corner Hub (Hidden in Focused ERP Mode since controls live in TopNav) ═══ */}
        {!focusedMode && <FloatingCornerHub isDark={isDark} onThemeToggle={toggleTheme} />}

        {/* ═══ 5. Global Portal Interactive Guided Tour & Spotlight Engine ═══ */}
        {!focusedMode && <PortalGuidedTour />}

        {/* ═══ 6. Global System Updates & What's New Change Log Modal ═══ */}
        {!focusedMode && <SystemChangelogModal />}

        {/* ═══ 7. Global Navigation & Toolbar Customizer Modal ═══ */}
        {!focusedMode && <NavCustomizerModal />}
      </div>
    </ShellContext.Provider>
  );
};
