import { Client, Project, StakeholderFull, StakeholderKind } from '@/types';
import { getOwnerFromProject } from '@/lib/utils/projectOwner';

export type EntityCategory =
  | 'owner_developer'
  | 'main_contractor'
  | 'consultant'
  | 'subcontractor_vendor';

export type ProjectRelationshipRole = 'owner' | 'client' | 'consultant';

export interface NormalizedEntity extends Client {
  /** Canonical primary UUID from clients table */
  id: string;
  /** All client UUIDs merged into this canonical entity (includes primary `id`) */
  aliasIds: string[];
  category: EntityCategory;
  displayNameAr: string;
  displayNameEn: string;
  canonicalCode: string;
  initials: string;
  searchIndex: string;
}

export interface EntityProjectLink {
  project: Project;
  roles: ProjectRelationshipRole[];
}

export interface EntityPortfolioSummary {
  entity: NormalizedEntity;
  linkedProjects: EntityProjectLink[];
  asOwnerProjects: Project[];
  asClientProjects: Project[];
  asConsultantProjects: Project[];
  totalProjectsCount: number;
  asOwnerCount: number;
  asClientCount: number;
  asConsultantCount: number;
  activeProjectsCount: number;
  finishedProjectsCount: number;
  tenderOrHoldCount: number;
  totalContractValue: number;
  totalVosValue: number;
  totalWaterAreaM2: number;
  avgCompletionPct: number;
  governorates: string[];
  pzoneManagers: string[];
  linkedPeople: StakeholderFull[];
}

export const ENTITY_CATEGORY_META: Record<
  EntityCategory,
  {
    labelAr: string;
    labelEn: string;
    shortAr: string;
    shortEn: string;
    codePrefix: string;
    badgeCls: string;
  }
> = {
  owner_developer: {
    labelAr: 'مطور عقاري / مالك',
    labelEn: 'Owner / Developer',
    shortAr: 'مطور / مالك',
    shortEn: 'Developer / Owner',
    codePrefix: 'DEV-',
    badgeCls:
      'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/80',
  },
  main_contractor: {
    labelAr: 'مقاول عام / عميل تعاقدي',
    labelEn: 'Main Contractor / Client',
    shortAr: 'مقاول عام / عميل',
    shortEn: 'Main Contractor',
    codePrefix: 'CLI-',
    badgeCls:
      'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800/80',
  },
  consultant: {
    labelAr: 'مكتب استشاري هندسي',
    labelEn: 'Engineering Consultant',
    shortAr: 'استشاري هندسي',
    shortEn: 'Consultant',
    codePrefix: 'CON-',
    badgeCls:
      'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/80',
  },
  subcontractor_vendor: {
    labelAr: 'مقاول باطن / مورد',
    labelEn: 'Subcontractor / Vendor',
    shortAr: 'مقاول باطن / مورد',
    shortEn: 'Subcontractor',
    codePrefix: 'SUB-',
    badgeCls:
      'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/80',
  },
};

/**
 * Normalizes Arabic & English text for hamza/ta-marbuta/diacritics-tolerant matching.
 */
export function normalizeTextForSearch(input?: string | null): string {
  if (!input) return '';
  return String(input)
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // diacritics & tatweel
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Builds a canonical deduplication key for corporate entities while preserving
 * distinct sister companies (e.g. Hassan Allam Construction vs Hassan Allam Properties).
 */
export function buildEntityDedupeKey(client: Pick<Client, 'name_ar' | 'name_en' | 'code'>): string {
  const rawAr = normalizeTextForSearch(client.name_ar)
    .replace(/\([^)]*\)/g, ' ') // strip parenthetical acronyms like (HAC)
    .replace(/^(شركه|مؤسسه|مجموعه|مكتب|هيئه|قطاع|اداره)\s+/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (rawAr) return `ar:${rawAr}`;

  const rawEn = normalizeTextForSearch(client.name_en)
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(co|company|corp|inc|ltd|llc|sae|for|the)\b/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (rawEn) return `en:${rawEn}`;
  return `code:${normalizeTextForSearch(client.code)}`;
}

/**
 * Excludes synthetic test records (e.g. TEST-999 / عميل تجريبي) non-destructively.
 */
export function isTestEntity(client: Partial<Client> | null | undefined): boolean {
  if (!client) return true;
  const code = String(client.code || '').trim().toUpperCase();
  const nameAr = normalizeTextForSearch(client.name_ar);
  const nameEn = normalizeTextForSearch(client.name_en);

  if (code.startsWith('TEST-') || code === 'TEST') return true;
  if (nameAr.includes('عميل تجريبي') || nameAr.includes('للتحقق من الحفظ') || nameAr === 'اختبار') {
    return true;
  }
  if (nameEn.includes('test client') || nameEn.includes('dummy client')) {
    return true;
  }
  return false;
}

/**
 * Classifies an entity into Owner/Developer, Main Contractor/Client, Consultant, or Subcontractor/Vendor.
 */
export function classifyEntityCategory(client: Partial<Client>): EntityCategory {
  const explicitType = normalizeTextForSearch(client.type);
  if (explicitType === 'owner' || explicitType === 'developer' || explicitType === 'owner_developer') {
    return 'owner_developer';
  }
  if (explicitType === 'consultant' || explicitType === 'engineering_consultant') {
    return 'consultant';
  }
  if (explicitType === 'subcontractor' || explicitType === 'vendor' || explicitType === 'supplier') {
    return 'subcontractor_vendor';
  }
  if (explicitType === 'contractor' || explicitType === 'main_contractor' || explicitType === 'client') {
    return 'main_contractor';
  }

  const code = String(client.code || '').trim().toUpperCase();
  if (code.startsWith('DEV-') || code.startsWith('OWN-')) return 'owner_developer';
  if (code.startsWith('CON-') || code.startsWith('CNS-')) return 'consultant';
  if (code.startsWith('SUB-') || code.startsWith('VEN-') || code.startsWith('SUP-')) {
    return 'subcontractor_vendor';
  }

  const combined = `${normalizeTextForSearch(client.name_ar)} ${normalizeTextForSearch(client.name_en)}`;

  // 1. Engineering Consultants
  if (
    combined.includes('استشارات') ||
    combined.includes('استشاري') ||
    combined.includes('دار الهندسه') ||
    combined.includes('محرم باخوم') ||
    combined.includes('صبور للاستشارات') ||
    combined.includes('شاكر للاستشارات') ||
    combined.includes('خطيب وعلمي') ||
    combined.includes('ايهاف') ||
    combined.includes('consult') ||
    combined.includes('dar al-handasah') ||
    combined.includes('ecg') ||
    combined.includes('ehaf') ||
    combined.includes('ace ')
  ) {
    return 'consultant';
  }

  // 2. Subcontractors / Suppliers (only if explicitly labeled)
  if (
    combined.includes('مقاول باطن') ||
    combined.includes('توريدات') ||
    combined.includes('للتوريدات') ||
    combined.includes('subcontract') ||
    combined.includes('supplier')
  ) {
    return 'subcontractor_vendor';
  }

  // 3. Explicit Main Contractors (guard against Hassan Allam Construction being misclassified)
  if (
    combined.includes('للانشاءات') ||
    combined.includes('للمقاولات') ||
    combined.includes('كونستركشن') ||
    combined.includes('ريدكون') ||
    combined.includes('كونكريت بلس') ||
    combined.includes('اوراسكوم للانشاءات') ||
    combined.includes('اتريوم') ||
    combined.includes('رواد الهندسه') ||
    combined.includes('الخرافي') ||
    combined.includes('السعداء') ||
    combined.includes('الشرق الاوسط') ||
    combined.includes('cscec') ||
    combined.includes('construction') ||
    combined.includes('contracting')
  ) {
    return 'main_contractor';
  }

  // 4. Real Estate Developers & Owners
  if (
    combined.includes('اعمار') ||
    combined.includes('emaar') ||
    combined.includes('ماونتن فيو') ||
    combined.includes('mountain view') ||
    combined.includes('مراكز') ||
    combined.includes('marakez') ||
    combined.includes('لاند مارك') ||
    combined.includes('landmark') ||
    combined.includes('lmd') ||
    combined.includes('سوديك') ||
    combined.includes('sodic') ||
    combined.includes('بالم هيلز') ||
    combined.includes('palm hills') ||
    combined.includes('تطوير مصر') ||
    combined.includes('tatweer') ||
    combined.includes('مدينه مصر') ||
    combined.includes('مصر الجديده') ||
    combined.includes('madinet masr') ||
    combined.includes('مصر ايطاليا') ||
    combined.includes('هايد بارك') ||
    combined.includes('hyde park') ||
    combined.includes('امكان') ||
    combined.includes('imkan') ||
    combined.includes('اورا ') ||
    combined.includes('ora ') ||
    combined.includes('رؤيه') ||
    combined.includes('rooya') ||
    combined.includes('ايجي جاب') ||
    combined.includes('egygab') ||
    combined.includes('اكام') ||
    combined.includes('akam') ||
    combined.includes('هيئه المجتمعات') ||
    combined.includes('nuca') ||
    combined.includes('العقاريه') ||
    combined.includes('للتطوير') ||
    combined.includes('للتنميه') ||
    combined.includes('للاستثمار') ||
    combined.includes('للتعمير') ||
    combined.includes('القرى السياحيه') ||
    combined.includes('فنادق') ||
    combined.includes('منتجعات') ||
    combined.includes('develop') ||
    combined.includes('properties') ||
    combined.includes('real estate')
  ) {
    return 'owner_developer';
  }

  return 'main_contractor';
}

export function extractEntityInitials(client: Pick<Client, 'name_ar' | 'name_en' | 'code'>): string {
  const ar = (client.name_ar || '')
    .replace(/^(شركة|مؤسسة|مجموعة|مكتب|هيئة)\s+/i, '')
    .trim();
  if (ar) {
    const parts = ar.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`;
    return ar.slice(0, 2);
  }
  const en = (client.name_en || '').trim();
  if (en) {
    const parts = en.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return en.slice(0, 2).toUpperCase();
  }
  return String(client.code || 'PZ').slice(0, 2).toUpperCase();
}

function scoreClientCompleteness(c: Client): number {
  let score = 0;
  if (c.code && !/^CLI-\d+$/.test(c.code)) score += 10;
  else if (c.code) score += 4;
  if (c.name_en) score += 3;
  if (c.contact_person) score += 2;
  if (c.phone) score += 2;
  if (c.email) score += 2;
  if (c.address) score += 1;
  return score;
}

/**
 * Non-destructively deduplicates corporate entities while preserving all alias IDs
 * so historical project foreign keys (`client_id`, `owner_client_id`, etc.) remain 100% linked.
 */
export function deduplicateEntities(clients: Client[] | null | undefined): NormalizedEntity[] {
  if (!clients || clients.length === 0) return [];

  const groups = new Map<string, Client[]>();

  for (const raw of clients) {
    if (!raw || !raw.id) continue;
    if (raw.is_active === false) continue;
    if (isTestEntity(raw)) continue;

    const key = buildEntityDedupeKey(raw);
    const list = groups.get(key) || [];
    list.push(raw);
    groups.set(key, list);
  }

  const normalized: NormalizedEntity[] = [];

  for (const [, members] of groups.entries()) {
    const sorted = [...members].sort((a, b) => scoreClientCompleteness(b) - scoreClientCompleteness(a));
    const primary = sorted[0];
    const aliasIds = Array.from(new Set(sorted.map((m) => m.id)));

    const merged: Client = {
      ...primary,
      name_ar: primary.name_ar || sorted.find((m) => m.name_ar)?.name_ar || '',
      name_en: primary.name_en || sorted.find((m) => m.name_en)?.name_en || undefined,
      code: primary.code || sorted.find((m) => m.code)?.code || undefined,
      contact_person:
        primary.contact_person || sorted.find((m) => m.contact_person)?.contact_person || undefined,
      phone: primary.phone || sorted.find((m) => m.phone)?.phone || undefined,
      email: primary.email || sorted.find((m) => m.email)?.email || undefined,
      address: primary.address || sorted.find((m) => m.address)?.address || undefined,
    };

    const category = classifyEntityCategory(merged);
    const displayNameAr = (merged.name_ar || merged.name_en || merged.code || '').trim();
    const displayNameEn = (merged.name_en || merged.name_ar || merged.code || '').trim();
    const canonicalCode = (merged.code || '').trim();
    const meta = ENTITY_CATEGORY_META[category];

    const searchIndex = normalizeTextForSearch(
      [
        displayNameAr,
        displayNameEn,
        canonicalCode,
        merged.contact_person,
        merged.phone,
        merged.email,
        meta.labelAr,
        meta.labelEn,
      ]
        .filter(Boolean)
        .join(' ')
    );

    normalized.push({
      ...merged,
      id: primary.id,
      aliasIds,
      category,
      displayNameAr,
      displayNameEn,
      canonicalCode,
      initials: extractEntityInitials(merged),
      searchIndex,
    });
  }

  return normalized.sort((a, b) => a.displayNameAr.localeCompare(b.displayNameAr, 'ar'));
}

const BRAND_ALIAS_GROUPS: string[][] = [
  ['اعمار', 'emaar'],
  ['ماونتن فيو', 'mountain view', 'دمج'],
  ['مراكز', 'marakez'],
  ['لاند مارك', 'landmark', 'lmd'],
  ['سوديك', 'sodic'],
  ['بالم هيلز', 'palm hills'],
  ['تطوير مصر', 'tatweer misr'],
  ['مدينه مصر', 'madinet masr', 'مدينه نصر للاسكان'],
  ['مصر ايطاليا', 'misr italia'],
  ['هايد بارك', 'hyde park'],
  ['امكان', 'imkan'],
  ['رؤيه', 'rooya'],
  ['ايجي جاب', 'egygab'],
  ['هيئه المجتمعات', 'nuca'],
  ['دار الهندسه', 'dar al-handasah', 'dar al handasah'],
  ['محرم باخوم', 'ace '],
  ['ريدكون', 'redcon'],
  ['كونكريت بلس', 'concrete plus'],
];

/**
 * Checks whether a free-text party label on a project matches a canonical entity,
 * with strict disambiguation for sister companies (e.g. HAC vs HAP).
 */
export function doesEntityMatchPartyText(entity: NormalizedEntity, rawPartyText?: string | null): boolean {
  if (!rawPartyText) return false;
  const target = normalizeTextForSearch(rawPartyText);
  if (!target || target === 'غير محدد' || target === 'not specified' || target === '—') {
    return false;
  }

  const entityAr = normalizeTextForSearch(entity.displayNameAr);
  const entityEn = normalizeTextForSearch(entity.displayNameEn);
  const entityCode = normalizeTextForSearch(entity.canonicalCode);

  if (entityAr && target === entityAr) return true;
  if (entityEn && target === entityEn) return true;
  if (entityCode && entityCode.length >= 3 && target === entityCode) return true;

  // Guard sister companies under "حسن علام" (HAC vs HAP)
  if (target.includes('حسن علام') || target.includes('hassan allam')) {
    if (!entityAr.includes('حسن علام') && !entityEn.includes('hassan allam')) {
      return false;
    }
    const targetIsHap =
      target.includes('العقاريه') || target.includes('properties') || /\bhap\b/.test(target);
    const targetIsHac =
      target.includes('للانشاءات') || target.includes('construction') || /\bhac\b/.test(target);
    const entityIsHap =
      entityAr.includes('العقاريه') ||
      entityAr.includes('للمقاولات') ||
      entityEn.includes('properties') ||
      /\bhap\b/.test(entityAr) ||
      /\bhap\b/.test(entityCode);
    const entityIsHac =
      entityAr.includes('للانشاءات') ||
      entityEn.includes('construction') ||
      /\bhac\b/.test(entityAr) ||
      /\bhac\b/.test(entityCode);

    if (targetIsHap && entityIsHac && !entityIsHap) return false;
    if (targetIsHac && entityIsHap && !entityIsHac) return false;
    return true;
  }

  // Strip corporate boilerplate for core substring match
  const cleanEntityAr = entityAr
    .replace(/\([^)]*\)/g, ' ')
    .replace(/^(شركه|مؤسسه|مجموعه|مكتب|هيئه)\s+/g, '')
    .trim();
  const cleanTarget = target
    .replace(/\([^)]*\)/g, ' ')
    .replace(/^(شركه|مؤسسه|مجموعه|مكتب|هيئه)\s+/g, '')
    .trim();

  if (cleanEntityAr.length >= 5 && cleanTarget.length >= 5) {
    if (cleanTarget.includes(cleanEntityAr) || cleanEntityAr.includes(cleanTarget)) {
      return true;
    }
  }

  if (entityEn.length >= 5 && cleanTarget.length >= 5) {
    const cleanEn = entityEn.replace(/\([^)]*\)/g, ' ').trim();
    if (cleanEn.length >= 5 && (cleanTarget.includes(cleanEn) || cleanEn.includes(cleanTarget))) {
      return true;
    }
  }

  // Brand alias equivalence (e.g. "إعمار العقارية (Emaar)" <-> "إعمار مصر للتنمية")
  for (const group of BRAND_ALIAS_GROUPS) {
    const entityInGroup = group.some(
      (alias) => entityAr.includes(alias) || entityEn.includes(alias) || entityCode === alias
    );
    if (entityInGroup) {
      const targetInGroup = group.some((alias) => target.includes(alias));
      if (targetInGroup) return true;
    }
  }

  return false;
}

function parseSafeNumber(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
  if (!val) return 0;
  const num = parseFloat(String(val).replace(/,/g, '').trim());
  return Number.isFinite(num) ? num : 0;
}

/**
 * Computes the complete 360° portfolio relationship between every canonical entity,
 * all projects (as Owner/Developer, Contractual Client, and Supervision Consultant),
 * and all linked individuals in `stakeholders`.
 */
export function buildEntitiesPortfolio(
  rawClients: Client[],
  projects: Project[],
  stakeholders: StakeholderFull[] = []
): EntityPortfolioSummary[] {
  const entities = deduplicateEntities(rawClients);
  const safeProjects = (projects || []).filter((p) => !p.deleted_at);
  const safeStakeholders = stakeholders || [];

  return entities.map((entity) => {
    const aliasSet = new Set(entity.aliasIds);

    const linkedProjects: EntityProjectLink[] = [];
    const asOwnerProjects: Project[] = [];
    const asClientProjects: Project[] = [];
    const asConsultantProjects: Project[] = [];

    for (const p of safeProjects) {
      const roles: ProjectRelationshipRole[] = [];

      // 1. Check Contractual Client / Main Contractor link
      const matchesClientId = Boolean(p.client_id && aliasSet.has(p.client_id));
      const pClientText =
        p.client?.name_ar || p.client_name_ar || p.client_name || p.client_name_raw || '';
      const matchesClientText = !p.client_id && doesEntityMatchPartyText(entity, pClientText);
      if (matchesClientId || matchesClientText) {
        roles.push('client');
        asClientProjects.push(p);
      }

      // 2. Check Owner / Real Estate Developer link
      const ownerClientId = p.metadata?.owner_client_id as string | undefined;
      const resolvedOwnerText = p.metadata?.owner_name || getOwnerFromProject(p);
      const matchesOwnerId = Boolean(ownerClientId && aliasSet.has(ownerClientId));
      const matchesOwnerText =
        !matchesOwnerId && doesEntityMatchPartyText(entity, resolvedOwnerText);
      // When an Owner/Developer is the direct contractual client and no separate owner was set:
      const isDirectDeveloperContract =
        entity.category === 'owner_developer' &&
        (matchesClientId || matchesClientText) &&
        (!resolvedOwnerText || resolvedOwnerText === 'غير محدد');

      if (matchesOwnerId || matchesOwnerText || isDirectDeveloperContract) {
        roles.push('owner');
        asOwnerProjects.push(p);
      }

      // 3. Check Supervision Consultant link
      const consultantClientId = p.metadata?.consultant_client_id as string | undefined;
      const consultantFirmText = p.metadata?.consultant_firm as string | undefined;
      const matchesConsultantId = Boolean(consultantClientId && aliasSet.has(consultantClientId));
      const matchesConsultantText =
        !matchesConsultantId && doesEntityMatchPartyText(entity, consultantFirmText);

      if (matchesConsultantId || matchesConsultantText) {
        roles.push('consultant');
        asConsultantProjects.push(p);
      }

      if (roles.length > 0) {
        linkedProjects.push({ project: p, roles });
      }
    }

    const activeProjectsCount = linkedProjects.filter(
      ({ project }) => project.status === 'working' || project.status === 'handing_over'
    ).length;

    const finishedProjectsCount = linkedProjects.filter(
      ({ project }) => project.status === 'finished'
    ).length;

    const tenderOrHoldCount = linkedProjects.filter(({ project }) =>
      ['tender', 'not_started', 'on_hold'].includes(project.status)
    ).length;

    let totalContractValue = 0;
    let totalVosValue = 0;
    let totalWaterAreaM2 = 0;
    let sumCompletion = 0;
    const govSet = new Set<string>();
    const pmSet = new Set<string>();

    for (const { project } of linkedProjects) {
      const baseVal = parseSafeNumber(project.contract_value_egp ?? project.contract_value);
      const vosVal = parseSafeNumber(project.vos_value);
      const totalVal = parseSafeNumber(project.total_contract_value) || baseVal + vosVal;
      totalContractValue += totalVal;
      totalVosValue += vosVal;
      totalWaterAreaM2 += parseSafeNumber(project.total_water_area_m2 ?? project.water_area_m2);
      sumCompletion += parseSafeNumber(project.completion_pct);

      const govName = project.governorate?.name_ar || project.location || '';
      if (govName && govName.trim()) govSet.add(govName.trim());

      const pmName =
        project.pm_canonical_name ||
        project.pm_full_name ||
        project.project_manager_name_raw ||
        project.project_manager ||
        '';
      if (pmName && pmName.trim() && pmName.trim() !== 'غير محدد') {
        pmSet.add(pmName.trim());
      }
    }

    const avgCompletionPct =
      linkedProjects.length > 0 ? Math.round(sumCompletion / linkedProjects.length) : 0;

    // Match linked individuals from stakeholders directory
    const linkedPeople = safeStakeholders.filter((person) => {
      if (person.stakeholder_kind === 'employee') return false;
      if (person.client_id && aliasSet.has(person.client_id)) return true;
      if (person.organization_name && doesEntityMatchPartyText(entity, person.organization_name)) {
        return true;
      }
      return false;
    });

    return {
      entity,
      linkedProjects,
      asOwnerProjects,
      asClientProjects,
      asConsultantProjects,
      totalProjectsCount: linkedProjects.length,
      asOwnerCount: asOwnerProjects.length,
      asClientCount: asClientProjects.length,
      asConsultantCount: asConsultantProjects.length,
      activeProjectsCount,
      finishedProjectsCount,
      tenderOrHoldCount,
      totalContractValue,
      totalVosValue,
      totalWaterAreaM2,
      avgCompletionPct,
      governorates: Array.from(govSet),
      pzoneManagers: Array.from(pmSet),
      linkedPeople,
    };
  });
}

/**
 * Resolves a canonical entity by ID (supporting merged aliasIds) or by name.
 */
export function findCanonicalEntity(
  entities: NormalizedEntity[],
  idOrName?: string | null
): NormalizedEntity | undefined {
  if (!idOrName) return undefined;
  const trimmed = idOrName.trim();
  if (!trimmed) return undefined;

  const byId = entities.find((e) => e.id === trimmed || e.aliasIds.includes(trimmed));
  if (byId) return byId;

  return entities.find((e) => doesEntityMatchPartyText(e, trimmed));
}

/**
 * Deduplicates people records by normalized name + kind so dropdowns stay crisp.
 */
export function deduplicatePeople(stakeholders: StakeholderFull[] | null | undefined): StakeholderFull[] {
  if (!stakeholders || stakeholders.length === 0) return [];
  const seen = new Map<string, StakeholderFull>();

  for (const s of stakeholders) {
    if (!s || s.is_active === false) continue;
    const nameAr = (s.name_ar || '').trim();
    const nameEn = (s.name_en || '').trim();
    if (!nameAr && !nameEn) continue;
    if (normalizeTextForSearch(nameAr).includes('عميل تجريبي')) continue;

    const key = `${s.stakeholder_kind || 'employee'}:${normalizeTextForSearch(nameAr || nameEn)}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, s);
    } else {
      const existingScore = (existing.employee_code ? 3 : 0) + (existing.phone ? 2 : 0) + (existing.email ? 2 : 0) + (existing.client_id ? 2 : 0);
      const nextScore = (s.employee_code ? 3 : 0) + (s.phone ? 2 : 0) + (s.email ? 2 : 0) + (s.client_id ? 2 : 0);
      if (nextScore > existingScore) {
        seen.set(key, s);
      }
    }
  }

  return Array.from(seen.values()).sort((a, b) =>
    (a.name_ar || a.name_en || '').localeCompare(b.name_ar || b.name_en || '', 'ar')
  );
}
