'use client';

import React, { useState, useEffect, useId, useMemo } from 'react';
import { HseInspection } from '@/types/hse';
import { hseService } from '@/lib/services/hse.service';
import { toast } from 'sonner';
import {
  X,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Calendar,
  User,
  FileText,
  Loader2,
  Check,
  Minus,
} from 'lucide-react';

interface SafetyInspectionModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess: (inspection: HseInspection) => void;
  locale?: string;
  defaultInspector?: string;
}

interface ChecklistItem {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  status: 'safe' | 'unsafe' | 'na';
}

const defaultChecklist: ChecklistItem[] = [
  {
    id: 'ppe',
    titleAr: 'معدات الوقاية الشخصية (PPE)',
    titleEn: 'Personal Protective Equipment (PPE)',
    descriptionAr: 'التزام كامل بالخوذات، الأحذية الآمنة، السترات العاكسة، والنظارات الواقية',
    descriptionEn: 'Full compliance with helmets, safety footwear, high-vis vests, eye protection',
    status: 'safe',
  },
  {
    id: 'scaffolding',
    titleAr: 'السقالات والعمل على ارتفاعات',
    titleEn: 'Scaffolding & Work at Heights',
    descriptionAr: 'وجود حواجز حماية، شباك أمان، كروت تفتيش معتمدة، وأحزمة الأمان ثلاثية النقاط',
    descriptionEn: 'Guardrails, toe-boards, scaffold inspection tags, safety harnesses anchored',
    status: 'safe',
  },
  {
    id: 'electrical',
    titleAr: 'السلامة الكهربائية واللوحات',
    titleEn: 'Electrical Safety & Distribution',
    descriptionAr: 'تأريض اللوحات، قواطع التيار ELCB/GFCI، وسلامة الكابلات والتوصيلات الميدانية',
    descriptionEn: 'Proper grounding, functional ELCB/GFCI breakers, undamaged insulated cables',
    status: 'safe',
  },
  {
    id: 'fire',
    titleAr: 'مكافحة الحريق وأعمال اللحام',
    titleEn: 'Fire Protection & Hot Work',
    descriptionAr: 'توفر طفايات صالحة، تصاريح العمل الساخن، وعزل المواد القابلة للاشتعال',
    descriptionEn: 'Certified extinguishers available, hot work permits in place, fire blankets',
    status: 'safe',
  },
  {
    id: 'excavation',
    titleAr: 'أعمال الحفر وسند الجوانب',
    titleEn: 'Excavation & Shoring',
    descriptionAr: 'تدعيم الجوانب، أسوار تحذيرية حول الحفر، وسلالم دخول وخروج آمنة',
    descriptionEn: 'Adequate shoring/sloping, perimeter barriers, safe entry and exit access',
    status: 'safe',
  },
  {
    id: 'housekeeping',
    titleAr: 'النظافة العامة والممرات الآمنة',
    titleEn: 'Site Housekeeping & Walkways',
    descriptionAr: 'خلو الممرات من العوائق والمسامير والأنقاض، وتوفر صناديق فرز المخلفات',
    descriptionEn: 'Obstacle-free pathways, no protruding nails/debris, waste disposal containers',
    status: 'safe',
  },
  {
    id: 'machinery',
    titleAr: 'المعدات الثقيلة والرافعات',
    titleEn: 'Heavy Equipment & Cranes',
    descriptionAr: 'شهادات فحص سارية، إنذارات الرجوع للخلف، وشهادات معتمدة للمشغلين',
    descriptionEn: 'Valid third-party inspection certificates, backup alarms, certified operators',
    status: 'safe',
  },
];

export const SafetyInspectionModal: React.FC<SafetyInspectionModalProps> = ({
  isOpen,
  projectId,
  onClose,
  onSuccess,
  locale = 'ar',
  defaultInspector = '',
}) => {
  const isAr = locale === 'ar';

  const titleId = useId();
  const descId = useId();
  const inspectorId = useId();
  const dateId = useId();
  const findingsId = useId();

  const [saving, setSaving] = useState(false);
  const [inspectorName, setInspectorName] = useState(defaultInspector);
  const [inspectionDate, setInspectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(defaultChecklist);
  const [stopWorkIssued, setStopWorkIssued] = useState(false);
  const [findings, setFindings] = useState('');
  const [nameError, setNameError] = useState('');

  // Reset when open
  useEffect(() => {
    if (isOpen) {
      setInspectionDate(new Date().toISOString().split('T')[0]);
      setChecklist(defaultChecklist.map((item) => ({ ...item, status: 'safe' })));
      setStopWorkIssued(false);
      setFindings('');
      setNameError('');
      if (defaultInspector) setInspectorName(defaultInspector);
    }
  }, [isOpen, defaultInspector]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute metrics
  const { safeCount, unsafeCount, naCount, scorePct } = useMemo(() => {
    let safe = 0;
    let unsafe = 0;
    let na = 0;
    checklist.forEach((item) => {
      if (item.status === 'safe') safe += 1;
      else if (item.status === 'unsafe') unsafe += 1;
      else na += 1;
    });
    const assessed = safe + unsafe;
    const score = assessed > 0 ? Math.round((safe / assessed) * 100) : 100;
    return { safeCount: safe, unsafeCount: unsafe, naCount: na, scorePct: score };
  }, [checklist]);

  if (!isOpen) return null;

  const handleStatusChange = (id: string, newStatus: 'safe' | 'unsafe' | 'na') => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectorName.trim()) {
      setNameError(isAr ? 'اسم مفتش السلامة مطلوب' : 'Inspector name is required');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<HseInspection> = {
        project_id: projectId,
        inspection_date: inspectionDate,
        inspector_name: inspectorName.trim(),
        score_pct: scorePct,
        safe_acts_count: safeCount,
        unsafe_acts_count: unsafeCount,
        stop_work_issued: stopWorkIssued,
        findings: findings.trim() || (isAr ? 'تمت جولة الفحص الروتينية بنجاح' : 'Routine safety audit completed'),
      };

      const result = await hseService.saveInspection(payload);
      if (result) {
        toast.success(isAr ? 'تم حفظ جولة تفتيش السلامة بنجاح' : 'Safety inspection logged successfully');
        onSuccess(result);
        onClose();
      }
    } catch (err: any) {
      console.error('Error saving inspection', err);
      toast.error(isAr ? 'فشل حفظ جولة التفتيش' : 'Failed to save inspection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      dir="rtl"
    >
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 my-8 relative overflow-hidden">
        {/* Top Accent Band */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 id={titleId} className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {isAr ? 'قائمة الفحص الميداني وجولة السلامة (Safety Checklist)' : 'Safety Inspection & Audit Checklist'}
              </h2>
              <p id={descId} className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'تسجيل وتقييم نقاط السلامة الميدانية وحساب نسبة الامتثال وإصدار أوامر إيقاف العمل إن لزم'
                  : 'Evaluate on-site safety checkpoints, compute compliance score, and manage stop-work orders'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Score & Summary Banner */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {scorePct}%
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isAr ? 'نسبة الامتثال للسلامة' : 'Safety Compliance Score'}
              </p>
              <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full transition-all duration-300 ${
                    scorePct >= 90 ? 'bg-emerald-500' : scorePct >= 75 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${scorePct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{safeCount} {isAr ? 'أفعال آمنة' : 'Safe Acts'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
              <span>{unsafeCount} {isAr ? 'أفعال غير آمنة' : 'Unsafe Acts'}</span>
            </div>
            {naCount > 0 && (
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <Minus className="w-4 h-4" />
                <span>{naCount} {isAr ? 'غير منطبق' : 'N/A'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5 mt-5">
          {/* Inspector & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={inspectorId}
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {isAr ? 'اسم مفتش السلامة المسئول *' : 'Safety Inspector Name *'}
              </label>
              <div className="relative">
                <input
                  id={inspectorId}
                  type="text"
                  required
                  aria-required="true"
                  placeholder={isAr ? 'مثال: م. مصطفى كمال (HSE Officer)' : 'e.g. Eng. Mostafa Kamal'}
                  value={inspectorName}
                  onChange={(e) => {
                    setInspectorName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all ${
                    nameError ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                />
              </div>
              {nameError && (
                <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  {nameError}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={dateId}
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {isAr ? 'تاريخ التفتيش *' : 'Inspection Date *'}
              </label>
              <input
                id={dateId}
                type="date"
                required
                aria-required="true"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all dark:[color-scheme:dark]"
              />
            </div>
          </div>

          {/* Interactive Checklist Items */}
          <div>
            <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {isAr ? 'بنود قائمة الفحص الميداني (Checklist Items)' : 'Safety Checklist Items'}
            </span>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {isAr ? item.titleAr : item.titleEn}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isAr ? item.descriptionAr : item.descriptionEn}
                    </p>
                  </div>

                  {/* Accessible Segmented Radio/Button Group */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, 'safe')}
                      aria-pressed={item.status === 'safe'}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        item.status === 'safe'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مطابق' : 'Safe'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, 'unsafe')}
                      aria-pressed={item.status === 'unsafe'}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        item.status === 'unsafe'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مخالف' : 'Unsafe'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusChange(item.id, 'na')}
                      aria-pressed={item.status === 'na'}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                        item.status === 'na'
                          ? 'bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <span>N/A</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stop Work Order Toggle */}
          <div className="p-3.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  {isAr ? 'إصدار أمر إيقاف عمل (Stop Work Order)' : 'Issue Stop Work Order'}
                </p>
                <p className="text-[11px] text-rose-700 dark:text-rose-300/80">
                  {isAr
                    ? 'يتم تفعيله فوراً في حال رصد خطر وشيك يهدد سلامة وحياة العاملين بالموقع'
                    : 'Mandatory halt in case of imminent danger or critical life-threatening conditions'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={stopWorkIssued}
                onChange={(e) => setStopWorkIssued(e.target.checked)}
                className="sr-only peer"
                aria-label={isAr ? 'تفعيل أمر إيقاف العمل' : 'Toggle Stop Work Order'}
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-rose-500 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 dark:after:border-slate-600 peer-checked:bg-rose-600"></div>
            </label>
          </div>

          {/* Findings & Notes */}
          <div>
            <label
              htmlFor={findingsId}
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {isAr ? 'الملاحظات والنتائج التفصيلية (Inspection Findings)' : 'Inspection Findings & Notes'}
            </label>
            <textarea
              id={findingsId}
              rows={2}
              placeholder={
                isAr
                  ? 'تدوين الملاحظات الميدانية، الأماكن التي تحتاج تصحيح، والتعليمات الصادرة للمقاولين...'
                  : 'Document specific on-site observations, corrective instructions to contractors...'
              }
              value={findings}
              onChange={(e) => setFindings(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600 cursor-pointer"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-teal-500/20 disabled:opacity-50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>{isAr ? 'جاري حفظ الجولة...' : 'Saving Inspection...'}</span>
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-4 h-4" aria-hidden="true" />
                  <span>{isAr ? 'اعتماد وحفظ نتائج الفحص' : 'Save Inspection Report'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SafetyInspectionModal;
