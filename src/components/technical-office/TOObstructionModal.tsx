'use client';

import React, { useState } from 'react';
import { X, AlertTriangle, Loader2, ShieldAlert, FileQuestion, UserCheck, Flame } from 'lucide-react';
import { DeliverableItem } from '@/types/planning';
import { DeliverablesService } from '@/lib/services/deliverables.service';
import { TOProgressService } from '@/lib/services/toProgress.service';
import { NotificationService } from '@/lib/services/notification.service';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export interface TOObstructionModalProps {
  isOpen: boolean;
  item: DeliverableItem | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const TOObstructionModal: React.FC<TOObstructionModalProps> = ({
  isOpen,
  item,
  onClose,
  onSuccess,
}) => {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [obstructionType, setObstructionType] = useState<string>('design_conflict');
  const [bottleneckParty, setBottleneckParty] = useState<'consultant' | 'client' | 'main_contractor' | 'supplier' | 'internal'>('consultant');
  const [siteImpact, setSiteImpact] = useState<'site_stopped' | 'office_prep'>('site_stopped');
  const [reason, setReason] = useState<string>('');
  const [rfiNumber, setRfiNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error(isAr ? 'يرجى كتابة سبب الإعاقة الفنية وتفاصيلها' : 'Please provide obstruction reason');
      return;
    }

    setIsSubmitting(true);
    try {
      const impactTag = siteImpact === 'site_stopped' ? '[يوقف الصب بالموقع - CRITICAL]' : '[تجهيز مكتبي]';
      const partyTag = `[الجهة المسؤولة: ${bottleneckParty}]`;
      const rfiTag = rfiNumber.trim() ? `[RFI #${rfiNumber.trim()}]` : '';

      const fullReason = `${impactTag} ${partyTag} ${rfiTag} [${obstructionType}] ${reason.trim()}`.replace(/\s+/g, ' ');
      const projectId = item.project_id || item.deliverable?.project_id || '';

      // 1. Block deliverable item in deliverables service and save structured obstruction fields
      await DeliverablesService.blockItem(item.id, fullReason);
      await DeliverablesService.saveDeliverableItem({
        ...item,
        status: 'blocked',
        is_blocked: true,
        blocked_reason: fullReason,
        blocked_since: item.blocked_since || new Date().toISOString(),
        bottleneck_party: bottleneckParty,
        site_impact: siteImpact,
        rfi_number: rfiNumber.trim() || null,
      });

      // 1b. Auto-register RFI item if rfiNumber is provided and project_id exists
      if (rfiNumber.trim() && projectId) {
        try {
          await DeliverablesService.saveRfiItem({
            project_id: projectId,
            rfi_no: rfiNumber.trim(),
            subject:
              item.deliverable?.title_ar ||
              item.title_ar ||
              item.title ||
              item.description ||
              item.sheet_number ||
              rfiNumber.trim(),
            discipline: item.discipline || item.deliverable?.discipline || 'Civil',
            raised_by: 'المكتب الفني',
            status: 'open',
            notes: reason.trim(),
            related_deliverable_item_id: item.id,
          });
        } catch (rfiErr) {
          console.warn('Failed to auto-register RFI item:', rfiErr);
        }
      }

      // 2. Log obstruction event in TOProgressService
      await TOProgressService.logProgress({
        deliverable_item_id: item.id,
        project_id: projectId,
        progress_pct: item.progress_pct ?? 0,
        obstruction_type: obstructionType,
        obstruction_notes: fullReason,
        work_description: isAr ? `تسجيل عائق فني: ${reason.trim()}` : `Reported obstruction: ${reason.trim()}`,
      });

      // 3. Dispatch high-urgency notification to resolved COO and Management recipients
      try {
        const recipientUserIds = new Set<string>();
        try {
          const { data: roleRows } = await supabase
            .from('user_roles')
            .select('user_id, role')
            .in('role', ['coo', 'ceo', 'admin', 'technical_office_manager', 'to_manager']);

          (roleRows || []).forEach((row: { user_id?: string | null }) => {
            if (row?.user_id && typeof row.user_id === 'string' && row.user_id.trim()) {
              recipientUserIds.add(row.user_id.trim());
            }
          });

          if (projectId) {
            const { data: stkRows } = await supabase
              .from('project_stakeholders')
              .select('stakeholders(auth_user_id)')
              .eq('project_id', projectId)
              .eq('is_active', true);

            (stkRows || []).forEach((row: any) => {
              const stk = row?.stakeholders;
              if (Array.isArray(stk)) {
                stk.forEach((s: any) => {
                  if (s?.auth_user_id && typeof s.auth_user_id === 'string' && s.auth_user_id.trim()) {
                    recipientUserIds.add(s.auth_user_id.trim());
                  }
                });
              } else if (stk?.auth_user_id && typeof stk.auth_user_id === 'string' && stk.auth_user_id.trim()) {
                recipientUserIds.add(stk.auth_user_id.trim());
              }
            });
          }
        } catch (resolveErr) {
          console.warn('Failed to resolve notification recipients:', resolveErr);
        }

        const recipientTargets =
          recipientUserIds.size > 0 ? Array.from(recipientUserIds) : ['coo_management'];

        await Promise.all(
          recipientTargets.map((recipientId) =>
            NotificationService.createNotification({
              project_id: projectId || null,
              event_type: 'technical_office_blocker',
              entity_type: 'obstruction',
              entity_id: item.id,
              recipient_user_id: recipientId,
              title_ar:
                siteImpact === 'site_stopped'
                  ? `🚨 عائق حرج يوقف الصب بالموقع: ${item.sheet_number || item.description}`
                  : `⚠️ عائق فني مسجل: ${item.sheet_number || item.description}`,
              title_en:
                siteImpact === 'site_stopped'
                  ? `🚨 Critical Blocker (Site Stopped): ${item.sheet_number || item.description}`
                  : `⚠️ Technical Obstruction: ${item.sheet_number || item.description}`,
              body_ar: `جهة التأخير: [${bottleneckParty}] | السبب: ${reason.trim()}`,
              body_en: `Bottleneck: [${bottleneckParty}] | Details: ${reason.trim()}`,
              link_url: '/coo/deliverables',
              metadata: {
                sheet_number: item.sheet_number,
                bottleneck_party: bottleneckParty,
                site_impact: siteImpact,
                rfi_number: rfiNumber.trim(),
              },
            })
          )
        );
      } catch (notifErr) {
        console.warn('Failed to dispatch notification:', notifErr);
      }

      toast.success(
        isAr ? 'تم تسجيل العائق الفني وإشعار الإدارة التنفيذية فورياً' : 'Obstruction logged & management notified'
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(isAr ? 'فشل تسجيل العائق الفني' : 'Failed to report obstruction');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="obstruction-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-300/80 dark:border-amber-700/60 shadow-sm shadow-amber-500/10">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="obstruction-modal-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                {isAr ? 'إثبات عائق فني للوحة' : 'Report Technical Obstruction'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5 inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
                {item.sheet_number || item.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] p-2 text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            aria-label={isAr ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Obstruction Type Selection */}
          <div className="space-y-1.5">
            <label htmlFor="obstruction-type-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'تصنيف العائق الفني:' : 'Obstruction Category:'}
            </label>
            <select
              id="obstruction-type-select"
              value={obstructionType}
              onChange={(e) => setObstructionType(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-all"
            >
              <option value="design_conflict" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'تعارض تصميمي (معماري / إنشائي / كهروميكانيكي)' : 'Design Conflict'}</option>
              <option value="missing_info" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'نقص معلومات أو مواصفات (يتطلب استفساراً فنياً)' : 'Missing Information / Spec'}</option>
              <option value="site_discrepancy" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'اختلاف أبعاد ومناسيب الموقع الفعلي' : 'Site Discrepancy'}</option>
              <option value="consultant_hold" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'معلق على اعتماد استشاري سابق' : 'Pending Consultant Approval'}</option>
              <option value="material_spec" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'عدم توفر المادة / اختلاف مواصفة العينة' : 'Material Spec Issue'}</option>
              <option value="aquatic_puddle_sleeve" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'تعارض جلب أو فتحات ومخترقات خرسانية' : 'Puddle Flange / Sleeve Clash'}</option>
              <option value="other" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? 'عائق آخر' : 'Other'}</option>
            </select>
          </div>

          {/* Accountability: Who holds the ball? */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="bottleneck-party-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>{isAr ? 'الجهة المسؤولة عن التأخير:' : 'Bottleneck Party:'}</span>
              </label>
              <select
                id="bottleneck-party-select"
                value={bottleneckParty}
                onChange={(e) => setBottleneckParty(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-bold cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-all"
              >
                <option value="consultant" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? '⏱️ الاستشاري (مراجعة / تأخر رد)' : 'Consultant'}</option>
                <option value="client" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? '🏛️ المالك / المطور (توجيهات / قرارات)' : 'Client / Owner'}</option>
                <option value="main_contractor" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? '🏗️ المقاول العام / الموقع (تسليم أبعاد)' : 'Main Contractor / Site'}</option>
                <option value="supplier" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? '🚚 المورد / مقاول الباطن (بيانات فنية وعينات)' : 'Supplier / Subcontractor'}</option>
                <option value="internal" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? '🏢 المكتب الفني الداخلي (تنسيق متبادل)' : 'Internal T.O Coordination'}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="site-impact-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                <span>{isAr ? 'الأثر الميداني على الموقع:' : 'Site Impact:'}</span>
              </label>
              <select
                id="site-impact-select"
                value={siteImpact}
                onChange={(e) => setSiteImpact(e.target.value as any)}
                className={`w-full px-3 py-2 text-xs rounded-xl border font-bold cursor-pointer focus:outline-none focus-visible:ring-2 transition-all ${
                  siteImpact === 'site_stopped'
                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 focus-visible:ring-rose-500'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800 focus-visible:ring-amber-500'
                }`}
              >
                <option value="site_stopped" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? '🔴 حرج: يوقف أعمال الصب والتنفيذ بالموقع' : '🔴 Concrete Pour / Site Halted'}</option>
                <option value="office_prep" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">{isAr ? '🟡 تحضير مكتبي / لا يوقف الموقع حالياً' : '🟡 Office Prep Only'}</option>
              </select>
            </div>
          </div>

          {/* Related RFI Number */}
          <div className="space-y-1.5">
            <label htmlFor="rfi-number-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'رقم الاستفسار الفني المرتبط (إن وجد):' : 'Related RFI Number (Optional):'}
            </label>
            <div className="relative">
              <FileQuestion className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="rfi-number-input"
                type="text"
                value={rfiNumber}
                onChange={(e) => setRfiNumber(e.target.value)}
                placeholder={isAr ? 'مثال: RFI-STR-012' : 'e.g., RFI-STR-012'}
                className="w-full ps-9 pe-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-all"
              />
            </div>
          </div>

          {/* Reason & Detailed Notes */}
          <div className="space-y-1.5">
            <label htmlFor="obstruction-reason-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {isAr ? 'شرح العائق الفني وسبب تعطل اللوحة:' : 'Detailed Obstruction Description:'} <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="obstruction-reason-input"
              rows={4}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                isAr
                  ? 'يرجى كتابة تفاصيل المشكلة الهندسية بدقة (مثلاً: تعارض مسار ماسورة الصرف مع كمرة السقف في المحور B-4)...'
                  : 'Specify exact technical discrepancy (e.g. MEP pipe clashes with structural beam at axis B-4)...'
              }
              className="w-full p-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 transition-all"
            />
          </div>

          {/* Alert Notice */}
          <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-200 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <span>
              {isAr
                ? 'سيتم تسجيل هذا العائق رسمياً في سجل مهام مدير المشروع والمكتب الفني لحفظ حقوق الموقع التعاقدية.'
                : 'This obstruction will be logged in PM & TO radars to protect contractual project timelines.'}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 dark:focus-visible:ring-slate-600"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="min-h-[44px] px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-sm shadow-amber-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري التسجيل...' : 'Logging...'}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>{isAr ? 'تأكيد تسجيل العائق' : 'Confirm Obstruction'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
