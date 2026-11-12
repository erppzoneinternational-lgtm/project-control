'use client';

import React, { useState, useEffect, useMemo, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ProjectService } from '@/lib/services/project.service';
import {
  Project,
  Client,
  Governorate,
  City,
  PzoneRole,
  ProjectStatus,
  WaterScopeType,
  WaterStructure,
  VariationOrderItem,
  Stakeholder,
  StakeholderFull,
} from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { CustomSelect, SelectOption } from '@/components/ui/CustomSelect';
import { StakeholderEntitySelect } from '@/components/ui/StakeholderEntitySelect';
import {
  deduplicateEntities,
  deduplicatePeople,
  findCanonicalEntity,
  normalizeTextForSearch,
} from '@/lib/directory/entityDirectory';
import { BackButton } from '@/components/ui/BackButton';
import {
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  MapPin,
  Layers,
  DollarSign,
  Calendar,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Lock,
  Sparkles,
  ChevronDown,
  Wrench,
  Droplets,
} from 'lucide-react';
import { validateArabicField, validateEnglishField } from '@/lib/utils/language-validator';
import {
  validateProjectDates,
  PZONE_WATER_SCOPES,
  doesScopeRequireSurfaceArea,
  doesScopeIncludeStationsOrNetworks,
  addMonthsToDate,
} from '@/lib/utils/project-creation.utils';
import { combineProjectNames } from '@/lib/utils/project-draft.utils';
import { fmtNum } from '@/lib/format';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { useAssignedProjects } from '@/lib/hooks/useAssignedProjects';
import { canEditPath } from '@/lib/rbac/access-control';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProjectGuaranteesSection } from '@/components/contracts/ProjectGuaranteesSection';
import { VariationOrdersManager } from '@/components/projects/VariationOrdersManager';
import { calculateNetVos } from '@/lib/services/project.payload';

const ProjectLocationPickerMap = dynamic(
  () =>
    import('@/components/projects/ProjectLocationPickerMap').then(
      (mod) => mod.ProjectLocationPickerMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[260px] w-full rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs text-slate-500">
        جاري تحميل الخريطة التفاعلية...
      </div>
    ),
  }
);

const PROJECT_STATUSES: { key: ProjectStatus; labelAr: string; labelEn: string }[] = [
  { key: 'working', labelAr: 'قيد التنفيذ', labelEn: 'In Progress' },
  { key: 'not_started', labelAr: 'مُسند — لم يبدأ', labelEn: 'Not Started' },
  { key: 'tender', labelAr: 'مرحلة الدراسة والعطاء', labelEn: 'Tender / Bidding' },
  { key: 'on_hold', labelAr: 'متوقف مؤقتاً', labelEn: 'On Hold' },
  { key: 'handing_over', labelAr: 'قيد التسليم الابتدائي', labelEn: 'Handing Over' },
  { key: 'finished', labelAr: 'مُنتهٍ ومُسلّم', labelEn: 'Finished' },
  { key: 'cancelled', labelAr: 'ملغي', labelEn: 'Cancelled' },
];

const EDIT_SECTIONS = [
  { id: 'edit-section-1', step: 1, titleAr: 'تعريف المشروع', titleEn: 'Project Identity', icon: Building2 },
  { id: 'edit-section-2', step: 2, titleAr: 'أطراف التعاقد', titleEn: 'Contracting Parties', icon: Users },
  { id: 'edit-section-3', step: 3, titleAr: 'الموقع الجغرافي', titleEn: 'Location', icon: MapPin },
  { id: 'edit-section-4', step: 4, titleAr: 'نطاق الأعمال', titleEn: 'Technical Scope', icon: Layers },
  { id: 'edit-section-5', step: 5, titleAr: 'البرنامج الزمني', titleEn: 'Schedule', icon: Calendar },
  { id: 'edit-section-6', step: 6, titleAr: 'الماليات والمرفقات', titleEn: 'Financials & Docs', icon: DollarSign },
] as const;

interface EditProjectPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { locale, t } = useLanguage();
  const { roles, isAdmin, isLoading: rolesLoading } = useUserRoles();
  const { data: dbAccessRules, isLoading: accessLoading } = useModuleAccess();
  const { isUnrestricted, allowedProjectIds, isLoading: assignedLoading } = useAssignedProjects();

  const isAuthChecking = rolesLoading || accessLoading || assignedLoading;
  const isViewerOnly =
    roles.length > 0 && roles.every((r) => r.toLowerCase() === 'viewer') && !isAdmin;
  const canEditProjects =
    !isViewerOnly && canEditPath('/projects', roles, isAdmin, dbAccessRules);
  const hasProjectScope =
    isUnrestricted || Boolean(allowedProjectIds && allowedProjectIds.includes(id));
  const isAuthorizedToEdit = canEditProjects && hasProjectScope;

  const [activeSectionId, setActiveSectionId] = useState<string>('edit-section-1');
  const [clients, setClients] = useState<Client[]>([]);
  const [governorates, setGovernorates] = useState<Governorate[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [projectManagers, setProjectManagers] = useState<
    Awaited<ReturnType<typeof ProjectService.getProjectManagers>>
  >([]);
  const [stakeholdersDirectory, setStakeholdersDirectory] = useState<StakeholderFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [waterStructures, setWaterStructures] = useState<WaterStructure[]>([]);
  const [variationOrders, setVariationOrders] = useState<VariationOrderItem[]>([]);
  const [showGuaranteesAccordion, setShowGuaranteesAccordion] = useState(false);
  const [showVosAccordion, setShowVosAccordion] = useState(false);
  const [showSubStructuresAccordion, setShowSubStructuresAccordion] = useState(false);

  const [formData, setFormData] = useState<Partial<Project>>({
    project_code: '',
    project_name: '',
    project_name_ar: '',
    project_name_en: '',
    public_name: '',
    pzone_role: 'Main Contractor',
    client_id: '',
    governorate_id: '',
    city_id: '',
    site_location_address: '',
    gps_lat: 0,
    gps_lng: 0,
    water_scope_type: 'pool',
    water_area_m2: 0,
    water_vol_m3: 0,
    total_water_area_m2: 0,
    total_water_volume_m3: 0,
    estimated_budget: 0,
    estimated_cost: 0,
    contract_value: 0,
    contract_value_egp: 0,
    vat_amount_egp: 0,
    total_value_with_vat_egp: 0,
    vos_value: 0,
    start_date: '',
    end_date: '',
    planned_start_date: '',
    planned_finish_date: '',
    actual_start_date: '',
    actual_finish_date: '',
    contract_date: '',
    contract_duration_months: 0,
    status: 'working',
    contract_status: '',
    hardcopy_status: '',
    site_possession_letter: '',
    toc_letter: '',
    project_manager_stakeholder_id: null as string | null,
    project_manager_name_raw: '',
    hold_reason: '',
    cancel_reason: '',
    completion_pct: 0,
    metadata: {},
  });

  const isAr = locale === 'ar';
  const isSubContractor =
    formData.pzone_role === 'Sub Contractor' || formData.pzone_role === 'sub_contractor';

  const jumpToSection = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
    if (typeof document !== 'undefined') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, []);

  const updateWaterStructuresState = (structures: WaterStructure[]) => {
    setWaterStructures(structures);
    const totalArea = structures.reduce((sum, item) => sum + (Number(item.area_m2) || 0), 0);
    const totalVol = structures.reduce((sum, item) => sum + (Number(item.volume_m3) || 0), 0);

    setFormData((prev) => ({
      ...prev,
      water_structures: structures,
      ...(totalArea > 0 ? { water_area_m2: totalArea, total_water_area_m2: totalArea } : {}),
      ...(totalVol > 0 ? { water_vol_m3: totalVol, total_water_volume_m3: totalVol } : {}),
    }));
  };

  const handleAddWaterStructure = (suggestedType: string = 'lagoon') => {
    const nextIdx = waterStructures.length + 1;
    const typeLabel =
      suggestedType === 'pump_room'
        ? 'غرفة طلمبات ومحطة'
        : suggestedType === 'lagoon'
        ? 'بحيرة صناعية'
        : suggestedType === 'pool'
        ? 'حمام سباحة'
        : suggestedType === 'tank'
        ? 'خزان مياه وتوازن'
        : suggestedType === 'fountain'
        ? 'نافورة مائية'
        : suggestedType === 'mep_network'
        ? 'شبكات كهروميكانيكية'
        : 'منشأ مائي';

    const newSt: WaterStructure = {
      id: `ws_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
    updateWaterStructuresState([...waterStructures, newSt]);
    setShowSubStructuresAccordion(true);
  };

  const handleUpdateWaterStructure = (
    index: number,
    field: keyof WaterStructure,
    val: WaterStructure[keyof WaterStructure]
  ) => {
    const updated = [...waterStructures];
    const current = { ...updated[index], [field]: val };

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

    updated[index] = current;
    updateWaterStructuresState(updated);
  };

  const handleDeleteWaterStructure = (index: number) => {
    if (waterStructures.length <= 1) return;
    const updated = waterStructures.filter((_, i) => i !== index);
    updateWaterStructuresState(updated);
  };

  const syncContractFromBoq = () => {
    const totalBoq = waterStructures.reduce((s, it) => s + (Number(it.base_price_egp) || 0), 0);
    const totalVos = waterStructures.reduce((s, it) => s + (Number(it.vos_value_egp) || 0), 0);
    const vat = Math.round(totalBoq * 0.14 * 100) / 100;
    const totalWithVat = Math.round((totalBoq + vat + totalVos) * 100) / 100;

    setFormData((prev) => ({
      ...prev,
      contract_value: totalBoq,
      contract_value_egp: totalBoq,
      vos_value: totalVos,
      vat_amount_egp: vat,
      total_value_with_vat_egp: totalWithVat,
    }));

    setToast({
      type: 'success',
      message: isAr
        ? 'تمت مزامنة قيمة التعاقد وأوامر التغيير والضريبة من إجمالي المنشآت الفرعية'
        : 'Contract value and VAT synced from sub-structures',
    });
  };

  const handleVariationOrdersChange = (updatedOrders: VariationOrderItem[]) => {
    const { netVos } = calculateNetVos(updatedOrders);
    setVariationOrders(updatedOrders);
    setFormData((prev) => {
      const base = Number(prev.contract_value) || 0;
      const vat = Number(prev.vat_amount_egp) || Math.round(base * 0.14 * 100) / 100;
      return {
        ...prev,
        variation_orders: updatedOrders,
        vos_value: netVos,
        total_value_with_vat_egp: Math.round((base + vat + netVos) * 100) / 100,
        metadata: {
          ...(prev.metadata || {}),
          variation_orders: updatedOrders,
        },
      };
    });
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
    : formData.client_name_raw || undefined;

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
    setClients((prev) => [newClient, ...prev.filter((c) => c.id !== newClient.id)]);
  }, []);

  const prependPerson = useCallback((newPerson: Stakeholder) => {
    const fullPerson: StakeholderFull = {
      organization_id: '00000000-0000-0000-0000-000000000001',
      stakeholder_kind: newPerson.stakeholder_kind || 'employee',
      is_active: true,
      assigned_projects_count: 0,
      ...newPerson,
    };
    setStakeholdersDirectory((prev) => [fullPerson, ...prev.filter((p) => p.id !== fullPerson.id)]);
    if ((fullPerson.stakeholder_kind || 'employee') === 'employee') {
      setProjectManagers((prev) => [newPerson, ...prev.filter((p) => p.id !== newPerson.id)]);
    }
  }, []);

  const handleManagerNameChange = (nameVal: string) => {
    if (!nameVal) {
      setFormData((prev) => ({
        ...prev,
        project_manager_id: '',
        project_manager_stakeholder_id: null,
        project_manager_name_raw: '',
        project_manager_code: '',
      }));
      return;
    }
    const pm = employeeStakeholders.find(
      (item) => item.name_ar === nameVal || item.name_en === nameVal
    );
    const empCode = pm ? (pm.employee_code || pm.code || '').trim() : '';
    const stakeholderId = pm ? pm.id : null;
    setFormData((prev) => ({
      ...prev,
      project_manager_id: pm?.id || prev.project_manager_id || '',
      project_manager_name_raw: nameVal,
      project_manager_code: empCode,
      project_manager_stakeholder_id: stakeholderId,
    }));
  };

  const handleManagerCodeChange = (code: string) => {
    if (!code) {
      setFormData((prev) => ({
        ...prev,
        project_manager_id: '',
        project_manager_code: '',
        project_manager_name_raw: '',
        project_manager_stakeholder_id: null,
      }));
      return;
    }
    const pm = employeeStakeholders.find(
      (item) => (item.employee_code || item.code || '').trim() === code
    );
    setFormData((prev) => ({
      ...prev,
      project_manager_code: code,
      project_manager_id: pm ? pm.id : prev.project_manager_id || '',
      project_manager_name_raw: pm
        ? pm.name_ar || pm.name_en || prev.project_manager_name_raw || ''
        : prev.project_manager_name_raw || '',
      project_manager_stakeholder_id: pm ? pm.id : prev.project_manager_stakeholder_id || null,
    }));
  };

  const selectedScopes = useMemo<string[]>(() => {
    const fromMeta = formData.metadata?.water_features;
    if (Array.isArray(fromMeta) && fromMeta.length > 0) {
      return fromMeta.map(String);
    }
    const st = String(formData.water_scope_type || '').toLowerCase();
    if (st.includes('lagoon')) return ['lagoons'];
    if (st.includes('fountain')) return ['fountains'];
    if (st.includes('pump') || st.includes('station') || st.includes('treatment')) return ['treatment'];
    if (st.includes('irrig')) return ['irrigation'];
    return ['pools'];
  }, [formData.metadata?.water_features, formData.water_scope_type]);

  const requiresSurfaceArea = useMemo(
    () => doesScopeRequireSurfaceArea(selectedScopes),
    [selectedScopes]
  );

  const includesStationsOrNetworks = useMemo(
    () => doesScopeIncludeStationsOrNetworks(selectedScopes),
    [selectedScopes]
  );

  const toggleScopeFeature = (scopeId: string) => {
    setFormData((prev) => {
      const fromMeta = prev.metadata?.water_features;
      const baseScopes: string[] =
        Array.isArray(fromMeta) && fromMeta.length > 0 ? fromMeta.map(String) : selectedScopes;
      const nextScopes = baseScopes.includes(scopeId)
        ? baseScopes.filter((s) => s !== scopeId)
        : [...baseScopes, scopeId];
      const primaryScope: WaterScopeType = nextScopes.includes('lagoons')
        ? 'lagoon'
        : nextScopes.includes('fountains')
        ? 'fountain'
        : nextScopes.includes('pools')
        ? 'pool'
        : 'mixed';

      return {
        ...prev,
        water_scope_type: primaryScope,
        metadata: {
          ...(prev.metadata || {}),
          water_features: nextScopes,
        },
      };
    });
  };

  const nameArError = validateArabicField(
    formData.project_name || formData.project_name_ar || '',
    'اسم المشروع الرسمي بالعربية'
  );
  const nameEnError = validateEnglishField(
    formData.project_name_en || '',
    'اسم المشروع بالإنجليزية'
  );

  useEffect(() => {
    if (isAuthChecking || !isAuthorizedToEdit) return;
    if (formData.governorate_id) {
      ProjectService.getCities(formData.governorate_id).then(setCities);
    } else {
      ProjectService.getCities().then(setCities);
    }
  }, [formData.governorate_id, isAuthChecking, isAuthorizedToEdit]);

  useEffect(() => {
    if (isAuthChecking) return;
    if (!isAuthorizedToEdit) {
      setLoading(false);
      return;
    }
    async function init() {
      setLoading(true);
      try {
        const [projectData, clientList, govList, pmList, directoryList] = await Promise.all([
          ProjectService.getProjectById(id),
          ProjectService.getClients(),
          ProjectService.getGovernorates(),
          ProjectService.getProjectManagers(),
          typeof ProjectService.getStakeholdersDirectory === 'function'
            ? ProjectService.getStakeholdersDirectory({ kind: 'all' }).catch(
                () => [] as StakeholderFull[]
              )
            : Promise.resolve([] as StakeholderFull[]),
        ]);

        setClients(clientList);
        setGovernorates(govList);
        setProjectManagers(pmList);
        setStakeholdersDirectory(directoryList);

        if (projectData) {
          const rawStructures =
            projectData.water_structures && projectData.water_structures.length > 0
              ? projectData.water_structures
              : projectData.metadata?.water_structures &&
                Array.isArray(projectData.metadata.water_structures) &&
                projectData.metadata.water_structures.length > 0
              ? (projectData.metadata.water_structures as WaterStructure[])
              : null;

          const initialStructures: WaterStructure[] = rawStructures
            ? rawStructures.map((st, i) => {
                const baseP = Number(st.base_price_egp) || 0;
                const vosP = Number(st.vos_value_egp) || 0;
                const finalP = Number(st.final_price_egp) || baseP + vosP;
                const area = Number(st.area_m2) || 0;
                const vol = Number(st.volume_m3) || 0;
                return {
                  id: st.id || `ws_${i + 1}`,
                  type: st.type || 'lagoon',
                  name: st.name || `عنصر ${i + 1}`,
                  area_m2: area,
                  volume_m3: vol,
                  base_price_egp: baseP,
                  vos_value_egp: vosP,
                  final_price_egp: finalP,
                  unit_rate_m2: area > 0 ? Math.round(finalP / area) : 0,
                  unit_rate_m3: vol > 0 ? Math.round(finalP / vol) : 0,
                  notes: st.notes || '',
                };
              })
            : [
                {
                  id: 'ws_1',
                  type: projectData.water_scope_type || 'lagoon',
                  name: 'المنشأ الرئيسي',
                  area_m2: Number(projectData.water_area_m2) || 0,
                  volume_m3: Number(projectData.water_vol_m3) || 0,
                  base_price_egp: Number(projectData.contract_value) || 0,
                  vos_value_egp: Number(projectData.vos_value) || 0,
                  final_price_egp:
                    (Number(projectData.contract_value) || 0) +
                    (Number(projectData.vos_value) || 0),
                  unit_rate_m2: 0,
                  unit_rate_m3: 0,
                  notes: '',
                },
              ];

          setWaterStructures(initialStructures);
          if (initialStructures.length > 1) {
            setShowSubStructuresAccordion(true);
          }

          const calcTotalArea = initialStructures.reduce(
            (sum, item) => sum + (Number(item.area_m2) || 0),
            0
          );
          const calcTotalVol = initialStructures.reduce(
            (sum, item) => sum + (Number(item.volume_m3) || 0),
            0
          );

          const initialVos: VariationOrderItem[] = Array.isArray(
            projectData.metadata?.variation_orders
          )
            ? (projectData.metadata.variation_orders as VariationOrderItem[])
            : [];
          setVariationOrders(initialVos);
          if (initialVos.length > 0) {
            setShowVosAccordion(true);
          }

          // Explicit DB-column mapping (never spread enriched relation objects)
          setFormData({
            project_code: projectData.project_code || '',
            project_name: projectData.project_name || '',
            project_name_ar: projectData.project_name_ar || '',
            project_name_en: projectData.project_name_en || '',
            public_name:
              projectData.public_name ||
              (projectData.metadata?.public_name as string) ||
              '',
            pzone_role: projectData.pzone_role || 'Main Contractor',
            client_id: projectData.client_id || '',
            client_name_raw: projectData.client_name_raw || '',
            client_representative:
              projectData.client_representative ||
              (projectData.metadata?.client_representative as string) ||
              '',
            governorate_id: projectData.governorate_id || '',
            city_id: projectData.city_id || '',
            site_location_address: projectData.site_location_address || '',
            gps_lat: projectData.gps_lat ?? projectData.location_gps_lat ?? 0,
            gps_lng: projectData.gps_lng ?? projectData.location_gps_lng ?? 0,
            water_scope_type: projectData.water_scope_type || 'pool',
            water_structures: initialStructures,
            variation_orders: initialVos,
            water_area_m2: projectData.water_area_m2 || calcTotalArea || 0,
            water_vol_m3: projectData.water_vol_m3 || calcTotalVol || 0,
            total_water_area_m2: projectData.water_area_m2 || calcTotalArea || 0,
            total_water_volume_m3: projectData.water_vol_m3 || calcTotalVol || 0,
            estimated_budget: projectData.estimated_budget ?? 0,
            estimated_cost: projectData.estimated_cost ?? 0,
            contract_value: projectData.contract_value ?? 0,
            contract_value_egp: projectData.contract_value_egp ?? projectData.contract_value ?? 0,
            vat_amount_egp: projectData.vat_amount_egp ?? 0,
            total_value_with_vat_egp: projectData.total_value_with_vat_egp ?? 0,
            vos_value: projectData.vos_value ?? 0,
            start_date: projectData.start_date || projectData.planned_start_date || '',
            end_date: projectData.end_date || projectData.planned_finish_date || '',
            planned_start_date: projectData.planned_start_date || '',
            planned_finish_date: projectData.planned_finish_date || '',
            actual_start_date: projectData.actual_start_date || '',
            actual_finish_date: projectData.actual_finish_date || '',
            contract_date: projectData.contract_date || '',
            contract_duration_months: projectData.contract_duration_months ?? 0,
            status: projectData.status || 'working',
            contract_status: projectData.contract_status || '',
            hardcopy_status: projectData.hardcopy_status || '',
            site_possession_letter: projectData.site_possession_letter || '',
            toc_letter: projectData.toc_letter || '',
            project_manager_id:
              projectData.project_manager_id ||
              pmList.find(
                (p) =>
                  p.name_ar ===
                  (projectData.pm_full_name || projectData.project_manager_name_raw)
              )?.id ||
              '',
            project_manager_stakeholder_id: (projectData.project_manager_stakeholder_id ||
              pmList.find(
                (p) =>
                  p.name_ar ===
                  (projectData.pm_full_name || projectData.project_manager_name_raw)
              )?.id ||
              null) as string | null,
            project_manager_name_raw: projectData.project_manager_name_raw || '',
            project_manager_code:
              projectData.project_manager_code ||
              directoryList.find((p) => p.name_ar === projectData.project_manager_name_raw)
                ?.employee_code ||
              pmList.find((p) => p.name_ar === projectData.project_manager_name_raw)
                ?.employee_code ||
              pmList.find((p) => p.name_ar === projectData.project_manager_name_raw)?.code ||
              '',
            hold_reason: projectData.hold_reason || '',
            cancel_reason: projectData.cancel_reason || '',
            completion_pct: projectData.completion_pct ?? 0,
            metadata: projectData.metadata || {},
          });
          setLoadError(null);
        } else {
          setLoadError(
            isAr
              ? 'تعذر العثور على بيانات هذا المشروع أو ليس لديك صلاحية للوصول إليه'
              : 'Could not find project data or you do not have permission to view it'
          );
        }
      } catch (rawErr: unknown) {
        const err = rawErr as { message?: string };
        console.error('Error fetching project for edit:', err);
        setLoadError(
          err?.message ||
            (isAr ? 'حدث خطأ أثناء تحميل بيانات المشروع' : 'Failed to load project data')
        );
        setToast({ type: 'error', message: t('edit_project.save_error') });
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id, reloadCounter, isAuthChecking, isAuthorizedToEdit, isAr, t]);

  const handleChange = (field: keyof Project, value: Project[keyof Project]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNumberChange = (field: keyof Project, valStr: string) => {
    const num = valStr === '' ? 0 : Number(valStr);
    setFormData((prev) => {
      const next = { ...prev, [field]: num };
      if (field === 'contract_value') {
        const vat = Math.round(num * 0.14 * 100) / 100;
        const total = Math.round((num + vat + (Number(prev.vos_value) || 0)) * 100) / 100;
        next.contract_value_egp = num;
        next.vat_amount_egp = vat;
        next.total_value_with_vat_egp = total;
      } else if (field === 'vos_value') {
        const base = Number(prev.contract_value) || 0;
        const vat = Number(prev.vat_amount_egp) || Math.round(base * 0.14 * 100) / 100;
        next.total_value_with_vat_egp = Math.round((base + vat + num) * 100) / 100;
      }
      return next;
    });
  };

  const boqTotals = useMemo(() => {
    const totalArea = waterStructures.reduce((sum, item) => sum + (Number(item.area_m2) || 0), 0);
    const totalVol = waterStructures.reduce((sum, item) => sum + (Number(item.volume_m3) || 0), 0);
    const totalBase = waterStructures.reduce(
      (sum, item) => sum + (Number(item.base_price_egp) || 0),
      0
    );
    const totalVos = waterStructures.reduce(
      (sum, item) => sum + (Number(item.vos_value_egp) || 0),
      0
    );
    const totalFinal = waterStructures.reduce(
      (sum, item) =>
        sum +
        (Number(item.final_price_egp) ||
          (Number(item.base_price_egp) || 0) + (Number(item.vos_value_egp) || 0)),
      0
    );

    const contractVal = Number(formData.contract_value) || 0;
    const projectVos = Number(formData.vos_value) || 0;
    const projectTotal = contractVal + projectVos;

    const baseDiff = totalBase - contractVal;
    const vosDiff = totalVos - projectVos;
    const finalDiff = totalFinal - projectTotal;

    const isBaseMatched = Math.abs(baseDiff) < 1;
    const isVosMatched = Math.abs(vosDiff) < 1;
    const isTotalMatched = Math.abs(finalDiff) < 1;

    return {
      totalArea,
      totalVol,
      totalBase,
      totalVos,
      totalFinal,
      contractVal,
      projectVos,
      projectTotal,
      baseDiff,
      isFullyReconciled: isBaseMatched && isVosMatched && isTotalMatched,
    };
  }, [waterStructures, formData.contract_value, formData.vos_value]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAuthorizedToEdit) return;
    if (nameArError || nameEnError) {
      setToast({
        type: 'error',
        message:
          nameArError ||
          nameEnError ||
          (isAr ? 'يرجى تصحيح أخطاء الاسم قبل الحفظ' : 'Please resolve name errors before saving'),
      });
      jumpToSection('edit-section-1');
      return;
    }

    const dateCheck = validateProjectDates(
      formData.planned_start_date || formData.start_date,
      formData.planned_finish_date || formData.end_date
    );
    if (!dateCheck.isValid) {
      setToast({
        type: 'error',
        message: dateCheck.error || (isAr ? 'خطأ في تواريخ المشروع' : 'Invalid project dates'),
      });
      jumpToSection('edit-section-5');
      return;
    }

    setSaving(true);
    setToast(null);

    try {
      const resolvedArea =
        showSubStructuresAccordion && boqTotals.totalArea > 0
          ? boqTotals.totalArea
          : Number(formData.water_area_m2) || 0;
      const resolvedVol =
        showSubStructuresAccordion && boqTotals.totalVol > 0
          ? boqTotals.totalVol
          : Number(formData.water_vol_m3) || 0;

      const safeFormData = {
        ...formData,
        water_structures: waterStructures,
        variation_orders: variationOrders,
        total_water_area_m2: resolvedArea,
        total_water_volume_m3: resolvedVol,
        water_area_m2: resolvedArea,
        water_vol_m3: resolvedVol,
      };
      await ProjectService.updateProject(id, safeFormData);
      setToast({ type: 'success', message: t('edit_project.save_success') });
      setTimeout(() => {
        router.push(`/projects/${id}`);
      }, 900);
    } catch (rawErr: unknown) {
      const err = rawErr as { message?: string };
      console.error('Failed to save project:', err);
      setToast({ type: 'error', message: err?.message || t('edit_project.save_error') });
    } finally {
      setSaving(false);
    }
  };

  if (isAuthChecking || loading) {
    return (
      <div
        className="w-full max-w-5xl mx-auto py-12 flex flex-col items-center justify-center space-y-4"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" aria-hidden="true" />
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{t('common.loading')}</p>
      </div>
    );
  }

  if (!isAuthorizedToEdit) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 px-4 text-center space-y-4" role="alert">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mx-auto border border-amber-200 dark:border-amber-900/60 shadow-sm">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          {isAr ? '403 — غير مصرح بتعديل المشروع' : '403 — Unauthorized to Edit Project'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {isAr
            ? 'حسابك الحالي مخصص للعرض فقط أو غير مسند لهذا المشروع. لا يمكنك تعديل بيانات المشروع.'
            : 'Your account has view-only access or is not assigned to this project.'}
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <BackButton
            href={`/projects/${id}`}
            label={isAr ? 'العودة لصفحة المشروع' : 'Back to Project'}
          />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 px-4 text-center space-y-4" role="alert">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900/60 shadow-sm">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          {isAr ? 'خطأ في تحميل المشروع' : 'Failed to Load Project'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">{loadError}</p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <BackButton href="/projects" label={t('common.back')} />
          <button
            type="button"
            onClick={() => setReloadCounter((c) => c + 1)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            {isAr ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  const quickJumpOptions: SelectOption[] = EDIT_SECTIONS.map((sec) => ({
    value: sec.id,
    label: `${sec.step}. ${isAr ? sec.titleAr : sec.titleEn}`,
  }));

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BackButton href={`/projects/${id}`} label={t('common.back')} />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {t('edit_project.title')}
              {formData.project_code ? ` #${formData.project_code}` : ''}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('edit_project.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Sticky Unlocked 6-Section Bar + Quick-Jump Dropdown + Persistent Save Button */}
      <div className="sticky top-[68px] z-30 glass-card p-3 shadow-md border border-slate-200/90 dark:border-slate-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 min-w-[220px] flex-1 sm:max-w-xs">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
              {isAr ? 'انتقال سريع:' : 'Quick jump:'}
            </span>
            <div className="flex-1">
              <CustomSelect
                id="edit_quick_section_jump"
                options={quickJumpOptions}
                value={activeSectionId}
                onChange={jumpToSection}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 ms-auto">
            <Link
              href={`/projects/${id}`}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {t('edit_project.cancel')}
            </Link>
            <button
              id="top_save_project_btn"
              type="button"
              onClick={() => handleSubmit()}
              disabled={saving || Boolean(nameArError) || Boolean(nameEnError)}
              aria-busy={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="w-4 h-4" aria-hidden="true" />
              )}
              <span>
                {saving
                  ? isAr
                    ? 'جاري الحفظ...'
                    : 'Saving...'
                  : t('edit_project.save_changes')}
              </span>
            </button>
          </div>
        </div>

        {/* 6 Direct Section Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
          {EDIT_SECTIONS.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSectionId === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => jumpToSection(sec.id)}
                className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all text-start cursor-pointer border ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50/90 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/70 hover:border-emerald-500/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {sec.step}. {isAr ? sec.titleAr : sec.titleEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast Alert */}
      {toast && (
        <div
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-bold ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          }`}
        >
          <div className="flex items-center gap-2">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label={isAr ? 'إغلاق التنبيه' : 'Close alert'}
            className="p-1 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ================================================================
            SECTION 1: تعريف المشروع (Identity, Code, Status & Names ONLY)
            ================================================================ */}
        <fieldset
          id="edit-section-1"
          onFocusCapture={() => setActiveSectionId('edit-section-1')}
          className="glass-card p-6 space-y-5 scroll-mt-56"
          aria-labelledby="section_1_title"
        >
          <legend
            id="section_1_title"
            className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-3 w-full font-bold text-sm"
          >
            <Building2 className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{t('edit_project.section_identification')}</span>
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label
                htmlFor="project_code"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.project_code')}{' '}
                <span className="text-rose-500" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="project_code"
                type="text"
                required
                dir="ltr"
                value={formData.project_code || ''}
                onChange={(e) => handleChange('project_code', e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl font-mono font-bold text-start"
                placeholder="2601"
              />
            </div>

            <div>
              <label
                htmlFor="project_name"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.project_name')}{' '}
                <span className="text-rose-500" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="project_name"
                type="text"
                dir="rtl"
                required
                aria-invalid={Boolean(nameArError)}
                value={formData.project_name || ''}
                onChange={(e) => handleChange('project_name', e.target.value)}
                className={`glass-input w-full px-3 py-2 rounded-xl text-end ${
                  nameArError ? 'border-rose-500 ring-1 ring-rose-500' : ''
                }`}
              />
              {nameArError && (
                <p
                  role="alert"
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{nameArError}</span>
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="project_name_en"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.project_name_en')}
              </label>
              <input
                id="project_name_en"
                type="text"
                dir="ltr"
                aria-invalid={Boolean(nameEnError)}
                value={formData.project_name_en || ''}
                onChange={(e) => handleChange('project_name_en', e.target.value)}
                placeholder="e.g. Marassi Lagoons & Pools"
                className={`glass-input w-full px-3 py-2 rounded-xl text-start ${
                  nameEnError ? 'border-rose-500 ring-1 ring-rose-500' : ''
                }`}
              />
              {nameEnError && (
                <p
                  role="alert"
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{nameEnError}</span>
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="public_name"
                  className="block font-bold text-slate-700 dark:text-slate-300"
                >
                  {isAr ? 'اسم العرض المختصر' : 'Short Display Name'}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const combined = combineProjectNames(
                      formData.project_name || '',
                      formData.project_name_en || ''
                    );
                    if (combined) handleChange('public_name', combined);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isAr ? 'توليد تلقائي' : 'Auto Generate'}</span>
                </button>
              </div>
              <input
                id="public_name"
                type="text"
                dir="rtl"
                value={formData.public_name || ''}
                onChange={(e) => handleChange('public_name', e.target.value)}
                placeholder={
                  isAr ? 'اسم مختصر يظهر في الجداول والتقارير...' : 'Short display name...'
                }
                className="glass-input w-full px-3 py-2 rounded-xl text-end"
              />
            </div>

            {/* Operational Status Pills */}
            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block font-black text-slate-800 dark:text-slate-100 text-xs">
                    {t('edit_project.status')}
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'حدد الحالة التشغيلية الحالية للمشروع:'
                      : 'Select current operational status:'}
                  </p>
                </div>
                <StatusBadge status={(formData.status as ProjectStatus) || 'working'} size="sm" />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {PROJECT_STATUSES.map(({ key, labelAr, labelEn }) => {
                  const isSelected = formData.status === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleChange('status', key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'
                      }`}
                    >
                      {isAr ? labelAr : labelEn}
                    </button>
                  );
                })}
              </div>

              {formData.status === 'cancelled' && (
                <div className="pt-3 border-t border-rose-200/70 dark:border-rose-900/60 space-y-1.5">
                  <label
                    htmlFor="sec1_cancel_reason"
                    className="block font-bold text-rose-600 dark:text-rose-400 text-xs"
                  >
                    {t('edit_project.cancel_reason')} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="sec1_cancel_reason"
                    rows={2}
                    dir="rtl"
                    value={formData.cancel_reason || ''}
                    onChange={(e) => handleChange('cancel_reason', e.target.value)}
                    placeholder={
                      isAr ? 'اكتب سبب إلغاء المشروع...' : 'Enter cancellation reason...'
                    }
                    className="glass-input w-full px-3 py-2 rounded-xl text-end"
                  />
                </div>
              )}

              {formData.status === 'on_hold' && (
                <div className="pt-3 border-t border-amber-200/70 dark:border-amber-900/60 space-y-1.5">
                  <label
                    htmlFor="sec1_hold_reason"
                    className="block font-bold text-amber-600 dark:text-amber-400 text-xs"
                  >
                    {t('edit_project.hold_reason')} <span className="text-amber-500">*</span>
                  </label>
                  <textarea
                    id="sec1_hold_reason"
                    rows={2}
                    dir="rtl"
                    value={formData.hold_reason || ''}
                    onChange={(e) => handleChange('hold_reason', e.target.value)}
                    placeholder={
                      isAr ? 'اكتب سبب الإيقاف المؤقت للمشروع...' : 'Enter hold reason...'
                    }
                    className="glass-input w-full px-3 py-2 rounded-xl text-end"
                  />
                </div>
              )}
            </div>
          </div>
        </fieldset>

        {/* ================================================================
            SECTION 2: أطراف التعاقد والإشراف (Parties, Consultant & PM ONLY)
            ================================================================ */}
        <fieldset
          id="edit-section-2"
          onFocusCapture={() => setActiveSectionId('edit-section-2')}
          className="glass-card p-6 space-y-5 scroll-mt-56"
          aria-labelledby="section_2_title"
        >
          <legend
            id="section_2_title"
            className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-3 w-full font-bold text-sm"
          >
            <Users className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{t('edit_project.section_parties')}</span>
          </legend>

          {/* Contractual Role Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <button
              type="button"
              onClick={() => handleChange('pzone_role', 'Main Contractor' as PzoneRole)}
              className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                !isSubContractor
                  ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="font-black text-slate-900 dark:text-white">
                {isAr ? 'مقاول رئيسي (تعاقد مباشر)' : 'Main Contractor (Direct Award)'}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'تعاقد مباشر مع المالك أو المطور العقاري للمشروع'
                  : 'Direct contract with the project owner or developer'}
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleChange('pzone_role', 'Sub Contractor' as PzoneRole)}
              className={`p-3.5 rounded-2xl border text-start transition-all cursor-pointer ${
                isSubContractor
                  ? 'border-amber-500 bg-amber-50/70 dark:bg-amber-950/30 ring-1 ring-amber-500'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="font-black text-slate-900 dark:text-white">
                {isAr ? 'مقاول باطن (تحت مقاول عام)' : 'Sub Contractor (Under General Contractor)'}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'تعاقد من الباطن مع مقاول عام لصالح مالك المشروع'
                  : 'Sub-contract through a main contractor for the project owner'}
              </p>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Context-Driven Owner & Client Fields */}
            {!isSubContractor ? (
              <div className="md:col-span-2">
                <StakeholderEntitySelect
                  id="client_id"
                  mode="entity"
                  entities={dedupedEntities}
                  value={formData.client_id || ''}
                  legacyDisplayValue={formData.client_name_raw || ''}
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
                      ? 'ابحث واختر المالك أو المطور العقاري...'
                      : 'Search & select owner / client...'
                  }
                  onEntityCreated={(newClient) => {
                    prependClient(newClient);
                    setFormData((prev) => ({
                      ...prev,
                      client_id: newClient.id,
                      client_name_raw: newClient.name_ar,
                      metadata: {
                        ...(prev.metadata || {}),
                        owner_client_id: newClient.id,
                        owner_name: newClient.name_ar,
                      },
                    }));
                  }}
                  onSelectEntity={(entity) => {
                    setFormData((prev) => ({
                      ...prev,
                      client_id: entity?.id || '',
                      client_name_raw: entity ? entity.displayNameAr : '',
                      metadata: {
                        ...(prev.metadata || {}),
                        owner_client_id: entity?.id || undefined,
                        owner_name: entity ? entity.displayNameAr : '',
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
                        client_id: '',
                        client_name_raw: val,
                      }));
                    }
                  }}
                />
              </div>
            ) : (
              <>
                <div>
                  <StakeholderEntitySelect
                    id="owner_client_id"
                    mode="entity"
                    entities={dedupedEntities}
                    value={(formData.metadata?.owner_client_id as string) || ''}
                    legacyDisplayValue={(formData.metadata?.owner_name as string) || ''}
                    preferredCategories={['owner_developer']}
                    quickAddType="owner"
                    label={
                      isAr
                        ? 'المالك / المطور العقاري للمشروع *'
                        : 'Project Owner / Real Estate Developer *'
                    }
                    quickAddLabel={isAr ? 'إضافة مالك' : 'Add Owner'}
                    placeholder={
                      isAr ? 'ابحث واختر مالك المشروع...' : 'Search & select project owner...'
                    }
                    onEntityCreated={(newOwner) => {
                      prependClient(newOwner);
                      setFormData((prev) => ({
                        ...prev,
                        metadata: {
                          ...(prev.metadata || {}),
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
                          ...(prev.metadata || {}),
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
                            ...(prev.metadata || {}),
                            owner_client_id: undefined,
                            owner_name: val,
                          },
                        }));
                      }
                    }}
                  />
                </div>

                <div>
                  <StakeholderEntitySelect
                    id="client_id"
                    mode="entity"
                    entities={dedupedEntities}
                    value={formData.client_id || ''}
                    legacyDisplayValue={formData.client_name_raw || ''}
                    preferredCategories={['main_contractor']}
                    quickAddType="client"
                    label={
                      isAr
                        ? 'المقاول العام (جهة التعاقد المباشر) *'
                        : 'Main Contractor (Direct Client) *'
                    }
                    quickAddLabel={isAr ? 'إضافة مقاول عام' : 'Add Contractor'}
                    placeholder={
                      isAr ? 'ابحث واختر المقاول العام...' : 'Search & select main contractor...'
                    }
                    onEntityCreated={(newClient) => {
                      prependClient(newClient);
                      setFormData((prev) => ({
                        ...prev,
                        client_id: newClient.id,
                        client_name_raw: newClient.name_ar,
                      }));
                    }}
                    onSelectEntity={(entity) => {
                      setFormData((prev) => ({
                        ...prev,
                        client_id: entity?.id || '',
                        client_name_raw: entity ? entity.displayNameAr : '',
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
                          client_id: '',
                          client_name_raw: val,
                        }));
                      }
                    }}
                  />
                </div>
              </>
            )}

            {/* Client Representative */}
            <div>
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
                label={isAr ? 'ممثل جهة التعاقد / مدير مشروع العميل' : 'Client Representative'}
                quickAddLabel={isAr ? 'إضافة ممثل' : 'Add Rep'}
                placeholder={
                  isAr ? 'ابحث واختر ممثل العميل...' : 'Search & select client representative...'
                }
                onPersonCreated={prependPerson}
                onChange={(val) => {
                  setFormData((prev) => ({
                    ...prev,
                    client_representative: val,
                    metadata: {
                      ...(prev.metadata || {}),
                      client_representative: val,
                    },
                  }));
                }}
              />
            </div>

            {/* Supervision Consultant Firm */}
            <div>
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
                    ? 'ابحث واختر المكتب الاستشاري المشرف...'
                    : 'Search & select consultant firm...'
                }
                onEntityCreated={(newConsultant) => {
                  prependClient(newConsultant);
                  setFormData((prev) => ({
                    ...prev,
                    metadata: {
                      ...(prev.metadata || {}),
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
                      ...(prev.metadata || {}),
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
                        ...(prev.metadata || {}),
                        consultant_client_id: undefined,
                        consultant_firm: val,
                      },
                    }));
                  }
                }}
              />
            </div>

            {/* Resident Consultant Engineer */}
            <div>
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
                preferredOrgName={(formData.metadata?.consultant_firm as string) || undefined}
                label={isAr ? 'مهندس الاستشاري المقيم' : 'Resident Consultant Engineer'}
                quickAddLabel={isAr ? 'إضافة مهندس استشاري' : 'Add Engineer'}
                placeholder={
                  isAr ? 'ابحث واختر المهندس المقيم...' : 'Search & select resident engineer...'
                }
                onPersonCreated={prependPerson}
                onChange={(val) => {
                  setFormData((prev) => ({
                    ...prev,
                    metadata: {
                      ...(prev.metadata || {}),
                      consultant_name: val,
                    },
                  }));
                }}
              />
            </div>

            {/* P.Zone Project Manager + Employee Code */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border border-slate-200/70 dark:border-slate-700/60">
              <div>
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
                  label={isAr ? 'مدير المشروع المكلف (بي زون)' : 'Assigned Project Manager'}
                  quickAddLabel={isAr ? 'إضافة مدير مشروع' : 'New PM'}
                  placeholder={
                    isAr ? 'ابحث واختر مدير المشروع...' : 'Search & select project manager...'
                  }
                  onPersonCreated={(newPm) => {
                    prependPerson(newPm);
                    const empCode = (newPm.employee_code || newPm.code || '').trim();
                    setFormData((prev) => ({
                      ...prev,
                      project_manager_id: newPm.id || prev.project_manager_id || '',
                      project_manager_stakeholder_id: newPm.id || null,
                      project_manager_name_raw: newPm.name_ar || newPm.name_en || '',
                      project_manager_code: empCode,
                    }));
                  }}
                  onChange={handleManagerNameChange}
                />
              </div>

              <div>
                <label
                  htmlFor="project_manager_code"
                  className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1.5"
                >
                  {isAr ? 'الكود الوظيفي لمدير المشروع' : 'Employee Code'}
                </label>
                <CustomSelect
                  id="project_manager_code"
                  options={employeeCodeOptions}
                  value={formData.project_manager_code || ''}
                  onChange={handleManagerCodeChange}
                  clearable
                  placeholder={isAr ? 'اختر الكود الوظيفي...' : 'Select employee code...'}
                  isLoading={loading}
                />
              </div>
            </div>
          </div>
        </fieldset>

        {/* ================================================================
            SECTION 3: الموقع الجغرافي (Governorate, City, Address & GPS Map ONLY)
            ================================================================ */}
        <fieldset
          id="edit-section-3"
          onFocusCapture={() => setActiveSectionId('edit-section-3')}
          className="glass-card p-6 space-y-5 scroll-mt-56"
          aria-labelledby="section_3_title"
        >
          <legend
            id="section_3_title"
            className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-3 w-full font-bold text-sm"
          >
            <MapPin className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{t('edit_project.section_location')}</span>
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label
                htmlFor="governorate_id"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.governorate_id')}
              </label>
              <CustomSelect
                id="governorate_id"
                options={governorates.map((g) => ({
                  value: g.id,
                  label: isAr ? g.name_ar : g.name_en || g.name_ar,
                  searchTerms: `${g.name_ar} ${g.name_en || ''} ${g.code || ''}`,
                }))}
                value={formData.governorate_id || ''}
                onChange={(val) => {
                  setFormData((prev) => ({
                    ...prev,
                    governorate_id: val,
                    ...(prev.governorate_id !== val ? { city_id: '' } : {}),
                  }));
                }}
                clearable
                placeholder={t('edit_project.select_gov')}
                isLoading={loading}
              />
            </div>

            <div>
              <label
                htmlFor="city_id"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.city_id')}
              </label>
              <CustomSelect
                id="city_id"
                options={cities.map((c) => ({
                  value: c.id,
                  label: isAr ? c.name_ar : c.name_en || c.name_ar,
                  searchTerms: `${c.name_ar} ${c.name_en || ''}`,
                }))}
                value={formData.city_id || ''}
                onChange={(val) => handleChange('city_id', val)}
                clearable
                placeholder={t('edit_project.select_city')}
                isLoading={loading}
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="site_location_address"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.site_location_address')}
              </label>
              <input
                id="site_location_address"
                type="text"
                dir="rtl"
                value={formData.site_location_address || ''}
                onChange={(e) => handleChange('site_location_address', e.target.value)}
                placeholder={
                  isAr
                    ? 'مثال: الكيلو 135 طريق الإسكندرية مطروح — الساحل الشمالي'
                    : 'Detailed site address...'
                }
                className="glass-input w-full px-3 py-2 rounded-xl text-end"
              />
            </div>

            <div>
              <label
                htmlFor="gps_lat"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.gps_lat')}
              </label>
              <input
                id="gps_lat"
                type="number"
                step="any"
                dir="ltr"
                value={formData.gps_lat || 0}
                onChange={(e) => handleNumberChange('gps_lat', e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl font-mono text-start"
              />
            </div>

            <div>
              <label
                htmlFor="gps_lng"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.gps_lng')}
              </label>
              <input
                id="gps_lng"
                type="number"
                step="any"
                dir="ltr"
                value={formData.gps_lng || 0}
                onChange={(e) => handleNumberChange('gps_lng', e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl font-mono text-start"
              />
            </div>

            <div className="md:col-span-2 pt-1">
              <ProjectLocationPickerMap
                lat={Number(formData.gps_lat) || 30.0444}
                lng={Number(formData.gps_lng) || 31.2357}
                onChange={(lat: number, lng: number) => {
                  setFormData((prev) => ({
                    ...prev,
                    gps_lat: lat,
                    gps_lng: lng,
                  }));
                }}
              />
            </div>
          </div>
        </fieldset>

        {/* ================================================================
            SECTION 4: نطاق الأعمال والمواصفات الفنية (Context-Driven Technical Scope)
            ================================================================ */}
        <fieldset
          id="edit-section-4"
          onFocusCapture={() => setActiveSectionId('edit-section-4')}
          className="glass-card p-6 space-y-5 scroll-mt-56"
          aria-labelledby="section_4_title"
        >
          <legend
            id="section_4_title"
            className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-3 w-full font-bold text-sm"
          >
            <Layers className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{t('edit_project.section_scope')}</span>
          </legend>

          {/* Scope Chips */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr
                ? 'اختر تخصصات الأعمال المشمولة في المشروع (تظهر الحقول الفنية بناءً على اختيارك):'
                : 'Select included project disciplines:'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {PZONE_WATER_SCOPES.map((sc) => {
                const isSelected = selectedScopes.includes(sc.id);
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => toggleScopeFeature(sc.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all text-start cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400/60'
                    }`}
                  >
                    <span className="text-base">{sc.icon}</span>
                    <span className="truncate">{isAr ? sc.nameAr : sc.nameEn}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Card A: Water Surface Area & Volume (Only when surface scope selected or area > 0) */}
          {(requiresSurfaceArea || Number(formData.water_area_m2) > 0) && (
            <div className="p-4 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200/70 dark:border-cyan-900/50 space-y-3">
              <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300 font-bold text-xs">
                <Droplets className="w-4 h-4" />
                <span>
                  {isAr
                    ? 'الأبعاد الهيدروليكية والمسطحات المائية'
                    : 'Water Surface Area & Volume'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label
                    htmlFor="water_area_m2"
                    className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {t('edit_project.water_area_m2')}
                  </label>
                  <input
                    id="water_area_m2"
                    type="number"
                    step="any"
                    dir="ltr"
                    value={formData.water_area_m2 || 0}
                    onChange={(e) => handleNumberChange('water_area_m2', e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-xl font-mono text-start"
                  />
                </div>

                <div>
                  <label
                    htmlFor="water_vol_m3"
                    className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {t('edit_project.water_vol_m3')}
                  </label>
                  <input
                    id="water_vol_m3"
                    type="number"
                    step="any"
                    dir="ltr"
                    value={formData.water_vol_m3 || 0}
                    onChange={(e) => handleNumberChange('water_vol_m3', e.target.value)}
                    className="glass-input w-full px-3 py-2 rounded-xl font-mono text-start"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Card B: Stations & MEP Networks (Only when stations/networks selected) */}
          {includesStationsOrNetworks && (
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/50 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-xs">
                <Wrench className="w-4 h-4" />
                <span>
                  {isAr
                    ? 'مواصفات المحطات والشبكات الكهروميكانيكية'
                    : 'Stations & Electromechanical Specs'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label
                    htmlFor="stations_count"
                    className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {isAr ? 'عدد غرف الطلمبات / المحطات' : 'Pump Rooms / Stations Count'}
                  </label>
                  <input
                    id="stations_count"
                    type="number"
                    min="0"
                    dir="ltr"
                    value={Number(formData.metadata?.stations_count || 0)}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        metadata: {
                          ...(prev.metadata || {}),
                          stations_count: Number(e.target.value) || 0,
                        },
                      }))
                    }
                    className="glass-input w-full px-3 py-2 rounded-xl font-mono text-start"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="technical_scope_notes"
                    className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
                  >
                    {isAr ? 'ملخص التوصيف الفني والقدرات' : 'Technical Scope Summary'}
                  </label>
                  <input
                    id="technical_scope_notes"
                    type="text"
                    dir="rtl"
                    value={(formData.metadata?.technical_scope_notes as string) || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        metadata: {
                          ...(prev.metadata || {}),
                          technical_scope_notes: e.target.value,
                        },
                      }))
                    }
                    placeholder={
                      isAr
                        ? 'مثال: توريد وتركيب محطة فلاتر رملية وطلمبات تدوير...'
                        : 'Technical specs notes...'
                    }
                    className="glass-input w-full px-3 py-2 rounded-xl text-end"
                  />
                </div>
              </div>
            </div>
          )}
        </fieldset>

        {/* ================================================================
            SECTION 5: البرنامج الزمني والمدد (Dates & Timeline ONLY)
            ================================================================ */}
        <fieldset
          id="edit-section-5"
          onFocusCapture={() => setActiveSectionId('edit-section-5')}
          className="glass-card p-6 space-y-5 scroll-mt-56"
          aria-labelledby="section_5_title"
        >
          <legend
            id="section_5_title"
            className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-3 w-full font-bold text-sm"
          >
            <Calendar className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{t('edit_project.section_dates')}</span>
          </legend>

          {/* Quick Duration Presets */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-slate-600 dark:text-slate-400">
              {isAr ? 'مدد قياسية سريعة:' : 'Quick duration:'}
            </span>
            {[3, 6, 9, 12, 18].map((months) => (
              <button
                key={months}
                type="button"
                onClick={() => {
                  setFormData((prev) => {
                    const baseStart = prev.planned_start_date || prev.start_date || '';
                    const nextFinish = baseStart
                      ? addMonthsToDate(baseStart, months)
                      : prev.planned_finish_date || '';
                    return {
                      ...prev,
                      contract_duration_months: months,
                      ...(nextFinish
                        ? { planned_finish_date: nextFinish, end_date: nextFinish }
                        : {}),
                    };
                  });
                }}
                className={`px-3 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                  Number(formData.contract_duration_months) === months
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50'
                }`}
              >
                {isAr ? `${months} شهور` : `${months}m`}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label
                htmlFor="contract_date"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.contract_date')}
              </label>
              <input
                id="contract_date"
                type="date"
                dir="ltr"
                value={formData.contract_date || ''}
                onChange={(e) => handleChange('contract_date', e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl font-mono text-start"
              />
            </div>

            <div>
              <label
                htmlFor="planned_start_date"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.planned_start_date')}
              </label>
              <input
                id="planned_start_date"
                type="date"
                dir="ltr"
                value={formData.planned_start_date || formData.start_date || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    planned_start_date: val,
                    start_date: val,
                  }));
                }}
                className="glass-input w-full px-3 py-2 rounded-xl font-mono text-start"
              />
            </div>

            <div>
              <label
                htmlFor="planned_finish_date"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.planned_finish_date')}
              </label>
              <input
                id="planned_finish_date"
                type="date"
                dir="ltr"
                value={formData.planned_finish_date || formData.end_date || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    planned_finish_date: val,
                    end_date: val,
                  }));
                }}
                className="glass-input w-full px-3 py-2 rounded-xl font-mono text-start"
              />
            </div>

            <div>
              <label
                htmlFor="contract_duration_months"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.contract_duration_months')}
              </label>
              <input
                id="contract_duration_months"
                type="number"
                min="0"
                dir="ltr"
                value={formData.contract_duration_months || 0}
                onChange={(e) => handleNumberChange('contract_duration_months', e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl font-mono text-start"
              />
            </div>

            <div>
              <label
                htmlFor="actual_start_date"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.actual_start_date')}
              </label>
              <input
                id="actual_start_date"
                type="date"
                dir="ltr"
                value={formData.actual_start_date || ''}
                onChange={(e) => handleChange('actual_start_date', e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl font-mono text-start"
              />
            </div>

            <div>
              <label
                htmlFor="actual_finish_date"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.actual_finish_date')}
              </label>
              <input
                id="actual_finish_date"
                type="date"
                dir="ltr"
                value={formData.actual_finish_date || ''}
                onChange={(e) => handleChange('actual_finish_date', e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl font-mono text-start"
              />
            </div>
          </div>
        </fieldset>

        {/* ================================================================
            SECTION 6: الماليات والمستندات التعاقدية (Clean Core + Optional Accordions)
            ================================================================ */}
        <fieldset
          id="edit-section-6"
          onFocusCapture={() => setActiveSectionId('edit-section-6')}
          className="glass-card p-6 space-y-5 scroll-mt-56"
          aria-labelledby="section_6_title"
        >
          <legend
            id="section_6_title"
            className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800 pb-3 w-full font-bold text-sm"
          >
            <DollarSign className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{t('edit_project.section_financial')}</span>
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label
                htmlFor="contract_value"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.contract_value')}
              </label>
              <div className="relative">
                <input
                  id="contract_value"
                  type="number"
                  step="any"
                  dir="ltr"
                  value={formData.contract_value || 0}
                  onChange={(e) => handleNumberChange('contract_value', e.target.value)}
                  className="glass-input w-full ps-3 pe-12 py-2 rounded-xl font-mono text-start"
                />
                <span className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-xs font-bold text-slate-500">
                  {isAr ? 'ج.م' : 'EGP'}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="vat_amount_egp"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.vat_amount_egp')}
              </label>
              <div className="relative">
                <input
                  id="vat_amount_egp"
                  type="number"
                  step="any"
                  dir="ltr"
                  readOnly
                  value={formData.vat_amount_egp || 0}
                  className="glass-input w-full ps-3 pe-12 py-2 rounded-xl font-mono text-start bg-slate-100/60 dark:bg-slate-800/60"
                />
                <span className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-xs font-bold text-slate-500">
                  {isAr ? 'ج.م' : 'EGP'}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="total_value_with_vat_egp"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.total_value_with_vat_egp')}
              </label>
              <div className="relative">
                <input
                  id="total_value_with_vat_egp"
                  type="number"
                  step="any"
                  dir="ltr"
                  readOnly
                  value={formData.total_value_with_vat_egp || 0}
                  className="glass-input w-full ps-3 pe-12 py-2 rounded-xl font-mono font-bold text-emerald-700 dark:text-emerald-400 text-start bg-slate-100/60 dark:bg-slate-800/60"
                />
                <span className="absolute inset-y-0 end-3 flex items-center pointer-events-none text-xs font-bold text-slate-500">
                  {isAr ? 'ج.م' : 'EGP'}
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="estimated_cost"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.estimated_cost')}
              </label>
              <input
                id="estimated_cost"
                type="number"
                step="any"
                dir="ltr"
                value={formData.estimated_cost || 0}
                onChange={(e) => handleNumberChange('estimated_cost', e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl font-mono text-start"
              />
            </div>

            <div>
              <label
                htmlFor="estimated_budget"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.estimated_budget')}
              </label>
              <input
                id="estimated_budget"
                type="number"
                step="any"
                dir="ltr"
                value={formData.estimated_budget || 0}
                onChange={(e) => handleNumberChange('estimated_budget', e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl font-mono text-start"
              />
            </div>

            <div>
              <label
                htmlFor="vos_value"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.vos_value')}
              </label>
              <input
                id="vos_value"
                type="number"
                step="any"
                dir="ltr"
                value={formData.vos_value ?? 0}
                onChange={(e) => handleNumberChange('vos_value', e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl font-mono text-start"
              />
            </div>

            <div>
              <label
                htmlFor="completion_pct"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.completion_pct')} (%)
              </label>
              <input
                id="completion_pct"
                type="number"
                min="0"
                max="100"
                dir="ltr"
                value={formData.completion_pct || 0}
                onChange={(e) => handleNumberChange('completion_pct', e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl font-mono text-start"
              />
            </div>

            <div>
              <label
                htmlFor="hardcopy_status"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.hardcopy_status')}
              </label>
              <CustomSelect
                id="hardcopy_status"
                options={(() => {
                  const baseOpts: SelectOption[] = [
                    {
                      value: 'موجود hard copy معتمد',
                      label: isAr
                        ? 'متوفر أصل ورقي معتمد بمقر الشركة'
                        : 'Available Certified Hardcopy at HQ',
                    },
                    {
                      value: 'موجود hard copy معتمد فى التأمينات',
                      label: isAr
                        ? 'متوفر أصل ورقي معتمد ومسجل بالتأمينات'
                        : 'Certified Hardcopy at Social Insurance',
                    },
                    {
                      value: 'غير موجود hard copy معتمد',
                      label: isAr
                        ? 'غير متوفر أصل ورقي معتمد حالياً'
                        : 'Missing Certified Hardcopy at HQ',
                    },
                    {
                      value: 'غير مكتمل',
                      label: isAr ? 'قيد استيفاء التوقيعات والأختام' : 'Incomplete / Pending Filing',
                    },
                  ];
                  const cur = (formData.hardcopy_status || '').trim();
                  if (cur && !baseOpts.some((o) => o.value === cur)) {
                    baseOpts.unshift({ value: cur, label: cur });
                  }
                  return baseOpts;
                })()}
                value={formData.hardcopy_status || 'غير موجود hard copy معتمد'}
                onChange={(val) => handleChange('hardcopy_status', val)}
              />
            </div>

            <div>
              <label
                htmlFor="site_possession_letter"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.site_possession_letter')}
              </label>
              <input
                id="site_possession_letter"
                type="text"
                dir="rtl"
                value={formData.site_possession_letter || ''}
                onChange={(e) => handleChange('site_possession_letter', e.target.value)}
                placeholder={isAr ? 'مثال: تم الاستلام بمحضر رسمي' : 'Site possession status...'}
                className="glass-input w-full px-3 py-2 rounded-xl text-end"
              />
            </div>

            <div>
              <label
                htmlFor="toc_letter"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.toc_letter')}
              </label>
              <input
                id="toc_letter"
                type="text"
                dir="rtl"
                value={formData.toc_letter || ''}
                onChange={(e) => handleChange('toc_letter', e.target.value)}
                placeholder={
                  isAr ? 'مثال: لم يصدر بعد / صادر ومعتمد' : 'Taking-over certificate status...'
                }
                className="glass-input w-full px-3 py-2 rounded-xl text-end"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="contract_status"
                className="block font-bold text-slate-700 dark:text-slate-300 mb-1"
              >
                {t('edit_project.contract_status')}
              </label>
              <input
                id="contract_status"
                type="text"
                dir="rtl"
                value={formData.contract_status || ''}
                onChange={(e) => handleChange('contract_status', e.target.value)}
                placeholder={isAr ? 'ملاحظات إدارية إضافية على العقد...' : 'Contract notes...'}
                className="glass-input w-full px-3 py-2 rounded-xl text-end"
              />
            </div>
          </div>

          {/* Optional Accordion 1: Contractual Guarantees & Retentions */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowGuaranteesAccordion((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <span>
                {isAr
                  ? 'خطابات الضمان والتأمينات التعاقدية (اختياري)'
                  : 'Bank Guarantees & Retentions (Optional)'}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showGuaranteesAccordion ? 'rotate-180' : ''
                }`}
              />
            </button>
            {showGuaranteesAccordion && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <ProjectGuaranteesSection
                  metadata={(formData.metadata as Record<string, unknown>) || {}}
                  onChange={(updatedMetadata) => {
                    setFormData((prev) => ({
                      ...prev,
                      metadata: {
                        ...(prev.metadata || {}),
                        ...updatedMetadata,
                      },
                    }));
                  }}
                  contractBaseValue={Number(formData.contract_value || 0)}
                  vosValue={Number(formData.vos_value || 0)}
                  isAr={isAr}
                />
              </div>
            )}
          </div>

          {/* Optional Accordion 2: Variation Orders Schedule */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowVosAccordion((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <span>
                {isAr
                  ? `سجل أوامر التغيير بالخصم والإضافة (${variationOrders.length})`
                  : `Variation Orders Schedule (${variationOrders.length})`}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${showVosAccordion ? 'rotate-180' : ''}`}
              />
            </button>
            {showVosAccordion && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <VariationOrdersManager
                  variationOrders={variationOrders}
                  onChange={handleVariationOrdersChange}
                  contractBaseValue={Number(formData.contract_value || 0)}
                  structures={waterStructures}
                  isAr={isAr}
                />
              </div>
            )}
          </div>

          {/* Optional Accordion 3: Sub-Structures Distribution */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowSubStructuresAccordion((p) => !p)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/80 dark:bg-slate-800/40 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <span>
                {isAr
                  ? `توزيع القيمة والمساحات على منشآت فرعية (${waterStructures.length})`
                  : `Sub-Structures Breakdown (${waterStructures.length})`}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showSubStructuresAccordion ? 'rotate-180' : ''
                }`}
              />
            </button>
            {showSubStructuresAccordion && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddWaterStructure('lagoon')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/60 px-2.5 py-1.5 rounded-lg border border-cyan-200 dark:border-cyan-800 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAr ? 'إضافة بحيرة' : 'Add Lagoon'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddWaterStructure('pool')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAr ? 'إضافة حمام سباحة' : 'Add Pool'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddWaterStructure('pump_room')}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{isAr ? 'إضافة غرفة طلمبات' : 'Add Pump Room'}</span>
                    </button>
                  </div>

                  {!boqTotals.isFullyReconciled && (
                    <button
                      type="button"
                      onClick={syncContractFromBoq}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>
                        {isAr
                          ? 'مزامنة قيمة العقد من مجموع المنشآت'
                          : 'Sync Contract from Sub-Structures'}
                      </span>
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {waterStructures.map((st, idx) => (
                    <div
                      key={st.id || idx}
                      className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end text-xs"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {isAr ? 'اسم وتوصيف المنشأ' : 'Structure Name'}
                        </label>
                        <input
                          type="text"
                          dir="rtl"
                          value={st.name || ''}
                          onChange={(e) => handleUpdateWaterStructure(idx, 'name', e.target.value)}
                          className="glass-input w-full px-2.5 py-1.5 rounded-xl text-end"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {isAr ? 'المساحة (م²)' : 'Area (m²)'}
                        </label>
                        <input
                          type="number"
                          dir="ltr"
                          value={st.area_m2 || ''}
                          onChange={(e) =>
                            handleUpdateWaterStructure(idx, 'area_m2', Number(e.target.value))
                          }
                          className="glass-input w-full px-2.5 py-1.5 rounded-xl font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {isAr ? 'الحجم (م³)' : 'Volume (m³)'}
                        </label>
                        <input
                          type="number"
                          dir="ltr"
                          value={st.volume_m3 || ''}
                          onChange={(e) =>
                            handleUpdateWaterStructure(idx, 'volume_m3', Number(e.target.value))
                          }
                          className="glass-input w-full px-2.5 py-1.5 rounded-xl font-mono"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          {isAr ? 'القيمة التعاقدية (ج.م)' : 'Base Value (EGP)'}
                        </label>
                        <input
                          type="number"
                          dir="ltr"
                          value={st.base_price_egp || ''}
                          onChange={(e) =>
                            handleUpdateWaterStructure(
                              idx,
                              'base_price_egp',
                              Number(e.target.value)
                            )
                          }
                          className="glass-input w-full px-2.5 py-1.5 rounded-xl font-mono"
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteWaterStructure(idx)}
                          disabled={waterStructures.length <= 1}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 disabled:opacity-30 cursor-pointer"
                          aria-label={isAr ? 'حذف المنشأ' : 'Delete structure'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {!boqTotals.isFullyReconciled && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {isAr
                        ? `مجموع قيم المنشآت الفرعية (${fmtNum(boqTotals.totalBase)} ج.م) يختلف عن قيمة التعاقد الأساسية (${fmtNum(boqTotals.contractVal)} ج.م).`
                        : 'Sub-structures sum differs from base contract value.'}
                    </span>
                  </p>
                )}
              </div>
            )}
          </div>
        </fieldset>

        {/* Sticky Bottom Footer Save Bar */}
        <div className="sticky bottom-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 shadow-lg shadow-black/5">
          <div className="max-w-5xl mx-auto flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[240px]">
                  {formData.project_name || formData.project_code || t('edit_project.title')}
                </span>
                {formData.status && (
                  <StatusBadge status={formData.status as ProjectStatus} size="sm" />
                )}
              </div>
              {(nameArError || nameEnError) && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{isAr ? 'يرجى مراجعة أخطاء الاسم' : 'Please fix errors'}</span>
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <Link
                href={`/projects/${id}`}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-800 min-h-[44px]"
              >
                {t('edit_project.cancel')}
              </Link>
              <button
                id="bottom_save_project_btn"
                type="submit"
                disabled={saving || Boolean(nameArError) || Boolean(nameEnError)}
                aria-busy={saving}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer min-h-[44px]"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="w-4 h-4" aria-hidden="true" />
                )}
                <span>
                  {saving
                    ? isAr
                      ? 'جاري الحفظ...'
                      : 'Saving...'
                    : t('edit_project.save_changes')}
                </span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
