'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Send,
  FileCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Printer,
  Copy,
  Plus,
  RefreshCw,
  Building2,
  Layers,
  ArrowRight,
  ShieldAlert,
  RotateCw,
  Check,
  X,
  FileText,
  Calendar,
  Archive,
  UserCheck,
} from 'lucide-react';
import { Deliverable, DeliverableItem } from '@/types/planning';
import { Project } from '@/types';
import { TODisciplineBadge, detectDeliverableDiscipline } from './TODisciplineBadge';
import { TOConsultantStatusBadge } from './TOConsultantStatusBadge';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { TOProgressService } from '@/lib/services/toProgress.service';
import { ProjectService } from '@/lib/services/project.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { printOfficialA4 } from '@/lib/utils/printOfficialA4';
import { toast } from 'sonner';

export interface TransmittalRecord {
  id: string;
  transmittalNumber: string;
  projectId: string;
  projectName: string;
  consultantName: string;
  submissionDate: string; // YYYY-MM-DD
  structureType: string;
  status: 'pending_consultant' | 'consultant_responded' | 'sla_breached';
  daysWithConsultant: number;
  items: DeliverableItem[];
}

export interface TOTransmittalGovernanceHubProps {
  deliverables: Deliverable[];
  projects: Project[];
  onRefresh?: () => void;
  selectedProjectId?: string;
  className?: string;
}

export function computeNextTransmittalCode(
  deliverables: Array<{
    transmittal_code?: string | null;
    transmittal_number?: string | null;
    items?: Array<{
      transmittal_code?: string | null;
      transmittal_number?: string | null;
      rev_history?: Array<{ transmittal_code?: string | null; transmittal_number?: string | null }>;
    }>;
  }> = [],
  prefix = 'TR-PL-'
): string {
  let maxNum = 0;

  const inspectCode = (rawCode?: string | null) => {
    if (!rawCode || typeof rawCode !== 'string') return;
    const code = rawCode.trim();
    if (!code) return;

    if (code.startsWith(prefix)) {
      const afterPrefix = code.slice(prefix.length);
      const prefixMatch = afterPrefix.match(/^(\d+)/);
      if (prefixMatch) {
        const parsed = parseInt(prefixMatch[1], 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
        return;
      }
    }

    const genericMatch = code.match(/TR-[A-Z0-9-]+-(\d+)/i);
    if (genericMatch) {
      const parsed = parseInt(genericMatch[1], 10);
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed;
      }
    }
  };

  for (const d of deliverables || []) {
    if (!d) continue;
    inspectCode(d.transmittal_code);
    inspectCode(d.transmittal_number);
    if (Array.isArray(d.items)) {
      for (const item of d.items) {
        if (!item) continue;
        inspectCode(item.transmittal_code);
        inspectCode(item.transmittal_number);
        if (Array.isArray(item.rev_history)) {
          for (const rev of item.rev_history) {
            inspectCode(rev?.transmittal_code);
            inspectCode(rev?.transmittal_number);
          }
        }
      }
    }
  }

  return `${prefix}${String(maxNum + 1).padStart(3, '0')}`;
}

export interface TransmittalBatchValidationInput {
  items?: Array<{
    id?: string;
    sheet_number?: string;
    description?: string;
    status?: string;
    to_manager_approved?: boolean;
    progress_pct?: number;
    blocked_reason?: string;
    transmittal_code?: string | null;
    transmittal_number?: string | null;
  }>;
  transmittalCode?: string;
  consultantName?: string;
}

export interface TransmittalBatchValidationResult {
  valid: boolean;
  isValid: boolean;
  errors: string[];
}

export function validateTransmittalBatch(
  inputOrItems:
    | TransmittalBatchValidationInput
    | Array<{
        id?: string;
        sheet_number?: string;
        description?: string;
        status?: string;
        to_manager_approved?: boolean;
        progress_pct?: number;
        blocked_reason?: string;
        transmittal_code?: string | null;
        transmittal_number?: string | null;
      }>,
  transmittalCodeArg?: string,
  consultantNameArg?: string
): TransmittalBatchValidationResult {
  const isArrayInput = Array.isArray(inputOrItems);
  const items = isArrayInput ? inputOrItems : inputOrItems?.items || [];
  const transmittalCode = isArrayInput ? transmittalCodeArg : inputOrItems?.transmittalCode;
  const consultantName = isArrayInput ? consultantNameArg : inputOrItems?.consultantName;

  const errors: string[] = [];

  if (!items || items.length === 0) {
    errors.push('يجب اختيار مخرج واحد على الأقل لإصدار حافظة التسليم');
  }

  if (transmittalCode !== undefined && !transmittalCode.trim()) {
    errors.push('رقم حافظة التسليم مطلوب');
  }

  if (consultantName !== undefined && !consultantName.trim()) {
    errors.push('اسم الجهة الاستشارية المستلمة مطلوب');
  }

  for (const item of items || []) {
    if (item.status === 'blocked' || Boolean(item.blocked_reason)) {
      errors.push(`المخرج (${item.sheet_number || item.description || item.id || 'غير محدد'}) معطل ولا يمكن إرساله`);
    } else if (item.status === 'returned') {
      errors.push(`المخرج (${item.sheet_number || item.description || item.id || 'غير محدد'}) تم إرساله مسبقاً`);
    } else if (
      item.to_manager_approved === false &&
      item.status !== 'ready_to_return' &&
      item.progress_pct !== 100
    ) {
      errors.push(`المخرج (${item.sheet_number || item.description || item.id || 'غير محدد'}) غير معتمد داخلياً بعد`);
    }
  }

  const valid = errors.length === 0;
  return { valid, isValid: valid, errors };
}

export function calculateDaysElapsed(dateStr: string): number {
  if (!dateStr) return 0;
  const target = new Date(dateStr).getTime();
  if (isNaN(target)) return 0;
  const diffMs = Date.now() - target;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function generateFidicNoticeText(params: {
  transmittalNumber: string;
  projectName: string;
  consultantName: string;
  submissionDate: string;
  daysElapsed: number;
  drawingNumbers: string[];
}): string {
  return `السيد المهندس / استشاري المشروع (${params.consultantName}) المحترم،
مشروع: ${params.projectName}
الموضوع: إشعار رسمي بتأخر اعتماد المخططات التنفيذية طبقاً للبند (1.9 و 20.1) من شروط عقد فيديك (FIDIC)
المرجع: خطاب الإرسال رقم (${params.transmittalNumber}) المؤرخ في ${params.submissionDate}

تحية طيبة وبعد،،،
بالإشارة إلى خطاب الإرسال الرسمي المذكور أعلاه، والمتضمن تقديم المخططات التنفيذية للمسطحات المائية (حمامات سباحة / بحيرات صناعية) الآتية:
${params.drawingNumbers.map((d, i) => `  ${i + 1}. اللوحة رقم: ${d}`).join('\n')}

وحيث أنه قد انقضت مهلة المراجعة التعاقدية المحددة بـ (14 يوماً) ولم نتلقَ إفادتكم أو اعتمادكم حتى تاريخه (مضى ${params.daysElapsed} يوماً على التقديم)،
وحيث أن هذه المخططات تقع على المسار الحرج وتتعلق بأعمال الصب الخرساني ومخترقات الجلب المائية (Puddle Flanges / Sleeves) التي لا يمكن صب الخرسانة قبل اعتمادها،

فإننا نحيط سيادتكم علماً بأن هذا التأخير يترتب عليه تعطيل في الجدول الزمني للأعمال الميدانية بالموقع، وبناءً عليه نحتفظ بحقنا الكامل كجهة منفذة في طلب تمديد زمني (Extension of Time - EOT) والتعويض عن أية تكاليف إضافية مباشرة أو غير مباشرة ناتجة عن هذا التأخير طبقاً لأحكام العقد.

وتفضلوا بقبول فائق الاحترام والتقدير،،،
مدير المكتب الفني - شركة بي زون للإنشاءات المائية (P-Zone Aquatic Engineering)`;
}

function formatConsultantContactLabel(contact: any): string {
  if (!contact) return '';
  const company = (contact.company_name || '').trim();
  const person = (contact.full_name || contact.position || contact.name || '').trim();
  return `${company ? company + (person ? ' - ' : '') : ''}${person}`.trim();
}

export const TOTransmittalGovernanceHub: React.FC<TOTransmittalGovernanceHubProps> = ({
  deliverables,
  projects,
  onRefresh,
  selectedProjectId = 'all',
  className = '',
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [activeSubTab, setActiveSubTab] = useState<'transmittals' | 'sla_claims' | 'revisions'>('transmittals');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isBatchingModalOpen, setIsBatchingModalOpen] = useState(false);
  const [transmittalCode, setTransmittalCode] = useState(() =>
    computeNextTransmittalCode(deliverables as any)
  );
  const [consultantName, setConsultantName] = useState('استشاري المشروع العام');
  const [consultantContacts, setConsultantContacts] = useState<any[]>([]);
  const [isConsultantAutoLoaded, setIsConsultantAutoLoaded] = useState(false);
  const [structureType, setStructureType] = useState('حمامات سباحة وبحيرات مائية');
  const [selectedClaimNotice, setSelectedClaimNotice] = useState<string | null>(null);
  const [isProcessingRevUp, setIsProcessingRevUp] = useState<string | null>(null);
  const [activePrintType, setActivePrintType] = useState<'transmittal' | 'fidic' | null>(null);
  const [isIssuingTransmittal, setIsIssuingTransmittal] = useState(false);
  const [reprintTransmittal, setReprintTransmittal] = useState<{
    code: string;
    items: DeliverableItem[];
  } | null>(null);

  useEffect(() => {
    const scopedDeliverables =
      selectedProjectId && selectedProjectId !== 'all'
        ? deliverables.filter((d) => d.project_id === selectedProjectId)
        : deliverables;
    setTransmittalCode(computeNextTransmittalCode(scopedDeliverables as any));
  }, [deliverables, selectedProjectId]);

  useEffect(() => {
    if (!selectedProjectId || selectedProjectId === 'all') {
      setConsultantContacts([]);
      setIsConsultantAutoLoaded(false);
      return;
    }

    let cancelled = false;
    ProjectService.getProjectClientContacts(selectedProjectId)
      .then((contacts) => {
        if (cancelled || !Array.isArray(contacts) || contacts.length === 0) return;
        const consultantsOnly = contacts.filter((c: any) => c?.party_type === 'consultant');
        const listToUse = consultantsOnly.length > 0 ? consultantsOnly : contacts;
        setConsultantContacts(listToUse);

        const primaryContact =
          consultantsOnly.find((c: any) => c?.is_primary) ||
          consultantsOnly[0] ||
          contacts.find((c: any) => c?.is_primary) ||
          contacts[0];

        const label = formatConsultantContactLabel(primaryContact);
        if (label) {
          setConsultantName(label);
          setIsConsultantAutoLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConsultantContacts([]);
          setIsConsultantAutoLoaded(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

  useEffect(() => {
    const handleAfterPrint = () => setActivePrintType(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  // Extract all internally approved items that are ready to be batched into transmittals
  const approvedItemsReadyForTransmittal = useMemo(() => {
    const list: (DeliverableItem & { parentPackage?: Deliverable; projectName: string })[] = [];
    deliverables.forEach((d) => {
      if (selectedProjectId !== 'all' && d.project_id !== selectedProjectId) return;
      (d.items || []).forEach((item) => {
        // Items that are manager approved or marked ready, and not yet submitted
        if (
          (item.to_manager_approved || item.status === 'ready_to_return' || item.progress_pct === 100) &&
          item.status !== 'returned'
        ) {
          const proj = projects.find((p) => p.id === d.project_id);
          list.push({
            ...item,
            parentPackage: d,
            projectName: proj?.project_name || proj?.project_name_ar || 'مشروع مائي',
          });
        }
      });
    });
    return list;
  }, [deliverables, selectedProjectId, projects]);

  // Extract items pending consultant review or breaching 14-day SLA
  const consultantReviewItems = useMemo(() => {
    const list: (DeliverableItem & { parentPackage?: Deliverable; projectName: string; daysPending: number; isSlaBreached: boolean })[] = [];
    deliverables.forEach((d) => {
      if (selectedProjectId !== 'all' && d.project_id !== selectedProjectId) return;
      (d.items || []).forEach((item) => {
        if (
          (item.to_manager_approved || item.status === 'returned') &&
          (!item.consultant_status || item.consultant_status === 'pending')
        ) {
          const submissionDate =
            item.submission_date ||
            item.rev_history?.slice().reverse().find((r: any) => r.submission_date || r.transmittal_number)?.date ||
            item.completed_at ||
            item.updated_at ||
            d.received_at ||
            new Date().toISOString();
          const daysPending = calculateDaysElapsed(submissionDate);
          const isSlaBreached = daysPending > 14;

          const proj = projects.find((p) => p.id === d.project_id);
          list.push({
            ...item,
            parentPackage: d,
            projectName: proj?.project_name || proj?.project_name_ar || 'مشروع مائي',
            daysPending,
            isSlaBreached,
          });
        }
      });
    });
    return list.sort((a, b) => b.daysPending - a.daysPending);
  }, [deliverables, selectedProjectId, projects]);

  // Extract items with Code C or Code B that require Revision Upgrades (Rev 0 -> Rev 1)
  const codeCItemsNeedingRevision = useMemo(() => {
    const list: (DeliverableItem & { parentPackage?: Deliverable; projectName: string })[] = [];
    deliverables.forEach((d) => {
      if (selectedProjectId !== 'all' && d.project_id !== selectedProjectId) return;
      (d.items || []).forEach((item) => {
        if (item.consultant_status === 'C' || item.consultant_status === 'D' || (item.consultant_status === 'B' && item.status !== 'approved')) {
          const proj = projects.find((p) => p.id === d.project_id);
          list.push({
            ...item,
            parentPackage: d,
            projectName: proj?.project_name || proj?.project_name_ar || 'مشروع مائي',
          });
        }
      });
    });
    return list;
  }, [deliverables, selectedProjectId, projects]);

  // Group deliverables/items having a truthy transmittal_code into the Issued Transmittals Archive
  const issuedTransmittalsArchive = useMemo(() => {
    const groupsMap = new Map<
      string,
      {
        transmittalCode: string;
        items: DeliverableItem[];
        codeA: number;
        codeB: number;
        codeC: number;
        underReview: number;
      }
    >();

    const ensureGroup = (code: string) => {
      const clean = code.trim();
      if (!groupsMap.has(clean)) {
        groupsMap.set(clean, {
          transmittalCode: clean,
          items: [],
          codeA: 0,
          codeB: 0,
          codeC: 0,
          underReview: 0,
        });
      }
      return groupsMap.get(clean)!;
    };

    const addItemToGroup = (code: string, item: DeliverableItem) => {
      const grp = ensureGroup(code);
      if (grp.items.some((existing) => existing.id === item.id)) return;
      grp.items.push(item);
      const cStatus = item.consultant_status;
      if (cStatus === 'A') grp.codeA += 1;
      else if (cStatus === 'B') grp.codeB += 1;
      else if (cStatus === 'C' || cStatus === 'D') grp.codeC += 1;
      else grp.underReview += 1;
    };

    deliverables.forEach((d) => {
      if (selectedProjectId !== 'all' && d.project_id !== selectedProjectId) return;
      const pkgCode = (d as any).transmittal_code || (d as any).transmittal_number || '';

      if (pkgCode && typeof pkgCode === 'string' && pkgCode.trim()) {
        if (Array.isArray(d.items) && d.items.length > 0) {
          d.items.forEach((item) => {
            const itemSpecificCode = (item as any).transmittal_code || item.transmittal_number;
            addItemToGroup(itemSpecificCode || pkgCode, item);
          });
        } else {
          const syntheticItem: DeliverableItem = {
            id: d.id,
            deliverable_id: d.id,
            item_type: (d as any).type === 'Material_Submittal' ? 'material' : 'drawing',
            sheet_number: d.ref_code || d.id,
            description: d.title || (d as any).description || d.ref_code || 'مخرج هندسي',
            status: (d.status as any) || 'returned',
            consultant_status: (d as any).consultant_status || 'pending',
            current_rev: (d as any).current_rev ?? 0,
            submission_revision: (d as any).current_rev ?? 0,
            progress_pct: 100,
          };
          addItemToGroup(pkgCode, syntheticItem);
        }
      } else if (Array.isArray(d.items)) {
        d.items.forEach((item) => {
          const itemCode =
            (item as any).transmittal_code ||
            item.transmittal_number ||
            item.rev_history?.slice().reverse().find((r: any) => r.transmittal_number || r.transmittal_code)
              ?.transmittal_number;
          if (itemCode && typeof itemCode === 'string' && itemCode.trim()) {
            addItemToGroup(itemCode, item);
          }
        });
      }
    });

    return Array.from(groupsMap.values());
  }, [deliverables, selectedProjectId]);

  const modalTransmittalItems = useMemo(() => {
    if (reprintTransmittal) {
      return reprintTransmittal.items;
    }
    return approvedItemsReadyForTransmittal.filter((i) => selectedItemIds.includes(i.id));
  }, [reprintTransmittal, approvedItemsReadyForTransmittal, selectedItemIds]);

  // Toggle item selection
  const handleToggleSelect = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedItemIds.length === approvedItemsReadyForTransmittal.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(approvedItemsReadyForTransmittal.map((i) => i.id));
    }
  };

  // Perform Revision Upgrade: Rev 0 -> Rev 1
  const handleUpgradeRevision = async (item: DeliverableItem) => {
    setIsProcessingRevUp(item.id);
    try {
      const nextRev = (item.current_rev ?? 0) + 1;
      const archivedRev = {
        rev: item.current_rev ?? 0,
        date: new Date().toISOString(),
        by: 'Consultant Review',
        notes: `Code ${item.consultant_status || 'C'}: ${item.blocked_reason || 'Consultant comments to be addressed'}`,
      };

      const updatedHistory = [...(item.rev_history || []), archivedRev];

      await DeliverablesService.saveDeliverableItem({
        id: item.id,
        deliverable_id: item.deliverable_id,
        current_rev: nextRev,
        rev_history: updatedHistory,
        status: 'in_progress',
        to_manager_approved: false,
        consultant_status: 'pending',
        blocked_reason: undefined,
        blocked_since: undefined,
      });

      toast.success(
        isAr
          ? `تم ترقية اللوحة بنجاح إلى الإصدار Rev.${nextRev} وإعادتها للمهندس`
          : `Upgraded to Rev.${nextRev} and reassigned to engineer`
      );
      onRefresh?.();
    } catch {
      toast.error(isAr ? 'فشلت ترقية الإصدار' : 'Failed to upgrade revision');
    } finally {
      setIsProcessingRevUp(null);
    }
  };

  // Issue and print transmittal batch
  const handleIssueTransmittal = async () => {
    if (reprintTransmittal) {
      setActivePrintType('transmittal');
      setIsBatchingModalOpen(false);
      setTimeout(() => {
        printOfficialA4(
          'pzone-transmittal-print-sheet',
          `خطاب إرسال رسمي - ${reprintTransmittal.code || transmittalCode}`
        );
      }, 150);
      return;
    }

    const itemsToUpdate = approvedItemsReadyForTransmittal.filter((i) => selectedItemIds.includes(i.id));
    const validation = validateTransmittalBatch({
      items: itemsToUpdate,
      transmittalCode,
      consultantName,
    });
    if (!validation.valid) {
      toast.error(validation.errors[0] || (isAr ? 'بيانات الحافظة غير مكتملة' : 'Invalid transmittal batch'));
      return;
    }

    setIsIssuingTransmittal(true);
    try {
      const nowIso = new Date().toISOString();

      await Promise.all(
        itemsToUpdate.map((item) => {
          const archivedRev = {
            rev: item.current_rev ?? 0,
            date: nowIso,
            by: 'TO Manager Transmittal',
            notes: `Transmittal: ${transmittalCode} issued to ${consultantName}`,
            transmittal_number: transmittalCode.trim(),
            submission_date: nowIso,
          };
          const updatedHistory = [...(item.rev_history || []), archivedRev];
          return DeliverablesService.saveDeliverableItem({
            id: item.id,
            deliverable_id: item.deliverable_id,
            submission_date: nowIso,
            transmittal_number: transmittalCode.trim(),
            status: 'returned',
            consultant_status: 'pending',
            completed_at: nowIso,
            rev_history: updatedHistory,
          });
        })
      );

      toast.success(
        isAr
          ? `تم اعتماد وإصدار خطاب الإرسال (${transmittalCode}) وتحويل ${itemsToUpdate.length} لوحة للمراجعة`
          : `Transmittal (${transmittalCode}) issued and ${itemsToUpdate.length} items submitted to consultant`
      );

      setActivePrintType('transmittal');
      setIsBatchingModalOpen(false);
      onRefresh?.();

      setTimeout(() => {
        printOfficialA4(
          'pzone-transmittal-print-sheet',
          `خطاب إرسال رسمي - ${transmittalCode}`
        );
      }, 150);
    } catch {
      toast.error(isAr ? 'فشل إصدار خطاب الإرسال' : 'Failed to issue transmittal');
    } finally {
      setIsIssuingTransmittal(false);
    }
  };

  const handlePrintFidicNotice = () => {
    setActivePrintType('fidic');
    setTimeout(() => {
      printOfficialA4(
        'pzone-fidic-notice-print-sheet',
        'إشعار تعاقدي رسمي بتأخر الاعتماد'
      );
    }, 150);
  };

  // Master Submittal Register (MSR) Export to CSV
  const handleExportMSR = () => {
    const rows = [
      ['Drawing Number', 'Discipline', 'Description', 'Current Rev', 'Consultant Code', 'Status', 'Days with Consultant'],
    ];

    deliverables.forEach((d) => {
      (d.items || []).forEach((item) => {
        const disc = detectDeliverableDiscipline(item);
        const days = calculateDaysElapsed(item.updated_at || d.received_at || '');
        rows.push([
          item.sheet_number || 'N/A',
          disc,
          `"${(item.description || '').replace(/"/g, '""')}"`,
          `Rev.${item.current_rev ?? 0}`,
          item.consultant_status || 'Pending',
          item.status,
          String(days),
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Submittal_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(isAr ? 'تم تصدير سجل التسليمات الموحد (MSR) بنجاح' : 'MSR exported successfully');
  };

  return (
    <div className={`space-y-6 ${className}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Action Bar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-600/20">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {isAr ? 'حوكمة حوافظ التسليم والمدد التعاقدية' : 'Transmittals & SLA Governance'}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                {isAr ? 'مدير المكتب الفني' : 'TO Manager'}
              </span>
              {isConsultantAutoLoaded && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? 'تم الجلب تلقائياً من بيانات المشروع' : 'Auto-loaded from project stakeholders'}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAr
                ? 'تجميع المخططات المعتمدة داخلياً في حوافظ تسليم رسمية، متابعة مهلة الـ 14 يوماً للاستشاري، وترقية مراجعات اللوحات'
                : 'Batch approved drawings, track consultant 14-day SLA, and manage revision lifecycles'}
            </p>
            {consultantContacts.length > 1 && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {isAr ? 'الاستشاري المستلم:' : 'Recipient Consultant:'}
                </span>
                <select
                  value={consultantName}
                  onChange={(e) => setConsultantName(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  {consultantContacts.map((c: any, idx: number) => {
                    const label = formatConsultantContactLabel(c) || `استشاري ${idx + 1}`;
                    return (
                      <option key={c.id || idx} value={label}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportMSR}
            className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 min-h-[40px] px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:active:bg-slate-600 text-slate-700 dark:text-slate-200 transition flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? 'تصدير سجل التسليمات الموحد' : 'Export MSR'}</span>
          </button>

          <button
            type="button"
            disabled={selectedItemIds.length === 0}
            onClick={() => {
              setReprintTransmittal(null);
              const scopedDeliverables =
                selectedProjectId && selectedProjectId !== 'all'
                  ? deliverables.filter((d) => d.project_id === selectedProjectId)
                  : deliverables;
              setTransmittalCode(computeNextTransmittalCode(scopedDeliverables as any));
              setIsBatchingModalOpen(true);
            }}
            className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 min-h-[40px] px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-sm shadow-purple-600/20 transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            <span>
              {isAr ? `إنشاء حافظة تسليم (${selectedItemIds.length})` : `Create Transmittal (${selectedItemIds.length})`}
            </span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('transmittals')}
          className={`cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'transmittals'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isAr ? 'لوحات جاهزة لحافظة التسليم' : 'Ready for Transmittal'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-bold">
            {approvedItemsReadyForTransmittal.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('sla_claims')}
          className={`cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500 min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'sla_claims'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{isAr ? 'رادار مهلة الاستشاري (14 يوماً) والمطالبات' : 'Consultant 14-Day SLA & Claims'}</span>
          {consultantReviewItems.filter((i) => i.isSlaBreached).length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-200 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 font-bold animate-pulse">
              {consultantReviewItems.filter((i) => i.isSlaBreached).length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('revisions')}
          className={`cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 min-h-[40px] px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeSubTab === 'revisions'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <RotateCw className="w-4 h-4" />
          <span>{isAr ? 'ترقية الإصدارات والمراجعات' : 'Revision Upgrades'}</span>
          {codeCItemsNeedingRevision.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold">
              {codeCItemsNeedingRevision.length}
            </span>
          )}
        </button>
      </div>

      {/* Sub-Tab 1: Transmittal Batching */}
      {activeSubTab === 'transmittals' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 text-xs text-purple-900 dark:text-purple-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
              <span>
                {isAr
                  ? 'حدد اللوحات المعتمدة داخلياً لتجميعها في خطاب إرسال رسمي موحد للاستشاري.'
                  : 'Select approved drawings to combine into an official consultant transmittal package.'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSelectAll}
              className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 rounded text-xs font-bold text-purple-700 dark:text-purple-300 hover:underline"
            >
              {selectedItemIds.length === approvedItemsReadyForTransmittal.length
                ? (isAr ? 'إلغاء تحديد الكل' : 'Deselect All')
                : (isAr ? 'تحديد الكل' : 'Select All')}
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="py-3 px-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedItemIds.length > 0 && selectedItemIds.length === approvedItemsReadyForTransmittal.length}
                      onChange={handleSelectAll}
                      className="cursor-pointer rounded text-purple-600 focus:ring-purple-500 focus-visible:ring-2 focus-visible:ring-purple-500"
                    />
                  </th>
                  <th className="py-3 px-3 text-start">{isAr ? 'رقم اللوحة' : 'Sheet #'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'التخصص' : 'Discipline'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'البيان' : 'Description'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'المشروع' : 'Project'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'الإصدار' : 'Rev'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'حالة الاعتماد' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {approvedItemsReadyForTransmittal.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      {isAr ? 'لا توجد لوحات معتمدة جاهزة للإرسال حالياً' : 'No approved items ready for transmittal'}
                    </td>
                  </tr>
                ) : (
                  approvedItemsReadyForTransmittal.map((item) => (
                    <tr
                      key={item.id}
                      tabIndex={0}
                      onClick={() => handleToggleSelect(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleSelect(item.id);
                        }
                      }}
                      className={`cursor-pointer transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 ${
                        selectedItemIds.includes(item.id)
                          ? 'bg-purple-50/70 dark:bg-purple-950/30'
                          : 'hover:bg-slate-50 dark:bg-slate-800/60/60 dark:bg-slate-800/50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedItemIds.includes(item.id)}
                          onChange={() => handleToggleSelect(item.id)}
                          className="cursor-pointer rounded text-purple-600 focus:ring-purple-500 focus-visible:ring-2 focus-visible:ring-purple-500"
                        />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white" dir="ltr">
                        {item.sheet_number || 'N/A'}
                      </td>
                      <td className="py-3 px-3">
                        <TODisciplineBadge discipline={detectDeliverableDiscipline(item)} />
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {item.description}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {item.projectName}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                        Rev.{item.current_rev ?? 0}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          {isAr ? 'معتمد داخلياً' : 'TO Approved'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Consultant 14-Day SLA & Claims Notice */}
      {activeSubTab === 'sla_claims' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
              <div className="text-xs text-slate-400 dark:text-slate-500 font-bold">{isAr ? 'إجمالي اللوحات عند الاستشاري' : 'Under Review'}</div>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                {consultantReviewItems.length}
              </div>
            </div>
            <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-1">
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-bold">{isAr ? 'ضمن المهلة التعاقدية (14 يوماً فأقل)' : 'Within SLA'}</div>
              <div className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                {consultantReviewItems.filter((i) => !i.isSlaBreached).length}
              </div>
            </div>
            <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 shadow-sm space-y-1">
              <div className="text-xs text-rose-700 dark:text-rose-300 font-bold">{isAr ? 'تجاوزت المهلة التعاقدية (أكثر من 14 يوماً - تستوجب إشعاراً)' : 'SLA Breached (>14d)'}</div>
              <div className="text-2xl font-black font-mono text-rose-700 dark:text-rose-300">
                {consultantReviewItems.filter((i) => i.isSlaBreached).length}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="py-3 px-3.5 text-start">{isAr ? 'رقم اللوحة' : 'Sheet #'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'التخصص' : 'Discipline'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'البيان' : 'Description'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'المشروع' : 'Project'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'الأيام عند الاستشاري' : 'Days Pending'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'موقف المهلة التعاقدية' : 'SLA Status'}</th>
                  <th className="py-3 px-3.5 text-end">{isAr ? 'إجراء المطالبة' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {consultantReviewItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      {isAr ? 'لا توجد لوحات معلقة عند الاستشاري حالياً' : 'No items currently with consultant'}
                    </td>
                  </tr>
                ) : (
                  consultantReviewItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:bg-slate-800/60/60 dark:bg-slate-800/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-white" dir="ltr">
                        {item.sheet_number || 'N/A'}
                      </td>
                      <td className="py-3 px-3">
                        <TODisciplineBadge discipline={detectDeliverableDiscipline(item)} />
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {item.description}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                        {item.projectName}
                      </td>
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-mono font-bold text-xs">
                            <span className={item.isSlaBreached ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}>
                              {item.daysPending} {isAr ? 'يوم' : 'd'}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">/ 14 {isAr ? 'يوم' : 'd'}</span>
                          </div>
                          <div className="w-20 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.isSlaBreached
                                  ? 'bg-rose-500'
                                  : item.daysPending > 10
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.round((item.daysPending / 14) * 100))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {item.isSlaBreached ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 shadow-xs animate-pulse w-max">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                            <span>{isAr ? 'تجاوز المهلة التعاقدية' : 'SLA Breached'}</span>
                          </span>
                        ) : item.daysPending > 10 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 shadow-xs w-max">
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>{isAr ? 'شارفت المهلة على الانتهاء' : 'Expiring Soon'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 shadow-xs w-max">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>{isAr ? 'ساري ضمن المهلة' : 'Within SLA'}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-end">
                        {item.isSlaBreached ? (
                          <button
                            type="button"
                            onClick={() => {
                              const notice = generateFidicNoticeText({
                                transmittalNumber: item.parentPackage?.ref_code || transmittalCode,
                                projectName: item.projectName,
                                consultantName,
                                submissionDate: item.updated_at?.slice(0, 10) || '2026-10-01',
                                daysElapsed: item.daysPending,
                                drawingNumbers: [item.sheet_number || 'N/A'],
                              });
                              setSelectedClaimNotice(notice);
                            }}
                            className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm flex items-center gap-1.5 ml-auto transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>{isAr ? 'إنذار تأخير فيديك' : 'FIDIC Notice'}</span>
                          </button>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Revision Lifecycle Upgrades (Rev 0 -> Rev 1) */}
      {activeSubTab === 'revisions' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <RotateCw className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {isAr
                ? 'المخططات التي تم رفضها (كود C) أو تطلبت تعديلات جوهرية (كود B) تحتاج إلى ترقية إصدار لأرشفة الملاحظات وإعادة العمل للمهندس.'
                : 'Drawings returned with Code C or Code B comments require a formal Revision Upgrade to reset progress and archive comments.'}
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-start text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  <th className="py-3 px-3.5 text-start">{isAr ? 'رقم اللوحة' : 'Sheet #'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'التخصص' : 'Discipline'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'البيان' : 'Description'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'كود الاستشاري' : 'Consultant Code'}</th>
                  <th className="py-3 px-3 text-start">{isAr ? 'الإصدار الحالي' : 'Current Rev'}</th>
                  <th className="py-3 px-3.5 text-end">{isAr ? 'ترقية الإصدار' : 'Upgrade'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {codeCItemsNeedingRevision.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      {isAr ? 'لا توجد لوحات حالياً بحاجة إلى ترقية إصدار' : 'No items requiring revision upgrades'}
                    </td>
                  </tr>
                ) : (
                  codeCItemsNeedingRevision.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:bg-slate-800/60/60 dark:bg-slate-800/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-white" dir="ltr">
                        {item.sheet_number || 'N/A'}
                      </td>
                      <td className="py-3 px-3">
                        <TODisciplineBadge discipline={detectDeliverableDiscipline(item)} />
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                        {item.description}
                      </td>
                      <td className="py-3 px-3">
                        <TOConsultantStatusBadge status={item.consultant_status as any} />
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        Rev.{item.current_rev ?? 0}
                      </td>
                      <td className="py-3 px-3.5 text-end">
                        <button
                          type="button"
                          disabled={isProcessingRevUp === item.id}
                          onClick={() => handleUpgradeRevision(item)}
                          className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-amber-500 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-sm flex items-center gap-1.5 ml-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RotateCw className={`w-3.5 h-3.5 ${isProcessingRevUp === item.id ? 'animate-spin' : ''}`} />
                          <span>
                            {isAr ? `ترقية إلى مراجعة Rev.${(item.current_rev ?? 0) + 1}` : `Upgrade to Rev.${(item.current_rev ?? 0) + 1}`}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Issued Transmittals Archive (أرشيف حوافظ التسليم الصادرة) ── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                {isAr ? 'أرشيف حوافظ التسليم الصادرة' : 'Issued Transmittals Archive'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? 'سجل كافة حوافظ التسليم الرسمية الصادرة للاستشاري مع إحصائيات الاعتماد وإمكانية إعادة الطباعة'
                  : 'Log of all issued official transmittals with approval status breakdown and reprint capability'}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {issuedTransmittalsArchive.length} {isAr ? 'حافظة صادرة' : 'Transmittals'}
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                <th className="py-3 px-3.5 text-start">{isAr ? 'كود حافظة التسليم' : 'Transmittal Code'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'عدد المخرجات المرفقة' : 'Attached Items'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'حالات الاعتماد' : 'Approval Breakdown'}</th>
                <th className="py-3 px-3.5 text-end">{isAr ? 'إجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {issuedTransmittalsArchive.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    {isAr ? 'لا توجد حوافظ تسليم صادرة مسجلة حالياً' : 'No issued transmittals recorded yet'}
                  </td>
                </tr>
              ) : (
                issuedTransmittalsArchive.map((grp) => (
                  <tr
                    key={grp.transmittalCode}
                    tabIndex={0}
                    onClick={() => {
                      setReprintTransmittal({
                        code: grp.transmittalCode,
                        items: grp.items,
                      });
                      setTransmittalCode(grp.transmittalCode);
                      setIsBatchingModalOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setReprintTransmittal({
                          code: grp.transmittalCode,
                          items: grp.items,
                        });
                        setTransmittalCode(grp.transmittalCode);
                        setIsBatchingModalOpen(true);
                      }
                    }}
                    className="cursor-pointer hover:bg-purple-50/50 dark:bg-purple-950/40 dark:hover:bg-purple-950/20 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 transition-colors"
                  >
                    <td className="py-3 px-3.5 font-mono font-black text-purple-700 dark:text-purple-300" dir="ltr">
                      {grp.transmittalCode}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {grp.items.length} {isAr ? 'مخرج مرفق' : 'items'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                          {isAr ? `كود A: ${grp.codeA}` : `Code A: ${grp.codeA}`}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
                          {isAr ? `كود B: ${grp.codeB}` : `Code B: ${grp.codeB}`}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60">
                          {isAr ? `كود C: ${grp.codeC}` : `Code C: ${grp.codeC}`}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60">
                          {isAr ? `قيد المراجعة: ${grp.underReview}` : `Under Review: ${grp.underReview}`}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3.5 text-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          setReprintTransmittal({
                            code: grp.transmittalCode,
                            items: grp.items,
                          });
                          setTransmittalCode(grp.transmittalCode);
                          setIsBatchingModalOpen(true);
                        }}
                        className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 px-3 py-1.5 text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-100 active:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>{isAr ? 'معاينة وإعادة طباعة' : 'Preview & Reprint'}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Batch Transmittal Preview & Generation */}
      {isBatchingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-purple-600 text-white">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isAr ? 'إصدار حافظة تسليم رسمية للاستشاري' : 'Generate Consultant Transmittal'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {transmittalCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBatchingModalOpen(false);
                  setReprintTransmittal(null);
                }}
                className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  {isAr ? 'كود خطاب الإرسال:' : 'Transmittal No:'}
                </label>
                <input
                  type="text"
                  value={transmittalCode}
                  onChange={(e) => setTransmittalCode(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono font-bold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                    {isAr ? 'جهة الاستشاري المستلم:' : 'Consultant Name:'}
                  </label>
                  {isConsultantAutoLoaded && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs">
                      <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{isAr ? 'تم الجلب تلقائياً من المشروع' : 'Auto-loaded from project'}</span>
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={consultantName}
                  onChange={(e) => setConsultantName(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500"
                />
                {consultantContacts.length > 1 && (
                  <select
                    value={consultantName}
                    onChange={(e) => setConsultantName(e.target.value)}
                    className="mt-1.5 w-full p-1.5 text-[11px] rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    {consultantContacts.map((c: any, idx: number) => {
                      const label = formatConsultantContactLabel(c) || `استشاري ${idx + 1}`;
                      return (
                        <option key={c.id || idx} value={label}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                  {isAr ? 'المنشأ / نطاق الأعمال:' : 'Structure Scope:'}
                </label>
                <input
                  type="text"
                  value={structureType}
                  onChange={(e) => setStructureType(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500"
                />
              </div>
            </div>

            {/* List of included drawings */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {isAr ? `اللوحات المدرجة بالخطاب (${modalTransmittalItems.length} لوحة):` : 'Included Drawings:'}
              </label>
              <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 p-2">
                {modalTransmittalItems.map((item) => (
                  <div key={item.id} className="py-2 px-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white" dir="ltr">
                        {item.sheet_number}
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">•</span>
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {item.description}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                      Rev.{item.current_rev ?? 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsBatchingModalOpen(false);
                  setReprintTransmittal(null);
                }}
                className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isIssuingTransmittal}
                onClick={handleIssueTransmittal}
                className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Printer className="w-4 h-4" />
                <span>
                  {isIssuingTransmittal
                    ? (isAr ? 'جاري الاعتماد والإصدار...' : 'Issuing...')
                    : (isAr ? 'طباعة واعتماد حافظة التسليم' : 'Print & Issue Official Transmittal')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: FIDIC Claim Notice Modal */}
      {selectedClaimNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-rose-600 text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {isAr ? 'إشعار تأخير تعاقدي واستحقاق تمديد زمني (فيديك)' : 'FIDIC Clause 1.9 / 20.1 Notice'}
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                    {isAr ? 'مستند تعاقدي لحفظ حقوق المقاول في التمديد الزمني' : 'Contractual Claim Document'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClaimNotice(null)}
                className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <pre className="text-xs font-sans text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed select-all">
                {selectedClaimNotice}
              </pre>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedClaimNotice);
                  toast.success(isAr ? 'تم نسخ نص الخطاب التعاقدي بنجاح' : 'Notice copied to clipboard');
                }}
                className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 rounded-xl flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                <span>{isAr ? 'نسخ الخطاب' : 'Copy Text'}</span>
              </button>
              <button
                type="button"
                onClick={handlePrintFidicNotice}
                className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-rose-500 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{isAr ? 'طباعة الخطاب الرسمي' : 'Print Official Letter'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Official A4 Printable Transmittal Sheet (Hidden on Screen, Visible on Print when activePrintType === 'transmittal') ── */}
      <div
        id="pzone-transmittal-print-sheet"
        className={`font-sans text-black p-8 bg-white dark:bg-slate-900 ${activePrintType === 'transmittal' ? 'hidden print:block' : 'hidden print:hidden'}`}
        dir="rtl"
      >
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight">شركة بي زون للإنشاءات التخصصية والمسطحات المائية</h1>
            <p className="text-xs font-bold text-gray-700 dark:text-slate-300 font-mono">P-ZONE AQUATIC ENGINEERING &amp; SPECIALISED CONSTRUCTIONS</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">كود الممارسات: ACI 350 • هيدروليكا DIN 19643 • كود التأريض NEC 680</p>
          </div>
          <div className="text-left border border-black p-2 rounded">
            <div className="text-xs font-black">خطاب إرسال معتمد (TRANSMITTAL)</div>
            <div className="text-sm font-mono font-black text-purple-950 dark:text-purple-200 mt-1">{transmittalCode}</div>
            <div className="text-[10px] text-gray-600 dark:text-slate-400 font-mono mt-0.5">{new Date().toISOString().slice(0, 10)}</div>
          </div>
        </div>

        {/* Project & Consultant Metadata */}
        <table className="w-full text-xs border border-black mb-4">
          <tbody>
            <tr className="border-b border-black">
              <td className="p-2 font-bold bg-gray-100 dark:bg-slate-800 border-l border-black w-28">اسم المشروع:</td>
              <td className="p-2 font-bold">{projects.find((p) => p.id === selectedProjectId)?.project_name || 'مشروع المسطحات المائية والبحيرات'}</td>
              <td className="p-2 font-bold bg-gray-100 dark:bg-slate-800 border-l border-black w-28">الجهة الاستشارية:</td>
              <td className="p-2 font-bold">{consultantName}</td>
            </tr>
            <tr>
              <td className="p-2 font-bold bg-gray-100 dark:bg-slate-800 border-l border-black">نطاق الأعمال:</td>
              <td className="p-2 font-bold">{structureType}</td>
              <td className="p-2 font-bold bg-gray-100 dark:bg-slate-800 border-l border-black">الغرض من التقديم:</td>
              <td className="p-2 font-bold">للمراجعة والاعتماد التعاقدي (For Consultant Approval)</td>
            </tr>
          </tbody>
        </table>

        {/* Drawings Table */}
        <div className="mb-4">
          <div className="text-xs font-black mb-1">قائمة المخططات التنفيذية المرفقة بالخطاب:</div>
          <table className="w-full text-xs border border-black text-center">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-800 border-b border-black font-bold">
                <th className="p-2 border-l border-black w-10">م</th>
                <th className="p-2 border-l border-black w-32">رقم اللوحة</th>
                <th className="p-2 border-l border-black text-right">عنوان وتوصيف المخطط</th>
                <th className="p-2 border-l border-black w-16">الإصدار</th>
                <th className="p-2 w-24">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {modalTransmittalItems.map((item, idx) => (
                <tr key={item.id} className="border-b border-black">
                  <td className="p-2 border-l border-black font-mono">{idx + 1}</td>
                  <td className="p-2 border-l border-black font-mono font-bold" dir="ltr">{item.sheet_number}</td>
                  <td className="p-2 border-l border-black text-right font-medium">{item.description}</td>
                  <td className="p-2 border-l border-black font-mono font-bold">Rev.{item.current_rev ?? 0}</td>
                  <td className="p-2 font-bold">للاعتماد A/B</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FIDIC SLA Note */}
        <div className="p-3 border border-black bg-gray-50 dark:bg-slate-800/60 text-[10px] leading-relaxed mb-6">
          <span className="font-bold block mb-0.5">تنبيه تعاقدي (Contractual Review Notice - FIDIC Clause 1.9 &amp; 20.1):</span>
          المهلة الزمنية التعاقدية المحددة لمراجعة وإبداء الملاحظات على هذه المخططات هي (14 يوماً) من تاريخ استلام هذا الخطاب. ونظراً لارتباط هذه اللوحات بأعمال صب الخرسانات وحلقات التأريض ومخترقات الجلب المائية، فإن أي تأخير يترتب عليه مباشرةً حفظ حق المقاول في التمديد الزمني والتعويض المالي.
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-4 text-xs text-center border-t-2 border-black pt-4">
          <div className="p-3 border border-black space-y-8">
            <span className="font-bold block">إعداد / مهندس المكتب الفني</span>
            <div className="border-b border-dashed border-gray-400 w-3/4 mx-auto" />
            <span className="text-[10px] text-gray-500 dark:text-slate-400 block">التوقيع والتاريخ</span>
          </div>

          <div className="p-3 border border-black space-y-8">
            <span className="font-bold block">مراجعة واعتماد / مدير المكتب الفني</span>
            <div className="border-b border-dashed border-gray-400 w-3/4 mx-auto" />
            <span className="text-[10px] text-gray-500 dark:text-slate-400 block">الختم والتاريخ</span>
          </div>

          <div className="p-3 border border-black space-y-8">
            <span className="font-bold block">استلام استشاري المشروع</span>
            <div className="border-b border-dashed border-gray-400 w-3/4 mx-auto" />
            <span className="text-[10px] text-gray-500 dark:text-slate-400 block">الاسم والختم وتاريخ الاستلام</span>
          </div>
        </div>
      </div>

      {/* ── Official A4 Printable FIDIC Delay Notice Sheet (Hidden on Screen, Visible on Print when activePrintType === 'fidic') ── */}
      <div
        id="pzone-fidic-notice-print-sheet"
        className={`font-sans text-black p-8 bg-white dark:bg-slate-900 ${activePrintType === 'fidic' ? 'hidden print:block' : 'hidden print:hidden'}`}
        dir="rtl"
      >
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tight">شركة بي زون للإنشاءات التخصصية والمسطحات المائية</h1>
            <p className="text-xs font-bold text-gray-700 dark:text-slate-300 font-mono">P-ZONE AQUATIC ENGINEERING &amp; SPECIALISED CONSTRUCTIONS</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1">كود الممارسات: ACI 350 • هيدروليكا DIN 19643 • كود التأريض NEC 680</p>
          </div>
          <div className="text-left border border-black p-2 rounded">
            <div className="text-xs font-black text-rose-700 dark:text-rose-300">إشعار رسمي بتأخر اعتماد (FIDIC 1.9 / 20.1)</div>
            <div className="text-sm font-mono font-black text-slate-900 dark:text-slate-100 mt-1">CLAIM-EOT-NOTIF</div>
            <div className="text-[10px] text-gray-600 dark:text-slate-400 font-mono mt-0.5">{new Date().toISOString().slice(0, 10)}</div>
          </div>
        </div>

        {/* Project Metadata */}
        <table className="w-full text-xs border border-black mb-4">
          <tbody>
            <tr className="border-b border-black">
              <td className="p-2 font-bold bg-gray-100 dark:bg-slate-800 border-l border-black w-28">اسم المشروع:</td>
              <td className="p-2 font-bold">{projects.find((p) => p.id === selectedProjectId)?.project_name || 'مشروع المسطحات المائية والبحيرات'}</td>
              <td className="p-2 font-bold bg-gray-100 dark:bg-slate-800 border-l border-black w-28">نوع المستند:</td>
              <td className="p-2 font-bold text-rose-700 dark:text-rose-300">إشعار حفظ حق تعاقدي (Contractual Claim Notice)</td>
            </tr>
          </tbody>
        </table>

        {/* Notice Body */}
        <div className="p-4 border border-black bg-gray-50 dark:bg-slate-800/60 text-xs leading-relaxed whitespace-pre-wrap font-sans my-4">
          {selectedClaimNotice}
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 text-xs text-center border-t-2 border-black pt-6 mt-8">
          <div className="p-3 border border-black space-y-8">
            <span className="font-bold block">إصدار / مدير المكتب الفني (P-Zone)</span>
            <div className="border-b border-dashed border-gray-400 w-3/4 mx-auto" />
            <span className="text-[10px] text-gray-500 dark:text-slate-400 block">الختم والتاريخ</span>
          </div>

          <div className="p-3 border border-black space-y-8">
            <span className="font-bold block">استلام ممثل المهندس الاستشاري</span>
            <div className="border-b border-dashed border-gray-400 w-3/4 mx-auto" />
            <span className="text-[10px] text-gray-500 dark:text-slate-400 block">الاسم والختم وتاريخ الاستلام</span>
          </div>
        </div>
      </div>

      {/* Global Print Media Rules */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav, aside, header, button, .no-print, [role="navigation"], [role="banner"], #to-tasks-main > header {
            display: none !important;
          }
          #pzone-transmittal-print-sheet {
            display: ${activePrintType === 'transmittal' ? 'block' : 'none'} !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15mm;
            box-sizing: border-box;
          }
          #pzone-fidic-notice-print-sheet {
            display: ${activePrintType === 'fidic' ? 'block' : 'none'} !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15mm;
            box-sizing: border-box;
          }
        }
      `}</style>
    </div>
  );
};
