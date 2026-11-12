'use client';

import React, { useState } from 'react';
import { 
  Clock, 
  Calendar, 
  Layers, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  RotateCcw, 
  Lock, 
  XCircle, 
  Eye, 
  Camera, 
  FileText, 
  AlertTriangle, 
  Send, 
  Edit3, 
  HardHat, 
  Truck, 
  User, 
  Maximize2 
} from 'lucide-react';
import { 
  DailyProgress, 
  DailyProgressPhoto, 
  DailyProgressStatus, 
  LineStatus, 
  InspectionStatus 
} from '@/types/planning';
import { DISCIPLINE_LABELS } from './DailyProgressForm';
import { STATUS_CONFIG, LINE_STATUS_CONFIG, INSPECTION_STATUS_CONFIG, WeatherBadge } from './DailyLogTable';

interface DailyReportTimelineProps {
  reports: DailyProgress[];
  loading?: boolean;
  canApprove?: boolean;
  isPm?: boolean;
  isAr?: boolean;
  onRefresh: () => void;
  onReviewLines: (report: DailyProgress) => void;
  onReopenReport: (report: DailyProgress) => void;
  onAddObstruction: (report: DailyProgress) => void;
  onViewHistory?: (report: DailyProgress) => void;
  onEditDraft?: (report: DailyProgress) => void;
  onSubmitDraft?: (report: DailyProgress) => void;
  submittingId?: string | null;
  onOpenPhotoModal: (
    photos: DailyProgressPhoto[],
    index: number,
    report: DailyProgress,
    disciplineLabel?: string
  ) => void;
}

export const DailyReportTimeline: React.FC<DailyReportTimelineProps> = ({
  reports,
  loading = false,
  canApprove = true,
  isPm = true,
  isAr = true,
  onRefresh,
  onReviewLines,
  onReopenReport,
  onAddObstruction,
  onViewHistory,
  onEditDraft,
  onSubmitDraft,
  submittingId,
  onOpenPhotoModal,
}) => {
  // Expanded lines per timeline card
  const [expandedLinesReportIds, setExpandedLinesReportIds] = useState<Set<string>>(new Set());

  const toggleExpandLines = (id: string) => {
    setExpandedLinesReportIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Helper: Format date with day of week in Arabic/English
  const formatFriendlyDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return new Intl.DateTimeFormat(isAr ? 'ar-EG' : 'en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  // 1. Loading Skeletons in Timeline Mode
  if (loading) {
    return (
      <div className="space-y-8 my-6 ms-4 sm:ms-8 border-s-2 border-slate-200 dark:border-slate-800 ps-6 sm:ps-8 animate-pulse">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={`timeline-skel-${idx}`} className="relative group">
            {/* Pulsing Node Dot */}
            <div className="absolute -start-[33px] sm:-start-[41px] top-4 w-8 h-8 rounded-2xl bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-900 shadow-sm" />

            {/* Shimmer Card */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm space-y-4">
              {/* Header Shimmer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-2">
                  <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                  <div className="h-3 w-48 bg-slate-100 dark:bg-slate-800/60 rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
              </div>

              {/* Meta row shimmer */}
              <div className="flex items-center gap-3">
                <div className="h-5 w-24 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
                <div className="h-5 w-20 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
                <div className="h-5 w-28 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
              </div>

              {/* Body block shimmer */}
              <div className="h-14 w-full bg-slate-100 dark:bg-slate-800/40 rounded-2xl" />

              {/* Photo thumbnails grid shimmer */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {Array.from({ length: 4 }).map((_, pIdx) => (
                  <div key={pIdx} className="aspect-video bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 2. Empty State in Timeline Mode
  if (reports.length === 0) {
    return (
      <div className="my-8 p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 shadow-sm">
        <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
        <div className="font-bold text-slate-700 dark:text-slate-300 text-sm">
          {isAr ? 'لا توجد تقارير يومية مسجلة مطابقة لمعايير البحث في الخط الزمني' : 'No matching daily reports in timeline'}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {isAr 
            ? 'يمكنك تغيير نطاق التواريخ، أو مسح عوامل التصفية، أو البدء بتسجيل تقرير يومي جديد للموقع.'
            : 'Try adjusting the date range, clearing filters, or submit a new site progress report.'}
        </div>
      </div>
    );
  }

  // 3. Chronological Vertical Timeline
  return (
    <div 
      className="relative my-6 ms-4 sm:ms-8 border-s-2 border-emerald-500/25 dark:border-emerald-500/20 ps-6 sm:ps-8 space-y-8"
      role="feed"
      aria-label={isAr ? 'الخط الزمني الميداني لسير الأعمال واليوميات' : 'Site daily progress chronological timeline'}
    >
      {reports.map((report) => {
        const statusInfo = STATUS_CONFIG[report.status] || STATUS_CONFIG.draft;
        const StatusIcon = statusInfo.icon;
        const disciplineInfo = DISCIPLINE_LABELS[report.discipline || 'civil'] || DISCIPLINE_LABELS.civil;
        const DisciplineIcon = disciplineInfo.icon || Layers;
        const linesCount = report.lines?.length || 0;
        const photosCount = report.photos?.length || 0;
        const obstructionsCount = report.obstructions?.length || 0;
        const isLinesExpanded = expandedLinesReportIds.has(report.id);

        return (
          <article 
            key={report.id} 
            className="relative group transition-all"
            aria-labelledby={`timeline-report-${report.id}`}
          >
            {/* Timeline Node Icon Marker */}
            <div 
              className={`absolute -start-[33px] sm:-start-[41px] top-5 w-8 h-8 rounded-2xl flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-md transition-transform duration-200 group-hover:scale-110 shrink-0 ${statusInfo.color}`}
              title={`${statusInfo.labelAr} — يومية #${report.report_no}`}
              aria-hidden="true"
            >
              <StatusIcon className="w-4 h-4 shrink-0" />
            </div>

            {/* Timeline Card */}
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm hover:shadow-md transition space-y-4">
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 
                      id={`timeline-report-${report.id}`} 
                      className="text-base font-bold text-slate-900 dark:text-white font-mono"
                    >
                      {isAr ? `يومية #${report.report_no}` : `Daily Report #${report.report_no}`}
                    </h3>

                    {/* Discipline Tag */}
                    <span 
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors shadow-xs ${disciplineInfo.color} ${disciplineInfo.border || ''}`}
                    >
                      <DisciplineIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>{disciplineInfo.labelAr}</span>
                    </span>

                    {/* Status Approval Badge in RTL */}
                    <span
                      dir="rtl"
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors shadow-xs ${statusInfo.color}`}
                    >
                      <StatusIcon className="w-3 h-3 shrink-0" aria-hidden="true" />
                      <span>{statusInfo.labelAr}</span>
                    </span>

                    {/* Obstructions Badge if any */}
                    {obstructionsCount > 0 && (
                      <span 
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60"
                        title={isAr ? `مسجل بها ${obstructionsCount} إعاقة موقع` : `${obstructionsCount} site obstruction(s)`}
                      >
                        <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                        <span>{obstructionsCount} {isAr ? 'إعاقة EOT' : 'EOT'}</span>
                      </span>
                    )}
                  </div>

                  {/* Friendly Date Label */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                    <span>{formatFriendlyDate(report.progress_date)}</span>
                    <span className="font-mono text-slate-400 dark:text-slate-500">({report.progress_date})</span>
                  </div>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Edit Draft */}
                  {report.status === 'draft' && onEditDraft && (
                    <button
                      type="button"
                      onClick={() => onEditDraft(report)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition shadow-xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      title={isAr ? 'تعديل واستكمال المسودة' : 'Edit draft'}
                    >
                      <Edit3 className="w-3 h-3" aria-hidden="true" />
                      <span>{isAr ? 'تعديل' : 'Edit'}</span>
                    </button>
                  )}

                  {/* Submit Draft */}
                  {report.status === 'draft' && onSubmitDraft && (
                    <button
                      type="button"
                      onClick={() => onSubmitDraft(report)}
                      disabled={submittingId === report.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-xs cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      title={isAr ? 'تقديم اليومية للاعتماد' : 'Submit report'}
                    >
                      <Send className="w-3 h-3" aria-hidden="true" />
                      <span>{submittingId === report.id ? (isAr ? 'جاري التقديم...' : 'Submitting...') : (isAr ? 'تقديم' : 'Submit')}</span>
                    </button>
                  )}

                  {/* Review Lines */}
                  {canApprove && (
                    <button
                      type="button"
                      onClick={() => onReviewLines(report)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/80 font-bold text-xs transition cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      title={isAr ? 'مراجعة واعتماد بنود اليومية' : 'Review & approve lines'}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      <span>{isAr ? 'مراجعة' : 'Review'}</span>
                    </button>
                  )}

                  {/* Add Obstruction */}
                  <button
                    type="button"
                    onClick={() => onAddObstruction(report)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition border border-transparent hover:border-amber-200 dark:hover:border-amber-800/80 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    title={isAr ? 'تسجيل إعاقة موقع (EOT)' : 'Log obstruction (EOT)'}
                    aria-label={isAr ? 'تسجيل إعاقة موقع' : 'Log site obstruction'}
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />
                  </button>

                  {/* Reopen Report */}
                  {isPm && report.status === 'approved' && (
                    <button
                      type="button"
                      onClick={() => onReopenReport(report)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition border border-transparent hover:border-purple-200 dark:hover:border-purple-800/80 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                      title={isAr ? 'إعادة فتح اليومية وتجميد نسب الإنجاز' : 'Reopen report'}
                      aria-label={isAr ? 'إعادة فتح اليومية' : 'Reopen daily report'}
                    >
                      <RotateCcw className="w-4 h-4 text-purple-500" aria-hidden="true" />
                    </button>
                  )}

                  {/* View History Audit */}
                  {onViewHistory && (
                    <button
                      type="button"
                      onClick={() => onViewHistory(report)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
                      title={isAr ? 'سجل المراجعة والتدقيق' : 'View audit history'}
                      aria-label={isAr ? 'سجل المراجعة والتدقيق' : 'View audit history'}
                    >
                      <Eye className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {/* Meta Strip: Field Resources, Author, Weather */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Responsible Author */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="text-slate-900 dark:text-white">{report.entered_by_name || report.entered_by || (isAr ? 'مهندس الموقع' : 'Site Engineer')}</strong>
                  </span>
                </div>

                {/* Weather condition */}
                <WeatherBadge weather={report.weather} isAr={isAr} />

                {/* Manpower count */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono">
                  <HardHat className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                  <span>{report.manpower_count || 0} {isAr ? 'عامل' : 'workers'}</span>
                </div>

                {/* Equipment summary if present */}
                {report.equipment_summary && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                    <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                    <span className="truncate max-w-xs">{report.equipment_summary}</span>
                  </div>
                )}
              </div>

              {/* General Site Notes */}
              {report.notes && (
                <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/30 border-s-4 border-emerald-500 text-xs text-slate-700 dark:text-slate-300 font-medium">
                  {report.notes}
                </div>
              )}

              {/* Work Items Summary & Drawer Toggle */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/30 dark:bg-slate-800/20">
                <button
                  type="button"
                  onClick={() => toggleExpandLines(report.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition cursor-pointer"
                  aria-expanded={isLinesExpanded}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <span>
                      {isAr ? `بنود الأعمال المسجلة في هذا اليوم (${linesCount} بند)` : `Recorded BOQ Items (${linesCount})`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[11px]">
                    <span>{isLinesExpanded ? (isAr ? 'إخفاء التفاصيل' : 'Hide details') : (isAr ? 'عرض التفاصيل والكميات' : 'Show items table')}</span>
                    {isLinesExpanded ? (
                      <ChevronDown className="w-4 h-4" aria-hidden="true" />
                    ) : isAr ? (
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    )}
                  </div>
                </button>

                {/* Collapsible Lines Table */}
                {isLinesExpanded && (
                  <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    {linesCount === 0 ? (
                      <div className="p-4 text-center text-slate-400 dark:text-slate-500 text-xs">
                        {isAr ? 'لا توجد بنود أعمال مسجلة في هذا التقرير' : 'No items recorded in this report'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-start">
                          <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                            <tr>
                              <th className="px-3 py-2 text-start">{isAr ? 'كود البند' : 'Item Code'}</th>
                              <th className="px-3 py-2 text-start">{isAr ? 'بيان الأعمال' : 'Description'}</th>
                              <th className="px-3 py-2 text-center">{isAr ? 'الكمية المنفذة' : 'Installed Qty'}</th>
                              <th className="px-3 py-2 text-center">{isAr ? 'المنطقة' : 'Zone'}</th>
                              <th className="px-3 py-2 text-center">{isAr ? 'طلب الاستلام (WIR)' : 'WIR Inspection'}</th>
                              <th className="px-3 py-2 text-center">{isAr ? 'حالة الاعتماد' : 'Status'}</th>
                              <th className="px-3 py-2 text-start">{isAr ? 'ملاحظات' : 'Remarks'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {report.lines?.map((line) => {
                              const lineStatus = LINE_STATUS_CONFIG[line.line_status || 'pending'] || LINE_STATUS_CONFIG.pending;
                              const wirStatus = INSPECTION_STATUS_CONFIG[line.inspection_status || 'not_required'] || INSPECTION_STATUS_CONFIG.not_required;
                              return (
                                <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                  <td className="px-3 py-2 font-mono font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                                    {line.boq_item?.item_code || 'N/A'}
                                  </td>
                                  <td className="px-3 py-2 max-w-xs font-medium text-slate-800 dark:text-slate-200">
                                    <div className="line-clamp-1">{line.boq_item?.description_ar || (isAr ? 'بند عمل' : 'Work item')}</div>
                                    {line.is_material_on_site && (
                                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                                        [تشوين MOS]
                                      </span>
                                    )}
                                    {line.is_claimable_vo && (
                                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold ms-1">
                                        [مطالبة VO]
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-center font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                                    {Number(line.qty_today).toLocaleString()} {line.boq_item?.unit || ''}
                                  </td>
                                  <td className="px-3 py-2 text-center text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                    {line.zone || '-'}
                                  </td>
                                  <td className="px-3 py-2 text-center whitespace-nowrap">
                                    <div className="font-mono text-[10px] text-slate-700 dark:text-slate-300">{line.wir_no || '-'}</div>
                                    <span className={`text-[10px] ${wirStatus.color}`}>
                                      {wirStatus.labelAr}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-center whitespace-nowrap">
                                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${lineStatus.color}`}>
                                      {lineStatus.labelAr}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                                    {line.remarks || (line.rejection_reason ? `سبب الرفض: ${line.rejection_reason}` : '-')}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Photo Gallery Grid Responsiveness */}
              {photosCount > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                      <span>{isAr ? `الصور الميدانية المرفقة (${photosCount})` : `Attached site photos (${photosCount})`}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      {isAr ? 'انقر على أي صورة للتكبير والمعاينة' : 'Click any photo to enlarge'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                    {report.photos?.map((photo, pIdx) => {
                      const photoAlt = photo.caption
                        ? `${photo.caption} - صورة توثيق موقع ليومية #${report.report_no} (${report.progress_date})`
                        : (isAr ? `صورة موقع ليومية #${report.report_no} بتاريخ ${report.progress_date} - صورة ${pIdx + 1}` : `Site photo #${pIdx + 1} for report #${report.report_no}`);

                      return (
                        <div
                          key={photo.id || pIdx}
                          onClick={() => onOpenPhotoModal(report.photos || [], pIdx, report, disciplineInfo.labelAr)}
                          className="aspect-square sm:aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 relative group shadow-xs cursor-pointer focus-within:ring-2 focus-within:ring-emerald-500"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              onOpenPhotoModal(report.photos || [], pIdx, report, disciplineInfo.labelAr);
                            }
                          }}
                          aria-label={photoAlt}
                        >
                          <img
                            src={photo.photo_url}
                            alt={photoAlt}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition duration-200">
                            <span className="p-2 rounded-xl bg-slate-900/80 text-white shadow-md backdrop-blur-sm">
                              <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </span>
                          </div>
                          {photo.caption && (
                            <div className="absolute inset-x-0 bottom-0 bg-slate-950/75 px-2 py-1 text-[9px] text-white truncate">
                              {photo.caption}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
};
