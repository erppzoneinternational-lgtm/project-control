'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProjectStore } from '@/lib/stores/useProjectStore';
import { isFocusedProjectsMode, isRouteAllowedInFocusedMode } from '@/lib/config/module-visibility';
import {
  Search,
  X,
  ChevronDown,
  FolderTree,
  LayoutDashboard,
  Calendar,
  FileSpreadsheet,
  HardHat,
  ClipboardCheck,
  PackageCheck,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';

export interface ProjectStructureDropdownProps {
  className?: string;
  projectId?: string;
  projectName?: string;
  projectCode?: string;
  align?: 'start' | 'end' | 'auto';
}

interface StructureItem {
  id: string;
  href: (activeId?: string) => string;
  labelAr: string;
  labelEn: string;
  keywords: string[];
  level: 0 | 1 | 2;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STRUCTURE_ITEMS: StructureItem[] = [
  {
    id: 'overview',
    href: (activeId) => (activeId ? `/projects/${activeId}` : '/projects'),
    labelAr: 'نظرة عامة على المشروع',
    labelEn: 'Project Overview',
    keywords: ['project', 'overview', 'مشروع', 'عامة', 'نظرة'],
    level: 0,
    badge: 'L0',
    icon: LayoutDashboard,
  },
  {
    id: 'wbs',
    href: (activeId) => (activeId ? `/projects/${activeId}?tab=wbs` : '/projects'),
    labelAr: 'هيكل تجزئة العمل',
    labelEn: 'WBS Structure',
    keywords: ['wbs', 'work breakdown', 'تجزئة', 'هيكل', 'فروع'],
    level: 1,
    badge: 'WBS',
    icon: FolderTree,
  },
  {
    id: 'activities',
    href: () => '/planning/baseline',
    labelAr: 'أنشطة البرنامج الزمني',
    labelEn: 'Schedule Activities',
    keywords: ['schedule', 'activities', 'baseline', 'أنشطة', 'زمني', 'برنامج'],
    level: 2,
    badge: 'ACT',
    icon: Calendar,
  },
  {
    id: 'boq',
    href: () => '/boq',
    labelAr: 'جدول الكميات والتسعير',
    labelEn: 'Bill of Quantities',
    keywords: ['boq', 'quantities', 'كميات', 'تسعير', 'جدول'],
    level: 2,
    badge: 'BOQ',
    icon: FileSpreadsheet,
  },
  {
    id: 'site',
    href: () => '/site-workspace',
    labelAr: 'تنفيذ أعمال الموقع',
    labelEn: 'Site Workspace',
    keywords: ['site', 'workspace', 'tasks', 'موقع', 'تنفيذ', 'ميدان'],
    level: 1,
    badge: 'SITE',
    icon: HardHat,
  },
  {
    id: 'daily',
    href: () => '/planning/daily-progress',
    labelAr: 'التقارير والاعتماد اليومي',
    labelEn: 'Daily Reports',
    keywords: ['daily', 'progress', 'reports', 'يومي', 'تقارير', 'اعتماد'],
    level: 2,
    badge: 'DPR',
    icon: ClipboardCheck,
  },
  {
    id: 'technical',
    href: () => '/technical-office',
    labelAr: 'المكتب الفني',
    labelEn: 'Technical Office',
    keywords: ['technical', 'office', 'فني', 'مكتب', 'مخططات', 'بوابة'],
    level: 1,
    badge: 'TO',
    icon: PackageCheck,
  },
  {
    id: 'qc',
    href: () => '/qc-dashboard',
    labelAr: 'فحص واستلام الجودة',
    labelEn: 'Quality Inspections',
    keywords: ['qc', 'quality', 'inspection', 'جودة', 'فحص', 'استلام'],
    level: 1,
    badge: 'QC',
    icon: ShieldCheck,
  },
];

export const ProjectStructureDropdown: React.FC<ProjectStructureDropdownProps> = ({
  className = '',
  projectId: propProjectId,
  projectName: propProjectName,
  projectCode: propProjectCode,
  align = 'auto',
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const pathname = usePathname();
  const router = useRouter();
  const { activeProjectId } = useProjectStore();

  const activeId = propProjectId || activeProjectId;
  const projectCode = propProjectCode;
  const title = propProjectName || (isAr ? 'هيكل المشروع' : 'Project Structure');

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [alignEnd, setAlignEnd] = useState(false);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filtered structure items
  const focusedMode = isFocusedProjectsMode();
  const filteredItems = useMemo(() => {
    const baseItems = focusedMode
      ? STRUCTURE_ITEMS.filter((item) => {
          const pathOnly = item.href(activeId).split('?')[0];
          return isRouteAllowedInFocusedMode(pathOnly, true);
        })
      : STRUCTURE_ITEMS;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return baseItems;
    return baseItems.filter((item) => {
      const matchAr = item.labelAr.toLowerCase().includes(q);
      const matchEn = item.labelEn.toLowerCase().includes(q);
      const matchBadge = item.badge.toLowerCase().includes(q);
      const matchKw = item.keywords.some((kw) => kw.toLowerCase().includes(q));
      return matchAr || matchEn || matchBadge || matchKw;
    });
  }, [searchQuery, focusedMode, activeId]);

  // Viewport-safe alignment detection (supports RTL and LTR)
  const checkAlignment = useCallback(() => {
    if (align === 'start') {
      setAlignEnd(false);
      return;
    }
    if (align === 'end') {
      setAlignEnd(true);
      return;
    }
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropdownWidth = 320; // 20rem (w-80)
    const margin = 16;

    if (isAr) {
      // In RTL, start-0 aligns right edge. Dropdown extends to the LEFT.
      // If trigger's right edge minus dropdown width is < margin (overflows screen left),
      // flip to end-0 (left: 0 in RTL, extends towards right)!
      const extendsLeft = rect.right - dropdownWidth;
      setAlignEnd(extendsLeft < margin);
    } else {
      // In LTR, start-0 aligns left edge. Dropdown extends to the RIGHT.
      // If trigger's left edge plus dropdown width exceeds viewport width,
      // flip to end-0 (right: 0 in LTR, extends towards left)!
      const extendsRight = rect.left + dropdownWidth;
      setAlignEnd(extendsRight > window.innerWidth - margin);
    }
  }, [align, isAr]);

  // Open dropdown
  const handleOpen = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    checkAlignment();
    setIsOpen(true);
    setHighlightedIndex(-1);
  }, [checkAlignment]);

  // Close dropdown
  const handleClose = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsOpen(false);
    setSearchQuery('');
    setHighlightedIndex(-1);
  }, []);

  // Toggle open
  const handleToggle = useCallback(() => {
    if (isOpen) {
      handleClose();
    } else {
      handleOpen();
      // On keyboard or click open, focus search input after animation frame
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, [isOpen, handleOpen, handleClose]);

  // Hover grace handlers
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    handleOpen();
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setSearchQuery('');
      setHighlightedIndex(-1);
    }, 220);
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        handleClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen, handleClose]);

  // Resize and reposition listener
  useEffect(() => {
    if (isOpen) {
      checkAlignment();
      const onResize = () => checkAlignment();
      window.addEventListener('resize', onResize);
      window.addEventListener('scroll', onResize, true);
      return () => {
        window.removeEventListener('resize', onResize);
        window.removeEventListener('scroll', onResize, true);
      };
    }
  }, [isOpen, checkAlignment]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  // Keep highlighted item in view
  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [highlightedIndex]);

  // Global Keyboard Navigation inside dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleOpen();
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
        });
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
      triggerRef.current?.focus();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length === 0) return;
      setHighlightedIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length === 0) return;
      if (highlightedIndex <= 0) {
        // Return focus to search input
        setHighlightedIndex(-1);
        searchInputRef.current?.focus();
      } else {
        setHighlightedIndex((prev) => prev - 1);
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (filteredItems.length > 0) setHighlightedIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      if (filteredItems.length > 0) setHighlightedIndex(filteredItems.length - 1);
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && filteredItems[highlightedIndex]) {
        e.preventDefault();
        const targetHref = filteredItems[highlightedIndex].href(activeId);
        handleClose();
        router.push(targetHref);
      } else if (filteredItems.length > 0) {
        e.preventDefault();
        const targetHref = filteredItems[0].href(activeId);
        handleClose();
        router.push(targetHref);
      }
    }
  };

  if (focusedMode) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      className={`relative inline-block ${className}`}
    >
      {/* Trigger Button - Enhanced Uiverse themrsami design with semantic button & active badge */}
      <button
        type="button"
        ref={triggerRef}
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="project-structure-menu"
        aria-label={isAr ? 'عرض هيكل المشروع وتفرعاته' : 'View Project Structure'}
        className="bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 py-1.5 px-2 2xl:px-3 rounded-xl border border-stone-200 dark:border-stone-700/80 shadow-xs hover:shadow-md hover:border-emerald-500/50 dark:hover:border-emerald-500/50 cursor-pointer flex items-center gap-1.5 2xl:gap-2 transition-all duration-200 text-[11px] 2xl:text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 select-none"
        title={isAr ? 'عرض هيكل المشروع وتفرعاته' : 'View Project Structure'}
      >
        {/* Signature Folder SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 18 14"
          height="16"
          width="16"
          className="shrink-0"
        >
          <path
            fill="#FFA000"
            d="M16.2 1.75H8.1L6.3 0H1.8C0.81 0 0 0.7875 0 1.75V12.25C0 13.2125 0.81 14 1.8 14H15.165L18 9.1875V3.5C18 2.5375 17.19 1.75 16.2 1.75Z"
          />
          <path
            fill="#FFCA28"
            d="M16.2 2H1.8C0.81 2 0 2.77143 0 3.71429V12.2857C0 13.2286 0.81 14 1.8 14H16.2C17.19 14 18 13.2286 18 12.2857V3.71429C18 2.77143 17.19 2 16.2 2Z"
          />
        </svg>

        <span className="truncate max-w-[80px] 2xl:max-w-[140px]">
          {isAr ? 'هيكل المشروع' : 'Project Structure'}
        </span>

        {/* Active Project Indicator Badge on Trigger */}
        {activeId ? (
          <span
            className="hidden 2xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60 shadow-2xs"
            title={isAr ? `المشروع النشط: ${title}` : `Active Scope: ${title}`}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span className="max-w-[65px] truncate font-mono text-[9px] font-black">
              {projectCode || (isAr ? 'نشط' : 'Active')}
            </span>
          </span>
        ) : (
          <span className="hidden 2xl:inline text-[9px] font-semibold text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800/80 px-1.5 py-0.5 rounded border border-stone-200 dark:border-stone-700">
            {isAr ? 'عام' : 'All'}
          </span>
        )}

        {/* Animated Chevron */}
        <ChevronDown
          className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu - Smooth Transition & Viewport Safe */}
      <div
        id="project-structure-menu"
        role="menu"
        aria-orientation="vertical"
        className={`absolute top-full mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-white/98 dark:bg-stone-900/98 backdrop-blur-md border border-stone-200/90 dark:border-stone-800 rounded-2xl shadow-2xl z-50 p-2.5 transition-all duration-200 ease-out origin-top ${
          alignEnd ? 'end-0' : 'start-0'
        } ${
          isOpen
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto visible'
            : 'opacity-0 -translate-y-2 scale-95 pointer-events-none invisible'
        }`}
      >
        {/* Active Project Indicator Card & Header */}
        <div className="p-2.5 mb-2 rounded-xl bg-stone-50/90 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-800/80">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeId
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60 shadow-2xs'
                  : 'bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-700'
              }`}
            >
              <span className="relative flex h-1.5 w-1.5">
                {activeId && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                    activeId ? 'bg-emerald-500' : 'bg-stone-400'
                  }`}
                ></span>
              </span>
              <span>
                {activeId
                  ? isAr
                    ? 'المشروع النشط'
                    : 'Active Project'
                  : isAr
                  ? 'النطاق العام للمشاريع'
                  : 'All Projects Scope'}
              </span>
            </span>

            {projectCode && (
              <span className="text-[10px] font-mono font-black text-emerald-700 dark:text-emerald-300 bg-white dark:bg-stone-900 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
                {projectCode}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-1.5">
            <p
              className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate"
              title={title}
            >
              {title}
            </p>
            {activeId && (
              <Link
                href={`/projects/${activeId}`}
                onClick={handleClose}
                className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 inline-flex items-center gap-0.5 shrink-0 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
                title={isAr ? 'عرض بيانات وتفاصيل المشروع' : 'View project details'}
              >
                <span>{isAr ? 'عرض' : 'View'}</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">
            {isAr
              ? 'مستويات وهيكل تجزئة العمل المتكامل'
              : 'Integrated Levels & WBS Structure'}
          </p>
        </div>

        {/* Search Inside Dropdown */}
        <div className="relative mb-2">
          <Search className="w-3.5 h-3.5 absolute start-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              isAr ? 'بحث في هيكل ومستويات المشروع...' : 'Search project structure...'
            }
            aria-label={
              isAr ? 'بحث في هيكل ومستويات المشروع' : 'Search project structure'
            }
            className="w-full ps-8 pe-7 py-1.5 bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700/80 rounded-xl text-xs text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              aria-label={isAr ? 'مسح البحث' : 'Clear search'}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Structure Items List */}
        <ul
          ref={listRef}
          className="max-h-[300px] overflow-y-auto space-y-0.5 text-xs font-semibold text-stone-700 dark:text-stone-200 pe-1"
        >
          {filteredItems.length === 0 ? (
            <li className="py-6 px-3 text-center">
              <div className="w-8 h-8 mx-auto mb-2 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-400">
                <Search className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-stone-700 dark:text-stone-300">
                {isAr ? 'لا توجد نتائج مطابقة' : 'No matching structure items'}
              </p>
              <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5">
                {isAr
                  ? 'جرّب البحث باسم المرحلة، العمل، أو الموقع'
                  : 'Try searching for WBS, BOQ, or Site'}
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded px-1"
              >
                {isAr ? 'إعادة ضبط البحث' : 'Reset search'}
              </button>
            </li>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const targetHref = item.href(activeId);
              const isCurrentPage =
                pathname === targetHref ||
                (targetHref !== '/projects' &&
                  targetHref !== '/' &&
                  pathname.startsWith(targetHref.split('?')[0]));
              const isHighlighted = highlightedIndex === index;

              // Hierarchy indent styling
              const indentClass =
                item.level === 0
                  ? ''
                  : item.level === 1
                  ? 'ms-2 ps-2.5 border-s-2 border-stone-200 dark:border-stone-800'
                  : 'ms-5 ps-2.5 border-s-2 border-stone-200/60 dark:border-stone-800/60 text-[11.5px]';

              return (
                <li key={item.id} className={indentClass}>
                  <Link
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    href={targetHref}
                    onClick={handleClose}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    role="menuitem"
                    aria-current={isCurrentPage ? 'page' : undefined}
                    className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      isHighlighted
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-500/30'
                        : isCurrentPage
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'hover:bg-stone-100 dark:hover:bg-stone-800/70 text-stone-700 dark:text-stone-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isHighlighted || isCurrentPage
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-stone-400 dark:text-stone-500'
                        }`}
                      />
                      <span className="truncate">
                        {isAr ? item.labelAr : item.labelEn}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isCurrentPage && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"
                          title={isAr ? 'الصفحة الحالية' : 'Current page'}
                        />
                      )}
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                          isHighlighted || isCurrentPage
                            ? 'bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/80'
                            : 'bg-stone-100 dark:bg-stone-800/80 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-700/60'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })
          )}
        </ul>

        {/* Quick Link to Technical Office Portal */}
        <div className="pt-2 mt-2 border-t border-stone-100 dark:border-stone-800/80">
          <Link
            href="/technical-office"
            onClick={handleClose}
            role="menuitem"
            className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 border border-emerald-200/70 dark:border-emerald-800/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center gap-2">
              <PackageCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{isAr ? 'بوابة المكتب الفني' : 'Technical Office Portal'}</span>
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          </Link>
        </div>

        {/* Dropdown Footer Controls & Keyboard hint */}
        <div className="mt-2 pt-2 border-t border-stone-100 dark:border-stone-800/80 px-2 flex items-center justify-between text-[10px] text-stone-400 dark:text-stone-500">
          <div className="flex items-center gap-1.5">
            <span className="font-mono bg-stone-100 dark:bg-stone-800 px-1 rounded border border-stone-200 dark:border-stone-700">
              ↑↓
            </span>
            <span>{isAr ? 'للتنقل' : 'Navigate'}</span>
            <span className="font-mono bg-stone-100 dark:bg-stone-800 px-1 rounded border border-stone-200 dark:border-stone-700 ms-1">
              ↵
            </span>
            <span>{isAr ? 'للاختيار' : 'Select'}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="font-mono bg-stone-100 dark:bg-stone-800 px-1 rounded border border-stone-200 dark:border-stone-700">
              Esc
            </span>
            <span>{isAr ? 'إغلاق' : 'Close'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectStructureDropdown;
