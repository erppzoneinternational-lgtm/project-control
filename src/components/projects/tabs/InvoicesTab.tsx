'use client';

import React, { useState, useCallback } from 'react';
import { Project, ProjectInvoice } from '@/types';
import { ProjectTabsService } from '@/lib/services/projectTabs.service';
import { Banknote, Plus, Trash2, Loader2, FileText, CheckCircle2, Clock } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useCleanupEffect } from '@/lib/utils/useCleanupEffect';
import { logger } from '@/lib/logger';
import { ProjectService } from '@/lib/services/project.service';
import { RetentionReleaseGovernanceCard } from '@/components/contracts/RetentionReleaseGovernanceCard';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';

interface InvoicesTabProps {
  project: Project;
  isAr?: boolean;
}

export const InvoicesTab: React.FC<InvoicesTabProps> = React.memo(({ project, isAr = true }) => {
  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const isViewerOnly = roles.length > 0 && roles.every((r) => r.toLowerCase() === 'viewer') && !isAdmin;
  const canEdit =
    !isViewerOnly &&
    (canEditPath('/projects', roles, isAdmin, dbAccessRules) ||
      canEditPath('/contracts', roles, isAdmin, dbAccessRules));
  const [items, setItems] = useState<ProjectInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [ipcNumber, setIpcNumber] = useState('');
  const [claimedAmount, setClaimedAmount] = useState<number | ''>(0);
  const [approvedAmount, setApprovedAmount] = useState<number | ''>(0);
  const [submissionDate, setSubmissionDate] = useState('');
  const [status, setStatus] = useState<'under_review' | 'approved' | 'paid'>('approved');

  const loadData = useCallback(async (isCancelled?: () => boolean) => {
    setLoading(true);
    try {
      const data = await ProjectTabsService.getInvoices(project.id);
      if (!isCancelled || !isCancelled()) {
        setItems(data);
      }
    } finally {
      if (!isCancelled || !isCancelled()) {
        setLoading(false);
      }
    }
  }, [project.id]);

  useCleanupEffect(async (isCancelled) => {
    await loadData(isCancelled);
  }, [loadData]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!ipcNumber.trim()) return;

    setSaving(true);
    try {
      await ProjectTabsService.addInvoice({
        project_id: project.id,
        ipc_number: ipcNumber.trim(),
        claimed_amount: Number(claimedAmount) || 0,
        approved_amount: Number(approvedAmount) || 0,
        submission_date: submissionDate || undefined,
        status
      });
      setShowModal(false);
      setIpcNumber('');
      setClaimedAmount(0);
      setApprovedAmount(0);
      await loadData();
    } catch (err) {
      logger.error('Failed to add invoice', { detail: err });
      alert(isAr ? 'حدث خطأ أثناء إضافة المستخلص' : 'Failed to add payment certificate');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ProjectInvoice) => {
    if (!canEdit) return;
    const confirmMsg = isAr
      ? `هل تريد حذف المستخلص "${item.ipc_number}" ونقله إلى الأرشيف؟`
      : `Delete payment certificate "${item.ipc_number}" and move to archive?`;
    if (!confirm(confirmMsg)) return;

    try {
      await ProjectTabsService.deleteInvoice(item.id, item);
      await loadData();
    } catch (err) {
      logger.error('Failed to delete invoice', { detail: err });
    }
  };

  const totalContract = project.total_contract_value || (project.contract_value + (project.vos_value || 0));
  const totalApproved = items.reduce((sum, item) => sum + (Number(item.approved_amount) || 0), 0);
  const totalClaimed = items.reduce((sum, item) => sum + (Number(item.claimed_amount) || 0), 0);
  const approvedPercentage = totalContract > 0 ? Math.min(100, Math.round((totalApproved / totalContract) * 100)) : 0;
  const currencyLabel = isAr ? 'ج.م' : 'EGP';

  const getStatusConfig = (itemStatus: ProjectInvoice['status']) => {
    switch (itemStatus) {
      case 'paid':
        return {
          label: isAr ? 'صُرف بالكامل' : 'Paid',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
          icon: CheckCircle2,
        };
      case 'approved':
        return {
          label: isAr ? 'معتمد للصرف' : 'Approved',
          badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
          icon: CheckCircle2,
        };
      case 'under_review':
      default:
        return {
          label: isAr ? 'قيد المراجعة والتدقيق' : 'Under Review',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
          icon: Clock,
        };
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500 mb-2" />
        <p className="text-xs font-bold">
          {isAr ? 'جاري تحميل المستخلصات والشهادات المالية...' : 'Loading Payment Certificates...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{isAr ? 'سجل المستخلصات والشهادات المالية' : 'Payment Certificates & Invoices'}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr
              ? 'متابعة مستخلصات الأعمال المنفذة، المبالغ المعتمدة، وإجمالي الصرف التعاقدي'
              : 'Track executed work certificates, approved valuations, and contract payouts'}
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 min-h-[38px]"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة مستخلص جديد' : 'New Certificate'}</span>
          </button>
        )}
      </div>

      {/* Contract Financial Snapshot KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl glass-card border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
            {isAr ? 'قيمة العقد الأصلية' : 'Original Contract Value'}
          </span>
          <span className="text-base font-black text-slate-900 dark:text-white">
            {formatCurrency(project.contract_value)} <span className="text-xs font-medium text-slate-400">{currencyLabel}</span>
          </span>
        </div>

        <div className="p-4 rounded-xl glass-card border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-all shadow-sm">
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mb-1">
            {isAr ? 'إجمالي أوامر التغيير' : 'Variation Orders Total'}
          </span>
          <span className="text-base font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(project.vos_value)} <span className="text-xs font-medium text-amber-500/70">{currencyLabel}</span>
          </span>
        </div>

        <div className="p-4 rounded-xl glass-card border border-slate-300 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-800/40 hover:border-slate-400 dark:hover:border-slate-600 transition-all shadow-sm">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
            {isAr ? 'إجمالي قيمة العقد المعدلة' : 'Revised Contract Value'}
          </span>
          <span className="text-base font-black text-slate-900 dark:text-white">
            {formatCurrency(totalContract)} <span className="text-xs font-medium text-slate-400">{currencyLabel}</span>
          </span>
        </div>

        <div className="p-4 rounded-xl glass-card border border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              {isAr ? 'إجمالي المعتمد صرفه' : 'Total Approved Invoiced'}
            </span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              {approvedPercentage}%
            </span>
          </div>
          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalApproved)} <span className="text-xs font-medium text-emerald-500/70">{currencyLabel}</span>
          </span>
        </div>
      </div>

      {/* FIDIC 14.9 Retention Release Governance */}
      <RetentionReleaseGovernanceCard 
        project={project}
        canEdit={canEdit}
        totalApprovedAmount={totalApproved}
        totalInvoicedAmount={totalClaimed}
        onTrancheStatusChange={async (tranche, released) => {
          if (!canEdit) return;
          try {
            const meta = (project.metadata || {}) as Record<string, unknown>;
            const existingReleases = ((meta.retention_releases as Record<string, boolean>) || {});
            const updatedMeta = {
              ...meta,
              [`retention_tranche_${tranche}_released`]: released,
              retention_releases: {
                ...existingReleases,
                [`tranche_${tranche}`]: released,
                [`tranche_${tranche}_date`]: released ? new Date().toISOString() : null,
              },
            };
            await ProjectService.updateProject(project.id, {
              metadata: updatedMeta,
            });
          } catch (err) {
            logger.error('Failed to persist retention release', { err });
          }
        }}
      />

      {/* Invoice list rows */}
      {items.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400 text-xs rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <FileText className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
          <p>{isAr ? 'لا توجد مستخلصات تفصيلية مسجلة لهذا المشروع حالياً.' : 'No detailed payment certificates recorded for this project yet.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const statusConfig = getStatusConfig(item.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={item.id}
                className="glass-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all bg-white/40 dark:bg-slate-900/40 shadow-sm"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {isAr ? `مستخلص أعمال رقم ${item.ipc_number}` : `Certificate #${item.ipc_number}`}
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 ps-7">
                    <span>
                      {isAr ? 'المبلغ المطلوب:' : 'Claimed:'}{' '}
                      <b className="text-slate-800 dark:text-slate-200">{formatCurrency(item.claimed_amount)} {currencyLabel}</b>
                    </span>
                    <span>
                      {isAr ? 'المعتمد للصرف:' : 'Approved:'}{' '}
                      <b className="text-emerald-600 dark:text-emerald-400">{formatCurrency(item.approved_amount)} {currencyLabel}</b>
                    </span>
                    {item.submission_date && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{isAr ? 'تاريخ التقديم:' : 'Submitted:'} {item.submission_date}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold capitalize ${statusConfig.badgeClass}`}>
                    <StatusIcon className="w-3 h-3 shrink-0" />
                    <span>{statusConfig.label}</span>
                  </span>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                      title={isAr ? 'حذف ونقل للأرشيف' : 'Delete and archive'}
                      aria-label={isAr ? `حذف مستخلص رقم ${item.ipc_number}` : `Delete certificate ${item.ipc_number}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for adding new invoice */}
      {showModal && canEdit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 space-y-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Banknote className="w-4 h-4 text-emerald-500" />
                <span>{isAr ? 'إضافة مستخلص مالي جديد' : 'New Payment Certificate'}</span>
              </h3>
            </div>

            <form onSubmit={handleAdd} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'رقم المستخلص *' : 'Certificate Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={ipcNumber}
                  onChange={e => setIpcNumber(e.target.value)}
                  placeholder={isAr ? 'مثال: 01 أو IPC-01' : 'e.g. 01 or IPC-01'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'المبلغ المطلوب (ج.م)' : 'Claimed Amount (EGP)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={claimedAmount}
                    onChange={e => setClaimedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'المبلغ المعتمد (ج.م)' : 'Approved Amount (EGP)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={approvedAmount}
                    onChange={e => setApprovedAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'تاريخ التقديم' : 'Submission Date'}
                  </label>
                  <input
                    type="date"
                    value={submissionDate}
                    onChange={e => setSubmissionDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all cursor-pointer"
                  >
                    <option value="under_review">{isAr ? 'قيد المراجعة والتدقيق' : 'Under Review'}</option>
                    <option value="approved">{isAr ? 'معتمد للصرف' : 'Approved'}</option>
                    <option value="paid">{isAr ? 'صُرف بالكامل' : 'Paid'}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <span>{isAr ? 'حفظ المستخلص' : 'Save Certificate'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

InvoicesTab.displayName = 'InvoicesTab';

