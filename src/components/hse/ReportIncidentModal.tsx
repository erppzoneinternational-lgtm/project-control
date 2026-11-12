'use client';

import React, { useState, useEffect, useId } from 'react';
import { HseIncident, IncidentSeverity } from '@/types/hse';
import { hseService } from '@/lib/services/hse.service';
import { toast } from 'sonner';
import {
  X,
  AlertTriangle,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import HseSeverityBadge from './HseSeverityBadge';

interface ReportIncidentModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess: (incident: HseIncident) => void;
  locale?: string;
  existingCount?: number;
}

export const ReportIncidentModal: React.FC<ReportIncidentModalProps> = ({
  isOpen,
  projectId,
  onClose,
  onSuccess,
  locale = 'ar',
  existingCount = 0,
}) => {
  const isAr = locale === 'ar';

  const titleId = useId();
  const descId = useId();
  const dateId = useId();
  const numberId = useId();
  const titleArId = useId();
  const titleEnId = useId();
  const severityId = useId();
  const locationId = useId();
  const injuriesId = useId();
  const rootCauseId = useId();
  const capaId = useId();
  const statusId = useId();

  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const defaultIncidentNumber = `INC-${new Date().getFullYear()}-${String(existingCount + 1).padStart(3, '0')}`;
  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<{
    incident_number: string;
    incident_date: string;
    severity: IncidentSeverity;
    title_ar: string;
    title_en: string;
    location_description: string;
    injury_count: number;
    root_cause: string;
    corrective_actions: string;
    status: 'reported' | 'investigating' | 'closed';
  }>({
    incident_number: defaultIncidentNumber,
    incident_date: todayStr,
    severity: 'near_miss',
    title_ar: '',
    title_en: '',
    location_description: '',
    injury_count: 0,
    root_cause: '',
    corrective_actions: '',
    status: 'reported',
  });

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setFormData({
        incident_number: `INC-${new Date().getFullYear()}-${String(existingCount + 1).padStart(3, '0')}`,
        incident_date: new Date().toISOString().split('T')[0],
        severity: 'near_miss',
        title_ar: '',
        title_en: '',
        location_description: '',
        injury_count: 0,
        root_cause: '',
        corrective_actions: '',
        status: 'reported',
      });
      setErrors({});
    }
  }, [isOpen, existingCount]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.incident_number.trim()) {
      errs.incident_number = isAr ? 'رقم الحادث مطلوب' : 'Incident number is required';
    }
    if (!formData.incident_date) {
      errs.incident_date = isAr ? 'تاريخ الحادث مطلوب' : 'Incident date is required';
    }
    if (!formData.title_ar.trim()) {
      errs.title_ar = isAr ? 'عنوان الحادث بالعربية مطلوب' : 'Arabic title is required';
    }
    if (formData.injury_count < 0) {
      errs.injury_count = isAr ? 'عدد الإصابات لا يمكن أن يكون سالباً' : 'Injury count cannot be negative';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const payload: Partial<HseIncident> = {
        project_id: projectId,
        incident_number: formData.incident_number.trim(),
        incident_date: formData.incident_date,
        severity: formData.severity,
        title_ar: formData.title_ar.trim(),
        title_en: formData.title_en.trim() || formData.title_ar.trim(),
        location_description: formData.location_description.trim(),
        injury_count: Number(formData.injury_count) || 0,
        root_cause: formData.root_cause.trim(),
        corrective_actions: formData.corrective_actions.trim(),
        status: formData.status,
      };

      const result = await hseService.saveIncident(payload);
      if (result) {
        toast.success(isAr ? 'تم تسجيل الحادث بنجاح في السجل الرسمي' : 'Incident recorded successfully');
        onSuccess(result);
        onClose();
      }
    } catch (err: any) {
      console.error('Error saving incident', err);
      toast.error(isAr ? 'فشل حفظ الحادث: تحقق من البيانات وحاول مجدداً' : 'Failed to record incident');
    } finally {
      setSaving(false);
    }
  };

  const severityOptions: { value: IncidentSeverity; tier: 'low' | 'medium' | 'high' | 'critical'; titleAr: string; titleEn: string; descAr: string; descEn: string }[] = [
    {
      value: 'near_miss',
      tier: 'low',
      titleAr: 'وشيك الحدوث (Near Miss)',
      titleEn: 'Near Miss',
      descAr: 'حادث كاد أن يقع دون وقوع أي إصابات أو خسائر مادية',
      descEn: 'Unplanned event that did not result in injury or damage',
    },
    {
      value: 'first_aid',
      tier: 'low',
      titleAr: 'إسعافات أولية (First Aid)',
      titleEn: 'First Aid',
      descAr: 'إصابة طفيفة تم التعامل معها في الموقع دون تحويل طبي',
      descEn: 'Minor injury treated on site without lost time or clinic referral',
    },
    {
      value: 'medical_treatment',
      tier: 'medium',
      titleAr: 'علاج طبي (Medical Treatment)',
      titleEn: 'Medical Treatment',
      descAr: 'إصابة تطلبت عناية طبية خارجية دون توقف عن العمل لأيام',
      descEn: 'Injury requiring physician care beyond first aid, no lost work days',
    },
    {
      value: 'lost_time',
      tier: 'high',
      titleAr: 'إصابة وقت ضائع (Lost Time Injury - LTI)',
      titleEn: 'Lost Time Injury (LTI)',
      descAr: 'إصابة عمل أدت إلى غياب العامل يوم عمل كامل أو أكثر',
      descEn: 'Work-related injury resulting in one or more days away from work',
    },
    {
      value: 'fatal',
      tier: 'critical',
      titleAr: 'حادث جسيم / وفاة (Fatal / Critical)',
      titleEn: 'Fatal / Critical',
      descAr: 'إعاقة مستديمة أو حالة وفاة أو حادث هيكلي كارثي',
      descEn: 'Permanent disability, fatality, or catastrophic site failure',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      dir="rtl"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 my-8 relative overflow-hidden">
        {/* Top Accent Band */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-600" />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h2 id={titleId} className="text-xl font-bold text-slate-900 dark:text-white">
                {isAr ? 'إبلاغ عن واقعة / حادث سلامة وصحة مهنية' : 'Report HSE Incident / Event'}
              </h2>
              <p id={descId} className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'تسجيل رسمي للواقعة في سجلات HSE بالمشروع لتوثيق تحليل الأسباب والإجراءات التصحيحية'
                  : 'Official record in project HSE logs for root cause analysis and corrective action tracking'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5 mt-5">
          {/* Row 1: Incident # and Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={numberId}
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {isAr ? 'رقم الحادث التعريفي *' : 'Incident Number *'}
              </label>
              <input
                id={numberId}
                type="text"
                required
                aria-required="true"
                aria-invalid={!!errors.incident_number}
                aria-describedby={errors.incident_number ? `${numberId}-error` : undefined}
                value={formData.incident_number}
                onChange={(e) => setFormData((p) => ({ ...p, incident_number: e.target.value }))}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  errors.incident_number
                    ? 'border-rose-500 dark:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.incident_number && (
                <p id={`${numberId}-error`} role="alert" className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  {errors.incident_number}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={dateId}
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {isAr ? 'تاريخ الحادث *' : 'Incident Date *'}
              </label>
              <div className="relative">
                <input
                  id={dateId}
                  type="date"
                  required
                  aria-required="true"
                  aria-invalid={!!errors.incident_date}
                  aria-describedby={errors.incident_date ? `${dateId}-error` : undefined}
                  value={formData.incident_date}
                  onChange={(e) => setFormData((p) => ({ ...p, incident_date: e.target.value }))}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark] focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                    errors.incident_date
                      ? 'border-rose-500 dark:border-rose-500'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {errors.incident_date && (
                <p id={`${dateId}-error`} role="alert" className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  {errors.incident_date}
                </p>
              )}
            </div>
          </div>

          {/* Row 2: Severity Level Selector with Accessible Contrast & Descriptions */}
          <div>
            <label
              htmlFor={severityId}
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {isAr ? 'مستوى الخطورة والتصنيف (Severity Level) *' : 'Severity Level & Classification *'}
            </label>
            <div className="space-y-2">
              <select
                id={severityId}
                value={formData.severity}
                onChange={(e) => setFormData((p) => ({ ...p, severity: e.target.value as IncidentSeverity }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                {severityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {isAr ? `${opt.titleAr} - ${opt.descAr}` : `${opt.titleEn} - ${opt.descEn}`}
                  </option>
                ))}
              </select>

              {/* Active Severity Preview Badge */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {isAr ? 'شارة التصنيف المعتمدة:' : 'Active Classification Badge:'}
                </span>
                <HseSeverityBadge severity={formData.severity} locale={locale} size="md" />
              </div>
            </div>
          </div>

          {/* Row 3: Titles (Arabic & English) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor={titleArId}
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {isAr ? 'عنوان الحادث (بالعربية) *' : 'Incident Title (Arabic) *'}
              </label>
              <input
                id={titleArId}
                type="text"
                required
                aria-required="true"
                dir="rtl"
                placeholder={isAr ? 'مثال: سقوط سلة مواد في المنطقة ب' : 'e.g. Material fall near Zone B'}
                aria-invalid={!!errors.title_ar}
                aria-describedby={errors.title_ar ? `${titleArId}-error` : undefined}
                value={formData.title_ar}
                onChange={(e) => setFormData((p) => ({ ...p, title_ar: e.target.value }))}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all ${
                  errors.title_ar
                    ? 'border-rose-500 dark:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              />
              {errors.title_ar && (
                <p id={`${titleArId}-error`} role="alert" className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                  {errors.title_ar}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor={titleEnId}
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {isAr ? 'عنوان الحادث (بالإنجليزية)' : 'Incident Title (English)'}
              </label>
              <input
                id={titleEnId}
                type="text"
                dir="ltr"
                placeholder="e.g. Scaffolding plank slippage at Zone 3"
                value={formData.title_en}
                onChange={(e) => setFormData((p) => ({ ...p, title_en: e.target.value }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Row 4: Location & Injury Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor={locationId}
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {isAr ? 'موقع الحادث بالمشروع' : 'Location / Site Zone'}
              </label>
              <div className="relative">
                <input
                  id={locationId}
                  type="text"
                  placeholder={isAr ? 'مثال: البرج A - الدور الرابع - مصعد الخدمة' : 'e.g. Tower A - Level 4'}
                  value={formData.location_description}
                  onChange={(e) => setFormData((p) => ({ ...p, location_description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor={injuriesId}
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                {isAr ? 'عدد الإصابات' : 'Injury Count'}
              </label>
              <input
                id={injuriesId}
                type="number"
                min="0"
                value={formData.injury_count}
                onChange={(e) => setFormData((p) => ({ ...p, injury_count: parseInt(e.target.value, 10) || 0 }))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Row 5: Root Cause Analysis */}
          <div>
            <label
              htmlFor={rootCauseId}
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {isAr ? 'تحليل السبب الجذري (Root Cause Analysis)' : 'Root Cause Analysis'}
            </label>
            <textarea
              id={rootCauseId}
              rows={2}
              placeholder={
                isAr
                  ? 'بيان الأسباب الفنية أو السلوكية المباشرة وغير المباشرة لوقوع الواقعة...'
                  : 'Direct and indirect technical or human causes leading to the event...'
              }
              value={formData.root_cause}
              onChange={(e) => setFormData((p) => ({ ...p, root_cause: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Row 6: Corrective & Preventive Actions (CAPA) */}
          <div>
            <label
              htmlFor={capaId}
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {isAr
                ? 'الإجراءات التصحيحية والوقائية الفورية (Corrective Actions)'
                : 'Corrective & Preventive Actions (CAPA)'}
            </label>
            <textarea
              id={capaId}
              rows={2}
              placeholder={
                isAr
                  ? 'الإجراءات المتخذة فوراً والتدابير لمنع تكرار الحادث مستقبلاً...'
                  : 'Immediate actions taken and preventive measures to avoid recurrence...'
              }
              value={formData.corrective_actions}
              onChange={(e) => setFormData((p) => ({ ...p, corrective_actions: e.target.value }))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Row 7: Status */}
          <div>
            <label
              htmlFor={statusId}
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5"
            >
              {isAr ? 'حالة البلاغ الحالية' : 'Initial Status'}
            </label>
            <select
              id={statusId}
              value={formData.status}
              onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as any }))}
              className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="reported" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? 'تم الإبلاغ (قيد الفحص الأولي)' : 'Reported (Pending review)'}</option>
              <option value="investigating" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? 'قيد التحقيق الفني' : 'Under Investigation'}</option>
              <option value="closed" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">{isAr ? 'مغلق ومكتمل الإجراءات' : 'Closed & Resolved'}</option>
            </select>
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 dark:focus:ring-slate-600"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>{isAr ? 'جاري تسجيل الحادث...' : 'Recording Incident...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  <span>{isAr ? 'تسجيل الحادث في السجل' : 'Record Incident'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncidentModal;
