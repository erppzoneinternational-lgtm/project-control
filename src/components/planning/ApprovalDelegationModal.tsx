'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  UserCheck, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  UserX, 
  RefreshCw,
} from 'lucide-react';
import { ApprovalDelegation } from '@/types/planning';
import { Stakeholder, ProjectTeamMember } from '@/types';
import { DailyProgressService } from '@/lib/services/dailyProgress.service';
import { ProjectService } from '@/lib/services/project.service';
import { ProjectTabsService } from '@/lib/services/projectTabs.service';
import { useAuth } from '@/lib/stores/useAuthStore';
import { logger } from '@/lib/logger';

interface ApprovalDelegationModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export const ApprovalDelegationModal: React.FC<ApprovalDelegationModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState<ApprovalDelegation[]>([]);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [teamMembers, setTeamMembers] = useState<ProjectTeamMember[]>([]);
  const [loading, setLoading] = useState(false);

  // New Delegation Form State
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [delegatedToId, setDelegatedToId] = useState('');
  const [validFrom, setValidFrom] = useState(new Date().toISOString().slice(0, 10));
  const [validTo, setValidTo] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load Delegations & Stakeholders
  const loadDelegations = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [delList, stkList, teamList] = await Promise.all([
        DailyProgressService.getDelegations(projectId),
        ProjectService.getProjectManagers(),
        ProjectTabsService.getTeamMembers(projectId),
      ]);
      setDelegations(delList);
      setStakeholders(stkList);
      setTeamMembers(teamList);
    } catch (err) {
      logger.error('Error loading delegations', { detail: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && projectId) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsAddingNew(false);
      loadDelegations();
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  // Handle Save New Delegation
  const handleSaveDelegation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delegatedToId) {
      setErrorMsg('يرجى اختيار العضو أو المهندس المفوض');
      return;
    }
    if (!validFrom || !validTo || validFrom > validTo) {
      setErrorMsg('يرجى تحديد فترة سريان صحيحة للتفويض');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      // FK targets stakeholders(id) — resolve the selected option to a stakeholder UUID.
      const resolvedTargetId = (() => {
        if (delegatedToId.startsWith('tm:')) {
          const tm = teamMembers.find((m) => m.id === delegatedToId.slice(3));
          return tm?.stakeholder_id || '';
        }
        if (delegatedToId.startsWith('stk:')) return delegatedToId.slice(4);
        return '';
      })();

      if (!resolvedTargetId) {
        setErrorMsg(
          'العضو المختار غير مرتبط بملف أصحاب المصلحة (Stakeholder) — يرجى اختيار مهندس له ملف في قائمة المسؤولين'
        );
        setIsSaving(false);
        return;
      }

      // delegator_id must also be a stakeholders.id; match by email against the auth user.
      const myEmail = user?.email?.toLowerCase();
      const myStakeholder = myEmail
        ? stakeholders.find((s) => s.email?.toLowerCase() === myEmail)
        : undefined;

      const payload: Partial<ApprovalDelegation> = {
        project_id: projectId,
        delegator_id: myStakeholder?.id,
        delegated_to_id: resolvedTargetId,
        valid_from: validFrom,
        valid_to: validTo,
        is_active: true,
        notes: notes.trim() || undefined,
      };

      const saved = await DailyProgressService.saveDelegation(payload);
      if (!saved) {
        throw new Error('فشل حفظ قرار التفويض في قاعدة البيانات');
      }

      setSuccessMsg('تم منح تفويض الصلاحيات بنجاح');
      setIsAddingNew(false);
      setDelegatedToId('');
      setNotes('');
      loadDelegations();
    } catch (err: unknown) {
      const errInfo = err as { message?: string; code?: string; details?: string } | null | undefined;
      logger.error('Error saving delegation', { detail: err });
      setErrorMsg(errInfo?.message || 'حدث خطأ أثناء منح التفويض');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Revoke Delegation
  const handleRevokeDelegation = async (id: string) => {
    if (!confirm('هل أنت متأكد من إلغاء وسحب هذا التفويض فوراً؟')) return;

    setErrorMsg(null);
    try {
      const ok = await DailyProgressService.revokeDelegation(id);
      if (ok) {
        setDelegations((prev) =>
          prev.map((d) => (d.id === id ? { ...d, is_active: false } : d))
        );
        setSuccessMsg('تم إلغاء التفويض بنجاح');
      }
    } catch (err: unknown) {
      const errInfo = err as { message?: string; code?: string; details?: string } | null | undefined;
      logger.error('Error revoking delegation', { detail: err });
      setErrorMsg(errInfo?.message || 'فشل إلغاء التفويض');
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>إدارة تفويض صلاحيات الاعتماد (Approval Delegation)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                منح تفويض مؤقت لمدير التنفيذ أو مهندس أول لمراجعة واعتماد اليوميات
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

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              سجل التفويضات النشطة والسابقة ({delegations.length})
            </span>

            {!isAddingNew && (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setIsAddingNew(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>منح تفويض جديد</span>
              </button>
            )}
          </div>

          {/* New Delegation Form */}
          {isAddingNew && (
            <div className="p-5 rounded-3xl border border-emerald-200 dark:border-emerald-950/60 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-950 dark:text-emerald-300 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                  <span>بيانات تفويض الاعتماد الجديد</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  aria-label="إلغاء الإضافة"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDelegation} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    الشخص المفوض إليه (المسؤول / المهندس) *
                  </label>
                  <select
                    required
                    value={delegatedToId}
                    onChange={(e) => setDelegatedToId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white"
                  >
                    <option value="">-- اختر المهندس / المسؤول --</option>
                    {/* Team Members (value prefixed tm: — resolved to stakeholder_id on save) */}
                    <optgroup label="فريق عمل المشروع (Project Team)">
                      {teamMembers.map((tm) => (
                        <option key={tm.id} value={`tm:${tm.id}`}>
                          {tm.person_name} ({tm.role_title_ar || 'مهندس'})
                          {!tm.stakeholder_id ? ' — غير مرتبط بملف Stakeholder' : ''}
                        </option>
                      ))}
                    </optgroup>
                    {/* Stakeholders */}
                    <optgroup label="قائمة مديري المشاريع والمسؤولين">
                      {stakeholders.map((s) => (
                        <option key={s.id} value={`stk:${s.id}`}>
                          {s.name_ar} ({s.role || 'مسؤول'})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      <span>تاريخ بدء التفويض *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={validFrom}
                      onChange={(e) => setValidFrom(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>تاريخ انتهاء التفويض *</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={validTo}
                      onChange={(e) => setValidTo(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    ملاحظات ونطاق الصلاحيات
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: تفويض اعتماد اليوميات أثناء إجازة مدير المشروع..."
                    className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md shadow-emerald-500/20 transition disabled:opacity-50"
                  >
                    {isSaving ? 'جاري الحفظ...' : 'تأكيد ومنح التفويض'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Delegations List */}
          <div className="space-y-3">
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-500 mb-2" />
                <span>جاري تحميل قائمة التفويضات...</span>
              </div>
            ) : delegations.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                لا توجد تفويضات مسجلة لهذا المشروع حالياً
              </div>
            ) : (
              delegations.map((d) => {
                const isCurrentlyActive = d.is_active && d.valid_from <= today && d.valid_to >= today;

                const delegatedPersonName =
                  d.delegated_to?.name_ar ||
                  teamMembers.find((tm) => tm.id === d.delegated_to_id)?.person_name ||
                  stakeholders.find((s) => s.id === d.delegated_to_id)?.name_ar ||
                  d.delegated_to_id;

                return (
                  <div
                    key={d.id}
                    className={`p-4 rounded-2xl border transition space-y-3 ${
                      isCurrentlyActive
                        ? 'bg-emerald-50/30 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/60 shadow-sm'
                        : !d.is_active
                        ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/40 opacity-70'
                        : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${
                            isCurrentlyActive
                              ? 'bg-emerald-500 animate-pulse'
                              : !d.is_active
                              ? 'bg-rose-500'
                              : 'bg-slate-400'
                          }`}
                        />
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          المفوض: {delegatedPersonName}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isCurrentlyActive ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                            ساري ونشط
                          </span>
                        ) : !d.is_active ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                            ملغي / مسحوب
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            منتهي الصلاحية
                          </span>
                        )}

                        {d.is_active && (
                          <button
                            type="button"
                            onClick={() => handleRevokeDelegation(d.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="إلغاء وسحب التفويض فوراً"
                            aria-label="إلغاء وسحب التفويض فوراً"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <div>
                        <span>من: </span>
                        <strong className="text-slate-700 dark:text-slate-300">{d.valid_from}</strong>
                      </div>
                      <div>
                        <span>إلى: </span>
                        <strong className="text-slate-700 dark:text-slate-300">{d.valid_to}</strong>
                      </div>
                    </div>

                    {d.notes && (
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        {d.notes}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end text-xs">
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
