'use client';

import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Clock, 
  HardHat, 
  Truck, 
  User, 
  Calendar, 
  FileText, 
  Camera, 
  CheckCircle2, 
  AlertCircle,
  UploadCloud,
  ShieldAlert,
  HelpCircle,
  Layers,
  Globe2,
  Loader2
} from 'lucide-react';
import { 
  DailyProgress, 
  UnifiedObstructionType, 
  ObstructionType, 
  ObstructionScope,
  DailyObstruction 
} from '@/types/planning';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { NotificationService } from '@/lib/services/notification.service';
import { contractsService } from '@/lib/services/contracts.service';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { validateSafeUploadFile } from '@/lib/utils/security';
import { logger } from '@/lib/logger';

export interface DailyObstructionModalProps {
  isOpen: boolean;
  onClose: () => void;
  report?: DailyProgress | null;
  projectId: string;
  taskId?: string | null;
  deliverableItemId?: string | null;
  onSuccess?: (obstruction: DailyObstruction) => void;
}

export interface ObstructionCategoryConfig {
  type: UnifiedObstructionType;
  labelAr: string;
  labelEn: string;
  badgeColor: string;
  descriptionAr: string;
  descriptionEn: string;
}

export const UNIFIED_TAXONOMY_CATEGORIES: ObstructionCategoryConfig[] = [
  {
    type: 'owner_directive',
    labelAr: 'توجيهات المالك / أمر تغيير',
    labelEn: 'Owner Directive / VO',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    descriptionAr: 'توجيهات المالك أو التعديلات التصميمية أو تأخر القرارات الرسمية',
    descriptionEn: 'Owner instructions, design revisions, or delayed approvals/decisions',
  },
  {
    type: 'weather',
    labelAr: 'ظروف جوية قاهرة',
    labelEn: 'Adverse Weather',
    badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    descriptionAr: 'أمطار غزيرة، رياح شديدة، أو درجات حرارة تمنع الأعمال الميدانية',
    descriptionEn: 'Heavy rain, sandstorms, or extreme heat preventing field operations',
  },
  {
    type: 'material_delay',
    labelAr: 'تأخر توريد / اعتماد المواد',
    labelEn: 'Material Delay / Submittal',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    descriptionAr: 'تأخر توريد الخامات المعتمدة أو بطء اعتماد عينات المواد المعملية',
    descriptionEn: 'Delayed material delivery, supplier backlog, or lab test pending',
  },
  {
    type: 'drawing_delay',
    labelAr: 'تأخر اعتماد اللوحات (Shop Drawings)',
    labelEn: 'Shop Drawing Delay',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    descriptionAr: 'تأخر اعتماد الاستشاري أو المكتب الفني لمخططات التنفيذ وشوب دروينج',
    descriptionEn: 'Consultant review delay on shop drawings or calculation notes',
  },
  {
    type: 'subcontractor',
    labelAr: 'تعثر / تأخر مقاول الباطن',
    labelEn: 'Subcontractor Default/Delay',
    badgeColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
    descriptionAr: 'نقص أداء أو تأخر أو نزاع مع مقاول الباطن المسند إليه العمل',
    descriptionEn: 'Subcontractor performance drop, labor absence, or site dispute',
  },
  {
    type: 'permit_authority',
    labelAr: 'تراخيص وموافقات الجهات الحكومية',
    labelEn: 'Authority Permits & Approvals',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    descriptionAr: 'تأخر التصاريح والرخص والموافقات الرسمية من الجهات الحكومية',
    descriptionEn: 'Delays in government permits, traffic approvals, or utility clearance',
  },
  {
    type: 'equipment',
    labelAr: 'أعطال / نقص المعدات',
    labelEn: 'Equipment Breakdown / Shortage',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    descriptionAr: 'أعطال في المعدات الرئيسية أو عدم توفر وقود / قطع غيار أساسية',
    descriptionEn: 'Heavy plant breakdown, missing spare parts, or crane stoppage',
  },
  {
    type: 'manpower',
    labelAr: 'نقص العمالة / الإنتاجية',
    labelEn: 'Labor Shortage / Low Productivity',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    descriptionAr: 'عدم توفر عمالة فنية متخصصة كافية أو تدني معدلات الإنتاج',
    descriptionEn: 'Shortage of skilled craftsmen or sudden drop in daily gang output',
  },
  {
    type: 'safety',
    labelAr: 'ملاحظات واشتراطات السلامة (HSE)',
    labelEn: 'Safety (HSE) Stop Order',
    badgeColor: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800',
    descriptionAr: 'توقف مؤقت لأسباب تتعلق بالسلامة والصحة المهنية وتأمين الموقع',
    descriptionEn: 'Temporary site stoppage due to safety violation or hazard mitigation',
  },
  {
    type: 'access',
    labelAr: 'عوائق الوصول وتسليم الموقع',
    labelEn: 'Site Access / Possession Barrier',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    descriptionAr: 'عقبات في تصاريح الدخول، عوائق أمنية، أو عدم جهوزية الموقع للعمل',
    descriptionEn: 'Access gate restriction, unreleased work areas, or client barriers',
  },
  {
    type: 'other',
    labelAr: 'إعاقة أخرى غير مصنفة',
    labelEn: 'Other Unclassified Obstruction',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    descriptionAr: 'أي إعاقة أو سبب توقف آخر غير مصنف في الفئات أعلاه',
    descriptionEn: 'Any unforeseen obstacle or event not categorized above',
  },
];

export const OBSTRUCTION_TYPE_CONFIG: Record<
  ObstructionType,
  { labelAr: string; color: string; description: string }
> = UNIFIED_TAXONOMY_CATEGORIES.reduce((acc, cat) => {
  acc[cat.type] = {
    labelAr: cat.labelAr,
    color: cat.badgeColor,
    description: cat.descriptionAr,
  };
  return acc;
}, {} as Record<ObstructionType, { labelAr: string; color: string; description: string }>);

// Legacy mappings
OBSTRUCTION_TYPE_CONFIG['material_approval'] = {
  labelAr: 'تأخر اعتماد العينات والخامات',
  color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  description: 'تأخر اعتماد الخامات والمواد الموردة أو الفحوصات المعملية',
};
OBSTRUCTION_TYPE_CONFIG['site_access'] = {
  labelAr: 'تعذر استلام / دخول الموقع',
  color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  description: 'عقبات في تصاريح الدخول، عوائق أمنية، أو عدم جهوزية الموقع',
};
OBSTRUCTION_TYPE_CONFIG['client_works'] = {
  labelAr: 'أعمال وتداخلات المالك / جهات أخرى',
  color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  description: 'توقف بسبب مقاولين آخرين تابعين للمالك أو تعديلات معمارية',
};
OBSTRUCTION_TYPE_CONFIG['equipment_idle'] = {
  labelAr: 'تعطل / توقف معدات وآليات',
  color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  description: 'أعطال في المعدات الرئيسية أو عدم توفر وقود / قطع غيار',
};
OBSTRUCTION_TYPE_CONFIG['labor_shortage'] = {
  labelAr: 'نقص في العمالة الفنية',
  color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  description: 'عدم توفر عمالة أو تغيب مقاول الباطن عن الموقع',
};

export const RESPONSIBLE_PARTIES = [
  { value: 'Consultant', labelAr: 'الاستشاري (Consultant)', labelEn: 'Consultant' },
  { value: 'Client', labelAr: 'المالك / جهة الإسناد (Client)', labelEn: 'Client / Employer' },
  { value: 'Internal', labelAr: 'إدارة داخلية / المقاول (Internal)', labelEn: 'Internal / Main Contractor' },
  { value: 'Supplier', labelAr: 'الموردين وسلاسل الإمداد (Supplier)', labelEn: 'Suppliers / Vendors' },
  { value: 'Subcontractor', labelAr: 'مقاول باطن (Subcontractor)', labelEn: 'Subcontractor' },
  { value: 'Authorities', labelAr: 'جهات حكومية وتصاريح (Authorities)', labelEn: 'Government Authorities' },
  { value: 'Other', labelAr: 'أخرى (Other)', labelEn: 'Other / Force Majeure' },
];

export const DailyObstructionModal: React.FC<DailyObstructionModalProps> = ({
  isOpen,
  onClose,
  report,
  projectId,
  taskId,
  deliverableItemId,
  onSuccess,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [obstructionType, setObstructionType] = useState<UnifiedObstructionType>('drawing_delay');
  const [scope, setScope] = useState<ObstructionScope>('task');
  const [eotDays, setEotDays] = useState<number>(0);
  const [responsibleParty, setResponsibleParty] = useState<string>('Consultant');
  const [description, setDescription] = useState('');
  const [idleManpower, setIdleManpower] = useState<number>(0);
  const [idleEquipmentSummary, setIdleEquipmentSummary] = useState('');
  const [financialImpactEgp] = useState<number>(0);
  const [startedAt, setStartedAt] = useState(
    report?.progress_date || new Date().toISOString().slice(0, 10)
  );
  const [resolvedAt] = useState('');
  const [evidencePath, setEvidencePath] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isCriticalPath, setIsCriticalPath] = useState(false);
  const [createEotDraft, setCreateEotDraft] = useState(false);

  if (!isOpen) return null;

  const effectiveProjectId = report?.project_id || projectId;

  // Handle evidence file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateSafeUploadFile(file);
    if (!validation.valid) {
      setErrorMsg(
        validation.error ||
          (isAr ? 'نوع الملف أو حجمه غير مسموح به' : 'Invalid or unsafe upload file')
      );
      e.target.value = '';
      return;
    }

    setErrorMsg(null);
    setIsUploading(true);
    try {
      const rawExt = (file.name.split('.').pop() || 'jpg').replace(/[^a-zA-Z0-9]/g, '');
      const ext = rawExt || 'jpg';
      const targetPathId = effectiveProjectId || 'general';
      const path = `obstructions/${targetPathId}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('progress-photos')
        .upload(path, file);

      if (uploadErr) {
        logger.warn('Evidence upload error', { detail: uploadErr });
        setErrorMsg(
          isAr
            ? 'تعذر رفع ملف الإثبات إلى الخادم. يرجى المحاولة مرة أخرى.'
            : 'Failed to upload evidence file to storage. Please try again.'
        );
        e.target.value = '';
        return;
      }

      const { data: urlData } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(path);
      setEvidencePath(urlData.publicUrl || path);
    } catch (err) {
      logger.warn('Evidence upload exception', { detail: err });
      setErrorMsg(
        isAr
          ? 'حدث خطأ أثناء رفع ملف الإثبات. يرجى المحاولة مرة أخرى.'
          : 'An error occurred while uploading the evidence file.'
      );
      e.target.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setErrorMsg(isAr ? 'يرجى كتابة وصف تفصيلي للإعاقة' : 'Detailed obstruction description is required');
      return;
    }

    if (eotDays < 0) {
      setErrorMsg(isAr ? 'أيام التمديد الزمني يجب أن تكون صفر أو قيمة موجبة' : 'EOT days must be >= 0');
      return;
    }

    if (!effectiveProjectId) {
      setErrorMsg(isAr ? 'يرجى اختيار المشروع أولاً قبل تسجيل الإعاقة' : 'Project must be selected before logging an obstruction');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const payload: Partial<DailyObstruction> = {
        daily_progress_id: report?.id || undefined,
        project_id: effectiveProjectId,
        task_id: taskId || report?.site_task_id || undefined,
        site_task_id: taskId || report?.site_task_id || undefined,
        deliverable_item_id: deliverableItemId || undefined,
        obstruction_type: obstructionType,
        scope: scope,
        eot_days: Number(eotDays) || 0,
        responsible_party: responsibleParty,
        description: description.trim(),
        idle_manpower: Number(idleManpower) || 0,
        idle_equipment_summary: idleEquipmentSummary.trim() || undefined,
        financial_impact_egp: Number(financialImpactEgp) || 0,
        started_at: startedAt ? `${startedAt}T08:00:00Z` : new Date().toISOString(),
        resolved_at: resolvedAt ? `${resolvedAt}T17:00:00Z` : undefined,
        evidence_path: evidencePath.trim() || undefined,
      };

      const result = await DailyProgressService.addObstruction(payload);
      if (!result) {
        throw new Error(isAr ? 'فشل تسجيل الإعاقة في قاعدة البيانات' : 'Failed to save obstruction');
      }

      // ADR-0008: Auto-create EOT draft if requested or critical path delay flagged
      if (createEotDraft || (isCriticalPath && Number(eotDays) > 0)) {
        try {
          const savedEot = await contractsService.saveEOTRequest({
            project_id: effectiveProjectId,
            title_ar: `مطالبة تمديد زمني ناتجة عن إعاقة موقع: ${description.slice(0, 40)}...`,
            reason: description.trim(),
            requested_days: Number(eotDays) || 1,
            clause_reference: 'FIDIC 8.4 / 20.1',
            status: 'draft',
            submission_date: startedAt || new Date().toISOString().slice(0, 10),
          });

          if (savedEot) {
            await NotificationService.createNotification({
              project_id: effectiveProjectId,
              event_type: 'eot_draft_created',
              entity_type: 'obstruction',
              entity_id: result.id,
              title_ar: `⚠️ إشعار مطالبة تمديد زمني (EOT) لإعاقة بالمسار الحرج`,
              title_en: `Critical Path Delay - EOT Draft Created`,
              body_ar: `تم تسجيل إعاقة على المسار الحرج وفتح مسودة مطالبة تمديد زمني بـ ${eotDays} يوم.`,
              link_url: '/contracts/claims?tab=eots',
              recipient_user_id: 'project_manager',
            });
          }
        } catch (eotErr) {
          logger.warn('Failed to auto-create EOT claim from obstruction', { detail: eotErr });
        }
      }

      setSuccessMsg(
        isAr
          ? 'تم تسجيل الإعاقة بنجاح وإضافتها إلى سجل مطالبات التمديد الزمني (EOT Log)'
          : 'Obstruction logged successfully and registered in EOT claim log'
      );

      if (onSuccess) {
        setTimeout(() => {
          onSuccess(result);
          onClose();
        }, 800);
      } else {
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: unknown) {
      const errInfo = err as { message?: string; code?: string; details?: string } | null | undefined;
      logger.error('Obstruction save error', {
        message: errInfo?.message || String(err),
        code: errInfo?.code,
        details: errInfo?.details,
      });
      setErrorMsg(errInfo?.message || (isAr ? 'حدث خطأ أثناء حفظ الإعاقة' : 'An error occurred while saving'));
    } finally {
      setIsSaving(false);
    }
  };

  const currentCategory = UNIFIED_TAXONOMY_CATEGORIES.find((c) => c.type === obstructionType) || UNIFIED_TAXONOMY_CATEGORIES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-200" data-testid="daily-obstruction-modal">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl shadow-slate-900/10 dark:shadow-slate-950/50 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-amber-50/60 dark:bg-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-600 text-white shadow-md shadow-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{isAr ? 'تسجيل إعاقة موقع ومطالبة تمديد (EOT Log)' : 'Log Site Obstruction & EOT Claim'}</span>
                {report && (
                  <span className="font-mono text-xs text-amber-700 dark:text-amber-400">
                    [{isAr ? 'يومية' : 'Report'} #{report.report_no || report.progress_date}]
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr 
                  ? 'توثيق قانوني وهندسي موحد للإعاقات لدعم مطالبات التمديد الزمني طبقاً لعقد فيديك (FIDIC 20.1)'
                  : 'Unified delay taxonomy & legal notice documentation for Extension of Time (FIDIC 20.1)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            data-testid="close-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Row 1: Unified Taxonomy Selector */}
          <div className="grid grid-cols-1 gap-4">
            {/* Taxonomy Category — full width */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'تصنيف الإعاقة الموحد (11 فئة) *' : 'Unified Obstruction Taxonomy (11 Types) *'}</span>
              </label>
              <select
                value={obstructionType}
                onChange={(e) => setObstructionType(e.target.value as UnifiedObstructionType)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                data-testid="obstruction-type-select"
              >
                {UNIFIED_TAXONOMY_CATEGORIES.map((cat) => (
                  <option key={cat.type} value={cat.type} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {isAr ? cat.labelAr : cat.labelEn}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {isAr ? currentCategory.descriptionAr : currentCategory.descriptionEn}
              </p>
            </div>

            {/* Scope Selector: Task vs Site-Wide */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>{isAr ? 'نطاق وتأثير الإعاقة (Scope) *' : 'Obstruction Scope *'}</span>
              </label>
              <div className="grid grid-cols-2 gap-2" data-testid="scope-selector-container">
                <button
                  type="button"
                  onClick={() => setScope('task')}
                  className={`p-2.5 rounded-xl border font-bold text-center transition-all flex items-center justify-center gap-2 ${
                    scope === 'task'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  data-testid="scope-task-btn"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{isAr ? 'بند / مهمة محددة' : 'Specific Task'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScope('site_wide')}
                  className={`p-2.5 rounded-xl border font-bold text-center transition-all flex items-center justify-center gap-2 ${
                    scope === 'site_wide'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  data-testid="scope-sitewide-btn"
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>{isAr ? 'شامل الموقع بالكامل' : 'Site-Wide Impact'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                {scope === 'site_wide'
                  ? (isAr ? 'تأثير يوقف كامل أنشطة الموقع ويتيح مطالبة بتمديد زمني شامل' : 'Stops the whole project critical path; primary justification for master EOT')
                  : (isAr ? 'تأثير محصور في بند نشاط أو منطقة عمل معينة' : 'Impact isolated to a specific deliverable or zone activity')}
              </p>
            </div>
          </div>

          {/* Row 2: Responsible Party & EOT Claimed Days */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Responsible Party */}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? 'الجهة المتسببة في الإعاقة (Responsible Party) *' : 'Responsible Party *'}</span>
              </label>
              <select
                value={responsibleParty}
                onChange={(e) => setResponsibleParty(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium focus:ring-2 focus:ring-amber-500 outline-none"
                data-testid="responsible-party-select"
              >
                {RESPONSIBLE_PARTIES.map((party) => (
                  <option key={party.value} value={party.value} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                    {isAr ? party.labelAr : party.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* EOT Days Input with Tooltip & FIDIC Time-bar guidance */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>{isAr ? 'أيام التمديد التقديرية (EOT Days Claimed)' : 'Estimated EOT Days Claimed'}</span>
                </label>
                <div className="group relative flex items-center">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 cursor-help" />
                  <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block w-64 p-2.5 bg-slate-900 text-slate-100 text-[10px] rounded-xl shadow-xl z-20 border border-slate-700 leading-normal">
                    {isAr 
                      ? 'ملاحظة قانونية (FIDIC 20.1): يجب إخطار المهندس/الاستشاري خطياً بأي حدث يسبب تأخيراً خلال 28 يوماً من حدوثه للحفاظ على الحق القانوني في التمديد.' 
                      : 'FIDIC 20.1 Time-Bar: Written notice must be submitted to the Engineer within 28 days of event occurrence to preserve contractual claim rights.'}
                  </div>
                </div>
              </div>
              <input
                type="number"
                min="0"
                step="0.5"
                value={eotDays}
                onChange={(e) => setEotDays(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="0"
                data-testid="eot-days-input"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {isAr ? 'عدد أيام العمل المتوقع خسارتها نتيجة هذا التوقف' : 'Expected work days lost due to this stoppage'}
              </p>
            </div>
          </div>

          {/* ADR-0008: Critical Path Escalation & EOT Claim Bridge */}
          <div className="p-3.5 rounded-2xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isCriticalPath}
                  onChange={(e) => {
                    setIsCriticalPath(e.target.checked);
                    if (e.target.checked && eotDays === 0) setEotDays(1);
                  }}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                  data-testid="critical-path-toggle"
                />
                <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-purple-600" />
                  {isAr ? 'الإعاقة تؤثر مباشرة على المسار الحرج (Critical Path / Zero Float)' : 'Direct Critical Path Impact'}
                </span>
              </label>
              {isCriticalPath && (
                <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                  {isAr ? 'أولوية قصوى' : 'High Priority'}
                </span>
              )}
            </div>

            {isCriticalPath && (
              <div className="pt-2 border-t border-purple-200/60 dark:border-purple-900/40 flex items-center justify-between flex-wrap gap-2 text-[11px]">
                <p className="text-purple-800 dark:text-purple-300">
                  {isAr
                    ? 'تنبيه فوري لمدير المشروع وفريق العقود لتوثيق الإخطار وحفظ الحق القانوني (FIDIC 20.1 Time-Bar).'
                    : 'Instant escalation notice dispatched to preserve contractual rights under FIDIC 20.1.'}
                </p>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer font-bold text-purple-950 dark:text-purple-100">
                    <input
                      type="checkbox"
                      checked={createEotDraft}
                      onChange={(e) => setCreateEotDraft(e.target.checked)}
                      className="w-3.5 h-3.5 text-purple-600 rounded border-slate-300 dark:border-slate-700 dark:bg-slate-800"
                    />
                    <span>{isAr ? 'إنشاء مسودة مطالبة تمديد زمني (EOT) تلقائياً' : 'Auto-create EOT Claim Draft'}</span>
                  </label>
                  <a
                    href="/contracts/claims?tab=eots"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-700 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 font-bold underline text-[10px]"
                  >
                    {isAr ? 'سجل المطالبات' : 'Claims Register'} &rarr;
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Row 3: Idle Manpower & Idle Equipment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                <HardHat className="w-4 h-4 text-amber-600" />
                <span>{isAr ? 'عدد العمالة المعطلة (Idle Manpower)' : 'Idle Manpower (Count)'}</span>
              </label>
              <input
                type="number"
                min="0"
                value={idleManpower}
                onChange={(e) => setIdleManpower(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="0"
                data-testid="idle-manpower-input"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-orange-600" />
                <span>{isAr ? 'المعدات المعطلة (Equipment Summary)' : 'Idle Equipment Summary'}</span>
              </label>
              <input
                type="text"
                value={idleEquipmentSummary}
                onChange={(e) => setIdleEquipmentSummary(e.target.value)}
                placeholder={isAr ? 'مثال: حفار 320، 2 لودر كوماتسو، مضخة خرسانة' : 'e.g., 1 Excavator 320, 2 Loaders, 1 Crane'}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 outline-none"
                data-testid="idle-equipment-input"
              />
            </div>
          </div>

          {/* Description Textarea */}
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>{isAr ? 'الوصف التفصيلي والسبب الجذري للإعاقة *' : 'Detailed Description & Root Cause *'}</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                isAr
                  ? 'اكتب شرحاً دقيقاً لواقعة التوقف، رقم الخطاب أو الإيميل الموجه للاستشاري، وتأثير الإعاقة على مسار المشروع...'
                  : 'Describe the obstruction in detail, official transmittal/RFI reference, and path impact...'
              }
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-amber-500 outline-none resize-none"
              data-testid="obstruction-description-input"
            />
          </div>

          {/* Dates & Evidence Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>{isAr ? 'تاريخ بداية الإعاقة' : 'Start Date'}</span>
              </label>
              <input
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                data-testid="start-date-input"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>{isAr ? 'المستند الداعم أو صورة الإثبات' : 'Evidence / Supporting Document'}</span>
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 cursor-pointer transition-colors text-slate-600 dark:text-slate-300 font-medium">
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                  ) : (
                    <UploadCloud className="w-4 h-4 text-amber-600" />
                  )}
                  <span className="truncate">
                    {evidencePath
                      ? (isAr ? 'تم إرفاق المستند ✅' : 'Evidence Attached ✅')
                      : (isAr ? 'رفع صورة / خطاب' : 'Upload photo/letter')}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx"
                    disabled={isUploading}
                    data-testid="evidence-file-input"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              data-testid="cancel-btn"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving || !description.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all disabled:opacity-40 cursor-pointer"
              data-testid="submit-obstruction-btn"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
              <span>{isAr ? 'تسجيل الإعاقة في السجل الرسمي' : 'Save & Log Obstruction'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
