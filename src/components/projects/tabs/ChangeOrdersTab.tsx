'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, VariationOrderItem } from '@/types';
import { VariationOrdersManager } from '@/components/projects/VariationOrdersManager';
import { ProjectService } from '@/lib/services/project.service';
import { ProjectTabsService } from '@/lib/services/projectTabs.service';
import { BoqService } from '@/lib/services/boq.service';
import { BoqItem } from '@/types/boq';
import { calculateNetVos } from '@/lib/services/project.payload';
import { reconcileProjectBoqWithContract } from '@/lib/utils/boq-cost-control.utils';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { AlertCircle, Save, RotateCcw, Loader2 } from 'lucide-react';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { canEditPath } from '@/lib/rbac/access-control';

interface ChangeOrdersTabProps {
  project: Project;
  onProjectUpdate?: (updated: Project) => void;
  isAr?: boolean;
}

export const ChangeOrdersTab: React.FC<ChangeOrdersTabProps> = React.memo(({
  project,
  onProjectUpdate,
  isAr = true,
}) => {
  const { roles, isAdmin } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const isViewerOnly = roles.length > 0 && roles.every((r) => r.toLowerCase() === 'viewer') && !isAdmin;
  const canEdit =
    !isViewerOnly &&
    (canEditPath('/projects', roles, isAdmin, dbAccessRules) ||
      canEditPath('/contracts', roles, isAdmin, dbAccessRules));
  // Extract initial variation orders from project or metadata
  const getInitialOrders = useCallback((): VariationOrderItem[] => {
    const fromProject = project.variation_orders;
    if (Array.isArray(fromProject) && fromProject.length > 0) {
      return fromProject;
    }
    const fromMeta = (project.metadata as Record<string, unknown> | undefined)?.variation_orders;
    if (Array.isArray(fromMeta) && fromMeta.length > 0) {
      return fromMeta as VariationOrderItem[];
    }
    // If project has existing non-zero vos_value from DB but no breakdown array yet, create initial approved card
    const existingVos = Number(project.vos_value) || 0;
    if (existingVos !== 0) {
      return [
        {
          id: `vo_migrated_${project.id}`,
          vo_number: 'VO-01',
          title: isAr ? 'أمر تغيير معتمد (مسجل مسبقاً بالمشروع)' : 'Approved Variation Order (Legacy)',
          type: existingVos >= 0 ? 'addition' : 'deduction',
          amount: Math.abs(existingVos),
          issue_date: project.contract_date || new Date().toISOString().split('T')[0],
          approval_date: project.contract_date || new Date().toISOString().split('T')[0],
          time_impact_days: 0,
          status: 'approved',
          notes: isAr ? 'تم ترحيل القيمة من رصيد أوامر التغيير المسجل مسبقاً' : 'Migrated from project vos_value balance',
        },
      ];
    }
    return [];
  }, [project, isAr]);

  const [variationOrders, setVariationOrders] = useState<VariationOrderItem[]>(getInitialOrders);
  const [savedOrders, setSavedOrders] = useState<VariationOrderItem[]>(getInitialOrders);
  const [saving, setSaving] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [boqItems, setBoqItems] = useState<BoqItem[]>([]);

  // Fetch active project's BOQ items for real-time contractual reconciliation
  useEffect(() => {
    let isCancelled = false;
    BoqService.getBoqItems(project.id)
      .then((items) => {
        if (!isCancelled && items) {
          setBoqItems(items);
        }
      })
      .catch((err) => {
        logger.warn('Failed to load project boq items in ChangeOrdersTab:', { detail: err });
      });
    return () => {
      isCancelled = true;
    };
  }, [project.id]);

  // Dynamic reconciliation between live variation orders and current BOQ
  const liveReconciliation = useMemo(() => {
    const { netVos } = calculateNetVos(variationOrders);
    const contractBase = Number(project.contract_value ?? project.contract_value_egp ?? 0);
    const tempProject: Project = {
      ...project,
      vos_value: netVos,
      total_contract_value: contractBase + netVos,
    };
    return reconcileProjectBoqWithContract(tempProject, boqItems);
  }, [project, variationOrders, boqItems]);

  // Sync if parent project object changes externally
  useEffect(() => {
    const fresh = getInitialOrders();
    if (!initialLoaded && fresh.length > 0) {
      setVariationOrders(fresh);
      setSavedOrders(fresh);
      setInitialLoaded(true);
    }
  }, [getInitialOrders, initialLoaded]);

  // Check legacy pm_change_orders table if no orders found in metadata
  useEffect(() => {
    let isCancelled = false;
    if (variationOrders.length === 0) {
      ProjectTabsService.getChangeOrders(project.id)
        .then((legacyList) => {
          if (!isCancelled && legacyList && legacyList.length > 0) {
            const mapped: VariationOrderItem[] = legacyList.map((co, idx) => ({
              id: co.id,
              vo_number: co.vo_number || `VO-${String(idx + 1).padStart(2, '0')}`,
              title: co.title_ar,
              type: (co.amount_egp || 0) >= 0 ? 'addition' : 'deduction',
              amount: Math.abs(co.amount_egp || 0),
              time_impact_days: co.time_extension_days || 0,
              status: co.status === 'approved' ? 'approved' : 'under_review',
              approval_date: co.approval_date,
            }));
            setVariationOrders(mapped);
            setSavedOrders(mapped);
          }
        })
        .catch((err) => {
          logger.warn('Failed to load legacy change orders fallback:', { detail: err });
        });
    }
    return () => {
      isCancelled = true;
    };
  }, [project.id, variationOrders.length]);

  // Dirty check: are there unsaved changes?
  const isDirty = useMemo(() => {
    return JSON.stringify(variationOrders) !== JSON.stringify(savedOrders);
  }, [variationOrders, savedOrders]);

  // Save handler: commits variation orders to pm_projects and updates total contract value
  const handleSave = async () => {
    if (!canEdit) return;
    setSaving(true);
    try {
      const { netVos } = calculateNetVos(variationOrders);
      const updatedMetadata = {
        ...(project.metadata || {}),
        variation_orders: variationOrders,
      };

      const updated = await ProjectService.updateProject(project.id, {
        metadata: updatedMetadata,
        variation_orders: variationOrders,
        vos_value: netVos,
      });

      setSavedOrders([...variationOrders]);
      if (onProjectUpdate && updated) {
        onProjectUpdate(updated);
      }

      toast.success(
        isAr
          ? 'تم حفظ واعتماد أوامر التغيير بنجاح وتحديث إجمالي العقد'
          : 'Variation orders saved successfully and contract total synced'
      );

      // Cost Control Reconciliation Alert
      if (liveReconciliation && !liveReconciliation.is_matched && boqItems.length > 0) {
        const diffAmt = Math.abs(liveReconciliation.variance).toLocaleString();
        toast.warning(
          isAr
            ? `تنبيه ضبط التكاليف: بنود المقايسة الحالية غير مطابقة للقيمة التعاقدية المعدلة بفارق (${diffAmt} ج.م). يرجى مراجعة وتعديل بنود المقايسة.`
            : `Cost Control Notice: BOQ is not reconciled with final contract value (Variance: ${diffAmt} EGP). Please update BOQ items.`,
          { duration: 7000 }
        );
      }
    } catch (err: unknown) {
      logger.error('Failed to save variation orders in ChangeOrdersTab:', { detail: err });
      toast.error(
        isAr
          ? 'حدث خطأ أثناء حفظ أوامر التغيير'
          : (err instanceof Error ? err.message : 'Failed to save variation orders')
      );
    } finally {
      setSaving(false);
    }
  };

  // Reset handler: roll back to last saved state
  const handleReset = () => {
    setVariationOrders([...savedOrders]);
    toast.info(isAr ? 'تم إلغاء التعديلات والتراجع للحالة السابقة' : 'Reverted to last saved state');
  };

  return (
    <div className="space-y-4">
      {/* Unsaved Changes Banner */}
      {canEdit && isDirty && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 dark:border-amber-500/40 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
          <div className="flex items-center gap-2.5 text-amber-800 dark:text-amber-200">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-xs sm:text-sm font-semibold">
              <span>
                {isAr
                  ? 'توجد تعديلات غير محفوظة على أوامر التغيير. اضغط "حفظ التعديلات" لتطبيق الأثر المالي والزمني على المشروع.'
                  : 'You have unsaved changes. Click "Save Changes" to update project financials and schedule.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isAr ? 'تراجع' : 'Reset'}</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer ring-1 ring-emerald-500/30"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isAr ? 'جاري الحفظ...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isAr ? 'حفظ التعديلات' : 'Save Changes'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Render Main VariationOrdersManager */}
      <div className="glass-card p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900/60">
        <VariationOrdersManager
          variationOrders={variationOrders}
          onChange={setVariationOrders}
          contractBaseValue={Number(project.contract_value ?? project.contract_value_egp ?? 0)}
          structures={project.water_structures || ((project.metadata as Record<string, unknown> | undefined)?.water_structures as any) || []}
          isAr={isAr}
          readOnly={!canEdit}
          onSave={canEdit ? handleSave : undefined}
          isSaving={saving}
          isDirty={isDirty}
          onReset={canEdit ? handleReset : undefined}
          reconciliation={liveReconciliation}
          projectId={project.id}
        />
      </div>
    </div>
  );
});

ChangeOrdersTab.displayName = 'ChangeOrdersTab';
