'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  CheckCheck, 
} from 'lucide-react';
import { 
  DailyProgress, 
  DailyProgressLine, 
} from '@/types/planning';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { useAuth } from '@/lib/stores/useAuthStore';
import { PriceGate } from './PriceGate';
import { LINE_STATUS_CONFIG, INSPECTION_STATUS_CONFIG } from './DailyLogTable';
import { logger } from '@/lib/logger';

interface DailyLineReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DailyProgress | null;
  onRefresh: () => void;
}

export const DailyLineReviewModal: React.FC<DailyLineReviewModalProps> = ({
  isOpen,
  onClose,
  report,
  onRefresh,
}) => {
  const { user } = useAuth();

  // Local state for lines to reflect immediate approvals/rejections
  const [lines, setLines] = useState<DailyProgressLine[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Line rejection prompt state
  const [rejectingLineId, setRejectingLineId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync lines when report changes
  useEffect(() => {
    if (isOpen && report) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setRejectingLineId(null);
      setRejectionReason('');

      // Fetch full report details to ensure latest lines
      setLoadingLines(true);
      DailyProgressService.getDailyReportById(report.id)
        .then((fullReport) => {
          if (fullReport && fullReport.lines) {
            setLines(fullReport.lines);
          } else {
            setLines(report.lines || []);
          }
        })
        .catch((err) => {
          logger.error('Error loading report lines for review', { detail: err });
          setLines(report.lines || []);
        })
        .finally(() => setLoadingLines(false));
    }
  }, [isOpen, report]);

  if (!isOpen || !report) return null;

  // Reviewer ID
  const reviewerId = user?.id || 'project_manager';

  // Count pending lines
  const pendingLines = lines.filter((l) => l.line_status === 'pending');
  const approvedLines = lines.filter((l) => l.line_status === 'approved');
  const rejectedLines = lines.filter((l) => l.line_status === 'rejected');

  // Handle single line approval
  const handleApproveLine = async (line: DailyProgressLine) => {
    setActionInProgress(line.id);
    setErrorMsg(null);
    try {
      const updated = await DailyProgressService.approveDailyReportLine(
        line.id,
        report.id,
        reviewerId,
        line.snapshot_rate_egp || line.boq_item?.rate_egp
      );

      if (updated) {
        setLines((prev) =>
          prev.map((l) => (l.id === line.id ? { ...l, line_status: 'approved', rejection_reason: undefined } : l))
        );
        setSuccessMsg(`تم اعتماد البند ${line.boq_item?.item_code || ''} بنجاح`);
        onRefresh();
      }
    } catch (err: unknown) {
      const errInfo = err as { message?: string; code?: string; details?: string } | null | undefined;
      logger.error('Line approval error', { detail: err });
      setErrorMsg(errInfo?.message || 'فشل اعتماد البند');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle single line rejection trigger
  const handleOpenRejectPrompt = (lineId: string) => {
    setRejectingLineId(lineId);
    setRejectionReason('');
  };

  // Submit single line rejection
  const handleSubmitRejectLine = async (lineId: string) => {
    if (!rejectionReason.trim()) {
      setErrorMsg('يرجى ذكر سبب الرفض');
      return;
    }

    setActionInProgress(lineId);
    setErrorMsg(null);
    try {
      const updated = await DailyProgressService.rejectDailyReportLine(
        lineId,
        report.id,
        reviewerId,
        rejectionReason.trim()
      );

      if (updated) {
        setLines((prev) =>
          prev.map((l) =>
            l.id === lineId ? { ...l, line_status: 'rejected', rejection_reason: rejectionReason.trim() } : l
          )
        );
        setRejectingLineId(null);
        setRejectionReason('');
        setSuccessMsg('تم رفض البند وحفظ سبب الرفض');
        onRefresh();
      }
    } catch (err: unknown) {
      const errInfo = err as { message?: string; code?: string; details?: string } | null | undefined;
      logger.error('Line rejection error', { detail: err });
      setErrorMsg(errInfo?.message || 'فشل رفض البند');
    } finally {
      setActionInProgress(null);
    }
  };

  // Batch approve all pending lines
  const handleBatchApproveAll = async () => {
    const pendingIds = pendingLines.map((l) => l.id);
    if (pendingIds.length === 0) return;

    setActionInProgress('batch_all');
    setErrorMsg(null);
    try {
      const ok = await DailyProgressService.batchApproveLines(report.id, pendingIds, reviewerId);
      if (ok) {
        // Also check if full report can be approved if no rejected lines
        if (rejectedLines.length === 0) {
          await DailyProgressService.approveDailyReport(report.id, report.project_id, reviewerId);
        }

        setLines((prev) =>
          prev.map((l) => (l.line_status === 'pending' ? { ...l, line_status: 'approved' } : l))
        );
        setSuccessMsg('تم اعتماد كافة بنود اليومية المعلقة بنجاح وتجميد الأسعار التعاقدية');
        onRefresh();
      }
    } catch (err: unknown) {
      const errInfo = err as { message?: string; code?: string; details?: string } | null | undefined;
      logger.error('Batch approval error', { detail: err });
      setErrorMsg(errInfo?.message || 'فشل الاعتماد المجمع للبنود');
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-md animate-in fade-in duration-200" data-testid="daily-line-review-modal">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl shadow-slate-900/10 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-500/20">
              <CheckCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>مراجعة واعتماد بنود اليومية #{report.report_no}</span>
                <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
                  ({report.progress_date})
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                مراجعة وتدقيق الكميات ومطابقة شهادات الاستلام WIR وتجميد الأسعار
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Summary Stats Strip */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400">إجمالي البنود: </span>
              <strong className="font-mono text-slate-800 dark:text-slate-200">{lines.length}</strong>
            </div>
            <div>
              <span className="text-slate-400">معتمد: </span>
              <strong className="font-mono text-emerald-600 dark:text-emerald-400">{approvedLines.length}</strong>
            </div>
            <div>
              <span className="text-slate-400">قيد المراجعة: </span>
              <strong className="font-mono text-amber-600 dark:text-amber-400">{pendingLines.length}</strong>
            </div>
            {rejectedLines.length > 0 && (
              <div>
                <span className="text-slate-400">مرفوض: </span>
                <strong className="font-mono text-rose-600 dark:text-rose-400">{rejectedLines.length}</strong>
              </div>
            )}
          </div>

          {/* Batch Approve All Button */}
          {pendingLines.length > 0 && (
            <button
              onClick={handleBatchApproveAll}
              disabled={actionInProgress !== null}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span>
                {actionInProgress === 'batch_all'
                  ? 'جاري الاعتماد...'
                  : `اعتماد كافة البنود المعلقة (${pendingLines.length})`}
              </span>
            </button>
          )}
        </div>

        {/* Lines Review List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loadingLines ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              جاري تحميل بنود اليومية...
            </div>
          ) : lines.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              لا توجد بنود مسجلة في هذه اليومية
            </div>
          ) : (
            lines.map((line) => {
              const boqItem = line.boq_item;
              const isRejectingThis = rejectingLineId === line.id;
              const lineStatus = LINE_STATUS_CONFIG[line.line_status || 'pending'] || LINE_STATUS_CONFIG.pending;
              const wirStatus = INSPECTION_STATUS_CONFIG[line.inspection_status || 'not_required'] || INSPECTION_STATUS_CONFIG.not_required;

              return (
                <div
                  key={line.id}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    line.line_status === 'approved'
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/60'
                      : line.line_status === 'rejected'
                      ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Top Bar: BOQ Info & Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                        {boqItem?.item_code || 'N/A'}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {boqItem?.description_ar || 'بند عمل'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${lineStatus.color}`}
                      >
                        {lineStatus.labelAr}
                      </span>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">الكمية المنفذة</div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        {Number(line.qty_today).toLocaleString()} {boqItem?.unit || ''}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">الفئة التعاقدية</div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white">
                        <PriceGate>
                          {Number(line.snapshot_rate_egp || boqItem?.rate_egp || 0).toLocaleString()} EGP
                        </PriceGate>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">المنطقة / Zone</div>
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {line.zone || '-'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-400">شهادة الاستلام (WIR)</div>
                      <div className="flex items-center gap-1 font-mono">
                        <span>{line.wir_no || '-'}</span>
                        <span className={`text-[10px] ${wirStatus.color}`}>({wirStatus.labelAr})</span>
                      </div>
                    </div>
                  </div>

                  {/* Attributes & Tags */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    {line.is_material_on_site && (
                      <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-800">
                        📦 تشوين بالموقع (MOS)
                      </span>
                    )}
                    {line.is_claimable_vo && (
                      <span className="px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-bold border border-violet-200 dark:border-violet-800 shadow-sm">
                        ⚖️ مطالبة أمر تغيير (Claimable VO)
                      </span>
                    )}
                    {line.supplied_qty !== undefined && line.supplied_qty !== null && (
                      <span className="font-mono text-slate-600 dark:text-slate-400">
                        الكمية الموردة: {line.supplied_qty}
                      </span>
                    )}
                    {line.remarks && (
                      <span className="text-slate-600 dark:text-slate-400">
                        ملاحظات: {line.remarks}
                      </span>
                    )}
                  </div>

                  {/* Rejection Reason display if rejected */}
                  {line.rejection_reason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>سبب الرفض: {line.rejection_reason}</span>
                    </div>
                  )}

                  {/* Inline Rejection Reason Prompt */}
                  {isRejectingThis && (
                    <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-2 animate-in fade-in">
                      <label className="block text-xs font-bold text-rose-800 dark:text-rose-300">
                        سبب رفض البند (إلزامي) *
                      </label>
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="اذكر سبب الرفض (مثال: عدم مطابقة أعمال الحديد مع الشوب دروينج)..."
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 text-slate-900 dark:text-white"
                        autoFocus
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setRejectingLineId(null)}
                          className="px-3 py-1 rounded-lg border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 hover:bg-rose-100/50 dark:hover:bg-rose-950/40 text-xs font-bold transition"
                        >
                          إلغاء
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSubmitRejectLine(line.id)}
                          className="px-4 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
                        >
                          تأكيد الرفض
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Line Action Buttons */}
                  {!isRejectingThis && (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {line.line_status !== 'approved' && (
                        <button
                          type="button"
                          disabled={actionInProgress !== null}
                          onClick={() => handleApproveLine(line)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>اعتماد البند</span>
                        </button>
                      )}

                      {line.line_status !== 'rejected' && (
                        <button
                          type="button"
                          disabled={actionInProgress !== null}
                          onClick={() => handleOpenRejectPrompt(line.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-xs transition disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>رفض البند</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            يتم تجميد الأسعار التعاقدية وحفظ المراجعة لحظياً
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
