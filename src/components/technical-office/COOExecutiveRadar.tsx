'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Flame,
  UserCheck,
  Building2,
  Layers,
  Zap,
  Compass,
  ArrowRight,
  Filter,
  Search,
  ExternalLink,
  ShieldAlert,
  BellRing,
  RotateCw,
  Send,
  FileSpreadsheet,
  Copy,
  MessageCircle,
} from 'lucide-react';
import { Deliverable, DeliverableItem } from '@/types/planning';
import { Project } from '@/types';
import { TODisciplineBadge, detectDeliverableDiscipline, TODisciplineType } from './TODisciplineBadge';
import { TOConsultantStatusBadge } from './TOConsultantStatusBadge';
import { NotificationService } from '@/lib/services/notification.service';
import { ProjectService } from '@/lib/services/project.service';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export type BottleneckParty = 'all' | 'consultant' | 'to_manager' | 'internal' | 'supplier' | 'client';

export interface COOExecutiveRadarProps {
  deliverables: Deliverable[];
  projects: Project[];
  onRefresh?: () => void;
  selectedProjectId?: string;
  onSelectProject?: (projectId: string) => void;
  className?: string;
}

export interface EngineerRosterItem {
  id: string;
  name_ar: string;
  name_en?: string;
  role?: string;
  discipline: TODisciplineType;
  projectId: string;
  projectName: string;
  activeItem?: DeliverableItem;
  itemCount: number;
  completedCount: number;
  blockedCount: number;
  avgProgress: number;
  status: 'active' | 'blocked' | 'review' | 'idle';
  lastActivity?: string;
}

export interface ParsedBlockerInfo {
  item: DeliverableItem;
  deliverable?: Deliverable;
  projectName: string;
  discipline: TODisciplineType;
  sheetNumber: string;
  description: string;
  fullReason: string;
  cleanReason: string;
  isSiteStopped: boolean;
  bottleneckParty: BottleneckParty;
  rfiNumber: string | null;
  daysBlocked: number;
  blockedSinceDate: string;
}

export function parseObstructionMeta(
  d: {
    blocked_reason?: string | null;
    bottleneck_party?: string | null;
    site_impact?: string | null;
    rfi_number?: string | null;
    parentPackage?: Deliverable;
  }
): {
  bottleneckParty: BottleneckParty;
  siteImpact: string | null;
  isSiteStopped: boolean;
  rfiNumber: string | null;
  cleanReason: string;
} {
  const raw = d.blocked_reason || d.parentPackage?.blocked_reason || '';

  // 1. Bottleneck party: structured field first, fallback to blocked_reason tags
  const structuredParty = d.bottleneck_party ?? d.parentPackage?.bottleneck_party ?? null;
  let party: BottleneckParty = 'consultant';
  if (structuredParty && typeof structuredParty === 'string' && structuredParty.trim()) {
    const p = structuredParty.trim().toLowerCase();
    if (p === 'client') party = 'client';
    else if (
      p === 'supplier' ||
      p === 'subcontractor' ||
      p === 'vendor' ||
      p === 'main_contractor' ||
      p === 'site'
    ) {
      party = 'supplier';
    } else if (p === 'internal' || p === 'to_manager') {
      party = 'to_manager';
    } else {
      party = 'consultant';
    }
  } else {
    const partyMatch = raw.match(/\[(?:الجهة المسؤولة|الجهة):\s*([^\]]+)\]/i);
    const partyToken = partyMatch ? partyMatch[1].trim().toLowerCase() : raw;
    if (
      partyToken.includes('client') ||
      raw.includes('الجهة المسؤولة: client') ||
      raw.includes('الجهة: Client') ||
      raw.includes('مالك')
    ) {
      party = 'client';
    } else if (
      partyToken.includes('main_contractor') ||
      partyToken.includes('supplier') ||
      partyToken.includes('subcontractor') ||
      partyToken.includes('vendor') ||
      partyToken.includes('site') ||
      raw.includes('مقاول') ||
      raw.includes('مورد')
    ) {
      party = 'supplier';
    } else if (
      partyToken.includes('internal') ||
      partyToken.includes('to_manager') ||
      raw.includes('مكتب')
    ) {
      party = 'to_manager';
    } else {
      party = 'consultant';
    }
  }

  // 2. Site impact: structured field first, fallback to blocked_reason tags
  const structuredImpact = d.site_impact ?? d.parentPackage?.site_impact ?? null;
  let isSiteStopped = false;
  let siteImpact: string | null = structuredImpact || null;
  if (structuredImpact && typeof structuredImpact === 'string' && structuredImpact.trim()) {
    const imp = structuredImpact.trim().toLowerCase();
    isSiteStopped =
      imp === 'site_stopped' || imp === 'stops_pouring' || imp === 'critical_path';
  } else {
    const impactMatch = raw.match(/\[الأثر:\s*([^\]]+)\]/i);
    if (impactMatch) {
      siteImpact = impactMatch[1].trim();
      const imp = siteImpact.toLowerCase();
      isSiteStopped =
        imp.includes('stops_pouring') ||
        imp.includes('critical_path') ||
        imp.includes('site_stopped') ||
        imp.includes('يوقف');
    } else {
      isSiteStopped =
        raw.includes('يوقف الصب بالموقع') ||
        raw.includes('CRITICAL') ||
        raw.includes('Stops_Pouring');
      siteImpact = isSiteStopped ? 'Stops_Pouring' : raw ? 'Normal' : null;
    }
  }

  // 3. RFI number: structured field first, fallback to blocked_reason tags
  const structuredRfi = d.rfi_number ?? d.parentPackage?.rfi_number ?? null;
  let rfiNumber: string | null = null;
  if (structuredRfi && typeof structuredRfi === 'string' && structuredRfi.trim()) {
    rfiNumber = structuredRfi.trim().replace(/^#/, '');
  } else {
    const rfiMatch = raw.match(/\[RFI[:\s]*#?([A-Za-z0-9-_]+)\]/i);
    rfiNumber = rfiMatch ? rfiMatch[1] : null;
  }

  // 4. Clean descriptive reason
  const cleanReason = raw
    .replace(/\[يوقف الصب بالموقع - CRITICAL\]/g, '')
    .replace(/\[تجهيز مكتبي\]/g, '')
    .replace(/\[(?:الجهة المسؤولة|الجهة):\s*[^\]]+\]/g, '')
    .replace(/\[الأثر:\s*[^\]]+\]/g, '')
    .replace(/\[RFI[:\s]*#?[^\]]+\]/gi, '')
    .replace(/\[[^\]]+\]/g, '')
    .trim();

  return {
    bottleneckParty: party,
    siteImpact,
    isSiteStopped,
    rfiNumber,
    cleanReason,
  };
}

export function parseGranularBlockers(
  items: (DeliverableItem & { parentPackage?: Deliverable; projectName?: string })[]
): ParsedBlockerInfo[] {
  const list: ParsedBlockerInfo[] = [];

  items.forEach((item) => {
    const isBlockedStatus =
      item.status === 'blocked' || Boolean(item.is_blocked) || Boolean(item.blocked_reason);
    if (!isBlockedStatus) return;

    const raw = item.blocked_reason || '';
    const {
      bottleneckParty: party,
      isSiteStopped,
      rfiNumber,
      cleanReason,
    } = parseObstructionMeta(item);

    // Calculate days blocked
    const blockedDate = item.blocked_since || item.updated_at || new Date().toISOString();
    const elapsedMs = Date.now() - new Date(blockedDate).getTime();
    const daysBlocked = Math.max(1, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));

    list.push({
      item,
      deliverable: item.parentPackage,
      projectName: item.projectName || 'مشروع مائي',
      discipline: detectDeliverableDiscipline(item),
      sheetNumber: item.sheet_number || 'N/A',
      description: item.description,
      fullReason: raw,
      cleanReason: cleanReason || raw,
      isSiteStopped,
      bottleneckParty: party,
      rfiNumber,
      daysBlocked,
      blockedSinceDate: blockedDate.slice(0, 10),
    });
  });

  return list.sort((a, b) => (b.isSiteStopped ? 1 : 0) - (a.isSiteStopped ? 1 : 0) || b.daysBlocked - a.daysBlocked);
}

export function calculateBottleneckCounts(
  deliverables: Deliverable[],
  selectedProjectId: string = 'all'
) {
  let consultantCount = 0;
  let toManagerCount = 0;
  let internalEngineerCount = 0;
  let supplierCount = 0;
  let clientCount = 0;

  deliverables.forEach((d) => {
    if (selectedProjectId !== 'all' && d.project_id !== selectedProjectId) return;

    (d.items || []).forEach((item) => {
      if (item.status === 'returned' || item.status === 'approved' || item.consultant_status === 'A' || item.consultant_status === 'B') {
        return; // Completed
      }

      if (item.status === 'blocked' || item.is_blocked || item.blocked_reason) {
        const structuredParty = item.bottleneck_party ?? d.bottleneck_party ?? null;
        if (structuredParty && typeof structuredParty === 'string' && structuredParty.trim()) {
          const { bottleneckParty } = parseObstructionMeta({ ...item, parentPackage: d });
          if (bottleneckParty === 'client') clientCount++;
          else if (bottleneckParty === 'supplier') supplierCount++;
          else if (bottleneckParty === 'to_manager') toManagerCount++;
          else consultantCount++;
        } else {
          const raw = item.blocked_reason || '';
          if (raw.includes('client') || raw.includes('Client') || raw.includes('مالك')) clientCount++;
          else if (raw.includes('supplier') || raw.includes('Subcontractor') || raw.includes('Vendor') || raw.includes('مورد')) supplierCount++;
          else if (raw.includes('to_manager')) toManagerCount++;
          else consultantCount++;
        }
      } else if (item.status === 'ready_to_return' && !item.to_manager_approved) {
        toManagerCount++;
      } else if (item.status === 'in_progress' || item.status === 'received') {
        internalEngineerCount++;
      }
    });
  });

  return {
    all: consultantCount + toManagerCount + internalEngineerCount + supplierCount + clientCount,
    consultant: consultantCount,
    to_manager: toManagerCount,
    internal: internalEngineerCount,
    supplier: supplierCount,
    client: clientCount,
  };
}

export function buildEngineerRoster(
  allItems: (DeliverableItem & { parentPackage?: Deliverable; projectName: string })[],
  projectStakeholders: any[] = []
): EngineerRosterItem[] {
  const engineerMap = new Map<string, {
    id: string;
    name_ar: string;
    name_en?: string;
    role?: string;
    projectId: string;
    projectName: string;
    items: (DeliverableItem & { projectName: string })[];
  }>();

  // Seed lookup map from active project_stakeholders
  const stakeholderLookup = new Map<string, { name_ar: string; name_en?: string; role?: string; projectId?: string; projectName?: string }>();
  projectStakeholders.forEach((ps: any) => {
    const stk = ps.stakeholder || ps;
    const id = stk?.id || ps.stakeholder_id;
    if (!id) return;
    stakeholderLookup.set(id, {
      name_ar: stk?.name_ar || stk?.name_en || 'مهندس بالمشروع',
      name_en: stk?.name_en,
      role: ps.role_in_project || stk?.role,
      projectId: ps.project_id,
      projectName: ps.projectName,
    });
  });

  allItems.forEach((item) => {
    const stk = item.assigned_stakeholder;
    const engineerId = item.assigned_stakeholder_id || (stk ? stk.id : 'unassigned');
    const lookup = stakeholderLookup.get(engineerId);
    const engineerName =
      stk?.name_ar ||
      lookup?.name_ar ||
      stk?.name_en ||
      lookup?.name_en ||
      (item.assigned_stakeholder_id ? 'مهندس مكتب فني' : 'غير مسند');

    if (!engineerMap.has(engineerId)) {
      engineerMap.set(engineerId, {
        id: engineerId,
        name_ar: engineerName,
        name_en: stk?.name_en || lookup?.name_en,
        role: lookup?.role || stk?.role,
        projectId: item.parentPackage?.project_id || lookup?.projectId || '',
        projectName: item.projectName,
        items: [],
      });
    }

    engineerMap.get(engineerId)!.items.push(item);
  });

  // Also include active project stakeholders who are currently idle (0 items assigned yet)
  projectStakeholders.forEach((ps: any) => {
    const stk = ps.stakeholder || ps;
    const id = stk?.id || ps.stakeholder_id;
    if (!id || engineerMap.has(id)) return;
    engineerMap.set(id, {
      id,
      name_ar: stk?.name_ar || stk?.name_en || 'مهندس بالمشروع',
      name_en: stk?.name_en,
      role: ps.role_in_project || stk?.role,
      projectId: ps.project_id || '',
      projectName: ps.projectName || 'مشروع مائي',
      items: [],
    });
  });

  return Array.from(engineerMap.values()).map((eng) => {
    const total = eng.items.length;
    const completed = eng.items.filter((i) => i.status === 'returned' || i.status === 'approved' || i.progress_pct === 100).length;
    const blocked = eng.items.filter((i) => i.status === 'blocked' || Boolean(i.blocked_reason)).length;
    const inReview = eng.items.filter((i) => i.status === 'ready_to_return' && !i.to_manager_approved).length;

    // Find active item (most recently updated in-progress or blocked)
    const activeItem = eng.items.find((i) => i.status === 'in_progress') || eng.items[0];
    const primaryDiscipline = activeItem ? detectDeliverableDiscipline(activeItem) : 'structural';

    let status: 'active' | 'blocked' | 'review' | 'idle' = 'active';
    if (blocked > 0 && eng.items.every((i) => i.status === 'blocked')) status = 'blocked';
    else if (inReview > 0 && eng.items.every((i) => i.status === 'ready_to_return')) status = 'review';
    else if (total === completed) status = 'idle';

    const avgProgress = total > 0
      ? Math.round(eng.items.reduce((acc, i) => acc + (i.progress_pct || 0), 0) / total)
      : 0;

    return {
      id: eng.id,
      name_ar: eng.name_ar,
      name_en: eng.name_en,
      role: eng.role,
      discipline: primaryDiscipline,
      projectId: eng.projectId,
      projectName: eng.projectName,
      activeItem,
      itemCount: total,
      completedCount: completed,
      blockedCount: blocked,
      avgProgress,
      status,
      lastActivity: activeItem?.updated_at || new Date().toISOString(),
    };
  });
}

export const COOExecutiveRadar: React.FC<COOExecutiveRadarProps> = ({
  deliverables,
  projects,
  onRefresh,
  selectedProjectId = 'all',
  onSelectProject,
  className = '',
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [activeTab, setActiveTab] = useState<'roster' | 'bottlenecks' | 'blockers'>('roster');
  const [selectedParty, setSelectedParty] = useState<BottleneckParty>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDiscipline, setFilterDiscipline] = useState<'all' | TODisciplineType>('all');
  const [isEscalating, setIsEscalating] = useState<string | null>(null);
  const [onlySiteStopped, setOnlySiteStopped] = useState(false);
  const [projectStakeholders, setProjectStakeholders] = useState<any[]>([]);

  // Project ID to name map
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach((p) => map.set(p.id, p));
    return map;
  }, [projects]);

  const getProjectName = (projectId: string): string => {
    const p = projectMap.get(projectId);
    return p?.project_name || p?.project_name_ar || p?.project_code || 'مشروع مائي';
  };

  // Load active project stakeholders for the selected project(s)
  useEffect(() => {
    let cancelled = false;
    async function loadStakeholders() {
      try {
        const targetProjectIds =
          selectedProjectId && selectedProjectId !== 'all'
            ? [selectedProjectId]
            : projects.slice(0, 8).map((p) => p.id);

        if (targetProjectIds.length === 0) {
          if (!cancelled) setProjectStakeholders([]);
          return;
        }

        const results = await Promise.all(
          targetProjectIds.map(async (pid) => {
            const rows = await ProjectService.getProjectStakeholders(pid);
            return (rows || [])
              .filter(
                (ps: any) =>
                  ps.is_active !== false &&
                  (!ps.end_date || new Date(ps.end_date) >= new Date()) &&
                  (ps.party_kind === 'employee' || !ps.party_kind)
              )
              .map((ps: any) => ({
                ...ps,
                projectName: getProjectName(pid),
              }));
          })
        );

        if (!cancelled) {
          setProjectStakeholders(results.flat());
        }
      } catch {
        if (!cancelled) setProjectStakeholders([]);
      }
    }
    loadStakeholders();
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId, projects]);

  // Flatten all items across deliverables
  const allItems = useMemo(() => {
    const items: (DeliverableItem & { parentPackage?: Deliverable; projectName: string })[] = [];
    deliverables.forEach((d) => {
      if (selectedProjectId !== 'all' && d.project_id !== selectedProjectId) return;
      (d.items || []).forEach((item) => {
        items.push({
          ...item,
          parentPackage: d,
          projectName: getProjectName(d.project_id),
        });
      });
    });
    return items;
  }, [deliverables, selectedProjectId, projectMap]);

  // Parse Blockers with Root-Cause and Site Impact Details
  const granularBlockers = useMemo<ParsedBlockerInfo[]>(() => {
    return parseGranularBlockers(allItems);
  }, [allItems]);

  // Critical Site Stoppers (blockers that halt concrete pouring)
  const criticalSiteStoppers = useMemo(() => {
    return granularBlockers.filter((b) => b.isSiteStopped);
  }, [granularBlockers]);

  // Compute "Whose Court is the Ball In?" breakdown
  const bottleneckCounts = useMemo(() => {
    return calculateBottleneckCounts(deliverables, selectedProjectId);
  }, [deliverables, selectedProjectId]);

  // Group items by assigned engineer to build the Live Roster
  const engineerRoster = useMemo<EngineerRosterItem[]>(() => {
    return buildEngineerRoster(allItems, projectStakeholders);
  }, [allItems, projectStakeholders]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return engineerRoster.filter((eng) => {
      if (filterDiscipline !== 'all' && eng.discipline !== filterDiscipline) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = eng.name_ar.toLowerCase().includes(q);
        const matchProj = eng.projectName.toLowerCase().includes(q);
        const matchTask = eng.activeItem?.description?.toLowerCase().includes(q);
        if (!matchName && !matchProj && !matchTask) return false;
      }
      return true;
    });
  }, [engineerRoster, filterDiscipline, searchQuery]);

  // Copy Executive Morning Brief for COO
  const handleCopyMorningBrief = () => {
    const dateStr = new Date().toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const activeCount = filteredRoster.filter((r) => r.status === 'active').length;
    const blockedCount = filteredRoster.filter((r) => r.status === 'blocked').length;
    const reviewCount = filteredRoster.filter((r) => r.status === 'review').length;
    const siteStoppedList = granularBlockers.filter((b) => b.isSiteStopped);

    const briefText = isAr
      ? `📊 ملخص العمليات التنفيذي - إدارة المكتب الفني
📅 التاريخ: ${dateStr}
🌐 نطاق العمل: بحيرات صناعية، حمامات سباحة، ونوافير مائية
---------------------------------------------
👥 سجل المهندسين الميداني (${filteredRoster.length} مهندس):
• قيد العمل الهندسي الفعلي: ${activeCount}
• بانتظار اعتماد مدير المكتب الفني: ${reviewCount}
• معطلون بموانع خارجية: ${blockedCount}

⏱️ خريطة مسؤولية التعطيل وتحديد جهة الاختصاص:
• الاستشاري: ${bottleneckCounts.consultant} معاملة
• المالك والمطور: ${bottleneckCounts.client} معاملة
• المورد ومقاول الباطن: ${bottleneckCounts.supplier} معاملة
• مدير المكتب الفني: ${bottleneckCounts.to_manager} معاملة
• مهندس المكتب الفني: ${bottleneckCounts.internal} معاملة

🚨 عوائق حرجة توقف صب الخرسانة بالموقع (${siteStoppedList.length} لوحة):
${
  siteStoppedList.length > 0
    ? siteStoppedList
        .map(
          (b, i) =>
            `${i + 1}. [${b.sheetNumber}] ${b.projectName}: ${b.cleanReason} (المسؤول: ${
              b.bottleneckParty === 'consultant'
                ? 'الاستشاري'
                : b.bottleneckParty === 'client'
                ? 'المالك والمطور'
                : b.bottleneckParty === 'supplier'
                ? 'المورد ومقاول الباطن'
                : b.bottleneckParty === 'to_manager'
                ? 'مدير المكتب الفني'
                : 'مهندس المكتب الفني'
            })`
        )
        .join('\n')
    : '• لا توجد عوائق توقف صب الخرسانة بالموقع حالياً - الموقع يعمل بانتظام.'
}
---------------------------------------------
منظومة بي زون للتحكم الفني والعملياتي`
      : `📊 Executive Operations Brief - Technical Office
📅 Date: ${dateStr}
🌐 Scope: Lagoons, Pools, and Water Features
---------------------------------------------
👥 Live Engineer Telemetry (${filteredRoster.length} engineers):
• Actively Engineering: ${activeCount}
• Awaiting TO Manager Approval: ${reviewCount}
• Blocked by External Bottlenecks: ${blockedCount}

⏱️ Bottleneck Accountability Map:
• Consultant: ${bottleneckCounts.consultant}
• Client / Owner: ${bottleneckCounts.client}
• Supplier / Subcontractor: ${bottleneckCounts.supplier}
• Technical Office Manager: ${bottleneckCounts.to_manager}
• Internal Engineer: ${bottleneckCounts.internal}

🚨 Critical Site Pour Stoppers (${siteStoppedList.length} deliverables):
${
  siteStoppedList.length > 0
    ? siteStoppedList
        .map(
          (b, i) =>
            `${i + 1}. [${b.sheetNumber}] ${b.projectName}: ${b.cleanReason} (Party: ${b.bottleneckParty})`
        )
        .join('\n')
    : '• No site-halting blockers recorded - works progressing smoothly.'
}
---------------------------------------------
P-Zone ERP Technical & Operational Command`;

    navigator.clipboard.writeText(briefText);
    toast.success(
      isAr
        ? 'تم نسخ التقرير التنفيذي الصباحي بنجاح'
        : 'Morning executive brief copied to clipboard'
    );
  };

  // Format WhatsApp message for instant escalation to PM / Consultant / Site
  const handleWhatsAppEscalate = (blocker: ParsedBlockerInfo) => {
    const partyName = isAr
      ? blocker.bottleneckParty === 'consultant'
        ? 'الاستشاري'
        : blocker.bottleneckParty === 'client'
        ? 'المالك والمطور'
        : blocker.bottleneckParty === 'supplier'
        ? 'المورد ومقاول الباطن'
        : blocker.bottleneckParty === 'to_manager'
        ? 'مدير المكتب الفني'
        : 'مهندس المكتب الفني'
      : blocker.bottleneckParty === 'consultant'
      ? 'Consultant'
      : blocker.bottleneckParty === 'client'
      ? 'Client / Owner'
      : blocker.bottleneckParty === 'supplier'
      ? 'Supplier / Subcontractor'
      : blocker.bottleneckParty === 'to_manager'
      ? 'Technical Office Manager'
      : 'Technical Office Engineer';

    const message = isAr
      ? `🚨 *توجيه تنفيذي فوري بخصوص عائق ميداني*
---------------------------------------
📁 *المشروع:* ${blocker.projectName}
📄 *البند / المخطط:* ${blocker.sheetNumber} - ${blocker.description}
⏳ *مدة التعطيل:* ${blocker.daysBlocked} يوم
🎯 *الجهة المتسببة:* ${partyName}
${blocker.isSiteStopped ? '⛔ *الأثر الميداني:* يوقف صب الخرسانة ومسار الأعمال الحرج بالموقع!' : '⚠️ *الأثر الميداني:* تعليق مسار العمل'}
${blocker.rfiNumber ? `📌 *طلب استفسار فني:* #${blocker.rfiNumber}\n` : ''}
📝 *بيان العائق:* ${blocker.cleanReason}

⚠️ *مطلوب:* إفادة فورية وإجراء تصحيحي لحل العائق خلال 24 ساعة لعدم توقف الأعمال بالموقع.`
      : `🚨 *Executive Directive Regarding Operational Blocker*
---------------------------------------
📁 *Project:* ${blocker.projectName}
📄 *Item / Sheet:* ${blocker.sheetNumber} - ${blocker.description}
⏳ *Days Blocked:* ${blocker.daysBlocked} days
🎯 *Responsible Party:* ${partyName}
${blocker.isSiteStopped ? '⛔ *Impact:* Halts site concrete pour and critical path!' : '⚠️ *Impact:* Suspends work progress'}
${blocker.rfiNumber ? `📌 *RFI Number:* #${blocker.rfiNumber}\n` : ''}
📝 *Blocker Details:* ${blocker.cleanReason}

⚠️ *Required:* Immediate feedback and corrective action within 24 hours to prevent site stoppage.`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Copy formal contractual delay notice to clipboard
  const handleCopyEscalationText = (blocker: ParsedBlockerInfo) => {
    const partyLabel = isAr
      ? blocker.bottleneckParty === 'consultant'
        ? 'استشاري المشروع'
        : blocker.bottleneckParty === 'client'
        ? 'المالك وجهة الإسناد'
        : blocker.bottleneckParty === 'supplier'
        ? 'المورد ومقاول الباطن'
        : blocker.bottleneckParty === 'to_manager'
        ? 'مدير المكتب الفني'
        : 'مهندس المكتب الفني'
      : blocker.bottleneckParty === 'consultant'
      ? 'Project Consultant'
      : blocker.bottleneckParty === 'client'
      ? 'Client / Employer'
      : blocker.bottleneckParty === 'supplier'
      ? 'Supplier / Subcontractor'
      : blocker.bottleneckParty === 'to_manager'
      ? 'Technical Office Manager'
      : 'Technical Office';

    const text = isAr
      ? `إخطار تأخير ومطالبة فورية بحل عائق تنفيذي
المشروع: ${blocker.projectName}
المرجع: ${blocker.sheetNumber} - ${blocker.description}
مدة التعليق: ${blocker.daysBlocked} يوماً
الجهة المسؤولة: ${partyLabel}
${blocker.isSiteStopped ? 'الأثر الميداني: توقف مباشر لصب الخرسانة والأعمال الحرجة بالموقع.' : ''}
${blocker.rfiNumber ? `طلب استفسار فني رقم: #${blocker.rfiNumber}` : ''}
بيان العائق: ${blocker.cleanReason}

نحيطكم علماً بأن استمرار تأخر الرد أو حسم التداخل الموضح أعلاه يُعد إعاقة لسير الأعمال التعاقدية ويترتب عليه احتساب مدد تمديد زمني وتكاليف تأخير تعاقدية وفقاً لاشتراطات العقد وأحكامه.`
      : `Contractual Delay Notice & Demand for Obstruction Resolution
Project: ${blocker.projectName}
Reference: ${blocker.sheetNumber} - ${blocker.description}
Suspension Duration: ${blocker.daysBlocked} days
Responsible Party: ${partyLabel}
${blocker.isSiteStopped ? 'Site Impact: Direct halt to concrete pouring and critical path works.' : ''}
${blocker.rfiNumber ? `Technical Query: RFI #${blocker.rfiNumber}` : ''}
Obstruction Statement: ${blocker.cleanReason}

Please be advised that ongoing delay in resolving this matter constitutes disruption to contractual progress, giving rise to entitlement for Extension of Time (EOT) and associated delay costs pursuant to contract terms.`;

    navigator.clipboard.writeText(text);
    toast.success(
      isAr ? 'تم نسخ الإخطار التعاقدي للحافظة بنجاح' : 'Contractual notice copied to clipboard'
    );
  };

  // Escalation: resolve REAL recipient user ids from user_roles
  // (Target project_manager, technical_office, planning_manager, admin)
  const resolveEscalationRecipients = async (): Promise<string[]> => {
    for (const roles of [
      ['project_manager', 'technical_office', 'technical_office_manager'],
      ['planning_manager', 'admin'],
      ['coo'],
    ]) {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', roles);
      if (error) {
        console.warn('Failed to query user_roles for escalation recipients:', error);
        continue;
      }
      const ids = Array.from(new Set((data || []).map((r) => r.user_id).filter(Boolean))) as string[];
      if (ids.length > 0) return ids;
    }
    return [];
  };

  const handleEscalateBlocker = async (blocker: ParsedBlockerInfo) => {
    setIsEscalating(blocker.item.id);
    try {
      const recipients = await resolveEscalationRecipients();
      if (recipients.length === 0) {
        toast.error(
          isAr
            ? 'لا يوجد مستخدم بدور مدير مشروع أو مكتب فني لاستلام التوجيه'
            : 'No project manager or technical office user found to receive directive'
        );
        return;
      }

      const partyArMap: Record<BottleneckParty, string> = {
        all: 'الكل',
        consultant: 'الاستشاري',
        client: 'المالك والمطور',
        supplier: 'المورد ومقاول الباطن',
        to_manager: 'مدير المكتب الفني',
        internal: 'مهندس المكتب الفني',
      };

      const results = await Promise.all(
        recipients.map((uid) =>
          NotificationService.createNotification({
            project_id: blocker.deliverable?.project_id || null,
            event_type: 'coo_urgent_escalation',
            entity_type: 'obstruction',
            entity_id: blocker.item.id,
            recipient_user_id: uid,
            title_ar: `🚨 توجيه تنفيذي عاجل: ${blocker.sheetNumber} - ${blocker.projectName}`,
            title_en: `🚨 COO Directive: ${blocker.sheetNumber}`,
            body_ar: `توجيه من الإدارة التنفيذية بحل العائق خلال 24 ساعة (معطل منذ ${blocker.daysBlocked} يوم). المتسبب: [${partyArMap[blocker.bottleneckParty] || blocker.bottleneckParty}]. التفاصيل: ${blocker.cleanReason}`,
            body_en: `COO executive directive to resolve blocker within 24h (${blocker.daysBlocked} days blocked). Party: [${blocker.bottleneckParty}]. Reason: ${blocker.cleanReason}`,
            link_url: '/to-tasks',
            metadata: {
              sheet_number: blocker.sheetNumber,
              is_site_stopped: blocker.isSiteStopped,
              bottleneck_party: blocker.bottleneckParty,
            },
          })
        )
      );

      // createNotification swallows errors and returns null → verify it really saved
      const delivered = results.filter(Boolean).length;
      if (delivered === 0) {
        toast.error(isAr ? 'فشل حفظ إشعار التوجيه' : 'Directive was not saved');
        return;
      }
      toast.success(
        isAr
          ? `تم إرسال التوجيه التنفيذي إلى ${delivered} من فريق العمل`
          : `COO directive delivered to ${delivered} recipient(s)`
      );
    } catch {
      toast.error(isAr ? 'فشل إرسال إشعار التوجيه' : 'Directive dispatch failed');
    } finally {
      setIsEscalating(null);
    }
  };

  const handleSelectPartyFilter = (party: BottleneckParty) => {
    setSelectedParty(party);
    if (party !== 'all') {
      setActiveTab('blockers');
    }
  };

  return (
    <div className={`space-y-6 ${className}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner: COO Executive Accountability Radar */}
      <div className="p-6 rounded-3xl bg-gradient-to-l from-slate-900 via-slate-900 to-indigo-950 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 end-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
                <BellRing className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black tracking-tight">
                    {isAr ? 'رادار العمليات التنفيذي ومصفوفة المساءلة اللحظية' : 'COO Operations & Accountability Radar'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {isAr ? 'متابعة حية للمهندسين ومسارات الأعمال' : 'Live Telemetry'}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  {isAr
                    ? 'رؤية لحظية دقيقة: من يعمل على ماذا الآن؟ أين يقف التأخير؟ ومن المسؤول عن التعطيل بالموقع؟'
                    : 'Real-time visibility: Who is working on what? Where is the bottleneck? Who holds the ball?'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Refresh, Export & Filter Info */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {criticalSiteStoppers.length > 0 && (
              <div className="px-4 py-2 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 animate-bounce">
                <Flame className="w-4 h-4 text-rose-400" />
                <span>
                  {criticalSiteStoppers.length} {isAr ? 'عائق يوقف صب الخرسانة بالموقع!' : 'Blockers Halting Site Pour!'}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyMorningBrief}
              className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50 transition-all flex items-center gap-1.5 text-xs font-bold shadow-lg shadow-indigo-600/30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-95"
              title={isAr ? 'نسخ التقرير التنفيذي الصباحي' : 'Copy COO Morning Brief'}
            >
              <Copy className="w-4 h-4" />
              <span className="hidden sm:inline">{isAr ? 'نسخ الملخص التنفيذي' : 'Copy COO Brief'}</span>
            </button>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-95"
                title={isAr ? 'تحديث الرادار' : 'Refresh Radar'}
              >
                <RotateCw className="w-4 h-4" />
                <span className="hidden sm:inline">{isAr ? 'تحديث حي' : 'Refresh'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Accountability Strip: تحديد جهة المسؤولية */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'مصفوفة المساءلة الصريحة وتحديد جهة التعطيل المباشرة' : 'Accountability Matrix: Current Bottlenecks'}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* 1. All */}
            <button
              type="button"
              onClick={() => handleSelectPartyFilter('all')}
              className={`p-3 rounded-2xl border text-start transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-[0.98] ${
                selectedParty === 'all'
                  ? 'bg-indigo-600 border-indigo-400 text-white shadow-md'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-[11px] font-medium opacity-80">{isAr ? 'كامل المعاملات' : 'All Items'}</div>
              <div className="text-lg font-mono font-black mt-0.5">{bottleneckCounts.all}</div>
            </button>

            {/* 2. Consultant */}
            <button
              type="button"
              onClick={() => handleSelectPartyFilter('consultant')}
              className={`p-3 rounded-2xl border text-start transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-[0.98] ${
                selectedParty === 'consultant'
                  ? 'bg-rose-600 border-rose-400 text-white shadow-md'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-[11px] font-medium opacity-80 flex items-center gap-1">
                <span>⏱️ {isAr ? 'الاستشاري' : 'Consultant'}</span>
              </div>
              <div className="text-lg font-mono font-black mt-0.5 text-rose-300">{bottleneckCounts.consultant}</div>
            </button>

            {/* 3. TO Manager */}
            <button
              type="button"
              onClick={() => handleSelectPartyFilter('to_manager')}
              className={`p-3 rounded-2xl border text-start transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-[0.98] ${
                selectedParty === 'to_manager'
                  ? 'bg-purple-600 border-purple-400 text-white shadow-md'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-[11px] font-medium opacity-80">🏢 {isAr ? 'مدير المكتب الفني' : 'TO Manager'}</div>
              <div className="text-lg font-mono font-black mt-0.5 text-purple-300">{bottleneckCounts.to_manager}</div>
            </button>

            {/* 4. Internal Engineer */}
            <button
              type="button"
              onClick={() => handleSelectPartyFilter('internal')}
              className={`p-3 rounded-2xl border text-start transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-[0.98] ${
                selectedParty === 'internal'
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-[11px] font-medium opacity-80">👷 {isAr ? 'مهندس المكتب الفني' : 'TO Engineer'}</div>
              <div className="text-lg font-mono font-black mt-0.5 text-emerald-300">{bottleneckCounts.internal}</div>
            </button>

            {/* 5. Supplier / Subcontractor */}
            <button
              type="button"
              onClick={() => handleSelectPartyFilter('supplier')}
              className={`p-3 rounded-2xl border text-start transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-[0.98] ${
                selectedParty === 'supplier'
                  ? 'bg-amber-600 border-amber-400 text-white shadow-md'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-[11px] font-medium opacity-80">🚚 {isAr ? 'المورد ومقاول الباطن' : 'Supplier/Sub'}</div>
              <div className="text-lg font-mono font-black mt-0.5 text-amber-300">{bottleneckCounts.supplier}</div>
            </button>

            {/* 6. Client */}
            <button
              type="button"
              onClick={() => handleSelectPartyFilter('client')}
              className={`p-3 rounded-2xl border text-start transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 active:scale-[0.98] ${
                selectedParty === 'client'
                  ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                  : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-[11px] font-medium opacity-80">🏛️ {isAr ? 'المالك والمطور' : 'Client / Owner'}</div>
              <div className="text-lg font-mono font-black mt-0.5 text-blue-300">{bottleneckCounts.client}</div>
            </button>
          </div>

          {/* Bottleneck Distribution Bar */}
          {bottleneckCounts.all > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isAr ? 'شريط توزيع نسب التعطيل وفق جهة المسؤولية' : 'Bottleneck Distribution Breakdown'}</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {bottleneckCounts.all} {isAr ? 'معاملة نشطة' : 'active items'}
                </span>
              </div>

              {/* Segmented Distribution Bar */}
              <div className="h-3 w-full bg-slate-800/80 rounded-full overflow-hidden flex p-0.5 gap-0.5 shadow-inner">
                {bottleneckCounts.consultant > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectPartyFilter('consultant')}
                    style={{ width: `${(bottleneckCounts.consultant / bottleneckCounts.all) * 100}%` }}
                    className="h-full bg-rose-500 hover:bg-rose-400 transition-all cursor-pointer first:rounded-s-full last:rounded-e-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
                    title={`${isAr ? 'الاستشاري' : 'Consultant'}: ${bottleneckCounts.consultant} (${Math.round((bottleneckCounts.consultant / bottleneckCounts.all) * 100)}%)`}
                  />
                )}
                {bottleneckCounts.to_manager > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectPartyFilter('to_manager')}
                    style={{ width: `${(bottleneckCounts.to_manager / bottleneckCounts.all) * 100}%` }}
                    className="h-full bg-purple-500 hover:bg-purple-400 transition-all cursor-pointer first:rounded-s-full last:rounded-e-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                    title={`${isAr ? 'مدير المكتب الفني' : 'TO Manager'}: ${bottleneckCounts.to_manager} (${Math.round((bottleneckCounts.to_manager / bottleneckCounts.all) * 100)}%)`}
                  />
                )}
                {bottleneckCounts.internal > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectPartyFilter('internal')}
                    style={{ width: `${(bottleneckCounts.internal / bottleneckCounts.all) * 100}%` }}
                    className="h-full bg-emerald-500 hover:bg-emerald-400 transition-all cursor-pointer first:rounded-s-full last:rounded-e-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                    title={`${isAr ? 'مهندس المكتب الفني' : 'TO Engineer'}: ${bottleneckCounts.internal} (${Math.round((bottleneckCounts.internal / bottleneckCounts.all) * 100)}%)`}
                  />
                )}
                {bottleneckCounts.supplier > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectPartyFilter('supplier')}
                    style={{ width: `${(bottleneckCounts.supplier / bottleneckCounts.all) * 100}%` }}
                    className="h-full bg-amber-500 hover:bg-amber-400 transition-all cursor-pointer first:rounded-s-full last:rounded-e-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                    title={`${isAr ? 'المورد ومقاول الباطن' : 'Supplier/Sub'}: ${bottleneckCounts.supplier} (${Math.round((bottleneckCounts.supplier / bottleneckCounts.all) * 100)}%)`}
                  />
                )}
                {bottleneckCounts.client > 0 && (
                  <button
                    type="button"
                    onClick={() => handleSelectPartyFilter('client')}
                    style={{ width: `${(bottleneckCounts.client / bottleneckCounts.all) * 100}%` }}
                    className="h-full bg-blue-500 hover:bg-blue-400 transition-all cursor-pointer first:rounded-s-full last:rounded-e-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                    title={`${isAr ? 'المالك والمطور' : 'Client/Owner'}: ${bottleneckCounts.client} (${Math.round((bottleneckCounts.client / bottleneckCounts.all) * 100)}%)`}
                  />
                )}
              </div>

              {/* Legend with percentages */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-300 pt-1">
                <div className="flex items-center gap-3 flex-wrap">
                  {bottleneckCounts.consultant > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                      <span>{isAr ? 'الاستشاري' : 'Consultant'}</span>
                      <span className="font-mono text-rose-300 font-bold">{Math.round((bottleneckCounts.consultant / bottleneckCounts.all) * 100)}%</span>
                    </span>
                  )}
                  {bottleneckCounts.to_manager > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                      <span>{isAr ? 'مدير المكتب الفني' : 'TO Manager'}</span>
                      <span className="font-mono text-purple-300 font-bold">{Math.round((bottleneckCounts.to_manager / bottleneckCounts.all) * 100)}%</span>
                    </span>
                  )}
                  {bottleneckCounts.internal > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      <span>{isAr ? 'مهندس المكتب الفني' : 'TO Engineer'}</span>
                      <span className="font-mono text-emerald-300 font-bold">{Math.round((bottleneckCounts.internal / bottleneckCounts.all) * 100)}%</span>
                    </span>
                  )}
                  {bottleneckCounts.supplier > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      <span>{isAr ? 'المورد ومقاول الباطن' : 'Supplier/Sub'}</span>
                      <span className="font-mono text-amber-300 font-bold">{Math.round((bottleneckCounts.supplier / bottleneckCounts.all) * 100)}%</span>
                    </span>
                  )}
                  {bottleneckCounts.client > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                      <span>{isAr ? 'المالك والمطور' : 'Client/Owner'}</span>
                      <span className="font-mono text-blue-300 font-bold">{Math.round((bottleneckCounts.client / bottleneckCounts.all) * 100)}%</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('roster')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 active:scale-[0.98] ${
              activeTab === 'roster'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isAr ? 'سجل المهندسين المباشر وتوزيع المهام' : 'Live Engineer Roster'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-slate-700 dark:bg-slate-200 text-slate-200 dark:text-slate-800">
              {filteredRoster.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('blockers')}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 active:scale-[0.98] ${
              activeTab === 'blockers'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{isAr ? 'شريط العوائق التفصيلي والجهات المعطلة' : 'Granular Blocker Feed'}</span>
            {granularBlockers.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 font-bold">
                {granularBlockers.length}
              </span>
            )}
          </button>
        </div>

        {/* Search & Discipline Filter */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالمهندس، اللوحة، أو المشروع...' : 'Search engineer, sheet, project...'}
              className="ps-9 pe-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48 sm:w-64"
            />
          </div>

          <select
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">{isAr ? 'جميع التخصصات' : 'All Disciplines'}</option>
            <option value="civil">{isAr ? 'الأعمال المدنية والإنشائية' : 'Civil / Structural'}</option>
            <option value="mechanical">{isAr ? 'الأعمال الكهروميكانيكية والهيدروليكية' : 'Mechanical / Hydraulic'}</option>
            <option value="electrical">{isAr ? 'الأعمال الكهربائية وشبكات التأريض' : 'Electrical / Earthing'}</option>
          </select>
        </div>
      </div>

      {/* Active Bottleneck Filter Bar */}
      {selectedParty !== 'all' && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-indigo-900 dark:text-indigo-200">
              {isAr ? 'تصفية حسب مسؤولية التعطيل:' : 'Filtered by Bottleneck Party:'}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white font-bold text-[11px]">
              {selectedParty === 'consultant' && (isAr ? '⏱️ الاستشاري' : 'Consultant')}
              {selectedParty === 'to_manager' && (isAr ? '🏢 مدير المكتب الفني' : 'TO Manager')}
              {selectedParty === 'internal' && (isAr ? '👷 مهندس المكتب الفني' : 'TO Engineer')}
              {selectedParty === 'supplier' && (isAr ? '🚚 المورد ومقاول الباطن' : 'Supplier/Sub')}
              {selectedParty === 'client' && (isAr ? '🏛️ المالك والمطور' : 'Client / Owner')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSelectedParty('all')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg px-2 py-0.5"
          >
            <span>{isAr ? 'إلغاء التصفية وعرض الكل' : 'Clear Filter'}</span>
          </button>
        </div>
      )}

      {/* Tab 1: Live Engineer Roster ("من يعمل على ماذا الآن؟") */}
      {activeTab === 'roster' && (
        <div className="space-y-3">
          {filteredRoster.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                {isAr ? 'لا توجد بيانات مطابقة لمهندسي المكتب الفني' : 'No engineers match criteria'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRoster.map((eng) => {
                const isBlocked = eng.status === 'blocked';
                const isReview = eng.status === 'review';

                return (
                  <div
                    key={eng.id}
                    className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border shadow-sm transition hover:shadow-md space-y-4 ${
                      isBlocked
                        ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/10 dark:bg-rose-950/20'
                        : isReview
                        ? 'border-purple-300 dark:border-purple-900/60'
                        : 'border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    {/* Header: Engineer Info & Discipline */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm text-white shadow-sm ${
                          isBlocked
                            ? 'bg-rose-600'
                            : isReview
                            ? 'bg-purple-600'
                            : 'bg-indigo-600'
                        }`}>
                          {eng.name_ar.slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              {eng.name_ar}
                            </h4>
                            <span className={`w-2 h-2 rounded-full ${
                              isBlocked ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
                            }`} />
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {eng.projectName}
                          </p>
                        </div>
                      </div>

                      <TODisciplineBadge discipline={eng.discipline} />
                    </div>

                    {/* Active Deliverable / Task Currently In-Hand */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>{isAr ? 'المهمة الجارية حالياً:' : 'Active Deliverable:'}</span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          {eng.activeItem?.sheet_number || 'E1/E2'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2">
                        {eng.activeItem?.description || (isAr ? 'لا توجد مهمة نشطة' : 'No active task')}
                      </p>

                      {/* Progress Bar */}
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-500 dark:text-slate-400">{isAr ? 'نسبة الإنجاز:' : 'Progress:'}</span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {eng.activeItem?.progress_pct ?? eng.avgProgress}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isBlocked
                                ? 'bg-rose-500'
                                : eng.avgProgress >= 100
                                ? 'bg-emerald-500'
                                : 'bg-indigo-600'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(0, eng.activeItem?.progress_pct ?? eng.avgProgress))}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer KPI Counters */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-center">
                      <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                        <div className="text-[10px] text-slate-400">{isAr ? 'المسندة' : 'Total'}</div>
                        <div className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200">{eng.itemCount}</div>
                      </div>
                      <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400">{isAr ? 'معتمدة' : 'Done'}</div>
                        <div className="text-xs font-bold font-mono text-emerald-700 dark:text-emerald-400">{eng.completedCount}</div>
                      </div>
                      <div className="p-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30">
                        <div className="text-[10px] text-rose-600 dark:text-rose-400">{isAr ? 'معطلة' : 'Blocked'}</div>
                        <div className="text-xs font-bold font-mono text-rose-700 dark:text-rose-400">{eng.blockedCount}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Granular Blocker Feed ("وايه سبب التأخير بكل تفصيلة صغيره بشكل مباشر") */}
      {activeTab === 'blockers' && (
        <div className="space-y-4">
          {granularBlockers.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {isAr ? 'سجل العمليات نظيف: لا توجد أي عوائق فنية مسجلة حالياً' : 'No active obstructions logged'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {isAr
                  ? 'كافة لوحات وتسليمات المكتب الفني تسير وفق الجداول الزمنية دون موانع ميدانية.'
                  : 'All technical office deliverables are progressing smoothly without recorded bottlenecks.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Quick Sub-filter for critical site stopper */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOnlySiteStopped(!onlySiteStopped)}
                    className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 active:scale-[0.98] ${
                      onlySiteStopped
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-2 ring-rose-400'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    <span>{isAr ? 'ما يوقف صب الخرسانة بالموقع فقط 🚨' : 'Site Pour Halting Only'}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-700 text-white">
                      {granularBlockers.filter((b) => b.isSiteStopped).length}
                    </span>
                  </button>
                  {onlySiteStopped && (
                    <button
                      type="button"
                      onClick={() => setOnlySiteStopped(false)}
                      className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 rounded px-1.5 py-0.5"
                    >
                      {isAr ? 'إلغاء التصفية وعرض الكل' : 'Show All'}
                    </button>
                  )}
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {isAr
                    ? `المعروض: ${
                        granularBlockers
                          .filter((b) => selectedParty === 'all' || b.bottleneckParty === selectedParty)
                          .filter((b) => !onlySiteStopped || b.isSiteStopped).length
                      } عائق`
                    : `Displaying: ${
                        granularBlockers
                          .filter((b) => selectedParty === 'all' || b.bottleneckParty === selectedParty)
                          .filter((b) => !onlySiteStopped || b.isSiteStopped).length
                      } blockers`}
                </span>
              </div>

              {granularBlockers
                .filter((b) => selectedParty === 'all' || b.bottleneckParty === selectedParty)
                .filter((b) => !onlySiteStopped || b.isSiteStopped)
                .map((blocker) => (
                  <div
                    key={blocker.item.id}
                    className={`p-5 rounded-3xl border transition-all duration-200 shadow-sm hover:shadow-md space-y-3.5 ${
                      blocker.isSiteStopped
                        ? 'border-s-4 border-s-rose-600 bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/80'
                        : 'border-s-4 border-s-amber-400 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 ${
                          blocker.isSiteStopped
                            ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        }`}>
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white" dir="ltr">
                              {blocker.sheetNumber}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              {blocker.projectName}
                            </span>
                            <TODisciplineBadge discipline={blocker.discipline} />
                          </div>
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">
                            {blocker.description}
                          </p>
                        </div>
                      </div>

                      {/* Impact & Duration Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {blocker.isSiteStopped ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white flex items-center gap-1.5 shadow-sm shadow-rose-600/30 animate-pulse">
                            <Flame className="w-3.5 h-3.5" />
                            <span>{isAr ? 'يوقف صب الخرسانة بالموقع' : 'Site Concrete Pour Halted'}</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {isAr ? 'تجهيز مكتبي' : 'Office Prep'}
                          </span>
                        )}

                        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{isAr ? `معطل منذ ${blocker.daysBlocked} يوم` : `${blocker.daysBlocked}d Blocked`}</span>
                        </span>
                      </div>
                    </div>

                    {/* Detailed Root Cause & Responsible Party */}
                    <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 dark:text-slate-400">{isAr ? 'الجهة المسؤولة عن التأخير:' : 'Bottleneck Party:'}</span>
                          <span className={`px-2 py-0.5 rounded-md font-bold ${
                            blocker.bottleneckParty === 'consultant'
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : blocker.bottleneckParty === 'client'
                              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                              : blocker.bottleneckParty === 'supplier'
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : blocker.bottleneckParty === 'to_manager'
                              ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}>
                            {blocker.bottleneckParty === 'consultant' && (isAr ? '⏱️ الاستشاري' : '⏱️ Consultant')}
                            {blocker.bottleneckParty === 'client' && (isAr ? '🏛️ المالك والمطور' : '🏛️ Client / Owner')}
                            {blocker.bottleneckParty === 'supplier' && (isAr ? '🚚 المورد ومقاول الباطن' : '🚚 Supplier / Subcontractor')}
                            {blocker.bottleneckParty === 'to_manager' && (isAr ? '🏢 مدير المكتب الفني' : '🏢 TO Manager')}
                            {blocker.bottleneckParty === 'internal' && (isAr ? '👷 مهندس المكتب الفني' : '👷 TO Engineer')}
                          </span>
                        </div>

                        {blocker.rfiNumber && (
                          <span className="px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-mono font-bold border border-cyan-200 dark:border-cyan-800">
                            {isAr ? `طلب استفسار فني #${blocker.rfiNumber}` : `RFI #${blocker.rfiNumber}`}
                          </span>
                        )}
                      </div>

                      <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                        {blocker.cleanReason}
                      </p>
                    </div>

                    {/* Footer Actions: Executive Direct Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[11px] text-slate-400 font-mono">
                        {isAr ? `تاريخ تسجيل العائق: ${blocker.blockedSinceDate}` : `Blocked since: ${blocker.blockedSinceDate}`}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* 1. WhatsApp Escalation */}
                        <button
                          type="button"
                          onClick={() => handleWhatsAppEscalate(blocker)}
                          className="min-h-[36px] px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 active:scale-95"
                          title={isAr ? 'إرسال توجيه وتصعيد عبر واتساب' : 'Escalate via WhatsApp'}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{isAr ? 'توجيه واتساب فوري' : 'WhatsApp'}</span>
                        </button>

                        {/* 2. Copy Formal Notice */}
                        <button
                          type="button"
                          onClick={() => handleCopyEscalationText(blocker)}
                          className="min-h-[36px] px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 active:scale-95"
                          title={isAr ? 'نسخ إخطار تأخير تعاقدي' : 'Copy delay notice'}
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{isAr ? 'نسخ إخطار التأخير' : 'Copy Notice'}</span>
                        </button>

                        {/* 3. System Directive */}
                        <button
                          type="button"
                          disabled={isEscalating === blocker.item.id}
                          onClick={() => handleEscalateBlocker(blocker)}
                          className="min-h-[36px] px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm shadow-rose-600/20 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 active:scale-95"
                          title={isAr ? 'إصدار توجيه داخلي ملزم لفريق المشروع' : 'Issue COO directive'}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{isEscalating === blocker.item.id ? (isAr ? 'جارِ الإرسال...' : 'Sending...') : (isAr ? 'إصدار توجيه ملزم' : 'COO Directive')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
