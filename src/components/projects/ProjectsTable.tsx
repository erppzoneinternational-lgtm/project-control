'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Project } from '@/types';
import { StatusBadge } from '../ui/StatusBadge';
import {
  Eye,
  Edit,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  User,
  Calculator,
  TrendingUp,
  Droplets,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FolderKanban,
  RotateCcw,
  MapPin,
  Pin,
  PinOff,
  MoveHorizontal,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Building2,
  DollarSign,
  UserCheck,
  FileCheck,
  AlertCircle,
  Award,
  AlertTriangle,
  FileSpreadsheet,
  Star,
} from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { ResizableTable } from '../ui/ResizableTable';
import { ProjectManagerDetailModal, ManagerProfile } from './ProjectManagerDetailModal';
import { ProjectBilingualNameCell } from './ProjectBilingualNameCell';
import { hasTocCertificate } from '@/lib/utils/retention-bond-tracking.utils';
import { UniversalReportModal } from '@/components/reports/UniversalReportModal';
import {
  ReportColumn,
  ReportKpiCard,
  formatCurrency,
} from '@/lib/reports/reportEngine';

export type SortColumn =
  | 'code'
  | 'name'
  | 'client'
  | 'pm'
  | 'client_pm'
  | 'role'
  | 'status'
  | 'value'
  | 'vos_value'
  | 'area'
  | 'location'
  | 'completion';
export type SortOrder = 'asc' | 'desc';

export type TableColumnKey =
  | 'sn'
  | 'code'
  | 'name'
  | 'client'
  | 'pm'
  | 'client_pm'
  | 'location'
  | 'role'
  | 'status'
  | 'hardcopy'
  | 'completion'
  | 'value'
  | 'vos_value'
  | 'area'
  | 'actions';

export const DEFAULT_COLUMN_VISIBILITY: Record<TableColumnKey, boolean> = {
  sn: true,
  code: true,
  name: true,
  client: true,
  pm: true,
  client_pm: true,
  location: true,
  role: true,
  status: true,
  hardcopy: true,
  completion: true,
  value: true,
  vos_value: true,
  area: true,
  actions: true,
};

export const ALL_COLUMNS_CONFIG: Array<{ key: TableColumnKey; labelAr: string; labelEn: string }> = [
  { key: 'sn', labelAr: 'مسلسل', labelEn: 'SN' },
  { key: 'code', labelAr: 'كود المشروع', labelEn: 'Project Code' },
  { key: 'name', labelAr: 'اسم المشروع', labelEn: 'Project Name' },
  { key: 'client', labelAr: 'العميل', labelEn: 'Client' },
  { key: 'pm', labelAr: 'مدير مشروع بي زون', labelEn: 'P.ZONE PM' },
  { key: 'client_pm', labelAr: 'مدير مشروع المالك / العميل', labelEn: 'Client / Owner PM' },
  { key: 'location', labelAr: 'الموقع', labelEn: 'Location' },
  { key: 'role', labelAr: 'دور بي زون', labelEn: 'PZone Role' },
  { key: 'status', labelAr: 'الحالة', labelEn: 'Status' },
  { key: 'hardcopy', labelAr: 'النسخة الورقية', labelEn: 'Paper Contract' },
  { key: 'completion', labelAr: 'نسبة الإنجاز', labelEn: 'Progress' },
  { key: 'value', labelAr: 'قيمة العقد المعدلة', labelEn: 'Contract Value' },
  { key: 'vos_value', labelAr: 'قيمة أوامر التغيير', labelEn: 'VO Value' },
  { key: 'area', labelAr: 'مسطح المياه (م²)', labelEn: 'Water Area (m²)' },
  { key: 'actions', labelAr: 'إجراءات', labelEn: 'Actions' },
];

export interface DataTableProps {
  projects: Project[];
  allProjects?: Project[];
  lang?: 'ar' | 'en';
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (column: SortColumn) => void;
  onClientClick?: (clientVal: string) => void;
  onPmClick?: (pmName: string) => void;
  onResetFilters?: () => void;

  // Pagination support (optional, backward compatible)
  currentPage?: number;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  pagination?: boolean;

  // Horizontal Scroll & Pinned Columns controls
  pinColumns?: boolean;
  showScrollIndicator?: boolean;
  showProgressBar?: boolean;

  // Favorites support (optional)
  favoriteIds?: ReadonlySet<string>;
  onToggleFavorite?: (project: Project) => void;
}

export type ProjectsTableProps = DataTableProps;

export const ProjectsTable: React.FC<ProjectsTableProps> = ({
  projects,
  allProjects,
  lang,
  sortBy,
  sortOrder = 'desc',
  onSort,
  onClientClick,
  onPmClick,
  onResetFilters,
  currentPage: propCurrentPage,
  page: propPage,
  pageSize: propPageSize,
  totalItems: propTotalItems,
  totalPages: propTotalPages,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100, 0],
  pagination = true,
  pinColumns: propPinColumns = true,
  showScrollIndicator = true,
  showProgressBar = true,
  favoriteIds,
  onToggleFavorite,
}) => {
  const { locale } = useLanguage();
  const { roles, isAdmin } = useUserRoles();
  const canEditProject = useMemo(() => {
    if (isAdmin) return true;
    return (roles || []).some((r) =>
      ['admin', 'ceo', 'coo', 'commercial_manager', 'planning_manager', 'project_manager'].includes(
        String(r).toLowerCase()
      )
    );
  }, [roles, isAdmin]);
  const activeLang = lang || locale || 'ar';
  const isAr = activeLang === 'ar';
  const tableDir = 'rtl';

  // --- Column Pinning State (User can toggle if desired) ---
  const [isPinned, setIsPinned] = useState(propPinColumns);

  // Sync state if prop changes
  useEffect(() => {
    setIsPinned(propPinColumns);
  }, [propPinColumns]);

  // Freeze project name state: default to true when isPinned is true, or user can toggle independently
  const [freezeProjectName, setFreezeProjectName] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pzone_projects_table_freeze_name');
      return saved !== null ? saved === 'true' : true;
    }
    return true;
  });

  const toggleFreezeProjectName = useCallback(() => {
    setFreezeProjectName((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pzone_projects_table_freeze_name', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Universal Report Studio State
  const [isCustomReportModalOpen, setIsCustomReportModalOpen] = useState(false);

  // Universal Portfolio Report Columns
  const portfolioReportColumns = useMemo<ReportColumn<Project>[]>(() => [
    {
      id: 'sn',
      labelAr: 'مسلسل',
      labelEn: 'SN',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (_, idx) => idx + 1,
      defaultVisible: true,
      align: 'center',
      width: '45px',
    },
    {
      id: 'code',
      labelAr: 'كود المشروع',
      labelEn: 'Project Code',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (p) => p.project_code || '—',
      defaultVisible: true,
      align: 'center',
    },
    {
      id: 'name',
      labelAr: 'اسم المشروع (عربي)',
      labelEn: 'Project Name (AR)',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (p) => p.project_name_ar || p.project_name || '—',
      defaultVisible: true,
    },
    {
      id: 'name_en',
      labelAr: 'اسم المشروع (إنجليزي)',
      labelEn: 'Project Name (EN)',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (p) => p.project_name_en || '—',
      defaultVisible: true,
    },
    {
      id: 'public_name',
      labelAr: 'الاسم العام المدمج',
      labelEn: 'Public Project Name',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (p) => (p as any).public_name || `${p.project_name || ''}${p.project_name_en ? ' - ' + p.project_name_en : ''}`,
      defaultVisible: false,
    },
    {
      id: 'client',
      labelAr: 'العميل / المطور',
      labelEn: 'Client / Developer',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (p) => p.client?.name_ar || p.client_name_raw || '—',
      defaultVisible: true,
    },
    {
      id: 'pm',
      labelAr: 'مدير مشروع بي زون',
      labelEn: 'P.ZONE PM',
      categoryAr: 'فريق العمل والمسؤوليات',
      getValue: (p) => p.pm_full_name || p.project_manager_name_raw || p.project_manager || '—',
      defaultVisible: true,
    },
    {
      id: 'location',
      labelAr: 'الموقع والمحافظة',
      labelEn: 'Location',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (p) => p.location || p.governorate?.name_ar || '—',
      defaultVisible: true,
    },
    {
      id: 'role',
      labelAr: 'الدور التعاقدي',
      labelEn: 'Contractual Role',
      categoryAr: 'البيانات المالية والتعاقدية',
      getValue: (p) => (p.pzone_role === 'main_contractor' ? 'مقاول رئيسي' : p.pzone_role === 'sub_contractor' ? 'مقاول باطن' : p.pzone_role || '—'),
      defaultVisible: true,
    },
    {
      id: 'status',
      labelAr: 'حالة المشروع',
      labelEn: 'Project Status',
      categoryAr: 'بيانات المشروع الأساسية',
      getValue: (p) => p.status,
      defaultVisible: true,
      align: 'center',
    },
    {
      id: 'total_value',
      labelAr: 'إجمالي قيمة العقد المعدلة',
      labelEn: 'Total Contract Value',
      categoryAr: 'البيانات المالية والتعاقدية',
      getValue: (p) => p.total_contract_value || p.contract_value || 0,
      formatPrint: (p) => formatCurrency(p.total_contract_value || p.contract_value || 0),
      formatExcel: (p) => p.total_contract_value || p.contract_value || 0,
      isCurrency: true,
      defaultVisible: true,
    },
    {
      id: 'contract_value',
      labelAr: 'أصل قيمة العقد الأساسية',
      labelEn: 'Base Contract Value',
      categoryAr: 'البيانات المالية والتعاقدية',
      getValue: (p) => p.contract_value || 0,
      formatPrint: (p) => formatCurrency(p.contract_value || 0),
      formatExcel: (p) => p.contract_value || 0,
      isCurrency: true,
      defaultVisible: false,
    },
    {
      id: 'vos_value',
      labelAr: 'قيمة أوامر التغيير',
      labelEn: 'Variation Orders Value',
      categoryAr: 'البيانات المالية والتعاقدية',
      getValue: (p) => p.vos_value || 0,
      formatPrint: (p) => formatCurrency(p.vos_value || 0),
      formatExcel: (p) => p.vos_value || 0,
      isCurrency: true,
      defaultVisible: true,
    },
    {
      id: 'completion',
      labelAr: 'نسبة الإنجاز الفعلية',
      labelEn: 'Completion %',
      categoryAr: 'التقدم والمؤشرات الفنية',
      getValue: (p) => `${p.completion_pct ?? (p as any).completion_percentage ?? 0}%`,
      formatExcel: (p) => p.completion_pct ?? (p as any).completion_percentage ?? 0,
      defaultVisible: true,
      align: 'center',
    },
    {
      id: 'area',
      labelAr: 'مسطح المياه (م²)',
      labelEn: 'Water Area (m²)',
      categoryAr: 'التقدم والمؤشرات الفنية',
      getValue: (p) => p.water_area_m2 || 0,
      defaultVisible: true,
      align: 'center',
    },
    {
      id: 'volume',
      labelAr: 'حجم المكعب المائي (م³)',
      labelEn: 'Water Volume (m³)',
      categoryAr: 'التقدم والمؤشرات الفنية',
      getValue: (p) => p.water_vol_m3 || 0,
      defaultVisible: false,
      align: 'center',
    },
    {
      id: 'hardcopy',
      labelAr: 'النسخة الورقية للعقد',
      labelEn: 'Contract Hardcopy',
      categoryAr: 'البيانات المالية والتعاقدية',
      getValue: (p) => ((p as any).has_hardcopy_contract ? 'متوفرة بالشركة' : 'غير متوفرة'),
      defaultVisible: false,
    },
  ], []);

  // Universal Portfolio Report KPIs
  const portfolioReportKpis = useMemo<ReportKpiCard[]>(() => {
    const list = projects || [];
    const totalCount = list.length;
    const totalVal = list.reduce((sum, p) => sum + Number(p.total_contract_value || p.contract_value || 0), 0);
    const totalVos = list.reduce((sum, p) => sum + Number(p.vos_value || 0), 0);
    const totalArea = list.reduce((sum, p) => sum + Number(p.water_area_m2 || 0), 0);
    const activeWorking = list.filter((p) => p.status === 'working').length;
    const handingOver = list.filter((p) => p.status === 'handing_over').length;

    return [
      { id: 'k1', label: isAr ? 'إجمالي المشروعات' : 'Total Projects', value: totalCount, tone: 'default' },
      { id: 'k2', label: isAr ? 'إجمالي قيم العقود' : 'Total Contract Value', value: formatCurrency(totalVal), tone: 'emerald' },
      { id: 'k3', label: isAr ? 'أوامر التغيير' : 'Total VOs', value: formatCurrency(totalVos), tone: 'amber' },
      { id: 'k4', label: isAr ? 'مشروعات قيد التنفيذ' : 'Active Working', value: activeWorking, tone: 'blue' },
      { id: 'k5', label: isAr ? 'قيد التسليم' : 'Handing Over', value: handingOver, tone: 'purple' },
      { id: 'k6', label: isAr ? 'إجمالي مسطح المياه' : 'Total Water Area', value: `${totalArea.toLocaleString()} م²`, tone: 'default' },
    ];
  }, [projects, isAr]);

  // --- Horizontal Scroll & Responsive Overflow State ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0); // 0 to 1

  const checkScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const { scrollWidth, clientWidth, scrollLeft } = el;
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    const overflow = maxScroll > 2;
    setIsOverflowing(overflow);

    if (!overflow) {
      setCanScrollStart(false);
      setCanScrollEnd(false);
      setScrollProgress(0);
      return;
    }

    // Modern browsers normalize scrollLeft = 0 at start edge (right in RTL, left in LTR).
    // As user scrolls away from start, Math.abs(scrollLeft) increases from 0 up to maxScroll.
    const absScroll = Math.abs(scrollLeft);
    const atStart = absScroll <= 5;
    const atEnd = absScroll >= maxScroll - 5;

    setCanScrollStart(!atStart);
    setCanScrollEnd(!atEnd);

    const progress = maxScroll > 0 ? Math.min(1, Math.max(0, absScroll / maxScroll)) : 0;
    setScrollProgress(progress);
  }, []);

  // Use ResizeObserver for instant adaptation to container/screen/orientation changes
  useEffect(() => {
    checkScrollState();
    const el = scrollContainerRef.current;
    if (!el) return;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        checkScrollState();
      });
      resizeObserver.observe(el);
    }

    window.addEventListener('resize', checkScrollState, { passive: true });
    return () => {
      window.removeEventListener('resize', checkScrollState);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [checkScrollState, projects.length]);

  const scrollHorizontally = (direction: 'start' | 'end') => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const offset = 340;
    const delta = isAr
      ? direction === 'start'
        ? offset
        : -offset
      : direction === 'start'
      ? -offset
      : offset;

    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  // --- Aggregated Totals for Footer (Calculated over all input projects) ---
  const totalContractValue = useMemo(() => {
    return projects.reduce((acc, p) => {
      const val = p.total_contract_value || p.contract_value_egp || p.contract_value || 0;
      const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [projects]);

  const totalWaterArea = useMemo(() => {
    return projects.reduce((acc, p) => {
      const val = p.water_area_m2 || 0;
      const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [projects]);

  const totalVosValue = useMemo(() => {
    return projects.reduce((acc, p) => {
      const val = p.vos_value || 0;
      const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/,/g, ''));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [projects]);

  // --- Column Visibility State (User customizable) ---
  const [visibleColumns, setVisibleColumns] = useState<Record<TableColumnKey, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pzone_projects_table_columns_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...DEFAULT_COLUMN_VISIBILITY, ...parsed };
        }
      } catch {
        // Ignore storage read error
      }
    }
    return DEFAULT_COLUMN_VISIBILITY;
  });

  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  // Close column menu on outside click or escape
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(e.target as Node)) {
        setIsColumnMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsColumnMenuOpen(false);
      }
    };
    if (isColumnMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isColumnMenuOpen]);

  const toggleColumnVisibility = (key: TableColumnKey) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const anyVisible = Object.values(next).some(Boolean);
      if (!anyVisible) return prev;
      try {
        localStorage.setItem('pzone_projects_table_columns_v2', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const showAllColumns = () => {
    const allVisible = { ...DEFAULT_COLUMN_VISIBILITY };
    setVisibleColumns(allVisible);
    try {
      localStorage.setItem('pzone_projects_table_columns_v2', JSON.stringify(allVisible));
    } catch {}
  };

  const resetColumnsToDefault = () => {
    setVisibleColumns(DEFAULT_COLUMN_VISIBILITY);
    try {
      localStorage.removeItem('pzone_projects_table_columns_v2');
    } catch {}
  };

  const visibleColumnsCount = useMemo(() => {
    return Object.values(visibleColumns).filter(Boolean).length;
  }, [visibleColumns]);

  // --- Project Manager Detail Modal State ---
  const [selectedManager, setSelectedManager] = useState<ManagerProfile | null>(null);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);

  // --- Pagination Logic ---
  const [internalPage, setInternalPage] = useState(1);
  const [internalPageSize, setInternalPageSize] = useState<number>(propPageSize ?? 25);

  const activePageSize = propPageSize !== undefined ? propPageSize : internalPageSize;
  const isAllSelected = activePageSize === 0;

  // Decide if pagination bar is shown
  const shouldPaginate = pagination && (isAllSelected || activePageSize > 0);
  const totalCount = propTotalItems ?? projects.length;

  const computedTotalPages = isAllSelected
    ? 1
    : Math.max(1, Math.ceil(totalCount / (activePageSize || 1)));

  const effectiveTotalPages = propTotalPages ?? computedTotalPages;

  const rawPage = propPage ?? propCurrentPage ?? internalPage;
  const activePage = Math.min(Math.max(1, rawPage), effectiveTotalPages);

  // Keep internal page within bounds if project list shrinks
  useEffect(() => {
    if (internalPage > effectiveTotalPages) {
      setInternalPage(Math.max(1, effectiveTotalPages));
    }
  }, [effectiveTotalPages, internalPage]);

  const handlePageChange = (newPage: number) => {
    const targetPage = Math.min(Math.max(1, newPage), effectiveTotalPages);
    if (onPageChange) {
      onPageChange(targetPage);
    } else {
      setInternalPage(targetPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (onPageSizeChange) {
      onPageSizeChange(newSize);
    } else {
      setInternalPageSize(newSize);
      setInternalPage(1);
    }
  };

  const isServerPaged = Boolean(
    onPageChange && projects.length <= activePageSize && projects.length < totalCount
  );

  const startIndex = isAllSelected || isServerPaged ? 0 : (activePage - 1) * activePageSize;
  const endIndex = isAllSelected
    ? projects.length
    : isServerPaged
    ? Math.min(startIndex + projects.length, totalCount)
    : Math.min(startIndex + activePageSize, projects.length);

  const displayedProjects =
    isAllSelected || isServerPaged
      ? projects
      : projects.slice(startIndex, startIndex + activePageSize);

  // Generate page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    if (effectiveTotalPages <= 7) {
      return Array.from({ length: effectiveTotalPages }, (_, i) => i + 1);
    }
    const pages: (number | -1)[] = [1];

    if (activePage > 3) {
      pages.push(-1);
    }

    const start = Math.max(2, activePage - 1);
    const end = Math.min(effectiveTotalPages - 1, activePage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (activePage < effectiveTotalPages - 2) {
      pages.push(-1);
    }

    pages.push(effectiveTotalPages);
    return pages;
  }, [activePage, effectiveTotalPages]);

  // --- Sort Header Renderer ---
  const renderSortHeader = (
    labelAr: string,
    labelEn: string,
    column: SortColumn,
    align: 'start' | 'center' | 'end' = 'start',
    extraClasses = '',
    extraAction?: React.ReactNode
  ) => {
    const label = isAr ? labelAr : labelEn;
    const isActive = sortBy === column;
    const isAsc = sortOrder === 'asc';

    const flexAlignClass =
      align === 'center'
        ? 'justify-center text-center'
        : align === 'end'
        ? 'justify-end text-end'
        : 'justify-start text-start';

    const thAlignClass =
      align === 'center' ? 'text-center' : align === 'end' ? 'text-end' : 'text-start';

    return (
      <th
        scope="col"
        role="columnheader"
        aria-sort={isActive ? (isAsc ? 'ascending' : 'descending') : 'none'}
        onClick={() => onSort?.(column)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSort?.(column);
          }
        }}
        tabIndex={0}
        className={`py-3.5 px-4 cursor-pointer select-none group hover:bg-slate-200 dark:hover:bg-slate-700/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset ${thAlignClass} ${
          isActive ? 'bg-emerald-50/70 dark:bg-emerald-950/40' : ''
        } ${extraClasses}`}
        title={
          isAr
            ? `اضغط للترتيب حسب ${label} (${isActive ? (isAsc ? 'تصاعدي' : 'تنازلي') : 'غير مفعّل'})`
            : `Click to sort by ${label} (${isActive ? (isAsc ? 'ascending' : 'descending') : 'inactive'})`
        }
      >
        <div className={`flex items-center gap-1.5 ${flexAlignClass}`}>
          <span
            className={`font-bold transition-colors ${
              isActive
                ? 'text-emerald-700 dark:text-emerald-400 font-black'
                : 'text-slate-600 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400'
            }`}
          >
            {label}
          </span>
          <span
            className={`inline-flex items-center justify-center w-4 h-4 rounded transition-all ${
              isActive
                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400'
                : 'text-slate-400 opacity-40 group-hover:opacity-100 group-hover:text-emerald-500'
            }`}
          >
            {isActive ? (
              isAsc ? (
                <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
              )
            ) : (
              <ArrowUpDown className="w-3 h-3" aria-hidden="true" />
            )}
          </span>
          {extraAction}
        </div>
      </th>
    );
  };

  // Sticky offset for project code column depending on whether SN column is visible
  const codeStickyOffset = useMemo(() => {
    if (!visibleColumns.sn) {
      return 'sticky right-0';
    }
    return 'sticky right-12';
  }, [visibleColumns.sn]);

  // Project name pinned status (active when pinning enabled and freezeProjectName is on)
  const isNamePinned = Boolean(isPinned && freezeProjectName && visibleColumns.name);

  // Sticky offset for project name column
  const nameStickyOffset = useMemo(() => {
    if (!visibleColumns.code && !visibleColumns.sn) {
      return 'sticky right-0';
    }
    if (!visibleColumns.code && visibleColumns.sn) {
      return 'sticky right-12';
    }
    if (visibleColumns.code && !visibleColumns.sn) {
      return 'sticky right-[112px]';
    }
    return 'sticky right-[160px]'; // 48px (sn) + 112px (code)
  }, [visibleColumns.code, visibleColumns.sn]);

  // Leading columns count for summary footer colSpan
  const leadingColumnsCount = useMemo(() => {
    const leadingKeys: TableColumnKey[] = [
      'sn',
      'code',
      'name',
      'client',
      'pm',
      'client_pm',
      'location',
      'role',
      'status',
      'hardcopy',
      'completion',
    ];
    return Math.max(1, leadingKeys.filter((k) => visibleColumns[k]).length);
  }, [visibleColumns]);

  // --- Dynamic Drop Shadow Class Calculations for Pinned Columns ---
  // When table is scrolled away from start, the outermost pinned column casts a drop shadow over scrolling content
  const pinnedCodeShadowClass = useMemo(() => {
    if (!isPinned) return '';
    // If project name is also pinned, project name is the outer edge, so code has subtle border
    if (isNamePinned) return 'border-l border-slate-200/80 dark:border-slate-800';
    if (!canScrollStart) return 'border-l border-slate-200/80 dark:border-slate-700/80 shadow-none';

    return 'border-l border-slate-300 dark:border-slate-600 shadow-[-6px_0_12px_-2px_rgba(0,0,0,0.12)] dark:shadow-[-6px_0_12px_-2px_rgba(0,0,0,0.45)]';
  }, [isPinned, isNamePinned, canScrollStart]);

  const pinnedNameShadowClass = useMemo(() => {
    if (!isNamePinned) return '';
    if (!canScrollStart) return 'border-l border-slate-200/80 dark:border-slate-700/80 shadow-none';

    return 'border-l border-slate-300 dark:border-slate-600 shadow-[-6px_0_12px_-2px_rgba(0,0,0,0.12)] dark:shadow-[-6px_0_12px_-2px_rgba(0,0,0,0.45)]';
  }, [isNamePinned, canScrollStart]);

  // Actions column dynamic drop shadow (casts over content before user reaches the end)
  const pinnedActionsShadowClass = useMemo(() => {
    if (!isPinned) return '';
    if (!canScrollEnd) return 'sm:border-r sm:border-slate-200/80 dark:border-slate-800 dark:sm:border-slate-700/80 sm:shadow-none';

    return 'sm:border-r sm:border-slate-300 dark:border-slate-700 dark:sm:border-slate-600 sm:shadow-[6px_0_12px_-2px_rgba(0,0,0,0.12)] dark:shadow-[6px_0_12px_-2px_rgba(0,0,0,0.45)]';
  }, [isPinned, canScrollEnd]);

  // Edge shadow indicators visibility
  const showLeftShadow = canScrollEnd;
  const showRightShadow = canScrollStart;

  return (
    <div
      dir={tableDir}
      className="glass-card bg-white dark:bg-slate-900 !overflow-visible border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm transition-all"
    >
      {/* Responsive Horizontal Scroll Hint & Quick Controls Banner */}
      {showScrollIndicator && (
        <div
          data-testid="table-scroll-indicator-banner"
          className="px-4 py-2.5 rounded-t-2xl bg-gradient-to-r from-emerald-50/95 via-slate-50 to-emerald-50/95 dark:from-emerald-950/60 dark:via-slate-900/90 dark:to-emerald-950/60 text-emerald-950 dark:text-emerald-200 text-xs font-bold flex flex-wrap items-center justify-between gap-2.5 border-b border-emerald-100/90 dark:border-slate-800 transition-all relative z-30"
        >
          {/* Scroll status hint and beacon */}
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100">
                {isAr
                  ? `جدول تفصيلي عريض (${visibleColumnsCount} عمود) • اسحب أفقياً أو استخدم الأسهم`
                  : `Wide Table (${visibleColumnsCount} columns) • Scroll horizontally or use arrow buttons`}
              </span>

              {/* Mobile swipe gesture badge */}
              <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-100/80 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800/60">
                <MoveHorizontal className="w-3 h-3" aria-hidden="true" />
                <span>{isAr ? 'اسحب للتنقل' : 'Swipe to pan'}</span>
              </span>
            </div>
          </div>

          {/* Quick controls: Column filter, Pinning toggle, and Scroll buttons */}
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 shrink-0">
            {/* Columns Customization Filter Dropdown */}
            <div className="relative" ref={columnMenuRef}>
              <button
                type="button"
                onClick={() => setIsColumnMenuOpen((prev) => !prev)}
                aria-expanded={isColumnMenuOpen}
                aria-haspopup="dialog"
                title={isAr ? 'تخصيص وإظهار/إخفاء أعمدة الجدول' : 'Customize and toggle table columns'}
                className={`min-h-[44px] px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer shadow-2xs ${
                  isColumnMenuOpen
                    ? 'bg-emerald-100 dark:bg-emerald-900/70 border-emerald-400 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100 shadow-sm'
                    : 'bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isAr ? 'الأعمدة' : 'Columns'}</span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black">
                  {visibleColumnsCount}/{ALL_COLUMNS_CONFIG.length}
                </span>
              </button>

              {/* Dropdown Popover */}
              {isColumnMenuOpen && (
                <div
                  role="dialog"
                  aria-label={isAr ? 'قائمة تخصيص أعمدة الجدول' : 'Table columns customization menu'}
                  className="absolute top-full mt-2 end-0 rtl:left-0 ltr:right-0 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-slate-800 dark:text-white font-black text-xs">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{isAr ? 'تخصيص وإخفاء الأعمدة' : 'Column Visibility'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={showAllColumns}
                        className="px-2 py-0.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 font-bold transition-colors cursor-pointer"
                      >
                        {isAr ? 'الكل' : 'All'}
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={resetColumnsToDefault}
                        className="px-2 py-0.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors cursor-pointer"
                      >
                        {isAr ? 'إعادة ضبط' : 'Reset'}
                      </button>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 pe-1 scrollbar-thin">
                    {ALL_COLUMNS_CONFIG.map((col) => {
                      const isChecked = visibleColumns[col.key];
                      return (
                        <label
                          key={col.key}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer select-none text-xs transition-colors ${
                            isChecked
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-normal'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleColumnVisibility(col.key)}
                              className="w-4 h-4 rounded text-emerald-600 border-slate-300 dark:border-slate-600 dark:bg-slate-800 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                            />
                            <span className="truncate">{isAr ? col.labelAr : col.labelEn}</span>
                          </div>
                          {col.key === 'vos_value' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                              {isAr ? 'تغيير' : 'VO'}
                            </span>
                          )}
                          {col.key === 'client_pm' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                              {isAr ? 'مالك' : 'PM'}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Pinned columns toggle button */}
            <button
              type="button"
              onClick={() => setIsPinned((prev) => !prev)}
              aria-pressed={isPinned}
              aria-label={
                isAr
                  ? isPinned
                    ? 'إلغاء تثبيت الأعمدة أثناء التمرير'
                    : 'تثبيت الأعمدة أثناء التمرير'
                  : isPinned
                  ? 'Unpin columns while scrolling'
                  : 'Pin columns while scrolling'
              }
              title={
                isAr
                  ? isPinned
                    ? 'إلغاء تثبيت الأعمدة أثناء التمرير'
                    : 'تثبيت الأعمدة أثناء التمرير'
                  : isPinned
                  ? 'Unpin columns while scrolling'
                  : 'Pin columns while scrolling'
              }
              className={`min-h-[44px] px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
                isPinned
                  ? 'bg-emerald-100/80 dark:bg-emerald-900/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200'
                  : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {isPinned ? (
                <>
                  <Pin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 fill-emerald-600 dark:fill-emerald-400" />
                  <span className="hidden sm:inline">{isAr ? 'مثبّت' : 'Pinned'}</span>
                </>
              ) : (
                <>
                  <PinOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{isAr ? 'تثبيت' : 'Pin'}</span>
                </>
              )}
            </button>

            {/* Freeze Project Name Column Toggle */}
            <button
              type="button"
              onClick={() => {
                if (!isPinned) setIsPinned(true);
                toggleFreezeProjectName();
              }}
              aria-pressed={isNamePinned}
              aria-label={
                isAr
                  ? isNamePinned
                    ? 'إلغاء تجميد عمود اسم المشروع'
                    : 'تجميد وتثبيت عمود اسم المشروع أثناء التمرير الأفقي'
                  : isNamePinned
                  ? 'Unfreeze project name column'
                  : 'Freeze project name column while scrolling'
              }
              title={
                isAr
                  ? isNamePinned
                    ? 'إلغاء تجميد عمود اسم المشروع'
                    : 'تجميد وتثبيت عمود اسم المشروع أثناء التمرير الأفقي'
                  : isNamePinned
                  ? 'Unfreeze project name column'
                  : 'Freeze project name column while scrolling'
              }
              className={`min-h-[44px] px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
                isNamePinned
                  ? 'bg-amber-100/80 dark:bg-amber-950/70 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                  : 'bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              <Pin className={`w-3.5 h-3.5 transition-transform ${isNamePinned ? 'text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400 rotate-45' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="hidden md:inline">
                {isNamePinned
                  ? (isAr ? 'تجميد اسم المشروع' : 'Project Name Frozen')
                  : (isAr ? 'تجميد اسم المشروع' : 'Freeze Project Name')}
              </span>
            </button>

            {/* Custom Report Studio Button */}
            <button
              type="button"
              onClick={() => setIsCustomReportModalOpen(true)}
              data-testid="open-custom-report-modal"
              title={isAr ? 'استوديو تخصيص وإصدار تقرير المشروعات المعتمد' : 'Custom Project Portfolio Report Studio'}
              className="min-h-[44px] px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-200" />
              <span>{isAr ? 'تصدير تقرير مخصص' : 'Custom Report'}</span>
            </button>

            {/* Scroll Navigation Touch Targets (>= 44px) */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => scrollHorizontally('start')}
                disabled={!canScrollStart}
                aria-label={isAr ? 'تمرير لبداية الجدول' : 'Scroll to start of table'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-2xs"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => scrollHorizontally('end')}
                disabled={!canScrollEnd}
                aria-label={isAr ? 'تمرير لنهاية الجدول' : 'Scroll to end of table'}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-2xs"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Scroll Progress Bar for Tablet & Mobile Users */}
      {showProgressBar && isOverflowing && (
        <div
          data-testid="table-scroll-progress-bar"
          role="progressbar"
          aria-valuenow={Math.round(scrollProgress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={isAr ? 'مؤشر التمرير الأفقي للجدول' : 'Table horizontal scroll progress'}
          className="h-1 w-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden relative z-20"
        >
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 transition-[width] duration-100 ease-out"
            style={{
              width: `${Math.max(10, Math.round(scrollProgress * 100))}%`,
              marginInlineStart: '0',
            }}
          />
        </div>
      )}

      {/* Table Container with Overflow & Gradient Scroll Shadows */}
      <div className="relative">
        {/* Left Dynamic Edge Shadow Indicator */}
        <div
          data-testid="table-shadow-left"
          className={`pointer-events-none absolute top-0 bottom-0 left-0 w-8 sm:w-10 bg-gradient-to-r from-slate-900/20 via-slate-900/10 to-transparent dark:from-slate-950/70 dark:via-slate-950/30 dark:to-transparent z-25 transition-opacity duration-300 ${
            showLeftShadow ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />

        {/* Right Dynamic Edge Shadow Indicator */}
        <div
          data-testid="table-shadow-right"
          className={`pointer-events-none absolute top-0 bottom-0 right-0 w-8 sm:w-10 bg-gradient-to-l from-slate-900/20 via-slate-900/10 to-transparent dark:from-slate-950/70 dark:via-slate-950/30 dark:to-transparent z-25 transition-opacity duration-300 ${
            showRightShadow ? 'opacity-100' : 'opacity-0'
          }`}
          aria-hidden="true"
        />

        <div
          ref={scrollContainerRef}
          onScroll={checkScrollState}
          dir={tableDir}
          data-testid="table-scroll-container"
          className={`overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-300/80 dark:scrollbar-thumb-slate-700 overscroll-x-contain ${
            shouldPaginate && totalCount > 0 ? '' : 'rounded-b-2xl'
          }`}
        >
          <ResizableTable tableId="projects_list_table">
            <table
              dir={tableDir}
              aria-label={isAr ? 'جدول بيانات المشاريع' : 'Projects Data Table'}
              className="w-full min-w-[980px] text-start text-sm border-separate border-spacing-0 bg-white dark:bg-slate-900"
            >
              <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-xs font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  {/* Column 0: SN (Sticky at start edge when pinned) */}
                  {visibleColumns.sn && (
                    <th
                      scope="col"
                      className={`py-3.5 px-3 text-center w-12 min-w-[48px] max-w-[48px] text-slate-500 dark:text-slate-400 font-extrabold ${
                        isPinned
                          ? 'sticky right-0 z-30 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs border-l border-slate-200/60 dark:border-slate-700/60'
                          : ''
                      }`}
                    >
                      {isAr ? 'مسلسل' : 'SN'}
                    </th>
                  )}

                  {/* Column 1: Project Code (Sticky at start edge, with dynamic drop-shadow cue) */}
                  {visibleColumns.code &&
                    renderSortHeader(
                      'كود المشروع',
                      'Project Code',
                      'code',
                      'center',
                      `w-28 min-w-[112px] max-w-[112px] ${
                        isPinned
                          ? `${codeStickyOffset} z-30 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs transition-shadow duration-200 ${pinnedCodeShadowClass}`
                          : ''
                      }`
                    )}

                  {/* Remaining Columns */}
                  {visibleColumns.name &&
                    renderSortHeader(
                      'اسم المشروع',
                      'Project Name',
                      'name',
                      'start',
                      isNamePinned
                        ? `${nameStickyOffset} z-30 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-xs min-w-[240px] max-w-[320px] transition-shadow duration-200 ${pinnedNameShadowClass}`
                        : 'min-w-[200px]',
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isPinned) setIsPinned(true);
                          toggleFreezeProjectName();
                        }}
                        aria-label={
                          isAr
                            ? isNamePinned
                              ? 'إلغاء تجميد عمود اسم المشروع'
                              : 'تجميد وتثبيت عمود اسم المشروع أثناء التمرير'
                            : isNamePinned
                            ? 'Unpin project name column'
                            : 'Freeze project name column'
                        }
                        title={
                          isAr
                            ? isNamePinned
                              ? 'إلغاء تجميد عمود اسم المشروع'
                              : 'تجميد وتثبيت عمود اسم المشروع أثناء التمرير'
                            : isNamePinned
                            ? 'Unpin project name column'
                            : 'Freeze project name column'
                        }
                        className={`p-1 ms-1 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                          isNamePinned
                            ? 'text-amber-600 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900/70'
                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Pin className={`w-3 h-3 ${isNamePinned ? 'fill-current rotate-45' : ''}`} />
                      </button>
                    )}
                  {visibleColumns.client && renderSortHeader('العميل', 'Client', 'client', 'start')}
                  {visibleColumns.pm && renderSortHeader('مدير مشروع بي زون', 'P.ZONE PM', 'pm', 'start')}
                  {visibleColumns.client_pm &&
                    renderSortHeader('مدير مشروع المالك / العميل', 'Client / Owner PM', 'client_pm', 'start')}
                  {visibleColumns.location && renderSortHeader('الموقع', 'Location', 'location', 'start')}
                  {visibleColumns.role && renderSortHeader('دور بي زون', 'PZone Role', 'role', 'center')}
                  {visibleColumns.status && renderSortHeader('الحالة', 'Status', 'status', 'center')}
                  {visibleColumns.hardcopy && (
                    <th
                      scope="col"
                      className="py-3.5 px-3 text-center text-slate-700 dark:text-slate-200 font-bold whitespace-nowrap text-xs"
                    >
                      {isAr ? 'النسخة الورقية' : 'Hardcopy'}
                    </th>
                  )}
                  {visibleColumns.completion && renderSortHeader('نسبة الإنجاز', 'Progress', 'completion', 'center')}
                  {visibleColumns.value &&
                    renderSortHeader('قيمة العقد المعدلة', 'Contract Value', 'value', 'center', 'min-w-[175px]')}
                  {visibleColumns.vos_value &&
                    renderSortHeader('قيمة أوامر التغيير', 'VO Value', 'vos_value', 'center', 'min-w-[175px]')}
                  {visibleColumns.area &&
                    renderSortHeader('مسطح المياه (م²)', 'Water Area (m²)', 'area', 'center', 'min-w-[140px]')}

                  {/* Actions Column (Sticky on tablet/desktop with dynamic drop shadow) */}
                  {visibleColumns.actions && (
                    <th
                      scope="col"
                      className={`py-3.5 px-4 text-center text-slate-500 dark:text-slate-400 font-semibold ${
                        isPinned
                          ? `sm:sticky sm:left-0 sm:z-30 sm:bg-slate-100 dark:sm:bg-slate-800/95 sm:backdrop-blur-xs transition-shadow duration-200 ${pinnedActionsShadowClass}`
                          : ''
                      }`}
                    >
                      {isAr ? 'إجراءات' : 'Actions'}
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900">
                {displayedProjects.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColumnsCount || 14} className="py-16 px-4 text-center">
                      <div className="max-w-md mx-auto space-y-3.5">
                        <div
                          className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto shadow-inner"
                          aria-hidden="true"
                        >
                          <FolderKanban className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {isAr
                              ? 'لا توجد مشاريع مطابقة للبحث أو الفلاتر'
                              : 'No projects match your search or filters'}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {isAr
                              ? 'جرّب تعديل كلمات البحث، أو إزالة قيود النطاق، أو إعادة ضبط الفلاتر المحددة.'
                              : 'Try modifying search terms, adjusting range constraints, or resetting active filters.'}
                          </p>
                        </div>
                        {onResetFilters && (
                          <button
                            type="button"
                            onClick={onResetFilters}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
                            aria-label={isAr ? 'إعادة ضبط جميع الفلاتر' : 'Reset all filters'}
                          >
                            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{isAr ? 'إعادة ضبط جميع الفلاتر' : 'Reset All Filters'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedProjects.map((project, idx) => {
                    const rowNumber = isServerPaged ? startIndex + idx + 1 : startIndex + idx + 1;
                    return (
                      <tr
                        key={project.id}
                        className="group/row hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 transition-colors duration-150"
                      >
                        {/* Pinned SN Cell */}
                        {visibleColumns.sn && (
                          <td
                            className={`py-3.5 px-3 font-mono font-bold text-xs text-slate-400 dark:text-slate-500 text-center tabular-nums ${
                              isPinned
                                ? 'sticky right-0 z-10 bg-white/95 dark:bg-slate-900/95 group-hover/row:bg-emerald-50/90 dark:group-hover/row:bg-slate-800/90 backdrop-blur-xs transition-colors border-l border-slate-200/60 dark:border-slate-800/70'
                                : ''
                            }`}
                          >
                            {rowNumber}
                          </td>
                        )}

                        {/* Pinned Project Code Cell with dynamic drop-shadow cue */}
                        {visibleColumns.code && (
                          <td
                            data-testid="pinned-project-code-cell"
                            className={`py-3.5 px-2 font-mono font-black text-sm text-emerald-700 dark:text-emerald-400 text-center w-28 min-w-[112px] max-w-[112px] ${
                              isPinned
                                ? `${codeStickyOffset} z-10 bg-white/95 dark:bg-slate-900/95 group-hover/row:bg-emerald-50/90 dark:group-hover/row:bg-slate-800/90 backdrop-blur-xs transition-all duration-200 ${pinnedCodeShadowClass}`
                                : ''
                            }`}
                          >
                            <div className="inline-flex items-center justify-center gap-1">
                              {onToggleFavorite && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFavorite(project);
                                  }}
                                  aria-pressed={favoriteIds?.has(project.id) ?? false}
                                  aria-label={
                                    favoriteIds?.has(project.id)
                                      ? (isAr ? `إزالة المشروع ${project.project_code} من المفضلة` : `Remove project ${project.project_code} from favorites`)
                                      : (isAr ? `إضافة المشروع ${project.project_code} للمفضلة` : `Add project ${project.project_code} to favorites`)
                                  }
                                  title={
                                    favoriteIds?.has(project.id)
                                      ? (isAr ? 'إزالة من المفضلة' : 'Remove from Favorites')
                                      : (isAr ? 'إضافة للمفضلة' : 'Add to Favorites')
                                  }
                                  className={`p-1 rounded-lg transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                                    favoriteIds?.has(project.id)
                                      ? 'text-amber-500 opacity-100 scale-105'
                                      : 'text-slate-300 dark:text-slate-600 opacity-50 group-hover/row:opacity-100 hover:text-amber-500'
                                  }`}
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 ${
                                      favoriteIds?.has(project.id) ? 'fill-amber-400 text-amber-500' : ''
                                    }`}
                                  />
                                </button>
                              )}
                              <Link
                                href={`/projects/${project.id}`}
                                className="inline-block hover:scale-105 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-xl"
                                title={isAr ? 'عرض تفاصيل المشروع' : 'View project details'}
                                aria-label={
                                  isAr
                                    ? `مشروع كود ${project.project_code}`
                                    : `Project code ${project.project_code}`
                                }
                              >
                                <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/80 rounded-xl border border-emerald-200 dark:border-emerald-900 shadow-xs inline-block hover:border-emerald-400 dark:hover:border-emerald-600">
                                  #{project.project_code}
                                </span>
                              </Link>
                            </div>
                          </td>
                        )}

                        {/* Project Name Cell */}
                        {visibleColumns.name && (
                          <td
                            data-testid="project-name-cell"
                            className={`py-3.5 px-4 font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight text-start ${
                              isNamePinned
                                ? `${nameStickyOffset} z-10 bg-white/95 dark:bg-slate-900/95 group-hover/row:bg-emerald-50/90 dark:group-hover/row:bg-slate-800/90 backdrop-blur-xs min-w-[240px] max-w-[320px] transition-all duration-200 ${pinnedNameShadowClass}`
                                : 'min-w-[200px]'
                            }`}
                          >
                            <ProjectBilingualNameCell
                              project={project}
                              href={`/projects/${project.id}`}
                              title={isAr ? 'عرض تفاصيل المشروع' : 'View project details'}
                            />
                          </td>
                        )}

                        {/* Client Cell */}
                        {visibleColumns.client && (
                          <td className="py-3.5 px-4 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 text-start">
                            <button
                              type="button"
                              onClick={() => {
                                const target =
                                  project.client?.id ||
                                  project.client_id ||
                                  project.client?.name_ar ||
                                  project.client_name_raw;
                                if (target) onClientClick?.(target);
                              }}
                              className="hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-400 hover:underline transition-colors text-start cursor-pointer group/client inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
                              title={isAr ? 'تصفية المفكّرة بحسب هذا العميل' : 'Filter by this client'}
                            >
                              <span>
                                {project.client?.name_ar ||
                                  project.client_name_raw ||
                                  (isAr ? 'عميل مباشر' : 'Direct Client')}
                              </span>
                            </button>
                          </td>
                        )}

                        {/* PM Cell: P.ZONE Internal Project Manager */}
                        {visibleColumns.pm && (
                          <td className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 text-start">
                            {(() => {
                              const pmName =
                                project.pm_full_name ||
                                project.project_manager_name_raw ||
                                project.project_manager;
                              const hasPm = Boolean(
                                pmName && pmName !== 'غير محدد' && pmName !== 'Unassigned'
                              );

                              if (!hasPm || !pmName) {
                                return (
                                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                                    {isAr ? 'غير محدد' : 'Unassigned'}
                                  </span>
                                );
                              }

                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedManager({
                                      name: pmName,
                                      type: 'pzone',
                                      company: isAr
                                        ? 'شركة بي زون للحلول الإنشائية المتكاملة'
                                        : 'P.ZONE Integrated Construction Solutions',
                                      role: isAr ? 'مدير مشروع بي زون (داخلي)' : 'P.ZONE Project Manager',
                                      phone: project.pm_phone || undefined,
                                      email: project.pm_email || undefined,
                                    });
                                    setIsManagerModalOpen(true);
                                  }}
                                  className="group/pm text-start hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-400 transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-lg px-2 py-1 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 border border-slate-200/60 dark:border-slate-700/60"
                                  title={
                                    isAr
                                      ? 'عرض بطاقة مدير مشروع بي زون ومشاريعه وتفاصيل التواصل'
                                      : 'View P.ZONE PM profile, projects and contact details'
                                  }
                                >
                                  <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-300/80 dark:border-emerald-700/80 group-hover/pm:scale-110 transition-transform">
                                    <User className="w-3 h-3" aria-hidden="true" />
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-100 group-hover/pm:text-emerald-700 dark:group-hover/pm:text-emerald-300">
                                    {pmName}
                                  </span>
                                </button>
                              );
                            })()}
                          </td>
                        )}

                        {/* Client / Owner Project Manager Cell */}
                        {visibleColumns.client_pm && (
                          <td className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 text-start">
                            {(() => {
                              const clientPmName =
                                project.client?.contact_person || project.client_representative;
                              const clientCompanyName =
                                project.client?.name_ar ||
                                project.client_name_raw ||
                                (isAr ? 'جهة العميل' : 'Client Organization');
                              const hasClientPm = Boolean(
                                clientPmName &&
                                  clientPmName !== 'غير محدد' &&
                                  clientPmName !== 'Unassigned'
                              );

                              if (!hasClientPm || !clientPmName) {
                                return (
                                  <span className="text-slate-400 dark:text-slate-500 font-normal">
                                    {isAr ? 'غير محدد' : 'Unassigned'}
                                  </span>
                                );
                              }

                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedManager({
                                      name: clientPmName,
                                      type: 'client',
                                      company: clientCompanyName,
                                      role: isAr
                                        ? 'مدير مشروع المالك / ممثل العميل'
                                        : 'Client / Owner Representative',
                                      phone: project.client?.phone || undefined,
                                      email: project.client?.email || undefined,
                                      clientId: project.client_id || project.client?.id || undefined,
                                    });
                                    setIsManagerModalOpen(true);
                                  }}
                                  className="group/clientpm text-start hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-400 transition-colors cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg px-2 py-1 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/60 border border-slate-200/60 dark:border-slate-700/60"
                                  title={
                                    isAr
                                      ? 'عرض بطاقة مدير مشروع المالك والجهة ومشاريعه وتفاصيل التواصل'
                                      : 'View Client PM profile, company, projects and contact details'
                                  }
                                >
                                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 border border-blue-300/80 dark:border-blue-700/80 group-hover/clientpm:scale-110 transition-transform">
                                    <Building2 className="w-3 h-3" aria-hidden="true" />
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-100 group-hover/clientpm:text-blue-700 dark:group-hover/clientpm:text-blue-300">
                                    {clientPmName}
                                  </span>
                                </button>
                              );
                            })()}
                          </td>
                        )}

                        {/* Location Cell */}
                        {visibleColumns.location && (
                          <td className="py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>
                                {(() => {
                                  const parts = [
                                    project.governorate?.name_ar,
                                    project.city?.name_ar,
                                  ].filter(Boolean);
                                  return parts.length > 0
                                    ? parts.join(' - ')
                                    : project.site_location_address || (isAr ? 'غير محدد' : 'N/A');
                                })()}
                              </span>
                            </div>
                          </td>
                        )}

                        {/* Role Cell */}
                        {visibleColumns.role && (
                          <td className="py-3 px-4 text-xs text-center">
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium border border-slate-200/60 dark:border-slate-700/60">
                              {(() => {
                                const role = project.pzone_role;
                                if (role === 'main_contractor') return isAr ? 'مقاول رئيسي' : 'Main Contractor';
                                if (role === 'sub_contractor') return isAr ? 'مقاول باطن' : 'Subcontractor';
                                return role || (isAr ? 'مقاول رئيسي' : 'Main Contractor');
                              })()}
                            </span>
                          </td>
                        )}

                        {/* Status Cell */}
                        {visibleColumns.status && (
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex flex-col items-center gap-1">
                              <StatusBadge status={project.status} lang={activeLang} size="sm" />
                              {(project.status === 'finished' || project.status === 'handing_over') && (
                                (() => {
                                  const hasToc = hasTocCertificate(project);
                                  return hasToc ? (
                                    <span
                                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60"
                                      title={project.toc_letter || (isAr ? 'شهادة استلام ابتدائي معتمدة' : 'TOC Approved')}
                                    >
                                      <Award className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                      <span>{isAr ? 'استلام ابتدائي معتمد' : 'TOC Issued'}</span>
                                    </span>
                                  ) : (
                                    <span
                                      className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300/60 dark:border-rose-800/60 animate-pulse"
                                      title={isAr ? 'المشروع بدون محضر استلام ابتدائي' : 'Missing Taking-Over Certificate'}
                                    >
                                      <AlertTriangle className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
                                      <span>{isAr ? 'بدون استلام ابتدائي ⚠️' : 'No TOC'}</span>
                                    </span>
                                  );
                                })()
                              )}
                            </div>
                          </td>
                        )}

                        {/* Hardcopy Status Cell */}
                        {visibleColumns.hardcopy && (
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {(() => {
                              const hs = (project as any).hardcopy_status;
                              if (hs === 'موجود hard copy معتمد') {
                                return (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40 dark:border-emerald-800/40">
                                    <FileCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                    <span>{isAr ? 'أصل بالشركة' : 'HQ Available'}</span>
                                  </span>
                                );
                              }
                              if (hs === 'موجود hard copy معتمد فى التأمينات') {
                                return (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-300/40 dark:border-blue-800/40">
                                    <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                    <span>{isAr ? 'بالتأمينات' : 'Insurance'}</span>
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300/40 dark:border-rose-800/40">
                                  <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                  <span>{isAr ? 'غير متوفر' : 'Missing'}</span>
                                </span>
                              );
                            })()}
                          </td>
                        )}

                        {/* Progress Cell */}
                        {visibleColumns.completion && (
                          <td className="py-3 px-4 text-center">
                            {(() => {
                              const pct = Math.round(Number(project.completion_pct || 0));
                              const textCls =
                                pct >= 80
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : pct >= 50
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : pct >= 20
                                  ? 'text-orange-600 dark:text-orange-400'
                                  : 'text-rose-600 dark:text-rose-400';
                              const barCls =
                                pct >= 80
                                  ? 'bg-emerald-500'
                                  : pct >= 50
                                  ? 'bg-amber-500'
                                  : pct >= 20
                                  ? 'bg-orange-500'
                                  : 'bg-rose-500';
                              return (
                                <div className="flex flex-col items-center gap-1">
                                  <span className={`text-xs font-black ${textCls}`}>{pct}%</span>
                                  <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${barCls} transition-all`}
                                      style={{ width: `${Math.min(pct, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                        )}

                        {/* Contract Value Cell */}
                        {visibleColumns.value && (
                          <td className="py-3 px-3 font-mono font-semibold text-center text-xs tabular-nums text-slate-800 dark:text-slate-100 min-w-[175px]">
                            <span className="dir-ltr inline-block">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: 'EGP',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(project.total_contract_value || 0)}
                            </span>
                          </td>
                        )}

                        {/* VO Value Cell */}
                        {visibleColumns.vos_value && (
                          <td className="py-3 px-3 font-mono font-semibold text-center text-xs tabular-nums min-w-[175px]">
                            {(() => {
                              const vo = Number(project.vos_value || 0);
                              const hasVo = vo > 0;
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl dir-ltr font-mono text-xs tabular-nums ${
                                    hasVo
                                      ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-800'
                                      : 'text-slate-400 dark:text-slate-500'
                                  }`}
                                >
                                  {hasVo && (
                                    <span className="text-[11px] font-sans font-black text-amber-600 dark:text-amber-400">
                                      +
                                    </span>
                                  )}
                                  {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'EGP',
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }).format(vo)}
                                </span>
                              );
                            })()}
                          </td>
                        )}

                        {/* Water Area Cell */}
                        {visibleColumns.area && (
                          <td className="py-3 px-3 font-mono text-xs text-cyan-600 dark:text-cyan-400 font-bold text-center tabular-nums min-w-[140px]">
                            <span className="dir-ltr inline-block">
                              {new Intl.NumberFormat('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              }).format(Number(project.water_area_m2 || 0))}
                            </span>{' '}
                            {isAr ? 'م²' : 'm²'}
                          </td>
                        )}

                        {/* Actions Cell (Sticky on tablet/desktop with dynamic drop-shadow cue) */}
                        {visibleColumns.actions && (
                          <td
                            className={`py-3 px-4 text-center ${
                              isPinned
                                ? `sm:sticky sm:left-0 sm:z-10 sm:bg-white/95 dark:sm:bg-slate-900/95 group-hover/row:bg-emerald-50/90 dark:group-hover/row:bg-slate-800/90 sm:backdrop-blur-xs transition-all duration-200 ${pinnedActionsShadowClass}`
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <Link
                                href={`/projects/${project.id}`}
                                className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:border-emerald-300 dark:hover:border-emerald-700 bg-slate-50/60 hover:bg-emerald-100/80 dark:bg-slate-800/60 dark:hover:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:shadow-xs hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
                                title={isAr ? 'عرض تفاصيل المشروع' : 'View project details'}
                                aria-label={
                                  isAr
                                    ? `عرض تفاصيل مشروع ${project.project_name}`
                                    : `View details for ${project.project_name_en || project.project_name}`
                                }
                              >
                                <Eye className="w-4 h-4" aria-hidden="true" />
                              </Link>
                              {canEditProject && (
                                <Link
                                  href={`/projects/${project.id}/edit`}
                                  className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:border-amber-300 dark:hover:border-amber-700 bg-slate-50/60 hover:bg-amber-100/80 dark:bg-slate-800/60 dark:hover:bg-amber-950/80 text-amber-600 dark:text-amber-400 transition-all flex items-center justify-center cursor-pointer shadow-2xs hover:shadow-xs hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1"
                                  title={isAr ? 'تعديل بيانات المشروع' : 'Edit project'}
                                  aria-label={
                                    isAr
                                      ? `تعديل مشروع ${project.project_name}`
                                      : `Edit project ${project.project_name_en || project.project_name}`
                                  }
                                >
                                  <Edit className="w-4 h-4" aria-hidden="true" />
                                </Link>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>

              {/* Dynamic Rich Light Visual Summary Footer for Filtered Rows */}
              {projects.length > 0 && (
                <tfoot className="bg-gradient-to-r from-emerald-50/90 via-slate-50 to-blue-50/90 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-slate-800 dark:text-white border-t-4 border-emerald-700 dark:border-emerald-500 shadow-md relative z-10">
                  <tr>
                    <td colSpan={leadingColumnsCount} className="py-4 px-5 text-start">
                      <div className="flex items-center gap-3 justify-start">
                        <div className="p-2.5 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shrink-0">
                          <Calculator className="w-5 h-5" aria-hidden="true" />
                        </div>
                        <div>
                          <div
                            className={`text-xs font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-2 ${
                              isAr ? 'tracking-normal' : 'tracking-wider uppercase'
                            }`}
                          >
                            <span>
                              {isAr ? 'إجمالي نتائج الفلترة والحصر' : 'Summary of Filtered Results'}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] bg-emerald-700 text-white font-black shadow-xs">
                              {projects.length}{' '}
                              {isAr ? 'مشروع' : projects.length === 1 ? 'project' : 'projects'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">
                            {isAr
                              ? 'حساب تلقائي وقيم تجمّعية للمشاريع الظاهرة في الفلتر الحالي'
                              : 'Automatic aggregated totals for all projects matching the current filter'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contract Value Total Cell */}
                    {visibleColumns.value && (
                      <td className="py-3 px-2 text-center min-w-[175px] align-middle">
                        <div
                          className="w-full max-w-full flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 text-white border border-emerald-500 font-mono shadow-xs overflow-hidden"
                          title={`${isAr ? 'إجمالي قيم العقود' : 'Total Contract Value'}: ${new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EGP',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(totalContractValue)}`}
                        >
                          <span className="text-[10px] text-emerald-100 font-sans font-bold flex items-center justify-center gap-1 truncate max-w-full">
                            <TrendingUp className="w-3.5 h-3.5 text-white shrink-0" aria-hidden="true" />{' '}
                            <span className="truncate">{isAr ? 'إجمالي قيم العقود' : 'Total Contract Value'}</span>
                          </span>
                          <span className="text-white tracking-tight text-xs sm:text-sm font-black dir-ltr inline-block truncate max-w-full">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'EGP',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(totalContractValue)}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* VO Value Total Cell */}
                    {visibleColumns.vos_value && (
                      <td className="py-3 px-2 text-center min-w-[175px] align-middle">
                        <div
                          className="w-full max-w-full flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl bg-amber-600 text-white border border-amber-500 font-mono shadow-xs overflow-hidden"
                          title={`${isAr ? 'إجمالي أوامر التغيير' : 'Total VOs Value'}: ${new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'EGP',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(totalVosValue)}`}
                        >
                          <span className="text-[10px] text-amber-100 font-sans font-bold flex items-center justify-center gap-1 truncate max-w-full">
                            <DollarSign className="w-3.5 h-3.5 text-white shrink-0" aria-hidden="true" />{' '}
                            <span className="truncate">{isAr ? 'إجمالي أوامر التغيير' : 'Total VOs Value'}</span>
                          </span>
                          <span className="text-white tracking-tight text-xs sm:text-sm font-black dir-ltr inline-block truncate max-w-full">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: 'EGP',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(totalVosValue)}
                          </span>
                        </div>
                      </td>
                    )}

                    {/* Water Area Total Cell */}
                    {visibleColumns.area && (
                      <td className="py-3 px-2 text-center min-w-[140px] align-middle">
                        <div
                          className="w-full max-w-full flex flex-col items-center justify-center gap-1 px-2.5 py-2 rounded-xl bg-cyan-600 text-white border border-cyan-500 font-mono shadow-xs overflow-hidden"
                          title={`${isAr ? 'إجمالي المسطح المائي' : 'Total Water Area'}: ${new Intl.NumberFormat('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(totalWaterArea)} ${isAr ? 'م²' : 'm²'}`}
                        >
                          <span className="text-[10px] text-cyan-100 font-sans font-bold flex items-center justify-center gap-1 truncate max-w-full">
                            <Droplets className="w-3.5 h-3.5 text-white shrink-0" aria-hidden="true" />{' '}
                            <span className="truncate">{isAr ? 'إجمالي المسطح المائي' : 'Total Water Area'}</span>
                          </span>
                          <span className="text-white tracking-tight text-xs sm:text-sm font-black dir-ltr inline-block truncate max-w-full">
                            {new Intl.NumberFormat('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }).format(totalWaterArea)}{' '}
                            {isAr ? 'م²' : 'm²'}
                          </span>
                        </div>
                      </td>
                    )}

                    {visibleColumns.actions && <td className="py-4 px-4"></td>}
                  </tr>
                </tfoot>
              )}
            </table>
          </ResizableTable>
        </div>
      </div>

      {/* Accessible, Responsive Pagination Bar */}
      {shouldPaginate && totalCount > 0 && (
        <nav
          role="navigation"
          aria-label={
            isAr ? 'تنقل بين صفحات جدول المشاريع' : 'Projects table pagination navigation'
          }
          className="flex flex-col sm:flex-row items-center justify-between gap-3.5 px-5 py-3.5 rounded-b-2xl border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/70 text-xs"
        >
          {/* Summary status and page-size selector */}
          <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-300">
            <div>
              {isAr ? (
                <span>
                  عرض{' '}
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {totalCount === 0 ? 0 : startIndex + 1}
                  </span>{' '}
                  إلى{' '}
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {endIndex}
                  </span>{' '}
                  من إجمالي{' '}
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    {totalCount}
                  </span>{' '}
                  مشروع
                </span>
              ) : (
                <span>
                  Showing{' '}
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {totalCount === 0 ? 0 : startIndex + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {endIndex}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                    {totalCount}
                  </span>{' '}
                  projects
                </span>
              )}
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="dataTablePageSize"
                className="text-slate-500 dark:text-slate-400 text-xs font-semibold"
              >
                {isAr ? 'السطور في الصفحة:' : 'Rows per page:'}
              </label>
              <select
                id="dataTablePageSize"
                value={activePageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                aria-label={isAr ? 'عدد السطور في الصفحة' : 'Rows per page'}
                className="min-h-[44px] px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt === 0 ? (isAr ? 'عرض الكل' : 'All') : opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation Controls */}
          {!isAllSelected && effectiveTotalPages > 1 && (
            <div className="flex items-center gap-1.5">
              {/* First Page Button */}
              <button
                type="button"
                disabled={activePage <= 1}
                onClick={() => handlePageChange(1)}
                aria-label={isAr ? 'الصفحة الأولى' : 'First page'}
                className="min-w-[44px] min-h-[44px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-white dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all flex items-center justify-center shadow-2xs"
              >
                {isAr ? (
                  <ChevronsRight className="w-4 h-4" />
                ) : (
                  <ChevronsLeft className="w-4 h-4" />
                )}
              </button>

              {/* Prev Page Button */}
              <button
                type="button"
                disabled={activePage <= 1}
                onClick={() => handlePageChange(activePage - 1)}
                aria-label={isAr ? 'الصفحة السابقة' : 'Previous page'}
                className="min-w-[44px] min-h-[44px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-white dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all flex items-center justify-center shadow-2xs"
              >
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              {/* Page Number Pills */}
              <div className="flex items-center gap-1 px-1">
                {pageNumbers.map((p, idx) =>
                  p === -1 ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="min-w-[32px] min-h-[44px] flex items-center justify-center text-slate-400 dark:text-slate-500 select-none font-bold"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePageChange(p)}
                      aria-label={isAr ? `صفحة ${p}` : `Page ${p}`}
                      aria-current={p === activePage ? 'page' : undefined}
                      className={`min-w-[44px] min-h-[44px] px-2 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        p === activePage
                          ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              {/* Next Page Button */}
              <button
                type="button"
                disabled={activePage >= effectiveTotalPages}
                onClick={() => handlePageChange(activePage + 1)}
                aria-label={isAr ? 'الصفحة التالية' : 'Next page'}
                className="min-w-[44px] min-h-[44px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-white dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all flex items-center justify-center shadow-2xs"
              >
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>

              {/* Last Page Button */}
              <button
                type="button"
                disabled={activePage >= effectiveTotalPages}
                onClick={() => handlePageChange(effectiveTotalPages)}
                aria-label={isAr ? 'الصفحة الأخيرة' : 'Last page'}
                className="min-w-[44px] min-h-[44px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer hover:bg-white dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all flex items-center justify-center shadow-2xs"
              >
                {isAr ? (
                  <ChevronsLeft className="w-4 h-4" />
                ) : (
                  <ChevronsRight className="w-4 h-4" />
                )}
              </button>
            </div>
          )}
        </nav>
      )}

      {/* Project Manager Profile Detail Modal */}
      <ProjectManagerDetailModal
        isOpen={isManagerModalOpen}
        onClose={() => setIsManagerModalOpen(false)}
        manager={selectedManager}
        projects={allProjects || projects}
        lang={activeLang}
      />

      {/* Universal Custom Report Studio Modal */}
      <UniversalReportModal
        isOpen={isCustomReportModalOpen}
        onClose={() => setIsCustomReportModalOpen(false)}
        data={projects}
        columns={portfolioReportColumns}
        kpis={portfolioReportKpis}
        defaultTitle={isAr ? 'تقرير محفظة المشروعات المعتمد' : 'Official Project Portfolio Report'}
        defaultSubtitle={isAr ? 'P-ZONE FOR SWIMMING POOLS & WATER FEATURES — السجل الشامل لمحفظة العقود' : 'P-ZONE FOR SWIMMING POOLS & WATER FEATURES — Portfolio Overview'}
        defaultDocCode="PZ-PPO-REP-01"
        defaultClassification="confidential"
        lang={activeLang}
      />
    </div>
  );
};

// Aliases for seamless backward compatibility
export const DataTable: React.FC<ProjectsTableProps> = ProjectsTable;
export default ProjectsTable;
