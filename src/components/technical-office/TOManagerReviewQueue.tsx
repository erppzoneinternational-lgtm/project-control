'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Check,
  X,
  CheckCheck,
  Layers,
  Zap,
  Building2,
  FolderKanban,
  Sparkles,
  History,
} from 'lucide-react';
import { Deliverable, DeliverableItem } from '@/types/planning';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { useLanguage } from '@/contexts/LanguageContext';
import { HistoryDrawer } from '@/components/planning/HistoryDrawer';
import {
  TODisciplineBadge,
  detectDeliverableDiscipline,
  isCivilOrStructuralDiscipline,
  isMepOrAquaticsDiscipline,
  isArchitecturalDiscipline,
} from './TODisciplineBadge';
import { toast } from 'sonner';

export type TOManagerQueueSpecialty = 'all' | 'civil_struct' | 'mep_aquatics' | 'architectural';

export interface TOManagerReviewQueueProps {
  deliverables: Deliverable[];
  onRefresh: () => void;
}

const COMMON_REJECTION_REASONS_AR = [
  'تعارض التمديدات الكهروميكانيكية مع المسار الإنشائي وتفاصيل الهيكل',
  'نقص مناسيب أو تفاصيل العزل المائي وحواجز منع تسرب المياه',
  'ملاحظات هندسية على تفريد حديد التسليح وأطوال وصلات التراكب',
  'نقص أبعاد المحاور الإنشائية وتفاصيل التثبيت والربط الميداني',
  'مطلوب استيفاء جداول مطابقة المواد مع كراسة الشروط والمواصفات المعتمدة',
];

const COMMON_REJECTION_REASONS_EN = [
  'MEP Clash with Structural Elements',
  'Missing Waterproofing / Waterstop details & levels',
  'Rebar detailing & lap length discrepancies',
  'Missing grid dimensions & site anchoring details',
  'Missing specification compliance documentation',
];

export const TOManagerReviewQueue: React.FC<TOManagerReviewQueueProps> = ({
  deliverables,
  onRefresh,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [specialtyFilter, setSpecialtyFilter] = useState<TOManagerQueueSpecialty>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectingItemId, setRejectingItemId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [historyItemId, setHistoryItemId] = useState<string | null>(null);
  const [historyItemTitle, setHistoryItemTitle] = useState<string>('');

  // Extract all items pending manager approval
  const queueItems = useMemo(() => {
    const list: (DeliverableItem & { parentPackage?: Deliverable })[] = [];
    deliverables.forEach((d) => {
      (d.items || []).forEach((item) => {
        if (item.status === 'ready_to_return' && !item.to_manager_approved) {
          list.push({
            ...item,
            parentPackage: d,
          });
        }
      });
    });
    return list;
  }, [deliverables]);

  // Filtered by specialty
  const filteredQueueItems = useMemo(() => {
    return queueItems.filter((item) => {
      const disc = detectDeliverableDiscipline(item);
      if (specialtyFilter === 'civil_struct') {
        return isCivilOrStructuralDiscipline(disc);
      }
      if (specialtyFilter === 'mep_aquatics') {
        return isMepOrAquaticsDiscipline(disc);
      }
      if (specialtyFilter === 'architectural') {
        return isArchitecturalDiscipline(disc);
      }
      return true;
    });
  }, [queueItems, specialtyFilter]);

  // Select all toggle
  const allFilteredSelected =
    filteredQueueItems.length > 0 &&
    filteredQueueItems.every((i) => selectedIds.includes(i.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredQueueItems.map((i) => i.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Single Item Approve
  const handleApprove = async (item: DeliverableItem) => {
    setIsProcessing(true);
    try {
      await DeliverablesService.managerApproveItem(item.id);
      toast.success(
        isAr ? 'تم اعتماد المخطط داخلياً وتجهيزه للإرسال للاستشاري' : 'Deliverable approved internally'
      );
      setSelectedIds((prev) => prev.filter((id) => id !== item.id));
      onRefresh();
    } catch {
      toast.error(isAr ? 'فشل الاعتماد' : 'Approval failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Batch Approve
  const handleBatchApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsProcessing(true);
    try {
      await Promise.all(selectedIds.map((id) => DeliverablesService.managerApproveItem(id)));
      toast.success(
        isAr
          ? `تم اعتماد ${selectedIds.length} مخطط بنجاح وتجهيزها للإرسال للاستشاري`
          : `Approved ${selectedIds.length} deliverables internally`
      );
      setSelectedIds([]);
      onRefresh();
    } catch {
      toast.error(isAr ? 'حدث خطأ أثناء الاعتماد الجماعي' : 'Batch approval failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Single Item Reject
  const handleReject = async (itemId: string) => {
    if (!rejectReason.trim()) {
      toast.error(isAr ? 'يرجى كتابة أسباب الإعادة والملاحظات الفنية للمهندس' : 'Please provide comments');
      return;
    }

    setIsProcessing(true);
    try {
      await DeliverablesService.managerRejectItem(itemId, rejectReason.trim());
      toast.success(
        isAr ? 'تمت إعادة المخطط للمهندس مع الملاحظات الفنية للتعديل' : 'Returned to engineer with notes'
      );
      setRejectingItemId(null);
      setRejectReason('');
      setSelectedIds((prev) => prev.filter((id) => id !== itemId));
      onRefresh();
    } catch {
      toast.error(isAr ? 'فشلت إعادة المخطط' : 'Rejection failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const commonReasons = isAr ? COMMON_REJECTION_REASONS_AR : COMMON_REJECTION_REASONS_EN;

  // Empty state when entire review queue is caught up
  if (queueItems.length === 0) {
    return (
      <div className="p-10 sm:p-14 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/80 shadow-inner ring-8 ring-emerald-50/80 dark:ring-emerald-950/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAr ? 'جميع المراجعات مكتملة' : 'All Reviews Caught Up'}</span>
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {isAr ? 'لا توجد مخططات معلقة بانتظار اعتماد مدير المكتب الفني' : 'No deliverables pending TO manager sign-off'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {isAr
                ? 'عند قيام مهندسي المكتب الفني باستكمال المخططات وإحالتها للاعتماد الداخلي، ستظهر مباشرة في هذه القائمة لمراجعتها وتصديرها للاستشاري.'
                : 'When technical office engineers complete drawings and submit them for review, they will queue here for technical sign-off and consultant transmittal.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── 1. Top Controls & Batch Actions ─────────────────────────────── */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{isAr ? 'صندوق الوارد للاعتماد الداخلي لمدير المكتب الفني' : 'TO Manager Internal Sign-off Queue'}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
              {queueItems.length} {isAr ? 'مخطط بانتظار المراجعة' : 'Pending Review'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'مراجعة المخططات ومطابقتها هندسياً قبل اعتمادها الرسمي وإرسالها إلى استشاري المشروع.'
              : 'Review engineer submissions and verify technical compliance before consultant transmittal.'}
          </p>
        </div>

        {/* Batch Approve button */}
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleBatchApprove}
              className="min-h-[40px] px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <CheckCheck className="w-4 h-4" />
              <span>
                {isAr
                  ? `اعتماد المحدد (${selectedIds.length}) دفعة واحدة`
                  : `Batch Approve Selected (${selectedIds.length})`}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2. Specialty Filters ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 me-1 shrink-0">
          {isAr ? 'تصفية حسب التخصص:' : 'Discipline:'}
        </span>

        <button
          type="button"
          onClick={() => setSpecialtyFilter('all')}
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            specialtyFilter === 'all'
              ? 'bg-purple-600 text-white shadow-sm font-black'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
          }`}
        >
          <span>{isAr ? 'كافة التخصصات' : 'All Disciplines'}</span>
          <span className={`ms-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
            specialtyFilter === 'all'
              ? 'bg-purple-900/30 text-purple-200'
              : 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
          }`}>
            {queueItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSpecialtyFilter('civil_struct')}
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            specialtyFilter === 'civil_struct'
              ? 'bg-blue-600 text-white shadow-sm font-black'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>{isAr ? 'مدني وإنشائي' : 'Civil & Struct'}</span>
        </button>

        <button
          type="button"
          onClick={() => setSpecialtyFilter('mep_aquatics')}
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            specialtyFilter === 'mep_aquatics'
              ? 'bg-amber-600 text-white shadow-sm font-black'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isAr ? 'كهروميكانيك ومسابح' : 'MEP & Aquatics'}</span>
        </button>

        <button
          type="button"
          onClick={() => setSpecialtyFilter('architectural')}
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
            specialtyFilter === 'architectural'
              ? 'bg-teal-600 text-white shadow-sm font-black'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>{isAr ? 'معماري وتشطيبات' : 'Architectural'}</span>
        </button>
      </div>

      {/* ── 3. Empty Discipline State ───────────────────────────────────── */}
      {filteredQueueItems.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {isAr ? 'لا توجد مخططات معلقة ضمن هذا التخصص' : 'No deliverables pending in this discipline'}
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              {isAr ? 'يمكنك اختيار تخصص آخر أو العودة لعرض كافة التخصصات.' : 'Select another discipline or switch back to all.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSpecialtyFilter('all')}
            className="min-h-[40px] px-4 py-2 text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {isAr ? 'عرض كافة التخصصات' : 'View All Disciplines'}
          </button>
        </div>
      ) : (
        <>
          {/* ── 4A. Responsive Mobile Cards View (< md) ────────────────────── */}
          <div className="md:hidden space-y-3">
            {filteredQueueItems.map((item) => {
              const disc = detectDeliverableDiscipline(item);
              const isThisRejecting = rejectingItemId === item.id;
              const isSelected = selectedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isSelected
                      ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-300 dark:border-purple-800 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.id)}
                        aria-label={isAr ? `تحديد مخطط ${item.sheet_number || ''}` : `Select ${item.sheet_number || ''}`}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                      />
                      <div>
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white" dir="ltr">
                          {item.sheet_number || (isAr ? 'غير محدد' : 'N/A')}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {item.parentPackage?.ref_code || (isAr ? 'حزمة عامة' : 'General')}
                          </span>
                          <span className="text-slate-300 dark:text-slate-700">•</span>
                          <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-400">
                            {isAr ? `إصدار ${item.current_rev ?? 0}` : `Rev. ${item.current_rev ?? 0}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <TODisciplineBadge discipline={disc} />
                  </div>

                  {/* Card Description */}
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Card Action Buttons */}
                  <div className="pt-1 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHistoryItemId(item.id);
                        setHistoryItemTitle(`${item.sheet_number || ''} - ${item.description || ''}`);
                      }}
                      title={isAr ? 'سجل المراجعات والتاريخ' : 'Event History & Timeline'}
                      className="min-h-[40px] px-3 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                    >
                      <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                      <span>{isAr ? 'السجل' : 'Log'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        if (isThisRejecting) {
                          setRejectingItemId(null);
                          setRejectReason('');
                        } else {
                          setRejectingItemId(item.id);
                          setRejectReason('');
                        }
                      }}
                      className="min-h-[40px] flex-1 px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                    >
                      <X className="w-4 h-4 shrink-0" />
                      <span>{isAr ? 'إعادة بملاحظات' : 'Return w/ Notes'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={isProcessing}
                      onClick={() => handleApprove(item)}
                      className="min-h-[40px] flex-1 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                    >
                      <Check className="w-4 h-4 shrink-0" />
                      <span>{isAr ? 'اعتماد للإرسال' : 'Approve'}</span>
                    </button>
                  </div>

                  {/* Card Rejection Drawer */}
                  {isThisRejecting && (
                    <div className="p-3.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3">
                      <label className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                        {isAr
                          ? 'أسباب عدم الاعتماد وملاحظات التعديل المطلوبة من مهندس المكتب الفني:'
                          : 'Return comments & required modifications:'}
                      </label>

                      {/* Quick comments */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300">
                          {isAr ? 'ملاحظات سريعة جاهزة:' : 'Quick Comments:'}
                        </span>
                        {commonReasons.map((chip, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setRejectReason((prev) => (prev ? `${prev}\n• ${chip}` : `• ${chip}`));
                            }}
                            className="min-h-[34px] text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition font-medium text-start cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                          >
                            + {chip}
                          </button>
                        ))}
                      </div>

                      <textarea
                        rows={3}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder={
                          isAr
                            ? 'يرجى كتابة الملاحظات الهندسية (أو اختيار ملاحظات جاهزة من الأعلى)...'
                            : 'Specify technical corrections needed (or select from quick comments above)...'
                        }
                        className="w-full p-2.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
                      />

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingItemId(null);
                            setRejectReason('');
                          }}
                          className="min-h-[40px] px-3.5 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        >
                          {isAr ? 'إلغاء' : 'Cancel'}
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing || !rejectReason.trim()}
                          onClick={() => handleReject(item.id)}
                          className="min-h-[40px] px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{isAr ? 'تأكيد الإعادة للمهندس' : 'Confirm Return'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── 4B. Desktop Table View (>= md) ─────────────────────────────── */}
          <div className="hidden md:block overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                    <th className="py-3 px-3.5 text-start w-10">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        aria-label={isAr ? 'تحديد الكل' : 'Select all'}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3 text-start">{isAr ? 'رقم المخطط' : 'Sheet #'}</th>
                    <th className="py-3 px-3 text-start">{isAr ? 'التخصص الهندسي' : 'Discipline'}</th>
                    <th className="py-3 px-3 text-start">{isAr ? 'البيان ومعد المخطط' : 'Description'}</th>
                    <th className="py-3 px-3 text-start">{isAr ? 'حزمة الأعمال' : 'Package'}</th>
                    <th className="py-3 px-3 text-start">{isAr ? 'الإصدار' : 'Rev'}</th>
                    <th className="py-3 px-3.5 text-end">{isAr ? 'قرار مدير المكتب الفني' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredQueueItems.map((item) => {
                    const disc = detectDeliverableDiscipline(item);
                    const isThisRejecting = rejectingItemId === item.id;
                    const isSelected = selectedIds.includes(item.id);

                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          className={`hover:bg-slate-50 dark:bg-slate-800/60/60 dark:bg-slate-800/50 dark:hover:bg-slate-800/40 transition-colors ${
                            isSelected ? 'bg-purple-50/40 dark:bg-purple-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-3.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectItem(item.id)}
                              aria-label={isAr ? `تحديد مخطط ${item.sheet_number || ''}` : `Select ${item.sheet_number || ''}`}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-700 dark:bg-slate-800 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-white" dir="ltr">
                            {item.sheet_number || (isAr ? 'غير محدد' : 'N/A')}
                          </td>
                          <td className="py-3 px-3">
                            <TODisciplineBadge discipline={disc} />
                          </td>
                          <td className="py-3 px-3 max-w-sm">
                            <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{item.description}</p>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                            {item.parentPackage?.ref_code || (isAr ? 'حزمة عامة' : 'General')}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-600 dark:text-slate-300">
                            {isAr ? `إصدار ${item.current_rev ?? 0}` : `Rev. ${item.current_rev ?? 0}`}
                          </td>
                          <td className="py-3 px-3.5 text-end">
                            <div className="inline-flex items-center gap-2">
                              {/* History / Audit Log */}
                              <button
                                type="button"
                                onClick={() => {
                                  setHistoryItemId(item.id);
                                  setHistoryItemTitle(`${item.sheet_number || ''} - ${item.description || ''}`);
                                }}
                                title={isAr ? 'سجل المراجعات والتاريخ' : 'Event History & Timeline'}
                                className="min-h-[40px] px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                              >
                                <History className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                                <span>{isAr ? 'السجل' : 'Log'}</span>
                              </button>

                              {/* Reject / Return with notes */}
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => {
                                  if (isThisRejecting) {
                                    setRejectingItemId(null);
                                    setRejectReason('');
                                  } else {
                                    setRejectingItemId(item.id);
                                    setRejectReason('');
                                  }
                                }}
                                className="min-h-[40px] px-3.5 py-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                              >
                                <X className="w-3.5 h-3.5 shrink-0" />
                                <span>{isAr ? 'إعادة بملاحظات' : 'Return w/ Notes'}</span>
                              </button>

                              {/* Approve */}
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => handleApprove(item)}
                                className="min-h-[40px] px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm hover:shadow flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                              >
                                <Check className="w-3.5 h-3.5 shrink-0" />
                                <span>{isAr ? 'اعتماد للإرسال للاستشاري' : 'Approve for Transmittal'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Reject reason expansion row with Quick Punch Chips */}
                        {isThisRejecting && (
                          <tr className="bg-rose-50/50 dark:bg-rose-950/20">
                            <td colSpan={7} className="p-4 space-y-3">
                              <div className="space-y-2">
                                <label className="text-xs font-bold text-rose-900 dark:text-rose-200 block">
                                  {isAr
                                    ? 'أسباب عدم الاعتماد وملاحظات التعديل المطلوبة من مهندس المكتب الفني:'
                                    : 'Return comments & required modifications:'}
                                </label>

                                {/* Quick Punch Comment Chips */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300">
                                    {isAr ? 'ملاحظات سريعة جاهزة:' : 'Quick Comments:'}
                                  </span>
                                  {commonReasons.map((chip, idx) => (
                                    <button
                                      key={idx}
                                      type="button"
                                      onClick={() => {
                                        setRejectReason((prev) => (prev ? `${prev}\n• ${chip}` : `• ${chip}`));
                                      }}
                                      className="min-h-[34px] text-[11px] px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition font-medium text-start cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                                    >
                                      + {chip}
                                    </button>
                                  ))}
                                </div>

                                <textarea
                                  rows={3}
                                  value={rejectReason}
                                  onChange={(e) => setRejectReason(e.target.value)}
                                  placeholder={
                                    isAr
                                      ? 'يرجى كتابة الملاحظات الهندسية (أو اختيار ملاحظات جاهزة من الأعلى)...'
                                      : 'Specify technical corrections needed (or select from quick comments above)...'
                                  }
                                  className="w-full p-3 text-xs rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans"
                                />
                              </div>
                              <div className="flex items-center justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectingItemId(null);
                                    setRejectReason('');
                                  }}
                                  className="min-h-[40px] px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                >
                                  {isAr ? 'إلغاء' : 'Cancel'}
                                </button>
                                <button
                                  type="button"
                                  disabled={isProcessing || !rejectReason.trim()}
                                  onClick={() => handleReject(item.id)}
                                  className="min-h-[40px] px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 flex items-center gap-1.5"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>{isAr ? 'تأكيد الإعادة للمهندس للتعديل' : 'Confirm Return'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Sequential Event History & Audit Log Drawer */}
      <HistoryDrawer
        isOpen={Boolean(historyItemId)}
        onClose={() => setHistoryItemId(null)}
        entityId={historyItemId}
        entityTitle={historyItemTitle}
        mode="deliverable"
      />
    </div>
  );
};
