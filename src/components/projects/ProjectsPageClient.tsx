'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { KPICard } from '@/components/ui/KPICard';
import { ProjectCard } from '@/components/ui/ProjectCard';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { KanbanView } from '@/components/ui/KanbanView';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { ProjectService } from '@/lib/services/project.service';
import {
  deduplicateEntities,
  doesEntityMatchPartyText,
  findCanonicalEntity,
  ENTITY_CATEGORY_META,
} from '@/lib/directory/entityDirectory';
import { getOwnerFromProject } from '@/lib/utils/projectOwner';
import { Project, Client, Governorate, ProjectStatus, PzoneRole } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEnterpriseShell } from '@/components/layout/EnterpriseAppShell';
import { 
  LayoutGrid, 
  List, 
  Columns,
  Plus, 
  FolderKanban, 
  Activity, 
  Droplets, 
  Filter, 
  RotateCcw,
  ArrowUpDown,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  MapPin,
  Archive,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  SlidersHorizontal,
  FileSpreadsheet,
  TrendingUp,
  Clock,
  AlertCircle,
  Banknote,
  Award,
  ShieldAlert,
  AlertTriangle,
  Star,
} from 'lucide-react';
import { RetentionAndBondsReportModal } from '@/components/contracts/RetentionAndBondsReportModal';
import {
  aggregateRetentionBondPortfolio,
  hasTocCertificate,
  computeProjectRetentionBondMetrics,
} from '@/lib/utils/retention-bond-tracking.utils';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useDebounced } from '@/lib/utils/debounce';
import { useCleanupEffect } from '@/lib/utils/useCleanupEffect';
import { ErrorState } from '@/components/ui/ErrorState';
import { matchesRegionFilter, MACRO_REGIONS, MacroRegionId } from '@/lib/geo/regionMatcher';

import { useAuth } from '@/lib/stores/useAuthStore';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { useFavoriteProjects } from '@/lib/hooks/useFavoriteProjects';
import { canAccessPath } from '@/lib/rbac/access-control';
import { isFocusedProjectsMode } from '@/lib/config/module-visibility';
import dynamic from 'next/dynamic';
import { LocationAnalyticsMapSkeleton } from '@/components/dashboard/DashboardSkeletons';

const LocationAnalyticsMap = dynamic(
  () => import('@/components/dashboard/sections/LocationAnalyticsMap').then((mod) => mod.LocationAnalyticsMap),
  {
    ssr: false,
    loading: () => <LocationAnalyticsMapSkeleton />,
  }
);

function parseNum(val: unknown): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/,/g, '').replace(/\s/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

const ALLOWED_TABS = ['table', 'card', 'kanban', 'map'] as const;
type ViewMode = (typeof ALLOWED_TABS)[number];

export function ProjectsPageClient() {
  const { user } = useAuth();
  const { roles, isAdmin } = useUserRoles();
  const { locale, t } = useLanguage();
  const isAr = locale === 'ar';
  const { isDark } = useEnterpriseShell();

  const router = useRouter();
  const rawPathname = typeof usePathname === 'function' ? usePathname() : '/projects';
  const pathname = rawPathname || '/projects';
  const searchParams = useSearchParams();

  const normalizeStatusFilter = (val?: string | null): string => {
    if (!val) return 'all';
    const trimmed = val.trim();
    return trimmed.toLowerCase() === 'all' ? 'all' : trimmed;
  };

  // Read initial query params for deep-linking (tab, search, status, region, role, client, owner, pm)
  const rawTab = (searchParams?.get('tab') || searchParams?.get('view') || '') as string;
  const initialTab: ViewMode = ALLOWED_TABS.includes(rawTab as ViewMode) ? (rawTab as ViewMode) : 'table';
  const initialSearch = searchParams?.get('search') || '';
  const initialStatus = normalizeStatusFilter(searchParams?.get('status'));
  const initialRegion = searchParams?.get('region') || searchParams?.get('gov') || searchParams?.get('governorate') || 'all';
  const initialRole = searchParams?.get('role') || 'all';
  const initialClient = searchParams?.get('client') || 'all';
  const initialOwner = searchParams?.get('owner') || 'all';
  const initialPM = searchParams?.get('pm') || 'all';
  const initialHardcopyMissing = searchParams?.get('hardcopy') === 'missing';
  const initialOnlyFavorites = searchParams?.get('fav') === '1';

  const { favoriteIds, toggleFavorite } = useFavoriteProjects(
    user?.id,
    user?.user_metadata?.favorite_project_ids
  );

  const [viewMode, setViewMode] = useState<ViewMode>(initialTab);
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // Search with debounce & clear button
  const [search, setSearch] = useState(initialSearch);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounced(search, 300);

  // Primary filters
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [selectedRole, setSelectedRole] = useState<string>(initialRole);
  const [selectedClient, setSelectedClient] = useState<string>(initialClient);
  const [selectedOwner, setSelectedOwner] = useState<string>(initialOwner);
  const [selectedGov, setSelectedGov] = useState<string>(initialRegion);
  const [selectedPM, setSelectedPM] = useState<string>(initialPM);

  // Advanced numeric ranges
  const [sortBy, setSortBy] = useState<string>('value');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minContractValue, setMinContractValue] = useState<string>('');
  const [maxContractValue, setMaxContractValue] = useState<string>('');
  const [minWaterArea, setMinWaterArea] = useState<string>('');
  const [onlyWithVos, setOnlyWithVos] = useState(false);
  const [onlyMissingHardcopy, setOnlyMissingHardcopy] = useState(initialHardcopyMissing);
  const [onlyMissingToc, setOnlyMissingToc] = useState(false);
  const [onlyWithToc, setOnlyWithToc] = useState(false);
  const [onlyMissedBonds, setOnlyMissedBonds] = useState(false);
  const [onlyFavorites, setOnlyFavorites] = useState(initialOnlyFavorites);
  const [isRetentionReportOpen, setIsRetentionReportOpen] = useState(false);
  const [showExtendedKpis, setShowExtendedKpis] = useState(false);

  // Card view pagination
  const [cardPage, setCardPage] = useState<number>(1);
  const [cardPageSize, setCardPageSize] = useState<number>(12);

  // Track outward URL sync targets so stale in-flight searchParams never overwrite active viewMode (e.g. 'map' -> 'table')
  const pendingTargetQueryRef = useRef<string | null>(null);
  const pendingSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pendingSyncTimerRef.current) clearTimeout(pendingSyncTimerRef.current);
    };
  }, []);

  // 1. Inward URL Sync: Update state ONLY when searchParams change externally (e.g. Back/Forward or Navbar link)
  useEffect(() => {
    if (!searchParams) return;
    const incomingQuery = searchParams.toString();

    if (pendingTargetQueryRef.current !== null) {
      if (incomingQuery === pendingTargetQueryRef.current) {
        pendingTargetQueryRef.current = null;
        if (pendingSyncTimerRef.current) {
          clearTimeout(pendingSyncTimerRef.current);
          pendingSyncTimerRef.current = null;
        }
      }
      return;
    }

    const currentTabParam = (searchParams.get('tab') || searchParams.get('view') || '') as string;
    const nextTab = ALLOWED_TABS.includes(currentTabParam as ViewMode) ? (currentTabParam as ViewMode) : 'table';
    setViewMode((prev) => (prev !== nextTab ? nextTab : prev));

    const nextSearch = searchParams.get('search') || '';
    setSearch((prev) => (prev !== nextSearch ? nextSearch : prev));

    const nextStatus = normalizeStatusFilter(searchParams.get('status'));
    setSelectedStatus((prev) => (prev !== nextStatus ? nextStatus : prev));

    const nextRegion = searchParams.get('region') || searchParams.get('gov') || searchParams.get('governorate') || 'all';
    setSelectedGov((prev) => (prev !== nextRegion ? nextRegion : prev));

    const nextRole = searchParams.get('role') || 'all';
    setSelectedRole((prev) => (prev !== nextRole ? nextRole : prev));

    const nextClient = searchParams.get('client') || 'all';
    setSelectedClient((prev) => (prev !== nextClient ? nextClient : prev));

    const nextOwner = searchParams.get('owner') || 'all';
    setSelectedOwner((prev) => (prev !== nextOwner ? nextOwner : prev));

    const nextPM = searchParams.get('pm') || 'all';
    setSelectedPM((prev) => (prev !== nextPM ? nextPM : prev));

    const nextHardcopy = searchParams.get('hardcopy');
    if (nextHardcopy === 'missing') {
      setOnlyMissingHardcopy(true);
    }

    const nextFav = searchParams.get('fav');
    setOnlyFavorites(nextFav === '1');
  }, [searchParams]);

  // 2. Outward URL Sync: Keep URL query parameters in sync with active tab and filters without resetting viewMode
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (!router) return;
    const navigateUrl = typeof router.replace === 'function' ? router.replace : router.push;
    if (typeof navigateUrl !== 'function') return;

    const currentTab = searchParams?.get('tab') || searchParams?.get('view') || 'table';
    const currentSearch = searchParams?.get('search') || '';
    const currentStatus = normalizeStatusFilter(searchParams?.get('status'));
    const currentRegion = searchParams?.get('region') || searchParams?.get('gov') || searchParams?.get('governorate') || 'all';
    const currentRole = searchParams?.get('role') || 'all';
    const currentClient = searchParams?.get('client') || 'all';
    const currentOwner = searchParams?.get('owner') || 'all';
    const currentPM = searchParams?.get('pm') || 'all';
    const currentHardcopy = searchParams?.get('hardcopy') || '';
    const currentFav = searchParams?.get('fav') || '';

    const normalizedSelectedStatus = normalizeStatusFilter(selectedStatus);
    const tabMatches = viewMode === currentTab;
    const searchMatches = debouncedSearch.trim() === currentSearch.trim();
    const statusMatches = normalizedSelectedStatus === currentStatus;
    const regionMatches = selectedGov === currentRegion;
    const roleMatches = selectedRole === currentRole;
    const clientMatches = selectedClient === currentClient;
    const ownerMatches = selectedOwner === currentOwner;
    const pmMatches = selectedPM === currentPM;
    const hardcopyMatches = onlyMissingHardcopy ? currentHardcopy === 'missing' : !currentHardcopy;
    const favMatches = onlyFavorites ? currentFav === '1' : !currentFav;

    if (tabMatches && searchMatches && statusMatches && regionMatches && roleMatches && clientMatches && ownerMatches && pmMatches && hardcopyMatches && favMatches) {
      return;
    }

    const params = new URLSearchParams(searchParams?.toString() || '');

    // Tab
    if (viewMode !== 'table') {
      params.set('tab', viewMode);
      params.delete('view');
    } else {
      params.delete('tab');
      params.delete('view');
    }

    // Search
    if (debouncedSearch.trim()) {
      params.set('search', debouncedSearch.trim());
    } else {
      params.delete('search');
    }

    // Status
    if (normalizedSelectedStatus && normalizedSelectedStatus !== 'all') {
      params.set('status', normalizedSelectedStatus);
    } else {
      params.delete('status');
    }

    // Region
    if (selectedGov && selectedGov !== 'all') {
      params.set('region', selectedGov);
      params.delete('gov');
      params.delete('governorate');
    } else {
      params.delete('region');
      params.delete('gov');
      params.delete('governorate');
    }

    // Role
    if (selectedRole && selectedRole !== 'all') {
      params.set('role', selectedRole);
    } else {
      params.delete('role');
    }

    // Client
    if (selectedClient && selectedClient !== 'all') {
      params.set('client', selectedClient);
    } else {
      params.delete('client');
    }

    // Owner
    if (selectedOwner && selectedOwner !== 'all') {
      params.set('owner', selectedOwner);
    } else {
      params.delete('owner');
    }

    // PM
    if (selectedPM && selectedPM !== 'all') {
      params.set('pm', selectedPM);
    } else {
      params.delete('pm');
    }

    // Hardcopy missing filter
    if (onlyMissingHardcopy) {
      params.set('hardcopy', 'missing');
    } else {
      params.delete('hardcopy');
    }

    // Favorites filter
    if (onlyFavorites) {
      params.set('fav', '1');
    } else {
      params.delete('fav');
    }

    const queryString = params.toString();
    pendingTargetQueryRef.current = queryString;
    if (pendingSyncTimerRef.current) clearTimeout(pendingSyncTimerRef.current);
    pendingSyncTimerRef.current = setTimeout(() => {
      pendingTargetQueryRef.current = null;
      pendingSyncTimerRef.current = null;
    }, 1500);

    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
    navigateUrl(targetUrl, { scroll: false });
  }, [
    viewMode,
    debouncedSearch,
    selectedStatus,
    selectedGov,
    selectedRole,
    selectedClient,
    selectedOwner,
    selectedPM,
    onlyMissingHardcopy,
    onlyFavorites,
    pathname,
    router,
    searchParams
  ]);

  // Governance Auto-Redirect: Technical Office engineers belong in /to-tasks, not the company-wide financial hub
  useEffect(() => {
    if (isFocusedProjectsMode()) return;
    if (!roles || roles.length === 0) return;
    const hasElevated = isAdmin || (roles || []).some((r) =>
      ['admin', 'ceo', 'coo', 'commercial_manager', 'planning_manager', 'project_manager'].includes(String(r).toLowerCase())
    );
    if (!hasElevated && (roles || []).some((r) => String(r).toLowerCase().includes('technical_office'))) {
      router.replace('/to-tasks');
    }
  }, [roles, isAdmin, router]);

  // Reset card page when filters or search change
  useEffect(() => {
    setCardPage(1);
  }, [debouncedSearch, selectedStatus, selectedRole, selectedClient, selectedOwner, selectedGov, selectedPM, minContractValue, maxContractValue, minWaterArea, onlyWithVos, onlyMissingHardcopy, onlyMissingToc, onlyWithToc, onlyMissedBonds, onlyFavorites]);

  const handleSortChange = (col: string) => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortOrder('asc');
    }
  };

  useCleanupEffect(async (isCancelled) => {
    setLoading(true);
    setError(null);
    try {
      const allowedIds = await ProjectService.getUserAssignedProjectIds(user?.email, roles);

      const [projData, clientData, govData] = await Promise.all([
        ProjectService.getProjects({}, allowedIds),
        ProjectService.getClients(),
        ProjectService.getGovernorates(),
      ]);

      if (!isCancelled()) {
        setProjects(projData);
        setClients(clientData);
        setGovernorates(govData);
      }
    } catch (rawErr: unknown) {
      const err = rawErr as { message?: string };
      console.error('Failed to load projects:', err);
      if (!isCancelled()) {
        setError(err?.message || (locale === 'ar' ? 'تعذر استرجاع قائمة المشاريع' : 'Failed to load projects'));
      }
    } finally {
      if (!isCancelled()) {
        setLoading(false);
      }
    }
  }, [user?.email, roles, reloadTrigger]);

  // Unique Project Managers for filter
  const pmOptions: SelectOption[] = useMemo(() => {
    const pmSet = new Set<string>();
    projects.forEach((p) => {
      const pm = p.pm_full_name || p.project_manager_name_raw || p.project_manager;
      if (pm && pm.trim()) pmSet.add(pm.trim());
    });
    return [
      { value: 'all', label: isAr ? 'جميع مديري المشاريع' : 'All Project Managers' },
      ...Array.from(pmSet).map((pm) => ({ value: pm, label: pm })),
    ];
  }, [projects, isAr]);

  // Deduplicated Canonical Entities from Central Directory (excludes TEST-999, merges HAC/Orascom aliases)
  const dedupedEntities = useMemo(() => deduplicateEntities(clients), [clients]);

  const resolvedSelectedClient = useMemo(() => {
    if (!selectedClient || selectedClient === 'all') return 'all';
    const canonical = findCanonicalEntity(dedupedEntities, selectedClient);
    return canonical ? canonical.id : selectedClient;
  }, [selectedClient, dedupedEntities]);

  const resolvedSelectedOwner = useMemo(() => {
    if (!selectedOwner || selectedOwner === 'all') return 'all';
    const canonical = findCanonicalEntity(dedupedEntities, selectedOwner);
    return canonical ? canonical.id : selectedOwner;
  }, [selectedOwner, dedupedEntities]);

  // Filtered & Sorted Projects
  const processedProjects = useMemo(() => {
    let list = [...projects];

    const minVal = parseFloat(minContractValue);
    const maxVal = parseFloat(maxContractValue);
    const minArea = parseFloat(minWaterArea);

    if (!isNaN(minVal) && minVal > 0) {
      list = list.filter((p) => parseNum(p.total_contract_value || p.contract_value_egp || p.contract_value) >= minVal);
    }

    if (!isNaN(maxVal) && maxVal > 0) {
      list = list.filter((p) => parseNum(p.total_contract_value || p.contract_value_egp || p.contract_value) <= maxVal);
    }

    if (!isNaN(minArea) && minArea > 0) {
      list = list.filter((p) => parseNum(p.water_area_m2) >= minArea);
    }

    if (selectedPM !== 'all') {
      list = list.filter((p) => (p.pm_full_name || p.project_manager_name_raw || p.project_manager || '') === selectedPM);
    }

    if (selectedClient !== 'all') {
      const selectedEntity = findCanonicalEntity(dedupedEntities, selectedClient);
      if (selectedEntity) {
        list = list.filter((p) => {
          const cId = p.client_id || p.client?.id;
          if (cId && selectedEntity.aliasIds.includes(cId)) return true;
          const cName =
            p.client?.name_ar ||
            p.client_name_ar ||
            p.client_name ||
            p.client_name_raw ||
            p.client?.name_en;
          return doesEntityMatchPartyText(selectedEntity, cName);
        });
      } else {
        list = list.filter((p) => {
          const cId = p.client_id || p.client?.id;
          const cName = p.client?.name_ar || p.client_name_raw || p.client?.name_en;
          return cId === selectedClient || cName === selectedClient;
        });
      }
    }

    if (selectedOwner !== 'all') {
      const ownerEntity = findCanonicalEntity(dedupedEntities, selectedOwner);
      if (ownerEntity) {
        list = list.filter((p) => {
          const ownerClientId = p.metadata?.owner_client_id;
          if (ownerClientId && ownerEntity.aliasIds.includes(ownerClientId)) return true;
          const resolvedOwnerText = p.metadata?.owner_name || getOwnerFromProject(p);
          if (doesEntityMatchPartyText(ownerEntity, resolvedOwnerText)) return true;
          if (
            ownerEntity.category === 'owner_developer' &&
            (!resolvedOwnerText || resolvedOwnerText === 'غير محدد')
          ) {
            const cId = p.client_id || p.client?.id;
            const cName = p.client?.name_ar || p.client_name_raw || p.client?.name_en;
            return Boolean(cId && ownerEntity.aliasIds.includes(cId)) || doesEntityMatchPartyText(ownerEntity, cName);
          }
          return false;
        });
      } else {
        list = list.filter((p) => {
          const resolvedOwnerText = p.metadata?.owner_name || getOwnerFromProject(p);
          return resolvedOwnerText === selectedOwner;
        });
      }
    }

    if (debouncedSearch.trim() !== '') {
      const q = debouncedSearch.trim().toLowerCase();
      list = list.filter((p) => {
        const code = (p.project_code || p.code || '').toLowerCase();
        const nameAr = (p.project_name || p.name_ar || '').toLowerCase();
        const nameEn = (p.project_name_en || p.name_en || '').toLowerCase();
        const clientText = (
          p.client_name_raw ||
          p.client?.name_ar ||
          p.client?.name_en ||
          p.client_name_ar ||
          p.client_name ||
          ''
        ).toLowerCase();
        const ownerText = (p.metadata?.owner_name || getOwnerFromProject(p) || '').toLowerCase();
        const locText = (
          p.governorate?.name_ar ||
          p.governorate?.name_en ||
          p.site_location_address ||
          p.location ||
          ''
        ).toLowerCase();
        const pmText = (p.pm_full_name || p.project_manager_name_raw || p.project_manager || '').toLowerCase();
        return (
          code.includes(q) ||
          nameAr.includes(q) ||
          nameEn.includes(q) ||
          clientText.includes(q) ||
          ownerText.includes(q) ||
          locText.includes(q) ||
          pmText.includes(q)
        );
      });
    }

    if (selectedGov && selectedGov !== 'all') {
      list = list.filter((p) => {
        const pGovId = p.governorate_id || p.governorate?.id;
        if (pGovId && pGovId.toLowerCase() === selectedGov.toLowerCase()) {
          return true;
        }
        return matchesRegionFilter(p, selectedGov);
      });
    }

    const normalizedSelectedStatus = normalizeStatusFilter(selectedStatus);
    if (normalizedSelectedStatus && normalizedSelectedStatus !== 'all') {
      list = list.filter((p) => p.status === normalizedSelectedStatus);
    }

    if (selectedRole && selectedRole !== 'all') {
      list = list.filter((p) => p.pzone_role === selectedRole);
    }

    if (onlyWithVos) {
      list = list.filter((p) => parseNum(p.vos_value) > 0);
    }

    if (onlyMissingHardcopy) {
      list = list.filter((p) => {
        const hs = (p as any).hardcopy_status;
        return !hs || hs === 'غير موجود hard copy معتمد' || hs === 'غير مكتمل' || hs === 'None';
      });
    }

    if (onlyMissingToc) {
      list = list.filter(
        (p) => (p.status === 'finished' || p.status === 'handing_over') && !hasTocCertificate(p)
      );
    }

    if (onlyWithToc) {
      list = list.filter(
        (p) => (p.status === 'finished' || p.status === 'handing_over') && hasTocCertificate(p)
      );
    }

    if (onlyMissedBonds) {
      list = list.filter((p) => computeProjectRetentionBondMetrics(p).isMissedBondOrRetention);
    }

    if (onlyFavorites) {
      list = list.filter((p) => favoriteIds.has(p.id));
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'favorites') {
        const favA = favoriteIds.has(a.id) ? 1 : 0;
        const favB = favoriteIds.has(b.id) ? 1 : 0;
        if (favA !== favB) {
          return sortOrder === 'asc' ? favA - favB : favB - favA;
        }
        const vA = parseNum(a.total_contract_value || a.contract_value_egp || a.contract_value);
        const vB = parseNum(b.total_contract_value || b.contract_value_egp || b.contract_value);
        return vB - vA;
      }

      let valA = 0;
      let valB = 0;

      if (sortBy === 'value') {
        valA = parseNum(a.total_contract_value || a.contract_value_egp || a.contract_value);
        valB = parseNum(b.total_contract_value || b.contract_value_egp || b.contract_value);
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      } else if (sortBy === 'vos_value') {
        valA = parseNum(a.vos_value);
        valB = parseNum(b.vos_value);
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      } else if (sortBy === 'area') {
        valA = parseNum(a.water_area_m2);
        valB = parseNum(b.water_area_m2);
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      } else if (sortBy === 'completion') {
        valA = parseNum(a.completion_pct);
        valB = parseNum(b.completion_pct);
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      } else if (sortBy === 'code') {
        const codeA = String(a.project_code || '');
        const codeB = String(b.project_code || '');
        return sortOrder === 'asc'
          ? codeA.localeCompare(codeB, undefined, { numeric: true })
          : codeB.localeCompare(codeA, undefined, { numeric: true });
      } else if (sortBy === 'name') {
        const nameA = a.project_name || '';
        const nameB = b.project_name || '';
        return sortOrder === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      } else if (sortBy === 'client') {
        const clientA = a.client?.name_ar || a.client_name_raw || '';
        const clientB = b.client?.name_ar || b.client_name_raw || '';
        return sortOrder === 'asc' ? clientA.localeCompare(clientB) : clientB.localeCompare(clientA);
      } else if (sortBy === 'pm') {
        const pmA = a.pm_full_name || a.project_manager_name_raw || a.project_manager || '';
        const pmB = b.pm_full_name || b.project_manager_name_raw || b.project_manager || '';
        return sortOrder === 'asc' ? pmA.localeCompare(pmB) : pmB.localeCompare(pmA);
      } else if (sortBy === 'client_pm') {
        const cpmA = a.client?.contact_person || a.client_representative || '';
        const cpmB = b.client?.contact_person || b.client_representative || '';
        return sortOrder === 'asc' ? cpmA.localeCompare(cpmB) : cpmB.localeCompare(cpmA);
      } else if (sortBy === 'location') {
        const locA = a.governorate?.name_ar || a.site_location_address || '';
        const locB = b.governorate?.name_ar || b.site_location_address || '';
        return sortOrder === 'asc' ? locA.localeCompare(locB) : locB.localeCompare(locA);
      } else if (sortBy === 'role') {
        const roleA = a.pzone_role || '';
        const roleB = b.pzone_role || '';
        return sortOrder === 'asc' ? roleA.localeCompare(roleB) : roleB.localeCompare(roleA);
      } else if (sortBy === 'status') {
        const statusA = a.status || '';
        const statusB = b.status || '';
        return sortOrder === 'asc' ? statusA.localeCompare(statusB) : statusB.localeCompare(statusA);
      }

      return 0;
    });

    return list;
  }, [projects, dedupedEntities, debouncedSearch, sortBy, sortOrder, minContractValue, maxContractValue, minWaterArea, selectedPM, selectedClient, selectedOwner, selectedGov, selectedStatus, selectedRole, onlyWithVos, onlyMissingHardcopy, onlyMissingToc, onlyWithToc, onlyMissedBonds, onlyFavorites, favoriteIds]);

  // Card view sliced items
  const cardTotalCount = processedProjects.length;
  const cardTotalPages = Math.max(1, Math.ceil(cardTotalCount / cardPageSize));
  const cardStartIndex = (cardPage - 1) * cardPageSize;
  const cardEndIndex = Math.min(cardStartIndex + cardPageSize, cardTotalCount);
  const pagedCardProjects = useMemo(() => {
    return processedProjects.slice(cardStartIndex, cardEndIndex);
  }, [processedProjects, cardStartIndex, cardEndIndex]);

  // Dynamic KPIs derived from processed projects
  const kpis = useMemo(() => {
    const totalProjects = processedProjects.length;
    const activeProjects = processedProjects.filter((p) => (p.status as string) === 'working' || (p.status as string) === 'active').length;
    const handingOverProjects = processedProjects.filter((p) => (p.status as string) === 'handing_over').length;
    const finishedProjects = processedProjects.filter((p) => (p.status as string) === 'finished').length;
    const onHoldProjects = processedProjects.filter((p) => (p.status as string) === 'on_hold').length;
    const tenderProjects = processedProjects.filter((p) => (p.status as string) === 'tender').length;

    // Financial Breakdown: Base Contracts, VOs, and Net Total
    const totalBaseContractValue = processedProjects.reduce(
      (acc, p) => acc + parseNum(p.contract_value_egp || p.contract_value),
      0
    );
    const totalVosValue = processedProjects.reduce(
      (acc, p) => acc + parseNum(p.vos_value),
      0
    );
    const totalContractValue = processedProjects.reduce(
      (acc, p) => acc + parseNum(p.total_contract_value || (parseNum(p.contract_value_egp || p.contract_value) + parseNum(p.vos_value))),
      0
    );
    const projectsWithVosCount = processedProjects.filter((p) => parseNum(p.vos_value) > 0).length;

    const totalWaterArea = processedProjects.reduce(
      (acc, p) => acc + parseNum(p.water_area_m2),
      0
    );
    const totalWaterVolume = processedProjects.reduce(
      (acc, p) => acc + parseNum(p.water_vol_m3 || p.total_water_volume_m3),
      0
    );

    const activeList = processedProjects.filter((p) => (p.status as string) === 'working');
    const avgCompletion = activeList.length > 0
      ? Math.round(activeList.reduce((acc, p) => acc + parseNum(p.completion_pct), 0) / activeList.length)
      : 0;

    const missingHardcopyCount = projects.filter((p) => {
      const hs = (p as any).hardcopy_status;
      return !hs || hs === 'غير موجود hard copy معتمد' || hs === 'غير مكتمل' || hs === 'None';
    }).length;

    const portfolioStats = aggregateRetentionBondPortfolio(projects);
    const finishedWithoutTocCount = portfolioStats.finishedWithoutTocCount;
    const finishedWithTocCount = portfolioStats.finishedWithTocCount;
    const missedBondsCount = portfolioStats.missedAnyCount;

    return {
      totalProjects,
      activeProjects,
      handingOverProjects,
      finishedProjects,
      onHoldProjects,
      tenderProjects,
      totalBaseContractValue,
      totalVosValue,
      totalContractValue,
      projectsWithVosCount,
      missingHardcopyCount,
      finishedWithoutTocCount,
      finishedWithTocCount,
      missedBondsCount,
      totalWaterArea,
      totalWaterVolume,
      avgCompletion,
    };
  }, [processedProjects, projects]);

  const statusOptions: SelectOption[] = useMemo(() => [
    { value: 'all', label: t('projects.all_statuses') },
    { value: 'tender', label: isAr ? 'مرحلة العطاء' : 'Tender / Bidding' },
    { value: 'not_started', label: t('statuses.not_started') },
    { value: 'working', label: t('statuses.working') },
    { value: 'on_hold', label: t('statuses.on_hold') },
    { value: 'handing_over', label: t('statuses.handing_over') },
    { value: 'finished', label: t('statuses.finished') },
    { value: 'cancelled', label: t('statuses.cancelled') },
  ], [t, isAr]);

  const roleOptions: SelectOption[] = useMemo(() => [
    { value: 'all', label: t('projects.all_roles') },
    { value: 'Main Contractor', label: isAr ? 'مقاول عام' : 'Main Contractor' },
    { value: 'Sub Contractor', label: isAr ? 'مقاول باطن' : 'Sub Contractor' },
  ], [t, isAr]);

  const clientOptions: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = [
      { value: 'all', label: isAr ? 'جميع العملاء التعاقديين' : t('projects.all_clients') },
      ...dedupedEntities.map((entity) => {
        const catMeta = ENTITY_CATEGORY_META[entity.category];
        return {
          value: entity.id,
          label: isAr ? entity.displayNameAr : entity.displayNameEn,
          subLabel: [isAr ? catMeta.shortAr : catMeta.shortEn, entity.canonicalCode || undefined]
            .filter(Boolean)
            .join(' • '),
          searchTerms: entity.searchIndex,
          badge: entity.canonicalCode ? (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {entity.canonicalCode}
            </span>
          ) : undefined,
        };
      }),
    ];

    projects.forEach((p) => {
      const rawName = (p.client_name_raw || p.client?.name_ar || '').trim();
      if (
        rawName &&
        !/test-999/i.test(rawName) &&
        !findCanonicalEntity(dedupedEntities, rawName) &&
        !options.some((o) => o.value === rawName || o.label === rawName)
      ) {
        options.push({ value: rawName, label: rawName });
      }
    });

    return options;
  }, [dedupedEntities, projects, isAr, t]);

  const ownerOptions: SelectOption[] = useMemo(() => {
    const linkedOwnerIds = new Set<string>();
    const unlinkedOwnerNames = new Set<string>();

    projects.forEach((p) => {
      const ownerClientId = p.metadata?.owner_client_id;
      const resolvedOwner = (p.metadata?.owner_name || getOwnerFromProject(p) || '').trim();
      const matchedById = ownerClientId ? findCanonicalEntity(dedupedEntities, ownerClientId) : null;
      const matchedByText =
        resolvedOwner && resolvedOwner !== 'غير محدد'
          ? findCanonicalEntity(dedupedEntities, resolvedOwner)
          : null;
      if (matchedById) linkedOwnerIds.add(matchedById.id);
      if (matchedByText) linkedOwnerIds.add(matchedByText.id);
      if (
        resolvedOwner &&
        resolvedOwner !== 'غير محدد' &&
        !matchedById &&
        !matchedByText &&
        !/test-999/i.test(resolvedOwner)
      ) {
        unlinkedOwnerNames.add(resolvedOwner);
      }
    });

    const sortedEntities = [...dedupedEntities].sort((a, b) => {
      const aScore = (a.category === 'owner_developer' ? 2 : 0) + (linkedOwnerIds.has(a.id) ? 1 : 0);
      const bScore = (b.category === 'owner_developer' ? 2 : 0) + (linkedOwnerIds.has(b.id) ? 1 : 0);
      if (aScore !== bScore) return bScore - aScore;
      return a.displayNameAr.localeCompare(b.displayNameAr, 'ar');
    });

    const options: SelectOption[] = [
      { value: 'all', label: isAr ? 'جميع الملاك والمطورين' : 'All Owners & Developers' },
      ...sortedEntities.map((entity) => {
        const catMeta = ENTITY_CATEGORY_META[entity.category];
        return {
          value: entity.id,
          label: isAr ? entity.displayNameAr : entity.displayNameEn,
          subLabel: [isAr ? catMeta.shortAr : catMeta.shortEn, entity.canonicalCode || undefined]
            .filter(Boolean)
            .join(' • '),
          searchTerms: entity.searchIndex,
          badge: (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border shrink-0 ${catMeta.badgeCls}`}>
              {isAr ? catMeta.shortAr : catMeta.shortEn}
            </span>
          ),
        };
      }),
      ...Array.from(unlinkedOwnerNames).map((name) => ({
        value: name,
        label: name,
        subLabel: isAr ? 'مالك مسجل بالمشروع' : 'Project Owner',
      })),
    ];

    return options;
  }, [dedupedEntities, projects, isAr]);

  const govOptions: SelectOption[] = useMemo(() => {
    const options: SelectOption[] = [
      { value: 'all', label: t('projects.all_govs') },
      { value: 'coast', label: isAr ? '🏖️ الساحل الشمالي والعلمين' : '🏖️ North Coast & Alamein' },
      { value: 'cairo', label: isAr ? '🏛️ القاهرة الكبرى والعاصمة' : '🏛️ Greater Cairo & New Capital' },
      { value: 'gouna', label: isAr ? '🌊 الجونة والبحر الأحمر' : '🌊 El Gouna & Red Sea' },
      { value: 'upper', label: isAr ? '🌴 الأقصر والصعيد' : '🌴 Upper Egypt & Luxor' },
      ...governorates.map((g) => ({ value: g.id, label: locale === 'ar' ? g.name_ar : (g.name_en || g.name_ar) })),
    ];

    if (selectedGov && selectedGov !== 'all' && !options.some((o) => o.value === selectedGov)) {
      const macroMeta = MACRO_REGIONS[selectedGov as Exclude<MacroRegionId, 'all'>];
      if (macroMeta) {
        options.push({ value: selectedGov, label: isAr ? macroMeta.labelAr : macroMeta.labelEn });
      } else {
        options.push({ value: selectedGov, label: selectedGov });
      }
    }

    return options;
  }, [governorates, selectedGov, locale, t, isAr]);

  const favoriteProjectsCount = useMemo(
    () => projects.filter((p) => favoriteIds.has(p.id)).length,
    [projects, favoriteIds]
  );

  const sortOptions: SelectOption[] = useMemo(() => [
    { value: 'favorites', label: isAr ? 'المفضلة أولاً' : 'Favorites First' },
    { value: 'code', label: isAr ? 'كود المشروع' : 'Project Code' },
    { value: 'name', label: isAr ? 'اسم المشروع' : 'Project Name' },
    { value: 'client', label: isAr ? 'العميل' : 'Client' },
    { value: 'role', label: isAr ? 'دور بي زون' : 'PZone Role' },
    { value: 'status', label: isAr ? 'الحالة' : 'Status' },
    { value: 'value', label: isAr ? 'قيمة العقد' : 'Contract Value' },
    { value: 'area', label: isAr ? 'المسطح المائي' : 'Water Area' },
    { value: 'completion', label: isAr ? 'نسبة الإنجاز' : 'Completion %' },
  ], [isAr]);

  const activeFilterCount =
    (selectedPM !== 'all' ? 1 : 0) +
    (selectedClient !== 'all' ? 1 : 0) +
    (selectedOwner !== 'all' ? 1 : 0) +
    (selectedGov !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (selectedRole !== 'all' ? 1 : 0) +
    (search.trim() !== '' ? 1 : 0) +
    (minContractValue ? 1 : 0) +
    (maxContractValue ? 1 : 0) +
    (minWaterArea ? 1 : 0) +
    (onlyWithVos ? 1 : 0) +
    (onlyMissingHardcopy ? 1 : 0) +
    (onlyMissingToc ? 1 : 0) +
    (onlyWithToc ? 1 : 0) +
    (onlyMissedBonds ? 1 : 0) +
    (onlyFavorites ? 1 : 0);

  const resetFilters = () => {
    setSearch('');
    setSelectedStatus('all');
    setSelectedRole('all');
    setSelectedClient('all');
    setSelectedOwner('all');
    setSelectedGov('all');
    setSortBy('value');
    setSortOrder('desc');
    setMinContractValue('');
    setMaxContractValue('');
    setMinWaterArea('');
    setSelectedPM('all');
    setOnlyWithVos(false);
    setOnlyMissingHardcopy(false);
    setOnlyMissingToc(false);
    setOnlyWithToc(false);
    setOnlyMissedBonds(false);
    setOnlyFavorites(false);
    setCardPage(1);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const formattedBaseContractValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(kpis.totalBaseContractValue);

  const formattedVosValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(kpis.totalVosValue);

  const formattedTotalValue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(kpis.totalContractValue);

  const formattedTotalWaterArea = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(kpis.totalWaterArea);

  const formattedTotalWaterVolume = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(kpis.totalWaterVolume);

  const vosPctOfBase = kpis.totalBaseContractValue > 0
    ? ((kpis.totalVosValue / kpis.totalBaseContractValue) * 100).toFixed(1)
    : '0';

  const { data: dbAccessRules } = useModuleAccess();
  const canCreateProject = useMemo(() => {
    if (isAdmin) return true;
    return (roles || []).some((r) =>
      ['admin', 'ceo', 'coo', 'commercial_manager', 'planning_manager'].includes(String(r).toLowerCase())
    );
  }, [roles, isAdmin]);

  return (
    <div className="w-full space-y-6">
      {/* Top Bar / Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              {t('projects.title')}
            </h1>
            <span
              role="status"
              aria-live="polite"
              className="px-3 py-1 rounded-full text-xs font-black font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0 shadow-2xs"
            >
              {loading ? (isAr ? 'جاري التحميل...' : 'Loading...') : `${processedProjects.length} ${isAr ? 'مشروع' : 'Projects'}`}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
            {t('projects.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!isFocusedProjectsMode() && (
            <Link
              href="/projects/dashboard"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
              title={isAr ? 'فتح لوحة التحليلات التنفيذية الشاملة' : 'Open Executive Analytics Dashboard'}
            >
              <Activity className="w-4 h-4 text-emerald-500" aria-hidden="true" />
              <span>{isAr ? 'التحليلات التنفيذية' : 'Analytics'}</span>
            </Link>
          )}

          <Link
            href="/projects/archive"
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 font-bold text-xs hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
            aria-label={isAr ? 'الانتقال إلى بنك الأرشيف' : 'Go to Archive'}
          >
            <Archive className="w-4 h-4" aria-hidden="true" />
            <span>{isAr ? 'بنك الأرشيف' : 'Archive'}</span>
          </Link>

          {canCreateProject && (
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 cursor-pointer"
              aria-label={t('projects.new_project')}
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>{t('projects.new_project')}</span>
            </Link>
          )}
        </div>
      </div>

      {/* Summary KPIs & Telemetry: Permanent 2-Row Executive Grid */}
      <div className="space-y-3.5">
        {/* HUD Sub-header: Live Status Strip & Quick Reset */}
        <div className="flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {isAr ? 'مؤشرات المحفظة والتعاقدات التشغيلية' : 'Portfolio & Operational Telemetry'}
            </span>

            {/* Active filter badges */}
            {onlyWithVos && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 animate-in fade-in">
                <span>{isAr ? 'تصفية: مشاريع أوامر التغيير فقط' : 'Filter: VOs Projects Only'}</span>
                <button
                  type="button"
                  onClick={() => setOnlyWithVos(false)}
                  className="hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  title={isAr ? 'إلغاء التصفية' : 'Clear filter'}
                  aria-label={isAr ? 'إلغاء تصفية أوامر التغيير' : 'Clear VO filter'}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {onlyMissingHardcopy && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30 animate-in fade-in">
                <span>{isAr ? `تصفية: عقود ورقية مفقودة (${kpis.missingHardcopyCount})` : `Filter: Missing Hardcopy (${kpis.missingHardcopyCount})`}</span>
                <button
                  type="button"
                  onClick={() => setOnlyMissingHardcopy(false)}
                  className="hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  title={isAr ? 'إلغاء التصفية' : 'Clear filter'}
                  aria-label={isAr ? 'إلغاء تصفية العقود الورقية المفقودة' : 'Clear missing hardcopy filter'}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 animate-in fade-in">
                <span>
                  {isAr
                    ? `تصفية الحالة: ${statusOptions.find((s) => s.value === selectedStatus)?.label || selectedStatus}`
                    : `Status: ${statusOptions.find((s) => s.value === selectedStatus)?.label || selectedStatus}`}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('all')}
                  className="hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                  title={isAr ? 'إلغاء تصفية الحالة' : 'Clear status filter'}
                  aria-label={isAr ? 'إلغاء تصفية الحالة' : 'Clear status filter'}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          {(onlyWithVos || onlyMissingHardcopy || selectedStatus !== 'all' || activeFilterCount > 0) && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white/80 dark:bg-slate-800/80 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all border border-slate-200/80 dark:border-slate-800 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              title={isAr ? 'إعادة ضبط كافة الفلاتر' : 'Reset all filters'}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{isAr ? 'إعادة ضبط العرض' : 'Reset View'}</span>
            </button>
          )}
        </div>

        {/* Row 1: 6 Financial & Scale Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Card 1: Total Projects */}
          <KPICard
            title={t('projects.total_projects')}
            value={kpis.totalProjects}
            subtitle={t('projects.total_projects_sub')}
            icon={<FolderKanban className="w-5 h-5" />}
            accentColor="indigo"
            isActive={selectedStatus === 'all' && !onlyWithVos}
            onClick={() => {
              setSelectedStatus('all');
              setOnlyWithVos(false);
            }}
          />

          {/* Card 2: Active Projects */}
          <KPICard
            title={t('projects.active_projects')}
            value={kpis.activeProjects}
            subtitle={t('projects.active_projects_sub')}
            icon={<Activity className="w-5 h-5" />}
            accentColor="cyan"
            isActive={selectedStatus === 'working'}
            onClick={() => setSelectedStatus(selectedStatus === 'working' ? 'all' : 'working')}
          />

          {/* Card 3: Base Contracts Value (Original) */}
          <KPICard
            title={t('projects.base_contract_value')}
            value={formattedBaseContractValue}
            subtitle={t('projects.base_contract_value_sub')}
            icon={<FileSpreadsheet className="w-5 h-5" />}
            accentColor="blue"
          />

          {/* Card 4: Variation Orders Value Only (VOs - Specifically Requested) */}
          <KPICard
            title={t('projects.vos_value')}
            value={formattedVosValue}
            subtitle={`${kpis.projectsWithVosCount} ${isAr ? 'مشروعاً بأوامر تغيير' : 'projects with VOs'}`}
            badge={`+${vosPctOfBase}%`}
            badgeTone="amber"
            icon={<TrendingUp className="w-5 h-5" />}
            accentColor="amber"
            isActive={onlyWithVos}
            onClick={() => setOnlyWithVos(!onlyWithVos)}
          />

          {/* Card 5: Total Net Contract Value (Base + VOs) */}
          <KPICard
            title={t('projects.total_contract_value')}
            value={formattedTotalValue}
            subtitle={t('projects.total_contract_value_sub')}
            icon={<span className="font-mono font-black text-xs tracking-tighter text-emerald-600 dark:text-emerald-400">EGP</span>}
            accentColor="emerald"
          />

          {/* Card 6: Total Water Surface Area */}
          <KPICard
            title={t('projects.total_water_area')}
            value={`${formattedTotalWaterArea} ${isAr ? 'م²' : 'm²'}`}
            subtitle={t('projects.total_water_area_sub')}
            icon={<Droplets className="w-5 h-5" />}
            accentColor="purple"
          />
        </div>

        {/* Row 2: 6 Lifecycle & Operational Cards (Permanent Second Row as Requested) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
          {/* Card 7: Handing Over Projects (المشاريع التي يتم تسليمها) */}
          <KPICard
            title={t('projects.handing_over_projects')}
            value={kpis.handingOverProjects}
            subtitle={t('projects.handing_over_projects_sub')}
            icon={<Clock className="w-5 h-5" />}
            accentColor="amber"
            isActive={selectedStatus === 'handing_over'}
            onClick={() => setSelectedStatus(selectedStatus === 'handing_over' ? 'all' : 'handing_over')}
          />

          {/* Card 8: Completed Projects (المشاريع الخلصانة) */}
          <KPICard
            title={t('projects.completed_projects')}
            value={kpis.finishedProjects}
            subtitle={t('projects.completed_projects_sub')}
            icon={<CheckCircle2 className="w-5 h-5" />}
            accentColor="emerald"
            isActive={selectedStatus === 'finished'}
            onClick={() => setSelectedStatus(selectedStatus === 'finished' ? 'all' : 'finished')}
          />

          {/* Card 9: Active Projects Progress (نسبة الإنجاز الكلية للمشاريع التي تعمل) */}
          <KPICard
            title={isAr ? 'إنجاز المشاريع العاملة' : 'Active Sites Progress'}
            value={`${kpis.avgCompletion}%`}
            subtitle={isAr ? `متوسط إنجاز الـ ${kpis.activeProjects} موقعاً النشطة` : `Avg across ${kpis.activeProjects} active sites`}
            badge={`${kpis.activeProjects} ${isAr ? 'موقع نشط' : 'sites'}`}
            badgeTone="cyan"
            icon={<TrendingUp className="w-5 h-5" />}
            accentColor="cyan"
          />

          {/* Card 10: On Hold Projects (المشاريع المتوقفة) */}
          <KPICard
            title={t('projects.on_hold_projects')}
            value={kpis.onHoldProjects}
            subtitle={t('projects.on_hold_projects_sub')}
            icon={<AlertCircle className="w-5 h-5" />}
            accentColor="rose"
            isActive={selectedStatus === 'on_hold'}
            onClick={() => setSelectedStatus(selectedStatus === 'on_hold' ? 'all' : 'on_hold')}
          />

          {/* Card 11: Projects with VOs (المشاريع بأوامر تغيير) */}
          <KPICard
            title={t('projects.projects_with_vos')}
            value={kpis.projectsWithVosCount}
            subtitle={
              isAr
                ? `${kpis.totalProjects > 0 ? Math.round((kpis.projectsWithVosCount / kpis.totalProjects) * 100) : 0}% من إجمالي المحفظة`
                : `${kpis.totalProjects > 0 ? Math.round((kpis.projectsWithVosCount / kpis.totalProjects) * 100) : 0}% of total portfolio`
            }
            badge={isAr ? 'أوامر تغيير' : 'VOs'}
            badgeTone="purple"
            icon={<FileSpreadsheet className="w-5 h-5" />}
            accentColor="violet"
            isActive={onlyWithVos}
            onClick={() => setOnlyWithVos(!onlyWithVos)}
          />

          {/* Card 12: Total Water Volume (المكعب المائي الإجمالي) */}
          <KPICard
            title={t('projects.total_water_volume')}
            value={`${formattedTotalWaterVolume} ${isAr ? 'م³' : 'm³'}`}
            subtitle={t('projects.total_water_volume_sub')}
            icon={<Droplets className="w-5 h-5" />}
            accentColor="blue"
          />
        </div>
      </div>

      {/* Filter Bar & Sorting Bar */}
      <div className="glass-card p-4 space-y-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
        {/* Row 1: Search + View Mode Switcher + Sort Controls */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pb-3 border-b border-slate-200/60 dark:border-slate-800">
          
          {/* Instant Search Bar with embedded clear button (Hidden on map view) */}
          {viewMode !== 'map' ? (
            <div className="relative flex-1 max-w-xl">
              <label htmlFor="projects-instant-search" className="sr-only">
                {isAr ? 'البحث في قائمة المشاريع' : 'Search projects'}
              </label>
              <div className="relative flex items-center">
                <span className="absolute inset-y-0 start-0 flex items-center ps-3.5 pointer-events-none text-slate-400 dark:text-slate-500">
                  <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                </span>
                <input
                  ref={searchInputRef}
                  id="projects-instant-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearch('');
                    }
                  }}
                  placeholder={isAr ? 'بحث فوري باسم المشروع، الكود، أو العميل...' : 'Search by project name, code, or client...'}
                  className="w-full min-h-[44px] ps-10 pe-12 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
                  aria-label={isAr ? 'البحث السريع في المشاريع' : 'Quick project search'}
                />
                {search.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      searchInputRef.current?.focus();
                    }}
                    className="absolute inset-y-0 end-0 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-xl cursor-pointer"
                    title={isAr ? 'مسح البحث' : 'Clear search'}
                    aria-label={isAr ? 'مسح نص البحث' : 'Clear search text'}
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-700 dark:text-cyan-400 py-2">
              <MapPin className="w-4 h-4 text-cyan-500 shrink-0" aria-hidden="true" />
              <span>{isAr ? 'الخريطة الجغرافية التفاعلية الذكية - استخدم شريط البحث وفلاتر الأقاليم المدمجة داخل الخريطة' : 'GIS Interactive Map - Use on-map search and filters'}</span>
            </div>
          )}

          {/* Right Controls: Sort + View Mode Switcher */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2.5">
            {/* Sort Controls */}
            <div className="flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-2 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                {isAr ? 'الترتيب:' : 'Sort:'}
              </span>
              <div className="w-40 sm:w-44">
                <CustomSelect
                  options={sortOptions}
                  value={sortBy}
                  onChange={(val: string) => setSortBy(val)}
                  placeholder={isAr ? 'اختر الترتيب' : 'Sort by'}
                />
              </div>

              {/* Sort Order Toggle */}
              {(() => {
                const isNumericSort = ['value', 'area', 'completion'].includes(sortBy);
                const sortLabel = isNumericSort
                  ? sortOrder === 'desc'
                    ? (isAr ? 'مرتب من الأكبر للأصغر - انقر للقلب' : 'Descending - click to invert')
                    : (isAr ? 'مرتب من الأصغر للأكبر - انقر للقلب' : 'Ascending - click to invert')
                  : sortOrder === 'asc'
                  ? (isAr ? 'مرتب أبجدياً (أ إلى ي)' : 'Alphabetical (A-Z)')
                  : (isAr ? 'مرتب عكسياً (ي إلى أ)' : 'Reverse alphabetical (Z-A)');

                return (
                  <button
                    type="button"
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                    aria-label={sortLabel}
                    className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 shadow-2xs transition-all flex items-center justify-center gap-1.5 text-xs font-bold border border-slate-200/60 dark:border-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
                    title={sortLabel}
                  >
                    {isNumericSort ? (
                      sortOrder === 'desc' ? (
                        <>
                          <ArrowDown className="w-3.5 h-3.5 text-rose-500 stroke-[2.5]" aria-hidden="true" />
                          <span>{isAr ? 'الأكبر' : 'High'}</span>
                        </>
                      ) : (
                        <>
                          <ArrowUp className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" aria-hidden="true" />
                          <span>{isAr ? 'الأصغر' : 'Low'}</span>
                        </>
                      )
                    ) : (
                      sortOrder === 'asc' ? (
                        <>
                          <ArrowUp className="w-3.5 h-3.5 text-emerald-500 stroke-[2.5]" aria-hidden="true" />
                          <span>{isAr ? 'أ ⬅️ ي' : 'A-Z'}</span>
                        </>
                      ) : (
                        <>
                          <ArrowDown className="w-3.5 h-3.5 text-purple-500 stroke-[2.5]" aria-hidden="true" />
                          <span>{isAr ? 'ي ⬅️ أ' : 'Z-A'}</span>
                        </>
                      )
                    )}
                  </button>
                );
              })()}
            </div>

            {/* Unified View Mode Switcher (Segmented Control) */}
            <div
              role="tablist"
              aria-label={isAr ? 'طرق عرض المشاريع' : 'Project view modes'}
              className="flex items-center gap-1 bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800"
            >
              <button
                type="button"
                role="tab"
                id="view-tab-table"
                aria-selected={viewMode === 'table'}
                aria-controls="projects-view-container"
                aria-label={isAr ? 'عرض جدول المشاريع المفصل' : 'Projects table view'}
                onClick={() => setViewMode('table')}
                className={`min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700/80'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={isAr ? 'عرض الجدول المفصل' : 'Table View'}
              >
                <List className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                <span className="hidden sm:inline">{isAr ? 'جدول' : 'Table'}</span>
              </button>

              <button
                type="button"
                role="tab"
                id="view-tab-card"
                aria-selected={viewMode === 'card'}
                aria-controls="projects-view-container"
                aria-label={isAr ? 'عرض شبكة بطاقات المشاريع' : 'Projects cards grid view'}
                onClick={() => setViewMode('card')}
                className={`min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  viewMode === 'card'
                    ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700/80'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={isAr ? 'عرض شبكة البطاقات' : 'Cards Grid View'}
              >
                <LayoutGrid className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                <span className="hidden sm:inline">{isAr ? 'بطاقات' : 'Cards'}</span>
              </button>

              <button
                type="button"
                role="tab"
                id="view-tab-kanban"
                aria-selected={viewMode === 'kanban'}
                aria-controls="projects-view-container"
                aria-label={isAr ? 'عرض لوحة كانبان للمشاريع' : 'Projects kanban board view'}
                onClick={() => setViewMode('kanban')}
                className={`min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700/80'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={isAr ? 'عرض لوحة كانبان' : 'Kanban View'}
              >
                <Columns className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                <span className="hidden sm:inline">{isAr ? 'كانبان' : 'Kanban'}</span>
              </button>

              <button
                type="button"
                role="tab"
                id="view-tab-map"
                aria-selected={viewMode === 'map'}
                aria-controls="projects-view-container"
                aria-label={isAr ? 'عرض خريطة المشاريع الجغرافية' : 'Projects geographic GIS map view'}
                onClick={() => setViewMode('map')}
                className={`min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                  viewMode === 'map'
                    ? 'bg-white dark:bg-slate-800 text-cyan-800 dark:text-cyan-300 shadow-sm ring-1 ring-slate-200/80 dark:ring-slate-700/80'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={isAr ? 'عرض الخريطة الجغرافية' : 'GIS Map View'}
              >
                <MapPin className="w-4 h-4 text-cyan-500" aria-hidden="true" />
                <span className="hidden sm:inline">{isAr ? 'خريطة' : 'Map'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Multi-Filter Controls Grid (6 Columns + Advanced Toggle - Hidden on Map View) */}
        {viewMode !== 'map' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {/* 1. PM Filter */}
          <CustomSelect
            options={pmOptions}
            value={selectedPM}
            onChange={setSelectedPM}
            placeholder={isAr ? 'جميع مديري المشاريع' : 'All PMs'}
          />

          {/* 2. Contractual Client Filter */}
          <CustomSelect
            id="projects-filter-client"
            options={clientOptions}
            value={resolvedSelectedClient}
            onChange={(val) => setSelectedClient(val || 'all')}
            placeholder={isAr ? 'العميل التعاقدي' : t('projects.client')}
          />

          {/* 3. Owner / Developer Filter */}
          <CustomSelect
            id="projects-filter-owner"
            options={ownerOptions}
            value={resolvedSelectedOwner}
            onChange={(val) => setSelectedOwner(val || 'all')}
            placeholder={isAr ? 'المالك / المطور' : 'Owner / Developer'}
          />

          {/* 4. Sector / Governorate Filter */}
          <CustomSelect
            options={govOptions}
            value={selectedGov}
            onChange={setSelectedGov}
            placeholder={isAr ? 'جميع المحافظات' : 'All Governorates'}
          />

          {/* 4. Status Filter */}
          <CustomSelect
            options={statusOptions}
            value={selectedStatus}
            onChange={setSelectedStatus}
            placeholder={t('projects.status')}
          />

          {/* 5. Role Filter */}
          <CustomSelect
            options={roleOptions}
            value={selectedRole}
            onChange={setSelectedRole}
            placeholder={t('projects.role')}
          />

          {/* 6. Advanced Ranges & Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-expanded={showAdvanced}
              aria-controls={showAdvanced ? 'advanced-filters-drawer' : undefined}
              aria-label={
                showAdvanced
                  ? (isAr ? 'إخفاء تصفية النطاقات المتقدمة' : 'Hide advanced range filters')
                  : (isAr ? 'إظهار تصفية النطاقات المتقدمة' : 'Show advanced range filters')
              }
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex-1 min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer ${
                showAdvanced || (minContractValue || maxContractValue || minWaterArea)
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
                <span className="truncate">{isAr ? 'النطاقات' : 'Ranges'}</span>
              </span>
              {(minContractValue || maxContractValue || minWaterArea) && (
                <span className="w-5 h-5 rounded-full bg-emerald-700 text-white text-[10px] flex items-center justify-center font-mono font-black shrink-0">
                  !
                </span>
              )}
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
            </button>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 transition-colors shrink-0 font-bold flex items-center justify-center gap-1 shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                title={t('projects.reset_filters')}
                aria-label={isAr ? `مسح جميع الفلاتر (${activeFilterCount} نشط)` : `Clear all filters (${activeFilterCount} active)`}
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Strategic Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {isAr ? 'تصفية سريعة ومباشرة:' : 'Quick Filters:'}
          </span>

          {/* Favorites Pill */}
          <button
            type="button"
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              onlyFavorites
                ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-xs ring-2 ring-amber-400/30'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
            }`}
            aria-pressed={onlyFavorites}
            title={isAr ? 'عرض المشاريع المفضلة فقط' : 'Show favorite projects only'}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                onlyFavorites ? 'text-stone-950 fill-stone-950' : 'text-amber-500 fill-amber-400/40'
              }`}
            />
            <span>{isAr ? `المفضلة (${favoriteProjectsCount})` : `Favorites (${favoriteProjectsCount})`}</span>
          </button>

          {/* Missing Hardcopy Contracts Pill */}
          <button
            type="button"
            onClick={() => setOnlyMissingHardcopy(!onlyMissingHardcopy)}
            className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
              onlyMissingHardcopy
                ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-500/30'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
            }`}
            aria-pressed={onlyMissingHardcopy}
            title={isAr ? 'عرض المشاريع التي لا يتوفر لها أصل عقد ورقي معتمد بالشركة' : 'Show projects missing certified paper contract at company'}
          >
            <AlertCircle className={`w-3.5 h-3.5 ${onlyMissingHardcopy ? 'text-white' : 'text-rose-500'}`} />
            <span>{isAr ? `عقود ورقية مفقودة بالشركة (${kpis.missingHardcopyCount})` : `Missing Hardcopy (${kpis.missingHardcopyCount})`}</span>
          </button>

          {/* VOs Pill */}
          <button
            type="button"
            onClick={() => setOnlyWithVos(!onlyWithVos)}
            className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              onlyWithVos
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-2 ring-amber-500/30'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-950/20'
            }`}
            aria-pressed={onlyWithVos}
            title={isAr ? 'عرض المشاريع التي تتضمن أوامر تغيير فقط' : 'Show projects with variation orders only'}
          >
            <TrendingUp className={`w-3.5 h-3.5 ${onlyWithVos ? 'text-white' : 'text-amber-500'}`} />
            <span>{isAr ? `أوامر تغيير (${kpis.projectsWithVosCount})` : `VOs (${kpis.projectsWithVosCount})`}</span>
          </button>

          {/* Missing TOC in Finished Projects Pill */}
          <button
            type="button"
            onClick={() => {
              setOnlyMissingToc(!onlyMissingToc);
              if (!onlyMissingToc) setOnlyWithToc(false);
            }}
            className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 ${
              onlyMissingToc
                ? 'bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-500/30'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20'
            }`}
            aria-pressed={onlyMissingToc}
            title={isAr ? 'عرض المشاريع المنتهية وقيد التسليم التي لا يتوفر لها شهادة استلام ابتدائي' : 'Show finished & handover projects without TOC'}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${onlyMissingToc ? 'text-white' : 'text-rose-500'}`} />
            <span>{isAr ? `منتهية بدون استلام ابتدائي (${kpis.finishedWithoutTocCount})` : `Missing TOC (${kpis.finishedWithoutTocCount})`}</span>
          </button>

          {/* With TOC in Finished Projects Pill */}
          <button
            type="button"
            onClick={() => {
              setOnlyWithToc(!onlyWithToc);
              if (!onlyWithToc) setOnlyMissingToc(false);
            }}
            className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              onlyWithToc
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-500/30'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
            }`}
            aria-pressed={onlyWithToc}
            title={isAr ? 'عرض المشاريع التي يتوفر لها شهادة استلام ابتدائي معتمدة' : 'Show projects with approved TOC'}
          >
            <Award className={`w-3.5 h-3.5 ${onlyWithToc ? 'text-white' : 'text-emerald-500'}`} />
            <span>{isAr ? `باستلام ابتدائي معتمد (${kpis.finishedWithTocCount})` : `With TOC (${kpis.finishedWithTocCount})`}</span>
          </button>

          {/* Missed Bonds / Overdue Retention Pill & Report Trigger (Hidden in Focused Phase 1 Mode) */}
          {!isFocusedProjectsMode() && (
            <>
              <button
                type="button"
                onClick={() => setOnlyMissedBonds(!onlyMissedBonds)}
                className={`min-h-[34px] px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 ${
                  onlyMissedBonds
                    ? 'bg-red-600 text-white border-red-700 shadow-xs ring-2 ring-red-500/30'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20'
                }`}
                aria-pressed={onlyMissedBonds}
                title={isAr ? 'عرض المشاريع التي تجاوزت المدة التعاقدية لاسترداد محجوز الضمان أو خطاب الضمان' : 'Show projects with overdue retention or missed bonds'}
              >
                <ShieldAlert className={`w-3.5 h-3.5 ${onlyMissedBonds ? 'text-white' : 'text-red-500'}`} />
                <span>{isAr ? `متأخرات خطابات ومحجوز (${kpis.missedBondsCount})` : `Missed Bonds (${kpis.missedBondsCount})`}</span>
              </button>

              {/* Dedicated Retention & Bonds Report Modal Trigger */}
              <button
                type="button"
                onClick={() => setIsRetentionReportOpen(true)}
                className="min-h-[34px] px-3.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ms-auto"
                title={isAr ? 'فتح التقرير الشامل لحوكمة محجوز الضمان وخطابات حسن التنفيذ' : 'Open Retention & Performance Bonds Report'}
              >
                <Banknote className="w-4 h-4" />
                <span>{isAr ? 'تقرير محجوز الضمان والخطابات' : 'Retention & Bonds Report'}</span>
                {kpis.missedBondsCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-mono font-black animate-pulse">
                    {kpis.missedBondsCount}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* Collapsible Advanced Filters Drawer (Value & Area Ranges) */}
        {showAdvanced && (
          <div
            id="advanced-filters-drawer"
            role="region"
            aria-label={isAr ? 'تصفية النطاقات المالية ومساحة المياه' : 'Value & area range filters'}
            className="p-4 rounded-xl bg-slate-50/90 dark:bg-slate-900/90 border border-emerald-500/30 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center justify-between text-xs font-bold text-emerald-800 dark:text-emerald-300 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                <span>{isAr ? 'تصفية النطاقات المالية ومسطحات المياه' : 'Financial & Water Area Range Filter'}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setMinContractValue('');
                  setMaxContractValue('');
                  setMinWaterArea('');
                }}
                aria-label={isAr ? 'مسح تصفية النطاقات' : 'Clear range filters'}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
              >
                {isAr ? 'مسح النطاقات' : 'Clear Ranges'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label htmlFor="filter-min-contract-value" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الحد الأدنى لقيمة العقد (ج.م)' : 'Min Contract Value (EGP)'}
                </label>
                <input
                  id="filter-min-contract-value"
                  type="number"
                  placeholder={isAr ? 'مثال: 1000000' : 'e.g. 1000000'}
                  value={minContractValue}
                  onChange={(e) => setMinContractValue(e.target.value)}
                  className="w-full min-h-[44px] px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label htmlFor="filter-max-contract-value" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الحد الأقصى لقيمة العقد (ج.م)' : 'Max Contract Value (EGP)'}
                </label>
                <input
                  id="filter-max-contract-value"
                  type="number"
                  placeholder={isAr ? 'مثال: 50000000' : 'e.g. 50000000'}
                  value={maxContractValue}
                  onChange={(e) => setMaxContractValue(e.target.value)}
                  className="w-full min-h-[44px] px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <div>
                <label htmlFor="filter-min-water-area" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الحد الأدنى لمسطح المياه (م²)' : 'Min Water Area (m²)'}
                </label>
                <input
                  id="filter-min-water-area"
                  type="number"
                  placeholder={isAr ? 'مثال: 200' : 'e.g. 200'}
                  value={minWaterArea}
                  onChange={(e) => setMinWaterArea(e.target.value)}
                  className="w-full min-h-[44px] px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-xs text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Tags Bar with Persistent Result Badge */}
        <div
          role="region"
          aria-label={isAr ? 'حالة البحث والفلاتر النشطة' : 'Active search and filters summary'}
          className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-xs"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
              <span>{isAr ? 'الفلاتر النشطة:' : 'Active Filters:'}</span>
            </span>

            {activeFilterCount === 0 && (
              <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {isAr ? 'لا توجد فلاتر مطبقة (عرض كامل المحفظة)' : 'No filters applied (showing entire portfolio)'}
              </span>
            )}

            {search && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold">
                <span>🔍 &quot;{search}&quot;</span>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label={isAr ? `إزالة البحث: ${search}` : `Remove search: ${search}`}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {selectedPM !== 'all' && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold">
                <span>👤 {selectedPM}</span>
                <button
                  type="button"
                  onClick={() => setSelectedPM('all')}
                  aria-label={isAr ? `إزالة فلتر مدير المشروع: ${selectedPM}` : `Remove project manager filter: ${selectedPM}`}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {selectedClient !== 'all' && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800 font-bold">
                <span>🏢 {clientOptions.find((c) => c.value === resolvedSelectedClient)?.label || selectedClient}</span>
                <button
                  type="button"
                  onClick={() => setSelectedClient('all')}
                  aria-label={isAr ? `إزالة فلتر العميل: ${clientOptions.find((c) => c.value === resolvedSelectedClient)?.label || selectedClient}` : `Remove client filter: ${clientOptions.find((c) => c.value === resolvedSelectedClient)?.label || selectedClient}`}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {selectedOwner !== 'all' && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                <span>👑 {ownerOptions.find((o) => o.value === resolvedSelectedOwner)?.label || selectedOwner}</span>
                <button
                  type="button"
                  onClick={() => setSelectedOwner('all')}
                  aria-label={isAr ? `إزالة فلتر المالك: ${ownerOptions.find((o) => o.value === resolvedSelectedOwner)?.label || selectedOwner}` : `Remove owner filter: ${ownerOptions.find((o) => o.value === resolvedSelectedOwner)?.label || selectedOwner}`}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {selectedGov !== 'all' && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                <span>📍 {govOptions.find((g) => g.value === selectedGov)?.label || selectedGov}</span>
                <button
                  type="button"
                  onClick={() => setSelectedGov('all')}
                  aria-label={isAr ? `إزالة فلتر المحافظة: ${govOptions.find((g) => g.value === selectedGov)?.label || selectedGov}` : `Remove governorate filter: ${govOptions.find((g) => g.value === selectedGov)?.label || selectedGov}`}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {selectedStatus !== 'all' && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 font-bold">
                <span>📊 {statusOptions.find((s) => s.value === selectedStatus)?.label || selectedStatus}</span>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('all')}
                  aria-label={isAr ? `إزالة فلتر الحالة: ${statusOptions.find((s) => s.value === selectedStatus)?.label || selectedStatus}` : `Remove status filter: ${statusOptions.find((s) => s.value === selectedStatus)?.label || selectedStatus}`}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {selectedRole !== 'all' && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-bold">
                <span>🛠️ {roleOptions.find((r) => r.value === selectedRole)?.label || selectedRole}</span>
                <button
                  type="button"
                  onClick={() => setSelectedRole('all')}
                  aria-label={isAr ? `إزالة فلتر الدور: ${selectedRole}` : `Remove role filter: ${selectedRole}`}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {minContractValue && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 font-bold">
                <span>💰 {isAr ? 'أدنى عقد:' : 'Min Contract:'} {Number(minContractValue).toLocaleString()} {isAr ? 'ج.م' : 'EGP'}</span>
                <button
                  type="button"
                  onClick={() => setMinContractValue('')}
                  aria-label={isAr ? 'إزالة فلتر الحد الأدنى لقيمة العقد' : 'Remove min contract value filter'}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {maxContractValue && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 font-bold">
                <span>💰 {isAr ? 'أقصى عقد:' : 'Max Contract:'} {Number(maxContractValue).toLocaleString()} {isAr ? 'ج.م' : 'EGP'}</span>
                <button
                  type="button"
                  onClick={() => setMaxContractValue('')}
                  aria-label={isAr ? 'إزالة فلتر الحد الأقصى لقيمة العقد' : 'Remove max contract value filter'}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {minWaterArea && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 font-bold">
                <span>💧 {isAr ? 'المسطح:' : 'Area:'} ≥ {Number(minWaterArea).toLocaleString()} {isAr ? 'م²' : 'm²'}</span>
                <button
                  type="button"
                  onClick={() => setMinWaterArea('')}
                  aria-label={isAr ? 'إزالة فلتر الحد الأدنى لمسطح المياه' : 'Remove min water area filter'}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {onlyMissingHardcopy && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold">
                <span>⚠️ {isAr ? `عقود ورقية مفقودة (${kpis.missingHardcopyCount})` : `Missing Hardcopy (${kpis.missingHardcopyCount})`}</span>
                <button
                  type="button"
                  onClick={() => setOnlyMissingHardcopy(false)}
                  aria-label={isAr ? 'إزالة فلتر العقود الورقية المفقودة' : 'Remove missing hardcopy filter'}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {onlyWithVos && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                <span>⚡ {isAr ? `أوامر تغيير (${kpis.projectsWithVosCount})` : `VOs (${kpis.projectsWithVosCount})`}</span>
                <button
                  type="button"
                  onClick={() => setOnlyWithVos(false)}
                  aria-label={isAr ? 'إزالة فلتر أوامر التغيير' : 'Remove VO filter'}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {onlyMissingToc && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold">
                <span>⚠️ {isAr ? `منتهية بدون استلام ابتدائي (${kpis.finishedWithoutTocCount})` : `Missing TOC (${kpis.finishedWithoutTocCount})`}</span>
                <button
                  type="button"
                  onClick={() => setOnlyMissingToc(false)}
                  aria-label={isAr ? 'إزالة فلتر المشاريع بدون استلام ابتدائي' : 'Remove missing TOC filter'}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {onlyWithToc && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold">
                <span>✓ {isAr ? `باستلام ابتدائي معتمد (${kpis.finishedWithTocCount})` : `With TOC (${kpis.finishedWithTocCount})`}</span>
                <button
                  type="button"
                  onClick={() => setOnlyWithToc(false)}
                  aria-label={isAr ? 'إزالة فلتر المشاريع باستلام ابتدائي معتمد' : 'Remove with TOC filter'}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {onlyMissedBonds && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/80 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800 font-bold">
                <span>🚨 {isAr ? `متأخرات خطابات ومحجوز (${kpis.missedBondsCount})` : `Missed Bonds (${kpis.missedBondsCount})`}</span>
                <button
                  type="button"
                  onClick={() => setOnlyMissedBonds(false)}
                  aria-label={isAr ? 'إزالة فلتر متأخرات الخطابات والمحجوز' : 'Remove missed bonds filter'}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {onlyFavorites && (
              <span className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold">
                <span>⭐ {isAr ? `المفضلة (${favoriteProjectsCount})` : `Favorites (${favoriteProjectsCount})`}</span>
                <button
                  type="button"
                  onClick={() => setOnlyFavorites(false)}
                  aria-label={isAr ? 'إزالة فلتر المفضلة' : 'Remove favorites filter'}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:text-rose-600 dark:hover:text-rose-400 rounded-full font-black text-sm p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline min-h-[44px] min-w-[44px] px-3 py-1.5 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 rounded-xl cursor-pointer"
                aria-label={isAr ? 'إعادة ضبط جميع الفلاتر' : 'Reset all filters'}
              >
                {isAr ? 'مسح الكل' : 'Clear All'}
              </button>
            )}
          </div>

          {/* Persistent Result Count Badge */}
          <div
            className="flex items-center gap-2 font-mono text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
            role="status"
            aria-live="polite"
          >
            <span>{isAr ? 'النتائج:' : 'Results:'}</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-black">
              {processedProjects.length}
            </span>
            {projects.length > 0 && (
              <span className="text-slate-400 dark:text-slate-500">
                {isAr ? `من أصل ${projects.length}` : `of ${projects.length}`}
              </span>
            )}
          </div>
        </div>
          </>
        )}
      </div>

      {/* Main View Area */}
      <div id="projects-view-container" role="tabpanel" aria-label={isAr ? 'عرض محتوى المشاريع' : 'Projects view content'} className="w-full">
      {loading ? (
        viewMode === 'table' ? (
          <TableSkeleton />
        ) : viewMode === 'kanban' ? (
          <KanbanSkeleton />
        ) : viewMode === 'map' ? (
          <LocationAnalyticsMapSkeleton />
        ) : (
          <CardSkeleton />
        )
      ) : error ? (
        <ErrorState
          error={error}
          onRetry={() => setReloadTrigger((prev) => prev + 1)}
        />
      ) : projects.length === 0 && activeFilterCount === 0 && search.trim().length === 0 ? (
        /* True Empty State: Database has no projects yet */
        <div className="glass-card p-12 text-center text-slate-400 dark:text-slate-500 space-y-4 max-w-lg mx-auto my-8 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md" role="status">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-200/80 dark:border-emerald-800/80" aria-hidden="true">
            <FolderKanban className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {isAr ? 'لا توجد مشاريع مسجلة في المنظومة حتى الآن' : 'No projects registered in the system yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              {isAr
                ? 'ابدأ بتأسيس أول مشروع في بي زون وحدد المالك، العقد، ومسطح المياه والموقع الجغرافي.'
                : 'Start by creating your first P.ZONE project with client, contract, water area, and location.'}
            </p>
          </div>
          {canCreateProject ? (
            <div className="pt-2">
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-purple-600 hover:from-emerald-700 hover:to-purple-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none active:scale-95 cursor-pointer"
                aria-label={isAr ? 'إضافة أول مشروع الآن' : 'Create First Project'}
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>{isAr ? 'إضافة أول مشروع الآن' : 'Create First Project'}</span>
              </Link>
            </div>
          ) : (
            <div className="pt-2 space-y-3">
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 max-w-sm mx-auto">
                {isAr
                  ? 'أنت لا تمتلك صلاحية إضافة مشاريع جديدة. يرجى مراجعة مدير النظام لتسجيل المشاريع وتعيين الصلاحيات.'
                  : 'You do not have permission to create new projects. Please contact your system administrator.'}
              </p>
              <button
                type="button"
                onClick={() => setReloadTrigger((prev) => prev + 1)}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>{isAr ? 'تحديث البيانات' : 'Refresh Data'}</span>
              </button>
            </div>
          )}
        </div>
      ) : processedProjects.length === 0 && viewMode !== 'map' ? (
        /* Zero Results State: Filters resulted in no matches */
        <div className="glass-card p-10 text-center text-slate-400 dark:text-slate-500 space-y-4 max-w-md mx-auto my-8 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 backdrop-blur-md" role="status">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto shadow-inner" aria-hidden="true">
            <Search className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {t('projects.no_projects_found')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
              {search.trim().length > 0 ? (
                isAr ? (
                  <>
                    لم يتم العثور على مشاريع تطابق البحث <span className="font-bold text-slate-800 dark:text-slate-200">&quot;{search}&quot;</span>. تحقق من كتابة الكلمات أو امسح البحث.
                  </>
                ) : (
                  <>
                    No projects found matching <span className="font-bold text-slate-800 dark:text-slate-200">&quot;{search}&quot;</span>. Check your spelling or clear the search.
                  </>
                )
              ) : activeFilterCount > 0 ? (
                isAr
                  ? 'لا توجد مشاريع تطابق مجموعة الفلاتر المحددة حالياً. جرّب إزالة بعض القيود أو إعادة ضبط الفلاتر.'
                  : 'No projects match your active filter criteria. Try removing some filters or resetting all.'
              ) : (
                t('projects.no_projects_hint')
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {search.trim().length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  searchInputRef.current?.focus();
                }}
                className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none border border-slate-200 dark:border-slate-700 cursor-pointer"
                aria-label={isAr ? 'مسح نص البحث' : 'Clear search text'}
              >
                <X className="w-4 h-4" aria-hidden="true" />
                <span>{isAr ? 'مسح البحث' : 'Clear Search'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none border border-emerald-200 dark:border-emerald-800 cursor-pointer"
              aria-label={isAr ? 'إعادة ضبط جميع الفلاتر' : 'Reset all filters'}
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
              <span>{isAr ? 'إعادة ضبط جميع الفلاتر' : 'Reset All Filters'}</span>
            </button>
            {canCreateProject && (
              <Link
                href="/projects/new"
                className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none border border-slate-200/80 dark:border-slate-700 cursor-pointer"
                aria-label={t('projects.new_project')}
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>{t('projects.new_project')}</span>
              </Link>
            )}
          </div>
        </div>
      ) : viewMode === 'table' ? (
        <ProjectsTable
          projects={processedProjects}
          allProjects={projects}
          lang={locale}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSortChange}
          favoriteIds={favoriteIds}
          onToggleFavorite={(project) =>
            toggleFavorite(
              project.id,
              project.project_code ? `#${project.project_code}` : project.project_name,
              isAr
            )
          }
          onClientClick={(val) => {
            const canonical = findCanonicalEntity(dedupedEntities, val);
            setSelectedClient(canonical ? canonical.id : val);
          }}
          onPmClick={setSelectedPM}
          onResetFilters={resetFilters}
        />
      ) : viewMode === 'card' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedCardProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                lang={locale}
                isFavorite={favoriteIds.has(project.id)}
                onToggleFavorite={() =>
                  toggleFavorite(
                    project.id,
                    project.project_code ? `#${project.project_code}` : project.project_name,
                    isAr
                  )
                }
                onClientClick={(val) => {
                  const canonical = findCanonicalEntity(dedupedEntities, val);
                  setSelectedClient(canonical ? canonical.id : val);
                }}
              />
            ))}
          </div>

          {/* Card View Pagination Controls (>= 44px Touch Targets) */}
          {cardTotalCount > cardPageSize && (
            <nav
              role="navigation"
              aria-label={isAr ? 'تنقل بين صفحات بطاقات المشاريع' : 'Project cards pagination'}
              className="glass-card flex flex-col sm:flex-row items-center justify-between gap-3.5 px-5 py-3.5 border border-slate-200/80 dark:border-slate-800 rounded-2xl bg-white/80 dark:bg-slate-900/80 text-xs"
            >
              <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
                <span>
                  {isAr ? (
                    <>
                      عرض <span className="font-bold text-slate-900 dark:text-white font-mono">{cardStartIndex + 1}</span> إلى{' '}
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{cardEndIndex}</span> من إجمالي{' '}
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{cardTotalCount}</span> بطاقة
                    </>
                  ) : (
                    <>
                      Showing <span className="font-bold text-slate-900 dark:text-white font-mono">{cardStartIndex + 1}</span> to{' '}
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{cardEndIndex}</span> of{' '}
                      <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{cardTotalCount}</span> cards
                    </>
                  )}
                </span>

                <div className="flex items-center gap-2">
                  <label htmlFor="cardPageSizeSelect" className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                    {isAr ? 'البطاقات في الصفحة:' : 'Cards per page:'}
                  </label>
                  <select
                    id="cardPageSizeSelect"
                    value={cardPageSize}
                    onChange={(e) => {
                      setCardPageSize(Number(e.target.value));
                      setCardPage(1);
                    }}
                    className="min-h-[44px] px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs cursor-pointer"
                  >
                    {[9, 12, 24, 48].map((size) => (
                      <option key={size} value={size} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {cardTotalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={cardPage <= 1}
                    onClick={() => setCardPage(1)}
                    aria-label={isAr ? 'الصفحة الأولى' : 'First page'}
                    className="min-w-[44px] min-h-[44px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                  >
                    {isAr ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    disabled={cardPage <= 1}
                    onClick={() => setCardPage((prev) => Math.max(1, prev - 1))}
                    aria-label={isAr ? 'الصفحة السابقة' : 'Previous page'}
                    className="min-w-[44px] min-h-[44px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                  >
                    {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: Math.min(cardTotalPages, 5) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setCardPage(p)}
                          aria-label={isAr ? `صفحة ${p}` : `Page ${p}`}
                          aria-current={p === cardPage ? 'page' : undefined}
                          className={`min-w-[44px] min-h-[44px] px-2 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                            p === cardPage
                              ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-500'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    disabled={cardPage >= cardTotalPages}
                    onClick={() => setCardPage((prev) => Math.min(cardTotalPages, prev + 1))}
                    aria-label={isAr ? 'الصفحة التالية' : 'Next page'}
                    className="min-w-[44px] min-h-[44px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                  >
                    {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    disabled={cardPage >= cardTotalPages}
                    onClick={() => setCardPage(cardTotalPages)}
                    aria-label={isAr ? 'الصفحة الأخيرة' : 'Last page'}
                    className="min-w-[44px] min-h-[44px] p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:bg-slate-900 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                  >
                    {isAr ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </nav>
          )}
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanView
          projects={processedProjects}
          onClientClick={setSelectedClient}
          onPmClick={setSelectedPM}
          onResetFilters={resetFilters}
        />
      ) : (
        <LocationAnalyticsMap
          projects={processedProjects}
          allProjects={projects}
          selectedRegion={selectedGov}
          selectedStatus={selectedStatus}
          onRegionClick={(regionName: string) => {
            setSelectedGov(regionName || 'all');
          }}
          onStatusClick={(st: string) => {
            setSelectedStatus(normalizeStatusFilter(st));
          }}
          lang={locale}
        />
      )}
      </div>
      <RetentionAndBondsReportModal
        isOpen={isRetentionReportOpen}
        onClose={() => setIsRetentionReportOpen(false)}
        projects={projects}
        onProjectUpdated={() => setReloadTrigger((prev) => prev + 1)}
      />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="glass-card overflow-hidden bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm animate-pulse" aria-hidden="true">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-end text-sm">
          <thead className="bg-slate-100/70 dark:bg-slate-800/70 text-xs border-b border-slate-200/80 dark:border-slate-800">
            <tr>
              <th className="py-4 px-3 w-12 text-center"><div className="h-3 w-6 bg-slate-200 dark:bg-slate-700 rounded mx-auto" /></th>
              <th className="py-4 px-4 text-center"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mx-auto" /></th>
              <th className="py-4 px-4"><div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded ms-auto" /></th>
              <th className="py-4 px-4"><div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded ms-auto" /></th>
              <th className="py-4 px-4"><div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded ms-auto" /></th>
              <th className="py-4 px-4 text-center"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mx-auto" /></th>
              <th className="py-4 px-4 text-center"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mx-auto" /></th>
              <th className="py-4 px-4 text-center"><div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mx-auto" /></th>
              <th className="py-4 px-4 text-center"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded mx-auto" /></th>
              <th className="py-4 px-4 text-center"><div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded mx-auto" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-4 px-3 text-center"><div className="h-3 w-4 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                <td className="py-4 px-4 text-center"><div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-xl mx-auto" /></td>
                <td className="py-4 px-4"><div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded ms-auto" /></td>
                <td className="py-4 px-4"><div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded ms-auto" /></td>
                <td className="py-4 px-4"><div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded ms-auto" /></td>
                <td className="py-4 px-4 text-center"><div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" /></td>
                <td className="py-4 px-4 text-center"><div className="h-5 w-20 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" /></td>
                <td className="py-4 px-4 text-center"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                <td className="py-4 px-4 text-center"><div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                <td className="py-4 px-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                    <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-hidden="true">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="glass-card p-5 animate-pulse flex flex-col justify-between space-y-4 bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 rounded-2xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
            </div>
            <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-4/5 me-auto" />
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2 me-auto" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-14 bg-slate-100 dark:bg-slate-800/60 rounded-xl" />
          </div>
          <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full w-full" />
          <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
            <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function KanbanSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5" aria-hidden="true">
      {[1, 2, 3].map((col) => (
        <div key={col} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-4 animate-pulse min-h-[450px]">
          <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2 ms-auto" />
          <div className="space-y-3">
            {[1, 2, 3].map((card) => (
              <div key={card} className="h-32 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-800 p-3 space-y-2">
                <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded ms-auto" />
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
