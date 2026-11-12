'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ProjectService } from '@/lib/services/project.service';
import { HrService, ensureLocalStakeholderForAssignment } from '@/lib/services/hr.service';
import {
  Client,
  StakeholderFull,
  StakeholderKind,
  Project,
  RaciRole,
} from '@/types';
import {
  EntityCategory,
  deduplicateEntities,
  doesEntityMatchPartyText,
  normalizeTextForSearch,
} from '@/lib/directory/entityDirectory';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePagePermission } from '@/lib/hooks/usePagePermission';
import { RACI_CONFIG } from '@/components/projects/tabs/TeamTab';
import { appCache } from '@/lib/cache';
import { toast } from 'sonner';
import {
  X,
  Check,
  Loader2,
  Zap,
  UserPlus,
  Users,
  Phone,
  Mail,
  LayoutGrid,
  List,
  Radio,
  Building2,
  ArrowUpRight,
  BarChart3,
  Upload,
  Download,
  FileSpreadsheet,
  FileDown,
  SlidersHorizontal,
  ShieldAlert,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { StakeholderEntitySelect } from '@/components/ui/StakeholderEntitySelect';
import { UiversePillSearch } from '@/components/ui/UiversePillSearch';
import { UiverseCyberDropdown } from '@/components/ui/UiverseCyberDropdown';
import { StakeholderDataReport } from '@/components/stakeholders/StakeholderDataReport';
import { StakeholderImportModal } from '@/components/stakeholders/StakeholderImportModal';
import {
  StakeholdersUnifiedNavTabs,
  StakeholdersUnifiedTab,
} from '@/components/stakeholders/StakeholdersUnifiedNavTabs';
import { EntitiesPortfolioHub } from '@/components/stakeholders/EntitiesPortfolioHub';
import { UniversalReportModal } from '@/components/reports/UniversalReportModal';
import { ReportColumn, ReportKpiCard } from '@/lib/reports/reportEngine';
import {
  exportStakeholdersToExcel,
  exportStakeholdersToCsv,
  downloadStakeholdersTemplate,
} from '@/lib/utils/stakeholderReportUtils';

type TabKind = StakeholderKind | 'all';

interface TabDefinition {
  id: TabKind;
  labelAr: string;
  labelEn: string;
}

const TABS: TabDefinition[] = [
  { id: 'all', labelAr: 'الكل', labelEn: 'All' },
  { id: 'employee', labelAr: 'فريق بي زون (موظفون)', labelEn: 'Pzone Employees' },
  { id: 'client_rep', labelAr: 'عملاء ومالكون', labelEn: 'Clients & Owners' },
  { id: 'external_expert', labelAr: 'استشاريون وخبراء', labelEn: 'Consultants & Experts' },
  { id: 'vendor_rep', labelAr: 'مقاولون وموردون', labelEn: 'Vendors & Contractors' },
];

const KIND_BADGE: Record<string, { labelAr: string; labelEn: string; cls: string }> = {
  employee: {
    labelAr: 'فريق بي زون',
    labelEn: 'Pzone Employee',
    cls: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
  client_rep: {
    labelAr: 'عميل / مالك',
    labelEn: 'Client / Owner',
    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  },
  vendor_rep: {
    labelAr: 'مقاول / مورد',
    labelEn: 'Vendor / Contractor',
    cls: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-900',
  },
  external_expert: {
    labelAr: 'استشاري / خبير',
    labelEn: 'Consultant / Expert',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
  },
};

const AVATAR_CLS: Record<string, string> = {
  employee: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  client_rep: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300',
  vendor_rep: 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-300',
  external_expert: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-300',
};

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all';

type PeopleColumnId =
  | 'sn'
  | 'code'
  | 'person'
  | 'kind'
  | 'organization'
  | 'contact'
  | 'projects_count'
  | 'actions';

const PEOPLE_COLUMNS_STORAGE_KEY = 'pzone_stakeholders_people_columns_v1';

interface PeopleColumnDef {
  id: PeopleColumnId;
  labelAr: string;
  labelEn: string;
  defaultVisible: boolean;
  editOnly?: boolean;
}

const PEOPLE_COLUMN_DEFS: PeopleColumnDef[] = [
  { id: 'sn', labelAr: 'م', labelEn: '#', defaultVisible: true },
  { id: 'code', labelAr: 'الكود', labelEn: 'Code', defaultVisible: true },
  { id: 'person', labelAr: 'الشخص والمسمى الوظيفي', labelEn: 'Stakeholder & Role', defaultVisible: true },
  { id: 'kind', labelAr: 'الفئة', labelEn: 'Category', defaultVisible: true },
  { id: 'organization', labelAr: 'الجهة / الشركة', labelEn: 'Organization', defaultVisible: true },
  { id: 'contact', labelAr: 'معلومات التواصل', labelEn: 'Contact Details', defaultVisible: true },
  { id: 'projects_count', labelAr: 'المشاريع المسكن بها', labelEn: 'Projects', defaultVisible: true },
  { id: 'actions', labelAr: 'إجراء التسكين', labelEn: 'Action', defaultVisible: true, editOnly: true },
];

function getDefaultPeopleColumns(): Record<PeopleColumnId, boolean> {
  const map = {} as Record<PeopleColumnId, boolean>;
  for (const col of PEOPLE_COLUMN_DEFS) {
    map[col.id] = col.defaultVisible;
  }
  return map;
}

function cleanPhoneForDialer(phone?: string | null): string {
  if (!phone) return '';
  const western = phone.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  const cleaned = western.replace(/(?!^\+)[^\d]/g, '').trim();
  return cleaned || phone.trim();
}

function getInitials(name?: string | null): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function resolveDisplayOrg(person: StakeholderFull, isAr: boolean): string {
  const kind = person.stakeholder_kind || 'employee';
  const rawOrg =
    person.organization_name ||
    person.client_name ||
    person.vendor_name ||
    (kind === 'employee'
      ? isAr
        ? 'بي زون العالمية'
        : 'Pzone'
      : isAr
      ? 'جهة خارجية'
      : 'External Org');
  if (
    isAr &&
    (rawOrg.toLowerCase() === 'pzoneinternational' || rawOrg.toLowerCase() === 'pzone')
  ) {
    return 'بي زون العالمية';
  }
  return rawOrg;
}

function StakeholdersSkeleton({
  viewMode,
  isAr,
}: {
  viewMode: 'cards' | 'table' | 'report';
  isAr: boolean;
}) {
  if (viewMode === 'table') {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden"
      >
        <span className="sr-only">
          {isAr ? 'جاري تحميل دليل الشركاء...' : 'Loading stakeholders directory...'}
        </span>
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
            <span className="text-xs font-mono font-bold text-slate-400">
              {isAr ? 'جاري تهيئة تدفق البيانات...' : 'INITIALIZING TELEMETRY STREAM...'}
            </span>
          </div>
          <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3 min-w-[200px]">
                <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-28" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800/60 rounded w-20" />
                </div>
              </div>
              <div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
              <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800/60 rounded hidden sm:block" />
              <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800/60 rounded font-mono" />
              <div className="h-5 w-8 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div role="status" aria-busy="true" aria-live="polite" className="space-y-4">
      <span className="sr-only">
        {isAr ? 'جاري تحميل دليل الشركاء...' : 'Loading stakeholders directory...'}
      </span>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between space-y-4 animate-pulse shadow-xs"
          >
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-8 bg-slate-100 dark:bg-slate-800/50 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function StakeholdersDirectoryPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { canView, canEdit, isLoading: permLoading } = usePagePermission('/stakeholders');

  // Unified workspace section toggle ('people' vs inline 'entities')
  const [activeSection, setActiveSection] = useState<StakeholdersUnifiedTab>('people');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('section') === 'entities') {
      setActiveSection('entities');
    }
  }, []);

  const handleSectionChange = useCallback((nextTab: StakeholdersUnifiedTab) => {
    setActiveSection(nextTab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (nextTab === 'entities') {
        url.searchParams.set('section', 'entities');
      } else {
        url.searchParams.delete('section');
      }
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  // Data states
  const [stakeholders, setStakeholders] = useState<StakeholderFull[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectMap, setProjectMap] = useState<Record<string, Project>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Filters & View Mode (Default to 'table'!)
  const [activeTab, setActiveTab] = useState<TabKind>('all');
  const [search, setSearch] = useState<string>('');
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [projectAssignedLookup, setProjectAssignedLookup] = useState<{
    ids: Set<string>;
    emails: Set<string>;
    names: Set<string>;
  } | null>(null);
  const [loadingProjectFilter, setLoadingProjectFilter] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'report'>('table');

  // Column Customizer
  const [visibleColumns, setVisibleColumns] = useState<Record<PeopleColumnId, boolean>>(() =>
    getDefaultPeopleColumns()
  );
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState<boolean>(false);
  const columnPickerRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Assign modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignTargetPerson, setAssignTargetPerson] = useState<StakeholderFull | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [assignProjectRole, setAssignProjectRole] = useState<string>('');
  const [assignRaciRole, setAssignRaciRole] = useState<RaciRole>('responsible');
  const [assigning, setAssigning] = useState(false);

  // Add Person modal
  const [isAddPersonModalOpen, setIsAddPersonModalOpen] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonKind, setNewPersonKind] = useState<StakeholderKind>('employee');
  const [newPersonRole, setNewPersonRole] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newEmpCode, setNewEmpCode] = useState('');
  const [assignOnCreate, setAssignOnCreate] = useState(false);
  const [createProjectId, setCreateProjectId] = useState('');
  const [createProjectRole, setCreateProjectRole] = useState('');
  const [createRaciRole, setCreateRaciRole] = useState<RaciRole>('responsible');
  const [creating, setCreating] = useState(false);

  // Hydrate column preferences
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(PEOPLE_COLUMNS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<PeopleColumnId, boolean>>;
        setVisibleColumns((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const persistColumns = useCallback((next: Record<PeopleColumnId, boolean>) => {
    setVisibleColumns(next);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(PEOPLE_COLUMNS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  useEffect(() => {
    if (!isColumnPickerOpen) return;
    const onOutside = (e: MouseEvent) => {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
        setIsColumnPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [isColumnPickerOpen]);

  // Global ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isColumnPickerOpen) setIsColumnPickerOpen(false);
        if (isAssignModalOpen && !assigning) setIsAssignModalOpen(false);
        if (isAddPersonModalOpen && !creating) setIsAddPersonModalOpen(false);
        if (isImportModalOpen) setIsImportModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isColumnPickerOpen, isAssignModalOpen, isAddPersonModalOpen, isImportModalOpen, assigning, creating]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [stkData, projData, hrEmployees, clientsData] = await Promise.all([
        ProjectService.getStakeholdersDirectory({ kind: 'all' }),
        ProjectService.getProjects(),
        HrService.getEmployees().catch(() => [] as StakeholderFull[]),
        ProjectService.getClients().catch(() => [] as Client[]),
      ]);

      const localStk = stkData || [];
      const projList = projData || [];

      const localEmailSet = new Set(
        localStk.map((s) => s.email?.trim().toLowerCase()).filter(Boolean)
      );
      const localCodeSet = new Set(
        localStk.map((s) => s.employee_code?.trim()).filter(Boolean)
      );

      const newHrEmployees = (hrEmployees || []).filter((hr) => {
        const emailMatch = hr.email && localEmailSet.has(hr.email.trim().toLowerCase());
        const codeMatch = hr.employee_code && localCodeSet.has(hr.employee_code.trim());
        return !emailMatch && !codeMatch;
      });

      const merged = [...localStk, ...newHrEmployees] as StakeholderFull[];

      setStakeholders(merged);
      setClients(clientsData || []);
      setProjects(projList);
      const pMap: Record<string, Project> = {};
      projList.forEach((p) => {
        pMap[p.id] = p;
      });
      setProjectMap(pMap);
    } catch (err) {
      console.error('Error loading stakeholders data:', err);
      toast.error(
        isAr ? 'حدث خطأ أثناء تحميل دليل الشركاء' : 'Error loading stakeholders directory'
      );
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Resolve assigned stakeholders when Project Filter is active
  useEffect(() => {
    if (projectFilter === 'all') {
      setProjectAssignedLookup(null);
      return;
    }

    let cancelled = false;
    setLoadingProjectFilter(true);
    ProjectService.getProjectStakeholders(projectFilter)
      .then((rows) => {
        if (cancelled) return;
        const ids = new Set<string>();
        const emails = new Set<string>();
        const names = new Set<string>();

        for (const r of rows || []) {
          if (r.is_active === false) continue;
          if (r.stakeholder_id) ids.add(r.stakeholder_id);
          if (r.stakeholder?.email) emails.add(r.stakeholder.email.trim().toLowerCase());
          const nAr = normalizeTextForSearch(r.stakeholder?.name_ar);
          const nEn = normalizeTextForSearch(r.stakeholder?.name_en);
          if (nAr) names.add(nAr);
          if (nEn) names.add(nEn);
        }

        const proj = projectMap[projectFilter];
        if (proj) {
          if (proj.project_manager_id) ids.add(proj.project_manager_id);
          [
            proj.pm_canonical_name,
            proj.pm_full_name,
            proj.project_manager_name_raw,
            proj.project_manager,
            proj.metadata?.consultant_engineer as string | undefined,
          ].forEach((rawName) => {
            const norm = normalizeTextForSearch(rawName);
            if (norm && norm !== 'غير محدد') names.add(norm);
          });
        }

        setProjectAssignedLookup({ ids, emails, names });
      })
      .catch(() => {
        if (!cancelled) {
          setProjectAssignedLookup({ ids: new Set(), emails: new Set(), names: new Set() });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingProjectFilter(false);
      });

    return () => {
      cancelled = true;
    };
  }, [projectFilter, projectMap]);

  // Deduplicated corporate entities for Organization Filter & Add Person Modal
  const dedupedEntities = useMemo(() => deduplicateEntities(clients), [clients]);

  const orgFilterOptions: SelectOption[] = useMemo(() => {
    return [
      { value: 'all', label: isAr ? 'الجهة / الشركة: كل الجهات' : 'Organization: All' },
      {
        value: '__pzone__',
        label: isAr ? 'بي زون العالمية (كادر P.Zone)' : 'P.Zone Internal Staff',
      },
      ...dedupedEntities.map((e) => ({
        value: e.id,
        label: isAr ? e.displayNameAr : e.displayNameEn,
        subLabel: e.canonicalCode || undefined,
      })),
    ];
  }, [dedupedEntities, isAr]);

  const projectFilterOptions: SelectOption[] = useMemo(() => {
    return [
      { value: 'all', label: isAr ? 'المشروع: كل المشاريع' : 'Project: All Projects' },
      ...projects.map((p) => {
        const code = p.project_code || p.code || '';
        const name = p.project_name_ar || p.project_name || p.name_ar || '';
        return {
          value: p.id,
          label: `${code ? `#${code} — ` : ''}${name}`,
        };
      }),
    ];
  }, [projects, isAr]);

  const counts = useMemo(
    () => ({
      all: stakeholders.length,
      employee: stakeholders.filter((s) => (s.stakeholder_kind || 'employee') === 'employee')
        .length,
      client_rep: stakeholders.filter((s) => s.stakeholder_kind === 'client_rep').length,
      vendor_rep: stakeholders.filter((s) => s.stakeholder_kind === 'vendor_rep').length,
      external_expert: stakeholders.filter((s) => s.stakeholder_kind === 'external_expert')
        .length,
    }),
    [stakeholders]
  );

  const filteredStakeholders = useMemo(() => {
    const seen = new Set<string>();
    const normQuery = normalizeTextForSearch(search);
    const selectedOrgEntity =
      orgFilter !== 'all' && orgFilter !== '__pzone__'
        ? dedupedEntities.find((e) => e.id === orgFilter)
        : undefined;

    return stakeholders.filter((item) => {
      const kind = item.stakeholder_kind || 'employee';
      if (activeTab !== 'all' && kind !== activeTab) return false;

      // Organization Filter
      if (orgFilter === '__pzone__') {
        const rawOrgNorm = normalizeTextForSearch(item.organization_name);
        const isPzone =
          kind === 'employee' ||
          rawOrgNorm.includes('pzone') ||
          rawOrgNorm.includes('بي زون');
        if (!isPzone) return false;
      } else if (selectedOrgEntity) {
        const matchesId = Boolean(
          item.client_id && selectedOrgEntity.aliasIds.includes(item.client_id)
        );
        const matchesText = doesEntityMatchPartyText(
          selectedOrgEntity,
          item.organization_name || item.client_name || item.vendor_name
        );
        if (!matchesId && !matchesText) return false;
      }

      // Project Filter
      if (projectFilter !== 'all' && projectAssignedLookup) {
        const matchesId = projectAssignedLookup.ids.has(item.id);
        const matchesEmail = Boolean(
          item.email && projectAssignedLookup.emails.has(item.email.trim().toLowerCase())
        );
        const nAr = normalizeTextForSearch(item.name_ar);
        const nEn = normalizeTextForSearch(item.name_en);
        const matchesName =
          (Boolean(nAr) && projectAssignedLookup.names.has(nAr)) ||
          (Boolean(nEn) && projectAssignedLookup.names.has(nEn));
        if (!matchesId && !matchesEmail && !matchesName) return false;
      }

      // Search
      if (normQuery) {
        const hay = normalizeTextForSearch(
          [
            item.name_ar,
            item.name_en,
            item.role,
            item.phone,
            item.email,
            item.organization_name,
            item.client_name,
            item.vendor_name,
            item.employee_code,
            item.code,
          ]
            .filter(Boolean)
            .join(' ')
        );
        if (!hay.includes(normQuery)) return false;
      }

      const nameKey = normalizeTextForSearch(item.name_ar || item.name_en || item.id);
      const dedupKey = `${nameKey}_${(item.phone || '').trim()}`;
      if (seen.has(dedupKey)) return false;
      seen.add(dedupKey);
      return true;
    });
  }, [
    stakeholders,
    activeTab,
    search,
    orgFilter,
    dedupedEntities,
    projectFilter,
    projectAssignedLookup,
  ]);

  const hasActiveFilters =
    activeTab !== 'all' ||
    Boolean(search.trim()) ||
    orgFilter !== 'all' ||
    projectFilter !== 'all';

  const resetFilters = () => {
    setActiveTab('all');
    setSearch('');
    setOrgFilter('all');
    setProjectFilter('all');
  };

  // Preferred entity categories inside Add Person Modal based on selected person kind
  const preferredModalEntityCategories: EntityCategory[] | undefined = useMemo(() => {
    if (newPersonKind === 'client_rep') return ['owner_developer', 'main_contractor'];
    if (newPersonKind === 'external_expert') return ['consultant'];
    if (newPersonKind === 'vendor_rep') return ['subcontractor_vendor', 'main_contractor'];
    return undefined;
  }, [newPersonKind]);

  const availableColumnDefs = useMemo(
    () => PEOPLE_COLUMN_DEFS.filter((c) => !c.editOnly || canEdit),
    [canEdit]
  );

  const isColShown = useCallback(
    (id: PeopleColumnId): boolean => {
      if (id === 'actions' && !canEdit) return false;
      return Boolean(visibleColumns[id]);
    },
    [visibleColumns, canEdit]
  );

  // Universal Report Studio configuration for People
  const reportColumns: ReportColumn<StakeholderFull>[] = useMemo(
    () => [
      {
        id: 'code',
        labelAr: 'الكود الوظيفي / المرجعي',
        labelEn: 'Code',
        categoryAr: 'البيانات الأساسية',
        getValue: (p) => p.employee_code || p.code || '—',
      },
      {
        id: 'name_ar',
        labelAr: 'الاسم الكامل',
        labelEn: 'Full Name',
        categoryAr: 'البيانات الأساسية',
        getValue: (p) => p.name_ar || p.name_en || '—',
      },
      {
        id: 'role',
        labelAr: 'المسمى الوظيفي / الدور',
        labelEn: 'Job Title / Role',
        categoryAr: 'البيانات الأساسية',
        getValue: (p) => p.role || p.job_title || '—',
      },
      {
        id: 'kind',
        labelAr: 'الفئة',
        labelEn: 'Category',
        categoryAr: 'التصنيف والجهة',
        getValue: (p) =>
          (KIND_BADGE[p.stakeholder_kind || 'employee'] || KIND_BADGE.employee).labelAr,
      },
      {
        id: 'organization',
        labelAr: 'الشركة / الجهة التابع لها',
        labelEn: 'Organization',
        categoryAr: 'التصنيف والجهة',
        getValue: (p) => resolveDisplayOrg(p, true),
      },
      {
        id: 'phone',
        labelAr: 'رقم الهاتف',
        labelEn: 'Phone',
        categoryAr: 'بيانات التواصل',
        getValue: (p) => p.phone || '—',
      },
      {
        id: 'email',
        labelAr: 'البريد الإلكتروني',
        labelEn: 'Email',
        categoryAr: 'بيانات التواصل',
        getValue: (p) => p.email || '—',
      },
      {
        id: 'projects_count',
        labelAr: 'عدد المشاريع المسكن بها',
        labelEn: 'Assigned Projects',
        categoryAr: 'المشاريع',
        isNumeric: true,
        align: 'center',
        getValue: (p) => p.assigned_projects_count || 0,
      },
    ],
    []
  );

  const reportKpis: ReportKpiCard[] = useMemo(
    () => [
      {
        id: 'total',
        label: 'إجمالي الأفراد بالتقرير',
        value: filteredStakeholders.length,
        tone: 'emerald',
      },
      {
        id: 'employees',
        label: 'كادر بي زون',
        value: filteredStakeholders.filter(
          (s) => (s.stakeholder_kind || 'employee') === 'employee'
        ).length,
        tone: 'blue',
      },
      {
        id: 'client_reps',
        label: 'ممثلو الملاك والعملاء',
        value: filteredStakeholders.filter((s) => s.stakeholder_kind === 'client_rep').length,
        tone: 'amber',
      },
      {
        id: 'consultants',
        label: 'الاستشاريون والخبراء',
        value: filteredStakeholders.filter((s) => s.stakeholder_kind === 'external_expert')
          .length,
        tone: 'purple',
      },
    ],
    [filteredStakeholders]
  );

  const handleOpenAssignModal = (person: StakeholderFull) => {
    if (!canEdit) return;
    setAssignTargetPerson(person);
    setSelectedProjectId(projects[0]?.id || '');
    setAssignProjectRole(person.role || 'عضو فريق المشروع');
    setAssignRaciRole('responsible');
    setIsAssignModalOpen(true);
  };

  const handleExecuteAssign = async () => {
    if (!canEdit || !assignTargetPerson || !selectedProjectId) {
      toast.error(isAr ? 'يرجى اختيار المشروع أولاً' : 'Please select a project first');
      return;
    }
    setAssigning(true);
    try {
      const selectedProj = projectMap[selectedProjectId];
      const partyKind = assignTargetPerson.stakeholder_kind || 'employee';
      const shouldEnsureLocalStakeholder =
        Boolean(assignTargetPerson.is_hr_employee) || partyKind === 'employee';

      const resolvedStakeholderId = shouldEnsureLocalStakeholder
        ? await ensureLocalStakeholderForAssignment({
            id: assignTargetPerson.id,
            name: assignTargetPerson.name_en || assignTargetPerson.name_ar,
            name_ar: assignTargetPerson.name_ar,
            name_en: assignTargetPerson.name_en,
            email: assignTargetPerson.email,
            employee_code: assignTargetPerson.employee_code || assignTargetPerson.code,
            code: assignTargetPerson.code,
            job_title: assignTargetPerson.job_title || assignTargetPerson.role,
            role: assignTargetPerson.role || assignTargetPerson.job_title || undefined,
            phone: assignTargetPerson.phone,
            organization_id:
              assignTargetPerson.organization_id || '00000000-0000-0000-0000-000000000001',
          })
        : assignTargetPerson.id;

      await ProjectService.addProjectStakeholder({
        project_id: selectedProjectId,
        stakeholder_id: resolvedStakeholderId,
        project_role: assignProjectRole.trim() || assignTargetPerson.role || 'عضو الفريق',
        raci_role: assignRaciRole,
        party_kind: partyKind,
        custom_level: partyKind === 'employee' ? 2 : 0,
      });
      appCache.invalidate(`project:stakeholders:${selectedProjectId}`);
      appCache.invalidate('stakeholders:directory');
      toast.success(
        `تم تسكين ${assignTargetPerson.name_ar || 'الشريك'} في مشروع "${
          selectedProj?.project_name || selectedProjectId
        }"`
      );
      setIsAssignModalOpen(false);
      loadData();
    } catch (rawErr: unknown) {
      const err = rawErr as { message?: string; code?: string };
      console.error('Error assigning stakeholder:', err);
      const msg = String(err?.message || '');
      if (
        err?.code === '23505' ||
        msg.includes('uq_project_accountable') ||
        msg.includes('Accountable')
      ) {
        toast.error(
          isAr
            ? 'لا يمكن تعيين أكثر من مسؤول رئيسي (Accountable) واحد للمشروع'
            : 'Only one Accountable person can be assigned per project'
        );
      } else {
        toast.error(
          err?.message ||
            (isAr ? 'حدث خطأ أثناء التسكين بالمشروع' : 'Error assigning stakeholder to project')
        );
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleCreateNewStakeholder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!newPersonName.trim()) {
      toast.error(isAr ? 'يرجى كتابة الاسم' : 'Please enter full name');
      return;
    }
    setCreating(true);
    try {
      const resolvedOrgName =
        newPersonKind === 'employee'
          ? 'Pzoneinternational'
          : newOrgName.trim() || 'جهة خارجية';
      const resolvedClientId =
        newPersonKind !== 'employee' && newClientId ? newClientId : undefined;

      const created = await ProjectService.createStakeholder({
        name_ar: newPersonName.trim(),
        name_en: newPersonName.trim(),
        role: newPersonRole.trim() || 'عضو الفريق',
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        employee_code: newEmpCode.trim() || undefined,
        organization_name: resolvedOrgName,
        client_id: resolvedClientId,
        stakeholder_kind: newPersonKind,
      });

      if (assignOnCreate && createProjectId) {
        await ProjectService.addProjectStakeholder({
          project_id: createProjectId,
          stakeholder_id: created.id,
          project_role: createProjectRole.trim() || newPersonRole.trim() || 'عضو الفريق',
          raci_role: createRaciRole,
          party_kind: newPersonKind,
          custom_level: newPersonKind === 'employee' ? 2 : 0,
        });
        appCache.invalidate(`project:stakeholders:${createProjectId}`);
        const proj = projectMap[createProjectId];
        toast.success(`تم إضافة ${newPersonName} وتسكينه في مشروع "${proj?.project_name}"`);
      } else {
        toast.success(`تم إضافة ${newPersonName} إلى دليل الشركة`);
      }

      appCache.invalidate('stakeholders:directory');
      setIsAddPersonModalOpen(false);
      setNewPersonName('');
      setNewPersonRole('');
      setNewClientId('');
      setNewOrgName('');
      setNewPhone('');
      setNewEmail('');
      setNewEmpCode('');
      setAssignOnCreate(false);
      loadData();
    } catch (rawErr: unknown) {
      const err = rawErr as { message?: string };
      console.error('Error creating stakeholder:', err);
      toast.error(err.message || 'حدث خطأ أثناء حفظ الشريك');
    } finally {
      setCreating(false);
    }
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
      className="space-y-4 p-2 md:p-4 w-full"
    >
      <Breadcrumbs
        items={[
          { label: isAr ? 'إدارة المشاريع' : 'Projects Management', href: '/projects' },
          {
            label:
              activeSection === 'entities'
                ? isAr
                  ? 'محفظة الجهات والمطورين والعملاء'
                  : 'Entities & Developers Hub'
                : isAr
                ? 'دليل الأفراد وممثلي الجهات'
                : 'Stakeholders Directory',
          },
        ]}
      />

      <div>
        <BackButton label={isAr ? 'الرجوع' : 'Back'} />
      </div>

      {/* Unified Top Switcher (Instant Inline Toggle between Entities Hub & People Directory) */}
      <StakeholdersUnifiedNavTabs
        activeTab={activeSection}
        entitiesCount={dedupedEntities.length}
        peopleCount={stakeholders.length}
        onTabChange={handleSectionChange}
      />

      {activeSection === 'entities' ? (
        <EntitiesPortfolioHub embedded onTabChange={handleSectionChange} />
      ) : (
        <>
          {/* ── Header ── */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 px-5 py-4 shadow-xs">
            <div>
              <h1 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                <span>
                  {isAr
                    ? 'دليل الأفراد وممثلي الجهات وكادر المشاريع'
                    : 'Stakeholders & Representatives Directory'}
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? canEdit
                    ? 'أضف الأفراد وممثلي الملاك والاستشاريين واربطهم بالجهات والمشاريع وفق مصفوفة RACI'
                    : 'استعراض دليل كادر المشاريع وممثلي الجهات والاستشاريين (وضع القراءة فقط)'
                  : canEdit
                  ? 'Manage individuals, link them to corporate entities, and assign RACI roles across projects'
                  : 'Read-only directory of project staff, client representatives, and consultants'}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Universal Report Modal Trigger */}
              <button
                type="button"
                onClick={() => setIsReportModalOpen(true)}
                disabled={loading || filteredStakeholders.length === 0}
                className="min-h-[38px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {isAr ? 'تصدير تقرير رسمي (PDF / Excel)' : 'Official Report Studio'}
                </span>
              </button>

              {/* Visual Data Report Toggle */}
              <button
                type="button"
                aria-pressed={viewMode === 'report'}
                onClick={() => setViewMode(viewMode === 'report' ? 'table' : 'report')}
                className={`min-h-[38px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  viewMode === 'report'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span>{isAr ? 'تحليلات بصرية' : 'Visual Analytics'}</span>
              </button>

              {canEdit && (
                <>
                  {/* Batch Import Modal Trigger */}
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={isImportModalOpen}
                    onClick={() => setIsImportModalOpen(true)}
                    className="min-h-[38px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold text-xs transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>{isAr ? 'استيراد Excel / CSV' : 'Import Excel / CSV'}</span>
                  </button>

                  <UiverseCyberDropdown
                    label={isAr ? 'أدوات وقوالب الدليل' : 'Directory Tools'}
                    variant="emerald"
                    size="sm"
                    align={isAr ? 'left' : 'right'}
                    items={[
                      {
                        id: 'add-person',
                        label: isAr ? 'إضافة شخص جديد' : 'Add New Person',
                        icon: UserPlus,
                        onClick: () => setIsAddPersonModalOpen(true),
                      },
                      {
                        id: 'import-excel',
                        label: isAr ? 'استيراد جماعي للشركاء' : 'Batch Import (Excel/CSV)',
                        icon: Upload,
                        onClick: () => setIsImportModalOpen(true),
                      },
                      {
                        id: 'export-xlsx',
                        label: isAr ? 'تصدير الدليل كملف إكسيل (.xlsx)' : 'Export Excel (.xlsx)',
                        icon: FileSpreadsheet,
                        onClick: () => exportStakeholdersToExcel(filteredStakeholders),
                      },
                      {
                        id: 'export-csv',
                        label: isAr ? 'تصدير الدليل كملف نصي (CSV)' : 'Export CSV',
                        icon: Download,
                        onClick: () => exportStakeholdersToCsv(filteredStakeholders),
                      },
                      {
                        id: 'download-template',
                        label: isAr ? 'تحميل قالب الإكسيل المعتمد' : 'Download Excel Template',
                        icon: FileDown,
                        onClick: () => downloadStakeholdersTemplate('xlsx'),
                      },
                    ]}
                  />

                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={isAddPersonModalOpen}
                    onClick={() => setIsAddPersonModalOpen(true)}
                    className="min-h-[38px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{isAr ? 'إضافة شخص جديد' : 'Add New Person'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ── Toolbar: Tabs + Search + Org/Project Filters + Column Customizer + View Modes ── */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div
                role="tablist"
                aria-label={isAr ? 'تصفية الشركاء حسب الفئة' : 'Filter stakeholders by kind'}
                className="flex flex-wrap gap-1.5"
              >
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const countVal = counts[tab.id as keyof typeof counts];
                  const tabLabel = isAr ? tab.labelAr : tab.labelEn;
                  return (
                    <button
                      key={tab.id}
                      id={`tab-${tab.id}`}
                      role="tab"
                      type="button"
                      aria-selected={isActive}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{tabLabel}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono tabular-nums ${
                          isActive
                            ? 'bg-emerald-700/60 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {countVal}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 min-w-[220px] lg:ms-auto lg:max-w-sm">
                <UiversePillSearch
                  id="stakeholders-directory-search"
                  value={search}
                  onChange={setSearch}
                  placeholder={
                    isAr
                      ? 'ابحث بالاسم، الجهة، الهاتف، الكود...'
                      : 'Search by name, organization, phone, code...'
                  }
                  shortcut="⌘K"
                  variant="emerald"
                  size="sm"
                  fullWidth
                  dir={isAr ? 'rtl' : 'ltr'}
                  ariaLabel={isAr ? 'البحث في دليل الأفراد' : 'Search directory'}
                />
              </div>

              {/* Column Customizer + View Mode Toggle */}
              <div className="flex items-center gap-2 shrink-0">
                {viewMode === 'table' && (
                  <div className="relative" ref={columnPickerRef}>
                    <button
                      type="button"
                      onClick={() => setIsColumnPickerOpen((o) => !o)}
                      aria-expanded={isColumnPickerOpen}
                      aria-haspopup="dialog"
                      className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>{isAr ? 'تخصيص الأعمدة' : 'Columns'}</span>
                    </button>

                    {isColumnPickerOpen && (
                      <div
                        role="dialog"
                        aria-label={isAr ? 'تخصيص الأعمدة' : 'Customize columns'}
                        className="absolute end-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-3 z-40 space-y-2"
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {isAr ? 'الأعمدة' : 'Columns'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const allOn = {} as Record<PeopleColumnId, boolean>;
                                PEOPLE_COLUMN_DEFS.forEach((c) => {
                                  allOn[c.id] = true;
                                });
                                persistColumns(allOn);
                              }}
                              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                            >
                              {isAr ? 'إظهار الكل' : 'Show All'}
                            </button>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <button
                              type="button"
                              onClick={() => persistColumns(getDefaultPeopleColumns())}
                              className="text-[10px] font-bold text-slate-500 hover:underline cursor-pointer"
                            >
                              {isAr ? 'افتراضي' : 'Default'}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
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

                <div
                  role="tablist"
                  aria-label={isAr ? 'نمط العرض' : 'View mode'}
                  className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-950/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'table'}
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      viewMode === 'table'
                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isAr ? 'جدول' : 'Table'}</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={viewMode === 'cards'}
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      viewMode === 'cards'
                        ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{isAr ? 'بطاقات' : 'Cards'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Organization Filter + Project Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 items-center">
              <CustomSelect
                options={orgFilterOptions}
                value={orgFilter}
                onChange={(val) => setOrgFilter(val || 'all')}
                placeholder={isAr ? 'تصفية حسب الجهة / الشركة...' : 'Filter by Organization...'}
                searchPlaceholder={isAr ? 'ابحث عن شركة أو مطور...' : 'Search organization...'}
              />

              <CustomSelect
                options={projectFilterOptions}
                value={projectFilter}
                onChange={(val) => setProjectFilter(val || 'all')}
                isLoading={loadingProjectFilter}
                placeholder={isAr ? 'تصفية حسب المشروع...' : 'Filter by Project...'}
                searchPlaceholder={isAr ? 'ابحث بكود أو اسم المشروع...' : 'Search project...'}
              />

              <div className="flex items-center justify-between sm:justify-end gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {isAr ? 'المطابق:' : 'Matched:'}{' '}
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                    {filteredStakeholders.length}
                  </strong>
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/70 text-xs font-bold hover:bg-rose-100 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إعادة ضبط' : 'Reset'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Directory View (Table [Default] OR Cards OR Data Report) ── */}
          <div id="directory-content-view" className="space-y-4">
            {loading ? (
              <StakeholdersSkeleton viewMode={viewMode} isAr={isAr} />
            ) : viewMode === 'report' ? (
              <StakeholderDataReport
                stakeholders={stakeholders}
                onClose={() => setViewMode('table')}
              />
            ) : filteredStakeholders.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 py-16 text-center space-y-2 shadow-xs">
                <Users className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto" />
                <h3 className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  {isAr ? 'لا يوجد نتائج مطابقة' : 'No matching results found'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isAr
                    ? 'جرب تغيير مصطلح البحث أو الفلاتر المحددة'
                    : 'Try adjusting your search query or selected filters'}
                </p>
              </div>
            ) : viewMode === 'cards' ? (
              /* ═══ CARDS VIEW ═══ */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredStakeholders.map((person) => {
                    const nameText =
                      person.name_ar ||
                      person.name_en ||
                      (isAr ? 'شريك معتمد' : 'Verified Stakeholder');
                    const initials = getInitials(nameText);
                    const kind = person.stakeholder_kind || 'employee';
                    const badge = KIND_BADGE[kind] || KIND_BADGE.employee;
                    const org = resolveDisplayOrg(person, isAr);
                    const code = person.employee_code || person.code || 'STK';
                    const badgeText = isAr ? badge.labelAr : badge.labelEn;
                    const cleanPhone = cleanPhoneForDialer(person.phone);

                    return (
                      <div
                        key={person.id}
                        role="article"
                        aria-label={`${nameText} - ${badgeText}`}
                        className="relative p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/60 shadow-xs hover:shadow-xl transition-all duration-200 group flex flex-col justify-between overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md border font-mono ${badge.cls}`}
                          >
                            {badgeText}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-700/60">
                            #{code}
                          </span>
                        </div>

                        <div className="py-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-11 h-11 rounded-2xl text-xs font-black flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 ${
                                AVATAR_CLS[kind] || AVATAR_CLS.employee
                              }`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                                {nameText}
                              </h3>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                                {person.role || (isAr ? 'عضو معتمد' : 'Verified Member')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-2 rounded-xl border border-slate-100 dark:border-slate-800/60">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate font-semibold">{org}</span>
                          </div>

                          <div className="grid grid-cols-1 gap-1.5 pt-1 text-xs">
                            {person.phone ? (
                              <a
                                href={`tel:${cleanPhone}`}
                                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800/80 font-mono text-[11px]"
                              >
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span dir="ltr" className="truncate select-all">
                                    {person.phone}
                                  </span>
                                </span>
                                <ArrowUpRight className="w-3 h-3 text-emerald-500 shrink-0" />
                              </a>
                            ) : null}

                            {person.email && (
                              <a
                                href={`mailto:${person.email}`}
                                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50/80 dark:bg-slate-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800/80 font-mono text-[10px]"
                              >
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span dir="ltr" className="truncate max-w-[190px] select-all">
                                    {person.email}
                                  </span>
                                </span>
                                <ArrowUpRight className="w-3 h-3 text-slate-400 shrink-0" />
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400">
                              {isAr ? 'المشاريع:' : 'Projects:'}
                            </span>
                            {person.assigned_projects_count > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black font-mono border border-emerald-500/20">
                                <Radio className="w-2.5 h-2.5 text-emerald-500" />
                                <span>{person.assigned_projects_count}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">0</span>
                            )}
                          </div>

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenAssignModal(person)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-emerald-700 dark:bg-slate-800 dark:hover:bg-emerald-600 text-white font-bold text-[11px] transition-all cursor-pointer"
                            >
                              <Zap className="w-3 h-3 text-emerald-400" />
                              <span>{isAr ? 'تسكين' : 'Assign'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ═══ TABLE VIEW (DEFAULT) ═══ */
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto max-h-[720px] overflow-y-auto">
                  <table
                    aria-label={
                      isAr
                        ? 'جدول دليل الشركاء وأصحاب المصلحة'
                        : 'Stakeholders Directory Table'
                    }
                    className="w-full text-sm border-collapse min-w-[760px]"
                  >
                    <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md">
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold">
                        {isColShown('sn') && (
                          <th className="px-3 py-3 text-center w-10">#</th>
                        )}
                        {isColShown('code') && (
                          <th className="px-3 py-3 text-start">{isAr ? 'الكود' : 'Code'}</th>
                        )}
                        {isColShown('person') && (
                          <th className="px-4 py-3 text-start">
                            {isAr ? 'الشريك / الاسم' : 'Stakeholder'}
                          </th>
                        )}
                        {isColShown('kind') && (
                          <th className="px-3 py-3 text-start">{isAr ? 'الفئة' : 'Category'}</th>
                        )}
                        {isColShown('organization') && (
                          <th className="px-3 py-3 text-start">
                            {isAr ? 'الجهة / الشركة' : 'Organization'}
                          </th>
                        )}
                        {isColShown('contact') && (
                          <th className="px-3 py-3 text-start">
                            {isAr ? 'معلومات التواصل' : 'Contact Details'}
                          </th>
                        )}
                        {isColShown('projects_count') && (
                          <th className="px-3 py-3 text-center">
                            {isAr ? 'مشاريعه' : 'Projects'}
                          </th>
                        )}
                        {isColShown('actions') && (
                          <th className="px-3 py-3 text-start">{isAr ? 'إجراء' : 'Action'}</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredStakeholders.map((person, idx) => {
                        const nameText =
                          person.name_ar || person.name_en || (isAr ? 'شريك' : 'Stakeholder');
                        const initials = getInitials(nameText);
                        const kind = person.stakeholder_kind || 'employee';
                        const badge = KIND_BADGE[kind] || KIND_BADGE.employee;
                        const org = resolveDisplayOrg(person, isAr);
                        const badgeText = isAr ? badge.labelAr : badge.labelEn;
                        const cleanPhone = cleanPhoneForDialer(person.phone);

                        return (
                          <tr
                            key={person.id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            {isColShown('sn') && (
                              <td className="px-3 py-2.5 text-center font-mono text-xs text-slate-400 tabular-nums">
                                {idx + 1}
                              </td>
                            )}
                            {isColShown('code') && (
                              <td className="px-3 py-2.5 font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                {person.employee_code || person.code || '—'}
                              </td>
                            )}
                            {isColShown('person') && (
                              <td className="px-4 py-2.5">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className={`w-8 h-8 rounded-xl text-[10px] font-black flex items-center justify-center shrink-0 border border-black/5 dark:border-white/5 ${
                                      AVATAR_CLS[kind] || AVATAR_CLS.employee
                                    }`}
                                  >
                                    {initials}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate max-w-[220px]">
                                      {nameText}
                                    </div>
                                    <div className="text-[10px] text-slate-400 truncate max-w-[220px]">
                                      {person.role || (isAr ? 'شريك معتمد' : 'Verified')}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            )}
                            {isColShown('kind') && (
                              <td className="px-3 py-2.5">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border whitespace-nowrap ${badge.cls}`}
                                >
                                  {badgeText}
                                </span>
                              </td>
                            )}
                            {isColShown('organization') && (
                              <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 font-medium max-w-[180px] truncate">
                                {org}
                              </td>
                            )}
                            {isColShown('contact') && (
                              <td className="px-3 py-2.5">
                                <div className="flex flex-col gap-1 items-start text-start">
                                  {person.phone && (
                                    <a
                                      href={`tel:${cleanPhone}`}
                                      className="inline-flex items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400"
                                    >
                                      <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span dir="ltr" className="select-all">
                                        {person.phone}
                                      </span>
                                    </a>
                                  )}
                                  {person.email && (
                                    <a
                                      href={`mailto:${person.email}`}
                                      className="inline-flex items-center gap-1.5 font-mono text-[10px] text-slate-400 hover:text-emerald-600 truncate max-w-[170px]"
                                    >
                                      <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                      <span dir="ltr" className="truncate select-all">
                                        {person.email}
                                      </span>
                                    </a>
                                  )}
                                  {!person.phone && !person.email && (
                                    <span className="text-slate-300 dark:text-slate-600 text-xs">
                                      —
                                    </span>
                                  )}
                                </div>
                              </td>
                            )}
                            {isColShown('projects_count') && (
                              <td className="px-3 py-2.5 text-center">
                                {person.assigned_projects_count > 0 ? (
                                  <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-black tabular-nums border border-emerald-500/20">
                                    {person.assigned_projects_count}
                                  </span>
                                ) : (
                                  <span className="text-slate-300 dark:text-slate-600 text-xs">
                                    —
                                  </span>
                                )}
                              </td>
                            )}
                            {isColShown('actions') && (
                              <td className="px-3 py-2.5 text-start">
                                <button
                                  type="button"
                                  onClick={() => handleOpenAssignModal(person)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold hover:border-emerald-500 hover:text-emerald-600 transition-all cursor-pointer"
                                >
                                  <Zap className="w-3 h-3 text-emerald-500" />
                                  <span>{isAr ? 'تسكين' : 'Assign'}</span>
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800/60 text-[11px] text-slate-400">
                  {isAr ? 'عرض' : 'Showing'}{' '}
                  <strong className="text-emerald-500 font-mono">
                    {filteredStakeholders.length}
                  </strong>{' '}
                  {isAr
                    ? `من أصل ${stakeholders.length} شريك`
                    : `of ${stakeholders.length} stakeholders`}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══ MODAL 1: Assign to Project (canEdit gated) ═══ */}
      {canEdit && isAssignModalOpen && assignTargetPerson && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
          onClick={() => !assigning && setIsAssignModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="assign-modal-title"
            id="assign-stakeholder-modal"
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-black flex items-center justify-center">
                  {getInitials(assignTargetPerson.name_ar || assignTargetPerson.name_en)}
                </div>
                <div>
                  <h3
                    id="assign-modal-title"
                    className="font-bold text-sm text-slate-900 dark:text-white"
                  >
                    {isAr ? 'تسكين في مشروع' : 'Assign to Project'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {assignTargetPerson.name_ar || assignTargetPerson.name_en}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="assign-project-select"
                  className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
                >
                  {isAr ? 'المشروع *' : 'Project *'}
                </label>
                <select
                  id="assign-project-select"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className={inputCls}
                >
                  {projects.map((p) => {
                    const code = p.project_code || p.code || '';
                    const name =
                      p.project_name || p.name_ar || p.name_en || (code ? `مشروع ${code}` : 'مشروع');
                    return (
                      <option
                        key={p.id}
                        value={p.id}
                        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      >
                        {code ? `#${code} — ` : ''}
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label
                  htmlFor="assign-project-role"
                  className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
                >
                  {isAr ? 'الدور داخل المشروع *' : 'Role inside Project *'}
                </label>
                <input
                  id="assign-project-role"
                  type="text"
                  value={assignProjectRole}
                  onChange={(e) => setAssignProjectRole(e.target.value)}
                  placeholder={
                    isAr
                      ? 'مثال: مدير موقع / مهندس فني / استشاري...'
                      : 'e.g. Site Engineer, Consultant...'
                  }
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  {isAr ? 'مصفوفة تحديد المسؤوليات (RACI) *' : 'RACI Matrix Role *'}
                </label>
                <div role="radiogroup" aria-label="RACI Role" className="grid grid-cols-4 gap-1.5">
                  {(Object.keys(RACI_CONFIG) as RaciRole[]).map((key) => {
                    const isSelected = assignRaciRole === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setAssignRaciRole(key)}
                        className={`px-1 py-2 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {isAr ? RACI_CONFIG[key].nameAr : RACI_CONFIG[key].nameEn}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {RACI_CONFIG[assignRaciRole]?.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={assigning}
                onClick={handleExecuteAssign}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
              >
                {assigning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isAr ? 'تسكين' : 'Assign'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL 2: Add New Stakeholder (with Unified StakeholderEntitySelect for Company!) ═══ */}
      {canEdit && isAddPersonModalOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px]"
          onClick={() => !creating && setIsAddPersonModalOpen(false)}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-person-modal-title"
            id="add-person-modal"
            onSubmit={handleCreateNewStakeholder}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3
                  id="add-person-modal-title"
                  className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4 text-emerald-500" />
                  <span>
                    {isAr ? 'إضافة شخص جديد للدليل الموحد' : 'Add New Stakeholder to Directory'}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isAr
                    ? 'يُربط مباشرة بالجهة في محفظة الجهات ويمكن تسكينه في مشروع بنفس الخطوة'
                    : 'Linked directly to the central Entities Hub and optionally assigned to a project'}
                </p>
              </div>
              <button
                type="button"
                aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
                onClick={() => setIsAddPersonModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="new-person-name"
                  className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
                >
                  {isAr ? 'الاسم الكامل *' : 'Full Name *'}
                </label>
                <input
                  id="new-person-name"
                  type="text"
                  required
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder={isAr ? 'الاسم بالكامل...' : 'Full Name...'}
                  className={inputCls}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="new-person-kind"
                    className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
                  >
                    {isAr ? 'الفئة *' : 'Category *'}
                  </label>
                  <select
                    id="new-person-kind"
                    value={newPersonKind}
                    onChange={(e) => {
                      const nextKind = e.target.value as StakeholderKind;
                      setNewPersonKind(nextKind);
                      if (nextKind === 'employee') {
                        setNewClientId('');
                        setNewOrgName('Pzoneinternational');
                      }
                    }}
                    className={inputCls}
                  >
                    <option value="employee" className="bg-white dark:bg-slate-900">
                      {isAr ? 'فريق بي زون (موظفون)' : 'Pzone Employees'}
                    </option>
                    <option value="client_rep" className="bg-white dark:bg-slate-900">
                      {isAr ? 'عملاء ومالكون' : 'Client / Owner Rep'}
                    </option>
                    <option value="vendor_rep" className="bg-white dark:bg-slate-900">
                      {isAr ? 'مقاولون وموردون' : 'Contractor / Vendor'}
                    </option>
                    <option value="external_expert" className="bg-white dark:bg-slate-900">
                      {isAr ? 'استشاريون وخبراء' : 'External Consultant / Expert'}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="new-person-role"
                    className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
                  >
                    {isAr ? 'المسمى الوظيفي' : 'Job Title / Role'}
                  </label>
                  <input
                    id="new-person-role"
                    type="text"
                    value={newPersonRole}
                    onChange={(e) => setNewPersonRole(e.target.value)}
                    placeholder={isAr ? 'مثال: مهندس فني...' : 'e.g. Technical Engineer...'}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Unified Entity Dropdown (Replaces free-text organization input!) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  {newPersonKind === 'employee' ? (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                        {isAr ? 'الشركة / الجهة' : 'Organization / Company'}
                      </label>
                      <div className="px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/40 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{isAr ? 'بي زون العالمية (كادر داخلي)' : 'P.Zone International'}</span>
                      </div>
                    </div>
                  ) : (
                    <StakeholderEntitySelect
                      mode="entity"
                      id="new-org-entity-select"
                      label={isAr ? 'الشركة / الجهة التابع لها' : 'Organization / Entity'}
                      entities={dedupedEntities}
                      value={newClientId}
                      legacyDisplayValue={newOrgName}
                      preferredCategories={preferredModalEntityCategories}
                      quickAddType={
                        newPersonKind === 'external_expert'
                          ? 'consultant'
                          : newPersonKind === 'vendor_rep'
                          ? 'subcontractor'
                          : 'client'
                      }
                      allowQuickAdd={canEdit}
                      clearable
                      placeholder={
                        isAr ? 'اختر الشركة من الدليل الموحد...' : 'Select company from hub...'
                      }
                      onSelectEntity={(entity) => {
                        setNewClientId(entity?.id || '');
                        setNewOrgName(entity ? entity.displayNameAr : '');
                      }}
                      onEntityCreated={(createdClient) => {
                        appCache.invalidate('ref:clients');
                        setClients((prev) => [createdClient, ...prev]);
                        setNewClientId(createdClient.id);
                        setNewOrgName(createdClient.name_ar || createdClient.name_en || '');
                      }}
                    />
                  )}
                </div>

                <div>
                  <label
                    htmlFor="new-phone"
                    className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
                  >
                    {isAr ? 'رقم الهاتف' : 'Phone Number'}
                  </label>
                  <input
                    id="new-phone"
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder={isAr ? '010...' : '+20 10...'}
                    dir="ltr"
                    className={`${inputCls} font-mono`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="new-email"
                    className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
                  >
                    {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="name@domain.com"
                    dir="ltr"
                    className={`${inputCls} font-mono`}
                  />
                </div>
                {newPersonKind === 'employee' ? (
                  <div>
                    <label
                      htmlFor="new-emp-code"
                      className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1"
                    >
                      {isAr ? 'الكود الوظيفي' : 'Employee Code'}
                    </label>
                    <input
                      id="new-emp-code"
                      type="text"
                      value={newEmpCode}
                      onChange={(e) => setNewEmpCode(e.target.value)}
                      placeholder="283"
                      className={inputCls}
                    />
                  </div>
                ) : (
                  <div />
                )}
              </div>

              {/* Assign on create */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="assign-on-create-checkbox"
                    type="checkbox"
                    checked={assignOnCreate}
                    onChange={(e) => {
                      setAssignOnCreate(e.target.checked);
                      if (e.target.checked && projects.length > 0 && !createProjectId) {
                        setCreateProjectId(projects[0].id);
                      }
                    }}
                    className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {isAr ? 'تسكينه في مشروع الآن' : 'Assign to a project now'}
                  </span>
                </label>

                {assignOnCreate && (
                  <div className="mt-3 space-y-2.5">
                    <select
                      id="create-project-select"
                      aria-label={isAr ? 'اختر المشروع للتسكين' : 'Select Project to assign'}
                      value={createProjectId}
                      onChange={(e) => setCreateProjectId(e.target.value)}
                      className={inputCls}
                    >
                      {projects.map((p) => {
                        const code = p.project_code || p.code || '';
                        const name =
                          p.project_name ||
                          p.name_ar ||
                          p.name_en ||
                          (code ? `مشروع ${code}` : 'مشروع');
                        return (
                          <option
                            key={p.id}
                            value={p.id}
                            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          >
                            {code ? `#${code} — ` : ''}
                            {name}
                          </option>
                        );
                      })}
                    </select>
                    <input
                      id="create-project-role"
                      type="text"
                      aria-label={isAr ? 'المسمى داخل المشروع' : 'Role in project'}
                      value={createProjectRole}
                      onChange={(e) => setCreateProjectRole(e.target.value)}
                      placeholder={isAr ? 'المسمى داخل المشروع...' : 'Role in project...'}
                      className={inputCls}
                    />
                    <div
                      role="radiogroup"
                      aria-label="Create RACI Role"
                      className="grid grid-cols-4 gap-1.5"
                    >
                      {(Object.keys(RACI_CONFIG) as RaciRole[]).map((key) => {
                        const isSelected = createRaciRole === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setCreateRaciRole(key)}
                            className={`px-1 py-1.5 rounded-lg border text-[10px] font-bold transition-colors cursor-pointer ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                : 'border-slate-200 dark:border-slate-700 text-slate-400'
                            }`}
                          >
                            {isAr ? RACI_CONFIG[key].nameAr : RACI_CONFIG[key].nameEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsAddPersonModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isAr ? 'حفظ في الدليل' : 'Save to Directory'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stakeholder Import Modal (canEdit gated) */}
      {canEdit && (
        <StakeholderImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            loadData();
          }}
        />
      )}

      {/* Official Universal Report Studio Modal */}
      {isReportModalOpen && (
        <UniversalReportModal
          key={`people-report-${filteredStakeholders.length}`}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          title="تقرير دليل الأفراد وممثلي الجهات وكادر المشاريع"
          defaultSubtitle={`إجمالي الأفراد المطابقين للفلترة الحالية: ${filteredStakeholders.length} فرد`}
          columns={reportColumns}
          data={filteredStakeholders}
          kpis={reportKpis}
          lang={isAr ? 'ar' : 'en'}
        />
      )}
    </div>
  );
}
