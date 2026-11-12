/**
 * Pure calculation, smart-hint, and contextual validation utilities for Project Creation & Setup.
 * Zero external side-effects, safe for client, server, and test environments.
 */

export interface GrossMarginResult {
  marginEgp: number;
  marginPct: number;
  status: 'healthy' | 'warning' | 'critical';
}

export interface VatBreakdownResult {
  netValue: number;
  vatAmount: number;
  totalWithVat: number;
}

export interface DateValidationResult {
  isValid: boolean;
  error?: string;
  durationDays: number;
  durationMonths: number;
}

/**
 * Parses a YYYY-MM-DD string into UTC midnight timestamp to eliminate timezone drift.
 */
function parseDateParts(str?: string | null): Date | null {
  if (!str) return null;
  const parts = str.trim().split('-');
  if (parts.length !== 3) return null;
  const [year, month, day] = parts.map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Formats a Date to YYYY-MM-DD using UTC values.
 */
function formatDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Calculates water volume in m³ from surface area in m² and average depth in meters.
 * Defaults to 0 if inputs are invalid or negative.
 */
export function calculateWaterVolume(areaM2: number, depthM: number): number {
  const safeArea = Math.max(0, Number(areaM2) || 0);
  const safeDepth = Math.max(0, Number(depthM) || 0);
  return Number((safeArea * safeDepth).toFixed(2));
}

/**
 * Calculates project duration in calendar days.
 * Returns 0 if either date is missing or invalid.
 */
export function calculateDurationInDays(startDateStr?: string | null, finishDateStr?: string | null): number {
  const start = parseDateParts(startDateStr);
  const finish = parseDateParts(finishDateStr);

  if (!start || !finish) return 0;

  const diffTime = finish.getTime() - start.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Calculates project duration in months (based on 30.44 days per month).
 */
export function calculateDurationInMonths(startDateStr?: string | null, finishDateStr?: string | null): number {
  const days = calculateDurationInDays(startDateStr, finishDateStr);
  if (days <= 0) return 0;
  return Number((days / 30.44).toFixed(1));
}

/**
 * Validates project start and finish dates.
 */
export function validateProjectDates(startDateStr?: string | null, finishDateStr?: string | null): DateValidationResult {
  if (!startDateStr || !finishDateStr) {
    return { isValid: true, durationDays: 0, durationMonths: 0 };
  }

  const start = parseDateParts(startDateStr);
  const finish = parseDateParts(finishDateStr);

  if (!start || !finish) {
    return { isValid: false, error: 'صيغة أحد التواريخ غير صحيحة', durationDays: 0, durationMonths: 0 };
  }

  if (finish.getTime() < start.getTime()) {
    return {
      isValid: false,
      error: 'تاريخ الانتهاء المخطط لا يمكن أن يسبق تاريخ البدء',
      durationDays: 0,
      durationMonths: 0,
    };
  }

  const durationDays = calculateDurationInDays(startDateStr, finishDateStr);
  const durationMonths = calculateDurationInMonths(startDateStr, finishDateStr);

  return {
    isValid: true,
    durationDays,
    durationMonths,
  };
}

/**
 * Calculates Gross Margin (EGP and percentage).
 * Classifies profitability:
 * - healthy: margin >= 20%
 * - warning: 10% <= margin < 20%
 * - critical: margin < 10% or negative
 */
export function calculateGrossMargin(contractValue: number, estimatedCost: number): GrossMarginResult {
  const safeContract = Math.max(0, Number(contractValue) || 0);
  const safeCost = Math.max(0, Number(estimatedCost) || 0);

  if (safeContract === 0) {
    return { marginEgp: 0, marginPct: 0, status: 'warning' };
  }

  const marginEgp = Number((safeContract - safeCost).toFixed(2));
  const marginPct = Number(((marginEgp / safeContract) * 100).toFixed(1));

  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (marginPct < 10) {
    status = 'critical';
  } else if (marginPct < 20) {
    status = 'warning';
  }

  return { marginEgp, marginPct, status };
}

/**
 * Calculates 14% Egyptian VAT breakdown on contract value.
 */
export function calculateVatBreakdown(contractValue: number, vatRate: number = 0.14): VatBreakdownResult {
  const safeContract = Math.max(0, Number(contractValue) || 0);
  const safeRate = Math.max(0, Number(vatRate) || 0);

  const vatAmount = Number((safeContract * safeRate).toFixed(2));
  const totalWithVat = Number((safeContract + vatAmount).toFixed(2));

  return {
    netValue: safeContract,
    vatAmount,
    totalWithVat,
  };
}

/**
 * Generates an end date string (YYYY-MM-DD) adding N months to a given start date.
 */
export function addMonthsToDate(startDateStr: string, monthsToAdd: number): string {
  const start = parseDateParts(startDateStr);
  if (!start) return '';

  start.setUTCMonth(start.getUTCMonth() + monthsToAdd);
  return formatDateUTC(start);
}

/**
 * Standard P-Zone Technical & Water Scope Presets
 */
export interface WaterScopeItem {
  id: string;
  nameAr: string;
  nameEn: string;
  icon: string;
  defaultDepthM: number;
  requiresSurfaceArea: boolean;
  category: 'surface' | 'station_network';
}

export const PZONE_WATER_SCOPES: WaterScopeItem[] = [
  {
    id: 'pools',
    nameAr: 'حمامات سباحة',
    nameEn: 'Swimming Pools',
    icon: '🏊',
    defaultDepthM: 1.4,
    requiresSurfaceArea: true,
    category: 'surface',
  },
  {
    id: 'lagoons',
    nameAr: 'بحيرات صناعية ولاجون',
    nameEn: 'Lagoons & Artificial Lakes',
    icon: '🌊',
    defaultDepthM: 1.8,
    requiresSurfaceArea: true,
    category: 'surface',
  },
  {
    id: 'fountains',
    nameAr: 'نوافير وشلالات مائية',
    nameEn: 'Fountains & Waterfalls',
    icon: '⛲',
    defaultDepthM: 0.5,
    requiresSurfaceArea: true,
    category: 'surface',
  },
  {
    id: 'jacuzzi',
    nameAr: 'جاكوزي ومنتجع صحي',
    nameEn: 'Jacuzzi & Wellness Spa',
    icon: '🧖‍♂️',
    defaultDepthM: 0.9,
    requiresSurfaceArea: true,
    category: 'surface',
  },
  {
    id: 'treatment',
    nameAr: 'غرف طلمبات ومحطات تنقية',
    nameEn: 'Pump Rooms & Treatment Stations',
    icon: '💧',
    defaultDepthM: 0.0,
    requiresSurfaceArea: false,
    category: 'station_network',
  },
  {
    id: 'irrigation',
    nameAr: 'شبكات ري وكهروميكانيكا',
    nameEn: 'Irrigation & MEP Networks',
    icon: '🌿',
    defaultDepthM: 0.0,
    requiresSurfaceArea: false,
    category: 'station_network',
  },
];

/**
 * Returns true if at least one selected scope involves a water surface (pools, lagoons, fountains, jacuzzi).
 * Returns false for purely MEP/station/irrigation projects so users are never forced to enter fake water area > 0.
 */
export function doesScopeRequireSurfaceArea(selectedScopes?: string[] | null): boolean {
  if (!selectedScopes || selectedScopes.length === 0) return false;
  return PZONE_WATER_SCOPES.some(
    (scope) => selectedScopes.includes(scope.id) && scope.requiresSurfaceArea
  );
}

/**
 * Returns true if at least one selected scope involves pump stations, filtration, or MEP/irrigation networks.
 */
export function doesScopeIncludeStationsOrNetworks(selectedScopes?: string[] | null): boolean {
  if (!selectedScopes || selectedScopes.length === 0) return false;
  return PZONE_WATER_SCOPES.some(
    (scope) => selectedScopes.includes(scope.id) && scope.category === 'station_network'
  );
}

/**
 * Normalizes Arabic/English text for lightweight deterministic keyword matching.
 */
function normalizeHintText(input?: string | null): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F\u0640]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SmartProjectHints {
  suggestedScopes: string[];
  suggestedGovernorate?: { id: string; nameAr: string; nameEn?: string };
  suggestedLocationHint?: string;
  suggestedEntity?: { id: string; nameAr: string; nameEn?: string };
}

const SCOPE_HINT_KEYWORDS: Array<{ scopeId: string; keywords: string[] }> = [
  { scopeId: 'lagoons', keywords: ['بحير', 'بحيرات', 'لاجون', 'lagoon', 'lake'] },
  { scopeId: 'pools', keywords: ['حمام سباح', 'حمامات سباح', 'مسبح', 'مسابح', 'pool', 'swimming'] },
  { scopeId: 'fountains', keywords: ['نافور', 'نوافير', 'شلال', 'fountain', 'waterfall', 'water feature'] },
  { scopeId: 'jacuzzi', keywords: ['جاكوزي', 'سبا', 'jacuzzi', 'spa'] },
  { scopeId: 'treatment', keywords: ['محطه', 'محطات', 'طلمب', 'معالج', 'تنقي', 'خزان', 'pump', 'treatment', 'filtration'] },
  { scopeId: 'irrigation', keywords: ['شبكه ري', 'شبكات ري', 'لاندسكيب', 'كهروميكانيك', 'irrigation', 'mep'] },
];

const REGION_HINT_KEYWORDS: Array<{
  govCodeOrName: string[];
  keywords: string[];
  areaLabelAr: string;
}> = [
  {
    govCodeOrName: ['mat', 'matrouh', 'مطروح', 'مرسي مطروح'],
    keywords: ['الساحل', 'علمين', 'مراسي', 'سيدي عبد الرحمن', 'فوكا', 'راس الحكمه', 'الماظه باي', 'سيلفر ساندس', 'هاسيندا', 'marassi', 'alamein', 'north coast', 'ras el hekma', 'fouka', 'hacienda', 'silver sands'],
    areaLabelAr: 'الساحل الشمالي',
  },
  {
    govCodeOrName: ['cai', 'cairo', 'القاهره'],
    keywords: ['التجمع', 'القاهره الجديده', 'العاصمه الاداريه', 'مدينتي', 'الشروق', 'المستقبل', 'مصر الجديده', 'المعادي', 'قطاميه', 'new cairo', 'new capital', 'madinaty', 'mostakbal', 'katameya'],
    areaLabelAr: 'شرق القاهرة / القاهرة الجديدة',
  },
  {
    govCodeOrName: ['giz', 'giza', 'الجيزه'],
    keywords: ['الشيخ زايد', 'زايد', 'اكتوبر', '6 اكتوبر', 'حدائق اكتوبر', 'نيو زايد', 'الهرم', 'zayed', 'october'],
    areaLabelAr: 'الشيخ زايد / 6 أكتوبر',
  },
  {
    govCodeOrName: ['sue', 'suez', 'السويس'],
    keywords: ['السخنه', 'العين السخنه', 'الجلاله', 'sokhna', 'galala'],
    areaLabelAr: 'العين السخنة / الجلالة',
  },
  {
    govCodeOrName: ['rss', 'red sea', 'البحر الاحمر'],
    keywords: ['الجونه', 'الغردقه', 'سهل حشيش', 'مكادي', 'سوما باي', 'gouna', 'hurghada', 'sahl hasheesh', 'soma bay'],
    areaLabelAr: 'البحر الأحمر',
  },
  {
    govCodeOrName: ['sin', 'south sinai', 'جنوب سيناء'],
    keywords: ['شرم الشيخ', 'دهب', 'طابا', 'نيوم', 'sharm', 'dahab'],
    areaLabelAr: 'جنوب سيناء',
  },
  {
    govCodeOrName: ['alx', 'alexandria', 'الاسكندريه'],
    keywords: ['الاسكندريه', 'برج العرب', 'سموحه', 'كينج مريوط', 'alexandria', 'borg el arab'],
    areaLabelAr: 'الإسكندرية',
  },
];

const GENERIC_COMPANY_WORDS = new Set([
  'شركه', 'شركة', 'مجموعه', 'مجموعة', 'للمقاولات', 'للتطوير', 'العقاري', 'العقاريه',
  'للاستثمار', 'الهندسيه', 'للتجاره', 'المصريه', 'مصر', 'الدوليه', 'العامه',
  'company', 'group', 'developments', 'development', 'construction', 'contracting',
  'for', 'and', 'the', 'egypt', 'real', 'estate', 'holding', 'inc', 'llc', 'sae',
]);

/**
 * Extracts deterministic smart hints (scopes, governorate/region, and known developer/client)
 * from the entered project name so the user can apply them in one click.
 */
export function extractSmartHintsFromProjectName(
  projectNameAr?: string | null,
  projectNameEn?: string | null,
  entities: Array<{ id: string; name_ar: string; name_en?: string | null; displayNameAr?: string; displayNameEn?: string }> = [],
  governorates: Array<{ id: string; name_ar: string; name_en?: string | null; code?: string | null }> = []
): SmartProjectHints {
  const combinedNorm = normalizeHintText(`${projectNameAr || ''} ${projectNameEn || ''}`);
  if (!combinedNorm || combinedNorm.length < 3) {
    return { suggestedScopes: [] };
  }

  // 1. Detect Scopes (use word-boundary match for short 3-char keywords like "سبا"/"spa" so "سباحة" never triggers jacuzzi)
  const suggestedScopes: string[] = [];
  for (const rule of SCOPE_HINT_KEYWORDS) {
    const matched = rule.keywords.some((kw) => {
      const kwNorm = normalizeHintText(kw);
      if (!kwNorm) return false;
      if (kwNorm.length <= 3 && !kwNorm.includes(' ')) {
        const escaped = kwNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(combinedNorm);
      }
      return combinedNorm.includes(kwNorm);
    });
    if (matched) {
      suggestedScopes.push(rule.scopeId);
    }
  }

  // 2. Detect Governorate / Region
  let suggestedGovernorate: SmartProjectHints['suggestedGovernorate'];
  let suggestedLocationHint: string | undefined;
  for (const region of REGION_HINT_KEYWORDS) {
    const matchedKw = region.keywords.find((kw) => combinedNorm.includes(normalizeHintText(kw)));
    if (matchedKw) {
      suggestedLocationHint = region.areaLabelAr;
      const govMatch = governorates.find((g) => {
        const gCode = normalizeHintText(g.code);
        const gAr = normalizeHintText(g.name_ar);
        const gEn = normalizeHintText(g.name_en);
        return region.govCodeOrName.some((cand) => {
          const c = normalizeHintText(cand);
          return (gCode && gCode === c) || (gAr && gAr.includes(c)) || (gEn && gEn.includes(c));
        });
      });
      if (govMatch) {
        suggestedGovernorate = {
          id: govMatch.id,
          nameAr: govMatch.name_ar,
          nameEn: govMatch.name_en || undefined,
        };
      }
      break;
    }
  }

  // 3. Detect Known Entity (Owner / Developer / Main Contractor)
  let suggestedEntity: SmartProjectHints['suggestedEntity'];
  let bestScore = 0;
  for (const ent of entities) {
    const rawAr = ent.displayNameAr || ent.name_ar || '';
    const rawEn = ent.displayNameEn || ent.name_en || '';
    const coreTokensAr = normalizeHintText(rawAr)
      .split(' ')
      .filter((tok) => tok.length >= 4 && !GENERIC_COMPANY_WORDS.has(tok));
    const coreTokensEn = normalizeHintText(rawEn)
      .split(' ')
      .filter((tok) => tok.length >= 4 && !GENERIC_COMPANY_WORDS.has(tok));

    const phraseAr = coreTokensAr.slice(0, 2).join(' ');
    const phraseEn = coreTokensEn.slice(0, 2).join(' ');

    let score = 0;
    if (phraseAr && phraseAr.length >= 4 && combinedNorm.includes(phraseAr)) {
      score = phraseAr.length + 10;
    } else if (phraseEn && phraseEn.length >= 4 && combinedNorm.includes(phraseEn)) {
      score = phraseEn.length + 10;
    } else if (coreTokensAr[0] && coreTokensAr[0].length >= 5 && combinedNorm.includes(coreTokensAr[0])) {
      score = coreTokensAr[0].length;
    } else if (coreTokensEn[0] && coreTokensEn[0].length >= 5 && combinedNorm.includes(coreTokensEn[0])) {
      score = coreTokensEn[0].length;
    }

    if (score > bestScore) {
      bestScore = score;
      suggestedEntity = {
        id: ent.id,
        nameAr: rawAr,
        nameEn: rawEn || undefined,
      };
    }
  }

  return {
    suggestedScopes,
    suggestedGovernorate,
    suggestedLocationHint,
    suggestedEntity,
  };
}

export type SectionReadinessState = 'complete' | 'partial' | 'empty';

export interface ProjectSectionStatus {
  step: number;
  state: SectionReadinessState;
  isRequiredReady: boolean;
}

export interface ProjectCreationValidationInput {
  project_code?: string;
  project_name?: string;
  project_name_en?: string;
  pzone_role?: string;
  client_id?: string;
  governorate_id?: string;
  city_id?: string;
  site_location_address?: string;
  water_area_m2?: number;
  water_vol_m3?: number;
  planned_start_date?: string;
  planned_finish_date?: string;
  contract_date?: string;
  contract_value?: number;
  status?: string;
  project_manager_name_raw?: string;
  metadata?: {
    water_features?: string[];
    owner_client_id?: string;
    owner_name?: string;
    stations_count?: number;
    technical_scope_notes?: string;
    [key: string]: unknown;
  };
}

export interface ProjectCreationValidationIssue {
  step: number;
  fieldId: string;
  messageAr: string;
  messageEn: string;
}

/**
 * Computes per-section readiness for all 6 sections of the Project Setup bar.
 */
export function getProjectSectionsStatus(
  formData: ProjectCreationValidationInput,
  nameArError?: string | null,
  nameEnError?: string | null
): Record<number, ProjectSectionStatus> {
  const hasCode = Boolean(formData.project_code?.trim());
  const hasName = Boolean(formData.project_name?.trim());
  const step1Ready = hasCode && hasName && !nameArError && !nameEnError;
  const step1State: SectionReadinessState = step1Ready
    ? 'complete'
    : hasCode || hasName || Boolean(formData.project_name_en?.trim())
    ? 'partial'
    : 'empty';

  const isSub = formData.pzone_role === 'Sub Contractor' || formData.pzone_role === 'sub_contractor';
  const hasClient = Boolean(formData.client_id?.trim());
  const hasOwner = Boolean(formData.metadata?.owner_client_id?.trim() || formData.metadata?.owner_name?.trim());
  const step2Ready = hasClient && (!isSub || hasOwner);
  const step2State: SectionReadinessState = step2Ready
    ? 'complete'
    : hasClient || hasOwner || Boolean(formData.project_manager_name_raw?.trim())
    ? 'partial'
    : 'empty';

  const hasGov = Boolean(formData.governorate_id?.trim());
  const step3Ready = hasGov;
  const step3State: SectionReadinessState = step3Ready
    ? 'complete'
    : Boolean(formData.city_id?.trim() || formData.site_location_address?.trim())
    ? 'partial'
    : 'empty';

  const scopes = formData.metadata?.water_features || [];
  const hasScopes = scopes.length > 0;
  const needsArea = doesScopeRequireSurfaceArea(scopes);
  const hasArea = Number(formData.water_area_m2 || 0) > 0;
  const step4Ready = hasScopes && (!needsArea || hasArea);
  const step4State: SectionReadinessState = step4Ready
    ? 'complete'
    : hasScopes || hasArea
    ? 'partial'
    : 'empty';

  const hasDates = Boolean(formData.planned_start_date?.trim() && formData.planned_finish_date?.trim());
  const dateCheck = validateProjectDates(formData.planned_start_date, formData.planned_finish_date);
  const step5Ready = hasDates && dateCheck.isValid;
  const step5State: SectionReadinessState = step5Ready
    ? 'complete'
    : Boolean(formData.planned_start_date?.trim() || formData.planned_finish_date?.trim() || formData.contract_date?.trim())
    ? 'partial'
    : 'empty';

  const isTender = formData.status === 'tender';
  const hasContractVal = Number(formData.contract_value || 0) > 0;
  const step6Ready = isTender || hasContractVal;
  const step6State: SectionReadinessState = hasContractVal
    ? 'complete'
    : isTender
    ? 'partial'
    : 'empty';

  return {
    1: { step: 1, state: step1State, isRequiredReady: step1Ready },
    2: { step: 2, state: step2State, isRequiredReady: step2Ready },
    3: { step: 3, state: step3State, isRequiredReady: step3Ready },
    4: { step: 4, state: step4State, isRequiredReady: step4Ready },
    5: { step: 5, state: step5State, isRequiredReady: step5Ready },
    6: { step: 6, state: step6State, isRequiredReady: step6Ready },
  };
}

/**
 * Validates all required fields across the 6 sections when the user clicks "Create Project"
 * from ANY tab, returning the exact target section and field to jump to if incomplete.
 */
export function validateProjectForCreation(
  formData: ProjectCreationValidationInput,
  nameArError?: string | null,
  nameEnError?: string | null
): {
  isValid: boolean;
  issues: ProjectCreationValidationIssue[];
  firstIssue: ProjectCreationValidationIssue | null;
} {
  const issues: ProjectCreationValidationIssue[] = [];

  // Section 1: Project Identity
  if (!formData.project_code?.trim()) {
    issues.push({
      step: 1,
      fieldId: 'project_code',
      messageAr: 'يرجى إدخال كود المشروع في قسم «تعريف المشروع»',
      messageEn: 'Please enter the project code in Project Identity',
    });
  }
  if (!formData.project_name?.trim()) {
    issues.push({
      step: 1,
      fieldId: 'project_name',
      messageAr: 'يرجى إدخال اسم المشروع الرسمي بالعربية في قسم «تعريف المشروع»',
      messageEn: 'Please enter the Arabic project name in Project Identity',
    });
  } else if (nameArError) {
    issues.push({
      step: 1,
      fieldId: 'project_name',
      messageAr: nameArError,
      messageEn: nameArError,
    });
  }
  if (nameEnError) {
    issues.push({
      step: 1,
      fieldId: 'project_name_en',
      messageAr: nameEnError,
      messageEn: nameEnError,
    });
  }

  // Section 2: Contractual Parties
  const isSub = formData.pzone_role === 'Sub Contractor' || formData.pzone_role === 'sub_contractor';
  if (isSub && !formData.metadata?.owner_client_id?.trim() && !formData.metadata?.owner_name?.trim()) {
    issues.push({
      step: 2,
      fieldId: 'owner_client_id',
      messageAr: 'يرجى تحديد المالك أو المطور العقاري في قسم «أطراف التعاقد» (مطلوب عند العمل كمقاول باطن)',
      messageEn: 'Please select the Owner / Real Estate Developer in Contractual Parties',
    });
  }
  if (!formData.client_id?.trim()) {
    issues.push({
      step: 2,
      fieldId: 'client-select-container',
      messageAr: isSub
        ? 'يرجى اختيار المقاول العام (جهة التعاقد المباشر) في قسم «أطراف التعاقد»'
        : 'يرجى اختيار المالك / جهة التعاقد في قسم «أطراف التعاقد»',
      messageEn: 'Please select the contractual client in Contractual Parties',
    });
  }

  // Section 3: Geographic Location
  if (!formData.governorate_id?.trim()) {
    issues.push({
      step: 3,
      fieldId: 'governorate_id',
      messageAr: 'يرجى اختيار المحافظة في قسم «الموقع الجغرافي»',
      messageEn: 'Please select the governorate in Geographic Location',
    });
  }

  // Section 4: Technical Scope
  const scopes = formData.metadata?.water_features || [];
  if (scopes.length === 0) {
    issues.push({
      step: 4,
      fieldId: 'water-scopes-label',
      messageAr: 'يرجى تحديد تخصص واحد على الأقل في قسم «نطاق الأعمال»',
      messageEn: 'Please select at least one scope in Technical Scope',
    });
  } else if (doesScopeRequireSurfaceArea(scopes) && Number(formData.water_area_m2 || 0) <= 0) {
    issues.push({
      step: 4,
      fieldId: 'water_area_m2',
      messageAr: 'يرجى إدخال المساحة التصميمية للمسطحات المائية (م²) في قسم «نطاق الأعمال»',
      messageEn: 'Please enter the water surface area (m²) in Technical Scope',
    });
  }

  // Section 5: Schedule
  if (!formData.planned_start_date?.trim()) {
    issues.push({
      step: 5,
      fieldId: 'planned_start_date',
      messageAr: 'يرجى تحديد تاريخ البدء المخطط في قسم «البرنامج الزمني»',
      messageEn: 'Please specify the planned start date in Project Schedule',
    });
  }
  if (!formData.planned_finish_date?.trim()) {
    issues.push({
      step: 5,
      fieldId: 'planned_finish_date',
      messageAr: 'يرجى تحديد تاريخ التسليم المخطط في قسم «البرنامج الزمني»',
      messageEn: 'Please specify the planned finish date in Project Schedule',
    });
  }
  const dateCheck = validateProjectDates(formData.planned_start_date, formData.planned_finish_date);
  if (!dateCheck.isValid && dateCheck.error) {
    issues.push({
      step: 5,
      fieldId: 'planned_finish_date',
      messageAr: dateCheck.error,
      messageEn: 'Planned finish date cannot precede planned start date',
    });
  }

  // Section 6: Financials & Attachments (Contract value required unless project is still in Tender)
  if (formData.status !== 'tender' && Number(formData.contract_value || 0) <= 0) {
    issues.push({
      step: 6,
      fieldId: 'contract_value',
      messageAr: 'يرجى إدخال قيمة التعاقد في قسم «الماليات والمرفقات» (أو تغيير حالة المشروع إلى مرحلة العطاء)',
      messageEn: 'Please enter the contract value in Financials & Attachments (or set status to Tender)',
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
    firstIssue: issues[0] || null,
  };
}
