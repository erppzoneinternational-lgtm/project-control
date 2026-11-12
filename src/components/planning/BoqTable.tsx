'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Boxes, 
  History, 
  Edit3, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Check, 
  X, 
  AlertCircle, 
  Layers, 
  FileSpreadsheet,
  Folder,
  FolderOpen,
  Calculator,
  ChevronsUpDown,
  Scale,
} from 'lucide-react';
import { BoqItem, BoqPricingStatus } from '@/types/boq';
import { PriceGate } from './PriceGate';
import { useUserRoles } from '@/lib/hooks/useUserRoles';
import { canEditPath } from '@/lib/rbac/access-control';
import { ResizableTable } from '@/components/ui/ResizableTable';
import { useModuleAccess } from '@/lib/hooks/useModuleAccess';
import { BoqService } from '@/lib/services/boq.service';
import { CostCodeService } from '@/lib/services/costCode.service';
import { CostCodeSelector } from './CostCodeSelector';
import { invalidateBoqItemCaches } from '@/lib/cache';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { 
  computeItemCostControlMetrics, 
  extractCostControlFromNotes, 
  packCostControlIntoNotes 
} from '@/lib/utils/boq-cost-control.utils';

export interface BoqTableProps {
  projectId: string;
  items: BoqItem[];
  loading?: boolean;
  canEdit?: boolean;
  isSiteEngineer?: boolean;
  onRefresh: () => void;
  onOpenBOM: (item: BoqItem) => void;
  onOpenHistory: (item: BoqItem) => void;
  onEditItem?: (item: BoqItem) => void;
  selectedDivision?: string;
  onSelectDivision?: (division: string) => void;
  onInspectRate?: (item: BoqItem) => void;
  /** Inline Add/Omit/Restore controls per row */
  renderInclusion?: (item: BoqItem) => React.ReactNode;
  /** Group label per item (e.g. imported sheet page name) */
  groupLabelOf?: (item: BoqItem) => string;
  /** Cost Control Engineer View toggle state */
  isCostControlView?: boolean;
  onToggleCostControlView?: () => void;
}

export const PRICING_STATUS_CONFIG: Record<
  BoqPricingStatus,
  { labelAr: string; color: string }
> = {
  contract_original: {
    labelAr: 'عقد أصلي',
    color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
  },
  vo_approved: {
    labelAr: 'أمر تغيير معتمد',
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
  },
  star_rate_provisional: {
    labelAr: 'سعر مؤقت (Star Rate)',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
  },
  disputed: {
    labelAr: 'بند متنازع عليه',
    color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-800 dark:text-rose-300',
  },
};

export interface BoqUnitDefinition {
  value: string;
  label: string;
  category: 'common' | 'group' | 'time' | 'en';
}

export const STANDARD_BOQ_UNITS: BoqUnitDefinition[] = [
  // الأكثر استخداماً في المقايسات الهندسية
  { value: 'LS', label: 'مقطوعية (LS / Lump Sum)', category: 'common' },
  { value: 'م3', label: 'متر مكعب (م3 / m³)', category: 'common' },
  { value: 'م2', label: 'متر مربع (م2 / m²)', category: 'common' },
  { value: 'م.ط', label: 'متر طولي (م.ط / lm)', category: 'common' },
  { value: 'عدد', label: 'عدد / بالقطعة (Nr / Each / Item)', category: 'common' },
  { value: 'طن', label: 'طن متري (Ton)', category: 'common' },
  { value: 'كجم', label: 'كيلوجرام (كجم / kg)', category: 'common' },
  // المجموعات والنقاط والتوريدات
  { value: 'طقم', label: 'طقم / مجموعة (Set)', category: 'group' },
  { value: 'نقطة', label: 'نقطة أعمال MEP (Point / Pt)', category: 'group' },
  { value: 'لوحة', label: 'لوحة تحكم / قواطع (Panel)', category: 'group' },
  { value: 'شحنة', label: 'شحنة / نقلة (Trip / Load)', category: 'group' },
  // الزمن والنسب
  { value: 'يوم', label: 'يوم عمل (Day)', category: 'time' },
  { value: 'شهر', label: 'شهر (Month)', category: 'time' },
  { value: 'ساعة', label: 'ساعة (Hour)', category: 'time' },
  { value: '%', label: 'نسبة مئوية (%)', category: 'time' },
  // English Standard Codes
  { value: 'm3', label: 'm³ (Cubic Meter)', category: 'en' },
  { value: 'm2', label: 'm² (Square Meter)', category: 'en' },
  { value: 'm', label: 'm (Linear Meter)', category: 'en' },
  { value: 'item', label: 'Item / Nr', category: 'en' },
  { value: 'ton', label: 'Metric Ton (Ton)', category: 'en' },
  { value: 'kg', label: 'kg (Kilogram)', category: 'en' },
  { value: 'set', label: 'Set', category: 'en' },
  { value: 'point', label: 'Point', category: 'en' },
];

export const KNOWN_BOQ_UNIT_VALUES = new Set(
  STANDARD_BOQ_UNITS.map((u) => u.value.toLowerCase())
);

/**
 * Calculates hierarchical nesting level (0 = root, 1 = sub, 2 = sub-sub, etc.)
 * based on dots or segments in the item_code.
 */
export function getItemHierarchyLevel(code: string): number {
  if (!code) return 0;
  const cleanCode = code.includes('-') && !code.startsWith('B-')
    ? code.substring(code.indexOf('-') + 1)
    : code;
  const dotCount = (cleanCode.match(/\./g) || []).length;
  if (dotCount === 0 && cleanCode.includes('-')) {
    const parts = cleanCode.split('-').filter(Boolean);
    if (parts.length > 1) return Math.min(parts.length - 1, 3);
  }
  return Math.min(Math.max(0, dotCount), 4);
}

/**
 * Formats a currency amount with thousands separators and 2 decimal places.
 */
export function formatCurrencyEgp(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return '—';
  return Number(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats a quantity value with clean decimal representation (up to 3 decimals).
 */
export function formatQuantityValue(qty: number | null | undefined): string {
  if (qty === null || qty === undefined || isNaN(Number(qty))) return '—';
  return Number(qty).toLocaleString('en-US', {
    maximumFractionDigits: 3,
  });
}

/** building_tag is attached to BOQ rows at runtime but absent from BoqItem. */
type BuildingTagged = { building_tag?: string | null };

type SortField = 'item_code' | 'description_ar' | 'unit' | 'contract_qty' | 'shop_drawing_qty' | 'rate_egp' | 'amount_egp' | 'revision';

export const BoqTable: React.FC<BoqTableProps> = ({
  projectId,
  items,
  loading = false,
  canEdit: propCanEdit,
  isSiteEngineer: propIsSiteEngineer,
  onRefresh,
  onOpenBOM,
  onOpenHistory,
  onEditItem,
  selectedDivision,
  onSelectDivision,
  onInspectRate,
  renderInclusion,
  groupLabelOf,
  isCostControlView: propIsCostControlView,
  onToggleCostControlView,
}) => {
  const [internalCostControlView, setInternalCostControlView] = useState(false);
  const isCostControl = propIsCostControlView !== undefined ? propIsCostControlView : internalCostControlView;
  const toggleCostControl = onToggleCostControlView || (() => setInternalCostControlView((v) => !v));
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BoqPricingStatus | 'all'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [disciplineFilter, setDisciplineFilter] = useState<string>('all');
  const [costDivisionFilter, setCostDivisionFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('item_code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // View mode: 'grouped' by section/building or 'flat'
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Quick Inline Edit Modal state
  const [editingItem, setEditingItem] = useState<BoqItem | null>(null);
  const [editForm, setEditForm] = useState<Partial<BoqItem>>({});
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // RBAC: check if user can edit BOQ + check if site_engineer (hide quantities)
  const { roles, isAdmin, user } = useUserRoles();
  const { data: dbAccessRules } = useModuleAccess();
  const isSiteEngineer = propIsSiteEngineer !== undefined
    ? propIsSiteEngineer
    : (!isAdmin && roles.some((r) => r.includes('site')));
  const isPlanningOnly = !isAdmin && roles.includes('planning_engineer') && !roles.some((r) => ['admin', 'commercial_manager', 'estimator', 'project_manager', 'cost_control'].includes(r));
  const hideQuantities = isSiteEngineer || isPlanningOnly;
  const canEdit = propCanEdit !== undefined
    ? propCanEdit
    : (!hideQuantities && canEditPath('/boq', roles, isAdmin, dbAccessRules));

  // Sorting Handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Available groups (buildings) & disciplines derived from imported cost_code tags
  const { groups, disciplines } = useMemo(() => {
    const gSet = new Set<string>();
    const dSet = new Set<string>();
    items.forEach((it: BoqItem & BuildingTagged) => {
      const raw = (it.building_tag || '').trim();
      if (!raw) return;
      const parts = raw.split('/').map((x: string) => x.trim()).filter(Boolean);
      if (parts.length >= 2) {
        dSet.add(parts[0]);
        gSet.add(parts[1]);
      } else if (parts.length === 1) {
        gSet.add(parts[0]);
      }
    });
    return { groups: [...gSet].sort(), disciplines: [...dSet].sort() };
  }, [items]);

  // Filtered & Sorted Items
  const processedItems = useMemo(() => {
    let result = [...items];

    // 0. Group (building) & discipline filters
    const rawOf = (it: BoqItem & BuildingTagged) => (it.building_tag || '').trim();
    if (groupFilter !== 'all') {
      result = result.filter((it) => {
        const parts = rawOf(it).split('/').map((x: string) => x.trim());
        return parts.includes(groupFilter);
      });
    }
    if (disciplineFilter !== 'all') {
      result = result.filter((it) => {
        const parts = rawOf(it).split('/').map((x: string) => x.trim());
        return parts[0] === disciplineFilter;
      });
    }

    // 1. Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((item) => {
        return (
          item.item_code.toLowerCase().includes(q) ||
          item.description_ar.toLowerCase().includes(q) ||
          (item.description_en && item.description_en.toLowerCase().includes(q)) ||
          (item.cost_code?.code && item.cost_code.code.toLowerCase().includes(q)) ||
          (item.cost_code?.name_ar && item.cost_code.name_ar.toLowerCase().includes(q))
        );
      });
    }

    // 2. Status Filter
    if (statusFilter !== 'all') {
      result = result.filter((item) => item.pricing_status === statusFilter);
    }

    // 2.1 Cost Code Division Filter (M, E, L, R, A, S, OTHER, UNASSIGNED)
    const effectiveDivision = selectedDivision !== undefined && selectedDivision !== 'all'
      ? selectedDivision
      : costDivisionFilter;

    if (effectiveDivision !== 'all') {
      result = result.filter((item) => {
        const p = item.cost_code?.prefix?.toUpperCase() || item.cost_code?.code?.[0]?.toUpperCase();
        const cat = item.cost_code?.category;
        if (effectiveDivision === 'UNASSIGNED') {
          return !item.cost_code;
        }
        if (effectiveDivision === 'OTHER') {
          return item.cost_code && !['M', 'E', 'L', 'R', 'A', 'S'].includes(p || '');
        }
        return p === effectiveDivision || cat === effectiveDivision;
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      let valA: string | number | null | undefined = a[sortField];
      let valB: string | number | null | undefined = b[sortField];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(String(valB), 'ar');
        return sortDirection === 'asc' ? cmp : -cmp;
      }

      return sortDirection === 'asc' ? (valA > (valB as number) ? 1 : -1) : (valA < (valB as number) ? 1 : -1);
    });

    return result;
  }, [items, searchQuery, statusFilter, groupFilter, disciplineFilter, costDivisionFilter, selectedDivision, sortField, sortDirection]);

  // Distinct section keys across processed items
  const allSectionKeys = useMemo(() => {
    const set = new Set<string>();
    processedItems.forEach((it: BoqItem & BuildingTagged) => {
      const k = (groupLabelOf?.(it) || it.building_tag || '').trim() || 'بنود المقايسة الرئيسية (General BOQ)';
      set.add(k);
    });
    return Array.from(set);
  }, [processedItems]);

  // Section toggle handlers
  const toggleSection = (secKey: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(secKey)) {
        next.delete(secKey);
      } else {
        next.add(secKey);
      }
      return next;
    });
  };

  const expandAllSections = () => {
    setCollapsedSections(new Set());
  };

  const collapseAllSections = () => {
    setCollapsedSections(new Set(allSectionKeys));
  };

  // Pagination
  const totalPages = Math.ceil(processedItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    if (pageSize >= 9999) return processedItems;
    const start = (page - 1) * pageSize;
    return processedItems.slice(start, start + pageSize);
  }, [processedItems, page, pageSize]);

  // Group paginated items into section buckets
  const groupedSections = useMemo(() => {
    const map = new Map<string, { 
      key: string; 
      items: BoqItem[]; 
      subtotalAmount: number; 
      totalQty: number;
      subtotalOriginalAmount: number;
      subtotalVoAmount: number;
      subtotalRevisedAmount: number;
    }>();

    paginatedItems.forEach((item: BoqItem & BuildingTagged) => {
      const secKey = (groupLabelOf?.(item) || item.building_tag || '').trim() || 'بنود المقايسة الرئيسية (General BOQ)';
      if (!map.has(secKey)) {
        map.set(secKey, {
          key: secKey,
          items: [],
          subtotalAmount: 0,
          totalQty: 0,
          subtotalOriginalAmount: 0,
          subtotalVoAmount: 0,
          subtotalRevisedAmount: 0,
        });
      }
      const group = map.get(secKey)!;
      group.items.push(item);
      const cc = computeItemCostControlMetrics(item);
      group.subtotalAmount += Number(item.amount_egp) || 0;
      group.totalQty += Number(item.contract_qty) || 0;
      group.subtotalOriginalAmount += cc.original_amount;
      group.subtotalVoAmount += cc.vo_amount;
      group.subtotalRevisedAmount += cc.revised_amount;
    });

    return Array.from(map.values());
  }, [paginatedItems, groupLabelOf]);

  // Aggregate Totals
  const totalContractSum = useMemo(() => {
    return items.reduce((sum, item) => sum + (Number(item.amount_egp) || 0), 0);
  }, [items]);

  const filteredContractSum = useMemo(() => {
    return processedItems.reduce((sum, item) => sum + (Number(item.amount_egp) || 0), 0);
  }, [processedItems]);

  const pageContractSum = useMemo(() => {
    return paginatedItems.reduce((sum, item) => sum + (Number(item.amount_egp) || 0), 0);
  }, [paginatedItems]);

  const pageContractQtySum = useMemo(() => {
    return paginatedItems.reduce((sum, item) => sum + (Number(item.contract_qty) || 0), 0);
  }, [paginatedItems]);

  const pageShopDrawingQtySum = useMemo(() => {
    return paginatedItems.reduce((sum, item) => sum + (Number(item.shop_drawing_qty) || 0), 0);
  }, [paginatedItems]);

  // Cost control page sums
  const pageCostControlSums = useMemo(() => {
    let originalAmount = 0;
    let originalQty = 0;
    let voQty = 0;
    let voAmount = 0;
    let revisedAmount = 0;
    let revisedQty = 0;

    paginatedItems.forEach((it) => {
      const cc = computeItemCostControlMetrics(it);
      originalAmount += cc.original_amount;
      originalQty += cc.original_qty;
      voQty += cc.vo_qty;
      voAmount += cc.vo_amount;
      revisedAmount += cc.revised_amount;
      revisedQty += cc.revised_qty;
    });

    return {
      originalAmount,
      originalQty,
      voQty,
      voAmount,
      revisedAmount,
      revisedQty,
    };
  }, [paginatedItems]);

  // Delete Handler
  const handleDelete = async (item: BoqItem) => {
    if (!confirm(`هل أنت متأكد من حذف البند ${item.item_code} من جدول الكميات؟`)) return;
    try {
      const ok = await BoqService.deleteBoqItem(item.id, projectId);
      if (ok) {
        toast.success(`تم حذف البند ${item.item_code} بنجاح`);
        onRefresh();
      } else {
        toast.error('تعذر حذف البند. قد يكون البند مرتبطاً بسجلات تقدم يومي أو أنشطة تخطيط.');
      }
    } catch (err) {
      logger.error('Delete error', { detail: err });
      toast.error('حدث خطأ أثناء محاولة حذف البند');
    }
  };

  // Start Edit
  const handleStartEdit = (item: BoqItem) => {
    if (!canEdit || isSiteEngineer) {
      toast.error('غير مصرح لمهندس الموقع بتعديل بنود المقايسة');
      return;
    }
    if (onEditItem) {
      onEditItem(item);
    } else {
      setEditingItem(item);
      const parsedNotes = extractCostControlFromNotes(item.notes);
      setEditForm({
        ...item,
        vo_ref: item.vo_ref || '',
        vo_qty: item.vo_qty !== undefined ? item.vo_qty : (parsedNotes.vo_qty ?? 0),
        revised_rate_egp: item.revised_rate_egp !== undefined ? item.revised_rate_egp : (parsedNotes.revised_rate ?? item.rate_egp ?? 0),
      });
      setIsCustomUnit(false);
      setChangeReason('');
      setSaveError(null);
    }
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const parsedNotes = extractCostControlFromNotes(editingItem.notes);
      const hasCostControlChanges = 
        (editForm.vo_qty !== undefined && Number(editForm.vo_qty) !== 0) ||
        (editForm.revised_rate_egp !== undefined && Number(editForm.revised_rate_egp) !== Number(editForm.rate_egp));

      const packedNotes = hasCostControlChanges
        ? packCostControlIntoNotes(editForm.notes ?? editingItem.notes, {
            vo_qty: editForm.vo_qty !== undefined ? Number(editForm.vo_qty) : null,
            revised_rate: editForm.revised_rate_egp !== undefined ? Number(editForm.revised_rate_egp) : null,
            user_note: parsedNotes.user_note ?? editForm.notes ?? editingItem.notes ?? null,
          })
        : (editForm.notes ?? editingItem.notes ?? null);

      const updated = await BoqService.saveBoqItem(
        {
          ...editingItem,
          ...editForm,
          notes: packedNotes,
          vo_ref: editForm.vo_ref || null,
          project_id: projectId,
        },
        user?.id || user?.email || 'Current User',
        changeReason || 'تعديل بيانات البند عبر جدول الكميات والتحكم بالتكاليف'
      );

      if (!updated) {
        setSaveError('فشل حفظ تعديل البند');
        return;
      }

      setEditingItem(null);
      invalidateBoqItemCaches(projectId, updated.id);
      onRefresh();
    } catch (err: unknown) {
      const errInfo = err as { message?: string; code?: string; details?: string } | null | undefined;
      setSaveError(errInfo?.message || 'خطأ في حفظ البند');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
    );
  };

  // Render a single line-item row with hierarchy depth styling
  const renderItemRow = (item: BoqItem) => {
    const statusInfo = PRICING_STATUS_CONFIG[item.pricing_status] || PRICING_STATUS_CONFIG.contract_original;
    const depth = getItemHierarchyLevel(item.item_code);
    const isRoot = depth === 0;
    const isOmitted = item.inclusion_status === 'omitted';
    const isPending = item.inclusion_status === 'optional_pending';
    const cc = computeItemCostControlMetrics(item);

    return (
      <tr
        key={item.id}
        className={`transition group border-b border-slate-100 dark:border-slate-800/80 ${isOmitted ? 'opacity-50 line-through decoration-rose-400/60 ' : ''}${isPending ? 'bg-amber-50/40 dark:bg-amber-950/10 ' : ''}${
          isRoot
            ? 'bg-slate-50/40 dark:bg-slate-800/20 hover:bg-slate-100/60 dark:hover:bg-slate-800/50'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        {/* Item Code with Hierarchy Indentation */}
        <td
          className="py-3 pe-3 text-start whitespace-nowrap min-w-[130px]"
          style={{ paddingInlineStart: `${16 + depth * 18}px` }}
        >
          <div className="flex items-center gap-1.5">
            {depth > 0 && (
              <span
                className="text-slate-300 dark:text-slate-600 font-mono text-xs select-none inline-block shrink-0"
                aria-hidden="true"
              >
                └─
              </span>
            )}
            {depth > 0 && (
              <span
                className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 shrink-0 select-none"
                title={`المستوى الهرمي ${depth}`}
              >
                L{depth}
              </span>
            )}
            <span
              className={`font-mono ${
                isRoot
                  ? 'font-bold text-emerald-800 dark:text-emerald-400 text-xs'
                  : 'font-medium text-emerald-700 dark:text-emerald-400'
              }`}
            >
              {item.item_code}
            </span>
          </div>
        </td>

        {/* Cost Code */}
        <td className="px-3 py-3 whitespace-nowrap min-w-[110px]">
          {canEdit && !isSiteEngineer ? (
            <CostCodeSelector
              compact
              value={item.cost_code_id}
              selectedCode={item.cost_code}
              onChange={async (newCode) => {
                try {
                  const ok = await CostCodeService.assignCostCodeToBoqItem(
                    item.id,
                    newCode?.id || null,
                    projectId
                  );
                  if (ok) {
                    toast.success(
                      newCode
                        ? `تم ربط كود التكلفة ${newCode.code} بالبند ${item.item_code}`
                        : `تم فك ارتباط كود التكلفة من البند ${item.item_code}`
                    );
                    onRefresh();
                  } else {
                    toast.error('فشل ربط كود التكلفة');
                  }
                } catch (err) {
                  toast.error('خطأ أثناء تعيين كود التكلفة');
                }
              }}
            />
          ) : item.cost_code?.code ? (
            <span
              className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              title={item.cost_code.name_ar}
            >
              {item.cost_code.code}
            </span>
          ) : (
            <span className="text-slate-300 dark:text-slate-700 text-[11px]">-</span>
          )}
        </td>

        {/* Description Bilingual */}
        <td className="px-4 py-3 min-w-[260px] max-w-md">
          <div
            className={`line-clamp-2 ${
              isRoot
                ? 'font-semibold text-slate-900 dark:text-white'
                : 'font-normal text-slate-800 dark:text-slate-200'
            }`}
            style={{ paddingInlineStart: depth > 0 ? `${depth * 6}px` : undefined }}
          >
            {item.description_ar}
          </div>
          {item.description_en && (
            <div
              className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5"
              style={{ paddingInlineStart: depth > 0 ? `${depth * 6}px` : undefined }}
            >
              {item.description_en}
            </div>
          )}
        </td>

        {/* Unit */}
        <td className="px-3 py-3 text-center font-mono text-slate-600 dark:text-slate-400 min-w-[70px]">
          <span className="px-2 py-0.5 rounded bg-slate-100/80 dark:bg-slate-800/80 text-[11px]">
            {item.unit || '—'}
          </span>
        </td>

        {isCostControl ? (
          <>
            {/* Original Contract QTY */}
            <td className="px-3 py-3 text-end font-mono min-w-[105px]">
              {hideQuantities ? (
                <span className="text-slate-400 font-mono">***</span>
              ) : (
                <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                  <span dir="ltr" className="tabular-nums font-bold text-slate-800 dark:text-slate-200">
                    {formatQuantityValue(cc.original_qty)}
                  </span>
                  <span className="text-[10px] text-slate-400 ms-1 select-none font-sans">
                    {item.unit}
                  </span>
                </PriceGate>
              )}
            </td>

            {/* Original Rate */}
            <td className="px-3 py-3 text-end font-mono whitespace-nowrap min-w-[100px]">
              <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                <span dir="ltr" className="tabular-nums text-slate-700 dark:text-slate-300">
                  {formatCurrencyEgp(cc.original_rate)}
                </span>
                <span className="text-[10px] text-slate-400 ms-1 select-none font-sans">ج.م</span>
              </PriceGate>
            </td>

            {/* Original Amount */}
            <td className="px-3 py-3 text-end font-mono font-medium text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30 whitespace-nowrap min-w-[115px]">
              <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                <span dir="ltr" className="tabular-nums">
                  {formatCurrencyEgp(cc.original_amount)}
                </span>
                <span className="text-[10px] text-slate-400 ms-1 select-none font-sans">ج.م</span>
              </PriceGate>
            </td>

            {/* VO Ref */}
            <td className="px-2 py-3 text-center whitespace-nowrap min-w-[90px]">
              {cc.vo_ref ? (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  {cc.vo_ref}
                </span>
              ) : (
                <span className="text-slate-300 dark:text-slate-700 text-xs">—</span>
              )}
            </td>

            {/* +/- VO QTY */}
            <td className="px-3 py-3 text-end font-mono whitespace-nowrap min-w-[105px]">
              {hideQuantities ? (
                <span className="text-slate-400 font-mono">***</span>
              ) : (
                <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                  {cc.vo_qty === 0 ? (
                    <span className="text-slate-400">—</span>
                  ) : (
                    <span
                      dir="ltr"
                      className={`tabular-nums font-bold ${
                        cc.vo_qty > 0
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {cc.vo_qty > 0 ? `+${formatQuantityValue(cc.vo_qty)}` : formatQuantityValue(cc.vo_qty)}
                    </span>
                  )}
                </PriceGate>
              )}
            </td>

            {/* +/- VO Financial Amount */}
            <td className="px-3 py-3 text-end font-mono whitespace-nowrap min-w-[115px] bg-purple-50/20 dark:bg-purple-950/10">
              <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                {cc.vo_amount === 0 ? (
                  <span className="text-slate-400">—</span>
                ) : (
                  <span
                    dir="ltr"
                    className={`tabular-nums font-bold ${
                      cc.vo_amount > 0
                        ? 'text-purple-700 dark:text-purple-300'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {cc.vo_amount > 0 ? `+${formatCurrencyEgp(cc.vo_amount)}` : formatCurrencyEgp(cc.vo_amount)}
                  </span>
                )}
                {cc.vo_amount !== 0 && (
                  <span className="text-[10px] text-purple-600/70 dark:text-purple-400/70 ms-1 select-none font-sans">ج.م</span>
                )}
              </PriceGate>
            </td>

            {/* Revised QTY */}
            <td className="px-3 py-3 text-end font-mono min-w-[110px] bg-emerald-50/15 dark:bg-emerald-950/10">
              {hideQuantities ? (
                <span className="text-slate-400 font-mono">***</span>
              ) : (
                <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                  <span dir="ltr" className="tabular-nums font-bold text-slate-900 dark:text-white">
                    {formatQuantityValue(cc.revised_qty)}
                  </span>
                  <span className="text-[10px] text-slate-400 ms-1 select-none font-sans">
                    {item.unit}
                  </span>
                </PriceGate>
              )}
            </td>

            {/* Revised Rate */}
            <td className="px-3 py-3 text-end font-mono whitespace-nowrap min-w-[105px] bg-emerald-50/15 dark:bg-emerald-950/10">
              <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                <span dir="ltr" className="tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrencyEgp(cc.revised_rate)}
                </span>
                <span className="text-[10px] text-slate-400 ms-1 select-none font-sans">ج.م</span>
              </PriceGate>
            </td>

            {/* Revised Amount */}
            <td className="px-3 py-3 text-end font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/25 whitespace-nowrap min-w-[130px]">
              <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                <span dir="ltr" className="tabular-nums">
                  {formatCurrencyEgp(cc.revised_amount)}
                </span>
                <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 ms-1 select-none font-sans">
                  ج.م
                </span>
              </PriceGate>
            </td>

            {/* Variance % */}
            <td className="px-2 py-3 text-center font-mono whitespace-nowrap min-w-[85px]">
              {cc.variance_pct === 0 ? (
                <span className="text-slate-400 text-[11px]">0%</span>
              ) : (
                <span
                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    cc.variance_pct > 0
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  {cc.variance_pct > 0 ? `+${cc.variance_pct}%` : `${cc.variance_pct}%`}
                </span>
              )}
            </td>
          </>
        ) : (
          <>
            {/* Contract Qty (RTL numeric alignment) */}
            <td className="px-3 py-3 text-end font-mono min-w-[120px]">
              {hideQuantities || item.contract_qty === null || item.contract_qty === undefined ? (
                <span className="text-slate-400 font-mono">***</span>
              ) : (
                <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                  <span dir="ltr" className="tabular-nums font-bold text-slate-900 dark:text-white">
                    {formatQuantityValue(item.contract_qty)}
                  </span>
                  <span className="text-[10px] text-slate-400 ms-1 select-none font-sans">
                    {item.unit}
                  </span>
                </PriceGate>
              )}
            </td>

            {/* Shop Drawing Qty (RTL numeric alignment) */}
            <td className="px-3 py-3 text-end font-mono min-w-[120px]">
              {hideQuantities || item.shop_drawing_qty === null || item.shop_drawing_qty === undefined ? (
                <span className="text-slate-400 font-mono">***</span>
              ) : (
                <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                  <span dir="ltr" className="tabular-nums text-slate-600 dark:text-slate-400">
                    {formatQuantityValue(item.shop_drawing_qty)}
                  </span>
                  <span className="text-[10px] text-slate-400 ms-1 select-none font-sans">
                    {item.unit}
                  </span>
                </PriceGate>
              )}
            </td>

            {/* Pricing Status */}
            <td className="px-3 py-3 text-center whitespace-nowrap min-w-[125px]">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusInfo.color}`}
              >
                {statusInfo.labelAr}
              </span>
            </td>

            {/* Rate EGP (RTL numeric alignment) */}
            <td className="px-3 py-3 text-end font-mono whitespace-nowrap min-w-[120px]">
              <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                <span dir="ltr" className="tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                  {formatCurrencyEgp(item.rate_egp)}
                </span>
                <span className="text-[10px] text-slate-400 ms-1 select-none font-sans">
                  ج.م
                </span>
              </PriceGate>
            </td>

            {/* Amount EGP (RTL numeric alignment) */}
            <td className="px-4 py-3 text-end font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/25 dark:bg-emerald-950/15 whitespace-nowrap min-w-[140px]">
              <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                <span dir="ltr" className="tabular-nums">
                  {formatCurrencyEgp(item.amount_egp)}
                </span>
                <span className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 ms-1 select-none font-sans">
                  ج.م
                </span>
              </PriceGate>
            </td>
          </>
        )}

        {/* Status in Cost Control view */}
        {isCostControl && (
          <td className="px-3 py-3 text-center whitespace-nowrap min-w-[110px]">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${statusInfo.color}`}
            >
              {statusInfo.labelAr}
            </span>
          </td>
        )}

        {/* Revision */}
        <td className="px-3 py-3 text-center font-mono text-xs text-slate-500 dark:text-slate-400 min-w-[70px]">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px]">
            v{item.revision}
          </span>
        </td>

        {/* BOM Button */}
        <td className="px-3 py-3 text-center min-w-[90px]">
          <button
            type="button"
            onClick={() => onOpenBOM(item)}
            className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
            title="عرض وإدارة المواد المندرجة تحت هذا البند"
          >
            <Boxes className="w-3 h-3 text-emerald-500" />
            <span>المواد</span>
          </button>
        </td>

        {/* Actions */}
        <td className="px-4 py-3 text-center whitespace-nowrap min-w-[110px] no-underline" style={{ textDecoration: 'none' }}>
          <div className="flex items-center justify-center gap-1">
            {renderInclusion && renderInclusion(item)}
            {onInspectRate && (
              <button
                type="button"
                onClick={() => onInspectRate(item)}
                className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-cyan-700 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 transition cursor-pointer"
                title="تحليل فئة البند والأسعار"
              >
                <Scale className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onOpenHistory(item)}
              className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition cursor-pointer"
              title="سجل التعديل والتاريخ"
            >
              <History className="w-3.5 h-3.5" />
            </button>
            {canEdit && !isSiteEngineer && (
              <>
                <button
                  type="button"
                  onClick={() => handleStartEdit(item)}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer"
                  title="تعديل البند"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition cursor-pointer"
                  title="حذف البند"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const isAllCollapsed = allSectionKeys.length > 0 && allSectionKeys.every((k) => collapsedSections.has(k));

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search & Status Filter */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2.5">
            <div className="relative flex-1 min-w-[260px] max-w-md">
              <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="البحث بكود البند، كود التكلفة، أو الوصف بالعربية والإنجليزية..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full ps-9 pe-4 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 hidden sm:inline" />
              {disciplines.length > 0 && (
                <select
                  value={disciplineFilter}
                  onChange={(e) => {
                    setDisciplineFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  title="التخصص (مدني / ميكانيكا / كهرباء)"
                >
                  <option value="all">كل التخصصات</option>
                  {disciplines.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
              {groups.length > 0 && (
                <select
                  value={groupFilter}
                  onChange={(e) => {
                    setGroupFilter(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  title="المبنى / المنطقة"
                >
                  <option value="all">كل المباني والمناطق</option>
                  {groups.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              )}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as BoqPricingStatus | 'all');
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
              >
                <option value="all">كافة حالات التسعير</option>
                <option value="contract_original">عقد أصلي</option>
                <option value="vo_approved">أمر تغيير معتمد</option>
                <option value="star_rate_provisional">سعر مؤقت (Star Rate)</option>
                <option value="disputed">متنازع عليه</option>
              </select>

              <select
                value={costDivisionFilter}
                onChange={(e) => {
                  setCostDivisionFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                title="قسم كود التكلفة (Materials, Equipment, Labour...)"
              >
                <option value="all">كل أقسام التكلفة</option>
                <option value="M">المواد والتوريدات (M)</option>
                <option value="E">المعدات ومصاريف الموقع (E)</option>
                <option value="L">العمالة المباشرة (L)</option>
                <option value="R">الإيرادات والمستخلصات (R)</option>
                <option value="A">المخصصات والتسويات (A)</option>
                <option value="S">مقاولو الباطن (S)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end lg:self-center">
            {/* View Mode Toggle: Grouped Sections vs Flat Table */}
            <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'grouped'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="عرض البنود مجمعة حسب الأقسام والمباني"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>أقسام</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('flat')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'flat'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="عرض جدول متصل بجميع البنود"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>جدول متصل</span>
              </button>
            </div>

            {/* Expand / Collapse All Sections button when in grouped view */}
            {viewMode === 'grouped' && allSectionKeys.length > 0 && (
              <button
                type="button"
                onClick={isAllCollapsed ? expandAllSections : collapseAllSections}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
                title={isAllCollapsed ? 'توسيع كل الأقسام' : 'طي كل الأقسام'}
              >
                {isAllCollapsed ? (
                  <>
                    <FolderOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>توسيع الكل</span>
                  </>
                ) : (
                  <>
                    <Folder className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <span>طي الكل</span>
                  </>
                )}
              </button>
            )}

            {/* Page Size */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>عرض:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={9999}>الكل</option>
              </select>
              <span>من {processedItems.length}</span>
            </div>

            {/* Cost Control Toggle Button */}
            <button
              type="button"
              onClick={toggleCostControl}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                isCostControl
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title={isCostControl ? 'إلغاء وضع تحكم التكاليف' : 'عرض أعمدة تحكم التكاليف (Cost Control)'}
            >
              <Scale className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>{isCostControl ? 'أعمدة التكاليف (مفعلة)' : 'أعمدة التكاليف'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Data Table Container with Sticky Header & Responsive Scrolling */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-slate-900">
        <div className="relative max-h-[calc(100vh-280px)] min-h-[420px] overflow-y-auto overflow-x-auto">
          <ResizableTable tableId="boq_table">
            <table className="w-full text-xs text-start border-separate border-spacing-0">
              {/* Sticky Table Header */}
              <thead className="sticky top-0 z-20 shadow-sm border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200">
                <tr>
                  <th
                    onClick={() => handleSort('item_code')}
                    className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-4 py-3 text-start font-bold cursor-pointer group hover:text-emerald-700 dark:hover:text-emerald-400 transition min-w-[130px]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>كود البند</span>
                      {renderSortIcon('item_code')}
                    </div>
                  </th>
                  <th className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-3 py-3 text-start font-bold min-w-[110px]">
                    كود التكلفة
                  </th>
                  <th
                    onClick={() => handleSort('description_ar')}
                    className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-4 py-3 text-start font-bold cursor-pointer group hover:text-emerald-700 dark:hover:text-emerald-400 transition min-w-[260px] max-w-md"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>الوصف والمواصفات</span>
                      {renderSortIcon('description_ar')}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('unit')}
                    className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-3 py-3 text-center font-bold cursor-pointer group hover:text-emerald-700 dark:hover:text-emerald-400 transition min-w-[70px]"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>الوحدة</span>
                      {renderSortIcon('unit')}
                    </div>
                  </th>
                  {isCostControl ? (
                    <>
                      {/* Original Contract Group */}
                      <th className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-3 py-3 text-end font-bold min-w-[105px]">
                        الكمية الأصلية
                      </th>
                      <th className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-3 py-3 text-end font-bold min-w-[100px]">
                        الفئة الأصلية
                      </th>
                      <th className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-3 py-3 text-end font-bold min-w-[115px]">
                        القيمة الأصلية
                      </th>

                      {/* Variation Order (+/- VOs) Group */}
                      <th className="sticky top-0 z-20 bg-purple-50/90 dark:bg-purple-950/40 backdrop-blur-sm border-b border-purple-200 dark:border-purple-800 px-2 py-3 text-center font-bold text-purple-900 dark:text-purple-300 min-w-[90px]">
                        مرجع VO
                      </th>
                      <th className="sticky top-0 z-20 bg-purple-50/90 dark:bg-purple-950/40 backdrop-blur-sm border-b border-purple-200 dark:border-purple-800 px-3 py-3 text-end font-bold text-purple-900 dark:text-purple-300 min-w-[105px]">
                        +/- كمية VO
                      </th>
                      <th className="sticky top-0 z-20 bg-purple-50/90 dark:bg-purple-950/40 backdrop-blur-sm border-b border-purple-200 dark:border-purple-800 px-3 py-3 text-end font-bold text-purple-900 dark:text-purple-300 min-w-[115px]">
                        أثر VO المالي
                      </th>

                      {/* Revised Contract Group */}
                      <th className="sticky top-0 z-20 bg-emerald-50/90 dark:bg-emerald-950/40 backdrop-blur-sm border-b border-emerald-200 dark:border-emerald-800 px-3 py-3 text-end font-bold text-emerald-900 dark:text-emerald-300 min-w-[110px]">
                        الكمية المعدلة
                      </th>
                      <th className="sticky top-0 z-20 bg-emerald-50/90 dark:bg-emerald-950/40 backdrop-blur-sm border-b border-emerald-200 dark:border-emerald-800 px-3 py-3 text-end font-bold text-emerald-900 dark:text-emerald-300 min-w-[105px]">
                        الفئة المعدلة
                      </th>
                      <th className="sticky top-0 z-20 bg-emerald-100/90 dark:bg-emerald-900/50 backdrop-blur-sm border-b border-emerald-300 dark:border-emerald-700 px-4 py-3 text-end font-bold text-emerald-950 dark:text-emerald-200 min-w-[130px]">
                        القيمة المعدلة EGP
                      </th>
                      <th className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-2 py-3 text-center font-bold min-w-[85px]">
                        انحراف %
                      </th>
                      <th className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-3 py-3 text-center font-bold min-w-[110px]">
                        الحالة
                      </th>
                    </>
                  ) : (
                    <>
                      <th
                        onClick={() => !hideQuantities && handleSort('contract_qty')}
                        className={`sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-3 py-3 text-end font-bold transition min-w-[120px] ${
                          hideQuantities ? 'cursor-not-allowed opacity-60' : 'cursor-pointer group hover:text-emerald-700 dark:hover:text-emerald-400'
                        }`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {hideQuantities ? (
                            <span>الكمية (محجوبة)</span>
                          ) : (
                            <PriceGate fallback={<span>الكمية (محجوبة)</span>}>
                              <span>الكمية التعاقدية</span>
                            </PriceGate>
                          )}
                          {!hideQuantities && renderSortIcon('contract_qty')}
                        </div>
                      </th>
                      <th
                        onClick={() => !hideQuantities && handleSort('shop_drawing_qty')}
                        className={`sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-3 py-3 text-end font-bold transition min-w-[120px] ${
                          hideQuantities ? 'cursor-not-allowed opacity-60' : 'cursor-pointer group hover:text-emerald-700 dark:hover:text-emerald-400'
                        }`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          {hideQuantities ? (
                            <span>شوب دروينج (محجوبة)</span>
                          ) : (
                            <PriceGate fallback={<span>شوب دروينج (محجوبة)</span>}>
                              <span>شوب دروينج</span>
                            </PriceGate>
                          )}
                          {!hideQuantities && renderSortIcon('shop_drawing_qty')}
                        </div>
                      </th>
                      <th className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-3 py-3 text-center font-bold min-w-[125px]">
                        الحالة
                      </th>
                      <th
                        onClick={() => handleSort('rate_egp')}
                        className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-3 py-3 text-end font-bold cursor-pointer group hover:text-emerald-700 dark:hover:text-emerald-400 transition min-w-[120px]"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>الفئة EGP</span>
                          {renderSortIcon('rate_egp')}
                        </div>
                      </th>
                      <th
                        onClick={() => handleSort('amount_egp')}
                        className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-4 py-3 text-end font-bold cursor-pointer group hover:text-emerald-700 dark:hover:text-emerald-400 transition min-w-[140px]"
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>الإجمالي EGP</span>
                          {renderSortIcon('amount_egp')}
                        </div>
                      </th>
                    </>
                  )}
                  <th
                    onClick={() => handleSort('revision')}
                    className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-3 py-3 text-center font-bold cursor-pointer group hover:text-emerald-700 dark:hover:text-emerald-400 transition min-w-[70px]"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>الإصدار</span>
                      {renderSortIcon('revision')}
                    </div>
                  </th>
                  <th className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-3 py-3 text-center font-bold min-w-[90px]">
                    المواد (BOM)
                  </th>
                  <th className="sticky top-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-4 py-3 text-center font-bold min-w-[110px]">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                    <tr key={`table-skel-${idx}`} className="animate-pulse border-b border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="px-3 py-3"><div className="h-4 w-14 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="px-4 py-3">
                        <div className="h-3.5 w-48 bg-slate-200 dark:bg-slate-800 rounded mb-1" />
                        <div className="h-2.5 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
                      </td>
                      <td className="px-3 py-3 text-center"><div className="h-4 w-8 mx-auto bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="px-3 py-3 text-end"><div className="h-4 w-16 ms-auto bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="px-3 py-3 text-end"><div className="h-4 w-16 ms-auto bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="px-3 py-3 text-center"><div className="h-4 w-16 mx-auto bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                      <td className="px-3 py-3 text-end"><div className="h-4 w-16 ms-auto bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="px-4 py-3 text-end"><div className="h-4 w-20 ms-auto bg-emerald-100 dark:bg-emerald-950/40 rounded" /></td>
                      <td className="px-3 py-3 text-center"><div className="h-4 w-8 mx-auto bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="px-3 py-3 text-center"><div className="h-6 w-14 mx-auto bg-slate-200 dark:bg-slate-800 rounded" /></td>
                      <td className="px-4 py-3 text-center"><div className="h-6 w-16 mx-auto bg-slate-200 dark:bg-slate-800 rounded" /></td>
                    </tr>
                  ))
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={isCostControl ? 18 : 12} className="px-4 py-16 text-center text-slate-400 dark:text-slate-500">
                      <div className="space-y-2">
                        <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700" />
                        <div className="font-semibold text-slate-700 dark:text-slate-300">
                          لا توجد بنود في جدول الكميات مطابقة لمعايير البحث
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          يمكنك استيراد ملف Excel أو إضافة بنود يدوياً
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : viewMode === 'grouped' ? (
                  /* Grouped Sections Mode with Collapsible Toggles */
                  groupedSections.map((sec) => {
                    const isCollapsed = collapsedSections.has(sec.key);
                    return (
                      <React.Fragment key={sec.key}>
                        {/* Section Header Row */}
                        <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-y border-slate-200 dark:border-slate-700/80 sticky top-[41px] z-10 font-sans">
                          <td colSpan={isCostControl ? 18 : 12} className="px-4 py-2.5">
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => toggleSection(sec.key)}
                                aria-expanded={!isCollapsed}
                                aria-controls={`boq-sec-${sec.key}`}
                                className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-100 hover:text-emerald-700 dark:hover:text-emerald-400 transition cursor-pointer"
                              >
                                <span className="p-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300">
                                  {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </span>
                                <Folder className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs">{sec.key}</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200/70 dark:bg-slate-700/70 text-slate-600 dark:text-slate-300 font-mono">
                                  {sec.items.length} بند
                                </span>
                              </button>

                              <div className="flex items-center gap-4 text-xs font-mono">
{isCostControl ? (
                                  <div className="flex items-center gap-3 text-xs font-mono">
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-400 text-[10px] font-sans">الأصلي:</span>
                                      <PriceGate fallback={<span className="text-slate-400">***</span>}>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">
                                          {formatCurrencyEgp(sec.subtotalOriginalAmount)}
                                        </span>
                                      </PriceGate>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-purple-600 dark:text-purple-400 text-[10px] font-sans">+/- VO:</span>
                                      <PriceGate fallback={<span className="text-slate-400">***</span>}>
                                        <span className={`font-bold ${sec.subtotalVoAmount >= 0 ? 'text-purple-700 dark:text-purple-300' : 'text-rose-600 dark:text-rose-400'}`}>
                                          {sec.subtotalVoAmount > 0 ? '+' : ''}{formatCurrencyEgp(sec.subtotalVoAmount)}
                                        </span>
                                      </PriceGate>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-sans">المعدل:</span>
                                      <PriceGate fallback={<span className="text-slate-400">***</span>}>
                                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                          {formatCurrencyEgp(sec.subtotalRevisedAmount)} ج.م
                                        </span>
                                      </PriceGate>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-slate-400 text-[11px] font-sans">إجمالي القسم:</span>
                                    <PriceGate fallback={<span className="text-slate-400">***</span>}>
                                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                        {formatCurrencyEgp(sec.subtotalAmount)}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-sans ms-1">ج.م</span>
                                    </PriceGate>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* Section Items (if expanded) */}
                        {!isCollapsed && sec.items.map(renderItemRow)}
                      </React.Fragment>
                    );
                  })
                ) : (
                  /* Flat View Mode */
                  paginatedItems.map(renderItemRow)
                )}
              </tbody>

              {/* Sticky Column-Aligned Totals Row (tfoot) */}
              <tfoot className="sticky bottom-0 z-20 bg-slate-100/95 dark:bg-slate-800/95 backdrop-blur-sm border-t-2 border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-800 dark:text-slate-200">
                {isCostControl ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-start">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">إجمالي الصفحة (تكاليف):</span>
                        <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 font-mono">({paginatedItems.length} بند)</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-slate-400 font-mono">-</td>
                    {/* Original QTY sum */}
                    <td className="px-3 py-3 text-end font-mono tabular-nums">
                      <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                        <span dir="ltr">{formatQuantityValue(pageCostControlSums.originalQty)}</span>
                      </PriceGate>
                    </td>
                    <td className="px-3 py-3 text-center text-slate-400 font-mono">-</td>
                    {/* Original Amount sum */}
                    <td className="px-3 py-3 text-end font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                      <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                        <span dir="ltr">{formatCurrencyEgp(pageCostControlSums.originalAmount)}</span>
                      </PriceGate>
                    </td>
                    {/* VO Ref */}
                    <td className="px-2 py-3 text-center text-slate-400 font-mono">-</td>
                    {/* VO QTY sum */}
                    <td className="px-3 py-3 text-end font-mono tabular-nums">
                      <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                        <span dir="ltr" className={pageCostControlSums.voQty >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'}>
                          {pageCostControlSums.voQty > 0 ? `+${formatQuantityValue(pageCostControlSums.voQty)}` : formatQuantityValue(pageCostControlSums.voQty)}
                        </span>
                      </PriceGate>
                    </td>
                    {/* VO Amount sum */}
                    <td className="px-3 py-3 text-end font-mono tabular-nums font-bold bg-purple-50/30 dark:bg-purple-950/20">
                      <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                        <span dir="ltr" className={pageCostControlSums.voAmount >= 0 ? 'text-purple-700 dark:text-purple-300' : 'text-rose-600 dark:text-rose-400'}>
                          {pageCostControlSums.voAmount > 0 ? `+${formatCurrencyEgp(pageCostControlSums.voAmount)}` : formatCurrencyEgp(pageCostControlSums.voAmount)}
                        </span>
                      </PriceGate>
                    </td>
                    {/* Revised QTY sum */}
                    <td className="px-3 py-3 text-end font-mono tabular-nums">
                      <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                        <span dir="ltr">{formatQuantityValue(pageCostControlSums.revisedQty)}</span>
                      </PriceGate>
                    </td>
                    <td className="px-3 py-3 text-center text-slate-400 font-mono">-</td>
                    {/* Revised Amount sum */}
                    <td className="px-4 py-3 text-end font-mono tabular-nums font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-950/50">
                      <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                        <span dir="ltr">{formatCurrencyEgp(pageCostControlSums.revisedAmount)}</span>
                        <span className="text-[10px] font-normal ms-1 text-slate-400 font-sans">ج.م</span>
                      </PriceGate>
                    </td>
                    {/* Variance % */}
                    <td className="px-2 py-3 text-center text-slate-400 font-mono">-</td>
                    {/* Status, Revision, BOM, Actions: 4 columns */}
                    <td colSpan={4} className="px-3 py-3"></td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-start">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">إجمالي الصفحة:</span>
                        <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400 font-mono">({paginatedItems.length} بند معروض)</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center text-slate-400 font-mono">-</td>
                    <td className="px-3 py-3 text-end font-mono tabular-nums">
                      {hideQuantities ? (
                        <span className="text-slate-400 font-mono">***</span>
                      ) : (
                        <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                          <span dir="ltr">{formatQuantityValue(pageContractQtySum)}</span>
                        </PriceGate>
                      )}
                    </td>
                    <td className="px-3 py-3 text-end font-mono tabular-nums text-slate-500 dark:text-slate-400">
                      {hideQuantities ? (
                        <span className="text-slate-400 font-mono">***</span>
                      ) : (
                        <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                          <span dir="ltr">{pageShopDrawingQtySum > 0 ? formatQuantityValue(pageShopDrawingQtySum) : '—'}</span>
                        </PriceGate>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center text-slate-400">-</td>
                    <td className="px-3 py-3 text-end font-mono tabular-nums text-slate-400">-</td>
                    <td className="px-4 py-3 text-end font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/40">
                      <PriceGate fallback={<span className="text-slate-400 font-mono">***</span>}>
                        <span dir="ltr">{formatCurrencyEgp(pageContractSum)}</span>
                        <span className="text-[10px] font-normal ms-1 text-slate-400 font-sans">ج.م</span>
                      </PriceGate>
                    </td>
                    <td colSpan={3} className="px-3 py-3"></td>
                  </tr>
                )}
              </tfoot>
            </table>
          </ResizableTable>
        </div>

        {/* Sticky Totals Footer Bar & Pagination */}
        <div className="sticky bottom-0 z-30 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)] flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3.5 text-xs">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div>
              <span className="text-slate-400 dark:text-slate-400">إجمالي البنود: </span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {items.length} بند
              </span>
            </div>
            {processedItems.length !== items.length && (
              <div>
                <span className="text-slate-400 dark:text-slate-400">البنود المفلترة: </span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {processedItems.length} بند
                </span>
              </div>
            )}
            <div>
              <span className="text-slate-400 dark:text-slate-400">إجمالي قيمة الفلترة: </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                <PriceGate>
                  {formatCurrencyEgp(filteredContractSum)} ج.م
                </PriceGate>
              </span>
            </div>
            {filteredContractSum !== totalContractSum && (
              <div className="hidden lg:block text-slate-400 dark:text-slate-400">
                <span>(إجمالي المقايسة: </span>
                <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                  <PriceGate>
                    {formatCurrencyEgp(totalContractSum)} ج.م
                  </PriceGate>
                </span>
                <span>)</span>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {pageSize < 9999 && (
            <div className="flex items-center gap-2">
              <span className="text-slate-400 dark:text-slate-400">
                صفحة {page} من {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="الصفحة السابقة"
                  aria-label="الصفحة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  title="الصفحة التالية"
                  aria-label="الصفحة التالية"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Accessible Quick Edit Modal */}
      {editingItem && canEdit && !isSiteEngineer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit_item_dialog_title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <h3 id="edit_item_dialog_title" className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>تعديل البند {editingItem.item_code} (الإصدار الحالي: v{editingItem.revision})</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                title="إغلاق النافذة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {saveError && (
              <div
                role="alert"
                className="p-3 m-4 mb-0 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit_item_code" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    كود البند *
                  </label>
                  <input
                    id="edit_item_code"
                    type="text"
                    required
                    aria-required="true"
                    value={editForm.item_code || ''}
                    onChange={(e) => setEditForm({ ...editForm, item_code: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="edit_unit" className="block font-bold text-slate-700 dark:text-slate-300">
                      الوحدة *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCustomUnit(!isCustomUnit)}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                    >
                      {isCustomUnit ? 'اختيار من القائمة' : 'كتابة وحدة أخرى'}
                    </button>
                  </div>

                  {isCustomUnit ? (
                    <input
                      id="edit_unit"
                      type="text"
                      required
                      aria-required="true"
                      placeholder="اكتب الوحدة يدوياً..."
                      value={editForm.unit || ''}
                      onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-500 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      autoFocus
                    />
                  ) : (
                    <select
                      id="edit_unit"
                      required
                      aria-required="true"
                      value={editForm.unit || 'LS'}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setIsCustomUnit(true);
                        } else {
                          setEditForm({ ...editForm, unit: e.target.value });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      {/* If the current item's unit is not in standard list, show it on top as current registered unit */}
                      {editForm.unit && !KNOWN_BOQ_UNIT_VALUES.has(editForm.unit.toLowerCase()) && (
                        <option value={editForm.unit}>
                          {editForm.unit} (الوحدة الحالية المسجلة)
                        </option>
                      )}

                      <optgroup label="الوحدات الأكثر استخداماً (Common)">
                        {STANDARD_BOQ_UNITS.filter((u) => u.category === 'common').map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="مجموعات وتوريدات وشبكات">
                        {STANDARD_BOQ_UNITS.filter((u) => u.category === 'group').map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="الوحدات الزمنية والنسب">
                        {STANDARD_BOQ_UNITS.filter((u) => u.category === 'time').map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </optgroup>

                      <optgroup label="English Engineering Codes">
                        {STANDARD_BOQ_UNITS.filter((u) => u.category === 'en').map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </optgroup>

                      <option value="__custom__">✏️ وحدة أخرى (إدخال يدوي)...</option>
                    </select>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="edit_description_ar" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  الوصف بالعربية *
                </label>
                <textarea
                  id="edit_description_ar"
                  rows={2}
                  required
                  aria-required="true"
                  value={editForm.description_ar || ''}
                  onChange={(e) => setEditForm({ ...editForm, description_ar: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  كود التكلفة المعتمد (Master Cost Code)
                </label>
                <CostCodeSelector
                  value={editForm.cost_code_id}
                  selectedCode={editForm.cost_code}
                  onChange={(selected) => {
                    setEditForm({
                      ...editForm,
                      cost_code_id: selected?.id || null,
                      cost_code: selected || undefined,
                    });
                  }}
                />
              </div>

              {!isSiteEngineer && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Accessible Numeric Input: Contract Quantity */}
                    <div>
                      <label htmlFor="edit_contract_qty" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        الكمية التعاقدية *
                      </label>
                      <div className="relative">
                        <input
                          id="edit_contract_qty"
                          type="number"
                          step="0.001"
                          min="0"
                          inputMode="decimal"
                          required
                          aria-required="true"
                          aria-label="الكمية التعاقدية"
                          value={editForm.contract_qty ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, contract_qty: parseFloat(e.target.value) || 0 })}
                          className="w-full ps-3 pe-12 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono pointer-events-none select-none">
                          {editForm.unit || 'وحدة'}
                        </span>
                      </div>
                    </div>

                    {/* Accessible Numeric Input: Unit Rate in EGP */}
                    <div>
                      <label htmlFor="edit_rate_egp" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        الفئة بالجنيه (EGP) *
                      </label>
                      <div className="relative">
                        <input
                          id="edit_rate_egp"
                          type="number"
                          step="0.01"
                          min="0"
                          inputMode="decimal"
                          required
                          aria-required="true"
                          aria-label="الفئة بالجنيه المصري"
                          value={editForm.rate_egp ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, rate_egp: parseFloat(e.target.value) || 0 })}
                          className="w-full ps-3 pe-12 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                        />
                        <span className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono pointer-events-none select-none">
                          ج.م
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Accessible Live Calculation Preview */}
                  <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
                      <Calculator className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="font-semibold">إجمالي القيمة التعاقدية الأصلية:</span>
                    </div>
                    <div className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-xs">
                      {formatCurrencyEgp((Number(editForm.contract_qty) || 0) * (Number(editForm.rate_egp) || 0))} ج.م
                    </div>
                  </div>

                  {/* Cost Control & Variation Order Breakdown */}
                  <div className="p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/80 dark:border-purple-800/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-purple-900 dark:text-purple-300 font-bold text-xs">
                        <Scale className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>أوامر التغيير والتحكم بالتكاليف (VO & Cost Control)</span>
                      </div>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                        تعديل الكمية / الفئة الختامية
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {/* VO Ref */}
                      <div>
                        <label htmlFor="edit_vo_ref" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          مرجع أمر التغيير
                        </label>
                        <input
                          id="edit_vo_ref"
                          type="text"
                          placeholder="مثال: VO-01"
                          value={editForm.vo_ref || ''}
                          onChange={(e) => setEditForm({ ...editForm, vo_ref: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono"
                        />
                      </div>

                      {/* VO Quantity (+/-) */}
                      <div>
                        <label htmlFor="edit_vo_qty" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          +/- كمية أمر التغيير
                        </label>
                        <input
                          id="edit_vo_qty"
                          type="number"
                          step="0.001"
                          placeholder="+/- 0.00"
                          value={editForm.vo_qty ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, vo_qty: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono text-end"
                        />
                      </div>

                      {/* Revised Rate EGP */}
                      <div>
                        <label htmlFor="edit_revised_rate" className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          فئة العقد المعدلة (EGP)
                        </label>
                        <input
                          id="edit_revised_rate"
                          type="number"
                          step="0.01"
                          placeholder={String(editForm.rate_egp || 0)}
                          value={editForm.revised_rate_egp ?? ''}
                          onChange={(e) => setEditForm({ ...editForm, revised_rate_egp: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-mono text-end"
                        />
                      </div>
                    </div>

                    {/* Revised Net Impact Calculation */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-200/60 dark:border-purple-800/40 text-[11px] font-mono">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                        <span>أثر أمر التغيير:</span>
                        <span className={`font-bold ${(Number(editForm.vo_qty) || 0) >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {formatCurrencyEgp((Number(editForm.vo_qty) || 0) * (Number(editForm.revised_rate_egp) || Number(editForm.rate_egp) || 0))} ج.م
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-bold text-emerald-700 dark:text-emerald-400">
                        <span>إجمالي العقد المعدل:</span>
                        <span>
                          {formatCurrencyEgp(((Number(editForm.contract_qty) || 0) + (Number(editForm.vo_qty) || 0)) * (Number(editForm.revised_rate_egp) || Number(editForm.rate_egp) || 0))} ج.م
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="edit_pricing_status" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  حالة التسعير
                </label>
                <select
                  id="edit_pricing_status"
                  value={editForm.pricing_status || 'contract_original'}
                  onChange={(e) => setEditForm({ ...editForm, pricing_status: e.target.value as BoqPricingStatus })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="contract_original">عقد أصلي</option>
                  <option value="vo_approved">أمر تغيير معتمد</option>
                  <option value="star_rate_provisional">سعر مؤقت (Star Rate)</option>
                  <option value="disputed">متنازع عليه</option>
                </select>
              </div>

              <div>
                <label htmlFor="edit_change_reason" className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  سبب التعديل (سيتم تسجيله في سجل المراجعة v{editingItem.revision + 1})
                </label>
                <input
                  id="edit_change_reason"
                  type="text"
                  placeholder="مثال: تعديل هندسي بناءً على مراجعة الاستشاري"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? <Layers className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>حفظ وزيادة الإصدار إلى v{editingItem.revision + 1}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
