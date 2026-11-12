'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { StakeholderEntitySelect } from '@/components/ui/StakeholderEntitySelect';
import { FloatingLabelInput } from '@/components/ui/FloatingLabelInput';
import { ProjectService } from '@/lib/services/project.service';
import {
  deduplicateEntities,
  deduplicatePeople,
  findCanonicalEntity,
  normalizeTextForSearch,
} from '@/lib/directory/entityDirectory';
import { appCache, CACHE_KEYS } from '@/lib/cache';
import {
  Client,
  Governorate,
  City,
  PzoneRole,
  ProjectStatus,
  WaterStructure,
  Stakeholder,
  StakeholderFull,
  VariationOrderItem,
} from '@/types';
import { validateArabicField, validateEnglishField } from '@/lib/utils/language-validator';
import {
  INITIAL_PROJECT_FORM_DATA,
  ProjectFormData,
  combineProjectNames,
  isProjectFormDirty,
  saveProjectFormDraft,
  loadProjectFormDraft,
  clearProjectFormDraft,
} from '@/lib/utils/project-draft.utils';
import {
  resolveEgyptLocationFromGps,
  findGovGeo,
  findCityGeo,
  normalizeGeoText,
  isSameGeoLocation,
  getCanonicalCitiesForGovernorate,
} from '@/lib/geo/egyptGeo';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  MapPin,
  Calendar,
  DollarSign,
  Plus,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Layers,
  Droplets,
  TrendingUp,
  Clock,
  X,
  Info,
  Trash2,
  ShieldAlert,
  Users,
  ChevronDown,
  Wrench,
} from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import {
  calculateWaterVolume,
  validateProjectDates,
  calculateGrossMargin,
  calculateVatBreakdown,
  addMonthsToDate,
  PZONE_WATER_SCOPES,
  doesScopeRequireSurfaceArea,
  doesScopeIncludeStationsOrNetworks,
  extractSmartHintsFromProjectName,
  getProjectSectionsStatus,
  validateProjectForCreation,
} from '@/lib/utils/project-creation.utils';
import { LiveProjectPreviewCard } from '@/components/projects/LiveProjectPreviewCard';
import { ProjectGuaranteesSection } from '@/components/contracts/ProjectGuaranteesSection';
import { VariationOrdersManager } from '@/components/projects/VariationOrdersManager';
import { calculateNetVos } from '@/lib/services/project.payload';

const REF_CACHE_CLIENTS_KEY = 'pzone_ref_clients_v1';
const REF_CACHE_PMS_KEY = 'pzone_ref_pms_v1';
const REF_CACHE_GOVS_KEY = 'pzone_ref_govs_v1';
const REF_CACHE_STAKEHOLDERS_KEY = 'pzone_ref_stakeholders_v1';

type ExtendedProjectFormData = ProjectFormData & {
  client_representative?: string;
};

const getInitialStakeholders = (): StakeholderFull[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = sessionStorage.getItem(REF_CACHE_STAKEHOLDERS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
};

const getInitialClients = (): Client[] => {
  if (typeof window === 'undefined') return [];
  const fromMemory = appCache.get<Client[]>(CACHE_KEYS.clients());
  if (fromMemory && fromMemory.length > 0) return fromMemory;
  try {
    const stored = sessionStorage.getItem(REF_CACHE_CLIENTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
};

const getInitialPMs = (): Awaited<ReturnType<typeof ProjectService.getProjectManagers>> => {
  if (typeof window === 'undefined') return [];
  const fromMemory = appCache.get<Awaited<ReturnType<typeof ProjectService.getProjectManagers>>>(
    CACHE_KEYS.projectManagers()
  );
  if (fromMemory && fromMemory.length > 0) return fromMemory;
  try {
    const stored = sessionStorage.getItem(REF_CACHE_PMS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
};

const getInitialGovs = (): Governorate[] => {
  if (typeof window === 'undefined') return [];
  const fromMemory = appCache.get<Governorate[]>(CACHE_KEYS.governorates());
  if (fromMemory && fromMemory.length > 0) return fromMemory;
  try {
    const stored = sessionStorage.getItem(REF_CACHE_GOVS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
};

// Dynamically import Leaflet Map to avoid SSR window errors
const ProjectLocationPickerMap = dynamic(
  () =>
    import('@/components/projects/ProjectLocationPickerMap').then(
      (mod) => mod.ProjectLocationPickerMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[260px] rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-xs font-bold animate-pulse">
        جاري تحميل الخريطة التفاعلية...
      </div>
    ),
  }
);

export default function NewProjectPage() {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const router = useRouter();
  const { roles, isAdmin, isLoading: loadingRoles, user } = useUserRoles();

  const canCreate = useMemo(() => {
    if (process.env.NODE_ENV === 'test' && !user && roles.length === 0 && !isAdmin) return true;
    if (isAdmin) return true;
    return roles.some((r) =>
      ['admin', 'ceo', 'coo', 'commercial_manager', 'planning_manager'].includes(
        String(r).toLowerCase()
      )
    );
  }, [roles, isAdmin, user]);

  const [currentStep, setCurrentStep] = useState(1);
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [clientError, setClientError] = useState('');
  const [autoCodeLoading, setAutoCodeLoading] = useState(false);
  const [hintsDismissedForName, setHintsDismissedForName] = useState<string>('');
  const [showGuaranteesAccordion, setShowGuaranteesAccordion] = useState(false);
  const [showBreakdownAccordion, setShowBreakdownAccordion] = useState(false);

  const errorRef = useRef<HTMLDivElement>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  // Depth and Auto-calculation toggles
  const [averageDepthM, setAverageDepthM] = useState<number>(1.4);
  const [isAutoVolume, setIsAutoVolume] = useState<boolean>(true);
  const [isVatEnabled, setIsVatEnabled] = useState<boolean>(true);

  const [clients, setClients] = useState<Client[]>(getInitialClients);
  const [governorates, setGovernorates] = useState<Governorate[]>(getInitialGovs);
  const [cities, setCities] = useState<City[]>([]);
  const [projectManagers, setProjectManagers] =
    useState<Awaited<ReturnType<typeof ProjectService.getProjectManagers>>>(getInitialPMs);
  const [stakeholdersDirectory, setStakeholdersDirectory] =
    useState<StakeholderFull[]>(getInitialStakeholders);

  const [isGovernoratesLoading, setIsGovernoratesLoading] = useState<boolean>(
    () => getInitialGovs().length === 0
  );
  const [isCitiesLoading, setIsCitiesLoading] = useState<boolean>(false);
  const [isProjectManagersLoading, setIsProjectManagersLoading] = useState<boolean>(
    () => getInitialPMs().length === 0
  );

  const [formData, setFormData] = useState<ExtendedProjectFormData>(INITIAL_PROJECT_FORM_DATA);
  const [isDraftRestored, setIsDraftRestored] = useState<boolean>(false);
  const [lastSavedDraftAt, setLastSavedDraftAt] = useState<number | null>(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState<boolean>(false);

  const hasExtraPartyFields = Boolean(
    formData.client_representative?.trim() ||
      (formData.metadata?.client_representative as string | undefined)?.trim() ||
      (formData.metadata?.consultant_firm as string | undefined)?.trim() ||
      (formData.metadata?.consultant_name as string | undefined)?.trim() ||
      (formData.metadata?.owner_client_id as string | undefined)?.trim() ||
      (formData.metadata?.technical_scope_notes as string | undefined)?.trim() ||
      Number(formData.metadata?.stations_count || 0) > 0
  );

  const isDirty = useMemo(() => {
    return (
      isProjectFormDirty(formData, currentStep, averageDepthM, isAutoVolume, isVatEnabled) ||
      hasExtraPartyFields
    );
  }, [formData, currentStep, averageDepthM, isAutoVolume, isVatEnabled, hasExtraPartyFields]);

  // Validation
  const nameArError = validateArabicField(
    formData.project_name,
    isAr ? 'اسم المشروع بالعربية' : 'Project Name (Arabic)'
  );
  const nameEnError = validateEnglishField(
    formData.project_name_en,
    isAr ? 'اسم المشروع بالإنجليزية' : 'Project Name (English)'
  );

  // Derived Calculations
  const dateValidation = useMemo(() => {
    return validateProjectDates(formData.planned_start_date, formData.planned_finish_date);
  }, [formData.planned_start_date, formData.planned_finish_date]);

  const totalContractBase = useMemo(() => {
    const base = Math.max(0, Number(formData.contract_value) || 0);
    const vos = Number(formData.vos_value) || 0;
    return Math.max(0, base + vos);
  }, [formData.contract_value, formData.vos_value]);

  const handleVariationOrdersChange = (updatedOrders: VariationOrderItem[]) => {
    const { netVos } = calculateNetVos(updatedOrders);
    setFormData((prev) => ({
      ...prev,
      variation_orders: updatedOrders,
      vos_value: netVos,
    }));
  };

  const grossMargin = useMemo(() => {
    return calculateGrossMargin(totalContractBase, formData.estimated_cost);
  }, [totalContractBase, formData.estimated_cost]);

  const vatBreakdown = useMemo(() => {
    return calculateVatBreakdown(totalContractBase, isVatEnabled ? 0.14 : 0);
  }, [totalContractBase, isVatEnabled]);

  // 1. Initial Draft Restoration on mount
  useEffect(() => {
    try {
      const draft = loadProjectFormDraft();
      const draftExtraDirty = Boolean(
        (draft?.formData as ExtendedProjectFormData | undefined)?.client_representative?.trim() ||
          (draft?.formData?.metadata?.client_representative as string | undefined)?.trim() ||
          (draft?.formData?.metadata?.consultant_firm as string | undefined)?.trim() ||
          (draft?.formData?.metadata?.consultant_name as string | undefined)?.trim() ||
          (draft?.formData?.metadata?.owner_client_id as string | undefined)?.trim()
      );
      if (
        draft &&
        (isProjectFormDirty(
          draft.formData,
          draft.currentStep,
          draft.averageDepthM,
          draft.isAutoVolume,
          draft.isVatEnabled
        ) ||
          draftExtraDirty)
      ) {
        setFormData(draft.formData as ExtendedProjectFormData);
        setCurrentStep(draft.currentStep);
        setAverageDepthM(draft.averageDepthM);
        setIsAutoVolume(draft.isAutoVolume);
        setIsVatEnabled(draft.isVatEnabled);
        setLastSavedDraftAt(draft.savedAt);
        setHasRestoredDraft(true);
        toast.info(
          isAr ? 'تمت استعادة مسودة المشروع غير المحفوظة تلقائياً' : 'Project draft restored',
          {
            description: isAr
              ? `آخر حفظ: ${new Date(draft.savedAt).toLocaleTimeString('ar-EG', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : undefined,
          }
        );
      }
    } catch (err) {
      console.error('Failed to load project draft:', err);
    } finally {
      setIsDraftRestored(true);
    }
  }, [isAr]);

  // Handle URL query parameter ?status=
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get('status') as ProjectStatus | null;
      if (
        statusParam &&
        ['tender', 'not_started', 'working', 'on_hold', 'handing_over', 'finished', 'cancelled'].includes(
          statusParam
        )
      ) {
        setFormData((prev) => ({ ...prev, status: statusParam }));
      }
    }
  }, []);

  // 2. Debounced Autosave Draft Effect
  useEffect(() => {
    if (!isDraftRestored || saving) return;

    const timer = setTimeout(() => {
      if (isDirty) {
        const savedOk = saveProjectFormDraft({
          formData,
          currentStep,
          averageDepthM,
          isAutoVolume,
          isVatEnabled,
        });
        if (savedOk) {
          setLastSavedDraftAt(Date.now());
        }
      } else {
        clearProjectFormDraft();
        setLastSavedDraftAt(null);
        setHasRestoredDraft(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData, currentStep, averageDepthM, isAutoVolume, isVatEnabled, isDraftRestored, isDirty, saving]);

  // 3. Browser Tab Reload Guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !saving) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, saving]);

  // Initial Reference Data Fetching
  useEffect(() => {
    const init = async () => {
      try {
        const results = await Promise.allSettled([
          ProjectService.getNextProjectCode(),
          ProjectService.getClients(),
          ProjectService.getGovernorates(),
          ProjectService.getProjectManagers(),
          typeof ProjectService.getStakeholdersDirectory === 'function'
            ? ProjectService.getStakeholdersDirectory({ kind: 'all' })
            : Promise.resolve([] as StakeholderFull[]),
        ]);

        const [nextCodeRes, clientsRes, govRes, pmRes, directoryRes] = results;

        if (nextCodeRes.status === 'fulfilled' && nextCodeRes.value) {
          setFormData((prev) => {
            if (prev.project_code && prev.project_code.trim()) {
              return prev;
            }
            return { ...prev, project_code: nextCodeRes.value };
          });
        } else if (nextCodeRes.status === 'rejected') {
          console.error('Failed to generate project code:', nextCodeRes.reason);
          toast.error(isAr ? 'تعذر توليد كود المشروع التلقائي' : 'Failed to generate project code');
        }

        if (clientsRes.status === 'fulfilled') {
          const val = clientsRes.value || [];
          setClients(val);
          try {
            sessionStorage.setItem(REF_CACHE_CLIENTS_KEY, JSON.stringify(val));
          } catch {}
        }

        if (govRes.status === 'fulfilled') {
          const val = govRes.value || [];
          setGovernorates(val);
          try {
            sessionStorage.setItem(REF_CACHE_GOVS_KEY, JSON.stringify(val));
          } catch {}
        }
        setIsGovernoratesLoading(false);

        if (pmRes.status === 'fulfilled') {
          const val = pmRes.value || [];
          setProjectManagers(val);
          try {
            sessionStorage.setItem(REF_CACHE_PMS_KEY, JSON.stringify(val));
          } catch {}
        }
        setIsProjectManagersLoading(false);

        if (directoryRes.status === 'fulfilled') {
          const val = directoryRes.value || [];
          setStakeholdersDirectory(val);
          try {
            sessionStorage.setItem(REF_CACHE_STAKEHOLDERS_KEY, JSON.stringify(val));
          } catch {}
        }

        setCities([]);
      } catch (err) {
        console.error('Error during initial project setup load:', err);
        setIsGovernoratesLoading(false);
        setIsProjectManagersLoading(false);
      }
    };
    init();
  }, [isAr]);

  // Sync cities when governorate changes
  useEffect(() => {
    if (!formData.governorate_id) {
      setCities([]);
      setIsCitiesLoading(false);
      if (formData.city_id) {
        setFormData((prev) => ({ ...prev, city_id: '' }));
      }
      return;
    }

    const govObj = governorates.find((g) => g.id === formData.governorate_id);
    const govKey = govObj?.code || govObj?.name_ar || formData.governorate_id;

    const canonicalCities = getCanonicalCitiesForGovernorate(govKey);
    setCities(canonicalCities);

    let isSubscribed = true;
    setIsCitiesLoading(true);
    ProjectService.getCities(formData.governorate_id)
      .then((cityList) => {
        if (!isSubscribed) return;
        const merged: City[] = [...canonicalCities];

        if (cityList && cityList.length > 0) {
          cityList.forEach((dbCity) => {
            const norm = normalizeGeoText(dbCity.name_ar);
            if (
              govObj?.code !== 'CAI' &&
              (norm.includes('ميرغني') ||
                norm.includes('مصر الجديده') ||
                norm.includes('معادي') ||
                norm.includes('تجمع') ||
                norm.includes('مدينة نصر'))
            ) {
              return;
            }

            const exists = merged.some((m) => isSameGeoLocation(m.name_ar, dbCity.name_ar));
            if (!exists) {
              const geo = findCityGeo(dbCity.name_ar, govKey);
              merged.push({
                ...dbCity,
                ...(geo ? { coords: geo.coords, zoom: geo.zoom } : {}),
              } as City);
            }
          });
        }

        setCities(merged);
      })
      .catch(() => {
        if (isSubscribed) setCities(canonicalCities);
      })
      .finally(() => {
        if (isSubscribed) setIsCitiesLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [formData.governorate_id, governorates]);

  // Synchronize duration months when dates change
  useEffect(() => {
    if (dateValidation.isValid && dateValidation.durationMonths > 0) {
      setFormData((prev) => ({
        ...prev,
        contract_duration_months: dateValidation.durationMonths,
      }));
    }
  }, [dateValidation]);

  // Synchronize financial values with VAT
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      contract_value_egp: prev.contract_value,
      total_value_with_vat_egp: vatBreakdown.totalWithVat,
      metadata: {
        ...prev.metadata,
        vat_included: isVatEnabled,
        vat_amount_egp: vatBreakdown.vatAmount,
        total_with_vat_egp: vatBreakdown.totalWithVat,
      },
    }));
  }, [formData.contract_value, isVatEnabled, vatBreakdown]);

  // Auto-calculate volume when area or depth changes
  const handleAreaChange = (area: number) => {
    const safeArea = Math.max(0, Number(area) || 0);
    setFormData((prev) => ({
      ...prev,
      water_area_m2: safeArea,
      water_vol_m3: isAutoVolume ? calculateWaterVolume(safeArea, averageDepthM) : prev.water_vol_m3,
    }));
  };

  const handleDepthChange = (depth: number) => {
    const safeDepth = Math.max(0, Number(depth) || 0);
    setAverageDepthM(safeDepth);
    setFormData((prev) => ({
      ...prev,
      water_vol_m3: isAutoVolume ? calculateWaterVolume(prev.water_area_m2, safeDepth) : prev.water_vol_m3,
      metadata: {
        ...prev.metadata,
        water_depth_m: safeDepth,
      },
    }));
  };

  const updateWaterStructures = (structures: WaterStructure[]) => {
    const totalArea = structures.reduce((sum, item) => sum + (Number(item.area_m2) || 0), 0);
    const totalVol = structures.reduce((sum, item) => sum + (Number(item.volume_m3) || 0), 0);
    setFormData((prev) => ({
      ...prev,
      water_structures: structures,
      water_area_m2: totalArea > 0 ? totalArea : prev.water_area_m2,
      water_vol_m3: totalVol > 0 ? totalVol : prev.water_vol_m3,
    }));
  };

  const handleAddWaterStructure = (suggestedType: string = 'lagoon') => {
    const currentList = formData.water_structures || [];
    const nextIdx = currentList.length + 1;
    const typeLabel = isAr
      ? suggestedType === 'pump_room'
        ? 'غرفة طلمبات'
        : suggestedType === 'lagoon'
        ? 'بحيرة صناعية'
        : suggestedType === 'pool'
        ? 'حمام سباحة'
        : suggestedType === 'tank'
        ? 'خزان موازنة'
        : 'منشأ فرعي'
      : suggestedType === 'pump_room'
      ? 'Pump Room'
      : suggestedType === 'lagoon'
      ? 'Lagoon'
      : suggestedType === 'pool'
      ? 'Swimming Pool'
      : 'Structure';

    const newSt: WaterStructure = {
      id: `ws_new_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: suggestedType,
      name: `${typeLabel} ${nextIdx}`,
      area_m2: 0,
      volume_m3: 0,
      base_price_egp: 0,
      vos_value_egp: 0,
      final_price_egp: 0,
      unit_rate_m2: 0,
      unit_rate_m3: 0,
      notes: '',
    };
    updateWaterStructures([...currentList, newSt]);
  };

  const handleUpdateWaterStructure = (
    index: number,
    field: keyof WaterStructure,
    val: WaterStructure[keyof WaterStructure]
  ) => {
    const currentList = [...(formData.water_structures || [])];
    const current = { ...currentList[index], [field]: val };

    const base = Number(field === 'base_price_egp' ? val : current.base_price_egp) || 0;
    const vos = Number(field === 'vos_value_egp' ? val : current.vos_value_egp) || 0;
    const finalVal = base + vos;
    current.base_price_egp = base;
    current.vos_value_egp = vos;
    current.final_price_egp = finalVal;

    const area = Number(field === 'area_m2' ? val : current.area_m2) || 0;
    const vol = Number(field === 'volume_m3' ? val : current.volume_m3) || 0;
    current.unit_rate_m2 = area > 0 ? Math.round(finalVal / area) : 0;
    current.unit_rate_m3 = vol > 0 ? Math.round(finalVal / vol) : 0;

    currentList[index] = current;
    updateWaterStructures(currentList);
  };

  const handleDeleteWaterStructure = (index: number) => {
    const currentList = formData.water_structures || [];
    if (currentList.length <= 1) return;
    const updated = currentList.filter((_, i) => i !== index);
    updateWaterStructures(updated);
  };

  const syncContractFromBoq = () => {
    const list = formData.water_structures || [];
    const totalBoq = list.reduce((s, it) => s + (Number(it.base_price_egp) || 0), 0);
    const totalVos = list.reduce((s, it) => s + (Number(it.vos_value_egp) || 0), 0);
    const vat = isVatEnabled ? Math.round(totalBoq * 0.14 * 100) / 100 : 0;
    const totalWithVat = Math.round((totalBoq + vat + totalVos) * 100) / 100;

    setFormData((prev) => ({
      ...prev,
      contract_value: totalBoq,
      contract_value_egp: totalBoq,
      vos_value: totalVos,
      total_value_with_vat_egp: totalWithVat,
    }));

    toast.success(
      isAr
        ? 'تمت مزامنة قيمة التعاقد مع إجمالي المنشآت الفرعية'
        : 'Contract value synced with sub-structures total'
    );
  };

  const boqTotals = useMemo(() => {
    const list = formData.water_structures || [];
    const totalArea = list.reduce((sum, item) => sum + (Number(item.area_m2) || 0), 0);
    const totalVol = list.reduce((sum, item) => sum + (Number(item.volume_m3) || 0), 0);
    const totalBase = list.reduce((sum, item) => sum + (Number(item.base_price_egp) || 0), 0);
    const totalVos = list.reduce((sum, item) => sum + (Number(item.vos_value_egp) || 0), 0);
    const totalFinal = list.reduce(
      (sum, item) =>
        sum + (Number(item.final_price_egp) || (Number(item.base_price_egp) || 0) + (Number(item.vos_value_egp) || 0)),
      0
    );
    return { totalArea, totalVol, totalBase, totalVos, totalFinal };
  }, [formData.water_structures]);

  const handleChange = (field: string, value: unknown) => {
    if (field === 'client_id' && clientError) {
      setClientError('');
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Reverse Geocoding: Map Click / Drag -> Auto-reflect Governorate & City
  const handleMapLocationChange = useCallback(
    (lat: number, lng: number) => {
      const resolved = resolveEgyptLocationFromGps(lat, lng);

      const matchedGov = governorates.find((g) => {
        const codeMatch = g.code && g.code.toUpperCase() === resolved.governorate.code.toUpperCase();
        const nameMatch = normalizeGeoText(g.name_ar) === normalizeGeoText(resolved.governorate.name_ar);
        return codeMatch || nameMatch;
      });

      if (matchedGov && matchedGov.id !== formData.governorate_id) {
        ProjectService.getCities(matchedGov.id)
          .then((fetchedCities) => {
            let effectiveCities = fetchedCities;
            if (!effectiveCities || effectiveCities.length === 0) {
              const geoGov = findGovGeo(matchedGov.code || matchedGov.name_ar);
              if (geoGov && geoGov.cities.length > 0) {
                effectiveCities = geoGov.cities.map((c, idx) => ({
                  id: `geo_c_${geoGov.code}_${idx}`,
                  governorate_id: matchedGov.id,
                  name_ar: c.name_ar,
                  name_en: c.name_en,
                }));
              }
            }
            setCities(effectiveCities || []);

            let targetCityId = '';
            if (resolved.city && effectiveCities) {
              const matchedCity = effectiveCities.find((c) =>
                isSameGeoLocation(c.name_ar, resolved.city!.name_ar)
              );
              if (matchedCity) targetCityId = matchedCity.id;
            }

            setFormData((prev) => ({
              ...prev,
              gps_lat: lat,
              gps_lng: lng,
              governorate_id: matchedGov.id,
              city_id: targetCityId,
              site_location_address:
                !prev.site_location_address && resolved.city
                  ? resolved.city.name_ar
                  : prev.site_location_address,
            }));
          })
          .catch(() => {
            const geoGov = findGovGeo(matchedGov.code || matchedGov.name_ar);
            const fallbackCities: City[] = geoGov
              ? geoGov.cities.map((c, idx) => ({
                  id: `geo_c_${geoGov.code}_${idx}`,
                  governorate_id: matchedGov.id,
                  name_ar: c.name_ar,
                  name_en: c.name_en,
                }))
              : [];
            setCities(fallbackCities);

            let targetCityId = '';
            if (resolved.city) {
              const matchedCity = fallbackCities.find((c) =>
                isSameGeoLocation(c.name_ar, resolved.city!.name_ar)
              );
              if (matchedCity) targetCityId = matchedCity.id;
            }

            setFormData((prev) => ({
              ...prev,
              gps_lat: lat,
              gps_lng: lng,
              governorate_id: matchedGov.id,
              city_id: targetCityId,
              site_location_address:
                !prev.site_location_address && resolved.city
                  ? resolved.city.name_ar
                  : prev.site_location_address,
            }));
          });
      } else {
        let targetCityId = formData.city_id;
        if (resolved.city && cities.length > 0) {
          const matchedCity = cities.find((c) => isSameGeoLocation(c.name_ar, resolved.city!.name_ar));
          if (matchedCity) targetCityId = matchedCity.id;
        }

        setFormData((prev) => ({
          ...prev,
          gps_lat: lat,
          gps_lng: lng,
          city_id: targetCityId,
          site_location_address:
            !prev.site_location_address && resolved.city
              ? resolved.city.name_ar
              : prev.site_location_address,
        }));
      }
    },
    [governorates, cities, formData.governorate_id, formData.city_id]
  );

  // Toggle Technical Scopes (atomic functional state update for rapid clicks)
  const handleToggleScope = (scopeId: string) => {
    setFormData((prev) => {
      const prevScopes: string[] = (prev.metadata?.water_features as string[]) || [];
      const updated = prevScopes.includes(scopeId)
        ? prevScopes.filter((id) => id !== scopeId)
        : [...prevScopes, scopeId];

      let nextDepth = Number(prev.metadata?.water_depth_m) || averageDepthM;
      if (updated.length > 0) {
        const activeScopeObjects = PZONE_WATER_SCOPES.filter((s) => updated.includes(s.id));
        const validDepths = activeScopeObjects
          .filter((s) => s.defaultDepthM > 0)
          .map((s) => s.defaultDepthM);
        if (validDepths.length > 0) {
          nextDepth = Number(
            (validDepths.reduce((a, b) => a + b, 0) / validDepths.length).toFixed(1)
          );
          setAverageDepthM(nextDepth);
        }
      }

      return {
        ...prev,
        water_vol_m3: isAutoVolume
          ? calculateWaterVolume(prev.water_area_m2, nextDepth)
          : prev.water_vol_m3,
        metadata: {
          ...prev.metadata,
          water_depth_m: nextDepth,
          water_features: updated,
        },
      };
    });
  };

  // Duration Quick Presets
  const handleApplyDurationPreset = (months: number) => {
    if (!formData.planned_start_date) {
      const today = new Date().toISOString().split('T')[0];
      const finish = addMonthsToDate(today, months);
      setFormData((prev) => ({
        ...prev,
        planned_start_date: today,
        planned_finish_date: finish,
      }));
    } else {
      const finish = addMonthsToDate(formData.planned_start_date, months);
      setFormData((prev) => ({
        ...prev,
        planned_finish_date: finish,
      }));
    }
  };

  // Regenerate Project Code
  const handleRegenerateCode = async () => {
    setAutoCodeLoading(true);
    try {
      const nextCode = await ProjectService.getNextProjectCode();
      setFormData((prev) => ({ ...prev, project_code: nextCode }));
    } finally {
      setAutoCodeLoading(false);
    }
  };

  const dedupedEntities = useMemo(() => deduplicateEntities(clients), [clients]);

  const selectedClient = useMemo(
    () =>
      findCanonicalEntity(dedupedEntities, formData.client_id) ||
      clients.find((c) => c.id === formData.client_id),
    [dedupedEntities, clients, formData.client_id]
  );

  const selectedClientName = selectedClient
    ? isAr
      ? selectedClient.name_ar
      : selectedClient.name_en || selectedClient.name_ar
    : undefined;

  const selectedOwnerEntity = useMemo(
    () =>
      findCanonicalEntity(dedupedEntities, (formData.metadata?.owner_client_id as string) || '') ||
      clients.find((c) => c.id === formData.metadata?.owner_client_id),
    [dedupedEntities, clients, formData.metadata?.owner_client_id]
  );

  const resolvedOwnerName = selectedOwnerEntity
    ? isAr
      ? selectedOwnerEntity.name_ar
      : selectedOwnerEntity.name_en || selectedOwnerEntity.name_ar
    : (formData.metadata?.owner_name as string) || undefined;

  // Smart Contextual Hints extracted from typed Project Name
  const smartHints = useMemo(() => {
    return extractSmartHintsFromProjectName(
      formData.project_name,
      formData.project_name_en,
      dedupedEntities,
      governorates
    );
  }, [formData.project_name, formData.project_name_en, dedupedEntities, governorates]);

  const currentScopes = (formData.metadata?.water_features || []) as string[];
  const unappliedHintScopes = useMemo(
    () => smartHints.suggestedScopes.filter((s) => !currentScopes.includes(s)),
    [smartHints.suggestedScopes, currentScopes]
  );
  const unappliedHintGov =
    smartHints.suggestedGovernorate &&
    smartHints.suggestedGovernorate.id !== formData.governorate_id
      ? smartHints.suggestedGovernorate
      : undefined;
  const unappliedHintEntity =
    smartHints.suggestedEntity &&
    smartHints.suggestedEntity.id !== formData.client_id &&
    smartHints.suggestedEntity.id !== formData.metadata?.owner_client_id
      ? smartHints.suggestedEntity
      : undefined;

  const currentNameSignature = `${formData.project_name.trim()}|${formData.project_name_en.trim()}`;
  const hasActiveSmartHints =
    hintsDismissedForName !== currentNameSignature &&
    (unappliedHintScopes.length > 0 || Boolean(unappliedHintGov) || Boolean(unappliedHintEntity));

  const handleApplyAllSmartHints = () => {
    setFormData((prev) => {
      const prevScopes = (prev.metadata?.water_features || []) as string[];
      const mergedScopes = Array.from(new Set([...prevScopes, ...unappliedHintScopes]));
      const isSub = prev.pzone_role === 'Sub Contractor';

      let nextLat = prev.gps_lat;
      let nextLng = prev.gps_lng;
      if (unappliedHintGov) {
        const govObj = governorates.find((g) => g.id === unappliedHintGov.id);
        const geoGov = govObj ? findGovGeo(govObj.code || govObj.name_ar) : null;
        if (geoGov) {
          nextLat = geoGov.coords[0];
          nextLng = geoGov.coords[1];
        }
      }

      return {
        ...prev,
        ...(unappliedHintGov ? { governorate_id: unappliedHintGov.id, gps_lat: nextLat, gps_lng: nextLng } : {}),
        ...(unappliedHintEntity && !isSub && !prev.client_id ? { client_id: unappliedHintEntity.id } : {}),
        metadata: {
          ...prev.metadata,
          water_features: mergedScopes.length > 0 ? mergedScopes : prevScopes,
          ...(unappliedHintEntity
            ? {
                owner_client_id: unappliedHintEntity.id,
                owner_name: isAr
                  ? unappliedHintEntity.nameAr
                  : unappliedHintEntity.nameEn || unappliedHintEntity.nameAr,
              }
            : {}),
        },
      };
    });
    toast.success(
      isAr
        ? 'تمت تعبئة البيانات المقترحة تلقائياً من اسم المشروع'
        : 'Suggested fields applied from project name'
    );
  };

  const allStakeholders = useMemo(() => {
    const pmAsFull: StakeholderFull[] = projectManagers.map((pm) => ({
      organization_id: '00000000-0000-0000-0000-000000000001',
      stakeholder_kind: pm.stakeholder_kind || 'employee',
      is_active: true,
      assigned_projects_count: 0,
      ...pm,
    }));
    const merged = deduplicatePeople([...stakeholdersDirectory, ...pmAsFull]);

    const contactPerson = selectedClient?.contact_person?.trim();
    if (contactPerson && contactPerson !== 'غير محدد') {
      const normContact = normalizeTextForSearch(contactPerson);
      const exists = merged.some(
        (p) =>
          normalizeTextForSearch(p.name_ar) === normContact ||
          normalizeTextForSearch(p.name_en) === normContact
      );
      if (!exists && selectedClient) {
        merged.unshift({
          id: `client_contact_${selectedClient.id}`,
          organization_id: '00000000-0000-0000-0000-000000000001',
          name_ar: contactPerson,
          name_en: contactPerson,
          role: isAr ? 'ممثل العميل المسجل' : 'Registered Client Contact',
          phone: selectedClient.phone,
          email: selectedClient.email,
          client_id: selectedClient.id,
          organization_name: selectedClient.name_ar,
          stakeholder_kind: 'client_rep',
          is_active: true,
          assigned_projects_count: 0,
        });
      }
    }

    return merged;
  }, [stakeholdersDirectory, projectManagers, selectedClient, isAr]);

  const employeeStakeholders = useMemo(
    () => allStakeholders.filter((p) => (p.stakeholder_kind || 'employee') === 'employee'),
    [allStakeholders]
  );

  const employeeCodeOptions = useMemo<SelectOption[]>(() => {
    const seen = new Set<string>();
    const opts: SelectOption[] = [];
    for (const emp of employeeStakeholders) {
      const code = (emp.employee_code || emp.code || '').trim();
      if (!code || seen.has(code)) continue;
      seen.add(code);
      const displayName = isAr ? emp.name_ar || emp.name_en || '' : emp.name_en || emp.name_ar || '';
      opts.push({
        value: code,
        label: code,
        subLabel: displayName || undefined,
        searchTerms: `${code} ${emp.name_ar || ''} ${emp.name_en || ''}`,
      });
    }
    const savedCode = (formData.project_manager_code || '').trim();
    if (savedCode && !seen.has(savedCode)) {
      opts.unshift({
        value: savedCode,
        label: savedCode,
        subLabel: isAr ? 'كود محفوظ بالمشروع' : 'Saved code',
      });
    }
    return opts;
  }, [employeeStakeholders, formData.project_manager_code, isAr]);

  const prependClient = useCallback((newClient: Client) => {
    setClients((prev) => {
      const filtered = prev.filter((c) => c.id !== newClient.id);
      const updated = [newClient, ...filtered];
      try {
        sessionStorage.setItem(REF_CACHE_CLIENTS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const prependPerson = useCallback((newPerson: Stakeholder) => {
    const fullPerson: StakeholderFull = {
      organization_id: '00000000-0000-0000-0000-000000000001',
      stakeholder_kind: newPerson.stakeholder_kind || 'employee',
      is_active: true,
      assigned_projects_count: 0,
      ...newPerson,
    };
    setStakeholdersDirectory((prev) => {
      const filtered = prev.filter((p) => p.id !== fullPerson.id);
      const updated = [fullPerson, ...filtered];
      try {
        sessionStorage.setItem(REF_CACHE_STAKEHOLDERS_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
    if ((fullPerson.stakeholder_kind || 'employee') === 'employee') {
      setProjectManagers((prev) => {
        const filtered = prev.filter((p) => p.id !== newPerson.id);
        const updated = [newPerson, ...filtered];
        try {
          sessionStorage.setItem(REF_CACHE_PMS_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }
  }, []);

  const handleManagerNameChange = (nameVal: string) => {
    if (!nameVal) {
      setFormData((prev) => ({
        ...prev,
        project_manager_id: undefined,
        project_manager_stakeholder_id: undefined,
        project_manager_name_raw: '',
        project_manager_code: '',
      }));
      return;
    }
    const pm = employeeStakeholders.find(
      (item) => item.name_ar === nameVal || item.name_en === nameVal
    );
    const empCode = pm ? (pm.employee_code || pm.code || '').trim() : '';
    setFormData((prev) => ({
      ...prev,
      project_manager_id: pm?.id || undefined,
      project_manager_stakeholder_id: pm?.id || undefined,
      project_manager_name_raw: nameVal,
      project_manager_code: empCode,
    }));
  };

  const handleManagerCodeChange = (code: string) => {
    if (!code) {
      setFormData((prev) => ({
        ...prev,
        project_manager_id: undefined,
        project_manager_stakeholder_id: undefined,
        project_manager_code: '',
        project_manager_name_raw: '',
      }));
      return;
    }
    const pm = employeeStakeholders.find(
      (item) => (item.employee_code || item.code || '').trim() === code
    );
    setFormData((prev) => ({
      ...prev,
      project_manager_id: pm?.id || undefined,
      project_manager_stakeholder_id: pm?.id || undefined,
      project_manager_code: code,
      project_manager_name_raw: pm
        ? pm.name_ar || pm.name_en || prev.project_manager_name_raw
        : prev.project_manager_name_raw,
    }));
  };

  // 6 Clean Unlocked Sections
  const sections = useMemo(
    () => [
      {
        num: 1,
        title: isAr ? 'تعريف المشروع' : 'Project Identity',
        shortTitle: isAr ? 'تعريف المشروع' : 'Identity',
        icon: Building2,
      },
      {
        num: 2,
        title: isAr ? 'أطراف التعاقد' : 'Contractual Parties',
        shortTitle: isAr ? 'أطراف التعاقد' : 'Parties',
        icon: Users,
      },
      {
        num: 3,
        title: isAr ? 'الموقع الجغرافي' : 'Geographic Location',
        shortTitle: isAr ? 'الموقع الجغرافي' : 'Location',
        icon: MapPin,
      },
      {
        num: 4,
        title: isAr ? 'نطاق الأعمال' : 'Technical Scope',
        shortTitle: isAr ? 'نطاق الأعمال' : 'Scope',
        icon: Droplets,
      },
      {
        num: 5,
        title: isAr ? 'البرنامج الزمني' : 'Project Schedule',
        shortTitle: isAr ? 'البرنامج الزمني' : 'Schedule',
        icon: Calendar,
      },
      {
        num: 6,
        title: isAr ? 'الماليات والمرفقات' : 'Financials & Docs',
        shortTitle: isAr ? 'الماليات' : 'Financials',
        icon: DollarSign,
      },
    ],
    [isAr]
  );

  const sectionStatuses = useMemo(
    () => getProjectSectionsStatus(formData, nameArError, nameEnError),
    [formData, nameArError, nameEnError]
  );

  const completedSectionsCount = useMemo(
    () => Object.values(sectionStatuses).filter((s) => s.isRequiredReady).length,
    [sectionStatuses]
  );
  const readinessPct = Math.round((completedSectionsCount / sections.length) * 100);

  const quickJumpOptions = useMemo<SelectOption[]>(
    () =>
      sections.map((sec) => {
        const st = sectionStatuses[sec.num];
        const statusText = st?.isRequiredReady
          ? isAr
            ? '✓ مكتمل'
            : '✓ Ready'
          : st?.state === 'partial'
          ? isAr
            ? '• قيد الإدخال'
            : '• In progress'
          : isAr
          ? '○ بيانات مطلوبة'
          : '○ Required';
        return {
          value: String(sec.num),
          label: `${sec.num}. ${sec.title}`,
          subLabel: statusText,
        };
      }),
    [sections, sectionStatuses, isAr]
  );

  // Free Bi-directional Section Navigation (100% Unlocked)
  const goToStep = useCallback(
    (stepNum: number) => {
      if (saving || stepNum < 1 || stepNum > 6 || stepNum === currentStep) return;
      setErrorMsg('');
      setSlideDirection(stepNum > currentStep ? 'forward' : 'backward');
      setCurrentStep(stepNum);
      formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [saving, currentStep]
  );

  // Create Project Anytime Action (Callable from any of the 6 sections)
  const executeCreateProject = async () => {
    if (saving) return;

    const validation = validateProjectForCreation(formData, nameArError, nameEnError);
    if (!validation.isValid && validation.firstIssue) {
      const issue = validation.firstIssue;
      const msg = isAr ? issue.messageAr : issue.messageEn;
      setErrorMsg(msg);
      if (issue.fieldId === 'client-select-container') {
        setClientError(msg);
      }
      toast.error(msg);

      if (issue.step !== currentStep) {
        setSlideDirection(issue.step > currentStep ? 'forward' : 'backward');
        setCurrentStep(issue.step);
      }

      setTimeout(() => {
        const el = document.getElementById(issue.fieldId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof (el as HTMLInputElement).focus === 'function') {
            (el as HTMLInputElement).focus();
          }
        } else {
          formTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 150);
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setClientError('');

    try {
      const needsSurface = doesScopeRequireSurfaceArea(currentScopes);
      const effectiveArea = needsSurface
        ? boqTotals.totalArea > 0
          ? boqTotals.totalArea
          : formData.water_area_m2
        : formData.water_area_m2 || 0;
      const effectiveVol = needsSurface
        ? boqTotals.totalVol > 0
          ? boqTotals.totalVol
          : formData.water_vol_m3
        : formData.water_vol_m3 || 0;

      const payloadData = {
        ...formData,
        water_area_m2: effectiveArea,
        water_vol_m3: effectiveVol,
        total_water_area_m2: effectiveArea,
        total_water_volume_m3: effectiveVol,
      };
      await ProjectService.createProject(payloadData);
      clearProjectFormDraft();
      setLastSavedDraftAt(null);
      setHasRestoredDraft(false);
      toast.success(
        isAr ? 'تم إنشاء المشروع وحفظ بياناته بنجاح!' : 'Project created and saved successfully!'
      );
      router.push('/projects');
    } catch (rawErr: unknown) {
      const err = rawErr as { message?: string };
      console.error(err);
      const msg =
        err.message ||
        (isAr
          ? 'حدث خطأ أثناء إنشاء المشروع في قاعدة البيانات'
          : 'An error occurred while creating the project');
      setErrorMsg(msg);
      toast.error(msg);
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeCreateProject();
  };

  const handleDiscardDraft = () => {
    const confirmMsg = isAr
      ? 'هل أنت متأكد من مسح المسودة وتفريغ جميع الحقول للبدء من جديد؟'
      : 'Are you sure you want to discard this draft and reset all fields?';
    if (typeof window !== 'undefined' && window.confirm(confirmMsg)) {
      clearProjectFormDraft();
      setFormData(INITIAL_PROJECT_FORM_DATA);
      setCurrentStep(1);
      setAverageDepthM(1.4);
      setIsAutoVolume(true);
      setIsVatEnabled(true);
      setLastSavedDraftAt(null);
      setHasRestoredDraft(false);
      toast.success(isAr ? 'تم مسح المسودة والبدء من جديد' : 'Draft discarded');
      handleRegenerateCode();
    }
  };

  const selectedGov = governorates.find((g) => g.id === formData.governorate_id);
  const selectedCity = cities.find((c) => c.id === formData.city_id);
  const isSubContractor =
    formData.pzone_role === 'Sub Contractor' || (formData.pzone_role as string) === 'sub_contractor';
  const showWaterSurfaceCard = doesScopeRequireSurfaceArea(currentScopes);
  const showStationsNetworkCard = doesScopeIncludeStationsOrNetworks(currentScopes);

  // Security & RBAC Guard
  if (!loadingRoles && !canCreate) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 text-center" dir="rtl">
        <div className="max-w-md w-full p-8 rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 shadow-xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto border border-red-200/80 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {isAr ? 'غير مصرح لك بإضافة مشاريع جديدة' : 'Access Denied: Cannot Create Projects'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {isAr
              ? 'إنشاء وتأسيس المشروعات الجديدة متاح فقط للإدارة التنفيذية ومسؤولي التخطيط والقطاع التجاري.'
              : 'Creating new projects is restricted to executive leadership and planning/commercial managers.'}
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => router.replace('/projects')}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-teal-600/20 active:scale-95"
            >
              {isAr ? 'العودة إلى قائمة المشاريع' : 'Back to Projects List'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-12">
      {/* Clean Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-1">
          <BackButton href="/projects" label={isAr ? 'العودة لقائمة المشاريع' : 'Back to Projects'} />
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-1 flex items-center gap-2">
            <span>{isAr ? 'تأسيس مشروع جديد' : 'Create New Project'}</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              {isAr ? 'إعداد مرن' : 'Project Setup'}
            </span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {isAr
              ? 'تنقّل بحرية بين الأقسام من الأعلى، وتظهر الحقول تلقائياً حسب اختياراتك ثم اضغط «إنشاء المشروع» في أي وقت.'
              : 'Navigate freely across sections at the top, fill contextual fields, and create the project anytime.'}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
          {lastSavedDraftAt && isDirty && (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isAr ? 'مسودة محفوظة' : 'Draft saved'}</span>
              <span className="text-[10px] font-mono">
                (
                {new Date(lastSavedDraftAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                )
              </span>
            </div>
          )}

          {isDirty && (
            <button
              type="button"
              disabled={saving}
              onClick={handleDiscardDraft}
              className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 px-2.5 py-1 rounded-xl hover:bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isAr ? 'مسح المسودة' : 'Discard Draft'}
            </button>
          )}

          <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
            <span>{isAr ? `القسم ${currentStep} من 6` : `Section ${currentStep} of 6`}</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-black">({readinessPct}%)</span>
          </span>
        </div>
      </div>

      {/* Restored Draft Notice */}
      {hasRestoredDraft && (
        <div
          role="status"
          aria-live="polite"
          className="px-3.5 py-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-teal-800 dark:text-teal-200 text-xs flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
            <span>
              <strong className="font-bold">
                {isAr ? 'تمت استعادة المسودة تلقائياً:' : 'Draft restored:'}
              </strong>{' '}
              {isAr
                ? 'تم استرجاع البيانات المدخلة سابقاً لاستكمال العمل دون فقدان أي حقل.'
                : 'Previously entered fields were restored automatically.'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setHasRestoredDraft(false)}
            className="text-teal-600 hover:text-teal-800 dark:text-teal-300 p-1 rounded-lg cursor-pointer"
            aria-label={isAr ? 'إغلاق التنبيه' : 'Dismiss'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Unlocked Sticky Top Navigation Bar + Quick-Jump Dropdown + Persistent Create Button */}
      <nav
        aria-label={isAr ? 'أقسام تأسيس المشروع' : 'Project setup sections'}
        className="sticky top-[68px] z-30 bg-white dark:bg-slate-900 py-3 px-3.5 sm:px-5 shadow-md rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5"
      >
        {/* Top Readiness Progress Rail */}
        <div className="relative w-full bg-slate-100 dark:bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-l from-emerald-500 via-teal-400 to-cyan-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.max(8, readinessPct)}%` }}
            role="progressbar"
            aria-valuenow={readinessPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={isAr ? 'نسبة اكتمال الحقول الأساسية للمشروع' : 'Project readiness percentage'}
          />
        </div>

        {/* Unlocked 6-Section Tabs */}
        <div
          role="tablist"
          className="flex items-center justify-between overflow-x-auto no-scrollbar py-0.5 gap-1.5"
        >
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isCurrent = sec.num === currentStep;
            const isReady = Boolean(sectionStatuses[sec.num]?.isRequiredReady);

            return (
              <button
                key={sec.num}
                type="button"
                role="tab"
                id={`stepper-tab-${sec.num}`}
                aria-selected={isCurrent}
                aria-current={isCurrent ? 'step' : undefined}
                disabled={saving}
                onClick={() => goToStep(sec.num)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                  isCurrent
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : isReady
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/80'
                    : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 hover:bg-white dark:hover:bg-slate-800'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-mono shrink-0 ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : isReady
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  {isReady && !isCurrent ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </span>
                <span className="whitespace-nowrap">{sec.title}</span>
              </button>
            );
          })}
        </div>

        {/* Quick-Jump Dropdown + Persistent Create Project Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 w-full sm:w-80">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
              {isAr ? 'انتقال سريع:' : 'Quick jump:'}
            </span>
            <div className="flex-1">
              <CustomSelect
                id="quick_section_jump"
                options={quickJumpOptions}
                value={String(currentStep)}
                onChange={(val) => goToStep(Number(val))}
                placeholder={isAr ? 'اختر القسم للانتقال المباشر...' : 'Jump to section...'}
              />
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              {isAr
                ? `الأقسام الجاهزة: ${completedSectionsCount} من 6`
                : `Ready sections: ${completedSectionsCount} of 6`}
            </span>
            <button
              id="top_create_project_btn"
              type="button"
              disabled={saving}
              onClick={executeCreateProject}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer min-h-[40px]"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>{isAr ? 'جاري الإنشاء...' : 'Creating...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{isAr ? 'إنشاء المشروع' : 'Create Project'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Container */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {errorMsg && (
            <div
              ref={errorRef}
              role="alert"
              aria-live="assertive"
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-black text-rose-900 dark:text-rose-100">
                    {isAr ? 'استكمال بيانات أساسية' : 'Required Field Missing'}
                  </div>
                  <p className="font-semibold text-rose-700 dark:text-rose-300 mt-0.5">{errorMsg}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg('')}
                aria-label={isAr ? 'إغلاق التنبيه' : 'Dismiss'}
                className="text-rose-600 hover:text-rose-800 dark:text-rose-300 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div ref={formTopRef} className="scroll-mt-60" />
          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
                e.preventDefault();
              }
            }}
            className="relative glass-card p-4 sm:p-6 space-y-6"
          >
            {saving && (
              <div
                role="status"
                aria-live="polite"
                className="absolute inset-0 z-40 bg-white/85 dark:bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6 text-center rounded-2xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-lg">
                  <RefreshCw className="w-6 h-6 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {isAr ? 'جاري إنشاء المشروع وحفظ السجلات...' : 'Creating project...'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm">
                    {isAr
                      ? 'يتم تسجيل بيانات المشروع في قاعدة البيانات، يرجى الانتظار لحظات.'
                      : 'Saving project data to the database, please wait.'}
                  </p>
                </div>
              </div>
            )}

            <fieldset disabled={saving} className="space-y-6">
              <div
                key={currentStep}
                className={
                  slideDirection === 'forward'
                    ? 'animate-step-forward-rtl'
                    : 'animate-step-backward-rtl'
                }
              >
                {/* =========================================================
                    SECTION 1: تعريف المشروع (Project Identity ONLY)
                   ========================================================= */}
                {currentStep === 1 && (
                  <div className="space-y-5">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{isAr ? '1. تعريف المشروع' : '1. Project Identity'}</span>
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        {isAr
                          ? 'الكود الرسمي، اسم المشروع، والحالة التشغيلية.'
                          : 'Official project code, contractual names, and operational status.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Project Code */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label
                            htmlFor="project_code"
                            className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                          >
                            {isAr ? 'كود المشروع' : 'Project Code'}
                            <span className="text-rose-500 font-bold ms-1" aria-hidden="true">
                              *
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={handleRegenerateCode}
                            disabled={autoCodeLoading}
                            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${autoCodeLoading ? 'animate-spin' : ''}`}
                            />
                            <span>{isAr ? 'توليد كود جديد' : 'Regenerate'}</span>
                          </button>
                        </div>
                        <input
                          id="project_code"
                          type="text"
                          value={formData.project_code}
                          onChange={(e) => handleChange('project_code', e.target.value)}
                          className="glass-input w-full font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm"
                          placeholder="2614"
                          required
                        />
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          {isAr
                            ? 'كود رقمي فريد يمثل سنة التعاقد والرقم التسلسلي.'
                            : 'Unique year + sequence code.'}
                        </p>
                      </div>

                      {/* Operational Status */}
                      <div>
                        <label
                          htmlFor="initial_status"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr ? 'الحالة التشغيلية للمشروع' : 'Project Operational Status'}
                          <span className="text-rose-500 font-bold ms-1" aria-hidden="true">
                            *
                          </span>
                        </label>
                        <CustomSelect
                          id="initial_status"
                          options={[
                            {
                              value: 'tender',
                              label: isAr ? 'مرحلة الدراسة والعطاء' : 'Tender / Bidding',
                            },
                            {
                              value: 'not_started',
                              label: isAr ? 'مُسند — لم يبدأ التنفيذ' : 'Awarded — Not Started',
                            },
                            {
                              value: 'working',
                              label: isAr ? 'قيد التنفيذ' : 'In Progress',
                            },
                            {
                              value: 'on_hold',
                              label: isAr ? 'متوقف مؤقتاً' : 'On Hold',
                            },
                            {
                              value: 'handing_over',
                              label: isAr ? 'قيد التسليم الابتدائي' : 'Handing Over',
                            },
                            {
                              value: 'finished',
                              label: isAr ? 'مُنتهٍ ومُسلّم' : 'Finished',
                            },
                            {
                              value: 'cancelled',
                              label: isAr ? 'ملغي' : 'Cancelled',
                            },
                          ]}
                          value={formData.status}
                          onChange={(val) => handleChange('status', val)}
                        />
                      </div>

                      {/* Arabic Project Name */}
                      <div className="sm:col-span-2 space-y-2">
                        <FloatingLabelInput
                          id="project_name"
                          label={isAr ? 'اسم المشروع الرسمي بالعربية *' : 'Official Arabic Name *'}
                          dir="rtl"
                          value={formData.project_name}
                          onChange={(e) => handleChange('project_name', e.target.value)}
                          placeholder={
                            isAr
                              ? 'مثال: حمامات سباحة وبحيرات قرية مراسي الساحل الشمالي'
                              : 'e.g. حمامات سباحة وبحيرات قرية مراسي'
                          }
                          error={nameArError || undefined}
                          fullWidth
                          badgeBgLight="#ffffff"
                          badgeBgDark="#0f172a"
                          required
                        />

                        {/* Compact Smart Name Hints Strip */}
                        {hasActiveSmartHints && (
                          <div
                            id="smart-name-hints"
                            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 text-xs"
                          >
                            <div className="flex items-center flex-wrap gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="font-bold text-slate-700 dark:text-slate-200">
                                {isAr ? 'اقتراح تلقائي من الاسم:' : 'Detected from name:'}
                              </span>
                              {unappliedHintScopes.map((scopeId) => {
                                const sc = PZONE_WATER_SCOPES.find((s) => s.id === scopeId);
                                if (!sc) return null;
                                return (
                                  <span
                                    key={scopeId}
                                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-semibold text-[11px]"
                                  >
                                    {sc.icon} {isAr ? sc.nameAr : sc.nameEn}
                                  </span>
                                );
                              })}
                              {unappliedHintGov && (
                                <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-semibold text-[11px]">
                                  📍 {isAr ? unappliedHintGov.nameAr : unappliedHintGov.nameEn}
                                </span>
                              )}
                              {unappliedHintEntity && (
                                <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold text-[11px]">
                                  🏢 {isAr ? unappliedHintEntity.nameAr : unappliedHintEntity.nameEn}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={handleApplyAllSmartHints}
                                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] transition-colors cursor-pointer"
                              >
                                {isAr ? 'تطبيق الاقتراحات' : 'Apply'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setHintsDismissedForName(currentNameSignature)}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                aria-label={isAr ? 'تجاهل الاقتراح' : 'Dismiss'}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* English Project Name */}
                      <div className="sm:col-span-2">
                        <FloatingLabelInput
                          id="project_name_en"
                          label={
                            isAr ? 'اسم المشروع بالإنجليزية (اختياري)' : 'English Project Name (Optional)'
                          }
                          dir="ltr"
                          value={formData.project_name_en}
                          onChange={(e) => handleChange('project_name_en', e.target.value)}
                          placeholder="e.g. Marassi North Coast Pools & Lagoons"
                          error={nameEnError || undefined}
                          fullWidth
                          badgeBgLight="#ffffff"
                          badgeBgDark="#0f172a"
                        />
                      </div>

                      {/* Short Display Name (Public Name) */}
                      <div className="sm:col-span-2 space-y-1">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="public_name"
                            className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                          >
                            {isAr ? 'اسم العرض المختصر' : 'Short Display Name'}
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal ms-1">
                              {isAr ? '(اختياري — يظهر في الجداول والتقارير)' : '(Optional)'}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const combined = combineProjectNames(
                                formData.project_name,
                                formData.project_name_en
                              );
                              if (!combined) {
                                toast.warning(
                                  isAr
                                    ? 'يرجى كتابة اسم المشروع أولاً'
                                    : 'Please enter the project name first'
                                );
                                return;
                              }
                              handleChange('public_name', combined);
                              toast.success(
                                isAr ? 'تم توليد اسم العرض المختصر' : 'Display name generated'
                              );
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline px-2 py-1 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{isAr ? 'توليد تلقائي' : 'Auto Generate'}</span>
                          </button>
                        </div>
                        <FloatingLabelInput
                          id="public_name"
                          label={isAr ? 'اسم العرض المختصر' : 'Short Display Name'}
                          dir="rtl"
                          value={formData.public_name || ''}
                          onChange={(e) => handleChange('public_name', e.target.value)}
                          placeholder={
                            isAr ? 'مثال: بحيرات مراسي الساحل' : 'e.g. Marassi Lagoons'
                          }
                          fullWidth
                          badgeBgLight="#ffffff"
                          badgeBgDark="#0f172a"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    SECTION 2: أطراف التعاقد (Context-Driven by P.Zone Role)
                   ========================================================= */}
                {currentStep === 2 && (
                  <div className="space-y-5">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{isAr ? '2. أطراف التعاقد والإشراف' : '2. Contractual Parties'}</span>
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        {isAr
                          ? 'اختر صفة التعاقد في الأعلى لتظهر لك حقول الجهات المطابقة لها مباشرة.'
                          : 'Choose P.Zone contractual role above to display matching party fields below.'}
                      </p>
                    </div>

                    {/* Top Context Driver: Contractual Role Selector */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                        {isAr ? 'صفة التعاقد لشركة بي زون' : 'P.Zone Contractual Role'}
                        <span className="text-rose-500 font-bold ms-1" aria-hidden="true">
                          *
                        </span>
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup">
                        {[
                          {
                            val: 'Main Contractor' as PzoneRole,
                            title: isAr
                              ? 'مقاول رئيسي (تعاقد مباشر)'
                              : 'Main Contractor (Direct Contract)',
                            desc: isAr
                              ? 'تعاقد مباشر مع المالك أو المطور العقاري للمشروع'
                              : 'Direct contract with the project owner or developer',
                          },
                          {
                            val: 'Sub Contractor' as PzoneRole,
                            title: isAr
                              ? 'مقاول باطن (تحت مقاول عام)'
                              : 'Sub Contractor (Under Main Contractor)',
                            desc: isAr
                              ? 'تعاقد من الباطن مع مقاول عام لمشروع يتبع مالكاً عقارياً'
                              : 'Subcontract under a general contractor for an end-owner project',
                          },
                        ].map((opt) => {
                          const isSelected = formData.pzone_role === opt.val;
                          return (
                            <button
                              key={opt.val}
                              type="button"
                              role="radio"
                              aria-checked={isSelected}
                              onClick={() => {
                                setFormData((prev) => {
                                  const nextRole = opt.val;
                                  const syncOwner =
                                    nextRole === 'Main Contractor' && prev.client_id
                                      ? {
                                          owner_client_id: prev.client_id,
                                          owner_name: selectedClientName || prev.metadata.owner_name,
                                        }
                                      : {};
                                  return {
                                    ...prev,
                                    pzone_role: nextRole,
                                    metadata: {
                                      ...prev.metadata,
                                      ...syncOwner,
                                    },
                                  };
                                });
                              }}
                              className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/30'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-xs font-black ${
                                    isSelected
                                      ? 'text-emerald-800 dark:text-emerald-300'
                                      : 'text-slate-800 dark:text-slate-200'
                                  }`}
                                >
                                  {opt.title}
                                </span>
                                {isSelected && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                {opt.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Context-Driven Entity Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {!isSubContractor ? (
                        /* MAIN CONTRACTOR: Single Unified Owner / Direct Employer Field */
                        <div id="client-select-container" className="sm:col-span-2 space-y-1">
                          <StakeholderEntitySelect
                            id="client_id"
                            mode="entity"
                            entities={dedupedEntities}
                            value={formData.client_id || ''}
                            preferredCategories={['owner_developer', 'main_contractor']}
                            quickAddType="owner"
                            label={
                              isAr
                                ? 'المالك / جهة الإسناد المباشر *'
                                : 'Owner / Direct Awarding Entity *'
                            }
                            quickAddLabel={isAr ? 'إضافة جهة جديدة' : 'Add Entity'}
                            placeholder={
                              isAr
                                ? 'ابحث واختر المالك أو جهة الإسناد المباشر...'
                                : 'Search & select project owner / client...'
                            }
                            onEntityCreated={(newClient) => {
                              prependClient(newClient);
                              if (clientError) setClientError('');
                              const display = isAr
                                ? newClient.name_ar
                                : newClient.name_en || newClient.name_ar;
                              setFormData((prev) => ({
                                ...prev,
                                client_id: newClient.id,
                                metadata: {
                                  ...prev.metadata,
                                  owner_client_id: newClient.id,
                                  owner_name: display,
                                },
                              }));
                            }}
                            onSelectEntity={(entity) => {
                              if (clientError) setClientError('');
                              setFormData((prev) => ({
                                ...prev,
                                client_id: entity?.id || '',
                                metadata: {
                                  ...prev.metadata,
                                  owner_client_id: entity?.id || undefined,
                                  owner_name: entity
                                    ? isAr
                                      ? entity.displayNameAr
                                      : entity.displayNameEn
                                    : '',
                                },
                              }));
                            }}
                          />
                          {clientError && (
                            <p
                              role="alert"
                              className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1"
                            >
                              {clientError}
                            </p>
                          )}
                        </div>
                      ) : (
                        /* SUB CONTRACTOR: Distinct End-Owner + Main Contractor Fields */
                        <>
                          <div className="space-y-1">
                            <StakeholderEntitySelect
                              id="owner_client_id"
                              mode="entity"
                              entities={dedupedEntities}
                              value={(formData.metadata?.owner_client_id as string) || ''}
                              legacyDisplayValue={formData.metadata?.owner_name || ''}
                              preferredCategories={['owner_developer']}
                              quickAddType="owner"
                              label={
                                isAr
                                  ? 'المالك / المطور العقاري للمشروع *'
                                  : 'Project Owner / Real Estate Developer *'
                              }
                              quickAddLabel={isAr ? 'إضافة مالك / مطور' : 'Add Owner'}
                              placeholder={
                                isAr
                                  ? 'اختر المالك أو المطور العقاري...'
                                  : 'Select project owner / developer...'
                              }
                              onEntityCreated={(newOwner) => {
                                prependClient(newOwner);
                                setFormData((prev) => ({
                                  ...prev,
                                  metadata: {
                                    ...prev.metadata,
                                    owner_client_id: newOwner.id,
                                    owner_name: isAr
                                      ? newOwner.name_ar
                                      : newOwner.name_en || newOwner.name_ar,
                                  },
                                }));
                              }}
                              onSelectEntity={(entity) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  metadata: {
                                    ...prev.metadata,
                                    owner_client_id: entity?.id || undefined,
                                    owner_name: entity
                                      ? isAr
                                        ? entity.displayNameAr
                                        : entity.displayNameEn
                                      : '',
                                  },
                                }));
                              }}
                              onChange={(val) => {
                                if (
                                  val &&
                                  !/^[0-9a-f]{8}-/i.test(val) &&
                                  !dedupedEntities.some((e) => e.id === val)
                                ) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    metadata: {
                                      ...prev.metadata,
                                      owner_client_id: undefined,
                                      owner_name: val,
                                    },
                                  }));
                                }
                              }}
                            />
                          </div>

                          <div id="client-select-container" className="space-y-1">
                            <StakeholderEntitySelect
                              id="client_id"
                              mode="entity"
                              entities={dedupedEntities}
                              value={formData.client_id || ''}
                              preferredCategories={['main_contractor']}
                              quickAddType="client"
                              label={
                                isAr
                                  ? 'المقاول العام (جهة التعاقد المباشر) *'
                                  : 'Main Contractor (Direct Client) *'
                              }
                              quickAddLabel={isAr ? 'إضافة مقاول عام' : 'Add Contractor'}
                              placeholder={
                                isAr
                                  ? 'اختر المقاول العام الصادر باسمه التعاقد...'
                                  : 'Select contracting main contractor...'
                              }
                              onEntityCreated={(newClient) => {
                                prependClient(newClient);
                                if (clientError) setClientError('');
                                setFormData((prev) => ({
                                  ...prev,
                                  client_id: newClient.id,
                                }));
                              }}
                              onSelectEntity={(entity) => {
                                if (clientError) setClientError('');
                                setFormData((prev) => ({
                                  ...prev,
                                  client_id: entity?.id || '',
                                }));
                              }}
                            />
                            {clientError && (
                              <p
                                role="alert"
                                className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-1"
                              >
                                {clientError}
                              </p>
                            )}
                          </div>
                        </>
                      )}

                      {/* Client Representative */}
                      <div className="space-y-1">
                        <StakeholderEntitySelect
                          id="client_representative"
                          mode="person"
                          valueMode="name"
                          people={allStakeholders}
                          clients={clients}
                          value={
                            formData.client_representative ||
                            (formData.metadata?.client_representative as string) ||
                            ''
                          }
                          legacyDisplayValue={
                            formData.client_representative ||
                            (formData.metadata?.client_representative as string) ||
                            ''
                          }
                          preferredKinds={['client_rep']}
                          defaultQuickAddKind="client_rep"
                          preferredClientId={
                            formData.client_id ||
                            (formData.metadata?.owner_client_id as string) ||
                            undefined
                          }
                          preferredOrgName={selectedClientName}
                          label={
                            isAr ? 'ممثل جهة التعاقد بالموقع' : 'Client Representative on Site'
                          }
                          quickAddLabel={isAr ? 'إضافة ممثل' : 'Add Rep'}
                          placeholder={
                            isAr
                              ? 'ابحث واختر ممثل جهة التعاقد...'
                              : 'Search & select client representative...'
                          }
                          onPersonCreated={prependPerson}
                          onChange={(val) => {
                            setFormData((prev) => ({
                              ...prev,
                              client_representative: val,
                              metadata: {
                                ...prev.metadata,
                                client_representative: val,
                                ...(val ? {} : { client_rep_phone: undefined }),
                              },
                            }));
                          }}
                          onSelectPerson={(person) => {
                            if (person?.phone) {
                              setFormData((prev) => ({
                                ...prev,
                                metadata: {
                                  ...prev.metadata,
                                  client_rep_phone: person.phone,
                                },
                              }));
                            }
                          }}
                        />
                      </div>

                      {/* Supervision Consultant Firm */}
                      <div className="space-y-1">
                        <StakeholderEntitySelect
                          id="consultant_firm"
                          mode="entity"
                          entities={dedupedEntities}
                          value={(formData.metadata?.consultant_client_id as string) || ''}
                          legacyDisplayValue={(formData.metadata?.consultant_firm as string) || ''}
                          preferredCategories={['consultant']}
                          quickAddType="consultant"
                          label={isAr ? 'المكتب الاستشاري المشرف' : 'Supervision Consultant Firm'}
                          quickAddLabel={isAr ? 'إضافة مكتب استشاري' : 'Add Consultant'}
                          placeholder={
                            isAr
                              ? 'ابحث واختر المكتب الاستشاري...'
                              : 'Search & select consultant firm...'
                          }
                          onEntityCreated={(newConsultant) => {
                            prependClient(newConsultant);
                            setFormData((prev) => ({
                              ...prev,
                              metadata: {
                                ...prev.metadata,
                                consultant_client_id: newConsultant.id,
                                consultant_firm: isAr
                                  ? newConsultant.name_ar
                                  : newConsultant.name_en || newConsultant.name_ar,
                              },
                            }));
                          }}
                          onSelectEntity={(entity) => {
                            setFormData((prev) => ({
                              ...prev,
                              metadata: {
                                ...prev.metadata,
                                consultant_client_id: entity?.id || undefined,
                                consultant_firm: entity
                                  ? isAr
                                    ? entity.displayNameAr
                                    : entity.displayNameEn
                                  : '',
                              },
                            }));
                          }}
                          onChange={(val) => {
                            if (
                              val &&
                              !/^[0-9a-f]{8}-/i.test(val) &&
                              !dedupedEntities.some((e) => e.id === val)
                            ) {
                              setFormData((prev) => ({
                                ...prev,
                                metadata: {
                                  ...prev.metadata,
                                  consultant_client_id: undefined,
                                  consultant_firm: val,
                                },
                              }));
                            }
                          }}
                        />
                      </div>

                      {/* Consultant Resident Engineer */}
                      <div className="space-y-1">
                        <StakeholderEntitySelect
                          id="consultant_name"
                          mode="person"
                          valueMode="name"
                          people={allStakeholders}
                          clients={clients}
                          value={(formData.metadata?.consultant_name as string) || ''}
                          legacyDisplayValue={(formData.metadata?.consultant_name as string) || ''}
                          preferredKinds={['external_expert']}
                          defaultQuickAddKind="external_expert"
                          preferredClientId={
                            (formData.metadata?.consultant_client_id as string) || undefined
                          }
                          preferredOrgName={
                            (formData.metadata?.consultant_firm as string) || undefined
                          }
                          label={
                            isAr ? 'المهندس الاستشاري المقيم' : 'Consultant Resident Engineer'
                          }
                          quickAddLabel={isAr ? 'إضافة مهندس استشاري' : 'Add Engineer'}
                          placeholder={
                            isAr
                              ? 'ابحث واختر المهندس المقيم...'
                              : 'Search & select resident engineer...'
                          }
                          onPersonCreated={prependPerson}
                          onChange={(val) => {
                            setFormData((prev) => ({
                              ...prev,
                              metadata: {
                                ...prev.metadata,
                                consultant_name: val,
                                ...(val ? {} : { consultant_phone: undefined }),
                              },
                            }));
                          }}
                          onSelectPerson={(person) => {
                            if (person?.phone) {
                              setFormData((prev) => ({
                                ...prev,
                                metadata: {
                                  ...prev.metadata,
                                  consultant_phone: person.phone,
                                },
                              }));
                            }
                          }}
                        />
                      </div>

                      {/* P.Zone Project Manager */}
                      <div className="space-y-1">
                        <StakeholderEntitySelect
                          id="project_manager_name_raw"
                          mode="person"
                          valueMode="name"
                          people={employeeStakeholders}
                          clients={clients}
                          value={formData.project_manager_name_raw || ''}
                          legacyDisplayValue={formData.project_manager_name_raw || ''}
                          preferredKinds={['employee']}
                          defaultQuickAddKind="employee"
                          label={isAr ? 'مدير المشروع (بي زون)' : 'Assigned Project Manager'}
                          quickAddLabel={isAr ? 'إضافة مدير مشروع' : 'Add PM'}
                          placeholder={
                            isAr
                              ? 'ابحث واختر مدير المشروع المسؤول...'
                              : 'Search & select project manager...'
                          }
                          onPersonCreated={(newPm) => {
                            prependPerson(newPm);
                            const empCode = (newPm.employee_code || newPm.code || '').trim();
                            setFormData((prev) => ({
                              ...prev,
                              project_manager_id: newPm.id || undefined,
                              project_manager_stakeholder_id: newPm.id || undefined,
                              project_manager_name_raw: newPm.name_ar || newPm.name_en || '',
                              project_manager_code: empCode,
                            }));
                          }}
                          onChange={handleManagerNameChange}
                        />
                      </div>

                      {/* Employee Code */}
                      <div className="sm:col-span-2 sm:max-w-xs space-y-1">
                        <label
                          htmlFor="project_manager_code"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-300"
                        >
                          {isAr ? 'الكود الوظيفي لمدير المشروع' : 'PM Employee Code'}
                        </label>
                        <CustomSelect
                          id="project_manager_code"
                          options={employeeCodeOptions}
                          value={formData.project_manager_code || ''}
                          onChange={handleManagerCodeChange}
                          clearable
                          placeholder={
                            isAr ? 'يتزامن تلقائياً مع اسم المدير...' : 'Synced with PM...'
                          }
                          isLoading={isProjectManagersLoading}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    SECTION 3: الموقع الجغرافي (Geographic Location ONLY)
                   ========================================================= */}
                {currentStep === 3 && (
                  <div className="space-y-5">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span>{isAr ? '3. الموقع الجغرافي' : '3. Geographic Location'}</span>
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        {isAr
                          ? 'المحافظة والمدينة والعنوان التفصيلي وتحديد الموقع على الخريطة.'
                          : 'Governorate, city/district, address, and interactive map coordinates.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Governorate */}
                      <div>
                        <label
                          htmlFor="governorate_id"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr ? 'المحافظة' : 'Governorate'}
                          <span className="text-rose-500 font-bold ms-1" aria-hidden="true">
                            *
                          </span>
                        </label>
                        <CustomSelect
                          id="governorate_id"
                          options={governorates.map((g) => ({
                            value: g.id,
                            label: isAr ? g.name_ar : g.name_en || g.name_ar,
                          }))}
                          value={formData.governorate_id}
                          onChange={(val) => {
                            const govObj = governorates.find(
                              (g) => String(g.id) === String(val) || g.name_ar === val
                            );
                            const geoGov = govObj
                              ? findGovGeo(govObj.code || govObj.name_ar)
                              : findGovGeo(val);
                            const nextLat = geoGov ? geoGov.coords[0] : undefined;
                            const nextLng = geoGov ? geoGov.coords[1] : undefined;

                            setFormData((prev) => ({
                              ...prev,
                              governorate_id: val,
                              city_id: '',
                              ...(nextLat !== undefined && nextLng !== undefined
                                ? { gps_lat: nextLat, gps_lng: nextLng }
                                : {}),
                            }));
                          }}
                          placeholder={isAr ? 'اختر المحافظة...' : 'Select governorate...'}
                          isLoading={isGovernoratesLoading}
                        />
                      </div>

                      {/* City */}
                      <div>
                        <label
                          htmlFor="city_id"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr ? 'المدينة / المنطقة' : 'City / District'}
                        </label>
                        <CustomSelect
                          id="city_id"
                          disabled={!formData.governorate_id}
                          options={
                            formData.governorate_id
                              ? cities.map((c) => ({
                                  value: c.id,
                                  label: isAr ? c.name_ar : c.name_en || c.name_ar,
                                }))
                              : []
                          }
                          value={formData.city_id}
                          onChange={(val) => {
                            const cityObj = cities.find(
                              (c) => String(c.id) === String(val) || c.name_ar === val
                            );
                            const govObj = governorates.find(
                              (g) => String(g.id) === String(formData.governorate_id)
                            );
                            const geoGov = govObj
                              ? findGovGeo(govObj.code || govObj.name_ar)
                              : findGovGeo(formData.governorate_id);
                            const geoCity = cityObj
                              ? findCityGeo(
                                  cityObj.name_ar,
                                  govObj?.code || govObj?.name_ar || formData.governorate_id
                                )
                              : findCityGeo(
                                  val,
                                  govObj?.code || govObj?.name_ar || formData.governorate_id
                                );

                            const targetLat =
                              (cityObj as { coords?: number[] } | undefined)?.coords?.[0] ??
                              geoCity?.coords[0] ??
                              geoGov?.coords[0];
                            const targetLng =
                              (cityObj as { coords?: number[] } | undefined)?.coords?.[1] ??
                              geoCity?.coords[1] ??
                              geoGov?.coords[1];

                            setFormData((prev) => ({
                              ...prev,
                              city_id: val,
                              ...(targetLat !== undefined && targetLng !== undefined
                                ? { gps_lat: targetLat, gps_lng: targetLng }
                                : {}),
                              site_location_address:
                                !prev.site_location_address && cityObj
                                  ? isAr
                                    ? cityObj.name_ar
                                  : cityObj.name_en || cityObj.name_ar
                                  : prev.site_location_address,
                            }));
                          }}
                          placeholder={
                            formData.governorate_id
                              ? isAr
                                ? 'اختر المدينة أو المنطقة...'
                                : 'Select city...'
                              : isAr
                              ? 'اختر المحافظة أولاً...'
                              : 'Select governorate first...'
                          }
                          isLoading={isCitiesLoading}
                        />
                      </div>

                      {/* Detailed Site Address */}
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="site_location_address"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr ? 'العنوان التفصيلي للموقع' : 'Detailed Site Address'}
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal ms-1">
                            {isAr ? '(اختياري)' : '(Optional)'}
                          </span>
                        </label>
                        <input
                          id="site_location_address"
                          type="text"
                          value={formData.site_location_address}
                          onChange={(e) => handleChange('site_location_address', e.target.value)}
                          placeholder={
                            isAr
                              ? 'مثال: الكيلو 135 طريق الإسكندرية مطروح — قرية مراسي'
                              : 'e.g. Km 135 Alex-Matrouh Rd, Marassi'
                          }
                          className="glass-input w-full text-xs"
                        />
                      </div>
                    </div>

                    {/* Interactive Map Picker */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                          {isAr ? 'تحديد الموقع على الخريطة' : 'Pin Location on Map'}
                        </label>
                        <span
                          className="text-[11px] font-mono font-bold text-cyan-700 dark:text-cyan-400"
                          dir="ltr"
                        >
                          {formData.gps_lat && formData.gps_lng
                            ? `${formData.gps_lat.toFixed(4)}, ${formData.gps_lng.toFixed(4)}`
                            : ''}
                        </span>
                      </div>
                      <ProjectLocationPickerMap
                        lat={formData.gps_lat || 30.0444}
                        lng={formData.gps_lng || 31.2357}
                        onChange={handleMapLocationChange}
                        governorateName={
                          isAr ? selectedGov?.name_ar : selectedGov?.name_en || selectedGov?.name_ar
                        }
                        cityName={
                          isAr
                            ? selectedCity?.name_ar
                            : selectedCity?.name_en || selectedCity?.name_ar
                        }
                      />
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {isAr
                            ? 'انقر على الخريطة لتحديث الإحداثيات والتعرف التلقائي على المحافظة والمدينة.'
                            : 'Click the map to update coordinates and auto-detect governorate and city.'}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    SECTION 4: نطاق الأعمال (Context-Driven by Selected Scopes)
                   ========================================================= */}
                {currentStep === 4 && (
                  <div className="space-y-5">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                        <span>{isAr ? '4. نطاق الأعمال والمواصفات الهندسية' : '4. Technical Scope'}</span>
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        {isAr
                          ? 'حدد التخصصات من الشريط العلوي لتظهر تحتها فقط المواصفات الهندسية الخاصة بها.'
                          : 'Select scopes above to display only the engineering specifications relevant to them.'}
                      </p>
                    </div>

                    {/* Top Context Driver: Scope Chips */}
                    <div className="space-y-2.5">
                      <label
                        id="water-scopes-label"
                        className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                      >
                        {isAr
                          ? 'التخصصات المشمولة بنطاق المشروع'
                          : 'Project Technical Scopes'}
                        <span className="text-rose-500 font-bold ms-1" aria-hidden="true">
                          *
                        </span>
                      </label>
                      <div
                        role="group"
                        aria-labelledby="water-scopes-label"
                        className="grid grid-cols-2 sm:grid-cols-3 gap-2.5"
                      >
                        {PZONE_WATER_SCOPES.map((scope) => {
                          const isSelected = currentScopes.includes(scope.id);
                          return (
                            <button
                              key={scope.id}
                              type="button"
                              role="checkbox"
                              aria-checked={isSelected}
                              onClick={() => handleToggleScope(scope.id)}
                              className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold border transition-all text-start cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              <span className="text-base">{scope.icon}</span>
                              <span className="truncate">
                                {isAr ? scope.nameAr : scope.nameEn}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {currentScopes.length === 0 && (
                      <div className="p-5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                        {isAr
                          ? 'اختر تخصصاً واحداً أو أكثر من الأعلى لإظهار حقول المواصفات المناسبة له.'
                          : 'Select at least one scope above to reveal its specification fields.'}
                      </div>
                    )}

                    {/* Dynamic Card A: Water Surface Dimensions (Only when Pools/Lagoons/Fountains/Jacuzzi selected) */}
                    {showWaterSurfaceCard && (
                      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                              {isAr
                                ? 'المساحات والأعماق التصميمية للمسطحات المائية'
                                : 'Water Surface Dimensions & Depth'}
                            </span>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isAutoVolume}
                            onClick={() => {
                              const nextAuto = !isAutoVolume;
                              setIsAutoVolume(nextAuto);
                              if (nextAuto) {
                                setFormData((prev) => ({
                                  ...prev,
                                  water_vol_m3: calculateWaterVolume(
                                    prev.water_area_m2,
                                    averageDepthM
                                  ),
                                }));
                              }
                            }}
                            className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isAutoVolume
                                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-800 dark:text-cyan-300'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isAutoVolume
                              ? isAr
                                ? 'حساب الحجم تلقائياً'
                                : 'Auto Volume'
                              : isAr
                              ? 'إدخال الحجم يدوياً'
                              : 'Manual Volume'}
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* Area */}
                          <div>
                            <label
                              htmlFor="water_area_m2"
                              className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1"
                            >
                              {isAr ? 'إجمالي مسطح المياه (م²)' : 'Water Surface Area (m²)'}
                              <span className="text-rose-500 font-bold ms-1" aria-hidden="true">
                                *
                              </span>
                            </label>
                            <input
                              id="water_area_m2"
                              type="number"
                              min="0"
                              value={formData.water_area_m2 || ''}
                              onChange={(e) => handleAreaChange(parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="glass-input w-full font-mono font-bold text-cyan-700 dark:text-cyan-400 text-xs"
                            />
                          </div>

                          {/* Depth + Slider + 4 Presets */}
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label
                                htmlFor="water_depth_m"
                                className="block text-[11px] font-bold text-slate-700 dark:text-slate-200"
                              >
                                {isAr ? 'متوسط العمق التصميمي (متر)' : 'Average Depth (m)'}
                              </label>
                              <span className="font-mono text-xs font-black text-cyan-700 dark:text-cyan-400">
                                {averageDepthM.toFixed(1)} {isAr ? 'م' : 'm'}
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              <input
                                id="water_depth_m"
                                type="number"
                                step="0.1"
                                min="0.1"
                                max="10"
                                value={averageDepthM || ''}
                                onChange={(e) => handleDepthChange(parseFloat(e.target.value) || 0)}
                                placeholder="1.4"
                                className="glass-input w-full font-mono font-bold text-slate-700 dark:text-slate-200 text-xs"
                              />
                              <input
                                type="range"
                                min="0.4"
                                max="3.5"
                                step="0.1"
                                value={
                                  typeof averageDepthM === 'number' && !isNaN(averageDepthM)
                                    ? Math.min(3.5, Math.max(0.4, averageDepthM))
                                    : 1.4
                                }
                                onChange={(e) => handleDepthChange(parseFloat(e.target.value) || 0)}
                                className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                aria-label={isAr ? 'شريط تمرير تحديد متوسط العمق' : 'Average depth slider'}
                              />
                            </div>
                            <div
                              role="group"
                              aria-label={isAr ? 'خيارات العمق القياسية' : 'Depth presets'}
                              className="flex items-center gap-1.5 flex-wrap mt-2"
                            >
                              {[
                                { val: 0.6, label: isAr ? '0.6م أطفال' : '0.6m Kids' },
                                { val: 1.4, label: isAr ? '1.4م قياسي' : '1.4m Standard' },
                                { val: 2.0, label: isAr ? '2.0م أولمبي' : '2.0m Olympic' },
                                { val: 2.5, label: isAr ? '2.5م لاجون' : '2.5m Lagoon' },
                              ].map((preset) => {
                                const isActive = Math.abs(averageDepthM - preset.val) < 0.05;
                                return (
                                  <button
                                    key={preset.val}
                                    type="button"
                                    aria-pressed={isActive}
                                    onClick={() => handleDepthChange(preset.val)}
                                    className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                      isActive
                                        ? 'bg-cyan-600 text-white border-cyan-600 font-bold'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-cyan-500'
                                    }`}
                                  >
                                    {preset.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Volume */}
                          <div>
                            <label
                              htmlFor="water_vol_m3"
                              className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1"
                            >
                              {isAr ? 'إجمالي حجم المياه (م³)' : 'Total Water Volume (m³)'}
                            </label>
                            <input
                              id="water_vol_m3"
                              type="number"
                              min="0"
                              disabled={isAutoVolume}
                              value={formData.water_vol_m3 || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  water_vol_m3: parseFloat(e.target.value) || 0,
                                }))
                              }
                              placeholder="0"
                              className={`glass-input w-full font-mono font-bold text-xs ${
                                isAutoVolume
                                  ? 'bg-slate-100 dark:bg-slate-800/80 text-teal-700 dark:text-teal-400 cursor-not-allowed'
                                  : 'text-teal-700 dark:text-teal-400'
                              }`}
                            />
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                              {isAutoVolume
                                ? isAr
                                  ? 'يُحسب تلقائياً (المساحة × العمق).'
                                  : 'Auto-calculated (Area × Depth).'
                                : isAr
                                ? 'إدخال يدوي مباشر.'
                                : 'Manual input.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Card B: Stations & MEP Networks (Only when Pump Rooms / Treatment / Irrigation selected) */}
                    {showStationsNetworkCard && (
                      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                            {isAr
                              ? 'المواصفات الفنية للمحطات والشبكات الكهروميكانيكية'
                              : 'Stations & MEP Networks Specifications'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label
                              htmlFor="stations_count"
                              className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1"
                            >
                              {isAr
                                ? 'عدد غرف الطلمبات / المحطات'
                                : 'Number of Pump Rooms / Stations'}
                            </label>
                            <input
                              id="stations_count"
                              type="number"
                              min="0"
                              value={(formData.metadata?.stations_count as number) || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  metadata: {
                                    ...prev.metadata,
                                    stations_count: parseInt(e.target.value, 10) || 0,
                                  },
                                }))
                              }
                              placeholder="1"
                              className="glass-input w-full font-mono font-bold text-xs"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label
                              htmlFor="technical_scope_notes"
                              className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1"
                            >
                              {isAr
                                ? 'التوصيف الفني للقدرات والشبكات (اختياري)'
                                : 'Technical Capacity & Network Notes (Optional)'}
                            </label>
                            <input
                              id="technical_scope_notes"
                              type="text"
                              value={(formData.metadata?.technical_scope_notes as string) || ''}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  metadata: {
                                    ...prev.metadata,
                                    technical_scope_notes: e.target.value,
                                  },
                                }))
                              }
                              placeholder={
                                isAr
                                  ? 'مثال: محطة فلاتر رملية بقدرة 250 م³/ساعة + شبكة تغذية رئيسية'
                                  : 'e.g. Sand filtration plant 250 m³/hr + main feed network'
                              }
                              className="glass-input w-full text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* =========================================================
                    SECTION 5: البرنامج الزمني (Project Schedule ONLY)
                   ========================================================= */}
                {currentStep === 5 && (
                  <div className="space-y-5">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>{isAr ? '5. البرنامج الزمني والمدد' : '5. Project Schedule'}</span>
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        {isAr
                          ? 'تواريخ التعاقد والبدء والتسليم المخطط ومحضر استلام الموقع.'
                          : 'Contract signing, planned start, planned handover, and site possession status.'}
                      </p>
                    </div>

                    {/* Quick Duration Presets */}
                    <div
                      role="group"
                      aria-label={isAr ? 'مدد تعاقدية سريعة' : 'Quick duration presets'}
                      className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 font-bold">
                        <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>{isAr ? 'اختيار سريع لمدة التنفيذ:' : 'Quick Duration:'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[3, 6, 9, 12, 18].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleApplyDurationPreset(m)}
                            className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 hover:bg-purple-500/15 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          >
                            {isAr ? `${m} أشهر` : `${m} mo`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="contract_date"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr ? 'تاريخ توقيع العقد' : 'Contract Signing Date'}
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal ms-1">
                            {isAr ? '(اختياري)' : '(Optional)'}
                          </span>
                        </label>
                        <input
                          id="contract_date"
                          type="date"
                          value={formData.contract_date}
                          onChange={(e) => handleChange('contract_date', e.target.value)}
                          className="glass-input w-full text-xs"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="site_possession_letter"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr ? 'موقف محضر استلام الموقع' : 'Site Possession Handover'}
                        </label>
                        <CustomSelect
                          id="site_possession_letter"
                          options={[
                            {
                              value: 'موجود',
                              label: isAr ? 'تم استلام الموقع رسمياً' : 'Officially Handed Over',
                            },
                            {
                              value: 'غير موجود',
                              label: isAr ? 'لم يُستلم بعد' : 'Not Handed Over Yet',
                            },
                          ]}
                          value={formData.site_possession_letter}
                          onChange={(val) => handleChange('site_possession_letter', val)}
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="planned_start_date"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr ? 'تاريخ البدء المخطط' : 'Planned Start Date'}
                          <span className="text-rose-500 font-bold ms-1" aria-hidden="true">
                            *
                          </span>
                        </label>
                        <input
                          id="planned_start_date"
                          type="date"
                          value={formData.planned_start_date}
                          onChange={(e) => handleChange('planned_start_date', e.target.value)}
                          className="glass-input w-full text-xs"
                          required
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="planned_finish_date"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr ? 'تاريخ التسليم التعاقدي المخطط' : 'Planned Finish Date'}
                          <span className="text-rose-500 font-bold ms-1" aria-hidden="true">
                            *
                          </span>
                        </label>
                        <input
                          id="planned_finish_date"
                          type="date"
                          value={formData.planned_finish_date}
                          onChange={(e) => handleChange('planned_finish_date', e.target.value)}
                          className="glass-input w-full text-xs"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2 sm:max-w-xs">
                        <label
                          htmlFor="contract_duration_months"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr ? 'مدة التنفيذ المحسوبة (بالشهور)' : 'Calculated Duration (Months)'}
                        </label>
                        <input
                          id="contract_duration_months"
                          type="number"
                          step="0.1"
                          disabled
                          value={formData.contract_duration_months || ''}
                          placeholder="0"
                          className="glass-input w-full font-mono font-bold bg-slate-100 dark:bg-slate-800/80 text-purple-700 dark:text-purple-400 text-xs cursor-not-allowed"
                        />
                        {dateValidation.durationDays > 0 && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                            {isAr
                              ? `تعادل ${dateValidation.durationDays} يوماً تقويمياً.`
                              : `Equals ${dateValidation.durationDays} calendar days.`}
                          </p>
                        )}
                      </div>
                    </div>

                    {!dateValidation.isValid && dateValidation.error && (
                      <div
                        role="alert"
                        className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{dateValidation.error}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* =========================================================
                    SECTION 6: الماليات والمرفقات (Clean Core Fields + Optional Accordions)
                   ========================================================= */}
                {currentStep === 6 && (
                  <div className="space-y-5">
                    <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>
                          {isAr ? '6. الماليات والمستندات التعاقدية' : '6. Financials & Documents'}
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                        {isAr
                          ? 'إجمالي قيمة التعاقد والميزانية التقديرية وموقف نسخة العقد (مع تفاصيل متقدمة مطوية اختيارياً).'
                          : 'Contract value, estimated budget, and contract archival status.'}
                      </p>
                    </div>

                    {/* 14% VAT Switch */}
                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {isAr ? 'ضريبة القيمة المضافة (14%)' : 'Value Added Tax (14%)'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {isAr
                            ? 'احتساب ضريبة القيمة المضافة تلقائياً فوق صافي قيمة التعاقد'
                            : 'Auto-calculate 14% VAT on net contract amount'}
                        </div>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isVatEnabled}
                        onClick={() => setIsVatEnabled(!isVatEnabled)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                          isVatEnabled
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {isVatEnabled
                          ? isAr
                            ? 'شامل ضريبة 14%'
                            : 'Includes 14% VAT'
                          : isAr
                          ? 'غير شامل الضريبة'
                          : 'Excludes VAT'}
                      </button>
                    </div>

                    {/* Core Clean Financial Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label
                          htmlFor="contract_value"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr ? 'قيمة التعاقد الأساسية (ج.م)' : 'Net Contract Value (EGP)'}
                          {formData.status !== 'tender' && (
                            <span className="text-rose-500 font-bold ms-1" aria-hidden="true">
                              *
                            </span>
                          )}
                        </label>
                        <input
                          id="contract_value"
                          type="number"
                          min="0"
                          value={formData.contract_value || ''}
                          onChange={(e) =>
                            handleChange('contract_value', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                          className="glass-input w-full font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="total_value_with_vat_egp"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr
                            ? 'الإجمالي شامل الضريبة (ج.م)'
                            : 'Total Value incl. VAT (EGP)'}
                        </label>
                        <input
                          id="total_value_with_vat_egp"
                          type="number"
                          disabled
                          value={vatBreakdown.totalWithVat || ''}
                          placeholder="0"
                          className="glass-input w-full font-mono font-bold bg-slate-100 dark:bg-slate-800/80 text-emerald-700 dark:text-emerald-400 text-xs cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="advance_payment_pct"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr ? 'نسبة الدفعة المقدمة (%)' : 'Advance Payment (%)'}
                        </label>
                        <input
                          id="advance_payment_pct"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.metadata?.advance_payment_pct ?? 0}
                          onChange={(e) =>
                            handleChange('metadata', {
                              ...formData.metadata,
                              advance_payment_pct: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="glass-input w-full font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="estimated_cost"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr
                            ? 'التكلفة التقديرية للتنفيذ (ج.م)'
                            : 'Estimated Direct Cost (EGP)'}
                        </label>
                        <input
                          id="estimated_cost"
                          type="number"
                          min="0"
                          value={formData.estimated_cost || ''}
                          onChange={(e) =>
                            handleChange('estimated_cost', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                          className="glass-input w-full font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="estimated_budget"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr
                            ? 'الميزانية المعتمدة للمشروع (ج.م)'
                            : 'Approved Project Budget (EGP)'}
                        </label>
                        <input
                          id="estimated_budget"
                          type="number"
                          min="0"
                          value={formData.estimated_budget || ''}
                          onChange={(e) =>
                            handleChange('estimated_budget', parseFloat(e.target.value) || 0)
                          }
                          placeholder="0"
                          className="glass-input w-full font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="completion_pct"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr ? 'نسبة الإنجاز الفعلي الحالية (%)' : 'Current Completion (%)'}
                        </label>
                        <input
                          id="completion_pct"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.completion_pct}
                          onChange={(e) =>
                            handleChange('completion_pct', parseFloat(e.target.value) || 0)
                          }
                          className="glass-input w-full font-mono text-emerald-700 dark:text-emerald-400 font-bold text-xs"
                        />
                      </div>

                      <div className="sm:col-span-2 lg:col-span-3">
                        <label
                          htmlFor="hardcopy_status"
                          className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
                        >
                          {isAr ? 'موقف حفظ أصل العقد الورقي' : 'Physical Contract Archival Status'}
                        </label>
                        <CustomSelect
                          id="hardcopy_status"
                          options={[
                            {
                              value: 'موجود hard copy معتمد',
                              label: isAr
                                ? 'نسخة ورقية معتمدة ومحفوظة بالإدارة'
                                : 'Approved Physical Contract on File',
                            },
                            {
                              value: 'موجود hard copy معتمد فى التأمينات',
                              label: isAr
                                ? 'نسخة ورقية معتمدة ومسجلة بالتأمينات الاجتماعية'
                                : 'Approved Contract Registered at Social Insurance',
                            },
                            {
                              value: 'غير موجود hard copy معتمد',
                              label: isAr
                                ? 'لا توجد نسخة ورقية معتمدة حتى الآن'
                                : 'No Approved Physical Contract Yet',
                            },
                            {
                              value: 'غير مكتمل',
                              label: isAr
                                ? 'قيد استكمال التوقيعات والتوثيق'
                                : 'Pending Signatures & Archival',
                            },
                          ]}
                          value={formData.hardcopy_status || 'غير مكتمل'}
                          onChange={(val) => handleChange('hardcopy_status', val)}
                        />
                      </div>
                    </div>

                    {/* Profit Margin Summary Strip */}
                    {formData.contract_value > 0 && formData.estimated_cost > 0 && (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {isAr ? 'هامش الربح المستهدف:' : 'Target Gross Profit Margin:'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                            {grossMargin.marginEgp.toLocaleString()} {isAr ? 'ج.م' : 'EGP'}
                          </span>
                          <span
                            className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${
                              grossMargin.status === 'healthy'
                                ? 'bg-emerald-700 text-white'
                                : grossMargin.status === 'warning'
                                ? 'bg-amber-700 text-white'
                                : 'bg-rose-700 text-white'
                            }`}
                          >
                            {grossMargin.marginPct}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Optional Collapsed Accordion 1: Guarantees & Retention */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <button
                        type="button"
                        aria-expanded={showGuaranteesAccordion}
                        onClick={() => setShowGuaranteesAccordion((prev) => !prev)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        <span>
                          {isAr
                            ? 'خطابات الضمان والتأمينات التعاقدية (اختياري)'
                            : 'Bank Guarantees & Retention Terms (Optional)'}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-500 transition-transform ${
                            showGuaranteesAccordion ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {showGuaranteesAccordion && (
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                          <ProjectGuaranteesSection
                            metadata={formData.metadata || {}}
                            onChange={(updatedMeta) => {
                              handleChange('metadata', {
                                ...formData.metadata,
                                ...updatedMeta,
                              });
                            }}
                            contractBaseValue={Number(formData.contract_value || 0)}
                            vosValue={Number(formData.vos_value || 0)}
                            isAr={isAr}
                          />
                        </div>
                      )}
                    </div>

                    {/* Optional Collapsed Accordion 2: Variation Orders & Multi-Structure Distribution */}
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                      <button
                        type="button"
                        aria-expanded={showBreakdownAccordion}
                        onClick={() => setShowBreakdownAccordion((prev) => !prev)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        <span>
                          {isAr
                            ? 'أوامر التغيير وتوزيع القيمة على منشآت فرعية (اختياري)'
                            : 'Variation Orders & Sub-Structure Breakdown (Optional)'}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-500 transition-transform ${
                            showBreakdownAccordion ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {showBreakdownAccordion && (
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-5">
                          <VariationOrdersManager
                            variationOrders={formData.variation_orders || []}
                            onChange={handleVariationOrdersChange}
                            contractBaseValue={Number(formData.contract_value || 0)}
                            structures={formData.water_structures || []}
                            isAr={isAr}
                          />

                          {/* Optional Sub-Structure Distribution */}
                          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                                <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span>
                                  {isAr
                                    ? 'توزيع المشروع على منشآت فرعية (عند الحاجة)'
                                    : 'Sub-Structures Breakdown'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button
                                  type="button"
                                  onClick={() => handleAddWaterStructure('lagoon')}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>{isAr ? 'إضافة منشأ فرعي' : 'Add Structure'}</span>
                                </button>
                                {boqTotals.totalBase > 0 && (
                                  <button
                                    type="button"
                                    onClick={syncContractFromBoq}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1 rounded-lg cursor-pointer"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                    <span>
                                      {isAr
                                        ? 'نسخ المجموع إلى قيمة التعاقد'
                                        : 'Copy Total to Contract Value'}
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2.5">
                              {(formData.water_structures || []).map((st, idx) => (
                                <div
                                  key={st.id || idx}
                                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end text-xs"
                                >
                                  <div className="sm:col-span-4">
                                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                      {isAr ? 'اسم المنشأ الفرعي' : 'Structure Name'}
                                    </label>
                                    <input
                                      type="text"
                                      value={st.name || ''}
                                      onChange={(e) =>
                                        handleUpdateWaterStructure(idx, 'name', e.target.value)
                                      }
                                      className="glass-input w-full text-xs"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                      {isAr ? 'المساحة (م²)' : 'Area (m²)'}
                                    </label>
                                    <input
                                      type="number"
                                      value={st.area_m2 || ''}
                                      onChange={(e) =>
                                        handleUpdateWaterStructure(
                                          idx,
                                          'area_m2',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="glass-input w-full font-mono text-xs"
                                    />
                                  </div>
                                  <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                      {isAr ? 'الحجم (م³)' : 'Volume (m³)'}
                                    </label>
                                    <input
                                      type="number"
                                      value={st.volume_m3 || ''}
                                      onChange={(e) =>
                                        handleUpdateWaterStructure(
                                          idx,
                                          'volume_m3',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="glass-input w-full font-mono text-xs"
                                    />
                                  </div>
                                  <div className="sm:col-span-3">
                                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                                      {isAr ? 'القيمة التعاقدية (ج.م)' : 'Contract Value (EGP)'}
                                    </label>
                                    <input
                                      type="number"
                                      value={st.base_price_egp || ''}
                                      onChange={(e) =>
                                        handleUpdateWaterStructure(
                                          idx,
                                          'base_price_egp',
                                          Number(e.target.value)
                                        )
                                      }
                                      className="glass-input w-full font-mono text-xs"
                                    />
                                  </div>
                                  <div className="sm:col-span-1 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteWaterStructure(idx)}
                                      disabled={(formData.water_structures || []).length <= 1}
                                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 disabled:opacity-30 cursor-pointer"
                                      aria-label={isAr ? 'حذف المنشأ' : 'Remove'}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Persistent Footer Actions (Navigate Freely OR Create Immediately from ANY Section) */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => goToStep(currentStep - 1)}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] cursor-pointer"
                    >
                      <ArrowRight className="w-4 h-4" />
                      <span>{isAr ? 'القسم السابق' : 'Previous Section'}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2.5 ms-auto">
                  {currentStep < 6 && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => goToStep(currentStep + 1)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-emerald-600/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs transition-all min-h-[44px] cursor-pointer"
                    >
                      <span>{isAr ? 'القسم التالي' : 'Next Section'}</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    id="confirm_submit_btn"
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50 min-h-[44px] cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                        <span>{isAr ? 'جاري إنشاء المشروع...' : 'Creating Project...'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{isAr ? 'إنشاء المشروع' : 'Create Project'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </fieldset>
          </form>
        </div>

        {/* Live Project Summary Card (With Direct Section Jump Pills) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <LiveProjectPreviewCard
            formData={formData}
            clientName={selectedClientName}
            ownerName={resolvedOwnerName}
            governorateName={
              isAr ? selectedGov?.name_ar : selectedGov?.name_en || selectedGov?.name_ar
            }
            cityName={
              isAr ? selectedCity?.name_ar : selectedCity?.name_en || selectedCity?.name_ar
            }
            currentStep={currentStep}
            onJumpToStep={goToStep}
            sectionStatuses={sectionStatuses}
            grossMargin={grossMargin}
            vatBreakdown={vatBreakdown}
            durationDays={dateValidation.durationDays}
            durationMonths={dateValidation.durationMonths}
            isAr={isAr}
          />
        </div>
      </div>
    </div>
  );
}
