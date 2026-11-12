'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardCheck, 
  FileCheck2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Loader2, 
  Calendar, 
  Wrench, 
  BookOpen, 
  Users, 
  ShieldCheck,
  Check,
  FileText
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export interface HandoverChecklistData {
  toc_received: boolean;
  toc_reference?: string;
  snag_list_completed: boolean;
  snag_list_type: 'no_snags' | 'minor_only' | 'critical_pending';
  snag_clearance_days: number;
  testing_commissioning_passed: boolean;
  as_built_submitted: boolean;
  om_manuals_submitted: boolean;
  client_training_completed: boolean;
  dlp_start_date: string;
  handover_notes?: string;
  handover_at?: string;
}

export interface HandoverProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    tocLetter: string;
    checklist: HandoverChecklistData;
  }) => Promise<void>;
  projectName?: string;
  currentTocLetter?: string;
  currentChecklist?: Partial<HandoverChecklistData>;
  loading?: boolean;
}

export const HandoverProjectModal: React.FC<HandoverProjectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  projectName = '',
  currentTocLetter = '',
  currentChecklist,
  loading = false,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  // Form State
  const [tocReceived, setTocReceived] = useState(true);
  const [tocReference, setTocReference] = useState('');
  const [snagListCompleted, setSnagListCompleted] = useState(true);
  const [snagListType, setSnagListType] = useState<'no_snags' | 'minor_only' | 'critical_pending'>('minor_only');
  const [snagClearanceDays, setSnagClearanceDays] = useState(14);
  const [testingCommissioningPassed, setTestingCommissioningPassed] = useState(true);
  const [asBuiltSubmitted, setAsBuiltSubmitted] = useState(true);
  const [omManualsSubmitted, setOmManualsSubmitted] = useState(true);
  const [clientTrainingCompleted, setClientTrainingCompleted] = useState(true);
  const [dlpStartDate, setDlpStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg('');
      setTocReceived(currentChecklist?.toc_received ?? (currentTocLetter ? currentTocLetter !== 'غير متاح' && currentTocLetter !== 'غير موجود' : true));
      setTocReference(currentChecklist?.toc_reference || (currentTocLetter && currentTocLetter !== 'غير متاح' && currentTocLetter !== 'غير موجود' ? currentTocLetter : ''));
      setSnagListCompleted(currentChecklist?.snag_list_completed ?? true);
      setSnagListType(currentChecklist?.snag_list_type ?? 'minor_only');
      setSnagClearanceDays(currentChecklist?.snag_clearance_days ?? 14);
      setTestingCommissioningPassed(currentChecklist?.testing_commissioning_passed ?? true);
      setAsBuiltSubmitted(currentChecklist?.as_built_submitted ?? true);
      setOmManualsSubmitted(currentChecklist?.om_manuals_submitted ?? true);
      setClientTrainingCompleted(currentChecklist?.client_training_completed ?? true);
      setDlpStartDate(currentChecklist?.dlp_start_date || new Date().toISOString().split('T')[0]);
      setHandoverNotes(currentChecklist?.handover_notes || '');
    }
  }, [isOpen, currentTocLetter, currentChecklist]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || loading) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // PMI Invariant: If critical defects are pending, cannot complete handover without explicit justification
    if (snagListCompleted && snagListType === 'critical_pending' && !handoverNotes.trim()) {
      setErrorMsg(
        isAr
          ? 'توجد ملاحظات حرجة معلقة، يرجى كتابة مبررات التسليم المشروط وخطة المعالجة في حقل الملاحظات'
          : 'Critical snags pending. Please provide conditional handover justification in the notes field.'
      );
      return;
    }

    const calculatedTocLetter = tocReceived
      ? (tocReference.trim() || (isAr ? 'معتمد بمحضر استلام ابتدائي (TOC)' : 'Approved via Taking-Over Certificate (TOC)'))
      : (isAr ? 'قيد استيفاء شهادة TOC' : 'Pending TOC Issuance');

    const checklistPayload: HandoverChecklistData = {
      toc_received: tocReceived,
      toc_reference: tocReference.trim() || undefined,
      snag_list_completed: snagListCompleted,
      snag_list_type: snagListType,
      snag_clearance_days: Number(snagClearanceDays) || 0,
      testing_commissioning_passed: testingCommissioningPassed,
      as_built_submitted: asBuiltSubmitted,
      om_manuals_submitted: omManualsSubmitted,
      client_training_completed: clientTrainingCompleted,
      dlp_start_date: dlpStartDate,
      handover_notes: handoverNotes.trim() || undefined,
      handover_at: new Date().toISOString(),
    };

    await onConfirm({
      tocLetter: calculatedTocLetter,
      checklist: checklistPayload,
    });
  };

  return (
    <div
      id="handover_project_modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="handover_modal_title"
      aria-describedby="handover_modal_desc"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-slate-900 dark:text-slate-100"
      >
        {/* Decorative Top Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center justify-center shrink-0 shadow-xs">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border border-purple-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  PMI Project Closeout / Handover
                </span>
                {projectName && (
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-xs">
                    {projectName}
                  </span>
                )}
              </div>
              <h3 id="handover_modal_title" className="text-lg sm:text-xl font-black text-slate-900 dark:text-white leading-tight">
                {isAr ? 'إجراءات ومحضر التسليم الابتدائي (Handover Gate)' : 'Substantial Handover Verification Gate'}
              </h3>
              <p id="handover_modal_desc" className="text-xs text-slate-500 dark:text-slate-400">
                {isAr 
                  ? 'التحقق الإلزامي من متطلبات إغلاق المرحلة والتسليم الابتدائي طبقاً لمعايير PMI و FIDIC'
                  : 'Mandatory verification of stage completion and taking-over requirements per PMI & FIDIC standards'}
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="min-w-[44px] min-h-[44px] p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
            aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Scrollable PMI Questions */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-rose-700 dark:text-rose-300 text-xs font-bold animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. TOC (Taking-Over Certificate) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <FileCheck2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <label htmlFor="toc_received_checkbox" className="text-xs font-black text-slate-900 dark:text-white cursor-pointer block">
                    {isAr 
                      ? '1. شهادة الاستلام الابتدائي (TOC - Taking-Over Certificate)' 
                      : '1. Taking-Over Certificate (TOC)'}
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr 
                      ? 'هل تم استلام محضر أو شهادة الاستلام الابتدائي موقعة من العميل أو الاستشاري؟'
                      : 'Has the official TOC / Substantial Completion certificate been signed and received?'}
                  </p>
                </div>
              </div>

              <input
                id="toc_received_checkbox"
                type="checkbox"
                checked={tocReceived}
                onChange={(e) => setTocReceived(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded-lg text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
              />
            </div>

            {tocReceived && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <label htmlFor="toc_reference_input" className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'رقم أو مرجع أو مسار شهادة TOC بالمستندات:' : 'TOC Document Reference / File Path:'}
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="toc_reference_input"
                    type="text"
                    value={tocReference}
                    onChange={(e) => setTocReference(e.target.value)}
                    placeholder={isAr ? 'مثال: محضر رقم TOC-2026/04 معتمد من دار الهندسة' : 'e.g. Approved TOC-2026/04'}
                    className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Snag List / Punch List */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <label htmlFor="snag_list_checkbox" className="text-xs font-black text-slate-900 dark:text-white cursor-pointer block">
                    {isAr 
                      ? '2. قائمة الملاحظات والنواقص (Snag List / Punch List)' 
                      : '2. Punch / Snag List Verification'}
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr 
                      ? 'هل تم حصر الملاحظات المشتركة مع الاستشاري وتحديد برنامج تلافيها؟' 
                      : 'Has the joint inspection punch list been generated and agreed with consultant?'}
                  </p>
                </div>
              </div>

              <input
                id="snag_list_checkbox"
                type="checkbox"
                checked={snagListCompleted}
                onChange={(e) => setSnagListCompleted(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded-lg text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
              />
            </div>

            {snagListCompleted && (
              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 space-y-2.5">
                <div>
                  <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'طبيعة ومستوى الملاحظات المرصودة:' : 'Snag List Severity:'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSnagListType('no_snags')}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-start cursor-pointer flex items-center justify-between ${
                        snagListType === 'no_snags'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>{isAr ? 'بدون ملاحظات (نظيف)' : 'No Snags (Clean)'}</span>
                      {snagListType === 'no_snags' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSnagListType('minor_only')}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-start cursor-pointer flex items-center justify-between ${
                        snagListType === 'minor_only'
                          ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-300'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>{isAr ? 'ملاحظات تشطيبية طفيفة' : 'Minor Cosmetic'}</span>
                      {snagListType === 'minor_only' && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSnagListType('critical_pending')}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-start cursor-pointer flex items-center justify-between ${
                        snagListType === 'critical_pending'
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-300'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>{isAr ? 'ملاحظات حرجة معلقة' : 'Critical Pending'}</span>
                      {snagListType === 'critical_pending' && <Check className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <label htmlFor="snag_clearance_days_input" className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {isAr ? 'المدة المحددة لتلافي الملاحظات (أيام):' : 'Clearance Period (Days):'}
                  </label>
                  <input
                    id="snag_clearance_days_input"
                    type="number"
                    min="0"
                    max="90"
                    value={snagClearanceDays}
                    onChange={(e) => setSnagClearanceDays(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 px-2.5 py-1 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-center font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 3. Testing & Commissioning (T&C) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <label htmlFor="tc_checkbox" className="text-xs font-black text-slate-900 dark:text-white cursor-pointer block">
                    {isAr 
                      ? '3. اختبارات التشغيل والجاهزية (Testing & Commissioning - T&C)' 
                      : '3. Testing & Commissioning (T&C)'}
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr 
                      ? 'تشغيل الطلمبات والفلاتر، فحص ضغوط الشبكات، التوازن الكيميائي، واختبارات العزل المائي.' 
                      : 'Electromechanical pumps, filtration, hydrostatic pressure, water chemistry & waterproofing tests.'}
                  </p>
                </div>
              </div>

              <input
                id="tc_checkbox"
                type="checkbox"
                checked={testingCommissioningPassed}
                onChange={(e) => setTestingCommissioningPassed(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded-lg text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
              />
            </div>
          </div>

          {/* 4. As-Built & O&M Deliverables Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* As-Built Drawings */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2">
                <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <label htmlFor="asbuilt_checkbox" className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer block">
                    {isAr ? '4. المخططات المنفذة (As-Built)' : '4. As-Built Drawings'}
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isAr ? 'تسليم الرسومات النهائية المنفذة' : 'Final redline drawings submitted'}
                  </p>
                </div>
              </div>
              <input
                id="asbuilt_checkbox"
                type="checkbox"
                checked={asBuiltSubmitted}
                onChange={(e) => setAsBuiltSubmitted(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
              />
            </div>

            {/* O&M Manuals & Warranties */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <label htmlFor="om_checkbox" className="text-xs font-bold text-slate-900 dark:text-white cursor-pointer block">
                    {isAr ? '5. كتالوجات التشغيل والضمان' : '5. O&M & Warranties'}
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {isAr ? 'كتالوجات الصيانة وضمانات المعدات' : 'Manuals and equipment warranty cards'}
                  </p>
                </div>
              </div>
              <input
                id="om_checkbox"
                type="checkbox"
                checked={omManualsSubmitted}
                onChange={(e) => setOmManualsSubmitted(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
              />
            </div>
          </div>

          {/* 5. Client Training & DLP Date */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <label htmlFor="training_checkbox" className="text-xs font-black text-slate-900 dark:text-white cursor-pointer block">
                    {isAr ? '6. تدريب طاقم التشغيل والصيانة' : '6. Client Operator Training'}
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAr ? 'تم تدريب فنيي العميل على تشغيل المنشأة وإجراءات الصيانة الدورية.' : 'Client personnel trained on operations and routine maintenance.'}
                  </p>
                </div>
              </div>

              <input
                id="training_checkbox"
                type="checkbox"
                checked={clientTrainingCompleted}
                onChange={(e) => setClientTrainingCompleted(e.target.checked)}
                className="w-5 h-5 mt-0.5 rounded-lg text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
              />
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{isAr ? 'تاريخ بدء فترة الضمان والصيانة (DLP Start):' : 'DLP / Warranty Period Start Date:'}</span>
              </div>
              <input
                type="date"
                value={dlpStartDate}
                onChange={(e) => setDlpStartDate(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          {/* 6. Handover Notes & Justification */}
          <div>
            <label htmlFor="handover_notes_textarea" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {isAr ? 'ملاحظات وتوصيات لجنة الاستلام الابتدائي (PM Handover Notes):' : 'PM Handover Notes & Recommendations:'}
            </label>
            <textarea
              id="handover_notes_textarea"
              rows={2}
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              placeholder={isAr ? 'سجل أي شروط خاصة بالتسليم أو ملحوظات مهندس المشروع...' : 'Enter handover remarks, conditions, or consultant stipulations...'}
              className="w-full p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] cursor-pointer disabled:opacity-50"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 min-h-[44px] cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري الاعتماد...' : 'Confirming...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isAr ? 'اعتماد التسليم الابتدائي (Confirm Handover)' : 'Confirm Handover'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
