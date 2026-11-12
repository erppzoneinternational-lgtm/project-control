'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Globe,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { SidebarMode } from './EnterpriseAppShell';
import { NotificationCenter } from './NotificationCenter';
import { FontCustomizerButton } from './FontCustomizerButton';
import { ScrySearch } from '@/components/ui/ScrySearch';
import type { BreadcrumbItem } from '@/components/ui/Breadcrumbs';

export type { BreadcrumbItem };

export interface HeaderNavProps {
  lang?: 'ar' | 'en';
  onLangToggle?: () => void;
  isDark?: boolean;
  onThemeToggle?: () => void;
  onSearch?: (term: string) => void;
  sidebarMode?: SidebarMode;
  onSidebarToggle?: () => void;
  /** Custom destination path for the home link. Defaults to '/projects' */
  homeHref?: string;
  /** Secondary navigation breadcrumb items */
  breadcrumbs?: BreadcrumbItem[];
  /** Custom route title/label override for the active route indicator */
  currentRoute?: string;
  /** Secondary navigation arbitrary content node */
  secondaryNav?: React.ReactNode;
  /** Toggle visibility of company emblem icon (default: true) */
  showEmblem?: boolean;
  /** Toggle visibility of brand wordmark (default: true) */
  showWordmark?: boolean;
}

export function getBreadcrumbChevron(isRtl: boolean) {
  return isRtl ? ChevronLeft : ChevronRight;
}

export function getRouteTitle(
  pathname: string | null | undefined,
  t: (key: string, params?: Record<string, string | number>) => string,
  locale: 'ar' | 'en' = 'ar'
): string {
  const isAr = locale === 'ar';
  if (!pathname || pathname === '/') {
    return isAr ? 'الرئيسية' : 'Home';
  }

  // Strip query string and trailing slash
  const cleanPath = pathname.split('?')[0].replace(/\/$/, '') || '/';

  switch (cleanPath) {
    case '/dashboard':
      return isAr ? (t('nav.board_dashboard') || 'اللوحة المركزية') : 'Board Dashboard';
    case '/projects':
      return isAr ? (t('nav.project_list') || 'قائمة المشاريع') : 'Project List';
    case '/projects/dashboard':
      return isAr ? 'لوحة المشاريع' : 'Projects Dashboard';
    case '/projects/new':
      return isAr ? (t('nav.new_project') || 'مشروع جديد') : 'New Project';
    case '/project-setup':
      return isAr ? (t('nav.project_setup') || 'إعداد المشروع') : 'Project Setup';
    case '/clients':
      return isAr ? (t('nav.clients') || 'دليل العملاء') : 'Clients Directory';
    case '/stakeholders':
      return isAr ? 'دليل الشركاء' : 'Stakeholders Directory';
    case '/document-control':
      return isAr ? 'إدارة المستندات' : 'Document Control';
    case '/planning':
      return isAr ? 'مركز التخطيط' : 'Planning Hub';
    case '/planning/activities':
      return isAr ? 'الأنشطة والمكتبة' : 'Activities & Library';
    case '/planning/baseline':
      return isAr ? 'الجدول الزمني (Baseline)' : 'Schedule Baseline';
    case '/planning/daily-progress':
      return isAr ? 'التقدم اليومي' : 'Daily Progress';
    case '/planning/allocation':
      return isAr ? 'توزيع الكميات' : 'Allocations';
    case '/planning/dashboard':
      return isAr ? 'لوحة التخطيط' : 'Planning Dashboard';
    case '/boq':
      return isAr ? 'بنود الكميات (BOQ)' : 'BOQ Items';
    case '/schedule-pulse':
      return isAr ? 'نبض البرنامج الزمني' : 'Schedule Pulse';
    case '/site-workspace':
      return isAr ? 'مساحة عمل الموقع' : 'Site Workspace';
    case '/my-tasks':
      return isAr ? 'مهامي الميدانية' : 'My Tasks';
    case '/workflow':
      return isAr ? 'سير العمل' : 'Workflow';
    case '/hse':
      return isAr ? 'السلامة والصحة المهنية (HSE)' : 'HSE & Safety';
    case '/cost-control':
      return isAr ? (t('nav.cost_control') || 'التحكم في التكاليف') : 'Cost Control';
    case '/technical-office':
      return isAr ? (t('nav.technical_office') || 'المكتب الفني') : 'Technical Office';
    case '/hr':
    case '/hr-portal':
      return isAr ? (t('nav.hr_portal') || 'الموارد البشرية') : 'HR Portal';
    default:
      break;
  }

  // Parameterized sub-routes
  if (cleanPath.startsWith('/projects/') && cleanPath.endsWith('/edit')) {
    return isAr ? 'تعديل بيانات المشروع' : 'Edit Project';
  }
  if (cleanPath.startsWith('/projects/')) {
    return isAr ? 'تفاصيل المشروع' : 'Project Details';
  }

  return isAr ? (t('nav.project_setup') || 'إعداد المشروع') : 'Project Setup';
}

function GlobalSearchInputInner({ onSearch }: { onSearch?: (term: string) => void }) {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isRtl = locale === 'ar';

  const currentUrlSearch = searchParams?.get('search') || '';
  const [searchValue, setSearchValue] = useState(currentUrlSearch);

  useEffect(() => {
    setSearchValue(currentUrlSearch);
  }, [currentUrlSearch]);

  const handleSearchChange = (val: string) => {
    setSearchValue(val);
    if (onSearch) onSearch(val);

    if (pathname === '/projects') {
      const params = new URLSearchParams(searchParams?.toString() || '');
      if (val) {
        params.set('search', val);
      } else {
        params.delete('search');
      }
      const queryStr = params.toString() ? `?${params.toString()}` : '';
      router.replace(`/projects${queryStr}`);
    }
  };

  const handleSearchSubmit = (val: string) => {
    setSearchValue(val);
    if (onSearch) onSearch(val);

    const params = new URLSearchParams(pathname === '/projects' ? searchParams?.toString() || '' : '');
    if (val.trim()) {
      params.set('search', val.trim());
    } else {
      params.delete('search');
    }

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    if (pathname !== '/projects') {
      router.push(`/projects${queryStr}`);
    } else {
      router.replace(`/projects${queryStr}`);
    }
  };

  return (
    <ScrySearch
      value={searchValue}
      onChange={handleSearchChange}
      onSubmit={handleSearchSubmit}
      onClear={() => handleSearchChange('')}
      placeholder={`${t('nav.search_placeholder')}...`}
      width={320}
      compact={true}
      defaultOpen={Boolean(currentUrlSearch)}
      autoCloseOnBlur={true}
      hotkey="⌘K"
      isRtl={isRtl}
      ariaLabel={t('nav.search_placeholder')}
    />
  );
}

function GlobalSearchInput({ onSearch }: { onSearch?: (term: string) => void }) {
  return (
    <React.Suspense
      fallback={
        <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700/80">
          <Search className="w-4 h-4" />
        </div>
      }
    >
      <GlobalSearchInputInner onSearch={onSearch} />
    </React.Suspense>
  );
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  lang: propLang,
  onLangToggle: propOnLangToggle,
  isDark = true,
  onThemeToggle,
  onSearch,
  sidebarMode = 'expanded',
  onSidebarToggle,
  homeHref = '/projects',
  breadcrumbs,
  currentRoute,
  secondaryNav,
  showEmblem = true,
  showWordmark = true,
}) => {
  const { locale, toggleLocale, t } = useLanguage();
  const pathname = usePathname();
  const lang = propLang || locale;
  const isRtl = lang === 'ar';
  const handleLangToggle = propOnLangToggle || toggleLocale;

  const logoSrc = isDark ? '/pzone-logo-white.png' : '/pzone-logo-dark.png';
  const ChevronIcon = getBreadcrumbChevron(isRtl);

  const isCurrentHome =
    pathname === homeHref ||
    (homeHref === '/projects' && (pathname === '/projects' || pathname === '/'));

  const currentRouteLabel = currentRoute || getRouteTitle(pathname, t, lang);

  const homeAriaLabel = isRtl
    ? isCurrentHome
      ? 'P.ZONE - الصفحة الرئيسية الحالية'
      : 'P.ZONE - الذهاب إلى الصفحة الرئيسية'
    : isCurrentHome
    ? 'P.ZONE - Current Home Page'
    : 'P.ZONE - Go to Home Page';

  const homeTitle = isRtl ? 'الانتقال إلى الرئيسية' : 'Go to Home';

  return (
    <header
      className="sticky top-0 z-40 w-full h-[61px] shrink-0 bg-white/95 dark:bg-[#171310]/95 backdrop-blur-xl border-b border-stone-200 dark:border-stone-800 px-3 sm:px-4 lg:px-6 transition-colors flex items-center justify-between gap-3 sm:gap-4"
      dir="rtl"
    >
      {/* Brand & Secondary Navigation / Breadcrumbs Slot */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onSidebarToggle && (
          <button
            type="button"
            onClick={onSidebarToggle}
            className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200 dark:hover:bg-stone-700 transition-all border border-stone-200 dark:border-stone-700/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shrink-0 flex items-center justify-center cursor-pointer"
            title={`Sidebar Mode: ${sidebarMode} (Click to cycle)`}
            aria-label={isRtl ? `تبديل القائمة الجانبية: ${sidebarMode}` : `Toggle Sidebar: ${sidebarMode}`}
          >
            {sidebarMode === 'expanded' ? (
              <PanelLeftClose className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
            ) : sidebarMode === 'collapsed' ? (
              <Menu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
          </button>
        )}

        {/* Accessible Home Link with Crisp Emblem + Wordmark */}
        <Link
          href={homeHref}
          className="flex items-center gap-2 group rounded-xl p-1 -m-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900 transition-all shrink-0"
          aria-label={homeAriaLabel}
          title={homeTitle}
          aria-current={isCurrentHome ? 'page' : undefined}
        >
          {/* Company Emblem Logo: Fixed 32x32 integer sizing, crisp pixel-ratio rendering */}
          {showEmblem && (
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-stone-900/5 dark:bg-white/5 ring-1 ring-stone-900/10 dark:ring-white/10 shadow-xs flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <img
                src="/pzone-emblem.png"
                alt={isRtl ? 'شعار شركة P.ZONE' : 'P.ZONE Company Emblem'}
                width={32}
                height={32}
                decoding="async"
                className="w-full h-full object-contain p-0.5"
                style={{
                  imageRendering: '-webkit-optimize-contrast',
                }}
              />
            </div>
          )}

          {/* Brand Wordmark (Responsive) */}
          {showWordmark && (
            <img
              src={logoSrc}
              alt="P.ZONE"
              width={120}
              height={28}
              decoding="async"
              className="h-7 w-auto object-contain max-w-[110px] lg:max-w-[130px] drop-shadow-xs transition-transform duration-200 group-hover:scale-102 hidden sm:block"
              style={{
                imageRendering: '-webkit-optimize-contrast',
              }}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          )}
        </Link>

        {/* Secondary Navigation / Breadcrumbs / Active Route Indicator (RTL-Aligned) */}
        <div className="hidden sm:flex items-center border-s border-stone-200 dark:border-stone-800 ps-3 ms-1 min-w-0 max-w-[240px] md:max-w-xs lg:max-w-md">
          {secondaryNav ? (
            <div className="flex items-center gap-1.5 min-w-0">{secondaryNav}</div>
          ) : breadcrumbs && breadcrumbs.length > 0 ? (
            <nav
              aria-label={isRtl ? 'مسار التنقل الفرعي' : 'Secondary navigation'}
              className="flex items-center min-w-0"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              <ol className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 min-w-0 flex-nowrap">
                {breadcrumbs.map((crumb, idx) => {
                  const isLast = idx === breadcrumbs.length - 1;
                  const CrumbIcon = crumb.icon;
                  return (
                    <li key={idx} className="flex items-center gap-1.5 min-w-0 shrink-0">
                      {idx > 0 && (
                        <ChevronIcon
                          className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0"
                          aria-hidden="true"
                        />
                      )}
                      {isLast || !crumb.href ? (
                        <span
                          className="font-bold text-stone-900 dark:text-stone-100 truncate max-w-[130px] lg:max-w-[190px]"
                          aria-current={isLast ? 'page' : undefined}
                        >
                          {CrumbIcon && <CrumbIcon className="w-3.5 h-3.5 inline-block me-1 shrink-0" />}
                          {crumb.label}
                        </span>
                      ) : (
                        <Link
                          href={crumb.href}
                          className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate max-w-[100px] lg:max-w-[150px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 rounded"
                        >
                          {CrumbIcon && <CrumbIcon className="w-3.5 h-3.5 inline-block me-1 shrink-0" />}
                          {crumb.label}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs"
              aria-current="page"
              aria-label={isRtl ? `الصفحة الحالية: ${currentRouteLabel}` : `Current route: ${currentRouteLabel}`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shrink-0"
                aria-hidden="true"
              />
              <span className="truncate max-w-[130px] md:max-w-[180px]">{currentRouteLabel}</span>
            </span>
          )}
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <GlobalSearchInput onSearch={onSearch} />
      </div>

      {/* Action Controls: Theme, Language, Notifications (All Tap Targets >= 44x44px) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Language Toggle */}
        <button
          type="button"
          onClick={handleLangToggle}
          className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors flex items-center justify-center gap-1.5 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
          title={isRtl ? 'تغيير اللغة' : 'Toggle Language'}
          aria-label={lang === 'ar' ? 'التحويل إلى اللغة الإنجليزية' : 'Switch language to Arabic'}
        >
          <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="uppercase text-[11px]">{lang}</span>
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onThemeToggle}
          className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 flex items-center justify-center cursor-pointer"
          title={
            lang === 'ar'
              ? isDark
                ? 'التحويل للوضع المضيء'
                : 'التحويل للوضع الداكن'
              : isDark
              ? 'Switch to Light Mode'
              : 'Switch to Dark Mode'
          }
          aria-label={
            lang === 'ar'
              ? isDark
                ? 'التحويل للوضع المضيء'
                : 'التحويل للوضع الداكن'
              : isDark
              ? 'Switch to Light Mode'
              : 'Switch to Dark Mode'
          }
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
          )}
        </button>

        {/* Font Customizer */}
        <FontCustomizerButton />

        {/* Live Notification Center */}
        <NotificationCenter />
      </div>
    </header>
  );
};
