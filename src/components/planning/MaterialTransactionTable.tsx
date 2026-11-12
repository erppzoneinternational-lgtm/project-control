'use client';
import { useUserRoles } from '@/lib/hooks/useUserRoles';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeftRight, 
  Plus, 
  Search, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Scale, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  FileSpreadsheet, 
  RefreshCw, 
  X, 
  Boxes, 
  TrendingDown, 
  AlertCircle,
  type LucideIcon
} from 'lucide-react';
import { 
  MaterialTransaction, 
  MaterialTransactionType, 
  MaterialWastageReport,
  BoqItem,
  BoqSubMaterial 
} from '@/types/boq';
import { SiteOperationsService } from '@/lib/services/siteOperations.service';
import { BoqService } from '@/lib/services/boq.service';
import { PriceGate } from './PriceGate';
import { logger } from '@/lib/logger';

export const TX_TYPE_CONFIG: Record<
  MaterialTransactionType,
  { labelAr: string; labelEn: string; color: string; icon: LucideIcon }
> = {
  issue_to_site: {
    labelAr: 'صرف للموقع',
    labelEn: 'Issue to Site',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    icon: ArrowUpRight,
  },
  return_to_store: {
    labelAr: 'مرتجع للمخزن',
    labelEn: 'Return to Store',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    icon: ArrowDownLeft,
  },
  adjustment: {
    labelAr: 'تسوية جردية',
    labelEn: 'Inventory Adjustment',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-800',
    icon: Scale,
  },
  waste_writeoff: {
    labelAr: 'إهلاك وهالك معتمد',
    labelEn: 'Approved Wastage',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    icon: Trash2,
  },
  received_on_site: {
    labelAr: 'استلام موقع',
    labelEn: 'Received on Site',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    icon: Boxes,
  },
};

export interface MaterialTransactionTableProps {
  projectId: string;
  isAr?: boolean;
}

export const MaterialTransactionTable: React.FC<MaterialTransactionTableProps> = ({ 
  projectId,
  isAr = true,
}) => {
  const { roles, isAdmin } = useUserRoles();
  const [transactions, setTransactions] = useState<MaterialTransaction[]>([]);
  const [wastageReport, setWastageReport] = useState<MaterialWastageReport | null>(null);
  const [subMaterials, setSubMaterials] = useState<(BoqSubMaterial & { boq_item?: BoqItem })[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<MaterialTransactionType | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'wastage' | 'transactions'>('wastage');

  // Add Transaction Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubMaterialId, setNewSubMaterialId] = useState('');
  const [newTxDate, setNewTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTxType, setNewTxType] = useState<MaterialTransactionType>('issue_to_site');
  const [newQty, setNewQty] = useState<number>(0);
  const [newZone, setNewZone] = useState('');
  const [newRefWirNo, setNewRefWirNo] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load Transactions & Wastage Report
  const loadData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [txs, report, boqList] = await Promise.all([
        SiteOperationsService.getMaterialTransactions(projectId),
        SiteOperationsService.getMaterialWastageReport(projectId),
        BoqService.getBoqItems(projectId, true, { userRoles: roles, isAdmin }),
      ]);
      setTransactions(txs);
      setWastageReport(report);

      // Load sub-materials for all BOQ items
      const allSubMaterials: (BoqSubMaterial & { boq_item?: BoqItem })[] = [];
      for (const boq of boqList) {
        const subs = await BoqService.getSubMaterials(boq.id);
        subs.forEach((s) => allSubMaterials.push({ ...s, boq_item: boq }));
      }
      setSubMaterials(allSubMaterials);
    } catch (err) {
      logger.error('Error loading material transactions and wastage', { detail: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  // Handle Save Transaction
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubMaterialId || newQty <= 0) {
      setSaveError(
        isAr 
          ? 'يرجى اختيار المادة وتحديد كمية أكبر من الصفر'
          : 'Please select a material and specify a quantity greater than zero'
      );
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const saved = await SiteOperationsService.saveMaterialTransaction({
        project_id: projectId,
        sub_material_id: newSubMaterialId,
        tx_date: newTxDate,
        tx_type: newTxType,
        qty: Number(newQty),
        zone: newZone.trim() || undefined,
        ref_wir_no: newRefWirNo.trim() || undefined,
        notes: newNotes.trim() || undefined,
      });

      if (!saved) {
        throw new Error(isAr ? 'فشل تسجيل حركة المخزن' : 'Failed to save material transaction');
      }

      setIsAddModalOpen(false);
      // Reset form
      setNewSubMaterialId('');
      setNewQty(0);
      setNewZone('');
      setNewRefWirNo('');
      setNewNotes('');
      loadData();
    } catch (err) {
      setSaveError((err as Error).message || (isAr ? 'حدث خطأ أثناء حفظ الحركة' : 'An error occurred while saving transaction'));
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const q = searchQuery.toLowerCase().trim();
      const subMat = subMaterials.find((s) => s.id === tx.sub_material_id);
      const materialName = isAr
        ? subMat?.material_name_ar
        : ((subMat as any)?.material_name_en || subMat?.material_name_ar);

      const matchSearch =
        !q ||
        (materialName && materialName.toLowerCase().includes(q)) ||
        (tx.zone && tx.zone.toLowerCase().includes(q)) ||
        (tx.ref_wir_no && tx.ref_wir_no.toLowerCase().includes(q)) ||
        tx.tx_date.includes(q);

      const matchType = typeFilter === 'all' || tx.tx_type === typeFilter;
      return matchSearch && matchType;
    });
  }, [transactions, searchQuery, typeFilter, subMaterials, isAr]);

  // High wastage count
  const highWastageItems = useMemo(() => {
    return (wastageReport?.items || []).filter((item) => item.is_loss && item.variance_pct > 0);
  }, [wastageReport]);

  // Helper for rendering MIR / Inspection badge and status
  const renderMirBadge = (tx: MaterialTransaction) => {
    const refNo = (tx as any).ref_mir_no || tx.ref_wir_no;
    const rawStatus = String((tx as any).mir_status || (tx as any).inspection_status || '').toLowerCase().trim();

    if (!refNo && !rawStatus) {
      return <span className="text-slate-400 dark:text-slate-600 font-mono text-xs">-</span>;
    }

    let statusElement = null;
    if (rawStatus) {
      let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      let statusText = rawStatus;

      if (rawStatus.includes('app') || rawStatus === 'a' || rawStatus === 'approved') {
        badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
        statusText = isAr ? 'معتمد' : 'Approved';
      } else if (rawStatus.includes('rej') || rawStatus === 'd' || rawStatus === 'rejected') {
        badgeColor = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
        statusText = isAr ? 'مرفوض' : 'Rejected';
      } else if (rawStatus.includes('pend') || rawStatus.includes('rev') || rawStatus === 'b' || rawStatus === 'c') {
        badgeColor = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
        statusText = isAr ? 'قيد المراجعة' : 'Under Review';
      }

      statusElement = (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeColor}`}>
          {statusText}
        </span>
      );
    }

    return (
      <div className="inline-flex flex-col items-center gap-1">
        {refNo && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg font-mono text-[11px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-xs">
            <CheckCircle2 className="w-3 h-3 text-sky-500 shrink-0" />
            <span>{refNo}</span>
          </span>
        )}
        {statusElement}
      </div>
    );
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Wastage KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Wastage Loss */}
        <div className="p-5 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-rose-600 text-white shadow-md shadow-rose-500/20">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-rose-800 dark:text-rose-300 font-medium">
              {isAr ? 'خسائر تجاوز نسبة الهالك القياسية' : 'Standard Wastage Excess Losses'}
            </div>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5">
              <PriceGate>
                {(wastageReport?.total_variance_egp || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {isAr ? 'ج.م' : 'EGP'}
              </PriceGate>
            </div>
          </div>
        </div>

        {/* High Wastage Materials Alert */}
        <div className="p-5 rounded-3xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-amber-800 dark:text-amber-300 font-medium">
              {isAr ? 'خامات متجاوزة نسبة الهالك القياسية' : 'Materials Exceeding Standard Wastage'}
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {highWastageItems.length} {isAr ? 'خامات حرجة' : 'Critical Items'}
            </div>
          </div>
        </div>

        {/* Total Material Transactions Count */}
        <div className="p-5 rounded-3xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-950/60 shadow-xs flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-500/20">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-emerald-900 dark:text-emerald-300 font-medium">
              {isAr ? 'إجمالي حركات الصرف والاسترجاع' : 'Total Issues & Returns'}
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">
              {transactions.length} {isAr ? 'حركة مسجلة' : 'Transactions Recorded'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Tab switchers */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('wastage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              activeTab === 'wastage'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            <span>{isAr ? 'تقرير مقارنة الهالك الفعلي بالمعياري' : 'Wastage Comparison (Actual vs Standard)'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 ${
              activeTab === 'transactions'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>{isAr ? `سجل حركات المخزن (${transactions.length})` : `Transactions Log (${transactions.length})`}</span>
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={() => {
            setSaveError(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'تسجيل حركة مخزن جديدة' : 'Record New Transaction'}</span>
        </button>
      </div>

      {/* Tab 1: Actual vs Standard Wastage Report */}
      {activeTab === 'wastage' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs bg-white dark:bg-slate-900">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'تحليل ومطابقة هالك الخامات الميداني' : 'Field Material Wastage Variance Analysis (BOM)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr
                  ? 'مقارنة الكميات المنصرفة من المخزن مع الكميات المركبة في اليوميات المحتسبة من قائمة المواد'
                  : 'Comparison of warehouse issues against installed quantities calculated from BOM'}
              </p>
            </div>
            <button
              type="button"
              onClick={loadData}
              title={isAr ? 'تحديث البيانات' : 'Refresh Data'}
              aria-label={isAr ? 'تحديث البيانات' : 'Refresh Data'}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50/90 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold text-xs select-none">
                <tr>
                  <th className="px-4 py-3.5 text-start">{isAr ? 'الخامة / مادة البند' : 'Material / Component'}</th>
                  <th className="px-3 py-3.5 text-center">{isAr ? 'الوحدة' : 'Unit'}</th>
                  <th className="px-4 py-3.5 text-center">{isAr ? 'المنصرف للموقع' : 'Issued to Site'}</th>
                  <th className="px-4 py-3.5 text-center">{isAr ? 'المركب فعلياً' : 'Installed Qty'}</th>
                  <th className="px-3 py-3.5 text-center">{isAr ? 'الهالك القياسي %' : 'Std Wastage %'}</th>
                  <th className="px-3 py-3.5 text-center">{isAr ? 'الهالك الفعلي %' : 'Actual Wastage %'}</th>
                  <th className="px-3 py-3.5 text-center">{isAr ? 'الانحراف %' : 'Variance %'}</th>
                  <th className="px-4 py-3.5 text-center">{isAr ? 'الخسارة المالية (ج.م)' : 'Financial Loss (EGP)'}</th>
                  <th className="px-3 py-3.5 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-slate-400 dark:text-slate-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-2" />
                      <span>{isAr ? 'جاري حساب نسب الهالك والخسائر...' : 'Calculating wastage ratios and losses...'}</span>
                    </td>
                  </tr>
                ) : (!wastageReport?.items || wastageReport.items.length === 0) ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center text-slate-400 dark:text-slate-500">
                      <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                      <div className="font-bold text-slate-700 dark:text-slate-300">
                        {isAr ? 'لا توجد بيانات خامات مرتبطة بقائمة المواد' : 'No materials linked to BOM'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        {isAr ? 'قم بإضافة خامات فرعية لبنود جدول الكميات لمتابعة الهالك' : 'Add sub-materials to BOQ items to track wastage'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  wastageReport.items.map((item) => (
                    <tr
                      key={item.sub_material_id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                        item.is_loss ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Material Name */}
                      <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                        {isAr ? item.material_name_ar : ((item as any).material_name_en || item.material_name_ar)}
                      </td>

                      {/* Unit */}
                      <td className="px-3 py-3.5 text-center font-mono text-slate-500 dark:text-slate-400">
                        {item.unit}
                      </td>

                      {/* Issued Qty */}
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {Number(item.issued_qty).toLocaleString()}
                      </td>

                      {/* Installed Qty */}
                      <td className="px-4 py-3.5 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {Number(item.installed_qty).toLocaleString()}
                      </td>

                      {/* Standard Wastage % */}
                      <td className="px-3 py-3.5 text-center font-mono text-slate-500 dark:text-slate-400">
                        {item.standard_wastage_pct}%
                      </td>

                      {/* Actual Wastage % */}
                      <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {item.actual_wastage_pct}%
                      </td>

                      {/* Variance % */}
                      <td className="px-3 py-3.5 text-center font-mono font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                            item.is_loss
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          }`}
                        >
                          {item.variance_pct > 0 ? `+${item.variance_pct}%` : `${item.variance_pct}%`}
                        </span>
                      </td>

                      {/* Variance Financial */}
                      <td className="px-4 py-3.5 text-center font-mono font-bold">
                        <PriceGate>
                          <span className={item.is_loss ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                            {Number(item.variance_egp).toLocaleString(undefined, { minimumFractionDigits: 2 })} {isAr ? 'ج.م' : 'EGP'}
                          </span>
                        </PriceGate>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        {item.is_loss ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{isAr ? 'تجاوز هالك' : 'Excess Wastage'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{isAr ? 'ضمن الحدود' : 'Within Limits'}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Material Transactions Log Table */}
      {activeTab === 'transactions' && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs bg-white dark:bg-slate-900 space-y-4">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={isAr ? 'البحث باسم المادة، المنطقة، أو إشعار الفحص...' : 'Search by material, zone, or inspection ref...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full ps-9 pe-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as MaterialTransactionType | 'all')}
              className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <option value="all">{isAr ? 'كافة أنواع الحركات' : 'All Transaction Types'}</option>
              <option value="issue_to_site">{isAr ? '📤 صرف للموقع' : '📤 Issue to Site'}</option>
              <option value="return_to_store">{isAr ? '📥 مرتجع للمخزن' : '📥 Return to Store'}</option>
              <option value="adjustment">{isAr ? '⚖️ تسوية جردية' : '⚖️ Inventory Adjustment'}</option>
              <option value="waste_writeoff">{isAr ? '🗑️ إهلاك وهالك معتمد' : '🗑️ Approved Wastage'}</option>
              <option value="received_on_site">{isAr ? '📦 استلام موقع' : '📦 Received on Site'}</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50/90 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 font-bold text-xs select-none">
                <tr>
                  <th className="px-4 py-3.5 text-start">{isAr ? 'تاريخ الحركة' : 'Date'}</th>
                  <th className="px-4 py-3.5 text-start">{isAr ? 'نوع الحركة' : 'Type'}</th>
                  <th className="px-4 py-3.5 text-start">{isAr ? 'الخامة / المادة' : 'Material'}</th>
                  <th className="px-4 py-3.5 text-center">{isAr ? 'الكمية' : 'Quantity'}</th>
                  <th className="px-3 py-3.5 text-center">{isAr ? 'المنطقة' : 'Zone'}</th>
                  <th className="px-3 py-3.5 text-center">{isAr ? 'إشعار فحص واستلام المواد' : 'Material Inspection (MIR)'}</th>
                  <th className="px-4 py-3.5 text-start">{isAr ? 'ملاحظات' : 'Notes'}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-slate-400 dark:text-slate-500">
                      {isAr ? 'لا توجد حركات مخزن مسجلة مطابقة لمعايير البحث' : 'No recorded transactions match search criteria'}
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const typeInfo = TX_TYPE_CONFIG[tx.tx_type] || TX_TYPE_CONFIG.issue_to_site;
                    const TypeIcon = typeInfo.icon;
                    const subMat = subMaterials.find((s) => s.id === tx.sub_material_id);
                    const materialName = isAr
                      ? (subMat?.material_name_ar || 'خامة')
                      : ((subMat as any)?.material_name_en || subMat?.material_name_ar || 'Material');

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        {/* Date */}
                        <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {tx.tx_date}
                        </td>

                        {/* Type */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-xs ${typeInfo.color}`}
                          >
                            <TypeIcon className="w-3 h-3 shrink-0" />
                            <span>{isAr ? typeInfo.labelAr : typeInfo.labelEn}</span>
                          </span>
                        </td>

                        {/* Material Name */}
                        <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                          {materialName}
                        </td>

                        {/* Qty */}
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                          {Number(tx.qty).toLocaleString()} {subMat?.unit || ''}
                        </td>

                        {/* Zone */}
                        <td className="px-3 py-3.5 text-center text-slate-600 dark:text-slate-400">
                          {tx.zone || '-'}
                        </td>

                        {/* MIR / Inspection Ref */}
                        <td className="px-3 py-3.5 text-center">
                          {renderMirBadge(tx)}
                        </td>

                        {/* Notes */}
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {tx.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Material Transaction Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>{isAr ? 'تسجيل حركة مواد ومخازن جديدة' : 'Record New Material Transaction'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                aria-label={isAr ? 'إغلاق' : 'Close'}
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveError && (
              <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'تاريخ الحركة *' : 'Transaction Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={newTxDate}
                    onChange={(e) => setNewTxDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'نوع الحركة *' : 'Transaction Type *'}
                  </label>
                  <select
                    value={newTxType}
                    onChange={(e) => setNewTxType(e.target.value as MaterialTransactionType)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <option value="issue_to_site">{isAr ? '📤 صرف للموقع' : '📤 Issue to Site'}</option>
                    <option value="return_to_store">{isAr ? '📥 مرتجع للمخزن' : '📥 Return to Store'}</option>
                    <option value="adjustment">{isAr ? '⚖️ تسوية جردية' : '⚖️ Inventory Adjustment'}</option>
                    <option value="waste_writeoff">{isAr ? '🗑️ إهلاك وهالك معتمد' : '🗑️ Approved Wastage'}</option>
                    <option value="received_on_site">{isAr ? '📦 استلام موقع' : '📦 Received on Site'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {isAr ? 'الخامة / مادة البند *' : 'Material / Component *'}
                </label>
                <select
                  required
                  value={newSubMaterialId}
                  onChange={(e) => setNewSubMaterialId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <option value="">{isAr ? '-- اختر الخامة --' : '-- Select Material --'}</option>
                  {subMaterials.map((sm) => (
                    <option key={sm.id} value={sm.id}>
                      {isAr ? sm.material_name_ar : ((sm as any).material_name_en || sm.material_name_ar)} ({sm.unit}) {sm.boq_item ? (isAr ? `[بند ${sm.boq_item.item_code}]` : `[Item ${sm.boq_item.item_code}]`) : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'الكمية *' : 'Quantity *'}
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={newQty || ''}
                    onChange={(e) => setNewQty(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'المنطقة / قطاع العمل' : 'Zone / Work Area'}
                  </label>
                  <input
                    type="text"
                    value={newZone}
                    onChange={(e) => setNewZone(e.target.value)}
                    placeholder={isAr ? 'المنطقة أ، الطابق الأول...' : 'Zone A, Floor 1...'}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'رقم إشعار فحص واستلام المواد' : 'Material Inspection Ref (MIR / WIR)'}
                  </label>
                  <input
                    type="text"
                    value={newRefWirNo}
                    onChange={(e) => setNewRefWirNo(e.target.value)}
                    placeholder="MIR-CV-01..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {isAr ? 'ملاحظات' : 'Notes'}
                  </label>
                  <input
                    type="text"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder={isAr ? 'سبب الحركة أو رقم إذن الصرف...' : 'Reason for transaction or voucher no...'}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md shadow-emerald-500/20 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900 active:scale-[0.98]"
                >
                  {isSaving ? (isAr ? 'جاري الحفظ...' : 'Saving...') : (isAr ? 'تسجيل الحركة' : 'Record Transaction')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
