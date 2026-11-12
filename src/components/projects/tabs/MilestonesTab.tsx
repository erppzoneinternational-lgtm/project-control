'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, PaymentMilestone } from '@/types';
import { ProjectTabsService } from '@/lib/services/projectTabs.service';
import { Target, Plus, Trash2, Loader2, Calendar, CheckCircle2, Clock, AlertCircle, X } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { useCleanupEffect } from '@/lib/utils/useCleanupEffect';
import { useLanguage } from '@/contexts/LanguageContext';
import { logger } from '@/lib/logger';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';

export const MilestonesTab: React.FC<{ project: Project }> = React.memo(({ project }) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const isViewerOnly = roles.length > 0 && roles.every((r) => r.toLowerCase() === 'viewer') && !isAdmin;
  const canEdit =
    !isViewerOnly &&
    (canEditPath('/projects', roles, isAdmin, dbAccessRules) ||
      canEditPath('/contracts', roles, isAdmin, dbAccessRules));
  const [items, setItems] = useState<PaymentMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nameAr, setNameAr] = useState('');
  const [percentage, setPercentage] = useState(0);
  const [amountEgp, setAmountEgp] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'pending' | 'due' | 'paid'>('pending');

  const loadData = useCallback(async (isCancelled?: () => boolean) => {
    setLoading(true);
    try {
      const data = await ProjectTabsService.getMilestones(project.id);
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

  const handlePercentageChange = (pct: number) => {
    setPercentage(pct);
    if (project.contract_value) {
      setAmountEgp(Math.round((project.contract_value * pct) / 100));
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!nameAr.trim()) return;

    setSaving(true);
    try {
      await ProjectTabsService.addMilestone({
        project_id: project.id,
        milestone_name_ar: nameAr.trim(),
        percentage: Number(percentage) || 0,
        amount_egp: Number(amountEgp) || 0,
        due_date: dueDate || undefined,
        status
      });
      setShowModal(false);
      setNameAr('');
      setPercentage(0);
      setAmountEgp(0);
      setDueDate('');
      await loadData();
    } catch (err) {
      logger.error('Failed to add milestone', { detail: err });
      alert(isAr ? 'حدث خطأ أثناء إضافة محطة الدفع' : 'Error adding payment milestone');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: PaymentMilestone) => {
    if (!canEdit) return;
    if (!confirm(isAr
      ? `حذف محطة الدفع "${item.milestone_name_ar}" ونقلها للأرشيف؟`
      : `Delete payment milestone "${item.milestone_name_ar}" and move it to the archive?`
    )) return;
    try {
      await ProjectTabsService.deleteMilestone(item.id, item);
      await loadData();
    } catch (err) {
      logger.error('Failed to delete milestone', { detail: err });
    }
  };

  const { totalPercentage, paidPercentage, totalAmount, paidAmount } = useMemo(() => {
    const totalPct = items.reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
    const paidPct = items
      .filter(i => i.status === 'paid')
      .reduce((acc, curr) => acc + (Number(curr.percentage) || 0), 0);
    const totalAmt = items.reduce((acc, curr) => acc + (Number(curr.amount_egp) || 0), 0);
    const paidAmt = items
      .filter(i => i.status === 'paid')
      .reduce((acc, curr) => acc + (Number(curr.amount_egp) || 0), 0);
    return {
      totalPercentage: totalPct,
      paidPercentage: paidPct,
      totalAmount: totalAmt,
      paidAmount: paidAmt
    };
  }, [items]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500 mb-2" />
        <p className="text-xs font-bold">{isAr ? 'جاري تحميل محطات الدفع والاستحقاق...' : 'Loading payment milestones...'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-500" />
            <span>{isAr ? 'محطات الدفع والاستحقاق' : 'Payment Milestones'}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAr ? 'دفوعات العقد ومراحل استحقاق الدفعات المقررة' : 'Contract payments and their scheduled due dates.'}
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-lg shadow-purple-500/20 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة محطة دفع جديدة' : 'Add Payment Milestone'}</span>
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">{isAr ? 'إجمالي المحطات المجدولة' : 'Total Scheduled'}</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">{totalPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, totalPercentage))}%` }}
              />
            </div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {formatCurrency(totalAmount)} {isAr ? 'ج.م' : 'EGP'}
            </p>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">{isAr ? 'المبالغ المسددة' : 'Paid Amount'}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{paidPercentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, paidPercentage))}%` }}
              />
            </div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(paidAmount)} {isAr ? 'ج.م' : 'EGP'}
            </p>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">{isAr ? 'المتبقي قيد الاستحقاق' : 'Remaining / Due'}</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {Math.max(0, totalPercentage - paidPercentage).toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, totalPercentage - paidPercentage))}%` }}
              />
            </div>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(Math.max(0, totalAmount - paidAmount))} {isAr ? 'ج.م' : 'EGP'}
            </p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500 dark:text-slate-400 text-xs rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-3">
          <Target className="w-8 h-8 text-slate-400 dark:text-slate-600 stroke-[1.5]" />
          <p>
            {isAr
              ? 'لا توجد محطات دفع مسجلة لهذا المشروع في قاعدة البيانات حالياً.'
              : 'No payment milestones recorded for this project yet.'}
          </p>
          {canEdit && (
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'إضافة أول محطة دفع' : 'Add first milestone'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className="glass-card p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200 dark:border-slate-800/80 hover:border-purple-500/30 transition-all bg-white/50 dark:bg-slate-900/50 shadow-sm"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    item.status === 'paid' ? 'bg-emerald-500' : item.status === 'due' ? 'bg-amber-500' : 'bg-purple-500'
                  }`} />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.milestone_name_ar}</h4>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <span>{isAr ? 'النسبة من العقد:' : 'Contract %:'}</span>
                    <b className="text-purple-600 dark:text-purple-400 font-bold">{item.percentage}%</b>
                  </span>
                  <span className="flex items-center gap-1">
                    <span>{isAr ? 'المبلغ:' : 'Amount:'}</span>
                    <b className="text-emerald-600 dark:text-emerald-400 font-bold">
                      {formatCurrency(item.amount_egp)} {isAr ? 'ج.م' : 'EGP'}
                    </b>
                  </span>
                  {item.due_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{isAr ? 'تاريخ الاستحقاق:' : 'Due date:'}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.due_date}</span>
                    </span>
                  )}
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.status === 'paid'
                        ? 'bg-emerald-500'
                        : item.status === 'due'
                        ? 'bg-amber-500'
                        : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, item.percentage))}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                  item.status === 'paid'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : item.status === 'due'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                }`}>
                  {item.status === 'paid' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  ) : item.status === 'due' ? (
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                  ) : (
                    <Clock className="w-3 h-3 text-slate-400" />
                  )}
                  {item.status === 'paid'
                    ? (isAr ? 'مدفوعة' : 'Paid')
                    : item.status === 'due'
                    ? (isAr ? 'مستحقة' : 'Due')
                    : (isAr ? 'معلقة' : 'Pending')}
                </span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:outline-none transition-colors"
                    title={isAr ? 'حذف ونقل للأرشيف' : 'Delete and archive'}
                    aria-label={isAr ? 'حذف ونقل للأرشيف' : 'Delete and archive'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && canEdit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 space-y-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{isAr ? 'إضافة محطة دفع جديدة' : 'Add Payment Milestone'}</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:outline-none transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                  {isAr ? 'اسم أو وصف محطة الدفع *' : 'Milestone name / description *'}
                </label>
                <input
                  type="text"
                  required
                  value={nameAr}
                  onChange={e => setNameAr(e.target.value)}
                  placeholder={isAr ? 'مثال: الدفعة المقدمة' : 'e.g. Advance Payment'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'نسبة العقد (%)' : 'Contract Percentage (%)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={percentage}
                    onChange={e => handlePercentageChange(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'المبلغ (ج.م)' : 'Amount (EGP)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={amountEgp}
                    onChange={e => setAmountEgp(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'تاريخ الاستحقاق' : 'Due Date'}
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1 text-slate-700 dark:text-slate-300">
                    {isAr ? 'الحالة' : 'Status'}
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 cursor-pointer transition-all"
                  >
                    <option value="pending" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{isAr ? 'معلقة' : 'Pending'}</option>
                    <option value="due" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{isAr ? 'مستحقة' : 'Due'}</option>
                    <option value="paid" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{isAr ? 'مدفوعة' : 'Paid'}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:outline-none transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'حفظ المحطة' : 'Save Milestone')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

MilestonesTab.displayName = 'MilestonesTab';
