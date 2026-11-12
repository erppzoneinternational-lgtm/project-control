'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  FileQuestion,
  ClipboardCheck,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Plus,
  Printer,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertTriangle,
  FileSpreadsheet,
  DollarSign,
  CalendarClock,
  Layers,
  Box,
  Search,
  RotateCw,
  X,
  FileCheck2,
  Building2,
  Scale,
} from 'lucide-react';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { printOfficialA4 } from '@/lib/utils/printOfficialA4';
import type { RfiRegisterItem } from '@/types/planning';

export interface TOFieldPaperworkHubProps {
  selectedProjectId: string;
  projectName?: string;
  deliverables: any[];
  onRefresh: () => void;
}

type FieldPaperworkSubTab = 'rfi' | 'wir_mir' | 'ipc_gate';

export type WirInspectionStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface WirRecord {
  deliverableItemId: string;
  wirNo: string;
  requestType: 'WIR' | 'MIR';
  status: WirInspectionStatus;
  inspectionDate: string;
  locationZone: string;
  inspectorNotes: string;
  updatedAt: string;
}

export interface ExtendedRfiItem extends RfiRegisterItem {
  discipline?: string;
  has_cost_impact?: boolean;
  schedule_impact_days?: number;
  notes?: string;
  response_summary?: string;
}

interface NormalizedDeliverableRow {
  id: string;
  deliverable_id: string;
  ref_code: string;
  sheet_number: string;
  title: string;
  deliverable_type: 'Shop_Drawing' | 'Material_Submittal';
  approval_status: 'Code_A' | 'Code_B' | 'Code_C' | 'Code_D' | 'Pending';
  raw_consultant_status: string;
  current_rev: number;
  discipline: string;
  rawItem: any;
}

const FALLBACK_DELIVERABLES: NormalizedDeliverableRow[] = [
  {
    id: 'demo-deliv-item-1',
    deliverable_id: 'demo-deliv-1',
    ref_code: 'SD-STR-001',
    sheet_number: 'S-101',
    title: 'مخطط تسليح حوائط وأرضية المسبح الأولمبي (Shotcrete & Double-Mat Rebar)',
    deliverable_type: 'Shop_Drawing',
    approval_status: 'Code_A',
    raw_consultant_status: 'A',
    current_rev: 2,
    discipline: 'الأعمال المدنية والإنشائية',
    rawItem: { id: 'demo-deliv-item-1', deliverable_id: 'demo-deliv-1', item_type: 'drawing', consultant_status: 'A' },
  },
  {
    id: 'demo-deliv-item-2',
    deliverable_id: 'demo-deliv-2',
    ref_code: 'MAT-MEP-004',
    sheet_number: 'M-204',
    title: 'اعتماد وتوريد مضخات التدوير والفلاتر الرملية عالية الكفاءة (High-Rate Sand Filters)',
    deliverable_type: 'Material_Submittal',
    approval_status: 'Code_B',
    raw_consultant_status: 'B',
    current_rev: 1,
    discipline: 'الميكانيكا وشبكات المسابح',
    rawItem: { id: 'demo-deliv-item-2', deliverable_id: 'demo-deliv-2', item_type: 'material', consultant_status: 'B' },
  },
  {
    id: 'demo-deliv-item-3',
    deliverable_id: 'demo-deliv-3',
    ref_code: 'SD-MEP-012',
    sheet_number: 'MEP-302',
    title: 'مخطط مسارات مواسير السحب والدفع والاسكيمر تحت البلاطة (Under-Slab Piping Sleeves)',
    deliverable_type: 'Shop_Drawing',
    approval_status: 'Code_C',
    raw_consultant_status: 'C',
    current_rev: 1,
    discipline: 'الميكانيكا وشبكات المسابح',
    rawItem: { id: 'demo-deliv-item-3', deliverable_id: 'demo-deliv-3', item_type: 'drawing', consultant_status: 'C' },
  },
  {
    id: 'demo-deliv-item-4',
    deliverable_id: 'demo-deliv-4',
    ref_code: 'MAT-ARC-009',
    sheet_number: 'A-405',
    title: 'اعتماد عينات بلاط البورسلان المقاوم للانزلاق والكلور ومواد الإيبوكسي (Pool Tiles & Epoxy Grout)',
    deliverable_type: 'Material_Submittal',
    approval_status: 'Pending',
    raw_consultant_status: 'pending',
    current_rev: 0,
    discipline: 'الأعمال المعمارية والتشطيبات',
    rawItem: { id: 'demo-deliv-item-4', deliverable_id: 'demo-deliv-4', item_type: 'material', consultant_status: 'pending' },
  },
];

function mapApprovalStatus(raw: any): 'Code_A' | 'Code_B' | 'Code_C' | 'Code_D' | 'Pending' {
  const val = String(raw?.approval_status || raw?.consultant_status || '').trim().toUpperCase();
  if (val === 'CODE_A' || val === 'A' || val === 'APPROVED') return 'Code_A';
  if (val === 'CODE_B' || val === 'B' || val === 'APPROVED_WITH_COMMENTS') return 'Code_B';
  if (val === 'CODE_C' || val === 'C' || val === 'REVISE_AND_RESUBMIT') return 'Code_C';
  if (val === 'CODE_D' || val === 'D' || val === 'REJECTED') return 'Code_D';
  return 'Pending';
}

function mapDeliverableType(item: any, parentDeliverable?: any): 'Shop_Drawing' | 'Material_Submittal' {
  const explicitType = String(item?.deliverable_type || parentDeliverable?.deliverable_type || '').trim();
  if (explicitType === 'Material_Submittal') return 'Material_Submittal';
  if (explicitType === 'Shop_Drawing') return 'Shop_Drawing';

  const itemType = String(item?.item_type || '').toLowerCase();
  const kind = String(parentDeliverable?.kind || item?.kind || '').toUpperCase();
  if (itemType === 'material' || kind === 'E2') return 'Material_Submittal';
  return 'Shop_Drawing';
}

const WIR_STATUS_META: Record<
  WirInspectionStatus,
  { label: string; badgeClass: string; borderClass: string }
> = {
  pending: {
    label: 'قيد التجهيز',
    badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    borderClass: 'border-slate-300 dark:border-slate-700',
  },
  submitted: {
    label: 'مرسل للاستشاري',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    borderClass: 'border-amber-400/50',
  },
  approved: {
    label: 'معتمد ميدانياً',
    badgeClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    borderClass: 'border-emerald-500/50',
  },
  rejected: {
    label: 'مرفوض ميدانياً',
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
    borderClass: 'border-rose-500/50',
  },
};

const APPROVAL_CODE_BADGE: Record<
  NormalizedDeliverableRow['approval_status'],
  { label: string; short: string; className: string }
> = {
  Code_A: {
    label: 'معتمد بالكامل (كود أ)',
    short: 'كود أ',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-400/50 dark:bg-emerald-950/50 dark:text-emerald-300',
  },
  Code_B: {
    label: 'معتمد بملاحظات (كود ب)',
    short: 'كود ب',
    className: 'bg-sky-50 text-sky-700 border-sky-400/50 dark:bg-sky-950/50 dark:text-sky-300',
  },
  Code_C: {
    label: 'إعادة تقديم وتعديل (كود ج)',
    short: 'كود ج',
    className: 'bg-amber-50 text-amber-700 border-amber-400/50 dark:bg-amber-950/50 dark:text-amber-300',
  },
  Code_D: {
    label: 'مرفوض نهائياً (كود د)',
    short: 'كود د',
    className: 'bg-rose-50 text-rose-700 border-rose-400/50 dark:bg-rose-950/50 dark:text-rose-300',
  },
  Pending: {
    label: 'قيد المراجعة والاعتماد',
    short: 'قيد المراجعة',
    className: 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  },
};

export function TOFieldPaperworkHub({
  selectedProjectId,
  projectName,
  deliverables,
  onRefresh,
}: TOFieldPaperworkHubProps) {
  const [activeSubTab, setActiveSubTab] = useState<FieldPaperworkSubTab>('rfi');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Normalized Deliverables (handles nested d.items or flat array) ──────────
  const normalizedRows = useMemo<NormalizedDeliverableRow[]>(() => {
    const rows: NormalizedDeliverableRow[] = [];
    if (Array.isArray(deliverables) && deliverables.length > 0) {
      for (const d of deliverables) {
        if (Array.isArray(d?.items) && d.items.length > 0) {
          for (const item of d.items) {
            rows.push({
              id: String(item.id || `${d.id}-${rows.length}`),
              deliverable_id: String(item.deliverable_id || d.id || ''),
              ref_code: String(d.ref_code || item.sheet_number || `SUB-${rows.length + 1}`),
              sheet_number: String(item.sheet_number || d.ref_code || `SH-${rows.length + 1}`),
              title: String(item.description || d.title_ar || d.title_en || 'مخرج هندسي'),
              deliverable_type: mapDeliverableType(item, d),
              approval_status: mapApprovalStatus(item),
              raw_consultant_status: String(item.consultant_status || 'pending'),
              current_rev: Number(item.current_rev ?? 0),
              discipline:
                item.item_type === 'material' || d.kind === 'E2'
                  ? 'اعتمادات المواد والتوريدات'
                  : 'المخططات التنفيذية (شوب دروينج)',
              rawItem: item,
            });
          }
        } else {
          rows.push({
            id: String(d.id || `deliv-${rows.length}`),
            deliverable_id: String(d.deliverable_id || d.id || ''),
            ref_code: String(d.ref_code || d.code || `SUB-${rows.length + 1}`),
            sheet_number: String(d.sheet_number || d.ref_code || `SH-${rows.length + 1}`),
            title: String(d.title_ar || d.description || d.title || 'مخرج هندسي'),
            deliverable_type: mapDeliverableType(d),
            approval_status: mapApprovalStatus(d),
            raw_consultant_status: String(d.consultant_status || d.approval_status || 'pending'),
            current_rev: Number(d.current_rev ?? 0),
            discipline: String(d.discipline || 'الأعمال المدنية والكهروميكانيكية'),
            rawItem: d,
          });
        }
      }
    }

    return rows.length > 0 ? rows : FALLBACK_DELIVERABLES;
  }, [deliverables]);

  // ── 1. RFI State & Storage ──────────────────────────────────────────────────
  const rfiStorageKey = `pzone_rfi_registry_${selectedProjectId || 'all'}`;
  const [rfiList, setRfiList] = useState<ExtendedRfiItem[]>([]);
  const [loadingRfis, setLoadingRfis] = useState(false);
  const [savingRfi, setSavingRfi] = useState(false);
  const [showNewRfiForm, setShowNewRfiForm] = useState(false);
  const [printableRfi, setPrintableRfi] = useState<ExtendedRfiItem | null>(null);

  // RFI Form State
  const [rfiNo, setRfiNo] = useState('RFI-PL-001');
  const [rfiSubject, setRfiSubject] = useState('');
  const [rfiDiscipline, setRfiDiscipline] = useState('الميكانيكا وشبكات المسابح');
  const [rfiLinkedDeliverableId, setRfiLinkedDeliverableId] = useState('');
  const [rfiHasCostImpact, setRfiHasCostImpact] = useState(false);
  const [rfiScheduleImpactDays, setRfiScheduleImpactDays] = useState<number>(0);
  const [rfiNotes, setRfiNotes] = useState('');
  const [rfiStatus, setRfiStatus] = useState<RfiRegisterItem['status']>('sent');
  const [rfiResponseSummary, setRfiResponseSummary] = useState('');
  const [rfiTargetReplyDate, setRfiTargetReplyDate] = useState(() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  });

  const loadRfis = useCallback(async () => {
    setLoadingRfis(true);
    try {
      let localItems: ExtendedRfiItem[] = [];
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem(rfiStorageKey);
        if (raw) {
          localItems = JSON.parse(raw);
        }
      }

      const dbItems = await DeliverablesService.getRfiRegister(
        (selectedProjectId !== 'all' ? selectedProjectId : undefined) as unknown as string
      );

      const localById = new Map<string, ExtendedRfiItem>();
      for (const loc of localItems) {
        localById.set(loc.id || loc.rfi_no, loc);
      }

      const merged: ExtendedRfiItem[] = [];
      for (const dbItem of dbItems || []) {
        const extra = localById.get(dbItem.id) || localById.get(dbItem.rfi_no);
        merged.push({
          ...extra,
          ...dbItem,
          response_summary: dbItem.reply_summary || extra?.response_summary || '',
        });
        if (extra) {
          localById.delete(dbItem.id);
          localById.delete(dbItem.rfi_no);
        }
      }

      for (const remaining of localById.values()) {
        merged.push(remaining);
      }

      if (merged.length === 0) {
        const seedRfi: ExtendedRfiItem = {
          id: 'seed-rfi-001',
          project_id: selectedProjectId,
          rfi_no: 'RFI-PL-001',
          subject: 'تعارض منسوب خط الراجع الرئيسي (قطر 200 مم) مع كمرة الأساسات المقلوبة بمحور B-4',
          discipline: 'الميكانيكا وشبكات المسابح',
          sent_date: new Date().toISOString().slice(0, 10),
          target_reply_date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
          status: 'sent',
          related_deliverable_item_id: normalizedRows[0]?.id || undefined,
          has_cost_impact: false,
          schedule_impact_days: 3,
          notes:
            'نرجو التكرم بالموافقة على تمرير خط الراجع الرئيسي قطر 200 مم عبر جراب صلب محمي (Steel Sleeve PN16) مع شفة مانعة للتسرب (Puddle Flange) في منتصف البحر الآمن للكمرة وفق محددات الكود السعودي SBC 304.',
          reply_summary: '',
          response_summary: '',
        };
        setRfiList([seedRfi]);
        setRfiNo('RFI-PL-002');
      } else {
        setRfiList(merged);
        setRfiNo(`RFI-PL-${String(merged.length + 1).padStart(3, '0')}`);
      }
    } catch {
      // Fallback silently to existing state
    } finally {
      setLoadingRfis(false);
    }
  }, [selectedProjectId, rfiStorageKey, normalizedRows]);

  useEffect(() => {
    loadRfis();
  }, [loadRfis]);

  const handleCreateRfi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfiSubject.trim()) return;
    setSavingRfi(true);

    const newEntry: ExtendedRfiItem = {
      id: `rfi-local-${Date.now()}`,
      project_id: selectedProjectId !== 'all' ? selectedProjectId : 'all',
      rfi_no: rfiNo.trim() || `RFI-PL-${String(rfiList.length + 1).padStart(3, '0')}`,
      subject: rfiSubject.trim(),
      discipline: rfiDiscipline,
      sent_date: new Date().toISOString().slice(0, 10),
      target_reply_date: rfiTargetReplyDate || undefined,
      replied_date: rfiStatus === 'answered' || rfiStatus === 'closed' ? new Date().toISOString().slice(0, 10) : undefined,
      reply_summary: rfiResponseSummary.trim() || undefined,
      response_summary: rfiResponseSummary.trim() || '',
      status: rfiStatus,
      related_deliverable_item_id: rfiLinkedDeliverableId || undefined,
      has_cost_impact: rfiHasCostImpact,
      schedule_impact_days: Number(rfiScheduleImpactDays) || 0,
      notes: rfiNotes.trim(),
    };

    try {
      if (selectedProjectId && selectedProjectId !== 'all') {
        const savedDb = await DeliverablesService.saveRfiItem({
          project_id: selectedProjectId,
          rfi_no: newEntry.rfi_no,
          subject: newEntry.subject,
          sent_date: newEntry.sent_date,
          target_reply_date: newEntry.target_reply_date,
          replied_date: newEntry.replied_date,
          reply_summary: newEntry.reply_summary,
          status: newEntry.status,
          related_deliverable_item_id: newEntry.related_deliverable_item_id,
        });
        if (savedDb?.id) {
          newEntry.id = savedDb.id;
        }
      }
    } catch {
      // Fallback to localStorage below
    }

    const updated = [newEntry, ...rfiList];
    setRfiList(updated);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(rfiStorageKey, JSON.stringify(updated));
    }

    // Reset form & increment auto-suggested RFI number
    setRfiNo(`RFI-PL-${String(updated.length + 1).padStart(3, '0')}`);
    setRfiSubject('');
    setRfiNotes('');
    setRfiResponseSummary('');
    setRfiHasCostImpact(false);
    setRfiScheduleImpactDays(0);
    setShowNewRfiForm(false);
    setSavingRfi(false);
    onRefresh();
  };

  const handleUpdateRfiStatus = async (
    item: ExtendedRfiItem,
    nextStatus: RfiRegisterItem['status'],
    replyText?: string
  ) => {
    const updatedItem: ExtendedRfiItem = {
      ...item,
      status: nextStatus,
      reply_summary: replyText !== undefined ? replyText : item.reply_summary,
      response_summary: replyText !== undefined ? replyText : item.response_summary,
      replied_date:
        nextStatus === 'answered' || nextStatus === 'closed'
          ? new Date().toISOString().slice(0, 10)
          : item.replied_date,
    };

    try {
      if (selectedProjectId && selectedProjectId !== 'all' && !String(item.id).startsWith('seed-')) {
        await DeliverablesService.saveRfiItem({
          id: item.id,
          project_id: selectedProjectId,
          rfi_no: updatedItem.rfi_no,
          subject: updatedItem.subject,
          sent_date: updatedItem.sent_date,
          target_reply_date: updatedItem.target_reply_date,
          replied_date: updatedItem.replied_date,
          reply_summary: updatedItem.reply_summary,
          status: updatedItem.status,
          related_deliverable_item_id: updatedItem.related_deliverable_item_id,
        });
      }
    } catch {
      // Continue with localStorage fallback
    }

    const nextList = rfiList.map((r) => (r.id === item.id ? updatedItem : r));
    setRfiList(nextList);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(rfiStorageKey, JSON.stringify(nextList));
    }
    onRefresh();
  };

  // ── 2. WIR / MIR Registry State & Storage ───────────────────────────────────
  const wirStorageKey = `pzone_wir_registry_${selectedProjectId}`;
  const [wirRegistry, setWirRegistry] = useState<Record<string, WirRecord>>({});
  const [printableWirRow, setPrintableWirRow] = useState<{
    deliverable: NormalizedDeliverableRow;
    wir: WirRecord;
  } | null>(null);
  const [showIpcClearancePrintModal, setShowIpcClearancePrintModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(wirStorageKey);
      if (raw) {
        setWirRegistry(JSON.parse(raw));
      } else {
        // Initialize default WIR for first Code_A item so KPIs & gates have immediate realistic data
        const firstCodeA = normalizedRows.find((r) => r.approval_status === 'Code_A');
        if (firstCodeA) {
          const initialMap: Record<string, WirRecord> = {
            [firstCodeA.id]: {
              deliverableItemId: firstCodeA.id,
              wirNo: 'WIR-PL-001',
              requestType: firstCodeA.deliverable_type === 'Material_Submittal' ? 'MIR' : 'WIR',
              status: 'approved',
              inspectionDate: new Date().toISOString().slice(0, 10),
              locationZone: 'قطاع المسبح الرئيسي — محور A1-D6',
                inspectorNotes: 'تم فحص أقطار التسليح، البسكويت الخرساني، وشريط منع تسرب المياه ومطابقتها للمخطط المعتمد كود أ.',
              updatedAt: new Date().toISOString(),
            },
          };
          setWirRegistry(initialMap);
          window.localStorage.setItem(wirStorageKey, JSON.stringify(initialMap));
        }
      }
    } catch {
      setWirRegistry({});
    }
  }, [wirStorageKey, normalizedRows]);

  const handleIssueOrUpdateWir = async (
    row: NormalizedDeliverableRow,
    nextStatus: WirInspectionStatus,
    customNotes?: string
  ) => {
    // Strict Engineering Gate check
    if (row.approval_status !== 'Code_A' && row.approval_status !== 'Code_B') {
      return;
    }

    const existing = wirRegistry[row.id];
    const isMaterial = row.deliverable_type === 'Material_Submittal';
    const prefix = isMaterial ? 'MIR-PL-' : 'WIR-PL-';
    const seqNum = Object.keys(wirRegistry).length + 1;
    const wirNo = existing?.wirNo || `${prefix}${String(seqNum).padStart(3, '0')}`;

    const record: WirRecord = {
      deliverableItemId: row.id,
      wirNo,
      requestType: isMaterial ? 'MIR' : 'WIR',
      status: nextStatus,
      inspectionDate: existing?.inspectionDate || new Date().toISOString().slice(0, 10),
      locationZone: existing?.locationZone || 'موقع المشروع — منطقة الأعمال المائية',
      inspectorNotes:
        customNotes !== undefined
          ? customNotes
          : existing?.inspectorNotes ||
            (isMaterial
              ? 'فحص ومطابقة المواد الموردة للموقع مع شهادة المنشأ والاعتماد الفني.'
              : 'استلام الأعمال المنفذة ميدانياً ومطابقتها مع المخطط التنفيذي المعتمد.'),
      updatedAt: new Date().toISOString(),
    };

    const nextMap = {
      ...wirRegistry,
      [row.id]: record,
    };

    setWirRegistry(nextMap);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(wirStorageKey, JSON.stringify(nextMap));
    }

    try {
      await DeliverablesService.saveDeliverableItem({
        ...row.rawItem,
        id: row.id,
        deliverable_id: row.deliverable_id,
        description: row.title,
      });
    } catch {
      // Ignore DB persistence errors if running with demo/local items
    }

    onRefresh();
  };

  // ── 3. IPC Billing Gate Calculations (Golden Rule) ──────────────────────────
  const ipcAuditRows = useMemo(() => {
    return normalizedRows.map((row) => {
      const isConsultantApproved = row.approval_status === 'Code_A' || row.approval_status === 'Code_B';
      const wir = wirRegistry[row.id] || null;
      const isWirApproved = wir?.status === 'approved';
      const isClearedForIpc = isConsultantApproved && isWirApproved;

      let blockReason = '';
      if (!isConsultantApproved && !isWirApproved) {
        blockReason = 'محجوب: غير معتمد هندسياً (يتطلب كود أ أو كود ب) + لا يوجد محضر استلام ميداني معتمد';
      } else if (!isConsultantApproved) {
        blockReason = 'محجوب: المخطط التنفيذي أو اعتماد المواد غير معتمد بكود أ أو كود ب من الاستشاري المشرف';
      } else if (!isWirApproved) {
        blockReason = wir
          ? `محجوب: طلب الاستلام الميداني (${wir.wirNo}) في حالة [${WIR_STATUS_META[wir.status].label}] ولم يعتمد بعد`
          : 'محجوب: لم يتم إصدار واعتماد محضر الاستلام الميداني بالموقع';
      }

      return {
        row,
        wir,
        isConsultantApproved,
        isWirApproved,
        isClearedForIpc,
        blockReason,
      };
    });
  }, [normalizedRows, wirRegistry]);

  const ipcSummary = useMemo(() => {
    const total = ipcAuditRows.length;
    const clearedCount = ipcAuditRows.filter((r) => r.isClearedForIpc).length;
    const blockedCount = ipcAuditRows.filter((r) => !r.isClearedForIpc).length;
    const wirPendingCount = ipcAuditRows.filter((r) => r.isConsultantApproved && !r.isWirApproved).length;
    const readinessPct = total > 0 ? Math.round((clearedCount / total) * 100) : 0;

    return {
      total,
      clearedCount,
      blockedCount,
      wirPendingCount,
      readinessPct,
    };
  }, [ipcAuditRows]);

  const filteredDeliverableRows = useMemo(() => {
    if (!searchQuery.trim()) return normalizedRows;
    const q = searchQuery.toLowerCase().trim();
    return normalizedRows.filter(
      (r) =>
        r.ref_code.toLowerCase().includes(q) ||
        r.sheet_number.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q)
    );
  }, [normalizedRows, searchQuery]);

  const displayProjectName = projectName || (selectedProjectId === 'all' ? 'كافة المشاريع النشطة' : 'مشروع المسابح والمنشآت المائية');

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── Top Header & Sub-Tabs Bar ─────────────────────────────────────── */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-bold">
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>منظومة الدورة المستندية الميدانية وبوابة المستخلصات</span>
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">وفق العقود القياسية والكود الهندسي المعتمد</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              الاعتمادات الميدانية وحوكمة صرف المستخلصات الجارية
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              الربط الهندسي الإلزامي بين الاستفسارات الفنية، واعتمادات المخططات التنفيذية والمواد، ومحاضر الفحص والاستلام الميداني، مع أهلية الصرف في المستخلصات الجارية.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث برقم المرجع أو بيان البند..."
                className="h-9 ps-8 pe-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                loadRfis();
                onRefresh();
              }}
              className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>تحديث</span>
            </button>
          </div>
        </div>

        {/* 3 Sub-Tabs Switcher */}
        <div
          className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'rfi'}
            onClick={() => setActiveSubTab('rfi')}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              activeSubTab === 'rfi'
                ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm border border-slate-200 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <FileQuestion className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>سجل طلبات الاستفسار الفني</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold">
              {rfiList.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'wir_mir'}
            onClick={() => setActiveSubTab('wir_mir')}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              activeSubTab === 'wir_mir'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-sm border border-slate-200 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <ClipboardCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>محاضر الفحص والاستلام الميداني</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold">
              {normalizedRows.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeSubTab === 'ipc_gate'}
            onClick={() => setActiveSubTab('ipc_gate')}
            className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              activeSubTab === 'ipc_gate'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm border border-slate-200 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/50'
            }`}
          >
            <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>بوابة تدقيق وصرف المستخلصات الجارية</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
              {ipcSummary.clearedCount}/{ipcSummary.total}
            </span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-TAB 1: سجل ومولد طلبات الاستفسار الفني
         ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'rfi' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Action Banner */}
          <div className="p-4 rounded-2xl bg-teal-50/90 dark:bg-gradient-to-l dark:from-teal-950/90 dark:to-slate-900 text-slate-900 dark:text-white border border-teal-200 dark:border-teal-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-black flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>سجل ومولد طلبات الاستفسار الفني للمشروع</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                توثيق التعارضات بين المخططات الإنشائية والكهروميكانيكية وربطها بالمخرجات، مع توثيق الأثر المالي والزمني لحفظ حقوق تمديد المدة وأوامر التغيير التعاقدية.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewRfiForm((prev) => !prev)}
              className="px-4 py-2.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 text-xs font-black flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2"
            >
              <Plus className="w-4 h-4" />
              <span>{showNewRfiForm ? 'إغلاق نموذج الإضافة' : 'إصدار طلب استفسار فني جديد'}</span>
            </button>
          </div>

          {/* New RFI Creation Form */}
          {showNewRfiForm && (
            <form
              onSubmit={handleCreateRfi}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-teal-500/40 shadow-lg space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-teal-600" />
                  <span>تحرير وإصدار طلب استفسار فني رسمي</span>
                </h4>
                <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">{rfiNo}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    رقم الاستفسار الفني
                  </label>
                  <input
                    type="text"
                    required
                    value={rfiNo}
                    onChange={(e) => setRfiNo(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    التخصص الهندسي
                  </label>
                  <select
                    value={rfiDiscipline}
                    onChange={(e) => setRfiDiscipline(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    <option value="الأعمال المدنية والإنشائية">الأعمال المدنية والإنشائية</option>
                    <option value="الميكانيكا وشبكات المسابح">الميكانيكا وشبكات المسابح</option>
                    <option value="الأعمال المعمارية والتشطيبات">الأعمال المعمارية والتشطيبات</option>
                    <option value="الأعمال الكهربائية وأنظمة التحكم">الأعمال الكهربائية وأنظمة التحكم</option>
                    <option value="العزل المائي والمعالجات الكيميائية">العزل المائي والمعالجات الكيميائية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    المخرج الهندسي المرتبط
                  </label>
                  <select
                    value={rfiLinkedDeliverableId}
                    onChange={(e) => setRfiLinkedDeliverableId(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    <option value="">— اختر اللوحة أو اعتماد الخامة المرتبط —</option>
                    {normalizedRows.map((d) => (
                      <option key={d.id} value={d.id}>
                        [{d.ref_code}] {d.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    حالة الاستفسار
                  </label>
                  <select
                    value={rfiStatus}
                    onChange={(e) => setRfiStatus(e.target.value as RfiRegisterItem['status'])}
                    className="w-full h-9.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  >
                    <option value="draft">مسودة داخلية</option>
                    <option value="sent">مرسل إلى الاستشاري المشرف</option>
                    <option value="answered">تم استلام رد الاستشاري</option>
                    <option value="closed">مغلق ومكتمل نهائياً</option>
                    <option value="overdue">متأخر عن المهلة التعاقدية</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                <div className="lg:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    موضوع الاستفسار الفني *
                  </label>
                  <input
                    type="text"
                    required
                    value={rfiSubject}
                    onChange={(e) => setRfiSubject(e.target.value)}
                    placeholder="مثال: تعارض مسار خط الدفع 160 مم مع حديد تسليح جدار المسبح..."
                    className="w-full h-9.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    الأثر الزمني المقدر (بالأيام)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={rfiScheduleImpactDays}
                    onChange={(e) => setRfiScheduleImpactDays(Number(e.target.value))}
                    className="w-full h-9.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  />
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاريخ الرد التعاقدي المستهدف
                  </label>
                  <input
                    type="date"
                    value={rfiTargetReplyDate}
                    onChange={(e) => setRfiTargetReplyDate(e.target.value)}
                    className="w-full h-9.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  />
                </div>

                <div className="lg:col-span-2 pt-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300/60 dark:border-amber-700/60 w-full focus-within:ring-2 focus-within:ring-amber-500">
                    <input
                      type="checkbox"
                      checked={rfiHasCostImpact}
                      onChange={(e) => setRfiHasCostImpact(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300">يترتب عليه أثر مالي وتعاقدي</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تفاصيل الاستفسار الفني ومقترح الحل الهندسي للمقاول
                  </label>
                  <textarea
                    rows={3}
                    value={rfiNotes}
                    onChange={(e) => setRfiNotes(e.target.value)}
                    placeholder="اشرح التعارض بالتفصيل مع أرقام اللوحات والمناسيب والحل المقترح من المكتب الفني..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    ملخص رد وتوجيه الاستشاري المشرف (إن وجد)
                  </label>
                  <textarea
                    rows={3}
                    value={rfiResponseSummary}
                    onChange={(e) => setRfiResponseSummary(e.target.value)}
                    placeholder="يُدون هنا قرار الاستشاري المشرف فور وروده لإغلاق الاستفسار..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewRfiForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={savingRfi}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:opacity-50 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{savingRfi ? 'جاري الحفظ...' : 'حفظ وإصدار طلب الاستفسار رسمياً'}</span>
                </button>
              </div>
            </form>
          )}

          {/* RFI Register Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                  سجل طلبات الاستفسار الفني الرسمي للمشروع ({rfiList.length} استفسار)
                </h4>
              </div>
              {loadingRfis && <span className="text-xs text-slate-400 dark:text-slate-500">جاري التحميل...</span>}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <th className="px-4 py-3 text-start whitespace-nowrap">رقم الاستفسار</th>
                    <th className="px-4 py-3 text-start min-w-[220px]">الموضوع والتخصص</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">المخرج المرتبط</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">الأثر المالي والزمني</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">حالة الاستفسار</th>
                    <th className="px-4 py-3 text-start min-w-[180px]">رد وتوجيه الاستشاري</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">النموذج الرسمي المعتمد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rfiList.map((rfi) => {
                    const linkedRow = normalizedRows.find((r) => r.id === rfi.related_deliverable_item_id);
                    return (
                      <tr key={rfi.id || rfi.rfi_no} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 font-mono font-black text-teal-700 dark:text-teal-400 whitespace-nowrap">
                          {rfi.rfi_no}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white">{rfi.subject}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {rfi.discipline || 'الأعمال المدنية والكهروميكانيكية'} • أُرسل: {rfi.sent_date}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {linkedRow ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold">
                              {linkedRow.ref_code}
                            </span>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500">عام للمشروع</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {rfi.has_cost_impact ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300/40 text-[10px] font-bold">
                                <DollarSign className="w-3 h-3" />
                                أثر مالي
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">بلا أثر مالي</span>
                            )}
                            {(rfi.schedule_impact_days ?? 0) > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300/40 text-[10px] font-bold">
                                <CalendarClock className="w-3 h-3" />+{rfi.schedule_impact_days} يوم
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <select
                            value={rfi.status}
                            onChange={(e) =>
                              handleUpdateRfiStatus(rfi, e.target.value as RfiRegisterItem['status'])
                            }
                            className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                          >
                            <option value="draft">مسودة داخلية</option>
                            <option value="sent">مرسل للاستشاري</option>
                            <option value="answered">تم الرد</option>
                            <option value="closed">مغلق ومكتمل</option>
                            <option value="overdue">متجاوز للمهلة</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                            {rfi.reply_summary || rfi.response_summary || (
                              <span className="text-slate-400 dark:text-slate-500 italic">بانتظار التوجيه الرسمي من الاستشاري...</span>
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setPrintableRfi(rfi)}
                            className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/60 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 border border-teal-400/30 text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>طباعة النموذج الرسمي المعتمد</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-TAB 2: طلبات الفحص والاستلام الميداني
         ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'wir_mir' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Governance Rule Banner */}
          <div className="p-4 rounded-2xl bg-purple-50/90 dark:bg-purple-950/90 text-slate-900 dark:text-white border border-purple-200 dark:border-purple-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-black">
                  قاعدة الحوكمة الهندسية الصارمة لإصدار طلبات الفحص والاستلام الميداني
                </h3>
              </div>
              <p className="text-xs text-purple-900 dark:text-purple-100">
                يُحظر نظامياً إصدار طلب فحص ميداني قبل اعتماد المخطط التنفيذي أو اعتماد المواد بموجب كود الاعتماد المعتمد (كود أ أو كود ب). تتحول المخططات المعتمدة تلقائياً إلى طلبات فحص أعمال تنفيذية بالموقع، وتتحول اعتمادات التوريد إلى طلبات فحص واستلام المواد الموردة.
              </p>
            </div>
          </div>

          {/* Deliverables WIR / MIR Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <th className="px-4 py-3 text-start whitespace-nowrap">كود المخرج واللوحة</th>
                    <th className="px-4 py-3 text-start min-w-[230px]">بيان المخرج الهندسي</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">نوع طلب الفحص الميداني</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">كود اعتماد الاستشاري</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">بوابة الصلاحية وإصدار محضر الفحص</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">حالة الفحص الميداني</th>
                    <th className="px-4 py-3 text-center whitespace-nowrap">نموذج الاستلام الرسمي</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDeliverableRows.map((row) => {
                    const isAllowed = row.approval_status === 'Code_A' || row.approval_status === 'Code_B';
                    const wir = wirRegistry[row.id];
                    const codeMeta = APPROVAL_CODE_BADGE[row.approval_status];
                    const isMaterial = row.deliverable_type === 'Material_Submittal';

                    return (
                      <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-mono font-black text-slate-900 dark:text-white">{row.ref_code}</div>
                          <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {row.sheet_number} • إصدار {row.current_rev}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 dark:text-white">{row.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{row.discipline}</p>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {isMaterial ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300/40 font-bold text-[11px]">
                              <Box className="w-3.5 h-3.5" />
                              <span>طلب فحص وتوريد مواد</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border border-sky-300/40 font-bold text-[11px]">
                              <Layers className="w-3.5 h-3.5" />
                              <span>طلب استلام أعمال تنفيذية</span>
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${codeMeta.className}`}
                          >
                            <span>{codeMeta.label}</span>
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          {!isAllowed ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300/50 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                              <Lock className="w-3.5 h-3.5 shrink-0" />
                              <span>محظور إصدار طلب الفحص قبل اعتماد المخطط أو الخامة بكود أ أو ب</span>
                            </div>
                          ) : wir ? (
                            <div className="inline-flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-400/40 text-emerald-700 dark:text-emerald-300 font-mono font-black text-xs">
                                {wir.wirNo}
                              </span>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">صادر بتاريخ {wir.inspectionDate}</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleIssueOrUpdateWir(row, 'submitted')}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 transition-all"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>
                                إصدار محضر استلام {isMaterial ? 'توريد مواد' : 'أعمال تنفيذية'} للموقع
                              </span>
                            </button>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {isAllowed ? (
                            <select
                              value={wir?.status || 'pending'}
                              onChange={(e) =>
                                handleIssueOrUpdateWir(row, e.target.value as WirInspectionStatus)
                              }
                              className="h-8 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                            >
                              <option value="pending">قيد التجهيز</option>
                              <option value="submitted">مرسل للاستشاري</option>
                              <option value="approved">معتمد ميدانياً</option>
                              <option value="rejected">مرفوض ميدانياً</option>
                            </select>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-[11px]">مغلق لحين الاعتماد</span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            disabled={!isAllowed}
                            onClick={() => {
                              const activeWir: WirRecord = wir || {
                                deliverableItemId: row.id,
                                wirNo: isMaterial ? 'MIR-PL-001' : 'WIR-PL-001',
                                requestType: isMaterial ? 'MIR' : 'WIR',
                                status: 'pending',
                                inspectionDate: new Date().toISOString().slice(0, 10),
                                locationZone: 'موقع المشروع — منطقة الأعمال المائية',
                                inspectorNotes: 'فحص ومطابقة الأعمال وفق المخططات المعتمدة.',
                                updatedAt: new Date().toISOString(),
                              };
                              setPrintableWirRow({ deliverable: row, wir: activeWir });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 dark:hover:bg-purple-900 text-purple-700 dark:text-purple-300 border border-purple-400/30 text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>طباعة محضر الاستلام الميداني</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-TAB 3: بوابة صرف المستخلصات المالية
         ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'ipc_gate' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Golden Rule Executive Banner */}
          <div className="p-5 rounded-3xl bg-emerald-50/90 dark:bg-gradient-to-l dark:from-emerald-950 dark:via-slate-900 dark:to-slate-900 text-slate-900 dark:text-white border border-emerald-200 dark:border-emerald-700/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm dark:shadow-lg">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>القاعدة الإلزامية لحوكمة التدقيق المالي وصرف المستخلصات الجارية</span>
              </div>
              <h3 className="text-base sm:text-lg font-black">
                لا يتم إدراج أو اعتماد صرف أي بند في المستخلص الجاري إلا بعد استيفاء شرطين متلازمين:
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                (1) اعتماد المخطط التنفيذي أو عينة المواد من الاستشاري المشرف بموجب <span className="font-bold text-emerald-700 dark:text-emerald-300">كود الاعتماد أ أو ب</span> + (2) اعتماد <span className="font-bold text-emerald-700 dark:text-emerald-300">محضر الفحص والاستلام الميداني بالموقع بصفة نهائية</span> ومطابقة الجودة.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowIpcClearancePrintModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-2 shrink-0 shadow-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
            >
              <Printer className="w-4 h-4" />
              <span>تقرير مطابقة المكتب الفني لصرف المستخلص الجاري</span>
            </button>
          </div>

          {/* 4 Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div
              tabIndex={0}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-sm space-y-1.5 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <span>بنود مستوفية لشروط الصرف</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-mono font-black text-emerald-600 dark:text-emerald-400">
                {ipcSummary.clearedCount}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">مستوفية لاعتماد المخططات ومحاضر الفحص الميداني</p>
            </div>

            {/* Card 2 */}
            <div
              tabIndex={0}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-sm space-y-1.5 hover:shadow-md hover:border-rose-300 dark:hover:border-rose-800 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
            >
              <div className="flex items-center justify-between text-xs font-bold text-rose-700 dark:text-rose-400">
                <span>بنود محجوبة نظامياً عن الصرف</span>
                <XCircle className="w-4 h-4" />
              </div>
              <p className="text-2xl font-mono font-black text-rose-600 dark:text-rose-400">
                {ipcSummary.blockedCount}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">موقوفة تلقائياً لعدم اكتمال مسوغات الاعتماد</p>
            </div>

            {/* Card 3 */}
            <div
              tabIndex={0}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-sm space-y-1.5 hover:shadow-md hover:border-amber-300 dark:hover:border-amber-800 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <div className="flex items-center justify-between text-xs font-bold text-amber-700 dark:text-amber-400">
                <span>معتمدة هندسياً بانتظار استلام الموقع</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-2xl font-mono font-black text-amber-600 dark:text-amber-400">
                {ipcSummary.wirPendingCount}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">معتمدة مكتبياً وتتطلب إغلاق محضر الفحص الميداني</p>
            </div>

            {/* Card 4 */}
            <div
              tabIndex={0}
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-900/60 shadow-sm space-y-1.5 hover:shadow-md hover:border-teal-300 dark:hover:border-teal-800 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
            >
              <div className="flex items-center justify-between text-xs font-bold text-teal-700 dark:text-teal-400">
                <span>نسبة الجاهزية المالية للمستخلص</span>
                <FileCheck2 className="w-4 h-4" />
              </div>
              <p className="text-2xl font-mono font-black text-teal-600 dark:text-teal-400">
                {ipcSummary.readinessPct}%
              </p>
              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-teal-500 transition-all"
                  style={{ width: `${ipcSummary.readinessPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3-Gate Detailed Audit Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" />
                <span>مصفوفة التدقيق الهندسي الثلاثي لصرف المستخلصات الجارية</span>
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                    <th className="px-4 py-3 text-start whitespace-nowrap">المرجع الهندسي</th>
                    <th className="px-4 py-3 text-start min-w-[220px]">بيان البند والمخرج الهندسي</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">البوابة الأولى: اعتماد المخططات والمواد</th>
                    <th className="px-4 py-3 text-start whitespace-nowrap">البوابة الثانية: محضر الاستلام الميداني</th>
                    <th className="px-4 py-3 text-start min-w-[250px]">البوابة الثالثة: القرار المالي للمستخلص الجاري</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ipcAuditRows.map(({ row, wir, isConsultantApproved, isWirApproved, isClearedForIpc, blockReason }) => (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                        {row.ref_code}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white">{row.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{row.discipline}</p>
                      </td>

                      {/* Gate 1 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isConsultantApproved ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>محقق ({APPROVAL_CODE_BADGE[row.approval_status].short})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-400/40 font-bold text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>غير محقق ({APPROVAL_CODE_BADGE[row.approval_status].short})</span>
                          </span>
                        )}
                      </td>

                      {/* Gate 2 */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isWirApproved && wir ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-400/40 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>معتمد ميدانياً ({wir.wirNo})</span>
                          </span>
                        ) : wir ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-400/40 font-bold text-[11px]">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {wir.wirNo}: {WIR_STATUS_META[wir.status].label}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            <span>لم يصدر محضر استلام ميداني</span>
                          </span>
                        )}
                      </td>

                      {/* Gate 3 */}
                      <td className="px-4 py-3">
                        {isClearedForIpc ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-500/40 font-black text-xs">
                            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                            <span>معتمد ومصرح بالصرف في المستخلص الجاري</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-200 border border-rose-400/40 font-black text-[11px]">
                              <Lock className="w-3.5 h-3.5" />
                              <span>محجوب نظامياً عن الصرف في المستخلص</span>
                            </div>
                            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">{blockReason}</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 1: طباعة نموذج طلب استفسار فني رسمي
         ══════════════════════════════════════════════════════════════════════ */}
      {printableRfi && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          dir="rtl"
        >
          <div
            tabIndex={-1}
            className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-300 dark:border-slate-800 p-6 sm:p-8 space-y-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            {/* Modal Toolbar */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">معاينة وطباعة نموذج طلب استفسار فني رسمي</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printOfficialA4(
                      'a4-sheet-rfi',
                      `نموذج استفسار فني رسمي - ${printableRfi.rfi_no}`
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة النموذج الرسمي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintableRfi(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official A4 Sheet Body */}
            <div id="a4-sheet-rfi" className="a4-printable-sheet border-2 border-slate-900 dark:border-slate-700 p-6 space-y-5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
              <div className="flex items-start justify-between border-b-2 border-slate-900 dark:border-slate-700 pb-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">شركة بيزون للمشاريع والمنشآت المائية — إدارة المكتب الفني</p>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    نموذج طلب استفسار وتوضيح فني رسمي
                  </h2>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">المشروع: {displayProjectName}</p>
                </div>
                <div className="text-end font-mono text-xs space-y-1 border border-slate-400 dark:border-slate-700 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div>
                    <span className="font-bold">رقم الوثيقة: </span>
                    <span className="font-black text-teal-800 dark:text-teal-400">{printableRfi.rfi_no}</span>
                  </div>
                  <div>
                    <span className="font-bold">تاريخ الإصدار: </span>
                    <span>{printableRfi.sent_date}</span>
                  </div>
                  <div>
                    <span className="font-bold">المهلة التعاقدية: </span>
                    <span>{printableRfi.target_reply_date || '7 أيام'}</span>
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900 p-3 border border-slate-300 dark:border-slate-700">
                <div>
                  <span className="font-bold text-slate-600 dark:text-slate-400">موضوع الاستفسار: </span>
                  <span className="font-black">{printableRfi.subject}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 dark:text-slate-400">التخصص الهندسي: </span>
                  <span className="font-bold">{printableRfi.discipline || 'الأعمال المدنية والكهروميكانيكية'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 dark:text-slate-400">الأثر المالي المتوقع: </span>
                  <span className="font-bold">{printableRfi.has_cost_impact ? 'نعم — يترتب عليه أثر مالي' : 'لا يوجد أثر مالي'}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 dark:text-slate-400">الأثر الزمني المتوقع: </span>
                  <span className="font-bold">{printableRfi.schedule_impact_days || 0} يوم عمل</span>
                </div>
              </div>

              {/* Question Box */}
              <div className="border border-slate-800 dark:border-slate-700">
                <div className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold">
                  1. بيان الاستفسار الفني والتعارض ومقترح المقاول الهندسي
                </div>
                <div className="p-4 text-xs leading-relaxed min-h-[100px] whitespace-pre-wrap">
                  {printableRfi.notes || printableRfi.subject}
                </div>
              </div>

              {/* Consultant Response Box */}
              <div className="border border-slate-800 dark:border-slate-700">
                <div className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold">
                  2. قرار وتوجيه الاستشاري المشرف الرسمي
                </div>
                <div className="p-4 text-xs leading-relaxed min-h-[100px] whitespace-pre-wrap">
                  {printableRfi.reply_summary ||
                    printableRfi.response_summary ||
                    '................................................................................................................................................'}
                </div>
              </div>

              {/* Signature Blocks */}
              <div className="grid grid-cols-3 gap-4 pt-4 text-xs">
                <div className="border border-slate-400 dark:border-slate-700 p-3 space-y-6">
                  <p className="font-black text-slate-800 dark:text-slate-200">إعداد: مهندس المكتب الفني</p>
                  <p className="text-slate-500 dark:text-slate-400">التوقيع والتاريخ: ....................</p>
                </div>
                <div className="border border-slate-400 dark:border-slate-700 p-3 space-y-6">
                  <p className="font-black text-slate-800 dark:text-slate-200">اعتماد: مدير المكتب الفني / المشروع</p>
                  <p className="text-slate-500 dark:text-slate-400">التوقيع والتاريخ: ....................</p>
                </div>
                <div className="border border-slate-400 dark:border-slate-700 p-3 space-y-6">
                  <p className="font-black text-slate-800 dark:text-slate-200">قرار وختم: الاستشاري المشرف</p>
                  <p className="text-slate-500 dark:text-slate-400">التوقيع والتاريخ: ....................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 2: طباعة محضر فحص واستلام ميداني رسمي
         ══════════════════════════════════════════════════════════════════════ */}
      {printableWirRow && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          dir="rtl"
        >
          <div
            tabIndex={-1}
            className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-300 dark:border-slate-800 p-6 sm:p-8 space-y-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">معاينة وطباعة محضر الاستلام الميداني الرسمي</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printOfficialA4(
                      'a4-sheet-wir',
                      `محضر استلام ميداني - ${printableWirRow.wir.wirNo}`
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة المحضر الرسمي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintableWirRow(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div id="a4-sheet-wir" className="a4-printable-sheet border-2 border-slate-900 dark:border-slate-700 p-6 space-y-5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
              <div className="flex items-start justify-between border-b-2 border-slate-900 dark:border-slate-700 pb-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">شركة بيزون للمشاريع والمنشآت المائية — إدارة التنفيذ والجودة</p>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {printableWirRow.wir.requestType === 'MIR'
                      ? 'نموذج طلب فحص واستلام مواد موردة للموقع'
                      : 'نموذج طلب فحص واستلام أعمال تنفيذية بالموقع'}
                  </h2>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">المشروع: {displayProjectName}</p>
                </div>
                <div className="text-end font-mono text-xs space-y-1 border border-slate-400 dark:border-slate-700 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div>
                    <span className="font-bold">رقم الطلب: </span>
                    <span className="font-black text-purple-800 dark:text-purple-400">{printableWirRow.wir.wirNo}</span>
                  </div>
                  <div>
                    <span className="font-bold">تاريخ الفحص: </span>
                    <span>{printableWirRow.wir.inspectionDate}</span>
                  </div>
                  <div>
                    <span className="font-bold">مرجع الاعتماد: </span>
                    <span>
                      {printableWirRow.deliverable.ref_code} ({APPROVAL_CODE_BADGE[printableWirRow.deliverable.approval_status].short})
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900 p-3 border border-slate-300 dark:border-slate-700">
                <div>
                  <span className="font-bold text-slate-600 dark:text-slate-400">بيان العمل / الخامة: </span>
                  <span className="font-black">{printableWirRow.deliverable.title}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 dark:text-slate-400">المنطقة / المحور: </span>
                  <span className="font-bold">{printableWirRow.wir.locationZone}</span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 dark:text-slate-400">رقم اللوحة المعتمدة: </span>
                  <span className="font-mono font-bold">
                    {printableWirRow.deliverable.sheet_number} (إصدار {printableWirRow.deliverable.current_rev})
                  </span>
                </div>
                <div>
                  <span className="font-bold text-slate-600 dark:text-slate-400">حالة الفحص الميداني: </span>
                  <span className="font-black">{WIR_STATUS_META[printableWirRow.wir.status].label}</span>
                </div>
              </div>

              <div className="border border-slate-800 dark:border-slate-700">
                <div className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold">
                  1. تفاصيل الفحص الميداني ومطابقة الجودة الفنية
                </div>
                <div className="p-4 text-xs leading-relaxed min-h-[90px]">
                  {printableWirRow.wir.inspectorNotes}
                </div>
              </div>

              <div className="border border-slate-800 dark:border-slate-700">
                <div className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold">
                  2. قرار الاستشاري المشرف بعد المعاينة الميدانية
                </div>
                <div className="p-4 text-xs grid grid-cols-3 gap-3">
                  <div className="p-2 border border-slate-300 dark:border-slate-700 font-bold">
                    {printableWirRow.wir.status === 'approved' ? '☑' : '☐'} معتمد ومصرح بالصب / التركيب / الصرف المالي
                  </div>
                  <div className="p-2 border border-slate-300 dark:border-slate-700 font-bold">
                    ☐ معتمد مع استدراك ملاحظات طفيفة
                  </div>
                  <div className="p-2 border border-slate-300 dark:border-slate-700 font-bold">
                    {printableWirRow.wir.status === 'rejected' ? '☑' : '☐'} مرفوض ويعاد التقديم بعد تصحيح الملاحظات
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 text-xs">
                <div className="border border-slate-400 dark:border-slate-700 p-3 space-y-6">
                  <p className="font-black text-slate-800 dark:text-slate-200">مهندس التنفيذ والموقع</p>
                  <p className="text-slate-500 dark:text-slate-400">التوقيع: ....................</p>
                </div>
                <div className="border border-slate-400 dark:border-slate-700 p-3 space-y-6">
                  <p className="font-black text-slate-800 dark:text-slate-200">مهندس ضبط الجودة والمكتب الفني</p>
                  <p className="text-slate-500 dark:text-slate-400">التوقيع: ....................</p>
                </div>
                <div className="border border-slate-400 dark:border-slate-700 p-3 space-y-6">
                  <p className="font-black text-slate-800 dark:text-slate-200">مهندس الاستشاري المشرف</p>
                  <p className="text-slate-500 dark:text-slate-400">التوقيع: ....................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 3: تقرير مطابقة المكتب الفني لصرف المستخلص الجاري
         ══════════════════════════════════════════════════════════════════════ */}
      {showIpcClearancePrintModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm"
          dir="rtl"
        >
          <div
            tabIndex={-1}
            className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl border border-slate-300 dark:border-slate-800 p-6 sm:p-8 space-y-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  تقرير مطابقة المكتب الفني لصرف المستخلص الجاري
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    printOfficialA4(
                      'a4-sheet-ipc',
                      `تقرير مطابقة المستخلص الجاري - ${displayProjectName}`
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة شهادة المطابقة المالية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowIpcClearancePrintModal(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div id="a4-sheet-ipc" className="a4-printable-sheet border-2 border-slate-900 dark:border-slate-700 p-6 space-y-5 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
              <div className="flex items-start justify-between border-b-2 border-slate-900 dark:border-slate-700 pb-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">شركة بيزون للمشاريع والمنشآت المائية — إدارة المكتب الفني</p>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    تقرير مطابقة المكتب الفني لصرف المستخلص الجاري
                  </h2>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">المشروع: {displayProjectName}</p>
                </div>
                <div className="text-end font-mono text-xs space-y-1 border border-slate-400 dark:border-slate-700 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900">
                  <div>
                    <span className="font-bold">تاريخ المطابقة: </span>
                    <span>{new Date().toISOString().slice(0, 10)}</span>
                  </div>
                  <div>
                    <span className="font-bold">بنود مؤهلة للصرف: </span>
                    <span className="font-black text-emerald-700 dark:text-emerald-400">
                      {ipcSummary.clearedCount} من {ipcSummary.total} ({ipcSummary.readinessPct}%)
                    </span>
                  </div>
                </div>
              </div>

              <table className="w-full text-xs border border-slate-400 dark:border-slate-700">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-400 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200">
                    <th className="p-2 text-start border-e border-slate-300 dark:border-slate-700">الكود المرجعي</th>
                    <th className="p-2 text-start border-e border-slate-300 dark:border-slate-700">بيان البند الهندسي</th>
                    <th className="p-2 text-start border-e border-slate-300 dark:border-slate-700">اعتماد المخططات والمواد</th>
                    <th className="p-2 text-start border-e border-slate-300 dark:border-slate-700">محضر الاستلام الميداني</th>
                    <th className="p-2 text-start">أهلية الصرف بالمستخلص الجاري</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300 dark:divide-slate-700">
                  {ipcAuditRows.map(({ row, wir, isConsultantApproved, isWirApproved, isClearedForIpc }) => (
                    <tr key={row.id}>
                      <td className="p-2 font-mono font-bold border-e border-slate-300 dark:border-slate-700">{row.ref_code}</td>
                      <td className="p-2 font-semibold border-e border-slate-300 dark:border-slate-700">{row.title}</td>
                      <td className="p-2 border-e border-slate-300 dark:border-slate-700">
                        {isConsultantApproved ? `✓ معتمد (${APPROVAL_CODE_BADGE[row.approval_status].short})` : `✗ غير معتمد (${APPROVAL_CODE_BADGE[row.approval_status].short})`}
                      </td>
                      <td className="p-2 border-e border-slate-300 dark:border-slate-700">
                        {isWirApproved && wir ? `✓ معتمد (${wir.wirNo})` : '✗ غير مكتمل'}
                      </td>
                      <td className="p-2 font-bold">
                        {isClearedForIpc ? '✓ مصرح بالصرف المالي' : '✗ محجوب عن الصرف'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="grid grid-cols-4 gap-3 pt-4 text-xs">
                <div className="border border-slate-400 dark:border-slate-700 p-3 space-y-5">
                  <p className="font-black text-slate-800 dark:text-slate-200">مدير المكتب الفني</p>
                  <p className="text-slate-500 dark:text-slate-400">التوقيع: ................</p>
                </div>
                <div className="border border-slate-400 dark:border-slate-700 p-3 space-y-5">
                  <p className="font-black text-slate-800 dark:text-slate-200">مهندس الحصر والمستخلصات</p>
                  <p className="text-slate-500 dark:text-slate-400">التوقيع: ................</p>
                </div>
                <div className="border border-slate-400 dark:border-slate-700 p-3 space-y-5">
                  <p className="font-black text-slate-800 dark:text-slate-200">مدير المشروع</p>
                  <p className="text-slate-500 dark:text-slate-400">التوقيع: ................</p>
                </div>
                <div className="border border-slate-400 dark:border-slate-700 p-3 space-y-5">
                  <p className="font-black text-slate-800 dark:text-slate-200">اعتماد الاستشاري المشرف</p>
                  <p className="text-slate-500 dark:text-slate-400">التوقيع: ................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TOFieldPaperworkHub;
