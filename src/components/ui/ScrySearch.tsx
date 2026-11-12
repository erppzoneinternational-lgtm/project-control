'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  FolderKanban,
  Users,
  LayoutDashboard,
  CornerDownLeft,
  Building2,
  GanttChartSquare,
  FileSpreadsheet,
  Archive,
  Compass,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import styles from './ScrySearch.module.css';

/* ─────────────────────────────────────────────────────────────
 * Types & Interfaces
 * ───────────────────────────────────────────────────────────── */

export type ScrySearchCategory = 'projects' | 'stakeholders' | 'pages';

export interface ScrySearchResultItem {
  id: string;
  category: ScrySearchCategory;
  title: string;
  titleAr?: string;
  subtitle?: string;
  subtitleAr?: string;
  badge?: string;
  badgeAr?: string;
  badgeVariant?: 'default' | 'emerald' | 'blue' | 'purple' | 'amber' | 'slate';
  icon?: React.ElementType;
  url?: string;
  keywords?: string[];
  meta?: Record<string, any>;
  onSelect?: () => void;
}

export interface ScrySearchResultGroup {
  id: ScrySearchCategory;
  title: string;
  titleAr: string;
  icon: React.ElementType;
  items: ScrySearchResultItem[];
}

export interface ScrySearchProps {
  // Original Props (100% backward compatible)
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  onClear?: () => void;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  width?: number | string;
  compact?: boolean;
  defaultOpen?: boolean;
  autoCloseOnBlur?: boolean;
  hotkey?: string;
  isRtl?: boolean;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  name?: string;
  ariaLabel?: string;

  // Global Search Modal & Combobox Enhancements
  asModal?: boolean;
  isOpenModal?: boolean;
  onModalOpenChange?: (open: boolean) => void;
  enableGlobalModal?: boolean;
  customGroups?: ScrySearchResultGroup[];
  customItems?: ScrySearchResultItem[];
  onSelectResult?: (item: ScrySearchResultItem) => void;
}

/* ─────────────────────────────────────────────────────────────
 * Default Portal Catalog (Projects, Stakeholders, Pages)
 * ───────────────────────────────────────────────────────────── */

const DEFAULT_PORTAL_ITEMS: ScrySearchResultItem[] = [
  // 1. Projects (المشاريع)
  {
    id: 'prj-alm-01',
    category: 'projects',
    title: 'Alamein Lakes Complex (SLX)',
    titleAr: 'مشروع إنشاء مجمع بحيرات العلمين (SLX)',
    subtitle: 'North Coast • Progress: 78% • WIR-204 Approved',
    subtitleAr: 'الساحل الشمالي • نسبة الإنجاز: 78% • اعتماد WIR-204',
    badge: 'On-Track',
    badgeAr: 'نشط ومطابق',
    badgeVariant: 'emerald',
    icon: FolderKanban,
    url: '/projects',
    keywords: ['العلمين', 'بحيرات', 'slx', 'alamein', 'lakes', 'hap', 'خرسانات'],
  },
  {
    id: 'prj-dwt-02',
    category: 'projects',
    title: 'Downtown Towers — Phase II',
    titleAr: 'مشروع أبراج الداون تاون — المرحلة الثانية',
    subtitle: 'New Cairo • Baseline Rev-04 Approved',
    subtitleAr: 'القاهرة الجديدة • البرنامج الزمني المحدث Rev-04',
    badge: 'In Progress',
    badgeAr: 'قيد التنفيذ',
    badgeVariant: 'blue',
    icon: Building2,
    url: '/projects',
    keywords: ['داون تاون', 'أبراج', 'downtown', 'towers', 'cscec', 'rev-04'],
  },
  {
    id: 'prj-inf-03',
    category: 'projects',
    title: 'Central Utilities & Infrastructure Networks',
    titleAr: 'مشروع شبكات المرافق المركزية والبنية التحتية',
    subtitle: 'New Administrative Capital • Treatment Plant',
    subtitleAr: 'العاصمة الإدارية الجديدة • محطة المعالجة وشبكات الطرد',
    badge: 'Ahead',
    badgeAr: 'متقدم على الجدول',
    badgeVariant: 'emerald',
    icon: Layers,
    url: '/projects',
    keywords: ['مرافق', 'بنية تحتية', 'عاصمة', 'utilities', 'infrastructure', 'capital'],
  },
  {
    id: 'prj-gov-04',
    category: 'projects',
    title: 'Government District Administration HQ',
    titleAr: 'مشروع المقر الإداري للحي الحكومي',
    subtitle: 'Architectural Finishing & MEP Works',
    subtitleAr: 'أعمال التشطيبات المعمارية والأنظمة الكهروميكانيكية MEP',
    badge: 'Approved',
    badgeAr: 'معتمد',
    badgeVariant: 'purple',
    icon: FolderKanban,
    url: '/projects',
    keywords: ['حي حكومي', 'مقر', 'تشطيبات', 'mep', 'government', 'finishing'],
  },

  // 2. Stakeholders (أصحاب المصلحة)
  {
    id: 'stk-hassan-soliman',
    category: 'stakeholders',
    title: 'Eng. Hassan A. Soliman',
    titleAr: 'م. حسن علي سليمان (Hassan Soliman)',
    subtitle: 'Technical Office Director & Systems Architect',
    subtitleAr: 'رئيس المكتب الفني والأنظمة الهندسية • مدير النظام',
    badge: 'Admin / TO Lead',
    badgeAr: 'مدير المكتب الفني',
    badgeVariant: 'emerald',
    icon: UserCheck,
    url: '/stakeholders',
    keywords: ['حسن', 'سليمان', 'hassan', 'soliman', 'admin', 'مدير', 'مكتب فني'],
  },
  {
    id: 'stk-hassan-allam',
    category: 'stakeholders',
    title: 'Hassan Allam Construction (HAP)',
    titleAr: 'شركة حسن علام للمقاولات والإنشاءات (HAP)',
    subtitle: 'General Contractor • Civil & Infrastructure',
    subtitleAr: 'المقاول الرئيسي العام • أعمال البنية التحتية والإنشاءات',
    badge: 'Main Contractor',
    badgeAr: 'مقاول عام',
    badgeVariant: 'blue',
    icon: Building2,
    url: '/stakeholders',
    keywords: ['علام', 'allam', 'hap', 'مقاول', 'contractor'],
  },
  {
    id: 'stk-dar-al-handasah',
    category: 'stakeholders',
    title: 'Dar Al-Handasah Consultants',
    titleAr: 'دار الهندسة للتصميم والاستشارات الفنية',
    subtitle: 'Supervising Consultant & QC Audits',
    subtitleAr: 'استشاري المشروع الإشرافي • ضبط الجودة والاعتمادات',
    badge: 'Consultant',
    badgeAr: 'استشاري إشراف',
    badgeVariant: 'purple',
    icon: Shield,
    url: '/stakeholders',
    keywords: ['دار الهندسة', 'استشاري', 'dar', 'handasah', 'consultant'],
  },
  {
    id: 'stk-cscec',
    category: 'stakeholders',
    title: 'CSCEC China Construction',
    titleAr: 'الشركة الصينية العامة للهندسة الإنشائية (CSCEC)',
    subtitle: 'Specialized Contractor • High-Rise Towers',
    subtitleAr: 'مقاول عام متخصص • الأبراج والهياكل الخرسانية',
    badge: 'Specialized',
    badgeAr: 'مقاول متخصص',
    badgeVariant: 'blue',
    icon: Building2,
    url: '/stakeholders',
    keywords: ['صينية', 'cscec', 'china', 'مقاول'],
  },
  {
    id: 'stk-ahmed-abdelmoneim',
    category: 'stakeholders',
    title: 'Eng. Ahmed Abdel-Moneim',
    titleAr: 'م. أحمد عبد المنعم',
    subtitle: 'Site Operations Project Manager',
    subtitleAr: 'مدير مشروع الموقع • إدارة العمليات الميدانية',
    badge: 'PM',
    badgeAr: 'مدير مشروع',
    badgeVariant: 'amber',
    icon: UserCheck,
    url: '/stakeholders',
    keywords: ['أحمد', 'عبد المنعم', 'ahmed', 'pm', 'مدير'],
  },

  // 3. Pages & Sections (الصفحات والخدمات)
  {
    id: 'page-central-dashboard',
    category: 'pages',
    title: 'Central Operations Dashboard',
    titleAr: 'اللوحة المركزية (Central Dashboard)',
    subtitle: 'Executive KPIs, S-Curve, and Operational Alerts',
    subtitleAr: 'مؤشرات الأداء التنفيذية، منحنى S-Curve، وإشعارات العمليات',
    badge: 'Main',
    badgeAr: 'رئيسية',
    badgeVariant: 'emerald',
    icon: LayoutDashboard,
    url: '/dashboard',
    keywords: ['لوحة', 'رئيسية', 'داشبورد', 'dashboard', 'مؤشرات', 'kpi'],
  },
  {
    id: 'page-projects-dashboard',
    category: 'pages',
    title: 'Projects Portfolio Dashboard',
    titleAr: 'لوحة المشاريع (Projects Dashboard)',
    subtitle: 'Portfolio governance, milestones, and budget controls',
    subtitleAr: 'حوكمة المحفظة، المعالم التعاقدية، والمراقبة المالية',
    badge: 'Projects',
    badgeAr: 'مشاريع',
    badgeVariant: 'blue',
    icon: GanttChartSquare,
    url: '/projects/dashboard',
    keywords: ['مشاريع', 'projects', 'portfolio', 'محفظة', 'ميزانية'],
  },
  {
    id: 'page-schedule-pulse',
    category: 'pages',
    title: 'Schedule Pulse (P6 & EVM)',
    titleAr: 'نبض البرنامج الزمني (Schedule Pulse - P6)',
    subtitle: 'Critical path analysis, EVM variance, and Primavera pulse',
    subtitleAr: 'تحليل المسار الحرج CPM، القيمة المكتسبة EVM، وفروقات P6',
    badge: 'P6 EVM',
    badgeAr: 'نبض P6',
    badgeVariant: 'purple',
    icon: GanttChartSquare,
    url: '/schedule-pulse',
    keywords: ['برنامج', 'زمني', 'p6', 'pulse', 'جدولة', 'evm', 'مسار حرج', 'schedule'],
  },
  {
    id: 'page-stakeholders-dir',
    category: 'pages',
    title: 'Stakeholders Directory',
    titleAr: 'دليل أصحاب المصلحة (Stakeholders Directory)',
    subtitle: 'Client, consultant, and contractor registry',
    subtitleAr: 'سجل الملاك، الاستشاريين، المقاولين، وفرق العمل المعتمدة',
    badge: 'Directory',
    badgeAr: 'دليل الجهات',
    badgeVariant: 'amber',
    icon: Users,
    url: '/stakeholders',
    keywords: ['أصحاب مصلحة', 'استشاري', 'مقاول', 'stakeholders', 'دليل'],
  },
  {
    id: 'page-project-setup',
    category: 'pages',
    title: 'Project Setup & Governance',
    titleAr: 'إعداد وتأسيس المشاريع (Project Setup)',
    subtitle: 'Project charter, site boundaries, and permissions',
    subtitleAr: 'بطاقة المشروع، الحدود الجغرافية، وصلاحيات النظام',
    badge: 'Setup',
    badgeAr: 'تأسيس',
    badgeVariant: 'slate',
    icon: FileSpreadsheet,
    url: '/project-setup',
    keywords: ['تأسيس', 'إعداد', 'setup', 'جديد', 'ميثاق'],
  },
  {
    id: 'page-technical-office',
    category: 'pages',
    title: 'Technical Office & Submittals',
    titleAr: 'المكتب الفني والاعتمادات (Technical Office)',
    subtitle: 'Shop drawings, material submittals, and WIR/IR logs',
    subtitleAr: 'متابعة الرسومات التنفيذية، اعتمادات المواد، وسجلات الفحص IR',
    badge: 'Technical',
    badgeAr: 'مكتب فني',
    badgeVariant: 'blue',
    icon: FileSpreadsheet,
    url: '/technical-office',
    keywords: ['مكتب فني', 'اعتمادات', 'رسومات', 'technical office', 'wir', 'ir'],
  },
  {
    id: 'page-projects-archive',
    category: 'pages',
    title: 'Projects Archive',
    titleAr: 'أرشيف المشاريع (Projects Archive)',
    subtitle: 'Historical projects, as-built records, and closeout files',
    subtitleAr: 'المشاريع المؤرشفة، السجلات المكتملة، وملفات التسليم النهائي',
    badge: 'Archive',
    badgeAr: 'أرشيف',
    badgeVariant: 'slate',
    icon: Archive,
    url: '/projects/archive',
    keywords: ['أرشيف', 'archive', 'مؤرشفة', 'تاريخي'],
  },
];

/* ─────────────────────────────────────────────────────────────
 * Standalone ScrySearchModal Component
 * ───────────────────────────────────────────────────────────── */

export interface ScrySearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (item: ScrySearchResultItem) => void;
  initialQuery?: string;
  isRtl?: boolean;
  placeholder?: string;
  customGroups?: ScrySearchResultGroup[];
  customItems?: ScrySearchResultItem[];
  id?: string;
  forceMounted?: boolean;
}

export const ScrySearchModal: React.FC<ScrySearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
  initialQuery = '',
  isRtl = true,
  placeholder,
  customGroups,
  customItems,
  id = 'scry-search-modal',
  forceMounted = false,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  // Safe router retrieval
  const router = (() => {
    try {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return useRouter();
    } catch {
      return null;
    }
  })();

  // Handle client-side mounting for Portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync initial query when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery(initialQuery);
      // Auto-focus input
      requestAnimationFrame(() => {
        setTimeout(() => {
          inputRef.current?.focus();
          inputRef.current?.select();
        }, 60);
      });
    }
  }, [isOpen, initialQuery]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Build items catalog
  const allItems = useMemo(() => {
    if (customItems && customItems.length > 0) return customItems;
    return DEFAULT_PORTAL_ITEMS;
  }, [customItems]);

  // Filter items into Categories: Projects, Stakeholders, Pages
  const filteredGroups = useMemo<ScrySearchResultGroup[]>(() => {
    if (customGroups && customGroups.length > 0) {
      if (!query.trim()) return customGroups;
      const lower = query.toLowerCase().trim();
      return customGroups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) =>
              item.title.toLowerCase().includes(lower) ||
              item.titleAr?.toLowerCase().includes(lower) ||
              item.subtitle?.toLowerCase().includes(lower) ||
              item.subtitleAr?.toLowerCase().includes(lower) ||
              item.keywords?.some((k) => k.toLowerCase().includes(lower))
          ),
        }))
        .filter((g) => g.items.length > 0);
    }

    const lower = query.toLowerCase().trim();
    const matched = !lower
      ? allItems
      : allItems.filter(
          (item) =>
            item.title.toLowerCase().includes(lower) ||
            item.titleAr?.toLowerCase().includes(lower) ||
            item.subtitle?.toLowerCase().includes(lower) ||
            item.subtitleAr?.toLowerCase().includes(lower) ||
            item.keywords?.some((k) => k.toLowerCase().includes(lower)) ||
            item.url?.toLowerCase().includes(lower)
        );

    // Group by category
    const projectItems = matched.filter((i) => i.category === 'projects');
    const stakeholderItems = matched.filter((i) => i.category === 'stakeholders');
    const pageItems = matched.filter((i) => i.category === 'pages');

    const groups: ScrySearchResultGroup[] = [];

    if (projectItems.length > 0) {
      groups.push({
        id: 'projects',
        title: 'Projects',
        titleAr: 'المشاريع الإنشائية',
        icon: FolderKanban,
        items: projectItems,
      });
    }

    if (stakeholderItems.length > 0) {
      groups.push({
        id: 'stakeholders',
        title: 'Stakeholders',
        titleAr: 'أصحاب المصلحة والشركاء',
        icon: Users,
        items: stakeholderItems,
      });
    }

    if (pageItems.length > 0) {
      groups.push({
        id: 'pages',
        title: 'Pages & Tools',
        titleAr: 'الصفحات والأقسام',
        icon: LayoutDashboard,
        items: pageItems,
      });
    }

    return groups;
  }, [allItems, customGroups, query]);

  // Flattened array of all visible items for sequential keyboard navigation
  const flatVisibleItems = useMemo(
    () => filteredGroups.flatMap((g) => g.items),
    [filteredGroups]
  );

  const effectiveActiveId = activeItemId || flatVisibleItems[0]?.id || null;

  // Set default active descendant when items change
  useEffect(() => {
    if (flatVisibleItems.length > 0) {
      setActiveItemId((prev) => {
        const exists = flatVisibleItems.some((item) => item.id === prev);
        return exists ? prev : flatVisibleItems[0].id;
      });
    } else {
      setActiveItemId(null);
    }
  }, [flatVisibleItems]);

  // Scroll active item into view
  useEffect(() => {
    if (!effectiveActiveId) return;
    const el = document.getElementById(effectiveActiveId);
    if (el) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [effectiveActiveId]);

  // Safe navigation handler
  const handleSelectItem = useCallback(
    (item: ScrySearchResultItem) => {
      onSelectResult?.(item);
      item.onSelect?.();
      onClose();

      if (item.url) {
        try {
          if (router && typeof router.push === 'function') {
            router.push(item.url);
            return;
          }
        } catch {
          // Fallback
        }
        if (typeof window !== 'undefined') {
          window.location.href = item.url;
        }
      }
    },
    [onSelectResult, onClose, router]
  );

  // Keyboard navigation inside combobox
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (flatVisibleItems.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        onClose();
      }
      return;
    }

    const currentIndex = flatVisibleItems.findIndex((it) => it.id === activeItemId);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < flatVisibleItems.length - 1 ? currentIndex + 1 : 0;
      setActiveItemId(flatVisibleItems[nextIndex].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : flatVisibleItems.length - 1;
      setActiveItemId(flatVisibleItems[prevIndex].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveItemId(flatVisibleItems[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveItemId(flatVisibleItems[flatVisibleItems.length - 1].id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = flatVisibleItems.find((it) => it.id === activeItemId) || flatVisibleItems[0];
      if (selected) {
        handleSelectItem(selected);
      }
    }
  };

  if (!isOpen || (!mounted && !forceMounted)) return null;

  const defaultPlaceholder = isRtl
    ? 'ابحث في المشاريع، أصحاب المصلحة، أو الصفحات...'
    : 'Search projects, stakeholders, or pages...';

  const modalContent = (
    <div
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={isRtl ? 'البحث العام الموحد' : 'Global Unified Search'}
        className={styles.modalDialog}
        dir={isRtl ? 'rtl' : 'ltr'}
        data-rtl={isRtl ? 'true' : 'false'}
      >
        {/* Modal Search Header with ARIA Combobox */}
        <div className={styles.modalHeader}>
          <Search className={styles.modalSearchIcon} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || defaultPlaceholder}
            className={styles.modalInput}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls="scry-search-modal-listbox"
            aria-activedescendant={effectiveActiveId || undefined}
            aria-label={isRtl ? 'حقل البحث العام' : 'Global search input'}
            autoComplete="off"
            spellCheck="false"
          />

          <div className={styles.modalInputActions}>
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className={styles.modalClearBtn}
                title={isRtl ? 'مسح النص' : 'Clear search text'}
                aria-label={isRtl ? 'مسح النص' : 'Clear search text'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className={styles.modalCloseKbd} aria-hidden="true">
              Esc
            </span>
            <button
              type="button"
              onClick={onClose}
              className={styles.modalCloseBtn}
              title={isRtl ? 'إغلاق نافذة البحث' : 'Close search modal'}
              aria-label={isRtl ? 'إغلاق نافذة البحث' : 'Close search modal'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Results Listbox */}
        <div
          id="scry-search-modal-listbox"
          ref={listboxRef}
          role="listbox"
          aria-label={isRtl ? 'نتائج البحث المجمعة' : 'Grouped search results'}
          className={styles.modalListbox}
        >
          {filteredGroups.length === 0 ? (
            <div className={styles.emptyState}>
              <Search className={styles.emptyStateIcon} aria-hidden="true" />
              <div className={styles.emptyStateTitle}>
                {isRtl ? `لم يتم العثور على نتائج لـ «${query}»` : `No results found for "${query}"`}
              </div>
              <div className={styles.emptyStateDesc}>
                {isRtl
                  ? 'جرّب البحث باسم المشروع، كود المشروع، اسم الاستشاري أو المقاول، أو التنقل المباشر للصفحات.'
                  : 'Try searching by project name, code, contractor, consultant, or direct page title.'}
              </div>
            </div>
          ) : (
            filteredGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div
                  key={group.id}
                  role="group"
                  aria-labelledby={`scry-group-heading-${group.id}`}
                  className={styles.groupSection}
                >
                  <div
                    id={`scry-group-heading-${group.id}`}
                    className={styles.groupHeading}
                    role="presentation"
                  >
                    <div className={styles.groupHeadingContent}>
                      <GroupIcon className={styles.groupHeadingIcon} aria-hidden="true" />
                      <span>{isRtl ? group.titleAr : group.title}</span>
                    </div>
                    <span className={styles.groupBadge}>
                      {group.items.length}{' '}
                      {isRtl
                        ? group.id === 'projects'
                          ? 'مشاريع'
                          : group.id === 'stakeholders'
                          ? 'جهات'
                          : 'صفحات'
                        : group.id}
                    </span>
                  </div>

                  <div>
                    {group.items.map((item) => {
                      const isActive = item.id === effectiveActiveId;
                      const ItemIcon = item.icon || GroupIcon;
                      const badgeVariantClass =
                        item.badgeVariant === 'emerald'
                          ? styles.badge_emerald
                          : item.badgeVariant === 'blue'
                          ? styles.badge_blue
                          : item.badgeVariant === 'purple'
                          ? styles.badge_purple
                          : item.badgeVariant === 'amber'
                          ? styles.badge_amber
                          : styles.badge_slate;

                      return (
                        <div
                          key={item.id}
                          id={item.id}
                          role="option"
                          aria-selected={isActive}
                          className={`${styles.resultItem} ${isActive ? styles.resultItemActive : ''}`}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setActiveItemId(item.id)}
                        >
                          <div className={styles.itemIconBox}>
                            <ItemIcon className="w-4 h-4 stroke-[2]" aria-hidden="true" />
                          </div>

                          <div className={styles.itemContent}>
                            <div className={styles.itemTitleRow}>
                              <span className={styles.itemTitle}>
                                {isRtl ? item.titleAr || item.title : item.title}
                              </span>
                              {(item.badgeAr || item.badge) && (
                                <span className={`${styles.itemBadge} ${badgeVariantClass}`}>
                                  {isRtl ? item.badgeAr || item.badge : item.badge}
                                </span>
                              )}
                            </div>
                            {(item.subtitleAr || item.subtitle) && (
                              <span className={styles.itemSubtitle}>
                                {isRtl ? item.subtitleAr || item.subtitle : item.subtitle}
                              </span>
                            )}
                          </div>

                          <div className={styles.itemActionHint} aria-hidden="true">
                            {isRtl ? (
                              <ArrowLeft className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer with Keyboard Shortcuts */}
        <div className={styles.modalFooter}>
          <div className={styles.footerHintsList}>
            <span className={styles.footerHint}>
              <kbd className={styles.footerKbd}>↵</kbd>
              <span>{isRtl ? 'للاختيار' : 'Select'}</span>
            </span>
            <span className={styles.footerHint}>
              <kbd className={styles.footerKbd}>↑</kbd>
              <kbd className={styles.footerKbd}>↓</kbd>
              <span>{isRtl ? 'للتنقل' : 'Navigate'}</span>
            </span>
            <span className={styles.footerHint}>
              <kbd className={styles.footerKbd}>Esc</kbd>
              <span>{isRtl ? 'للإغلاق' : 'Close'}</span>
            </span>
          </div>

          <div className={styles.footerBrand}>
            <span className={styles.footerBrandDot} />
            <span>PZone ScrySearch</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (forceMounted && typeof document === 'undefined') {
    return modalContent;
  }

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
};

/* ─────────────────────────────────────────────────────────────
 * ScrySearch Main Component
 * ─────────────────────────────────────────────────────────────
 * Supports:
 * 1. 3D Flip Search Pill Animation (original physics & interaction preserved)
 * 2. Global search modal (Cmd+K / Ctrl+K) with backdrop blur & 3D entrance
 * 3. Grouped search results (Projects, Stakeholders, Pages) in RTL
 * 4. Full WAI-ARIA 1.2 Combobox accessibility roles
 */
export const ScrySearch: React.FC<ScrySearchProps> = ({
  value: controlledValue,
  onChange,
  onSubmit,
  onClear,
  onOpenChange,
  placeholder = 'بحث...',
  width = 360,
  compact = false,
  defaultOpen = false,
  autoCloseOnBlur = false,
  hotkey = '⌘K',
  isRtl = true,
  className = '',
  style,
  id = 'scry-search-input',
  name = 'search',
  ariaLabel = 'شريط البحث السريع',
  asModal = false,
  isOpenModal: controlledModalOpen,
  onModalOpenChange,
  enableGlobalModal = true,
  customGroups,
  customItems,
  onSelectResult,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [internalModalOpen, setInternalModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isModalOpen = controlledModalOpen !== undefined ? controlledModalOpen : internalModalOpen;

  const setModalOpen = useCallback(
    (open: boolean) => {
      if (controlledModalOpen === undefined) {
        setInternalModalOpen(open);
      }
      onModalOpenChange?.(open);
    },
    [controlledModalOpen, onModalOpenChange]
  );

  const currentValue = controlledValue !== undefined ? controlledValue : internalValue;
  const hasText = currentValue.trim().length > 0;

  // Handle open / close state of inline 3D flip pill
  const handleOpen = useCallback(() => {
    setIsOpen(true);
    onOpenChange?.(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    });
  }, [onOpenChange]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const handleClear = useCallback(() => {
    if (controlledValue === undefined) {
      setInternalValue('');
    }
    onChange?.('');
    onClear?.();
    inputRef.current?.focus();
  }, [controlledValue, onChange, onClear]);

  // "One button, three jobs"
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (asModal) {
      setModalOpen(true);
      return;
    }

    if (!isOpen) {
      handleOpen();
      return;
    }

    if (hasText) {
      handleClear();
      return;
    }

    if (defaultOpen) {
      inputRef.current?.focus();
      return;
    }

    handleClose();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (controlledValue === undefined) {
      setInternalValue(val);
    }
    onChange?.(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.(currentValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (hasText) {
        handleClear();
      } else if (!defaultOpen) {
        handleClose();
      }
    }
  };

  // Click outside listener for autoCloseOnBlur (inline pill)
  useEffect(() => {
    if (!autoCloseOnBlur || !isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!hasText) {
          handleClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [autoCloseOnBlur, isOpen, hasText, handleClose]);

  // Global hotkey support (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (enableGlobalModal) {
          setModalOpen(true);
        } else {
          if (!isOpen) {
            handleOpen();
          } else {
            inputRef.current?.focus();
            inputRef.current?.select();
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, handleOpen, enableGlobalModal, setModalOpen]);

  // Button title and aria labels
  const buttonTitle = !isOpen
    ? isRtl
      ? 'فتح البحث'
      : 'Open Search'
    : hasText
    ? isRtl
      ? 'مسح نص البحث'
      : 'Clear search'
    : defaultOpen
    ? isRtl
      ? 'بحث'
      : 'Search'
    : isRtl
    ? 'إغلاق البحث'
    : 'Close search';

  const widthStyle = typeof width === 'number' ? `${width}px` : width;

  return (
    <>
      <div
        ref={containerRef}
        className={`${styles.seat} ${compact ? styles.seatCompact : ''} ${className}`}
        data-state={isOpen ? 'open' : 'closed'}
        data-rtl={isRtl ? 'true' : 'false'}
        style={{
          ...style,
          ['--w' as any]: widthStyle,
        }}
        role="search"
        aria-label={ariaLabel}
      >
        {/* 1. Cast shadow on the page (does not rotate, only arrives) */}
        <span className={styles.shadow} aria-hidden="true" />

        {/* 2. 3D Flipping Field Pill */}
        <div className={styles.field} aria-hidden={!isOpen}>
          <span className={styles.sheen} aria-hidden="true" />
          <input
            ref={inputRef}
            id={id}
            name={name}
            type="search"
            value={currentValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label={ariaLabel}
            tabIndex={isOpen ? 0 : -1}
            readOnly={!isOpen}
            autoComplete="new-password"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            className={styles.input}
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={`${id}-listbox`}
          />
          <div id={`${id}-listbox`} role="listbox" aria-label={ariaLabel} className="sr-only" />
          {/* Hotkey badge shown when empty and open */}
          {hotkey && !hasText && (
            <span
              className={styles.hotkeyBadge}
              aria-hidden="true"
              onClick={() => {
                if (enableGlobalModal) setModalOpen(true);
              }}
              style={{ cursor: enableGlobalModal ? 'pointer' : 'default', pointerEvents: 'auto' }}
            >
              {hotkey}
            </span>
          )}
        </div>

        {/* 3. Action Button (Three Jobs in One) */}
        <button
          type="button"
          onClick={handleButtonClick}
          className={styles.btn}
          title={buttonTitle}
          aria-label={buttonTitle}
        >
          <span className={`${styles.btnIcon} ${isOpen && hasText ? styles.btnIconSpin : ''}`}>
            {isOpen && (!defaultOpen || hasText) ? (
              <X className="w-4 h-4 stroke-[2.5]" />
            ) : (
              <Search className="w-4 h-4 stroke-[2.5]" />
            )}
          </span>
        </button>
      </div>

      {/* Global Search Modal Overlay */}
      {enableGlobalModal && (
        <ScrySearchModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          initialQuery={currentValue}
          isRtl={isRtl}
          placeholder={placeholder}
          customGroups={customGroups}
          customItems={customItems}
          onSelectResult={onSelectResult}
        />
      )}
    </>
  );
};

ScrySearch.displayName = 'ScrySearch';
