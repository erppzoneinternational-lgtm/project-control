'use client';

/**
 * BaselineVersionActions — approval workflow actions for the schedule-version
 * strip on the Baseline page (gap F3).
 *
 * Flow: draft --إرسال للاعتماد--> submitted --اعتماد/رفض--> approved / rejected.
 * An APPROVED version becomes the reporting reference (المرجع), so approving
 * asks for confirmation. Rejection requires a mandatory reason note which is
 * stored on approval_note.
 *
 * Roles (mirrors src/lib/rbac/role-matrix.ts conventions):
 *   - submit: planning_engineer, planning_manager, technical_office, admin
 *   - approve / reject: planning_manager, technical_office, admin
 */

import React, { useState } from 'react';
import { Loader2, Send, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ScheduleVersionService, type ScheduleVersion } from '@/lib/services/schedule-version.service';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';

export type VersionAction = 'submit' | 'approve' | 'reject';

export const SUBMIT_ROLES = ['planning_engineer', 'planning_manager', 'technical_office', 'admin'];
export const APPROVE_ROLES = ['planning_manager', 'technical_office', 'admin'];

export const ACTION_LABELS: Record<VersionAction, string> = {
  submit: 'إرسال للاعتماد',
  approve: 'اعتماد',
  reject: 'رفض',
};

/** English siblings — components pick via isAr ternary; Arabic exports keep their shape/values */
export const ACTION_LABELS_EN: Record<VersionAction, string> = {
  submit: 'Submit for Approval',
  approve: 'Approve',
  reject: 'Reject',
};

export const ACTION_TOASTS: Record<VersionAction, { success: string; failure: string }> = {
  submit: { success: 'أُرسلت النسخة للاعتماد — بانتظار مراجعة مدير التخطيط', failure: 'فشل إرسال النسخة للاعتماد' },
  approve: { success: 'اعتُمدت النسخة وأصبحت هي المرجع للتقارير', failure: 'فشل اعتماد النسخة' },
  reject: { success: 'رُفضت النسخة مع إثبات السبب', failure: 'فشل رفض النسخة' },
};

export const ACTION_TOASTS_EN: Record<VersionAction, { success: string; failure: string }> = {
  submit: { success: 'Version submitted for approval — awaiting planning manager review', failure: 'Failed to submit version for approval' },
  approve: { success: 'Version approved and is now the reporting reference', failure: 'Failed to approve version' },
  reject: { success: 'Version rejected with reason recorded', failure: 'Failed to reject version' },
};

/* ════ pure permission / status logic (unit-tested) ════ */

export function hasAnyRole(roles: string[] | null | undefined, allowed: string[]): boolean {
  return !!roles?.some((r) => allowed.includes(r));
}

export const canSubmitVersion = (roles?: string[] | null) => hasAnyRole(roles, SUBMIT_ROLES);
export const canApproveVersion = (roles?: string[] | null) => hasAnyRole(roles, APPROVE_ROLES);

/** rejection needs a real reason — stored on approval_note */
export const isValidRejectReason = (reason: string | null | undefined): boolean =>
  !!(reason && reason.trim().length >= 3);

/**
 * Which actions are visible+enabled for this version given the user's roles
 * and the version's current status. Empty array ⇒ render nothing for it.
 */
export function allowedActionsFor(
  v: Pick<ScheduleVersion, 'status'>,
  roles?: string[] | null
): VersionAction[] {
  const out: VersionAction[] = [];
  if (v.status === 'draft' && canSubmitVersion(roles)) out.push('submit');
  if (v.status === 'submitted' && canApproveVersion(roles)) out.push('approve', 'reject');
  return out;
}

/** approved versions are the reporting reference */
export const isReferenceVersion = (v: Pick<ScheduleVersion, 'status'>): boolean => v.status === 'approved';

/** run one workflow action against the real service; never throws */
export async function runVersionAction(
  action: VersionAction,
  versionId: string,
  opts: { userId?: string | null; note?: string } = {}
): Promise<boolean> {
  try {
    if (action === 'submit') return await ScheduleVersionService.submitForApproval(versionId, opts.userId);
    if (action === 'approve') return await ScheduleVersionService.approve(versionId, opts.userId, opts.note);
    return await ScheduleVersionService.reject(versionId, opts.userId, opts.note);
  } catch (e: unknown) {
    logger.error(`schedule version "${action}" failed`, { detail: e });
    return false;
  }
}

/* ════ component ════ */

interface BaselineVersionActionsProps {
  versions: ScheduleVersion[];
  /** refetch versions after a successful action (page passes loadVersions) */
  onRefetch: () => void;
}

export default function BaselineVersionActions({ versions, onRefetch }: BaselineVersionActionsProps) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { roles, isLoading: rolesLoading, user } = useUserRoles();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmFor, setConfirmFor] = useState<{ id: string; versionNo: number; action: 'approve' | 'reject' } | null>(null);
  const [note, setNote] = useState('');

  const effectiveRoles = rolesLoading ? [] : roles;
  const actionable = versions.filter((v) => allowedActionsFor(v, effectiveRoles).length > 0);

  if (!actionable.length) return null;

  const openConfirm = (v: ScheduleVersion, action: 'approve' | 'reject') => {
    setNote('');
    setConfirmFor({ id: v.id, versionNo: v.version_no, action });
  };

  const execute = async (action: VersionAction, v: ScheduleVersion, reason?: string) => {
    setBusyId(v.id);
    try {
      const T = isAr ? ACTION_TOASTS : ACTION_TOASTS_EN;
      const ok = await runVersionAction(action, v.id, { userId: user?.id || null, note: reason });
      if (ok) {
        toast.success(T[action].success);
        setConfirmFor(null);
        setNote('');
        onRefetch();
      } else {
        toast.error(T[action].failure);
      }
    } finally {
      setBusyId(null);
    }
  };

  const btnBase =
    'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {/* divider between chips and actions */}
        <span className="w-px h-4 bg-slate-200 dark:bg-slate-700 shrink-0" aria-hidden />
        {actionable.map((v) => {
          const actions = allowedActionsFor(v, effectiveRoles);
          const busy = busyId === v.id;
          return (
            <span key={v.id} className="inline-flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400">v{v.version_no}:</span>
              {actions.includes('submit') && (
                <button
                  type="button"
                  disabled={!!busyId}
                  onClick={() => execute('submit', v)}
                  title={isAr
                    ? `إرسال النسخة v${v.version_no} لاعتماد مدير التخطيط`
                    : `Send version v${v.version_no} for planning manager approval`}
                  className={`${btnBase} bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/40`}
                >
                  {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  {isAr ? ACTION_LABELS.submit : ACTION_LABELS_EN.submit}
                </button>
              )}
              {actions.includes('approve') && (
                <>
                  <button
                    type="button"
                    disabled={!!busyId}
                    onClick={() => openConfirm(v, 'approve')}
                    title={isAr
                      ? `اعتماد النسخة v${v.version_no} — تصبح هي المرجع للتقارير`
                      : `Approve version v${v.version_no} — it becomes the reporting reference`}
                    className={`${btnBase} bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {isAr ? ACTION_LABELS.approve : ACTION_LABELS_EN.approve}
                  </button>
                  <button
                    type="button"
                    disabled={!!busyId}
                    onClick={() => openConfirm(v, 'reject')}
                    title={isAr
                      ? `رفض النسخة v${v.version_no} — يتطلب إثبات السبب`
                      : `Reject version v${v.version_no} — requires a reason`}
                    className={`${btnBase} bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40`}
                  >
                    <XCircle className="w-3 h-3" />
                    {isAr ? ACTION_LABELS.reject : ACTION_LABELS_EN.reject}
                  </button>
                </>
              )}
            </span>
          );
        })}
      </div>

      {/* inline confirm / reason panel */}
      {confirmFor && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 w-full">
          {confirmFor.action === 'approve' ? (
            <>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                {isAr ? (
                  <>اعتماد النسخة v{confirmFor.versionNo} يجعلها هي <b className="text-emerald-600">المرجع</b> الذي تُبنى عليه تقارير المتابعة — متابعة؟</>
                ) : (
                  <>Approving version v{confirmFor.versionNo} makes it the <b className="text-emerald-600">reference</b> progress reports are built on — continue?</>
                )}
              </span>
              <button
                type="button"
                disabled={!!busyId}
                onClick={() => {
                  const v = versions.find((x) => x.id === confirmFor.id);
                  if (v) execute('approve', v);
                }}
                className={`${btnBase} bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white px-3`}
              >
                {busyId ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                {isAr ? 'نعم، اعتماد' : 'Yes, Approve'}
              </button>
            </>
          ) : (
            <>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={1}
                placeholder={isAr
                  ? `سبب رفض النسخة v${confirmFor.versionNo} (إلزامي)`
                  : `Reason for rejecting version v${confirmFor.versionNo} (required)`}
                className="flex-1 min-w-[220px] px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] outline-none focus:border-rose-400 resize-none"
              />
              <button
                type="button"
                disabled={!!busyId || !isValidRejectReason(note)}
                onClick={() => {
                  const v = versions.find((x) => x.id === confirmFor.id);
                  if (v) execute('reject', v, note.trim());
                }}
                title={!isValidRejectReason(note) ? (isAr ? 'اكتب سبب الرفض أولاً' : 'Enter a rejection reason first') : undefined}
                className={`${btnBase} bg-rose-600 hover:bg-rose-700 border-rose-600 text-white px-3`}
              >
                {busyId ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                {isAr ? 'تأكيد الرفض' : 'Confirm Rejection'}
              </button>
            </>
          )}
          <button
            type="button"
            disabled={!!busyId}
            onClick={() => { setConfirmFor(null); setNote(''); }}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      )}
    </div>
  );
}
