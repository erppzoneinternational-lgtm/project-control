'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  Building2,
  Crown,
  Layers,
  HardHat,
  FolderKanban,
  Search,
  X,
  Plus,
  Edit3,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  UserPlus,
  SlidersHorizontal,
  FileSpreadsheet,
  FileText,
  LayoutGrid,
  List,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Eye,
  Droplets,
  Briefcase,
  Check,
  Save,
} from 'lucide-react';
import { ProjectService } from '@/lib/services/project.service';
import { HrService } from '@/lib/services/hr.service';
import { Client, Project, StakeholderFull } from '@/types';
import {
  ENTITY_CATEGORY_META,
  EntityCategory,
  EntityPortfolioSummary,
  EntityProjectLink,
  NormalizedEntity,
  ProjectRelationshipRole,
  buildEntitiesPortfolio,
  deduplicatePeople,
  doesEntityMatchPartyText,
  normalizeTextForSearch,
} from '@/lib/directory/entityDirectory';
import { getOwnerFromProject } from '@/lib/utils/projectOwner';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePagePermission } from '@/lib/hooks/usePagePermission';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { PriceGate, canViewPrices } from '@/components/planning/PriceGate';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { QuickAddClientModal } from '@/components/ui/QuickAddClientModal';
import { QuickAddStakeholderModal } from '@/components/ui/QuickAddStakeholderModal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BackButton } from '@/components/ui/BackButton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ErrorState } from '@/components/ui/ErrorState';
import { UniversalReportModal } from '@/components/reports/UniversalReportModal';
import { ReportColumn, ReportKpiCard, formatCurrency } from '@/lib/reports/reportEngine';
import { appCache } from '@/lib/cache';
import { toast } from 'sonner';
import {
  StakeholdersUnifiedNavTabs,
  StakeholdersUnifiedTab,
} from './StakeholdersUnifiedNavTabs';

export type CategoryFilterValue = 'all' | EntityCategory;
export type RelationshipFilterValue = 'all' | 'as_owner' | 'as_client' | 'as_consultant';
export type ActivityFilterValue =
  | 'all'
  | 'has_active'
  | 'has_finished'
  | 'has_any_projects'
  | 'no_projects';
export type SortFieldValue =
  | 'total_projects'
  | 'as_owner'
  | 'active_projects'
  | 'contract_value'
  | 'water_area'
  | 'name';
export type HubViewMode = 'table' | 'cards';
export type PageSizeValue = 10 | 25 | 50 | 'all';

export type EntityColumnId =
  | 'sn'
  | 'code'
  | 'name'
  | 'category'
  | 'total_projects'
  | 'as_owner'
  | 'as_client'
  | 'as_consultant'
  | 'active_projects'
  | 'finished_projects'
  | 'project_names'
  | 'contract_value'
  | 'water_area'
  | 'avg_progress'
  | 'governorates'
  | 'pzone_pms'
  | 'representatives'
  | 'contact_info'
  | 'actions';

const COLUMNS_STORAGE_KEY = 'pzone_entities_hub_columns_v1';

interface ColumnDef {
  id: EntityColumnId;
  labelAr: string;
  labelEn: string;
  defaultVisible: boolean;
  financialOnly?: boolean;
}

const ALL_COLUMN_DEFS: ColumnDef[] = [
  { id: 'sn', labelAr: 'م', labelEn: '#', defaultVisible: true },
  { id: 'code', labelAr: 'الكود', labelEn: 'Code', defaultVisible: true },
  { id: 'name', labelAr: 'اسم الجهة / الشركة', labelEn: 'Entity Name', defaultVisible: true },
  { id: 'category', labelAr: 'التصنيف', labelEn: 'Category', defaultVisible: true },
  { id: 'total_projects', labelAr: 'إجمالي المشاريع', labelEn: 'Total Projects', defaultVisible: true },
  { id: 'as_owner', labelAr: 'كمطور / مالك', labelEn: 'As Owner', defaultVisible: true },
  { id: 'as_client', labelAr: 'كعميل تعاقدي', labelEn: 'As Client', defaultVisible: true },
  { id: 'as_consultant', labelAr: 'كاستشاري', labelEn: 'As Consultant', defaultVisible: true },
  { id: 'active_projects', labelAr: 'مشاريع جارية', labelEn: 'Active', defaultVisible: true },
  { id: 'finished_projects', labelAr: 'مشاريع منتهية', labelEn: 'Finished', defaultVisible: false },
  { id: 'project_names', labelAr: 'أبرز المشاريع المرتبطة', labelEn: 'Linked Projects', defaultVisible: true },
  {
    id: 'contract_value',
    labelAr: 'إجمالي العقود (EGP)',
    labelEn: 'Total Contracts (EGP)',
    defaultVisible: true,
    financialOnly: true,
  },
  { id: 'water_area', labelAr: 'المسطحات المائية (م²)', labelEn: 'Water Area (m²)', defaultVisible: false },
  { id: 'avg_progress', labelAr: 'متوسط الإنجاز', labelEn: 'Avg Progress', defaultVisible: true },
  { id: 'governorates', labelAr: 'المحافظات / النطاق', labelEn: 'Governorates', defaultVisible: false },
  { id: 'pzone_pms', labelAr: 'مديرو مشاريع P.Zone', labelEn: 'P.Zone PMs', defaultVisible: true },
  { id: 'representatives', labelAr: 'ممثلو الجهة', labelEn: 'Representatives', defaultVisible: true },
  { id: 'contact_info', labelAr: 'بيانات التواصل', labelEn: 'Contact Info', defaultVisible: false },
  { id: 'actions', labelAr: 'إجراءات', labelEn: 'Actions', defaultVisible: true },
];

function getDefaultVisibleColumns(): Record<EntityColumnId, boolean> {
  const map = {} as Record<EntityColumnId, boolean>;
  for (const col of ALL_COLUMN_DEFS) {
    map[col.id] = col.defaultVisible;
  }
  return map;
}

function parseSafeNumber(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/,/g, '').trim());
  return Number.isFinite(num) ? num : 0;
}

function getProjectTotalValue(p: Project): number {
  const baseVal = parseSafeNumber(p.contract_value_egp ?? p.contract_value);
  const vosVal = parseSafeNumber(p.vos_value);
  return parseSafeNumber(p.total_contract_value) || baseVal + vosVal;
}

function getProjectWaterArea(p: Project): number {
  return parseSafeNumber(p.total_water_area_m2 ?? p.water_area_m2);
}

function getProjectPmName(p: Project): string {
  return (
    p.pm_canonical_name ||
    p.pm_full_name ||
    p.project_manager_name_raw ||
    p.project_manager ||
    '—'
  );
}

function formatRoleBadgesText(roles: ProjectRelationshipRole[], isAr: boolean): string {
  const labels = roles.map((r) => {
    if (r === 'owner') return isAr ? 'مطور / مالك' : 'Owner / Developer';
    if (r === 'client') return isAr ? 'عميل تعاقدي / مقاول عام' : 'Contractual Client';
    return isAr ? 'استشاري إشراف' : 'Consultant';
  });
  return labels.join(' + ');
}

function resolveCounterpartyInfo(
  entity: NormalizedEntity,
  project: Project,
  roles: ProjectRelationshipRole[],
  isAr: boolean
): string {
  const clientText = (
    project.client?.name_ar ||
    project.client_name_ar ||
    project.client_name ||
    project.client_name_raw ||
    ''
  ).trim();
  const ownerText = (project.metadata?.owner_name || getOwnerFromProject(project) || '').trim();
  const consultantText = ((project.metadata?.consultant_firm as string | undefined) || '').trim();

  const parts: string[] = [];

  if (roles.includes('owner')) {
    if (
      clientText &&
      clientText !== 'غير محدد' &&
      !doesEntityMatchPartyText(entity, clientText)
    ) {
      parts.push(
        isAr ? `المقاول العام: ${clientText}` : `Main Contractor: ${clientText}`
      );
    } else {
      parts.push(isAr ? 'تعاقد مباشر مع المالك' : 'Direct Owner Contract');
    }
  }

  if (roles.includes('client') && !roles.includes('owner')) {
    if (
      ownerText &&
      ownerText !== 'غير محدد' &&
      !doesEntityMatchPartyText(entity, ownerText)
    ) {
      parts.push(isAr ? `المالك/المطور: ${ownerText}` : `Owner: ${ownerText}`);
    }
  }

  if (roles.includes('consultant')) {
    if (ownerText && ownerText !== 'غير محدد' && !doesEntityMatchPartyText(entity, ownerText)) {
      parts.push(isAr ? `المالك: ${ownerText}` : `Owner: ${ownerText}`);
    }
    if (
      clientText &&
      clientText !== 'غير محدد' &&
      !doesEntityMatchPartyText(entity, clientText) &&
      clientText !== ownerText
    ) {
      parts.push(isAr ? `العميل: ${clientText}` : `Client: ${clientText}`);
    }
  } else if (
    consultantText &&
    consultantText !== 'غير محدد' &&
    !doesEntityMatchPartyText(entity, consultantText)
  ) {
    parts.push(isAr ? `الاستشاري: ${consultantText}` : `Consultant: ${consultantText}`);
  }

  return parts.length > 0 ? parts.join(' • ') : '—';
}

interface FlattenedMatrixRow {
  entityCode: string;
  entityNameAr: string;
  entityNameEn: string;
  entityCategoryLabel: string;
  projectCode: string;
  projectName: string;
  entityRoleInProject: string;
  counterparty: string;
  pzonePm: string;
  governorate: string;
  statusLabel: string;
  completionPct: number;
  waterAreaM2: number;
  contractValue: number;
}

interface ActiveReportState {
  key: string;
  title: string;
  subtitle: string;
  docCodePrefix: string;
  columns: ReportColumn<any>[];
  data: any[];
  kpis: ReportKpiCard[];
}

export interface EntitiesPortfolioHubProps {
  embedded?: boolean;
  onTabChange?: (tab: StakeholdersUnifiedTab) => void;
}

export const EntitiesPortfolioHub: React.FC<EntitiesPortfolioHubProps> = ({
  embedded = false,
  onTabChange,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { canView, canEdit, isLoading: permLoading } = usePagePermission('/clients');
  const { roles, isAdmin } = useUserRoles();
  const allowFinancials = useMemo(() => canViewPrices(roles, isAdmin), [roles, isAdmin]);

  // Core Datasets
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stakeholders, setStakeholders] = useState<StakeholderFull[]>([]);
  const [totalPeopleCount, setTotalPeopleCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Sorting
  const [searchInput, setSearchInput] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilterValue>('all');
  const [relationshipFilter, setRelationshipFilter] = useState<RelationshipFilterValue>('all');
  const [activityFilter, setActivityFilter] = useState<ActivityFilterValue>('all');
  const [govFilter, setGovFilter] = useState<string>('all');
  const [pmFilter, setPmFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortFieldValue>('total_projects');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // View Mode, Columns & Pagination
  const [viewMode, setViewMode] = useState<HubViewMode>('table');
  const [visibleColumns, setVisibleColumns] = useState<Record<EntityColumnId, boolean>>(() =>
    getDefaultVisibleColumns()
  );
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState<boolean>(false);
  const columnPickerRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState<PageSizeValue>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals
  const [drillDownEntityId, setDrillDownEntityId] = useState<string | null>(null);
  const [drillRoleFilter, setDrillRoleFilter] = useState<'all' | ProjectRelationshipRole>('all');
  const [isQuickAddEntityOpen, setIsQuickAddEntityOpen] = useState<boolean>(false);
  const [isQuickAddRepOpen, setIsQuickAddRepOpen] = useState<boolean>(false);
  const [editingEntity, setEditingEntity] = useState<NormalizedEntity | null>(null);
  const [savingEdit, setSavingEdit] = useState<boolean>(false);
  const [editForm, setEditForm] = useState({
    name_ar: '',
    name_en: '',
    code: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
  });
  const [activeReport, setActiveReport] = useState<ActiveReportState | null>(null);

  // Hydrate column preferences from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(COLUMNS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<EntityColumnId, boolean>>;
        setVisibleColumns((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore corrupt storage
    }
  }, []);

  const persistColumns = useCallback((next: Record<EntityColumnId, boolean>) => {
    setVisibleColumns(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Guard financial sort when user lacks price access
  useEffect(() => {
    if (!allowFinancials && sortBy === 'contract_value') {
      setSortBy('total_projects');
    }
  }, [allowFinancials, sortBy]);

  // Close column picker on outside click
  useEffect(() => {
    if (!isColumnPickerOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
        setIsColumnPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [isColumnPickerOpen]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [clientsList, projectsList, stkList, hrList] = await Promise.all([
        ProjectService.getClients(),
        ProjectService.getProjects(),
        ProjectService.getStakeholdersDirectory({ kind: 'all' }).catch(
          () => [] as StakeholderFull[]
        ),
        HrService.getEmployees().catch(() => [] as StakeholderFull[]),
      ]);

      const safeClients = clientsList || [];
      const safeProjects = projectsList || [];
      const safeStk = stkList || [];

      const localEmailSet = new Set(
        safeStk.map((s) => s.email?.trim().toLowerCase()).filter(Boolean)
      );
      const localCodeSet = new Set(
        safeStk.map((s) => s.employee_code?.trim()).filter(Boolean)
      );
      const extraHr = (hrList || []).filter((hr) => {
        const emailMatch = hr.email && localEmailSet.has(hr.email.trim().toLowerCase());
        const codeMatch = hr.employee_code && localCodeSet.has(hr.employee_code.trim());
        return !emailMatch && !codeMatch;
      });
      const mergedPeople = [...safeStk, ...extraHr];

      setClients(safeClients);
      setProjects(safeProjects);
      setStakeholders(safeStk);
      setTotalPeopleCount(deduplicatePeople(mergedPeople).length);
    } catch (err: unknown) {
      setError(
        (err as { message?: string } | null)?.message ||
          (isAr
            ? 'تعذر تحميل محفظة الجهات والمشاريع'
            : 'Failed to load entities & projects portfolio')
      );
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global Escape handler for accessible modals
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (isColumnPickerOpen) {
        setIsColumnPickerOpen(false);
        return;
      }
      if (editingEntity && !savingEdit) {
        setEditingEntity(null);
        return;
      }
      if (drillDownEntityId && !isQuickAddRepOpen && !activeReport) {
        setDrillDownEntityId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isColumnPickerOpen, editingEntity, savingEdit, drillDownEntityId, isQuickAddRepOpen, activeReport]);

  // 360° Portfolio Summaries
  const summaries = useMemo(
    () => buildEntitiesPortfolio(clients, projects, stakeholders),
    [clients, projects, stakeholders]
  );

  // Drill-down target summary (always stays reactive after adding a rep or editing entity)
  const activeDrillSummary = useMemo(
    () => summaries.find((s) => s.entity.id === drillDownEntityId) || null,
    [summaries, drillDownEntityId]
  );

  // Dynamic Governorate & PM Filter Options
  const governorateOptions: SelectOption[] = useMemo(() => {
    const set = new Set<string>();
    summaries.forEach((s) => s.governorates.forEach((g) => set.add(g)));
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
    return [
      { value: 'all', label: isAr ? 'كل المحافظات والنطاقات' : 'All Governorates' },
      ...sorted.map((g) => ({ value: g, label: g })),
    ];
  }, [summaries, isAr]);

  const pmOptions: SelectOption[] = useMemo(() => {
    const set = new Set<string>();
    summaries.forEach((s) => s.pzoneManagers.forEach((pm) => set.add(pm)));
    const sorted = Array.from(set).sort((a, b) => a.localeCompare(b, 'ar'));
    return [
      { value: 'all', label: isAr ? 'كل مديري مشاريع P.Zone' : 'All P.Zone PMs' },
      ...sorted.map((pm) => ({ value: pm, label: pm })),
    ];
  }, [summaries, isAr]);

  // Global KPI Metrics
  const kpiStats = useMemo(() => {
    const totalEntities = summaries.length;
    const ownersCount = summaries.filter((s) => s.entity.category === 'owner_developer').length;
    const asOwnerAssignments = summaries.reduce((acc, s) => acc + s.asOwnerCount, 0);

    const contractorsCount = summaries.filter((s) => s.entity.category === 'main_contractor').length;
    const asClientAssignments = summaries.reduce((acc, s) => acc + s.asClientCount, 0);

    const consultantsCount = summaries.filter((s) => s.entity.category === 'consultant').length;
    const asConsultantAssignments = summaries.reduce((acc, s) => acc + s.asConsultantCount, 0);

    const activeEntitiesCount = summaries.filter((s) => s.activeProjectsCount > 0).length;
    const uniqueLinkedProjectIds = new Set<string>();
    const uniqueActiveProjectIds = new Set<string>();
    summaries.forEach((s) => {
      s.linkedProjects.forEach(({ project }) => {
        uniqueLinkedProjectIds.add(project.id);
        if (project.status === 'working' || project.status === 'handing_over') {
          uniqueActiveProjectIds.add(project.id);
        }
      });
    });

    return {
      totalEntities,
      uniqueLinkedProjects: uniqueLinkedProjectIds.size,
      ownersCount,
      asOwnerAssignments,
      contractorsCount,
      asClientAssignments,
      consultantsCount,
      asConsultantAssignments,
      activeEntitiesCount,
      uniqueActiveProjects: uniqueActiveProjectIds.size,
    };
  }, [summaries]);

  // Filtering + Sorting Pipeline
  const filteredSummaries = useMemo(() => {
    const normQuery = normalizeTextForSearch(debouncedSearch);

    const filtered = summaries.filter((s) => {
      // 1. Category filter
      if (categoryFilter !== 'all' && s.entity.category !== categoryFilter) {
        return false;
      }

      // 2. Project Relationship filter
      if (relationshipFilter === 'as_owner' && s.asOwnerCount === 0) return false;
      if (relationshipFilter === 'as_client' && s.asClientCount === 0) return false;
      if (relationshipFilter === 'as_consultant' && s.asConsultantCount === 0) return false;

      // 3. Activity status filter
      if (activityFilter === 'has_active' && s.activeProjectsCount === 0) return false;
      if (activityFilter === 'has_finished' && s.finishedProjectsCount === 0) return false;
      if (activityFilter === 'has_any_projects' && s.totalProjectsCount === 0) return false;
      if (activityFilter === 'no_projects' && s.totalProjectsCount > 0) return false;

      // 4. Governorate filter
      if (govFilter !== 'all' && !s.governorates.includes(govFilter)) return false;

      // 5. P.Zone PM filter
      if (pmFilter !== 'all' && !s.pzoneManagers.includes(pmFilter)) return false;

      // 6. Search (Entity AR/EN, code, contact person, reps, OR linked project name/code)
      if (normQuery) {
        const inEntity = s.entity.searchIndex.includes(normQuery);
        const inProjects = s.linkedProjects.some(({ project }) => {
          const projHay = normalizeTextForSearch(
            [
              project.project_name,
              project.project_name_ar,
              project.name_ar,
              project.name_en,
              project.project_code,
              project.code,
            ]
              .filter(Boolean)
              .join(' ')
          );
          return projHay.includes(normQuery);
        });
        const inPeople = s.linkedPeople.some((person) =>
          normalizeTextForSearch(
            `${person.name_ar || ''} ${person.name_en || ''} ${person.phone || ''}`
          ).includes(normQuery)
        );
        if (!inEntity && !inProjects && !inPeople) return false;
      }

      return true;
    });

    const dirMultiplier = sortDir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case 'total_projects':
          cmp = a.totalProjectsCount - b.totalProjectsCount;
          break;
        case 'as_owner':
          cmp = a.asOwnerCount - b.asOwnerCount;
          break;
        case 'active_projects':
          cmp = a.activeProjectsCount - b.activeProjectsCount;
          break;
        case 'contract_value':
          cmp = allowFinancials ? a.totalContractValue - b.totalContractValue : 0;
          break;
        case 'water_area':
          cmp = a.totalWaterAreaM2 - b.totalWaterAreaM2;
          break;
        case 'name':
          cmp = (isAr ? a.entity.displayNameAr : a.entity.displayNameEn).localeCompare(
            isAr ? b.entity.displayNameAr : b.entity.displayNameEn,
            isAr ? 'ar' : 'en'
          );
          break;
      }
      if (cmp !== 0) return cmp * dirMultiplier;
      return a.entity.displayNameAr.localeCompare(b.entity.displayNameAr, 'ar');
    });
  }, [
    summaries,
    debouncedSearch,
    categoryFilter,
    relationshipFilter,
    activityFilter,
    govFilter,
    pmFilter,
    sortBy,
    sortDir,
    allowFinancials,
    isAr,
  ]);

  // Reset pagination to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    categoryFilter,
    relationshipFilter,
    activityFilter,
    govFilter,
    pmFilter,
    pageSize,
  ]);

  const hasActiveFilters =
    Boolean(searchInput.trim()) ||
    categoryFilter !== 'all' ||
    relationshipFilter !== 'all' ||
    activityFilter !== 'all' ||
    govFilter !== 'all' ||
    pmFilter !== 'all';

  const resetAllFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setCategoryFilter('all');
    setRelationshipFilter('all');
    setActivityFilter('all');
    setGovFilter('all');
    setPmFilter('all');
    setSortBy('total_projects');
    setSortDir('desc');
  };

  // Pagination Slice
  const totalFiltered = filteredSummaries.length;
  const totalPages =
    pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedSummaries = useMemo(() => {
    if (pageSize === 'all') return filteredSummaries;
    const start = (safePage - 1) * pageSize;
    return filteredSummaries.slice(start, start + pageSize);
  }, [filteredSummaries, pageSize, safePage]);

  // Available column defs respecting RBAC financial gate
  const availableColumnDefs = useMemo(
    () => ALL_COLUMN_DEFS.filter((c) => !c.financialOnly || allowFinancials),
    [allowFinancials]
  );

  const isColShown = useCallback(
    (id: EntityColumnId): boolean => {
      if (id === 'contract_value' && !allowFinancials) return false;
      return Boolean(visibleColumns[id]);
    },
    [visibleColumns, allowFinancials]
  );

  // Drill-down filtered projects
  const drillFilteredProjects: EntityProjectLink[] = useMemo(() => {
    if (!activeDrillSummary) return [];
    if (drillRoleFilter === 'all') return activeDrillSummary.linkedProjects;
    return activeDrillSummary.linkedProjects.filter((lp) =>
      lp.roles.includes(drillRoleFilter)
    );
  }, [activeDrillSummary, drillRoleFilter]);

  const openDrillDown = (summary: EntityPortfolioSummary) => {
    setDrillRoleFilter('all');
    setDrillDownEntityId(summary.entity.id);
  };

  const openEditEntityModal = (entity: NormalizedEntity, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingEntity(entity);
    setEditForm({
      name_ar: entity.name_ar || entity.displayNameAr || '',
      name_en: entity.name_en || '',
      code: entity.code || entity.canonicalCode || '',
      contact_person: entity.contact_person || '',
      phone: entity.phone || '',
      email: entity.email || '',
      address: entity.address || '',
    });
  };

  const handleSaveEditEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntity) return;
    if (!editForm.name_ar.trim()) {
      toast.error(isAr ? 'الاسم العربي للجهة مطلوب' : 'Arabic entity name is required');
      return;
    }
    setSavingEdit(true);
    try {
      await ProjectService.updateClient(editingEntity.id, {
        name_ar: editForm.name_ar.trim(),
        name_en: editForm.name_en.trim() || undefined,
        code: editForm.code.trim() || undefined,
        contact_person: editForm.contact_person.trim() || undefined,
        phone: editForm.phone.trim() || undefined,
        email: editForm.email.trim() || undefined,
        address: editForm.address.trim() || undefined,
      });
      appCache.invalidate('ref:clients');
      toast.success(isAr ? 'تم تحديث بيانات الجهة بنجاح' : 'Entity updated successfully');
      setEditingEntity(null);
      await loadData();
    } catch (err: unknown) {
      toast.error(
        (err as { message?: string } | null)?.message ||
          (isAr ? 'حدث خطأ أثناء تحديث بيانات الجهة' : 'Error updating entity')
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // ── Report Builders (UniversalReportModal) ──
  const openEntitiesSummaryReport = () => {
    const cols: ReportColumn<EntityPortfolioSummary>[] = [
      {
        id: 'code',
        labelAr: 'كود الجهة',
        labelEn: 'Code',
        categoryAr: 'الهوية والتصنيف',
        getValue: (s) => s.entity.canonicalCode || '—',
      },
      {
        id: 'name_ar',
        labelAr: 'اسم الجهة (عربي)',
        labelEn: 'Entity Name (AR)',
        categoryAr: 'الهوية والتصنيف',
        getValue: (s) => s.entity.displayNameAr,
      },
      {
        id: 'name_en',
        labelAr: 'اسم الجهة (إنجليزي)',
        labelEn: 'Entity Name (EN)',
        categoryAr: 'الهوية والتصنيف',
        defaultVisible: false,
        getValue: (s) => s.entity.displayNameEn || '—',
      },
      {
        id: 'category',
        labelAr: 'التصنيف',
        labelEn: 'Category',
        categoryAr: 'الهوية والتصنيف',
        getValue: (s) => ENTITY_CATEGORY_META[s.entity.category].labelAr,
      },
      {
        id: 'total_projects',
        labelAr: 'إجمالي المشاريع',
        labelEn: 'Total Projects',
        categoryAr: 'محفظة المشاريع',
        isNumeric: true,
        align: 'center',
        getValue: (s) => s.totalProjectsCount,
      },
      {
        id: 'as_owner',
        labelAr: 'كمطور / مالك',
        labelEn: 'As Owner',
        categoryAr: 'محفظة المشاريع',
        isNumeric: true,
        align: 'center',
        getValue: (s) => s.asOwnerCount,
      },
      {
        id: 'as_client',
        labelAr: 'كعميل تعاقدي',
        labelEn: 'As Client',
        categoryAr: 'محفظة المشاريع',
        isNumeric: true,
        align: 'center',
        getValue: (s) => s.asClientCount,
      },
      {
        id: 'as_consultant',
        labelAr: 'كاستشاري هندسي',
        labelEn: 'As Consultant',
        categoryAr: 'محفظة المشاريع',
        isNumeric: true,
        align: 'center',
        getValue: (s) => s.asConsultantCount,
      },
      {
        id: 'active_projects',
        labelAr: 'مشاريع جارية',
        labelEn: 'Active Projects',
        categoryAr: 'محفظة المشاريع',
        isNumeric: true,
        align: 'center',
        getValue: (s) => s.activeProjectsCount,
      },
      {
        id: 'project_names',
        labelAr: 'المشاريع المرتبطة',
        labelEn: 'Linked Projects',
        categoryAr: 'محفظة المشاريع',
        getValue: (s) =>
          s.linkedProjects
            .map(({ project }) => project.project_name_ar || project.project_name || project.code)
            .filter(Boolean)
            .join(' ، ') || '—',
      },
      ...(allowFinancials
        ? ([
            {
              id: 'contract_value',
              labelAr: 'إجمالي قيمة العقود (EGP)',
              labelEn: 'Total Contract Value (EGP)',
              categoryAr: 'المؤشرات المالية والكميات',
              isCurrency: true,
              isNumeric: true,
              align: 'end',
              getValue: (s: EntityPortfolioSummary) => s.totalContractValue,
              formatPrint: (s: EntityPortfolioSummary) => formatCurrency(s.totalContractValue),
            },
          ] as ReportColumn<EntityPortfolioSummary>[])
        : []),
      {
        id: 'water_area',
        labelAr: 'المسطحات المائية (م²)',
        labelEn: 'Water Area (m²)',
        categoryAr: 'المؤشرات المالية والكميات',
        isNumeric: true,
        defaultVisible: false,
        align: 'center',
        getValue: (s) => Math.round(s.totalWaterAreaM2),
      },
      {
        id: 'avg_progress',
        labelAr: 'متوسط الإنجاز (%)',
        labelEn: 'Avg Progress (%)',
        categoryAr: 'المؤشرات المالية والكميات',
        isNumeric: true,
        align: 'center',
        getValue: (s) => `${s.avgCompletionPct}%`,
      },
      {
        id: 'pzone_pms',
        labelAr: 'مديرو مشاريع P.Zone',
        labelEn: 'P.Zone PMs',
        categoryAr: 'التشغيل والتواصل',
        getValue: (s) => s.pzoneManagers.join(' ، ') || '—',
      },
      {
        id: 'representatives',
        labelAr: 'ممثلو الجهة المسجلون',
        labelEn: 'Representatives',
        categoryAr: 'التشغيل والتواصل',
        getValue: (s) =>
          s.linkedPeople.map((p) => p.name_ar || p.name_en).filter(Boolean).join(' ، ') ||
          s.entity.contact_person ||
          '—',
      },
      {
        id: 'phone',
        labelAr: 'الهاتف',
        labelEn: 'Phone',
        categoryAr: 'التشغيل والتواصل',
        defaultVisible: false,
        getValue: (s) => s.entity.phone || s.linkedPeople[0]?.phone || '—',
      },
    ];

    const totalVal = filteredSummaries.reduce((acc, s) => acc + s.totalContractValue, 0);
    const kpis: ReportKpiCard[] = [
      {
        id: 'entities',
        label: 'إجمالي الجهات بالتقرير',
        value: filteredSummaries.length,
        tone: 'emerald',
      },
      {
        id: 'owners',
        label: 'الملاك والمطورون',
        value: filteredSummaries.filter((s) => s.entity.category === 'owner_developer').length,
        tone: 'amber',
      },
      {
        id: 'contractors',
        label: 'المقاولون والعملاء',
        value: filteredSummaries.filter((s) => s.entity.category === 'main_contractor').length,
        tone: 'blue',
      },
      {
        id: 'active',
        label: 'جهات بمشاريع جارية',
        value: filteredSummaries.filter((s) => s.activeProjectsCount > 0).length,
        tone: 'purple',
      },
      ...(allowFinancials
        ? [
            {
              id: 'contracts',
              label: 'إجمالي المحفظة التعاقدية',
              value: formatCurrency(totalVal),
              tone: 'emerald' as const,
            },
          ]
        : []),
    ];

    setActiveReport({
      key: `entities-summary-${Date.now()}`,
      title: 'تقرير ملخص محفظة الجهات والمطورين والعملاء',
      subtitle: `إجمالي الجهات المطابقة للفلترة: ${filteredSummaries.length} جهة`,
      docCodePrefix: 'PZ-ENT-SUM',
      columns: cols,
      data: filteredSummaries,
      kpis,
    });
  };

  const openEntityProjectMatrixReport = () => {
    const rows: FlattenedMatrixRow[] = [];
    for (const s of filteredSummaries) {
      if (s.linkedProjects.length === 0) continue;
      const catLabel = ENTITY_CATEGORY_META[s.entity.category].shortAr;
      for (const { project, roles: pRoles } of s.linkedProjects) {
        const statusArMap: Record<string, string> = {
          working: 'قيد التنفيذ',
          handing_over: 'قيد التسليم',
          finished: 'منتهي',
          tender: 'مرحلة العطاء',
          not_started: 'لم يبدأ',
          on_hold: 'موقوف مؤقتاً',
          cancelled: 'ملغي',
        };
        rows.push({
          entityCode: s.entity.canonicalCode || '—',
          entityNameAr: s.entity.displayNameAr,
          entityNameEn: s.entity.displayNameEn || '—',
          entityCategoryLabel: catLabel,
          projectCode: project.project_code || project.code || '—',
          projectName:
            project.project_name_ar || project.project_name || project.name_ar || '—',
          entityRoleInProject: formatRoleBadgesText(pRoles, true),
          counterparty: resolveCounterpartyInfo(s.entity, project, pRoles, true),
          pzonePm: getProjectPmName(project),
          governorate: project.governorate?.name_ar || project.location || '—',
          statusLabel: statusArMap[project.status] || project.status,
          completionPct: Math.round(parseSafeNumber(project.completion_pct)),
          waterAreaM2: Math.round(getProjectWaterArea(project)),
          contractValue: getProjectTotalValue(project),
        });
      }
    }

    const cols: ReportColumn<FlattenedMatrixRow>[] = [
      {
        id: 'entity_name',
        labelAr: 'الجهة / المالك / العميل',
        labelEn: 'Entity Name',
        categoryAr: 'بيانات الجهة',
        getValue: (r) => r.entityNameAr,
      },
      {
        id: 'entity_cat',
        labelAr: 'تصنيف الجهة',
        labelEn: 'Entity Category',
        categoryAr: 'بيانات الجهة',
        getValue: (r) => r.entityCategoryLabel,
      },
      {
        id: 'role_in_project',
        labelAr: 'دور الجهة بالمشروع',
        labelEn: 'Role in Project',
        categoryAr: 'بيانات الجهة',
        getValue: (r) => r.entityRoleInProject,
      },
      {
        id: 'project_code',
        labelAr: 'كود المشروع',
        labelEn: 'Project Code',
        categoryAr: 'بيانات المشروع',
        getValue: (r) => r.projectCode,
      },
      {
        id: 'project_name',
        labelAr: 'اسم المشروع',
        labelEn: 'Project Name',
        categoryAr: 'بيانات المشروع',
        getValue: (r) => r.projectName,
      },
      {
        id: 'counterparty',
        labelAr: 'الطرف المقابل / هيكل التعاقد',
        labelEn: 'Counterparty',
        categoryAr: 'بيانات المشروع',
        getValue: (r) => r.counterparty,
      },
      {
        id: 'pzone_pm',
        labelAr: 'مدير المشروع (P.Zone)',
        labelEn: 'P.Zone PM',
        categoryAr: 'التشغيل والإنجاز',
        getValue: (r) => r.pzonePm,
      },
      {
        id: 'governorate',
        labelAr: 'المحافظة / الموقع',
        labelEn: 'Location',
        categoryAr: 'التشغيل والإنجاز',
        defaultVisible: false,
        getValue: (r) => r.governorate,
      },
      {
        id: 'status',
        labelAr: 'حالة المشروع',
        labelEn: 'Status',
        categoryAr: 'التشغيل والإنجاز',
        align: 'center',
        getValue: (r) => r.statusLabel,
      },
      {
        id: 'progress',
        labelAr: 'نسبة الإنجاز',
        labelEn: 'Progress %',
        categoryAr: 'التشغيل والإنجاز',
        isNumeric: true,
        align: 'center',
        getValue: (r) => `${r.completionPct}%`,
      },
      {
        id: 'water_area',
        labelAr: 'المسطح المائي (م²)',
        labelEn: 'Water Area (m²)',
        categoryAr: 'الكميات والماليات',
        isNumeric: true,
        defaultVisible: false,
        align: 'center',
        getValue: (r) => r.waterAreaM2,
      },
      ...(allowFinancials
        ? ([
            {
              id: 'contract_value',
              labelAr: 'قيمة العقد الإجمالية (EGP)',
              labelEn: 'Contract Value (EGP)',
              categoryAr: 'الكميات والماليات',
              isCurrency: true,
              isNumeric: true,
              align: 'end',
              getValue: (r: FlattenedMatrixRow) => r.contractValue,
              formatPrint: (r: FlattenedMatrixRow) => formatCurrency(r.contractValue),
            },
          ] as ReportColumn<FlattenedMatrixRow>[])
        : []),
    ];

    const entitiesWithProjects = filteredSummaries.filter((s) => s.totalProjectsCount > 0).length;
    const kpis: ReportKpiCard[] = [
      {
        id: 'entities_with_proj',
        label: 'عدد الجهات ذات المشاريع',
        value: entitiesWithProjects,
        tone: 'emerald',
      },
      {
        id: 'total_links',
        label: 'إجمالي ارتباطات المشاريع',
        value: rows.length,
        tone: 'blue',
      },
      ...(allowFinancials
        ? [
            {
              id: 'sum_val',
              label: 'إجمالي القيم التعاقدية بالجدول',
              value: formatCurrency(rows.reduce((a, b) => a + b.contractValue, 0)),
              tone: 'amber' as const,
            },
          ]
        : []),
    ];

    setActiveReport({
      key: `entities-matrix-${Date.now()}`,
      title: 'تقرير مصفوفة الملاك والمطورين والعملاء والمشاريع المرتبطة',
      subtitle: `سجل تفصيلي يربط ${entitiesWithProjects} جهة بـ ${rows.length} سجل مشروع وسابقة أعمال`,
      docCodePrefix: 'PZ-ENT-MTX',
      columns: cols,
      data: rows,
      kpis,
    });
  };

  const openSingleEntityReport = (summary: EntityPortfolioSummary) => {
    const statusArMap: Record<string, string> = {
      working: 'قيد التنفيذ',
      handing_over: 'قيد التسليم',
      finished: 'منتهي',
      tender: 'مرحلة العطاء',
      not_started: 'لم يبدأ',
      on_hold: 'موقوف مؤقتاً',
      cancelled: 'ملغي',
    };

    const cols: ReportColumn<EntityProjectLink>[] = [
      {
        id: 'code',
        labelAr: 'كود المشروع',
        labelEn: 'Project Code',
        categoryAr: 'بيانات المشروع',
        getValue: (lp) => lp.project.project_code || lp.project.code || '—',
      },
      {
        id: 'name',
        labelAr: 'اسم المشروع',
        labelEn: 'Project Name',
        categoryAr: 'بيانات المشروع',
        getValue: (lp) =>
          lp.project.project_name_ar || lp.project.project_name || lp.project.name_ar || '—',
      },
      {
        id: 'role',
        labelAr: 'دور الجهة بالمشروع',
        labelEn: 'Entity Role',
        categoryAr: 'العلاقة التعاقدية',
        getValue: (lp) => formatRoleBadgesText(lp.roles, true),
      },
      {
        id: 'counterparty',
        labelAr: 'الطرف المقابل / هيكل التعاقد',
        labelEn: 'Counterparty',
        categoryAr: 'العلاقة التعاقدية',
        getValue: (lp) => resolveCounterpartyInfo(summary.entity, lp.project, lp.roles, true),
      },
      {
        id: 'pm',
        labelAr: 'مدير المشروع (P.Zone)',
        labelEn: 'P.Zone PM',
        categoryAr: 'التنفيذ والإنجاز',
        getValue: (lp) => getProjectPmName(lp.project),
      },
      {
        id: 'status',
        labelAr: 'الحالة',
        labelEn: 'Status',
        categoryAr: 'التنفيذ والإنجاز',
        align: 'center',
        getValue: (lp) => statusArMap[lp.project.status] || lp.project.status,
      },
      {
        id: 'progress',
        labelAr: 'الإنجاز (%)',
        labelEn: 'Progress (%)',
        categoryAr: 'التنفيذ والإنجاز',
        isNumeric: true,
        align: 'center',
        getValue: (lp) => `${Math.round(parseSafeNumber(lp.project.completion_pct))}%`,
      },
      {
        id: 'water_area',
        labelAr: 'المسطح المائي (م²)',
        labelEn: 'Water Area (m²)',
        categoryAr: 'الكميات والماليات',
        isNumeric: true,
        align: 'center',
        getValue: (lp) => Math.round(getProjectWaterArea(lp.project)),
      },
      ...(allowFinancials
        ? ([
            {
              id: 'contract_value',
              labelAr: 'قيمة العقد (EGP)',
              labelEn: 'Contract Value (EGP)',
              categoryAr: 'الكميات والماليات',
              isCurrency: true,
              isNumeric: true,
              align: 'end',
              getValue: (lp: EntityProjectLink) => getProjectTotalValue(lp.project),
              formatPrint: (lp: EntityProjectLink) =>
                formatCurrency(getProjectTotalValue(lp.project)),
            },
          ] as ReportColumn<EntityProjectLink>[])
        : []),
    ];

    const kpis: ReportKpiCard[] = [
      {
        id: 'total',
        label: 'إجمالي المشاريع',
        value: summary.totalProjectsCount,
        tone: 'emerald',
      },
      {
        id: 'as_owner',
        label: 'كمطور / مالك',
        value: summary.asOwnerCount,
        tone: 'amber',
      },
      {
        id: 'as_client',
        label: 'كعميل تعاقدي',
        value: summary.asClientCount,
        tone: 'blue',
      },
      {
        id: 'active',
        label: 'مشاريع جارية',
        value: summary.activeProjectsCount,
        tone: 'purple',
      },
      ...(allowFinancials
        ? [
            {
              id: 'contracts',
              label: 'إجمالي العقود',
              value: formatCurrency(summary.totalContractValue),
              tone: 'emerald' as const,
            },
          ]
        : []),
    ];

    setActiveReport({
      key: `single-entity-${summary.entity.id}-${Date.now()}`,
      title: `بيان سابقة الأعمال ومشاريع الجهة: ${summary.entity.displayNameAr}`,
      subtitle: `${ENTITY_CATEGORY_META[summary.entity.category].labelAr} • الكود: ${
        summary.entity.canonicalCode || '—'
      }`,
      docCodePrefix: 'PZ-ENT-PRJ',
      columns: cols,
      data: drillFilteredProjects,
      kpis,
    });
  };

  if (!permLoading && !canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {isAr ? 'غير مصرح بالدخول' : 'Access Denied'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          {isAr
            ? 'هذه الصفحة مخصصة للإدارة ومديري المشاريع والتخطيط والعقود فقط.'
            : 'This page is restricted to authorized management, project, planning, and contract roles.'}
        </p>
        <BackButton label={isAr ? 'الرجوع' : 'Back'} />
      </div>
    );
  }

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      className={`w-full space-y-4 ${embedded ? '' : 'p-2 md:p-4'}`}
    >
      {/* Breadcrumbs & Top Switcher (when standalone) */}
      {!embedded && (
        <>
          <Breadcrumbs
            items={[
              { label: isAr ? 'إدارة المشاريع' : 'Projects Management', href: '/projects' },
              {
                label: isAr
                  ? 'محفظة الجهات والمطورين والعملاء'
                  : 'Entities, Developers & Clients Hub',
              },
            ]}
          />

          <StakeholdersUnifiedNavTabs
            activeTab="entities"
            entitiesCount={summaries.length}
            peopleCount={totalPeopleCount > 0 ? totalPeopleCount : undefined}
            onTabChange={onTabChange}
          />
        </>
      )}

      {/* Executive Header & Global Report / Add Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-5 py-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          {!embedded && <BackButton label={isAr ? 'الرجوع' : 'Back'} />}
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" aria-hidden="true" />
            </div>
            <span>
              {isAr
                ? 'محفظة الجهات والمطورين والعملاء وسابقة الأعمال'
                : 'Entities, Developers & Clients Intelligence Hub'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAr
              ? 'رؤية شاملة 360° تربط كل مطور عقاري ومقاول عام ومكتب استشاري بكافة مشاريع P.Zone وممثلي الجهة'
              : '360° portfolio linking every Developer, Main Contractor, and Consultant to P.Zone projects and representatives'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Global Report 1: Entities Summary */}
          <button
            type="button"
            onClick={openEntitiesSummaryReport}
            disabled={loading || filteredSummaries.length === 0}
            className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{isAr ? 'تقرير ملخص الجهات' : 'Entities Summary Report'}</span>
          </button>

          {/* Global Report 2: Owners & Projects Matrix */}
          <button
            type="button"
            onClick={openEntityProjectMatrixReport}
            disabled={loading || filteredSummaries.every((s) => s.totalProjectsCount === 0)}
            className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              {isAr ? 'تقرير مصفوفة الملاك والمشاريع' : 'Owners & Projects Matrix'}
            </span>
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={() => setIsQuickAddEntityOpen(true)}
              aria-haspopup="dialog"
              className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>{isAr ? 'إضافة جهة جديدة' : 'Add New Entity'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <ErrorState
          title={isAr ? 'تعذر تحميل البيانات' : 'Failed to load data'}
          message={error}
          onRetry={loadData}
        />
      )}

      {/* 5 Clickable Executive KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {/* 1. Total Entities */}
        <button
          type="button"
          onClick={() => {
            setCategoryFilter('all');
            setRelationshipFilter('all');
            setActivityFilter('all');
          }}
          className={`p-4 rounded-2xl border text-start transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            categoryFilter === 'all' &&
            relationshipFilter === 'all' &&
            activityFilter === 'all'
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500/40 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'إجمالي الجهات المعتمدة' : 'Total Entities'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {kpiStats.totalEntities}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? `${kpiStats.uniqueLinkedProjects} مشروع مرتبط بالمحفظة`
              : `${kpiStats.uniqueLinkedProjects} linked projects`}
          </div>
        </button>

        {/* 2. Owners / Developers */}
        <button
          type="button"
          onClick={() =>
            setCategoryFilter((prev) =>
              prev === 'owner_developer' ? 'all' : 'owner_developer'
            )
          }
          className={`p-4 rounded-2xl border text-start transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
            categoryFilter === 'owner_developer'
              ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500/40 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'الملاك والمطورون' : 'Owners & Developers'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {kpiStats.ownersCount}
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5 font-semibold">
            {isAr
              ? `${kpiStats.asOwnerAssignments} مشروع بدور مالك/مطور`
              : `${kpiStats.asOwnerAssignments} owner project links`}
          </div>
        </button>

        {/* 3. Main Contractors / Clients */}
        <button
          type="button"
          onClick={() =>
            setCategoryFilter((prev) =>
              prev === 'main_contractor' ? 'all' : 'main_contractor'
            )
          }
          className={`p-4 rounded-2xl border text-start transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
            categoryFilter === 'main_contractor'
              ? 'bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-500/40 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'المقاولون والعملاء' : 'Main Contractors & Clients'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <HardHat className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {kpiStats.contractorsCount}
          </div>
          <div className="text-[11px] text-cyan-700 dark:text-cyan-400 mt-0.5 font-semibold">
            {isAr
              ? `${kpiStats.asClientAssignments} عقد بدور عميل تعاقدي`
              : `${kpiStats.asClientAssignments} client contracts`}
          </div>
        </button>

        {/* 4. Engineering Consultants */}
        <button
          type="button"
          onClick={() =>
            setCategoryFilter((prev) => (prev === 'consultant' ? 'all' : 'consultant'))
          }
          className={`p-4 rounded-2xl border text-start transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
            categoryFilter === 'consultant'
              ? 'bg-purple-50/90 dark:bg-purple-950/40 border-purple-500/40 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'الاستشاريون الهندسيون' : 'Engineering Consultants'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {kpiStats.consultantsCount}
          </div>
          <div className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5 font-semibold">
            {isAr
              ? `${kpiStats.asConsultantAssignments} مشروع إشراف هندسي`
              : `${kpiStats.asConsultantAssignments} consultant supervisions`}
          </div>
        </button>

        {/* 5. Entities with Active Projects */}
        <button
          type="button"
          onClick={() =>
            setActivityFilter((prev) => (prev === 'has_active' ? 'all' : 'has_active'))
          }
          className={`col-span-2 md:col-span-1 p-4 rounded-2xl border text-start transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
            activityFilter === 'has_active'
              ? 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-500/40 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              {isAr ? 'جهات بمشاريع جارية' : 'Active Project Entities'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono tabular-nums">
            {kpiStats.activeEntitiesCount}
          </div>
          <div className="text-[11px] text-sky-700 dark:text-sky-400 mt-0.5 font-semibold">
            {isAr
              ? `${kpiStats.uniqueActiveProjects} مشروع قيد التنفيذ والتسليم`
              : `${kpiStats.uniqueActiveProjects} active sites now`}
          </div>
        </button>
      </div>

      {/* Projects-Style Multi-Dimensional Filter & Controls Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs space-y-3">
        {/* Row 1: Search + View Mode + Column Customizer */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Debounced Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                isAr
                  ? 'ابحث باسم الشركة (عربي/إنجليزي)، الكود، اسم المشروع المرتبط، أو ممثل الجهة...'
                  : 'Search by entity name, code, linked project name, or representative...'
              }
              aria-label={isAr ? 'البحث في محفظة الجهات' : 'Search entities portfolio'}
              className="w-full min-h-[40px] ps-10 pe-9 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/60 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  setDebouncedSearch('');
                }}
                aria-label={isAr ? 'مسح البحث' : 'Clear search'}
                className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Sort By Selector */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1">
              <span className="text-[11px] font-bold text-slate-400 px-1">
                {isAr ? 'ترتيب:' : 'Sort:'}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortFieldValue)}
                aria-label={isAr ? 'ترتيب الجهات حسب' : 'Sort entities by'}
                className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer py-1"
              >
                <option value="total_projects" className="bg-white dark:bg-slate-900">
                  {isAr ? 'إجمالي المشاريع' : 'Total Projects'}
                </option>
                <option value="as_owner" className="bg-white dark:bg-slate-900">
                  {isAr ? 'مشاريع كمطور/مالك' : 'As Owner Count'}
                </option>
                <option value="active_projects" className="bg-white dark:bg-slate-900">
                  {isAr ? 'المشاريع الجارية' : 'Active Projects'}
                </option>
                {allowFinancials && (
                  <option value="contract_value" className="bg-white dark:bg-slate-900">
                    {isAr ? 'إجمالي قيمة العقود' : 'Contract Value'}
                  </option>
                )}
                <option value="water_area" className="bg-white dark:bg-slate-900">
                  {isAr ? 'المسطحات المائية (م²)' : 'Water Area'}
                </option>
                <option value="name" className="bg-white dark:bg-slate-900">
                  {isAr ? 'الاسم الأبجدي' : 'Alphabetical'}
                </option>
              </select>
              <button
                type="button"
                onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                title={
                  sortDir === 'desc'
                    ? isAr
                      ? 'تنازلي (اضغط للتصاعدي)'
                      : 'Descending'
                    : isAr
                    ? 'تصاعدي (اضغط للتنازلي)'
                    : 'Ascending'
                }
                aria-label={isAr ? 'عكس اتجاه الترتيب' : 'Toggle sort direction'}
                className="p-1.5 rounded-lg hover:bg-slate-200/70 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer transition-colors"
              >
                {sortDir === 'desc' ? (
                  <ArrowDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
              </button>
            </div>

            {/* Column Customizer Popover (Table Mode) */}
            {viewMode === 'table' && (
              <div className="relative" ref={columnPickerRef}>
                <button
                  type="button"
                  onClick={() => setIsColumnPickerOpen((o) => !o)}
                  aria-expanded={isColumnPickerOpen}
                  aria-haspopup="dialog"
                  className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'تخصيص الأعمدة' : 'Columns'}</span>
                </button>

                {isColumnPickerOpen && (
                  <div
                    role="dialog"
                    aria-label={isAr ? 'تخصيص أعمدة الجدول' : 'Customize table columns'}
                    className="absolute end-0 top-full mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-3 z-40 space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {isAr ? 'الأعمدة المعروضة' : 'Visible Columns'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const allOn = {} as Record<EntityColumnId, boolean>;
                            ALL_COLUMN_DEFS.forEach((c) => {
                              allOn[c.id] = true;
                            });
                            persistColumns(allOn);
                          }}
                          className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          {isAr ? 'إظهار كل الأعمدة' : 'Show All'}
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <button
                          type="button"
                          onClick={() => persistColumns(getDefaultVisibleColumns())}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:underline cursor-pointer"
                        >
                          {isAr ? 'إعادة للافتراضي' : 'Reset Default'}
                        </button>
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-1 pe-1">
                      {availableColumnDefs.map((col) => {
                        const checked = Boolean(visibleColumns[col.id]);
                        return (
                          <label
                            key={col.id}
                            className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/70 cursor-pointer text-xs"
                          >
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              {isAr ? col.labelAr : col.labelEn}
                            </span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() =>
                                persistColumns({
                                  ...visibleColumns,
                                  [col.id]: !checked,
                                })
                              }
                              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View Mode Toggle: Table (default) vs Cards */}
            <div
              role="tablist"
              aria-label={isAr ? 'نمط العرض' : 'View mode'}
              className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800"
            >
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'table'}
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>{isAr ? 'جدول' : 'Table'}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === 'cards'}
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{isAr ? 'بطاقات' : 'Cards'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Category, Project Relationship, Activity Status, Governorate, P.Zone PM, Reset */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilterValue)}
              aria-label={isAr ? 'تصنيف الجهة' : 'Entity Category'}
              className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">{isAr ? 'التصنيف: كل الجهات' : 'Category: All'}</option>
              <option value="owner_developer">
                {isAr ? 'مطور عقاري / مالك (DEV)' : 'Owner / Developer'}
              </option>
              <option value="main_contractor">
                {isAr ? 'مقاول عام / عميل تعاقدي (CLI)' : 'Main Contractor / Client'}
              </option>
              <option value="consultant">
                {isAr ? 'مكتب استشاري هندسي (CON)' : 'Engineering Consultant'}
              </option>
              <option value="subcontractor_vendor">
                {isAr ? 'مقاول باطن / مورد (SUB)' : 'Subcontractor / Vendor'}
              </option>
            </select>
          </div>

          {/* Project Relationship Filter */}
          <div>
            <select
              value={relationshipFilter}
              onChange={(e) =>
                setRelationshipFilter(e.target.value as RelationshipFilterValue)
              }
              aria-label={isAr ? 'العلاقة بالمشاريع' : 'Project Relationship'}
              className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">
                {isAr ? 'دور الجهة بالمشاريع: الكل' : 'Project Role: All'}
              </option>
              <option value="as_owner">
                {isAr ? 'عملنا معه كمطور / مالك للمشروع' : 'Acted as Project Owner'}
              </option>
              <option value="as_client">
                {isAr ? 'تعاقدنا معه كعميل مباشر / مقاول عام' : 'Acted as Contractual Client'}
              </option>
              <option value="as_consultant">
                {isAr ? 'أشرف علينا كمكتب استشاري' : 'Acted as Supervision Consultant'}
              </option>
            </select>
          </div>

          {/* Activity Status Filter */}
          <div>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value as ActivityFilterValue)}
              aria-label={isAr ? 'حالة النشاط والمشاريع' : 'Activity Status'}
              className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">{isAr ? 'حالة المشاريع: الكل' : 'Activity: All'}</option>
              <option value="has_active">
                {isAr ? 'لديه مشاريع جارية حالياً' : 'Has Active Projects'}
              </option>
              <option value="has_finished">
                {isAr ? 'لديه مشاريع منتهية (سابقة أعمال)' : 'Has Finished Projects'}
              </option>
              <option value="has_any_projects">
                {isAr ? 'مرتبط بمشروع واحد أو أكثر' : 'Has >= 1 Linked Project'}
              </option>
              <option value="no_projects">
                {isAr ? 'مسجل بالدليل بدون مشاريع حالية' : 'No Linked Projects Yet'}
              </option>
            </select>
          </div>

          {/* Governorate CustomSelect */}
          <div>
            <CustomSelect
              options={governorateOptions}
              value={govFilter}
              onChange={(val) => setGovFilter(val || 'all')}
              placeholder={isAr ? 'المحافظة / النطاق' : 'Governorate'}
              searchPlaceholder={isAr ? 'ابحث عن محافظة...' : 'Search governorate...'}
            />
          </div>

          {/* P.Zone PM CustomSelect */}
          <div>
            <CustomSelect
              options={pmOptions}
              value={pmFilter}
              onChange={(val) => setPmFilter(val || 'all')}
              placeholder={isAr ? 'مدير المشروع (P.Zone)' : 'P.Zone PM'}
              searchPlaceholder={isAr ? 'ابحث باسم مدير المشروع...' : 'Search PM...'}
            />
          </div>
        </div>

        {/* Active Filter Indicator & Reset Strip */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {isAr ? 'نتائج التصفية:' : 'Filtered results:'}{' '}
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                {filteredSummaries.length}
              </strong>{' '}
              {isAr ? `من أصل ${summaries.length} جهة` : `of ${summaries.length} entities`}
            </span>

            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area: Loading / Empty / Table / Cards */}
      {loading ? (
        <div
          role="status"
          aria-busy="true"
          className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-3"
        >
          <Loader2 className="w-7 h-7 text-emerald-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {isAr
              ? 'جاري تحليل محفظة الجهات وربط المشاريع وسابقة الأعمال...'
              : 'Analyzing entities portfolio and project relationships...'}
          </p>
        </div>
      ) : filteredSummaries.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 py-16 px-4 text-center space-y-3">
          <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {isAr ? 'لا توجد جهات مطابقة لمعايير التصفية الحالية' : 'No matching entities found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isAr
              ? 'جرب تعديل مصطلح البحث أو إعادة ضبط الفلاتر لعرض كافة الشركاء'
              : 'Try adjusting your search query or resetting filters'}
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'إعادة ضبط كافة الفلاتر' : 'Reset All Filters'}</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* ═══ PROJECTS-STYLE DYNAMIC TABLE VIEW ═══ */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table
              aria-label={
                isAr ? 'جدول محفظة الجهات والمطورين والعملاء' : 'Entities Portfolio Table'
              }
              className="w-full text-xs border-collapse min-w-[920px]"
            >
              <thead className="bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                <tr>
                  {isColShown('sn') && (
                    <th className="px-3 py-3 text-center w-10">#</th>
                  )}
                  {isColShown('code') && (
                    <th className="px-3 py-3 text-start">{isAr ? 'الكود' : 'Code'}</th>
                  )}
                  {isColShown('name') && (
                    <th className="px-3.5 py-3 text-start">
                      {isAr ? 'الجهة / الشركة' : 'Entity / Company'}
                    </th>
                  )}
                  {isColShown('category') && (
                    <th className="px-3 py-3 text-start">{isAr ? 'التصنيف' : 'Category'}</th>
                  )}
                  {isColShown('total_projects') && (
                    <th className="px-2.5 py-3 text-center">
                      {isAr ? 'المشاريع' : 'Projects'}
                    </th>
                  )}
                  {isColShown('as_owner') && (
                    <th className="px-2.5 py-3 text-center">
                      {isAr ? 'كمالك/مطور' : 'Owner'}
                    </th>
                  )}
                  {isColShown('as_client') && (
                    <th className="px-2.5 py-3 text-center">
                      {isAr ? 'كعميل' : 'Client'}
                    </th>
                  )}
                  {isColShown('as_consultant') && (
                    <th className="px-2.5 py-3 text-center">
                      {isAr ? 'كاستشاري' : 'Consultant'}
                    </th>
                  )}
                  {isColShown('active_projects') && (
                    <th className="px-2.5 py-3 text-center">
                      {isAr ? 'جارية' : 'Active'}
                    </th>
                  )}
                  {isColShown('finished_projects') && (
                    <th className="px-2.5 py-3 text-center">
                      {isAr ? 'منتهية' : 'Finished'}
                    </th>
                  )}
                  {isColShown('project_names') && (
                    <th className="px-3 py-3 text-start">
                      {isAr ? 'أبرز المشاريع المرتبطة' : 'Linked Projects'}
                    </th>
                  )}
                  {isColShown('contract_value') && allowFinancials && (
                    <th className="px-3 py-3 text-end">
                      {isAr ? 'إجمالي العقود' : 'Total Contracts'}
                    </th>
                  )}
                  {isColShown('water_area') && (
                    <th className="px-3 py-3 text-center">
                      {isAr ? 'المسطحات (م²)' : 'Water m²'}
                    </th>
                  )}
                  {isColShown('avg_progress') && (
                    <th className="px-3 py-3 text-center">
                      {isAr ? 'متوسط الإنجاز' : 'Avg Progress'}
                    </th>
                  )}
                  {isColShown('governorates') && (
                    <th className="px-3 py-3 text-start">
                      {isAr ? 'المحافظات' : 'Governorates'}
                    </th>
                  )}
                  {isColShown('pzone_pms') && (
                    <th className="px-3 py-3 text-start">
                      {isAr ? 'مديرو مشاريع P.Zone' : 'P.Zone PMs'}
                    </th>
                  )}
                  {isColShown('representatives') && (
                    <th className="px-3 py-3 text-start">
                      {isAr ? 'ممثلو الجهة' : 'Representatives'}
                    </th>
                  )}
                  {isColShown('contact_info') && (
                    <th className="px-3 py-3 text-start">
                      {isAr ? 'التواصل' : 'Contact'}
                    </th>
                  )}
                  {isColShown('actions') && (
                    <th className="px-3 py-3 text-center">
                      {isAr ? 'إجراءات' : 'Actions'}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {paginatedSummaries.map((s, idx) => {
                  const rowNum =
                    pageSize === 'all' ? idx + 1 : (safePage - 1) * pageSize + idx + 1;
                  const catMeta = ENTITY_CATEGORY_META[s.entity.category];
                  const primaryName = isAr ? s.entity.displayNameAr : s.entity.displayNameEn;
                  const secondaryName = isAr ? s.entity.name_en : s.entity.name_ar;

                  return (
                    <tr
                      key={s.entity.id}
                      onClick={() => openDrillDown(s)}
                      className="hover:bg-emerald-50/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      {isColShown('sn') && (
                        <td className="px-3 py-3 text-center font-mono text-slate-400 tabular-nums">
                          {rowNum}
                        </td>
                      )}
                      {isColShown('code') && (
                        <td className="px-3 py-3 font-mono font-bold text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {s.entity.canonicalCode || '—'}
                        </td>
                      )}
                      {isColShown('name') && (
                        <td className="px-3.5 py-3">
                          <div className="flex items-center gap-2.5 min-w-[200px]">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-[11px] flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700">
                              {s.entity.initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-black text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors truncate max-w-[240px]">
                                {primaryName}
                              </div>
                              {secondaryName && secondaryName !== primaryName && (
                                <div className="text-[10px] text-slate-400 truncate max-w-[240px]">
                                  {secondaryName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      )}
                      {isColShown('category') && (
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${catMeta.badgeCls}`}
                          >
                            {isAr ? catMeta.shortAr : catMeta.shortEn}
                          </span>
                        </td>
                      )}
                      {isColShown('total_projects') && (
                        <td className="px-2.5 py-3 text-center">
                          <span
                            className={`inline-flex items-center justify-center min-w-[26px] h-6 px-2 rounded-full font-mono font-black text-xs tabular-nums ${
                              s.totalProjectsCount > 0
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                            }`}
                          >
                            {s.totalProjectsCount}
                          </span>
                        </td>
                      )}
                      {isColShown('as_owner') && (
                        <td className="px-2.5 py-3 text-center font-mono tabular-nums">
                          {s.asOwnerCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/70">
                              {s.asOwnerCount}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">—</span>
                          )}
                        </td>
                      )}
                      {isColShown('as_client') && (
                        <td className="px-2.5 py-3 text-center font-mono tabular-nums">
                          {s.asClientCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 font-bold border border-cyan-200 dark:border-cyan-800/70">
                              {s.asClientCount}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">—</span>
                          )}
                        </td>
                      )}
                      {isColShown('as_consultant') && (
                        <td className="px-2.5 py-3 text-center font-mono tabular-nums">
                          {s.asConsultantCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-800/70">
                              {s.asConsultantCount}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">—</span>
                          )}
                        </td>
                      )}
                      {isColShown('active_projects') && (
                        <td className="px-2.5 py-3 text-center font-mono tabular-nums">
                          {s.activeProjectsCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 font-bold border border-sky-300 dark:border-sky-800">
                              {s.activeProjectsCount}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">0</span>
                          )}
                        </td>
                      )}
                      {isColShown('finished_projects') && (
                        <td className="px-2.5 py-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          {s.finishedProjectsCount || '—'}
                        </td>
                      )}
                      {isColShown('project_names') && (
                        <td
                          className="px-3 py-3 max-w-[240px]"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {s.linkedProjects.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1">
                              {s.linkedProjects.slice(0, 2).map(({ project }) => (
                                <Link
                                  key={project.id}
                                  href={`/projects/${project.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 text-[10px] font-bold border border-slate-200/80 dark:border-slate-700 truncate max-w-[165px] transition-colors"
                                  title={
                                    project.project_name_ar ||
                                    project.project_name ||
                                    project.code
                                  }
                                >
                                  <span className="truncate">
                                    {project.project_name_ar ||
                                      project.project_name ||
                                      project.project_code}
                                  </span>
                                </Link>
                              ))}
                              {s.linkedProjects.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => openDrillDown(s)}
                                  className="px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-500/20 cursor-pointer"
                                >
                                  +{s.linkedProjects.length - 2}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">—</span>
                          )}
                        </td>
                      )}
                      {isColShown('contract_value') && allowFinancials && (
                        <td className="px-3 py-3 text-end font-mono font-bold whitespace-nowrap text-slate-800 dark:text-slate-200">
                          {s.totalContractValue > 0 ? (
                            <PriceGate>{formatCurrency(s.totalContractValue)}</PriceGate>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">—</span>
                          )}
                        </td>
                      )}
                      {isColShown('water_area') && (
                        <td className="px-3 py-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-300">
                          {s.totalWaterAreaM2 > 0
                            ? `${Math.round(s.totalWaterAreaM2).toLocaleString('en-US')} m²`
                            : '—'}
                        </td>
                      )}
                      {isColShown('avg_progress') && (
                        <td className="px-3 py-3 text-center">
                          {s.totalProjectsCount > 0 ? (
                            <div className="inline-flex items-center gap-1.5 min-w-[76px]">
                              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden min-w-[40px]">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{
                                    width: `${Math.min(100, Math.max(0, s.avgCompletionPct))}%`,
                                  }}
                                />
                              </div>
                              <span className="font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300 tabular-nums">
                                {s.avgCompletionPct}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">—</span>
                          )}
                        </td>
                      )}
                      {isColShown('governorates') && (
                        <td className="px-3 py-3 max-w-[150px] truncate text-slate-600 dark:text-slate-400">
                          {s.governorates.join(' ، ') || '—'}
                        </td>
                      )}
                      {isColShown('pzone_pms') && (
                        <td className="px-3 py-3 max-w-[170px] truncate text-slate-600 dark:text-slate-300 font-medium">
                          {s.pzoneManagers.join(' ، ') || '—'}
                        </td>
                      )}
                      {isColShown('representatives') && (
                        <td className="px-3 py-3 max-w-[180px]">
                          {s.linkedPeople.length > 0 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold">
                                {s.linkedPeople.length}
                              </span>
                              <span className="truncate text-slate-600 dark:text-slate-300">
                                {s.linkedPeople[0].name_ar || s.linkedPeople[0].name_en}
                              </span>
                            </div>
                          ) : s.entity.contact_person ? (
                            <span className="truncate text-slate-500 dark:text-slate-400">
                              {s.entity.contact_person}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">—</span>
                          )}
                        </td>
                      )}
                      {isColShown('contact_info') && (
                        <td
                          className="px-3 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {s.entity.phone ? (
                            <a
                              href={`tel:${s.entity.phone}`}
                              className="hover:text-emerald-600 underline-offset-2 hover:underline"
                              dir="ltr"
                            >
                              {s.entity.phone}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                      )}
                      {isColShown('actions') && (
                        <td
                          className="px-3 py-3 text-center whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openDrillDown(s)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/70 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] border border-emerald-500/20 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{isAr ? 'عرض المشاريع' : 'Portfolio'}</span>
                            </button>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={(e) => openEditEntityModal(s.entity, e)}
                                title={isAr ? 'تعديل بيانات الجهة' : 'Edit entity'}
                                aria-label={isAr ? 'تعديل بيانات الجهة' : 'Edit entity'}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap text-slate-500 dark:text-slate-400">
              <span>
                {isAr ? 'عرض' : 'Showing'}{' '}
                <strong className="text-slate-900 dark:text-white font-mono">
                  {paginatedSummaries.length}
                </strong>{' '}
                {isAr ? `من أصل ${totalFiltered} جهة` : `of ${totalFiltered} entities`}
              </span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <label className="inline-flex items-center gap-1.5">
                <span>{isAr ? 'عدد الصفوف:' : 'Rows:'}</span>
                <select
                  value={String(pageSize)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPageSize(val === 'all' ? 'all' : (Number(val) as 10 | 25 | 50));
                  }}
                  aria-label={isAr ? 'عدد الصفوف بالصفحة' : 'Rows per page'}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="all">{isAr ? 'الكل' : 'All'}</option>
                </select>
              </label>
            </div>

            {pageSize !== 'all' && totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  {isAr ? 'السابق' : 'Prev'}
                </button>
                <span className="px-2.5 font-mono font-bold text-slate-700 dark:text-slate-300">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
                >
                  {isAr ? 'التالي' : 'Next'}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ═══ CARDS VIEW ═══ */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedSummaries.map((s) => {
            const catMeta = ENTITY_CATEGORY_META[s.entity.category];
            const primaryName = isAr ? s.entity.displayNameAr : s.entity.displayNameEn;
            return (
              <div
                key={s.entity.id}
                onClick={() => openDrillDown(s)}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 shadow-xs hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                        {s.entity.initials}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                          {primaryName}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${catMeta.badgeCls}`}
                          >
                            {isAr ? catMeta.shortAr : catMeta.shortEn}
                          </span>
                          {s.entity.canonicalCode && (
                            <span className="font-mono text-[10px] font-bold text-slate-400">
                              #{s.entity.canonicalCode}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={(e) => openEditEntityModal(s.entity, e)}
                        aria-label={isAr ? 'تعديل الجهة' : 'Edit entity'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Role breakdown pills */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                    <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50">
                      <div className="font-mono font-black text-sm text-amber-800 dark:text-amber-300">
                        {s.asOwnerCount}
                      </div>
                      <div className="text-[10px] font-bold text-amber-700/80 dark:text-amber-400/80">
                        {isAr ? 'كمطور/مالك' : 'As Owner'}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200/60 dark:border-cyan-900/50">
                      <div className="font-mono font-black text-sm text-cyan-800 dark:text-cyan-300">
                        {s.asClientCount}
                      </div>
                      <div className="text-[10px] font-bold text-cyan-700/80 dark:text-cyan-400/80">
                        {isAr ? 'كعميل تعاقدي' : 'As Client'}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/50">
                      <div className="font-mono font-black text-sm text-purple-800 dark:text-purple-300">
                        {s.asConsultantCount}
                      </div>
                      <div className="text-[10px] font-bold text-purple-700/80 dark:text-purple-400/80">
                        {isAr ? 'كاستشاري' : 'Consultant'}
                      </div>
                    </div>
                  </div>

                  {allowFinancials && s.totalContractValue > 0 && (
                    <div className="px-3 py-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-600 dark:text-slate-400">
                        {isAr ? 'إجمالي العقود:' : 'Total Contracts:'}
                      </span>
                      <span className="font-mono font-black text-emerald-800 dark:text-emerald-300">
                        <PriceGate>{formatCurrency(s.totalContractValue)}</PriceGate>
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 dark:text-slate-400">
                    {isAr
                      ? `${s.totalProjectsCount} مشاريع (${s.activeProjectsCount} جاري)`
                      : `${s.totalProjectsCount} projects (${s.activeProjectsCount} active)`}
                  </span>
                  <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400">
                    <span>{isAr ? 'ملف المشاريع' : 'View Portfolio'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ INTERACTIVE ENTITY PORTFOLIO DRILL-DOWN MODAL ═══ */}
      {activeDrillSummary && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="entity-drilldown-title"
          dir={isAr ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setDrillDownEntityId(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                  {activeDrillSummary.entity.initials}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2
                      id="entity-drilldown-title"
                      className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate"
                    >
                      {isAr
                        ? `ملف مشاريع الجهة وسابقة الأعمال — ${activeDrillSummary.entity.displayNameAr}`
                        : `Entity Portfolio & Track Record — ${activeDrillSummary.entity.displayNameEn}`}
                    </h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        ENTITY_CATEGORY_META[activeDrillSummary.entity.category].badgeCls
                      }`}
                    >
                      {isAr
                        ? ENTITY_CATEGORY_META[activeDrillSummary.entity.category].labelAr
                        : ENTITY_CATEGORY_META[activeDrillSummary.entity.category].labelEn}
                    </span>
                    {activeDrillSummary.entity.canonicalCode && (
                      <span className="font-mono text-xs font-bold text-slate-500 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {activeDrillSummary.entity.canonicalCode}
                      </span>
                    )}
                  </div>

                  {/* Contact metadata strip */}
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {activeDrillSummary.entity.contact_person && (
                      <span className="inline-flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{activeDrillSummary.entity.contact_person}</span>
                      </span>
                    )}
                    {activeDrillSummary.entity.phone && (
                      <a
                        href={`tel:${activeDrillSummary.entity.phone}`}
                        dir="ltr"
                        className="inline-flex items-center gap-1 font-mono hover:text-emerald-600"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{activeDrillSummary.entity.phone}</span>
                      </a>
                    )}
                    {activeDrillSummary.entity.email && (
                      <a
                        href={`mailto:${activeDrillSummary.entity.email}`}
                        dir="ltr"
                        className="inline-flex items-center gap-1 font-mono hover:text-emerald-600"
                      >
                        <Mail className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{activeDrillSummary.entity.email}</span>
                      </a>
                    )}
                    {activeDrillSummary.entity.address && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{activeDrillSummary.entity.address}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => openSingleEntityReport(activeDrillSummary)}
                  disabled={activeDrillSummary.linkedProjects.length === 0}
                  className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span>
                    {isAr
                      ? 'استخراج تقرير مشاريع هذه الجهة (PDF / Excel / CSV)'
                      : 'Export Entity Projects (PDF / Excel / CSV)'}
                  </span>
                </button>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => openEditEntityModal(activeDrillSummary.entity)}
                    className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تعديل' : 'Edit'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setDrillDownEntityId(null)}
                  aria-label={isAr ? 'إغلاق النافذة' : 'Close dialog'}
                  className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* KPI Strip */}
              <div
                className={`grid grid-cols-2 sm:grid-cols-3 ${
                  allowFinancials ? 'lg:grid-cols-6' : 'lg:grid-cols-5'
                } gap-2.5`}
              >
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-500">
                    {isAr ? 'إجمالي المشاريع' : 'Total Projects'}
                  </div>
                  <div className="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">
                    {activeDrillSummary.totalProjectsCount}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60">
                  <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                    {isAr ? 'كمطور / مالك' : 'As Owner'}
                  </div>
                  <div className="text-xl font-black font-mono text-amber-900 dark:text-amber-200 mt-1">
                    {activeDrillSummary.asOwnerCount}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/60">
                  <div className="text-[11px] font-bold text-cyan-800 dark:text-cyan-300">
                    {isAr ? 'كعميل تعاقدي' : 'As Client'}
                  </div>
                  <div className="text-xl font-black font-mono text-cyan-900 dark:text-cyan-200 mt-1">
                    {activeDrillSummary.asClientCount}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60">
                  <div className="text-[11px] font-bold text-purple-800 dark:text-purple-300">
                    {isAr ? 'كاستشاري' : 'As Consultant'}
                  </div>
                  <div className="text-xl font-black font-mono text-purple-900 dark:text-purple-200 mt-1">
                    {activeDrillSummary.asConsultantCount}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/60">
                  <div className="text-[11px] font-bold text-sky-800 dark:text-sky-300">
                    {isAr ? 'مشاريع جارية' : 'Active Sites'}
                  </div>
                  <div className="text-xl font-black font-mono text-sky-900 dark:text-sky-200 mt-1">
                    {activeDrillSummary.activeProjectsCount}
                  </div>
                </div>
                {allowFinancials && (
                  <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                    <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                      {isAr ? 'إجمالي العقود' : 'Total Contracts'}
                    </div>
                    <div className="text-sm font-black font-mono text-emerald-900 dark:text-emerald-200 mt-1.5 truncate">
                      <PriceGate>
                        {formatCurrency(activeDrillSummary.totalContractValue)}
                      </PriceGate>
                    </div>
                  </div>
                )}
              </div>

              {/* Role Sub-Filter Pills + Projects Table */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <FolderKanban className="w-4 h-4 text-emerald-600" />
                    <span>
                      {isAr
                        ? 'جدول المشاريع وسابقة الأعمال التفصيلي'
                        : 'Detailed Linked Projects'}
                    </span>
                  </h3>

                  <div
                    role="tablist"
                    aria-label={isAr ? 'تصفية حسب دور الجهة' : 'Filter by entity role'}
                    className="flex flex-wrap items-center gap-1.5"
                  >
                    {(
                      [
                        {
                          id: 'all',
                          labelAr: 'الكل',
                          labelEn: 'All',
                          count: activeDrillSummary.totalProjectsCount,
                        },
                        {
                          id: 'owner',
                          labelAr: 'كمطور / مالك',
                          labelEn: 'As Owner / Developer',
                          count: activeDrillSummary.asOwnerCount,
                        },
                        {
                          id: 'client',
                          labelAr: 'كعميل تعاقدي',
                          labelEn: 'As Contractual Client',
                          count: activeDrillSummary.asClientCount,
                        },
                        {
                          id: 'consultant',
                          labelAr: 'كاستشاري',
                          labelEn: 'As Consultant',
                          count: activeDrillSummary.asConsultantCount,
                        },
                      ] as const
                    ).map((pill) => {
                      const active = drillRoleFilter === pill.id;
                      return (
                        <button
                          key={pill.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => setDrillRoleFilter(pill.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                            active
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          <span>{isAr ? pill.labelAr : pill.labelEn}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded-full font-mono text-[10px] ${
                              active
                                ? 'bg-emerald-800/60 text-white'
                                : 'bg-white dark:bg-slate-900 text-slate-500'
                            }`}
                          >
                            {pill.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {drillFilteredProjects.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                    {isAr
                      ? 'لا توجد مشاريع مسجلة لهذه الجهة تحت هذا الدور حالياً'
                      : 'No projects linked under this role'}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border-collapse min-w-[820px]">
                        <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                          <tr>
                            <th className="px-3 py-2.5 text-start">
                              {isAr ? 'كود المشروع' : 'Code'}
                            </th>
                            <th className="px-3 py-2.5 text-start">
                              {isAr ? 'اسم المشروع' : 'Project Name'}
                            </th>
                            <th className="px-3 py-2.5 text-start">
                              {isAr ? 'دور الجهة بالمشروع' : 'Entity Role'}
                            </th>
                            <th className="px-3 py-2.5 text-start">
                              {isAr ? 'الطرف المقابل / هيكل التعاقد' : 'Counterparty'}
                            </th>
                            <th className="px-3 py-2.5 text-start">
                              {isAr ? 'مدير المشروع (P.Zone)' : 'P.Zone PM'}
                            </th>
                            <th className="px-3 py-2.5 text-center">
                              {isAr ? 'الحالة' : 'Status'}
                            </th>
                            <th className="px-3 py-2.5 text-center">
                              {isAr ? 'الإنجاز' : 'Progress'}
                            </th>
                            <th className="px-3 py-2.5 text-center">
                              {isAr ? 'المسطح المائي' : 'Water m²'}
                            </th>
                            {allowFinancials && (
                              <th className="px-3 py-2.5 text-end">
                                {isAr ? 'قيمة العقد' : 'Contract Value'}
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                          {drillFilteredProjects.map(({ project: p, roles: pRoles }) => {
                            const totalVal = getProjectTotalValue(p);
                            const waterM2 = getProjectWaterArea(p);
                            const pct = Math.round(parseSafeNumber(p.completion_pct));

                            return (
                              <tr
                                key={p.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                              >
                                <td className="px-3 py-2.5 font-mono font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                  {p.project_code || p.code || '—'}
                                </td>
                                <td className="px-3 py-2.5 font-bold">
                                  <Link
                                    href={`/projects/${p.id}`}
                                    className="text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                                  >
                                    <span>
                                      {p.project_name_ar ||
                                        p.project_name ||
                                        p.name_ar ||
                                        '—'}
                                    </span>
                                    <ExternalLink className="w-3 h-3 shrink-0" />
                                  </Link>
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex flex-wrap gap-1">
                                    {pRoles.map((r) => (
                                      <span
                                        key={r}
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                          r === 'owner'
                                            ? ENTITY_CATEGORY_META.owner_developer.badgeCls
                                            : r === 'consultant'
                                            ? ENTITY_CATEGORY_META.consultant.badgeCls
                                            : ENTITY_CATEGORY_META.main_contractor.badgeCls
                                        }`}
                                      >
                                        {r === 'owner'
                                          ? isAr
                                            ? 'كمطور / مالك'
                                            : 'Owner'
                                          : r === 'consultant'
                                          ? isAr
                                            ? 'كاستشاري'
                                            : 'Consultant'
                                          : isAr
                                          ? 'كعميل تعاقدي'
                                          : 'Client'}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300 max-w-[230px]">
                                  {resolveCounterpartyInfo(
                                    activeDrillSummary.entity,
                                    p,
                                    pRoles,
                                    isAr
                                  )}
                                </td>
                                <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                                  {getProjectPmName(p)}
                                </td>
                                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                  <StatusBadge status={p.status} size="sm" />
                                </td>
                                <td className="px-3 py-2.5 text-center font-mono font-bold">
                                  {pct}%
                                </td>
                                <td className="px-3 py-2.5 text-center font-mono text-slate-600 dark:text-slate-300">
                                  {waterM2 > 0
                                    ? `${Math.round(waterM2).toLocaleString('en-US')} m²`
                                    : '—'}
                                </td>
                                {allowFinancials && (
                                  <td className="px-3 py-2.5 text-end font-mono font-bold whitespace-nowrap">
                                    {totalVal > 0 ? (
                                      <PriceGate>{formatCurrency(totalVal)}</PriceGate>
                                    ) : (
                                      '—'
                                    )}
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Linked Representatives Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>
                      {isAr
                        ? `ممثلو الجهة والأفراد المرتبطون (${activeDrillSummary.linkedPeople.length})`
                        : `Linked Representatives (${activeDrillSummary.linkedPeople.length})`}
                    </span>
                  </h3>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setIsQuickAddRepOpen(true)}
                      className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>
                        {isAr ? '+ إضافة ممثل للجهة' : '+ Add Representative'}
                      </span>
                    </button>
                  )}
                </div>

                {activeDrillSummary.linkedPeople.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'لا يوجد أفراد مسجلون تحت هذه الجهة في دليل الأفراد بعد.'
                      : 'No individuals registered under this entity yet.'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activeDrillSummary.linkedPeople.map((person) => (
                      <div
                        key={person.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-900 dark:text-white">
                            {person.name_ar || person.name_en}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {person.role || person.job_title || (isAr ? 'ممثل معتمد' : 'Representative')}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                          {person.phone && (
                            <a
                              href={`tel:${person.phone}`}
                              dir="ltr"
                              className="inline-flex items-center gap-1 hover:text-emerald-600"
                            >
                              <Phone className="w-3 h-3 text-emerald-500" />
                              <span>{person.phone}</span>
                            </a>
                          )}
                          {person.email && (
                            <a
                              href={`mailto:${person.email}`}
                              dir="ltr"
                              className="inline-flex items-center gap-1 hover:text-emerald-600 truncate max-w-[180px]"
                            >
                              <Mail className="w-3 h-3 text-emerald-500" />
                              <span className="truncate">{person.email}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QuickAddClientModal (Add New Entity) */}
      {canEdit && (
        <QuickAddClientModal
          isOpen={isQuickAddEntityOpen}
          onClose={() => setIsQuickAddEntityOpen(false)}
          entityType={
            categoryFilter === 'owner_developer'
              ? 'owner'
              : categoryFilter === 'consultant'
              ? 'consultant'
              : categoryFilter === 'subcontractor_vendor'
              ? 'subcontractor'
              : 'client'
          }
          onClientAdded={() => {
            appCache.invalidate('ref:clients');
            toast.success(
              isAr ? 'تمت إضافة الجهة إلى الدليل الموحد' : 'Entity added to directory'
            );
            loadData();
          }}
        />
      )}

      {/* QuickAddStakeholderModal (+ Add Representative inside Drill-Down) */}
      {canEdit && activeDrillSummary && (
        <QuickAddStakeholderModal
          isOpen={isQuickAddRepOpen}
          onClose={() => setIsQuickAddRepOpen(false)}
          defaultKind={
            activeDrillSummary.entity.category === 'consultant'
              ? 'external_expert'
              : activeDrillSummary.entity.category === 'subcontractor_vendor'
              ? 'vendor_rep'
              : 'client_rep'
          }
          defaultClientId={activeDrillSummary.entity.id}
          defaultOrganization={activeDrillSummary.entity.displayNameAr}
          clients={clients}
          onStakeholderAdded={() => {
            appCache.invalidate('stakeholders:directory');
            toast.success(
              isAr
                ? 'تم ربط ممثل الجهة وحفظه في الدليل بنجاح'
                : 'Representative linked & saved'
            );
            loadData();
          }}
        />
      )}

      {/* Edit Entity Modal */}
      {canEdit && editingEntity && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-entity-modal-title"
          dir={isAr ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          onClick={() => !savingEdit && setEditingEntity(null)}
        >
          <form
            onSubmit={handleSaveEditEntity}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3
                id="edit-entity-modal-title"
                className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4 text-emerald-600" />
                <span>
                  {isAr ? 'تعديل بيانات الجهة' : 'Edit Entity Details'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingEntity(null)}
                aria-label={isAr ? 'إغلاق' : 'Close'}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {isAr ? 'اسم الجهة (بالعربية) *' : 'Entity Name (Arabic) *'}
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name_ar}
                  onChange={(e) => setEditForm((p) => ({ ...p, name_ar: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {isAr ? 'الاسم بالإنجليزية' : 'Entity Name (English)'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={editForm.name_en}
                  onChange={(e) => setEditForm((p) => ({ ...p, name_en: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {isAr ? 'كود الجهة' : 'Entity Code'}
                </label>
                <input
                  type="text"
                  dir="ltr"
                  value={editForm.code}
                  onChange={(e) => setEditForm((p) => ({ ...p, code: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {isAr ? 'مسؤول التواصل الرئيسي' : 'Primary Contact Person'}
                </label>
                <input
                  type="text"
                  value={editForm.contact_person}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, contact_person: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {isAr ? 'رقم الهاتف' : 'Phone'}
                </label>
                <input
                  type="tel"
                  dir="ltr"
                  value={editForm.phone}
                  onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {isAr ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={editForm.email}
                  onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 dark:text-slate-300 mb-1">
                  {isAr ? 'العنوان / المقر' : 'Address'}
                </label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingEntity(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={savingEdit}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
              >
                {savingEdit ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Universal Report Studio Modal */}
      {activeReport && (
        <UniversalReportModal
          key={activeReport.key}
          isOpen={true}
          onClose={() => setActiveReport(null)}
          title={activeReport.title}
          defaultSubtitle={activeReport.subtitle}
          columns={activeReport.columns}
          data={activeReport.data}
          kpis={activeReport.kpis}
          lang={isAr ? 'ar' : 'en'}
        />
      )}
    </div>
  );
};
