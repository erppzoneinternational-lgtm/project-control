'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileCheck,
  Loader2,
  Send,
  Camera,
  Building2,
  RotateCw,
  LayoutGrid,
  List,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { InspectionRequest } from '@/types/task-ontology';
import { TaskOntologyService } from '@/lib/services/taskOntology.service';
import { ProjectService } from '@/lib/services/project.service';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface Props {
  inspections?: InspectionRequest[];
  projectId?: string;
  onRefresh?: () => void;
  crossProject?: boolean;
}

export default function QCInspectionQueue({ inspections = [], projectId, onRefresh, crossProject = false }: Props) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [crossInspections, setCrossInspections] = useState<InspectionRequest[]>([]);
  const [loadingCross, setLoadingCross] = useState(false);
  const [projectMap, setProjectMap] = useState<Map<string, { name_ar?: string; name_en?: string; code?: string }>>(new Map());

  const [selectedInsp, setSelectedInsp] = useState<InspectionRequest | null>(null);
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null);
  const [reason, setReason] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 1. Cross-Project Data Fetching
  const fetchCrossData = useCallback(async () => {
    if (!crossProject) return;
    setLoadingCross(true);
    try {
      const [inspList, prjList] = await Promise.all([
        TaskOntologyService.listInspections(undefined, 'pending'),
        ProjectService.getProjects().catch(() => []),
      ]);

      const pMap = new Map<string, { name_ar?: string; name_en?: string; code?: string }>();
      (prjList || []).forEach((p) => {
        pMap.set(p.id, {
          name_ar: p.name_ar || p.project_name,
          name_en: p.name_en,
          code: p.code || p.project_code,
        });
      });
      setProjectMap(pMap);

      // Sort by required_at ASC (most urgent first)
      const sorted = (inspList || []).sort((a, b) => {
        const dateA = a.required_at ? new Date(a.required_at).getTime() : 0;
        const dateB = b.required_at ? new Date(b.required_at).getTime() : 0;
        return dateA - dateB;
      });

      setCrossInspections(sorted);
    } catch (err) {
      logger.error('Failed to fetch cross-project inspections', { detail: err });
    } finally {
      setLoadingCross(false);
    }
  }, [crossProject]);

  useEffect(() => {
    if (crossProject) {
      fetchCrossData();
    }
  }, [crossProject, fetchCrossData]);

  // 2. Compute pending inspections based on mode
  const pendingInspections = useMemo(() => {
    if (crossProject) {
      return crossInspections;
    }
    return (inspections || [])
      .filter((i) => i.status === 'pending')
      .sort((a, b) => {
        const dateA = a.required_at ? new Date(a.required_at).getTime() : 0;
        const dateB = b.required_at ? new Date(b.required_at).getTime() : 0;
        return dateA - dateB;
      });
  }, [crossProject, crossInspections, inspections]);

  // Project label helper
  const getProjectName = useCallback(
    (insp: InspectionRequest) => {
      if (insp.project_name_ar || insp.project_name_en || insp.project_code) {
        const code = insp.project_code ? `[${insp.project_code}] ` : '';
        const name = isAr
          ? insp.project_name_ar || insp.project_name_en || insp.project_code
          : insp.project_name_en || insp.project_name_ar || insp.project_code;
        return `${code}${name}`;
      }
      const info = projectMap.get(insp.project_id);
      if (info) {
        const code = info.code ? `[${info.code}] ` : '';
        const name = isAr
          ? info.name_ar || info.name_en || info.code
          : info.name_en || info.name_ar || info.code;
        return `${code}${name}`;
      }
      return isAr ? 'مشروع غير محدد' : 'Unknown Project';
    },
    [isAr, projectMap]
  );

  // Inspection type label helper
  const getInspectionTypeLabel = useCallback(
    (type?: string) => {
      if (!type) return isAr ? 'طلب فحص' : 'Inspection';
      const mapAr: Record<string, string> = {
        wir: 'استلام أعمال',
        mir: 'استلام مواد',
        surv: 'مسح مساحي',
        mockup: 'فحص عينة معتمدة',
        site: 'فحص موقعي',
        final: 'استلام نهائي',
        safety: 'فحص سلامة مهنية',
      };
      if (isAr) {
        return mapAr[type.toLowerCase()] || type;
      }
      return type.toUpperCase();
    },
    [isAr]
  );

  const handleDecision = async () => {
    if (!selectedInsp || !decision) return;
    const isMock =
      !selectedInsp.id ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(selectedInsp.id) ||
      selectedInsp.id.startsWith('insp-mock-');

    if (isMock) {
      toast.success(
        decision === 'approved'
          ? (isAr ? 'تمت محاكاة اعتماد فحص الجودة بنجاح (وضع المعاينة)' : 'Inspection approved (simulation mode)')
          : (isAr ? 'تمت محاكاة رفض الفحص (وضع المعاينة)' : 'Inspection rejected (simulation mode)')
      );
      setSelectedInsp(null);
      setDecision(null);
      setReason('');
      setEvidenceUrl('');
      onRefresh?.();
      return;
    }

    setSubmitting(true);
    try {
      await TaskOntologyService.recordInspectionDecision(
        selectedInsp.id,
        decision,
        reason,
        evidenceUrl.trim() ? [evidenceUrl.trim()] : undefined
      );
      toast.success(
        decision === 'approved'
          ? (isAr ? 'تم اعتماد فحص الجودة بنجاح' : 'Inspection approved successfully')
          : (isAr ? 'تم رفض الفحص وإعادة المهمة لمهندس الموقع' : 'Inspection rejected and returned to site')
      );
      setSelectedInsp(null);
      setDecision(null);
      setReason('');
      setEvidenceUrl('');
      if (crossProject) {
        fetchCrossData();
      }
      onRefresh?.();
    } catch (err) {
      logger.error('Failed to record inspection decision', { detail: err });
      toast.error((err as Error).message || (isAr ? 'حدث خطأ أثناء معالجة الفحص' : 'Failed to record decision'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 p-3.5 rounded-xl shadow-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black text-blue-900 dark:text-blue-200">
                {isAr ? 'قائمة إجراءات استلام وفحص الجودة' : 'QC Inspection Action Queue'}
              </h3>
              {crossProject && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-xs">
                  {isAr ? 'كافة المشاريع' : 'All Projects'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-blue-700/90 dark:text-blue-300/80 mt-0.5 font-medium">
              {isAr
                ? `${pendingInspections.length} طلبات استلام أعمال بانتظار فحص مهندس الجودة`
                : `${pendingInspections.length} WIR requests waiting for QC inspection`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* View Toggle */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-lg p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-md transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 outline-none ${
                viewMode === 'cards'
                  ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title={isAr ? 'عرض البطاقات' : 'Cards View'}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 outline-none ${
                viewMode === 'table'
                  ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title={isAr ? 'عرض الجدول' : 'Table View'}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {crossProject && (
            <button
              type="button"
              onClick={fetchCrossData}
              disabled={loadingCross}
              className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-blue-500 outline-none disabled:opacity-50"
              title={isAr ? 'تحديث القائمة' : 'Refresh Queue'}
            >
              <RotateCw className={`w-3.5 h-3.5 ${loadingCross ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {loadingCross ? (
        <div className="py-14 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {isAr ? 'جاري تحميل طلبات الفحص...' : 'Loading inspections...'}
          </p>
        </div>
      ) : pendingInspections.length === 0 ? (
        <div className="py-14 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 space-y-1">
          <FileCheck className="w-8 h-8 text-emerald-500 mx-auto" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            {isAr ? 'لا توجد طلبات فحص جودة معلقة حالياً' : 'No pending QC inspections'}
          </p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pendingInspections.map((insp) => (
            <div
              key={insp.id}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 space-y-3 shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800/80 transition-all duration-200 flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/60 font-mono">
                    {insp.request_no}
                    <span className="mx-1 text-slate-300 dark:text-slate-700 font-sans">·</span>
                    <span className="font-sans font-semibold">{getInspectionTypeLabel(insp.inspection_type)}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                    {insp.required_at}
                  </span>
                </div>

                {(crossProject || insp.project_name_ar || insp.project_code) && (
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50/80 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/50">
                    <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                      {isAr ? 'المشروع:' : 'Project:'}
                    </span>
                    <span className="truncate">{getProjectName(insp)}</span>
                  </div>
                )}

                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 line-clamp-2">
                    {insp.task_title_ar || (isAr ? 'مهمة موقع' : 'Site Task')}
                  </h4>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1 truncate">
                    <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{isAr ? 'مهندس الجودة:' : 'QC:'}</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                      {insp.qc_name_ar || (isAr ? 'فريق الجودة' : 'QC Team')}
                    </span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInsp(insp);
                    setDecision('approved');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 outline-none shadow-xs hover:shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isAr ? 'مطابق (اعتماد)' : 'Pass (Approve)'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedInsp(insp);
                    setDecision('rejected');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 active:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 outline-none shadow-xs hover:shadow"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {isAr ? 'غير مطابق (رفض)' : 'Fail (Reject)'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <tr className="text-slate-500 dark:text-slate-400 font-bold">
                {crossProject && <th className="p-3 text-start">{isAr ? 'المشروع' : 'Project'}</th>}
                <th className="p-3 text-start">{isAr ? 'رقم الطلب' : 'Request #'}</th>
                <th className="p-3 text-start">{isAr ? 'النوع' : 'Type'}</th>
                <th className="p-3 text-start">{isAr ? 'بند العمل' : 'Task'}</th>
                <th className="p-3 text-start">{isAr ? 'تاريخ الطلب' : 'Required Date'}</th>
                <th className="p-3 text-start">{isAr ? 'مهندس الجودة' : 'QC'}</th>
                <th className="p-3 text-start">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {pendingInspections.map((insp) => (
                <tr key={insp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  {crossProject && (
                    <td className="p-3 font-bold text-blue-700 dark:text-blue-300 max-w-[180px] truncate">
                      {getProjectName(insp)}
                    </td>
                  )}
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {insp.request_no}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/60">
                      {getInspectionTypeLabel(insp.inspection_type)}
                    </span>
                  </td>
                  <td className="p-3 font-medium text-slate-700 dark:text-slate-300 max-w-[220px] truncate">
                    {insp.task_title_ar || (isAr ? 'مهمة موقع' : 'Site Task')}
                  </td>
                  <td className="p-3 font-mono text-slate-500 dark:text-slate-400">
                    {insp.required_at}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">
                    {insp.qc_name_ar || (isAr ? 'فريق الجودة' : 'QC Team')}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInsp(insp);
                          setDecision('approved');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 outline-none shadow-xs"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        {isAr ? 'مطابق' : 'Pass'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedInsp(insp);
                          setDecision('rejected');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 active:bg-rose-200 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 outline-none shadow-xs"
                      >
                        <XCircle className="w-3 h-3" />
                        {isAr ? 'غير مطابق' : 'Fail'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Decision Modal */}
      {selectedInsp && decision && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {decision === 'approved' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500" />
                )}
                <span>
                  {decision === 'approved'
                    ? (isAr ? 'اعتماد نتيجة فحص الجودة ومطابقة المواصفات' : 'Pass QC Inspection')
                    : (isAr ? 'رفض الفحص وإصدار أمر تصحيحي وإعادة عمل' : 'Fail QC Inspection & Request Rework')}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{selectedInsp.request_no}</span>
                {' · '}
                <span>{selectedInsp.task_title_ar || (isAr ? 'مهمة موقع' : 'Site Task')}</span>
                {(crossProject || selectedInsp.project_name_ar || selectedInsp.project_code) && (
                  <span className="block mt-0.5 font-bold text-blue-600 dark:text-blue-400">
                    {isAr ? 'المشروع: ' : 'Project: '}{getProjectName(selectedInsp)}
                  </span>
                )}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                {decision === 'rejected' ? (isAr ? 'سبب الرفض والملاحظات (إلزامي)*' : 'Rejection Reason (Required)*') : (isAr ? 'ملاحظات الاستلام' : 'Inspection Notes')}
              </label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={isAr ? 'اكتب تفاصيل الاستلام ومطابقة المواصفات أو أسباب الرفض...' : 'Enter inspection findings...'}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                <span>{isAr ? 'رابط تقرير الفحص / الصور (اختياري)' : 'Evidence / Report URL (Optional)'}</span>
              </label>
              <input
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setSelectedInsp(null);
                  setDecision(null);
                }}
                disabled={submitting}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 outline-none disabled:opacity-50"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDecision}
                disabled={submitting}
                className={`px-4 py-1.5 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all focus-visible:ring-2 focus-visible:ring-offset-1 outline-none shadow-sm disabled:opacity-50 ${
                  decision === 'approved'
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 focus-visible:ring-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 focus-visible:ring-rose-500'
                }`}
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {isAr ? 'حفظ القرار' : 'Record Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
